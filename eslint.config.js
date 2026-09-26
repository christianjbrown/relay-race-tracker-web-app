import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['coverage/', 'dist/', 'node_modules/'] },
  js.configs.recommended,
  {
    rules: {
      'no-unused-vars': ['error', { args: 'after-used', argsIgnorePattern: '^_', caughtErrors: 'none' }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
  // The page runs in the browser, and reaches browser globals only through boot.js's window.
  { files: ['src/**/*.js'], languageOptions: { globals: { ...globals.browser } } },
  { files: ['tools/**/*.js', 'test/**/*.js', '*.config.js'], languageOptions: { globals: { ...globals.node, ...globals.browser } } },
];
