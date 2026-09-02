const baseConfig = require('./jest.base.config');

module.exports = {
  ...baseConfig,
  roots: ['<rootDir>/src/test/routes'],
  setupFiles: ['<rootDir>/src/test/setup/routes.setup.ts'],
};
