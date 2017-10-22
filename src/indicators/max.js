import {uuid, toFixed} from '../common/utils.js';
import {makeIndicator} from './new_indicatorbase.js';
/**
 * Created by Mahboob.M on 1/29/16.
 */


function getMaxOverPeriod(data, index, period, getter) {
    if (index < (period - 1)) {
        return 0.0;
    }
    getter = getter || (x => x);
    var max = getter(data[index]);
    for (var i = 0; i < period; i++) {
        max = Math.max(max, getter(data[index - i]));
    }
    return max;
}

window.MAX = makeIndicator('max', function(ind) {
    var data = ind.priceData;
    var options = ind.options;
    var indicators = ind.indicators;
    var getter = tick => indicators.getIndicatorOrPriceValue(tick, options.appliedTo);

    ind.indicatorData = data.map((tick, i) => ({
        time:  tick.time,
        value: toFixed(getMaxOverPeriod(data, i, options.period, getter), 4),
    }));

    var eachTick = tick => {
        var max = getMaxOverPeriod(
            ind.priceData,
            ind.priceData.length - 1,
            options.period,
            getter
        );
        return [tick.time, toFixed(max, 4)];
    };

    return {
        next: eachTick,
        update: eachTick,
    };
});

MAX.prototype.toString = function() {
    return 'MAX (' + this.options.period + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};
