import { readFileSync } from 'fs';
import { extname } from 'path';
import { createFilter } from 'rollup-pluginutils';
import postcss from 'rollup-plugin-postcss';
import cssnano from 'cssnano';
import sass from 'sass';
import json from '@rollup/plugin-json';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import string from '@bkuri/rollup-plugin-string'
import svg from 'sass-svg-inline';
import terser from '@rollup/plugin-terser';
import pluginImage from '@rollup/plugin-image';

const preprocessor = (content, id) => new Promise((resolve, reject) => {
  sass.render({
    file: id,
    functions: {
      'svg($path)': svg.setDir('./img'),
      'inline-svg($path)': svg.setDir('./img')

      // svg: inliner('./src', { }),
      // 'inline-svg': inliner('./src', { })
    }
  }, (err, result) => {
    if(err) { reject(err); return; }

    resolve({
      code: result.css.toString('utf-8'),
    });
  });
});

export default {
  input: 'src/index.js',
  output: {
    file: './dist/webtrader-charts.js',
    // file: './example/node_modules/webtrader-charts/dist/webtrader-charts.js',
    // file: '../webtrader/node_modules/@binary-com/webtrader-charts/dist/webtrader-charts.js',
    // file: '../binary-static/node_modules/@binary-com/webtrader-charts/dist/webtrader-charts.js',
    format: 'umd',
    name: 'WebtraderCharts',
  },
  plugins: [
    pluginImage(),
    image(),
    postcss({
      preprocessor,
      extensions: ['.scss'],
      plugins: [cssnano({ preset: [
        'default',
        {
          mergeLonghand: false
        }
      ]
      })]
    }),
    json(),
    string({
      // Required to be specified
      include: ['**/*.html'],
    }),
    babel({
      exclude: 'node_modules/**',
      presets: ["@babel/preset-env"],
      babelrc: false,
      babelHelpers: 'bundled'
    }),
    nodeResolve({
      jsnext: true,
      main: true
    }),
    commonjs({
      include: 'node_modules/**',
      exclude: [],
      sourceMap: false, 
    }),
    terser(),
  ],
  watch: {
    include: 'src/**'
  },
  external: [
    'highstock-release/highstock',
    'highstock-release/highcharts-more',
    'highstock-release/modules/exporting',
    'highstock-release/modules/offline-exporting',
    'jquery',
    'moment',
  ],
  globals: {
    'highstock-release/highstock' : 'Highcharts',
    'highstock-release/highcharts-more' : 'HighchartsMore',
    'highstock-release/modules/exporting' : 'HighchartsExporting',
    'highstock-release/modules/offline-exporting' : 'HighcartsOfflineExporting',
    'jquery': 'jQuery',
    'moment': 'moment',
  }
};

function image(options) {
  options = options || {};
  const mimeTypes = {
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png':  'image/png',
    '.gif':  'image/gif',
    '.svg':  'image/svg+xml'
  };
	const filter = createFilter( options.include, options.exclude );

	return {
		name: 'image',

		load ( id ) {
			if ( !filter( id ) ) return null;

			const mime = mimeTypes[ extname( id ) ];
			if ( !mime ) return null; // not an image

			const data = readFileSync( id, 'base64' );
			// const code = `var img = new Image(); img.src = 'data:${mime};base64,${data}'; export default img;`;
			const code = `var img = 'data:${mime};base64,${data}'; export default img;`;

			const ast = {
				type: 'Program',
				sourceType: 'module',
				start: 0,
				end: null,
				body: []
			};

			return { ast, code, map: { mappings: '' } };
		}
	};
}

