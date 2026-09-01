import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**', '*.js', '*.mjs', '*.d.ts'] },
  {
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended, eslintConfigPrettier],
    files: ['**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
      ecmaVersion: 2022,
    },
    rules: {
      // 1. Strict TypeScript
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // 2. Airbnb Style & Clean Code
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'prefer-const': 'error',
      'no-var': 'error',
      curly: ['error', 'all'],
      'no-duplicate-imports': 'error',
      'no-unneeded-ternary': 'error',
      'no-nested-ternary': 'warn',
      'prefer-template': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],

      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
      'max-len': [
        'warn',
        {
          code: 120,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreComments: true,
          ignoreRegExpLiterals: true,
        },
      ],
    },
  },
  {
    files: ['test/**/*.ts', '**/*.spec.ts', '**/*.e2e-spec.ts'],
    rules: {
      'max-lines': 'off',
    },
  },
);
