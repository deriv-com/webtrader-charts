import $ from 'jquery';
export const toggleCrossHair = (containerId, options) => {
  const chart = $(containerId).highcharts();
  if (chart) {
    const xch = chart.xAxis[0].crosshair;
    const ych = chart.yAxis[0].crosshair;
    const show = options ? options.show : (xch.color === 'transparent');

    xch.color = show ? '#2a3052' : 'transparent';
    xch.label.backgroundColor = show ? '#2a3052' : 'transparent';
    xch.label.style.color = show ? 'white' : 'transparent';
    ych.color = show ? '#2a3052' : 'transparent';
    ych.label.backgroundColor = show ? '#2a3052' : 'transparent';
    ych.label.style.color = show ? 'white' : 'transparent';

    chart.xAxis[0].update({crosshair: xch});
    chart.yAxis[0].update({crosshair: ych});
  }
};

export default {
  toggleCrossHair
}
