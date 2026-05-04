var App = App || {};

(function () {

  function el(tag, attrs, children) {
    var elem = document.createElement(tag);
    if (attrs) {
      for (var key in attrs) {
        if (key === 'className') elem.className = attrs[key];
        else if (key === 'textContent') elem.textContent = attrs[key];
        else if (key === 'innerHTML') elem.innerHTML = attrs[key];
        else if (key.indexOf('on') === 0) elem.addEventListener(key.substring(2).toLowerCase(), attrs[key]);
        else elem.setAttribute(key, attrs[key]);
      }
    }
    if (children) {
      if (typeof children === 'string') {
        elem.textContent = children;
      } else if (Array.isArray(children)) {
        children.forEach(function (child) {
          if (child) {
            if (typeof child === 'string') elem.appendChild(document.createTextNode(child));
            else elem.appendChild(child);
          }
        });
      } else {
        elem.appendChild(children);
      }
    }
    return elem;
  }

  function button(text, className, onClick) {
    return el('button', { className: 'btn ' + (className || ''), onClick: onClick, type: 'button' }, text);
  }

  function numberInput(id, opts) {
    opts = opts || {};
    var input = el('input', {
      type: 'number',
      id: id,
      className: 'input ' + (opts.mono ? 'input-mono ' : '') + (opts.className || ''),
      min: opts.min != null ? String(opts.min) : undefined,
      max: opts.max != null ? String(opts.max) : undefined,
      step: opts.step != null ? String(opts.step) : 'any',
      placeholder: opts.placeholder || ''
    });
    if (opts.value != null) input.value = opts.value;
    return input;
  }

  function textInput(id, opts) {
    opts = opts || {};
    return el('input', {
      type: 'text',
      id: id,
      className: 'input ' + (opts.className || ''),
      placeholder: opts.placeholder || '',
      maxlength: opts.maxlength ? String(opts.maxlength) : undefined
    });
  }

  function slider(id, opts) {
    opts = opts || {};
    var container = el('div', { className: 'slider-container' });
    var initVal = opts.value || opts.min || 0;
    var initLabel = opts.format === 'money' ? formatMoney(initVal)
                  : opts.format === 'days' ? initVal + ' days'
                  : String(initVal);
    var valueDisplay = el('div', { className: 'slider-value', id: id + '-value' }, initLabel);
    var range = el('input', {
      type: 'range',
      id: id,
      className: 'slider',
      min: String(opts.min || 0),
      max: String(opts.max || 100),
      step: String(opts.step || 1),
      value: String(opts.value || opts.min || 0)
    });
    range.addEventListener('input', function () {
      var val = parseFloat(range.value);
      if (opts.format === 'money') valueDisplay.textContent = formatMoney(val);
      else if (opts.format === 'days') valueDisplay.textContent = val + ' days';
      else valueDisplay.textContent = val;
      if (opts.onChange) opts.onChange(val);
    });
    container.appendChild(valueDisplay);
    container.appendChild(range);
    return container;
  }

  function card(title, content) {
    var c = el('div', { className: 'card' });
    if (title) {
      c.appendChild(el('div', { className: 'card-header' }, title));
    }
    if (typeof content === 'string') {
      var body = el('div');
      body.innerHTML = content;
      c.appendChild(body);
    } else if (content) {
      c.appendChild(content);
    }
    return c;
  }

  function feedback(type, message) {
    var icons = { correct: '✔', close: '≈', incorrect: '✘' };
    return el('div', { className: 'feedback feedback-' + type }, [
      el('span', null, icons[type] || ''),
      el('span', null, message)
    ]);
  }

  function formatMoney(amount) {
    if (amount == null || isNaN(amount)) return '$0.00';
    var neg = amount < 0;
    var abs = Math.abs(amount).toFixed(2);
    return (neg ? '-$' : '$') + abs;
  }

  function formatNum(n, decimals) {
    if (n == null || isNaN(n)) return '0';
    return Number(n).toFixed(decimals != null ? decimals : 2);
  }

  function questionGroup(questionText, inputEl, unitText) {
    var group = el('div', { className: 'question-group' });
    group.appendChild(el('div', { className: 'question-text' }, questionText));
    var row = el('div', { className: 'answer-row' });
    row.appendChild(inputEl);
    if (unitText) row.appendChild(el('span', { className: 'answer-unit' }, unitText));
    group.appendChild(row);
    return group;
  }

  function infoBlock(html) {
    var block = el('div', { className: 'info-block' });
    block.innerHTML = html;
    return block;
  }

  function warningBox(text) {
    return el('div', { className: 'warning-box' }, [
      el('span', { className: 'warning-icon' }, '⚠'),
      el('span', null, text)
    ]);
  }

  function standPreview(name) {
    var stand = el('div', { className: 'stand-preview' });
    stand.appendChild(el('div', { className: 'stand-roof' }));
    stand.appendChild(el('div', { className: 'stand-sign', id: 'stand-sign-text' }, name || 'Your Stand'));
    stand.appendChild(el('div', { className: 'stand-counter' }));
    var legs = el('div', { className: 'stand-legs' });
    legs.appendChild(el('div', { className: 'stand-leg' }));
    legs.appendChild(el('div', { className: 'stand-leg' }));
    stand.appendChild(legs);
    return stand;
  }

  function employeeIcons(count) {
    var container = el('div', { className: 'employee-icons' });
    var colors = ['#E57373', '#64B5F6', '#81C784', '#FFB74D', '#BA68C8'];
    for (var i = 0; i < count; i++) {
      var person = el('div', { className: 'employee-icon' });
      person.appendChild(el('div', { className: 'employee-head', style: 'background:' + colors[i % colors.length] }));
      person.appendChild(el('div', { className: 'employee-body', style: 'background:' + colors[i % colors.length] }));
      container.appendChild(person);
    }
    return container;
  }

  function storeItem(icon, name, size, price) {
    var item = el('div', { className: 'store-item' });
    item.appendChild(el('div', { className: 'store-item-icon' }, icon));
    item.appendChild(el('div', { className: 'store-item-name' }, name));
    item.appendChild(el('div', { className: 'store-item-size' }, size));
    item.appendChild(el('div', { className: 'store-item-price' }, formatMoney(price)));
    return item;
  }

  function clearContent() {
    var content = document.getElementById('content');
    content.innerHTML = '';
    return content;
  }

  App.ui = {
    el: el,
    button: button,
    numberInput: numberInput,
    textInput: textInput,
    slider: slider,
    card: card,
    feedback: feedback,
    formatMoney: formatMoney,
    formatNum: formatNum,
    questionGroup: questionGroup,
    infoBlock: infoBlock,
    warningBox: warningBox,
    standPreview: standPreview,
    employeeIcons: employeeIcons,
    storeItem: storeItem,
    clearContent: clearContent
  };
})();
