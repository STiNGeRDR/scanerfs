import js from '@eslint/js'
import { defineFlatConfig } from 'eslint/config'

export default defineFlatConfig([
  // Базовые настройки для всего проекта
  {
    ignores: ['node_modules/', 'dist/', 'build/', '.next/', 'coverage/', '*.min.js', '*.config.js'],
  },
  js.configs.recommended,

  // Общие правила для всего проекта
  {
    rules: {
      'no-console': ['error', { allow: ['info', 'error', 'warn'] }],
      curly: ['error', 'all'],
      'no-irregular-whitespace': [
        'error',
        {
          skipStrings: true,
          skipTemplates: true,
        },
      ],
    },
  },
])
