const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'source-map',
  devServer: {
    static: './dist',
    https: true,
    port: 3000
  },
  output: {
    filename: '[name].bundle.js',
  }
});