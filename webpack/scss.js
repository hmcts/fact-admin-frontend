const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const devMode = process.env.NODE_ENV !== 'production';
const fileNameSuffix = devMode ? '-dev' : '.[contenthash]';
const filename = `[name]${fileNameSuffix}.css`;

const miniCss = new MiniCssExtractPlugin({
  // Options similar to the same options in webpackOptions.output
  // both options are optional
  filename,
  chunkFilename: '[id].css',
});

module.exports = {
  rules: [
    {
      test: /\.scss$/,
      use: [
        'style-loader',
        {
          loader: MiniCssExtractPlugin.loader,
          options: {
            esModule: false,
          },
        },
        {
          loader: 'css-loader',
          options: {
            url: false,
          },
        },
        {
          loader: 'sass-loader',
          options: {
            sassOptions: {
              // silence the moj deprecation warning (temporarily)
              logger: {
                warn: message => {
                  if (message.includes('govuk-text-colour')) return;
                  console.log(message);
                },
              },
              quietDeps: true,
            },
          },
        },
      ],
    },
  ],
  plugins: [miniCss],
};
