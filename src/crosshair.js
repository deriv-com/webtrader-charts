import $ from 'jquery';
export const toggleCrossHair = (containerId, options, opt_webtrader_options = {}) => {
  const chart = $(containerId).highcharts();
  if (chart) {
    const xch = chart.xAxis[0].crosshair;
    const ych = chart.yAxis[0].crosshair;
    const show = options ? options.show : (xch.color === 'transparent');
    const custom_crosshair = opt_webtrader_options.crosshair;

    xch.color                 = show ? custom_crosshair && custom_crosshair.color           || '#2a3052' : 'transparent';
    xch.label.backgroundColor = show ? custom_crosshair && custom_crosshair.backgroundColor || '#2a3052' : 'transparent';
    xch.label.style.color     = show ? custom_crosshair && custom_crosshair.color           || 'white'   : 'transparent';
    ych.color                 = show ? custom_crosshair && custom_crosshair.color           || '#2a3052' : 'transparent';
    ych.label.backgroundColor = show ? custom_crosshair && custom_crosshair.backgroundColor || '#2a3052' : 'transparent';
    ych.label.style.color     = show ? custom_crosshair && custom_crosshair.color           || 'white'   : 'transparent';

    chart.xAxis[0].update({crosshair: xch});
    chart.yAxis[0].update({crosshair: ych});
  }
};

export default {
  toggleCrossHair
}
