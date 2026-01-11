import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Desabilita avisos sobre 'any' - será corrigido gradualmente
      '@typescript-eslint/no-explicit-any': 'off',
      // Desabilita avisos sobre variáveis não usadas - será corrigido gradualmente
      '@typescript-eslint/no-unused-vars': 'warn',
      // Desabilita avisos sobre declarações em case blocks
      'no-case-declarations': 'off',
      // Relaxa regras de hooks do React - warnings ao invés de erros
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
])
