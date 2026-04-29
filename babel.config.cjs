// Required so Jest can transpile selected ESM packages from node_modules when
// running the repo's CommonJS-oriented test setup.
module.exports = {
  presets: [['@babel/preset-env', { targets: { node: 'current' } }], '@babel/preset-typescript'],
  plugins: [['@babel/plugin-proposal-decorators', { version: '2023-11' }]],
};
