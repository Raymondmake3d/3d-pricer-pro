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
  showToast('Salvo no histórico! 💾', 'fa-floppy-disk');
}

// ═══════════════════════════════════════════════════════
// RENDERIZAR HISTÓRICO
// ═══════════════════════════════════════════════════════

function renderHistory() {
  const container = document.getElementById('history-list');
  if (!container) return;

  const history = loadHistoryRaw();

  if (!history.length) {
    container.innerHTML = `
      <div class="tips-placeholder">
        <i class="fas fa-floppy-disk"></i>
        <p>Nenhuma precificação salva ainda.<br/>
        Calcule e clique em <strong>Salvar</strong> para guardar aqui.</p>
      </div>`;
    return;
  }

  container.innerHTML = history.map(entry => {
    const profit    = entry.finalPrice - entry.directCost;
    const profitPct = entry.directCost > 0
      ? ((profit / entry.directCost) * 100).toFixed(1)
      : '0.0';
    const profitColor = profit >= 0 ? '#27ae60' : '#e74c3c';

    return `
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
        <small style="color:${profitColor}">
          Lucro: ${formatBRL(profit)} (${profitPct}%)
        </small>
      </div>
      <div class="history-actions">
        <button class="btn-small" onclick="loadFromHistory(${entry.id})" title="Recarregar nos campos">
          <i class="fas fa-upload"></i>
        </button>
        <button class="btn-small" onclick="exportSinglePDF(${entry.id})" title="Exportar PDF">
          <i class="fas fa-file-pdf"></i>
        </button>
        <button class="btn-small danger" onclick="deleteHistory(${entry.id})" title="Excluir">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════
// CARREGAR DO HISTÓRICO
// ═══════════════════════════════════════════════════════

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
    spoolCost:       d.spoolCost,
    spoolWeight:     d.spoolWeight,
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
    spaceCost:       d.spaceCost,
    washCureCost:    d.washCureCost,
    marginStrategy:  d.marginStrategy,
  };

  Object.entries(map).forEach(([fieldId, val]) => {
    const el = document.getElementById(fieldId);
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
  updateEnergyPreview();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  showToast('Precificação carregada! ✅', 'fa-upload');
}

// ═══════════════════════════════════════════════════════
// DELETAR / LIMPAR HISTÓRICO
// ═══════════════════════════════════════════════════════

function deleteHistory(id) {
  const history = loadHistoryRaw().filter(e => e.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  document.getElementById(`hcard-${id}`)?.remove();
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

  const pad = (str, len) => String(str).substring(0, len).padEnd(len);
  const padL = (str, len) => String(str).padStart(len);

  const text = [
    '╔══════════════════════════════════════════╗',
    '║        3D PRICER PRO — RELATÓRIO         ║',
    '╠══════════════════════════════════════════╣',
    `║ Data:        ${pad(now, 28)}║`,
    `║ Impressora:  ${pad(r.printerName || 'N/A', 28)}║`,
    `║ Material:    ${pad(r.materialType || 'N/A', 28)}║`,
    `║ Peso:        ${pad(r.partWeight + 'g', 28)}║`,
    `║ Tempo:       ${pad(r.printHours + 'h', 28)}║`,
    '╠══════════════════════════════════════════╣',
    '║ CUSTOS                                   ║',
    `║  Material:        ${padL(formatBRL(r.materialCost), 22)} ║`,
    `║  Energia:         ${padL(formatBRL(r.energyCost), 22)} ║`,
    `║  Depreciação:     ${padL(formatBRL(r.depreciationCost), 22)} ║`,
    `║  Manutenção:      ${padL(formatBRL(r.maintenanceCost), 22)} ║`,
    `║  Mão de Obra:     ${padL(formatBRL(r.laborCost), 22)} ║`,
    `║  Falhas:          ${padL(formatBRL(r.failureReserve), 22)} ║`,
    `║  Embalagem:       ${padL(formatBRL(r.packagingCost), 22)} ║`,
    '╠══════════════════════════════════════════╣',
    `║  Custo Total:     ${padL(formatBRL(r.directCost), 22)} ║`,
    `║  Impostos:        ${padL(formatBRL(r.taxAmount), 22)} ║`,
    `║  Lucro:           ${padL(formatBRL(r.profitAmount), 22)} ║`,
    '╠══════════════════════════════════════════╣',
    `║  PREÇO FINAL:     ${padL(formatBRL(r.finalPrice), 22)} ║`,
    `║  Preço Mínimo:    ${padL(formatBRL(r.minPrice), 22)} ║`,
    `║  Premium +20%:    ${padL(formatBRL(r.premiumPrice), 22)} ║`,
    '╚══════════════════════════════════════════╝',
  ].join('\n');

  navigator.clipboard.writeText(text)
    .then(() => showToast('Resultado copiado! 📋', 'fa-copy'))
    .catch(() => {
      const ta = Object.assign(document.createElement('textarea'), { value: text });
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      showToast('Resultado copiado! 📋', 'fa-copy');
    });
}

// ═══════════════════════════════════════════════════════
// EXPORTAR PDF — RESULTADO ATUAL
// ═══════════════════════════════════════════════════════

function exportPDF() {
  if (!window._lastResult) {
    showToast('Calcule uma precificação primeiro!', 'fa-triangle-exclamation');
    return;
  }
  gerarPDF(window._lastResult);
}

// ═══════════════════════════════════════════════════════
// EXPORTAR PDF — DO HISTÓRICO
// ═══════════════════════════════════════════════════════

function exportSinglePDF(id) {
  const history = loadHistoryRaw();
  const entry   = history.find(e => e.id === id);
  if (!entry?.data) {
    showToast('Dados não encontrados!', 'fa-triangle-exclamation');
    return;
  }
  gerarPDF(entry.data);
}

// ═══════════════════════════════════════════════════════
// GERADOR DE PDF (CORE)
// ═══════════════════════════════════════════════════════

function gerarPDF(r) {
  if (!window.jspdf) {
    showToast('Biblioteca PDF não carregada. Aguarde e tente novamente.', 'fa-triangle-exclamation');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const W      = 210;
  const margin = 18;
  const col2   = W - margin;
  let y        = 0;

  // Paleta de cores
  const DARK   = [26,  42,  74];
  const MID    = [44,  74,  124];
  const ORANGE = [240, 123, 48];
  const YELLOW = [245, 200, 66];
  const GRAY   = [240, 242, 245];
  const WHITE  = [255, 255, 255];
  const TEXT   = [45,  55,  72];
  const MUTED  = [113, 128, 150];

  // ── CABEÇALHO ──────────────────────────────────────
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
  doc.setTextColor(200, 210, 230);
  doc.text('Relatório de Precificação para Impressão 3D', margin, 27);

  const now = new Date();
  doc.setFontSize(9);
  doc.setTextColor(...YELLOW);
  doc.text(
    `Gerado em: ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`,
    margin, 35
  );

  if (r.printerName) {
    doc.setTextColor(200, 210, 230);
    doc.text(`Impressora: ${r.printerName}`, col2, 35, { align:'right' });
  }

  y = 52;

  // ── HELPERS ────────────────────────────────────────

  function checkPage(needed = 14) {
    if (y > 278 - needed) { doc.addPage(); y = 20; }
  }

  function sectionTitle(title) {
    checkPage(16);
    doc.setFillColor(...GRAY);
    doc.roundedRect(margin, y-4, W-margin*2, 10, 2, 2, 'F');
    doc.setFont('helvetica','bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...MID);
    doc.text(title, margin+3, y+3);
    y += 13;
  }

  function itemRow(label, value, highlight = false) {
    checkPage(10);
    if (highlight) {
      doc.setFillColor(...GRAY);
      doc.rect(margin, y-3, W-margin*2, 8, 'F');
    }
    doc.setFont('helvetica','normal');
    doc.setFontSize(9);
    doc.setTextColor(...TEXT);
    doc.text(label, margin+2, y+2);
    doc.setFont('helvetica','bold');
    doc.setTextColor(...(highlight ? DARK : TEXT));
    doc.text(value, col2-2, y+2, { align:'right' });
    doc.setDrawColor(230, 234, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, y+5, W-margin, y+5);
    y += 9;
  }

  function totalRow(label, value, color = ORANGE) {
    checkPage(16);
    doc.setFillColor(...color);
    doc.roundedRect(margin, y-3, W-margin*2, 11, 2, 2, 'F');
    doc.setFont('helvetica','bold');
    doc.setFontSize(10);
    doc.setTextColor(...WHITE);
    doc.text(label, margin+4, y+4);
    doc.text(value, col2-4, y+4, { align:'right' });
    y += 16;
  }

  // ── INFORMAÇÕES GERAIS ─────────────────────────────
  sectionTitle('ℹ️ Informações da Peça');
  itemRow('Tipo de Impressora',   r.printerType   || '—');
  itemRow('Material',             r.materialType  || '—');
  itemRow('Peso da Peça',         `${r.partWeight || 0} g`);
  itemRow('Tempo de Impressão',   `${r.printHours || 0} h`);
  itemRow('Quantidade',           `${r.quantity   || 1} un.`);

  y += 2;

  // ── CUSTOS ─────────────────────────────────────────
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

  itemRow('Custo Total (unitário)',   formatBRL(r.directCost), true);
  itemRow('Impostos',                formatBRL(r.taxAmount));
  itemRow('Taxa de Plataforma',      formatBRL(r.platformFeeAmount));
  itemRow('Margem de Lucro',         formatBRL(r.profitAmount));

  y += 4;
  totalRow('PREÇO FINAL UNITÁRIO', formatBRL(r.finalPrice), DARK);

  if (r.quantity > 1) {
    itemRow(`Total do Lote (${r.quantity} unidades)`, formatBRL(r.batchPrice), true);
    y += 4;
  }

  // ── BADGES DE PREÇO ───────────────────────────────
  checkPage(32);
  const bW = (W - margin*2 - 8) / 3;
  const bH = 22;
  const bY = y;

  // Mínimo
  doc.setFillColor(...GRAY);
  doc.roundedRect(margin, bY, bW, bH, 3, 3, 'F');
  doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...MUTED);
  doc.text('PREÇO MÍNIMO', margin + bW/2, bY+7, { align:'center' });
  doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...DARK);
  doc.text(formatBRL(r.minPrice), margin + bW/2, bY+16, { align:'center' });

  // Sugerido
  doc.setFillColor(...ORANGE);
  doc.roundedRect(margin+bW+4, bY, bW, bH, 3, 3, 'F');
  doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...WHITE);
  doc.text('⭐ SUGERIDO', margin+bW+4 + bW/2, bY+7, { align:'center' });
  doc.setFont('helvetica','bold'); doc.setFontSize(10);
  doc.text(formatBRL(r.finalPrice), margin+bW+4 + bW/2, bY+16, { align:'center' });

  // Premium
  doc.setFillColor(...MID);
  doc.roundedRect(margin+bW*2+8, bY, bW, bH, 3, 3, 'F');
  doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...WHITE);
  doc.text('PREMIUM (+20%)', margin+bW*2+8 + bW/2, bY+7, { align:'center' });
  doc.setFont('helvetica','bold'); doc.setFontSize(10);
  doc.text(formatBRL(r.premiumPrice), margin+bW*2+8 + bW/2, bY+16, { align:'center' });

  y = bY + bH + 10;

  // ── DESCONTO MÁX ──────────────────────────────────
  if (r.maxDiscount > 0) {
    checkPage(12);
    doc.setFillColor(245, 200, 66, 0.2);
    doc.roundedRect(margin, y, W-margin*2, 10, 2, 2, 'F');
    doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(...TEXT);
    doc.text(`Com desconto máximo de ${r.maxDiscount}%:`, margin+3, y+6.5);
    doc.setFont('helvetica','bold'); doc.setTextColor(...DARK);
    doc.text(formatBRL(r.discountedPrice), col2-3, y+6.5, { align:'right' });
    y += 16;
  }

  // ── RODAPÉ ────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(...DARK);
    doc.rect(0, 290, W, 10, 'F');
    doc.setFont('helvetica','normal'); doc.setFontSize(7.5);
    doc.setTextColor(180, 190, 210);
    doc.text('3D Pricer Pro — precificação inteligente para impressão 3D', margin, 296);
    doc.text(`Página ${i} de ${pageCount}`, col2, 296, { align:'right' });
  }

  const filename = `3d-pricer-${now.toISOString().slice(0,10)}.pdf`;
  doc.save(filename);
  showToast('PDF exportado com sucesso! 📄', 'fa-file-pdf');
}
