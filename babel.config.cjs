// Required so Jest can transpile Chai v6's ESM output when running CJS tests.
// Jest configs opt into babel-jest for .js and allow transforming chai in node_modules.
module.exports = {
  presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
};
