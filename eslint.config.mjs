import tseslint from '@electron-toolkit/eslint-config-ts'
import eslintConfigPrettier from '@electron-toolkit/eslint-config-prettier'
import eslintPluginSvelte from 'eslint-plugin-svelte'
import simpleImportSort from 'eslint-plugin-simple-import-sort'

export default tseslint.config(
  { ignores: ['**/node_modules', '**/dist', '**/out'] },
  tseslint.configs.recommended,
  eslintPluginSvelte.configs['flat/recommended'],
  eslintConfigPrettier,

  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser
      }
    },
    rules: {
      'svelte/no-unused-svelte-ignore': 'off'
    }
  },
  {
    files: ['**/*.{ts,svelte}'],
    plugins: {
      'simple-import-sort': simpleImportSort
    },
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser
      }
    },
    rules: {
      'no-unused-vars': ['off', { varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true
        }
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      'simple-import-sort/imports': 'warn',
      'simple-import-sort/exports': 'warn'
    }
  }
)
