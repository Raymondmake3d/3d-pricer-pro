'use strict';

// ═══════════════════════════════════════════════════════
// SISTEMA DE CLIENTES
// ═══════════════════════════════════════════════════════

const CLIENTS_KEY = '3dpricer_clients';
const QUOTES_KEY  = '3dpricer_quotes';

window.loadClients = function() {
  try { return JSON.parse(localStorage.getItem(CLIENTS_KEY)) || []; }
  catch { return []; }
};

window.saveClients = function(clients) {
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
};

window.loadQuotes = function() {
  try { return JSON.parse(localStorage.getItem(QUOTES_KEY)) || []; }
  catch { return []; }
};

window.saveQuotes = function(quotes) {
  localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));
};

// ═══════════════════════════════════════════════════════
// RENDERIZAÇÃO PRINCIPAL
// ═══════════════════════════════════════════════════════

window.renderClients = function() {
  const container = document.getElementById('tab-clients');
  if (!container) return;

  const clients = window.loadClients();
  const quotes  = window.loadQuotes();

  container.innerHTML = `
    ${window.renderClientStats(clients, quotes)}
    ${window.renderClientForm()}
    ${window.renderClientList(clients, quotes)}
    ${window.renderQuotesList(quotes, clients)}
  `;
};

// ═══════════════════════════════════════════════════════
// ESTATÍSTICAS
// ═══════════════════════════════════════════════════════

window.renderClientStats = function(clients, quotes) {
  const totalClients  = clients.length;
  const totalQuotes   = quotes.length;
  const totalRevenue  = quotes.reduce((s, q) => s + (q.finalPrice * (q.quantity||1)), 0);
  const activeClients = new Set(quotes.map(q => q.clientId)).size;

  return `
  <div class="dash-kpi-grid">
    <div class="dash-kpi-card blue">
      <div class="kpi-icon"><i class="fas fa-users"></i></div>
      <div class="kpi-info">
        <small>Total de Clientes</small>
        <strong>${totalClients}</strong>
        <span>${activeClients} com orçamentos</span>
      </div>
    </div>
    <div class="dash-kpi-card orange">
      <div class="kpi-icon"><i class="fas fa-file-invoice"></i></div>
      <div class="kpi-info">
        <small>Orçamentos Gerados</small>
        <strong>${totalQuotes}</strong>
        <span>Total em orçamentos</span>
      </div>
    </div>
    <div class="dash-kpi-card green">
      <div class="kpi-icon"><i class="fas fa-dollar-sign"></i></div>
      <div class="kpi-info">
        <small>Receita de Orçamentos</small>
        <strong>${window.formatBRL(totalRevenue)}</strong>
        <span>Valor total orçado</span>
      </div>
    </div>
    <div class="dash-kpi-card neutral">
      <div class="kpi-icon"><i class="fas fa-handshake"></i></div>
      <div class="kpi-info">
        <small>Ticket Médio</small>
        <strong>${totalQuotes > 0 ? window.formatBRL(totalRevenue/totalQuotes) : '—'}</strong>
        <span>por orçamento</span>
      </div>
    </div>
  </div>`;
};

// ═══════════════════════════════════════════════════════
// FORMULÁRIO DE CLIENTE
// ═══════════════════════════════════════════════════════

window.renderClientForm = function() {
  return `
  <div class="card" id="client-form-card">
    <div class="result-header">
      <h2><i class="fas fa-user-plus"></i> Cadastrar Cliente</h2>
      <button class="btn-small" onclick="window.toggleClientForm()">
        <i class="fas fa-chevron-down" id="form-toggle-icon"></i>
      </button>
    </div>
    <div id="client-form-body">
      <div class="grid-2" style="margin-top:1rem;">
        <div class="field">
          <label>Nome / Razão Social *</label>
          <input type="text" id="cl-name" placeholder="Ex: João Silva"/>
        </div>
        <div class="field">
          <label>E-mail</label>
          <input type="email" id="cl-email" placeholder="joao@email.com"/>
        </div>
        <div class="field">
          <label>WhatsApp / Telefone</label>
          <input type="tel" id="cl-phone" placeholder="Ex: (99) 99999-9999"/>
        </div>
        <div class="field">
          <label>Cidade / Estado</label>
          <input type="text" id="cl-city" placeholder="Ex: São Paulo - SP"/>
        </div>
        <div class="field">
          <label>Documento (CPF/CNPJ)</label>
          <input type="text" id="cl-doc" placeholder="Ex: 123.456.789-00"/>
        </div>
        <div class="field">
          <label>Observações</label>
          <input type="text" id="cl-notes" placeholder="Ex: Cliente frequente, gosta de PLA"/>
        </div>
      </div>
      <div style="display:flex;gap:0.8rem;margin-top:1.2rem;flex-wrap:wrap;">
        <button class="btn-calculate"
                style="max-width:220px;font-size:0.9rem;padding:0.8rem 1.5rem;"
                onclick="window.addClient()">
          <i class="fas fa-plus"></i> Adicionar Cliente
        </button>
        <button class="btn-small" onclick="window.clearClientForm()">
          <i class="fas fa-eraser"></i> Limpar
        </button>
      </div>
    </div>
  </div>`;
};

window.toggleClientForm = function() {
  const body = document.getElementById('client-form-body');
  const icon = document.getElementById('form-toggle-icon');
  if (body && icon) {
    const isHidden = body.style.display === 'none';
    body.style.display = isHidden ? '' : 'none';
    icon.classList.toggle('fa-chevron-down', isHidden);
    icon.classList.toggle('fa-chevron-up', !isHidden);
  }
};

window.clearClientForm = function() {
  document.getElementById('cl-name').value  = '';
  document.getElementById('cl-email').value = '';
  document.getElementById('cl-phone').value = '';
  document.getElementById('cl-city').value  = '';
  document.getElementById('cl-doc').value   = '';
  document.getElementById('cl-notes').value = '';
  window.showToast('Formulário de cliente limpo!', 'fa-eraser');
};

window.addClient = function() {
  const name  = document.getElementById('cl-name').value.trim();
  const email = document.getElementById('cl-email').value.trim();
  const phone = document.getElementById('cl-phone').value.trim();
  const city  = document.getElementById('cl-city').value.trim();
  const doc   = document.getElementById('cl-doc').value.trim();
  const notes = document.getElementById('cl-notes').value.trim();

  if (!name) {
    window.showToast('Nome do cliente é obrigatório!', 'fa-triangle-exclamation');
    return;
  }

  const clients = window.loadClients();
  const newClient = {
    id: Date.now(),
    name, email, phone, city, doc, notes,
    createdAt: new Date().toLocaleDateString('pt-BR'),
  };
  clients.unshift(newClient);
  window.saveClients(clients);
  window.renderClients();
  window.clearClientForm();
  window.showToast('Cliente adicionado! ✅', 'fa-user-plus');
};

window.editClient = function(id) {
  const clients = window.loadClients();
  const client  = clients.find(c => c.id === id);
  if (!client) return;

  document.getElementById('cl-name').value  = client.name;
  document.getElementById('cl-email').value = client.email;
  document.getElementById('cl-phone').value = client.phone;
  document.getElementById('cl-city').value  = client.city;
  document.getElementById('cl-doc').value   = client.doc;
  document.getElementById('cl-notes').value = client.notes;

  // Remove o cliente da lista para que seja adicionado novamente com as edições
  window.saveClients(clients.filter(c => c.id !== id));

  const body = document.getElementById('client-form-body');
  if (body) body.style.display = '';
  document.getElementById('client-form-card')
    ?.scrollIntoView({ behavior:'smooth', block:'start' });

  window.showToast('Edite os campos e clique em Adicionar para salvar.', 'fa-pen');
};

window.deleteClient = function(id) {
  const clients = window.loadClients();
  const client  = clients.find(c => c.id === id);
  if (!client) return;
  if (!confirm(`Deseja excluir o cliente "${client.name}" e todos os seus orçamentos?`)) return;

  window.saveClients(clients.filter(c => c.id !== id));
  // Remove também os orçamentos associados a este cliente
  window.saveQuotes(window.loadQuotes().filter(q => q.clientId !== id));

  window.renderClients();
  window.showToast('Cliente e orçamentos excluídos.', 'fa-trash');
};

// ═══════════════════════════════════════════════════════
// LISTA DE CLIENTES
// ═══════════════════════════════════════════════════════

window.renderClientList = function(clients, quotes) {
  if (!clients.length) {
    return `
    <div class="card">
      <h2><i class="fas fa-users"></i> Meus Clientes</h2>
      <div class="tips-placeholder">
        <i class="fas fa-user-plus"></i>
        <p>Nenhum cliente cadastrado ainda.<br/>
           Use o formulário acima para adicionar seu primeiro cliente.</p>
      </div>
    </div>`;
  }

  const rows = clients.map(c => {
    const clientQuotes = quotes.filter(q => q.clientId === c.id);
    const totalSpent   = clientQuotes.reduce((s, q) => s + (q.finalPrice * (q.quantity||1)), 0);
    const lastQuote    = clientQuotes.sort((a,b) => b.id - a.id)[0]; // id é o timestamp

    return `
    <div class="client-card">
      <div class="client-header">
        <div class="client-name">
          <i class="fas fa-user"></i> <strong>${c.name}</strong>
        </div>
        <div class="client-meta">
          ${c.phone ? `<span><i class="fas fa-phone"></i> ${c.phone}</span>` : ''}
          ${c.email ? `<span><i class="fas fa-envelope"></i> ${c.email}</span>` : ''}
          ${c.city  ? `<span><i class="fas fa-map-marker-alt"></i> ${c.city}</span>` : ''}
        </div>
      </div>
      <div class="client-stats">
        <div>
          <small>Orçamentos</small>
          <strong>${clientQuotes.length}</strong>
        </div>
        <div>
          <small>Total Orçado</small>
          <strong>${window.formatBRL(totalSpent)}</strong>
        </div>
        <div>
          <small>Último Contato</small>
          <span>${lastQuote?.date || '—'}</span>
        </div>
      </div>
      <div class="client-actions">
        <button class="btn-small" onclick="window.generateQuoteForClient(${c.id})">
          <i class="fas fa-file-invoice"></i> Orçamento
        </button>
        <button class="btn-small" onclick="window.editClient(${c.id})">
          <i class="fas fa-pen"></i> Editar
        </button>
        <button class="btn-small danger" onclick="window.deleteClient(${c.id})">
          <i class="fas fa-trash"></i> Excluir
        </button>
      </div>
    </div>`;
  }).join('');

  return `
  <div class="card">
    <h2><i class="fas fa-users"></i> Meus Clientes (${clients.length})</h2>
    <div class="client-list-grid">
      ${rows}
    </div>
  </div>`;
};

// ═══════════════════════════════════════════════════════
// BADGE DE CLIENTES
// ═══════════════════════════════════════════════════════

window.updateClientsBadge = function(count) {
  const badge = document.getElementById('badge-clients');
  if (badge) {
    badge.textContent = count;
    badge.classList.toggle('hidden', count === 0);
  }
};

// ═══════════════════════════════════════════════════════
// GERAR ORÇAMENTO
// ═══════════════════════════════════════════════════════

window.generateQuoteForClient = function(clientId) {
  if (!window._lastResult) {
    window.showToast('Calcule uma precificação primeiro!', 'fa-triangle-exclamation');
    return;
  }

  const clients = window.loadClients();
  const client  = clients.find(c => c.id === clientId);
  if (!client) return;

  const r      = window._lastResult;
  const quotes = window.loadQuotes();

  const quote = {
    id:           Date.now(),
    clientId,
    clientName:   client.name,
    date:         new Date().toLocaleDateString('pt-BR'),
    dateTime:     new Date().toLocaleString('pt-BR'),
    status:       'pending',
    printerName:  r.printerName   || 'Impressora',
    materialType: r.materialType  || '—',
    partWeight:   r.partWeight,
    printHours:   r.printHours,
    finalPrice:   r.finalPrice,
    directCost:   r.directCost,
    profitMargin: r.profitMargin,
    quantity:     r.quantity,
    batchPrice:   r.batchPrice,
    data:         r,
    notes:        '',
  };

  quotes.unshift(quote);
  window.saveQuotes(quotes);
  window.renderClients();
  window.showToast(`Orçamento gerado para ${client.name}! 📄`, 'fa-file-invoice');
  setTimeout(() => window.exportClientQuotePDF(quote, client), 400);
};

// ═══════════════════════════════════════════════════════
// LISTA DE ORÇAMENTOS
// ═══════════════════════════════════════════════════════

window.renderQuotesList = function(quotes, clients) {
  if (!quotes.length) {
    return `
    <div class="card">
      <h2><i class="fas fa-file-invoice"></i> Orçamentos Enviados</h2>
      <div class="tips-placeholder">
        <i class="fas fa-file-invoice"></i>
        <p>Nenhum orçamento gerado ainda.<br/>
           Calcule uma precificação e clique em "Orçamento" em um cliente.</p>
      </div>
    </div>`;
  }

  const statusLabels = {
    pending:  { label:'⏳ Aguardando', color:'#f07b30' },
    approved: { label:'✅ Aprovado',   color:'#27ae60' },
    rejected: { label:'❌ Recusado',   color:'#e74c3c' },
    done:     { label:'🏁 Concluído',  color:'#2c4a7c' },
  };

  const rows = quotes.map(q => {
    const st = statusLabels[q.status] || statusLabels.pending;
    return `
    <div class="quote-card" id="quote-${q.id}">
      <div class="quote-header">
        <div>
          <div class="quote-client">
            <i class="fas fa-user"></i>
            <strong>${q.clientName}</strong>
          </div>
          <div class="quote-meta">
            <span><i class="fas fa-calendar"></i> ${q.date}</span>
            <span><i class="fas fa-layer-group"></i> ${q.materialType}</span>
            <span><i class="fas fa-weight-hanging"></i> ${q.partWeight}g</span>
            <span><i class="fas fa-clock"></i> ${q.printHours}h</span>
            <span><i class="fas fa-boxes-stacked"></i> ${q.quantity}x</span>
          </div>
        </div>
        <div class="quote-right">
          <div class="quote-price">
            <small>Valor Total</small>
            <strong>${window.formatBRL(q.batchPrice || q.finalPrice)}</strong>
          </div>
          <div style="color:${st.color};font-size:0.8rem;font-weight:700;margin-top:0.3rem;">
            ${st.label}
          </div>
        </div>
      </div>
      <div class="quote-actions">
        <select onchange="window.updateQuoteStatus(${q.id}, this.value)"
                style="padding:0.35rem 0.6rem;border:2px solid var(--border);
                       border-radius:8px;font-family:Poppins,sans-serif;
                       font-size:0.8rem;background:var(--light-gray);color:var(--text)">
          <option value="pending"  ${q.status==='pending' ?'selected':''}>⏳ Aguardando</option>
          <option value="approved" ${q.status==='approved'?'selected':''}>✅ Aprovado</option>
          <option value="rejected" ${q.status==='rejected'?'selected':''}>❌ Recusado</option>
          <option value="done"     ${q.status==='done'    ?'selected':''}>🏁 Concluído</option>
        </select>
        <button class="btn-small" onclick="window.exportClientQuotePDFById(${q.id})">
          <i class="fas fa-file-pdf"></i> PDF
        </button>
        <button class="btn-small" onclick="window.shareQuoteWhatsApp(${q.id})">
          <i class="fab fa-whatsapp" style="color:#25d366"></i> WhatsApp
        </button>
        <button class="btn-small danger" onclick="window.deleteQuote(${q.id})">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>`;
  }).join('');

  return `
  <div class="card">
    <div class="result-header">
      <h2><i class="fas fa-file-invoice"></i> Orçamentos (${quotes.length})</h2>
      <button class="btn-small" onclick="window.exportAllQuotesCSV()">
        <i class="fas fa-file-csv"></i> Exportar CSV
      </button>
    </div>
    ${rows}
  </div>`;
};

// ═══════════════════════════════════════════════════════
// STATUS
// ═══════════════════════════════════════════════════════

window.updateQuoteStatus = function(id, status) {
  const quotes = window.loadQuotes();
  const quote  = quotes.find(q => q.id === id);
  if (quote) {
    quote.status = status;
    window.saveQuotes(quotes);
    window.showToast('Status atualizado! ✅', 'fa-circle-check');
    window.renderClients(); // Re-renderiza para atualizar a lista e badges
  }
};

window.deleteQuote = function(id) {
  if (!confirm('Deseja excluir este orçamento?')) return;
  window.saveQuotes(window.loadQuotes().filter(q => q.id !== id));
  window.renderClients();
  window.showToast('Orçamento excluído.', 'fa-trash');
};

// ═══════════════════════════════════════════════════════
// WHATSAPP
// ═══════════════════════════════════════════════════════

window.shareQuoteWhatsApp = function(id) {
  const quotes = window.loadQuotes();
  const q      = quotes.find(qu => qu.id === id);
  if (!q) return;

  const lines = [
    `🖨️ *Orçamento 3D — ${q.date}*`,
    ``,
    `Olá, ${q.clientName}! Segue o orçamento:`,
    ``,
    `📦 Peça: ${q.printerName || 'Peça 3D'}`,
    `🧵 Material: ${q.materialType}`,
    `⚖️ Peso: ${q.partWeight}g`,
    `⏱️ Tempo: ${q.printHours}h`,
    `📦 Quantidade: ${q.quantity}x`,
    ``,
    `💰 *Valor Total: ${window.formatBRL(q.batchPrice || q.finalPrice)}*`,
    ``,
    `Qualquer dúvida, estou à disposição! 😊`,
  ].join('\n');

  window.open(`https://wa.me/?text=${encodeURIComponent(lines)}`, '_blank');
};

// ═══════════════════════════════════════════════════════
// PDF DO ORÇAMENTO
// ═══════════════════════════════════════════════════════

window.exportClientQuotePDFById = function(id) {
  const quotes  = window.loadQuotes();
  const clients = window.loadClients();
  const q       = quotes.find(qu => qu.id === id);
  if (!q) return;
  const client = clients.find(c => c.id === q.clientId) || { name: q.clientName };
  window.exportClientQuotePDF(q, client);
};

window.exportClientQuotePDF = function(quote, client) {
  if (!window.jspdf) {
    window.showToast('Biblioteca PDF não carregada!', 'fa-triangle-exclamation');
    return;
  }

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
  const MUTED  = [113,128,150];
  const TEXT   = [45, 55, 72];

  // CABEÇALHO
  doc.setFillColor(...DARK); doc.rect(0,0,W,48,'F');
  doc.setTextColor(...WHITE); doc.setFont('helvetica','bold');
  doc.setFontSize(20); doc.text('ORÇAMENTO', margin, 18);
  doc.setFont('helvetica','normal'); doc.setFontSize(9);
  doc.setTextColor(180,200,230);
  doc.text('3D Pricer Pro — Impressão 3D Profissional', margin, 26);
  doc.setFont('helvetica','bold'); doc.setFontSize(10);
  doc.setTextColor(...YELLOW);
  doc.text(`Nº ${String(quote.id).slice(-6)}`, col2, 18, { align:'right' });
  doc.setFont('helvetica','normal'); doc.setFontSize(9);
  doc.setTextColor(180,200,230);
  doc.text(`Data: ${quote.date}`, col2, 26, { align:'right' });
  doc.text('Validade: 15 dias', col2, 33, { align:'right' });

  y = 58;

  // CLIENTE
  doc.setFillColor(...GRAY);
  doc.roundedRect(margin, y-4, W-margin*2, 30, 3, 3, 'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(8);
  doc.setTextColor(...MUTED); doc.text('CLIENTE', margin+4, y+2);
  doc.setFont('helvetica','bold'); doc.setFontSize(11);
  doc.setTextColor(...DARK); doc.text(client.name || '—', margin+4, y+10);
  doc.setFont('helvetica','normal'); doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  const info = [
    client.email ? `E-mail: ${client.email}` : null,
    client.phone ? `Tel: ${client.phone}`     : null,
    client.city  ? `Local: ${client.city}`    : null,
    client.doc   ? `Doc: ${client.doc}`       : null,
  ].filter(Boolean).join('   ·   ');
  doc.text(info, margin+4, y+18);
  y += 40;

  // TABELA
  doc.setFont('helvetica','bold'); doc.setFontSize(9.5);
  doc.setTextColor(...DARK); doc.text('DETALHES DA PEÇA', margin, y);
  y += 6;

  doc.setFillColor(...DARK); doc.rect(margin, y, W-margin*2, 8, 'F');
  doc.setTextColor(...WHITE); doc.setFont('helvetica','bold'); doc.setFontSize(8.5);
  doc.text('Descrição', margin+3, y+5);
  doc.text('Qtd.', 130, y+5);
  doc.text('Unit.', 155, y+5);
  doc.text('Total', col2-3, y+5, { align:'right' });
  y += 12;

  doc.setFillColor(250,251,253); doc.rect(margin, y-3, W-margin*2, 10, 'F');
  doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...TEXT);
  doc.text(`Peça em ${quote.materialType} — ${quote.partWeight}g · ${quote.printHours}h`, margin+3, y+3);
  doc.text(String(quote.quantity), 133, y+3);
  doc.text(window.formatBRL(quote.finalPrice), 155, y+3);
  doc.text(window.formatBRL(quote.batchPrice || quote.finalPrice), col2-3, y+3, { align:'right' });
  y += 14;

  // DETALHES
  function detailRow(label, value) {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFont('helvetica','normal'); doc.setFontSize(8.5);
    doc.setTextColor(...MUTED); doc.text(label, margin+4, y);
    doc.setTextColor(...TEXT);
    doc.text(window.formatBRL(value), col2-3, y, { align:'right' });
    doc.setDrawColor(230,234,240); doc.setLineWidth(0.3);
    doc.line(margin, y+2, W-margin, y+2);
    y += 8;
  }

  y += 4;
  doc.setFont('helvetica','bold'); doc.setFontSize(9);
  doc.setTextColor(...DARK); doc.text('Composição do Preço', margin, y);
  y += 7;

  const r = quote.data;
  if (r) {
    detailRow('Material principal',      r.materialCost || 0);
    detailRow('Energia elétrica',        r.energyCost   || 0);
    detailRow('Depreciação equipamento', r.depreciationCost || 0);
    detailRow('Mão de obra',             (r.laborCost||0) + (r.setupCost||0));
    if ((r.packagingCost  || 0) > 0) detailRow('Embalagem / Envio',   r.packagingCost);
    if ((r.postProcessCost|| 0) > 0) detailRow('Pós-processamento',   r.postProcessCost);
  }

  y += 4;
  doc.setFillColor(...GRAY); doc.roundedRect(margin, y, W-margin*2, 8, 2, 2, 'F');
  doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...TEXT);
  doc.text('Subtotal', margin+4, y+5);
  doc.text(window.formatBRL(quote.finalPrice), col2-3, y+5, { align:'right' });
  y += 12;

  if ((r?.taxAmount || 0) > 0) {
    doc.setTextColor(...MUTED);
    doc.text('Impostos / Taxas', margin+4, y+5);
    doc.text(window.formatBRL(r.taxAmount), col2-3, y+5, { align:'right' });
    y += 10;
  }

  // TOTAL FINAL
  doc.setFillColor(...DARK); doc.roundedRect(margin, y, W-margin*2, 14, 3, 3, 'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...WHITE);
  doc.text('VALOR TOTAL', margin+4, y+9);
  doc.setTextColor(...YELLOW); doc.setFontSize(12);
  doc.text(window.formatBRL(quote.batchPrice || quote.finalPrice), col2-4, y+9, { align:'right' });
  y += 22;

  // CONDIÇÕES
  doc.setFillColor(255,250,240); doc.roundedRect(margin, y, W-margin*2, 28, 3, 3, 'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...ORANGE);
  doc.text('📋 Condições e Prazo', margin+4, y+8);
  doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(...TEXT);
  doc.text('• Prazo de produção: a combinar após aprovação', margin+4, y+15);
  doc.text('• Pagamento: 50% na aprovação · 50% na entrega', margin+4, y+21);
  doc.text('• Validade deste orçamento: 15 dias corridos', col2/2, y+15);
  doc.text('• Frete não incluso (combinado à parte)', col2/2, y+21);
  y += 36;

  // RODAPÉ
  doc.setFillColor(...DARK); doc.rect(0,285,W,12,'F');
  doc.setFont('helvetica','normal'); doc.setFontSize(8);
  doc.setTextColor(180,200,230);
  doc.text('3D Pricer Pro · Orçamento gerado automaticamente', margin, 292);
  doc.text(`Nº ${String(quote.id).slice(-6)} · ${quote.date}`, col2, 292, { align:'right' });

  doc.save(`orcamento-${client.name.replace(/\s+/g,'-')}-${quote.id}.pdf`);
  window.showToast('PDF do orçamento exportado! 📄', 'fa-file-pdf');
};

// ═══════════════════════════════════════════════════════
// EXPORTAR CSV
// ═══════════════════════════════════════════════════════

window.exportAllQuotesCSV = function() {
  const quotes = window.loadQuotes();
  if (!quotes.length) {
    window.showToast('Nenhum orçamento para exportar!', 'fa-triangle-exclamation');
    return;
  }

  const header = [
    'ID','Data','Cliente','Material','Peso(g)',
    'Tempo(h)','Qtd','Preço Unit(R$)','Total(R$)','Status'
  ].join(';');

  const rows = quotes.map(q => [
    String(q.id).slice(-6), q.date, q.clientName, q.materialType,
    q.partWeight, q.printHours, q.quantity,
    (q.finalPrice||0).toFixed(2).replace('.',','),
    (q.batchPrice||q.finalPrice||0).toFixed(2).replace('.',','),
    q.status,
  ].join(';')).join('\n');

  const blob = new Blob(['\uFEFF'+header+'\n'+rows], { type:'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), {
    href: url,
    download: `orcamentos-${new Date().toISOString().slice(0,10)}.csv`
  });
  a.click();
  URL.revokeObjectURL(url);
  window.showToast('CSV exportado! 📊', 'fa-file-csv');
};
