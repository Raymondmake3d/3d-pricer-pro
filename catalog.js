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
  const total      = items.length;
  const avgPrice   = total > 0 ? items.reduce((s,i) => s + i.price, 0) / total : 0;
  const avgMargin  = total > 0 ? items.reduce((s,i) => s + i.margin, 0) / total : 0;
  const categories = new Set(items.map(i => i.category)).size;
  const topItem    = [...items].sort((a,b) => b.price - a.price)[0];

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
// FORMULÁRIO DE CADASTRO
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
          <input type="text" id="cat-name" placeholder="Ex: Suporte para celular"/>
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
          <input type="number" id="cat-price" placeholder="Ex: 45.00"
                 min="0" step="0.01" oninput="calcCatalogMargin()"/>
        </div>
        <div class="field">
          <label>Custo de Produção (R$)</label>
          <input type="number" id="cat-cost" placeholder="Ex: 18.00"
                 min="0" step="0.01" oninput="calcCatalogMargin()"/>
        </div>
        <div class="field">
          <label>Margem de Lucro (%)</label>
          <input type="number" id="cat-margin" placeholder="Calculado automaticamente"
                 readonly style="background:var(--light-gray);cursor:not-allowed;"/>
        </div>
        <div class="field">
          <label>Peso (g)</label>
          <input type="number" id="cat-weight" placeholder="Ex: 85" min="0"/>
        </div>
        <div class="field">
          <label>Tempo de Impressão (h)</label>
          <input type="number" id="cat-hours" placeholder="Ex: 4.5" min="0" step="0.1"/>
        </div>
        <div class="field">
          <label>Prazo de Produção (dias)</label>
          <input type="number" id="cat-leadtime" placeholder="Ex: 2" min="0"/>
        </div>
        <div class="field">
          <label>Estoque Disponível</label>
          <input type="number" id="cat-stock" placeholder="Ex: 10" min="0" value="0"/>
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

        <!-- ✨ NOVO: Upload de Foto -->
        <div class="field" style="grid-column:1/-1">
          <label><i class="fas fa-camera"></i> Foto da Peça</label>
          <div class="photo-upload-area" id="photo-upload-area"
               onclick="document.getElementById('cat-photo-input').click()"
               ondragover="event.preventDefault();this.classList.add('drag-over')"
               ondragleave="this.classList.remove('drag-over')"
               ondrop="handlePhotoDrop(event)">
            <div id="photo-preview-wrap">
              <i class="fas fa-camera" style="font-size:2rem;color:var(--text-muted)"></i>
              <p style="color:var(--text-muted);font-size:0.82rem;margin-top:0.5rem;">
                Clique ou arraste uma foto aqui<br/>
                <small>JPG, PNG ou WEBP · Máx 2MB</small>
              </p>
            </div>
            <input type="file" id="cat-photo-input" accept="image/*"
                   style="display:none" onchange="handlePhotoUpload(event)"/>
          </div>
          <div style="display:flex;gap:0.5rem;margin-top:0.4rem;flex-wrap:wrap;">
            <button class="btn-small" type="button"
                    onclick="document.getElementById('cat-photo-input').click()">
              <i class="fas fa-upload"></i> Escolher foto
            </button>
            <button class="btn-small" type="button" onclick="captureFromCamera()">
              <i class="fas fa-camera"></i> Câmera
            </button>
            <button class="btn-small danger" type="button" onclick="removePhoto()">
              <i class="fas fa-trash"></i> Remover
            </button>
          </div>
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

// ═══════════════════════════════════════════════════════
// FOTO — UPLOAD E COMPRESSÃO
// ═══════════════════════════════════════════════════════

// Guarda a foto temporariamente em base64
let _catalogPhotoTemp = null;

function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  processPhotoFile(file);
}

function handlePhotoDrop(event) {
  event.preventDefault();
  document.getElementById('photo-upload-area')?.classList.remove('drag-over');
  const file = event.dataTransfer.files[0];
  if (!file || !file.type.startsWith('image/')) {
    showToast('Arquivo inválido! Use JPG, PNG ou WEBP.', 'fa-triangle-exclamation');
    return;
  }
  processPhotoFile(file);
}

function processPhotoFile(file) {
  if (file.size > 2 * 1024 * 1024) {
    showToast('Foto muito grande! Máx 2MB.', 'fa-triangle-exclamation');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    compressPhoto(e.target.result, 800, 0.75, (compressed) => {
      _catalogPhotoTemp = compressed;
      showPhotoPreview(compressed);
      showToast('Foto carregada! ✅', 'fa-camera');
    });
  };
  reader.readAsDataURL(file);
}

function compressPhoto(dataURL, maxSize, quality, callback) {
  const img    = new Image();
  img.onload   = () => {
    const canvas = document.createElement('canvas');
    let { width, height } = img;

    // Redimensiona mantendo proporção
    if (width > maxSize || height > maxSize) {
      if (width > height) {
        height = Math.round(height * maxSize / width);
        width  = maxSize;
      } else {
        width  = Math.round(width * maxSize / height);
        height = maxSize;
      }
    }

    canvas.width  = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(img, 0, 0, width, height);
    callback(canvas.toDataURL('image/jpeg', quality));
  };
  img.src = dataURL;
}

function showPhotoPreview(src) {
  const wrap = document.getElementById('photo-preview-wrap');
  if (!wrap) return;
  wrap.innerHTML = `
    <img src="${src}"
         style="max-width:100%;max-height:200px;border-radius:10px;
                object-fit:cover;box-shadow:0 4px 12px rgba(0,0,0,0.15)"/>`;
  const area = document.getElementById('photo-upload-area');
  if (area) area.style.borderColor = 'var(--orange)';
}

function removePhoto() {
  _catalogPhotoTemp = null;
  const wrap = document.getElementById('photo-preview-wrap');
  if (wrap) wrap.innerHTML = `
    <i class="fas fa-camera" style="font-size:2rem;color:var(--text-muted)"></i>
    <p style="color:var(--text-muted);font-size:0.82rem;margin-top:0.5rem;">
      Clique ou arraste uma foto aqui<br/>
      <small>JPG, PNG ou WEBP · Máx 2MB</small>
    </p>`;
  const area = document.getElementById('photo-upload-area');
  if (area) area.style.borderColor = '';
  const input = document.getElementById('cat-photo-input');
  if (input) input.value = '';
  showToast('Foto removida.', 'fa-trash');
}

function captureFromCamera() {
  const input = document.getElementById('cat-photo-input');
  if (!input) return;
  input.setAttribute('capture', 'environment');
  input.click();
}

// ═══════════════════════════════════════════════════════
// CÁLCULO AUTOMÁTICO DE MARGEM
// ═══════════════════════════════════════════════════════

function calcCatalogMargin() {
  const price = parseFloat(document.getElementById('cat-price')?.value) || 0;
  const cost  = parseFloat(document.getElementById('cat-cost')?.value)  || 0;
  const mEl   = document.getElementById('cat-margin');
  if (!mEl) return;
  mEl.value = (price > 0 && cost > 0)
    ? (((price - cost) / price) * 100).toFixed(1)
    : '';
}

function initCatalogCalc() {
  // oninput já está inline no HTML — não precisa de listeners extras
}

function toggleCatalogForm() {
  const body = document.getElementById('catalog-form-body');
  const icon = document.getElementById('catalog-form-icon');
  if (!body) return;
  const hidden = body.style.display === 'none';
  body.style.display = hidden ? '' : 'none';
  if (icon) icon.className = hidden ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
}

function clearCatalogForm() {
  ['cat-name','cat-price','cat-cost','cat-margin',
   'cat-weight','cat-hours','cat-leadtime','cat-desc','cat-tags']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const stock = document.getElementById('cat-stock');
  if (stock) stock.value = '0';
  ['cat-category','cat-material','cat-status']
    .forEach(id => { const el = document.getElementById(id); if (el) el.selectedIndex = 0; });
  removePhoto();
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
    'cat-price':  r.finalPrice?.toFixed(2),
    'cat-cost':   r.directCost?.toFixed(2),
    'cat-weight': r.partWeight,
    'cat-hours':  r.printHours,
  };

  Object.entries(fields).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el && val !== undefined) {
      el.value = val;
      el.style.borderColor = 'var(--orange)';
      setTimeout(() => el.style.borderColor = '', 2000);
    }
  });

  const matEl = document.getElementById('cat-material');
  if (matEl && r.materialType) matEl.value = r.materialType;

  calcCatalogMargin();

  const body = document.getElementById('catalog-form-body');
  if (body) body.style.display = '';

  document.getElementById('catalog-form-card')
    ?.scrollIntoView({ behavior:'smooth', block:'start' });

  showToast('Dados importados da precificação! ✅', 'fa-file-import');
}

// ═══════════════════════════════════════════════════════
// ADICIONAR PEÇA (com foto!)
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
    id:        Date.now(),
    name,
    category:  document.getElementById('cat-category')?.value  || 'outro',
    material:  document.getElementById('cat-material')?.value  || 'PLA',
    price,
    cost:      parseFloat(document.getElementById('cat-cost')?.value)     || 0,
    margin:    parseFloat(document.getElementById('cat-margin')?.value)   || 0,
    weight:    parseFloat(document.getElementById('cat-weight')?.value)   || 0,
    hours:     parseFloat(document.getElementById('cat-hours')?.value)    || 0,
    leadtime:  parseFloat(document.getElementById('cat-leadtime')?.value) || 0,
    stock:     parseInt(document.getElementById('cat-stock')?.value)      || 0,
    desc:      document.getElementById('cat-desc')?.value?.trim()         || '',
    status:    document.getElementById('cat-status')?.value               || 'active',
    tags,
    photo:     _catalogPhotoTemp || null,   // ✨ FOTO!
    createdAt: new Date().toLocaleDateString('pt-BR'),
    views:     0,
    sales:     0,
  };

  const catalog = loadCatalog();
  catalog.unshift(item);
  saveCatalog(catalog);
  clearCatalogForm();
  renderCatalog();
  showToast(`"${name}" adicionada ao catálogo! 🎉`, 'fa-cube');
}

// ═══════════════════════════════════════════════════════
// GRID DE CARDS (com foto!)
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
    decorativo:'🎨', funcional:'⚙️', prototipo:'🔬',
    miniatura:'🎲', 'peca-tecnica':'🔩', joia:'💎',
    educacional:'📚', outro:'📦',
  };

  const statusConfig = {
    active:   { label:'Ativo',    color:'#27ae60' },
    inactive: { label:'Inativo',  color:'#e74c3c' },
    draft:    { label:'Rascunho', color:'#f07b30' },
  };

  const categories = ['Todas', ...new Set(items.map(i => i.category))];

  const filters = categories.map((cat, idx) => `
    <button class="filter-btn ${idx === 0 ? 'active' : ''}"
            data-cat-filter="${cat}"
            onclick="filterCatalog('${cat}',this)">
      ${cat === 'Todas' ? '📦 Todas' : `${categoryIcons[cat]||'📦'} ${capitalize(cat)}`}
    </button>`).join('');

  const cards = items.map(item => {
    const st     = statusConfig[item.status] || statusConfig.active;
    const icon   = categoryIcons[item.category] || '📦';
    const profit = item.price - item.cost;

    // ✨ Foto ou placeholder
    const photoHTML = item.photo
      ? `<div class="catalog-photo">
           <img src="${item.photo}" alt="${item.name}"
                onclick="openPhotoModal('${item.id}')"/>
           <div class="catalog-photo-overlay">
             <i class="fas fa-expand"></i>
           </div>
         </div>`
      : `<div class="catalog-photo catalog-photo-empty">
           <span>${icon}</span>
           <small>Sem foto</small>
           <button class="btn-small" style="margin-top:0.4rem;font-size:0.7rem;"
                   onclick="editCatalogItem(${item.id})">
             <i class="fas fa-camera"></i> Adicionar
           </button>
         </div>`;

    return `
    <div class="catalog-card" data-category="${item.category}" id="catitem-${item.id}">
      ${photoHTML}

      <div class="catalog-card-body">
        <div class="catalog-card-header">
          <div class="catalog-status-dot" style="color:${st.color}">
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
            <div><small>Lucro</small>
              <span style="color:#27ae60">${formatBRL(profit)}</span>
            </div>
            <div><small>Margem</small>
              <span style="color:var(--orange)">${item.margin.toFixed(1)}%</span>
            </div>
          </div>` : ''}
        </div>

        ${item.tags?.length ? `
        <div class="catalog-tags">
          ${item.tags.map(t => `<span class="catalog-tag">#${t}</span>`).join('')}
        </div>` : ''}

        <div class="catalog-footer">
          <div class="catalog-meta">
            ${item.stock > 0
              ? `<span style="color:#27ae60">
                   <i class="fas fa-boxes-stacked"></i> ${item.stock} em estoque
                 </span>`
              : `<span style="color:var(--text-muted)">
                   <i class="fas fa-clock"></i> ${item.leadtime||'?'}d produção
                 </span>`}
            <span style="color:var(--text-muted);font-size:0.7rem;">
              <i class="fas fa-calendar"></i> ${item.createdAt}
            </span>
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
                    title="WhatsApp">
              <i class="fab fa-whatsapp" style="color:#25d366"></i>
            </button>
            <button class="btn-small danger" onclick="deleteCatalogItem(${item.id})"
                    title="Excluir">
              <i class="fas fa-trash"></i>
            </button>
          </div>
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

    <div class="product-filters" style="margin-bottom:1.2rem;">${filters}</div>

    <div style="margin-bottom:1.2rem;">
      <input type="text" placeholder="🔍 Buscar peça no catálogo..."
             oninput="searchCatalog(this.value)"
             style="width:100%;padding:0.6rem 1rem;border:2px solid var(--border);
                    border-radius:10px;font-family:Poppins,sans-serif;font-size:0.88rem;
                    background:var(--light-gray);color:var(--text)"/>
    </div>

    <div class="catalog-grid" id="catalog-grid">${cards}</div>
  </div>`;
}

// ═══════════════════════════════════════════════════════
// MODAL DE FOTO (zoom)
// ═══════════════════════════════════════════════════════

function openPhotoModal(id) {
  const catalog = loadCatalog();
  const item    = catalog.find(i => i.id === Number(id));
  if (!item?.photo) return;

  // Remove modal anterior se existir
  document.getElementById('photo-modal')?.remove();

  const modal = document.createElement('div');
  modal.id        = 'photo-modal';
  modal.className = 'modal-overlay';
  modal.style.cssText = 'z-index:9999;backdrop-filter:blur(8px);';
  modal.innerHTML = `
    <div style="max-width:90vw;max-height:90vh;position:relative;text-align:center;">
      <img src="${item.photo}" alt="${item.name}"
           style="max-width:90vw;max-height:80vh;border-radius:16px;
                  box-shadow:0 20px 60px rgba(0,0,0,0.5);"/>
      <div style="color:#fff;margin-top:1rem;font-weight:700;font-size:1.1rem;">
        ${item.name}
      </div>
      <div style="color:rgba(255,255,255,0.7);font-size:0.85rem;margin-top:0.3rem;">
        ${item.material} · ${formatBRL(item.price)}
      </div>
      <button onclick="document.getElementById('photo-modal').remove()"
              style="position:absolute;top:-12px;right:-12px;width:36px;height:36px;
                     border-radius:50%;background:#e74c3c;border:none;color:#fff;
                     font-size:1.1rem;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.3);">
        ✕
      </button>
    </div>`;

  modal.addEventListener('click', e => {
    if (e.target === modal) modal.remove();
  });

  document.body.appendChild(modal);
}

// ═══════════════════════════════════════════════════════
// EDITAR PEÇA (mantém foto existente)
// ═══════════════════════════════════════════════════════

function editCatalogItem(id) {
  const catalog = loadCatalog();
  const item    = catalog.find(i => i.id === id);
  if (!item) return;

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

  // ✨ Mantém a foto existente no preview
  if (item.photo) {
    _catalogPhotoTemp = item.photo;
    showPhotoPreview(item.photo);
  } else {
    _catalogPhotoTemp = null;
  }

  saveCatalog(catalog.filter(i => i.id !== id));

  const body = document.getElementById('catalog-form-body');
  if (body) body.style.display = '';
  document.getElementById('catalog-form-card')
    ?.scrollIntoView({ behavior:'smooth', block:'start' });

  showToast('Edite os campos e clique em Adicionar para salvar.', 'fa-pen');
}

// ═══════════════════════════════════════════════════════
// FILTRO E BUSCA
// ═══════════════════════════════════════════════════════

function filterCatalog(category, btn) {
  document.querySelectorAll('[data-cat-filter]')
    .forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.catalog-card').forEach(card => {
    card.style.display =
      (category === 'Todas' || card.dataset.category === category) ? '' : 'none';
  });
}

function searchCatalog(query) {
  const q = query.toLowerCase();
  document.querySelectorAll('.catalog-card').forEach(card => {
    card.style.display = card.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

// ═══════════════════════════════════════════════════════
// AÇÕES
// ═══════════════════════════════════════════════════════

function deleteCatalogItem(id) {
  const catalog = loadCatalog();
  const item    = catalog.find(i => i.id === id);
  if (!item) return;
  if (!confirm(`Deseja excluir "${item.name}" do catálogo?`)) return;
  saveCatalog(catalog.filter(i => i.id !== id));
  renderCatalog();
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
    stock: 0, views: 0, sales: 0,
  };
  catalog.unshift(copy);
  saveCatalog(catalog);
  renderCatalog();
  showToast(`"${copy.name}" duplicada! 📋`, 'fa-copy');
}

function shareCatalogItem(id) {
  const catalog = loadCatalog();
  const item    = catalog.find(i => i.id === id);
  if (!item) return;

  const lines = [
    `🖨️ *Peça disponível — Impressão 3D*`,
    ``,
    `*${item.name}*`,
    `📦 Material: ${item.material}`,
    item.weight > 0 ? `⚖️ Peso: ${item.weight}g` : null,
    item.hours  > 0 ? `⏱️ Tempo: ${item.hours}h`  : null,
    item.desc   ? `📋 ${item.desc}`               : null,
    ``,
    `💰 *Preço: ${formatBRL(item.price)}*`,
    item.stock > 0
      ? `✅ ${item.stock} unidades em estoque`
      : `🕐 Prazo: ${item.leadtime || '?'} dias`,
    ``,
    `Entre em contato para encomendar! 😊`,
  ].filter(l => l !== null).join('\n');

  window.open(`https://wa.me/?text=${encodeURIComponent(lines)}`, '_blank');
}

// ═══════════════════════════════════════════════════════
// EXPORTAR CSV
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
    'Estoque','Status','Descrição','Tags','Tem Foto'
  ].join(';');

  const rows = catalog.map(i => [
    i.name, i.category, i.material,
    (i.price||0).toFixed(2).replace('.',','),
    (i.cost||0).toFixed(2).replace('.',','),
    (i.margin||0).toFixed(1).replace('.',','),
    i.weight||0, i.hours||0, i.leadtime||0, i.stock||0,
    i.status, i.desc||'', (i.tags||[]).join('|'),
    i.photo ? 'Sim' : 'Não',
  ].join(';')).join('\n');

  const blob = new Blob(['\uFEFF'+header+'\n'+rows], { type:'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), {
    href:     url,
    download: `catalogo-3d-${new Date().toISOString().slice(0,10)}.csv`
  });
  a.click();
  URL.revokeObjectURL(url);
  showToast('Catálogo exportado em CSV! 📊', 'fa-file-csv');
}

// ═══════════════════════════════════════════════════════
// EXPORTAR PDF (com foto!)
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
  const doc    = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
  const W      = 210;
  const margin = 14;
  let y        = 0;

  const DARK   = [26, 42, 74];
  const ORANGE = [240,123,48];
  const YELLOW = [245,200,66];
  const WHITE  = [255,255,255];
  const GRAY   = [245,247,250];
  const TEXT   = [45, 55, 72];
  const MUTED  = [113,128,150];

  // CAPA
  doc.setFillColor(...DARK); doc.rect(0, 0, W, 60, 'F');
  doc.setTextColor(...WHITE); doc.setFont('helvetica','bold');
  doc.setFontSize(24); doc.text('CATÁLOGO DE PEÇAS', margin, 25);
  doc.setFont('helvetica','normal'); doc.setFontSize(10);
  doc.setTextColor(180,200,230);
  doc.text('Impressão 3D Profissional', margin, 34);
  doc.setFontSize(9); doc.setTextColor(...YELLOW);
  doc.text(
    `Gerado em ${new Date().toLocaleDateString('pt-BR')} · ${catalog.length} peças`,
    margin, 42
  );

  y = 72;

  // Função auxiliar para verificar quebra de página
  const checkPage = (needed = 44) => {
    if (y + needed > 280) { doc.addPage(); y = 20; }
  };

  catalog.forEach((item, idx) => {
    const hasPhoto = !!item.photo;
    const cardH    = hasPhoto ? 52 : 38;
    checkPage(cardH + 4);

    // Card de fundo
    doc.setFillColor(...GRAY);
    doc.roundedRect(margin, y, W-margin*2, cardH, 3, 3, 'F');

    // ✨ FOTO no PDF
    if (hasPhoto) {
      try {
        doc.addImage(item.photo, 'JPEG', margin+2, y+2, 40, cardH-4, '', 'FAST');
      } catch(e) {
        // Ignora erro de imagem
      }
    }

    const textX = hasPhoto ? margin + 47 : margin + 17;
    const textW = hasPhoto ? W - margin - 47 - 46 : W - margin*2 - 90;

    // Número
    if (!hasPhoto) {
      doc.setFillColor(...ORANGE);
      doc.circle(margin+8, y+8, 5, 'F');
      doc.setFont('helvetica','bold'); doc.setFontSize(8);
      doc.setTextColor(...WHITE);
      doc.text(String(idx+1), margin+8, y+10, { align:'center' });
    }

    // Nome
    doc.setFont('helvetica','bold'); doc.setFontSize(11);
    doc.setTextColor(...DARK);
    doc.text(item.name, textX, y + (hasPhoto ? 10 : 9));

    // Specs
    doc.setFont('helvetica','normal'); doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    const specs = [
      item.material,
      item.weight > 0 ? `${item.weight}g` : null,
      item.hours  > 0 ? `${item.hours}h`  : null,
    ].filter(Boolean).join(' · ');
    doc.text(specs, textX, y + (hasPhoto ? 18 : 16));

    // Descrição
    if (item.desc) {
      doc.setFont('helvetica','normal'); doc.setFontSize(8);
      doc.setTextColor(...TEXT);
      const descLines = doc.splitTextToSize(item.desc, textW);
      doc.text(descLines[0], textX, y + (hasPhoto ? 26 : 23));
    }

    // Estoque/Prazo
    doc.setFont('helvetica','normal'); doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(
      item.stock > 0
        ? `📦 ${item.stock} em estoque`
        : `🕐 Prazo: ${item.leadtime||'?'} dias`,
      textX,
      y + (hasPhoto ? 36 : 30)
    );

    // Box de preço
    const boxX = W - margin - 42;
    const boxY = y + 4;
    doc.setFillColor(...DARK);
    doc.roundedRect(boxX, boxY, 40, 28, 3, 3, 'F');
    doc.setFont('helvetica','normal'); doc.setFontSize(7.5);
    doc.setTextColor(180,200,230);
    doc.text('PREÇO', boxX + 20, boxY+7, { align:'center' });
    doc.setFont('helvetica','bold'); doc.setFontSize(10);
    doc.setTextColor(...YELLOW);
    doc.text(formatBRL(item.price), boxX+20, boxY+17, { align:'center' });
    if (item.margin > 0) {
      doc.setFont('helvetica','normal'); doc.setFontSize(7.5);
      doc.setTextColor(...ORANGE);
      doc.text(`${item.margin.toFixed(0)}% mg`, boxX+20, boxY+24, { align:'center' });
    }

    y += cardH + 6;
  });

  // RODAPÉ
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFillColor(...DARK); doc.rect(0, 288, W, 9, 'F');
    doc.setFont('helvetica','normal'); doc.setFontSize(7.5);
    doc.setTextColor(180,200,230);
    doc.text('3D Pricer Pro · Catálogo de Peças', margin, 294);
    doc.text(`${i}/${pages}`, W-margin, 294, { align:'right' });
  }

  doc.save(`catalogo-3d-${new Date().toISOString().slice(0,10)}.pdf`);
  showToast('PDF do catálogo exportado! 📄', 'fa-file-pdf');
}

// ═══════════════════════════════════════════════════════
// UTILITÁRIOS
// ═══════════════════════════════════════════════════════

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
}
