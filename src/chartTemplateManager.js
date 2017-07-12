import $ from 'jquery';
import _ from 'lodash';
import rv from 'rivets';
import html from './chartTemplateManager.html';
import chartWindow from './chartWindow.js';
import chartOptions from './chartOptions.js';
import notification from './common/notification.js';
import {local_storage, i18n} from './common/utils.js';

if(!local_storage.get('templates')) {
  local_storage.set('templates', []);
}

class ChartTemplateManager {
  constructor(root, dialog, dialog_id) {
    const _this = this;
    const templates = local_storage.get("templates");
    templates.forEach(function(tmpl){
      if(!tmpl.random){
        tmpl = _this.setRandom(tmpl);
      }
    });
    local_storage.set("templates",templates);

    const state = this.init_state(root, dialog, dialog_id);
    root.append(html);
    this.view = rv.bind(root[0], state);
    this.target = `#${dialog_id}`;
  }

  init_state(root, dialog, dialog_id) {

    const chart = dialog.find(`#${dialog_id}_chart`).highcharts();
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
      notification.warning(`${i18n('Template changes saved')} (${name})`, this.target);
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
            throw i18n('Invalid JSON file');
          }

          if(_this.isDuplicate(data, array)){
            return;
          }

          if(!data.indicators) {
            throw i18n('Invalid template type');
          }
        } catch(e) {
          notification.error(e, this.target);
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
        notification.warning(`${i18n('Successfully applied the template and saved it as')} <b>${data.name}</b>`, this.target);
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
        notification.warning(`${i18n('Template changes saved as')} (${name})`, this.target);
      }
    };

    templates.download = (tmpl) => {
      var json = JSON.stringify(tmpl);
      this.download_file_in_browser(tmpl.name + '.json', 'text/json;charset=utf-8;', json);
      notification.info(`${i18n('Downloading template as')} <b>${tmpl.name}.json</b>`, this.target);
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
          notification.error(i18n('Template name already exists'), this.target);
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

    templates.confirm = (tmpl, action, event) => {
      route.update("confirm");
      templates.confirm_prevMenu = {"Delete":"templates", "Save": "menu"}[action];
      templates.confirm_text = {
              "Delete": i18n('Are you sure you want to delete template?'),
              "Save": i18n('Are you sure you want to overwrite current template?')}[action];

      templates.confirm_yes = () => {
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
      notification.error(`${i18n('Template already saved as')} <b>${tmpl_copy.name}</b>.`, this.target);
      return true;
    }
    return false;
  }


  /* type = "text/csv;charset=utf-8;" */
  download_file_in_browser (filename, type, content){
    var blob = new Blob([content], { type: type });
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, filename);
    }
    else {
        var link = document.createElement("a");
        if (link.download !== undefined) {  /* Evergreen Browsers :) */
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
  }

  unbind() {
      this.view && this.view.unbind();
      this.view = null;
    }
}


export const init = (root, dialog, dialog_id) => new ChartTemplateManager(root, dialog, dialog_id);
const store = { };
chartOptions.events.on('chart-options-add', (e, dialog, Id) => {
   const root = dialog.find('.chart-template-manager-root');
   store[Id] = init(root, dialog, Id);
});
chartOptions.events.on('chart-options-remove', (e, Id) => {
   store[Id] && store[Id].unbind();
   delete store[Id];
});
export default { init };
