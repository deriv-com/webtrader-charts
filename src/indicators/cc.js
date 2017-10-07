import {uuid, toFixed} from '../common/utils.js';
/**
 * Created by Mahboob.M on 5/2/16.
 */

function getCCstate(options, indicators) {
    return {
        indicators: indicators,
        options: options,
    };
}

function setupCC(data, state) {
    /* Coppock = WMA[10] of  (ROC[14] + ROC[11]).*/
    state.shortRoc = new ROC(data, { period: options.shortRocPeriod, appliedTo: options.appliedTo }, indicators);
    state.longRoc = new ROC(data, { period: options.longRocPeriod, appliedTo: options.appliedTo }, indicators);

    var rocData = data.map((tick, i) => ({
        time:  tick.time,
        close: state.shortRoc.indicatorData[i].value,
    }));

    state.wmaData = new WMA(rocData, { period: options.wmaPeriod }, indicators);
    return state.wmaData.indicatorData;
}

function eachCC(tick, state, isUpdate) {
    var cc;
    if (!isUpdate) {
        var shortRoc = this.shortRoc.addPoint(tick)[0].value;
        var longRoc = this.longRoc.addPoint(tick)[0].value;
        cc = this.wmaData.addPoint({ time: tick.time, close: shortRoc + longRoc })[0].value;
    } else {
        var shortRoc = this.shortRoc.update(tick)[0].value;
        var longRoc = this.longRoc.update(tick)[0].value;
        cc = this.wmaData.update({ time: tick.time, close: shortRoc + longRoc })[0].value;
    }
    return [tick.time, cc];
}

function toStringCC() {
    return 'CC (' + this.options.shortRocPeriod + ', ' + this.options.longRocPeriod + ', ' + this.options.wmaPeriod + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
}

window.CC = makeIndicator('cc', eachTickCC, setupCC, getCCstate, toStringCC);
