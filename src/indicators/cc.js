import {uuid, toFixed} from '../common/utils.js';
import {makeIndicator} from '../indicators/new_indicatorbase.js';
/**
 * Created by Mahboob.M on 5/2/16.
 */

window.CC = makeIndicator('cc', function(ind) {
    var data = ind.priceData;
    /* Coppock = WMA[10] of  (ROC[14] + ROC[11]).*/
    ind.shortRoc = new ROC(data, { period: options.shortRocPeriod, appliedTo: options.appliedTo }, indicators);
    ind.longRoc = new ROC(data, { period: options.longRocPeriod, appliedTo: options.appliedTo }, indicators);

    var rocData = data.map((tick, i) => ({
        time:  tick.time,
        close: ind.shortRoc.indicatorData[i].value,
    }));

    ind.wmaData = new WMA(rocData, { period: options.wmaPeriod }, indicators);
    ind.indicatorData = ind.wmaData.indicatorData;

    return {
        update: tick => {
            var shortRoc = this.shortRoc.update(tick)[0].value;
            var longRoc = this.longRoc.update(tick)[0].value;
            var cc = this.wmaData.update({ time: tick.time, close: shortRoc + longRoc })[0].value;
            return [tick.time, cc];
        },
        next: tick => {
            var shortRoc = this.shortRoc.addPoint(tick)[0].value;
            var longRoc = this.longRoc.addPoint(tick)[0].value;
            var cc = this.wmaData.addPoint({ time: tick.time, close: shortRoc + longRoc })[0].value;
            return [tick.time, cc];
        },
    };
});

CC.prototype.toString = function() {
    return 'CC (' + this.options.shortRocPeriod + ', ' + this.options.longRocPeriod + ', ' + this.options.wmaPeriod + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};
