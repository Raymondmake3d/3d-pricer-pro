'use strict';

// ═══════════════════════════════════════════════════════
// CATÁLOGO DE PEÇAS
// ═══════════════════════════════════════════════════════

const CATALOG_KEY = '3dpricer_catalog';

function loadCatalog() {
  try { return JSON.parse(localStorage.getItem(CATALOG_KEY)) || []; }
  catch { return []; }
}

function saveCatalog(items) {
  localStorage.setItem(CATALOG_KEY, JSON.stringify(items));
}

// ═══════════════════════════════════════════════════════
// RENDERIZAÇÃO PRINCIPAL
// ═══════════════════════════════════════════════════════

function renderCatalog() {
  const container = document.getElementById('tab-catalog');
  if (!container) return;

  const items = loadCatalog();

  container.innerHTML = `
    ${renderCatalogStats(items)}
    ${renderCatalogForm()}
    ${renderCatalogGrid(items)}
  `;
}

// ═══════════════════════════════════════════════════════
// ESTATÍSTICAS DO CATÁLOGO
// ═══════════════════════════════════════════════════════

function renderCatalogStats(items) {
  const total       = items.length;
  const avgPrice    = total > 0
    ? items.reduce((s, i) => s + i.price, 0) / total : 0;
  const avgMargin   = total > 0
    ? items.reduce((s, i) => s + i.margin, 0) / total : 0;
  const categories  = new Set(items.map(i => i.category)).size;
  const topItem     = items.sort((a,b) => b.price - a.price)[0];

  return `
  <div class="dash-kpi-grid">
    <div class="dash-kpi-card blue">
      <div class="kpi-icon"><i class="fas fa-cubes"></i></div>
      <div class="kpi-info">
        <small>Peças no Catálogo</small>
        <strong>${total}</strong>
        <span>${categories} categorias</span>
      </div>
    </div>
    <div class="dash-kpi-card orange">
      <div class="kpi-icon"><i class="fas fa-tag"></i></div>
      <div class="kpi-info">
        <small>Preço Médio</small>
        <strong>${formatBRL(avgPrice)}</strong>
        <span>por peça</span>
      </div>
    </div>
    <div class="dash-kpi-card green">
      <div class="kpi-icon"><i class="fas fa-percent"></i></div>
      <div class="kpi-info">
        <small>Margem Média</small>
        <strong>${avgMargin.toFixed(1)}%</strong>
        <span>do catálogo</span>
      </div>
    </div>
    <div class="dash-kpi-card neutral">
      <div class="kpi-icon"><i class="fas fa-trophy"></i></div>
      <div class="kpi-info">
        <small>Peça de Maior Valor</small>
        <strong>${topItem ? formatBRL(topItem.price) : '—'}</strong>
        <span>${topItem?.name || 'Nenhuma ainda'}</span>
      </div>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════
// FORMULÁRIO DE CADASTRO DE PEÇA
// ═══════════════════════════════════════════════════════

function renderCatalogForm() {
  return `
  <div class="card" id="catalog-form-card">
    <div class="result-header">
      <h2><i class="fas fa-cube"></i> Adicionar Peça ao Catálogo</h2>
      <div style="display:flex;gap:0.6rem;">
        <button class="btn-small" onclick="importFromPricingToCatalog()">
          <i class="fas fa-file-import"></i> Importar da Precificação
        </button>
        <button class="btn-small" onclick="toggleCatalogForm()">
          <i class="fas fa-chevron-down" id="catalog-form-icon"></i>
        </button>
      </div>
    </div>

    <div id="catalog-form-body">
      <div class="grid-2" style="margin-top:1rem;">
        <div class="field">
          <label>Nome da Peça *</label>
          <input type="text" id="cat-name"
                 placeholder="Ex: Suporte para celular"/>
        </div>
        <div class="field">
          <label>Categoria</label>
          <select id="cat-category">
            <option value="decorativo">🎨 Decorativo</option>
            <option value="funcional">⚙️ Funcional</option>
            <option value="prototipo">🔬 Protótipo</option>
            <option value="miniatura">🎲 Miniatura</option>
            <option value="peca-tecnica">🔩 Peça Técnica</option>
            <option value="joia">💎 Joia / Acessório</option>
            <option value="educacional">📚 Educacional</option>
            <option value="outro">📦 Outro</option>
          </select>
        </div>
        <div class="field">
          <label>Material</label>
          <select id="cat-material">
            <option value="PLA">PLA</option>
            <option value="PETG">PETG</option>
            <option value="ABS">ABS</option>
            <option value="ASA">ASA</option>
            <option value="TPU">TPU</option>
            <option value="PLA-CF">PLA-CF</option>
            <option value="PETG-CF">PETG-CF</option>
            <option value="PA">Nylon (PA)</option>
            <option value="PA-CF">PA-CF</option>
            <option value="PC">Policarbonato</option>
            <option value="RESIN-STD">Resina Padrão</option>
            <option value="RESIN-ABS">Resina ABS-Like</option>
            <option value="RESIN-8K">Resina 8K</option>
            <option value="OUTRO">Outro</option>
          </select>
        </div>
        <div class="field">
          <label>Preço de Venda (R$) *</label>
          <input type="number" id="cat-price"
                 placeholder="Ex: 45.00" min="0" step="0.01"/>
        </div>
        <div class="field">
          <label>Custo de Produção (R$)</label>
          <input type="number" id="cat-cost"
                 placeholder="Ex: 18.00" min="0" step="0.01"/>
        </div>
        <div class="field">
          <label>Margem de Lucro (%)</label>
          <input type="number" id="cat-margin"
                 placeholder="Ex: 40" min="0" max="100"
                 readonly style="background:var(--light-gray);cursor:not-allowed;"
                 title="Calculado automaticamente"/>
        </div>
        <div class="field">
          <label>Peso (g)</label>
          <input type="number" id="cat-weight"
                 placeholder="Ex: 85" min="0"/>
        </div>
        <div class="field">
          <label>Tempo de Impressão (h)</label>
          <input type="number" id="cat-hours"
                 placeholder="Ex: 4.5" min="0" step="0.1"/>
        </div>
        <div class="field">
          <label>Tempo de Produção (dias)</label>
          <input type="number" id="cat-leadtime"
                 placeholder="Ex: 2" min="0"/>
        </div>
        <div class="field">
          <label>Estoque Disponível</label>
          <input type="number" id="cat-stock"
                 placeholder="Ex: 10" min="0" value="0"/>
        </div>
        <div class="field" style="grid-column:1/-1">
          <label>Descrição da Peça</label>
          <input type="text" id="cat-desc"
                 placeholder="Ex: Suporte articulado compatível com iPhone 14/15..."/>
        </div>
        <div class="field">
          <label>Tags (separadas por vírgula)</label>
          <input type="text" id="cat-tags"
                 placeholder="Ex: suporte, celular, escritório"/>
        </div>
        <div class="field">
          <label>Status</label>
          <select id="cat-status">
            <option value="active">✅ Ativo</option>
            <option value="inactive">⏸️ Inativo</option>
            <option value="draft">📝 Rascunho</option>
          </select>
        </div>
      </div>

      <div style="display:flex;gap:0.8rem;margin-top:1.2rem;flex-wrap:wrap;">
        <button class="btn-calculate"
                style="max-width:220px;font-size:0.9rem;padding:0.8rem 1.5rem;"
                onclick="addCatalogItem()">
          <i class="fas fa-plus"></i> Adicionar ao Catálogo
        </button>
        <button class="btn-small" onclick="clearCatalogForm()">
          <i class="fas fa-eraser"></i> Limpar
        </button>
      </div>
    </div>
  </div>`;
}

// ── Auto-calcula margem ao digitar preço/custo ──
function initCatalogCalc() {
  ['cat-price','cat-cost'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calcCatalogMargin);
  });
}

function calcCatalogMargin() {
  const price  = parseFloat(document.getElementById('cat-price')?.value) || 0;
  const cost   = parseFloat(document.getElementById('cat-cost')?.value)  || 0;
  const mEl    = document.getElementById('cat-margin');
  if (!mEl) return;

  if (price > 0 && cost > 0) {
    const margin = ((price - cost) / price) * 100;
    mEl.value    = margin.toFixed(1);
  } else {
    mEl.value = '';
  }
}

function toggleCatalogForm() {
  const body = document.getElementById('catalog-form-body');
  const icon = document.getElementById('catalog-form-icon');
  if (!body) return;
  const hidden = body.style.display === 'none';
  body.style.display = hidden ? '' : 'none';
  icon.className = hidden ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
}

function clearCatalogForm() {
  ['cat-name','cat-price','cat-cost','cat-margin','cat-weight',
   'cat-hours','cat-leadtime','cat-desc','cat-tags']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  const stock = document.getElementById('cat-stock');
  if (stock) stock.value = '0';
  ['cat-category','cat-material','cat-status']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.selectedIndex = 0;
    });
}

// ═══════════════════════════════════════════════════════
// IMPORTAR DA PRECIFICAÇÃO
// ═══════════════════════════════════════════════════════

function importFromPricingToCatalog() {
  const r = window._lastResult;
  if (!r) {
    showToast('Calcule uma precificação primeiro!', 'fa-triangle-exclamation');
    return;
  }

  const fields = {
    'cat-price':  r.finalPrice.toFixed(2),
    'cat-cost':   r.directCost.toFixed(2),
    'cat-weight': r.partWeight,
    'cat-hours':  r.printHours,
  };

  Object.entries(fields).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) {
      el.value = val;
      el.style.borderColor = 'var(--orange)';
      setTimeout(() => el.style.borderColor = '', 2000);
    }
  });

  // Material
  const matEl = document.getElementById('cat-material');
  if (matEl && r.materialType) matEl.value = r.materialType;

  calcCatalogMargin();

  // Mostra o formulário
  const body = document.getElementById('catalog-form-body');
  if (body) body.style.display = '';

  document.getElementById('catalog-form-card')
    ?.scrollIntoView({ behavior:'smooth', block:'start' });

  showToast('Dados importados da precificação!', 'fa-file-import');
}

// ═══════════════════════════════════════════════════════
// ADICIONAR PEÇA
// ═══════════════════════════════════════════════════════

function addCatalogItem() {
  const name  = document.getElementById('cat-name')?.value?.trim();
  const price = parseFloat(document.getElementById('cat-price')?.value) || 0;

  if (!name) {
    showToast('Informe o nome da peça!', 'fa-triangle-exclamation');
    document.getElementById('cat-name')?.focus();
    return;
  }
  if (price <= 0) {
    showToast('Informe o preço de venda!', 'fa-triangle-exclamation');
    document.getElementById('cat-price')?.focus();
    return;
  }

  const tagsRaw = document.getElementById('cat-tags')?.value || '';
  const tags    = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);

  const item = {
    id:       Date.now(),
    name,
    category: document.getElementById('cat-category')?.value  || 'outro',
    material: document.getElementById('cat-material')?.value  || 'PLA',
    price,
    cost:     parseFloat(document.getElementById('cat-cost')?.value)     || 0,
    margin:   parseFloat(document.getElementById('cat-margin')?.value)   || 0,
    weight:   parseFloat(document.getElementById('cat-weight')?.value)   || 0,
    hours:    parseFloat(document.getElementById('cat-hours')?.value)    || 0,
    leadtime: parseFloat(document.getElementById('cat-leadtime')?.value) || 0,
    stock:    parseInt(document.getElementById('cat-stock')?.value)      || 0,
    desc:     document.getElementById('cat-desc')?.value?.trim()         || '',
    status:   document.getElementById('cat-status')?.value              || 'active',
    tags,
    createdAt: new Date().toLocaleDateString('pt-BR'),
    views:     0,
    sales:     0,
  };

  const catalog = loadCatalog();
  catalog.unshift(item);
  saveCatalog(catalog);
  clearCatalogForm();
  renderCatalog();
  setTimeout(initCatalogCalc, 100);
  showToast(`"${name}" adicionada ao catálogo!`, 'fa-cube');
}

// ═══════════════════════════════════════════════════════
// GRID DE PEÇAS
// ═══════════════════════════════════════════════════════

function renderCatalogGrid(items) {
  if (!items.length) {
    return `
    <div class="card">
      <h2><i class="fas fa-cubes"></i> Catálogo de Peças</h2>
      <div class="tips-placeholder">
        <i class="fas fa-cube"></i>
        <p>Nenhuma peça no catálogo ainda.<br/>
           Adicione peças acima ou importe da precificação.</p>
      </div>
    </div>`;
  }

  const categoryIcons = {
    decorativo:    '🎨',
    funcional:     '⚙️',
    prototipo:     '🔬',
    miniatura:     '🎲',
    'peca-tecnica':'🔩',
    joia:          '💎',
    educacional:   '📚',
    outro:         '📦',
  };

  const statusConfig = {
    active:   { label:'Ativo',     color:'#27ae60' },
    inactive: { label:'Inativo',   color:'#e74c3c' },
    draft:    { label:'Rascunho',  color:'#f07b30' },
  };

  // Filtros
  const categories = ['Todas', ...new Set(items.map(i => i.category))];

  const filters = categories.map((cat, idx) => `
    <button class="filter-btn ${idx===0?'active':''}"
            data-cat-filter="${cat}"
            onclick="filterCatalog('${cat}',this)">
      ${cat === 'Todas' ? '📦 Todas' : `${categoryIcons[cat]||'📦'} ${capitalize(cat)}`}
    </button>`).join('');

  const cards = items.map(item => {
    const st      = statusConfig[item.status] || statusConfig.active;
    const icon    = categoryIcons[item.category] || '📦';
    const profit  = item.price - item.cost;
    const initials = item.name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();

    return `
    <div class="catalog-card" data-category="${item.category}" id="catitem-${item.id}">
      <div class="catalog-card-header">
        <div class="catalog-emoji">${icon}</div>
        <div class="catalog-status" style="color:${st.color};font-size:0.72rem;font-weight:700;">
          ● ${st.label}
        </div>
      </div>

      <div class="catalog-name">${item.name}</div>
      <div class="catalog-material">
        <span class="spec-tag">${item.material}</span>
        ${item.weight > 0 ? `<span class="spec-tag">${item.weight}g</span>` : ''}
        ${item.hours  > 0 ? `<span class="spec-tag">${item.hours}h</span>`  : ''}
      </div>

      ${item.desc ? `<div class="catalog-desc">${item.desc}</div>` : ''}

      <div class="catalog-pricing">
        <div class="catalog-price-main">
          <small>Preço de Venda</small>
          <strong>${formatBRL(item.price)}</strong>
        </div>
        ${item.cost > 0 ? `
        <div class="catalog-price-secondary">
          <div><small>Custo</small><span>${formatBRL(item.cost)}</span></div>
          <div><small>Lucro</small><span style="color:#27ae60">${formatBRL(profit)}</span></div>
          <div><small>Margem</small><span style="color:var(--orange)">${item.margin.toFixed(1)}%</span></div>
        </div>` : ''}
      </div>

      ${item.tags?.length ? `
      <div class="catalog-tags">
        ${item.tags.map(t=>`<span class="catalog-tag">#${t}</span>`).join('')}
      </div>` : ''}

      <div class="catalog-footer">
        <div class="catalog-meta">
          ${item.stock > 0
            ? `<span style="color:#27ae60"><i class="fas fa-boxes-stacked"></i> ${item.stock} em estoque</span>`
            : `<span style="color:var(--text-muted)"><i class="fas fa-clock"></i> ${item.leadtime||'?'}d produção</span>`}
        </div>
        <div class="catalog-actions">
          <button class="btn-small" onclick="duplicateCatalogItem(${item.id})"
                  title="Duplicar">
            <i class="fas fa-copy"></i>
          </button>
          <button class="btn-small" onclick="editCatalogItem(${item.id})"
                  title="Editar">
            <i class="fas fa-pen"></i>
          </button>
          <button class="btn-small" onclick="shareCatalogItem(${item.id})"
                  title="Compartilhar">
            <i class="fab fa-whatsapp"></i>
          </button>
          <button class="btn-small danger" onclick="deleteCatalogItem(${item.id})"
                  title="Excluir">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>`;
  }).join('');

  return `
  <div class="card">
    <div class="result-header">
      <h2><i class="fas fa-cubes"></i> Catálogo (${items.length} peças)</h2>
      <div style="display:flex;gap:0.6rem;">
        <button class="btn-small" onclick="exportCatalogCSV()">
          <i class="fas fa-file-csv"></i> CSV
        </button>
        <button class="btn-small" onclick="exportCatalogPDF()">
          <i class="fas fa-file-pdf"></i> PDF
        </button>
      </div>
    </div>

    <div class="product-filters" style="margin-bottom:1.2rem;">
      ${filters}
    </div>

    <div class="catalog-search" style="margin-bottom:1.2rem;">
      <input type="text" placeholder="🔍 Buscar peça no catálogo..."
             oninput="searchCatalog(this.value)"
             style="width:100%;padding:0.6rem 1rem;border:2px solid var(--border);
                    border-radius:10px;font-family:Poppins,sans-serif;
                    font-size:0.88rem;background:var(--light-gray);color:var(--text)"/>
    </div>

    <div class="catalog-grid" id="catalog-grid">
      ${cards}
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════
// FILTRO E BUSCA
// ═══════════════════════════════════════════════════════

function filterCatalog(category, btn) {
  document.querySelectorAll('[data-cat-filter]').forEach(b =>
    b.classList.remove('active'));
  btn.classList.add('active');

  document.querySelectorAll('.catalog-card').forEach(card => {
    const show = category === 'Todas' || card.dataset.category === category;
    card.style.display = show ? '' : 'none';
  });
}

function searchCatalog(query) {
  const q = query.toLowerCase();
  document.querySelectorAll('.catalog-card').forEach(card => {
    const text = card.textContent.toLowerCase();
    card.style.display = text.includes(q) ? '' : 'none';
  });
}

// ═══════════════════════════════════════════════════════
// AÇÕES DAS PEÇAS
// ═══════════════════════════════════════════════════════

function deleteCatalogItem(id) {
  const catalog = loadCatalog();
  const item    = catalog.find(i => i.id === id);
  if (!item) return;
  if (!confirm(`Deseja excluir "${item.name}" do catálogo?`)) return;
  saveCatalog(catalog.filter(i => i.id !== id));
  renderCatalog();
  setTimeout(initCatalogCalc, 100);
  showToast('Peça removida do catálogo.', 'fa-trash');
}

function duplicateCatalogItem(id) {
  const catalog = loadCatalog();
  const item    = catalog.find(i => i.id === id);
  if (!item) return;

  const copy = {
    ...item,
    id:        Date.now(),
    name:      `${item.name} (cópia)`,
    createdAt: new Date().toLocaleDateString('pt-BR'),
    stock:     0,
    views:     0,
    sales:     0,
  };

  catalog.unshift(copy);
  saveCatalog(catalog);
  renderCatalog();
  setTimeout(initCatalogCalc, 100);
  showToast(`"${copy.name}" duplicada!`, 'fa-copy');
}

function editCatalogItem(id) {
  const catalog = loadCatalog();
  const item    = catalog.find(i => i.id === id);
  if (!item) return;

  // Preenche formulário
  const fields = {
    'cat-name':     item.name,
    'cat-price':    item.price,
    'cat-cost':     item.cost,
    'cat-margin':   item.margin,
    'cat-weight':   item.weight,
    'cat-hours':    item.hours,
    'cat-leadtime': item.leadtime,
    'cat-stock':    item.stock,
    'cat-desc':     item.desc,
    'cat-tags':     item.tags?.join(', ') || '',
  };

  Object.entries(fields).forEach(([fid, val]) => {
    const el = document.getElementById(fid);
    if (el) el.value = val ?? '';
  });

  const selects = {
    'cat-category': item.category,
    'cat-material': item.material,
    'cat-status':   item.status,
  };
  Object.entries(selects).forEach(([fid, val]) => {
    const el = document.getElementById(fid);
    if (el) el.value = val || '';
  });

  // Remove o item atual
  saveCatalog(catalog.filter(i => i.id !== id));

  // Mostra o formulário
  const body = document.getElementById('catalog-form-body');
  if (body) body.style.display = '';

  document.getElementById('catalog-form-card')
    ?.scrollIntoView({ behavior:'smooth', block:'start' });

  showToast('Edite e salve novamente.', 'fa-pen');
}

function shareCatalogItem(id) {
  const catalog = loadCatalog();
  const item    = catalog.find(i => i.id === id);
  if (!item) return;

  const text = encodeURIComponent(
`🖨️ *Peça disponível — Impressão 3D*

*${item.name}*
📦 Material: ${item.material}
${item.weight > 0 ? `⚖️ Peso: ${item.weight}g\n` : ''}${item.hours > 0 ? `⏱️ Tempo: ${item.hours}h\n` : ''}${item.desc ? `📋 ${item.desc}\n` : ''}
💰 *Preço: ${formatBRL(item.price)}*
${item.stock > 0 ? `✅ ${item.stock} unidades em estoque\n` : `🕐 Prazo: ${item.leadtime||'?'} dias\n`}
Entre em contato para encomendar! 😊`
  );

  window.open(`https://wa.me/?text=${text}`, '_blank');
}

// ═══════════════════════════════════════════════════════
// EXPORTAR CSV DO CATÁLOGO
// ═══════════════════════════════════════════════════════

function exportCatalogCSV() {
  const catalog = loadCatalog();
  if (!catalog.length) {
    showToast('Catálogo vazio!', 'fa-triangle-exclamation');
    return;
  }

  const header = [
    'Nome','Categoria','Material','Preço(R$)','Custo(R$)',
    'Margem(%)','Peso(g)','Tempo(h)','Prazo(d)',
    'Estoque','Status','Descrição','Tags'
  ].join(';');

  const rows = catalog.map(i => [
    i.name,
    i.category,
    i.material,
    (i.price||0).toFixed(2).replace('.',','),
    (i.cost||0).toFixed(2).replace('.',','),
    (i.margin||0).toFixed(1).replace('.',','),
    i.weight||0,
    i.hours||0,
    i.leadtime||0,
    i.stock||0,
    i.status,
    i.desc||'',
    (i.tags||[]).join('|'),
  ].join(';')).join('\n');

  const csv  = `${header}\n${rows}`;
  const blob = new Blob(['\uFEFF'+csv], { type:'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `catalogo-3d-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Catálogo exportado em CSV!', 'fa-file-csv');
}

// ═══════════════════════════════════════════════════════
// EXPORTAR PDF DO CATÁLOGO
// ═══════════════════════════════════════════════════════

function exportCatalogPDF() {
  const catalog = loadCatalog().filter(i => i.status === 'active');
  if (!catalog.length) {
    showToast('Nenhuma peça ativa para exportar!', 'fa-triangle-exclamation');
    return;
  }

  if (!window.jspdf) {
    showToast('Biblioteca PDF não carregada!', 'fa-triangle-exclamation');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });

  const W      = 210;
  const margin = 14;
  let y        = 0;

  const DARK   = [26,42,74];
  const ORANGE = [240,123,48];
  const YELLOW = [245,200,66];
  const WHITE  = [255,255,255];
  const GRAY   = [245,247,250];
  const TEXT   = [45,55,72];
  const MUTED  = [113,128,150];

  // ── CAPA ──
  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, 60, 'F');

  doc.setTextColor(...WHITE);
  doc.setFont('helvetica','bold');
  doc.setFontSize(24);
  doc.text('CATÁLOGO DE PEÇAS', margin, 25);

  doc.setFont('helvetica','normal');
  doc.setFontSize(10);
  doc.setTextColor(180,200,230);
  doc.text('Impressão 3D Profissional', margin, 34);

  doc.setFontSize(9);
  doc.setTextColor(...YELLOW);
  doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} · ${catalog.length} peças`, margin, 42);

  y = 72;

  // ── PEÇAS ──
  catalog.forEach((item, idx) => {
    if (y > 240) { doc.addPage(); y = 20; }

    // Card da peça
    doc.setFillColor(...GRAY);
    doc.roundedRect(margin, y, W-margin*2, 36, 3, 3, 'F');

    // Número
    doc.setFillColor(...ORANGE);
    doc.circle(margin+8, y+8, 5, 'F');
    doc.setFont('helvetica','bold');
    doc.setFontSize(8);
    doc.setTextColor(...WHITE);
    doc.text(String(idx+1), margin+8, y+10, { align:'center' });

    // Nome
    doc.setFont('helvetica','bold');
    doc.setFontSize(11);
    doc.setTextColor(...DARK);
    doc.text(item.name, margin+17, y+9);

    // Material e specs
    doc.setFont('helvetica','normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    const specs = [
      item.material,
      item.weight > 0 ? `${item.weight}g` : null,
      item.hours  > 0 ? `${item.hours}h`  : null,
    ].filter(Boolean).join(' · ');
    doc.text(specs, margin+17, y+16);

    // Descrição
    if (item.desc) {
      doc.setFont('helvetica','normal');
      doc.setFontSize(8);
      doc.setTextColor(...TEXT);
      const descLines = doc.splitTextToSize(item.desc, W-margin*2-90);
      doc.text(descLines[0], margin+17, y+23);
    }

    // Prazo/estoque
    doc.setFont('helvetica','normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    const info = item.stock > 0
      ? `📦 ${item.stock} em estoque`
      : `🕐 Prazo: ${item.leadtime||'?'} dias`;
    doc.text(info, margin+17, y+30);

    // Preço
    doc.setFillColor(...DARK);
    doc.roundedRect(W-margin-42, y+4, 40, 28, 3, 3, 'F');
    doc.setFont('helvetica','normal');
    doc.setFontSize(7.5);
    doc.setTextColor(180,200,230);
    doc.text('PREÇO', W-margin-22, y+11, { align:'center' });
    doc.setFont('helvetica','bold');
    doc.setFontSize(11);
    doc.setTextColor(...YELLOW);
    doc.text(formatBRL(item.price), W-margin-22, y+21, { align:'center' });
    if (item.margin > 0) {
      doc.setFont('helvetica','normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...ORANGE);
      doc.text(`${item.margin.toFixed(0)}% margem`, W-margin-22, y+28, { align:'center' });
    }

    y += 44;
  });

  // ── RODAPÉ ──
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFillColor(...DARK);
    doc.rect(0, 288, W, 9, 'F');
    doc.setFont('helvetica','normal');
    doc.setFontSize(7.5);
    doc.setTextColor(180,200,230);
    doc.text('3D Pricer Pro · Catálogo de Peças', margin, 294);
    doc.text(`${i}/${pages}`, W-margin, 294, { align:'right' });
  }

  doc.save(`catalogo-3d-${new Date().toISOString().slice(0,10)}.pdf`);
  showToast('PDF do catálogo exportado!', 'fa-file-pdf');
}

// ═══════════════════════════════════════════════════════
// UTILITÁRIOS
// ═══════════════════════════════════════════════════════

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
}