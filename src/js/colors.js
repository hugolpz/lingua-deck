// Chart colors shared by the Linegraph, TopChart and TopList components.

export const CHART_COLORS = [
  '#ffc107', '#17a2b8', '#007bff', '#28a745', '#e83e8c',
  '#fd7e14', '#6f42c1', '#f03e3e', '#4057c0', '#20c997'
];

/**
 * Stable color for a key: `overrides[key]`, else the palette at `index`, else a color derived from the key.
 * @param {string|number} key
 * @param {number|null} index - Position in a ranked list, picks from CHART_COLORS
 * @param {Object<string,string>} overrides - Module specific colors by key
 */
export const getSharedColor = (key, index = null, overrides = {}) => {
  if (overrides[key]) return overrides[key];

  if (index !== null && index >= 0) {
    return CHART_COLORS[index % CHART_COLORS.length];
  }

  const intKey = parseInt(key, 10);
  if (!isNaN(intKey) && String(intKey) === String(key)) {
    const hue = (intKey * 137.508) % 360;
    return `hsl(${hue}, 60%, 50%)`;
  }

  let hash = 0;
  for (let i = 0; i < String(key).length; i++) {
    hash = String(key).charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${Math.abs(hash) % 360}, 60%, 50%)`;
};
