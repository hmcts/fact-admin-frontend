import * as express from 'express';

const setupDev = (app: express.Express, developmentMode: boolean): void => {
  if (developmentMode) {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const webpackDev = require('webpack-dev-middleware');
    const webpack = require('webpack');
    /* eslint-enable @typescript-eslint/no-require-imports */
    const webpackconfig = require('../../webpack.config');
    const compiler = webpack(webpackconfig);
    app.use(
      webpackDev(compiler, {
        publicPath: '/',
      })
    );
  }
};

export { setupDev };
