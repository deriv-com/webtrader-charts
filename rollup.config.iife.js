import config from './rollup.config.js';

config.output.format = 'iife';
config.output.file = config.output.file.replace('webtrader-charts.js', 'webtrader-charts.iife.js');

export default config;
