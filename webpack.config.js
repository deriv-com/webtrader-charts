var path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'webtrader-charts.js',
    path: path.resolve(__dirname, 'dist')
  }
};
