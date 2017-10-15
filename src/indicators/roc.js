import {uuid, toFixed} from '../common/utils.js';
import {makeIndicator} from './new_indicatorbase.js';
/**
 * Created by Mahboob.M on 1/29/16.
 */

/**
 * @param data - array of datum
 * @param index - get ROC for data[`index`]
 * @param period - ROC period
 * @param getter - function to get the numerical value from datum in the
 *                 data array. if no getter is passed the default is
 *                 (x => x).
 */
function getROC(data, index, period, getter) {
    /*
    * Formula(OHLC or Candlestick) -
    * 	ROC = [(Close - Close n periods ago) / (Close n periods ago)] * 100
    * 		n - period
    */
    if (index < period) {
        return 0.0;
    }
    var getValue = getter || (x => x);
    var prev = getter(data[index - period]);
    var curr = getter(data[index]);
    return ((curr - prev) / prev) * 100;
}

window.ROC = makeIndicator('roc', function(ind) {
    var getter = (tick) => ind.indicators.getIndicatorOrPriceValue(tick, ind.options.appliedTo);
    var data = ind.priceData;
    ind.indicatorData = data.map((tick, index) => ({
        time: tick.time,
        value: getROC(data, index, ind.options.period, getter)
    }));
    var nextRoc = (tick) => {
        var roc = getROC(
            ind.priceData,
            ind.priceData.length - 1,
            ind.options.period,
            getter
        );
        return [tick.time, toFixed(roc, 4)];
    };
    return {
        update: nextRoc,
        next: nextRoc,
    };
});

ROC.prototype.toString = function () {
    return 'ROC (' + this.options.period + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};
