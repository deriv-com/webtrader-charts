var path = require('path');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
   entry: './src/index.js',
   output: {
      filename: 'webtrader-charts.js',
      path: path.resolve(__dirname, 'dist'),
   },
   module: {
      rules: [
         {
            test: /\.js$/,
            exclude: /(node_modules)/,
            loader: 'babel-loader?presets[]=env'
         }
      ]
   },
   plugins: [
      new UglifyJSPlugin()
   ]
};
