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

export const isTick = (ohlc) => ohlc.indexOf('t') != -1;
export const isDotType = (type) => type === 'dot';
export const isLineDotType = (type) => type === 'linedot';
export const isDataTypeClosePriceOnly = (type) => !(type === 'candlestick' || type === 'ohlc');

export default {
   local_storage,
   isTick,
   isDotType,
   isLineDotType,
   isDataTypeClosePriceOnly
};
