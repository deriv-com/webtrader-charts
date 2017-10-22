import {uuid, toFixed} from '../common/utils.js';
import {makeIndicator} from './new_indicatorbase.js';
/**
 * Created by Mahboob.M on 1/29/16.
 */


function getMinOverPeriod(data, index, period, getter) {
    if (index < (period - 1)) {
        return 0.0;
    }
    getter = getter || (x => x);
    var min = getter(data[index]);
    for (var i = 0; i < period; i++) {
        min = Math.min(min, getter(data[index - i]));
    }
    return min;
}

window.MIN = makeIndicator('min', function(ind) {
    var data = ind.priceData;
    var options = ind.options;
    var indicators = ind.indicators;
    var getter = tick => indicators.getIndicatorOrPriceValue(tick, options.appliedTo);

    ind.indicatorData = data.map((tick, i) => ({
        time:  tick.time,
        value: toFixed(getMinOverPeriod(data, i, options.period, getter), 4),
    }));

    var eachTick = tick => {
        var min = getMinOverPeriod(
            ind.priceData,
            ind.priceData.length - 1,
            options.period,
            getter
        );
        return [tick.time, toFixed(min, 4)];
    };

    return {
        next: eachTick,
        update: eachTick,
    };
});

MAX.prototype.toString = function() {
    return 'MIN (' + this.options.period + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};
