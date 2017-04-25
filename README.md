# webtrader-charts ![Build Status](https://travis-ci.org/binary-com/webtrader-charts.svg?branch=master)

A charting library extracted from [Webtrader](https://github.com/binary-com/webtrader) so that other projects can use it as nodejs package

## How to use it

Use npm / yarn
        
        npm install --save webtrader-charts
        yarn add webtrader-charts

You need to provide these dependences `jquery`, `moment` and `highstock#4.2.6`.  
Take a look at `webpack.config.js -> externals`.  

### Example

    import wtcharts from 'webtrader-charts';
    
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

    chart.events.anyChange = () => {
       console.warn(chart.data());
    }; 

