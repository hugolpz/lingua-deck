/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  root: true,
  extends: [
    'plugin:vue/vue3-recommended',
    'eslint:recommended',
    '@vue/eslint-config-prettier/skip-formatting',
    'plugin:vuejs-accessibility/recommended',
    'plugin:cypress/recommended'
  ],
  plugins: ['vuejs-accessibility', 'cypress'],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  rules: {
    'eqeqeq': ['error', 'always'],
    'no-var': 'error',
    'prefer-const': 'error',
    'vuejs-accessibility/media-has-caption': 'off', // Disable the media-has-caption rule
  }
}
