import _ from 'lodash';
import $ from 'jquery';
import {i18n, isTick} from './common/utils.js';
import Highcharts from 'highstock-release/highstock';

const Store = { }; // 

export const draw = {
   zoomTo: (chart, epoch) => {
      const axis = chart.xAxis[0];
      const {min,max, dataMin, dataMax} = axis.getExtremes();
      const interval = 6000;
      if(epoch >= max)
         axis.setExtremes(Math.max(min, epoch - 10*interval), Math.min(epoch + 10*interval, dataMax));
   },
   clear: (dialog) => {
      const container = dialog.find(`#${dialog.attr('id')}_chart`);
      const chart = container.highcharts();

      const id = `#${dialog.attr('id')}_chart`;
      if(!Store[id]) { return ; }

      _.each(Store[id].barriers, conf => {
        chart.yAxis[0].removePlotLine(conf.id);
      });

      chart.xAxis[0].removePlotLine('plot-line-start-time');
      chart.xAxis[0].removePlotLine('plot-line-end-time');

     dialog.find('.chart-view').addClass('hide-subtitle');
     const points = chart && chart.series[0] && chart.series[0].data;
     for (let i = points.length - 1; i >= 0; i--) {
       const point = points[i];
       if (point && point.marker) {
         point.update({ marker: { enabled: false} });
       }
     }
      delete Store[id];
   },
   verticalLine: (dialog, options) => {
      const container = dialog.find(`#${dialog.attr('id')}_chart`);
      const chart = container.highcharts();
      const is_tick = isTick(container.data('timePeriod'));

      const id = `#${dialog.attr('id')}_chart`;
      Store[id] = Store[id] || { points: [], plotLines: [], barriers: { } };
      if(_.find(Store[id].plotLines, options)) { return; }
      Store[id].plotLines.push(options);

      // if(chart && is_tick) {
      if(chart) {
         draw.zoomTo(chart, options.value);
         dialog.find('.chart-view').removeClass('hide-subtitle');
         chart.xAxis[0].addPlotLine(options);
      }
   },
   startTime: (dialog, epoch) => draw.verticalLine(dialog, { value: epoch, color: '#e98024', width: 2, id: 'plot-line-start-time' }),
   endTime: (dialog, epoch) => draw.verticalLine(dialog, { value: epoch, color: '#e98024', width: 2, dashStyle: 'Dash', id: 'plot-line-end-time' }),
   point: (dialog, {value, color = 'orange'}) => {
      const container = dialog.find(`#${dialog.attr('id')}_chart`);
      const chart = container.highcharts();

      const marker = { fillColor: color, lineColor: 'orange', lineWidth: 3, radius: 4, states: { hover: { fillColor: color, lineColor: 'orange', lineWidth: 3, radius: 4 } } };
      const is_tick = isTick(container.data('timePeriod'));

      const id = `#${dialog.attr('id')}_chart`;
      Store[id] = Store[id] || { points: [], plotLines: [], barriers: { } };

      if(_.find(Store[id].points, {x: value})) { return; }
      Store[id].points.push({x: value, marker: marker});

      if(is_tick) {
         dialog.find('.chart-view').removeClass('hide-subtitle');
         const points = chart && chart.series[0] && chart.series[0].data;
         draw.zoomTo(chart, value);
         for (let i = points.length - 1; i >= 0; i--) {
            const point = points[i];
            if (point && point.x && value === point.x) {
               point.update({ marker: marker });
               return;
            }
         }
      }
   },
   exitSpot: (dialog, epoch) => draw.point(dialog, { value: epoch, color: 'orange' }),
   entrySpot: (dialog, epoch) => draw.point(dialog, { value: epoch, color: 'white' }),
   barrier: (dialog, { value }) => {
      const container = dialog.find(`#${dialog.attr('id')}_chart`);
      const chart = container.highcharts();

      const is_tick = isTick(container.data('timePeriod'));
      const storeId = `#${dialog.attr('id')}_chart`;
      const id = `barrier-${value}`;

      Store[storeId] = Store[storeId] || { points: [], plotLines: [], barriers: { } };

      if(Store[storeId].barriers[id]) {
        return;
      }

     const conf = {
       id: id,
       color: 'green',
       dashStyle: 'solid',
       width: 1,
       value: value,
       zIndex: 5,
       textAlign: 'left',
       label: {
         align: 'left',
         text:  'barrier: ' + value,
         style: {
           'display': 'inline-block',
           'background': 'green', // used in charts.scss selectors ([style*="green"]) ¯\_(ツ)_/¯
           'color' : 'white',
           'font-size': '10px',
           'line-height': '14px',
           'padding' : '0 4px',
         },
         x: 0,
         y: 4,
         useHTML: true,
       }
     };

      Store[storeId].barriers[conf.id] = conf;
      // if(is_tick) {
         // const compare = chart.series[0] && chart.series[0].userOptions.compare;
         // conf.compare = compare;
         dialog.find('.chart-view').removeClass('hide-subtitle');
         chart.yAxis[0].addPlotLine(conf);
      // }
   }
};

export const restore = (is_tick, chart, id) => {
   if(is_tick) {
      Store[id] = Store[id] || { points: [], plotLines: [], barriers: { } };
      const drawn = Store[id];
      chart.xAxis[0] && drawn.plotLines.forEach(p => chart.xAxis[0].addPlotLine(p));

      const pointXs = drawn.points.map(p => p.x);
      chart.series[0] && chart.series[0].data.forEach(p => {
         const inx = _.sortedIndexOf(pointXs, p.x);
         if(inx !== -1)
            p.update({marker: drawn.points[inx].marker});
      });

      _.each(drawn.barriers, conf => {
         chart.yAxis[0].addPlotLine(conf);
      });
   }
   else {
      $(id).closest('.chart-view').addClass('hide-subtitle');
   }
};

export default {
   draw: draw,
   restore: restore
};
