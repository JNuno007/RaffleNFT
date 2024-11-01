/* eslint-disable import/no-extraneous-dependencies */

const { merge } = require('webpack-merge');
const path = require('path');
const common = require('./webpack.common');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: { static: path.join(__dirname, 'src') },
});
