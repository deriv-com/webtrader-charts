/**
 * Created by amin january 21, 2016.
 */

import $ from 'jquery';
import moment from 'moment';
import rv from 'rivets';
import chartingRequestMap from './common/chartingRequestMap.js';
import stream_handler from './common/stream_handler.js';
import images from './images/images.js';
import {isTick, toFixed} from './common/utils.js';
import html from './tableView.html';
import './tableView.scss';
import './common/rivetsExtra.js';

const barsTable = chartingRequestMap.barsTable;

const show_table_view = (dialog, instrumentCode, state) => {
   const table = dialog.find('.table-view');
   const chart = dialog.find('.chart-view');
   dialog.find('span.close').css('display', 'block');
   table.animate({left: '0'}, 250);
   chart.animate({left: '-100%'}, 250);
   refresh_table(dialog, instrumentCode, state);

   dialog.view_table_visible = true;
   /* let stream_handler new ohlc or ticks update the table */
}

const hide_table_view = (dialog) => {
   const table = dialog.find('.table-view');
   const chart = dialog.find('.chart-view');
   dialog.find('span.close').css('display', 'none');
   table.animate({left: '100%'}, 250);
   chart.animate({left: '0'}, 250);
   dialog.view_table_visible = false;
}

const getColumns = (is_tick) => {
   if (is_tick) { /* for tick charts only show Date,Tick */
      return [ 'Date', 'Tick', 'Change', '' ];
   }
   return [ 'Date', 'Open', 'High', 'Low', 'Close', 'Change', '' ]; // OHLC
}

const refresh_table = (dialog, instrumentCode, state) => {
   const data = dialog.find('#' + dialog.attr('id') + '_chart').data();
   const is_tick = isTick(data.timePeriod);
   const table = dialog.find('.table-view');
   const bars = barsTable
      .chain()
      .find({instrumentCdAndTp: chartingRequestMap.keyFor(instrumentCode, data.timePeriod)})
      .simplesort('time', true)
      .limit(100)
      .data();
   const rows = bars.map((bar, index) => {
      //The bars list has been sotrted decending by time
      const preBar = index == bars.length - 1 ? bars[index] : bars[index + 1];
      if (is_tick) {
         const diff = findDiff(preBar.open, bar.open);
         return {
            time: state.renderDate(bar.time),
            open: bar.open,
            diff: diff
         };
      }
      const diff = findDiff(preBar.close, bar.close);
      return {
         time: state.renderDate(bar.time),
         open: bar.open,
         high: bar.high,
         low: bar.low,
         close: bar.close,
         diff: diff
      };
   });

   state.is_tick = is_tick;
   state.thead = getColumns(is_tick);

   state.tbody.splice(0);
   state.tbody.push(...rows);
};

const findDiff = (firstNumber, secondNumber) => {
   /*Calculation = ( | V1 - V2 | / |V1| )* 100 */
   const diff = toFixed(Math.abs(firstNumber - secondNumber), 4);
   const percentage_diff = toFixed((Math.abs(firstNumber - secondNumber) / Math.abs(firstNumber)) * 100, 2);
   const is_up = firstNumber <= secondNumber;
   return {
      is_up: is_up,
      show_up_arrow: (diff !== 0) &&  is_up,
      show_down_arrow: (diff !== 0) && !is_up,
      change: diff + '(' + percentage_diff + '%)',
   };
};

export const init = (dialog, offset) => {
   offset = offset ? offset *(-1) : 0;
   const container = dialog.find('.table-view');
   const data = dialog.find('#' + dialog.attr('id') + '_chart').data();
   const is_tick = isTick(data.timePeriod);
   const close = dialog.find('span.close');
   close.on('click', () => hide_table_view(dialog));
   /* hide the dialog on close icon click */

   let root = $(html);
   root.appendTo(container);

   const state = {
      renderDate: (epoch) => moment.utc(epoch).utcOffset(offset).format('YYYY-MM-DD HH:mm:ss'),
      is_tick: is_tick,
      thead: getColumns(is_tick),
      tbody: []
   };

   const on_tick = stream_handler.events.on('tick', (e, d) => {
      if (d.key !== chartingRequestMap.keyFor(data.instrumentCode, data.timePeriod)) return;
      if (!dialog.view_table_visible) return;
      const tick = d.tick;
      const diff = findDiff(d.preTick.open, tick.open);
      const row = {
         time: state.renderDate(tick.time),
         open: tick.open,
         diff: diff
      };
      state.tbody.unshift(row);
   });

   const on_ohlc = stream_handler.events.on('ohlc', (e, d) => {
      if (d.key !== chartingRequestMap.keyFor(data.instrumentCode, data.timePeriod)) return;
      if (!dialog.view_table_visible) return;
      const ohlc = d.ohlc;
      const diff = findDiff(d.preOhlc.close, ohlc.close);
      const row = {
         time: state.renderDate(ohlc.time),
         open: ohlc.open,
         high: ohlc.high,
         low: ohlc.low,
         close: ohlc.close,
         diff: diff
      };
      if (d.is_new) {
         state.tbody.unshift(row);
      }
      else {
         [].splice.call(state.tbody, 0, 1);
         state.tbody.unshift(row);
      }
   });

   dialog.on('dialogdestroy', () => {
      stream_handler.events.off('tick', on_tick);
      stream_handler.events.off('ohlc', on_ohlc);
      view &&  view.unbind();
      view = null;
      root && root.remove();
      root = null;
   });

   let view = rv.bind(root[0], state);

   return {
      show: () => show_table_view(dialog, data.instrumentCode, state),
      hide: () => hide_table_view(dialog)
   }
}

export default { init };
