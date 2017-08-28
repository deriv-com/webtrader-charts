import $ from 'jquery';
import _ from 'lodash';
import rv from 'rivets';
import './common/rivetsExtra.js';
import charts from './charts.js';
import crosshair from './crosshair.js';
import overlayManagement from './overlayManagement.js';
import indicatorManagement from './indicatorManagement.js';
import html from './chartOptions.html';
import './chartOptions.scss';
import {isTick, local_storage, isAffiliates, i18n} from './common/utils.js';
import {globals} from './common/globals.js';
import vertical_line from './draw/vertical_line.js';
import horizontal_line from './draw/horizontal_line.js';

const state = [],
    view = [];
let isListenerAdded = false;

const timeperiod_arr = [{ value: "1t", name: "1 Tick", digit: 1, type: "ticks" },
    { value: "1m", name: "1 Minute", digit: 1, type: "minutes" },
    { value: "2m", name: "2 Minutes", digit: 2, type: "minutes" },
    { value: "3m", name: "3 Minutes", digit: 3, type: "minutes" },
    { value: "5m", name: "5 Minutes", digit: 5, type: "minutes" },
    { value: "10m", name: "10 Minutes", digit: 10, type: "minutes" },
    { value: "15m", name: "15 Minutes", digit: 15, type: "minutes" },
    { value: "30m", name: "30 Minutes", digit: 30, type: "minutes" },
    { value: "1h", name: "1 Hour", digit: 1, type: "hours" },
    { value: "2h", name: "2 Hours", digit: 2, type: "hours" },
    { value: "4h", name: "4 Hours", digit: 4, type: "hours" },
    { value: "8h", name: "8 Hours", digit: 8, type: "hours" },
    { value: "1d", name: "1 Day", digit: 1, type: "days" }
];

const chartType_arr = [{ value: 'candlestick', name: 'Candles' }, { value: 'ohlc', name: 'OHLC' },
        { value: 'line', name: 'Line' }, { value: 'dot', name: 'Dot' }, { value: 'linedot', name: 'Line Dot' },
        { value: 'spline', name: 'Spline' }, { value: 'table', name: 'Table' }
    ];

const hideOverlays = (scope) => {
    scope.showTimePeriodSelector = false;
    scope.showLoadSaveSelector = false;
    scope.showChartTypeSelector = false;
    scope.showDrawingToolSelector = false;
    scope.showShareSelector = false;
    scope.showIndicatorDropDown = false;
}

const changeChartType = (scope, chartType, newTimePeriod = null) => {
    if (chartType == 'table') {
        //Do not change chart type
        state[scope.newTabId].showChartTypeSelector = false;
        scope.tableViewCallback && scope.tableViewCallback();
    } else {
        state[scope.newTabId].chartType = chartType_arr.filter((chart) => {
            return chart.value == chartType
        })[0];
        state[scope.newTabId].showChartTypeSelector = false;
        charts.refresh('#' + scope.newTabId + '_chart', newTimePeriod, chartType);
        $('#' + scope.newTabId).trigger('chart-type-changed', chartType);
    }
    hideOverlays(scope);
}

const isOverlaidView = (containerIDWithHash) => {
    let isOverlaid = false;
    const existingChart = $(containerIDWithHash).highcharts();
    if (existingChart) {
        existingChart.series.forEach((f) => {
            if (f.options.compare === 'percent') {
                isOverlaid = true;
            }
        });
    }
    return isOverlaid;
}

const timeperiod_i18n = value => {
   if(globals.config.lang === 'en') {
      return value.toUpperCase();
   }

   const [first, second] = value.split(' ');
   if(first === '1') { value = i18n(value); }
   else {
      value = `${first} ${i18n(second)}`;
   }

   return value;
}

const showCandlestickAndOHLC = (newTabId, show) => {
    if (!show) {
        state[newTabId].chartTypes = chartType_arr.filter(
            (chartType) => {
                return chartType.value !== "candlestick" && chartType.value !== "ohlc";
            });
    } else {
        state[newTabId].chartTypes = chartType_arr;
        state[newTabId].chartTypes[1].showBorder = true;
    }

}

const responsiveButtons = (scope, dialog) => {
   const view = dialog.find('.chart-view');
   const tbl = view.find('.chartOptions > .table');
   if (view.width() > 400) {
        scope.showChartTypeLabel = true;
        scope.timePeriod_name = timeperiod_i18n(scope.timePeriod.name);
   } else {
        scope.showChartTypeLabel = false;
        if(globals.config.lang === 'en') {
           scope.timePeriod_name = scope.timePeriod.value.toUpperCase();
        } else {
           scope.timePeriod_name = i18n(scope.timePeriod.value);
        }
   }
   const justifyCenter = (tbl.parent().outerHeight() > tbl.outerHeight()) || !scope.showInstrumentName;
   tbl.css({'justify-content': justifyCenter ? 'center' : 'flex-start' });
   tbl.removeClass('justified-center justified-flex-start');
   tbl.addClass(justifyCenter ? 'justified-center' : 'justified-flex-start');
}

export const init = (dialog, m_newTabId, m_tableViewCb, options) => {
    if (view[m_newTabId]) view[m_newTabId].unbind();
    state[m_newTabId] = {
        //Input parameters
        newTabId: m_newTabId,
        timePeriod: timeperiod_arr.filter((obj) => {
            return options.timePeriod == obj.value
        })[0],
        timeperiod_arr: timeperiod_arr,
        chartType: chartType_arr.filter((chart) => {
            return chart.value == options.chartType
        })[0],
        tableViewCallback: m_tableViewCb, //Callback for table view
        instrumentName: options.instrumentName,
        instrumentCode: options.instrumentCode,
        indicatorsCount: 0,
        overlayCount: 0,

        showTimePeriodSelector: false,
        showChartTypeSelector: false,
        showTableOption: true,
        enableCrosshair: true,
        showDrawingToolSelector: false,
        showShareSelector: false,
        showLoadSaveSelector: false,
        showShare: options.showShare,
        showOverlay: options.showOverlays,
        showInstrumentName: options.showInstrumentName,
        showIndicatorDropDown: false,
    };
    view[m_newTabId] = null;

    state[m_newTabId].toggleTimerPeriodSelector = (event, scope) => {
        const temp = !scope.showTimePeriodSelector;
        hideOverlays(scope);
        scope.showTimePeriodSelector = temp;
    };
    state[m_newTabId].toggleChartTypeSelector = (event, scope) => {
        const perv = scope.showChartTypeSelector;
        hideOverlays(scope);
        scope.showChartTypeSelector = !perv;
    };

    state[m_newTabId].toggleIndicatorDropDown = (event, scope) => {
        const perv = scope.showIndicatorDropDown;
        hideOverlays(scope);
        scope.showIndicatorDropDown = !perv;
        if(scope.showIndicatorDropDown)
            indicatorManagement.openDialog('#' + scope.newTabId + '_chart');
    };

    state[m_newTabId].addRemoveOverlay = (event, scope) => {
        const title = scope.instrumentName + ' (' + scope.timePeriod.value + ')';
        overlayManagement.openDialog('#' + scope.newTabId + '_chart', title);
    };

    state[m_newTabId].changeChartType = (event, scope) => {
        const chartType = $(event.target).attr("data-charttype");
        if (chartType) {
            changeChartType(scope, chartType);
        }
    };

    state[m_newTabId].changeTimePeriod = (event, scope) => {
        const timePeriod = event.target.dataset.timeperiod;
        if (timePeriod) {
            scope = state[scope.newTabId];
            scope.timePeriod = timeperiod_arr.filter((obj) => {
                return timePeriod == obj.value
            })[0];
            responsiveButtons(scope, dialog);
            const tick = isTick(timePeriod);
            if (tick && (scope.chartType.value === 'candlestick' || scope.chartType.value === 'ohlc')) {
                changeChartType(scope, 'line', timePeriod);
            }
            else {
               charts.refresh('#' + scope.newTabId + '_chart', timePeriod);
            }
            showCandlestickAndOHLC(scope.newTabId, !tick && !isOverlaidView('#' + m_newTabId + '_chart'));
            $('#' + scope.newTabId).trigger('chart-time-period-changed', timePeriod);
            hideOverlays(scope);
        }
    };

    //Disable candlestick and OHLC if it is a tick chart or overlaid view
    showCandlestickAndOHLC(m_newTabId, !isTick(options.timePeriod) && !isOverlaidView('#' + m_newTabId + '_chart'));

    if (!m_tableViewCb) {
        state[m_newTabId].showTableOption = false;
    }

    state[m_newTabId].toggleCrosshair = (event, scope) => {
        scope.enableCrosshair = !scope.enableCrosshair;
        crosshair.toggleCrossHair('#' + scope.newTabId + '_chart');
    };

    state[m_newTabId].toggleDrawingToolSelector = (event, scope) => {
        const perv = scope.showDrawingToolSelector;
        hideOverlays(scope);
        scope.showDrawingToolSelector = !perv;
    };
    /* Convert this to support es-6 import */
    state[m_newTabId].addDrawingTool = (event, scope) => {
        const drawingTool = event.target.dataset.drawingtool;
        if (drawingTool) {
           const draw = {horizontal_line, vertical_line}[drawingTool];
           const refererChartID = '#' + scope.newTabId + '_chart';
           $(refererChartID).highcharts().annotate = true;
           draw.init(refererChartID);
        }
    };

    state[m_newTabId].toggleShareSelector = (event, scope) => {
        const perv = scope.showShareSelector;
        hideOverlays(scope);
        scope.showShareSelector = !perv;
    };

    state[m_newTabId].toggleLoadSaveSelector = (event, scope) => {
        const perv = !scope.showLoadSaveSelector;
        hideOverlays(scope);
        scope.showLoadSaveSelector = perv;
    };

    state[m_newTabId].export = (event, scope) => {
        const exportType = event.target.dataset.exporttype;
        if (exportType) {
            const id = `#${scope.newTabId}_chart`;
            const chart = $(id).highcharts();
            const exporters = {
              png: () => chart.exportChartLocal(),
              pdf: () => chart.exportChart({ type: 'application/pdf' }),
              svg: () => chart.exportChartLocal({ type: 'image/svg+xml' }),
              csv: () => charts.generate_csv(chart, $(id).data(), m_newTabId),
            };
            exporters[exportType]();
        }
    };

    state[m_newTabId].closeOverlays = (e, scope) => {
        if(e.keyCode === 27) {
            e.stopPropagation();
            hideOverlays(scope);
        }
    }

    // Listen for indicator changes.
    dialog.on('chart-indicators-changed', (e, chart) => {
        state[m_newTabId].indicatorsCount = chart.get_indicators().length;
    });

    state[m_newTabId].overlayCount = dialog.find(`#${m_newTabId}_chart`).data('overlayCount');

    // Listen for overlay changes.
    dialog.on('chart-overlay-add', (e, overlay) => {
        const chart = dialog.find(`#${m_newTabId}_chart`).highcharts();
        state[m_newTabId].overlayCount = chart.get_overlay_count();

    });
    dialog.on('chart-overlay-remove', (e, overlay) => {
        const chart = dialog.find(`#${m_newTabId}_chart`).highcharts();
        state[m_newTabId].overlayCount = chart.get_overlay_count();
    });

    // Listen for resize event
    if (!dialog.dialog) {
       $(window).resize(
          () => state[m_newTabId] && responsiveButtons(state[m_newTabId], dialog)
       );
    } else { 
        dialog.on('resize-event', function(e) {
            responsiveButtons(state[m_newTabId], $(this));
        });
    }

    // Add event only once.
    !isListenerAdded && $('html').on('click', (event) => {
        _.forEach(Object.keys(state), (tab) => {
            const dialog_element = $(`#${tab}`)[0];
            const handler = $(event.target).closest('[rv-on-click]');
            if(!dialog_element || !handler.length || !$.contains(dialog_element, handler[0]))
                hideOverlays(state[tab]);
        });
    });

    isListenerAdded = true;

    const $html = $(html);

    dialog.find(`#${m_newTabId}_header`).prepend($html);

    // Used to filter timeperiod array.
    rv.formatters['filter'] = (arr, type) => {
        return arr.filter((item) => {
            return item.type == type
        });
    }

    view[m_newTabId] = rv.bind($html[0], state[m_newTabId]);

    events.trigger('chart-options-add', [dialog, m_newTabId]);

    // Stop event propagation for these overlays.
    $html.find(".loadSaveOverlay").on("click", (e) => e.stopPropagation());
    $html.find(".exportOverlay").on("click", (e) => e.stopPropagation());
    $html.find(".chartOptions_overlay.indicators").on("click", (e) => e.stopPropagation());
    
    responsiveButtons(state[m_newTabId], dialog);
}

/* allow settings to be updated when a new chart template is applied */
export const updateOptions = (newTabId, chartType, timePeriod, indicatorsCount, overlayCount) => {
    const s = state[newTabId];
    if (!s) return;
    s.chartType = chartType_arr.filter((chart) => {
        return chart.value == chartType;
    })[0];
    s.timePeriod = timeperiod_arr.filter((tp) => {
        return timePeriod == tp.value;
    })[0];
    s.indicatorsCount = indicatorsCount;
    s.overlayCount = overlayCount;
    //Disable candlestick and OHLC if it is a tick chart or overlaid view
    showCandlestickAndOHLC(newTabId, !isTick(timePeriod) && overlayCount > 0);
    responsiveButtons(s, $("#" + newTabId));
}

/* chartTypes are - candlestick, dot, line, dotline, ohlc, spline, table */
overlayManagement.events.on('chart-type-update',  (e, {tabId, type}) => {
   state[tabId].chartType = chartType_arr.filter((chart) => chart.value == type)[0];
});
overlayManagement.events.on('overlay-add', (e, {containerId, symbol, displaySymbol, delay_amount}) => {
   const dialog = $(containerId);
   charts.overlay(containerId, symbol, displaySymbol, delay_amount)
      .then(() => _.defer(() => { //Waiting for overlays to be applied.
         const overlay = { symbol: symbol, displaySymbol: displaySymbol, delay_amount};
         dialog.trigger('chart-overlay-add', overlay);
         charts.refresh( containerId );
      }));
});
overlayManagement.events.on('overaly-remove', (e, {containerId}) => {
   charts.refresh(containerId);
});
overlayManagement.events.on('ohlc-update', (e, { tabId, enable}) => {
    if (state[tabId]) {
        showCandlestickAndOHLC(tabId, enable);
    }
});

export const cleanBinding = (newTabId) => {
    if (view[newTabId]) {
        view[newTabId].unbind();
        events.trigger('chart-options-remove', [newTabId]);
        delete view[newTabId];
        delete state[newTabId];
    }
}

export const setIndicatorsCount = (count, newTabId) => {
    state[newTabId].indicatorsCount = count;
}

export const getAllChartsWithTheirTypes = () => {
    return _.keys(state).map((id) => {
        return { id: id, chartType: state[id].chartType.value };
    });
}

export const events = $('<div/>');
export default {
    init,
    events,
    updateOptions,
    cleanBinding,
    setIndicatorsCount,
    getAllChartsWithTheirTypes
}
