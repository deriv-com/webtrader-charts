/* created by amin, on May 20, 2016 */
import rv from 'rivets';
import _ from 'lodash';
import html from './indicatorManagement.html';
import './common/rivetsExtra.js';
import './indicatorManagement.scss';
import indicatorsArray from './indicators-config.js';
import indicatorBuilder from './indicatorBuilder.js';
import {isTick, local_storage, i18n} from './common/utils.js';

let ind_win = null,
   ind_win_view = null,
   chart_series = null,
   state = {},
   state_arr = {};

rv.formatters['indicators-filter'] = (array, cat) => { /* rviets formatter to filter indicators based on their category */
   return array && array.filter((ind) => {
      return ind.category.indexOf(cat) !== -1;
   }).sort((a, b) => {
      if (a.long_display_name < b.long_display_name) return -1;
      if (a.long_display_name > b.long_display_name) return +1;
      return 0;
   });
};

rv.formatters['search'] = (array, search) => {
   search = search && search.toLowerCase();
   return array && array.filter((ind) => {
      return (ind.long_display_name.toLowerCase().indexOf(search) !== -1 ||
         ind.id.toLowerCase().indexOf(search) !== -1);
   }).sort((a, b) => {
      if (a.long_display_name < b.long_display_name) return -1;
      if (a.long_display_name > b.long_display_name) return +1;
      return 0;
   });
}

const init = () => {
	return root;
};

const init_state = (root) => {
   state = {
      dialog: {
         // TODO: i18n
         // title: 'Add/remove indicators'.i18n(),
         title: 'Add/remove indicators',
         container_id: '',
         is_tick_chart: false
      },
      indicators: {
         search: '',
         array: [],
         current: [],
         popular: [],
         favorites: []
      },
      route: {
         prev_val: null,
         value: 'all',
         update: (val, e , scope) => {
            scope.route.value = val;
         }
      }
   };

   state.indicators.clear_search = () => { state.indicators.search = ''; };

   state.indicators.add = (indicator) => {
      const copy = JSON.parse(JSON.stringify(indicator));
      indicatorBuilder.open(copy, chart_series);
   };

   state.indicators.edit = (indicator) => {
      const copy = JSON.parse(JSON.stringify(indicator));
      indicatorBuilder.open(copy, chart_series, () => {
         state.indicators.remove(indicator);
      });
   };

   state.indicators.remove = (indicator) => {
      const inx = state.indicators.current.indexOf(indicator);
      inx !== -1 && state.indicators.current.splice(inx, 1);

      chart_series.forEach((series) => {
         if (series.options.isInstrument) {
            series.removeIndicator(indicator.series_ids);
         }
      });
   };

   state.indicators.favorite = (indicator) => {
      if (indicator.is_favorite) {
         indicator.is_favorite = false;
         const inx = state.indicators.favorites.indexOf(indicator);
         state.indicators.favorites.splice(inx, 1);
      }
      else {
         indicator.is_favorite = true;
         state.indicators.favorites.push(indicator);
         state.indicators.favorites.sort(
            (a, b) => a.long_display_name.toLowerCase() > b.long_display_name.toLowerCase() ? 1 : -1
         );
      }

      const favorite_ids = state.indicators.favorites.map((ind) => { return ind.id; });
      local_storage.set('indicator-management-favorite-ids', JSON.stringify(favorite_ids));
   };

   state.openSearch = (e, scope) => {
      if(e.target.tagName != 'SPAN') {
         return;
      }
      const ele = $(e.target).parent();
      ele.toggleClass('active');      
      if(ele.hasClass("active")) {
         state.route.prev_val = state.route.value;
         state.route.value = "search";
         $(ele.find("input")[0]).focus();
      } else {
         state.route.value = state.route.prev_val;
      }
   }

   ind_win_view = rv.bind(root[0], state);
};

const update_indicators = (series) => {
   let indicators = _.cloneDeep(indicatorsArray);
   const popular_ids = ["apo", "alligator", "alma", "adx", "atr", "ao", "bbands", "cks", "cdleveningdojistar", "fractal", "hma", "mass", "max", "sma", "stddev", "tema"];
   const favorite_ids = local_storage.get('indicator-management-favorite-ids') || [];
   indicators = _.filter(indicators, (ind) => {
      ind.is_favorite = favorite_ids.indexOf(ind.id) !== -1;
      ind.is_popular = popular_ids.indexOf(ind.id) !== -1;
      return !(ind.isTickChartNotAllowed && state.dialog.is_tick_chart);
   });

   let current = [];
   indicators.forEach((ind) => {
      series.forEach((seri) => {
         seri[ind.id] && seri[ind.id].forEach((instance) => {
            const ind_clone = _.cloneDeep(ind);
            //Show suffix if it is different than the long_display_name
            const show = ind.long_display_name !== instance.toString();
            ind_clone.name = ind.long_display_name;
            ind_clone.shortName = (show ? instance.toString() : "");
            ind_clone.showEdit = ind.editable;
            ind_clone.series_ids = instance.getIDs();
            ind_clone.current_options = _.cloneDeep(instance.options); /* used in indicatorBuilder.es6 */
            current.push(ind_clone);
         });
      });
   });

   state.categories = _.uniq(_.flatten(_.map(indicators,'category')));
   state.indicators.favorites = _.filter(indicators, 'is_favorite').sort(
      (a, b) => a.long_display_name.toLowerCase() > b.long_display_name.toLowerCase() ? 1 : -1
   );
   state.indicators.popular = _.filter(indicators,'is_popular');
   state.indicators.popular_cat = Object.keys(_.groupBy(state.indicators.popular, "category"));
   state.indicators.array = indicators;
   state.indicators.current = current;
};

export const openDialog = (containerIDWithHash) => {
	const root = $(html);
   ind_win = $(containerIDWithHash.replace("_chart", "") + 
         " .chartSubContainerHeader .chartOptions_overlay.indicators").find(".indicator-dialog").length;
   if(ind_win){
      state = state_arr[containerIDWithHash];
      chart_series = $(containerIDWithHash).highcharts().series;
      const series = _.filter(chart_series, 'options.isInstrument');
      update_indicators(series);
      return;
   }
   
   ind_win = root.appendTo($(containerIDWithHash.replace("_chart", "") + 
         " .chartSubContainerHeader .chartOptions_overlay.indicators"));

	init_state(root);

	state.dialog.container_id = containerIDWithHash;
	state.indicators.current = $(containerIDWithHash).data('indicators-current') || [];
	const time_period = $(containerIDWithHash).data('timePeriod');
	state.dialog.is_tick_chart = isTick(time_period);

	chart_series = $(containerIDWithHash).highcharts().series;
	const series = _.filter(chart_series, 'options.isInstrument');
	update_indicators(series);
   // Update indicators when new indicators are added / removed
   $(containerIDWithHash.replace("_chart", "")).on('chart-indicators-changed', () => {
      update_indicators(series);      
   });
   state_arr[containerIDWithHash] = state;
};

export default {
   openDialog
};
