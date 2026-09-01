module.exports = {
  roots: ['<rootDir>/src/test/unit'],
  testRegex: '(/src/test/.*|\\.(test|spec))\\.(ts|js)$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts?$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }],
    '^.+\\.(js|mjs)$': 'babel-jest',
  },
  transformIgnorePatterns: ['/node_modules/(?!chai|uuid|config)'],
  modulePathIgnorePatterns: ['<rootDir>/src/test/unit/mocks'],
};
