import _ from 'lodash';
import $ from 'jquery';
import {i18n, isTick} from './common/utils.js';
import Highcharts from 'highstock-release/highstock';

const Store = { }; // 

export const draw = {
   zoomTo: (chart, epoch) => {
      const axis = chart.xAxis[0];
      const {min,max, dataMin, dataMax} = axis.getExtremes();
      const interval = 2000;
      if(epoch >= max)
         axis.setExtremes(min, Math.min(epoch + 10*interval, dataMax));
   },
   verticalLine: (dialog, options) => {
      const container = dialog.find(`#${dialog.attr('id')}_chart`);
      const chart = container.highcharts();
      const is_tick = isTick(container.data('timePeriod'));

      const id = `#${dialog.attr('id')}_chart`;
      Store[id] = Store[id] || { points: [], plotLines: [], barriers: { } };
      Store[id].plotLines.push(options);

      if(chart && is_tick) {
         dialog.find('.chart-view').removeClass('hide-subtitle');
         chart.xAxis[0].addPlotLine(options);
      }
   },
   startTime: (dialog, epoch) => draw.verticalLine(dialog, { value: epoch, color: '#e98024', width: 2 }),
   endTime: (dialog, epoch) => draw.verticalLine(dialog, { value: epoch, color: '#e98024', width: 2, dashStyle: 'Dash' }),
   point: (dialog, {value, color = 'orange'}) => {
      const container = dialog.find(`#${dialog.attr('id')}_chart`);
      const chart = container.highcharts();

      const marker = { fillColor: color, lineColor: 'orange', lineWidth: 3, radius: 4, states: { hover: { fillColor: color, lineColor: 'orange', lineWidth: 3, radius: 4 } } };
      const is_tick = isTick(container.data('timePeriod'));

      const id = `#${dialog.attr('id')}_chart`;
      Store[id] = Store[id] || { points: [], plotLines: [], barriers: { } };
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
   barrier: (dialog, { value, from, to = null }) => {
      const container = dialog.find(`#${dialog.attr('id')}_chart`);
      const chart = container.highcharts();

      const is_tick = isTick(container.data('timePeriod'));
      const storeId = `#${dialog.attr('id')}_chart`;
      const id = `barrier-${from}`;
      const idFixed = `${id}-fixed`;

      Store[storeId] = Store[storeId] || { points: [], plotLines: [], barriers: { } };

      if(Store[storeId].barriers[id]) {
         chart.get(id) && chart.get(id).remove(); // remove if already exists.
         delete Store[storeId].barriers[id];
      }

      const conf = {
         type: 'line',
         id: to ? idFixed : id,
         isFixed: !!to,
         value: value,
         from: from,
         to: to,
         isBarrier: true,
         color: 'green',
         connectNulls: true,
         marker: {enabled: false},
         enableMouseTracking: false,
         data: [
            {
               y: value,
               x: from,
               dataLabels: { enabled: true, className: 'highlight', format: `barrier ${value}`, crop: false, overflow: 'none' }
            },
            {
               y: value,
               x: Math.max(to || chart.xAxis[0].getExtremes().dataMax, from)
            }
         ]
      };

      Store[storeId].barriers[conf.id] = conf;
      if(is_tick) {
         const compare = chart.series[0] && chart.series[0].userOptions.compare;
         conf.compare = compare;
         dialog.find('.chart-view').removeClass('hide-subtitle');
         chart.addSeries(conf);
      }
   }
};

Highcharts.wrap(Highcharts.Series.prototype, 'addPoint', function(proceed, options, redraw, shift, animation) {
   proceed.call(this, options, redraw, shift, animation);
   const chart = this.chart;
   const id = `#${chart.renderTo.id}`;
   Store[id] = Store[id] || { points: [], plotLines: [], barriers: { } };
   _.each(Store[id].barriers, conf => {
      const seri = chart.get(conf.id);
      if(!conf.isFixed && seri) {
         if(this === chart.series[0]) {
            seri.addPoint({x: chart.xAxis[0].getExtremes().dataMax, y: conf.value});
         } 
         conf.data = [conf.data[0], conf.data[1]];
         conf.data[1].x = chart.xAxis[0].getExtremes().dataMax;
      }
   });
});


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
         chart.addSeries(conf);
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
