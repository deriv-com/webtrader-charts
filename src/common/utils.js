import dictionary  from '../i18n/dictionary.json';
import '../lib/leanModal.js';
import { globals } from './globals.js';

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

const getParameterByName = (name) => window[name] || getParameterByNameFromURL(name);
const getParameterByNameFromURL = (name) => {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
};

export const isTick = (ohlc) => ohlc && (ohlc.indexOf('t') != -1);
export const isDotType = (type) => type === 'dot';
export const isLineDotType = (type) => type === 'linedot';
export const isDataTypeClosePriceOnly = (type) => !(type === 'candlestick' || type === 'ohlc');

export const toFixed = (value, precision) =>
   $.isNumeric(value) ?  Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision) : value;
export const isAffiliates = () => 
   getParameterByName("affiliates") === true || (getParameterByName("affiliates") + '').toLowerCase() == 'true';


export const uuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
};

export const i18n = key => {
    const lang = globals.config.lang;
    if(lang === 'en') return key;
    const index = dictionary.languages.indexOf(lang);
    if(index === -1) return key;


    const new_key = key.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()\\"]/g,"") // remove punctuation.
                       .replace(/\s{2,}/g," ") // remove extra whitespaces.
                       .replace(/\s+/g, '-').toLowerCase(); // add hyphens.

    return (dictionary.dictionary[new_key] && dictionary.dictionary[new_key][index]) || key;
};

export default {
   local_storage,
   isTick,
   isDotType,
   isLineDotType,
   convertToTimeperiodObject,
   isDataTypeClosePriceOnly,
   isAffiliates,
   toFixed,
   i18n,
   uuid,
};
