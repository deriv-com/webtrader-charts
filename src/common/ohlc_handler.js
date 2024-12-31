import $ from 'jquery';
import liveapi from './liveapi.js';
import chartingRequestMap from './chartingRequestMap.js';
import { convertToTimeperiodObject, isTick, i18n } from './utils.js';
import notification from './notification.js';

const barsTable = chartingRequestMap.barsTable;

const processCandles = (key, time, open, high, low, close) => {
   let bar = barsTable.find({time: time, instrumentCdAndTp: key});
   if (bar) {
      bar.open = open;
      bar.high = high;
      bar.low = low;
      bar.close = close;
      barsTable.update(bar);
   } else {
      barsTable.insert({
         instrumentCdAndTp : key,
         time: time,
         open: open,
         high: high,
         low: low,
         close: close
      });
   }
};

liveapi.events.on('candles', (e, data) => {
   const start = data.echo_req.count === 0 ? data.echo_req.start : undefined;
   const key = chartingRequestMap.keyFor(data.echo_req.ticks_history, data.echo_req.granularity*1, start);
   data.candles.forEach((eachData) => {
      const open  = parseFloat(eachData.open),
         high  = parseFloat(eachData.high),
         low   = parseFloat(eachData.low),
         close = parseFloat(eachData.close),
         time  = parseInt(eachData.epoch) * 1000;
      processCandles(key, time, open, high, low, close);
   });
   chartingRequestMap.barsLoaded(key);
});

liveapi.events.on('history', (e, data) => {
   //For tick history handling
   const start = data.echo_req.count === 0 ? data.echo_req.start : undefined;
   const key = chartingRequestMap.keyFor(data.echo_req.ticks_history, 0, start);

   // add subscription id to the map in order to be able to unsubscribe
   const chartingRequest = chartingRequestMap.mapFor(key);
   chartingRequest.id = chartingRequest.id || data?.subscription?.id;

   data.history.times.forEach((eachData,index) => {
      const time = parseInt(eachData) * 1000,
         price = parseFloat(data.history.prices[index]);
      processCandles(key, time, price, price, price, price);    
   });
   chartingRequestMap.barsLoaded(key);
});

/**
 * @param timePeriod
 * @param instrumentCode
 * @param containerIDWithHash
 * @param instrumentName
 * @param series_compare
 */
export const retrieveChartDataAndRender = (options) => {
   const timePeriod = options.timePeriod,
      instrumentCode = options.instrumentCode,
      containerIDWithHash = options.containerIDWithHash,
      instrumentName = options.instrumentName,
      series_compare = options.series_compare;

   const key = chartingRequestMap.keyFor(instrumentCode, timePeriod, options.start);
   if (chartingRequestMap.mapFor(key)) {
      /* Since streaming for this instrument+timePeriod has already been requested,
                   we just take note of containerIDWithHash so that once the data is received, we will just
                   call refresh for all registered charts */
      chartingRequestMap.subscribe(key, {
         containerIDWithHash : containerIDWithHash,
         series_compare : series_compare,
         instrumentCode : instrumentCode,
         instrumentName : instrumentName
      });
      /* We still need to call refresh the chart with data we already received
                   Use local caching to retrieve that data.*/
      chartingRequestMap.barsLoaded(key);
      return Promise.resolve();
   }

   const dialog_id = containerIDWithHash.replace('_chart', '');

   const is_tick = isTick(timePeriod);
   const done_promise = chartingRequestMap.register({
      symbol: instrumentCode,
      granularity: timePeriod,
      style: !is_tick ? 'candles' : 'ticks',
      delayAmount: options.delayAmount,
      count: options.count || 1000, //We are only going to request 1000 bars if possible
      adjust_start_time: 1,
      start: options.start,
      end: options.end,
   }, dialog_id)
      .then((data) => {
         if(options.start) {
            const count = is_tick ? data.history.times.length : data.candles.length;

            if (count === 0) { 
                const msg = i18n("There is no historical data available!");
                notification.error(msg, dialog_id);
                const chart = $(containerIDWithHash).highcharts();
                chart && chart.showLoading(msg);
            }
            return;
         }
         
         let needs_timer = data && !data.error;
         needs_timer = needs_timer && options.delayAmount > 0; // chart is not delayed
         needs_timer = needs_timer && !options.start; // it's not historical data
         if (needs_timer) {
            notification.warning(
                  `${instrumentName} ${i18n('feed is delayed by')} ${options.delayAmount} ${i18n('minutes')}`,
                  dialog_id
            );

            if(!chartingRequestMap.mapFor(key)) {
               return;
            }
            //start the timer
            chartingRequestMap.mapFor(key).timerHandler = setInterval(() => {
               let lastBar = barsTable.query({instrumentCdAndTp : key, take: 1, reverse: true });
               if (lastBar && lastBar.length > 0) {
                  lastBar = lastBar[0];
                  //requests new bars
                  //Send the WS request
                  const requestObject = {
                     "ticks_history": instrumentCode,
                     "end": 'latest',
                     //"count": count,
                     "start": (lastBar.time/1000) | 0,
                     "granularity":  convertToTimeperiodObject(timePeriod).timeInSeconds()
                  };
                  liveapi.send(requestObject);
               }
            }, 60*1000);
         }
      });

   chartingRequestMap.mapFor(key).chartIDs.push({
      containerIDWithHash : containerIDWithHash,
      series_compare : series_compare,
      instrumentCode : instrumentCode,
      instrumentName : instrumentName
   });
   return done_promise;
}

export default {
   retrieveChartDataAndRender,
};
