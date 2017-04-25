import _ from 'lodash';
import $ from 'jquery';
import wtcharts from 'webtrader-charts';

wtcharts.init({
   appId: 11,
   lang: 'en',
   server: 'wss://ws.binaryws.com/websockets/v3'
});

_.delay(() => {
   const $parent = $('#container');

   wtcharts.chartWindow.addNewChart($parent, {
     "instrumentCode": "RDBULL",
     "instrumentName": "Bull Market Index",
     "timePeriod": "1m",
     "type": "line",
     "delayAmount": 0,
     "indicators": [
       {
         "id": "atr",
         "name": "Average True Range",
         "options": {
           "levels": [
             {
               "color": "#FA6B0D",
               "dashStyle": "Dash",
               "label": { "text": 30 },
               "value": 30,
               "width": 1,
             },
             {
               "color": "#FA6B0D",
               "dashStyle": "Dash",
               "label": { "text": 70 },
               "value": 70,
               "width": 1,
             }
           ],
           "period": 14,
           "strokeWidth": 1,
           "stroke": "#FA6B0D",
           "dashStyle": "Solid",
           "appliedTo": 3
         }
       },
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
     "overlays": [
       {
         "symbol": "frxAUDJPY",
         "displaySymbol": "AUD/JPY",
         "delay_amount": 0
       }
     ],
     "name": "1m linedot + Chande "
   });
});

console.warn('hello world');
