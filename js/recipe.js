var App = App || {};

(function () {
  var GLASS_ML = 300;
  var TOTAL_PARTS = 7;
  var PART_ML = GLASS_ML / TOTAL_PARTS;

  var JUICE_PARTS = 1;
  var SYRUP_PARTS = 1;
  var WATER_PARTS = 5;

  var JUICE_DENSITY = 1.03;
  var JUICE_YIELD = 0.33;
  var BAG_LB = 2;
  var LB_TO_G = 453.592;

  function juicePerCup() {
    return PART_ML * JUICE_PARTS;
  }

  function syrupPerCup() {
    return PART_ML * SYRUP_PARTS;
  }

  function waterInSyrupPerCup() {
    return syrupPerCup() / 2;
  }

  function sugarVolumePerCup() {
    return syrupPerCup() / 2;
  }

  function sugarMassPerCup() {
    return syrupPerCup() / 2;
  }

  function dilutionWaterPerCup() {
    return PART_ML * WATER_PARTS;
  }

  function totalWaterPerCup() {
    return waterInSyrupPerCup() + dilutionWaterPerCup();
  }

  function bagMassG() {
    return BAG_LB * LB_TO_G;
  }

  function juiceMassPerBag() {
    return bagMassG() * JUICE_YIELD;
  }

  function juiceVolumePerBag() {
    return juiceMassPerBag() / JUICE_DENSITY;
  }

  function glassesPerBag() {
    return juiceVolumePerBag() / juicePerCup();
  }

  function costPerCup(prices) {
    var lemonCost = (juicePerCup() / prices.lemons.yieldML) * prices.lemons.price;
    var waterCost = (totalWaterPerCup() / prices.water.volumeML) * prices.water.price;
    var sugarCost = (sugarMassPerCup() / prices.sugar.massG) * prices.sugar.price;
    var cupCost = prices.cups.price / prices.cups.count;
    return {
      lemonCost: lemonCost,
      waterCost: waterCost,
      sugarCost: sugarCost,
      cupCost: cupCost,
      total: lemonCost + waterCost + sugarCost + cupCost
    };
  }

  function bulkPurchase(numCups, prices) {
    var lemonBags = Math.ceil(numCups * juicePerCup() / prices.lemons.yieldML);
    var waterGals = Math.ceil(numCups * totalWaterPerCup() / prices.water.volumeML);
    var sugarBags = Math.ceil(numCups * sugarMassPerCup() / prices.sugar.massG);
    var cupPacks  = Math.ceil(numCups / prices.cups.count);
    var totalCost = lemonBags * prices.lemons.price +
                    waterGals * prices.water.price +
                    sugarBags * prices.sugar.price +
                    cupPacks  * prices.cups.price;
    return {
      lemonBags: lemonBags,
      waterGals: waterGals,
      sugarBags: sugarBags,
      cupPacks: cupPacks,
      totalCost: totalCost
    };
  }

  App.recipe = {
    GLASS_ML: GLASS_ML,
    TOTAL_PARTS: TOTAL_PARTS,
    PART_ML: PART_ML,
    juicePerCup: juicePerCup,
    syrupPerCup: syrupPerCup,
    waterInSyrupPerCup: waterInSyrupPerCup,
    sugarVolumePerCup: sugarVolumePerCup,
    sugarMassPerCup: sugarMassPerCup,
    dilutionWaterPerCup: dilutionWaterPerCup,
    totalWaterPerCup: totalWaterPerCup,
    bagMassG: bagMassG,
    juiceMassPerBag: juiceMassPerBag,
    juiceVolumePerBag: juiceVolumePerBag,
    glassesPerBag: glassesPerBag,
    costPerCup: costPerCup,
    bulkPurchase: bulkPurchase
  };
})();
