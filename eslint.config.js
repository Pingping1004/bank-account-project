// eslint.config.js
/** @type {import('eslint').Linter.Config} */
module.exports = {
    env: {
      node: true,
      es2021: true,
    },
    extends: [
      'eslint:recommended',
      'plugin:node/recommended',
    ],
    parserOptions: {
      ecmaVersion: 12,
    },
    rules: {
      // Add custom rules here
    },
  };  