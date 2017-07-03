import $ from 'jquery';
import {each, find, cloneDeep, minBy, maxBy} from 'lodash';
import rv from 'rivets';
import html from './indicatorBuilder.html';
import './indicatorBuilder.scss';
import './common/rivetsExtra.js';
import images from './images/images.js';
import notification from './common/notification.js';
import {i18n} from './common/utils.js';

import indicatorImages from './images/indicators/indicatorImages.js';

let before_add_callback = null,
   setting_view = null;

const init = (chart_series, indicator) => {

   return new Promise((resolve) => {
      const $html = $(html);
      $(setting_view).append($html);
      const state = {
         id: indicator.id,
         fields: indicator.fields.map(f => ({...f, is_valid: true})),
         levels: indicator.levels, /* optional */
         formula: indicator.formula && indicatorImages[indicator.formula], /* optional */
         description: indicator.description,
         cdl_indicator: indicator.cdl_indicator, /* optional (cdl indicators only) */
         dash_styles: [
            "Solid", "ShortDash", "ShortDot", "ShortDashDot", "ShortDashDotDot",
            "Dot", "Dash", "LongDash", "DashDot", "LongDashDot", "LongDashDotDot"
         ].map(dash => ({ name: dash, url: images[dash]})),
         update_value(row, value) {
            row.value = value;
         },
         level: {
            dialog: {
               marginTop: '0px',
               visible: false,
               add: () => {
                  const fields = state.levels.fields;
                  const level = { };
                  fields.forEach(field => level[field.key] = field.value);
                  level.label = { text: level.value };
                  level.dashUrl = `url(${images[level.dashStyle]})`;
                  state.levels.values.push(level);
                  state.level.dialog.visible = false;
               },
               cancel: () => { state.level.dialog.visible = false; }
            },
            remove: row => {
               const values = state.levels.values;
               const inx = values.indexOf(row);
               inx !== -1 && values.splice(inx, 1);
            },
            add: (e) => {
               const btn = $(e.target);
               const marginTop =  $html.find('.levels-tr').next().height() - 3;
               state.level.dialog.marginTop = marginTop*-1 + 'px';
               state.level.dialog.visible = !state.level.dialog.visible;
               if(state.level.dialog.visible) {
                  const content = $('.indicator-builder');
                  content.animate({ scrollTop: content.prop('scrollHeight')}, 700);
               }
            }
         }
      };
      if(state.cdl_indicator){
         state.cdl_indicator.image = indicatorImages[state.cdl_indicator.image];
      }

      if(indicator.editable && indicator.current_options) {
         each(indicator.current_options, (opt_val, opt_key) => {
            const field = find(state.fields, {key: opt_key})
            field && (field.value = opt_val);
         });

         if(indicator.current_options.levels) {
            state.levels.values = cloneDeep(indicator.current_options.levels);
         }
      }
      each(state.levels && state.levels.values, (value)  => {
         value.dashUrl = `url(${images[value.dashStyle]})`;
      });

      let view = rv.bind($html[0], state);

      const options = {
         title: indicator.long_display_name,
         width: 350,
         height: 330,
         buttons: [
            {
               text: i18n("Cancel"),
               click: () => win.trigger('close')
            },
            {
               text: i18n("OK"),
               click: 1
            },
         ],
         onClose: () => {
				view && view.unbind();
				view = null;
         }
      };
      state.apply = () => {
         const options = { };
         let fields_are_valid = true;
         if(!indicator.cdl_indicator) { /* normal indicator */
            if(state.levels) {
               options.levels = JSON.parse(JSON.stringify(state.levels.values));
            }
            console.log(state.fields);
            state.fields.forEach(field => {
               fields_are_valid = field.is_valid && fields_are_valid;
               if(field.type !== 'plotcolor') {
                  options[field.key] = field.value
                  return;
               }
               options[field.key] = [];
               if(options.levels && options.levels.length > 0) {
                  options[field.key].push({
                     color: field.value,
                     from: minBy(options.levels, 'value').value,
                     to: maxBy(options.levels, 'value').value
                  });
               }
            });
         }
         else { /* cdl indicator */
            options.cdlIndicatorCode = state.id;
            options.onSeriesID = chart_series[0].options.id
         }

         if(state.id === 'fractal') { /* special case */
            options.onSeriesID = chart_series[0].options.id
         }

         if(!fields_are_valid) {
            notification.error(i18n('Invalid parameter(s)') + '!', '.indicator-builder-ui-dialog.webtrader-charts-dialog');
            return;
         }

         before_add_callback && before_add_callback();

         //Add indicator for the main series
         chart_series[0].addIndicator(state.id, options);
         state.cancel(); // Close Overlay
         return false;
      };
      state.cancel = () => {
         view && view.unbind();
         $(setting_view).closest('.chartOptions_overlay.indicators')
            .parent().find('.chartOptions_button').click();
         return false;
      };
      //const win = $html.leanModal(options);
      resolve($html);
   });
}

/**
 * @param indicator - indicator options from indicators-config.js
 * @param chart_series - chart.highcharts().series
 * @param view - view to add indicator builder to
 * @param cb - callback that will be called just before adding the indicator
 */
export const open = (indicator, chart_series, view, cb) => {
   before_add_callback = cb || before_add_callback;
   setting_view = view;
   return init(chart_series, indicator);
}
export default { open };
