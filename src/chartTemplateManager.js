import $ from 'jquery';
import _ from 'lodash';
import rv from 'rivets';
import html from './chartTemplateManager.html';
import chartWindow from './chartWindow.js';
import chartOptions from './chartOptions.js';
import {local_storage} from './common/utils.js';
import {globals} from './common/globals.js';

if(!local_storage.get('templates')) {
  local_storage.set('templates', []);
}

class ChartTemplateManager {
  constructor(root, dialog_id) {
    const _this = this;
    const templates = local_storage.get("templates");
    templates.forEach(function(tmpl){
      if(!tmpl.random){
        tmpl = _this.setRandom(tmpl);
      }
    });
    local_storage.set("templates",templates);

    const state = this.init_state(root, dialog_id);
    // TODO: i18n
    // root.append(html.i18n());
    root.append(html);
    this.view = rv.bind(root[0], state);
  }

  init_state(root, dialog_id) {

    const chart = $('#' + dialog_id + '_chart').highcharts();
    const state = {
      route: { value: 'menu' },
      menu: {
        save_changes_disabled: true
      },
      templates: {
        array: local_storage.get('templates'),
        save_as_value: '',
        rename_tmpl: null,
        rename_value: '',
        current: null,
      }
    };
    const {route, templates, menu} = state;

    /* persist applied templates between page reloads */
    const current_tmpl = this.setRandom(chartWindow.get_chart_options(dialog_id));
    templates.array = local_storage.get("templates");
    if(_.findIndex(templates.array, t => t.random === current_tmpl.random) !== -1) {
      templates.current = current_tmpl;
    }

    route.update = value => {
      route.value = value;
    };

    menu.save_as = () => {
      const options = chartWindow.get_chart_options(dialog_id) || {};
      options.name = [`${options.timePeriod} ${options.type}`]
                    .concat(options.indicators.map(ind => ind.name))
                    .concat(options.overlays.map(overlay => overlay.displaySymbol))
                    .join(' + ');
      templates.save_as_value = options.name;
      route.update('save-as');
    };

    menu.templates = () => {
      templates.array = local_storage.get('templates'); // it can be modified from other dialogs.
      route.update('templates');
    };

    menu.save_changes = () => {
      const current = this.setRandom(chartWindow.get_chart_options(dialog_id));
      const name = current.name;
      const array = local_storage.get('templates');
      const inx = _.findIndex(array, t => t.name === name);
      if(inx !== -1) {
        array[inx] = current;
      } else {
        array.push(current);
      }
      local_storage.set('templates', array);
      templates.array = array;
      templates.current = current;
      // TODO: i18n
      // globals.notification.notice('Template changes saved '.i18n() + '(' + current.name + ')');
      globals.notification.notice(`Template changes saved (${current.name})`);
    };

    menu.open_file_selector = (event) => {
      $(root).find("input[type=file]").click();
    };

    menu.upload = (event) => {
      const _this = this;
      const file = event.target.files[0];
      event.target.value = null;
      if(!file)
        return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const contents = ev.target.result;
        const array = local_storage.get("templates");
        let data = null;
        try {
          data = JSON.parse(contents);
          data.name = data.name.substring(0,20).replace(/[<>]/g,"-");
          const hash = data.random;
          data = _this.setRandom(data);
          if(hash !== data.random){
            // TODO: i18n
            // throw "Invalid JSON file".i18n();
            throw "Invalid JSON file";
          }

          if(_this.isDuplicate(data, array)){
            return;
          }

          if(!data.indicators) {
            // TODO: i18n
            // throw "Invalid template type".i18n();
            throw "Invalid template type";
          }
        } catch(e) {
          globals.notification.error(e);
          return;
        }

        // Rename duplicate template names.
        let file = 1,
            name = data.name;
        while(1){
          if(array.map(t => t.name).includes(name)) {
            name = data.name + " (" + file + ")";
            file++;
            continue;
          }
          data.name = name;
          break;
        }

        templates.apply(data);
        array.push(data);
        local_storage.set('templates', array);
        templates.array = array;
        // TODO: i18n
        // globals.notification.notice("Successfully applied the template and saved it as ".i18n() + "<b>" + data.name + "</b>");
        globals.notification.notice(`Successfully applied the template and saved it as <b>${data.name}</b>`);
      };

      reader.readAsText(file);
    };

    templates.save_as = (event) => {
      event.preventDefault();
      const name = templates.save_as_value.substring(0,20).replace(/[<>]/g,"-");
      const options = this.setRandom(chartWindow.get_chart_options(dialog_id));
      if(options) {
        options.name = name;
        const array = local_storage.get('templates');
        if(this.isDuplicate(options, array)){
          return;
        }
        array.push(options);
        templates.current = options;
        local_storage.set('templates', array);
        templates.array = array;
        route.update('menu');
        chartWindow.set_chart_options(dialog_id, options); /* update the name */
      }
    };

    templates.download = (tmpl) => {
      var json = JSON.stringify(tmpl);
      download_file_in_browser(tmpl.name + '.json', 'text/json;charset=utf-8;', json);
      // TODO: i18n
      // globals.notification.notice( "Downloading template as <b>".i18n() + tmpl.name + ".json</b>");
      globals.notification.notice(`Downloading template as <b>${tmpl.name}.json</b>`);
    };

    templates.remove = (tmpl) => {
      let array = local_storage.get('templates');
      templates.array = array.filter(t => t.name !== tmpl.name);
      local_storage.set('templates', templates.array);
      if(templates.current && tmpl.name === templates.current.name) {
        templates.current = null;
      }
    };

    templates.rename = tmpl => {
      templates.rename_value = tmpl.name;
      templates.rename_tmpl = tmpl;
      route.update('rename');
    };

    templates.do_rename = (event) => {
      event.preventDefault();
      const name = templates.rename_tmpl.name;
      const new_name = templates.rename_value.substring(0,20).replace(/[<>]/g,"-");
      const array = local_storage.get('templates');
      if(array.map(t => t.name).includes(new_name)) {
          // TODO: i18n
          // globals.notification.error( 'Template name already exists'.i18n() );
          globals.notification.error('Template name already exists');
          return;
      }
      const tmpl = array.find(t => t.name === name);
      if(tmpl) {
        tmpl.name = new_name;
        local_storage.set('templates', array);
        templates.array = array;
        route.update('templates');

        /* update template name in chartWindow options */
        const current = this.setRandom(chartWindow.get_chart_options(dialog_id));
        if(current.name == name) {
          current.name = new_name;
          chartWindow.set_chart_options(dialog_id, current);
          templates.current = current;
        }
      }
    };

    templates.apply = tmpl => {
      chartWindow.apply_chart_options(dialog_id, tmpl);
      templates.current = tmpl;
    };

    templates.confirm = (tmpl, event) => {
      route.update("confirm");
      const action = event.currentTarget.text;
      // TODO: i18n
      // templates.confirm_prevMenu = action === "Delete".i18n() ? "templates" : "menu";
      templates.confirm_prevMenu = action === "Delete" ? "templates" : "menu";
      // TODO: i18n
      // templates.confirm_text = action === "Delete" ? "Are you sure you want to delete template?".i18n() : "Are you sure you want to overwrite current template?".i18n();
      templates.confirm_text = action === "Delete" ? "Are you sure you want to delete template?" : "Are you sure you want to overwrite current template?";

      templates.confirm_yes = () => {
        // TODO: i18n
        // action === "Delete".i18n()? templates.remove(tmpl) : menu.save_changes();
        action === "Delete" ? templates.remove(tmpl) : menu.save_changes();
        templates.confirm_no();
      };

      templates.confirm_no = () => {
        route.update(templates.confirm_prevMenu);
      };
    };

    return state;
  }

  // Create random independent of template name to find duplicates more accurately.
  setRandom(tmpl) {
    const name = tmpl.name;
    delete tmpl.name;
    delete tmpl.random;
    tmpl.random = this.hashCode(JSON.stringify(tmpl));
    tmpl.name = name;
    return tmpl;
  }

  hashCode(s) {
    return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a;},0);
  }

  isDuplicate(tmpl, array){
    // get template with same values.
    const tmpl_copy = _.find(array, ['random', tmpl.random]);
    if(tmpl_copy){
      // TODO: i18n
      // globals.notification.error('Template already saved as '.i18n() +'<b>' + tmpl_copy.name + '</b>.');
      globals.notification.error('Template already saved as <b>' + tmpl_copy.name + '</b>.');
      return true;
    }
    return false;
  }

  unbind() {
      this.view && this.view.unbind();
      this.view = null;
    }
}


export const init = (root, dialog_id) => new ChartTemplateManager(root, dialog_id);
const store = { };
chartOptions.events.on('chart-options-add', (e, Id) => {
   const root = $(`#${Id}`).find('.chart-template-manager-root');
   store[Id] = init(root, Id);
});
chartOptions.events.on('chart-options-remove', (e, Id) => {
   store[Id] && store[Id].unbind();
   delete store[Id];
});
export default { init };
