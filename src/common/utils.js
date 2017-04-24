/* simple localStorage cache to differentiate between live and beta */
export const local_storage = {
  get: function(name){
    name = 'webtrader-charts-' + name;
    var ret = localStorage.getItem(name);
    return ret && JSON.parse(ret);
  },
  set: function(name, obj){
    name = 'webtrader-charts-' + name;
    return localStorage.setItem(name, JSON.stringify(obj));
  },
  remove: function(name) {
    name = 'webtrader-charts-' + name;
    return localStorage.removeItem(name);
  }
}

export const convertToTimeperiodObject = (timePeriodInStringFormat) => {
    return {
        intValue : function() {
            return parseInt(timePeriodInStringFormat.toLowerCase().replace("t", "").replace("h", "").replace("d", "").trim())
        },
        suffix : function() {
            return timePeriodInStringFormat.toLowerCase().replace("" + this.intValue(), "").trim().charAt(0);
        },
        timeInMillis : function() {
            var val = 0;
            switch (this.suffix())
            {
                case 't' : val = 0; break;//There is no time in millis for ticks
                case 'm' : val = this.intValue() * 60 * 1000; break;
                case 'h' : val = this.intValue() * 60 * 60 * 1000; break;
                case 'd' : val = this.intValue() * 24 * 60 * 60 * 1000; break;
            }
            return val;
        },
        timeInSeconds : function() {
            return this.timeInMillis() / 1000;
        },
        humanReadableString : function() {
            var val = '';
            switch (this.suffix())
            {
                case 't' : val = 'tick'; break;
                case 'm' : val = 'minute(s)'; break;
                case 'h' : val = 'hour(s)'; break;
                case 'd' : val = 'day(s)'; break;
            }
            return this.intValue() + " " + val;
        }
    }
};

export const isTick = (ohlc) => ohlc.indexOf('t') != -1;
export const isDotType = (type) => type === 'dot';
export const isLineDotType = (type) => type === 'linedot';
export const isDataTypeClosePriceOnly = (type) => !(type === 'candlestick' || type === 'ohlc');
export const getAppURL = () => window.location.href.split("/v")[0];

export default {
   local_storage,
   isTick,
   isDotType,
   isLineDotType,
   getAppURL,
   convertToTimeperiodObject,
   isDataTypeClosePriceOnly
};
