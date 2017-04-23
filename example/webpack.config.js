const path = require('path');
const webpack = require('webpack');

module.exports = {
   // devtool: 'inline-source-map',
   entry: './index.js',
   output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname),
   },
   module: {
      rules: [
         {
            test: /\.js$/,
            exclude: [
               /(node_modules|bower_components)/,
               path.resolve(__dirname, '../dist/webtrader-charts.js'),
               path.resolve(__dirname, '../../src/webtrader-charts/webtrader-charts.js')
            ],
            use: {
               loader: 'babel-loader',
               options: {
                  presets: ['env', 'stage-2'],
               },
            }
         },
      ]
   },
   plugins: [ ],
};
