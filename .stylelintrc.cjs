/*
 * Docs: https://stylelint.io/user-guide/configure
 * Note that string-quotes and selector-class-pattern are disabled currently, as
 * the previous configuration before this also stipulated that they were. This
 * relates to the existing GOV.UK/SCSS styles to be present without
 * linting errors being raised.
 */
module.exports = {
  extends: 'stylelint-config-standard-scss',
  ignoreFiles: ['**/node_modules/**', '.yarn/**'],
  rules: {
    'string-quotes': null,
    'selector-class-pattern': null,
  },
};
