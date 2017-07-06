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
    "type": "line",
    "timePeriod": "1m",
    "instrumentCode": "RDBULL",
    "instrumentName": "Bull Market Index",
    "showInstrumentName": true, // default is false
    "showOverlays": false, // default is true
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
 });

 // Will be called every time user makes a change
 chart.events.anyChange = () => {
    console.warn(chart.data());
    // Pass chart.data() to addNewChart() to restore a chart.
 }; 

 chart.actions.reflow(); // Resizes the chart, call it when container is resized.
 chart.actions.refresh(); // Refreshes the entire chart.
 chart.actions.destroy(); // Destroys the chart. returns a promise.
```

### How to extend it
- clone the repo
- change `webpack.config.js` to write the output into `/example` folder.
- do `yarn install` on both main project and `/example` folder.
- do `yarn watch` on main project.
- do `yarn watch` on `/example` folder.
- open `localhost:8080`
