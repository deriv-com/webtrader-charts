import Highcharts from 'highstock-release/highstock';
require('highstock-release/highcharts-more')(Highcharts);
require('highstock-release/modules/exporting')(Highcharts);
require('highstock-release/modules/offline-exporting')(Highcharts);

console.log(`webtrader-charts -> Using highcharts ${Highcharts.version}`);

import indicatorBuilder from './indicatorBuilder'; 
import indicatorManagement from './indicatorManagement';
import overlayManagement from './overlayManagement';
import chartingRequestMap from './common/chartingRequestMap';
import stream_handler from './common/stream_handler';
import ohlc_handler from './common/ohlc_handler';
import tableView from './tableView';
import chartOptions from './chartOptions';
import charts from './charts';
import chartWindow from './chartWindow';
import chartTemplateManager from './chartTemplateManager';
import {init} from './common/liveapi'; 

import './common/rivetsExtra.js';
import './indicators/index.js';
import './index.scss';

export {default as charts} from './charts'; 
export {default as tableView} from './tableView'; 
export {default as chartWindow} from './chartWindow';
export {default as chartOptions} from './chartOptions'; 
export {default as indicatorBuilder} from './indicatorBuilder'; 
export {default as indicatorManagement} from './indicatorManagement'; 
export {default as overlayManagement} from './overlayManagement'; 
export {default as chartingRequestMap} from './common/chartingRequestMap'; 
export {init} from './common/liveapi'; 

module.exports = {
   charts,
   tableView,
   chartWindow,
   chartOptions,
   indicatorBuilder,
   indicatorManagement,
   overlayManagement,
   chartingRequestMap,
   init
};
