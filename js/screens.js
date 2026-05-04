var App = App || {};

(function () {
  var ui = null;

  function getUI() {
    if (!ui) ui = App.ui;
    return ui;
  }

  function checkAnswer(studentVal, correctVal, tolerance) {
    tolerance = tolerance || 0.05;
    if (studentVal == null || isNaN(studentVal)) return 'empty';
    var diff = Math.abs(studentVal - correctVal) / Math.abs(correctVal || 1);
    if (diff <= tolerance) return 'correct';
    if (diff <= 0.15) return 'close';
    return 'incorrect';
  }

  function showFeedback(container, result) {
    var old = container.querySelector('.feedback');
    if (old) old.remove();

    var fb;
    if (result === 'correct') {
      fb = getUI().feedback('correct', 'That\'s right!');
    } else if (result === 'close') {
      fb = getUI().feedback('close', 'You\'re very close. Want to try again?');
    } else {
      fb = getUI().feedback('incorrect', 'That doesn\'t seem quite right. Want to try again?');
    }
    container.appendChild(fb);
    return result;
  }

  /* ===== SCREEN 1.1: SESSION CHOOSER ===== */
  function renderSessionChooser() {
    var el = getUI().el;
    var content = getUI().clearContent();
    var screen = el('div', { className: 'screen' });

    screen.appendChild(el('h1', null, 'Lemonade Stand Simulator'));
    screen.appendChild(el('p', { className: 'subtitle' }, 'Choose a saved business or start fresh.'));

    var sessions = App.state.getSessions();
    var list = el('div', { className: 'session-list' });
    var ids = Object.keys(sessions);

    if (ids.length > 0) {
      ids.sort(function (a, b) {
        return new Date(sessions[b].lastModified) - new Date(sessions[a].lastModified);
      });

      ids.forEach(function (id) {
        var s = sessions[id];
        var item = el('div', { className: 'session-item' });
        item.appendChild(el('span', { className: 'session-item-name' }, s.name || 'Unnamed Business'));
        item.appendChild(el('span', { className: 'session-item-screen' }, s.currentScreen || ''));

        var deleteBtn = el('button', {
          className: 'session-delete',
          title: 'Delete session',
          onClick: function (e) {
            e.stopPropagation();
            if (confirm('Delete "' + s.name + '"? This cannot be undone.')) {
              App.state.deleteSession(id);
              renderSessionChooser();
            }
          }
        }, '✕');
        item.appendChild(deleteBtn);

        item.addEventListener('click', function () {
          App.state.load(id);
          var state = App.state.get();
          App.router.navigate(state.currentScreen || 'business-name');
        });

        list.appendChild(item);
      });
    } else {
      list.appendChild(el('p', { className: 'text-center', style: 'color:#999;padding:32px;' }, 'No saved businesses yet.'));
    }

    screen.appendChild(list);

    screen.appendChild(getUI().button('Start New Business', 'btn-primary btn-large btn-block mt-24', function () {
      App.state.createNew();
      App.router.navigate('business-name');
    }));

    content.appendChild(screen);
  }

  /* ===== SCREEN 1.2: BUSINESS NAME ===== */
  function renderBusinessName() {
    var el = getUI().el;
    var content = getUI().clearContent();
    var screen = el('div', { className: 'screen' });
    var state = App.state.get();

    screen.appendChild(el('h1', null, 'Name Your Lemonade Stand'));
    screen.appendChild(el('p', { className: 'subtitle' }, 'What will you call your business?'));

    var stand = getUI().standPreview(state.businessName || 'Your Stand');
    screen.appendChild(stand);

    var input = getUI().textInput('business-name-input', { placeholder: 'Enter your business name...', maxlength: 30 });
    if (state.businessName) input.value = state.businessName;
    input.addEventListener('input', function () {
      var name = input.value.trim();
      var sign = document.getElementById('stand-sign-text');
      if (sign) sign.textContent = name || 'Your Stand';
    });

    screen.appendChild(el('div', { className: 'form-group mt-24' }, [
      el('label', { for: 'business-name-input' }, 'Business Name'),
      input
    ]));

    screen.appendChild(getUI().button('Next', 'btn-primary btn-large btn-block mt-24', function () {
      var name = input.value.trim();
      if (!name) { input.classList.add('invalid'); return; }
      App.state.set({ businessName: name, currentScreen: 'employees' });
      App.router.navigate('employees');
    }));

    content.appendChild(screen);
    input.focus();
  }

  /* ===== SCREEN 1.3: EMPLOYEES ===== */
  function renderEmployees() {
    var el = getUI().el;
    var content = getUI().clearContent();
    var screen = el('div', { className: 'screen' });
    var state = App.state.get();

    screen.appendChild(el('h1', null, 'Hire Your Team'));
    screen.appendChild(el('p', { className: 'subtitle' }, 'How many helpers will you hire, and how much will you pay them?'));

    var iconsContainer = el('div', { id: 'emp-icons' });
    iconsContainer.appendChild(getUI().employeeIcons(state.numEmployees));
    screen.appendChild(iconsContainer);

    var costDisplay = el('div', { className: 'text-center mono mt-8', id: 'emp-cost' },
      'Daily labor cost: ' + getUI().formatMoney(state.numEmployees * state.employeeDailyCost));
    screen.appendChild(costDisplay);

    var wageInput = getUI().numberInput('emp-wage', { min: 0.01, max: 200, step: 0.01, value: state.employeeDailyCost, mono: true });

    function updateEmpCost() {
      var n = parseInt(document.getElementById('emp-count').value) || 0;
      var w = parseFloat(wageInput.value) || 0;
      var ic = document.getElementById('emp-icons');
      ic.innerHTML = '';
      ic.appendChild(getUI().employeeIcons(n));
      document.getElementById('emp-cost').textContent = 'Daily labor cost: ' + getUI().formatMoney(n * w);
    }
    wageInput.addEventListener('input', updateEmpCost);

    var empSlider = getUI().slider('emp-count', {
      min: 0, max: 5, step: 1, value: state.numEmployees,
      onChange: updateEmpCost
    });
    screen.appendChild(el('div', { className: 'form-group mt-24 text-center' }, [
      el('label', null, 'Number of employees'),
      empSlider
    ]));

    screen.appendChild(el('div', { className: 'form-group mt-16 text-center' }, [
      el('label', { for: 'emp-wage' }, 'Pay per employee per day ($)'),
      wageInput
    ]));

    screen.appendChild(getUI().button('Next', 'btn-primary btn-large btn-block mt-24', function () {
      var n = parseInt(document.getElementById('emp-count').value) || 0;
      var w = parseFloat(wageInput.value) || 0;
      w = Math.max(0.01, w);
      App.state.set({ numEmployees: n, employeeDailyCost: w, currentScreen: 'grocery-store' });
      App.router.navigate('grocery-store');
    }));

    content.appendChild(screen);
  }

  /* ===== SCREEN 1.4: GROCERY STORE ===== */
  function renderGroceryStore() {
    var el = getUI().el;
    var content = getUI().clearContent();
    var screen = el('div', { className: 'screen' });
    var state = App.state.get();
    var p = state.prices;

    screen.appendChild(el('h1', null, 'The Grocery Store'));
    screen.appendChild(el('p', { className: 'subtitle' }, 'Here are the supplies you can buy. Remember these prices!'));

    var shelf = el('div', { className: 'store-shelf' });
    shelf.appendChild(getUI().storeItem('🍋', 'Seedless Lemons', p.lemons.unit, p.lemons.price));
    shelf.appendChild(getUI().storeItem('💧', 'Drinking Water', p.water.unit, p.water.price));
    shelf.appendChild(getUI().storeItem('🍚', 'Granulated Sugar', p.sugar.unit, p.sugar.price));
    shelf.appendChild(getUI().storeItem('🥤', 'Plastic Cups', p.cups.unit, p.cups.price));
    screen.appendChild(shelf);

    screen.appendChild(getUI().button('Got it! Let\'s do some math', 'btn-primary btn-large btn-block mt-24', function () {
      App.state.set({ currentScreen: 'recipe-math' });
      App.router.navigate('recipe-math');
    }));

    content.appendChild(screen);
  }

  /* ===== SCREEN 2.1: RECIPE MATH ===== */
  function renderRecipeMath() {
    var el = getUI().el;
    var content = getUI().clearContent();
    var screen = el('div', { className: 'screen' });

    screen.appendChild(el('h1', null, 'Recipe Math'));
    screen.appendChild(getUI().infoBlock(
      '<strong>Simple syrup</strong> = equal parts sugar and water by weight (e.g. 50 g sugar + 50 mL water = 100 mL syrup)<br>' +
      '<strong>Lemonade</strong> = 1 part simple syrup + 1 part lemon juice + 5 parts water<br>' +
      '<strong>One glass</strong> = 300 mL'
    ));

    var ratioBar = el('div', { className: 'ratio-bar' });
    ratioBar.appendChild(el('div', { className: 'ratio-bar-segment ratio-syrup', style: 'flex:1' }, 'Syrup (1)'));
    ratioBar.appendChild(el('div', { className: 'ratio-bar-segment ratio-juice', style: 'flex:1' }, 'Juice (1)'));
    ratioBar.appendChild(el('div', { className: 'ratio-bar-segment ratio-water', style: 'flex:5' }, 'Water (5)'));
    screen.appendChild(ratioBar);

    var correctJuice = App.recipe.juicePerCup();
    var correctWater = App.recipe.totalWaterPerCup();
    var correctSugar = App.recipe.sugarMassPerCup();

    var juiceInput = getUI().numberInput('q-juice', { mono: true, step: 0.01, min: 0 });
    var waterInput = getUI().numberInput('q-water', { mono: true, step: 0.01, min: 0 });
    var sugarInput = getUI().numberInput('q-sugar', { mono: true, step: 0.1, min: 0 });

    screen.appendChild(getUI().questionGroup('How many mL of lemon juice go into one glass?', juiceInput, 'mL'));
    screen.appendChild(getUI().questionGroup('How many mL of water total go into one glass?', waterInput, 'mL'));
    screen.appendChild(getUI().questionGroup('How many grams of sugar go into one glass?', sugarInput, 'g'));

    var feedbackArea = el('div', { id: 'recipe-feedback' });
    screen.appendChild(feedbackArea);

    var nextBtn = getUI().button('Next', 'btn-success btn-large btn-block mt-16', function () {
      App.state.set({
        recipe: {
          juicePerCup: parseFloat(juiceInput.value),
          waterPerCup: parseFloat(waterInput.value),
          sugarPerCup: parseFloat(sugarInput.value)
        },
        currentScreen: 'lemon-yield'
      });
      App.router.navigate('lemon-yield');
    });
    nextBtn.style.display = 'none';
    nextBtn.id = 'recipe-next';

    screen.appendChild(getUI().button('Check My Answers', 'btn-primary btn-large btn-block mt-16', function () {
      feedbackArea.innerHTML = '';
      var r1 = checkAnswer(parseFloat(juiceInput.value), correctJuice);
      var r2 = checkAnswer(parseFloat(waterInput.value), correctWater);
      var r3 = checkAnswer(parseFloat(sugarInput.value), correctSugar);

      juiceInput.className = 'input input-mono ' + (r1 === 'correct' ? 'valid' : r1 === 'close' ? 'close-answer' : 'invalid');
      waterInput.className = 'input input-mono ' + (r2 === 'correct' ? 'valid' : r2 === 'close' ? 'close-answer' : 'invalid');
      sugarInput.className = 'input input-mono ' + (r3 === 'correct' ? 'valid' : r3 === 'close' ? 'close-answer' : 'invalid');

      if (r1 === 'correct' && r2 === 'correct' && r3 === 'correct') {
        showFeedback(feedbackArea, 'correct');
        nextBtn.style.display = '';
      } else if (r1 === 'close' || r2 === 'close' || r3 === 'close') {
        showFeedback(feedbackArea, 'close');
      } else {
        showFeedback(feedbackArea, 'incorrect');
      }
    }));

    screen.appendChild(nextBtn);
    content.appendChild(screen);
  }

  /* ===== SCREEN 2.2: LEMON YIELD ===== */
  function renderLemonYield() {
    var el = getUI().el;
    var content = getUI().clearContent();
    var screen = el('div', { className: 'screen' });
    var state = App.state.get();

    var juicePerGlass = state.recipe.juicePerCup != null
      ? getUI().formatNum(state.recipe.juicePerCup, 2)
      : getUI().formatNum(App.recipe.juicePerCup(), 2);

    screen.appendChild(el('h1', null, 'Lemon Yield'));
    screen.appendChild(getUI().infoBlock(
      'A <strong>2 lb bag</strong> of lemons weighs about <strong>907 grams</strong>.<br>' +
      'About <strong>33%</strong> of a lemon\'s mass is usable juice.<br>' +
      'Lemon juice density is close to water (about <strong>1.03 g/mL</strong>).<br>' +
      'Your recipe uses <strong>' + juicePerGlass + ' mL</strong> of lemon juice per glass.'
    ));

    screen.appendChild(el('div', { className: 'lemon-visual' }));

    var correctJuice = App.recipe.juiceVolumePerBag();
    var correctGlasses = App.recipe.glassesPerBag();

    var juiceInput = getUI().numberInput('q-bag-juice', { mono: true, step: 0.01, min: 0 });
    var glassesInput = getUI().numberInput('q-bag-glasses', { mono: true, step: 0.01, min: 0 });

    screen.appendChild(getUI().questionGroup('How many mL of juice can you get from one bag?', juiceInput, 'mL'));
    screen.appendChild(getUI().questionGroup('How many glasses of lemonade can one bag make?', glassesInput, 'glasses'));

    var feedbackArea = el('div', { id: 'yield-feedback' });
    screen.appendChild(feedbackArea);

    var nextBtn = getUI().button('Next', 'btn-success btn-large btn-block mt-16', function () {
      App.state.set({
        lemonYield: {
          juicePerBag: parseFloat(juiceInput.value),
          glassesPerBag: parseFloat(glassesInput.value)
        },
        currentScreen: 'cost-per-cup'
      });
      App.router.navigate('cost-per-cup');
    });
    nextBtn.style.display = 'none';
    nextBtn.id = 'yield-next';

    screen.appendChild(getUI().button('Check My Answers', 'btn-primary btn-large btn-block mt-16', function () {
      feedbackArea.innerHTML = '';
      var r1 = checkAnswer(parseFloat(juiceInput.value), correctJuice);
      var r2 = checkAnswer(parseFloat(glassesInput.value), correctGlasses);

      juiceInput.className = 'input input-mono ' + (r1 === 'correct' ? 'valid' : r1 === 'close' ? 'close-answer' : 'invalid');
      glassesInput.className = 'input input-mono ' + (r2 === 'correct' ? 'valid' : r2 === 'close' ? 'close-answer' : 'invalid');

      if (r1 === 'correct' && r2 === 'correct') {
        showFeedback(feedbackArea, 'correct');
        nextBtn.style.display = '';
      } else if (r1 === 'close' || r2 === 'close') {
        showFeedback(feedbackArea, 'close');
      } else {
        showFeedback(feedbackArea, 'incorrect');
      }
    }));

    screen.appendChild(nextBtn);
    content.appendChild(screen);
  }

  /* ===== SCREEN 2.3: COST PER CUP ===== */
  function renderCostPerCup() {
    var el = getUI().el;
    var content = getUI().clearContent();
    var screen = el('div', { className: 'screen' });
    var state = App.state.get();
    var prices = state.prices;

    var costs = App.recipe.costPerCup(prices);

    var juiceML = state.recipe.juicePerCup != null ? state.recipe.juicePerCup : App.recipe.juicePerCup();
    var waterML = state.recipe.waterPerCup != null ? state.recipe.waterPerCup : App.recipe.totalWaterPerCup();
    var sugarG = state.recipe.sugarPerCup != null ? state.recipe.sugarPerCup : App.recipe.sugarMassPerCup();

    screen.appendChild(el('h1', null, 'Cost Per Cup'));
    screen.appendChild(el('p', { className: 'subtitle' }, 'Using the store prices and your recipe, figure out what each glass costs to make.'));

    screen.appendChild(getUI().infoBlock(
      '<strong>Your recipe per glass:</strong><br>' +
      'Lemon juice: ' + getUI().formatNum(juiceML, 2) + ' mL &nbsp;|&nbsp; ' +
      'Water: ' + getUI().formatNum(waterML, 2) + ' mL &nbsp;|&nbsp; ' +
      'Sugar: ' + getUI().formatNum(sugarG, 2) + ' g<br><br>' +
      '<strong>Store prices:</strong><br>' +
      'Lemons: ' + getUI().formatMoney(prices.lemons.price) + ' / ' + prices.lemons.unit +
      ' (' + getUI().formatNum(App.recipe.juiceVolumePerBag(), 1) + ' mL juice) &nbsp;|&nbsp; ' +
      'Water: ' + getUI().formatMoney(prices.water.price) + ' / ' + prices.water.unit +
      ' (3,785 mL)<br>' +
      'Sugar: ' + getUI().formatMoney(prices.sugar.price) + ' / ' + prices.sugar.unit +
      ' (1,814 g) &nbsp;|&nbsp; ' +
      'Cups: ' + getUI().formatMoney(prices.cups.price) + ' / ' + prices.cups.unit
    ));

    var lemonInput = getUI().numberInput('q-lemon-cost', { mono: true, step: 0.001, min: 0 });
    var waterCostInput = getUI().numberInput('q-water-cost', { mono: true, step: 0.001, min: 0 });
    var sugarCostInput = getUI().numberInput('q-sugar-cost', { mono: true, step: 0.001, min: 0 });
    var cupCostInput = getUI().numberInput('q-cup-cost', { mono: true, step: 0.001, min: 0 });
    var totalCostInput = getUI().numberInput('q-total-cost', { mono: true, step: 0.01, min: 0 });

    screen.appendChild(getUI().questionGroup('1. What does the lemon juice for one glass cost?', lemonInput, '$'));
    screen.appendChild(getUI().questionGroup('2. What does the water for one glass cost?', waterCostInput, '$'));
    screen.appendChild(getUI().questionGroup('3. What does the sugar for one glass cost?', sugarCostInput, '$'));
    screen.appendChild(getUI().questionGroup('4. What does one cup cost?', cupCostInput, '$'));
    screen.appendChild(getUI().questionGroup('5. What is the total cost to make one glass?', totalCostInput, '$'));

    var feedbackArea = el('div', { id: 'cost-feedback' });
    screen.appendChild(feedbackArea);

    var bulkSection = el('div', { id: 'bulk-section', style: 'display:none' });
    bulkSection.appendChild(el('h3', { className: 'mt-24' }, 'Bulk Purchase Calculator'));
    bulkSection.appendChild(el('p', null, 'How many of each item should you buy? (Can\'t buy partial packages — round up!)'));

    var bulkTable = el('table', { className: 'data-table' });
    var thead = el('thead');
    var headerRow = el('tr');
    ['Cups', 'Lemon Bags', 'Water Gal', 'Sugar Bags', 'Cup Packs'].forEach(function (h) {
      headerRow.appendChild(el('th', null, h));
    });
    thead.appendChild(headerRow);
    bulkTable.appendChild(thead);

    var tbody = el('tbody');
    var bulkAmounts = [5, 10, 50, 100];
    bulkAmounts.forEach(function (n) {
      var row = el('tr');
      row.appendChild(el('td', null, String(n)));
      row.appendChild(el('td', null, getUI().numberInput('bulk-lemon-' + n, { min: 0, step: 1 })));
      row.appendChild(el('td', null, getUI().numberInput('bulk-water-' + n, { min: 0, step: 1 })));
      row.appendChild(el('td', null, getUI().numberInput('bulk-sugar-' + n, { min: 0, step: 1 })));
      row.appendChild(el('td', null, getUI().numberInput('bulk-cups-' + n, { min: 0, step: 1 })));
      tbody.appendChild(row);
    });
    bulkTable.appendChild(tbody);
    bulkSection.appendChild(bulkTable);

    var bulkFeedback = el('div', { id: 'bulk-feedback' });
    bulkSection.appendChild(bulkFeedback);

    var nextBtn = getUI().button('Next', 'btn-success btn-large btn-block mt-16', function () {
      App.state.set({
        costPerCup: {
          lemonCost: parseFloat(lemonInput.value),
          waterCost: parseFloat(waterCostInput.value),
          sugarCost: parseFloat(sugarCostInput.value),
          cupCost: parseFloat(cupCostInput.value),
          total: costs.total
        },
        currentScreen: 'pricing'
      });
      App.router.navigate('pricing');
    });
    nextBtn.style.display = 'none';
    nextBtn.id = 'cost-next';

    bulkSection.appendChild(getUI().button('Check Bulk Answers', 'btn-primary btn-block mt-16', function () {
      bulkFeedback.innerHTML = '';
      var allCorrect = true;
      bulkAmounts.forEach(function (n) {
        var correct = App.recipe.bulkPurchase(n, prices);
        var fields = [
          { id: 'bulk-lemon-' + n, val: correct.lemonBags },
          { id: 'bulk-water-' + n, val: correct.waterGals },
          { id: 'bulk-sugar-' + n, val: correct.sugarBags },
          { id: 'bulk-cups-' + n, val: correct.cupPacks }
        ];
        fields.forEach(function (f) {
          var inp = document.getElementById(f.id);
          var sv = parseInt(inp.value);
          if (sv === f.val) {
            inp.className = 'input input-mono valid';
          } else {
            inp.className = 'input input-mono invalid';
            allCorrect = false;
          }
        });
      });
      if (allCorrect) {
        showFeedback(bulkFeedback, 'correct');
        nextBtn.style.display = '';
      } else {
        showFeedback(bulkFeedback, 'incorrect');
      }
    }));

    bulkSection.appendChild(nextBtn);

    screen.appendChild(getUI().button('Check My Answers', 'btn-primary btn-large btn-block mt-16', function () {
      feedbackArea.innerHTML = '';
      var r1 = checkAnswer(parseFloat(lemonInput.value), costs.lemonCost);
      var r2 = checkAnswer(parseFloat(waterCostInput.value), costs.waterCost);
      var r3 = checkAnswer(parseFloat(sugarCostInput.value), costs.sugarCost);
      var r4 = checkAnswer(parseFloat(cupCostInput.value), costs.cupCost);
      var r5 = checkAnswer(parseFloat(totalCostInput.value), costs.total);

      lemonInput.className = 'input input-mono ' + (r1 === 'correct' ? 'valid' : r1 === 'close' ? 'close-answer' : 'invalid');
      waterCostInput.className = 'input input-mono ' + (r2 === 'correct' ? 'valid' : r2 === 'close' ? 'close-answer' : 'invalid');
      sugarCostInput.className = 'input input-mono ' + (r3 === 'correct' ? 'valid' : r3 === 'close' ? 'close-answer' : 'invalid');
      cupCostInput.className = 'input input-mono ' + (r4 === 'correct' ? 'valid' : r4 === 'close' ? 'close-answer' : 'invalid');
      totalCostInput.className = 'input input-mono ' + (r5 === 'correct' ? 'valid' : r5 === 'close' ? 'close-answer' : 'invalid');

      if (r1 === 'correct' && r2 === 'correct' && r3 === 'correct' && r4 === 'correct' && r5 === 'correct') {
        showFeedback(feedbackArea, 'correct');
        bulkSection.style.display = '';
      } else if (r1 === 'close' || r2 === 'close' || r3 === 'close' || r4 === 'close' || r5 === 'close') {
        showFeedback(feedbackArea, 'close');
      } else {
        showFeedback(feedbackArea, 'incorrect');
      }
    }));

    screen.appendChild(bulkSection);
    content.appendChild(screen);
  }

  /* ===== SCREEN 2.4: PRICING ===== */
  function renderPricing() {
    var el = getUI().el;
    var content = getUI().clearContent();
    var screen = el('div', { className: 'screen' });
    var state = App.state.get();
    var costTotal = state.costPerCup.total || App.recipe.costPerCup(state.prices).total;

    screen.appendChild(el('h1', null, 'Set Your Price'));

    var initialPrice = state.pricing.pricePerCup || 2.00;
    var profitVal = initialPrice - costTotal;

    var pricingDisplay = el('div', { className: 'pricing-display' });
    var priceTag = el('div', { className: 'price-tag', id: 'price-tag' }, getUI().formatMoney(initialPrice));
    var profitDisplay = el('div', {
      className: 'profit-per-cup ' + (profitVal >= 0 ? 'profit-positive' : 'profit-negative'),
      id: 'profit-display'
    }, 'Profit per cup: ' + getUI().formatMoney(profitVal));
    pricingDisplay.appendChild(priceTag);
    pricingDisplay.appendChild(profitDisplay);
    screen.appendChild(pricingDisplay);

    var sliderContainer = getUI().slider('price-slider', {
      min: 0.50, max: 5.00, step: 0.25, value: initialPrice, format: 'money',
      onChange: function (val) {
        var p = profitVal = val - costTotal;
        document.getElementById('price-tag').textContent = getUI().formatMoney(val);
        var pd = document.getElementById('profit-display');
        pd.textContent = 'Profit per cup: ' + getUI().formatMoney(p);
        pd.className = 'profit-per-cup ' + (p >= 0 ? 'profit-positive' : 'profit-negative');
      }
    });
    screen.appendChild(sliderContainer);

    screen.appendChild(el('h2', { className: 'mt-32' }, 'Investment'));
    screen.appendChild(el('p', null, 'How much money do you need to start your business? This is what you borrow from your investor.'));

    screen.appendChild(el('h3', { className: 'mt-24' }, 'Choose your loan terms:'));
    var loanOptions = [
      { id: 'loan-friendly', rate: 0, label: 'Friendly Favor', desc: 'No interest — pay back exactly what you borrowed.' },
      { id: 'loan-fair', rate: 0.10, label: 'Fair Deal (10%)', desc: 'Pay back 10% extra as a thank-you for the risk your investor took.' },
      { id: 'loan-business', rate: 0.25, label: 'Business Loan (25%)', desc: 'Pay back 25% extra — this is closer to what a bank would charge.' }
    ];
    var loanTermsContainer = el('div', { className: 'loan-options' });
    var selectedRate = state.investor.interestRate != null ? state.investor.interestRate : 0.10;
    loanOptions.forEach(function (opt) {
      var optEl = el('label', { className: 'loan-option' + (opt.rate === selectedRate ? ' selected' : ''), for: opt.id });
      var radio = el('input', { type: 'radio', name: 'loan-term', id: opt.id, value: String(opt.rate) });
      if (opt.rate === selectedRate) radio.checked = true;
      radio.addEventListener('change', function () {
        var allOpts = loanTermsContainer.querySelectorAll('.loan-option');
        for (var i = 0; i < allOpts.length; i++) allOpts[i].className = 'loan-option';
        optEl.className = 'loan-option selected';
        updateTotalOwed();
      });
      optEl.appendChild(radio);
      optEl.appendChild(el('div', { className: 'loan-option-text' }, [
        el('strong', null, opt.label),
        el('div', { className: 'loan-option-desc' }, opt.desc)
      ]));
      loanTermsContainer.appendChild(optEl);
    });
    screen.appendChild(loanTermsContainer);

    var loanInput = getUI().numberInput('loan-amount', { mono: true, step: 1, min: 0, value: state.investor.loanAmount || '' });
    loanInput.addEventListener('input', updateTotalOwed);
    screen.appendChild(el('div', { className: 'form-group mt-16' }, [
      el('label', { for: 'loan-amount' }, 'Loan Amount ($)'),
      loanInput
    ]));

    var totalOwedDisplay = el('div', { className: 'info-block mt-8', id: 'total-owed-display' });
    screen.appendChild(totalOwedDisplay);

    function updateTotalOwed() {
      var loan = parseFloat(loanInput.value) || 0;
      var selectedRadio = document.querySelector('input[name="loan-term"]:checked');
      var rate = selectedRadio ? parseFloat(selectedRadio.value) : 0.10;
      var interest = loan * rate;
      var total = loan + interest;
      var pct = Math.round(rate * 100);
      totalOwedDisplay.innerHTML = '';
      if (loan > 0) {
        totalOwedDisplay.innerHTML =
          '<strong>Total you owe:</strong> ' + getUI().formatMoney(loan) + ' + ' +
          pct + '% interest (' + getUI().formatMoney(interest) + ') = <strong>' +
          getUI().formatMoney(total) + '</strong>';
      }
    }
    updateTotalOwed();

    var beInput = getUI().numberInput('be-cups', { mono: true, step: 1, min: 0 });
    screen.appendChild(getUI().questionGroup('How many glasses do you need to sell to pay back your investor (including interest)?', beInput, 'glasses'));

    var beFeedback = el('div', { id: 'be-feedback' });
    screen.appendChild(beFeedback);

    var nextBtn = getUI().button('Next', 'btn-success btn-large btn-block mt-24', function () {
      var priceSlider = document.getElementById('price-slider');
      var price = parseFloat(priceSlider.value);
      var loan = parseFloat(loanInput.value) || 0;
      var selectedRadio = document.querySelector('input[name="loan-term"]:checked');
      var interestRate = selectedRadio ? parseFloat(selectedRadio.value) : 0.10;
      var totalOwed = loan * (1 + interestRate);
      App.state.set({
        pricing: { pricePerCup: price, profitPerCup: price - costTotal },
        investor: {
          loanAmount: loan,
          interestRate: interestRate,
          totalOwed: totalOwed,
          cupsToRepay: parseInt(beInput.value) || 0
        },
        loan: { principal: totalOwed, repaid: 0, remaining: totalOwed },
        currentScreen: 'production-plan'
      });
      App.router.navigate('production-plan');
    });
    nextBtn.style.display = 'none';
    nextBtn.id = 'pricing-next';

    screen.appendChild(getUI().button('Check Break-Even', 'btn-primary btn-block mt-16', function () {
      beFeedback.innerHTML = '';
      var priceSlider = document.getElementById('price-slider');
      var price = parseFloat(priceSlider.value);
      var loan = parseFloat(loanInput.value) || 0;
      var selectedRadio = document.querySelector('input[name="loan-term"]:checked');
      var interestRate = selectedRadio ? parseFloat(selectedRadio.value) : 0.10;
      var totalOwed = loan * (1 + interestRate);
      var profit = price - costTotal;

      if (loan === 0) {
        beFeedback.appendChild(getUI().feedback('correct', 'No loan means no break-even needed!'));
        nextBtn.style.display = '';
        return;
      }

      if (profit <= 0) {
        beFeedback.appendChild(getUI().feedback('incorrect', "You'd lose money on every glass at this price."));
        return;
      }

      var correctBE = App.finance.breakEvenCups(totalOwed, profit);
      var result = checkAnswer(parseFloat(beInput.value), correctBE);
      showFeedback(beFeedback, result);
      if (result === 'correct') nextBtn.style.display = '';
    }));

    screen.appendChild(nextBtn);
    content.appendChild(screen);
  }

  /* ===== SCREEN 2.5: PRODUCTION PLAN ===== */
  function renderProductionPlan() {
    var el = getUI().el;
    var content = getUI().clearContent();
    var screen = el('div', { className: 'screen' });
    var state = App.state.get();
    var costTotal = state.costPerCup.total || App.recipe.costPerCup(state.prices).total;
    var loan = state.loan.remaining || 0;

    screen.appendChild(el('h1', null, 'Production Planning'));
    screen.appendChild(el('p', { className: 'subtitle' }, 'Plan your first day of business.'));

    var custInput = getUI().numberInput('est-customers', { mono: true, step: 1, min: 0 });
    if (state.productionPlan.estimatedCustomersPerDay) custInput.value = state.productionPlan.estimatedCustomersPerDay;
    screen.appendChild(el('div', { className: 'form-group' }, [
      el('label', { for: 'est-customers' }, 'How many customers do you expect per day?'),
      custInput
    ]));

    var prodInput = getUI().numberInput('day1-production', { mono: true, step: 1, min: 0, max: 999 });
    if (state.productionPlan.day1Production) prodInput.value = state.productionPlan.day1Production;

    var costPreview = el('div', { id: 'prod-cost-preview', className: 'card mt-8' });

    function updateCostPreview() {
      var n = parseInt(prodInput.value) || 0;
      var ingredientCost = n * costTotal;
      var empCost = state.numEmployees * state.employeeDailyCost;
      var total = ingredientCost + empCost;
      costPreview.innerHTML = '';
      var rows = el('div');
      rows.appendChild(el('div', { className: 'cost-row' }, [
        el('span', { className: 'cost-label' }, 'Ingredients (' + n + ' cups)'),
        el('span', { className: 'cost-value' }, getUI().formatMoney(ingredientCost))
      ]));
      if (state.numEmployees > 0) {
        rows.appendChild(el('div', { className: 'cost-row' }, [
          el('span', { className: 'cost-label' }, 'Employees (' + state.numEmployees + ')'),
          el('span', { className: 'cost-value' }, getUI().formatMoney(empCost))
        ]));
      }
      rows.appendChild(el('div', { className: 'cost-row total' }, [
        el('span', { className: 'cost-label' }, 'Total Day 1 Cost'),
        el('span', { className: 'cost-value' }, getUI().formatMoney(total))
      ]));
      costPreview.appendChild(rows);

      var warnArea = costPreview.querySelector('.warning-box');
      if (warnArea) warnArea.remove();
      if (loan > 0 && total > loan) {
        costPreview.appendChild(getUI().warningBox(
          'This costs more than your loan (' + getUI().formatMoney(loan) + '). You can\'t afford this many cups!'
        ));
      }
    }

    prodInput.addEventListener('input', updateCostPreview);

    screen.appendChild(el('div', { className: 'form-group mt-16' }, [
      el('label', { for: 'day1-production' }, 'How many glasses will you make on Day 1?'),
      prodInput
    ]));

    screen.appendChild(costPreview);
    updateCostPreview();

    screen.appendChild(getUI().button('Start Simulation!', 'btn-success btn-large btn-block mt-24', function () {
      var estCust = parseInt(custInput.value) || 0;
      var day1 = parseInt(prodInput.value) || 0;
      App.state.set({
        productionPlan: {
          estimatedCustomersPerDay: estCust,
          day1Production: day1
        },
        currentScreen: 'day-count'
      });
      App.router.navigate('day-count');
    }));

    content.appendChild(screen);
  }

  /* ===== DAY COUNT SELECTOR ===== */
  function renderDayCount() {
    var el = getUI().el;
    var content = getUI().clearContent();
    var screen = el('div', { className: 'screen day-selector' });

    screen.appendChild(el('h1', null, 'How Many Days?'));
    screen.appendChild(el('p', { className: 'subtitle' }, 'Choose how long your simulation will run.'));

    var sliderContainer = getUI().slider('day-slider', {
      min: 3, max: 14, step: 1, value: 7, format: 'days'
    });
    screen.appendChild(sliderContainer);

    screen.appendChild(getUI().button('Let\'s Go!', 'btn-primary btn-large btn-block mt-32', function () {
      var days = parseInt(document.getElementById('day-slider').value);
      var weather = App.weather.generateWeather(days);
      var state = App.state.get();
      App.state.set({
        totalDays: days,
        currentDay: 0,
        weather: weather,
        days: [],
        totalRevenue: 0,
        totalCosts: 0,
        totalCupsSold: 0,
        totalCupsProduced: 0,
        totalWaste: 0,
        cumulativeProfit: 0,
        loan: { principal: state.loan.principal, repaid: 0, remaining: state.loan.principal },
        currentScreen: 'morning-brief'
      });
      App.router.navigate('morning-brief');
    }));

    content.appendChild(screen);
  }

  /* ===== SCREEN 3.1: MORNING BRIEF ===== */
  function renderMorningBrief() {
    var el = getUI().el;
    var content = getUI().clearContent();
    var screen = el('div', { className: 'screen' });
    var state = App.state.get();
    var dayNum = state.currentDay + 1;

    screen.appendChild(el('h1', null, 'Day ' + dayNum + ' of ' + state.totalDays));

    var forecastId = state.weather.forecast[state.currentDay];
    var forecastInfo = App.weather.getWeatherInfo(forecastId);
    var temp = state.weather.temperatures[state.currentDay];

    var weatherCard = el('div', { className: 'weather-display', style: 'background: linear-gradient(135deg, #E3F2FD, #FFFDE7)' });
    weatherCard.appendChild(el('div', { className: 'weather-icon' }, forecastInfo.icon));
    weatherCard.appendChild(el('div', { className: 'weather-desc' }, 'Forecast: ' + forecastInfo.label));
    weatherCard.appendChild(el('div', { className: 'weather-temp' }, temp + '°F'));
    screen.appendChild(weatherCard);

    if (state.days.length > 0) {
      var lastDay = state.days[state.days.length - 1];
      var summaryCard = getUI().card('Yesterday\'s Results', el('div', null, [
        el('div', { className: 'cost-row' }, [
          el('span', { className: 'cost-label' }, 'Cups Sold'),
          el('span', { className: 'cost-value' }, String(lastDay.cupsSold))
        ]),
        el('div', { className: 'cost-row' }, [
          el('span', { className: 'cost-label' }, 'Revenue'),
          el('span', { className: 'cost-value positive' }, getUI().formatMoney(lastDay.revenue))
        ]),
        el('div', { className: 'cost-row' }, [
          el('span', { className: 'cost-label' }, 'Profit/Loss'),
          el('span', { className: 'cost-value ' + (lastDay.netProfit >= 0 ? 'positive' : 'negative') },
            getUI().formatMoney(lastDay.netProfit))
        ]),
        el('div', { className: 'cost-row' }, [
          el('span', { className: 'cost-label' }, 'Loan Remaining'),
          el('span', { className: 'cost-value' },
            state.loan.remaining <= 0 ? 'Paid off!' : getUI().formatMoney(state.loan.remaining))
        ])
      ]));
      screen.appendChild(summaryCard);
    }

    screen.appendChild(el('h3', { className: 'mt-24' }, 'Today\'s Decisions'));

    var defaultCups = state.productionPlan.day1Production || 20;
    if (state.days.length > 0) {
      defaultCups = state.days[state.days.length - 1].cupsProduced;
    }

    var cupsInput = getUI().numberInput('today-cups', { mono: true, step: 1, min: 0, max: 999, value: defaultCups });
    screen.appendChild(el('div', { className: 'form-group' }, [
      el('label', { for: 'today-cups' }, 'How many glasses will you make today?'),
      cupsInput
    ]));

    var defaultPrice = state.pricing.pricePerCup || 2.00;
    if (state.days.length > 0) {
      defaultPrice = state.days[state.days.length - 1].priceCharged;
    }

    var costTotal = state.costPerCup.total || App.recipe.costPerCup(state.prices).total;
    var ingredientPreview = el('div', { className: 'card mt-8', id: 'morning-cost-preview' });

    var wageInput = null;
    if (state.numEmployees > 0) {
      wageInput = getUI().numberInput('today-wage', { mono: true, step: 1, min: 1, max: 200, value: state.employeeDailyCost });
      screen.appendChild(el('div', { className: 'form-group' }, [
        el('label', { for: 'today-wage' }, 'Pay per employee today ($' + '/day × ' + state.numEmployees + ' employees)'),
        wageInput
      ]));
      wageInput.addEventListener('input', updateMorningCost);
    }

    function updateMorningCost() {
      var n = parseInt(cupsInput.value) || 0;
      var ingCost = n * costTotal;
      ingredientPreview.innerHTML = '';
      ingredientPreview.appendChild(el('div', { className: 'cost-row' }, [
        el('span', { className: 'cost-label' }, 'Ingredients (' + n + ' cups)'),
        el('span', { className: 'cost-value' }, getUI().formatMoney(ingCost))
      ]));
      if (state.numEmployees > 0) {
        var w = wageInput ? (parseFloat(wageInput.value) || 0) : state.employeeDailyCost;
        var empCost = state.numEmployees * w;
        ingredientPreview.appendChild(el('div', { className: 'cost-row' }, [
          el('span', { className: 'cost-label' }, 'Employees (' + state.numEmployees + ' × ' + getUI().formatMoney(w) + ')'),
          el('span', { className: 'cost-value' }, getUI().formatMoney(empCost))
        ]));
        ingredientPreview.appendChild(el('div', { className: 'cost-row total' }, [
          el('span', { className: 'cost-label' }, 'Total daily cost'),
          el('span', { className: 'cost-value' }, getUI().formatMoney(ingCost + empCost))
        ]));
      }
    }
    cupsInput.addEventListener('input', updateMorningCost);

    var priceSlider = getUI().slider('today-price', {
      min: 0.50, max: 5.00, step: 0.25, value: defaultPrice, format: 'money'
    });

    screen.appendChild(el('div', { className: 'form-group mt-16' }, [
      el('label', null, 'What price will you charge today?'),
      priceSlider
    ]));

    screen.appendChild(ingredientPreview);
    updateMorningCost();

    screen.appendChild(getUI().button('Open for Business!', 'btn-success btn-large btn-block mt-24', function () {
      var cups = parseInt(cupsInput.value) || 0;
      var price = parseFloat(document.getElementById('today-price').value);

      if (wageInput) {
        var w = Math.max(0.01, parseFloat(wageInput.value) || state.employeeDailyCost);
        App.state.set({ employeeDailyCost: w });
      }

      if (!App._simMusic) App._simMusic = new Audio('audio/Dies_Irae-trimmed.mp3');
      App._simMusic.currentTime = 0;
      App._simMusic.play().catch(function () {});

      var actualWeather = state.weather.actual[state.currentDay];
      var dayResult = App.simulation.simulateDay(cups, price, actualWeather, state.baseCustomers || 40);

      App.state.set({ currentScreen: 'day-animation' });
      App.state.get()._pendingDay = dayResult;
      App.router.navigate('day-animation');
    }));

    content.appendChild(screen);
  }

  /* ===== SCREEN 3.2: DAY ANIMATION ===== */
  function renderDayAnimation() {
    var el = getUI().el;
    var content = getUI().clearContent();
    var screen = el('div', { className: 'screen' });
    var state = App.state.get();
    var dayResult = state._pendingDay;
    if (!dayResult) {
      App.router.navigate('morning-brief');
      return;
    }

    var actualWeather = state.weather.actual[state.currentDay];
    var weatherInfo = App.weather.getWeatherInfo(actualWeather);

    screen.appendChild(el('h2', { className: 'text-center mb-8' },
      'Day ' + (state.currentDay + 1) + ' — ' + weatherInfo.label + ' ' + weatherInfo.icon));

    var scene = el('div', { className: 'day-scene' });

    var sky = el('div', { className: 'day-sky ' + weatherInfo.skyClass });
    scene.appendChild(sky);

    if (actualWeather === 'sunny_hot' || actualWeather === 'sunny') {
      var sun = el('div', { className: 'sun-shape' });
      for (var r = 0; r < 8; r++) {
        var ray = el('div', { className: 'sun-ray' });
        ray.style.transform = 'translate(-50%, -50%) rotate(' + (r * 45) + 'deg) translateY(-30px)';
        sun.appendChild(ray);
      }
      sky.appendChild(sun);
    }

    if (actualWeather === 'partly_cloudy' || actualWeather === 'cloudy' || actualWeather === 'rainy' || actualWeather === 'stormy') {
      for (var c = 0; c < 3; c++) {
        var cloud = el('div', { className: 'cloud-shape' });
        cloud.style.width = (80 + Math.random() * 60) + 'px';
        cloud.style.height = (30 + Math.random() * 20) + 'px';
        cloud.style.top = (20 + Math.random() * 60) + 'px';
        cloud.style.animationDuration = (15 + Math.random() * 10) + 's';
        cloud.style.animationDelay = (-Math.random() * 20) + 's';
        sky.appendChild(cloud);
      }
    }

    if (actualWeather === 'rainy' || actualWeather === 'stormy') {
      for (var d = 0; d < 30; d++) {
        var drop = el('div', { className: 'rain-drop' });
        drop.style.left = Math.random() * 100 + '%';
        drop.style.animationDuration = (0.5 + Math.random() * 0.5) + 's';
        drop.style.animationDelay = (-Math.random() * 2) + 's';
        sky.appendChild(drop);
      }
    }

    scene.appendChild(el('div', { className: 'day-ground' }));
    scene.appendChild(el('div', { className: 'day-road' }));

    var stand = el('div', { className: 'scene-stand' });
    stand.appendChild(el('div', { className: 'scene-stand-roof' }));
    var standBody = el('div', { className: 'scene-stand-body' });
    standBody.appendChild(el('div', { className: 'scene-stand-sign' }, state.businessName));
    standBody.appendChild(el('div', { className: 'scene-stand-price' }, getUI().formatMoney(dayResult.priceCharged)));
    stand.appendChild(standBody);
    stand.appendChild(el('div', { className: 'scene-stand-counter' }));
    var legs = el('div', { className: 'scene-stand-legs' });
    legs.appendChild(el('div', { className: 'scene-stand-leg' }));
    legs.appendChild(el('div', { className: 'scene-stand-leg' }));
    stand.appendChild(legs);
    scene.appendChild(stand);

    var counter = el('div', { className: 'day-counter', id: 'sold-counter' }, 'Glasses Sold: 0 / ' + dayResult.cupsProduced + ' prepared');
    scene.appendChild(counter);

    var skipBtn = getUI().button('Skip to Results', 'btn-secondary btn-small skip-btn', function () {
      finishDay();
    });
    scene.appendChild(skipBtn);

    screen.appendChild(scene);

    screen.appendChild(el('div', { className: 'audio-attribution' },
      'Audio: "Dies Irae (Part 1)" — Requiem by Giuseppe Verdi; Joan Sutherland; Marilyn Horne; Luciano Pavarotti; Martti Talvela; Wiener Staatsopernchor; Wiener Philharmoniker; Georg Solti. London Records, 1968. Source: Internet Archive'));

    content.appendChild(screen);

    var simMusic = App._simMusic;

    var totalCustomers = dayResult.cupsSold + dayResult.wastedCups > dayResult.cupsSold
      ? dayResult.potentialCustomers
      : dayResult.cupsSold;
    var buyers = dayResult.cupsSold;
    var rejecters = Math.max(dayResult.potentialCustomers - dayResult.willingCustomers, 0);
    var missedBuyers = dayResult.lostSales;

    var customerCount = Math.min(buyers + rejecters + missedBuyers, 40);
    var soldSoFar = 0;
    var animDuration = 20000;
    var customerColors = ['#E57373','#64B5F6','#81C784','#FFB74D','#BA68C8','#4FC3F7','#AED581','#FF8A65'];
    var finished = false;

    function finishDay() {
      if (finished) return;
      finished = true;
      if (simMusic) { simMusic.pause(); simMusic.currentTime = 0; }
      var pnl = App.finance.calculateDailyPnL(dayResult, state);
      App.finance.applyDayResults(pnl, state);
      App.state.set({
        currentDay: state.currentDay + 1,
        currentScreen: 'day-results'
      });
      delete state._pendingDay;
      App.state.save();
      App.router.navigate('day-results');
    }

    if (customerCount === 0) {
      setTimeout(finishDay, 2000);
      return;
    }

    var buyerIndex = 0;
    var interval = animDuration / customerCount;

    for (var ci = 0; ci < customerCount; ci++) {
      (function (idx) {
        setTimeout(function () {
          if (finished) return;
          var isBuyer = idx < buyers;
          var customer = el('div', { className: 'customer' });
          var color = customerColors[idx % customerColors.length];
          customer.appendChild(el('div', { className: 'customer-head', style: 'background:' + color }));
          customer.appendChild(el('div', { className: 'customer-body', style: 'background:' + color }));
          customer.appendChild(el('div', { className: 'customer-cup' }));

          var isMissedBuyer = !isBuyer && idx >= buyers + rejecters;
          if (isBuyer) {
            customer.style.animation = 'walkToBuy ' + (5 + Math.random() * 2) + 's linear forwards';
            setTimeout(function () {
              if (finished) return;
              customer.classList.add('has-cup');
              var coin = el('div', { className: 'coin' });
              customer.appendChild(coin);
              setTimeout(function () { if (coin.parentNode) coin.remove(); }, 500);
              soldSoFar++;
              var cnt = document.getElementById('sold-counter');
              if (cnt) cnt.textContent = 'Glasses Sold: ' + soldSoFar + ' / ' + dayResult.cupsProduced + ' prepared';
            }, 2500);
          } else {
            customer.style.animation = 'walkToReject ' + (5 + Math.random() * 2) + 's linear forwards';
            setTimeout(function () {
              if (finished) return;
              var head = customer.querySelector('.customer-head');
              if (head) head.style.animation = 'headShake 0.4s ease 2';
              var bubbleText = isMissedBuyer ? ':(' : '🚫💲';
              var bubble = el('div', { className: 'reject-bubble' + (isMissedBuyer ? ' reject-bubble-sad' : '') }, bubbleText);
              customer.appendChild(bubble);
            }, 2000);
          }

          scene.appendChild(customer);
          setTimeout(function () { if (customer.parentNode) customer.remove(); }, 7000);
        }, idx * interval);
      })(ci);
    }

    setTimeout(function () { if (!finished) finishDay(); }, animDuration + 1000);
  }

  /* ===== SCREEN 3.3: DAY RESULTS ===== */
  function renderDayResults() {
    var el = getUI().el;
    var content = getUI().clearContent();
    var screen = el('div', { className: 'screen' });
    var state = App.state.get();
    var dayIndex = state.currentDay - 1;
    var result = state.days[dayIndex];
    if (!result) { App.router.navigate('morning-brief'); return; }

    var weatherInfo = App.weather.getWeatherInfo(result.weather);
    screen.appendChild(el('h1', null, 'Day ' + (dayIndex + 1) + ' Results'));
    screen.appendChild(el('p', { className: 'subtitle' }, weatherInfo.icon + ' ' + weatherInfo.label));

    var resultCard = getUI().card(state.businessName, el('div', null, [
      makeResultRow('Glasses made', result.cupsProduced),
      makeResultRow('Glasses sold', result.cupsSold),
      makeResultRow('Glasses wasted', result.wastedCups, result.wastedCups > 0 ? 'negative' : ''),
      makeResultRow('Revenue', getUI().formatMoney(result.revenue), 'positive'),
      makeResultRow('Ingredient cost', getUI().formatMoney(result.ingredientCost)),
      state.numEmployees > 0 ? makeResultRow('Employee cost', getUI().formatMoney(result.employeeCost)) : null,
      makeResultRow('Daily profit/loss', getUI().formatMoney(result.grossProfit), result.grossProfit >= 0 ? 'positive' : 'negative'),
      state.loan.principal > 0 ? makeResultRow('Loan repayment today', getUI().formatMoney(result.loanRepayment)) : null,
      state.loan.principal > 0 ? makeResultRow('Loan remaining',
        state.loan.remaining <= 0 ? 'Paid off!' : getUI().formatMoney(state.loan.remaining),
        state.loan.remaining <= 0 ? 'positive' : '') : null,
      makeResultRow('Cumulative profit', getUI().formatMoney(state.cumulativeProfit), state.cumulativeProfit >= 0 ? 'positive' : 'negative')
    ].filter(Boolean)));
    screen.appendChild(resultCard);

    if (state.days.length > 1) {
      var chartContainer = el('div', { className: 'chart-container' });
      var canvas = el('canvas');
      chartContainer.appendChild(canvas);
      screen.appendChild(chartContainer);

      setTimeout(function () {
        var chartData = state.days.map(function (d, i) {
          return { label: 'Day ' + (i + 1), value: d.grossProfit };
        });
        App.charts.drawBarChart(canvas, chartData, { title: 'Daily Profit (before loan repayment)', width: 700, height: 220 });
      }, 50);
    }

    screen.appendChild(el('h3', { className: 'mt-24' }, 'What did you notice about today?'));
    var reflectionInput = el('textarea', {
      className: 'input',
      style: 'height:80px;resize:vertical;',
      placeholder: 'Write your thoughts here... (optional)'
    });
    screen.appendChild(reflectionInput);

    if (state.currentDay < state.totalDays) {
      screen.appendChild(getUI().button('Next Day', 'btn-primary btn-large btn-block mt-24', function () {
        App.state.set({ currentScreen: 'morning-brief' });
        App.router.navigate('morning-brief');
      }));
    } else {
      screen.appendChild(getUI().button('See Final Results', 'btn-success btn-large btn-block mt-24', function () {
        App.state.set({ currentScreen: 'final-summary' });
        App.router.navigate('final-summary');
      }));
    }

    content.appendChild(screen);
  }

  function makeResultRow(label, value, colorClass) {
    var el = getUI().el;
    var row = el('div', { className: 'cost-row' });
    row.appendChild(el('span', { className: 'cost-label' }, label));
    var valSpan = el('span', { className: 'cost-value' + (colorClass ? ' ' + colorClass : '') });
    valSpan.textContent = typeof value === 'number' ? String(value) : value;
    row.appendChild(valSpan);
    return row;
  }

  /* ===== SCREEN 3.4: FINAL SUMMARY ===== */
  function renderFinalSummary() {
    var el = getUI().el;
    var content = getUI().clearContent();
    var screen = el('div', { className: 'screen' });
    var state = App.state.get();

    var header = el('div', { className: 'summary-header' });
    header.appendChild(el('h1', null, state.businessName));
    header.appendChild(el('p', { className: 'subtitle' }, state.totalDays + ' days of business'));
    screen.appendChild(header);

    var stats = el('div', { className: 'summary-stats' });
    stats.appendChild(makeStat(getUI().formatMoney(state.totalRevenue), 'Total Revenue', 'positive'));
    stats.appendChild(makeStat(getUI().formatMoney(state.totalCosts), 'Total Costs', ''));
    stats.appendChild(makeStat(getUI().formatMoney(state.cumulativeProfit), 'Total Profit',
      state.cumulativeProfit >= 0 ? 'positive' : 'negative'));
    screen.appendChild(stats);

    var loanCard = getUI().card('Loan Status', el('div', null, [
      makeResultRow('Original loan', getUI().formatMoney(state.loan.principal)),
      makeResultRow('Amount repaid', getUI().formatMoney(state.loan.repaid), 'positive'),
      makeResultRow('Remaining',
        state.loan.remaining <= 0 ? 'Fully Paid!' : getUI().formatMoney(state.loan.remaining),
        state.loan.remaining <= 0 ? 'positive' : 'negative')
    ]));
    if (state.loan.remaining <= 0 && state.loan.principal > 0) {
      var paidDay = 0;
      var cumRepaid = 0;
      for (var i = 0; i < state.days.length; i++) {
        cumRepaid += state.days[i].loanRepayment;
        if (cumRepaid >= state.loan.principal) { paidDay = i + 1; break; }
      }
      if (paidDay > 0) {
        loanCard.appendChild(el('p', { style: 'color:#4CAF50;font-weight:600;margin-top:8px;' },
          'Loan paid off on Day ' + paidDay + '!'));
      }
    }
    screen.appendChild(loanCard);

    var bestDay = null, worstDay = null;
    state.days.forEach(function (d, idx) {
      if (!bestDay || d.netProfit > bestDay.profit) bestDay = { day: idx + 1, profit: d.netProfit };
      if (!worstDay || d.netProfit < worstDay.profit) worstDay = { day: idx + 1, profit: d.netProfit };
    });

    var highlights = el('div', { className: 'card-grid mt-16' });
    if (bestDay) {
      var bc = el('div', { className: 'stat-card highlight-best' });
      bc.appendChild(el('div', { className: 'stat-label' }, 'Best Day'));
      bc.appendChild(el('div', { className: 'stat-value positive' }, 'Day ' + bestDay.day));
      bc.appendChild(el('div', null, getUI().formatMoney(bestDay.profit)));
      highlights.appendChild(bc);
    }
    if (worstDay) {
      var wc = el('div', { className: 'stat-card highlight-worst' });
      wc.appendChild(el('div', { className: 'stat-label' }, 'Worst Day'));
      wc.appendChild(el('div', { className: 'stat-value negative' }, 'Day ' + worstDay.day));
      wc.appendChild(el('div', null, getUI().formatMoney(worstDay.profit)));
      highlights.appendChild(wc);
    }
    screen.appendChild(highlights);

    var avgProfit = state.cumulativeProfit / state.totalDays;
    var wastePercent = state.totalCupsProduced > 0
      ? ((state.totalWaste / state.totalCupsProduced) * 100).toFixed(1)
      : '0.0';

    var moreStats = el('div', { className: 'summary-stats mt-16' });
    moreStats.appendChild(makeStat(getUI().formatMoney(avgProfit), 'Avg Profit/Day', avgProfit >= 0 ? 'positive' : 'negative'));
    moreStats.appendChild(makeStat(state.totalCupsSold + ' / ' + state.totalCupsProduced, 'Sold / Produced', ''));
    moreStats.appendChild(makeStat(wastePercent + '%', 'Waste Rate', parseFloat(wastePercent) > 20 ? 'negative' : ''));
    screen.appendChild(moreStats);

    var chartContainer = el('div', { className: 'chart-container mt-16' });
    var canvas = el('canvas');
    chartContainer.appendChild(canvas);
    screen.appendChild(chartContainer);

    setTimeout(function () {
      var chartData = state.days.map(function (d, i) {
        return { label: 'Day ' + (i + 1), value: d.netProfit };
      });
      App.charts.drawBarChart(canvas, chartData, { title: 'Daily Profit Over Time', width: 700, height: 250 });
    }, 50);

    screen.appendChild(el('h2', { className: 'mt-32' }, 'Days of Operation'));
    var opsTable = el('table', { className: 'data-table' });
    var opsHead = el('thead');
    var opsHeaderRow = el('tr');
    ['Day', 'Weather', 'Price', 'Made', 'Sold', 'Wasted', 'Revenue', 'Costs', 'Profit'].forEach(function (h) {
      opsHeaderRow.appendChild(el('th', null, h));
    });
    opsHead.appendChild(opsHeaderRow);
    opsTable.appendChild(opsHead);
    var opsBody = el('tbody');
    state.days.forEach(function (d, i) {
      var wInfo = App.weather.getWeatherInfo(d.weather);
      var row = el('tr');
      row.appendChild(el('td', null, String(i + 1)));
      row.appendChild(el('td', null, wInfo.icon + ' ' + wInfo.label));
      row.appendChild(el('td', { className: 'mono' }, getUI().formatMoney(d.priceCharged)));
      row.appendChild(el('td', null, String(d.cupsProduced)));
      row.appendChild(el('td', null, String(d.cupsSold)));
      row.appendChild(el('td', { className: d.wastedCups > 0 ? 'negative' : '' }, String(d.wastedCups)));
      row.appendChild(el('td', { className: 'mono' }, getUI().formatMoney(d.revenue)));
      row.appendChild(el('td', { className: 'mono' }, getUI().formatMoney(d.totalCost)));
      row.appendChild(el('td', { className: 'mono ' + (d.grossProfit >= 0 ? 'positive' : 'negative') }, getUI().formatMoney(d.grossProfit)));
      opsBody.appendChild(row);
    });
    opsTable.appendChild(opsBody);
    screen.appendChild(opsTable);

    var btnRow = el('div', { className: 'flex-row flex-center mt-32 gap-24' });
    btnRow.appendChild(getUI().button('Start Over', 'btn-secondary btn-large', function () {
      App.state.reset();
      App.router.navigate('session-chooser');
    }));
    btnRow.appendChild(getUI().button('Try Again (Same Plan)', 'btn-primary btn-large', function () {
      App.state.set({ currentScreen: 'day-count' });
      App.router.navigate('day-count');
    }));
    screen.appendChild(btnRow);

    content.appendChild(screen);
  }

  function makeStat(value, label, colorClass) {
    var el = getUI().el;
    var stat = el('div', { className: 'summary-stat' });
    stat.appendChild(el('div', { className: 'summary-stat-value' + (colorClass ? ' ' + colorClass : '') }, value));
    stat.appendChild(el('div', { className: 'summary-stat-label' }, label));
    return stat;
  }

  App.screens = {
    'session-chooser': renderSessionChooser,
    'business-name': renderBusinessName,
    'employees': renderEmployees,
    'grocery-store': renderGroceryStore,
    'recipe-math': renderRecipeMath,
    'lemon-yield': renderLemonYield,
    'cost-per-cup': renderCostPerCup,
    'pricing': renderPricing,
    'production-plan': renderProductionPlan,
    'day-count': renderDayCount,
    'morning-brief': renderMorningBrief,
    'day-animation': renderDayAnimation,
    'day-results': renderDayResults,
    'final-summary': renderFinalSummary
  };
})();
