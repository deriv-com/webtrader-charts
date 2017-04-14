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

export const isTick = (ohlc) => {
   return ohlc.indexOf('t') != -1;
}
export default {
   isTick,
   local_storage
};
