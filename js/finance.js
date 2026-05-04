var App = App || {};

(function () {

  function breakEvenCups(loanAmount, profitPerCup) {
    if (profitPerCup <= 0) return Infinity;
    return Math.ceil(loanAmount / profitPerCup);
  }

  function calculateDailyPnL(dayData, state) {
    var revenue = dayData.cupsSold * dayData.priceCharged;
    var ingredientCost = dayData.cupsProduced * state.costPerCup.total;
    var employeeCost = state.numEmployees * state.employeeDailyCost;
    var totalCost = ingredientCost + employeeCost;
    var grossProfit = revenue - totalCost;

    var loanRepayment = 0;
    if (grossProfit > 0 && state.loan.remaining > 0) {
      loanRepayment = Math.min(grossProfit, state.loan.remaining);
    }

    var netProfit = grossProfit - loanRepayment;

    return {
      revenue: revenue,
      ingredientCost: ingredientCost,
      employeeCost: employeeCost,
      totalCost: totalCost,
      grossProfit: grossProfit,
      loanRepayment: loanRepayment,
      netProfit: netProfit,
      cupsSold: dayData.cupsSold,
      cupsProduced: dayData.cupsProduced,
      wastedCups: dayData.wastedCups,
      lostSales: dayData.lostSales,
      priceCharged: dayData.priceCharged,
      weather: dayData.weather
    };
  }

  function applyDayResults(result, state) {
    state.loan.remaining -= result.loanRepayment;
    state.loan.repaid += result.loanRepayment;
    state.totalRevenue += result.revenue;
    state.totalCosts += result.totalCost;
    state.totalCupsSold += result.cupsSold;
    state.totalCupsProduced += result.cupsProduced;
    state.totalWaste += result.wastedCups;
    state.cumulativeProfit += result.netProfit;
    state.days.push(result);
  }

  function bulkCost(cupsProduced, costPerCup) {
    return cupsProduced * costPerCup;
  }

  App.finance = {
    breakEvenCups: breakEvenCups,
    calculateDailyPnL: calculateDailyPnL,
    applyDayResults: applyDayResults,
    bulkCost: bulkCost
  };
})();
