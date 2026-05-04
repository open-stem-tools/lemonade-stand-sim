var App = App || {};

(function () {
  var SESSION_INDEX_KEY = 'lemonade-sessions';
  var STATE_PREFIX = 'lemonade-state-';
  var TEACHER_CONFIG_KEY = 'lemonade-teacher-config';

  function generateId() {
    return 'sess-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  function getDefaultPrices() {
    var config = null;
    try { config = JSON.parse(localStorage.getItem(TEACHER_CONFIG_KEY)); } catch (e) {}
    if (config && config.prices) {
      return {
        lemons:  { price: config.prices.lemons  || 6.00, unit: '2lb bag',   yieldML: 290.65 },
        water:   { price: config.prices.water    || 1.50, unit: '1 gallon',  volumeML: 3785.41 },
        sugar:   { price: config.prices.sugar    || 3.79, unit: '4lb bag',   massG: 1814.37 },
        cups:    { price: config.prices.cups     || 7.00, unit: '50-pack',   count: 50 }
      };
    }
    return {
      lemons:  { price: 6.00, unit: '2lb bag',   yieldML: 290.65 },
      water:   { price: 1.50, unit: '1 gallon',  volumeML: 3785.41 },
      sugar:   { price: 3.79, unit: '4lb bag',   massG: 1814.37 },
      cups:    { price: 7.00, unit: '50-pack',   count: 50 }
    };
  }

  function getBaseCustomers() {
    var config = null;
    try { config = JSON.parse(localStorage.getItem(TEACHER_CONFIG_KEY)); } catch (e) {}
    if (config && config.baseCustomers) return config.baseCustomers;
    return 7;
  }

  function createNewState(sessionId) {
    return {
      sessionId: sessionId,
      startedAt: new Date().toISOString(),
      businessName: '',
      numEmployees: 0,
      employeeDailyCost: 5,
      prices: getDefaultPrices(),
      recipe: {
        juicePerCup: null,
        waterPerCup: null,
        sugarPerCup: null
      },
      lemonYield: {
        juicePerBag: null,
        glassesPerBag: null
      },
      costPerCup: {
        lemonCost: null,
        waterCost: null,
        sugarCost: null,
        cupCost: null,
        total: null
      },
      pricing: {
        pricePerCup: null,
        profitPerCup: null
      },
      investor: {
        loanAmount: null,
        cupsToRepay: null,
        profitShareNote: ''
      },
      productionPlan: {
        estimatedCustomersPerDay: null,
        day1Production: null
      },
      currentScreen: 'session-chooser',
      totalDays: null,
      currentDay: 0,
      weather: {
        actual: [],
        forecast: [],
        temperatures: []
      },
      days: [],
      totalRevenue: 0,
      totalCosts: 0,
      totalCupsSold: 0,
      totalCupsProduced: 0,
      totalWaste: 0,
      cumulativeProfit: 0,
      loan: {
        principal: 0,
        repaid: 0,
        remaining: 0
      },
      baseCustomers: getBaseCustomers()
    };
  }

  function getSessionIndex() {
    try {
      var raw = localStorage.getItem(SESSION_INDEX_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveSessionIndex(index) {
    localStorage.setItem(SESSION_INDEX_KEY, JSON.stringify(index));
  }

  function saveState(state) {
    localStorage.setItem(STATE_PREFIX + state.sessionId, JSON.stringify(state));
    var index = getSessionIndex();
    index[state.sessionId] = {
      name: state.businessName || 'Unnamed Business',
      lastModified: new Date().toISOString(),
      currentScreen: state.currentScreen
    };
    saveSessionIndex(index);
  }

  function loadState(sessionId) {
    try {
      var raw = localStorage.getItem(STATE_PREFIX + sessionId);
      if (raw) {
        var state = JSON.parse(raw);
        if (!state.baseCustomers) state.baseCustomers = getBaseCustomers();
        return state;
      }
    } catch (e) {}
    return null;
  }

  function deleteSession(sessionId) {
    localStorage.removeItem(STATE_PREFIX + sessionId);
    var index = getSessionIndex();
    delete index[sessionId];
    saveSessionIndex(index);
  }

  var currentState = null;

  App.state = {
    createNew: function () {
      var id = generateId();
      currentState = createNewState(id);
      return currentState;
    },
    load: function (sessionId) {
      currentState = loadState(sessionId);
      return currentState;
    },
    get: function () {
      return currentState;
    },
    set: function (updates) {
      if (!currentState) return;
      for (var key in updates) {
        if (updates.hasOwnProperty(key)) {
          if (typeof updates[key] === 'object' && updates[key] !== null && !Array.isArray(updates[key]) &&
              typeof currentState[key] === 'object' && currentState[key] !== null && !Array.isArray(currentState[key])) {
            for (var subKey in updates[key]) {
              if (updates[key].hasOwnProperty(subKey)) {
                currentState[key][subKey] = updates[key][subKey];
              }
            }
          } else {
            currentState[key] = updates[key];
          }
        }
      }
      saveState(currentState);
      return currentState;
    },
    save: function () {
      if (currentState) saveState(currentState);
    },
    getSessions: function () {
      return getSessionIndex();
    },
    deleteSession: deleteSession,
    reset: function () {
      currentState = null;
    },
    getBaseCustomers: getBaseCustomers,
    getDefaultPrices: getDefaultPrices
  };
})();
