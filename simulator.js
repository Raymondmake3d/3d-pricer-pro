'use strict';

// ═══════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════

const SCENARIOS = {
  conservative: { label:'🐢 Conservador', factor:0.65 },
  realistic:    { label:'📊 Realista',    factor:1.00 },
  optimistic:   { label:'🚀 Otimista',    factor:1.35 },
};

let currentScenario = 'realistic';

// ═══════════════════════════════════════════════════════
// UTILITÁRIO LOCAL
// ═══════════════════════════════════════════════════════

function getSimVal(id) {
  const v = parseFloat(document.getElementById(id)?.value);
  return isNaN(v) ? 0 : v;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// ═══════════════════════════════════════════════════════
// CÁLCULO PRINCIPAL
// ═══════════════════════════════════════════════════════

function runSimulator(scenario) {
  if (scenario) currentScenario = scenario;

  document.querySelectorAll('.scenario-tab').forEach(t =>
    t.classList.toggle('active', t.dataset.scenario === currentScenario)
  );

  const pricePerUnit    = getSimVal('sim-price');
  const costPerUnit     = getSimVal('sim-cost');
  const unitsPerDay     = getSimVal('sim-units-day');
  const workDays        = getSimVal('sim-work-days');
  const fixedCosts      = getSimVal('sim-fixed');
  const investmentTotal = getSimVal('sim-investment');
  const platformFeeP    = getSimVal('sim-platform');
  const taxRateP        = getSimVal('sim-tax');

  if (pricePerUnit <= 0 || costPerUnit <= 0 || unitsPerDay <= 0 || workDays <= 0) return;

  const factor = SCENARIOS[currentScenario].factor;

  const unitsMonth      = Math.floor(unitsPerDay * workDays * factor);
  const netPrice        = pricePerUnit * (1 - platformFeeP/100) * (1 - taxRateP/100);
  const grossRevenue    = pricePerUnit * unitsMonth;
  const netRevenue      = netPrice     * unitsMonth;
  const varCosts        = costPerUnit  * unitsMonth;
  const totalCosts      = varCosts + fixedCosts;
  const netProfit       = netRevenue - totalCosts;
  const profitMarginPct = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;

  const contribMargin  = netPrice - costPerUnit;
  const breakevenUnits = contribMargin > 0 ? Math.ceil(fixedCosts / contribMargin) : Infinity;
  const breakevenDays  = (workDays > 0 && unitsPerDay > 0 && isFinite(breakevenUnits))
    ? Math.ceil(breakevenUnits / (unitsPerDay * factor))
    : Infinity;

  const annualProfit  = netProfit * 12;
  const paybackMonths = (netProfit > 0 && investmentTotal > 0)
    ? investmentTotal / netProfit : null;
  const roi = investmentTotal > 0 ? (annualProfit / investmentTotal) * 100 : null;

  renderSimCards({
    unitsMonth, grossRevenue, netRevenue,
    totalCosts, netProfit, profitMarginPct,
    annualProfit, roi, paybackMonths,
    breakevenUnits, breakevenDays,
  });

  renderProjectionBars({ grossRevenue, netRevenue, totalCosts, netProfit });

  window._lastSimData = { netPrice, costPerUnit, fixedCosts, unitsPerDay, workDays, factor };
  renderMonthlyChart(window._lastSimData);

  document.getElementById('sim-result')?.classList.remove('hidden');
}

// ═══════════════════════════════════════════════════════
// CARDS DE RESULTADO
// ═══════════════════════════════════════════════════════

function renderSimCards(d) {
  setText('sim-r-units',      `${d.unitsMonth.toLocaleString('pt-BR')} un.`);
  setText('sim-r-revenue',    formatBRL(d.grossRevenue));
  setText('sim-r-netrevenue', `Líquida: ${formatBRL(d.netRevenue)}`);
  setText('sim-r-profit',     formatBRL(d.netProfit));
  setText('sim-r-margin',     `Margem: ${d.profitMarginPct.toFixed(1)}%`);
  setText('sim-r-costs',      formatBRL(d.totalCosts));
  setText('sim-r-annual',     formatBRL(d.annualProfit));

  setText('sim-r-roi', d.roi !== null
    ? `${d.roi.toFixed(1)}% ao ano`
    : '— (sem investimento)');

  if (d.paybackMonths !== null && isFinite(d.paybackMonths)) {
    const months = d.paybackMonths.toFixed(1);
    const years  = (d.paybackMonths / 12).toFixed(1);
    setText('sim-r-payback',  `Payback: ${months} meses (${years} anos)`);
    setText('sim-r-payback2', `${months} meses`);
  } else {
    const msg = d.netProfit <= 0 ? 'Prejuízo ⚠️' : '—';
    setText('sim-r-payback',  msg);
    setText('sim-r-payback2', msg);
  }

  setText('sim-r-be-units', isFinite(d.breakevenUnits)
    ? `${d.breakevenUnits.toLocaleString('pt-BR')} peças/mês`
    : 'Margem negativa ⚠️');
  setText('sim-r-be-days', isFinite(d.breakevenDays)
    ? `${d.breakevenDays} dias de trabalho para cobrir os fixos`
    : '—');
}

// ═══════════════════════════════════════════════════════
// BARRAS DE PROJEÇÃO
// ═══════════════════════════════════════════════════════

function renderProjectionBars(d) {
  const maxVal = Math.max(d.grossRevenue, 0.01);
  const bars = [
    { fillId:'bar-revenue', valId:'bar-revenue-val', value:d.grossRevenue,          color:'#2c4a7c' },
    { fillId:'bar-netrev',  valId:'bar-netrev-val',  value:d.netRevenue,             color:'#3d6199' },
    { fillId:'bar-costs',   valId:'bar-costs-val',   value:d.totalCosts,             color:'#e74c3c' },
    { fillId:'bar-profit',  valId:'bar-profit-val',  value:Math.max(0, d.netProfit), color:'#27ae60' },
  ];
  bars.forEach(b => {
    const fill = document.getElementById(b.fillId);
    const val  = document.getElementById(b.valId);
    if (fill) {
      fill.style.width      = `${Math.min(100, (b.value / maxVal) * 100)}%`;
      fill.style.background = b.color;
    }
    if (val) val.textContent = formatBRL(b.value);
  });
}

// ═══════════════════════════════════════════════════════
// GRÁFICO 12 MESES (Canvas puro)
// ═══════════════════════════════════════════════════════

function renderMonthlyChart({ netPrice, costPerUnit, fixedCosts, unitsPerDay, workDays, factor }) {
  const canvas = document.getElementById('monthlyChart');
  if (!canvas) return;

  canvas.width  = canvas.offsetWidth || 800;
  canvas.height = 220;

  const ctx  = canvas.getContext('2d');
  const W    = canvas.width;
  const H    = canvas.height;
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';

  ctx.clearRect(0, 0, W, H);

  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  const data = months.map((m, i) => {
    const gf      = factor * Math.pow(1.03, i);
    const units   = Math.floor(unitsPerDay * workDays * gf);
    const revenue = netPrice    * units;
    const costs   = costPerUnit * units + fixedCosts;
    return { month:m, revenue, costs, profit: revenue - costs };
  });

  const maxVal = Math.max(...data.map(d => d.revenue), 1);
  const minVal = Math.min(...data.map(d => d.profit),  0);
  const range  = maxVal - minVal || 1;

  const pL=72, pR=20, pT=28, pB=38;
  const cW = W - pL - pR;
  const cH = H - pT - pB;

  function scaleY(val) { return pT + cH - ((val - minVal) / range) * cH; }

  // Grid
  for (let i = 0; i <= 4; i++) {
    const val = minVal + (range / 4) * (4 - i);
    const y   = pT + (cH / 4) * i;
    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1; ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(pL, y); ctx.lineTo(W-pR, y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle    = dark ? '#64748b' : '#94a3b8';
    ctx.font         = '9px Poppins,sans-serif';
    ctx.textAlign    = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      Math.abs(val) >= 1000 ? `R$${(val/1000).toFixed(1)}k` : `R$${val.toFixed(0)}`,
      pL-6, y
    );
  }

  // Linha zero
  const zeroY = scaleY(0);
  ctx.strokeStyle = dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1.5; ctx.setLineDash([6,3]);
  ctx.beginPath(); ctx.moveTo(pL, zeroY); ctx.lineTo(W-pR, zeroY); ctx.stroke();
  ctx.setLineDash([]);

  // Barras + pontos
  const barGrpW = cW / months.length;
  const barW    = barGrpW * 0.28;
  const profPts = [];

  data.forEach((d, i) => {
    const cx = pL + barGrpW * i + barGrpW / 2;

    // Receita
    const rTop = scaleY(d.revenue);
    const rH   = Math.abs(zeroY - rTop);
    ctx.fillStyle = dark ? 'rgba(44,74,124,0.75)' : 'rgba(44,74,124,0.6)';
    ctx.beginPath();
    ctx.roundRect
      ? ctx.roundRect(cx-barW-2, rTop, barW, rH, [3,3,0,0])
      : ctx.rect(cx-barW-2, rTop, barW, rH);
    ctx.fill();

    // Custos
    const cTop = scaleY(d.costs);
    const cH2  = Math.abs(zeroY - cTop);
    ctx.fillStyle = dark ? 'rgba(231,76,60,0.65)' : 'rgba(231,76,60,0.5)';
    ctx.beginPath();
    ctx.roundRect
      ? ctx.roundRect(cx+2, cTop, barW, cH2, [3,3,0,0])
      : ctx.rect(cx+2, cTop, barW, cH2);
    ctx.fill();

    profPts.push({ x:cx, y:scaleY(d.profit) });

    // Label mês
    ctx.fillStyle    = dark ? '#64748b' : '#94a3b8';
    ctx.font         = '9px Poppins,sans-serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(d.month, cx, H-pB+6);
  });

  // Linha de lucro
  ctx.strokeStyle = '#27ae60'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
  ctx.beginPath();
  profPts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.stroke();

  // Pontos
  const bg = dark ? '#1a2a3e' : '#ffffff';
  profPts.forEach(p => {
    ctx.beginPath(); ctx.arc(p.x, p.y, 3.5, 0, Math.PI*2);
    ctx.fillStyle='#27ae60'; ctx.strokeStyle=bg; ctx.lineWidth=2;
    ctx.fill(); ctx.stroke();
  });

  // Legenda
  const legendItems = [
    { color: dark ? 'rgba(44,74,124,0.8)'  : 'rgba(44,74,124,0.65)', label:'Receita Líquida' },
    { color: dark ? 'rgba(231,76,60,0.7)'  : 'rgba(231,76,60,0.55)', label:'Custos Totais'   },
    { color: '#27ae60',                                                label:'Lucro Líquido'   },
  ];
  let lx = pL; ctx.textBaseline = 'middle';
  legendItems.forEach(item => {
    ctx.fillStyle = item.color; ctx.fillRect(lx, 8, 12, 10);
    ctx.fillStyle = dark ? '#94a3b8' : '#718096';
    ctx.font = '9px Poppins,sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(item.label, lx+15, 13);
    lx += ctx.measureText(item.label).width + 32;
  });
}

// ═══════════════════════════════════════════════════════
// IMPORTAR DA PRECIFICAÇÃO
// ═══════════════════════════════════════════════════════

function importFromPricing() {
  const r = window._lastResult;
  if (!r) {
    showToast('Calcule uma precificação antes de simular!', 'fa-triangle-exclamation');
    return;
  }

  const map = {
    'sim-price': r.finalPrice?.toFixed(2),
    'sim-cost':  r.directCost?.toFixed(2),
  };

  Object.entries(map).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el && val !== undefined) {
      el.value = val;
      el.style.borderColor = 'var(--orange)';
      el.style.boxShadow   = '0 0 0 3px rgba(240,123,48,0.2)';
      setTimeout(() => { el.style.borderColor = ''; el.style.boxShadow = ''; }, 2500);
    }
  });

  showToast('Dados importados da precificação! ✅', 'fa-file-import');
  runSimulator();
}

// ═══════════════════════════════════════════════════════
// INICIALIZAÇÃO
// ═══════════════════════════════════════════════════════

function initSimulator() {
  document.querySelectorAll('.scenario-tab').forEach(btn =>
    btn.addEventListener('click', () => runSimulator(btn.dataset.scenario))
  );

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window._lastSimData) renderMonthlyChart(window._lastSimData);
    }, 200);
  });
}
