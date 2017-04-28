const path = require('path');
const webpack = require('webpack');

module.exports = {
   devtool: 'source-map',
   entry: './index.js',
   output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname),
   },
   externals: {
      'jquery' : 'jQuery'
   },
   module: {
      rules: [
         {
            test: /\.js$/,
            exclude: [ /(node_modules|bower_components)/ ],
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
