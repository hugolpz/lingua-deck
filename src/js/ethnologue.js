// Ethnologue (EGIDS) language status helpers, shared by the map legend and the incubators module.

/** Wikidata P3823 (language status) values: qid -> Ethnologue (EGIDS) label. */
export const ETHNOLOGUE_STATUS_LABELS = {
  Q29051543: '0 International',
  Q29051546: '1 National',
  Q29051547: '2 Provincial',
  Q29051549: '3 Wider Communication',
  Q29051550: '4 Educational',
  Q29051551: '5 Developing',
  Q29051552: '6a Vigorous',
  Q29051554: '6b Threatened',
  Q29051555: '7 Shifting',
  Q29051556: '8a Moribund',
  Q29051558: '8b Nearly Extinct',
  Q29051560: '9 Dormant',
  Q61954960: '9 Reawakening',
  Q61954942: '9 Second language only',
  Q29051561: '10 Extinct',
  Q63671741: 'Unattested',
}

/**
 * Ethnologue status color.
 * @param {string} status - Status label starting with the level, e.g. "6a Vigorous"
 * @returns {string} - Hexadecimal color code (#rrggbb)
 */
export function ethnologStatusColor(status) {
  const level = /^(\d+)/.exec(status || '')?.[1]
  if (!level) return "#888888"
  if (level === "9" || level === "10") return "#000000"
  const n = parseInt(level, 10)
  const hue = 120 - (n * 15)
  // HSL(hue, 100%, 50%) -> RGB
  const channel = (k) => {
    const a = 0.5 // s * min(l, 1 - l)
    const kk = (k + hue / 30) % 12
    const v = 0.5 - a * Math.max(-1, Math.min(kk - 3, 9 - kk, 1))
    return Math.round(v * 255).toString(16).padStart(2, '0')
  }
  return `#${channel(0)}${channel(8)}${channel(4)}`
}
