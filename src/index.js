import indicatorBuilder from './indicatorBuilder'; 
import indicatorManagement from './indicatorManagement';
import overlayManagement from './overlayManagement';
import chartingRequestMap from './common/chartingRequestMap';
import stream_handler from './common/stream_handler';
import ohlc_handler from './common/ohlc_handler';
import tableView from './tableView';
import charts from './charts';
import {init} from './common/liveapi'; 
import './indicators/index.js';
import './index.scss';

export {default as indicatorBuilder} from './indicatorBuilder'; 
export {default as indicatorManagement} from './indicatorManagement'; 
export {default as overlayManagement} from './overlayManagement'; 
export {default as chartingRequestMap} from './common/chartingRequestMap'; 
export {default as charts} from './charts'; 
export {default as tableView} from './tableView'; 
export {init} from './common/liveapi'; 

chartingRequestMap.register({
  "symbol": "DEDBK",
  "granularity": "1d",
  "subscribe": 1,
  "style": "candles",
  "count": 1000,
  "adjust_start_time": 1
});

export default {
   indicatorBuilder,
   indicatorManagement,
   overlayManagement,
   chartingRequestMap,
   charts,
   tableView,
   init
};
