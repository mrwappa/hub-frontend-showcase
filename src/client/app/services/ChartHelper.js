import { getSensorUnit } from 'services/UtilityService';

export const maxMinYAxis = 9999999;

export const yAxisSettings = {
  title: {
    text: ''
  },
  gridZIndex: 0,
  gridLineColor: 'rgba(0, 0, 0, 0.15)',
  gridLineWidth: 1,
};

export const chartColors = {
  lightBlue: 'rgb(194,230,243)',
  beige: 'rgb(254,247,225)',
  lightGreen: 'rgb(223,248,220)',
  white: 'rgb(255,255,255)',
};

export const defaultChartSettings = {
  name: 'Default',
  yMin: 0,
  yMax: 100,
  yTicks: [],
  yRangeType: 'soft',
  colors: [
    {
      from: -9999999,
      to: 9999999,
      color: chartColors.white,
      text: 'Range'
    }
  ]
};

export function getChartOptions(type, from, to) {
  let options = {
    to: to,
    from: from,
    yTitle: getSensorUnit(type),
    ySMin: 0,
    ySMax: 10
  };

  return options;
}

export const defaultOptions = {
	credits: {
		enabled: false
	},
	chart: {
		type: 'spline',
		zoomType: 'xy',
		resetZoomButton: {
			position: {
				x: -5,
				y: 45
			}
		},
	},
	title: {
		text: ''
	},
	exporting: {
		buttons: [
			{
				x: -5,
				y: 5,
				align: 'right',
				buttonSpacing: 3,
				className: 'highcharts-contextbutton',
				enabled: true,
				height: 22,
				menuClassName: 'highcharts-contextmenu',
				menuItems: ["viewFullscreen", "printChart", "separator", "downloadPNG", "downloadJPEG", "downloadPDF", "downloadSVG"],
				onclick: undefined,
				symbol: 'menu',
				symbolFill: '#666666',
				symbolSize: 14,
				symbolStroke: '#666666',
				symbolStrokeWidth: 3,
				symbolX: 12.5,
				symbolY: 10.5,
				text: null,
				theme: {
					fill: '#ffffff',
					padding: 5,
					stroke: 'none'
				}
			},
			{
				x: -35,
				y: 5,
				align: 'right',
				buttonSpacing: 3,
				enabled: true,
				height: 22,
				text: 'Auto Zoom',
				theme: {
					'stroke-width': 1,
					stroke: 'silver',
					fill: '#ffffff',
					padding: 5
				}
			},
			{
				x: -120,
				y: 5,
				align: 'right',
				buttonSpacing: 3,
				enabled: true,
				height: 22,
				text: 'Toggle Legends',
				theme: {
					'stroke-width': 1,
					stroke: 'silver',
					fill: '#ffffff',
					padding: 5
				}
			}
		]
	},
	xAxis: {
		type: 'datetime',
		title: {
			text: 'Time'
		},
		dateTimeFormats: {
			month: '%e. %b',
			year: '%b'
		},
		labels: {
			overflow: 'justify'
		}
	},
	yAxis: yAxisSettings,
	legend: {
		enabled: true
	},
	plotOptions: {
		series: {
			events: {
			}
		},
		spline: {
			marker: {
				enabled: true,
				radius: 3
			},
			opacity: 0.8
		}
	},
	tooltip: {

	},
	series: []
};