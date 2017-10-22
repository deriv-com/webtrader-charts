import {uuid, toFixed} from '../common/utils.js';
import {makeIndicator} from '../indicators/new_indicatorbase.js';
/**
 * Created by Mahboob.M on 5/2/16.
 */

window.CC = makeIndicator('cc', function(ind) {
    var data = ind.priceData;
    var options = ind.options;
    var indicators = ind.indicators;

    /* Coppock = WMA[10] of  (ROC[14] + ROC[11]).*/
    var shortRoc = new ROC(data, { period: options.shortRocPeriod, appliedTo: options.appliedTo }, indicators);
    var longRoc = new ROC(data, { period: options.longRocPeriod, appliedTo: options.appliedTo }, indicators);

    var rocData = data.map((tick, i) => ({
        time:  tick.time,
        close: shortRoc.indicatorData[i].value + longRoc.indicatorData[i].value,
    }));

    var wmaData = new WMA(rocData, { period: options.wmaPeriod }, indicators);
    ind.indicatorData = wmaData.indicatorData;

    return {
        update: tick => {
            var short = shortRoc.update(tick)[0].value;
            var long  = longRoc.update(tick)[0].value;
            var cc = wmaData.update({ time: tick.time, close: short + long })[0].value;
            return [tick.time, cc];
        },
        next: tick => {
            var short = shortRoc.addPoint(tick)[0].value;
            var long = longRoc.addPoint(tick)[0].value;
            var cc = wmaData.addPoint({ time: tick.time, close: short + long })[0].value;
            return [tick.time, cc];
        },
    };
});

CC.prototype.toString = function() {
    return 'CC (' + this.options.shortRocPeriod + ', ' + this.options.longRocPeriod + ', ' + this.options.wmaPeriod + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};
