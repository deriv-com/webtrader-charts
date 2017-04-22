import $ from 'jquery';
import _ from 'lodash';
import html from './chartWindow.html';
// TODO: highcharts-exporting
// import 'highcharts-exporting';
import charts from './charts.js';
import tableView from './tableView.js';
import chartOptions from './chartOptions.js';
import liveapi from './common/liveapi.js';

const triggerResizeEffects = (dialog) => {
    dialog.find('.chartSubContainer').width(dialog.width());
    //Because of title taking space, we have to reduce height
    dialog.find('.chartSubContainer').height(dialog.height() - 42);
    dialog.trigger('resize-event');
    const containerIDWithHash = '#' + dialog.find('.chartSubContainer').attr('id');
    charts.triggerReflow(containerIDWithHash);
}

const Store = {};
let idCounter = 0;
export const addNewChart = function($parent, options) {
    const dialog = $(html);
    dialog.appendTo($parent);
    const id = `webtrader-charts-dialog-${++idCounter}`;
    dialog.attr('id', id);
    dialog.find('div.chartSubContainerHeader').attr('id', `${id}_header`);
    dialog.find('div.chartSubContainer').attr('id', `${id}_chart`);

    /* tracking the chart, includion indicators & overlyas */
    Store[id] = _.cloneDeep(options);
    Store[id].indicators = Store[id].indicators || [];
    Store[id].overlays = Store[id].overlays || [];

    const instance = {
       data: () => Store[id],
       actions: {
          reflow: () =>  triggerResizeEffects(dialog),
          destroy: () => {
            const container = $("#" + id + "_chart");
            const timePeriod = container.data("timePeriod");
            const instrumentCode = container.data('instrumentCode');
            container.highcharts().destroy();
            charts.destroy({
                containerIDWithHash: "#" + id + "_chart",
                timePeriod: timePeriod,
                instrumentCode: instrumentCode
            });
            chartOptions.cleanBinding(id);
            dialog.remove();
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
    /* initialize chartOptions & table-view once chart is rendered */
    charts.drawChart("#" + id + "_chart", options, instance.actions.reflow);
    const table_view = tableView.init(dialog);
    chartOptions.init(id, options.timePeriod, options.type, table_view.show, options.instrumentName, options.instrumentCode);

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
