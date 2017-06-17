import $ from 'jquery';
import html from './properties_selector.html';
import notification from '../common/notification.js';
import {i18n} from '../common/utils.js';

let win = null;

export const open = (options, callback) => {
   const $html = $(html);
   const table = $html.find("table");
   win = $html.leanModal({
      title: options.title,
      width: 300,
      height: 120,
      onClose: () => { win = null; },
      buttons: [
         { 
            text: i18n('Cancel'),
            click: function() {
               win.trigger('close');
            }
         },
         {
            text: i18n("OK"),
            click: function() {
               let css = { };
               let error = false;
               $html.find('input').each(function(index, ele) {
                  const id = $(ele).attr('id');
                  let value = null;
                  if ($(ele).attr('type') === 'number') {
                     value = $(ele).val();
                     const max = parseInt($(ele).attr('max')),
                        min = parseInt($(ele).attr('min')),
                        name = $(ele).attr('name');
                     value = parseInt(value);
                     if (value > max || value < min) {
                        notification.error(`Please enter a value for "${name}" between ${min} and ${max}.`, '.webtrader-charts-dialog.webtrader-charts-properties-selector-dialog');
                        error = true;
                     }
                  } else {  // colorpicker
                     value = $(ele).attr('rgba');
                  }
                  css[id] = value;
               });
               if (!error) {
                  win.trigger('close');
                  callback(css);
               }
            },
         },
      ]
   });

   options.inputValues.forEach(function(input) {
      let ele, inputElement;
      if (input.type === "colorpicker") {
         inputElement = $("<input type='button' />").attr('id', input.id);
      } else {
         inputElement = $("<input type='" + input.type + "' value='" + input.default+"' class='csspopup_input_width' style = 'width:100px;'" +
            " id='" + input.id + "' name='" + input.name + "'/>");
      }
      if (input.min && input.max) {
         inputElement.attr("min", input.min);
         inputElement.attr("max", input.max);
      }
      ele = $("<tr><td><strong>" + input.name + "</strong></td><td></td></tr>");
      inputElement.appendTo(ele.find('td')[1]);
      $(ele).appendTo(table);

      if (input.type === "colorpicker") {
         inputElement.attr('rgba', `rgba(255,0,0,1)`);
         inputElement.spectrum({
            color: input.default,
            showButtons: false,
            change: (color) => {
               const rgba = color.toRgb();
               inputElement.attr('rgba', `rgba(${rgba.r},${rgba.g},${rgba.b},${rgba.a})`);
            }
         });
      }
   });
}

export default {
   open
}
