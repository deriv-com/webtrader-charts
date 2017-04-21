const path = require('path');
const webpack = require('webpack');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
   devtool: 'inline-source-map',
   entry: './src/index.js',
   output: {
      filename: 'webtrader-charts.js',
      path: path.resolve(__dirname, 'dist'),
      // path: path.resolve(__dirname, '../src/webtrader-charts'),
      library: 'WebtraderCharts',
      libraryTarget: 'umd'
   },
   externals: {
      'moment' : 'moment',
      'jquery' : {
         commonjs: "jquery",
         commonjs2: "jquery",
         amd: "jquery",
         root: "jQuery"
      },
      'highstock-release' : {
         commonjs: "highstock-release",
         commonjs2: "highstock-release",
         amd: "highstock-release",
         root: "Highcharts"
      }
   },
   module: {
      rules: [
         {
            test: /\.js$/,
            exclude: /(node_modules|bower_components)/,
            use: {
               loader: 'babel-loader',
               options: {
                  presets: ['env', 'stage-2'],
                  plugins: ['lodash'],
               },
            }
         },
         {
            test: /\.html$/,
            use: [ {
               loader: 'html-loader',
               options: { minimize: true }
            }],
         },
         { test: /\.svg/, use: [ "url-loader" ] },
         {
            test: /\.scss$/,
            use: [
               { loader: "style-loader" },
               { loader: "css-loader" },
               { loader: "sass-loader" }
            ]
         },
         {
            test: /\.json$/,
            use: 'json-loader'
         }
      ]
   },
   plugins: [
      // new UglifyJSPlugin(),
      new webpack.ProvidePlugin({
         $: 'jquery',
         jQuery: 'jquery'
      })
   ],
   node: {
      fs: 'empty',
      net: 'empty',
      tls: 'empty',
      'crypto': 'empty'
   }
};
