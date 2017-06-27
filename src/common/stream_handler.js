import $ from 'jquery';
import liveapi from './liveapi.js';
import {barsTable, default as chartingRequestMap  } from './chartingRequestMap.js';
import {isDataTypeClosePriceOnly} from './utils.js';

const setExtremePointsForXAxis = (chart, startTime, endTime) => {
   chart.xAxis.forEach((xAxis) => {
      if (!startTime) startTime = xAxis.getExtremes().min;
      if (!endTime) endTime = xAxis.getExtremes().max;
      xAxis.setExtremes(startTime, endTime);
   });
}

liveapi.events.on('tick', (e, data) => {
   const start = data.echo_req.end !== 'latest' ? data.echo_req.start : undefined;
   let key = chartingRequestMap.keyFor(data.echo_req.ticks_history, data.echo_req.granularity*1, start);
   if (key && chartingRequestMap.mapFor(key)) {

      const price = parseFloat(data.tick.quote);
      const time = parseInt(data.tick.epoch) * 1000;

      const chartingRequest = chartingRequestMap.mapFor(key);
      const granularity = data.echo_req.granularity || 0;
      chartingRequest.id = chartingRequest.id || data.tick.id;

      if(granularity === 0) {
         const tick = {
            instrumentCdAndTp: key,
            time: time,
            open: price,
            high: price,
            low: price,
            close: price,
            /* this will be used from trade confirmation dialog */
            price: data.tick.quote, /* we need the original value for tick trades */
         }
         barsTable.insert(tick);
         /* notify subscribers */
         let preTick = tick;
         const bars = barsTable.query({ instrumentCdAndTp: key, take: 2, reverse: true });
         if (bars.length > 1)
            preTick = bars[1];
         events.trigger('tick', [{ tick: tick, key: key, preTick: preTick }]);

         if (!(chartingRequest.chartIDs && chartingRequest.chartIDs.length > 0)) {
            return;
         }
         //notify all registered charts
         for(let i = 0; i < chartingRequest.chartIDs.length; i++) {
            const chartID = chartingRequest.chartIDs[i];
            const chart = $(chartID.containerIDWithHash).highcharts();
            if (!chart) return;

            const series = chart.get(key);
            if (!series) return;

            series.addPoint([time, price]);
            //setExtremePointsForXAxis(chart, time);
         };
      }
   }
});

liveapi.events.on('ohlc', (e, data) => {
   const start = data.echo_req.end !== 'latest' ? data.echo_req.start : undefined;
   let key = chartingRequestMap.keyFor(data.ohlc.symbol, data.ohlc.granularity*1, start);
   if (key && chartingRequestMap.mapFor(key)) {

      const open = parseFloat(data.ohlc.open);
      const high = parseFloat(data.ohlc.high);
      const low = parseFloat(data.ohlc.low);
      const close = parseFloat(data.ohlc.close);
      const time = parseInt(data.ohlc.open_time) * 1000;

      const chartingRequest = chartingRequestMap.mapFor(key);
      chartingRequest.id = chartingRequest.id || data.ohlc.id;
      if (!(chartingRequest.chartIDs && chartingRequest.chartIDs.length > 0)) {
         return;
      }
      const timePeriod = $(chartingRequest.chartIDs[0].containerIDWithHash).data('timePeriod');
      if (!timePeriod) {
         return;
      }

      let bar = barsTable.find({ instrumentCdAndTp: key, time: time });
      let isNew = false;
      if (!bar) {
         bar = {
            instrumentCdAndTp: key,
            time: time,
            open: open,
            high: high,
            low: low,
            close: close
         };
         barsTable.insert(bar);
         isNew = true;
      } else {
         bar.open = open;
         bar.high = high;
         bar.low = low;
         bar.close = close;
         barsTable.update(bar);
      }

      let preOhlc = bar;
      const bars = barsTable.query({ instrumentCdAndTp: key, take: 2, reverse: true });
      if (bars.length > 1) {
         preOhlc = bars[1];
      }
      /* notify subscribers */
      events.trigger('ohlc', [{ ohlc: bar, is_new: isNew, key: key, preOhlc: preOhlc }]);

      //notify all registered charts
      for(let i = 0;i < chartingRequest.chartIDs.length; i++){
         const chartID = chartingRequest.chartIDs[i];
         const chart = $(chartID.containerIDWithHash).highcharts();
         if (!chart) return;

         const series = chart.get(key);
         if (!series) return;

         const type = $(chartID.containerIDWithHash).data('type');

         const last = series.data[series.data.length - 1];
         if (series.options.data.length != series.data.length) {
            //TODO - This is an error situation
            setExtremePointsForXAxis(chart, null, bar.time);
            return;
         }

         if (type && isDataTypeClosePriceOnly(type)) {//Only update when its not in loading mode
            if (isNew) {
               series.addPoint([time, close], true, true, false);
            } else {
               last.update({
                  y : close
               });
            }
         } else {
            if (isNew) {
               series.addPoint([time, open, high, low, close], true, true, false);
            } else {
               last.update({
                  open : open,
                  high : high,
                  low : low,
                  close : close
               });
            }
         }
      };
   }
});

export const events = $('<div/>'); // use jquery in memory object for events.
export default {
   events
};
