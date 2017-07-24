import $ from 'jquery';
import wtcharts from 'webtrader-charts';

wtcharts.init({
   appId: 11,
   lang: 'en', // default is 'en'
   server: 'wss://ws.binaryws.com/websockets/v3'
});

const $parent = $('#container');

const chart =  wtcharts.chartWindow.addNewChart($parent, {
   "instrumentCode": "R_100",
   "instrumentName": "Volatility index 100",
   "showInstrumentName": true,
   "timePeriod": "1m",
   "type": "candlestick",
   "indicators": [],
   "overlays": []
});
const chart2 =  wtcharts.chartWindow.addNewChart($('#container2'), {
  "instrumentCode": "R_50",
  "instrumentName": "Volatility index 50",
  "showInstrumentName": true,
  "timePeriod": "1t",
  "type": "line",
  "indicators": [],
  "overlays": [],
  "delayAmount": 0
});


chart.events.anyChange = () => console.warn(chart.data());
chart2.events.anyChange = () => console.warn(chart.data()); 


// This is a test for a timing issue in need to fix.
const run_timing_issue_test = () => {
   const configs = [
      {
         "type": "line",
         "timePeriod": "1m",
         "instrumentCode": "RDBULL",
         "instrumentName": "Bull Market Index",
         "showInstrumentName": true, // default is false
         "showOverlays": false, // default is true
         "indicators": [
            {
               "id": "cks",
               "name": "Chande Kroll Stop",
               "options": {
                  "period": 10, "maxMinPeriod": 20,
                  "multiplier": 3, "longStopStroke": "#00C176",
                  "shortStopStroke": "#FF003C", "strokeWidth": 1,
                  "dashStyle": "Solid"
               }
            },
         ],
      },
      {
         "instrumentCode": "GDAXI",
         "instrumentName": "German Index",
         "timePeriod": "1d",
         "type": "candlestick",
         "indicators": [],
         "overlays": []
      }
   ];

   let chart = null;
   const rerender = () => {
      chart && chart.actions.destroy();
      const config = configs[Math.random() > 0.5 ? 1 : 0];
      chart =  wtcharts.chartWindow.addNewChart($parent, config);
      const timeout = Math.random()*2500;
      console.warn(timeout | 0);
      if(!window.stop_test)
         setTimeout(rerender, timeout | 0);
   };
   rerender();
}; 
// run_timing_issue_test();

const run_display_results_test = () => {
   const add_stuff_to_chart = (epoch, quote, chart) => {
      const rand = Math.random();
      if(rand < .1)
         chart.draw.startTime(epoch*1000);
      else if(rand < .2)
         chart.draw.entrySpot(epoch*1000);
      else if(rand < .3)
         chart.draw.endTime(epoch*1000);
      else if(rand < .4)
         chart.draw.exitSpot(epoch*1000);
      else if(rand < .5) {
         chart.draw.barrier({ from: epoch*1000, value: quote });
         setTimeout(() => {
            chart.draw.barrier({ from: epoch*1000, to: (epoch+30)*1000, value: quote });
         }, 30*1000);
      }
   };
   wtcharts.liveapi.events.on('ohlc', (e, data) => {
      const epoch = data.ohlc.epoch*1;
      const quote = data.ohlc.close*1;
      if(data.ohlc.symbol === 'R_50')
         add_stuff_to_chart(epoch, quote, chart2);
   });
   wtcharts.liveapi.events.on('tick', (e, data) => {
      const epoch = data.tick.epoch*1;
      const quote = data.tick.quote*1;
      add_stuff_to_chart(epoch, quote, chart2);
   });
}

