import {toFixed} from '../common/utils.js';
import {makeIndicator} from './new_indicatorbase.js';

var WMA2state = function(options) {
    return {
        options: options,
    };
};

var setupWMA2 = function(data, state) {
    var indicatorData = [];
    var windowStart = state.options.period - 1;
    for (var index = 0; index < data.length; index++) {
        var wmaValue = null;
        if (index >= windowStart) {
            wmaValue = 0.0;
            for (var subIndex = index, count = state.options.period; subIndex >= 0 && count >= 0; count--, subIndex--) {
                var price = state.indicators.getIndicatorOrPriceValue(data[subIndex], state.options.appliedTo);
                wmaValue += price * count;
            }
            wmaValue = wmaValue / (state.options.period * (state.options.period + 1) / 2);
            wmaValue = toFixed(wmaValue, 4);
        }
        indicatorData.push({ time: data[index].time, value: wmaValue });
    }
    return indicatorData;
};

function eachTickWMA2(data, state) {
    var index = state.indicatorData.length - 1;
    var price = state.indicators.getIndicatorOrPriceValue(data, state.options.appliedTo);
    var wmaValue = state.options.period * price;
    for (var subIndex = index, count = state.options.period - 1; subIndex >= 0 && count >= 1; count--, subIndex--) {
        var price = state.indicators.getIndicatorOrPriceValue(state.priceData[subIndex], state.options.appliedTo);
        wmaValue += price * count;
    }
    wmaValue = wmaValue / (state.options.period * (state.options.period + 1) / 2);
    wmaValue = toFixed(wmaValue, 4);
    return [data.time, wmaValue];
};

window.WMA = makeIndicator('wma', eachTickWMA2, setupWMA2, WMA2state);
