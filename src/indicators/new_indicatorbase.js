import {uuid, toFixed} from '../common/utils.js';
import indicatorsArray from '../indicators-config.js';

function buildConfig(options, indicator, metadata) {
    var data = indicator.indicatorData.map(e => [e.time, e.value]);
    var config = {
        axisConf : { // Secondary yAxis
            id: metadata.id + '-' + indicator.uniqueID,
            title: {
                text: indicator.toString(),
                align: 'high',
                offset: 0,
                rotation: 0,
                y: 10, //Trying to show title inside the indicator chart
                x: 30+ indicator.toString().length * 7.5
            },
            lineWidth: 2,
            plotLines: options.levels,
            plotBands: options.plotBands
        },
        seriesConf : {
            id: indicator.uniqueID,
            name: indicator.toString(),
            data: data,
            type: 'line',
            yAxis: metadata.id + '-' + indicator.uniqueID,
            color: options.stroke,
            lineWidth: options.strokeWidth,
            dashStyle: options.dashStyle
        }
    };
    if (metadata.onChartIndicator) {
        delete config.axisConf;
        delete config.seriesConf.yAxis;
        config.seriesConf.onChartIndicator = true;
    }
    return [config];
}


/**
 *
 * @param id - Indicator ID
 * @param f - (tick, state, isUpdate) => {time: t, value: x}
 * @param g - ([tick...], options, indicators) => State Object
 * @param h - (options, indicators) => State Object
 * @param s - optional (state) => String
 *
 */
export const makeIndicator = function(id, f, g, h, s) {
    const uniqueID = uuid();
    // NOTE: `indicators` is an injected helper module
    return function(priceData, options, indicators) {
        var toString = s || (() => {
            var metadata = indicatorsArray[id];
            var s = metadata.short_display_name;
            var q = metadata.print
                .map(key => options[key])
                .join(', ');
            return s + '(' + q + ')';
        });

        var state = h(options, indicators);
        var indicatorData = g(priceData, state);

        state.priceData = priceData;
        state.indicatorData = indicatorData;

        var u = {
            uniqueID: uniqueID,
            options: options,
            priceData: priceData,
            indicatorData: indicatorData,
            toString: toString,

            getIDs: () => [uniqueID],
            buildSeriesAndAxisConfFromData: metadata => buildConfig(options, u, metadata),

            // replace the last data point with the given `tick`
            update: tick => {
                var last = priceData.length - 1;
                priceData[last] = tick;
                var [t, x] = f(tick, state, true);
                indicatorData[last] = {time: t, value: x};
                return [{
                    id: this.uniqueID,
                    value: x,
                }];
            },

            // called when we are given a new `tick`
            addPoint: tick => {
                priceData.push(tick);
                var [t, x] = f(tick, state, false);
                indicatorData.push({time: t, value: x});
                return [{
                    id: uniqueID,
                    value: x,
                }];
            },
        };
        return u;
    };
};
