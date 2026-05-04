var App = App || {};

(function () {

  var SCREEN_ORDER = [
    'session-chooser',
    'business-name',
    'employees',
    'grocery-store',
    'recipe-math',
    'lemon-yield',
    'cost-per-cup',
    'pricing',
    'production-plan',
    'day-count',
    'morning-brief',
    'day-animation',
    'day-results',
    'final-summary'
  ];

  var PHASE_MAP = {
    'session-chooser': null,
    'business-name': 'setup',
    'employees': 'setup',
    'grocery-store': 'setup',
    'recipe-math': 'planning',
    'lemon-yield': 'planning',
    'cost-per-cup': 'planning',
    'pricing': 'planning',
    'production-plan': 'planning',
    'day-count': 'simulation',
    'morning-brief': 'simulation',
    'day-animation': 'simulation',
    'day-results': 'simulation',
    'final-summary': 'simulation'
  };

  var SETUP_SCREENS = ['business-name', 'employees', 'grocery-store'];
  var PLANNING_SCREENS = ['recipe-math', 'lemon-yield', 'cost-per-cup', 'pricing', 'production-plan'];
  var SIM_SCREENS = ['day-count', 'morning-brief', 'day-animation', 'day-results', 'final-summary'];

  function updateProgress(screenId) {
    var progressBar = document.getElementById('progress-bar');
    if (screenId === 'session-chooser') {
      progressBar.classList.add('hidden');
      return;
    }
    progressBar.classList.remove('hidden');

    var setupFill = document.getElementById('progress-setup');
    var planningFill = document.getElementById('progress-planning');
    var simFill = document.getElementById('progress-simulation');

    var setupIdx = SETUP_SCREENS.indexOf(screenId);
    var planIdx = PLANNING_SCREENS.indexOf(screenId);
    var simIdx = SIM_SCREENS.indexOf(screenId);

    if (setupIdx >= 0) {
      setupFill.style.width = ((setupIdx + 1) / SETUP_SCREENS.length * 100) + '%';
      planningFill.style.width = '0%';
      simFill.style.width = '0%';
    } else if (planIdx >= 0) {
      setupFill.style.width = '100%';
      planningFill.style.width = ((planIdx + 1) / PLANNING_SCREENS.length * 100) + '%';
      simFill.style.width = '0%';
    } else if (simIdx >= 0) {
      setupFill.style.width = '100%';
      planningFill.style.width = '100%';
      simFill.style.width = ((simIdx + 1) / SIM_SCREENS.length * 100) + '%';
    }
  }

  function navigate(screenId) {
    if (!App.screens[screenId]) {
      console.warn('Unknown screen: ' + screenId);
      screenId = 'session-chooser';
    }

    var state = App.state.get();
    if (state && screenId !== 'session-chooser') {
      App.state.set({ currentScreen: screenId });
    }

    updateProgress(screenId);
    App.screens[screenId]();

    window.scrollTo(0, 0);
  }

  function init() {
    navigate('session-chooser');
  }

  App.router = {
    navigate: navigate,
    init: init
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
