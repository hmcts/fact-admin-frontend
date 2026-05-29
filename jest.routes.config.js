module.exports = {
  roots: ['<rootDir>/src/test/routes'],
  testRegex: '(/src/test/.*|\\.(test|spec))\\.(ts|js)$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/src/test/setup/routes.setup.ts'],
  transform: {
    '^.+\\.ts?$': 'ts-jest',
    '^.+\\.js$': 'babel-jest',
  },
  transformIgnorePatterns: ['/node_modules/(?!chai|uuid)'],
};
