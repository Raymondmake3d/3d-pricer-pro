'use strict';

// ═══════════════════════════════════════════════════════
// HISTÓRICO — localStorage
// ═══════════════════════════════════════════════════════

const HISTORY_KEY = '3dpricer_history';

function loadHistoryRaw() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

function saveToHistory() {
  if (!window._lastResult) {
    showToast('Calcule uma precificação primeiro!', 'fa-triangle-exclamation');
    return;
  }

  const r       = window._lastResult;
  const history = loadHistoryRaw();

  const entry = {
    id:           Date.now(),
    date:         new Date().toLocaleString('pt-BR'),
    printerName:  r.printerName  || 'Impressora',
    materialType: r.materialType || '—',
    partWeight:   r.partWeight,
    printHours:   r.printHours,
    finalPrice:   r.finalPrice,
    directCost:   r.directCost,
    profitMargin: r.profitMargin,
    quantity:     r.quantity,
    data:         r,
  };

  history.unshift(entry);
  if (history.length > 50) history.pop();

  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  renderHistory();
  showToast('Salvo no histórico!', 'fa-floppy-disk');
}

function renderHistory() {
  const container = document.getElementById('history-list');
  if (!container) return;

  const history = loadHistoryRaw();

  if (!history.length) {
    container.innerHTML = `
      <div class="tips-placeholder">
        <i class="fas fa-floppy-disk"></i>
        <p>Nenhuma precificação salva ainda.</p>
      </div>`;
    return;
  }

  container.innerHTML = history.map(entry => `
    <div class="history-card" id="hcard-${entry.id}">
      <div class="history-info">
        <div class="history-title">
          <i class="fas fa-cube"></i>
          <strong>${entry.printerName}</strong>
          <span class="history-material">${entry.materialType}</span>
        </div>
        <div class="history-meta">
          <span><i class="fas fa-calendar"></i> ${entry.date}</span>
          <span><i class="fas fa-weight-hanging"></i> ${entry.partWeight}g</span>
          <span><i class="fas fa-clock"></i> ${entry.printHours}h</span>
          <span><i class="fas fa-boxes-stacked"></i> ${entry.quantity}x</span>
        </div>
      </div>
      <div class="history-price">
        <small>Preço Final</small>
        <strong>${formatBRL(entry.finalPrice)}</strong>
        <small>Custo: ${formatBRL(entry.directCost)}</small>
      </div>
      <div class="history-actions">
        <button class="btn-small" onclick="loadFromHistory(${entry.id})" title="Recarregar">
          <i class="fas fa-upload"></i>
        </button>
        <button class="btn-small danger" onclick="deleteHistory(${entry.id})" title="Excluir">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>`).join('');
}

function loadFromHistory(id) {
  const history = loadHistoryRaw();
  const entry   = history.find(e => e.id === id);
  if (!entry?.data) return;

  const d = entry.data;

  const map = {
    printerName:     d.printerName,
    printerType:     d.printerType,
    printerCost:     d.printerCostRaw,
    printerLifespan: d.printerLifespan,
    printerWatts:    d.printerWatts,
    maintenanceCost: d.maintenanceCostRaw,
    monthlyHours:    d.monthlyHours,
    materialType:    d.materialType,
    partWeight:      d.partWeight,
    supportWeight:   d.supportWeight,
    failureRate:     d.failureRate,
    postProcessCost: d.postProcessCost,
    printHours:      d.printHours,
    energyRate:      d.energyRate,
    laborCost:       d.laborCostPerH,
    laborHours:      d.laborHours,
    setupHours:      d.setupHours,
    profitMargin:    d.profitMargin,
    taxRate:         d.taxRate,
    platformFee:     d.platformFee,
    packagingCost:   d.packagingCost,
    otherCosts:      d.otherCosts,
    maxDiscount:     d.maxDiscount,
    quantity:        d.quantity,
  };

  Object.entries(map).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el && val !== undefined && val !== null) el.value = val;
  });

  // Volta para aba de cálculo
  document.querySelectorAll('.tab').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === 'calc'));
  document.querySelectorAll('.tab-content').forEach(c => {
    c.classList.toggle('hidden', c.id !== 'tab-calc');
    c.classList.toggle('active', c.id === 'tab-calc');
  });

  onMaterialChange();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  showToast('Precificação carregada!', 'fa-upload');
}

function deleteHistory(id) {
  const history = loadHistoryRaw().filter(e => e.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  document.getElementById(`hcard-${id}`)?.remove();

  // Se vazio, mostra placeholder
  if (!history.length) renderHistory();
  showToast('Registro excluído.', 'fa-trash');
}

function clearHistory() {
  if (!confirm('Deseja apagar todo o histórico de precificações?')) return;
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
  showToast('Histórico limpo.', 'fa-trash');
}

// ═══════════════════════════════════════════════════════
// COPIAR RESULTADO
// ═══════════════════════════════════════════════════════

function copyResult() {
  if (!window._lastResult) {
    showToast('Calcule uma precificação primeiro!', 'fa-triangle-exclamation');
    return;
  }

  const r   = window._lastResult;
  const now = new Date().toLocaleString('pt-BR');

  const text = `
╔══════════════════════════════════════════╗
║        3D PRICER PRO — RELATÓRIO         ║
╠══════════════════════════════════════════╣
║ Data:        ${now.padEnd(28)}║
║ Impressora:  ${(r.printerName || 'N/A').substring(0,28).padEnd(28)}║
║ Material:    ${(r.materialType || 'N/A').substring(0,28).padEnd(28)}║
║ Peso:        ${String(r.partWeight + 'g').padEnd(28)}║
║ Tempo:       ${String(r.printHours + 'h').padEnd(28)}║
╠══════════════════════════════════════════╣
║ CUSTOS                                   ║
║  Material:        ${formatBRL(r.materialCost).padStart(22)} ║
║  Energia:         ${formatBRL(r.energyCost).padStart(22)} ║
║  Depreciação:     ${formatBRL(r.depreciationCost).padStart(22)} ║
║  Manutenção:      ${formatBRL(r.maintenanceCost).padStart(22)} ║
║  Mão de Obra:     ${formatBRL(r.laborCost).padStart(22)} ║
║  Falhas:          ${formatBRL(r.failureReserve).padStart(22)} ║
║  Embalagem:       ${formatBRL(r.packagingCost).padStart(22)} ║
╠══════════════════════════════════════════╣
║  Custo Total:     ${formatBRL(r.directCost).padStart(22)} ║
║  Impostos:        ${formatBRL(r.taxAmount).padStart(22)} ║
║  Lucro:           ${formatBRL(r.profitAmount).padStart(22)} ║
╠══════════════════════════════════════════╣
║  PREÇO FINAL:     ${formatBRL(r.finalPrice).padStart(22)} ║
║  Preço Mínimo:    ${formatBRL(r.minPrice).padStart(22)} ║
║  Premium +20%:    ${formatBRL(r.premiumPrice).padStart(22)} ║
╚══════════════════════════════════════════╝
`.trim();

  navigator.clipboard.writeText(text)
    .then(() => showToast('Resultado copiado!', 'fa-copy'))
    .catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      showToast('Resultado copiado!', 'fa-copy');
    });
}

// ═══════════════════════════════════════════════════════
// EXPORTAÇÃO PDF
// ═══════════════════════════════════════════════════════

function exportPDF() {
  if (!window._lastResult) {
    showToast('Calcule uma precificação primeiro!', 'fa-triangle-exclamation');
    return;
  }

  if (!window.jspdf) {
    showToast('Biblioteca PDF não carregada!', 'fa-triangle-exclamation');
    return;
  }

  const r   = window._lastResult;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const W      = 210;
  const margin = 18;
  const col2   = W - margin;
  let y        = 0;

  // Cores
  const DARK   = [26,42,74];
  const MID    = [44,74,124];
  const ORANGE = [240,123,48];
  const YELLOW = [245,200,66];
  const GRAY   = [240,242,245];
  const WHITE  = [255,255,255];
  const TEXT   = [45,55,72];
  const MUTED  = [113,128,150];

  // ── CABEÇALHO ──
  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, 42, 'F');
  doc.setFillColor(...MID);
  doc.rect(W/2, 0, W/2, 42, 'F');

  doc.setTextColor(...WHITE);
  doc.setFont('helvetica','bold');
  doc.setFontSize(22);
  doc.text('3D Pricer Pro', margin, 18);

  doc.setFont('helvetica','normal');
  doc.setFontSize(10);
  doc.setTextColor(200,210,230);
  doc.text('Relatório de Precificação para Impressão 3D', margin, 27);

  doc.setFontSize(9);
  doc.setTextColor(...YELLOW);
  const now = new Date();
  doc.text(`Gerado em: ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`, margin, 35);

  if (r.printerName) {
    doc.setTextColor(200,210,230);
    doc.text(`Impressora: ${r.printerName}`, col2, 35, { align:'right' });
  }

  y = 52;

  // ── HELPERS ──
  function sectionTitle(title) {
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFillColor(...GRAY);
    doc.roundedRect(margin, y-4, W-margin*2, 10, 2, 2, 'F');
    doc.setFont('helvetica','bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...MID);
    doc.text(title, margin+3, y+3);
    y += 13;
  }

  function itemRow(label, value, highlight=false) {
    if (y > 265) { doc.addPage(); y = 20; }
    if (highlight) {
      doc.setFillColor(...GRAY);
      doc.rect(margin, y-3, W-margin*2, 8, 'F');
    }
    doc.setFont('helvetica','normal');
    doc.setFontSize(9);
    doc.setTextColor(...TEXT);
    doc.text(label, margin+2, y+2);
    doc.setFont('helvetica','bold');
    doc.setTextColor(highlight ? DARK[0]:TEXT[0], highlight ? DARK[1]:TEXT[1], highlight ? DARK[2]:TEXT[2]);
    doc.text(value, col2-2, y+2, { align:'right' });
    doc.setDrawColor(230,234,240);
    doc.setLineWidth(0.3);
    doc.line(margin, y+5, W-margin, y+5);
    y += 9;
  }

  function totalRow(label, value, color=ORANGE) {
    if (y > 265) { doc.addPage(); y = 20; }
    doc.setFillColor(...color);
    doc.roundedRect(margin, y-3, W-margin*2, 11, 2, 2, 'F');
    doc.setFont('helvetica','bold');
    doc.setFontSize(10);
    doc.setTextColor(...WHITE);
    doc.text(label, margin+4, y+4);
    doc.text(value, col2-4, y+4, { align:'right' });
    y += 16;
  }

  // ── SEÇÕES ──
  sectionTitle('📦 Materiais');
  itemRow('Material Principal',        formatBRL(r.materialCost));
  itemRow('Material de Suporte',       formatBRL(r.supportCost));
  itemRow('Acabamentos',               formatBRL(r.finishingCost));

  y += 2;
  sectionTitle('⚙️ Equipamento & Energia');
  itemRow('Energia Elétrica',          formatBRL(r.energyCost));
  itemRow('Depreciação da Impressora', formatBRL(r.depreciationCost));
  itemRow('Manutenção (rateada)',       formatBRL(r.maintenanceCost));
  itemRow('Consumíveis',               formatBRL(r.consumablesCost));
  itemRow('Espaço / Localização',      formatBRL(r.spaceCost));

  y += 2;
  sectionTitle('👷 Mão de Obra');
  itemRow('Trabalho Manual',           formatBRL(r.laborCost));
  itemRow('Setup / Supervisão',        formatBRL(r.setupCost));
  itemRow('Lavagem / Cura',            formatBRL(r.washCureCost));

  y += 2;
  sectionTitle('⚠️ Riscos & Extras');
  itemRow('Reserva de Falhas',         formatBRL(r.failureReserve));
  itemRow('Pós-processamento',         formatBRL(r.postProcessCost));
  itemRow('Embalagem / Envio',         formatBRL(r.packagingCost));
  itemRow('Outros Custos',             formatBRL(r.otherCosts));

  y += 4;
  doc.setDrawColor(...MID);
  doc.setLineWidth(0.7);
  doc.line(margin, y, W-margin, y);
  y += 6;

  itemRow('Custo Total (unitário)',     formatBRL(r.directCost), true);
  itemRow('Impostos',                  formatBRL(r.taxAmount));
  itemRow('Taxa de Plataforma',        formatBRL(r.platformFeeAmount));
  itemRow('Margem de Lucro',           formatBRL(r.profitAmount));

  y += 4;
  totalRow(`PREÇO FINAL UNITÁRIO`, formatBRL(r.finalPrice), DARK);

  if (r.quantity > 1) {
    itemRow(`Total do Lote (${r.quantity} unidades)`, formatBRL(r.batchPrice), true);
    y += 4;
  }

  // ── BADGES DE PREÇO ──
  if (y > 245) { doc.addPage(); y = 20; }

  const bW = (W - margin*2 - 8) / 3;
  const bH = 22;
  const bY = y;

  // Mínimo
  doc.setFillColor(...GRAY);
  doc.roundedRect(margin, bY, bW, bH, 3, 3, 'F');
  doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...MUTED);
  doc.text('PREÇO MÍNIMO', margin+bW/2, bY+7, { align:'center' });
  doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...DARK);
  doc.text(formatBRL(r.minPrice), margin+bW/2, bY+16, { align:'center' });

  // Sugerido
  doc.setFillColor(...ORANGE);
  doc.roundedRect(margin+bW+4, bY, bW, bH, 3, 3, 'F');
  doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...WHITE);
  doc.text('⭐ SUGERIDO', margin+bW+4+bW/2, bY+7, { align:'center' });
  doc.setFont('helvetica','bold'); doc.setFontSize(10);
  doc.text(formatBRL(r.finalPrice), margin+bW+4+bW/2, bY+16, { align:'center' });

  // Premium
  doc.setFillColor(...MID);
  doc.roundedRect(margin+bW*2+8, bY, bW, bH, 3, 3, 'F');
  doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...WHITE);
  doc.text('PREMIUM (+20%)', margin+bW*2+8+bW/2, bY+7, { align:'center' });
  doc.setFont('helvetica','bold'); doc.setFontSize(10);
  doc.text(formatBRL(r.premiumPrice), margin+bW*2+8+bW/2, bY+16, { align:'center' });

  y = bY + bH + 10;

  // ── RODAPÉ ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(...DARK);
    doc.rect(0, 290, W, 10, 'F');
    doc.setFont('helvetica','normal'); doc.setFontSize(7.5);
    doc.setTextColor(180,190,210);
    doc.text('3D Pricer Pro — precificação inteligente para impressão 3D', margin, 296);
    doc.text(`Página ${i} de ${pageCount}`, col2, 296, { align:'right' });
  }

  const filename = `3d-pricer-${now.toISOString().slice(0,10)}.pdf`;
  doc.save(filename);
  showToast('PDF exportado com sucesso!', 'fa-file-pdf');
}