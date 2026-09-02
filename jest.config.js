const baseConfig = require('./jest.base.config');

module.exports = {
  ...baseConfig,
  roots: ['<rootDir>/src/test/unit'],
  modulePathIgnorePatterns: ['<rootDir>/src/test/unit/mocks'],
};
