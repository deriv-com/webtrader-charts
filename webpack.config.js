var path = require('path');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
   entry: './src/index.js',
   output: {
      filename: 'webtrader-charts.js',
      // path: path.resolve(__dirname, 'dist'),
      path: path.resolve(__dirname, '../src/webtrader-charts'),
      library: 'WebtraderCharts',
      libraryTarget: 'umd'
   },
   module: {
      rules: [
         {
            test: /\.js$/,
            exclude: /(node_modules|bower_components)/,
            use: {
               loader: 'babel-loader',
               options: {
                  presets: ['env'],
               },
            }
         },
         {
            test: /\.html$/,
            use: [ {
               loader: 'html-loader',
               options: {
                  minimize: true
               }
            }],
         }
      ]
   },
   plugins: [
      new UglifyJSPlugin()
   ]
};
