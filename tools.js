'use strict';

// ═══════════════════════════════════════════════════════
// TOOLS.JS — Ferramentas do 3D Pricer Pro
// ═══════════════════════════════════════════════════════
// 1. Calculadora de Spool Restante
// 2. Comparador de Plataformas de Venda
// 3. Alertas de Orçamentos Pendentes
// 4. Relatório Mensal em PDF
// ═══════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════
// 1. CALCULADORA DE SPOOL RESTANTE
// ═══════════════════════════════════════════════════════

window.calcSpoolRemaining = function() {
  const total    = parseFloat(document.getElementById('spool-total')?.value)     || 0;
  const used     = parseFloat(document.getElementById('spool-used')?.value)      || 0;
  const perPiece = parseFloat(document.getElementById('spool-per-piece')?.value) || 0;
  const price    = parseFloat(document.getElementById('spool-price')?.value)     || 0;

  if (total <= 0) return;

  const remaining  = Math.max(0, total - used);
  const pct        = (used / total) * 100;
  const pieces     = perPiece > 0 ? Math.floor(remaining / perPiece) : 0;
  const valueLeft  = price > 0 ? (remaining / total) * price : 0;
  // const pricePerG  = price > 0 ? price / total : 0; // Não usado, pode ser removido

  // Status
  let status, alert, cardColor;
  if (pct >= 90) {
    status = '🔴 Crítico';
    alert  = 'Compre material agora!';
    cardColor = '#e74c3c';
  } else if (pct >= 70) {
    status = '🟠 Atenção';
    alert  = 'Filamento acabando em breve';
    cardColor = '#f07b30';
  } else if (pct >= 40) {
    status = '🟡 Moderado';
    alert  = 'Monitore o consumo';
    cardColor = '#f5c842';
  } else {
    status = '🟢 OK';
    alert  = 'Material em bom nível';
    cardColor = '#27ae60';
  }

  // Atualiza elementos
  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setText('spool-r-remaining', `${remaining.toFixed(0)}g`);
  setText('spool-r-pct',       `${(100 - pct).toFixed(1)}% restante`);
  setText('spool-r-pieces',    pieces.toLocaleString('pt-BR'));
  setText('spool-r-value',     window.formatBRL(valueLeft)); // Usando window.formatBRL
  setText('spool-r-status',    status);
  setText('spool-r-alert',     alert);
  setText('spool-bar-label',   `${pct.toFixed(1)}% usado`);

  // Barra visual
  const bar = document.getElementById('spool-bar-used');
  if (bar) {
    bar.style.width = `${Math.min(100, pct)}%`;
    bar.style.background = pct >= 90
      ? 'linear-gradient(90deg,#e74c3c,#c0392b)'
      : pct >= 70
        ? 'linear-gradient(90deg,#f07b30,#e74c3c)'
        : pct >= 40
          ? 'linear-gradient(90deg,#f5c842,#f07b30)'
          : 'linear-gradient(90deg,#27ae60,#2ecc71)';
  }

  // Card de status com cor dinâmica
  const statusCard = document.querySelector('#spool-result .dash-kpi-card.neutral');
  if (statusCard) {
    statusCard.style.borderColor = cardColor;
    statusCard.style.borderWidth = '2px';
    statusCard.style.borderStyle = 'solid';
  }

  document.getElementById('spool-result')?.classList.remove('hidden');
};

// ═══════════════════════════════════════════════════════
// 2. COMPARADOR DE PLATAFORMAS
// ═══════════════════════════════════════════════════════

const PLATFORMS = [
  {
    name:    'Venda Direta',
    icon:    '🤝',
    fee:     0,
    color:   '#27ae60',
    desc:    'Instagram, WhatsApp',
  },
  {
    name:    'Shopee',
    icon:    '🛍️',
    fee:     14,
    color:   '#f07b30',
    desc:    'Taxa ~14% + frete',
  },
  {
    name:    'Mercado Livre',
    icon:    '🛒',
    fee:     16,
    color:   '#f5c842',
    desc:    'Taxa ~16% + envio',
  },
  {
    name:    'Etsy',
    icon:    '🎨',
    fee:     10,
    color:   '#e74c3c',
    desc:    'Taxa ~10% + listagem',
  },
  {
    name:    'Amazon',
    icon:    '📦',
    fee:     15,
    color:   '#9b59b6',
    desc:    'Taxa ~15% referral',
  },
  {
    name:    'Elo7',
    icon:    '🖼️',
    fee:     12,
    color:   '#3d6199',
    desc:    'Taxa ~12% artesanato',
  },
];

window.calcPlatformComparator = function() {
  const cost     = parseFloat(document.getElementById('plat-cost')?.value)     || 0;
  const margin   = parseFloat(document.getElementById('plat-margin')?.value)   || 0;
  const tax      = parseFloat(document.getElementById('plat-tax')?.value)      || 0;
  const shipping = parseFloat(document.getElementById('plat-shipping')?.value) || 0;

  if (cost <= 0 || margin <= 0) return;

  const baseWithTax  = cost * (1 + tax / 100) + shipping;
  const cards        = window.buildPlatformCards(baseWithTax, margin, PLATFORMS); // Usando window.buildPlatformCards

  const grid = document.getElementById('platform-cards-grid');
  if (grid) grid.innerHTML = cards;

  document.getElementById('platform-result')?.classList.remove('hidden');
};

window.buildPlatformCards = function(base, margin, platforms) {
  // Encontra melhor plataforma
  const results = platforms.map(p => {
    const salePrice   = (base / (1 - margin/100)) / (1 - p.fee/100);
    const profit      = salePrice * (1 - p.fee/100) - base;
    const effectiveMg = (profit / salePrice) * 100;
    return { ...p, salePrice, profit, effectiveMg };
  });

  const best = results.reduce((a, b) => a.profit > b.profit ? a : b);

  return results.map(p => {
    const isBest = p.name === best.name;
    return `
    <div class="platform-card ${isBest ? 'platform-best' : ''}">
      ${isBest ? '<div class="platform-best-badge">⭐ Melhor opção</div>' : ''}
      <div class="platform-icon">${p.icon}</div>
      <div class="platform-name">${p.name}</div>
      <div class="platform-desc" style="color:var(--text-muted);font-size:0.75rem;">
        ${p.desc}
      </div>
      <div class="platform-fee" style="color:${p.color};font-weight:700;
           font-size:0.8rem;margin:0.4rem 0;">
        Taxa: ${p.fee}%
      </div>
      <div class="platform-price">
        <small>Preço de venda</small>
        <strong style="color:${p.color}">${window.formatBRL(p.salePrice)}</strong>
      </div>
      <div class="platform-profit">
        <small>Lucro líquido</small>
        <span style="color:${p.profit >= 0 ? '#27ae60' : '#e74c3c'};font-weight:700;">
          ${window.formatBRL(p.profit)}
        </span>
      </div>
      <div class="platform-margin">
        <small>Margem efetiva</small>
        <span style="color:var(--orange);font-weight:600;font-size:0.85rem;">
          ${p.effectiveMg.toFixed(1)}%
        </span>
      </div>
    </div>`;
  }).join('');
};

// Versão usada no resultado da precificação (após calcular)
window.renderPlatformComparatorInResult = function(r) {
  const grid = document.getElementById('platform-comparator-grid');
  if (!grid || !r) return;

  const base = r.directCost * (1 + (r.taxRate||0)/100) + (r.packagingCost||0);
  const margin = r.profitMargin || 40;
  grid.innerHTML = window.buildPlatformCards(base, margin, PLATFORMS);
};

// ═══════════════════════════════════════════════════════
// 3. ALERTAS DE ORÇAMENTOS PENDENTES
// ═══════════════════════════════════════════════════════

window.renderPendingAlerts = function() {
  const container = document.getElementById('pending-alerts-container');
  if (!container) return;

  // Assumindo loadQuotes e loadClients estão em clients.js
  const quotes  = window.loadQuotes();
  const clients = window.loadClients();

  const now     = Date.now();
  const DAY_MS  = 24 * 60 * 60 * 1000;

  // Filtra pendentes e calcula dias
  const pending = quotes
    .filter(q => q.status === 'pending')
    .map(q => {
      const createdAt = new Date(q.dateTime || q.date).getTime() || now;
      const days      = Math.floor((now - createdAt) / DAY_MS);
      const client    = clients.find(c => c.id === q.clientId);
      return { ...q, days, clientPhone: client?.phone || '' };
    })
    .sort((a, b) => b.days - a.days);

  // Atualiza badge na aba Clientes
  window.updateClientsBadge(pending.length); // Usando window.updateClientsBadge

  if (!pending.length) {
    container.innerHTML = `
      <div class="tips-placeholder">
        <i class="fas fa-check-circle" style="color:#27ae60"></i>
        <p>Nenhum orçamento pendente! Todos resolvidos. ✅</p>
      </div>`;
    return;
  }

  container.innerHTML = pending.map(q => {
    const urgency = q.days >= 7
      ? { color:'#e74c3c', icon:'🔴', label:'Urgente' }
      : q.days >= 3
        ? { color:'#f07b30', icon:'🟠', label:'Atenção' }
        : { color:'#f5c842', icon:'🟡', label:'Recente' };

    const waText = encodeURIComponent(
      `Olá, ${q.clientName}! Tudo bem?\n\n` +
      `Gostaria de saber se teve a chance de analisar nosso orçamento de ` +
      `${window.formatBRL(q.batchPrice || q.finalPrice)} enviado em ${q.date}.\n\n` +
      `Fico à disposição para qualquer dúvida! 😊`
    );

    return `
    <div class="alert-card" style="border-left:4px solid ${urgency.color};">
      <div class="alert-card-header">
        <div>
          <span style="font-size:1.1rem;">${urgency.icon}</span>
          <strong style="color:var(--dark-blue);margin-left:0.4rem;">
            ${q.clientName}
          </strong>
          <span class="history-material" style="background:rgba(231,76,60,0.1);
                color:${urgency.color};margin-left:0.5rem;">
            ${urgency.label}
          </span>
        </div>
        <div style="font-weight:700;color:var(--orange);font-size:1rem;">
          ${window.formatBRL(q.batchPrice || q.finalPrice)}
        </div>
      </div>
      <div class="alert-card-meta">
        <span><i class="fas fa-calendar"></i> Enviado: ${q.date}</span>
        <span><i class="fas fa-clock"></i>
          ${q.days === 0 ? 'Hoje' : `Há ${q.days} dia${q.days > 1 ? 's' : ''}`}
        </span>
        <span><i class="fas fa-layer-group"></i> ${q.materialType}</span>
        <span><i class="fas fa-boxes-stacked"></i> ${q.quantity}x</span>
      </div>
      <div class="alert-card-actions">
        ${q.clientPhone ? `
        <a href="https://wa.me/55${q.clientPhone.replace(/\D/g,'')}?text=${waText}"
           target="_blank" class="btn-small">
          <i class="fab fa-whatsapp" style="color:#25d366"></i> Seguir up
        </a>` : `
        <button class="btn-small" onclick="window.shareQuoteWhatsApp(${q.id})">
          <i class="fab fa-whatsapp" style="color:#25d366"></i> WhatsApp
        </button>`}
        <button class="btn-small" onclick="window.exportClientQuotePDFById(${q.id})">
          <i class="fas fa-file-pdf"></i> PDF
        </button>
        <button class="btn-small"
                onclick="window.updateQuoteStatus(${q.id},'approved');window.renderPendingAlerts()">
          <i class="fas fa-check" style="color:#27ae60"></i> Aprovado
        </button>
        <button class="btn-small"
                onclick="window.updateQuoteStatus(${q.id},'rejected');window.renderPendingAlerts()">
          <i class="fas fa-xmark" style="color:#e74c3c"></i> Recusado
        </button>
      </div>
    </div>`;
  }).join('');
};

// Esta função estava no seu app.js, mas faz mais sentido aqui ou em clients.js
// Para evitar duplicação, se já estiver em clients.js, remova daqui.
window.updateClientsBadge = function(count) {
  const badge = document.getElementById('badge-clients');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count > 9 ? '9+' : count;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
};

// ═══════════════════════════════════════════════════════
// 4. RELATÓRIO MENSAL EM PDF
// ═══════════════════════════════════════════════════════

window.buildMonthlyReportData = function() {
  // Assumindo loadHistoryRaw, loadQuotes, loadClients, loadCatalog estão em outros scripts
  const history = window.loadHistoryRaw();
  const quotes  = window.loadQuotes();
  const clients = window.loadClients();
  const catalog = window.loadCatalog();

  const now      = new Date();
  const y        = now.getFullYear();
  const m        = now.getMonth();

  // Filtra histórico do mês atual
  const thisMonth = history.filter(e => {
    const d = new Date(e.id);
    return d.getFullYear() === y && d.getMonth() === m;
  });

  const revenue    = thisMonth.reduce((s,e) => s + (e.finalPrice*(e.quantity||1)), 0);
  const cost       = thisMonth.reduce((s,e) => s + (e.directCost*(e.quantity||1)), 0);
  const profit     = revenue - cost;
  const avgMargin  = thisMonth.length
    ? thisMonth.reduce((s,e) => s + (e.profitMargin||0), 0) / thisMonth.length
    : 0;

  // Top peças do mês
  const topPieces = [...thisMonth]
    .sort((a,b) => b.finalPrice - a.finalPrice)
    .slice(0, 5);

  // Material mais usado
  const matCount = {};
  thisMonth.forEach(e => {
    const mat = e.materialType || 'N/A';
    matCount[mat] = (matCount[mat]||0) + 1;
  });
  const topMaterial = Object.entries(matCount)
    .sort((a,b) => b[1]-a[1])[0]?.[0] || '—';

  // Orçamentos do mês
  const monthQuotes = quotes.filter(q => {
    const d = new Date(q.id);
    return d.getFullYear() === y && d.getMonth() === m;
  });

  const approved = monthQuotes.filter(q => q.status === 'approved').length;
  const pending  = monthQuotes.filter(q => q.status === 'pending').length;
  const rejected = monthQuotes.filter(q => q.status === 'rejected').length;

  const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  return {
    monthName:   `${months[m]}/${y}`,
    pieces:      thisMonth.length,
    revenue, cost, profit, avgMargin,
    topPieces, topMaterial,
    totalQuotes: monthQuotes.length,
    approved, pending, rejected,
    totalClients: clients.length,
    catalogSize:  catalog.length,
  };
};

window.renderMonthlyReportPreview = function() {
  const container = document.getElementById('monthly-report-preview');
  if (!container) return;

  const d = window.buildMonthlyReportData();

  if (d.pieces === 0) {
    container.innerHTML = `
      <div class="tips-placeholder">
        <i class="fas fa-calendar-xmark"></i>
        <p>Nenhuma precificação encontrada este mês.<br/>
           Calcule e salve precificações para gerar o relatório.</p>
      </div>`;
    return;
  }

  container.innerHTML = `
  <div class="dash-kpi-grid" style="margin-bottom:1rem;">
    <div class="dash-kpi-card blue">
      <div class="kpi-icon"><i class="fas fa-receipt"></i></div>
      <div class="kpi-info">
        <small>Precificações</small>
        <strong>${d.pieces}</strong>
        <span>${d.monthName}</span>
      </div>
    </div>
    <div class="dash-kpi-card orange">
      <div class="kpi-icon"><i class="fas fa-dollar-sign"></i></div>
      <div class="kpi-info">
        <small>Faturamento</small>
        <strong>${window.formatBRL(d.revenue)}</strong>
        <span>Custo: ${window.formatBRL(d.cost)}</span>
      </div>
    </div>
    <div class="dash-kpi-card green">
      <div class="kpi-icon"><i class="fas fa-arrow-trend-up"></i></div>
      <div class="kpi-info">
        <small>Lucro do Mês</small>
        <strong>${window.formatBRL(d.profit)}</strong>
        <span>Margem média: ${d.avgMargin.toFixed(1)}%</span>
      </div>
    </div>
    <div class="dash-kpi-card neutral">
      <div class="kpi-icon"><i class="fas fa-file-invoice"></i></div>
      <div class="kpi-info">
        <small>Orçamentos</small>
        <strong>${d.totalQuotes}</strong>
        <span>✅ ${d.approved} · ⏳ ${d.pending} · ❌ ${d.rejected}</span>
      </div>
    </div>
  </div>
  <div style="display:flex;gap:0.8rem;flex-wrap:wrap;margin-top:0.5rem;">
    <div style="flex:1;min-width:200px;background:var(--light-gray);border-radius:10px;
                padding:0.8rem 1rem;border:1px solid var(--border);">
      <div style="font-size:0.75rem;color:var(--text-muted);
                  text-transform:uppercase;margin-bottom:0.3rem;">
        Material mais usado
      </div>
      <div style="font-weight:700;color:var(--dark-blue);font-size:1rem;">
        ${d.topMaterial}
      </div>
    </div>
    <div style="flex:1;min-width:200px;background:var(--light-gray);border-radius:10px;
                padding:0.8rem 1rem;border:1px solid var(--border);">
      <div style="font-size:0.75rem;color:var(--text-muted);
                  text-transform:uppercase;margin-bottom:0.3rem;">
        Clientes cadastrados
      </div>
      <div style="font-weight:700;color:var(--dark-blue);font-size:1rem;">
        ${d.totalClients}
      </div>
    </div>
    <div style="flex:1;min-width:200px;background:var(--light-gray);border-radius:10px;
                padding:0.8rem 1rem;border:1px solid var(--border);">
      <div style="font-size:0.75rem;color:var(--text-muted);
                  text-transform:uppercase;margin-bottom:0.3rem;">
        Peças no catálogo
      </div>
      <div style="font-weight:700;color:var(--dark-blue);font-size:1rem;">
        ${d.catalogSize}
      </div>
    </div>
  </div>`;
};

window.exportMonthlyReportPDF = function() {
  if (!window.jspdf) {
    window.showToast('Biblioteca PDF não carregada!', 'fa-triangle-exclamation');
    return;
  }

  const d = window.buildMonthlyReportData();
  if (d.pieces === 0) {
    window.showToast('Nenhum dado este mês para exportar!', 'fa-triangle-exclamation');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc    = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
  const W      = 210;
  const margin = 16;
  const col2   = W - margin;
  let y        = 0;

  const DARK   = [26, 42, 74];
  const ORANGE = [240,123,48];
  const YELLOW = [245,200,66];
  const WHITE  = [255,255,255];
  const GRAY   = [245,247,250];
  const GREEN  = [39,174,96];
  const TEXT   = [45, 55, 72];
  // const MUTED  = [113,128,150]; // Não usado, pode ser removido

  // ── CAPA ──────────────────────────────────────────
  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, 55, 'F');

  doc.setFillColor(...ORANGE);
  doc.rect(0, 50, W, 5, 'F');

  doc.setTextColor(...WHITE);
  doc.setFont('helvetica','bold');
  doc.setFontSize(22);
  doc.text('RELATÓRIO MENSAL', margin, 20);

  doc.setFont('helvetica','normal');
  doc.setFontSize(11);
  doc.setTextColor(180,200,230);
  doc.text('3D Pricer Pro — Resumo de Desempenho', margin, 30);

  doc.setFontSize(12);
  doc.setTextColor(...YELLOW);
  doc.setFont('helvetica','bold');
  doc.text(d.monthName, margin, 42);

  doc.setFont('helvetica','normal');
  doc.setFontSize(9);
  doc.setTextColor(180,200,230);
  doc.text(
    `Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`,
    col2, 42, { align:'right' }
  );

  y = 68;

  // ── HELPER FUNÇÕES ────────────────────────────────
  function sectionTitle(title) {
    if (y > 265) { doc.addPage(); y = 20; }
    doc.setFillColor(...GRAY);
    doc.roundedRect(margin, y-4, W-margin*2, 10, 2, 2, 'F');
    doc.setFont('helvetica','bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...DARK);
    doc.text(title, margin+3, y+3);
    y += 13;
  }

  function kpiBox(x, bY, bW, bH, label, value, sub, color) {
    doc.setFillColor(...color);
    doc.roundedRect(x, bY, bW, bH, 3, 3, 'F');
    doc.setFont('helvetica','normal');
    doc.setFontSize(7);
    doc.setTextColor(...WHITE);
    doc.text(label.toUpperCase(), x + bW/2, bY+7, { align:'center' });
    doc.setFont('helvetica','bold');
    doc.setFontSize(11);
    doc.text(value, x + bW/2, bY+16, { align:'center' });
    if (sub) {
      doc.setFont('helvetica','normal');
      doc.setFontSize(7);
      doc.setTextColor(220,230,245);
      doc.text(sub, x + bW/2, bY+22, { align:'center' });
    }
  }

  // ── KPI BOXES ─────────────────────────────────────
  const bW  = (W - margin*2 - 9) / 4;
  const bH  = 28;

  kpiBox(margin,          y, bW, bH, 'Precificações', String(d.pieces),       `${d.monthName}`,          DARK);
  kpiBox(margin+bW+3,     y, bW, bH, 'Faturamento',   window.formatBRL(d.revenue),   `Custo: ${window.formatBRL(d.cost)}`, [...ORANGE]);
  kpiBox(margin+(bW+3)*2, y, bW, bH, 'Lucro',         window.formatBRL(d.profit),    `Margem: ${d.avgMargin.toFixed(1)}%`, [...GREEN]);
  kpiBox(margin+(bW+3)*3, y, bW, bH, 'Orçamentos',    String(d.totalQuotes),  `✅${d.approved} ⏳${d.pending} ❌${d.rejected}`, [61,97,153]);

  y += bH + 12;

  // ── RESUMO FINANCEIRO ──────────────────────────────
  sectionTitle('💰 Resumo Financeiro do Mês');

  const rows = [
    ['Faturamento Bruto',       window.formatBRL(d.revenue),          DARK],
    ['Custo Total de Produção', window.formatBRL(d.cost),              [231,76,60]],
    ['Lucro Líquido',           window.formatBRL(d.profit),            [...GREEN]],
    ['Margem Média',            `${d.avgMargin.toFixed(1)}%`,   [...ORANGE]],
  ];

  rows.forEach(([label, value, color], i) => {
    if (y > 268) { doc.addPage(); y = 20; }
    if (i % 2 === 0) {
      doc.setFillColor(...GRAY);
      doc.rect(margin, y-3, W-margin*2, 9, 'F');
    }
    doc.setFont('helvetica','normal');
    doc.setFontSize(9);
    doc.setTextColor(...TEXT);
    doc.text(label, margin+3, y+3);
    doc.setFont('helvetica','bold');
    doc.setTextColor(...color);
    doc.text(value, col2-3, y+3, { align:'right' });
    y += 11;
  });

  y += 6;

  // ── TOP PEÇAS ─────────────────────────────────────
  if (d.topPieces.length) {
    sectionTitle('🏆 Top Peças do Mês');

    doc.setFillColor(...DARK);
    doc.rect(margin, y, W-margin*2, 7, 'F');
    doc.setFont('helvetica','bold');
    doc.setFontSize(8);
    doc.setTextColor(...WHITE);
    doc.text('#',    margin+3, y+5);
    doc.text('Impressora / Material', margin+12, y+5);
    doc.text('Peso', 130, y+5);
    doc.text('Custo', 150, y+5);
    doc.text('Preço Final', col2-3, y+5, { align:'right' });
    y += 11;

    d.topPieces.forEach((p, i) => {
      if (y > 265) { doc.addPage(); y = 20; }
      if (i % 2 === 0) {
        doc.setFillColor(...GRAY);
        doc.rect(margin, y-3, W-margin*2, 9, 'F');
      }
      doc.setFont('helvetica','normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...TEXT);
      doc.text(String(i+1), margin+3, y+3);
      doc.text(
        `${p.printerName||'—'} · ${p.materialType||'—'}`,
        margin+12, y+3
      );
      doc.text(`${p.partWeight||0}g`, 130, y+3);
      doc.text(window.formatBRL(p.directCost), 150, y+3);
      doc.setFont('helvetica','bold');
      doc.setTextColor(...ORANGE);
      doc.text(window.formatBRL(p.finalPrice), col2-3, y+3, { align:'right' });
      y += 10;
    });

    y += 4;
  }

  // ── ORÇAMENTOS ────────────────────────────────────
  sectionTitle('📋 Status dos Orçamentos');

  const qData = [
    ['✅ Aprovados',   d.approved,  [...GREEN]],
    ['⏳ Pendentes',   d.pending,   [...ORANGE]],
    ['❌ Recusados',   d.rejected,  [231,76,60]],
    ['Total do mês',   d.totalQuotes, [...DARK]],
  ];

  const qBoxW = (W - margin*2 - 9) / 4;
  qData.forEach(([label, val, color], i) => {
    const bx = margin + i * (qBoxW + 3);
    doc.setFillColor(...color);
    doc.roundedRect(bx, y, qBoxW, 20, 3, 3, 'F');
    doc.setFont('helvetica','normal');
    doc.setFontSize(7);
    doc.setTextColor(...WHITE);
    doc.text(label, bx + qBoxW/2, y+7, { align:'center' });
    doc.setFont('helvetica','bold');
    doc.setFontSize(13);
    doc.text(String(val), bx + qBoxW/2, y+16, { align:'center' });
  });

  y += 28;

  // ── INFORMAÇÕES GERAIS ────────────────────────────
  sectionTitle('📊 Informações Gerais');

  [
    ['Material mais utilizado',  d.topMaterial],
    ['Clientes cadastrados',     String(d.totalClients)],
    ['Peças no catálogo',        String(d.catalogSize)],
  ].forEach(([label, value], i) => {
    if (y > 268) { doc.addPage(); y = 20; }
    if (i % 2 === 0) {
      doc.setFillColor(...GRAY);
      doc.rect(margin, y-3, W-margin*2, 9, 'F');
    }
    doc.setFont('helvetica','normal');
    doc.setFontSize(9);
    doc.setTextColor(...TEXT);
    doc.text(label, margin+3, y+3);
    doc.setFont('helvetica','bold');
    doc.setTextColor(...DARK);
    doc.text(value, col2-3, y+3, { align:'right' });
    y += 11;
  });

  // ── RODAPÉ ────────────────────────────────────────
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFillColor(...DARK);
    doc.rect(0, 288, W, 9, 'F');
    doc.setFont('helvetica','normal');
    doc.setFontSize(7.5);
    doc.setTextColor(180,200,230);
    doc.text(`3D Pricer Pro · Relatório ${d.monthName}`, margin, 294);
    doc.text(`Página ${i} de ${pages}`, col2, 294, { align:'right' });
  }

  const filename = `relatorio-${d.monthName.replace('/','_')}.pdf`;
  doc.save(filename);
  window.showToast(`Relatório de ${d.monthName} exportado! 📊`, 'fa-file-pdf');
};

// ═══════════════════════════════════════════════════════
// INICIALIZAÇÃO DA ABA FERRAMENTAS
// ═══════════════════════════════════════════════════════

window.initTools = function() {
  window.renderPendingAlerts();
  window.renderMonthlyReportPreview();

  // Pré-preenche comparador de plataformas
  // com dados da última precificação (se houver)
  if (window._lastResult) {
    const r = window._lastResult;
    const costEl    = document.getElementById('plat-cost');
    const marginEl  = document.getElementById('plat-margin');
    const taxEl     = document.getElementById('plat-tax');
    const shipEl    = document.getElementById('plat-shipping');

    if (costEl   && !costEl.value)   costEl.value   = r.directCost?.toFixed(2);
    if (marginEl && !marginEl.value) marginEl.value = r.profitMargin;
    if (taxEl    && !taxEl.value)    taxEl.value    = r.taxRate;
    if (shipEl   && !shipEl.value)   shipEl.value   = r.packagingCost;

    window.calcPlatformComparator();
  }

  // Pré-preenche spool com dados do formulário
  const spoolTotalEl  = document.getElementById('spool-total');
  const spoolPriceEl  = document.getElementById('spool-price');
  const spoolPieceEl  = document.getElementById('spool-per-piece');

  if (spoolTotalEl && !spoolTotalEl.value) {
    const sw = document.getElementById('spoolWeight')?.value;
    if (sw) spoolTotalEl.value = sw;
  }
  if (spoolPriceEl && !spoolPriceEl.value) {
    const sc = document.getElementById('spoolCost')?.value;
    if (sc) spoolPriceEl.value = sc;
  }
  if (spoolPieceEl && !spoolPieceEl.value) {
    const pw = document.getElementById('partWeight')?.value;
    if (pw) spoolPieceEl.value = pw;
  }
};

// As funções openComparator e closeComparator foram movidas para app.js
// para centralizar o controle do modal. Se você as tinha aqui, remova-as.
