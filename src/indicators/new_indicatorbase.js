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
 * @param f - Function called with ticks
 * @param g - Function called with array of historical data and options
 * @param h - Function called to get a state object
 *
 */
export const makeIndicator = function(id, f, g, h) {
    const uniqueID = uuid();
    return function(data, options, indicators) {
        var state = h(options);
        state.indicators = indicators;

        var priceData = data;
        var indicatorData = g(data, state);

        state.priceData = priceData;
        state.indicatorData = indicatorData;

        var u = {
            uniqueID: uniqueID,
            options: options,
            priceData: priceData,
            indicatorData: indicatorData,

            buildSeriesAndAxisConfFromData: metadata => buildConfig(options, u, metadata),

            getIDs: () => [uniqueID],

            update: tick => {
                var last = priceData.length - 1;
                priceData[last] = tick;
                var [t, x] = f(tick, state);
                indicatorData[last] = {time: t, value: x};
                return [{
                    id: this.uniqueID,
                    value: x,
                }];
            },

            addPoint: tick => {
                var [t, x] = f(tick, state, priceData);
                indicatorData.push({time: t, value: x});
                priceData.push(tick);
                return [{
                    id: uniqueID,
                    value: x,
                }];
            },

            toString: () => {
                var metadata = indicatorsArray[id];
                var s = metadata.short_display_name;
                var q = metadata.print
                    .map(key => options[key])
                    .join(', ');
                return s + '(' + q + ')';
            },
        };
        return u;
    };
};
