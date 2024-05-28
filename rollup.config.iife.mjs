import config from './rollup.config.mjs';

config.output.format = 'iife';
config.output.file = config.output.file.replace('webtrader-charts.js', 'webtrader-charts.iife.js');

export default config;
