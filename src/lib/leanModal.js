import $ from 'jquery';
import './leanModal.scss';

$.fn.extend({ 
	leanModal: function(options) {

		var defaults = {
			top: 100,
			title: '',
			width: 350,
			height: 400,
			buttons: null,
		}

		options =  $.extend(defaults, options);

		return this.each(function() {

			const modal = $(this);
			const overlay = $('<div id="lean_overlay"></div>');
			const titlebar = $(`<div class='lean_overlay_titlebar'><span>${options.title}</span><span class='close'></span></div>`);

			overlay.append(titlebar);
			overlay.append(modal);
			$('body').append(overlay);

			var o = options;

			titlebar.find('.close').click(() => close_modal(modal, options));
			$("#lean_overlay").click(function(e) {
				if(e.target === this)
					close_modal(modal, options);
			});

			$('#lean_overlay').css({ 'display' : 'block', background : 'rgba(0,0,0,0.5)', opacity: 0 });
			$('#lean_overlay').fadeTo(200, 1);

			modal.css({ 
				width: `${o.width}px`,
				height: `${o.height}px`,
				display : 'block',
				position : 'fixed',
				opacity: 0,
				left : '50%',
				top : `${o.top}px`,
				'box-sizing': 'border-box',
				'z-index': 11000,
				'margin-left' : -(o.width/2) + 'px'
			});
			titlebar.css({
				'margin-left' : -(o.width/2) + 'px',
				top : (o.top - 29) + 'px',
				width: o.width + 'px'
			});

			if(o.buttons) {
				const buttonpane = $('<div class="lean_overlay_buttonpane"></div>"');
				o.buttons.forEach(btn => {
					const button = $('<div></div>');
					button.text(btn.text);
					button.on('click', btn.click);
					buttonpane.append(button);
				});
				buttonpane.css({
					'margin-left' : -(o.width/2) + 'px',
					top : (o.top + o.height) + 'px',
					width: o.width + 'px'
				});
				overlay.append(buttonpane);
			}

			modal.fadeTo(200,1);
			modal.on('close', () => close_modal(modal, options));
		});

		function close_modal(modal, options){
			options.onClose && options.onClose();
			modal.remove();
			$("#lean_overlay").remove();
		}
	}
});
