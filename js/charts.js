var App = App || {};

(function () {

  function setupCanvas(canvas, width, height) {
    var dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return ctx;
  }

  function drawBarChart(canvas, data, opts) {
    opts = opts || {};
    var width = opts.width || 700;
    var height = opts.height || 250;
    var ctx = setupCanvas(canvas, width, height);
    var padding = { top: 30, right: 20, bottom: 40, left: 60 };
    var chartW = width - padding.left - padding.right;
    var chartH = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    if (!data || data.length === 0) {
      ctx.fillStyle = '#999';
      ctx.font = '16px ' + getComputedStyle(document.body).fontFamily;
      ctx.textAlign = 'center';
      ctx.fillText('No data yet', width / 2, height / 2);
      return;
    }

    var values = data.map(function (d) { return d.value; });
    var maxVal = Math.max.apply(null, values.concat([0]));
    var minVal = Math.min.apply(null, values.concat([0]));
    var range = Math.max(maxVal - minVal, 1);
    var absMax = Math.max(Math.abs(maxVal), Math.abs(minVal), 1);

    var zeroY = padding.top + chartH;
    if (minVal < 0) {
      zeroY = padding.top + (maxVal / (maxVal - minVal)) * chartH;
    }

    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 1;
    var numLines = 5;
    for (var i = 0; i <= numLines; i++) {
      var y = padding.top + (i / numLines) * chartH;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartW, y);
      ctx.stroke();

      var labelVal;
      if (minVal >= 0) {
        labelVal = maxVal - (i / numLines) * maxVal;
      } else {
        labelVal = maxVal - (i / numLines) * (maxVal - minVal);
      }
      ctx.fillStyle = '#999';
      ctx.font = '12px ' + getComputedStyle(document.body).fontFamily;
      ctx.textAlign = 'right';
      ctx.fillText('$' + labelVal.toFixed(2), padding.left - 8, y + 4);
    }

    if (minVal < 0) {
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding.left, zeroY);
      ctx.lineTo(padding.left + chartW, zeroY);
      ctx.stroke();
    }

    var barWidth = Math.min(40, (chartW / data.length) * 0.7);
    var gap = (chartW - barWidth * data.length) / (data.length + 1);

    for (var j = 0; j < data.length; j++) {
      var x = padding.left + gap + j * (barWidth + gap);
      var val = data[j].value;
      var barH;

      if (minVal >= 0) {
        barH = (val / absMax) * chartH;
        ctx.fillStyle = val >= 0 ? (opts.color || '#4CAF50') : '#E57373';
        ctx.fillRect(x, padding.top + chartH - barH, barWidth, barH);
      } else {
        if (val >= 0) {
          barH = (val / (maxVal - minVal)) * chartH;
          ctx.fillStyle = opts.color || '#4CAF50';
          ctx.fillRect(x, zeroY - barH, barWidth, barH);
        } else {
          barH = (Math.abs(val) / (maxVal - minVal)) * chartH;
          ctx.fillStyle = '#E57373';
          ctx.fillRect(x, zeroY, barWidth, barH);
        }
      }

      ctx.fillStyle = '#333';
      ctx.font = '12px ' + getComputedStyle(document.body).fontFamily;
      ctx.textAlign = 'center';
      ctx.fillText(data[j].label || ('Day ' + (j + 1)), x + barWidth / 2, height - padding.bottom + 16);
    }

    if (opts.title) {
      ctx.fillStyle = '#333';
      ctx.font = 'bold 14px ' + getComputedStyle(document.body).fontFamily;
      ctx.textAlign = 'center';
      ctx.fillText(opts.title, width / 2, 18);
    }
  }

  App.charts = {
    drawBarChart: drawBarChart
  };
})();
