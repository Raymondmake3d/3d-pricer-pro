'use strict';

// ═══════════════════════════════════════════════════════
// DASHBOARD — KPIs & ANALYTICS
// ═══════════════════════════════════════════════════════

const DASHBOARD_KEY = '3dpricer_history';
const GOAL_KEY      = '3dpricer_goal';

window.loadDashboardData = function() {
  try {
    return JSON.parse(localStorage.getItem(DASHBOARD_KEY)) || [];
  } catch {
    return [];
  }
};

// ═══════════════════════════════════════════════════════
// RENDERIZAÇÃO PRINCIPAL
// ═══════════════════════════════════════════════════════

window.renderDashboard = function() {
  const history   = window.loadDashboardData();
  const container = document.getElementById('tab-dashboard');
  if (!container) return;

  if (!history.length) {
    container.innerHTML = `
      <div class="card">
        <div class="result-header">
          <h2><i class="fas fa-chart-pie"></i> Dashboard do Negócio</h2>
          <button class="btn-small" onclick="window.exportDashboardCSV()">
            <i class="fas fa-file-csv"></i> Exportar CSV
          </button>
        </div>
        <div class="tips-placeholder">
          <i class="fas fa-chart-pie"></i>
          <p>Nenhuma precificação salva ainda.<br/>
          Calcule e salve precificações para ver seu dashboard.</p>
        </div>
      </div>`;
    return;
  }

  const kpis = window.calcKPIs(history);

  container.innerHTML = `
    <div class="card">
      <div class="result-header">
        <h2><i class="fas fa-chart-pie"></i> Dashboard do Negócio</h2>
        <button class="btn-small" onclick="window.exportDashboardCSV()">
          <i class="fas fa-file-csv"></i> Exportar CSV
        </button>
      </div>
    </div>
    ${window.renderKPICards(kpis)}
    ${window.renderGoalsCard(kpis)}
    ${window.renderMaterialPerformance(history)}
    ${window.renderMonthlyEvolution(history)}
    <div class="card">
      <h2><i class="fas fa-chart-line"></i> Gráficos de Performance</h2>
      <div class="chart-container">
        <h3>Receita vs Custo Mensal</h3>
        <canvas id="dash-revenue-chart" width="600" height="200"></canvas>
      </div>
      <div class="chart-container">
        <h3>Distribuição de Materiais</h3>
        <canvas id="dash-material-chart" width="200" height="200"></canvas>
        <div id="dash-material-legend" class="chart-legend"></div>
      </div>
      <div class="chart-container">
        <h3>Evolução da Margem (últimas 10 peças)</h3>
        <canvas id="dash-margin-chart" width="600" height="160"></canvas>
      </div>
    </div>
  `;

  // Desenha os gráficos após o HTML ser renderizado
  window.drawRevenueChart(history);
  window.drawMaterialPieChart(history);
  window.drawMarginChart(history);
};

// ═══════════════════════════════════════════════════════
// CÁLCULO DE KPIS
// ═══════════════════════════════════════════════════════

window.calcKPIs = function(history) {
  const totalRevenue = history.reduce((sum, e) => sum + (e.finalPrice * (e.quantity || 1)), 0);
  const totalCost    = history.reduce((sum, e) => sum + (e.directCost * (e.quantity || 1)), 0);
  const totalProfit  = totalRevenue - totalCost;
  const avgMargin    = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const totalPieces  = history.reduce((sum, e) => sum + (e.quantity || 1), 0);

  const monthly = window.buildMonthlyData(history);
  const currentMonth = monthly[monthly.length - 1] || { revenue: 0, profit: 0, count: 0 };

  return {
    totalRevenue,
    totalCost,
    totalProfit,
    avgMargin,
    totalPieces,
    currentMonthRevenue: currentMonth.revenue,
    currentMonthProfit:  currentMonth.profit,
    currentMonthPieces:  currentMonth.count,
  };
};

// ═══════════════════════════════════════════════════════
// RENDERIZAÇÃO DOS CARDS DE KPI
// ═══════════════════════════════════════════════════════

window.renderKPICards = function(kpis) {
  return `
  <div class="dash-kpi-grid">
    <div class="dash-kpi-card blue">
      <div class="kpi-icon"><i class="fas fa-dollar-sign"></i></div>
      <div class="kpi-info">
        <small>Receita Total</small>
        <strong>${window.formatBRL(kpis.totalRevenue)}</strong>
        <span>${kpis.totalPieces} peças vendidas</span>
      </div>
    </div>
    <div class="dash-kpi-card orange">
      <div class="kpi-icon"><i class="fas fa-hand-holding-dollar"></i></div>
      <div class="kpi-info">
        <small>Lucro Total</small>
        <strong>${window.formatBRL(kpis.totalProfit)}</strong>
        <span>Margem média: ${kpis.avgMargin.toFixed(1)}%</span>
      </div>
    </div>
    <div class="dash-kpi-card green">
      <div class="kpi-icon"><i class="fas fa-chart-line"></i></div>
      <div class="kpi-info">
        <small>Receita Mês Atual</small>
        <strong>${window.formatBRL(kpis.currentMonthRevenue)}</strong>
        <span>${kpis.currentMonthPieces} peças</span>
      </div>
    </div>
    <div class="dash-kpi-card neutral">
      <div class="kpi-icon"><i class="fas fa-sack-dollar"></i></div>
      <div class="kpi-info">
        <small>Lucro Mês Atual</small>
        <strong>${window.formatBRL(kpis.currentMonthProfit)}</strong>
        <span>${kpis.currentMonthPieces > 0 ? ((kpis.currentMonthProfit/kpis.currentMonthRevenue)*100).toFixed(1)+'%' : '—'} de margem</span>
      </div>
    </div>
  </div>`;
};

// ═══════════════════════════════════════════════════════
// METAS
// ═══════════════════════════════════════════════════════

window.renderGoalsCard = function(kpis) {
  const goal = JSON.parse(localStorage.getItem(GOAL_KEY)) || { revenue: 0, profit: 0 };
  const revenueProgress = goal.revenue > 0 ? (kpis.currentMonthRevenue / goal.revenue) * 100 : 0;
  const profitProgress  = goal.profit > 0 ? (kpis.currentMonthProfit / goal.profit) * 100 : 0;

  return `
  <div class="card">
    <div class="result-header">
      <h2><i class="fas fa-bullseye"></i> Metas Mensais</h2>
      <button class="btn-small" onclick="window.openGoalModal()">
        <i class="fas fa-cog"></i> Configurar
      </button>
    </div>
    <div class="goal-progress-grid">
      <div class="goal-item">
        <small>Meta de Receita: ${window.formatBRL(goal.revenue)}</small>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width:${Math.min(100, revenueProgress)}%;"></div>
        </div>
        <span>${revenueProgress.toFixed(1)}% atingido</span>
      </div>
      <div class="goal-item">
        <small>Meta de Lucro: ${window.formatBRL(goal.profit)}</small>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width:${Math.min(100, profitProgress)}%;"></div>
        </div>
        <span>${profitProgress.toFixed(1)}% atingido</span>
      </div>
    </div>
  </div>`;
};

window.openGoalModal = function() {
  const goal = JSON.parse(localStorage.getItem(GOAL_KEY)) || { revenue: 0, profit: 0 };
  const modal = document.createElement('div');
  modal.className = 'modal-overlay show'; // Usar a classe 'show' para exibir
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3><i class="fas fa-cog"></i> Configurar Metas Mensais</h3>
        <button onclick="this.closest('.modal-overlay').remove()"><i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body">
        <div class="field">
          <label>Meta de Receita (R$)</label>
          <input type="number" id="goal-revenue" value="${goal.revenue}" min="0" step="100"/>
        </div>
        <div class="field">
          <label>Meta de Lucro (R$)</label>
          <input type="number" id="goal-profit" value="${goal.profit}" min="0" step="100"/>
        </div>
        <button class="btn-calculate" onclick="window.saveGoals()">
          <i class="fas fa-save"></i> Salvar Metas
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);
};

window.saveGoals = function() {
  const revenue = parseFloat(document.getElementById('goal-revenue')?.value) || 0;
  const profit  = parseFloat(document.getElementById('goal-profit')?.value) || 0;
  localStorage.setItem(GOAL_KEY, JSON.stringify({ revenue, profit }));
  document.querySelector('.modal-overlay')?.remove();
  window.renderDashboard();
  window.showToast('Metas salvas com sucesso! 🎯', 'fa-bullseye');
};

// ═══════════════════════════════════════════════════════
// DADOS MENSAIS
// ═══════════════════════════════════════════════════════

window.buildMonthlyData = function(history) {
  const monthlyMap = {};
  history.forEach(e => {
    const date = new Date(e.timestamp);
    const month = date.toLocaleString('pt-BR', { month: 'short', year: 'numeric' });
    if (!monthlyMap[month]) {
      monthlyMap[month] = { revenue: 0, cost: 0, profit: 0, count: 0, label: month };
    }
    monthlyMap[month].revenue += (e.finalPrice * (e.quantity || 1));
    monthlyMap[month].cost    += (e.directCost * (e.quantity || 1));
    monthlyMap[month].profit  += ((e.finalPrice - e.directCost) * (e.quantity || 1));
    monthlyMap[month].count   += (e.quantity || 1);
  });
  return Object.values(monthlyMap);
};

// ═══════════════════════════════════════════════════════
// PERFORMANCE POR MATERIAL
// ═══════════════════════════════════════════════════════

window.renderMaterialPerformance = function(history) {
  const materialMap = {};
  history.forEach(e => {
    const mat = e.materialType || 'Outro';
    if (!materialMap[mat]) {
      materialMap[mat] = { revenue: 0, profit: 0, count: 0, material: mat };
    }
    materialMap[mat].revenue += (e.finalPrice * (e.quantity || 1));
    materialMap[mat].profit  += ((e.finalPrice - e.directCost) * (e.quantity || 1));
    materialMap[mat].count   += (e.quantity || 1);
  });

  const materialData = Object.values(materialMap).sort((a, b) => b.revenue - a.revenue);
  if (!materialData.length) return '';

  const maxRev = Math.max(...materialData.map(d => d.revenue), 1);

  const rows = materialData.map(d => `
    <tr>
      <td><strong>${d.material}</strong></td>
      <td>${d.count}</td>
      <td>${window.formatBRL(d.revenue)}</td>
      <td style="color:${d.profit >= 0 ? '#27ae60' : '#e74c3c'};font-weight:700">
        ${window.formatBRL(d.profit)}
      </td>
      <td>
        <div class="mat-bar-bg">
          <div class="mat-bar-fill"
               style="width:${Math.min(100,(d.revenue/maxRev)*100)}%"></div>
        </div>
      </td>
    </tr>`).join('');

  return `
  <div class="card">
    <h2><i class="fas fa-layer-group"></i> Performance por Material</h2>
    <div style="overflow-x:auto">
      <table class="dash-table">
        <thead>
          <tr>
            <th>Material</th><th>Peças</th>
            <th>Receita</th><th>Lucro</th><th>Volume</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>`;
};

// ═══════════════════════════════════════════════════════
// EVOLUÇÃO MENSAL
// ═══════════════════════════════════════════════════════

window.renderMonthlyEvolution = function(history) {
  const monthly = window.buildMonthlyData(history);
  if (!monthly.length) return '';

  const rows = monthly.map(m => `
    <tr>
      <td><strong>${m.label}</strong></td>
      <td>${m.count} peças</td>
      <td>${window.formatBRL(m.revenue)}</td>
      <td>${window.formatBRL(m.cost)}</td>
      <td style="color:${m.profit >= 0 ? '#27ae60' : '#e74c3c'};font-weight:700">
        ${window.formatBRL(m.profit)}
      </td>
      <td>${m.revenue > 0 ? ((m.profit/m.revenue)*100).toFixed(1)+'%' : '—'}</td>
    </tr>`).join('');

  return `
  <div class="card">
    <h2><i class="fas fa-calendar-days"></i> Evolução Mensal</h2>
    <div style="overflow-x:auto">
      <table class="dash-table">
        <thead>
          <tr>
            <th>Mês</th><th>Peças</th><th>Receita</th>
            <th>Custo</th><th>Lucro</th><th>Margem</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>`;
};

// ═══════════════════════════════════════════════════════
// GRÁFICO: RECEITA VS CUSTO
// ═══════════════════════════════════════════════════════

window.drawRevenueChart = function(history) {
  const canvas = document.getElementById('dash-revenue-chart');
  if (!canvas) return;

  const monthly = window.buildMonthlyData(history);
  if (!monthly.length) return;

  canvas.width  = canvas.offsetWidth || 600;
  canvas.height = 200;

  const ctx  = canvas.getContext('2d');
  const W    = canvas.width;
  const H    = canvas.height;
  const pL=55, pR=20, pT=20, pB=35;
  const cW   = W - pL - pR;
  const cH   = H - pT - pB;
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';

  ctx.clearRect(0, 0, W, H);

  const maxVal  = Math.max(...monthly.map(m => m.revenue), 1);
  const barGrpW = cW / monthly.length;
  const barW    = barGrpW * 0.3;

  // Grid
  for (let i = 0; i <= 4; i++) {
    const y   = pT + (cH/4) * i;
    const val = maxVal * (1 - i/4);
    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(pL,y); ctx.lineTo(W-pR,y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle    = dark ? '#64748b' : '#94a3b8';
    ctx.font         = '9px Poppins,sans-serif';
    ctx.textAlign    = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(val >= 1000 ? `R$${(val/1000).toFixed(1)}k` : `R$${val.toFixed(0)}`, pL-5, y);
  }

  // Barras
  monthly.forEach((m, i) => {
    const cx   = pL + barGrpW * i + barGrpW / 2;
    const zero = pT + cH;
    const rH   = (m.revenue / maxVal) * cH;
    const cHH  = (m.cost    / maxVal) * cH;

    ctx.fillStyle = 'rgba(44,74,124,0.8)';
    ctx.beginPath();
    ctx.roundRect
      ? ctx.roundRect(cx-barW-2, zero-rH, barW, rH, [4,4,0,0])
      : ctx.rect(cx-barW-2, zero-rH, barW, rH);
    ctx.fill();

    ctx.fillStyle = 'rgba(231,76,60,0.65)';
    ctx.beginPath();
    ctx.roundRect
      ? ctx.roundRect(cx+2, zero-cHH, barW, cHH, [4,4,0,0])
      : ctx.rect(cx+2, zero-cHH, barW, cHH);
    ctx.fill();

    ctx.fillStyle    = dark ? '#64748b' : '#94a3b8';
    ctx.font         = '9px Poppins,sans-serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(m.label, cx, H - pB + 6);
  });

  // Legenda
  [['rgba(44,74,124,0.8)','Receita'],['rgba(231,76,60,0.65)','Custo']].reduce((lx, [color, label]) => {
    ctx.fillStyle    = color;
    ctx.fillRect(lx, 4, 12, 10);
    ctx.fillStyle    = dark ? '#94a3b8' : '#718096';
    ctx.font         = '9px Poppins,sans-serif';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, lx+15, 9);
    return lx + ctx.measureText(label).width + 32;
  }, pL);
};

// ═══════════════════════════════════════════════════════
// GRÁFICO: PIZZA DE MATERIAIS
// ═══════════════════════════════════════════════════════

window.drawMaterialPieChart = function(history) {
  const canvas = document.getElementById('dash-material-chart');
  if (!canvas) return;

  const map = {};
  history.forEach(e => { const m = e.materialType||'N/A'; map[m]=(map[m]||0)+1; });

  const colors  = ['#2c4a7c','#f07b30','#f5c842','#27ae60','#e74c3c','#9b59b6','#3d6199','#e67e22'];
  const entries = Object.entries(map).sort((a,b)=>b[1]-a[1]);
  const total   = entries.reduce((s,[,v])=>s+v,0);
  const ctx     = canvas.getContext('2d');
  const W=canvas.width, H=canvas.height, cx=W/2, cy=H/2;
  const radius  = Math.min(W,H)/2 - 8;
  const dark    = document.documentElement.getAttribute('data-theme') === 'dark';

  ctx.clearRect(0, 0, W, H);

  let startAngle = -Math.PI/2;
  entries.forEach(([, count], i) => {
    const slice    = (count/total) * 2 * Math.PI;
    const endAngle = startAngle + slice;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle   = colors[i % colors.length];
    ctx.strokeStyle = dark ? '#1a2a3e' : '#ffffff';
    ctx.lineWidth   = 3;
    ctx.fill(); ctx.stroke();

    if ((count/total)*100 > 6) {
      const mid = startAngle + slice/2;
      ctx.fillStyle    = '#fff';
      ctx.font         = 'bold 10px Poppins,sans-serif';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${((count/total)*100).toFixed(0)}%`,
        cx + radius * 0.65 * Math.cos(mid),
        cy + radius * 0.65 * Math.sin(mid));
    }

    startAngle = endAngle;
  });

  // Donut
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.42, 0, 2*Math.PI);
  ctx.fillStyle = dark ? '#1a2a3e' : '#ffffff';
  ctx.fill();
  ctx.fillStyle='#1a2a4a'; ctx.font='bold 10px Poppins,sans-serif';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(`${total}`, cx, cy-6);
  ctx.font='9px Poppins,sans-serif'; ctx.fillStyle='#718096';
  ctx.fillText('peças', cx, cy+7);

  const legend = document.getElementById('dash-material-legend');
  if (legend) {
    legend.innerHTML = entries.map(([mat, count], i) => `
      <div class="legend-item">
        <span class="legend-dot" style="background:${colors[i%colors.length]}"></span>
        ${mat} (${count})
      </div>`).join('');
  }
};

// ═══════════════════════════════════════════════════════
// GRÁFICO: MARGEM
// ═══════════════════════════════════════════════════════

window.drawMarginChart = function(history) {
  const canvas = document.getElementById('dash-margin-chart');
  if (!canvas) return;

  canvas.width  = canvas.offsetWidth || 600;
  canvas.height = 160;

  const ctx  = canvas.getContext('2d');
  const W    = canvas.width;
  const H    = canvas.height;
  const pL=45, pR=20, pT=20, pB=30;
  const cW   = W - pL - pR;
  const cH   = H - pT - pB;
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';

  ctx.clearRect(0, 0, W, H);

  const data = [...history].reverse().slice(0,10).reverse();
  if (data.length < 2) return;

  const margins = data.map(e => e.profitMargin || 0);
  const maxM    = Math.max(...margins, 50);
  const stepX   = cW / (data.length - 1);

  [0,20,40,60,80,100].filter(v => v <= maxM + 5).forEach(v => {
    const y = pT + cH - (v/maxM) * cH;
    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    ctx.lineWidth=1; ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(pL,y); ctx.lineTo(W-pR,y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle=dark?'#64748b':'#94a3b8';
    ctx.font='9px Poppins,sans-serif'; ctx.textAlign='right'; ctx.textBaseline='middle';
    ctx.fillText(`${v}%`, pL-5, y);
  });

  // Área
  ctx.beginPath();
  data.forEach((e, i) => {
    const x = pL + i * stepX;
    const y = pT + cH - ((e.profitMargin||0)/maxM) * cH;
    i === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
  });
  ctx.lineTo(pL+(data.length-1)*stepX, pT+cH);
  ctx.lineTo(pL, pT+cH);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0,pT,0,pT+cH);
  grad.addColorStop(0,'rgba(240,123,48,0.35)');
  grad.addColorStop(1,'rgba(240,123,48,0.02)');
  ctx.fillStyle=grad; ctx.fill();

  // Linha
  ctx.beginPath();
  data.forEach((e, i) => {
    const x = pL + i * stepX;
    const y = pT + cH - ((e.profitMargin||0)/maxM) * cH;
    i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
  });
  ctx.strokeStyle='#f07b30'; ctx.lineWidth=2.5; ctx.lineJoin='round'; ctx.stroke();

  // Pontos
  const bg = dark ? '#1a2a3e' : '#ffffff';
  data.forEach((e, i) => {
    const x = pL + i * stepX;
    const y = pT + cH - ((e.profitMargin||0)/maxM) * cH;
    ctx.beginPath(); ctx.arc(x,y,4,0,2*Math.PI);
    ctx.fillStyle='#f07b30'; ctx.strokeStyle=bg; ctx.lineWidth=2;
    ctx.fill(); ctx.stroke();
  });
};

// ═══════════════════════════════════════════════════════
// EXPORTAR CSV
// ═══════════════════════════════════════════════════════

window.exportDashboardCSV = function() {
  const history = window.loadDashboardData();
  if (!history.length) {
    window.showToast('Nenhum dado para exportar!', 'fa-triangle-exclamation');
    return;
  }

  const header = [
    'Data','Impressora','Material','Peso(g)',
    'Tempo(h)','Custo(R$)','Preço Final(R$)',
    'Lucro(R$)','Margem(%)','Quantidade'
  ].join(';');

  const rows = history.map(e => [
    e.date,
    e.printerName  || '',
    e.materialType || '',
    e.partWeight   || 0,
    e.printHours   || 0,
    (e.directCost  || 0).toFixed(2).replace('.',','),
    (e.finalPrice  || 0).toFixed(2).replace('.',','),
    ((e.finalPrice - e.directCost)||0).toFixed(2).replace('.',','),
    (e.profitMargin||0).toFixed(1).replace('.',','),
    e.quantity || 1,
  ].join(';')).join('\n');

  const blob = new Blob(['\uFEFF'+header+'\n'+rows], { type:'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href:url, download:`3dpricer-${new Date().toISOString().slice(0,10)}.csv` });
  a.click();
  URL.revokeObjectURL(url);
  window.showToast('CSV exportado com sucesso!', 'fa-file-csv');
};
