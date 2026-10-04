<template>
  <div class="spendings-wrapper">
    <div class="spendings-header">
      <h2>WMFR's redistributions to Lingua Libre</h2>
      <p class="subtitle">Showing {{ paginatedData.length }} of {{ filteredData.length }} results</p>
    </div>

    <div class="table-container">
      <table class="spendings-table">
        <thead>
          <tr>
            <th v-for="col in columns" :key="col" class="th-styled">
              <div class="col-name">{{ col }}</div>
              <input 
                v-model="filters[col]" 
                type="text" 
                :placeholder="'Filter ' + col + '...'" 
                class="col-filter" 
              />
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in paginatedData" :key="idx" class="tr-styled">
            <td v-for="col in columns" :key="col" class="td-styled">
              {{ row[col] }}
            </td>
          </tr>
          <tr v-if="paginatedData.length === 0">
            <td :colspan="columns.length" class="empty-state">
              No matching records found.
            </td>
          </tr>
        </tbody>
        <tfoot v-if="hasActiveFilter && paginatedData.length > 0">
          <tr class="tfoot-row">
            <td class="td-styled tfoot-label">Total :</td>
            <td class="td-styled tfoot-total">
              {{ formattedTotal }}
            </td>
            <td :colspan="columns.length - 2" class="td-styled"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import spendingsData from '../data/spendings_data.json';

const rawData = spendingsData;
const columns = [
  "Date", 
  "Montant TTC", 
  "Motif", 
  "Projet associé", 
  "Personne associée", 
  "Identifiant",
  "SourcePDF"
];

// URL query parameter for each column filter, e.g. ?project=wikipages&date=2024
const QUERY_PARAMS = {
  "Date": "date",
  "Montant TTC": "amount",
  "Motif": "reason",
  "Projet associé": "project",
  "Personne associée": "person",
  "Identifiant": "id",
  "SourcePDF": "pdf"
};

const route = useRoute();
const router = useRouter();

const readFilters = () =>
  Object.fromEntries(columns.map(col => [col, String(route.query[QUERY_PARAMS[col]] ?? "")]));

const filters = ref(readFilters());

// Filters -> URL (replace, so typing doesn't fill the history)
watch(filters, (value) => {
  const query = { ...route.query };
  for (const col of columns) {
    const param = QUERY_PARAMS[col];
    if (value[col].trim()) query[param] = value[col];
    else delete query[param];
  }
  router.replace({ query });
}, { deep: true });

// URL -> filters (back/forward, pasted links)
watch(() => route.query, () => {
  const fromUrl = readFilters();
  if (columns.some(col => fromUrl[col] !== filters.value[col])) filters.value = fromUrl;
});

const hasActiveFilter = computed(() => {
  return columns.some(col => filters.value[col].trim() !== '');
});

const filteredData = computed(() => {
  return rawData.filter(row => {
    return columns.every(col => {
      const filterValue = filters.value[col].toLowerCase();
      if (!filterValue) return true;
      const cellValue = String(row[col] || '').toLowerCase();
      return cellValue.includes(filterValue);
    });
  });
});

// "displaying 100 entries"
const paginatedData = computed(() => {
  return filteredData.value.slice(0, 100);
});

// compute the total for Montant TTC column when filtered
const filteredTotal = computed(() => {
  if (!hasActiveFilter.value) return 0;
  
  return filteredData.value.reduce((acc, row) => {
    let valStr = row["Montant TTC"] || "";
    // Remove characters like '€' or spaces, and replace comma with dot for float parsing
    let numericStr = valStr.replace(/[^\d,\.-]/g, '').replace(',', '.');
    let num = parseFloat(numericStr);
    return acc + (isNaN(num) ? 0 : num);
  }, 0);
});

const formattedTotal = computed(() => {
  // Format the number similar to French currency format
  return filteredTotal.value.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' €';
});
</script>

<style scoped>
.spendings-wrapper {
  background-color: var(--color-surface);
  border-radius: 12px;
  box-shadow: var(--shadow-hover);
  padding: 24px;
  margin: 16px 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: var(--color-text);
}

.spendings-header {
  margin-bottom: 24px;
}

.spendings-header h2 {
  margin: 0 0 4px 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
}

.subtitle {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.table-container {
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.02);
}

.spendings-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1000px;
}

.th-styled {
  background-color: var(--color-surface-muted);
  padding: 12px 16px;
  text-align: left;
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 2px solid var(--color-border);
}

.col-name {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--color-text);
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.col-filter {
  width: 100%;
  box-sizing: border-box;
  padding: 6px 10px;
  font-size: 0.85rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.col-filter:focus {
  border-color: var(--color-progressive);
  box-shadow: var(--focus-ring);
}

.tr-styled {
  transition: background-color 0.15s ease;
}

.tr-styled:hover {
  background-color: var(--color-surface-muted);
}

.td-styled {
  padding: 12px 16px;
  font-size: 0.875rem;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text);
  vertical-align: top;
}

.empty-state {
  padding: 32px;
  text-align: center;
  color: var(--color-text-secondary);
  font-style: italic;
  background-color: var(--color-surface-muted);
}

.tfoot-row {
  background-color: var(--color-surface-muted);
  border-top: 2px solid var(--color-border);
  position: sticky;
  bottom: 0;
}

.tfoot-label {
  font-weight: 700;
  text-align: right;
  color: var(--color-text);
}

.tfoot-total {
  font-weight: 700;
  color: var(--color-text);
  white-space: nowrap;
}

/* Custom scrollbar for table container */
.table-container::-webkit-scrollbar {
  height: 8px;
  width: 8px;
}
.table-container::-webkit-scrollbar-track {
  background: var(--color-surface-muted);
  border-radius: 4px;
}
.table-container::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 4px;
}
.table-container::-webkit-scrollbar-thumb:hover {
  background: var(--color-border-hover);
}
</style>
