import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**', '*.d.ts'] },
  // Base configuration
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended, eslintConfigPrettier],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // 1. Strict TypeScript (No Any, strict checks)
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

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

      // 3. File & Line Limits
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

      // 4. React Specifics
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  // 5. FSD Layer Import Hierarchy (Strict Boundaries)
  // Shared layer cannot import from entities, features, widgets, pages, app
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['@/entities/**', '@/features/**', '@/widgets/**', '@/pages/**', '@/app/**'],
              message:
                'FSD Hierarchy Violation: "shared" layer cannot import from higher layers (entities, features, widgets, pages, app).',
            },
            {
              group: [
                '../*/entities/**',
                '../*/features/**',
                '../*/widgets/**',
                '../*/pages/**',
                '../*/app/**',
              ],
              message:
                'FSD Hierarchy Violation: "shared" layer cannot import from higher layers via relative paths.',
            },
          ],
        },
      ],
    },
  },

  // Entities layer cannot import from features, widgets, pages, app
  {
    files: ['src/entities/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['@/features/**', '@/widgets/**', '@/pages/**', '@/app/**'],
              message:
                'FSD Hierarchy Violation: "entities" layer cannot import from features, widgets, pages, or app.',
            },
            {
              group: ['../*/features/**', '../*/widgets/**', '../*/pages/**', '../*/app/**'],
              message:
                'FSD Hierarchy Violation: "entities" layer cannot import from features, widgets, pages, or app via relative paths.',
            },
          ],
        },
      ],
    },
  },

  // Features layer cannot import from widgets, pages, app
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['@/widgets/**', '@/pages/**', '@/app/**'],
              message:
                'FSD Hierarchy Violation: "features" layer cannot import from widgets, pages, or app.',
            },
            {
              group: ['../*/widgets/**', '../*/pages/**', '../*/app/**'],
              message:
                'FSD Hierarchy Violation: "features" layer cannot import from widgets, pages, or app via relative paths.',
            },
          ],
        },
      ],
    },
  },

  // Widgets layer cannot import from pages, app
  {
    files: ['src/widgets/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['@/pages/**', '@/app/**'],
              message: 'FSD Hierarchy Violation: "widgets" layer cannot import from pages or app.',
            },
            {
              group: ['../*/pages/**', '../*/app/**'],
              message:
                'FSD Hierarchy Violation: "widgets" layer cannot import from pages or app via relative paths.',
            },
          ],
        },
      ],
    },
  },

  // Pages layer cannot import from app
  {
    files: ['src/pages/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['@/app/**'],
              message: 'FSD Hierarchy Violation: "pages" layer cannot import from app layer.',
            },
            {
              group: ['../*/app/**'],
              message:
                'FSD Hierarchy Violation: "pages" layer cannot import from app layer via relative paths.',
            },
          ],
        },
      ],
    },
  },
);
