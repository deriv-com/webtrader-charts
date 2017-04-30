const path = require('path');
const webpack = require('webpack');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
   devtool: 'inline-source-map',
   entry: './src/index.js',
   output: {
      filename: 'webtrader-charts.js',
      path: path.resolve(__dirname, 'dist'),
      // path: path.resolve(__dirname, './example/node_modules/webtrader-charts/dist'),
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
      'highstock-release/highstock' : {
         commonjs: "highstock-release/highstock",
         commonjs2: "highstock-release/highstock",
         amd: "highstock-release/highstock",
         root: "Highcharts"
      },
      'highstock-release/highcharts-more' : {
         commonjs: "highstock-release/highcharts-more",
         commonjs2: "highstock-release/highcharts-more",
         amd: "highstock-release/highcharts-more",
      },
      'highstock-release/modules/exporting' : {
         commonjs: "highstock-release/modules/exporting",
         commonjs2: "highstock-release/modules/exporting",
         amd: "highstock-release/modules/exporting",
      },
      'highstock-release/modules/offline-exporting' : {
         commonjs: "highstock-release/modules/offline-exporting",
         commonjs2: "highstock-release/modules/offline-exporting",
         amd: "highstock-release/modules/offline-exporting",
      }
   },
   module: {
      rules: [
         {
          test: require.resolve('jquery'),
          use: [{
              loader: 'expose-loader',
              options: 'jQuery'
          },{
              loader: 'expose-loader',
              options: '$'
          }]
      },
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
         { test: /\.(svg)/, use: [ "url-loader" ] },
         { test: /\.(png|jpg)/, use: [ "file-loader" ] },
         {
            test: /\.scss$/,
            use: [
               { loader: "style-loader" },
               { loader: "css-loader" },
               { loader: "sass-loader" }
            ]
         },
         {
            test: /\.css$/,
            use: [
               { loader: "style-loader" },
               { loader: "css-loader" },
            ]
         },
         {
            test: /\.json$/,
            use: 'json-loader'
         },
      ],
   },
   plugins: [
      new UglifyJSPlugin(),
      new webpack.ProvidePlugin({
         Highcharts: 'highstock-release/highstock',
      })
   ],
   node: {
      fs: 'empty',
      net: 'empty',
      tls: 'empty',
      'crypto': 'empty'
   }
};
