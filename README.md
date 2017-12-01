# webtrader-charts ![Build Status](https://travis-ci.org/binary-com/webtrader-charts.svg?branch=master)

The charting library extracted from [Webtrader](https://github.com/binary-com/webtrader).
See [Demo](http://aminroosta.ir/webtrader-charts)

## How to use it

Use npm / yarn
```bash     
npm install --save webtrader-charts
yarn add webtrader-charts
```

You need to provide these dependences `jquery`, `moment` and `highstock#5.0.x`.  
Take a look at `webpack.config.js -> externals`.  

### Basic usage

```js
 import wtcharts from 'webtrader-charts';

 // init must be called before anything else.
 wtcharts.init({
    appId: 11,
    lang: 'en',
    server: 'wss://ws.binaryws.com/websockets/v3'
 });
 // supported langauges are [ 'ar', 'ja', 'en', 'de', 'es', 'fr', 'id', 'it', 'pl', 'pt', 'ru', 'th', 'vi', 'zh_cn', 'zh_tw']
 
 const chart =  wtcharts.chartWindow.addNewChart($parent, {
    "type": "line", // default is 'line'
    "timePeriod": "1m", // default is '1t'
    "instrumentCode": "RDBULL",
    "instrumentName": "Bull Market Index",
    "showInstrumentName": true, // default is false
    "showOverlays": false, // default is true
    "showShare": false, // default is true
    "count": 1000, // number of bars to load, default is 1000
    "indicators": [
       {
          "id": "cks",
          "name": "Chande Kroll Stop",
          "options": {
             "period": 10,
             "maxMinPeriod": 20,
             "multiplier": 3,
             "longStopStroke": "#00C176",
             "shortStopStroke": "#FF003C",
             "strokeWidth": 1,
             "dashStyle": "Solid"
          }
       },
    ],
    "overlays": [ ],
    enableMobileView: false, // default is false
     /* optional field timezoneOffset in minutes, see (http://api.highcharts.com/highstock/global.timezoneOffset)
        timezone is global in highcharts, this option will effect other charts on the page */
    "timezoneOffset": 0,
 });

 // Will be called every time user makes a change
 chart.events.anyChange = () => {
    console.warn(chart.data());
    // Pass chart.data() to addNewChart() to restore a chart.
 }; 

 chart.actions.reflow(); // Resizes the chart, call it when container is resized.
 chart.actions.refresh(); // Refreshes the entire chart.
 chart.actions.destroy(); // Destroys the chart. returns a promise.
 chart.actions.stopStreaming(); // Unsubcribe from the tick stream.
```

### Supporting mobile (Exprimental)

Pass `enableMobileView: true` to make chart mobile friendly. This option disables the navigator and shrinks the scrollbar.

In mobile devices it is recommended to reduce `count: 200`, this will improve performance but do not use a smaller value because some indicators might not work properly.

### Displaying trade results (Exprimental)

![Alt text](example/screenshots/0.png?raw=true "Displaying trade results")

**Note:** This is an exprimental api, it might change in future releases.
```js
   // epoch is in milliseconds for all draw methods.
   chart.darw.startTime(epoch); // draws a vertical orange line at epoch.
   chart.draw.endTime(epoch); // dashed vertical line at epoch.
   chart.draw.entrySpot(epoch); // empty orange circle at epoch
   chart.draw.exitSpot(epoch); // filled orange circle at epoch
   chart.draw.barrier({value: value}); // draws a gree horizontal barrier line
```

### How to extend it
- Clone the repo
- Change `webpack.config.js` to write the output into `/example` folder.
- `yarn install` on both main project and `/example` folder.
- `yarn watch` on main project.
- `yarn watch` on `/example` folder.
- Open `localhost:8080`

### building translations
- Run `yarn build-translation` to get `dictionary.json` file.
- The language files `/src/i18/{lang}.json` files.
- The library uses the generated `dictionary.json` file.

### deploying to gh-pages
- `yarn deploy-example` to deploy the `/example` folder. 
- `yarn deploy-hard` to deploy latest version embedded in binary-static (for testing)
- `yarn deploy-soft` same as `yarn deploy-hard` (use it the second time you are deploying).
- `app-id` for `aminroosta.github.io/binary-static` is `7770`
