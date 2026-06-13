'use strict';

// ═══════════════════════════════════════════════════════
// ESTADO GLOBAL
// ═══════════════════════════════════════════════════════

const State = {
  consumables: [],
  finishings:  [],
};

// ═══════════════════════════════════════════════════════
// UTILITÁRIOS GLOBAIS
// ═══════════════════════════════════════════════════════

function getVal(id) {
  const v = parseFloat(document.getElementById(id)?.value);
  return isNaN(v) ? 0 : v;
}

function getStr(id) {
  return document.getElementById(id)?.value?.trim() || '';
}

function setResult(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = formatBRL(value);
}

function showToast(message, icon = 'fa-circle-info') {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
  document.body.appendChild(toast);
  requestAnimationFrame(() =>
    requestAnimationFrame(() => toast.classList.add('show'))
  );
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

function uid() {
  return `_${Math.random().toString(36).slice(2, 9)}`;
}

// ═══════════════════════════════════════════════════════
// SISTEMA DE TABS
// ═══════════════════════════════════════════════════════

function initTabs() {
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;

      document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.tab-content').forEach(c => {
        const isTarget = c.id === `tab-${target}`;
        c.classList.toggle('hidden', !isTarget);
        c.classList.toggle('active',  isTarget);
      });
switch (target) {
  case 'dashboard': renderDashboard();      break;
  case 'clients':   renderClients();        break;
  case 'catalog':
    renderCatalog();
    setTimeout(initCatalogCalc, 150);
    break;
  case 'tools':
    initTools();
    renderPendingAlerts();
    renderMonthlyReportPreview();
    break;
  case 'history':   renderHistory();        break;
  case 'products':  renderProducts('all');  break;
  case 'tips':      renderQualityTips();    break;
}
     
    });
  });
}

// ═══════════════════════════════════════════════════════
// PROGRESS STEPS
// ═══════════════════════════════════════════════════════

function updateProgress() {
  const sections = [
    { step:1, fields:['printerCost','printerLifespan','printerWatts'] },
    { step:2, fields:['spoolCost','spoolWeight','partWeight']          },
    { step:3, fields:['printHours','energyRate']                      },
    { step:4, fields:['profitMargin']                                  },
  ];

  sections.forEach(({ step, fields }) => {
    const el   = document.querySelector(`.step[data-step="${step}"]`);
    const done = fields.every(f => getVal(f) > 0);
    if (!el) return;
    el.classList.toggle('done',   done);
    el.classList.toggle('active', !done);
    el.querySelector('span').innerHTML = done
      ? '<i class="fas fa-check"></i>'
      : step;
  });
}

// ═══════════════════════════════════════════════════════
// CONSUMÍVEIS DINÂMICOS
// ═══════════════════════════════════════════════════════

function addConsumable() {
  const id   = uid();
  State.consumables.push({ id, name:'', cost:0, lifeHours:0 });

  const list = document.getElementById('consumables-list');
  const row  = document.createElement('div');
  row.className = 'dynamic-row';
  row.id        = `crow-${id}`;
  row.innerHTML = `
    <input type="text"   placeholder="Ex: Bico 0.4mm"
           oninput="updateConsumable('${id}','name',this.value)"/>
    <input type="number" placeholder="R$"    min="0"
           oninput="updateConsumable('${id}','cost',this.value)"/>
    <input type="number" placeholder="Horas" min="0"
           oninput="updateConsumable('${id}','lifeHours',this.value)"/>
    <button class="btn-del" onclick="removeConsumable('${id}')">
      <i class="fas fa-xmark"></i>
    </button>`;
  list?.appendChild(row);
}

function updateConsumable(id, field, value) {
  const item = State.consumables.find(c => c.id === id);
  if (item) item[field] = field === 'name' ? value : parseFloat(value) || 0;
}

function removeConsumable(id) {
  State.consumables = State.consumables.filter(c => c.id !== id);
  document.getElementById(`crow-${id}`)?.remove();
}

function calcConsumablesCost(printHours) {
  return State.consumables.reduce((sum, c) => {
    if (!c.cost || !c.lifeHours) return sum;
    return sum + (c.cost / c.lifeHours) * printHours;
  }, 0);
}

// ═══════════════════════════════════════════════════════
// ACABAMENTOS DINÂMICOS
// ═══════════════════════════════════════════════════════

function addFinishing() {
  const id   = uid();
  State.finishings.push({ id, name:'', cost:0 });

  const list = document.getElementById('finishing-list');
  const row  = document.createElement('div');
  row.className = 'dynamic-row finishing-row';
  row.id        = `frow-${id}`;
  row.innerHTML = `
    <input type="text"   placeholder="Ex: Primer em spray"
           oninput="updateFinishing('${id}','name',this.value)"/>
    <input type="number" placeholder="R$" min="0"
           oninput="updateFinishing('${id}','cost',this.value)"/>
    <button class="btn-del" onclick="removeFinishing('${id}')">
      <i class="fas fa-xmark"></i>
    </button>`;
  list?.appendChild(row);
}

function updateFinishing(id, field, value) {
  const item = State.finishings.find(f => f.id === id);
  if (item) item[field] = field === 'name' ? value : parseFloat(value) || 0;
}

function removeFinishing(id) {
  State.finishings = State.finishings.filter(f => f.id !== id);
  document.getElementById(`frow-${id}`)?.remove();
}

function calcFinishingCost() {
  return State.finishings.reduce((sum, f) => sum + (f.cost || 0), 0);
}

// ═══════════════════════════════════════════════════════
// PREVIEW DE ENERGIA
// ═══════════════════════════════════════════════════════

function updateEnergyPreview() {
  const hours = getVal('printHours');
  const watts = getVal('printerWatts');
  const rate  = getVal('energyRate');
  const box   = document.getElementById('energy-preview');
  const valEl = document.getElementById('energy-preview-val');

  if (hours > 0 && watts > 0 && rate > 0) {
    const cost = (watts / 1000) * hours * rate;
    if (valEl) valEl.textContent = `${formatBRL(cost)} para ${hours}h de impressão`;
    box?.classList.remove('hidden');
  } else {
    box?.classList.add('hidden');
  }
}

// ═══════════════════════════════════════════════════════
// MUDANÇA DE MATERIAL
// ═══════════════════════════════════════════════════════

function onMaterialChange() {
  const type    = getStr('materialType');
  const infoBox = document.getElementById('material-info');
  const infoTxt = document.getElementById('material-info-text');
  const info    = MATERIAL_INFO[type];

  if (!info || !type) {
    infoBox?.classList.add('hidden');
    return;
  }

  if (infoTxt) {
    infoTxt.innerHTML = `
      <strong>${type}</strong> — ${info.desc}
      <br><small>
        🌡️ Bico: <b>${info.tempNozzle}</b> &nbsp;|&nbsp;
        Mesa: <b>${info.tempBed}</b> &nbsp;|&nbsp;
        Preço médio/kg: <b>~R$ ${info.avgPrice}</b>
      </small>
      ${info.alternatives?.length
        ? `<br><small>↪ Alternativas: <b>${info.alternatives.join(', ')}</b></small>`
        : ''}`;
  }

  infoBox?.classList.remove('hidden');

  const spoolEl = document.getElementById('spoolCost');
  if (spoolEl && !spoolEl.value && info.avgPrice) {
    spoolEl.value             = info.avgPrice;
    spoolEl.style.borderColor = 'var(--orange)';
    setTimeout(() => spoolEl.style.borderColor = '', 2000);
  }
}

// ═══════════════════════════════════════════════════════
// TIPO DE IMPRESSORA
// ═══════════════════════════════════════════════════════

function onPrinterTypeChange() {
  const type     = getStr('printerType');
  const watts    = document.getElementById('printerWatts');
  const defaults = { FDM:350, MSLA:100, SLS:1200, MJF:2000 };

  if (defaults[type] && !watts?.value) {
    if (watts) watts.value = defaults[type];
    showToast(`Consumo padrão ${type}: ${defaults[type]}W sugerido`, 'fa-bolt');
  }
}

// ═══════════════════════════════════════════════════════
// VALIDAÇÃO
// ═══════════════════════════════════════════════════════

function validate() {
  const required = [
    { id:'printerCost',     label:'Custo de Aquisição da Impressora' },
    { id:'printerLifespan', label:'Vida Útil da Impressora (horas)'  },
    { id:'printerWatts',    label:'Consumo da Impressora (W)'        },
    { id:'monthlyHours',    label:'Horas Trabalhadas por Mês'        },
    { id:'spoolCost',       label:'Preço do Carretel/Frasco'         },
    { id:'spoolWeight',     label:'Peso do Carretel/Frasco'          },
    { id:'partWeight',      label:'Peso Usado na Peça'               },
    { id:'printHours',      label:'Tempo de Impressão'               },
    { id:'energyRate',      label:'Tarifa de Energia (R$/kWh)'       },
    { id:'profitMargin',    label:'Margem de Lucro'                  },
  ];

  for (const f of required) {
    if (getVal(f.id) <= 0) {
      return { valid:false, message:`Preencha: ${f.label}`, fieldId:f.id };
    }
  }
  return { valid:true, message:'', fieldId:'' };
}

function highlightInvalid(fieldId) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  el.style.borderColor = '#e74c3c';
  el.style.boxShadow   = '0 0 0 3px rgba(231,76,60,0.2)';
  el.focus();
  el.scrollIntoView({ behavior:'smooth', block:'center' });
  setTimeout(() => { el.style.borderColor = ''; el.style.boxShadow = ''; }, 3000);
}

// ═══════════════════════════════════════════════════════
// CÁLCULO PRINCIPAL
// ═══════════════════════════════════════════════════════

function calculate() {
  const check = validate();
  if (!check.valid) {
    showToast(check.message, 'fa-triangle-exclamation');
    highlightInvalid(check.fieldId);
    return;
  }

  const printerName        = getStr('printerName');
  const printerType        = getStr('printerType');
  const printerCostRaw     = getVal('printerCost');
  const printerLifespan    = getVal('printerLifespan');
  const printerWatts       = getVal('printerWatts');
  const maintenanceCostRaw = getVal('maintenanceCost');
  const spaceCostMonthly   = getVal('spaceCost');
  const monthlyHours       = getVal('monthlyHours');

  const materialType    = getStr('materialType');
  const spoolCost       = getVal('spoolCost');
  const spoolWeight     = getVal('spoolWeight');
  const partWeight      = getVal('partWeight');
  const supportWeight   = getVal('supportWeight');
  const failureRate     = getVal('failureRate');
  const postProcessCost = getVal('postProcessCost');

  const printHours    = getVal('printHours');
  const energyRate    = getVal('energyRate');
  const laborCostPerH = getVal('laborCost');
  const laborHours    = getVal('laborHours');
  const setupHours    = getVal('setupHours');
  const washCureCost  = getVal('washCureCost');

  const marginStrategy = getStr('marginStrategy');
  const profitMargin   = getVal('profitMargin');
  const taxRate        = getVal('taxRate');
  const platformFee    = getVal('platformFee');
  const packagingCost  = getVal('packagingCost');
  const otherCosts     = getVal('otherCosts');
  const maxDiscount    = getVal('maxDiscount');
  const quantity       = Math.max(1, getVal('quantity'));

  // ── Custos ──
  const materialCostPerGram = spoolCost / spoolWeight;
  const materialCost        = materialCostPerGram * partWeight;
  const supportCost         = materialCostPerGram * supportWeight;
  const finishingCost       = calcFinishingCost();
  const energyCost          = (printerWatts / 1000) * printHours * energyRate;
  const depreciationCost    = (printerCostRaw / printerLifespan) * printHours;
  const maintenanceCost     = (maintenanceCostRaw / monthlyHours) * printHours;
  const spaceCost           = (spaceCostMonthly / monthlyHours) * printHours;
  const consumablesCost     = calcConsumablesCost(printHours);
  const laborCost           = laborCostPerH * laborHours;
  const setupCost           = laborCostPerH * setupHours;
  const failureReserve      = (materialCost + supportCost) * (failureRate / 100);

  const directCost =
    materialCost + supportCost + finishingCost +
    energyCost + depreciationCost + maintenanceCost +
    spaceCost + consumablesCost +
    laborCost + setupCost + washCureCost +
    failureReserve + postProcessCost +
    packagingCost + otherCosts;

  // ── Preço ──
  const taxAmount          = directCost * (taxRate / 100);
  const baseBeforePlatform = directCost + taxAmount;
  const withPlatform       = platformFee > 0
    ? baseBeforePlatform / (1 - platformFee / 100)
    : baseBeforePlatform;
  const platformFeeAmount  = withPlatform - baseBeforePlatform;

  let finalPrice, profitAmount;
  if (marginStrategy === 'margin') {
    finalPrice   = withPlatform / (1 - profitMargin / 100);
    profitAmount = finalPrice - withPlatform;
  } else {
    profitAmount = withPlatform * (profitMargin / 100);
    finalPrice   = withPlatform + profitAmount;
  }

  const minPrice        = directCost * 1.05;
  const discountedPrice = finalPrice * (1 - maxDiscount / 100);
  const premiumPrice    = finalPrice * 1.20;
  const batchPrice      = finalPrice * quantity;

  // ── Salva resultado global ──
  window._lastResult = {
    printerName, printerType, materialType,
    printerWatts, printerCostRaw, printerLifespan,
    maintenanceCostRaw, monthlyHours,
    partWeight, supportWeight, printHours,
    spoolCost, spoolWeight,
    energyRate, laborCostPerH, laborHours,
    setupHours, taxRate, platformFee,
    packagingCost, otherCosts, maxDiscount,
    profitMargin, quantity, failureRate,
    postProcessCost, materialCostPerGram,
    materialCost, supportCost, finishingCost,
    energyCost, depreciationCost, maintenanceCost,
    spaceCost, consumablesCost,
    laborCost, setupCost, washCureCost,
    failureReserve, directCost, taxAmount,
    platformFeeAmount, profitAmount, finalPrice,
    minPrice, discountedPrice, premiumPrice, batchPrice,
    marginStrategy,
  };

  renderResult(window._lastResult);
  renderChart(window._lastResult);
  updateProgress();
  renderDynamicTips(generateDynamicTips(window._lastResult));

  const resultEl = document.getElementById('result');
  resultEl?.classList.remove('hidden');
  setTimeout(() => resultEl?.scrollIntoView({ behavior:'smooth', block:'start' }), 100);

  showToast('Precificação concluída! 🎉', 'fa-circle-check');
}
renderPlatformComparatorInResult(window._lastResult);
// ═══════════════════════════════════════════════════════
// RENDERIZAÇÃO DO RESULTADO
// ═══════════════════════════════════════════════════════

function renderResult(r) {
  const fields = {
    'r-material':     r.materialCost,
    'r-support':      r.supportCost,
    'r-finishing':    r.finishingCost,
    'r-energy':       r.energyCost,
    'r-depreciation': r.depreciationCost,
    'r-maintenance':  r.maintenanceCost,
    'r-consumables':  r.consumablesCost,
    'r-space':        r.spaceCost,
    'r-labor':        r.laborCost,
    'r-setup':        r.setupCost,
    'r-washcure':     r.washCureCost,
    'r-failure':      r.failureReserve,
    'r-postprocess':  r.postProcessCost,
    'r-packaging':    r.packagingCost,
    'r-other':        r.otherCosts,
    'r-total-cost':   r.directCost,
    'r-tax':          r.taxAmount,
    'r-platform':     r.platformFeeAmount,
    'r-profit':       r.profitAmount,
    'r-final':        r.finalPrice,
    'r-min':          r.minPrice,
    'r-sug':          r.finalPrice,
    'r-discounted':   r.discountedPrice,
    'r-prem':         r.premiumPrice,
    'r-batch':        r.batchPrice,
  };

  Object.entries(fields).forEach(([id, val]) => setResult(id, val));

  const qLabel = document.getElementById('r-qty-label');
  if (qLabel) qLabel.textContent = r.quantity;
}

// ═══════════════════════════════════════════════════════
// GRÁFICO DE PIZZA
// ═══════════════════════════════════════════════════════

function renderChart(r) {
  const canvas = document.getElementById('costChart');
  if (!canvas) return;

  const ctx    = canvas.getContext('2d');
  const W      = canvas.width;
  const H      = canvas.height;
  const cx     = W / 2;
  const cy     = H / 2;
  const radius = Math.min(W, H) / 2 - 10;
  const dark   = document.documentElement.getAttribute('data-theme') === 'dark';

  const slices = [
    { label:'Material',      value: r.materialCost + r.supportCost,                                     color:'#2c4a7c' },
    { label:'Energia',       value: r.energyCost,                                                       color:'#f07b30' },
    { label:'Depreciação',   value: r.depreciationCost,                                                 color:'#f5c842' },
    { label:'Manutenção',    value: r.maintenanceCost + r.spaceCost + r.consumablesCost,                color:'#3d6199' },
    { label:'Mão de Obra',   value: r.laborCost + r.setupCost,                                         color:'#27ae60' },
    { label:'Falhas/Extras', value: r.failureReserve + r.postProcessCost,                              color:'#e74c3c' },
    { label:'Embal./Outros', value: r.packagingCost + r.otherCosts + r.finishingCost + r.washCureCost,  color:'#9b59b6' },
  ].filter(d => d.value > 0);

  const total = slices.reduce((s, d) => s + d.value, 0);
  if (total <= 0) return;

  ctx.clearRect(0, 0, W, H);

  let startAngle = -Math.PI / 2;

  slices.forEach(slice => {
    const sliceAngle = (slice.value / total) * 2 * Math.PI;
    const endAngle   = startAngle + sliceAngle;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle   = slice.color;
    ctx.strokeStyle = dark ? '#1a2a3e' : '#ffffff';
    ctx.lineWidth   = 3;
    ctx.fill();
    ctx.stroke();

    const pct = (slice.value / total) * 100;
    if (pct > 5) {
      const mid = startAngle + sliceAngle / 2;
      ctx.fillStyle    = '#ffffff';
      ctx.font         = 'bold 11px Poppins,sans-serif';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${pct.toFixed(0)}%`,
        cx + radius * 0.65 * Math.cos(mid),
        cy + radius * 0.65 * Math.sin(mid));
    }

    startAngle = endAngle;
  });

  // Donut central
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.42, 0, 2 * Math.PI);
  ctx.fillStyle = dark ? '#1a2a3e' : '#ffffff';
  ctx.fill();
  ctx.fillStyle    = '#1a2a4a';
  ctx.font         = 'bold 11px Poppins,sans-serif';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CUSTO', cx, cy - 8);
  ctx.fillStyle = '#f07b30';
  ctx.font      = 'bold 10px Poppins,sans-serif';
  ctx.fillText(formatBRL(total), cx, cy + 8);

  // Legenda
  const legend = document.getElementById('chart-legend');
  if (legend) {
    legend.innerHTML = slices.map(d => `
      <div class="legend-item">
        <span class="legend-dot" style="background:${d.color}"></span>
        ${d.label} (${((d.value/total)*100).toFixed(1)}%)
      </div>`).join('');
  }
}

// ═══════════════════════════════════════════════════════
// ADICIONAR AO CATÁLOGO DO RESULTADO
// ═══════════════════════════════════════════════════════

function addToCatalogFromResult() {
  if (!window._lastResult) {
    showToast('Calcule uma precificação primeiro!', 'fa-triangle-exclamation');
    return;
  }

  // Muda para aba catálogo
  document.querySelectorAll('.tab').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === 'catalog'));
  document.querySelectorAll('.tab-content').forEach(c => {
    const isCat = c.id === 'tab-catalog';
    c.classList.toggle('hidden', !isCat);
    c.classList.toggle('active',  isCat);
  });

  renderCatalog();

  setTimeout(() => {
    const r = window._lastResult;
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

    const matEl  = document.getElementById('cat-material');
    if (matEl && r.materialType) matEl.value = r.materialType;

    const nameEl = document.getElementById('cat-name');
    if (nameEl && r.printerName) nameEl.value = r.printerName;

    calcCatalogMargin();

    const body = document.getElementById('catalog-form-body');
    if (body) body.style.display = '';
    document.getElementById('catalog-form-card')
      ?.scrollIntoView({ behavior:'smooth', block:'start' });

    showToast('Dados importados para o catálogo! 🎯', 'fa-cubes');
  }, 200);
}

// ═══════════════════════════════════════════════════════
// DICAS DINÂMICAS
// ═══════════════════════════════════════════════════════

function renderDynamicTips(tips) {
  const container = document.getElementById('tips-container');
  if (!container) return;

  if (!tips.length) {
    container.innerHTML = `
      <div class="tip-card info">
        <div class="tip-icon">✅</div>
        <div>
          <div class="tip-title">Tudo dentro do esperado!</div>
          <div class="tip-desc">Seus parâmetros estão em boas faixas.
          Continue monitorando custos e ajuste margens conforme o mercado.</div>
        </div>
      </div>`;
    return;
  }

  container.innerHTML = tips.map(t => `
    <div class="tip-card ${t.type}">
      <div class="tip-icon">${t.icon}</div>
      <div>
        <div class="tip-title">${t.title}</div>
        <div class="tip-desc">${t.desc}</div>
        <span class="tip-badge">${t.badge}</span>
      </div>
    </div>`).join('');
}

function renderQualityTips() {
  const container = document.getElementById('quality-tips');
  if (!container || container.children.length > 0) return;

  container.innerHTML = QUALITY_TIPS.map(q => `
    <div class="quality-card">
      <div class="q-icon">${q.icon}</div>
      <div class="q-title">${q.title}</div>
      <div class="q-value">${q.value}</div>
      <div class="q-desc">${q.desc}</div>
    </div>`).join('');
}

// ═══════════════════════════════════════════════════════
// PRODUTOS
// ═══════════════════════════════════════════════════════

function renderProducts(filter = 'all') {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  const seen = new Set();
  const list = (filter === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.category === filter))
    .filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

  grid.innerHTML = list.map(p => `
    <div class="product-card${p.highlight ? ' product-highlight' : ''}">
      <span class="product-badge-tag tag-${p.tag}">${tagLabel(p.tag)}</span>
      <div class="product-emoji">${p.emoji}</div>
      <div class="product-name">${p.name}</div>
      <div class="product-brand">${p.brand}</div>
      <div class="product-price">${p.price}</div>
      <div class="product-specs">
        ${p.specs.map(s => `<span class="spec-tag">${s}</span>`).join('')}
      </div>
      <div class="product-desc">${p.desc}</div>
      <div class="product-rating">
        ${renderStars(p.rating)}
        <small>${p.rating}</small>
      </div>
    </div>`).join('');
}

function tagLabel(tag) {
  return { hot:'🔥 Popular', new:'✨ Novo', best:'⭐ Melhor', premium:'💎 Premium' }[tag] || tag;
}

function renderStars(rating) {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return [
    ...Array(full).fill('<i class="fas fa-star"></i>'),
    ...Array(half).fill('<i class="fas fa-star-half-stroke"></i>'),
    ...Array(empty).fill('<i class="far fa-star"></i>'),
  ].join('');
}

function initProductFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderProducts(btn.dataset.filter);
    });
  });
}

// ═══════════════════════════════════════════════════════
// COMPARADOR DE MATERIAIS
// ═══════════════════════════════════════════════════════

// Função para abrir o modal do comparador
function openComparator() {
  const modal = document.getElementById('comparator-modal');
  if (modal) {
    modal.classList.add('show'); // Adiciona a classe 'show'
    // Opcional: Adiciona um listener para fechar o modal ao clicar fora dele
    modal.addEventListener('click', function handler(event) {
      if (event.target === modal) { // Verifica se o clique foi no overlay, não no modal em si
        closeComparator();
        modal.removeEventListener('click', handler); // Remove o listener para evitar múltiplos
      }
    });
  }
}

// Função para fechar o modal do comparador
function closeComparator() {
  const modal = document.getElementById('comparator-modal');
  if (modal) {
    modal.classList.remove('show'); // Remove a classe 'show'
  }
}
// ═══════════════════════════════════════════════════════
// DARK MODE
// ═══════════════════════════════════════════════════════

const THEME_KEY = '3dpricer_theme';

function toggleTheme() {
  const html   = document.documentElement;
  const icon   = document.getElementById('theme-icon');
  const isDark = html.getAttribute('data-theme') === 'dark';

  if (isDark) {
    html.removeAttribute('data-theme');
    if (icon) icon.className = 'fas fa-moon';
    localStorage.setItem(THEME_KEY, 'light');
  } else {
    html.setAttribute('data-theme', 'dark');
    if (icon) icon.className = 'fas fa-sun';
    localStorage.setItem(THEME_KEY, 'dark');
  }

  if (window._lastResult)  renderChart(window._lastResult);
  if (window._lastSimData) renderMonthlyChart(window._lastSimData);
}

function applyStoredTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const icon  = document.getElementById('theme-icon');
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    if (icon) icon.className = 'fas fa-sun';
  }
}

// ═══════════════════════════════════════════════════════
// RESET DO FORMULÁRIO
// ═══════════════════════════════════════════════════════

function resetForm() {
  document.querySelectorAll('input, select').forEach(el => {
    if (el.tagName === 'SELECT') el.selectedIndex = 0;
    else el.value = '';
  });

  State.consumables = [];
  State.finishings  = [];

  document.getElementById('consumables-list').innerHTML = '';
  document.getElementById('finishing-list').innerHTML   = '';
  document.getElementById('result')?.classList.add('hidden');
  document.getElementById('material-info')?.classList.add('hidden');
  document.getElementById('energy-preview')?.classList.add('hidden');

  const tips = document.getElementById('tips-container');
  if (tips) tips.innerHTML = `
    <div class="tips-placeholder">
      <i class="fas fa-calculator"></i>
      <p>Realize uma precificação primeiro para receber sugestões personalizadas.</p>
    </div>`;

  document.querySelectorAll('.step').forEach((el, i) => {
    el.classList.remove('done');
    el.classList.toggle('active', i === 0);
    el.querySelector('span').textContent = i + 1;
  });

  window._lastResult  = null;
  window._lastSimData = null;

  setDefaults();
  window.scrollTo({ top:0, behavior:'smooth' });
  showToast('Formulário limpo! 🗑️', 'fa-arrow-rotate-left');
}

// ═══════════════════════════════════════════════════════
// VALORES PADRÃO
// ═══════════════════════════════════════════════════════

function setDefaults() {
  const defaults = {
    printerLifespan: 5000,
    printerWatts:    350,
    maintenanceCost: 80,
    monthlyHours:    160,
    spoolWeight:     1000,
    failureRate:     5,
    energyRate:      0.85,
    profitMargin:    40,
    taxRate:         6,
    quantity:        1,
    setupHours:      0.25,
  };

  Object.entries(defaults).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el && !el.value) el.value = val;
  });
}

// ═══════════════════════════════════════════════════════
// ONBOARDING
// ═══════════════════════════════════════════════════════

const ONBOARDING_KEY   = '3dpricer_onboarded';
const ONBOARDING_STEPS = [
  {
    emoji:'👋', title:'Bem-vindo ao 3D Pricer Pro!',
    desc:'O app mais completo para precificação de impressão 3D. Vamos fazer um tour rápido para você começar a lucrar mais!',
  },
  {
    emoji:'🖨️', title:'Configure sua Impressora',
    desc:'Informe o custo da sua impressora, consumo em Watts e vida útil estimada. O app calcula automaticamente a depreciação por peça.',
  },
  {
    emoji:'🧵', title:'Escolha o Material',
    desc:'Selecione o tipo de material e o app já sugere o preço médio do carretel, temperatura e alternativas mais econômicas.',
  },
  {
    emoji:'💰', title:'Defina sua Margem',
    desc:'Configure impostos, taxas de plataforma e margem de lucro. O sistema calcula o preço mínimo, sugerido e premium automaticamente.',
  },
  {
    emoji:'📊', title:'Dashboard & Simulador',
    desc:'Use o Dashboard para acompanhar seu negócio e o Simulador para projetar lucro mensal, breakeven e retorno do investimento!',
  },
];

let onboardingStep = 0;

function showOnboarding() {
  if (localStorage.getItem(ONBOARDING_KEY)) return;
  onboardingStep = 0;
  renderOnboardingStep();
}

function renderOnboardingStep() {
  document.querySelector('.onboarding-overlay')?.remove();

  const step   = ONBOARDING_STEPS[onboardingStep];
  const isLast = onboardingStep === ONBOARDING_STEPS.length - 1;

  const overlay = document.createElement('div');
  overlay.className = 'onboarding-overlay';
  overlay.innerHTML = `
    <div class="onboarding-box">
      <div class="onboarding-emoji">${step.emoji}</div>
      <div class="onboarding-step">Passo ${onboardingStep+1} de ${ONBOARDING_STEPS.length}</div>
      <div class="onboarding-title">${step.title}</div>
      <div class="onboarding-desc">${step.desc}</div>
      <div class="onboarding-dots">
        ${ONBOARDING_STEPS.map((_, i) =>
          `<div class="onboarding-dot ${i === onboardingStep ? 'active' : ''}"></div>`
        ).join('')}
      </div>
      <div class="onboarding-actions">
        <button class="onboarding-skip" onclick="skipOnboarding()">Pular tour</button>
        <button class="onboarding-next" onclick="nextOnboardingStep()">
          ${isLast
            ? '<i class="fas fa-rocket"></i> Começar!'
            : 'Próximo <i class="fas fa-arrow-right"></i>'}
        </button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
}

function nextOnboardingStep() {
  onboardingStep++;
  if (onboardingStep >= ONBOARDING_STEPS.length) skipOnboarding();
  else renderOnboardingStep();
}

function skipOnboarding() {
  document.querySelector('.onboarding-overlay')?.remove();
  localStorage.setItem(ONBOARDING_KEY, '1');
  showToast('Pronto! Vamos precificar! 🚀', 'fa-rocket');
}

// ═══════════════════════════════════════════════════════
// PWA
// ═══════════════════════════════════════════════════════

let deferredPrompt = null;

function installPWA() {
  if (!deferredPrompt) {
    showToast('Use o menu do navegador para instalar!', 'fa-circle-info');
    return;
  }
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(choice => {
    if (choice.outcome === 'accepted') showToast('Instalando o app... 🚀', 'fa-rocket');
    deferredPrompt = null;
  });
}

function closePWABanner() {
  document.getElementById('pwa-banner')?.classList.add('hidden');
  localStorage.setItem('pwa-banner-closed', '1');
}

// ═══════════════════════════════════════════════════════
// INICIALIZAÇÃO
// ═══════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  applyStoredTheme();
  setDefaults();
  initTabs();
  initProductFilters();
  initSimulator();
  // Badge de orçamentos pendentes
setTimeout(() => updateClientsBadge(
  loadQuotes().filter(q => q.status === 'pending').length
), 500);
  renderHistory();
  renderQualityTips();
  renderProducts('all');

  document.getElementById('comparator-modal')
    ?.addEventListener('click', e => {
      if (e.target.id === 'comparator-modal') closeComparator();
    });

  document.querySelectorAll('input, select').forEach(el =>
    el.addEventListener('input', updateProgress)
  );

  setTimeout(showOnboarding, 800);

  console.log(
    '%c3D Pricer Pro v2.0 ✅',
    'color:#f07b30;font-weight:bold;font-size:16px'
  );

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('[PWA] SW registrado:', reg.scope))
        .catch(err => console.warn('[PWA] Erro no SW:', err));
    });
  }

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('pwa-banner')?.classList.remove('hidden');
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    document.getElementById('pwa-banner')?.classList.add('hidden');
    showToast('App instalado com sucesso! 🎉', 'fa-mobile-screen');
  });
});
// Variável para armazenar o evento beforeinstallprompt
let deferredPrompt;

// Captura o evento beforeinstallprompt
window.addEventListener('beforeinstallprompt', (e) => {
  // Previne que o mini-infobar apareça automaticamente
  e.preventDefault();
  // Armazena o evento para que possa ser disparado depois
  deferredPrompt = e;
  // Mostra o banner de instalação PWA (se estiver escondido)
  const pwaBanner = document.getElementById('pwa-banner');
  if (pwaBanner) {
    pwaBanner.classList.remove('hidden');
  }
});

// Função para iniciar a instalação do PWA
function installPWA() {
  if (deferredPrompt) {
    // Esconde o banner de instalação
    const pwaBanner = document.getElementById('pwa-banner');
    if (pwaBanner) {
      pwaBanner.classList.add('hidden');
    }
    // Dispara o prompt de instalação
    deferredPrompt.prompt();
    // Espera pela resposta do usuário ao prompt
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('Usuário aceitou a instalação do PWA');
        showToast('3D Pricer Pro instalado! 🎉', 'fa-check-circle');
      } else {
        console.log('Usuário recusou a instalação do PWA');
        showToast('Instalação cancelada.', 'fa-info-circle');
      }
      deferredPrompt = null; // Limpa o evento
    });
  } else {
    // Se o evento não foi disparado (navegador não suporta ou já instalado)
    console.log('O prompt de instalação não está disponível ou já foi disparado.');
    showToast('Para instalar, use o menu do navegador (Adicionar à tela inicial).', 'fa-info-circle');
  }
}

// Função para fechar o banner PWA
function closePWABanner() {
  const pwaBanner = document.getElementById('pwa-banner');
  if (pwaBanner) {
    pwaBanner.classList.add('hidden');
  }
  // Opcional: Você pode querer armazenar que o usuário fechou o banner
  // para não mostrá-lo novamente por um tempo.
  localStorage.setItem('pwaBannerClosed', 'true');
}

// Verifica se o banner deve ser mostrado ao carregar a página
window.addEventListener('load', () => {
  if (localStorage.getItem('pwaBannerClosed') === 'true') {
    const pwaBanner = document.getElementById('pwa-banner');
    if (pwaBanner) {
      pwaBanner.classList.add('hidden');
    }
  }
});
// app.js

// ... (seu código existente) ...

// Registro do Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Ajuste o caminho para o seu service-worker.js
    // Se estiver na raiz do projeto, use '/service-worker.js'
    // Se estiver em uma subpasta '3d-pricer-pro', use '/3d-pricer-pro/service-worker.js'
    navigator.serviceWorker.register('/3d-pricer-pro/service-worker.js')
      .then(registration => {
        console.log('Service Worker registrado com sucesso:', registration.scope);
      })
      .catch(error => {
        console.error('Falha no registro do Service Worker:', error);
      });
  });
}

// ... (o restante do seu código app.js, incluindo as funções PWA que te dei antes) ...
