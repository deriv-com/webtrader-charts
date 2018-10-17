import $ from 'jquery';
import Highcharts from 'highstock-release/highstock';
import {version} from '../package.json';
import HighchartsMore from 'highstock-release/highcharts-more';
import HighchartsExporting from 'highstock-release/modules/exporting';
import HighcartsOfflineExporting from 'highstock-release/modules/offline-exporting';

HighchartsMore && HighchartsMore(Highcharts);
HighchartsExporting && HighchartsExporting(Highcharts);
HighcartsOfflineExporting && HighcartsOfflineExporting(Highcharts);

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
import {globals} from './common/globals.js';
import {init} from './common/liveapi'; 
import liveapi from './common/liveapi'; 
import indicators from './common/indicators';

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
export {default as indicators} from './common/indicators'; 
export {default as stream_handler} from './common/stream_handler'; 
export {init, default as liveapi} from './common/liveapi'; 
export {globals} from './common/globals.js';

export default {
   charts,
   tableView,
   chartWindow,
   chartOptions,
   indicatorBuilder,
   indicatorManagement,
   overlayManagement,
   chartingRequestMap,
   globals,
   indicators,
   stream_handler,
   init,
   liveapi,
   version
};
