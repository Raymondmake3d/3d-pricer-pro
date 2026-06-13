'use strict';

// ═══════════════════════════════════════════════════════
// DASHBOARD — KPIs & ANALYTICS
// ═══════════════════════════════════════════════════════

const DASHBOARD_KEY = '3dpricer_history';
const GOAL_KEY      = '3dpricer_goal';

function loadDashboardData() {
  try {
    return JSON.parse(localStorage.getItem(DASHBOARD_KEY)) || [];
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════
// RENDERIZAÇÃO PRINCIPAL
// ═══════════════════════════════════════════════════════

function renderDashboard() {
  const history   = loadDashboardData();
  const container = document.getElementById('tab-dashboard');
  if (!container) return;

  if (!history.length) {
    container.innerHTML = `
      <div class="card">
        <div class="result-header">
          <h2><i class="fas fa-chart-pie"></i> Dashboard do Negócio</h2>
          <button class="btn-small" onclick="exportDashboardCSV()">
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

  const kpis = calcKPIs(history);

  container.innerHTML = `
    <div class="card">
      <div class="result-header">
        <h2><i class="fas fa-chart-pie"></i> Dashboard do Negócio</h2>
        <button class="btn-small" onclick="exportDashboardCSV()">
          <i class="fas fa-file-csv"></i> Exportar CSV
        </button>
      </div>
    </div>
    ${renderKPICards(kpis)}
    ${renderGoalSection(kpis)}
    ${renderChartsSection()}
    ${renderTopPiecesSection(history)}
    ${renderMaterialBreakdown(history)}
    ${renderMonthlyEvolution(history)}
  `;

  setTimeout(() => {
    drawRevenueChart(history);
    drawMaterialPieChart(history);
    drawMarginChart(history);
  }, 50);
}

// ═══════════════════════════════════════════════════════
// CÁLCULO DE KPIs
// ═══════════════════════════════════════════════════════

function calcKPIs(history) {
  const total        = history.length;
  const totalRevenue = history.reduce((s, e) => s + (e.finalPrice  * (e.quantity || 1)), 0);
  const totalCost    = history.reduce((s, e) => s + (e.directCost  * (e.quantity || 1)), 0);
  const totalProfit  = totalRevenue - totalCost;
  const avgMargin    = history.reduce((s, e) => s + (e.profitMargin || 0), 0) / total;
  const avgPrice     = totalRevenue / total;
  const avgCost      = totalCost    / total;

  const sorted     = [...history].sort((a, b) => b.finalPrice - a.finalPrice);
  const bestPiece  = sorted[0];

  const materialCount = {};
  history.forEach(e => {
    const m = e.materialType || 'N/A';
    materialCount[m] = (materialCount[m] || 0) + 1;
  });
  const topMaterial = Object.entries(materialCount)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

  const now        = Date.now();
  const last30     = history.filter(e => (now - e.id) < 30 * 24 * 60 * 60 * 1000);
  const rev30      = last30.reduce((s, e) => s + (e.finalPrice * (e.quantity || 1)), 0);

  return {
    total, totalRevenue, totalCost, totalProfit,
    avgMargin, avgPrice, avgCost,
    bestPiece, topMaterial,
    rev30, last30Count: last30.length,
    materialCount,
  };
}

function buildMonthlyData(history) {
  const map = {};
  history.forEach(e => {
    const d   = new Date(e.id);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    if (!map[key]) map[key] = { revenue:0, cost:0, count:0 };
    map[key].revenue += e.finalPrice * (e.quantity || 1);
    map[key].cost    += e.directCost * (e.quantity || 1);
    map[key].count++;
  });

  return Object.entries(map)
    .sort(([a],[b]) => a.localeCompare(b))
    .slice(-6)
    .map(([key, val]) => ({
      label:   formatMonthLabel(key),
      revenue: val.revenue,
      cost:    val.cost,
      profit:  val.revenue - val.cost,
      count:   val.count,
    }));
}

function formatMonthLabel(key) {
  const [year, month] = key.split('-');
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun',
                   'Jul','Ago','Set','Out','Nov','Dez'];
  return `${months[parseInt(month)-1]}/${year.slice(2)}`;
}

// ═══════════════════════════════════════════════════════
// KPI CARDS
// ═══════════════════════════════════════════════════════

function renderKPICards(k) {
  const profitColor = k.totalProfit >= 0 ? '#27ae60' : '#e74c3c';
  const profitIcon  = k.totalProfit >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';

  return `
  <div class="dash-kpi-grid">
    <div class="dash-kpi-card blue">
      <div class="kpi-icon"><i class="fas fa-receipt"></i></div>
      <div class="kpi-info">
        <small>Total de Precificações</small>
        <strong>${k.total}</strong>
        <span>${k.last30Count} nos últimos 30 dias</span>
      </div>
    </div>
    <div class="dash-kpi-card orange">
      <div class="kpi-icon"><i class="fas fa-dollar-sign"></i></div>
      <div class="kpi-info">
        <small>Receita Total Acumulada</small>
        <strong>${formatBRL(k.totalRevenue)}</strong>
        <span>Últimos 30d: ${formatBRL(k.rev30)}</span>
      </div>
    </div>
    <div class="dash-kpi-card green">
      <div class="kpi-icon"><i class="fas ${profitIcon}"></i></div>
      <div class="kpi-info">
        <small>Lucro Total Acumulado</small>
        <strong style="color:${profitColor}">${formatBRL(k.totalProfit)}</strong>
        <span>Margem média: ${k.avgMargin.toFixed(1)}%</span>
      </div>
    </div>
    <div class="dash-kpi-card neutral">
      <div class="kpi-icon"><i class="fas fa-tag"></i></div>
      <div class="kpi-info">
        <small>Ticket Médio por Peça</small>
        <strong>${formatBRL(k.avgPrice)}</strong>
        <span>Custo médio: ${formatBRL(k.avgCost)}</span>
      </div>
    </div>
    <div class="dash-kpi-card neutral">
      <div class="kpi-icon"><i class="fas fa-layer-group"></i></div>
      <div class="kpi-info">
        <small>Material Mais Usado</small>
        <strong>${k.topMaterial}</strong>
        <span>${k.materialCount[k.topMaterial] || 0} precificações</span>
      </div>
    </div>
    <div class="dash-kpi-card neutral">
      <div class="kpi-icon"><i class="fas fa-trophy"></i></div>
      <div class="kpi-info">
        <small>Peça com Maior Preço</small>
        <strong>${formatBRL(k.bestPiece?.finalPrice || 0)}</strong>
        <span>${k.bestPiece?.materialType || '—'} · ${k.bestPiece?.partWeight || 0}g</span>
      </div>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════
// META MENSAL
// ═══════════════════════════════════════════════════════

function renderGoalSection(kpis) {
  const savedGoal = parseFloat(localStorage.getItem(GOAL_KEY)) || 0;
  const progress  = savedGoal > 0 ? Math.min(100, (kpis.rev30 / savedGoal) * 100) : 0;
  const remaining = Math.max(0, savedGoal - kpis.rev30);
  const barColor  = progress >= 100
    ? 'linear-gradient(90deg,#27ae60,#2ecc71)'
    : 'linear-gradient(90deg,var(--orange),var(--yellow))';

  return `
  <div class="card dash-goal-card">
    <div class="result-header">
      <h2><i class="fas fa-bullseye"></i> Meta Mensal de Faturamento</h2>
      <div style="display:flex;gap:0.6rem;align-items:center;">
        <input type="number" id="goal-input" placeholder="Meta R$"
               value="${savedGoal || ''}"
               style="width:130px;padding:0.45rem 0.7rem;border:2px solid var(--border);
                      border-radius:8px;font-family:Poppins,sans-serif;font-size:0.88rem;
                      background:var(--light-gray);color:var(--text);"
               oninput="updateGoal(this.value)"/>
        <span style="font-size:0.8rem;color:var(--text-muted)">R$/mês</span>
      </div>
    </div>
    <div class="goal-progress-wrapper">
      <div class="goal-bar-bg">
        <div class="goal-bar-fill" style="width:${progress}%;background:${barColor}"></div>
      </div>
      <div class="goal-labels">
        <span>${formatBRL(kpis.rev30)} realizados</span>
        <span>${progress.toFixed(1)}%</span>
        <span>${savedGoal > 0
          ? (remaining > 0 ? `Faltam ${formatBRL(remaining)}` : '🎉 Meta atingida!')
          : 'Defina sua meta'}</span>
      </div>
    </div>
    <div class="goal-cards">
      <div class="goal-mini">
        <small>Realizado (30d)</small>
        <strong>${formatBRL(kpis.rev30)}</strong>
      </div>
      <div class="goal-mini">
        <small>Meta</small>
        <strong>${savedGoal > 0 ? formatBRL(savedGoal) : '—'}</strong>
      </div>
      <div class="goal-mini">
        <small>Progresso</small>
        <strong>${savedGoal > 0 ? progress.toFixed(1)+'%' : '—'}</strong>
      </div>
      <div class="goal-mini">
        <small>Faltam</small>
        <strong>${savedGoal > 0 ? formatBRL(remaining) : '—'}</strong>
      </div>
    </div>
  </div>`;
}

function updateGoal(value) {
  localStorage.setItem(GOAL_KEY, parseFloat(value) || 0);
  renderDashboard();
}

// ═══════════════════════════════════════════════════════
// SEÇÃO DE GRÁFICOS
// ═══════════════════════════════════════════════════════

function renderChartsSection() {
  return `
  <div class="dash-charts-row">
    <div class="card dash-chart-card">
      <h2><i class="fas fa-chart-bar"></i> Receita vs Custo por Mês</h2>
      <canvas id="dash-revenue-chart" height="200"></canvas>
    </div>
    <div class="card dash-chart-card">
      <h2><i class="fas fa-chart-pie"></i> Distribuição por Material</h2>
      <canvas id="dash-material-chart" width="220" height="220"
              style="max-width:220px;margin:0 auto;display:block;"></canvas>
      <div id="dash-material-legend" class="chart-legend" style="margin-top:0.8rem;"></div>
    </div>
  </div>
  <div class="card">
    <h2><i class="fas fa-percent"></i> Evolução da Margem de Lucro</h2>
    <canvas id="dash-margin-chart" height="160"></canvas>
  </div>`;
}

// ═══════════════════════════════════════════════════════
// TOP 5 PEÇAS
// ═══════════════════════════════════════════════════════

function renderTopPiecesSection(history) {
  const sorted = [...history]
    .sort((a, b) => {
      const pA = (a.finalPrice - a.directCost) * (a.quantity || 1);
      const pB = (b.finalPrice - b.directCost) * (b.quantity || 1);
      return pB - pA;
    })
    .slice(0, 5);

  const medals = ['🥇','🥈','🥉','4️⃣','5️⃣'];

  const rows = sorted.map((e, i) => {
    const profit = (e.finalPrice - e.directCost) * (e.quantity || 1);
    return `
    <div class="top-piece-row">
      <span class="top-rank">${medals[i]}</span>
      <div class="top-info">
        <strong>${e.printerName || 'Peça'}</strong>
        <small>${e.materialType || '—'} · ${e.partWeight || 0}g · ${e.printHours || 0}h</small>
      </div>
      <div class="top-values">
        <span class="top-price">${formatBRL(e.finalPrice)}</span>
        <span class="top-profit">+${formatBRL(profit)}</span>
        <span class="top-margin">${(e.profitMargin || 0).toFixed(1)}%</span>
      </div>
    </div>`;
  }).join('');

  return `
  <div class="card">
    <h2><i class="fas fa-trophy"></i> Top 5 — Peças Mais Lucrativas</h2>
    <div class="top-pieces-header">
      <span>Peça</span><span>Preço</span><span>Lucro</span><span>Margem</span>
    </div>
    ${rows}
  </div>`;
}

// ═══════════════════════════════════════════════════════
// BREAKDOWN POR MATERIAL
// ═══════════════════════════════════════════════════════

function renderMaterialBreakdown(history) {
  const map = {};
  history.forEach(e => {
    const m = e.materialType || 'N/A';
    if (!map[m]) map[m] = { count:0, revenue:0, profit:0 };
    map[m].count++;
    map[m].revenue += e.finalPrice  * (e.quantity || 1);
    map[m].profit  += (e.finalPrice - e.directCost) * (e.quantity || 1);
  });

  const maxRev = Math.max(...Object.values(map).map(x => x.revenue), 1);

  const rows = Object.entries(map)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .map(([mat, d]) => `
      <tr>
        <td><strong>${mat}</strong></td>
        <td>${d.count}</td>
        <td>${formatBRL(d.revenue)}</td>
        <td style="color:${d.profit >= 0 ? '#27ae60' : '#e74c3c'};font-weight:700">
          ${formatBRL(d.profit)}
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
}

// ═══════════════════════════════════════════════════════
// EVOLUÇÃO MENSAL
// ═══════════════════════════════════════════════════════

function renderMonthlyEvolution(history) {
  const monthly = buildMonthlyData(history);
  if (!monthly.length) return '';

  const rows = monthly.map(m => `
    <tr>
      <td><strong>${m.label}</strong></td>
      <td>${m.count} peças</td>
      <td>${formatBRL(m.revenue)}</td>
      <td>${formatBRL(m.cost)}</td>
      <td style="color:${m.profit >= 0 ? '#27ae60' : '#e74c3c'};font-weight:700">
        ${formatBRL(m.profit)}
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
}

// ═══════════════════════════════════════════════════════
// GRÁFICO: RECEITA VS CUSTO
// ═══════════════════════════════════════════════════════

function drawRevenueChart(history) {
  const canvas = document.getElementById('dash-revenue-chart');
  if (!canvas) return;

  const monthly = buildMonthlyData(history);
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
}

// ═══════════════════════════════════════════════════════
// GRÁFICO: PIZZA DE MATERIAIS
// ═══════════════════════════════════════════════════════

function drawMaterialPieChart(history) {
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
}

// ═══════════════════════════════════════════════════════
// GRÁFICO: MARGEM
// ═══════════════════════════════════════════════════════

function drawMarginChart(history) {
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
}

// ═══════════════════════════════════════════════════════
// EXPORTAR CSV
// ═══════════════════════════════════════════════════════

function exportDashboardCSV() {
  const history = loadDashboardData();
  if (!history.length) {
    showToast('Nenhum dado para exportar!', 'fa-triangle-exclamation');
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
  showToast('CSV exportado com sucesso!', 'fa-file-csv');
}
