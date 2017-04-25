import $ from 'jquery';
import {each, find, cloneDeep, minby, maxBy} from 'lodash';
import rv from 'rivets';
import html from './indicatorBuilder.html';
import './indicatorBuilder.scss';
import 'jquery-ui/ui/widgets/dialog';
import './common/rivetsExtra.js';
import images from './images/images.js';

let before_add_callback = null;

const closeDialog = (dialog) => {
   dialog.dialog("destroy").remove();
};

const init = (chart_series, indicator) => {
   return new Promise((resolve) => {

      const $html = $(html);

      const state = {
         id: indicator.id,
         fields: indicator.fields.map(f => ({...f, is_valid: true})),
         levels: indicator.levels, /* optional */
         formula: indicator.formula, /* optional */
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

      const view = rv.bind($html[0], state);

      const options = {
         title: indicator.long_display_name,
         resizable: false,
         width: 350,
         height: 400,
         modal: true,
         dialogClass:'indicator-builder-ui-dialog webtrader-charts-dialog',
         buttons: [
            {
               text: "OK",
               click: () => {
                  const options = { };
                  let fields_are_valid = true;
                  if(!indicator.cdl_indicator) { /* normal indicator */
                     if(state.levels) {
                        options.levels = JSON.parse(JSON.stringify(state.levels.values));
                     }
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
                     // TODO: i18n
                     // $.growl.error({ message: "Invalid parameter(s)!".i18n() });
                     $.growl.error({ message: "Invalid parameter(s)!" });
                     return;
                  }

                  before_add_callback && before_add_callback();

                  //Add indicator for the main series
                  chart_series[0].addIndicator(state.id, options);

                  closeDialog($html);
               }
            },
            {
               text: "Cancel",
               click: () => closeDialog($html)
            }
         ]
      };
      $html.dialog(options);
      // $(".indicator-builder").animate({ scrollTop: 0 }, 800);
      resolve($html);
   });
}

/**
 * @param indicator - indicator options from indicators.json
 * @param chart_series - chart.highcharts().series
 * @param before_add_cb - callback that will be called just before adding the indicator
 */
export const open = (indicator, chart_series, before_add_cb) => {
   before_add_callback = before_add_cb || before_add_callback;

   return init(chart_series, indicator);
}
export default { open };
