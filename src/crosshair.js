import $ from 'jquery';
const crossHair_highchartsConf = {
  width: 2,
  color: 'red',
  dashStyle: 'dash'
};
export const toggleCrossHair = (containerId) => {
  const chart = $(containerId).highcharts();
  if (chart) {
    chart.xAxis[0].crosshair = chart.xAxis[0].crosshair ? false : crossHair_highchartsConf;
    chart.yAxis[0].crosshair = chart.yAxis[0].crosshair ? false : crossHair_highchartsConf;
    if (chart.yAxis[0].crosshair) {
      chart.tooltip.options.formatter = null;
    } else {
      chart.tooltip.options.formatter = () => {
        return false;
      };
    }
  }
};

export default {
  toggleCrossHair
}
