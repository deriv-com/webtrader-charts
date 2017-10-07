import {toFixed} from '../common/utils.js';
import {makeIndicator} from './new_indicatorbase.js';

function WMA2state(options, indicators) {
    return {
        indicators: indicators,
        options: options,
        getter: tick => {
            return indicators.getIndicatorOrPriceValue(
                tick,
                options.appliedTo
            );
        },
    };
}

/*
 * @param data - array of numbers
 * @param start - array index to start from
 * @param period - WMA window size/length
 * @param getter - function to get the next data value. if no getter is passed
 *                 then the getter function will default to (x => x).
 *
 */
function getWMA(data, start, period, getter) {
    var getValue = getter || (x => x);
    var value = 0;
    for (var i=start, count=period; i >= 0 && count >= 0; i--, count--) {
        value += getValue(data[i]) * count;
    }
    value = value / (period * (period + 1) / 2);
    return value;
}

function setupWMA2(data, state) {
    var windowStart = state.options.period - 1;
    return data.map((tick, i) => {
        var wma = null;
        if (i >= windowStart) {
            wma = getWMA(data, i, state.options.period, state.getter);
        }
        return {
            time: tick.time,
            value: wma,
        };
    });
}

function eachTickWMA2(data, state) {
    var wmaValue = getWMA(
        state.priceData,
        state.indicatorData.length - 1,
        state.options.period,
        state.getter
    );
    wmaValue = toFixed(wmaValue, 4);
    return [data.time, wmaValue];
}

window.WMA = makeIndicator('wma', eachTickWMA2, setupWMA2, WMA2state);
