// FIRE Simulator - minimal, dependency-free

function $(sel) { return document.querySelector(sel); }
function fmtMoney(v) {
  return new Intl.NumberFormat(undefined,{style:'currency',currency:'USD',maximumFractionDigits:0}).format(v);
}

// Simulation
function simulateSavings(startBalance, monthlyContribution, annualReturn, years) {
  const months = Math.max(0, Math.floor(years*12));
  const r = annualReturn/100/12;
  let bal = startBalance;
  const yearly = [{ year: 0, balance: bal, contributed: 0 }];
  let contributed = 0;
  for (let m=1;m<=months;m++) {
    bal = bal * (1 + r) + monthlyContribution;
    contributed += monthlyContribution;
    if (m % 12 === 0) {
      const y = m/12;
      yearly.push({ year: y, balance: bal, contributed });
    }
  }
  return yearly;
}

function simulateWithdrawal(startBalance, annualWithdrawal, annualReturn, years) {
  const months = Math.max(0, Math.floor(years*12));
  const r = annualReturn/100/12;
  const w = annualWithdrawal/12;
  let bal = startBalance;
  const yearly = [{ year: 0, balance: bal }];
  for (let m=1;m<=months;m++) {
    bal = bal * (1 + r) - w;
    if (bal <= 0) {
      bal = 0;
      if (m % 12 === 0) yearly.push({ year: m/12, balance: bal });
      break;
    }
    if (m % 12 === 0) yearly.push({ year: m/12, balance: bal });
  }
  return yearly;
}

// Chart rendering (SVG)
function renderLineChart(el, series, opts={}) {
  const width = opts.width || el.clientWidth || 500;
  const height = opts.height || el.clientHeight || 320;
  const margin = {top:18,right:18,bottom:28,left:48, ...(opts.margin||{})};
  const w = Math.max(100, width - margin.left - margin.right);
  const h = Math.max(60, height - margin.top - margin.bottom);

  el.innerHTML = '';
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  el.appendChild(svg);

  const g = document.createElementNS('http://www.w3.org/2000/svg','g');
  g.setAttribute('transform', `translate(${margin.left},${margin.top})`);
  svg.appendChild(g);

  // scales
  const xs = series.map(d=>d.year);
  const ys = series.map(d=>d.balance);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = 0; // always baseline at zero
  const yMax = Math.max(1, Math.max(...ys) * 1.08);

  const xScale = x => w * (x - xMin) / (xMax - xMin || 1);
  const yScale = y => h - h * (y - yMin) / (yMax - yMin || 1);

  // axes
  const axisG = document.createElementNS('http://www.w3.org/2000/svg','g');
  axisG.setAttribute('class','axis');
  g.appendChild(axisG);

  // x axis ticks (years)
  const tickCount = Math.min(10, xs.length);
  for (let i=0;i<tickCount;i++){
    const t = xMin + (i*(xMax-xMin))/(tickCount-1 || 1);
    const x = Math.round(xScale(t)) + 0.5;
    const line = document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1', x); line.setAttribute('x2', x);
    line.setAttribute('y1', 0); line.setAttribute('y2', h);
    line.setAttribute('stroke-dasharray','2,4');
    line.setAttribute('opacity','0.35');
    axisG.appendChild(line);

    const txt = document.createElementNS('http://www.w3.org/2000/svg','text');
    txt.setAttribute('x', x); txt.setAttribute('y', h + 18);
    txt.setAttribute('text-anchor','middle');
    txt.textContent = Math.round(t);
    axisG.appendChild(txt);
  }

  // y axis ticks
  const yTicks = 5;
  for (let i=0;i<=yTicks;i++){
    const t = yMin + (i*(yMax - yMin))/yTicks;
    const y = Math.round(yScale(t)) + 0.5;
    const line = document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1', 0); line.setAttribute('x2', w);
    line.setAttribute('y1', y); line.setAttribute('y2', y);
    line.setAttribute('stroke-dasharray','2,4');
    line.setAttribute('opacity','0.35');
    axisG.appendChild(line);

    const txt = document.createElementNS('http://www.w3.org/2000/svg','text');
    txt.setAttribute('x', -8); txt.setAttribute('y', y + 4);
    txt.setAttribute('text-anchor','end');
    txt.textContent = fmtMoney(t);
    axisG.appendChild(txt);
  }

  // area under line for niceness
  const areaPath = document.createElementNS('http://www.w3.org/2000/svg','path');
  areaPath.setAttribute('class','area');
  let areaD = '';
  series.forEach((d, i) => {
    const X = xScale(d.year), Y = yScale(d.balance);
    areaD += (i ? ' L ' : 'M ') + X + ' ' + Y;
  });
  areaD += ` L ${xScale(xMax)} ${yScale(0)} L ${xScale(xMin)} ${yScale(0)} Z`;
  areaPath.setAttribute('d', areaD);
  g.appendChild(areaPath);

  // line path
  const path = document.createElementNS('http://www.w3.org/2000/svg','path');
  path.setAttribute('class','line');
  let d = '';
  series.forEach((p,i)=>{
    const X = xScale(p.year), Y = yScale(p.balance);
    d += (i ? ' L ' : 'M ') + X + ' ' + Y;
  });
  path.setAttribute('d', d);
  g.appendChild(path);

  // points
  const pointsG = document.createElementNS('http://www.w3.org/2000/svg','g');
  g.appendChild(pointsG);
  series.forEach((p)=>{
    const c = document.createElementNS('http://www.w3.org/2000/svg','circle');
    c.setAttribute('class','point');
    c.setAttribute('cx', xScale(p.year));
    c.setAttribute('cy', yScale(p.balance));
    c.setAttribute('r', 3);
    pointsG.appendChild(c);
  });

  // tooltip interactivity
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  tooltip.style.display = 'none';
  el.appendChild(tooltip);

  const overlay = document.createElementNS('http://www.w3.org/2000/svg','rect');
  overlay.setAttribute('x',0); overlay.setAttribute('y',0);
  overlay.setAttribute('width', w); overlay.setAttribute('height', h);
  overlay.setAttribute('fill','transparent');
  g.appendChild(overlay);

  const bisect = (mx) => {
    const targetX = mx;
    let idx = 0; let best = Infinity;
    series.forEach((p,i)=>{
      const dx = Math.abs(xScale(p.year) - targetX);
      if (dx < best) { best = dx; idx = i; }
    });
    return idx;
  };

  overlay.addEventListener('mousemove', (e) => {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const inv = ctm.inverse();
    const loc = pt.matrixTransform(inv);
    const mx = Math.max(0, Math.min(w, loc.x - margin.left));
    const idx = bisect(mx);
    const p = series[idx];
    const X = margin.left + xScale(p.year);
    const Y = margin.top + yScale(p.balance);

    tooltip.style.display = 'block';
    tooltip.style.left = X + 'px';
    tooltip.style.top = Y + 'px';
    tooltip.innerHTML = `Year ${p.year}<br>${fmtMoney(p.balance)}`;
  });
  overlay.addEventListener('mouseleave', ()=>{
    tooltip.style.display = 'none';
  });
}

function readInputs(){
  const val = id => parseFloat($(id).value || '0');
  const startBalance = val('#startBalance');
  const monthlyContribution = val('#monthlyContribution');
  const annualReturnSave = val('#annualReturnSave');
  const yearsSaving = Math.max(0, Math.floor(val('#yearsSaving')));
  const annualWithdrawal = val('#annualWithdrawal');
  const annualReturnRetire = val('#annualReturnRetire');
  const yearsWithdrawing = Math.max(0, Math.floor(val('#yearsWithdrawing')));
  return {startBalance, monthlyContribution, annualReturnSave, yearsSaving, annualWithdrawal, annualReturnRetire, yearsWithdrawing};
}

function update(){
  const i = readInputs();
  const saved = simulateSavings(i.startBalance, i.monthlyContribution, i.annualReturnSave, i.yearsSaving);
  const retireStart = saved[saved.length-1].balance;
  const withdrawn = simulateWithdrawal(retireStart, i.annualWithdrawal, i.annualReturnRetire, i.yearsWithdrawing);

  renderLineChart($('#chartSavings'), saved, {});
  renderLineChart($('#chartWithdrawal'), withdrawn, {});

  // summary
  $('#summary').hidden = false;
  $('#sumRetireBal').textContent = fmtMoney(retireStart);
  $('#sumContrib').textContent = fmtMoney(saved[saved.length-1].contributed ?? 0);
  const yearsLast = withdrawn[withdrawn.length-1].year;
  $('#sumYearsLast').textContent = yearsLast.toFixed(0) + ' yrs';
  $('#sumFinalBal').textContent = fmtMoney(withdrawn[withdrawn.length-1].balance);
}

// Wire up
window.addEventListener('DOMContentLoaded', () => {
  $('#controls').addEventListener('submit', (e)=>{e.preventDefault(); update();});
  $('#resetBtn').addEventListener('click', ()=>{
    // reset to defaults
    $('#startBalance').value = 50000;
    $('#monthlyContribution').value = 1500;
    $('#annualReturnSave').value = 6.0;
    $('#yearsSaving').value = 15;
    $('#annualWithdrawal').value = 40000;
    $('#annualReturnRetire').value = 5.0;
    $('#yearsWithdrawing').value = 35;
    update();
  });
  // auto-run once
  update();
  // live update on input changes (debounced)
  let t; document.querySelectorAll('#controls input').forEach(inp=>{
    inp.addEventListener('input', ()=>{ clearTimeout(t); t=setTimeout(update, 250); });
  });
});

