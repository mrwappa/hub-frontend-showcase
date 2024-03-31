import React from 'react';
import { Checkbox, Dropdown, Image, Input } from 'semantic-ui-react';
import L from 'leaflet';
import ReactPlayer from 'react-player';
import { getCurrentProjectId } from './ApiService';
import QueryString from 'query-string';

/*For identifying image urls*/
const request = require('sync-request');
const urlParse = require('url').parse;
const isUrl = require('is-url');
const path = require('path');
const imageExtensions = require('image-extensions');
const extensions = new Set(imageExtensions);
/*For identifying image urls*/

function isImage(filePath) {
  return extensions.has(path.extname(filePath).slice(1).toLowerCase());
}

export const sensorTypes = {
  'absolute-humidity': 'g/m³',
  'barometric-pressure': 'hPa',
  'concentration': 'mg/kg',
  'battery': 'V',
  'current': 'A',
  'dew-point': '°C',
  'digital': '',
  'energy': 'kWh',
  'humidity': '%',
  'volumetric-water-content': '%',
  'integer': '',
  'float': '',
  'moisture': 'kPa',
  'percentage': '%',
  'battery-percentage': '%',
  'power': 'W',
  'precipitation': 'mm',
  'rain-rate': 'mm/h',
  'pressure': 'Pa',
  'rssi': 'dBm',
  'solar-radiation': 'W/m²',
  'temperature': '°C',
  'uv-index': '',
  'voltage': 'V',
  'wind-direction': '°',
  'wind-speed': 'm/s',
  'conductivity': 'uS/cm',
  'total-disolved-solids': 'ppm',
  'salinity': 'g/kg',
  'pH': 'pH',
  'dissolved-oxygen': 'mg/L',
  'frequency': 'Hz',
  'resistance': 'Ohm'
};

export function getSensorUnit(type) {
	return sensorTypes[type] || '';
}

export const excludedData = [
  'battery',
  'battery-percentage',
  'rssi',
  'resistance'
];

const simpleViewData = [
  'battery',
  'battery-percentage',
  'wind-speed',
  'wind-direction',
  'temperature',
  'moisture',
  'humidity'
];

export const availableLimits = [20, 50, 100, 200].map(i => ({ text: i.toString(), value: i }));

export const formatExportOptions = [
  { key: 'csv', text: 'CSV', value: 'csv' },
  { key: 'csv-pivot', text: 'CSV Pivot', value: 'csv-pivot' }
];

export const joinTypes = [
  { key: 'OTAA', value: 'OTAA', text: 'OTAA' },
  { key: 'ABP', value: 'ABP', text: 'ABP' }
];

export const classTypes = [
  { key: 'A', value: 'A', text: 'A', description: "Choose this if you're unsure" },
  { key: 'C', value: 'C', text: 'C' }
];

export const defaultMarkerColors = {
  blue: '#4287f5',
  white: '#FFFFFF',
  black: '#000000',
  purple: '#941392',
  gray: '#858585'
};

export const inventoryImageStyle = { maxWidth: 80, height: 'auto' };

export const defaultBlankImage = 'https://react.semantic-ui.com/images/wireframe/image.png';

export function createMarker(color, markerType) {

  let borderWRadius= '2rem';
  let borderColor= '#FFFFFF';
  let width = '2.5rem';
  let height = '2.5rem';
  let borderThickness = '2px';

  switch (markerType) {
    case 'gateway': {
      borderColor = '#000000';
      borderWRadius = '1.5rem';
      break;
    }
    case 'imageMap': {
      borderColor = '#000000';
      borderThickness = '3px';
      break;
    }
  }

  const markerHtmlStyles = `
    background-color: ${color};
    width: ${width};
    height: ${height};
    display: block;
    left: -1.25rem;
    top: -1.25rem;
    position: relative;
    border-radius: ${borderWRadius} 2.5rem 0;
    transform: rotate(45deg);
    border: ${borderThickness} solid ${borderColor}`;

  return L.divIcon({
    className: "",
    iconAnchor: [0, 30],
    labelAnchor: [0, 0],
    popupAnchor: [0, 0],
    html: `<span style="${markerHtmlStyles}" />`
  });
}

export const payloadHexWarning = "Payload Hex is an advanced feature that can change important values which are stored inside the device. Sending an unwanted Hex value can stop your device from sending data. If your device stops working after you've sent a Payload Hex, please contact a professional.";

export const GeoLocationOptions = { enableHighAccuracy: true, timeout: 20000 };

export function capitalizeFirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function prettifyIdentifier(string) {
  return string
    .toLowerCase()
    .replace(/-/g, ' ')
    .split(' ')
    .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
    .join(' ');
}

export function displaySensor(sensor) {
	const sensorUnit = getSensorUnit(sensor.type);
	const sensorValue = sensor.type !== 'string' ? limitDecimal(sensor.value, 2) : sensor.value;
	return sensorValue + ' ' + sensorUnit;
}

export function redirectToOverview(navigate) {
	let projectId = getCurrentProjectId();
	if (projectId) {
		navigate('../overview?project=' + projectId, { replace: true });
	}
	else {
		navigate('../overview', { replace: true });
	}
}

export function RGBAtoHex(orig) {
  let rgb = orig.replace(/\s/g, '').match(/^rgba?\((\d+),(\d+),(\d+),?([^,\s)]+)?/i),
      hex = rgb ?
          (rgb[1] | 1 << 8).toString(16).slice(1) +
          (rgb[2] | 1 << 8).toString(16).slice(1) +
          (rgb[3] | 1 << 8).toString(16).slice(1) : orig;
  return '#' + hex;
}

export function hexToRGB(h) {
  let r = 0, g = 0, b = 0;
  r = "0x" + h[1] + h[2];
  g = "0x" + h[3] + h[4];
  b = "0x" + h[5] + h[6];
  return "rgb(" + + r + "," + + g + "," + + b + ")";
}

export function isUrlImage (url, accurate, timeout) {
  if (!url) return false;

  const http = url.lastIndexOf('http');
  if (http != -1) url = url.substring(http);

  if (!isUrl(url)) return isImage(url);

  let pathname = urlParse(url).pathname;
  if (!pathname) return false;

  const last = pathname.search(/[:?&]/);
  if (last != -1) pathname = pathname.substring(0, last);

  if (isImage(pathname)) return true;

  if (/styles/i.test(pathname)) return false;

  try {
    if (!accurate) return false;

    if (!timeout) timeout = 60000;

    const res = request('GET', url, { timeout });
    if (!res) return false;

    const headers = res.headers;
    if (!headers) return false;

    const contentType = headers['content-type'];
    if (!contentType) return false;
    return contentType.search(/^image\//) != -1;
  } 
  catch (e) {
    return false;
  }
}

function isUrlVideo(url, timeout) {

  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return true;
  }

  try {
    if (!timeout) timeout = 60000;

    const res = request('GET', url, { timeout });
    if (!res) return false;

    const headers = res.headers;
    if (!headers) return false;

    const contentType = headers['content-type'];
    if (!contentType) return false;
    return contentType.search(/^video\//) != -1;
  } 
  catch (e) {
    return false;
  }
}

export function identifyTimeUnit(milliSeconds) {

  if (milliSeconds < 60000) { //1 minute
    return 'seconds';
  }
  else if (milliSeconds > 60000 && milliSeconds < 3600000) { //1 minute to 1 hour
    return getNearestTimeUnitValue(milliSeconds) === 1 ? 'minute' : 'minutes';
  }
  else if (milliSeconds > 3600000 && milliSeconds < 86400000) { //1 hour to 1 day
    return getNearestTimeUnitValue(milliSeconds) === 1 ? 'hour' : 'hours';
  }
  else if (milliSeconds > 86400000 && milliSeconds < 604800000) { //1 day to 1 week
    return getNearestTimeUnitValue(milliSeconds) === 1 ? 'day' : 'days';
  }
  else if (milliSeconds > 604800000 && milliSeconds < 2592000000) { //1 week to 1 month
    return getNearestTimeUnitValue(milliSeconds) === 1 ? 'week' : 'weeks';
  }
  else if (milliSeconds > 2592000000 && milliSeconds < 31556952000) { //1 month to 1 year
  return getNearestTimeUnitValue(milliSeconds) === 1 ? 'month' : 'months';
  }
  else if (milliSeconds > 31556952000) { //1 month to 1 year
    return getNearestTimeUnitValue(milliSeconds) === 1 ? 'year' : 'years';
  }

  return 'none';
}

export function getNearestTimeUnitValue(milliSeconds) {

  if (milliSeconds < 60000) { //1 minute
    return roundHalf(milliSeconds / 10000);
  }
  else if (milliSeconds > 60000 && milliSeconds < 3600000) { //1 minute to 1 hour
    return roundHalf(milliSeconds / 60000);
  }
  else if (milliSeconds > 3600000 && milliSeconds < 86400000) { //1 hour to 1 day
    return roundHalf(milliSeconds / 3600000);
  }
  else if (milliSeconds > 86400000 && milliSeconds < 604800000) { //1 day to 1 week
    return roundHalf(milliSeconds / 86400000);
  }
  else if (milliSeconds > 604800000 && milliSeconds < 2592000000) { //1 week to 1 month
    return roundHalf(milliSeconds / 604800000);
  }
  else if (milliSeconds > 2592000000 && milliSeconds < 31556952000) { //1 month to 1 year
    return roundHalf(milliSeconds / 2592000000);
  }
  else if (milliSeconds > 31556952000) { //1 month to 1 year
    return roundHalf(milliSeconds / 31556952000);
  }

  return -1;
}

export function roundHalf(num) {
  return Math.round(num*2)/2;
}

export function getTimeDescription(milliSeconds) {
  let timeUnit = identifyTimeUnit(milliSeconds);
  let time = roundHalf(getNearestTimeUnitValue(milliSeconds));

  return time + ' ' + timeUnit;
}

export function removeSpecialCharacters(string) {
  return string.replace(/[&/\\#,+()$~%.'":*?<>{}@ ]/g, '');
}

export function limitDecimal(input, decimals) {
  if (!isNaN(input)) {
    return parseFloat((Number(input)).toFixed(decimals));
  }
}

export function isDataRelevant(identifer) {
  return !excludedData.includes(identifer.toLowerCase());
}

export function isDataSimple(identifer) {
  return simpleViewData.includes(identifer.toLowerCase());
}

export function validateUrl(value) {
  return /^https?:\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(value);
}

function insertString(str, index, value) {
  return str.substring(0, index) + value + str.substr(index);
}

export function beautifyTimeIntervalCriteria(criteria) {
  let firstLetterIndex = criteria.match(/[a-zA-Z]/).index;
  //insert space between unit and value
  criteria = insertString(criteria,firstLetterIndex,' ');
  return criteria;
}

export function getAlarmDescription(alarm) {
  switch (alarm.alarmType) {
    case 'lowerThan':
      return <span>When <b>{alarm.sensorType}</b> is lower than <b>{alarm.criteria.lowerThan} {sensorTypes[alarm.sensorType]}</b></span>;
    case 'greaterThan':
      return <span>When <b>{alarm.sensorType}</b> is greater than <b>{alarm.criteria.greaterThan} {sensorTypes[alarm.sensorType]}</b></span>;
    case 'outOfRange':
      return <span>When <b>{alarm.sensorType} </b>is outside the range <b>{alarm.criteria.lowerThan} {sensorTypes[alarm.sensorType]}</b> to <b>{alarm.criteria.greaterThan} {sensorTypes[alarm.sensorType]}</b></span>;
    case 'updateInterval':
      return <span>When <b>{alarm.sensorType}</b> has not reported for <b>{beautifyTimeIntervalCriteria(alarm.criteria.updateInterval)}</b></span>;
    case 'always':
      return <span>Whenever a new {alarm.sensorType} value is reported</span>;
  }
}

export function getAlarmWarningDescription(alarm, sensor) {
  switch (alarm.alarmType) {
    case 'lowerThan':
      return <span><b>{sensor.name}</b> is lower than <b>{alarm.criteria.lowerThan} {sensorTypes[alarm.sensorType] }</b> ({sensor.value} {sensorTypes[sensor.type]}) </span>;
    case 'greaterThan':
      return <span><b>{sensor.name}</b> is greater than <b>{alarm.criteria.greaterThan} {sensorTypes[alarm.sensorType]}</b> ({sensor.value} {sensorTypes[sensor.type]}) </span>;
    case 'outOfRange':
      return <span><b>{sensor.name}</b> is outside the range <b>{alarm.criteria.lowerThan} {sensorTypes[alarm.sensorType]}</b> to <b>{alarm.criteria.greaterThan} {sensorTypes[alarm.sensorType]}</b> ({sensor.value} {sensorTypes[sensor.type]}) </span>;
    case 'updateInterval':
      return <span><b>{sensor.name}</b> failed to reported within <b>{beautifyTimeIntervalCriteria(alarm.criteria.updateInterval)}</b></span>;
    case 'always':
      return <span>Whenever a new {alarm.sensorType} value is reported</span>;
  }
}

export function deepCopy(value) {
  return JSON.parse(JSON.stringify(value));
}

export function copyExistingJsonValues(to, from, unsafe = false) {
	for (let key in to) {
		if (unsafe || from[key])  
		to[key] = from[key];
	}
}

export function getParameterInput (param, changed, validInput, onParameterChange, onParameterToggle) {
	switch (param.type) {
		case 'integer':
			return <Input
				fluid
				type='number'
				placeholder={param.constraints.min + '-' + param.constraints.max}
				min={param.constraints && param.constraints.min}
				max={param.constraints && param.constraints.max}
				error={!validInput}
				step='1'
				value={changed ? changed.value : param.value}
				onChange={(e, d) => onParameterChange(param.identifier, e, d)}
			/>;
		case 'float':
			return <Input
				fluid
				type='number'
				placeholder={param.constraints.min + '-' + param.constraints.max}
				min={param.constraints && param.constraints.min}
				max={param.constraints && param.constraints.max}
				error={!validInput}
				step='any'
				value={changed ? changed.value : param.value}
				onChange={(e, d) => onParameterChange(param.identifier, e, d)}
			/>;
		case 'boolean':
			return <Checkbox
				checked={changed ? changed.value : param.value}
				onChange={(e, d) => onParameterToggle(param.identifier, e, d)}
			/>;
		case 'choice':
			return <Dropdown
				fluid
				selection
				value={changed ? changed.value : param.value}
				onChange={(e, d) => onParameterChange(param.identifier, e, d)}
				options={param.constraints.choices.map(c => ({ text: c.name, value: c.value }))}
			/>;
	}
}

export function getURLParams(url, specificKey) {
	let match = QueryString.parseUrl(url);
	if (specificKey && match.query) {
		return match.query[specificKey];
	}
	else if (match.query) {
		return match.query;
	}
	return undefined;
}

export function constructComment(comment) {
    
  if (comment.length === 0) {
    return '';
  }

  let contentArray = [];
  let newLineIndex = 0;
  let currentContent = comment;
  //Split comments for each new line
  while (newLineIndex !== -1) {
    //get index of new line
    newLineIndex = currentContent.indexOf('\n');
    if (newLineIndex !== -1) {
      //split string in two based on index of new line
      let firstHalf = currentContent.substring(0, newLineIndex);
      let secondHalf = currentContent.substring(newLineIndex + 1, currentContent.length);
      //add first half and continue 
      contentArray.push(firstHalf);
      currentContent = secondHalf;
      //if there are no new lines left, add second half
      if (secondHalf.indexOf('\n') == -1) {
        contentArray.push(secondHalf);
      }
    }
    else if (newLineIndex === -1 && contentArray.length === 0) {//if no new lines found, add content and stop
      contentArray.push(currentContent);
    } 
  }
  
  //Pull out all image links from each content object and create the elements
  let elementsArray = [];
  for (let content of contentArray) {
    newLineIndex = 0;
    currentContent = content;
    let mediaLinkIndex = 0;

    while (mediaLinkIndex !== -1) {
      mediaLinkIndex = currentContent.indexOf('https://');
      mediaLinkIndex = mediaLinkIndex === -1 ? currentContent.indexOf('http://') : mediaLinkIndex;
      if (mediaLinkIndex !== -1) {
        //find end of link string index by searching for next space
        let mediaLinkEndIndex = currentContent.indexOf(' ',mediaLinkIndex);
        //if no space character was found, set end index to length currentContent string
        mediaLinkEndIndex = mediaLinkEndIndex === -1 ? currentContent.length : mediaLinkEndIndex;

        let text = currentContent.substring(0,mediaLinkIndex);
        let link = currentContent.substring(mediaLinkIndex, mediaLinkEndIndex);
        
        let isLinkImage = isUrlImage(link);
        let isLinkVideo = isLinkImage ? false : isUrlVideo(link);

        elementsArray.push(
          <div key={elementsArray.length}>
            {text}
            <br/> 
          </div>
        );
        
        if (isLinkImage) {
          elementsArray.push(
            <a
              href={link}
              key={elementsArray.length}
              target='_blank'
              rel='noopener noreferrer'
            >
              {link}
              <br/>
            </a>
          );
          elementsArray.push(
            <div key={elementsArray.length}>
              <Image 
								rounded
                key={link}
                href={link}
                target='_blank'
                rel='noopener noreferrer'
                src={link}
                style={{ maxWidth: global.innerWidth <= 640 ? 400 : null, maxHeight: "inherit" }}
              />
              <br/>
            </div>
          );
        }
        else if (isLinkVideo) {
          elementsArray.push(
            <a
              href={link}
              key={elementsArray.length}
              target='_blank'
              rel='noopener noreferrer'
            >
              {link}
              <br/>
            </a>
          );
          elementsArray.push(
            <ReactPlayer
              url={link}
              controls
            />
          );
        }
        else {
          elementsArray.push(
            <a 
              href={link} 
              rel='noopener noreferrer' 
              target='_blank' 
              key={elementsArray.length}
            >
              {link}
            </a>
          );
        }

        if (mediaLinkEndIndex === currentContent.length) {
          break;
        }
        
        currentContent = currentContent.substring(mediaLinkEndIndex + 1, currentContent.length);
      }
      else {
        elementsArray.push(
          <div key={elementsArray.length}>
            {currentContent}
            <br/>
          </div>
        );
      }
    }
  }

  return elementsArray;
}
