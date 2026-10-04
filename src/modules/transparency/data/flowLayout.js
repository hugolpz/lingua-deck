// Pure layout for the funds flow chart (Sponsors → Grants → Projects → Freelancers).
// No Vue, no DOM, no mutation of its input: easy to test and to reuse.

export const LAYOUT = {
  width: 1540,
  marginLeft: 224,
  marginRight: 224,
  marginTop: 73,
  marginBottom: 42,
  nodeW: 25,
  nodeGap: 11,
  slotH: 77, // vertical room per active quarter in "date" mode
  minSlots: 6,
  maxBar: 252, // height of the biggest node
  minNode: 8,
  minLink: 3,
}

export const COLUMNS = [
  { key: 'sponsor', label: 'Sponsors', at: 0 },
  { key: 'grant', label: 'Grants', at: 0.28 },
  { key: 'project', label: 'Projects', at: 0.56 },
  { key: 'freelancer', label: 'Freelancers', at: 0.82 },
]

export const NO_SPONSOR = 'none'
const FALLBACK_COLOR = '#999'
const FALLBACK_DATE = '2020-01'

/* ───────────────────────────── Graph ───────────────────────────── */

/**
 * Raw data → nodes and links. Freelancers are ONE node per person, shared by all their projects.
 * `euro` is the node's own total (grant amount, project budget, payouts…).
 */
export function buildGraph({ sponsors, grants, projects }, colorOf) {
  const nodes = new Map()
  const links = []

  const node = (id, col, label, date, color) => {
    if (!nodes.has(id)) nodes.set(id, { id, col, label, date, color, euro: 0, chains: new Set() })
    return nodes.get(id)
  }
  const link = (from, to, value, color, chain) => {
    if (value > 0) links.push({ from: from.id, to: to.id, value, color, chain })
  }

  for (const s of sponsors) node(`sponsor:${s.id}`, 'sponsor', s.name, null, colorOf(s.id))

  const grantOfProject = new Map()
  for (const g of grants) {
    const color = colorOf(g.sponsorId) ?? FALLBACK_COLOR
    const amount = g.amountEUR || 0
    const gn = node(`grant:${g.id}`, 'grant', g.description || g.id, g.starts, color)
    gn.euro += amount
    gn.chains.add(g.sponsorId)
    for (const pid of g.projectIds ?? []) grantOfProject.set(pid, g)

    const sn = nodes.get(`sponsor:${g.sponsorId}`)
    if (sn) {
      sn.euro += amount
      sn.chains.add(g.sponsorId)
      link(sn, gn, amount, color, g.sponsorId)
    }
  }

  for (const p of projects) {
    const g = grantOfProject.get(p.id)
    const sponsorId = g?.sponsorId
    const chain = sponsorId ?? NO_SPONSOR
    const color = (g && colorOf(sponsorId)) || FALLBACK_COLOR
    const budget = p.budgetEUR || 0

    const pn = node(`project:${p.id}`, 'project', p.name || p.id, p.starts, color)
    pn.euro += budget
    pn.chains.add(chain)
    const gn = g && nodes.get(`grant:${g.id}`)
    if (gn) link(gn, pn, budget, color, chain)

    for (const person of p.freelancers || p.freelances || []) {
      const payout = person.payoutEUR || 0
      const fn = node(`freelancer:${person.beneficiary}`, 'freelancer', person.beneficiary, p.starts, color)
      fn.euro += payout
      fn.chains.add(chain)
      link(pn, fn, payout, color, chain)
    }
  }

  return { nodes: [...nodes.values()], links }
}

/* ───────────────────────────── Dates ───────────────────────────── */

const quarterIndex = (date) => {
  const [y, m = '01'] = (date || FALLBACK_DATE).split('-')
  return parseInt(y, 10) * 4 + Math.floor((parseInt(m, 10) - 1) / 3)
}

/** Sorted distinct quarters (as numeric index) holding at least one project: empty quarters are collapsed. */
const activeQuarters = (projects) =>
  [...new Set(projects.filter((p) => p.date).map((p) => quarterIndex(p.date)))].sort((a, b) => a - b)

/** Slot (0..N-1) of a date among the active quarters; falls back to the closest quarter. */
function slotOf(date, quarters) {
  const q = quarterIndex(date)
  let best = 0
  quarters.forEach((candidate, i) => {
    if (Math.abs(candidate - q) < Math.abs(quarters[best] - q)) best = i
  })
  return best
}

/* ───────────────────────────── Placement ───────────────────────────── */

/**
 * Stack boxes top→bottom in the given order, keeping `gap` between them and every box
 * as close as possible to its desired top (least squares, via pool-adjacent-violators).
 * Unlike a one-way "push down" pass, displacement is shared both ways, so one crowded
 * spot doesn't drag every later box down.
 * @param {{desired:number, h:number}[]} items
 * @returns {number[]} top of each item
 */
export function placeColumn(items, top, gap) {
  const offsets = []
  let offset = 0
  for (const it of items) {
    offsets.push(offset)
    offset += it.h + gap
  }

  const blocks = [] // { sum, count } over z_i = desired_i - offset_i, which must end up non-decreasing
  items.forEach((it, i) => {
    blocks.push({ sum: it.desired - offsets[i], count: 1 })
    while (blocks.length > 1) {
      const b = blocks[blocks.length - 1]
      const a = blocks[blocks.length - 2]
      if (a.sum / a.count <= b.sum / b.count) break
      blocks.splice(-2, 2, { sum: a.sum + b.sum, count: a.count + b.count })
    }
  })

  const tops = []
  for (const b of blocks) {
    const z = Math.max(top, b.sum / b.count)
    for (let k = 0; k < b.count; k++) tops.push(z + offsets[tops.length])
  }
  return tops
}

/* ───────────────────────────── Layout ───────────────────────────── */

/**
 * @param {{nodes, links}} graph from buildGraph
 * @param {'date'|'sponsor'|'freelancer'} sortMode ordering of the Projects column
 * @returns {{ nodes, links, height, years }} positioned, display-ready (new objects)
 */
export function layoutFlow(graph, sortMode = 'date') {
  const L = LAYOUT
  const inner = L.width - L.marginLeft - L.marginRight
  const colX = Object.fromEntries(COLUMNS.map((c) => [c.key, L.marginLeft + inner * c.at]))

  // Drawn nodes: sponsors, plus anything with money or a link (buildGraph only emits value > 0 links).
  const linked = new Set(graph.links.flatMap((l) => [l.from, l.to]))
  const kept = graph.nodes.filter((n) => n.euro > 0 || n.col === 'sponsor' || linked.has(n.id))
  const byId = new Map(kept.map((n) => [n.id, { ...n }]))
  const links = graph.links.filter((l) => byId.has(l.from) && byId.has(l.to))

  // Sizes: scale euros to pixels, then size each node to hold all its links.
  const maxEuro = Math.max(1000, ...kept.map((n) => n.euro))
  const thickOf = (value) => Math.max(L.minLink, (value * L.maxBar) / maxEuro)
  const sums = new Map(kept.map((n) => [n.id, { in: 0, out: 0 }]))
  for (const l of links) {
    l.thick = thickOf(l.value)
    sums.get(l.from).out += l.thick
    sums.get(l.to).in += l.thick
  }
  for (const n of byId.values()) {
    const s = sums.get(n.id)
    n.h = Math.max(L.minNode, (n.euro * L.maxBar) / maxEuro, s.in, s.out)
    n.x = colX[n.col]
  }

  const column = (key) => [...byId.values()].filter((n) => n.col === key)
  const center = (n) => n.y + n.h / 2
  const neighbours = (n, otherCol) =>
    links
      .filter((l) => l.from === n.id || l.to === n.id)
      .map((l) => ({ node: byId.get(l.from === n.id ? l.to : l.from), value: l.value }))
      .filter((e) => e.node.col === otherCol && e.node.y !== undefined)

  // Place a column: order by `desired`, then stack with minimal displacement.
  const placeBy = (nodes, desiredOf) => {
    const items = nodes
      .map((n) => ({ n, desired: desiredOf(n) }))
      .sort((a, b) => a.desired - b.desired || a.n.id.localeCompare(b.n.id))
    const tops = placeColumn(
      items.map((i) => ({ desired: i.desired, h: i.n.h })),
      L.marginTop,
      L.nodeGap,
    )
    items.forEach((it, i) => (it.n.y = tops[i]))
  }
  // Desired top = value-weighted centre of the nodes it connects to.
  const barycentre = (otherCol, fallback) => (n) => {
    const ns = neighbours(n, otherCol)
    if (!ns.length) return fallback
    const total = ns.reduce((s, e) => s + e.value, 0)
    return ns.reduce((s, e) => s + center(e.node) * e.value, 0) / total - n.h / 2
  }

  // 1. Projects, by sort mode
  const projects = column('project')
  const quarters = activeQuarters(projects)
  const plotH = Math.max(quarters.length, L.minSlots) * L.slotH
  const total = (id, dir) => sums.get(id)[dir]
  const sponsorOf = (p) => [...p.chains][0] ?? NO_SPONSOR
  const sponsorTotal = new Map()
  for (const g of graph.nodes.filter((n) => n.col === 'sponsor')) {
    sponsorTotal.set(g.id.replace('sponsor:', ''), g.euro)
  }
  const byDate = (a, b) => (a.date || FALLBACK_DATE).localeCompare(b.date || FALLBACK_DATE)

  let ordered
  if (sortMode === 'sponsor') {
    ordered = [...projects].sort(
      (a, b) =>
        (sponsorTotal.get(sponsorOf(b)) || 0) - (sponsorTotal.get(sponsorOf(a)) || 0) ||
        sponsorOf(a).localeCompare(sponsorOf(b)) ||
        byDate(a, b),
    )
  } else if (sortMode === 'freelancer') {
    ordered = [...projects].sort((a, b) => total(b.id, 'out') - total(a.id, 'out') || byDate(a, b))
  } else {
    ordered = [...projects].sort(byDate)
  }
  const rank = new Map(ordered.map((p, i) => [p.id, i]))
  const desiredProject = (p) =>
    sortMode === 'date'
      ? L.marginTop + (slotOf(p.date, quarters) / Math.max(1, quarters.length - 1)) * plotH
      : L.marginTop + (rank.get(p.id) / Math.max(1, projects.length - 1)) * plotH
  // Order is imposed by sort mode (not by desired y), so place in that order directly.
  const projTops = placeColumn(
    ordered.map((p) => ({ desired: desiredProject(p), h: p.h })),
    L.marginTop,
    L.nodeGap,
  )
  ordered.forEach((p, i) => (p.y = projTops[i]))

  // 2. Freelancers and grants follow their projects; 3. sponsors follow their grants.
  placeBy(column('freelancer'), barycentre('project', L.marginTop))
  placeBy(column('grant'), barycentre('project', L.marginTop))
  placeBy(column('sponsor'), barycentre('grant', L.marginTop))

  // Links: each node stacks its links top→bottom by the other end's height (fewer crossings).
  const used = new Map([...byId.keys()].map((id) => [id, { in: 0, out: 0 }]))
  const slot = (id, dir, thick) => {
    const u = used.get(id)
    const at = u[dir]
    u[dir] += thick
    return byId.get(id).y + at + thick / 2
  }
  const sorted = [...links].sort(
    (a, b) => center(byId.get(a.from)) - center(byId.get(b.from)) || center(byId.get(a.to)) - center(byId.get(b.to)),
  )
  const outY = new Map()
  for (const l of sorted) outY.set(l, slot(l.from, 'out', l.thick))
  const inOrder = [...links].sort(
    (a, b) => center(byId.get(a.to)) - center(byId.get(b.to)) || center(byId.get(a.from)) - center(byId.get(b.from)),
  )
  const inY = new Map()
  for (const l of inOrder) inY.set(l, slot(l.to, 'in', l.thick))

  const eur = (v) => `€${(v || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}`
  const outLinks = links.map((l) => {
    const src = byId.get(l.from)
    const tgt = byId.get(l.to)
    const sx = src.x + L.nodeW
    const sy = outY.get(l)
    const ty = inY.get(l)
    const mid = (sx + tgt.x) / 2
    return {
      key: `${l.from}>${l.to}`,
      d: `M ${sx} ${sy} C ${mid} ${sy}, ${mid} ${ty}, ${tgt.x} ${ty}`,
      thick: l.thick,
      color: l.color,
      chain: l.chain,
      tip: `${src.label} → ${tgt.label}: ${eur(l.value)}`,
    }
  })

  const outNodes = [...byId.values()].map((n) => ({
    ...n,
    tip: `${n.label}\n${eur(n.euro)}`,
    labelShort: truncate(n.label, n.col === 'project' ? 30 : 22),
  }))

  // Year axis (date mode): each year sits at its first project, wherever it was placed.
  const years = []
  if (sortMode === 'date') {
    const firstOfYear = new Map()
    for (const p of ordered) {
      if (!p.date) continue
      const year = parseInt(p.date, 10)
      if (!firstOfYear.has(year)) firstOfYear.set(year, p.y)
    }
    for (const [year, y] of [...firstOfYear].sort((a, b) => a[0] - b[0])) years.push({ year, y })
  }

  const bottom = Math.max(...outNodes.map((n) => n.y + n.h), 0)
  const height = Math.max(L.marginTop + L.minSlots * L.slotH + L.marginBottom, bottom + L.marginBottom + 20)

  return {
    nodes: outNodes,
    links: outLinks,
    height,
    years,
    columns: COLUMNS.map((c) => ({ ...c, x: colX[c.key] })),
    axisX: (colX.grant + colX.project) / 2 + L.nodeW * 1.5,
  }
}

function truncate(str, len) {
  if (!str) return ''
  return str.length > len ? `${str.slice(0, len - 1)}…` : str
}
