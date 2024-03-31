import React, { useEffect, useState } from 'react';
import Highcharts from './CustomHighcharts';
import HighchartsReact from 'highcharts-react-official';
import moment from 'moment';
import { defaultChartSettings, maxMinYAxis } from '../services/ChartHelper';
import { Button, Input, Segment, Header, Popup, Dropdown } from 'semantic-ui-react';
import ColorPicker from './ColorPicker';
import { chartSettingsHook } from '../hooks/ApiQueryHooks';
import { defaultOptions } from '../services/ChartHelper';
import { deepCopy } from '../services/UtilityService';
import { baseMutationHook } from '../hooks/ApiPostHooks';
import { api } from '../services/ApiService';
import { toastSuccess } from '../services/Toaster';
require("highcharts/modules/exporting")(Highcharts);

function getLocalTimeMs(date) {
	if (typeof date === 'string') {
		let t = new Date(1970, 0, 1); // Epoch. OR just convert from moment unix to date?
		t.setSeconds(date);
		date = t;
	}

	return date.valueOf() + (moment(date).utcOffset() * 60000);
}

const sensorDecimals = {
	temperature: { decimals: 1 },
	battery: { decimals: 2 }
};

export default function Chart({
	chart,
	onLegendItemClick = () => { },
	projectColors = [],
	disableChartSettings,
	projectId
}) {

	const [chartSettings, setChartSettings] = useState(null);
	chartSettingsHook(!disableChartSettings ? chart.type : null,
		{
			onSuccess: (data) => {
				let settings = deepCopy(data.settings);
				settings.unshift({ id: 0, name: <i>My Changes</i> });
				setChartSettings(settings);
			},
			staleTime: 1000 * 120//2 minute stale time, extremely infrequent changes to this data
		});

	const [plotBands, setPlotBands] = useState([]);
	const [originalPlotBands, setOriginalPlotbands] = useState([]);
	const [currentChartId, setCurrentChartId] = useState(0);
	const [originalChartId, setOriginalChartId] = useState(0);
	const [showLegends, setShowLegends] = useState(true);
	const [storedProjectPlotBands, setStoredProjectPlotBands] = useState([]);

	let chartRef;

	const [dynamicSize, setDynamicSize] = useState({
		min: null,
		max: null
	});

	useEffect(() => {
		if (!chartSettings && chart && chart.options) return;
		let aPlotBands = [];
		//Get colors created from project
		let projectColorObj = projectColors.find((obj) => {
			return obj.sensorType == chart.type;
		});

		//If this project has created custom chart colors for this sensor
		if (projectColorObj) {
			//Apply project colors to plotBands
			aPlotBands = projectColorObj.colors.map((colorObj) => {
				return {
					color: colorObj.color,
					from: colorObj.from,
					text: colorObj.text ? colorObj.text : colorObj.text,
					to: colorObj.to,
				};
			});
		}
		else {
			//If no custom colors were found, create an empty default color
			aPlotBands = [{
				color: 'rgb(255,255,255)',
				from: -maxMinYAxis,
				text: '',
				to: maxMinYAxis,
			}];
		}
		//defaultSetting is the ID of the chart that is currently selected by the project
		let chartId = projectColorObj ? projectColorObj.defaultSetting : null;
		if (chartId === null) {
			chartId = chartSettings.length > 1 ? chartSettings[1].id : 0;
		}
		if (chartId !== 0) {
			//Find a suitable setting
			let settings = chartSettings.find((item) => {
				return item.id == chartId;
			});
			settings = settings || chartSettings.find((item) => {
				return item.name === 'Default';
			});
			settings = settings || chartSettings[1];

			if (settings) {
				chartId = settings.id;
			}
			else {
				settings = deepCopy(defaultChartSettings);
			}
			aPlotBands = settings.colors || settings;
		}

		setPlotBands(aPlotBands);
		setCurrentChartId(chartId);
		setOriginalChartId(chartId);

		setStoredProjectPlotBands(deepCopy(aPlotBands));
		setOriginalPlotbands(deepCopy(aPlotBands));

	}, [chartSettings]);

	function dynamicallyResizeChart() {
		let rangeData = chartRef.chart.yAxis[0].getExtremes();
		rangeData.dataMax = rangeData.dataMax === 0 ? 0.1 : rangeData.dataMax;
		rangeData.dataMin = rangeData.dataMin === 0 ? -0.1 : rangeData.dataMin;
		if (rangeData.dataMax && rangeData.dataMin && !dynamicSize.max && !dynamicSize.min) {
			setDynamicSize({
				min: rangeData.dataMax + (rangeData.dataMax * 0.1),
				max: rangeData.dataMin - (rangeData.dataMax * 0.1)
			});
		}
		else {
			setDynamicSize({
				min: null,
				max: null
			});
		}
	}

	function getOptions() {

		if (!chart.options || !chartSettings) {
			return deepCopy(defaultOptions);
		}

		let options = deepCopy(defaultOptions);

		let decimalPrecision = sensorDecimals[chart.type];
		if (decimalPrecision) {
			options.tooltip.valueDecimals = decimalPrecision.decimals;
		}

		options.xAxis.min = getLocalTimeMs(chart.options.from, -1);
		options.xAxis.max = getLocalTimeMs(chart.options.to, 1);

		let settings =
			currentChartId === 0 ?
				chartSettings[1]
				:
				chartSettings.find((item) => {
					return item.id == currentChartId;
				});

		if (!settings) {
			settings = deepCopy(defaultChartSettings);
		}

		let yTicks = settings.yTicks;
		options.yAxis.type = yTicks.length > 0 ? 'logarithmic' : 'linear';
		options.yAxis.title.text = chart.options.yTitle;

		let dynamicMinMax = dynamicSize.min && dynamicSize.max;
		if (settings.yRangeType === 'soft') {
			options.yAxis.min = null;
			options.yAxis.max = null;
			options.yAxis.softMin = dynamicMinMax ? dynamicSize.min : settings.yMin;
			options.yAxis.softMax = dynamicMinMax ? dynamicSize.max : settings.yMax;
		}
		else {
			options.yAxis.softMin = null;
			options.yAxis.softMax = null;
			options.yAxis.min = dynamicMinMax ? dynamicSize.min : settings.yMin;
			options.yAxis.max = dynamicMinMax ? dynamicSize.max : settings.yMax;
		}

		let aPlotBands = plotBands.map((plotBand) => {
			plotBand.label = { style: { color: "#000000", zIndex: -3 }, text: plotBand.text };
			plotBand.zIndex = -2;
			return plotBand;
		});
		options.yAxis.plotBands = aPlotBands;
		options.yAxis.customTicks = yTicks.length > 0 ? yTicks : [];
		//options.plotOptions.series.events.legendItemClick = onLegendItemClick;
		options.exporting.buttons[1].onclick = dynamicallyResizeChart;
		options.exporting.buttons[1].text = dynamicMinMax ? 'Reset Auto Zoom' : 'Auto Zoom';
		options.exporting.buttons[2].x = dynamicMinMax ? -150 : -120;
		options.exporting.buttons[2].onclick = () => setShowLegends(!showLegends);

		options.legend.enabled = showLegends;
		for (let set of chart.datasets) {
			options.series.push({
				name: set.label,
				data: set.data,
				sensorId: set.sensorId,
				deviceId: set.deviceId,
				visible: set.visible
			});
		}

		return options;
	}

	function showColorSettings() {
		let x = document.getElementById("colorSettings" + chart.type);
		if (x.style.display === "none") {
			x.style.display = "block";
		}
		else {
			x.style.display = "none";
		}
	}


	function changeColor(index, color) {
		let aPlotBands = deepCopy(plotBands);
		let plotBand = aPlotBands[index];
		// Turn the new color value to RGB
		let colorRGB = color.hex;
		plotBand.color = colorRGB;
		setCurrentChartId(0);
		setPlotBands(aPlotBands);
	}

	function changeText(index, event) {
		let aPlotBands = deepCopy(plotBands);
		aPlotBands[index].text = event.target.value;
		setPlotBands(aPlotBands);
	}

	function changeLevel(index, event) {
		let aPlotBands = deepCopy(plotBands);

		aPlotBands[index].to = event.target.value;
		aPlotBands[index + 1].from = event.target.value;
		if (index > 0) {
			aPlotBands[index].from = aPlotBands[index - 1].to;
		}
		if (index === 0) {
			aPlotBands[index].from = -maxMinYAxis;
		}
		setCurrentChartId(0);
		setPlotBands(aPlotBands);
	}

	function currentChartIdChanged(e, { value }) {
		let aPlotBands;
		let aStoredProjectPlotBands = deepCopy(storedProjectPlotBands);
		if (currentChartId !== 0 && value !== 0) {
			let settings = chartSettings.find((item) => {
				return item.id == value;
			});
			aPlotBands = settings.colors;
		}
		else if (currentChartId === 0 && value !== 0) {
			let settings = chartSettings.find((item) => {
				return item.id == value;
			});
			aPlotBands = deepCopy(settings.colors);
			aStoredProjectPlotBands = deepCopy(plotBands);
		}
		else if (value === 0) {
			aPlotBands = deepCopy(storedProjectPlotBands);
		}
		setCurrentChartId(value); setStoredProjectPlotBands(aStoredProjectPlotBands); setPlotBands(aPlotBands);

	}

	function addColor() {
		//Color to be added to plotBands
		let newColor = {
			color: '#FFFFF',
			from: 0,
			text: 'New Color',
			to: 5,
		};
		//Add new color band in beginning of array, unshift meaning to add to the start.
		let aPlotBands = deepCopy(plotBands);
		aPlotBands.unshift(newColor);
		if (aPlotBands.length > 1) {
			aPlotBands[1].from = aPlotBands[0].to;
		}

		setCurrentChartId(0);
		setPlotBands(aPlotBands);
	}

	function removeColor() {
		let aPlotBands = deepCopy(plotBands);
		aPlotBands.shift();
		aPlotBands[0].from = -maxMinYAxis;
		setCurrentChartId(0);
		setPlotBands(aPlotBands);
	}

	const saveColors = baseMutationHook({
		apiReq: async () => {
			let aPlotbands = deepCopy(plotBands);
			aPlotbands.map((color) => {
				if (color.text === '') {
					color.text = 'New Color';
				}
			});
			setPlotBands(aPlotbands);
			//TODO: Fix "my changes" being cleared when saving to a default setting
			return await api.put('organizations/' + projectId, { type: chart.type, colors: aPlotbands, defaultSetting: currentChartId });
		},
		onSuccess: () => {
			toastSuccess('Successfully Saved Colors');
		}
	});

	function cancel() {
		setPlotBands(deepCopy(originalPlotBands));
		setCurrentChartId(originalChartId);
	}

	let chartColors = null;
	chartColors = plotBands.slice(0).reverse().map((plotBand, index) => {
		let currentIndex = plotBands.length - index - 1;
		return (
			<div style={{ paddingBottom: '1em' }} key={index}>
				<Input
					action={<ColorPicker disableAlpha color={plotBand.color} onChangeComplete={(color) => changeColor(currentIndex, color)} />}
					actionPosition='left'
					value={plotBand.text}
					size="mini"
					onChange={(e) => changeText(currentIndex, e)}
				/>
				{
					index !== 0 &&
					<Input type='number' label='Level' value={plotBand.to} size="mini" onChange={(e) => changeLevel(currentIndex, e)} />
				}
			</div>
		);
	});

	let chartSettingsList = chartSettings ?
		chartSettings.map((item) => {
			return { key: item.id, value: item.id, text: item.name };
		})
		:
		[];

	return (
		<div>
			<HighchartsReact
				highcharts={Highcharts}
				options={getOptions()}
				ref={(aChartRef) => chartRef = aChartRef}
			/>
			{
				!disableChartSettings ?
					<Button onClick={showColorSettings}>Settings</Button> :
					<Popup content='Chart Settings are available for Admins and Owners' trigger={<span><Button disabled>Settings</Button></span>} />
			}
			{
				!disableChartSettings &&
				<Segment id={"colorSettings" + chart.type} style={{ display: "none", width: '70%', minWidth: 300 }}>
					<Header as='h3' floated='left'>
						<Header.Content>
							Colors
						</Header.Content>
					</Header>
					<Dropdown
						style={{ float: 'right' }}
						search
						selection
						label='Sensor'
						value={currentChartId}
						onChange={currentChartIdChanged}
						options={chartSettingsList}
					/>
					<br />
					<div>
						<br />
						{chartColors}
						<br />
						<Button
							disabled={plotBands.length === 5}
							color='green'
							onClick={addColor}
							content='Add'
						/>
						<Button
							disabled={plotBands.length === 1}
							color='red'
							onClick={removeColor}
							content='Remove'
						/>
						<Button loading={saveColors.isLoading} color='green' floated='right' onClick={saveColors.mutate}>Save</Button>
						<Button floated='right' onClick={cancel}>Cancel</Button>
					</div>
				</Segment>
			}
		</div>
	);
}