import $ from 'jquery';
import _ from 'lodash';
import rv from 'rivets';
import 'spectrum-colorpicker';
import 'spectrum-colorpicker/spectrum.css';
import '../lib/jquery.ddslick.js';
import {i18n} from './utils.js';

rv.binders['attr-*'] = {
   priority: 10*1000,
   routine: function(el,value) {
      el.setAttribute(this.args[0],value)
   }
}
rv.binders.range = {
   priority: 95,
   publishes: true,
   bind: function (el) {
      const input = $(el);
		input.parent().css({position: 'relative'});
		input.css({position: 'relative', top: '8px'});
      const handle = $('<div style="position: absolute; top: -4px; font-size: 12px;"></div>');
		handle.insertAfter(input);

		const update =  () => {
			const min = (input.attr('min') || 0)*1;
			const max = (input.attr('max') || 0)*1;
			const val = input.val()*1;
			handle.text(val);
			const left = ((val-min)/(max - min))*(input.width()-16) + 16 - handle.width()/2;
			handle.css({left: `${left.toFixed(2)}px`});
		};
		input.on('change input', update);
		setTimeout(() => update(), 1000);
   },
   unbind: (el) => { },
   routine: (el, value) => { }
}
rv.binders['color-picker'] = {
   priority: 96,
   publishes: true,
   bind: function (el) {
      const input = $(el);

      const model = this.model;
      const color = model.value || '#cd0a0a';

      input.scrollParent().on('scroll', () => input.spectrum('hide'));
      input.spectrum({
         color: color,
         showButtons: false,
         move: (color) => {
            const rgba = color.toRgb();
            model.value = `rgba(${rgba.r},${rgba.g},${rgba.b},${rgba.a})`;
         }
      });
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
   const style = {};
   style[this.args[0]] = value;
   $(el).css(style);
}
rv.binders['show'] = (el, value) => {
   el.style.display = value ? '' : 'none';
   return value;
};
rv.binders['visible'] = (el, value) => {
   el.style.visibility = value ? 'visible' : 'hidden';
   return value;
};

rv.formatters.eq = (value, other) => value === other;
rv.formatters['negate'] = (value) => !value;
rv.formatters['bind'] = (fn, value) => fn.bind(undefined, value);
rv.formatters['ternary'] = (condition, first, second) => condition ? first : second;
rv.formatters['prepend'] = (value, other) => (other && value) ? other + value : value;
rv.formatters['append'] = (value, other) => (other && value) ? value + other : value;
rv.formatters['prop'] = (value, prop) => value && value[prop];
rv.formatters['bind'] = (fn, value) => fn.bind(undefined, value);
rv.formatters['i18n'] = i18n;
rv.formatters.contains = (str, substr) => str.indexOf(substr) !== -1 ? true : false;


// shim for jquery-ui scrollParent
$.fn.scrollParent = $.fn.scrollParent || function (e){
	var i=this.css("position"),
	s="absolute"===i,
	n=e?/(auto|scroll|hidden)/:/(auto|scroll)/,
	o=this.parents().filter(function(){
		var e=$(this);return s&&"static"===e.css("position")?!1:n.test(e.css("overflow")+e.css("overflow-y")+e.css("overflow-x"))
	}).eq(0);
	return"fixed"!==i&&o.length?o:$(this[0].ownerDocument||document);
}
