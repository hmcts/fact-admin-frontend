/*
 * From EsLint V9 onwards, there has been a move from .eslintrc and .eslintignore to
 * a flat config format, which is structured as below.
 * Docs: https://eslint.org/docs/latest/use/configure/configuration-files
 * For migration: https://eslint.org/docs/latest/use/configure/migration-guide
 * Exceptions: TS linting uses the project config, JS linting is limited to src,
 * Jest rules are scoped to tests under src/test, and a single require() is
 * allowed to lazy-load the webpack config in development.
 */
const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');
const globals = require('globals');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

const globalIgnores = [
  '.yarn/**',
  '.pnp.*',
  'dist/**',
  'coverage/**',
  '**/*.d.ts',
  'src/main/views/govuk/**',
  'src/main/public/**',
  'src/main/types/**',
  'src/test/config.ts',
  'jest.*config.js',
  '.eslintrc.js',
];
const tsFiles = ['**/*.ts'];
const testFiles = ['src/test/**/*.{js,ts}'];
const jsFiles = ['src/**/*.js'];

const withFiles = files => config => ({
  ...config,
  files,
});

module.exports = [
  { ignores: globalIgnores },
  {
    files: tsFiles,
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
  },
  ...compat
    .extends(
      'eslint:recommended',
      'plugin:import/errors',
      'plugin:import/warnings',
      'plugin:import/typescript',
      'prettier'
    )
    .map(withFiles(tsFiles)),
  ...compat
    .extends('plugin:@typescript-eslint/eslint-recommended', 'plugin:@typescript-eslint/recommended')
    .map(withFiles(tsFiles)),
  ...compat.extends('plugin:jest/recommended').map(withFiles(testFiles)),
  ...compat.extends('eslint:recommended', 'prettier').map(withFiles(jsFiles)),
  {
    files: tsFiles,
    languageOptions: {
      ecmaVersion: 2018,
      sourceType: 'module',
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: __dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2026,
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
      import: require('eslint-plugin-import'),
    },
    rules: {
      '@typescript-eslint/array-type': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      // This can be changed to error once we move to webpackdevmiddleware
      '@typescript-eslint/no-require-imports': [
        'warn',
        {
          allow: ['^\\.\\./\\.\\./webpack\\.config(\\.js)?$'],
        },
      ],
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          ignoreRestSiblings: true,
          argsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-var-requires': 'off',
      curly: 'error',
      eqeqeq: 'error',
      'import/no-duplicates': 'error',
      'import/no-named-as-default': 'error',
      'import/order': [
        'error',
        {
          alphabetize: {
            caseInsensitive: false,
            order: 'asc',
          },
          'newlines-between': 'always',
        },
      ],
      'linebreak-style': ['error', 'unix'],
      'no-console': 'warn',
      'no-prototype-builtins': 'off',
      'no-return-await': 'error',
      'no-unneeded-ternary': [
        'error',
        {
          defaultAssignment: false,
        },
      ],
      'object-curly-spacing': ['error', 'always'],
      'object-shorthand': ['error', 'properties'],
      quotes: [
        'error',
        'single',
        {
          allowTemplateLiterals: false,
          avoidEscape: true,
        },
      ],
      semi: ['error', 'always'],
      'sort-imports': [
        'error',
        {
          allowSeparatedGroups: false,
          ignoreCase: false,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
        },
      ],
    },
  },
  {
    files: testFiles,
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    plugins: {
      jest: require('eslint-plugin-jest'),
    },
    rules: {
      'jest/prefer-to-have-length': 'error',
      'jest/valid-expect': 'off',
    },
  },
  {
    files: jsFiles,
    languageOptions: {
      ecmaVersion: 2018,
      sourceType: 'script',
      globals: {
        ...globals.node,
      },
    },
  },
];
