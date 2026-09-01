const CopyWebpackPlugin = require('copy-webpack-plugin');

const copyAccessibleAutocomplete = new CopyWebpackPlugin({
  patterns: [
    { from: 'src/main/assets/js/accessible-autocomplete.min.js', to: 'assets/js' },
    { from: 'src/main/assets/js/contact-type-autocomplete.js', to: 'assets/js' },
  ],
});

module.exports = {
  plugins: [copyAccessibleAutocomplete],
};
