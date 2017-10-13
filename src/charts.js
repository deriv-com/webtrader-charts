/**
 * Created by arnab on 2/11/15.
 */
import _ from 'lodash';
import $ from 'jquery';
import moment from 'moment';
import Highcharts from 'highstock-release/highstock';
import chartingRequestMap from './common/chartingRequestMap.js';
import liveapi from './common/liveapi.js';
import ohlc_handler from './common/ohlc_handler.js';
import currentPrice from './common/currentprice.js';
import indicators from './common/indicators.js';
import indicatorsArray from './indicators-config.js';
import notification from './common/notification.js';
import HMW from './common/highchartsMousewheel.js';
import {specificMarketDataSync, marketData} from './overlayManagement.js';
import {i18n, isTick} from './common/utils.js';
import chartDraw from './chartDraw.js';

import './charts.scss';

// TODO: moemnt locale
// const lang = local_storage.get("i18n") ? local_storage.get("i18n").value.replace("_","-") : 'en';
// if(lang !== "en") // Load moment js locale file.
//     require(['moment-locale/'+lang]); 

const indicator_values = _.values(_.cloneDeep(indicatorsArray));
Highcharts.Chart.prototype.get_indicators = function() {
    const chart = this;
    const indicators = [];
    if (chart.series.length > 0) {
        indicator_values.forEach((ind) => {
            const id = ind.id;
            chart.series[0][id] && chart.series[0][id].forEach((entry) => {
                indicators.push({ id: id, name: ind.long_display_name, options: entry.options });
            });
        });
    }

    return indicators;
};

Highcharts.Chart.prototype.set_indicators = function(indicators) {
    const chart = this;
    if (chart.series && chart.series[0]) {
        indicators.forEach((ind) => {
            if (ind.options.onSeriesID) { //make sure that we are using the new onSeriesID value
                ind.options.onSeriesID = chart.series[0].options.id;
            }
            chart.series[0].addIndicator(ind.id, ind.options);
        });
    }
};

Highcharts.Chart.prototype.get_indicator_series = function() {
    const chart = this;
    const series = [];
    if (chart.series.length > 0) {
        indicator_values.forEach((ind) => {
            const id = ind.id;
            chart.series[0][id] && chart.series[0][id][0] && series.push({ id: id, series: chart.series[0][id] });
        });
    }
    return series;
};

Highcharts.Chart.prototype.set_indicator_series = function(series) {
    const chart = this;
    if (!chart.series || chart.series.length === 0) {
        return;
    }
    series.forEach((seri) => {
        chart.series[0][seri.id] = seri.series;
    });
};

Highcharts.Chart.prototype.get_overlay_count = function() {
    let overlayCount = 0;
    this.series.forEach((s, index) => {
        if (s.options.isInstrument && s.options.id.indexOf('navigator') == -1 && index !== 0) {
            overlayCount++;
        }
    });
    return overlayCount;
};

$(() => {

    Highcharts.setOptions({
        global: {
            useUTC: true,
            canvasToolsURL: "https://code.highcharts.com/modules/canvas-tools.js"
        },
        lang: { thousandsSep: ',' } /* format numbers with comma (instead of space) */
    });
});

indicators.initHighchartIndicators(chartingRequestMap.barsTable);

export const destroy = (options) => {
    const containerIDWithHash = options.containerIDWithHash,
        timePeriod = options.timePeriod,
        instrumentCode = options.instrumentCode,
        start = options.start;
    if (!timePeriod || !instrumentCode) return;

    //granularity will be 0 for tick timePeriod
    const key = chartingRequestMap.keyFor(instrumentCode, timePeriod, start);
    chartingRequestMap.unregister(key, containerIDWithHash);
};

export const generate_csv = (chart, data, dialog_id) => {
    let lines = [],
        dataToBeProcessTolines = [];
    const flattenData = (d) => {
        let ret = null;
        if (_.isArray(d) && d.length > 3) {
            const time = d[0];
            ret = '"' + moment.utc(time).format('YYYY-MM-DD HH:mm') + '"' + ',' + d.slice(1, d.length).join(',');
        } //OHLC case
        else if (_.isNumber(d.high)) ret = '"' + moment.utc(d.time).format('YYYY-MM-DD HH:mm') + '"' + ',' + d.open + ',' + d.high + ',' + d.low + ',' + d.close;
        else if (_.isArray(d) && d.length > 1) ret = '"' + moment.utc(d[0]).format('YYYY-MM-DD HH:mm') + '"' + ',' + d[1]; //Tick chart case
        else if (_.isObject(d) && d.title && d.text) {
            if (d instanceof FractalUpdateObject) {
                ret = '"' + moment.utc(d.x || d.time).format('YYYY-MM-DD HH:mm') + '"' + ',' + (d.isBull ? 'UP' : d.isBear ? 'DOWN' : ' ');
            } else ret = '"' + moment.utc(d.x || d.time).format('YYYY-MM-DD HH:mm') + '"' + ',' + (d.text);
        } else if (_.isNumber(d.y)) ret = '"' + moment.utc(d.x || d.time).format('YYYY-MM-DD HH:mm') + '"' + ',' + (d.y || d.close);
        else ret = d.toString(); //Unknown case
        return ret;
    };
    chart.series.forEach((series, index) => {
        if (series.userOptions.id === 'navigator') return true;
        const newDataLines = series.userOptions.data.map((d) => {
            return flattenData(d);
        }) || [];
        if (index === 0) {
            const ohlc = newDataLines[0].split(',').length > 2;
            if (ohlc) lines.push('Date,Time,Open,High,Low,Close');
            else lines.push('Date,Time,"' + series.userOptions.name + '"');
            //newDataLines is incorrect - get it from lokijs
            const key = chartingRequestMap.keyFor(data.instrumentCode, data.timePeriod, data.start);
            const bars = chartingRequestMap.barsTable.query({ instrumentCdAndTp: key });
            lines = lines.concat(bars.map((b) => {
                return ohlc ? ['"' + moment.utc(b.time).format('YYYY-MM-DD HH:mm') + '"', b.open, b.high, b.low, b.close].join(',') : ['"' + moment.utc(b.time).format('YYYY-MM-DD HH:mm:ss') + '"', b.close].join(',');
            }));
        } else {
            lines[0] += ',"' + series.userOptions.name + '"'; //Add header
            dataToBeProcessTolines.push(newDataLines);
        }
    });

    notification.info(i18n('Downloading .csv'), `#${dialog_id}`);


    const filename = data.instrumentName + ' (' + data.timePeriod + ')' + '.csv';

    _.defer(() => {
       try {
          const csv = lines.map((line, index) => {
             dataToBeProcessTolines.forEach((dd) => {
                let added = false;
                dd.forEach((nDl) => {
                   if (nDl) {
                      const temp = nDl.split(',');
                      if (line.split(',')[0] === temp[0]) {
                         line += ',' + temp.slice(1, temp.length).join(',');
                         added = true;
                         return false;
                      }
                   }
                });
                if (line.indexOf('Date') == -1 && !added) line += ','; //Add a gap since we did not add a value
             });
             if (index === 0) {
                return line;
             }
             return line.split(" ").join("\",\""); //Separate date and time.
          }).join('\n');
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          if (navigator.msSaveBlob) { // IE 10+
             navigator.msSaveBlob(blob, filename);
          }
          else {
             const link = document.createElement("a");
             if (link.download !== undefined) { /* Evergreen Browsers :) */
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
             }
          }
       }
       catch(e) {
          notification.error('Error downloading .csv', `#${dialog_id}`);
          console.error(e);
       }
    });
};

/**
 * This method is the core and the starting point of highstock charts drawing
 * @param containerIDWithHash
 * @param instrumentCode
 * @param instrumentName
 * @param timePeriod
 * @param type
 * @param onload // optional onload callback
 */
export const drawChart = (containerIDWithHash, options, onload) => {
    let indicators = [];
    let overlays = [];
    let current_symbol = [];

    liveapi.cached.send({active_symbols: "brief"}, 5*60).then((data)=>{
        current_symbol = _.filter(data.active_symbols,{symbol: options.instrumentCode})[0];
    });

    if ($(containerIDWithHash).highcharts()) {
        //Just making sure that everything has been cleared out before starting a new thread
        const key = chartingRequestMap.keyFor(options.instrumentCode, options.timePeriod, options.start);
        chartingRequestMap.removeChart(key, containerIDWithHash);
        const chart = $(containerIDWithHash).highcharts();
        indicators = chart.get_indicators() || [];
        overlays = options.overlays || [];
        chart.destroy();
    }
    if (options.indicators) { /* this comes only from tracker.js & ChartTemplateManager.js */
        indicators = options.indicators || [];
        overlays = options.overlays || [];
        $(containerIDWithHash).data("overlayCount", overlays.length);
    }

    /* ignore overlays if chart type is candlestick or ohlc */
    if ((options.type === 'candlestick' || options.type === 'ohlc') && overlays.length > 0) {
        /* we should not come here, logging a warning as an alert if we somehow do */
        console.warn("Ingoring overlays because chart type is " + options.type);
        overlays = [];
    }

    //Save some data in DOM
    $(containerIDWithHash).data({
        instrumentCode: options.instrumentCode,
        instrumentName: options.instrumentName,
        timePeriod: options.timePeriod,
        timezoneOffset: options.timezoneOffset || 0,
        type: options.type,
        delayAmount: options.delayAmount,
        start: options.start
    });

    var initialized = false;
    var tooltip = $('<div class="webtrader-charts-tooltip"></div>');
    var topHalf = $('<div class="webtrader-charts-tooltip-top-half"></div>')
    // Create the chart
    $(containerIDWithHash).highcharts('StockChart', {
        chart: {
            events: {
                load: function(event) {
                    if(initialized) { return; }
                    initialized = true;
                    $(containerIDWithHash).find('> .highcharts-container').append(topHalf);
                    $(containerIDWithHash).find('> .highcharts-container').append(tooltip);

                    this.showLoading();
                    currentPrice.init();
                    const chart = this;
                    liveapi.execute(() => {
                        ohlc_handler.retrieveChartDataAndRender({
                            timePeriod: options.timePeriod,
                            instrumentCode: options.instrumentCode,
                            containerIDWithHash: containerIDWithHash,
                            type: options.type,
                            instrumentName: options.instrumentName,
                            series_compare: options.series_compare,
                            delayAmount: options.delayAmount,
                            start: options.start
                        }).catch((err) => {
                            const msg = i18n('Error getting data for %1').replace('%1', options.instrumentName);
                            notification.error(msg, containerIDWithHash.replace('_chart', ''));
                            chart && chart.showLoading(msg);
                            console.error(err);
                        }).then(() => {
                            /* the data is loaded but is not applied yet, its on the js event loop,
                               wait till the chart data is applied and then add the indicators */
                            _.defer(() => {
                                chart && chart.set_indicators(indicators); // put back removed indicators
                                overlays.forEach((ovlay) => {
                                    overlay(containerIDWithHash, ovlay.symbol, ovlay.displaySymbol, ovlay.delay_amount);
                                });
                                // restore plot lines & points after refresh.
                                chart && chartDraw.restore(isTick(options.timePeriod), chart, containerIDWithHash);
                                // hack for z-index of the crosshiar!
                                // chart &&  chart.yAxis[0].update({ crosshair: chart.yAxis[0].crosshair});
                            });
                        });
                    });

                    if ($.isFunction(onload)) {
                        onload(chart);
                    }

                    this.margin[2] = 5;
                    this.spacing[2] = 0;
                }
            },
            backgroundColor: 'transparent',
            marginLeft: 5,
            marginRight: 5,
            marginBottom: 0,
            spacingBottom: 0,
        },

        navigator: {
            enabled: true,
            series: {
                id: 'navigator'
            }
        },

        plotOptions: {
            candlestick: {
                shadow: false,
                color: '#d11415',
                upColor: '#2b920f'
            },
            line: {
                marker: { radius: 0, enabled: true },
            },
            spline: {
                marker: { radius: 0, enabled: true },
            },
            series: {
                events: {
                    afterAnimate: function() {
                        if (this.options.isInstrument && this.options.id !== "navigator") {
                            //this.isDirty = true;
                            //this.isDirtyData = true;

                            //Add current price indicator
                            //If we already added currentPriceLine for this series, ignore it
                            this.removeCurrentPrice();
                            this.addCurrentPrice();

                            //Add mouse wheel zooming
                            // HMW.mousewheel(containerIDWithHash);
                        }

                        this.chart.hideLoading();
                        //this.chart.redraw();
                    }
                }
            }
        },

        subtitle: {
           text: `<div class="wt-line wt-line-solid"></div> ${i18n('Start time')} ` +
                 `<div class="wt-circle wt-circle-empty"></div> ${i18n('Entry spot')} ` +
                 `<div class="wt-circle wt-circle-fill"></div> ${i18n('Exit spot')} ` +
                 `<div class="wt-line wt-line-dashed"></div> ${i18n('End time')} `,
                 // `<span class="chart-delay"> ${i18n('Charting for this underlying is delayed')} </span>`,
           useHTML: true
        },

        credits: { href: '#', text: '' },
        scrollbar: { liveRedraw: true },
        rangeSelector: { enabled: false },

        xAxis: {
            events: {
                afterSetExtremes: function() {
                    /*console.log('This method is called every time the zoom control is changed. TODO.' +
                     'In future, I want to get more data from server if users is dragging the zoom control more.' +
                     'This will help to load data on chart forever! We can warn users if they are trying to load' +
                     'too much data!');*/
                },
            },
            labels: {
                formatter: function() {
                    const str = this.axis.defaultLabelFormatter.call(this);
                    return str.replace('.', '');
                }
            },
            crosshair: {
              enabled: true,
              snap: false,
              color: '#2a3052',
              dashStyle: 'LongDashDot',
              zIndex: 4,
              label: {
                enabled: false,
                padding: 3,
                fontSize: 10,
                shape: 'rect',
                formatter: function(x) { 
                  const offset = options.timezoneOffset*-1 || 0;
                  if(x) return moment.utc(x).utcOffset(offset).format("ddd DD MMM HH:mm:ss");
                  return false;
                },
                style: {
                  color: 'white',
                  backgroundColor: '#2a3052'
                },
              },
            },
            ordinal: false
        },


        yAxis: [{
            opposite: false,
            labels: {
                reserveSpace: false,
                formatter: function() {
                    if(!current_symbol || !current_symbol.pip) return;
                    const digits_after_decimal = (current_symbol.pip+"").split(".")[1].length;
                    if ($(containerIDWithHash).data("overlayIndicator")) {
                        return (this.value > 0 ? ' + ' : '') + this.value + '%';
                    } 
                    return this.value.toFixed(digits_after_decimal);
                },
                x: 0,
                align: 'left',
            },
            crosshair: {
              enabled: true,
              snap: false,
              color: '#2a3052',
              dashStyle: 'LongDashDot',
              label: {
                enabled: true,
                align: 'left',
                backgroundColor: '#2a3052',
                padding: 1,
                borderRadius: 0,
                formatter: function(value) {
                  if(!value || !current_symbol || !current_symbol.pip) return;
                  const digits_after_decimal = (current_symbol.pip+"").split(".")[1].length;

                  return value.toFixed(digits_after_decimal);
                },
                style: {
                  color : 'white',
                  fontSize: '10px',
                  textAlign: 'left',
                },
                x: 0,
                y: 4,
              },
            }
        }],

        tooltip: {
            formatter: function() {
                if(!current_symbol || !current_symbol.pip) {
                  tooltip.removeClass('with-content');
                  return;
                }
                const digits_after_decimal = (current_symbol.pip+"").split(".")[1].length;
                const offset = options.timezoneOffset*-1 || 0;
                let s = `<span>${moment.utc(this.x).utcOffset(offset).format("ddd DD MMM HH:mm:ss")}</span></br>`;
                _.each(this.points, (row) => {
                    s += '<span style="color:' + row.point.color + '">\u25CF </span>';
                    if(typeof row.point.open !=="undefined") { //OHLC chart
                        s += "<b>" + row.series.name + "</b>";
                        s += `<br>  ${i18n('Open')}: ` + row.point.open.toFixed(digits_after_decimal);
                        s += `<br>  ${i18n('High')}: ` + row.point.high.toFixed(digits_after_decimal);
                        s += `<br>  ${i18n('Low')}: ` + row.point.low.toFixed(digits_after_decimal);
                        s += `<br>  ${i18n('Close')}: ` + row.point.close.toFixed(digits_after_decimal);
                    } else {
                        s += row.series.name + ": <b>" + row.point.y.toFixed(digits_after_decimal) + "</b>";
                    }
                    s += "<br>";
                });
                tooltip.html(s);
                tooltip.addClass('with-content');
                return false;
                return s;
            },
            hideDelay: 0,
            zIndex: 5,
            shape: 'square',
            enabled: true,
            // enabledIndicators: true
        },

        exporting: {
            enabled: false,
            url: 'https://export.highcharts.com',
            // Naming the File
            filename: options.instrumentName.split(' ').join('_') + "(" + options.timePeriod + ")"
        }

    });
};

export const triggerReflow = (containerIDWithHash) => {
    if ($(containerIDWithHash).highcharts()) {
        $(containerIDWithHash).highcharts().reflow();
    }
};

export const refresh = function(containerIDWithHash, newTimePeriod, newChartType, indicators, overlays) {
    const dialog = $(containerIDWithHash);
    const options = $(containerIDWithHash).data();
    if (newTimePeriod) {
        //Unsubscribe from tickstream.
        const key = chartingRequestMap.keyFor(options.instrumentCode, options.timePeriod, options.start);
        chartingRequestMap.unregister(key, containerIDWithHash);
        dialog.data("timePeriod", newTimePeriod);
    }
    if (newChartType) {
       dialog.data("type", newChartType);
    } else {
       newChartType = options.type;
    }

    //Get all series details from this chart
    const chart = dialog.highcharts();
    let loadedMarketData = [];
    let series_compare;
    /* for ohlc and candlestick series_compare must NOT be percent */
    if (newChartType !== 'ohlc' && newChartType !== 'candlestick') {
        $(chart.series).each((index, series) => {
            if (series.userOptions.isInstrument) {
                loadedMarketData.push(series.name);
                //There could be one valid series_compare value per chart
                series_compare = series.userOptions.compare;
            }
        });
    }
    let overlaysReadyPromise = Promise.resolve();
    if (!overlays) {
        overlays = [];
        overlaysReadyPromise = marketData().then((markets) => {
           loadedMarketData.forEach((value) => {
               const marketDataObj = specificMarketDataSync(value, markets);
               if (marketDataObj.symbol !== undefined && $.trim(marketDataObj.symbol) != options.instrumentCode) {
                   const overlay = {
                       symbol: marketDataObj.symbol,
                       displaySymbol: value,
                       delay_amount: marketDataObj.delay_amount
                   };
                   overlays.push(overlay);
               }
           });
        });
    }
   overlaysReadyPromise.then(() => {
      drawChart(containerIDWithHash, {
         instrumentCode: options.instrumentCode,
         instrumentName: options.instrumentName,
         timePeriod: options.timePeriod,
         timezoneOffset: options.timezoneOffset || 0,
         type: options.type,
         series_compare: series_compare,
         delayAmount: options.delayAmount,
         overlays: overlays,
         indicators: indicators,
         start: options.start
      }, (new_chart) => {
      });
   });
};

liveapi.events.on('connection-reopen', () => {
   const map = chartingRequestMap.getMap();
   const map_clone = _.cloneDeep(map);
   _.each(map_clone, (data, key) => {
      const chartIds = _.map(data.chartIDs, 'containerIDWithHash');
      delete map[key];
      _.each(chartIds, chartId => refresh(chartId));
   });
});

export const addIndicator = (containerIDWithHash, options) => {
    if ($(containerIDWithHash).highcharts()) {
        const chart = $(containerIDWithHash).highcharts();
        const series = chart.series[0];
        if (series) {
            chart.addIndicator($.extend({
                id: series.options.id
            }, options));
        }
    }
};

/**
 * Function to overlay instrument on base chart
 * @param containerIDWithHash
 * @param overlayInsCode
 * @param overlayInsName
 */
export const overlay = (containerIDWithHash, overlayInsCode, overlayInsName, delayAmount) => {
    if ($(containerIDWithHash).highcharts()) {
        const chart = $(containerIDWithHash).highcharts();
        const indicator_series = chart.get_indicator_series();
        //const mainSeries_instCode     = $(containerIDWithHash).data("instrumentCode");
        //const mainSeries_instName     = $(containerIDWithHash).data("instrumentName");
        /*
            We have to first set the data to NULL and then recaculate the data and set it back
            This is needed, else highstocks throws error
         */
        const mainSeries_timePeriod = $(containerIDWithHash).data("timePeriod");
        const mainSeries_type = $(containerIDWithHash).data("type");
        chart.showLoading();

        chart.series.filter(series => series.userOptions.isBarrier).map(series => series.remove());

        chart.series.filter(
           series => (series.userOptions.isInstrument || series.userOptions.onChartIndicator) && series.userOptions.id !== 'navigator'
        ).forEach(series => series.update({ compare: 'percent' }));

        return new Promise((resolve, reject) => {
            liveapi.execute(() => {
                ohlc_handler.retrieveChartDataAndRender({
                    timePeriod: mainSeries_timePeriod,
                    instrumentCode: overlayInsCode,
                    containerIDWithHash: containerIDWithHash,
                    type: mainSeries_type,
                    instrumentName: overlayInsName,
                    series_compare: 'percent',
                    delayAmount: delayAmount
                }).then(() => {
                    chart && chart.set_indicator_series(indicator_series);
                    if(chart.series[0].data.length ===0){
                        console.trace();
                    }
                    resolve();
                }).catch((e) => {
                   console.error(e);
                   resolve();
                });
            });
        });
    }
    return Promise.resolve();
};

export const changeTitle = (containerIDWithHash, newTitle) => {
    const chart = $(containerIDWithHash).highcharts();
    chart && chart.setTitle(newTitle);
};

export default {
    drawChart,
    destroy,
    triggerReflow,
    generate_csv,
    refresh,
    addIndicator,
    overlay,
    changeTitle
};
