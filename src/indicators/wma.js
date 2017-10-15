import {toFixed} from '../common/utils.js';
import {makeIndicator} from './new_indicatorbase.js';

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

window.WMA = makeIndicator('wma', function(ind) {
    var getter = (tick) => ind.indicators.getIndicatorOrPriceValue(tick, ind.options.appliedTo);
    var data = ind.priceData;
    ind.indicatorData = data.map((tick, i) => {
        var wma = null;
        if (i >= ind.options.period - 1) {
            wma = getWMA(data, i, ind.options.period, getter);
        }
        return {time: tick.time, value: wma};
    });
    var eachTick = (tick) => {
        var wmaValue = getWMA(
            ind.priceData,
            ind.indicatorData.length - 1,
            ind.options.period,
            getter
        );
        wmaValue = toFixed(wmaValue, 4);
        return [tick.time, wmaValue];
    };
    return {
        update: eachTick,
        next: eachTick,
    };
});
