import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
  },
  {
    path: '/styleguide',
    name: 'styleguide',
    component: () => import('../views/StyleguideView.vue'),
  },
  {
    path: '/gallery',
    name: 'gallery',
    component: () => import('../modules/gallery/GalleryView.vue'),
  },
  /* Proofs of concepts : */
  {
    path: '/dictionary/:listPath(.*)*',
    name: 'dictionary',
    component: () => import('../modules/dictionary/DictionaryView.vue'),
  },
  {
    path: '/incubators',
    name: 'incubators',
    component: () => import('../modules/incubators/IncubatorsView.vue'),
  },
  {
    path: '/incubators/:code',
    name: 'incubatorLexicon',
    component: () => import('../modules/incubators/IncubatorLexiconsView.vue'),
  },
  {
    path: '/wikipedias/:code',
    name: 'wikipediaLexicon',
    component: () => import('../modules/incubators/IncubatorLexiconsView.vue'),
    meta: { type: 'wikipedia' },
  },
  {
    path: '/supports',
    name: 'dashboardSupports',
    component: () => import('../modules/supports/SupportsView.vue'),
  },
  {
    path: '/transparency',
    name: 'transparency',
    component: () => import('../modules/transparency/TransparencyView.vue'),
  },
  {
    path: '/transparency/lingualibre',
    name: 'transparencyLinguaLibre',
    component: () => import('../modules/transparency/LinguaLibreView.vue'),
  },
  {
    path: '/transparency/wmfr',
    name: 'transparencyWmfr',
    component: () => import('../modules/transparency/WmfrView.vue'),
  },
  {
    path: '/languages',
    name: 'languages',
    component: () => import('../modules/categories/CategoriesView.vue'),
    props: { show: 'languages' },
  },
  {
    path: '/recordists',
    name: 'recordists',
    component: () => import('../modules/categories/CategoriesView.vue'),
    props: { show: 'recordists' },
  },
  {
    path: '/categories',
    name: 'categories',
    component: () => import('../modules/categories/CategoriesView.vue'),
  },
  {
    path: '/categories/:title',
    name: 'category',
    component: () => import('../modules/categories/CategoryView.vue'),
  },
  {
    path: '/logs',
    name: 'logs',
    component: () => import('../modules/logs/ErrorView.vue'),
  },
  { path: '/dashboard/errors', redirect: '/logs' },
  {
    path: '/changelog',
    name: 'changelog',
    component: () => import('../modules/changelog/ChangelogView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
