import $ from 'jquery';
import _ from 'lodash';
import rv from 'rivets';
import 'jquery-ui/ui/widgets/slider';
import './lib/jquery.ddslick.js';
import 'vanderlee-colorpicker';

rv.binders['attr-*'] = {
   priority: 10*1000,
   routine: function(el,value) {
      el.setAttribute(this.args[0],value)
   }
}
rv.binders.slider = {
   priority: 95,
   publishes: true,
   bind: function (el) {
      const div = $(el);
      const handle = $('<div class="ui-slider-handle"></div>');
      div.append(handle);

      const publish = this.publish;
      const model = this.model;

      div.slider({
         step: div.attr('step')*1 || 1,
         min: div.attr('min') === undefined ? 1 : div.attr('min')*1,
         max: div.attr('max')*1 || 100,
         create: function() {
            handle.text($(this).slider("value"));
         },
         slide: ( event, ui ) => {
            handle.text(ui.value);
            model.value = ui.value*1;
         }
      });
   },
   unbind: (el) => $(el).slider('destroy'),
   routine: (el, value) => {
      $(el).slider('value', value);
      $(el).find('> div').text(value);
   }
}
rv.binders['color-picker'] = {
   priority: 96,
   publishes: true,
   bind: function (el) {
      const input = $(el);

      const publish = this.publish;
      const model = this.model;
      const color = model.value || '#cd0a0a';

      const altField = $('<div style="width:100%;"/>');
      input.after(altField);

      input.colorpicker({
         showOn: 'alt',
         altField: altField,
         position: {
            my: "left-100 bottom+5",
            of: "element",
            collision: "fit"
         },
         parts:  [ 'map', 'bar' ],
         alpha:  true,
         layout: {
            map: [0, 0, 2, 2],
            bar: [2, 0, 1, 2],
         },
         colorFormat: "RGBA",
         part: { map: {size: 128}, bar: {size: 128} },
         select: (event, color) => publish(color)
      });

      setTimeout(() => {
         parent = input.scrollParent();
         parent.scroll(
            () => input.colorpicker('close')
         );
      }, 1000);
   },
   unbind: (el) => { },
   routine: (el, value) => { }
}
rv.binders.ddslick = {
   priority: 101,
   publishes: true,
   bind: function (el) {
      const publish = this.publish,
         model = this.model,
         select = $(el);
      const parent = select.parent();
      const values = select.find('option').map((inx, opt) => $(opt).val()).get();

      const update = (value) => {
         const inx = values.indexOf(value);

         parent.find('.dd-select input').val(value);
         const selected_img = parent.find('img.dd-selected-image');
         const img = parent.find('img')[inx+1];

         selected_img.attr('src', $(img).attr('src'));
      }

      el._update = update;

      let model_value = model.value;
      select.ddslick({
         imagePosition: "left",
         data: [],
         // width: 155,
         background: "white",
         onSelected: (data) => {
            let value = data.selectedData.value
            value = model_value || value;
            model_value = null;
            model.value = value;
            update(value);
         }
      });
   },
   unbind: (el) => $(el).ddslick('destroy'),
   routine: (el, value) => el._update(value)
};
rv.binders['is-valid-number'] = {
   priority: 100,
   publishes: true,
   bind: function (el) {
      const prop = this.keypath.split('.')[1];
      const model = this.model;
      const $input = $(el);
      const reg = /^(?!0\d)\d*(\.\d{1,4})?$/;

      $input.on('input', () => {
         const val = $input.val();
         const is_ok = reg.test(val);

         model[prop] = is_ok && val !== '';
      });
   },
   unbind: (el) => { },
   routine: (el, value) => { }
};
rv.binders['css-*'] = function (el, value) {
   console.warn(this.model, value);
   const style = {};
   style[this.args[0]] = value;
   $(el).css(style);
}

rv.formatters.eq = (value, other) => value === other;
rv.formatters['negate'] = (value) => !value;
rv.formatters['bind'] = (fn, value) => fn.bind(undefined, value);
rv.formatters['ternary'] = (condition, first, second) => condition ? first : second;
rv.formatters['prepend'] = (value, other) => (other && value) ? other + value : value;
rv.formatters['append'] = (value, other) => (other && value) ? value + other : value;

