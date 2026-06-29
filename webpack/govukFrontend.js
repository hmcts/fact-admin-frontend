const path = require('path');

const CopyWebpackPlugin = require('copy-webpack-plugin');

const rootExport = require.resolve('govuk-frontend');
const root = path.resolve(rootExport, '..');
const sass = path.resolve(root, 'all.scss');
const javascript = path.resolve(root, 'all.js');
const components = path.resolve(root, 'components');
const assets = path.resolve(root, 'assets');
const images = path.resolve(assets, 'images');
const fonts = path.resolve(assets, 'fonts');
const stylesheets = path.resolve(root, 'govuk-frontend.min.css');

const extractGovukFontFaces = content => {
  const css = content.toString();
  const fontFaces = css.match(
    /\/\*! Copyright \(c\) 2011 by Margaret Calvert & Henrik Kubel\.[\s\S]*?@font-face\{[^}]+}@font-face\{[^}]+}/
  );

  if (!fontFaces) {
    throw new Error('Unable to extract GOV.UK Frontend font-face declarations');
  }

  return `${fontFaces[0]}\n`;
};

const copyGovukTemplateAssets = new CopyWebpackPlugin({
  patterns: [
    { from: images, to: 'assets/images' },
    { from: fonts, to: 'assets/fonts' },
    { from: stylesheets, to: 'assets/stylesheets/govuk-fonts.css', transform: extractGovukFontFaces },
    { from: assets + '/manifest.json', to: 'assets' },
    { from: `${root}/template.njk`, to: '../views/govuk' },
    { from: `${root}/components`, to: '../views/govuk/components' },
    { from: `${root}/macros`, to: '../views/govuk/macros' },
  ],
});

module.exports = {
  paths: { template: root, components, sass, javascript, assets },
  plugins: [copyGovukTemplateAssets],
};
