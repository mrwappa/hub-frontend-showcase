(function () {
	//TODO: import units from supported sensors at UtilityService
	var units = {
		'absolute-humidity': 'g/m³',
		'barometric-pressure': 'hPa',
		'battery': 'V',
		'current': 'A',
		'dew-point': '°C',
		'digital': '',
		'energy': 'kWh',
		'humidity': '%',
		'integer': '',
		'moisture': 'kPa',
		'percentage': '%',
		'power': 'W',
		'precipitation': 'mm',
		'pressure': 'Pa',
		'rssi': 'dBm',
		'solar-radiation': 'W/m²',
		'temperature': '°C',
		'uv-index': '',
		'voltage': 'V',
		'wind-direction': '°',
		'wind-speed': 'm/s'
	};

	function request(url, callback, x) {
		try {
			x = new (this.XMLHttpRequest || ActiveXObject)('MSXML2.XMLHTTP.3.0');
			x.open('GET', url, 1);
			x.onreadystatechange = function () {
				x.readyState > 3 && callback && callback(x.responseText, x);
			};
			x.send();
		}
		catch (e) {
			window.console && console.log(e);
		}
	}

	var widgets = document.getElementsByClassName('sensefarm-widget');

	for (var w = 0; w < widgets.length; w++) {
		(function (widget) {
			request('https://hub.sensefarm.com/api/v2/devices/check/' + widget.getAttribute('data-uid'), function (body) {
				var d = JSON.parse(body);
				for (var i = 0; i < d.data.length; i++) {
					if (d.data[i].identifier === widget.getAttribute('data-sensor')) {
						widget.innerHTML =
							'<span class="widget-title">' +
							widget.getAttribute('data-title') +
							'</span><span class="widget-value">' +
							parseFloat(d.data[i].value.toFixed(1)) + ' ' + units[d.data[i].type] +
							'</span><span class="widget-logo">' +
							'<a href="https://sensefarm.com"><img src="https://hub.sensefarm.com/widget/logo.png" /></a>' +
							'</span>';
					}
				}
			});
		})(widgets[w]);
	}
})();
