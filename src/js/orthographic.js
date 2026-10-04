/**
 * Orthographic globe utilities
 * Extracted and adapted from wikiatlas.js
 */
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import worldData from '@/data/world-110m-ids.json'

/**
 * Create an orthographic globe centered on a specific location
 * @param {string} hookId - CSS selector for the container
 * @param {number} width - Width of the globe in pixels
 * @param {string} title - Title for the globe
 * @param {number} lat - Latitude to center on (centroid when multiple coords given)
 * @param {number} lon - Longitude to center on (centroid when multiple coords given)
 * @param {Array<{lat: number, lon: number, color?: string, size?: number, label?: string, url?: string}>} [data]
 *   Optional markers. `color` is a CSS color, `size` the radius in px, `label` a hover tooltip,
 *   `url` makes the marker a link. Falls back to a single marker at [lon, lat] when omitted.
 * @returns {Object} - SVG element and utility functions
 */
export const createOrthographicGlobe = (hookId, width, title, lat, lon, data) => {
  // Normalise to a consistent array of markers, with [lon, lat] points for D3
  const markers =
    data && data.length > 0
      ? data.map((c) => ({ ...c, point: [c.lon, c.lat] }))
      : [{ point: [lon, lat] }]
  const height = width
  const lon_central = -lon
  const lat_central = -lat

  // Calculate dimensions accounting for stroke width
  const waterStrokeWidth = 1
  const effectiveRadius = width / 2 - waterStrokeWidth / 2

  // Setup projection
  const proj = d3
    .geoOrthographic()
    .scale(effectiveRadius)
    .rotate([lon_central, lat_central, 0])
    .translate([width / 2, height / 2])
    .clipAngle(90)

  const path = d3.geoPath().projection(proj)

  // Create SVG container
  const svg = d3
    .select(hookId)
    .append('svg')
    .attr('id', `${title.replace(/\s+/g, '_')}-orthographic-globe`)
    .attr('width', width)
    .attr('height', height)

  // Create defs for gradients and patterns
  const defs = svg.append('defs')

  // Create gradient for sphere shadow
  const gradientId = `gradient-${title.replace(/\s+/g, '_')}`
  const gradient = defs
    .append('linearGradient')
    .attr('id', gradientId)
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '100%')
    .attr('y2', '100%')

  gradient.append('stop').attr('offset', '50%').attr('stop-color', '#FFF').attr('stop-opacity', 0.3)

  gradient
    .append('stop')
    .attr('offset', '100%')
    .attr('stop-color', '#009')
    .attr('stop-opacity', 0.3)

  // Create SVG groups for organized structure
  const waterGroup = svg.append('g').attr('class', 'water-group')
  const landGroup = svg.append('g').attr('class', 'land-group')
  const boundariesGroup = svg.append('g').attr('class', 'boundaries-group')
  const graticuleGroup = svg.append('g').attr('class', 'graticule-group')
  const shadowGroup = svg.append('g').attr('class', 'shadow-group')
  const markerGroup = svg.append('g').attr('class', 'marker-group')

  // Use previously calculated radius values
  const waterRadius = effectiveRadius
  const shadowRadius = width / 2 // No stroke, can use full radius

  // Draw blue water background in water group
  waterGroup
    .append('circle')
    .attr('class', 'water')
    .attr('cx', width / 2)
    .attr('cy', height / 2)
    .attr('r', waterRadius)
    .style('fill', '#C6ECFF')
    .style('stroke', '#656565')
    .style('stroke-width', waterStrokeWidth)

  // Draw countries in land group
  const countries = topojson.feature(worldData, worldData.objects.countries)

  landGroup
    .selectAll('.country')
    .data(countries.features)
    .enter()
    .append('path')
    .attr('class', 'country')
    .attr('d', path)
    .style('fill', '#FDFBEA')
    .style('stroke', 'none')

  // Country boundaries in boundaries group
  boundariesGroup
    .append('path')
    .datum(topojson.mesh(worldData, worldData.objects.countries, (a, b) => a !== b))
    .attr('class', 'boundary')
    .attr('d', path)
    .style('fill', 'none')
    .style('stroke', '#656565')
    .style('stroke-width', 0.3)

  // Coastlines in boundaries group
  boundariesGroup
    .append('path')
    .datum(topojson.mesh(worldData, worldData.objects.countries, (a, b) => a === b))
    .attr('class', 'coast')
    .attr('d', path)
    .style('fill', 'none')
    .style('stroke', '#0978AB')
    .style('stroke-width', 0.3)

  // Graticule (grid lines) in graticule group
  const graticule = d3.geoGraticule().step([20, 20])
  graticuleGroup
    .append('path')
    .datum(graticule)
    .attr('class', 'graticule')
    .attr('d', path)
    .style('fill', 'none')
    .style('stroke', '#777')
    .style('stroke-width', 0.3)
    .style('stroke-opacity', 0.5)

  // Gradient shadow in shadow group
  shadowGroup
    .append('circle')
    .attr('class', 'gradient-shadow')
    .attr('cx', width / 2)
    .attr('cy', height / 2)
    .attr('r', shadowRadius)
    .attr('fill', `url(#${gradientId})`)
    .style('pointer-events', 'none')

  const drawLocationMarker = () => {
    markerGroup.selectAll('*').remove()

    const center = proj.invert([width / 2, height / 2])
    if (!center) return

    markers.forEach((m) => {
      const angle = d3.geoDistance(m.point, center)
      if (angle > Math.PI / 2) return

      const coords = proj(m.point)
      if (!coords || isNaN(coords[0]) || isNaN(coords[1])) return

      // Linked markers are wrapped in <a>, others stay inert so they never block dragging
      const parent = m.url
        ? markerGroup.append('a').attr('href', m.url).attr('target', '_blank').attr('rel', 'noopener')
        : markerGroup
      const circle = parent
        .append('circle')
        .attr('class', 'location-marker')
        .attr('cx', coords[0])
        .attr('cy', coords[1])
        .attr('r', m.size ?? 2)
        .style('fill', m.color ?? '#B10000')
        .style('pointer-events', m.url || m.label ? 'auto' : 'none')
        .style('cursor', m.url ? 'pointer' : null)
      if (m.label) circle.append('title').text(m.label)
    })
  }

  // Add drag behavior with proper rotation tracking
  const drag = d3
    .drag()
    .on('drag', (event) => {
      const sensitivity = 0.25
      const rotate = proj.rotate()
      proj.rotate([
        rotate[0] + event.dx * sensitivity,
        rotate[1] - event.dy * sensitivity,
        0,
      ])

      // Update all geographic elements
      landGroup.selectAll('path').attr('d', path)
      boundariesGroup.selectAll('path').attr('d', path)
      graticuleGroup.selectAll('path').attr('d', path)

      drawLocationMarker()
    })

  svg.call(drag)

  // Double-click to reset
  svg.on('dblclick', function () {
    proj.rotate([lon_central, lat_central, 0])

    // Update all geographic elements
    landGroup.selectAll('path').attr('d', path)
    boundariesGroup.selectAll('path').attr('d', path)
    graticuleGroup.selectAll('path').attr('d', path)

    drawLocationMarker()
  })

  // Draw initial marker
  drawLocationMarker()

  return {
    svg,
    projection: proj,
    path,
    groups: {
      water: waterGroup,
      land: landGroup,
      boundaries: boundariesGroup,
      graticule: graticuleGroup,
      shadow: shadowGroup,
      marker: markerGroup,
    },
    redraw: () => {
      landGroup.selectAll('path').attr('d', path)
      boundariesGroup.selectAll('path').attr('d', path)
      graticuleGroup.selectAll('path').attr('d', path)
      drawLocationMarker()
    },
  }
}
