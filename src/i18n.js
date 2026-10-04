import { createI18n } from 'vue-i18n'
import en from './i18n/en.json'

// English is bundled; add more locales in src/i18n/<code>.json and load them lazily.
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: { en },
})

export default i18n
