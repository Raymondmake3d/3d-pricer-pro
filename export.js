'use strict';

// ═══════════════════════════════════════════════════════
// HISTÓRICO — localStorage
// ═══════════════════════════════════════════════════════

const HISTORY_KEY = '3dpricer_history';

window.loadHistoryRaw = function() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
};

window.saveToHistory = function() {
  if (!window._lastResult) {
    window.showToast('Calcule uma precificação primeiro!', 'fa-triangle-exclamation');
    return;
  }

  const r       = window._lastResult;
  const history = window.loadHistoryRaw();

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
  window.renderHistory();
  window.showToast('Salvo no histórico! 💾', 'fa-floppy-disk');
};

// ═══════════════════════════════════════════════════════
// RENDERIZAR HISTÓRICO
// ═══════════════════════════════════════════════════════

window.renderHistory = function() {
  const container = document.getElementById('history-list');
  if (!container) return;

  const history = window.loadHistoryRaw();

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
        <strong>${window.formatBRL(entry.finalPrice)}</strong>
        <small style="color:${profitColor}">
          Lucro: ${window.formatBRL(profit)} (${profitPct}%)
        </small>
      </div>
      <div class="history-actions">
        <button class="btn-small" onclick="window.loadFromHistory(${entry.id})" title="Recarregar nos campos">
          <i class="fas fa-upload"></i>
        </button>
        <button class="btn-small" onclick="window.deleteHistoryEntry(${entry.id})" title="Excluir">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>`;
  }).join('');
};

// ═══════════════════════════════════════════════════════
// AÇÕES DO HISTÓRICO
// ═══════════════════════════════════════════════════════

window.loadFromHistory = function(id) {
  const history = window.loadHistoryRaw();
  const entry   = history.find(e => e.id === id);
  if (!entry) return;

  const r = entry.data;

  // Preenche os campos da calculadora
  document.getElementById('printerName').value     = r.printerName || '';
  document.getElementById('printerCost').value     = r.printerCost || '';
  document.getElementById('printerLifespan').value = r.printerLifespan || '';
  document.getElementById('printerWatts').value    = r.printerWatts || '';
  document.getElementById('energyRate').value      = r.energyRate || '';
  document.getElementById('spoolCost').value       = r.spoolCost || '';
  document.getElementById('spoolWeight').value     = r.spoolWeight || '';
  document.getElementById('partWeight').value      = r.partWeight || '';
  document.getElementById('printHours').value      = r.printHours || '';
  document.getElementById('laborCost').value       = r.laborCost || '';
  document.getElementById('setupCost').value       = r.setupCost || '';
  document.getElementById('postProcessCost').value = r.postProcessCost || '';
  document.getElementById('packagingCost').value   = r.packagingCost || '';
  document.getElementById('otherCosts').value      = r.otherCosts || '';
  document.getElementById('profitMargin').value    = r.profitMargin || '';
  document.getElementById('taxRate').value         = r.taxRate || '';
  document.getElementById('platformFee').value     = r.platformFee || '';
  document.getElementById('quantity').value        = r.quantity || '';
  document.getElementById('failureReserve').value  = r.failureReserve || '';
  document.getElementById('spaceCost').value       = r.spaceCost || '';
  document.getElementById('maintenanceCost').value = r.maintenanceCost || '';
  document.getElementById('washCureCost').value    = r.washCureCost || '';

  // Seleciona o tipo de impressora e material
  const printerTypeEl = document.getElementById('printerType');
  if (printerTypeEl) printerTypeEl.value = r.printerType || 'FDM';
  const materialTypeEl = document.getElementById('materialType');
  if (materialTypeEl) materialTypeEl.value = r.materialType || 'PLA';

  // Carrega consumíveis e acabamentos
  State.consumables = r.consumables || [];
  document.getElementById('consumables-list').innerHTML = State.consumables.map(c => `
    <div class="dynamic-row" id="crow-${c.id}">
      <input type="text" value="${c.name}" oninput="window.updateConsumable('${c.id}','name',this.value)"/>
      <input type="number" value="${c.cost}" oninput="window.updateConsumable('${c.id}','cost',this.value)"/>
      <input type="number" value="${c.lifeHours}" oninput="window.updateConsumable('${c.id}','lifeHours',this.value)"/>
      <button class="btn-del" onclick="window.removeConsumable('${c.id}')"><i class="fas fa-xmark"></i></button>
    </div>
  `).join('');

  State.finishings = r.finishings || [];
  document.getElementById('finishing-list').innerHTML = State.finishings.map(f => `
    <div class="dynamic-row finishing-row" id="frow-${f.id}">
      <input type="text" value="${f.name}" oninput="window.updateFinishing('${f.id}','name',this.value)"/>
      <input type="number" value="${f.cost}" oninput="window.updateFinishing('${f.id}','cost',this.value)"/>
      <button class="btn-del" onclick="window.removeFinishing('${f.id}')"><i class="fas fa-xmark"></i></button>
    </div>
  `).join('');

  // Recalcula e atualiza o UI
  window.calculate();
  window.updateProgress();
  window.showToast('Precificação carregada do histórico!', 'fa-upload');

  // Muda para a aba de precificação
  document.querySelector('.tab[data-tab="calc"]').click();
};

window.deleteHistoryEntry = function(id) {
  if (!confirm('Tem certeza que deseja excluir esta precificação do histórico?')) return;
  let history = window.loadHistoryRaw();
  history = history.filter(e => e.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  window.renderHistory();
  window.showToast('Precificação excluída do histórico.', 'fa-trash');
};

window.clearHistory = function() {
  if (!confirm('Tem certeza que deseja limpar TODO o histórico de precificações?')) return;
  localStorage.removeItem(HISTORY_KEY);
  window.renderHistory();
  window.showToast('Histórico limpo!', 'fa-trash');
};

// ═══════════════════════════════════════════════════════
// EXPORTAR PDF
// ═══════════════════════════════════════════════════════

window.exportPDF = function() {
  if (!window._lastResult) {
    window.showToast('Calcule uma precificação primeiro!', 'fa-triangle-exclamation');
    return;
  }
  if (!window.jspdf) {
    window.showToast('Biblioteca PDF não carregada!', 'fa-triangle-exclamation');
    return;
  }

  const r = window._lastResult;
  const { jsPDF } = window.jspdf;
  const doc    = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
  const W      = 210;
  const margin = 18;
  const col2   = W - margin;
  let y        = 0;

  const DARK   = [26, 42, 74];
  const ORANGE = [240,123,48];
  const YELLOW = [245,200,66];
  const WHITE  = [255,255,255];
  const GRAY   = [240,242,245];
  const MID    = [113,128,150];
  const TEXT   = [45, 55, 72];
  const now    = new Date();

  // ── CABEÇALHO ──────────────────────────────────────
  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, 45, 'F');
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica','bold');
  doc.setFontSize(22);
  doc.text('3D PRICER PRO', margin, 18);
  doc.setFont('helvetica','normal');
  doc.setFontSize(9);
  doc.setTextColor(180, 200, 230);
  doc.text('Relatório de Precificação', margin, 26);
  doc.setFont('helvetica','bold');
  doc.setFontSize(10);
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
  itemRow('Material Principal',        window.formatBRL(r.materialCost));
  itemRow('Material de Suporte',       window.formatBRL(r.supportCost));
  itemRow('Acabamentos',               window.formatBRL(r.finishingCost));

  y += 2;
  sectionTitle('⚙️ Equipamento & Energia');
  itemRow('Energia Elétrica',          window.formatBRL(r.energyCost));
  itemRow('Depreciação da Impressora', window.formatBRL(r.depreciationCost));
  itemRow('Manutenção (rateada)',       window.formatBRL(r.maintenanceCost));
  itemRow('Consumíveis',               window.formatBRL(r.consumablesCost));
  itemRow('Espaço / Localização',      window.formatBRL(r.spaceCost));

  y += 2;
  sectionTitle('👷 Mão de Obra');
  itemRow('Trabalho Manual',           window.formatBRL(r.laborCost));
  itemRow('Setup / Supervisão',        window.formatBRL(r.setupCost));
  itemRow('Lavagem / Cura',            window.formatBRL(r.washCureCost));

  y += 2;
  sectionTitle('⚠️ Riscos & Extras');
  itemRow('Reserva de Falhas',         window.formatBRL(r.failureReserve));
  itemRow('Pós-processamento',         window.formatBRL(r.postProcessCost));
  itemRow('Embalagem / Envio',         window.formatBRL(r.packagingCost));
  itemRow('Outros Custos',             window.formatBRL(r.otherCosts));

  y += 4;
  doc.setDrawColor(...MID);
  doc.setLineWidth(0.7);
  doc.line(margin, y, W-margin, y);
  y += 6;

  itemRow('Custo Total (unitário)',   window.formatBRL(r.directCost), true);
  itemRow('Impostos',                window.formatBRL(r.taxAmount));
  itemRow('Taxa de Plataforma',      window.formatBRL(r.platformFeeAmount));
  itemRow('Margem de Lucro',         window.formatBRL(r.profitAmount));

  y += 4;
  totalRow('PREÇO FINAL UNITÁRIO', window.formatBRL(r.finalPrice), DARK);

  if (r.quantity > 1) {
    itemRow(`Total do Lote (${r.quantity} unidades)`, window.formatBRL(r.batchPrice), true);
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
  doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...MID);
  doc.text('PREÇO MÍNIMO', margin + bW/2, bY+7, { align:'center' });
  doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...DARK);
  doc.text(window.formatBRL(r.minPrice), margin + bW/2, bY+16, { align:'center' });

  // Sugerido
  doc.setFillColor(...ORANGE);
  doc.roundedRect(margin+bW+4, bY, bW, bH, 3, 3, 'F');
  doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...WHITE);
  doc.text('⭐ SUGERIDO', margin+bW+4 + bW/2, bY+7, { align:'center' });
  doc.setFont('helvetica','bold'); doc.setFontSize(10);
  doc.text(window.formatBRL(r.finalPrice), margin+bW+4 + bW/2, bY+16, { align:'center' });

  // Premium
  doc.setFillColor(...MID);
  doc.roundedRect(margin+bW*2+8, bY, bW, bH, 3, 3, 'F');
  doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...WHITE);
  doc.text('PREMIUM (+20%)', margin+bW*2+8 + bW/2, bY+7, { align:'center' });
  doc.setFont('helvetica','bold'); doc.setFontSize(10);
  doc.text(window.formatBRL(r.premiumPrice), margin+bW*2+8 + bW/2, bY+16, { align:'center' });

  y = bY + bH + 10;

  // ── DESCONTO MÁX ──────────────────────────────────
  if (r.maxDiscount > 0) {
    checkPage(12);
    doc.setFillColor(245, 200, 66, 0.2);
    doc.roundedRect(margin, y, W-margin*2, 10, 2, 2, 'F');
    doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(...TEXT);
    doc.text(`Com desconto máximo de ${r.maxDiscount}%:`, margin+3, y+6.5);
    doc.setFont('helvetica','bold'); doc.setTextColor(...DARK);
    doc.text(window.formatBRL(r.discountedPrice), col2-3, y+6.5, { align:'right' });
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
  window.showToast('PDF exportado com sucesso! 📄', 'fa-file-pdf');
};
