import _ from 'lodash';

var CDL = function(e, n, a) {
    IndicatorBase.call(this, e, n, a);
    this.priceData = [];
    this.priceData.push(e[0]);
    this.priceData.push(e[1]);
    for (var l = 2; l < e.length; l++) {
        this.priceData.push(e[l]);
        var s = this.calculateIndicatorValue(this.options.cdlIndicatorCode);
        if (s) {
            this.indicatorData.push(s);
        }
    }
};

CDL.prototype = Object.create(IndicatorBase.prototype);

CDL.prototype.constructor = CDL;

CDL.prototype.addPoint = function(e) {
    this.priceData.push(e);
    var n = this.calculateIndicatorValue(this.options.cdlIndicatorCode) || {};
    if (n.text) {
        this.indicatorData.push(n);
    }
    return [ {
        id: this.uniqueID,
        value: new CDLUpdateObject(n.x || e.time, n.title, n.text)
    } ];
};

CDL.prototype.update = function(e) {
    var n = this.priceData.length - 1;
    this.priceData[n].open = e.open;
    this.priceData[n].high = e.high;
    this.priceData[n].low = e.low;
    this.priceData[n].close = e.close;
    var a = this.calculateIndicatorValue(this.options.cdlIndicatorCode) || {};
    if (a.text) {
        this.indicatorData[n] = a;
    }
    return [ {
        id: this.uniqueID,
        value: new CDLUpdateObject(a.x || e.time, a.title, a.text)
    } ];
};

CDL.prototype.toString = function() {
    return this.indicators.getIndicatorsJSONData()[this.options.cdlIndicatorCode].long_display_name;
};

CDL.prototype.buildSeriesAndAxisConfFromData = function(e) {
    return [ {
        seriesConf: {
            id: this.uniqueID,
            name: this.toString(),
            data: this.indicatorData,
            type: "flags",
            dashStyle: this.options.dashStyle,
            onChartIndicator: true,
            onSeries: this.options.onSeriesID,
            shape: "flag",
            turboThreshold: 0
        }
    } ];
};

var CDLUpdateObject = function(e, n, a) {
    this.x = e;
    this.title = n;
    this.text = a;
    this.toJSObject = function() {
        return {
            x: e,
            title: n,
            text: a
        };
    };
};

CDL.prototype.CDL2CROWS = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = e.l && e.s && (e.o > e.i && e._ > e.i) && e.C && (e.O < e.o && e.O > e._) && (e.h < e.i && e.h > e.t);
    var a = e.T && e.L && (e.o < e.i && e._ < e.i) && e.D && (e.O > e.o && e.O < e._) && (e.h > e.i && e.h < e.t);
    return {
        isBear: n,
        isBull: a
    };
};

CDL.prototype.CDLDOJI = function(e, n, a, l) {
    var s = e === l, o = Math.abs(e - n), d = Math.abs(e - a), c = Math.abs(a - n), i = Math.abs(e - l);
    var _ = (s || c * .05 >= i) && o < d;
    var r = (s || c * .05 >= i) && o > d;
    var C = (s || c * .05 >= i) && o > i && d > i;
    return {
        isBull: r,
        isBear: _,
        isDoji: C
    };
};

CDL.prototype.CDL3BLACKCROWS = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = false;
    if (e.p >= 0) {
        n = e.T && e.s && e.C && e.i < e.u && e._ < e.v && e.h < e.A && _.inRange(e.t, e.B, e.M) && _.inRange(e.o, e.i, e.t) && _.inRange(e.O, e._, e.o);
    }
    var a = false;
    return {
        isBull: a,
        isBear: n
    };
};

CDL.prototype.CDL3INSIDE = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = e.l && e.s && _.inRange(e.o, e.t, e.i) && _.inRange(e._, e.t, e.i) && e.C && e.h < e._;
    var a = e.T && e.L && _.inRange(e.o, e.i, e.t) && _.inRange(e._, e.i, e.t) && e.D && e.h > e._;
    return {
        isBear: n,
        isBull: a
    };
};

CDL.prototype.CDL3LINESTRIKE = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = false, a = false;
    if (e.p >= 0) {
        n = e.F && e.T && e.i < e.B && e.s && e._ < e.i && e.D && (e.h > e.M && e.O < e._);
        a = e.I && e.l && e.i > e.B && e.L && e._ > e.i && e.C && (e.h < e.M && e.O < e._);
    }
    return {
        isBear: a,
        isBull: n
    };
};

CDL.prototype.CDL3OUTSIDE = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = e.l && e.s && e.o > e.i && e._ < e.t && e.C;
    var a = e.T && e.L && e.o < e.i && e._ > e.t && e.D;
    return {
        isBear: n,
        isBull: a
    };
};

CDL.prototype.CDL3STARSSOUTH = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = Math.abs(e.i - e.t), a = Math.abs(e._ - e.o), l = Math.abs(e.h - e.O);
    var s = Math.abs(e.v - Math.min(e.i, e.t));
    var o = this.CDLMARUBOZU(e.O, e.g, e.S, e.h);
    var d = e.T && s >= n && e.s && e.A > e.v && e.o < e.t && a < n && o.isBear && e.S > e.A && l < a;
    var c = false;
    return {
        isBear: c,
        isBull: d
    };
};

CDL.prototype.CDLABANDONEDBABY = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = this.CDLDOJI(e.o, e.H, e.A, e._);
    var a = e.l && n.isDoji && e.A > e.G && e.C && e.A > e.g;
    var l = e.T && n.isDoji && e.H < e.v && e.D && e.H < e.S;
    return {
        isBear: a,
        isBull: l
    };
};

CDL.prototype.CDLADVANCEBLOCK = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = Math.abs(e.O - e.h), a = Math.abs(e.t - e.i), l = Math.abs(e.o - e._), s = Math.abs(e.G - e.i), o = Math.abs(e.H - e._), d = Math.abs(e.g - e.h);
    var c = false;
    var i = e.l && this.indicators.isLongCandle(e.t, e.G, e.v, e.i) && e.L && l <= a && e._ > e.i && e.o <= e.i && e.o > e.t && e.D && n <= l && e.h > e._ && e.O <= e._ && e.O > e.o && o > s && d > s;
    return {
        isBear: i,
        isBull: c
    };
};

CDL.prototype.CDLBELTHOLD = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = e.T && e.s && e.D && this.indicators.isLongCandle(e.O, e.g, e.S, e.h) && e.O === e.S && e.O < e._;
    var a = e.l && e.L && e.C && this.indicators.isLongCandle(e.O, e.g, e.S, e.h) && e.O === e.g && e.O > e._;
    return {
        isBear: a,
        isBull: n
    };
};

CDL.prototype.CDLBREAKAWAY = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = false, a = false;
    if (e.p >= 0 && e.N > 0) {
        var l = Math.abs(e.R - e.m);
        var s = l / 2;
        var n = e.P && this.indicators.isLongCandle(e.m, e.k, e.U, e.R) && e.F && Math.abs(e.B - e.M) < s && e.M < e.R && Math.abs(e.i - e.t) < s && Math.min(e.i, e.t) < e.B && Math.abs(e._ - e.o) < s && Math.min(e._, e.o) < Math.min(e.i, e.t) && e.D && e.O > Math.min(e._, e.o) && e.h > e.M && e.h < e.m;
        var a = e.K && e.I && Math.abs(e.B - e.M) < e.shortCandleSize && e.M > e.R && Math.abs(e.i - e.t) < s && Math.max(e.i, e.t) > e.B && Math.abs(e._ - e.o) < s && Math.max(e._, e.o) > Math.max(e.i, e.t) && e.C && e.O < Math.max(e._, e.o) && e.h < e.M && e.h > e.R;
    }
    return {
        isBull: n,
        isBear: a
    };
};

CDL.prototype.CDLCLOSINGMARUBOZU = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = e.C && this.indicators.isLongCandle(e.O, e.g, e.S, e.h) && e.S === e.h;
    var a = e.D && this.indicators.isLongCandle(e.O, e.g, e.S, e.h) && e.g === e.h;
    return {
        isBear: n,
        isBull: a
    };
};

CDL.prototype.CDLCOUNTERATTACK = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = Math.abs(e._ - e.o);
    var a = e.s && e.D && e.h <= e._ + n * .05 && e.h >= e._ - n * .05;
    var l = e.L && e.C && e.h <= e._ + n * .05 && e.h >= e._ - n * .05;
    return {
        isBear: l,
        isBull: a
    };
};

CDL.prototype.CDLDARKCLOUDCOVER = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = false;
    var a = e.L && e.C && e.O > e._ && e.h < e.o + Math.abs(e.o - e._) / 2 && e.h > e.o;
    return {
        isBear: a,
        isBull: n
    };
};

CDL.prototype.CDLDOJISTAR = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = this.CDLDOJI(e.O, e.g, e.S, e.h);
    var a = e.L && this.indicators.isLongCandle(e.o, e.H, e.A, e._) && n.isBear && e.h >= e._;
    var l = e.s && this.indicators.isLongCandle(e.o, e.H, e.A, e._) && n.isBull && e.h <= e._;
    return {
        isBear: a,
        isBull: l
    };
};

CDL.prototype.CDL3WHITESOLDIERS = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = false, a = false;
    if (e.p >= 0) {
        n = e.l && e.i >= e.B && this.indicators.isLongCandle(e.t, e.G, e.v, e.i) && e.L && e.o >= e.t && e.o <= e.i && e._ >= e.i && this.indicators.isLongCandle(e.o, e.H, e.A, e._) && e.D && e.O >= e.o && e.O <= e._ && e.h >= e._ && this.indicators.isLongCandle(e.O, e.g, e.S, e.h);
        a = false;
    }
    return {
        isBear: a,
        isBull: n
    };
};

CDL.prototype.CDLDRAGONFLYDOJI = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = Math.abs(e.S - Math.min(e.O, e.h)), a = Math.abs(e.g - Math.max(e.O, e.h)), l = Math.abs(e.S - e.g), s = Math.abs(e.O - e.h), o = (e.O === e.h || s < l * .1) && (e.g === Math.max(e.O, e.h) || a < l * .1), d = n >= l * .6;
    var c = e.s && o && d;
    var i = e.L && o && d;
    return {
        isBear: i,
        isBull: c
    };
};

CDL.prototype.CDLENGULFING = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = Math.abs(e.S - Math.min(e.O, e.h)), a = Math.abs(e.g - Math.max(e.O, e.h)), l = Math.abs(e.S - e.g), s = Math.abs(e.O - e.h), o = (e.O === e.h || s < l * .1) && (e.g === Math.max(e.O, e.h) || a < l * .1), d = n >= l * .6;
    var c = e.L && e.C && e._ < e.O && e.o > e.h;
    var i = e.s && e.D && e._ > e.O && e.o < e.h;
    return {
        isBear: c,
        isBull: i
    };
};

CDL.prototype.CDLEVENINGDOJISTAR = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = false, a = false;
    if (e.p >= 0) {
        var l = Math.abs(e.O - e.h), s = Math.abs(e.t - e.i), o = Math.abs(e.A - e.H), d = e.o === e._ || o * .1 >= Math.abs(e.o - e._);
        var n = false;
        var a = e.i >= Math.max(e.B, e.M) && e.l && this.indicators.isLongCandle(e.t, e.G, e.v, e.i) && d && Math.min(e.o, e._) > e.i && e.C && this.indicators.isLongCandle(e.O, e.g, e.S, e.h) && e.O < Math.min(e.o, e._) && e.h > e.t && e.h < e.i;
    }
    return {
        isBear: a,
        isBull: n
    };
};

CDL.prototype.CDLEVENINGSTAR = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = false, a = false;
    if (e.p >= 0) {
        var l = Math.abs(e.O - e.h);
        var s = Math.abs(e.o - e._);
        var o = Math.abs(e.A - e.H);
        var d = Math.abs(e.t - e.i);
        var n = false;
        var a = e.i >= Math.max(e.B, e.M) && e.l && this.indicators.isLongCandle(e.t, e.G, e.v, e.i) && s >= o * .1 && Math.min(e.o, e._) > e.i && e.C && this.indicators.isLongCandle(e.O, e.g, e.S, e.h) && e.O < Math.min(e.o, e._) && e.h > e.t && e.h < e.i;
    }
    return {
        isBear: a,
        isBull: n
    };
};

CDL.prototype.CDLGAPSIDESIDEWHITE = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = e.l && e.L && e.o > e.i && e.D && e.O > e.i && e.O < e._ && e.h <= e._ + Math.abs(e._ - e.o) * .1;
    var a = e.T && e.L && e._ < e.i && e.D && e.h < e.i && e.O < e._ && e.h <= e._ + Math.abs(e._ - e.o) * .1;
    return {
        isBear: a,
        isBull: n
    };
};

CDL.prototype.CDLGRAVESTONEDOJI = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = Math.abs(e.g - Math.max(e.O, e.h)), a = Math.abs(e.S - e.g), l = (e.O === e.h || a * .05 >= Math.abs(e.O - e.h)) && e.S === Math.min(e.O, e.h) || a * .05 >= Math.abs(e.S - Math.min(e.O, e.h)), s = n >= a * .8;
    var o = e.s && l && s;
    var d = e.L && l && s;
    return {
        isBear: d,
        isBull: o
    };
};

CDL.prototype.CDLHAMMER = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = Math.abs(Math.max(e.O, e.h) - e.g), a = Math.abs(e.O - e.h), l = Math.abs(e.S - e.g), s = Math.abs(e.S - Math.min(e.h, e.O)), o = a < l * .4 && (e.g === Math.max(e.O, e.h) || n < l * .1);
    var d = e.s && e.o < Math.min(e.i, e.t) && o && s >= 2 * a && e.h < e._;
    var c = false;
    return {
        isBear: c,
        isBull: d
    };
};

CDL.prototype.CDLHANGINGMAN = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = Math.abs(Math.max(e.O, e.h) - e.g), a = Math.abs(e.O - e.h), l = Math.abs(e.S - e.g), s = Math.abs(e.S - Math.min(e.h, e.O)), o = a < l * .4 && (e.g === Math.max(e.O, e.h) || n < l * .1);
    var d = e.L && e.o > Math.max(e.i, e.t) && o && e.C && s >= 2 * a && e.h > e._;
    var c = false;
    var i = {
        isBear: d,
        isBull: c
    };
    return i;
};

CDL.prototype.CDLHARAMI = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = e.s && this.indicators.isLongCandle(e.o, e.H, e.A, e._) && e.D && e.O > e._ && e.h < e.o && Math.abs(e.O - e.h) < Math.abs(e.o - e._) * .6;
    var a = e.L && this.indicators.isLongCandle(e.o, e.H, e.A, e._) && e.C && e.O < e._ && e.h > e.o && Math.abs(e.O - e.h) < Math.abs(e.o - e._) * .6;
    return {
        isBear: a,
        isBull: n
    };
};

CDL.prototype.CDLHARAMICROSS = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = this.CDLDOJI(e.O, e.g, e.S, e.h);
    var a = e.s && n.isBull && Math.min(e.h, e.O) > e._ && Math.max(e.h, e.O) < e.o;
    var l = e.L && n.isBear && Math.min(e.h, e.O) > e.o && Math.max(e.h, e.O) < e._;
    return {
        isBear: l,
        isBull: a
    };
};

CDL.prototype.CDLHOMINGPIGEON = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = Math.abs(e.h - e.O);
    var a = e.s && this.indicators.isLongCandle(e.o, e.H, e.A, e._) && e.C && e.S > e.A && e.h > e._ && e.g < e.H && e.O < e.o;
    var l = false;
    return {
        isBear: l,
        isBull: a
    };
};

CDL.prototype.CDLHIKKAKE = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = false, a = false;
    if (e.p >= 0 && e.N > 0) {
        var n = Math.max(e.R, e.m) > Math.max(e.B, e.M) && Math.min(e.R, e.m) < Math.min(e.B, e.M) && Math.max(e.R, e.m) > Math.max(e.i, e.t) && Math.max(e.R, e.m) > Math.max(e._, e.o) && e.D && e.h > Math.max(e.R, e.m);
        var a = Math.max(e.R, e.m) > Math.max(e.B, e.M) && Math.min(e.R, e.m) < Math.min(e.B, e.M) && Math.min(e.R, e.m) < Math.min(e.i, e.t) && Math.min(e.R, e.m) < Math.min(e._, e.o) && e.C && e.h < Math.min(e.R, e.m);
    }
    return {
        isBull: n,
        isBear: a
    };
};

CDL.prototype.CDLIDENTICAL3CROWS = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = false, a = false;
    if (e.p >= 0) {
        var l = Math.abs(e.i - e.t), s = Math.abs(e._ - e.o), o = Math.abs(e.h - e.O);
        var n = false;
        var a = e.I && e.T && this.indicators.isLongCandle(e.t, e.G, e.v, e.i) && e.s && this.indicators.isLongCandle(e.o, e.H, e.A, e._) && (e.o === e.i || Math.abs(e.i - e.o) < l * .1) && e._ < e.i && e.C && this.indicators.isLongCandle(e.O, e.g, e.S, e.h) && (e.O === e._ || Math.abs(e._ - e.O) < s * .1) && e.h < e._;
    }
    return {
        isBull: n,
        isBear: a
    };
};

CDL.prototype.CDLINNECK = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = Math.abs(e._ - e.o);
    var a = e.l && e.L && this.indicators.isLongCandle(e.o, e.H, e.A, e._) && e.C && e.O > e.H && e.h < e._ && e.h > e._ - n * .1;
    var l = e.T && e.s && this.indicators.isLongCandle(e.o, e.H, e.A, e._) && e.D && e.O < e.A && e.h > e._ && e.h < e._ + n * .1;
    return {
        isBull: a,
        isBear: l
    };
};

CDL.prototype.CDLINVERTEDHAMMER = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = Math.abs(Math.max(e.O, e.h) - e.g), a = Math.abs(e.O - e.h), l = Math.abs(e.S - e.g), s = Math.abs(e.S - Math.min(e.h, e.O)), o = a < l * .4 && (e.S === Math.min(e.O, e.h) || s < l * .1);
    var d = Math.min(e._, e.o) < Math.min(e.t, e.i) && Math.min(e.h, e.O) < Math.min(e._, e.o) && o && n >= 2 * a;
    var c = false;
    return {
        isBull: d,
        isBear: c
    };
};

CDL.prototype.CDLKICKING = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = this.CDLMARUBOZU(e.O, e.g, e.S, e.h);
    var a = this.CDLMARUBOZU(e.o, e.H, e.A, e._);
    var l = a.isBear && n.isBull && e.h > e.o;
    var s = a.isBull && n.isBear && e.h < e.o;
    return {
        isBull: l,
        isBear: s
    };
};

CDL.prototype.CDLLADDERBOTTOM = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = false, a = false;
    if (e.p >= 0 && e.N > 0) {
        var n = e.P && e.F && e.M > e.R && e.B < e.R && e.M < e.m && e.T && e.t > e.B && e.i < e.B && e.t < e.M && e.s && e.H > e.i && e.H > e.o && e._ < e.i && e.o < e.t && e.D && e.O > e.o;
        var a = false;
    }
    return {
        isBull: n,
        isBear: a
    };
};

CDL.prototype.CDLKICKINGBYLENGTH = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = this.CDLMARUBOZU(e.O, e.g, e.S, e.h);
    var a = this.CDLMARUBOZU(e.o, e.H, e.A, e._);
    var l = a.isBear && this.indicators.isLongCandle(e.o, e.H, e.A, e._) && n.isBull && this.indicators.isLongCandle(e.O, e.g, e.S, e.h) && e.h > e.o;
    var s = a.isBull && this.indicators.isLongCandle(e.o, e.H, e.A, e._) && n.isBear && this.indicators.isLongCandle(e.O, e.g, e.S, e.h) && e.h < e.o;
    return {
        isBull: l,
        isBear: s
    };
};

CDL.prototype.CDLLONGLEGGEDDOJI = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = Math.abs(e.S - Math.min(e.O, e.h)), a = Math.abs(e.g - Math.max(e.O, e.h)), l = Math.abs(e.S - e.g), s = Math.abs(e.O - e.h), o = e.O === e.h || s < l * .1, d = n >= l * .4 && n <= l * .8, c = a >= l * .4 && a <= l * .8;
    var i = e.s && o && c && d;
    var _ = e.L && o && c && d;
    return {
        isBull: i,
        isBear: _
    };
};

CDL.prototype.CDLLONGLINE = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = Math.abs(e.S - Math.min(e.O, e.h)), a = Math.abs(e.g - Math.max(e.O, e.h)), l = Math.abs(e.S - e.g), s = Math.abs(e.h - e.O), o = n === 0 || n < l * .1, d = a === 0 || a < l * .1;
    var c = e.D && this.indicators.isLongCandle(e.O, e.g, e.S, e.h) && o && d;
    var i = e.C && this.indicators.isLongCandle(e.O, e.g, e.S, e.h) && o && d;
    return {
        isBull: c,
        isBear: i
    };
};

CDL.prototype.CDLMARUBOZU = function(e, n, a, l) {
    var s = CDLGETPARAMS(this.priceData);
    var o = Math.abs(a - Math.min(e, l)), d = Math.abs(n - Math.max(e, l)), c = Math.abs(a - n), i = Math.abs(l - e), _ = o === 0 || o <= c * .05, r = d === 0 || d <= c * .05;
    var C = l > e, O = l < e;
    var h = C && this.indicators.isLongCandle(e, n, a, l) && (r && _);
    var t = O && this.indicators.isLongCandle(e, n, a, l) && r && _;
    return {
        isBull: t,
        isBear: h
    };
};

CDL.prototype.CDLMATCHINGLOW = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = e.s && e.o > e.O && e.C && e.h === e._;
    var a = false;
    return {
        isBull: n,
        isBear: a
    };
};

CDL.prototype.CDLMATHOLD = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = false, a = false;
    if (e.p >= 0 && e.N > 0) {
        var n = e.K && this.indicators.isLongCandle(e.m, e.k, e.U, e.R) && e.F && e.B > e.R && e.T && e.i < e.B && e.s && e._ < e.i && e._ > e.m && e.D && this.indicators.isLongCandle(e.O, e.g, e.S, e.h) && e.h > e.M;
        var a = e.P && this.indicators.isLongCandle(e.m, e.k, e.U, e.R) && e.I && e.B < e.R && e.l && e.i > e.B && e.L && e._ > e.i && e._ < e.m && e.C && this.indicators.isLongCandle(e.O, e.g, e.S, e.h) && e.h < e.M;
    }
    return {
        isBull: n,
        isBear: a
    };
};

CDL.prototype.CDLMORNINGDOJISTAR = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = false, a = false;
    if (e.p >= 0) {
        var l = Math.abs(e.O - e.h), s = Math.abs(e.t - e.i), o = Math.abs(e.A - e.H), d = e.o === e._ || o * .1 >= Math.abs(e.o - e._);
        var n = e.i < Math.min(e.B, e.M) && e.T && this.indicators.isLongCandle(e.t, e.G, e.v, e.i) && d && Math.max(e.o, e._) < e.i && e.D && this.indicators.isLongCandle(e.O, e.g, e.S, e.h) && e.O > Math.max(e.o, e._) && e.h < e.t && e.h > e.i;
        var a = false;
    }
    return {
        isBull: n,
        isBear: a
    };
};

CDL.prototype.CDLMORNINGSTAR = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = false, a = false;
    if (e.p >= 0) {
        var l = Math.abs(e.O - e.h);
        var s = Math.abs(e.o - e._);
        var o = Math.abs(e.t - e.i);
        var n = e.i < Math.min(e.B, e.M) && e.T && o > s * 3 && s < o / 3 && Math.max(e.o, e._) < e.i && e.D && l > s * 3 && e.O > Math.max(e.o, e._) && e.h < e.t;
        var a = false;
    }
    return {
        isBull: n,
        isBear: a
    };
};

CDL.prototype.CDLONNECK = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = Math.abs(e._ - e.o);
    var a = e.l && e.L && this.indicators.isLongCandle(e.o, e.H, e.A, e._) && e.C && e.O > e.H && e.h >= e.H && e.h <= e.H + n * .1;
    var l = e.T && e.s && this.indicators.isLongCandle(e.o, e.H, e.A, e._) && e.D && e.O < e.A && e.h <= e.A && e.h >= e.A - n * .1;
    return {
        isBull: a,
        isBear: l
    };
};

CDL.prototype.CDLPIERCING = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = e.s && e.D && e.O < e._ && e.h > Math.abs(e.o + e._) / 2 && e.h < e.o;
    var a = false;
    return {
        isBull: n,
        isBear: a
    };
};

CDL.prototype.CDLRICKSHAWMAN = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = Math.abs(e.S - Math.min(e.O, e.h)), a = Math.abs(e.g - Math.max(e.O, e.h)), l = Math.abs(e.S - e.g), s = Math.abs(e.O - e.h), o = e.O === e.h || s < l * .1, d = n >= l * .4 && n <= l * .8, c = a >= l * .4 && a <= l * .8;
    var i = e.s && o && c && d;
    var _ = e.L && o && c && d;
    return {
        isBull: i,
        isBear: _
    };
};

CDL.prototype.CDLRISEFALL3METHODS = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = false, a = false;
    if (e.p >= 0 && e.N > 0) {
        var n = e.K && this.indicators.isLongCandle(e.m, e.k, e.U, e.R) && e.u > e.U && e.W < e.k && e.v > e.U && e.G < e.k && e.A > e.U && e.H < e.k && e.D && e.O > e._ && e.h > e.R;
        var a = e.P && this.indicators.isLongCandle(e.m, e.k, e.U, e.R) && e.u > e.U && e.W < e.k && e.v > e.U && e.G < e.k && e.A > e.U && e.H < e.k && e.C && e.O < e._ && e.h < e.R;
    }
    return {
        isBull: n,
        isBear: a
    };
};

CDL.prototype.CDLSEPARATINGLINES = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = e.O > Math.max(e.t, e.i) && e.s && this.indicators.isLongCandle(e.o, e.H, e.A, e._) && e.D && this.indicators.isLongCandle(e.O, e.g, e.S, e.h) && e.O === e.o;
    var a = e.O < Math.min(e.t, e.i) && e.L && this.indicators.isLongCandle(e.o, e.H, e.A, e._) && e.C && this.indicators.isLongCandle(e.O, e.g, e.S, e.h) && e.O === e.o;
    return {
        isBull: n,
        isBear: a
    };
};

CDL.prototype.CDLSHOOTINGSTAR = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = Math.abs(Math.max(e.O, e.h) - e.g), a = Math.abs(e.O - e.h), l = Math.abs(e.S - e.g), s = Math.abs(e.S - Math.min(e.h, e.O)), o = a < l * .4 && (e.S === Math.min(e.O, e.h) || s < l * .1);
    var d = Math.max(e._, e.o) > Math.max(e.t, e.i) && Math.max(e.h, e.O) > Math.max(e._, e.o) && o && n >= 2 * a;
    var c = false;
    return {
        isBull: c,
        isBear: d
    };
};

CDL.prototype.CDLSPINNINGTOP = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = e.g - Math.max(e.O, e.h), a = Math.min(e.O, e.h) - e.S, l = Math.abs(e.g - e.S), s = Math.abs(e.O - e.h);
    var o = e.s && e._ < Math.min(e.t, e.i) && e.D && e.O < e._ && s <= l * .3 && n > s && n < l * .5 && a > s && a < l * .5;
    var d = e.L && e._ > Math.max(e.t, e.i) && e.C && e.O > e._ && s <= l * .3 && n > s && n < l * .5 && a > s && a < l * .5;
    return {
        isBear: d,
        isBull: o
    };
};

CDL.prototype.CDLSTALLEDPATTERN = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = Math.abs(e.i - e.t), a = Math.abs(e._ - e.o), l = Math.abs(e.h - e.O);
    var s = e.T && this.indicators.isLongCandle(e.t, e.G, e.v, e.i) && e.s && this.indicators.isLongCandle(e.o, e.H, e.A, e._) && e.o <= e.t && e.C && e.O < e._;
    var o = e.l && this.indicators.isLongCandle(e.t, e.G, e.v, e.i) && e.L && this.indicators.isLongCandle(e.o, e.H, e.A, e._) && e.o >= e.t && e.D && e.O > e._;
    return {
        isBear: o,
        isBull: s
    };
};

CDL.prototype.CDLSTICKSANDWICH = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = false, a = false;
    if (e.p >= 0) {
        var l = Math.abs(e.i - e.t);
        var s = e.h === e.i || e.h <= e.i + l * .05 || e.h >= e.i - l * .05;
        var n = e.T && this.indicators.isLongCandle(e.t, e.G, e.v, e.i) && e.i < Math.min(e.B, e.M) && e.L && e._ > e.t && e.o > e.i && e.o < e.t && e.C && e.O > e._ && e.h < e.o && this.indicators.isLongCandle(e.O, e.g, e.S, e.h) && s;
        var a = e.l && this.indicators.isLongCandle(e.t, e.G, e.v, e.i) && e.i > Math.max(e.B, e.M) && e.s && e._ < e.t && e.o < e.i && e.o > e.t && e.D && e.O < e._ && e.h > e.o && this.indicators.isLongCandle(e.O, e.g, e.S, e.h) && s;
    }
    return {
        isBull: n,
        isBear: a
    };
};

CDL.prototype.CDLTAKURI = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = Math.abs(e.S - Math.min(e.O, e.h)), a = Math.abs(e.g - Math.max(e.O, e.h)), l = Math.abs(e.S - e.g), s = Math.abs(e.O - e.h), o = (e.O === e.h || s < l * .2) && (e.g === Math.max(e.O, e.h) || a < l * .2), d = n >= l * .8;
    var c = e.s && o && d;
    var i = e.L && o && d;
    return {
        isBull: c,
        isBear: i
    };
};

CDL.prototype.CDLTASUKIGAP = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = e.l && e.L && e.o > e.i && e.C && e.O > e.o && e.O < e._ && e.h < e.o && e.h > e.i;
    var a = e.T && e.s && e.o < e.i && e.D && e.O > e._ && e.O < e.o && e.h < e.i && e.h > e.o;
    return {
        isBear: a,
        isBull: n
    };
};

CDL.prototype.CDLTHRUSTING = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = e.s && this.indicators.isLongCandle(e.o, e.H, e.A, e._) && e.D && e.O < e._ && e.h <= e._ + Math.abs(e.o - e._) / 2 && e.h >= e._;
    var a = e.L && this.indicators.isLongCandle(e.o, e.H, e.A, e._) && e.C && e.O > e._ && e.h >= e._ - Math.abs(e.o - e._) / 2 && e.h <= e._;
    return {
        isBull: a,
        isBear: n
    };
};

CDL.prototype.CDLTRISTAR = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = this.CDLDOJI(e.t, e.G, e.v, e.i);
    var a = this.CDLDOJI(e.o, e.H, e.A, e._);
    var l = this.CDLDOJI(e.O, e.g, e.S, e.h);
    var s = n.isDoji && a.isDoji && Math.max(e._, e.o) < Math.min(e.i, e.t) && Math.max(e._, e.o) < Math.min(e.h, e.O) && l.isDoji;
    var o = n.isDoji && a.isDoji && Math.min(e._, e.o) > Math.max(e.i, e.t) && Math.min(e._, e.o) > Math.max(e.h, e.O) && l.isDoji;
    return {
        isBear: o,
        isBull: s
    };
};

CDL.prototype.CDLUNIQUE3RIVER = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = false, a = false;
    var l = Math.abs(e.o - e.H);
    var s = Math.abs(e.o - e._);
    var o = Math.abs(e.A - e._);
    var d = Math.abs(e.i - e.t);
    var n = e.T && this.indicators.isLongCandle(e.t, e.G, e.v, e.i) && e.s && e._ > e.i && e.o < e.t && e.A < e.v && e.D && e.h < e._;
    var a = false;
    return {
        isBull: n,
        isBear: a
    };
};

CDL.prototype.CDLUPSIDEGAP2CROWS = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = e.l && this.indicators.isLongCandle(e.t, e.G, e.v, e.i) && e.s && e._ > e.i && e.C && (e.h < e._ && e.O > e.o) && e.h > e.i;
    var a = false;
    return {
        isBear: a,
        isBull: n
    };
};

CDL.prototype.CDLXSIDEGAP3METHODS = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = e.l && this.indicators.isLongCandle(e.t, e.G, e.v, e.i) && e.L && this.indicators.isLongCandle(e.o, e.H, e.A, e._) && e.o > e.i && e.C && e.O > e.o && e.O < e._ && e.h < e.i && e.h > e.t;
    var a = e.T && this.indicators.isLongCandle(e.t, e.G, e.v, e.i) && e.s && this.indicators.isLongCandle(e.o, e.H, e.A, e._) && e.o < e.i && e.D && e.O < e.o && e.O > e._ && e.h > e.i && e.h < e.t;
    return {
        isBear: a,
        isBull: n
    };
};

CDL.prototype.CDLHIGHWAVE = function() {
    var e = CDLGETPARAMS(this.priceData);
    var n = Math.abs(e.h - e.O);
    var a = Math.abs(e.g - e.S);
    var l = Math.abs(e.g - Math.max(e.O, e.h));
    var s = Math.abs(Math.min(e.O, e.h) - e.S);
    var o = e.C && n > Math.max(l, s) * .05 && (n < s / 3 && n < l / 3);
    var d = e.D && n > Math.max(l, s) * .05 && (n < s / 3 && n < l / 3);
    return {
        isBear: o,
        isBull: d
    };
};

CDL.prototype.calculateIndicatorValue = function(e) {
    var n;
    var a = this.priceData[this.priceData.length - 1].time;
    switch (e.toUpperCase()) {
      case "CDL2CROWS":
        var l = this.CDL2CROWS();
        n = CDLADDFLAGINFO(l, a, "TC", "Two crows");
        break;

      case "CDLDOJI":
        var s = this.priceData.length - 1;
        var o = this.priceData[s].open, d = this.priceData[s].high, c = this.priceData[s].low, i = this.priceData[s].close;
        var l = this.CDLDOJI(o, d, c, i);
        n = CDLADDFLAGINFO(l, a, "D", "Doji");
        break;

      case "CDL3BLACKCROWS":
        var l = this.CDL3BLACKCROWS();
        n = CDLADDFLAGINFO(l, a, "TBC", "Three Black crows");
        break;

      case "CDL3INSIDE":
        var l = this.CDL3INSIDE();
        n = CDLADDFLAGINFO(l, a, "TIUD", "Three Inside Up/Down");
        break;

      case "CDL3LINESTRIKE":
        var l = this.CDL3LINESTRIKE();
        n = CDLADDFLAGINFO(l, a, "TLS", "Three-Line Strike");
        break;

      case "CDL3OUTSIDE":
        var l = this.CDL3OUTSIDE();
        n = CDLADDFLAGINFO(l, a, "TOUD", "Three Outside Up/Down");
        break;

      case "CDL3STARSSOUTH":
        var l = this.CDL3STARSSOUTH();
        n = CDLADDFLAGINFO(l, a, "TSS", "Three Stars In The South");
        break;

      case "CDL3WHITESOLDIERS":
        var l = this.CDL3WHITESOLDIERS();
        n = CDLADDFLAGINFO(l, a, "TWS", "Three Advancing White Soldiers");
        break;

      case "CDLABANDONEDBABY":
        var l = this.CDLABANDONEDBABY();
        n = CDLADDFLAGINFO(l, a, "AB", "Abandoned Baby");
        break;

      case "CDLADVANCEBLOCK":
        var l = this.CDLADVANCEBLOCK();
        n = CDLADDFLAGINFO(l, a, "AB", "Advance Block");
        break;

      case "CDLBELTHOLD":
        var l = this.CDLBELTHOLD();
        n = CDLADDFLAGINFO(l, a, "BH", "Belt-hold");
        break;

      case "CDLBREAKAWAY":
        var l = this.CDLBREAKAWAY();
        n = CDLADDFLAGINFO(l, a, "BA", "Breakaway");
        break;

      case "CDLCLOSINGMARUBOZU":
        var l = this.CDLCLOSINGMARUBOZU();
        n = CDLADDFLAGINFO(l, a, "CM", "Closing Marubozu");
        break;

      case "CDLCOUNTERATTACK":
        var l = this.CDLCOUNTERATTACK();
        n = CDLADDFLAGINFO(l, a, "CA", "Counterattack");
        break;

      case "CDLDARKCLOUDCOVER":
        var l = this.CDLDARKCLOUDCOVER();
        n = CDLADDFLAGINFO(l, a, "DCC", "Dark Cloud Cover");
        break;

      case "CDLDOJISTAR":
        var l = this.CDLDOJISTAR();
        n = CDLADDFLAGINFO(l, a, "DS", "Doji Star");
        break;

      case "CDLDRAGONFLYDOJI":
        var l = this.CDLDRAGONFLYDOJI();
        n = CDLADDFLAGINFO(l, a, "DD", "Dragonfly Doji");
        break;

      case "CDLENGULFING":
        var l = this.CDLENGULFING();
        n = CDLADDFLAGINFO(l, a, "EP", "Engulfing Pattern");
        break;

      case "CDLEVENINGDOJISTAR":
        var l = this.CDLEVENINGDOJISTAR();
        n = CDLADDFLAGINFO(l, a, "EDS", "Evening Doji Star");
        break;

      case "CDLEVENINGSTAR":
        var l = this.CDLEVENINGSTAR();
        n = CDLADDFLAGINFO(l, a, "ES", "Evening Star");
        break;

      case "CDLGAPSIDESIDEWHITE":
        var l = this.CDLGAPSIDESIDEWHITE();
        n = CDLADDFLAGINFO(l, a, "SSWL", "Up/Down-Gap Side-By-Side White Lines");
        break;

      case "CDLGRAVESTONEDOJI":
        var l = this.CDLGRAVESTONEDOJI();
        n = CDLADDFLAGINFO(l, a, "GSD", "Gravestone Doji");
        break;

      case "CDLHAMMER":
        var l = this.CDLHAMMER();
        n = CDLADDFLAGINFO(l, a, "H", "Hammer");
        break;

      case "CDLHANGINGMAN":
        var l = this.CDLHANGINGMAN();
        n = CDLADDFLAGINFO(l, a, "HM", "Hanging Man");
        break;

      case "CDLHARAMI":
        var l = this.CDLHARAMI();
        n = CDLADDFLAGINFO(l, a, "HP", "Harami Pattern");
        break;

      case "CDLHARAMICROSS":
        var l = this.CDLHARAMICROSS();
        n = CDLADDFLAGINFO(l, a, "HCP", "Harami Cross Pattern");
        break;

      case "CDLHOMINGPIGEON":
        var l = this.CDLHOMINGPIGEON();
        n = CDLADDFLAGINFO(l, a, "HP", "Homing Pigeon");
        break;

      case "CDLHIKKAKE":
        var l = this.CDLHIKKAKE();
        n = CDLADDFLAGINFO(l, a, "HP", "Hikkake Pattern");
        break;

      case "CDLHIGHWAVE":
        var l = this.CDLHIGHWAVE();
        n = CDLADDFLAGINFO(l, a, "HW", "High Wave");
        break;

      case "CDLIDENTICAL3CROWS":
        var l = this.CDLIDENTICAL3CROWS();
        n = CDLADDFLAGINFO(l, a, "ITC", "Identical Three Crows");
        break;

      case "CDLINNECK":
        var l = this.CDLINNECK();
        n = CDLADDFLAGINFO(l, a, "IN", "In-Neck");
        break;

      case "CDLINVERTEDHAMMER":
        var l = this.CDLINVERTEDHAMMER();
        n = CDLADDFLAGINFO(l, a, "IH", "Inverted Hammer");
        break;

      case "CDLKICKING":
        var l = this.CDLKICKING();
        n = CDLADDFLAGINFO(l, a, "KC", "Kicking");
        break;

      case "CDLKICKINGBYLENGTH":
        var l = this.CDLKICKINGBYLENGTH();
        n = CDLADDFLAGINFO(l, a, "KCWLM", "Kicking (longer marubozu)");
        break;

      case "CDLLADDERBOTTOM":
        var l = this.CDLLADDERBOTTOM();
        n = CDLADDFLAGINFO(l, a, "LB", "Ladder Bottom");
        break;

      case "CDLLONGLEGGEDDOJI":
        var l = this.CDLLONGLEGGEDDOJI();
        n = CDLADDFLAGINFO(l, a, "LLD", "Long Legged Doji");
        break;

      case "CDLLONGLINE":
        var l = this.CDLLONGLINE();
        n = CDLADDFLAGINFO(l, a, "LLC", "Long Line Candle");
        break;

      case "CDLMARUBOZU":
        var s = this.priceData.length - 1;
        var o = this.priceData[s].open, d = this.priceData[s].high, c = this.priceData[s].low, i = this.priceData[s].close;
        var l = this.CDLMARUBOZU(o, d, c, i);
        n = CDLADDFLAGINFO(l, a, "MZ", "Marubozu");
        break;

      case "CDLMATCHINGLOW":
        var l = this.CDLMATCHINGLOW();
        n = CDLADDFLAGINFO(l, a, "ML", "Matching Low");
        break;

      case "CDLMATHOLD":
        var l = this.CDLMATHOLD();
        n = CDLADDFLAGINFO(l, a, "MH", "Mat Hold");
        break;

      case "CDLMORNINGDOJISTAR":
        var l = this.CDLMORNINGDOJISTAR();
        n = CDLADDFLAGINFO(l, a, "MDS", "Morning Doji Star");
        break;

      case "CDLMORNINGSTAR":
        var l = this.CDLMORNINGSTAR();
        n = CDLADDFLAGINFO(l, a, "MS", "Morning Star");
        break;

      case "CDLONNECK":
        var l = this.CDLONNECK();
        n = CDLADDFLAGINFO(l, a, "ON", "On-Neck");
        break;

      case "CDLPIERCING":
        var l = this.CDLPIERCING();
        n = CDLADDFLAGINFO(l, a, "PP", "Piercing Pattern");
        break;

      case "CDLRICKSHAWMAN":
        var l = this.CDLRICKSHAWMAN();
        n = CDLADDFLAGINFO(l, a, "RM", "Rickshaw Man");
        break;

      case "CDLRISEFALL3METHODS":
        var l = this.CDLRISEFALL3METHODS();
        n = CDLADDFLAGINFO(l, a, "FTM", "Falling Three Methods");
        break;

      case "CDLSEPARATINGLINES":
        var l = this.CDLSEPARATINGLINES();
        n = CDLADDFLAGINFO(l, a, "SL", "Separating Lines");
        break;

      case "CDLSHOOTINGSTAR":
        var l = this.CDLSHOOTINGSTAR();
        n = CDLADDFLAGINFO(l, a, "SS", "Shooting Star");
        break;

      case "CDLSPINNINGTOP":
        var l = this.CDLSPINNINGTOP();
        n = CDLADDFLAGINFO(l, a, "ST", "Spinning Top");
        break;

      case "CDLSTALLEDPATTERN":
        var l = this.CDLSTALLEDPATTERN();
        n = CDLADDFLAGINFO(l, a, "SP", "Stalled Pattern");
        break;

      case "CDLSTICKSANDWICH":
        var l = this.CDLSTICKSANDWICH();
        n = CDLADDFLAGINFO(l, a, "SS", "Stick Sandwich");
        break;

      case "CDLTAKURI":
        var l = this.CDLTAKURI();
        n = CDLADDFLAGINFO(l, a, "TK", "Takuri");
        break;

      case "CDLTASUKIGAP":
        var l = this.CDLTASUKIGAP();
        n = CDLADDFLAGINFO(l, a, "TG", "Tasuki Gap");
        break;

      case "CDLTHRUSTING":
        var l = this.CDLTHRUSTING();
        n = CDLADDFLAGINFO(l, a, "TP", "Thrusting Pattern");
        break;

      case "CDLTRISTAR":
        var l = this.CDLTRISTAR();
        n = CDLADDFLAGINFO(l, a, "TSP", "Tristar Pattern");
        break;

      case "CDLUNIQUE3RIVER":
        var l = this.CDLUNIQUE3RIVER();
        n = CDLADDFLAGINFO(l, a, "U3R", "Unique 3 River");
        break;

      case "CDLUPSIDEGAP2CROWS":
        var l = this.CDLUPSIDEGAP2CROWS();
        n = CDLADDFLAGINFO(l, a, "UGTC", "Upside Gap Two Crows");
        break;

      case "CDLXSIDEGAP3METHODS":
        var l = this.CDLXSIDEGAP3METHODS();
        n = CDLADDFLAGINFO(l, a, "GTM", "Upside/Downside Gap Three Methods");
        break;
    }
    return n;
};

var CDLADDFLAGINFO = function(e, n, a, l) {
    var s;
    if (e.isBull) {
        s = {
            x: n,
            title: '<span style="color : blue">' + a + "</span>",
            text: l + " : Bull"
        };
    } else if (e.isBear) {
        s = {
            x: n,
            title: '<span style="color : red">' + a + "</span>",
            text: l + " : Bear"
        };
    }
    return s;
};

var CDLGETPARAMS = function(e) {
    var n = e.length - 1;
    var a = n - 1;
    var l = n - 2;
    var s = n - 3;
    var o = n - 4;
    var d = {
        O: e[n].open,
        h: e[n].close,
        g: e[n].high,
        S: e[n].low,
        o: e[a].open,
        _: e[a].close,
        H: e[a].high,
        A: e[a].low,
        t: e[l].open,
        i: e[l].close,
        G: e[l].high,
        v: e[l].low,
        D: e[n].close > e[n].open,
        C: e[n].close < e[n].open,
        L: e[a].close > e[a].open,
        s: e[a].close < e[a].open,
        l: e[l].close > e[l].open,
        T: e[l].close < e[l].open
    };
    d.p = s;
    if (s >= 0) {
        d.M = e[s].open;
        d.B = e[s].close;
        d.W = e[s].high;
        d.u = e[s].low;
        d.I = e[s].close > e[s].open;
        d.F = e[s].close < e[s].open;
    }
    d.N = o;
    if (o >= 0) {
        d.m = e[o].open;
        d.R = e[o].close;
        d.k = e[o].high;
        d.U = e[o].low;
        d.K = e[o].close > e[o].open;
        d.P = e[o].close < e[o].open;
    }
    return d;
};

window.CDL = CDL;

window.CDLUpdateObject = CDLUpdateObject;

window.CDLADDFLAGINFO = CDLADDFLAGINFO;

window.CDLGETPARAMS = CDLGETPARAMS;
