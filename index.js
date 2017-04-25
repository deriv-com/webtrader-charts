import _ from 'lodash';
import $ from 'jquery';
import wtcharts from 'webtrader-charts';

wtcharts.init({
   appId: 11,
   lang: 'en',
   server: 'wss://ws.binaryws.com/websockets/v3'
});

const $parent = $('#container');

const chart =  wtcharts.chartWindow.addNewChart($parent, {
   "instrumentCode": "RDBULL",
   "instrumentName": "Bull Market Index",
   "timePeriod": "1m",
   "type": "line",
   "delayAmount": 0,
   "indicators": [
      {
         "id": "cks",
         "name": "Chande Kroll Stop",
         "options": {
            "period": 10,
            "maxMinPeriod": 20,
            "multiplier": 3,
            "longStopStroke": "#00C176",
            "shortStopStroke": "#FF003C",
            "strokeWidth": 1,
            "dashStyle": "Solid"
         }
      }
   ],
   // "overlays": [
   //   {
   //     "symbol": "frxAUDJPY",
   //     "displaySymbol": "AUD/JPY",
   //     "delay_amount": 0
   //   }
   // ],
});

chart.events.anyChange = () => {
   console.warn(chart.data());
}; 
