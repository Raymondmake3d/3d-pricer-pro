'use strict';

// ═══════════════════════════════════════════════════════
// SIMULADOR DE LUCRO MENSAL
// ═══════════════════════════════════════════════════════

window.runSimulator = function(scenario = null) {
  const price       = parseFloat(document.getElementById('sim-price')?.value)      || 0;
  const cost        = parseFloat(document.getElementById('sim-cost')?.value)       || 0;
  let unitsPerDay   = parseFloat(document.getElementById('sim-units-day')?.value)  || 0;
  let workDays      = parseFloat(document.getElementById('sim-work-days')?.value)  || 0;
  const fixedCosts  = parseFloat(document.getElementById('sim-fixed')?.value)      || 0;
  const investment  = parseFloat(document.getElementById('sim-investment')?.value) || 0;
  const platformFee = parseFloat(document.getElementById('sim-platform')?.value)   || 0;
  const taxRate     = parseFloat(document.getElementById('sim-tax')?.value)        || 0;

  if (price <= 0 || cost <= 0 || unitsPerDay <= 0 || workDays <= 0) {
    document.getElementById('sim-result')?.classList.add('hidden');
    return;
  }

  let growthFactor = 1; // Fator de crescimento para cenários

  // Aplica o cenário se fornecido
  if (scenario) {
    document.querySelectorAll('.scenario-tab').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.scenario-tab[data-scenario="${scenario}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    switch (scenario) {
      case 'conservative':
        unitsPerDay *= 0.8; // 20% menos peças
        workDays    *= 0.9; // 10% menos dias
        growthFactor = 0.9; // Crescimento mais lento
        break;
      case 'realistic':
        // Valores padrão
        break;
      case 'optimistic':
        unitsPerDay *= 1.2; // 20% mais peças
        workDays    *= 1.1; // 10% mais dias
        growthFactor = 1.1; // Crescimento mais rápido
        break;
    }
  } else {
    // Se nenhum cenário foi passado, verifica qual está ativo e aplica
    const activeScenario = document.querySelector('.scenario-tab.active')?.dataset.scenario;
    if (activeScenario) {
      window.runSimulator(activeScenario); // Chama recursivamente com o cenário ativo
      return; // Sai para evitar recalcular
    }
  }

  const unitsPerMonth = unitsPerDay * workDays;
  const grossRevenue  = price * unitsPerMonth;
  const variableCosts = cost * unitsPerMonth;

  const platformAmount = grossRevenue * (platformFee / 100);
  const taxAmount      = (grossRevenue - platformAmount) * (taxRate / 100); // Imposto sobre receita líquida da plataforma

  const netRevenue    = grossRevenue - platformAmount - taxAmount;
  const totalCosts    = variableCosts + fixedCosts;
  const netProfit     = netRevenue - totalCosts;
  const profitMargin  = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;

  // Ponto de Equilíbrio
  const contributionMargin = price - (cost + (price * (platformFee / 100)) + (price * (taxRate / 100)));
  const breakevenUnits     = contributionMargin > 0 ? fixedCosts / contributionMargin : Infinity;
  const breakevenDays      = unitsPerDay > 0 ? breakevenUnits / unitsPerDay : Infinity;

  // ROI e Payback
  const annualProfit = netProfit * 12;
  const roi          = investment > 0 ? (annualProfit / investment) * 100 : 0;
  const paybackMonths = annualProfit > 0 ? investment / (annualProfit / 12) : Infinity;

  // Atualiza os resultados na UI
  window.setResultText('sim-r-units',   `${unitsPerMonth.toFixed(0)} peças`);
  window.setResultText('sim-r-revenue', window.formatBRL(grossRevenue));
  window.setResultText('sim-r-netrevenue', `Líquida: ${window.formatBRL(netRevenue)}`);
  window.setResultText('sim-r-profit',  window.formatBRL(netProfit));
  window.setResultText('sim-r-margin',  `Margem: ${profitMargin.toFixed(1)}%`);
  window.setResultText('sim-r-costs',   window.formatBRL(totalCosts));
  window.setResultText('sim-r-annual',  window.formatBRL(annualProfit));
  window.setResultText('sim-r-roi',     `${roi.toFixed(1)}% ao ano`);
  window.setResultText('sim-r-payback', `Payback: ${paybackMonths.toFixed(1)} meses`);

  window.setResultText('sim-r-be-units', `${Math.ceil(breakevenUnits)} peças`);
  window.setResultText('sim-r-be-days',  `${Math.ceil(breakevenDays)} dias para o breakeven`);
  window.setResultText('sim-r-payback2', `${paybackMonths.toFixed(1)} meses`);

  window.updateProjectionBars({ grossRevenue, netRevenue, totalCosts, netProfit });

  const chartData = {
    netPrice:    price - (price * (platformFee / 100)) - (price * (taxRate / 100)), // Preço líquido por peça
    costPerUnit: cost,
    fixedCosts:  fixedCosts,
    unitsPerDay: unitsPerDay,
    workDays:    workDays,
    factor:      growthFactor,
  };
  window._lastSimData = chartData; // Armazena para redesenhar no resize
  window.renderMonthlyChart(chartData);

  document.getElementById('sim-result')?.classList.remove('hidden');
};

// Helper para setar texto (já que setResult usa formatBRL)
window.setResultText = function(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
};

window.updateProjectionBars = function(d) {
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
    if (val) val.textContent = window.formatBRL(b.value);
  });
};

// ═══════════════════════════════════════════════════════
// GRÁFICO 12 MESES (Canvas puro)
// ═══════════════════════════════════════════════════════

window.renderMonthlyChart = function({ netPrice, costPerUnit, fixedCosts, unitsPerDay, workDays, factor }) {
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
};

// ═══════════════════════════════════════════════════════
// IMPORTAR DA PRECIFICAÇÃO
// ═══════════════════════════════════════════════════════

window.importFromPricing = function() {
  const r = window._lastResult;
  if (!r) {
    window.showToast('Calcule uma precificação antes de simular!', 'fa-triangle-exclamation');
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

  window.showToast('Dados importados da precificação! ✅', 'fa-file-import');
  window.runSimulator();
};

// ═══════════════════════════════════════════════════════
// INICIALIZAÇÃO
// ═══════════════════════════════════════════════════════

window.initSimulator = function() {
  document.querySelectorAll('.scenario-tab').forEach(btn =>
    btn.addEventListener('click', () => window.runSimulator(btn.dataset.scenario))
  );

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window._lastSimData) window.renderMonthlyChart(window._lastSimData);
    }, 200);
  });
};
