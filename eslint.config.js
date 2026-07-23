// Flat ESLint config. No build step — this lints the source directly to catch
// undefined variables, duplicate keys, unreachable code and the like before deploy.
import js from '@eslint/js';

const browser = {
  window: 'readonly', document: 'readonly', navigator: 'readonly', location: 'readonly',
  localStorage: 'readonly', indexedDB: 'readonly', IDBKeyRange: 'readonly',
  fetch: 'readonly', FormData: 'readonly', FileReader: 'readonly', Image: 'readonly',
  Blob: 'readonly', URL: 'readonly', Notification: 'readonly', TextEncoder: 'readonly',
  structuredClone: 'readonly', requestAnimationFrame: 'readonly',
  setTimeout: 'readonly', setInterval: 'readonly', clearTimeout: 'readonly', clearInterval: 'readonly',
  alert: 'readonly', confirm: 'readonly', prompt: 'readonly', console: 'readonly',
  HTMLElement: 'readonly', customElements: 'readonly',
};

export default [
  { ignores: ['node_modules/**'] },
  js.configs.recommended,
  // Empty catch blocks are a deliberate pattern here (localStorage/permission guards).
  { rules: { 'no-empty': ['error', { allowEmptyCatch: true }] } },
  {
    files: ['js/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: browser },
    rules: {
      'no-unused-vars': ['warn', { args: 'none', varsIgnorePattern: '^_' }],
      'no-undef': 'error',
    },
  },
  {
    files: ['service-worker.js'],
    languageOptions: {
      ecmaVersion: 2022, sourceType: 'script',
      globals: { self: 'readonly', caches: 'readonly', location: 'readonly', fetch: 'readonly', URL: 'readonly', console: 'readonly' },
    },
  },
  {
    files: ['tests/**/*.mjs', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2022, sourceType: 'module',
      globals: { process: 'readonly', console: 'readonly', URL: 'readonly', TextEncoder: 'readonly' },
    },
    rules: { 'no-unused-vars': ['warn', { args: 'none' }] },
  },
];
