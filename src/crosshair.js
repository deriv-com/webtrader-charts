import $ from 'jquery';
const crossHair_highchartsConf = {
  width: 2,
  color: 'red',
  dashStyle: 'dash'
};
export const toggleCrossHair = (containerId) => {
  const chart = $(containerId).highcharts();
  if (chart) {
    const xch = chart.xAxis[0].crosshair;
    const ych = chart.yAxis[0].crosshair;
    const show = xch.color === 'transparent';

    xch.color = show ? '#2a3052' : 'transparent';
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
