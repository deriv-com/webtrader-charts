# webtrader-charts ![Build Status](https://travis-ci.org/binary-com/webtrader-charts.svg?branch=master)

A charting library extracted from [Webtrader](https://github.com/binary-com/webtrader) so that other projects can use it as nodejs package

## How to use it

Use npm / yarn
        
        npm install --save webtrader-charts
        yarn add webtrader-charts

You need to provide these dependences `jquery`, `moment` and `highstock#5.0.x`.  
Take a look at `webpack.config.js -> externals`.  

### Basic usage

    import wtcharts from 'webtrader-charts';

    // init must be called before anything else.
    wtcharts.init({
       appId: 11,
       lang: 'en',
       server: 'wss://ws.binaryws.com/websockets/v3'
    });
    
    const chart =  wtcharts.chartWindow.addNewChart($parent, {
       "instrumentCode": "RDBULL",
       "instrumentName": "Bull Market Index",
       "timePeriod": "1m",
       "type": "line",
       "delayAmount": 0,
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
          }
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
    chart.actions.destroy(); // Destroys the chart.

### Globals
Handle notification by providing your own `wtcharts.globals.notification`.

    import $ from 'jquery';
    import 'jquery-growl'; // notification library
    export const globals = {
       notification: {
          error: (msg) => $.growl.error({message: msg}),
          warning: (msg) => $.growl.warning({message: msg}),
          notice: (msg) => $.growl.notice({message: msg}),
       }
    };
