import Highcharts from 'highcharts';

// Basically overrides some functions in Highcharts to enable non-linear scales.
// # 1337 H4ckz0r

function scale(num, in_min, in_max, out_min, out_max) {
  return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

// Pass error messages
Highcharts.Axis.prototype.allowNegativeLog = true;

const defaultGetLogTickPositions = Highcharts.Axis.prototype.getLogTickPositions;
const defaultLog2lin = Highcharts.Axis.prototype.log2lin;
const defaultLin2log = Highcharts.Axis.prototype.lin2log;

Highcharts.Axis.prototype.getLogTickPositions = function (interval, min, max, minor) {
  let options = this.options;
  if (options.customTicks) {
    let interval = options.customTicks[options.customTicks.length - 1] / (options.customTicks.length - 1);
    return options.customTicks.map((v, i) => i * interval);
  }
  else {
    return defaultGetLogTickPositions(interval, min, max, minor);
  }
};

Highcharts.Axis.prototype.log2lin = function (num) {
  let customTicks = this.options.customTicks;
  if (customTicks && customTicks.length > 0) {
    let tickInterval = (customTicks[customTicks.length - 1] / (customTicks.length - 1));
    for (let i = 0; i < customTicks.length - 1; i++) {
      if (num <= customTicks[i + 1]) {
        return scale(num, customTicks[i], customTicks[i + 1], i * tickInterval, (i + 1) * tickInterval);
      }
    }
    return customTicks[customTicks.length - 1];
  }
  else {
    return defaultLog2lin(num);
  }
};

Highcharts.Axis.prototype.lin2log = function (num) {
  let customTicks = this.options.customTicks;
  if (customTicks) {
    let tickInterval = (customTicks[customTicks.length - 1] / (customTicks.length - 1));
    for (let i = 0; i < customTicks.length - 1; i++) {
      if (num <= tickInterval * (i + 1)) {
        return scale(num, i * tickInterval, (i + 1) * tickInterval, customTicks[i], customTicks[i + 1]);
      }
    }
  }
  else {
    return defaultLin2log(num);
  }
};

export default Highcharts;
