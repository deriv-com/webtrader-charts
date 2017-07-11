import $ from 'jquery';
import _ from 'lodash';
import html from './chartWindow.html';
import charts from './charts.js';
import tableView from './tableView.js';
import chartOptions from './chartOptions.js';
import liveapi from './common/liveapi.js';
import Highcharts from 'highstock-release/highstock';
import {chartableMarkets} from './overlayManagement.js';

const triggerResizeEffects = (dialog) => {
    dialog.find('.chartSubContainer').width("100%");
    //Because of title taking space, we have to reduce height
    dialog.find('.chartSubContainer').height(dialog.height() - 42);
    dialog.trigger('resize-event');
    const containerIDWithHash = '#' + dialog.find('.chartSubContainer').attr('id');
    charts.triggerReflow(containerIDWithHash);
}

const delayAmountFor = (symbol) => chartableMarkets().then(markets => {
   const instrument = _.find(_.flatMap(_.flatMap(markets, 'submarkets'), 'instruments'), {symbol: symbol});
   return (instrument && instrument.delay_amount) || 0;
});

const Store = {};
let idCounter = 0;
export const addNewChart = function($parent, options) {
    const dialog = $(html);
    $parent.addClass('chart-dialog');
    dialog.appendTo($parent);
    const id = `webtrader-charts-dialog-${++idCounter}`;
    dialog.attr('id', id);
    dialog.find('div.chartSubContainerHeader').attr('id', `${id}_header`);
    dialog.find('div.chartSubContainer').attr('id', `${id}_chart`);

    /* tracking the chart, includion indicators & overlyas */
    Store[id] = _.cloneDeep(options);
    Store[id].indicators = Store[id].indicators || [];
    Store[id].overlays = Store[id].overlays || [];

    let timezoneOffset = 0;
    if(_.isNumber(options.timezoneOffset)) {
        Highcharts.setOptions({ global: { timezoneOffset: options.timezoneOffset } });
        timezoneOffset = options.timezoneOffset;
    }

    let drawChartPromise = null;
    const instance = {
       data: () => Store[id],
       actions: {
          reflow: () =>  triggerResizeEffects(dialog),
          destroy: () => {
            dialog.remove();
            const container = dialog.find(`#${id}_chart`);
            const timePeriod = Store[id].timePeriod;
            const instrumentCode = Store[id].instrumentCode
            return drawChartPromise.then(() => {
               table_view && table_view.destroy();
               container.highcharts().destroy();
               charts.destroy({
                   containerIDWithHash: `#${id}_chart`,
                   timePeriod: timePeriod,
                   instrumentCode: instrumentCode,
                   start: options.start
               });
               chartOptions.cleanBinding(id);
               dialog.remove();
            });
          },
          refresh: () => charts.refresh(`#${id}_chart`)
       },
       events: {
          typeChange: null,
          timePriodChange: null,
          indicatorsChange: null,
          overlaysChange: null,
          anyChange: null
       },
    };
    dialog.on('chart-type-changed', function(e, type) {
        Store[id].type = type;
        instance.events.typeChange && instance.events.typeChange({type});
        instance.events.anyChange && instance.events.anyChange({data: Store[id]});
    });
    dialog.on('chart-time-period-changed', function(e, timePeriod) {
        Store[id].timePeriod = timePeriod;
        instance.events.timePriodChange && instance.events.timePriodChange({timePriod});
        instance.events.anyChange && instance.events.anyChange({data: Store[id]});
    });
    dialog.on('chart-indicators-changed', function(e, chart) {
        Store[id].indicators = chart.get_indicators();
        instance.events.indicatorsChange && instance.events.indicatorsChange({indicators: Store[id].indicators});
        instance.events.anyChange && instance.events.anyChange({data: Store[id]});
    });
    dialog.on('chart-overlay-add', function(e, overlay) {
        Store[id].overlays.push(overlay);
        instance.events.overlaysChange && instance.events.overlaysChange({overlays: Store[id].overlays});
        instance.events.anyChange && instance.events.anyChange({data: Store[id]});
    });
    dialog.on('chart-overlay-remove', function(e, displaySymbol) {
        _.remove(Store[id].overlays, displaySymbol);
        instance.events.overlaysChange && instance.events.overlaysChange({overlays: Store[id].overlays});
        instance.events.anyChange && instance.events.anyChange({data: Store[id]});
    });
    dialog.on('chart-options-changed', function(e) {
        instance.events.anyChange && instance.events.anyChange({data: Store[id]});
    });

    let table_view = null;
    drawChartPromise = delayAmountFor(options.instrumentCode).then(delayAmount => {
       delayAmount = options.start ? 0 : delayAmount; // No delay for historical-data
       options.delayAmount = options.delayAmount || delayAmount;
       Store[id].delayAmount = Store[id].delayAmount || delayAmount;

       return new Promise((resolve, reject) => {
         charts.drawChart("#" + id + "_chart", options, () => {
            instance.actions.reflow();
            _.delay(resolve);
         });
         /* initialize chartOptions & table-view once chart is rendered */
         table_view = tableView.init(dialog, timezoneOffset);
         chartOptions.init(dialog, id, table_view.show, {
            timePeriod: options.timePeriod,
            chartType: options.type,
            instrumentName: options.instrumentName,
            instrumentCode: options.instrumentCode,
            showInstrumentName: options.showInstrumentName,
            showOverlays: ("showOverlays" in options) ? options.showOverlays : true,
            showShare: ("showShare" in options) ? options.showShare : true,
         });
      });
    });

    return instance;
};

// This is for affiliates. Hope it works. Fingers crossed.
export const add_chart_options = function(id, options) {
    const dialog = $("#" + id);
    Store[id] = options;
    Store[id].indicators = Store[id].indicators || [];
    Store[id].overlays = Store[id].overlays || [];
    dialog.on('chart-type-changed', function(e, type) {
        Store[id].type = type;
    });
    dialog.on('chart-time-period-changed', function(e, timePeriod) {
        Store[id].timePeriod = timePeriod;
    });
    dialog.on('chart-indicators-changed', function(e, chart) {
        Store[id].indicators = chart.get_indicators();
    });
    dialog.on('chart-overlay-add', function(e, overlay) {
        Store[id].overlays.push(overlay);
    });
    dialog.on('chart-overlay-remove', function(e, displaySymbol) {
        _.remove(Store[id].overlays, displaySymbol);
    });
};

/* id of dialog. WITHOUT '#' prefix or '_chart' suffix */
export const get_chart_options = function(dialog_id) {
    const options = _.cloneDeep(Store[dialog_id]);
    if (!options.name) {
        options.name = '';
    }
    return options;
};
export const set_chart_options = function(dialog_id, options) {
    options.instrumentCode = Store[dialog_id].instrumentCode;
    options.instrumentName = Store[dialog_id].instrumentName;
    Store[dialog_id] = options;
    $('#' + dialog_id).trigger('chart-options-changed');
};
export const apply_chart_options = function(dialog_id, options) {
    set_chart_options(dialog_id, options);
    _.delay(() => {
        chartOptions.updateOptions( /* update the chart options settings */
            dialog_id, options.type, options.timePeriod, options.indicators.length, options.overlays.length);
        charts.refresh('#' + dialog_id + '_chart', options.timePeriod, options.type, options.indicators, options.overlays);
    });
};

export default {
    addNewChart,
    add_chart_options,
    get_chart_options,
    set_chart_options,
    apply_chart_options
};
