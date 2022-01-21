import $ from 'jquery';
import rv from 'rivets';
import _ from 'lodash';
import liveapi from './common/liveapi.js';
import './common/rivetsExtra.js';
import html from './overlayManagement.html';
import './overlayManagement.scss';
import {i18n} from './common/utils.js';
import {current_chart_symbol} from './charts.js'; 

let win = null;
let win_view = null;
let state = {};
let comparisons = [];

/* rviets formatter to filter indicators based on their category */
rv.formatters['overlays-filter'] = (array, search) => {
   search = search && search.toLowerCase();
   return array && array.filter(
      (ind) => ind.display_name.toLowerCase().indexOf(search) !== -1
   );
};

export const chartableMarkets = () => {
   return liveapi
      .cached.send({ trading_times: new Date().toISOString().slice(0, 10) })
      .then(function(data) {
         const chartable_markets = data.trading_times.markets.map((m) => {
            const market = {
               name: m.name,
               display_name: m.name
            };
            market.submarkets = m.submarkets.map((sm) => {
               const submarket = {
                  name: sm.name,
                  display_name: sm.name
               };
               let symbols = sm.symbols;
               symbols = symbols.filter((sym) => (sym.feed_license !== 'chartonly'));
               submarket.instruments = symbols.map((sym) => {
                  return {
                     symbol: sym.symbol,
                     display_name: sym.name,
                     delay_amount: sym.delay_amount || 0,
                     events: sym.events,
                     times: sym.times,
                     settlement: sym.settlement,
                     feed_license: sym.feed_license || 'realtime'
                  };
               });
               return submarket;
            })
            /* there might be a submarket (e.g "Americas") which does not have any symbols after filtering */
               .filter(
                  (sm) => (sm.instruments.length > 0)
               );
            return market;
         });
         return chartable_markets;
      });
};
const activeSymbols = () => {
   const last_promise = activeSymbols.last_promise;
   const last_promise_time = activeSymbols.last_promise_time;
   if(last_promise  && (new Date() - last_promise_time) > 5*1000) {
      return last_promise;
   }
   const promise = liveapi.cached
      .send({ active_symbols: 'brief' }, 5*60)
      .then((data) => {
         const active_symbols = [];
         const active_markets = _.map(_.groupBy(data.active_symbols,'market'), (symbols) => {
            const sym = _.head(symbols);
            const market = { name: sym.market, display_name: sym.market_display_name };
            market.submarkets = _.map(_.groupBy(symbols,'submarket'), (symbols) => {
               const sym = _.head(symbols);
               const submarket = { name: sym.submarket, display_name: sym.submarket_display_name };
               submarket.instruments = _.map(symbols, (sym) => {
                  active_symbols.push(sym.symbol);
                  return {
                     symbol: sym.symbol,
                     display_name: sym.display_name,
                  };
               });
               return submarket;
            });
            return market;
         });
         return active_symbols;
      });
   activeSymbols.last_promise = promise;
   activeSymbols.last_promise_time = new Date();
   return promise;
};

chartableMarkets();
activeSymbols();

export const marketData = () => {
   return chartableMarkets().then(
      (chartable_markets) => activeSymbols().then(
         (active_symbols) => _.map(chartable_markets, (m) => ({
               display_name: m.display_name,
               name: m.name,
               submarkets: _.map(m.submarkets, (sm) => {
                  return {
                     display_name: sm.display_name,
                     instruments: _.filter(sm.instruments,
                        (ins) => active_symbols.indexOf(ins.symbol) !== -1
                     )
                  };
               }).filter((sm) => sm.instruments.length !== 0)
            })
         ).filter((m) => m.submarkets.length !== 0)
      )
   );
};

export const specificMarketDataSync = function(marketDataDisplayName, marketData) {
    let present = {};
    $.each(marketData, function(key, value) {
        if (value.submarkets || value.instruments) {
            present = specificMarketDataSync(marketDataDisplayName, value.submarkets || value.instruments);
        } else {
            if ($.trim(value.display_name) == $.trim(marketDataDisplayName)) {
                present = value;
            }
        }
        return $.isEmptyObject(present);
    });
    return present;
};

const findOverlay = (state, display_name) => {
  let break_loop = false;
  let result = null;
  state.overlays.array.forEach((market) => {
    market.submarkets.forEach((submarket) => {
      submarket.instruments.forEach((ind) => {
        if (ind.display_name === display_name) {
          result = ind;
          break_loop = true;
        }
        return !break_loop;
      });
      return !break_loop;
    });
    return !break_loop;
  });
  return result;
}

const init_state = (root) =>{
   state = {
      dialog: {
         title: i18n('Add/remove overlays'),
         container_id: ''
      },
      overlays: {
         search: '',
         array: [],
         current: []
      }
   };

   state.overlays.clear_search = () => { state.overlays.search = ''; };

   state.overlays.add = (ovlay) => {
      const symbol = ovlay.symbol;
      const delay_amount = ovlay.delay_amount;
      const displaySymbol = ovlay.display_name;
      const containerIDWithHash = state.dialog.container_id;
      const mainSeries_timePeriod = $(containerIDWithHash).data("timePeriod");

      const newTabId = containerIDWithHash.replace("#", "").replace("_chart", "");
      const dialog = $(containerIDWithHash);
      const type = dialog.data("type");
      const fn = () => {
         dialog.data("overlayIndicator", true);
         events.trigger('ohlc-update', [{ tabId: newTabId, enable: false}]);
         events.trigger('overlay-add', [{containerId: containerIDWithHash, symbol, displaySymbol, delay_amount}]);
      };
      if (type === 'candlestick' || type == 'ohlc') {
         dialog.data('type', 'line');
         dialog.trigger('chart-type-changed', 'line');
         events.trigger('chart-type-update', [{ tabId: newTabId, type: 'line'}]);
         _.defer(fn);
      } else { fn(); }

      state.overlays.current.push(displaySymbol);
      comparisons.push(displaySymbol);
      ovlay.dont_show = true;
   };

   state.overlays.remove = (ovlay) => {
      const containerIDWithHash = state.dialog.container_id;
      const dialog = $(containerIDWithHash);
      const chart = dialog.highcharts();
      const overlay = findOverlay(state, ovlay);
      if(overlay) {
        overlay.dont_show = false;
      }
      if (chart && ovlay) {
         const series = _.find(chart.series, (s) => { return s.userOptions.name === ovlay && s.userOptions.id !== 'navigator'; });
         if (series) {
            const indicator_series = chart.get_indicator_series();
            series.removeCurrentPrice();  //Remove current price line first
            series.remove();              //Then remove the series
            _.defer(() => {               // Re-validate chart
               let countInstrumentSeries = 0;
               chart.series.forEach((s) => {
                  if ((s.userOptions.isInstrument || s.userOptions.onChartIndicator) && s.userOptions.id.indexOf('navigator') == -1) {
                     ++countInstrumentSeries;
                  }
               });
               if (countInstrumentSeries == 1) {
                  chart.series.forEach((s) => {
                     if ((s.userOptions.isInstrument || s.userOptions.onChartIndicator || s.userOptions.isBarrier) && s.userOptions.id.indexOf('navigator') == -1) {
                        s.update({
                           compare: undefined
                        });
                        $(containerIDWithHash).data('overlayIndicator', null);
                        const newTabId = containerIDWithHash.replace("#", "").replace("_chart", "");
                        events.trigger('ohlc-update', [{ tabId: newTabId, enable: true}]);
                        return false;
                     }
                  });
               }
               chart.set_indicator_series(indicator_series);
               _.defer(
                 () => events.trigger('overlay-remove', [{ containerId: containerIDWithHash, symbol: overlay.symbol }])
               );
            });
         }


         state.overlays.current.splice(state.overlays.current.indexOf(ovlay), 1);
         dialog.trigger('chart-overlay-remove', {displaySymbol: ovlay});
      }

      comparisons.splice(comparisons.indexOf(ovlay), 1);
   };

   win_view = rv.bind(root[0], state);
};


const update_overlays = (chart) => {
   console.log('update current_chart_symbol.display_name: ', current_chart_symbol.display_name);
   marketData().then((markets) => {
      const mainSeriesId = chart.series[0].userOptions.id.split('-')[0];
      const current = _.filter(chart.series, (s, index) => {
         return s.userOptions.isInstrument && s.userOptions.id !== 'navigator' && index !== 0;
      }).map((s) => s.userOptions.name) || [];

      console.log('!', 'mainSeriesId: ',
      mainSeriesId,
      'display_name: ', current_chart_symbol.display_name, current_chart_symbol.symbol);

      markets.forEach((market) => {
         market.submarkets.forEach((submarket) => {
            submarket.instruments.forEach((ind) => {
               console.log('!', 'ind.display_name: ', ind.display_name, 'ind.symbol: ', ind.symbol,);
               if(_.includes(current, ind.display_name) || mainSeriesId.toLowerCase() === ind.symbol.toLowerCase() ) ind.dont_show = true;
               else ind.dont_show = false;
            });
         });
      });
      state.overlays.array = markets;
      state.overlays.current = current;
   });
};

export const openDialog = (containerIDWithHash, title ) => {
   console.log('openDialog');
      const root = $(html);

      init_state(root);

      state.dialog.title = i18n('Add/remove comparisons') + (title ? ' - ' + title : '');
      state.dialog.container_id = containerIDWithHash;
      comparisons.length > 0 ? comparisons.map(item => state.overlays.current.push(item)) : state.overlays.current = [];

      const chart = $(containerIDWithHash).highcharts();
      update_overlays(chart);

      win = root.leanModal({
         title: state.dialog.title,
         width: ($(window).width() > 800) ? 700 : Math.min(480, $(window).width() - 10),
         height: 400,
         onClose: () => {
            win_view && win_view.unbind();
            win_view = null;
         }
      });
};

export const events = $('<div/>');
export default { 
   openDialog,
   specificMarketDataSync,
   chartableMarkets,
   events
};

