import $ from 'jquery';
import rv from 'rivets';
import _ from 'lodash';
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
    view = [],
    stringWidth = {};
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
    ],
    appURL = "https://webtrader.binary.com",
    urlShareTemplate = appURL + '?affiliates=true&instrument={0}&timePeriod={1}&lang=' + globals.config.lang,
    iframeShareTemplate = '<iframe src="' + urlShareTemplate + '" width="350" height="400" style="overflow-y : hidden;" scrolling="no" />',
    twitterShareTemplate = 'https://twitter.com/share?url={0}&text={1}',
    fbShareTemplate = 'https://facebook.com/sharer/sharer.php?u={0}',
    gPlusShareTemplate = 'https://plus.google.com/share?url={0}',
    bloggerShareTemplate = 'https://www.blogger.com/blog-this.g?u={0}&n={1}',
    vkShareTemplate = 'http://vk.com/share.php?url={0}&title={1}';

const hideOverlays = (scope) => {
    scope.showTimePeriodSelector = false;
    scope.toggleLoadSaveSelector(null, scope);
    scope.toggleChartTypeSelector(null, scope);
    scope.toggleDrawingToolSelector(null, scope);
    scope.toggleExportSelector(null, scope);
    scope.addRemoveIndicator(null, scope);
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
        /* trigger an event on the chart dialog, so we can listen on type changes,
         * note: this will be use to update chart state for tracker.js */
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

   if(value.startsWith('1')) { value = i18n(value); }
   else {
      const [first, second] = value.split(' ');
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
    const ele = dialog.find('.chart-view');
    const loadSaveOverlay = ele.find(".loadSaveOverlay");
    const exportOverlay = ele.find(".exportOverlay");
    const indicatorOverlay = ele.find(".indicators");
    const timePeriodButton = ele.find(".timeperiod");
    const chartTypeButton = ele.find(".chart_type");
    ele.find(".chartTypeOverlay").css("width", stringWidth.ct + 53 + "px");

    // This is needed for calculating relative position.
    const templateButton = ele.find('.templateButton'),
        minWidth = 420 + ((stringWidth.tp.max + stringWidth.ct + 65) - 184);

    if (scope.showInstrumentName) {
        if ($('#'+scope.newTabId).width() > minWidth + stringWidth.inst) {
            $($("#" + scope.newTabId + " .chartOptions .table")[0]).css("margin", "5px 0px");
            $($("#" + scope.newTabId + " .chartOptions .table")[0]).css("float", "left");
            $("#" + scope.newTabId + " .chartOptions .instrument_name").show();            
            scope.showInstrumentName = true;
            const chart = dialog.find(`#${scope.newTabId}_chart`).highcharts();
            chart && chart.setTitle({ text: "" });
        } else {
            $($("#" + scope.newTabId + " .chartOptions .table")[0]).css("margin", "5px auto");
            $($("#" + scope.newTabId + " .chartOptions .table")[0]).css("float", "");
            $("#" + scope.newTabId + " .chartOptions .instrument_name").hide();
            $("#" + scope.newTabId + "_chart").highcharts() && $("#" + scope.newTabId + "_chart").highcharts().setTitle({ text: scope.instrumentName });
        }
    }

    if (ele.width() > minWidth) {
        scope.showChartTypeLabel = true;
        scope.timePeriod_name = timeperiod_i18n(scope.timePeriod.name);
        timePeriodButton.css("width", stringWidth.tp.max + 25 + "px");
        chartTypeButton.css("width", stringWidth.ct + 55 + "px");
    } else {
        scope.showChartTypeLabel = false;
        if(globals.config.lang === 'en') {
           scope.timePeriod_name = scope.timePeriod.value.toUpperCase();
        } else {
           scope.timePeriod_name = i18n(scope.timePeriod.value);
        }
        timePeriodButton.css("width", stringWidth.tp.min + 27 + "px");
        chartTypeButton.css("width", "45px");
    }

    let positionRight = ele.width() - (templateButton.offset().left + templateButton.outerWidth() - ele.offset().left) - 35;
    
    if (ele.width() <= 740) {
        positionRight = positionRight > 0 ? positionRight : 25;
        exportOverlay.css("right", positionRight + "px");
        loadSaveOverlay.css("right", positionRight + 35 + "px");
        indicatorOverlay.css("right","10px");
    } else {
        loadSaveOverlay.css("right", "auto");
        exportOverlay.css("right", "auto");
        indicatorOverlay.css("right","auto");
    }

    if(!scope.showInstrumentName && ele.width() < 1080) {
        indicatorOverlay.css("right","10px");        
    }
}

const calculateStringWidth = (instrument_name) => {
    const longTp1 = timeperiod_arr.map(tp => {
         if(globals.config.lang === 'en')
            return { value: tp.value.toUpperCase() };
         return { value: i18n(tp.value) };
       }).reduce((a, b) => a.value.length > b.value.length ? a : b);

    const longTp2 = timeperiod_arr.map(tp => ({ name: timeperiod_i18n(tp.name) }))
          .reduce((a, b) => a.name.length > b.name.length ? a : b);

    const longCt = chartType_arr.map(ct => ({name: i18n(ct.name)}))
          .reduce((a, b) => a.name.length > b.name.length ? a : b);

    const getWidth = (string) => {
        const font = '0.8em roboto,sans-serif',
            obj = $(`<div>${string}</div>`)
            .css({ 'position': 'absolute', 'float': 'left', 'white-space': 'nowrap', 'visibility': 'hidden', 'font': font })
            .appendTo($('body')),
            width = obj.width();
        obj.remove();
        return width;
    }
    stringWidth.tp = {};
    stringWidth.tp.min = getWidth(longTp1.value);
    stringWidth.tp.max = getWidth(longTp2.name);
    stringWidth.ct = getWidth(longCt.name);
    stringWidth.inst = getWidth(instrument_name) + 20;
}

const toggleIcon = (ele, active) => {
    ele = $(ele);
    let cls = ele.attr("class");
    ele.toggleClass(cls);


    let type = cls && cls.split("-")[0];
    if(!type) {
       type = ele.closest('.chart-view').find('.chartSubContainer').data('type');
    }

    cls = (active === true) ? type + "-w-icon" : type + "-icon";
    ele.toggleClass(cls);
}
const format = (str, ...args) => {
   return str.replace(
      /{(\d+)}/g,
      (match, number) => (typeof args[number] !== 'undefined') ? args[number] : match
   );
}

export const init = (dialog, m_newTabId, m_tableViewCb, options) => {
    calculateStringWidth(options.instrumentName);
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
        showExportSelector: false,
        showLoadSaveSelector: false,
        showShare: options.showShare,
        showOverlay: options.showOverlays,
        showInstrumentName: options.showInstrumentName,
        showIndicatorDropDown: false,

        exportChartURLShare: format(urlShareTemplate, options.instrumentCode, options.timePeriod),
        exportChartIframeShare: format(iframeShareTemplate, options.instrumentCode, options.timePeriod),

        fbShareLink: format(fbShareTemplate, encodeURIComponent(format(urlShareTemplate, options.instrumentCode, options.timePeriod))),
        twitterShareLink: format(twitterShareTemplate, encodeURIComponent(format(urlShareTemplate, options.instrumentCode, options.timePeriod)), options.instrumentName + '(' + options.timePeriod + ')'),
        gPlusShareLink: format(gPlusShareTemplate, encodeURIComponent(format(urlShareTemplate, options.instrumentCode, options.timePeriod))),
        bloggerShareLink: format(bloggerShareTemplate, format(urlShareTemplate, options.instrumentCode, options.timePeriod), options.instrumentName + '(' + options.timePeriod + ')'),
        vkShareLink: format(vkShareTemplate, format(urlShareTemplate, options.instrumentCode, options.timePeriod), options.instrumentName + '(' + options.timePeriod + ')')

    };
    view[m_newTabId] = null;

    state[m_newTabId].toggleTimerPeriodSelector = (event, scope) => {
        const temp = !scope.showTimePeriodSelector;
        hideOverlays(scope);
        scope.showTimePeriodSelector = temp;
        event.originalEvent.scope = scope.newTabId;
    };
    state[m_newTabId].toggleChartTypeSelector = (event, scope) => {
        const temp = !scope.showChartTypeSelector;
        const ele = $("#" + scope.newTabId + " .chart_type .img span")[0];
        if (temp == true && event) {
            hideOverlays(scope);
            scope.showChartTypeSelector = temp;
            toggleIcon(ele, true);
            event.originalEvent.scope = scope.newTabId;
        } else {
            scope.showChartTypeSelector = false;
            toggleIcon(ele, false);
        }

    };

    state[m_newTabId].addRemoveIndicator = (event, scope) => {
        const temp = !scope.showIndicatorDropDown;
        const ele = $("#" + scope.newTabId + ' [rv-on-click="addRemoveIndicator"] .img span')[0];
        if (temp == true && event) {
            hideOverlays(scope);
            scope.showIndicatorDropDown = temp;
            toggleIcon(ele, true);
            event.originalEvent.scope = scope.newTabId;
            indicatorManagement.openDialog('#' + scope.newTabId + '_chart');
        } else {
            scope.showIndicatorDropDown = false;
            toggleIcon(ele, false);
        }
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
            scope.exportChartURLShare = format(urlShareTemplate, scope.instrumentCode, timePeriod);
            scope.exportChartIframeShare = format(iframeShareTemplate, scope.instrumentCode, timePeriod);
            scope.fbShareLink = format(fbShareTemplate, encodeURIComponent(format(urlShareTemplate, options.instrumentCode, options.timePeriod)));
            scope.twitterShareLink = format(twitterShareTemplate, encodeURIComponent(format(urlShareTemplate, options.instrumentCode, options.timePeriod)), options.instrumentName + '(' + options.timePeriod + ')');
            scope.gPlusShareLink = format(gPlusShareTemplate, encodeURIComponent(format(urlShareTemplate, options.instrumentCode, options.timePeriod)));
            scope.bloggerShareLink = format(bloggerShareTemplate, encodeURIComponent(format(urlShareTemplate, options.instrumentCode, options.timePeriod)), options.instrumentName + '(' + options.timePeriod + ')');
            scope.vkShareLink = format(vkShareTemplate, encodeURIComponent(format(urlShareTemplate, options.instrumentCode, options.timePeriod)), options.instrumentName + '(' + options.timePeriod + ')');
            $('#' + scope.newTabId).trigger('chart-time-period-changed', timePeriod);
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
        const temp = !scope.showDrawingToolSelector;
        const ele = $("#" + scope.newTabId + ' .drawButton .img span')[0];
        if (temp == true && event) {
            hideOverlays(scope);
            scope.showDrawingToolSelector = temp;
            toggleIcon(ele, true);
            event.originalEvent.scope = scope.newTabId;
        } else {
            scope.showDrawingToolSelector = false;
            toggleIcon(ele, false);
        }
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

    state[m_newTabId].toggleExportSelector = (event, scope) => {
        const temp = !scope.showExportSelector;
        const ele = $("#" + scope.newTabId + ' .shareButton .img span')[0];
        if (temp == true && event) {
            hideOverlays(scope);
            scope.showExportSelector = temp;
            toggleIcon(ele, true);
            event.originalEvent.scope = scope.newTabId;
        } else {
            scope.showExportSelector = false;
            toggleIcon(ele, false);
        }
    };

    state[m_newTabId].toggleLoadSaveSelector = (event, scope) => {
        const temp = !scope.showLoadSaveSelector;
        const ele = $("#" + scope.newTabId + ' .templateButton .img span')[0];
        if (temp == true && event) {
            hideOverlays(scope);
            scope.showLoadSaveSelector = temp;
            toggleIcon(ele, true);
            event.originalEvent.scope = scope.newTabId;
        } else {
            scope.showLoadSaveSelector = false;
            toggleIcon(ele, false);
        }
    };

    state[m_newTabId].export = (event, scope) => {
        const exportType = event.target.dataset.exporttype;
        if (exportType) {
            const id = '#' + scope.newTabId + '_chart';
            const chart = $(id).highcharts();
            switch (exportType) {
                case 'png':
                    chart.exportChartLocal();
                    break;
                case 'pdf':
                    chart.exportChart({
                        type: 'application/pdf'
                    });
                    break;
                case 'csv':
                    charts.generate_csv(chart, $(id).data(), m_newTabId);
                    break;
                case 'svg':
                    chart.exportChartLocal({
                        type: 'image/svg+xml'
                    });
                    break;
            }
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
    !isListenerAdded && $('body').on('click', (event) => {
        _.forEach(Object.keys(state), (tab) => {
            if (event.originalEvent && tab != event.originalEvent.scope)
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
