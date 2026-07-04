'use strict';

// ═══════════════════════════════════════════════════════
// ESTADO GLOBAL
// ═══════════════════════════════════════════════════════

const State = {
  consumables: [],
  finishings:  [],
};

window._lastResult  = null;
window._lastSimData = null;

// ═══════════════════════════════════════════════════════
// UTILITÁRIOS GLOBAIS
// ═══════════════════════════════════════════════════════

window.formatBRL = function(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
  }).format(value || 0);
};

window.getVal = function(id) {
  const v = parseFloat(document.getElementById(id)?.value);
  return isNaN(v) ? 0 : v;
};

window.getStr = function(id) {
  return document.getElementById(id)?.value?.trim() || '';
};

window.setResult = function(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = window.formatBRL(value);
};

window.showToast = function(message, icon = 'fa-circle-info') {
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
};

window.uid = function() {
  return `_${Math.random().toString(36).slice(2, 9)}`;
};

// ═══════════════════════════════════════════════════════
// SISTEMA DE TABS
// ═══════════════════════════════════════════════════════

window.initTabs = function() {
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;

      document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.tab-content').forEach(c => {
        const isTarget = c.id === `tab-${target}`;
        c.classList.toggle('hidden', !isTarget);
        c.classList.toggle('active', isTarget);
      });

      switch (target) {
        case 'dashboard': window.renderDashboard?.();      break;
        case 'clients':   window.renderClients?.();        break;
        case 'catalog':
          window.renderCatalog?.();
          setTimeout(() => window.initCatalogCalc?.(), 150);
          break;
        case 'tools':
          window.initTools?.();
          window.renderPendingAlerts?.();
          window.renderMonthlyReportPreview?.();
          break;
        case 'tips':      window.renderQualityTips?.();    break;
        case 'products':  window.renderProducts?.('all');  break;
        case 'simulator': window.runSimulator?.();         break;
        case 'history':   window.renderHistory?.();        break;
      }
    });
  });
};

// ═══════════════════════════════════════════════════════
// PROGRESS STEPS
// ═══════════════════════════════════════════════════════

window.updateProgress = function() {
  const sections = [
    { step:1, fields:['printerCost','printerLifespan','printerWatts'] },
    { step:2, fields:['spoolCost','spoolWeight','partWeight']          },
    { step:3, fields:['printHours','energyRate']                      },
    { step:4, fields:['profitMargin']                                  },
  ];

  sections.forEach(({ step, fields }) => {
    const el   = document.querySelector(`.step[data-step="${step}"]`);
    const done = fields.every(f => window.getVal(f) > 0);
    if (!el) return;
    el.classList.toggle('done',   done);
    el.classList.toggle('active', !done);
    const span = el.querySelector('span');
    if (span) span.innerHTML = done ? '<i class="fas fa-check"></i>' : step;
  });
};

// ═══════════════════════════════════════════════════════
// CONSUMÍVEIS DINÂMICOS
// ═══════════════════════════════════════════════════════

window.addConsumable = function() {
  const id   = window.uid();
  State.consumables.push({ id, name:'', cost:0, lifeHours:0 });

  const list = document.getElementById('consumables-list');
  if (!list) return;
  const row  = document.createElement('div');
  row.className = 'dynamic-row';
  row.id        = `crow-${id}`;
  row.innerHTML = `
    <input type="text"   placeholder="Ex: Bico 0.4mm"
           oninput="window.updateConsumable('${id}','name',this.value)"/>
    <input type="number" placeholder="R$"    min="0"
           oninput="window.updateConsumable('${id}','cost',this.value)"/>
    <input type="number" placeholder="Horas" min="0"
           oninput="window.updateConsumable('${id}','lifeHours',this.value)"/>
    <button class="btn-del" onclick="window.removeConsumable('${id}')">
      <i class="fas fa-xmark"></i>
    </button>`;
  list.appendChild(row);
};

window.updateConsumable = function(id, field, value) {
  const item = State.consumables.find(c => c.id === id);
  if (item) item[field] = field === 'name' ? value : parseFloat(value) || 0;
};

window.removeConsumable = function(id) {
  State.consumables = State.consumables.filter(c => c.id !== id);
  document.getElementById(`crow-${id}`)?.remove();
};

window.calcConsumablesCost = function(printHours) {
  return State.consumables.reduce((sum, c) => {
    if (!c.cost || !c.lifeHours) return sum;
    return sum + (c.cost / c.lifeHours) * printHours;
  }, 0);
};

// ═══════════════════════════════════════════════════════
// ACABAMENTOS DINÂMICOS
// ═══════════════════════════════════════════════════════

window.addFinishing = function() {
  const id   = window.uid();
  State.finishings.push({ id, name:'', cost:0 });

  const list = document.getElementById('finishing-list');
  if (!list) return;
  const row  = document.createElement('div');
  row.className = 'dynamic-row finishing-row';
  row.id        = `frow-${id}`;
  row.innerHTML = `
    <input type="text"   placeholder="Ex: Primer em spray"
           oninput="window.updateFinishing('${id}','name',this.value)"/>
    <input type="number" placeholder="R$" min="0"
           oninput="window.updateFinishing('${id}','cost',this.value)"/>
    <button class="btn-del" onclick="window.removeFinishing('${id}')">
      <i class="fas fa-xmark"></i>
    </button>`;
  list.appendChild(row);
};

window.updateFinishing = function(id, field, value) {
  const item = State.finishings.find(f => f.id === id);
  if (item) item[field] = field === 'name' ? value : parseFloat(value) || 0;
};

window.removeFinishing = function(id) {
  State.finishings = State.finishings.filter(f => f.id !== id);
  document.getElementById(`frow-${id}`)?.remove();
};

window.calcFinishingCost = function() {
  return State.finishings.reduce((sum, f) => sum + (f.cost || 0), 0);
};

// ═══════════════════════════════════════════════════════
// PREVIEW DE ENERGIA
// ═══════════════════════════════════════════════════════

window.updateEnergyPreview = function() {
  const hours = window.getVal('printHours');
  const watts = window.getVal('printerWatts');
  const rate  = window.getVal('energyRate');
  const box   = document.getElementById('energy-preview');
  const valEl = document.getElementById('energy-preview-val');

  if (hours > 0 && watts > 0 && rate > 0) {
    const cost = (watts / 1000) * hours * rate;
    if (valEl) valEl.textContent =
      `${window.formatBRL(cost)} para ${hours}h de impressão`;
    box?.classList.remove('hidden');
  } else {
    box?.classList.add('hidden');
  }
};

// ═══════════════════════════════════════════════════════
// MUDANÇA DE MATERIAL
// ═══════════════════════════════════════════════════════

window.onMaterialChange = function() {
  const type    = window.getStr('materialType');
  const infoBox = document.getElementById('material-info');
  const infoTxt = document.getElementById('material-info-text');

  // MATERIAL_INFO vem do suggestions.js via window.MATERIAL_INFO
  const info = window.MATERIAL_INFO?.[type];

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
    spoolEl.value = info.avgPrice;
    spoolEl.style.borderColor = 'var(--orange)';
    setTimeout(() => spoolEl.style.borderColor = '', 2000);
  }

  window.updateProgress();
};

// ═══════════════════════════════════════════════════════
// TIPO DE IMPRESSORA
// ═══════════════════════════════════════════════════════

window.onPrinterTypeChange = function() {
  const type     = window.getStr('printerType');
  const watts    = document.getElementById('printerWatts');
  const defaults = { FDM:350, MSLA:100, SLS:1200, MJF:2000 };

  if (defaults[type] && !watts?.value) {
    if (watts) watts.value = defaults[type];
    window.showToast(
      `Consumo padrão ${type}: ${defaults[type]}W sugerido`, 'fa-bolt'
    );
  }
  window.updateProgress();
};

// ═══════════════════════════════════════════════════════
// VALIDAÇÃO
// ═══════════════════════════════════════════════════════

window.validate = function() {
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
    if (window.getVal(f.id) <= 0) {
      return { valid:false, message:`Preencha: ${f.label}`, fieldId:f.id };
    }
  }
  return { valid:true, message:'', fieldId:'' };
};

window.highlightInvalid = function(fieldId) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  el.style.borderColor = '#e74c3c';
  el.style.boxShadow   = '0 0 0 3px rgba(231,76,60,0.2)';
  el.focus();
  el.scrollIntoView({ behavior:'smooth', block:'center' });
  setTimeout(() => { el.style.borderColor = ''; el.style.boxShadow = ''; }, 3000);
};

// ═══════════════════════════════════════════════════════
// CÁLCULO PRINCIPAL
// ═══════════════════════════════════════════════════════

window.calculate = function() {
  const check = window.validate();
  if (!check.valid) {
    window.showToast(check.message, 'fa-triangle-exclamation');
    window.highlightInvalid(check.fieldId);
    return;
  }

  const printerName        = window.getStr('printerName') || 'Impressora';
  const printerType        = window.getStr('printerType');
  const printerCostRaw     = window.getVal('printerCost');
  const printerLifespan    = window.getVal('printerLifespan');
  const printerWatts       = window.getVal('printerWatts');
  const maintenanceCostRaw = window.getVal('maintenanceCost');
  const spaceCostMonthly   = window.getVal('spaceCost');
  const monthlyHours       = window.getVal('monthlyHours');

  const materialType    = window.getStr('materialType');
  const spoolCost       = window.getVal('spoolCost');
  const spoolWeight     = window.getVal('spoolWeight');
  const partWeight      = window.getVal('partWeight');
  const supportWeight   = window.getVal('supportWeight');
  const failureRate     = window.getVal('failureRate');
  const postProcessCost = window.getVal('postProcessCost');

  const printHours    = window.getVal('printHours');
  const energyRate    = window.getVal('energyRate');
  const laborCostPerH = window.getVal('laborCost');
  const laborHours    = window.getVal('laborHours');
  const setupHours    = window.getVal('setupHours');
  const washCureCost  = window.getVal('washCureCost');

  const marginStrategy = window.getStr('marginStrategy') || 'markup';
  const profitMargin   = window.getVal('profitMargin');
  const taxRate        = window.getVal('taxRate');
  const platformFee    = window.getVal('platformFee');
  const packagingCost  = window.getVal('packagingCost');
  const otherCosts     = window.getVal('otherCosts');
  const maxDiscount    = window.getVal('maxDiscount');
  const quantity       = Math.max(1, window.getVal('quantity') || 1);

  // ── Custos ──
  const materialCostPerGram = spoolCost / spoolWeight;
  const materialCost        = materialCostPerGram * partWeight;
  const supportCost         = materialCostPerGram * (supportWeight || 0);
  const finishingCost       = window.calcFinishingCost();
  const energyCost          = (printerWatts / 1000) * printHours * energyRate;
  const depreciationCost    = (printerCostRaw / printerLifespan) * printHours;
  const maintenanceCost     = (maintenanceCostRaw / monthlyHours) * printHours;
  const spaceCost           = (spaceCostMonthly   / monthlyHours) * printHours;
  const consumablesCost     = window.calcConsumablesCost(printHours);
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

  // ── Resultado global ──
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

  window.renderResult?.(window._lastResult);
  window.updateProgress();

  const tips = window.generateDynamicTips?.(window._lastResult);
  if (tips) window.renderDynamicTips?.(tips);

  const resultEl = document.getElementById('result');
  resultEl?.classList.remove('hidden');
  setTimeout(() =>
    resultEl?.scrollIntoView({ behavior:'smooth', block:'start' }), 100
  );

  window.showToast('Precificação concluída! 🎉', 'fa-circle-check');
};

// ═══════════════════════════════════════════════════════
// RENDERIZAÇÃO DO RESULTADO
// ═══════════════════════════════════════════════════════
window.calculate = function() {
  const printerName      = window.getStr('printerName') || 'Impressora';
  const printerType      = window.getStr('printerType');
  const printerCostRaw   = window.getVal('printerCost');
  const printerLifespan  = window.getVal('printerLifespan');
  const printerWatts     = window.getVal('printerWatts');
  const maintenanceRaw   = window.getVal('maintenanceCost');
  const spaceCostMonthly = window.getVal('spaceCost');
  const monthlyHours     = window.getVal('monthlyHours');

  const materialType    = window.getStr('materialType');
  const spoolCost       = window.getVal('spoolCost');
  const spoolWeight     = window.getVal('spoolWeight');
  const partWeight      = window.getVal('partWeight');
  const postProcessCost = window.getVal('postProcessCost');
  const packagingCost   = window.getVal('packagingCost');

  const printHours    = window.getVal('printHours');
  const energyRate    = window.getVal('energyRate');
  const laborCostPerH = window.getVal('laborCost');   // R$/hora
  const setupCost     = window.getVal('setupCost');   // R$ direto
  const washCureCost  = window.getVal('washCureCost');
  const failureRate   = window.getVal('failureReserve'); // % falhas
  const otherCosts    = window.getVal('otherCosts');
  const quantity      = Math.max(1, window.getVal('quantity') || 1);

  const profitMargin  = window.getVal('profitMargin');
  const taxRate       = window.getVal('taxRate');
  const platformFee   = window.getVal('platformFee');
  const maxDiscount   = window.getVal('maxDiscount');

  // Validações básicas
  if (printerLifespan <= 0 || spoolWeight <= 0 || printHours <= 0) {
    window.showToast('Preencha os campos obrigatórios!', 'fa-triangle-exclamation');
    return;
  }

  // ── Custos ──
  const materialCostPerGram = spoolWeight > 0 ? spoolCost / spoolWeight : 0;
  const materialCost        = materialCostPerGram * partWeight;
  const finishingCost       = window.calcFinishingCost();
  const energyCost          = (printerWatts / 1000) * printHours * energyRate;
  const depreciationCost    = printerLifespan > 0
    ? (printerCostRaw / printerLifespan) * printHours : 0;
  const maintenanceCost     = monthlyHours > 0
    ? (maintenanceRaw / monthlyHours) * printHours : 0;
  const spaceCost           = monthlyHours > 0
    ? (spaceCostMonthly / monthlyHours) * printHours : 0;
  const consumablesCost     = window.calcConsumablesCost(printHours);
  const laborCost           = laborCostPerH * printHours;
  const failureReserve      = materialCost * (failureRate / 100);

  const directCost =
    materialCost + finishingCost +
    energyCost + depreciationCost + maintenanceCost +
    spaceCost + consumablesCost +
    laborCost + setupCost + washCureCost +
    failureReserve + postProcessCost +
    packagingCost + otherCosts;

  // ── Preço ──
  const taxAmount           = directCost * (taxRate / 100);
  const baseBeforePlatform  = directCost + taxAmount;
  const withPlatform        = platformFee > 0
    ? baseBeforePlatform / (1 - platformFee / 100)
    : baseBeforePlatform;
  const platformFeeAmount   = withPlatform - baseBeforePlatform;
  const profitAmount        = withPlatform * (profitMargin / 100);
  const finalPrice          = withPlatform + profitAmount;

  const minPrice        = directCost * 1.05;
  const premiumPrice    = finalPrice * 1.20;
  const discountedPrice = finalPrice * (1 - maxDiscount / 100);
  const batchPrice      = finalPrice * quantity;
  const realMargin      = finalPrice > 0
    ? ((profitAmount / finalPrice) * 100).toFixed(1) : '0.0';

  window._lastResult = {
    printerName, printerType, materialType,
    partWeight, printHours, spoolCost, spoolWeight,
    energyRate, laborCostPerH, taxRate, platformFee,
    packagingCost, otherCosts, maxDiscount,
    profitMargin, quantity, failureRate,
    postProcessCost, materialCostPerGram,
    materialCost, finishingCost, energyCost,
    depreciationCost, maintenanceCost, spaceCost,
    consumablesCost, laborCost, setupCost,
    washCureCost, failureReserve, directCost,
    taxAmount, platformFeeAmount, profitAmount,
    finalPrice, minPrice, premiumPrice,
    discountedPrice, batchPrice, realMargin,
  };

  window.renderResult(window._lastResult);
  window.updateProgress();

  const tips = window.generateDynamicTips?.(window._lastResult);
  if (tips) window.renderDynamicTips?.(tips);

  document.getElementById('result-section')?.classList.remove('hidden');
  setTimeout(() =>
    document.getElementById('result-section')
      ?.scrollIntoView({ behavior:'smooth', block:'start' }), 100
  );

  window.showToast('Precificação concluída! 🎉', 'fa-circle-check');
};

window.renderResult = function(r) {
  // KPIs principais
  window.setResult('directCost',    r.directCost);
  window.setResult('finalPrice',    r.finalPrice);
  window.setResult('profitAmount',  r.profitAmount);
  window.setResult('minPrice',      r.minPrice);
  window.setResult('premiumPrice',  r.premiumPrice);
  window.setResult('discountedPrice', r.discountedPrice);

  // Margem e desconto (texto %)
  const marginEl   = document.getElementById('profitMarginResult');
  const discountEl = document.getElementById('maxDiscountResult');
  if (marginEl)   marginEl.textContent   = `${r.realMargin}%`;
  if (discountEl) discountEl.textContent = `${r.maxDiscount}%`;

  // Detalhamento de custos
  window.setResult('materialCost',         r.materialCost);
  window.setResult('energyCost',           r.energyCost);
  window.setResult('depreciationCost',     r.depreciationCost);
  window.setResult('consumablesCost',      r.consumablesCost);
  window.setResult('maintenanceCostResult',r.maintenanceCost);
  window.setResult('spaceCostResult',      r.spaceCost);
  window.setResult('laborCostResult',      r.laborCost);
  window.setResult('setupCostResult',      r.setupCost);
  window.setResult('washCureCostResult',   r.washCureCost);
  window.setResult('postProcessCostResult',r.postProcessCost);
  window.setResult('packagingCostResult',  r.packagingCost);
  window.setResult('failureReserveResult', r.failureReserve);
  window.setResult('otherCostsResult',     r.otherCosts);
  window.setResult('taxAmount',            r.taxAmount);
  window.setResult('platformFeeAmount',    r.platformFeeAmount);
};


// ═══════════════════════════════════════════════════════
// DICAS DINÂMICAS
// ═══════════════════════════════════════════════════════

window.renderDynamicTips = function(tips) {
  const container = document.getElementById('tips-container');
  if (!container) return;

  if (!tips || !tips.length) {
    container.innerHTML = `
      <div class="tip-card info">
        <div class="tip-icon">✅</div>
        <div>
          <div class="tip-title">Tudo dentro do esperado!</div>
          <div class="tip-desc">Seus parâmetros estão em boas faixas.</div>
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
};

window.renderQualityTips = function() {
  const container = document.getElementById('quality-tips');
  if (!container || container.children.length > 0) return;

  const tips = window.QUALITY_TIPS || [];
  container.innerHTML = tips.map(q => `
    <div class="quality-card">
      <div class="q-icon">${q.icon}</div>
      <div class="q-title">${q.title}</div>
      <div class="q-value">${q.value}</div>
      <div class="q-desc">${q.desc}</div>
    </div>`).join('');
};

// ═══════════════════════════════════════════════════════
// PRODUTOS
// ═══════════════════════════════════════════════════════

window.renderProducts = function(filter = 'all') {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  const list = (window.PRODUCTS_DB || [])
    .filter(p => filter === 'all' || p.category === filter);

  grid.innerHTML = list.map(p => `
    <div class="product-card${p.highlight ? ' product-highlight' : ''}">
      <div class="product-emoji">${p.emoji}</div>
      <div class="product-name">${p.name}</div>
      <div class="product-brand">${p.brand}</div>
      <div class="product-price">${p.price}</div>
      <div class="product-specs">
        ${p.specs.map(s => `<span class="spec-tag">${s}</span>`).join('')}
      </div>
      <div class="product-desc">${p.desc}</div>
      <div class="product-rating">
        ${'<i class="fas fa-star"></i>'.repeat(Math.floor(p.rating))}
        <small>${p.rating}</small>
      </div>
    </div>`).join('');
};

window.initProductFilters = function() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn')
        .forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      window.renderProducts(btn.dataset.filter);
    });
  });
};

// ===============================
// COMPARADOR DE MATERIAIS (FIX)
// ===============================

window.MATERIAL_SPECS = {
  PLA:      { temp: "190–220°C", resistencia: "Média", flex: "Baixa", dificuldade: "Baixa", uso: "Peças decorativas, protótipos" },
  PETG:     { temp: "220–250°C", resistencia: "Alta", flex: "Média", dificuldade: "Média", uso: "Peças funcionais gerais" },
  ABS:      { temp: "230–260°C", resistencia: "Alta", flex: "Média", dificuldade: "Alta", uso: "Peças técnicas" },
  ASA:      { temp: "240–270°C", resistencia: "Alta", flex: "Média", dificuldade: "Alta", uso: "Uso externo (UV)" },
  TPU:      { temp: "210–240°C", resistencia: "Média", flex: "Alta", dificuldade: "Média", uso: "Peças flexíveis" },
  "PLA-CF": { temp: "200–230°C", resistencia: "Alta", flex: "Baixa", dificuldade: "Média", uso: "Peças rígidas leves" },
  "PETG-CF":{ temp: "230–260°C", resistencia: "Alta", flex: "Baixa", dificuldade: "Média", uso: "Peças estruturais" },
  PA:       { temp: "240–280°C", resistencia: "Muito alta", flex: "Média", dificuldade: "Alta", uso: "Engrenagens, mecânica" },
  "PA-CF":  { temp: "260–300°C", resistencia: "Muito alta", flex: "Baixa", dificuldade: "Alta", uso: "Alta performance" },
  PC:       { temp: "260–310°C", resistencia: "Muito alta", flex: "Média", dificuldade: "Alta", uso: "Peças de engenharia" },
  "RESIN-STD":  { temp: "N/A", resistencia: "Média", flex: "Baixa", dificuldade: "Média", uso: "Modelos visuais" },
  "RESIN-ABS":  { temp: "N/A", resistencia: "Alta", flex: "Baixa", dificuldade: "Média", uso: "Protótipos funcionais" },
  "RESIN-8K":   { temp: "N/A", resistencia: "Média", flex: "Baixa", dificuldade: "Média", uso: "Detalhe fino" },
  "RESIN-FLEX": { temp: "N/A", resistencia: "Média", flex: "Alta", dificuldade: "Média", uso: "Peças elásticas" },
  "RESIN-TOUGH":{ temp: "N/A", resistencia: "Alta", flex: "Média", dificuldade: "Média", uso: "Impacto moderado" },
  "RESIN-CAST": { temp: "N/A", resistencia: "Baixa", flex: "Baixa", dificuldade: "Alta", uso: "Fundição" }
};

function getMaterialOptionsFromSelect() {
  const sel = document.getElementById("materialType");
  if (!sel) return Object.keys(window.MATERIAL_SPECS);

  const values = [...sel.options]
    .map(o => o.value)
    .filter(v => v && v !== "OTHER");

  const unique = [...new Set(values)];
  return unique.length ? unique : Object.keys(window.MATERIAL_SPECS);
}

window.openComparator = function () {
  const modal = document.getElementById("comparator-modal");
  const content = document.getElementById("comparator-content");
  if (!modal || !content) return;

  const mats = getMaterialOptionsFromSelect();
  const opts = mats.map(m => `<option value="${m}">${m}</option>`).join("");

  content.innerHTML = `
    <div style="display:grid;gap:12px;">
      <div style="display:grid;grid-template-columns:1fr 1fr auto;gap:10px;">
        <select id="cmp-a" class="input">${opts}</select>
        <select id="cmp-b" class="input">${opts}</select>
        <button class="btn-small" onclick="window.runMaterialComparison()">Comparar</button>
      </div>
      <div id="cmp-result" style="overflow:auto;"></div>
    </div>
  `;

  // Seleção inicial diferente
  const a = document.getElementById("cmp-a");
  const b = document.getElementById("cmp-b");
  if (a && b && mats.length > 1) b.selectedIndex = 1;

  modal.classList.remove("hidden");
  window.runMaterialComparison();
};

window.runMaterialComparison = function () {
  const aVal = document.getElementById("cmp-a")?.value;
  const bVal = document.getElementById("cmp-b")?.value;
  const out = document.getElementById("cmp-result");
  if (!aVal || !bVal || !out) return;

  const a = window.MATERIAL_SPECS[aVal] || {};
  const b = window.MATERIAL_SPECS[bVal] || {};

  out.innerHTML = `
    <table style="width:100%;border-collapse:collapse;font-size:.92rem;">
      <thead>
        <tr>
          <th style="text-align:left;padding:8px;border-bottom:1px solid #334155;">Critério</th>
          <th style="text-align:left;padding:8px;border-bottom:1px solid #334155;">${aVal}</th>
          <th style="text-align:left;padding:8px;border-bottom:1px solid #334155;">${bVal}</th>
        </tr>
      </thead>
      <tbody>
        <tr><td style="padding:8px;">Temperatura</td><td style="padding:8px;">${a.temp || "—"}</td><td style="padding:8px;">${b.temp || "—"}</td></tr>
        <tr><td style="padding:8px;">Resistência</td><td style="padding:8px;">${a.resistencia || "—"}</td><td style="padding:8px;">${b.resistencia || "—"}</td></tr>
        <tr><td style="padding:8px;">Flexibilidade</td><td style="padding:8px;">${a.flex || "—"}</td><td style="padding:8px;">${b.flex || "—"}</td></tr>
        <tr><td style="padding:8px;">Dificuldade</td><td style="padding:8px;">${a.dificuldade || "—"}</td><td style="padding:8px;">${b.dificuldade || "—"}</td></tr>
        <tr><td style="padding:8px;">Uso recomendado</td><td style="padding:8px;">${a.uso || "—"}</td><td style="padding:8px;">${b.uso || "—"}</td></tr>
      </tbody>
    </table>
  `;
};

window.closeComparator = function () {
  const modal = document.getElementById("comparator-modal");
  if (modal) modal.classList.add("hidden");
};

// Fechar clicando fora
document.addEventListener("click", (e) => {
  const overlay = document.getElementById("comparator-modal");
  if (overlay && e.target === overlay) window.closeComparator();
});

// Fechar com ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") window.closeComparator();
});
});
// ═══════════════════════════════════════════════════════
// DARK MODE
// ═══════════════════════════════════════════════════════

const THEME_KEY = '3dpricer_theme';

window.toggleTheme = function() {
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
};

window.applyStoredTheme = function() {
  const saved = localStorage.getItem(THEME_KEY);
  const icon  = document.getElementById('theme-icon');
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    if (icon) icon.className = 'fas fa-sun';
  }
};

// ═══════════════════════════════════════════════════════
// RESET
// ═══════════════════════════════════════════════════════

window.resetForm = function() {
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

  window._lastResult  = null;
  window._lastSimData = null;

  window.setDefaults();
  window.scrollTo({ top:0, behavior:'smooth' });
  window.showToast('Formulário limpo! 🗑️', 'fa-arrow-rotate-left');
};

// ═══════════════════════════════════════════════════════
// VALORES PADRÃO
// ═══════════════════════════════════════════════════════

window.setDefaults = function() {
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
    laborHours:      0.5,
    laborCost:       30,
  };

  Object.entries(defaults).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el && !el.value) el.value = val;
  });
};

// ═══════════════════════════════════════════════════════
// ONBOARDING
// ═══════════════════════════════════════════════════════

const ONBOARDING_KEY   = '3dpricer_onboarded';
const ONBOARDING_STEPS = [
  { emoji:'👋', title:'Bem-vindo ao 3D Pricer Pro!',
    desc:'O app mais completo para precificação de impressão 3D. Vamos fazer um tour rápido!' },
  { emoji:'🖨️', title:'Configure sua Impressora',
    desc:'Informe o custo, consumo em Watts e vida útil. O app calcula a depreciação automaticamente.' },
  { emoji:'🧵', title:'Escolha o Material',
    desc:'Selecione o tipo de material e o app já sugere o preço médio do carretel.' },
  { emoji:'💰', title:'Defina sua Margem',
    desc:'Configure impostos, taxas e margem. O sistema calcula preço mínimo, sugerido e premium.' },
  { emoji:'📊', title:'Dashboard & Simulador',
    desc:'Use o Dashboard para acompanhar seu negócio e o Simulador para projetar lucro mensal!' },
];

let onboardingStep = 0;

window.showOnboarding = function() {
  if (localStorage.getItem(ONBOARDING_KEY)) return;
  onboardingStep = 0;
  window.renderOnboardingStep();
};

window.renderOnboardingStep = function() {
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
        ${ONBOARDING_STEPS.map((_,i) =>
          `<div class="onboarding-dot ${i===onboardingStep?'active':''}"></div>`
        ).join('')}
      </div>
      <div class="onboarding-actions">
        <button class="onboarding-skip" onclick="window.skipOnboarding()">Pular</button>
        <button class="onboarding-next" onclick="window.nextOnboardingStep()">
          ${isLast ? '<i class="fas fa-rocket"></i> Começar!' : 'Próximo <i class="fas fa-arrow-right"></i>'}
        </button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
};

window.nextOnboardingStep = function() {
  onboardingStep++;
  if (onboardingStep >= ONBOARDING_STEPS.length) window.skipOnboarding();
  else window.renderOnboardingStep();
};

window.skipOnboarding = function() {
  document.querySelector('.onboarding-overlay')?.remove();
  localStorage.setItem(ONBOARDING_KEY, '1');
  window.showToast('Pronto! Vamos precificar! 🚀', 'fa-rocket');
};

// ═══════════════════════════════════════════════════════
// PWA
// ═══════════════════════════════════════════════════════

let deferredPrompt = null;

window.installPWA = function() {
  if (!deferredPrompt) {
    window.showToast('Use o menu do navegador para instalar!', 'fa-circle-info');
    return;
  }
  document.getElementById('pwa-banner')?.classList.add('hidden');
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(choice => {
    if (choice.outcome === 'accepted')
      window.showToast('Instalando o app... 🚀', 'fa-rocket');
    deferredPrompt = null;
  });
};

window.closePWABanner = function() {
  document.getElementById('pwa-banner')?.classList.add('hidden');
  localStorage.setItem('pwa-banner-closed', '1');
};

// ═══════════════════════════════════════════════════════
// INICIALIZAÇÃO
// ═══════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // Força modal fechado ao iniciar
  const modal = document.getElementById('comparator-modal');
  if (modal) modal.classList.add('hidden');

  // Garante conteúdo mínimo (evita modal vazio)
  const content = document.getElementById('comparator-content');
  if (content && !content.innerHTML.trim()) {
    content.innerHTML = '<p style="color:#94a3b8;padding:12px;">Selecione materiais para comparar.</p>';
  }
});
document.addEventListener('DOMContentLoaded', () => {
  window.applyStoredTheme();
  window.setDefaults();
  window.initTabs();
  window.initProductFilters();
  window.initSimulator?.();

  setTimeout(() => {
    const count = window.loadQuotes?.()
      .filter(q => q.status === 'pending').length || 0;
    window.updateClientsBadge?.(count);
  }, 500);

  window.renderHistory?.();
  window.renderQualityTips?.();
  window.renderProducts?.('all');

  document.getElementById('comparator-modal')
    ?.addEventListener('click', e => {
      if (e.target.id === 'comparator-modal') window.closeComparator();
    });

  document.querySelectorAll('input, select').forEach(el =>
    el.addEventListener('input', window.updateProgress)
  );

  setTimeout(window.showOnboarding, 800);

  console.log('%c3D Pricer Pro v2.0 ✅',
    'color:#f07b30;font-weight:bold;font-size:16px');

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/3d-pricer-pro/service-worker.js')
        .then(reg => console.log('[PWA] SW registrado:', reg.scope))
        .catch(err => console.warn('[PWA] Erro no SW:', err));
    });
  }

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    if (localStorage.getItem('pwa-banner-closed') !== '1') {
      document.getElementById('pwa-banner')?.classList.remove('hidden');
    }
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    document.getElementById('pwa-banner')?.classList.add('hidden');
    window.showToast('App instalado com sucesso! 🎉', 'fa-mobile-screen');
  });
});
