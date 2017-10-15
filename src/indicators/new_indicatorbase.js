import {uuid, toFixed} from '../common/utils.js';
import indicatorsArray from '../indicators-config.js';

/**
 * @param id - Indicator ID
 * @param F - (indicator) => {
 *      update: (tick) => [time, data],
 *      next: (tick) => [time, data],
 * }
 */
export const makeIndicator = function(id, F) {
    const klass = function(priceData, options, indicators) {
        IndicatorBase.call(this, priceData, options, indicators);
        this.priceData = priceData;
        this._f = F(this);
    };

    klass.prototype = Object.create(IndicatorBase.prototype);
    klass.prototype.constructor = klass;

    klass.toString = function() {
        var metadata = indicatorsArray[id];
        var s = metadata.short_display_name;
        var q = metadata.print
            .map(key => options[key])
            .join(', ');
        return s + '(' + q + ')';
    };

    klass.getIDs = function() {
        return [this.uniqueID];
    };

    // replace the last data point with the given `tick`
    klass.update = function(tick) {
        var last = priceData.length - 1;
        this.priceData[last] = tick;
        var [time, value] = this._f.update(tick);
        this.indicatorData[last] = {time, value};
        return [{
            id: this.uniqueID,
            value,
        }];
    };

    // called when we are given a new `tick`
    klass.addPoint = function(tick) {
        this.priceData.push(tick);
        var [time, value] = this._f.next(tick);
        this.indicatorData.push({time, value});
        return [{
            id: this.uniqueID,
            value,
        }];
    };

    return klass;
};
