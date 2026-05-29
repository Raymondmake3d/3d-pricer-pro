'use strict';

// ═══════════════════════════════════════════════════════
// SISTEMA DE CLIENTES
// ═══════════════════════════════════════════════════════

const CLIENTS_KEY = '3dpricer_clients';
const QUOTES_KEY  = '3dpricer_quotes';

// ── CRUD de Clientes ──
function loadClients() {
  try { return JSON.parse(localStorage.getItem(CLIENTS_KEY)) || []; }
  catch { return []; }
}

function saveClients(clients) {
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
}

function loadQuotes() {
  try { return JSON.parse(localStorage.getItem(QUOTES_KEY)) || []; }
  catch { return []; }
}

function saveQuotes(quotes) {
  localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));
}

// ═══════════════════════════════════════════════════════
// RENDERIZAÇÃO PRINCIPAL
// ═══════════════════════════════════════════════════════

function renderClients() {
  const container = document.getElementById('tab-clients');
  if (!container) return;

  const clients = loadClients();
  const quotes  = loadQuotes();

  container.innerHTML = `
    ${renderClientStats(clients, quotes)}
    ${renderClientForm()}
    ${renderClientList(clients, quotes)}
    ${renderQuotesList(quotes, clients)}
  `;
}

// ═══════════════════════════════════════════════════════
// ESTATÍSTICAS DE CLIENTES
// ═══════════════════════════════════════════════════════

function renderClientStats(clients, quotes) {
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
        <strong>${formatBRL(totalRevenue)}</strong>
        <span>Valor total orçado</span>
      </div>
    </div>
    <div class="dash-kpi-card neutral">
      <div class="kpi-icon"><i class="fas fa-handshake"></i></div>
      <div class="kpi-info">
        <small>Ticket Médio</small>
        <strong>${totalQuotes > 0 ? formatBRL(totalRevenue/totalQuotes) : '—'}</strong>
        <span>por orçamento</span>
      </div>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════
// FORMULÁRIO DE CLIENTE
// ═══════════════════════════════════════════════════════

function renderClientForm() {
  return `
  <div class="card" id="client-form-card">
    <div class="result-header">
      <h2><i class="fas fa-user-plus"></i> Cadastrar Cliente</h2>
      <button class="btn-small" onclick="toggleClientForm()">
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
          <input type="tel" id="cl-phone" placeholder="(11) 99999-9999"/>
        </div>
        <div class="field">
          <label>CPF / CNPJ</label>
          <input type="text" id="cl-doc" placeholder="000.000.000-00"/>
        </div>
        <div class="field">
          <label>Cidade / Estado</label>
          <input type="text" id="cl-city" placeholder="São Paulo, SP"/>
        </div>
        <div class="field">
          <label>Categoria</label>
          <select id="cl-category">
            <option value="individual">👤 Pessoa Física</option>
            <option value="empresa">🏢 Empresa</option>
            <option value="maker">🖨️ Maker / Parceiro</option>
            <option value="recorrente">⭐ Cliente Recorrente</option>
          </select>
        </div>
        <div class="field" style="grid-column:1/-1">
          <label>Observações</label>
          <input type="text" id="cl-notes"
                 placeholder="Ex: Prefere entrega em mãos, desconto de 5%..."/>
        </div>
      </div>
      <div style="display:flex;gap:0.8rem;margin-top:1.2rem;flex-wrap:wrap;">
        <button class="btn-calculate"
                style="max-width:220px;font-size:0.9rem;padding:0.8rem 1.5rem;"
                onclick="addClient()">
          <i class="fas fa-user-plus"></i> Cadastrar Cliente
        </button>
        <button class="btn-small" onclick="clearClientForm()">
          <i class="fas fa-eraser"></i> Limpar
        </button>
      </div>
    </div>
  </div>`;
}

function toggleClientForm() {
  const body = document.getElementById('client-form-body');
  const icon = document.getElementById('form-toggle-icon');
  if (!body) return;
  const hidden = body.style.display === 'none';
  body.style.display = hidden ? '' : 'none';
  icon.className = hidden ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
}

function clearClientForm() {
  ['cl-name','cl-email','cl-phone','cl-doc','cl-city','cl-notes']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  const cat = document.getElementById('cl-category');
  if (cat) cat.selectedIndex = 0;
}

// ═══════════════════════════════════════════════════════
// ADICIONAR CLIENTE
// ═══════════════════════════════════════════════════════

function addClient() {
  const name = document.getElementById('cl-name')?.value?.trim();
  if (!name) {
    showToast('Informe o nome do cliente!', 'fa-triangle-exclamation');
    document.getElementById('cl-name')?.focus();
    return;
  }

  const clients = loadClients();

  const client = {
    id:       Date.now(),
    name,
    email:    document.getElementById('cl-email')?.value?.trim()    || '',
    phone:    document.getElementById('cl-phone')?.value?.trim()    || '',
    doc:      document.getElementById('cl-doc')?.value?.trim()      || '',
    city:     document.getElementById('cl-city')?.value?.trim()     || '',
    category: document.getElementById('cl-category')?.value        || 'individual',
    notes:    document.getElementById('cl-notes')?.value?.trim()    || '',
    createdAt: new Date().toLocaleDateString('pt-BR'),
    totalSpent: 0,
    quotesCount: 0,
  };

  clients.unshift(client);
  saveClients(clients);
  clearClientForm();
  renderClients();
  showToast(`Cliente "${name}" cadastrado!`, 'fa-user-plus');
}

// ═══════════════════════════════════════════════════════
// LISTA DE CLIENTES
// ═══════════════════════════════════════════════════════

function renderClientList(clients, quotes) {
  if (!clients.length) {
    return `
    <div class="card">
      <h2><i class="fas fa-users"></i> Clientes Cadastrados</h2>
      <div class="tips-placeholder">
        <i class="fas fa-user-plus"></i>
        <p>Nenhum cliente cadastrado ainda.<br/>
           Use o formulário acima para adicionar.</p>
      </div>
    </div>`;
  }

  // Calcula totais por cliente
  const clientQuotes = {};
  quotes.forEach(q => {
    if (!clientQuotes[q.clientId])
      clientQuotes[q.clientId] = { count:0, total:0 };
    clientQuotes[q.clientId].count ++;
    clientQuotes[q.clientId].total += q.finalPrice * (q.quantity||1);
  });

  const categoryIcons = {
    individual:  '👤',
    empresa:     '🏢',
    maker:       '🖨️',
    recorrente:  '⭐',
  };
  const categoryLabels = {
    individual:  'Pessoa Física',
    empresa:     'Empresa',
    maker:       'Maker',
    recorrente:  'Recorrente',
  };

  const cards = clients.map(c => {
    const cq      = clientQuotes[c.id] || { count:0, total:0 };
    const initials = c.name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();

    return `
    <div class="client-card" id="client-${c.id}">
      <div class="client-avatar">${initials}</div>
      <div class="client-info">
        <div class="client-name">
          ${categoryIcons[c.category] || '👤'}
          <strong>${c.name}</strong>
          <span class="client-cat-badge">${categoryLabels[c.category]||''}</span>
        </div>
        <div class="client-meta">
          ${c.email  ? `<span><i class="fas fa-envelope"></i> ${c.email}</span>` : ''}
          ${c.phone  ? `<span><i class="fas fa-phone"></i> ${c.phone}</span>`   : ''}
          ${c.city   ? `<span><i class="fas fa-location-dot"></i> ${c.city}</span>` : ''}
          <span><i class="fas fa-calendar"></i> desde ${c.createdAt}</span>
        </div>
        ${c.notes ? `<div class="client-notes"><i class="fas fa-note-sticky"></i> ${c.notes}</div>` : ''}
      </div>
      <div class="client-stats">
        <div class="client-stat">
          <small>Orçamentos</small>
          <strong>${cq.count}</strong>
        </div>
        <div class="client-stat">
          <small>Total Gasto</small>
          <strong>${formatBRL(cq.total)}</strong>
        </div>
      </div>
      <div class="client-actions">
        <button class="btn-small" onclick="generateQuoteForClient(${c.id})"
                title="Gerar Orçamento">
          <i class="fas fa-file-invoice"></i> Orçamento
        </button>
        <button class="btn-small" onclick="editClient(${c.id})"
                title="Editar">
          <i class="fas fa-pen"></i>
        </button>
        <button class="btn-small danger" onclick="deleteClient(${c.id})"
                title="Excluir">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>`;
  }).join('');

  return `
  <div class="card">
    <div class="result-header">
      <h2><i class="fas fa-users"></i> Clientes Cadastrados (${clients.length})</h2>
      <div style="display:flex;gap:0.6rem;">
        <input type="text" id="client-search"
               placeholder="🔍 Buscar cliente..."
               oninput="searchClients(this.value)"
               style="padding:0.4rem 0.8rem;border:2px solid var(--border);
                      border-radius:8px;font-family:Poppins,sans-serif;
                      font-size:0.85rem;background:var(--light-gray);color:var(--text)"/>
      </div>
    </div>
    <div id="client-list">${cards}</div>
  </div>`;
}

// ═══════════════════════════════════════════════════════
// BUSCA DE CLIENTES
// ═══════════════════════════════════════════════════════

function searchClients(query) {
  const q       = query.toLowerCase();
  const clients = loadClients();
  const quotes  = loadQuotes();

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(q)  ||
    c.email.toLowerCase().includes(q) ||
    c.city.toLowerCase().includes(q)  ||
    c.phone.includes(q)
  );

  const list = document.getElementById('client-list');
  if (!list) return;

  if (!filtered.length) {
    list.innerHTML = `
      <div class="tips-placeholder" style="padding:1.5rem">
        <i class="fas fa-search"></i>
        <p>Nenhum cliente encontrado para "${query}"</p>
      </div>`;
    return;
  }

  // Re-renderiza apenas a lista
  const tmp = document.createElement('div');
  tmp.innerHTML = renderClientList(filtered, quotes);
  const newList = tmp.querySelector('#client-list');
  if (newList) list.innerHTML = newList.innerHTML;
}

// ═══════════════════════════════════════════════════════
// EDITAR / EXCLUIR CLIENTE
// ═══════════════════════════════════════════════════════

function deleteClient(id) {
  const clients = loadClients();
  const client  = clients.find(c => c.id === id);
  if (!client) return;

  if (!confirm(`Deseja excluir o cliente "${client.name}"?`)) return;

  saveClients(clients.filter(c => c.id !== id));
  renderClients();
  showToast('Cliente excluído.', 'fa-trash');
}

function editClient(id) {
  const clients = loadClients();
  const c       = clients.find(cl => cl.id === id);
  if (!c) return;

  // Preenche o formulário com dados do cliente
  const fields = {
    'cl-name': c.name, 'cl-email': c.email,
    'cl-phone': c.phone, 'cl-doc': c.doc,
    'cl-city': c.city, 'cl-notes': c.notes,
  };
  Object.entries(fields).forEach(([fid, val]) => {
    const el = document.getElementById(fid);
    if (el) el.value = val || '';
  });

  const cat = document.getElementById('cl-category');
  if (cat) cat.value = c.category || 'individual';

  // Remove o cliente atual para re-cadastrar
  saveClients(clients.filter(cl => cl.id !== id));

  // Mostra o formulário
  const body = document.getElementById('client-form-body');
  if (body) body.style.display = '';

  // Scroll para o form
  document.getElementById('client-form-card')
    ?.scrollIntoView({ behavior:'smooth', block:'start' });

  showToast('Edite os dados e recadastre.', 'fa-pen');
}

// ═══════════════════════════════════════════════════════
// GERAR ORÇAMENTO PARA CLIENTE
// ═══════════════════════════════════════════════════════

function generateQuoteForClient(clientId) {
  if (!window._lastResult) {
    showToast('Calcule uma precificação primeiro!', 'fa-triangle-exclamation');
    return;
  }

  const clients = loadClients();
  const client  = clients.find(c => c.id === clientId);
  if (!client) return;

  const r      = window._lastResult;
  const quotes = loadQuotes();

  const quote = {
    id:          Date.now(),
    clientId,
    clientName:  client.name,
    date:        new Date().toLocaleDateString('pt-BR'),
    dateTime:    new Date().toLocaleString('pt-BR'),
    status:      'pending',
    printerName: r.printerName  || 'Impressora',
    materialType:r.materialType || '—',
    partWeight:  r.partWeight,
    printHours:  r.printHours,
    finalPrice:  r.finalPrice,
    directCost:  r.directCost,
    profitMargin:r.profitMargin,
    quantity:    r.quantity,
    batchPrice:  r.batchPrice,
    data:        r,
    notes:       '',
  };

  quotes.unshift(quote);
  saveQuotes(quotes);
  renderClients();

  showToast(`Orçamento gerado para ${client.name}!`, 'fa-file-invoice');

  // Exporta PDF do orçamento para o cliente
  setTimeout(() => exportClientQuotePDF(quote, client), 400);
}

// ═══════════════════════════════════════════════════════
// LISTA DE ORÇAMENTOS
// ═══════════════════════════════════════════════════════

function renderQuotesList(quotes, clients) {
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
            <strong>${formatBRL(q.batchPrice || q.finalPrice)}</strong>
          </div>
          <div class="quote-status"
               style="color:${st.color};font-size:0.8rem;font-weight:700;">
            ${st.label}
          </div>
        </div>
      </div>
      <div class="quote-actions">
        <select class="quote-status-select"
                onchange="updateQuoteStatus(${q.id}, this.value)"
                style="padding:0.35rem 0.6rem;border:2px solid var(--border);
                       border-radius:8px;font-family:Poppins,sans-serif;
                       font-size:0.8rem;background:var(--light-gray);color:var(--text)">
          <option value="pending"  ${q.status==='pending' ?'selected':''}>⏳ Aguardando</option>
          <option value="approved" ${q.status==='approved'?'selected':''}>✅ Aprovado</option>
          <option value="rejected" ${q.status==='rejected'?'selected':''}>❌ Recusado</option>
          <option value="done"     ${q.status==='done'    ?'selected':''}>🏁 Concluído</option>
        </select>
        <button class="btn-small" onclick="exportClientQuotePDFById(${q.id})">
          <i class="fas fa-file-pdf"></i> PDF
        </button>
        <button class="btn-small" onclick="shareQuoteWhatsApp(${q.id})">
          <i class="fab fa-whatsapp"></i> WhatsApp
        </button>
        <button class="btn-small danger" onclick="deleteQuote(${q.id})">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>`;
  }).join('');

  return `
  <div class="card">
    <div class="result-header">
      <h2><i class="fas fa-file-invoice"></i> Orçamentos (${quotes.length})</h2>
      <button class="btn-small" onclick="exportAllQuotesCSV()">
        <i class="fas fa-file-csv"></i> Exportar CSV
      </button>
    </div>
    ${rows}
  </div>`;
}

// ═══════════════════════════════════════════════════════
// STATUS DO ORÇAMENTO
// ═══════════════════════════════════════════════════════

function updateQuoteStatus(id, status) {
  const quotes = loadQuotes();
  const quote  = quotes.find(q => q.id === id);
  if (quote) {
    quote.status = status;
    saveQuotes(quotes);
    showToast('Status atualizado!', 'fa-circle-check');
  }
}

function deleteQuote(id) {
  if (!confirm('Deseja excluir este orçamento?')) return;
  saveQuotes(loadQuotes().filter(q => q.id !== id));
  renderClients();
  showToast('Orçamento excluído.', 'fa-trash');
}

// ═══════════════════════════════════════════════════════
// WHATSAPP
// ═══════════════════════════════════════════════════════

function shareQuoteWhatsApp(id) {
  const quotes = loadQuotes();
  const q      = quotes.find(qu => qu.id === id);
  if (!q) return;

  const text = encodeURIComponent(
`🖨️ *Orçamento 3D — ${q.date}*

Olá, ${q.clientName}! Segue o orçamento:

📦 Peça: ${q.printerName || 'Peça 3D'}
🧵 Material: ${q.materialType}
⚖️ Peso: ${q.partWeight}g
⏱️ Tempo: ${q.printHours}h
📦 Quantidade: ${q.quantity}x

💰 *Valor Total: ${formatBRL(q.batchPrice || q.finalPrice)}*

Qualquer dúvida, estou à disposição! 😊`
  );

  window.open(`https://wa.me/?text=${text}`, '_blank');
}

// ═══════════════════════════════════════════════════════
// PDF DO ORÇAMENTO PARA CLIENTE
// ═══════════════════════════════════════════════════════

function exportClientQuotePDFById(id) {
  const quotes  = loadQuotes();
  const clients = loadClients();
  const q       = quotes.find(qu => qu.id === id);
  if (!q) return;
  const client = clients.find(c => c.id === q.clientId) || { name: q.clientName };
  exportClientQuotePDF(q, client);
}

function exportClientQuotePDF(quote, client) {
  if (!window.jspdf) {
    showToast('Biblioteca PDF não carregada!', 'fa-triangle-exclamation');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });

  const W      = 210;
  const margin = 18;
  const col2   = W - margin;
  let y        = 0;

  const DARK   = [26,42,74];
  const ORANGE = [240,123,48];
  const YELLOW = [245,200,66];
  const WHITE  = [255,255,255];
  const GRAY   = [240,242,245];
  const MUTED  = [113,128,150];
  const TEXT   = [45,55,72];

  // ── CABEÇALHO ──
  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, 48, 'F');

  doc.setTextColor(...WHITE);
  doc.setFont('helvetica','bold');
  doc.setFontSize(20);
  doc.text('ORÇAMENTO', margin, 18);

  doc.setFont('helvetica','normal');
  doc.setFontSize(9);
  doc.setTextColor(180,200,230);
  doc.text('3D Pricer Pro — Impressão 3D Profissional', margin, 26);

  // Número do orçamento
  doc.setFont('helvetica','bold');
  doc.setFontSize(10);
  doc.setTextColor(...YELLOW);
  doc.text(`Nº ${String(quote.id).slice(-6)}`, col2, 18, { align:'right' });
  doc.setFont('helvetica','normal');
  doc.setFontSize(9);
  doc.setTextColor(180,200,230);
  doc.text(`Data: ${quote.date}`, col2, 26, { align:'right' });
  doc.text(`Validade: 15 dias`, col2, 33, { align:'right' });

  y = 58;

  // ── DADOS DO CLIENTE ──
  doc.setFillColor(...GRAY);
  doc.roundedRect(margin, y-4, W-margin*2, 30, 3, 3, 'F');

  doc.setFont('helvetica','bold');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text('CLIENTE', margin+4, y+2);

  doc.setFont('helvetica','bold');
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.text(client.name || '—', margin+4, y+10);

  doc.setFont('helvetica','normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);

  let clientInfo = [];
  if (client.email) clientInfo.push(`E-mail: ${client.email}`);
  if (client.phone) clientInfo.push(`Tel: ${client.phone}`);
  if (client.city)  clientInfo.push(`Local: ${client.city}`);
  if (client.doc)   clientInfo.push(`Doc: ${client.doc}`);

  doc.text(clientInfo.join('   ·   '), margin+4, y+18);
  y += 40;

  // ── DETALHES DA PEÇA ──
  doc.setFont('helvetica','bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...DARK);
  doc.text('DETALHES DA PEÇA', margin, y);
  y += 6;

  doc.setFillColor(...DARK);
  doc.rect(margin, y, W-margin*2, 8, 'F');
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica','bold');
  doc.setFontSize(8.5);
  doc.text('Descrição', margin+3, y+5);
  doc.text('Qtd.', 130, y+5);
  doc.text('Unit.', 155, y+5);
  doc.text('Total', col2-3, y+5, { align:'right' });
  y += 12;

  const r = quote.data;

  // Linha principal
  doc.setFillColor(250,251,253);
  doc.rect(margin, y-3, W-margin*2, 10, 'F');
  doc.setFont('helvetica','normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT);
  doc.text(`Peça em ${quote.materialType} — ${quote.partWeight}g · ${quote.printHours}h impressão`, margin+3, y+3);
  doc.text(String(quote.quantity), 133, y+3);
  doc.text(formatBRL(quote.finalPrice), 155, y+3);
  doc.text(formatBRL(quote.batchPrice || quote.finalPrice), col2-3, y+3, { align:'right' });
  y += 14;

  // ── RESUMO DE CUSTOS (detalhado) ──
  doc.setDrawColor(...GRAY);
  doc.setLineWidth(0.5);

  function detailRow(label, value) {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFont('helvetica','normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text(label, margin+4, y);
    doc.setTextColor(...TEXT);
    doc.text(formatBRL(value), col2-3, y, { align:'right' });
    doc.line(margin, y+2, W-margin, y+2);
    y += 8;
  }

  y += 4;
  doc.setFont('helvetica','bold');
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.text('Composição do Preço', margin, y);
  y += 7;

  if (r) {
    detailRow('Material principal',   r.materialCost);
    detailRow('Energia elétrica',     r.energyCost);
    detailRow('Depreciação equipamento', r.depreciationCost);
    detailRow('Mão de obra',          r.laborCost + r.setupCost);
    if (r.packagingCost > 0) detailRow('Embalagem / Envio', r.packagingCost);
    if (r.postProcessCost > 0) detailRow('Pós-processamento', r.postProcessCost);
  }

  y += 4;

  // ── TOTAIS ──
  doc.setFillColor(...GRAY);
  doc.roundedRect(margin, y, W-margin*2, 8, 2, 2, 'F');
  doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...TEXT);
  doc.text('Subtotal', margin+4, y+5);
  doc.text(formatBRL(quote.finalPrice), col2-3, y+5, { align:'right' });
  y += 12;

  if (r?.taxAmount > 0) {
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...MUTED);
    doc.text('Impostos / Taxas', margin+4, y+5);
    doc.text(formatBRL(r.taxAmount), col2-3, y+5, { align:'right' });
    y += 10;
  }

  // Total final
  doc.setFillColor(...DARK);
  doc.roundedRect(margin, y, W-margin*2, 14, 3, 3, 'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(10);
  doc.setTextColor(...WHITE);
  doc.text('VALOR TOTAL', margin+4, y+9);
  doc.setTextColor(...YELLOW);
  doc.setFontSize(12);
  doc.text(formatBRL(quote.batchPrice || quote.finalPrice), col2-4, y+9, { align:'right' });
  y += 22;

  // ── PRAZO E CONDIÇÕES ──
  doc.setFillColor(255,250,240);
  doc.roundedRect(margin, y, W-margin*2, 28, 3, 3, 'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...ORANGE);
  doc.text('📋 Condições e Prazo', margin+4, y+8);
  doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(...TEXT);
  doc.text('• Prazo de produção: a combinar após aprovação', margin+4, y+15);
  doc.text('• Pagamento: 50% na aprovação · 50% na entrega', margin+4, y+21);
  doc.text('• Validade deste orçamento: 15 dias corridos', col2/2, y+15);
  doc.text('• Frete não incluso (combinado à parte)', col2/2, y+21);
  y += 36;

  // ── RODAPÉ ──
  doc.setFillColor(...DARK);
  doc.rect(0, 285, W, 12, 'F');
  doc.setFont('helvetica','normal'); doc.setFontSize(8);
  doc.setTextColor(180,200,230);
  doc.text('3D Pricer Pro · Orçamento gerado automaticamente', margin, 292);
  doc.text(`Nº ${String(quote.id).slice(-6)} · ${quote.date}`, col2, 292, { align:'right' });

  doc.save(`orcamento-${client.name.replace(/\s+/g,'-')}-${quote.id}.pdf`);
  showToast('PDF do orçamento exportado!', 'fa-file-pdf');
}

// ═══════════════════════════════════════════════════════
// EXPORTAR TODOS OS ORÇAMENTOS CSV
// ═══════════════════════════════════════════════════════

function exportAllQuotesCSV() {
  const quotes = loadQuotes();
  if (!quotes.length) {
    showToast('Nenhum orçamento para exportar!', 'fa-triangle-exclamation');
    return;
  }

  const header = [
    'ID','Data','Cliente','Material','Peso(g)',
    'Tempo(h)','Qtd','Preço Unit(R$)','Total(R$)','Status'
  ].join(';');

  const rows = quotes.map(q => [
    String(q.id).slice(-6),
    q.date,
    q.clientName,
    q.materialType,
    q.partWeight,
    q.printHours,
    q.quantity,
    (q.finalPrice||0).toFixed(2).replace('.',','),
    (q.batchPrice||q.finalPrice||0).toFixed(2).replace('.',','),
    q.status,
  ].join(';')).join('\n');

  const csv  = `${header}\n${rows}`;
  const blob = new Blob(['\uFEFF'+csv], { type:'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `orcamentos-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('CSV exportado!', 'fa-file-csv');
}