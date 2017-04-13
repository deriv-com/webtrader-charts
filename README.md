# webtrader-charts ![Build Status](https://travis-ci.org/binary-com/webtrader-charts.svg?branch=master)

A charting library extracted from [Webtrader](https://github.com/binary-com/webtrader) so that other projects can use it as nodejs package

## Pre-requisite to use this library

- npm/yarn

## How to use it

Using npm
- npm i binary-com/webtrader-charts

Using yarn
- yarn add binary-com/webtrader-charts

### ES6 style

    import charts from 'webtrader-charts';
    
    charts.drawChart(
      'containerID', //where chart should be rendered
      'frxUSDJPY', //instrument code
      '1m', //time period,
      'en', //language
      false, //Do you want to hide the overlay option on chart
      false, //Do you want to hide the share option on chart
      'GMT', //Timezone of client. Defaults to GMT. Format in GMT+8
    );
