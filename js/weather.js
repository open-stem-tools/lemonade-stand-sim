var App = App || {};

(function () {

  var WEATHER_TYPES = [
    { id: 'sunny_hot',      label: 'Sunny & Hot',     icon: '☀️🔥', demandMult: 1.5, wtpBonus: 1.50, tempRange: [85, 100], skyClass: 'sky-sunny-hot' },
    { id: 'sunny',          label: 'Sunny',            icon: '☀️',   demandMult: 1.2, wtpBonus: 0.75, tempRange: [75, 85],  skyClass: 'sky-sunny' },
    { id: 'partly_cloudy',  label: 'Partly Cloudy',    icon: '⛅',   demandMult: 1.0, wtpBonus: 0.00, tempRange: [70, 82],  skyClass: 'sky-partly-cloudy' },
    { id: 'cloudy',         label: 'Cloudy',           icon: '☁️',   demandMult: 0.7, wtpBonus: -0.50, tempRange: [65, 78], skyClass: 'sky-cloudy' },
    { id: 'rainy',          label: 'Rainy',            icon: '🌧️',   demandMult: 0.3, wtpBonus: -0.50, tempRange: [60, 75], skyClass: 'sky-rainy' },
    { id: 'stormy',         label: 'Stormy',           icon: '⛈️',   demandMult: 0.1, wtpBonus: -1.00, tempRange: [55, 70], skyClass: 'sky-stormy' }
  ];

  var PROBS = [0.30, 0.25, 0.20, 0.12, 0.10, 0.03];

  function getWeatherInfo(weatherId) {
    for (var i = 0; i < WEATHER_TYPES.length; i++) {
      if (WEATHER_TYPES[i].id === weatherId) return WEATHER_TYPES[i];
    }
    return WEATHER_TYPES[2];
  }

  function weightedRandom(types, probs) {
    var r = Math.random();
    var cumulative = 0;
    for (var i = 0; i < probs.length; i++) {
      cumulative += probs[i];
      if (r <= cumulative) return types[i].id;
    }
    return types[types.length - 1].id;
  }

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function randomInRange(min, max) {
    return Math.round(min + Math.random() * (max - min));
  }

  function generateWeather(numDays) {
    var actual = [];
    var forecast = [];
    var temperatures = [];

    for (var d = 0; d < numDays; d++) {
      var actualWeather = weightedRandom(WEATHER_TYPES, PROBS);
      actual.push(actualWeather);

      if (Math.random() < 0.80) {
        forecast.push(actualWeather);
      } else {
        var idx = -1;
        for (var j = 0; j < WEATHER_TYPES.length; j++) {
          if (WEATHER_TYPES[j].id === actualWeather) { idx = j; break; }
        }
        var shift = Math.random() < 0.5 ? -1 : 1;
        var newIdx = clamp(idx + shift, 0, WEATHER_TYPES.length - 1);
        forecast.push(WEATHER_TYPES[newIdx].id);
      }

      var info = getWeatherInfo(actualWeather);
      temperatures.push(randomInRange(info.tempRange[0], info.tempRange[1]));
    }

    return { actual: actual, forecast: forecast, temperatures: temperatures };
  }

  App.weather = {
    WEATHER_TYPES: WEATHER_TYPES,
    getWeatherInfo: getWeatherInfo,
    generateWeather: generateWeather
  };
})();
