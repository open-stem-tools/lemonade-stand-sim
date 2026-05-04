var App = App || {};

(function () {

  function fractionWhoBuy(price, weatherId) {
    var info = App.weather.getWeatherInfo(weatherId);
    var minWTP = 1.50 + info.wtpBonus;
    var maxWTP = 4.50 + info.wtpBonus;
    if (price <= minWTP) return 1.0;
    if (price >= maxWTP) return 0.0;
    var t = (maxWTP - price) / (maxWTP - minWTP);
    return t * t;
  }

  function simulateDay(cupsProduced, priceCharged, weatherId, baseCustomers) {
    var info = App.weather.getWeatherInfo(weatherId);
    var randomFactor = 0.8 + Math.random() * 0.4;
    var potentialCustomers = Math.round(baseCustomers * info.demandMult * randomFactor);

    var fraction = fractionWhoBuy(priceCharged, weatherId);
    var willingCustomers = Math.round(potentialCustomers * fraction);

    var cupsSold = Math.min(willingCustomers, cupsProduced);
    var lostSales = Math.max(willingCustomers - cupsProduced, 0);
    var wastedCups = Math.max(cupsProduced - willingCustomers, 0);

    return {
      potentialCustomers: potentialCustomers,
      willingCustomers: willingCustomers,
      cupsSold: cupsSold,
      cupsProduced: cupsProduced,
      lostSales: lostSales,
      wastedCups: wastedCups,
      priceCharged: priceCharged,
      weather: weatherId
    };
  }

  App.simulation = {
    fractionWhoBuy: fractionWhoBuy,
    simulateDay: simulateDay
  };
})();
