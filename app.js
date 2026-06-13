'use strict';

// ═══════════════════════════════════════════════════════
// ESTADO GLOBAL
// ═══════════════════════════════════════════════════════

const State = {
  consumables: [],
  finishings:  [],
};

// Variável global para armazenar o último resultado da precificação
window._lastResult = null;
// Variável global para armazenar os últimos dados do simulador
window._lastSimData = null;

// ═══════════════════════════════════════════════════════
// UTILITÁRIOS GLOBAIS
// ═══════════════════════════════════════════════════════

window.getVal = function(id) {
  const v = parseFloat(document.getElementById(id)?.value);
  return isNaN(v) ? 0 : v;
};

window.getStr = function(id) {
  return document.getElementById(id)?.value?.trim() || '';
};

window.setResult = function(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = window.formatBRL(value); // Usando formatBRL global
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

// Função de formatação de BRL (assumindo que está em outro script ou será adicionada)
// Se não estiver em outro lugar, adicione-a aqui:
window.formatBRL = function(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
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
        c.classList.toggle('active',  isTarget);
      });

      // Funções de renderização das abas
      switch (target) {
        case 'dashboard': window.renderDashboard();      break;
        case 'clients':   window.renderClients();        break;
        case 'catalog':
          window.renderCatalog();
          setTimeout(window.initCatalogCalc, 150); // Assumindo initCatalogCalc existe
          break;
        case 'tools':
          window.initTools(); // Assumindo initTools existe
          window.renderPendingAlerts(); // Assumindo renderPendingAlerts existe
          window.renderMonthlyReportPreview(); // Assumindo renderMonthlyReportPreview existe
          break;
        case 'history':   window.renderHistory();        break;
        case 'products':  window.renderProducts('all');  break;
        case 'tips':      window.renderQualityTips();    break;
        case 'simulator': window.runSimulator();         break; // Adicionado para iniciar o simulador ao abrir a aba
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
    el.querySelector('span').innerHTML = done
      ? '<i class="fas fa-check"></i>'
      : step;
  });
};

// ═══════════════════════════════════════════════════════
// CONSUMÍVEIS DINÂMICOS
// ═══════════════════════════════════════════════════════

window.addConsumable = function() {
  const id   = window.uid();
  State.consumables.push({ id, name:'', cost:0, lifeHours:0 });

  const list = document.getElementById('consumables-list');
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
  list?.appendChild(row);
};

window.updateConsumable = function(id, field, value) {
  const item = State.consumables.find(c => c.id === id);
  if (item) item[field] = field === 'name' ? value : parseFloat(value) || 0;
  window.updateProgress(); // Atualiza o progresso ao mudar consumíveis
};

window.removeConsumable = function(id) {
  State.consumables = State.consumables.filter(c => c.id !== id);
  document.getElementById(`crow-${id}`)?.remove();
  window.updateProgress(); // Atualiza o progresso ao remover consumíveis
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
  list?.appendChild(row);
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
    if (valEl) valEl.textContent = `${window.formatBRL(cost)} para ${hours}h de impressão`;
    box?.classList.remove('hidden');
  } else {
    box?.classList.add('hidden');
  }
};

// ═══════════════════════════════════════════════════════
// MUDANÇA DE MATERIAL
// ═══════════════════════════════════════════════════════

// Assumindo que MATERIAL_INFO está definido em outro script (ex: suggestions.js)
const MATERIAL_INFO = {
  "PLA": { "desc": "Filamento versátil e fácil de usar, ideal para iniciantes.", "tempNozzle": "190-220°C", "tempBed": "50-60°C", "avgPrice": 120, "alternatives": ["PETG"] },
  "PETG": { "desc": "Mais resistente e flexível que o PLA, boa adesão de camada.", "tempNozzle": "220-250°C", "tempBed": "70-80°C", "avgPrice": 150, "alternatives": ["ABS", "ASA"] },
  "ABS": { "desc": "Alta resistência e durabilidade, mas requer mesa aquecida e ambiente controlado.", "tempNozzle": "230-260°C", "tempBed": "90-110°C", "avgPrice": 140, "alternatives": ["ASA"] },
  "ASA": { "desc": "Similar ao ABS, mas com maior resistência UV e menos warping.", "tempNozzle": "240-260°C", "tempBed": "90-110°C", "avgPrice": 180, "alternatives": ["PETG"] },
  "TPU": { "desc": "Filamento flexível e resistente a impactos, ideal para peças funcionais.", "tempNozzle": "210-230°C", "tempBed": "30-50°C", "avgPrice": 160, "alternatives": [] },
  "PLA-CF": { "desc": "PLA com fibra de carbono, mais rígido e com acabamento fosco.", "tempNozzle": "200-230°C", "tempBed": "50-60°C", "avgPrice": 250, "alternatives": [] },
  "PETG-CF": { "desc": "PETG com fibra de carbono, alta resistência e leveza.", "tempNozzle": "230-260°C", "tempBed": "70-80°C", "avgPrice": 280, "alternatives": [] },
  "PA": { "desc": "Nylon, alta resistência mecânica e química, mas absorve umidade.", "tempNozzle": "240-270°C", "tempBed": "80-100°C", "avgPrice": 300, "alternatives": ["PA-CF"] },
  "PA-CF": { "desc": "Nylon com fibra de carbono, extremamente forte e rígido.", "tempNozzle": "250-280°C", "tempBed": "80-100°C", "avgPrice": 400, "alternatives": [] },
  "PC": { "desc": "Policarbonato, alta resistência ao calor e impacto, difícil de imprimir.", "tempNozzle": "260-300°C", "tempBed": "100-120°C", "avgPrice": 350, "alternatives": [] },
  "PVA": { "desc": "Material de suporte solúvel em água, ideal para geometrias complexas.", "tempNozzle": "190-220°C", "tempBed": "50-60°C", "avgPrice": 200, "alternatives": [] },
  "RESIN-STD": { "desc": "Resina padrão, boa para detalhes e protótipos.", "tempNozzle": "N/A", "tempBed": "N/A", "avgPrice": 100, "alternatives": ["RESIN-ABS"] },
  "RESIN-ABS": { "desc": "Resina ABS-Like, mais resistente e menos quebradiça que a padrão.", "tempNozzle": "N/A", "tempBed": "N/A", "avgPrice": 130, "alternatives": ["RESIN-8K"] },
  "RESIN-8K": { "desc": "Resina de alta resolução, para impressoras 8K e detalhes finos.", "tempNozzle": "N/A", "tempBed": "N/A", "avgPrice": 150, "alternatives": [] },
  "RESIN-ENG": { "desc": "Resina de engenharia, para aplicações funcionais e maior durabilidade.", "tempNozzle": "N/A", "tempBed": "N/A", "avgPrice": 200, "alternatives": [] },
  "RESIN-CAST": { "desc": "Resina para fundição, queima sem deixar resíduos.", "tempNozzle": "N/A", "tempBed": "N/A", "avgPrice": 250, "alternatives": [] },
  "OUTRO": { "desc": "Material personalizado. Preencha os detalhes manualmente.", "tempNozzle": "N/A", "tempBed": "N/A", "avgPrice": 0, "alternatives": [] }
};


window.onMaterialChange = function() {
  const type    = window.getStr('materialType');
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
  window.updateProgress(); // Atualiza o progresso ao mudar material
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
    window.showToast(`Consumo padrão ${type}: ${defaults[type]}W sugerido`, 'fa-bolt');
  }
  window.updateProgress(); // Atualiza o progresso ao mudar tipo de impressora
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

  const printerName        = window.getStr('printerName');
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

  const marginStrategy = window.getStr('marginStrategy');
  const profitMargin   = window.getVal('profitMargin');
  const taxRate        = window.getVal('taxRate');
  const platformFee    = window.getVal('platformFee');
  const packagingCost  = window.getVal('packagingCost');
  const otherCosts     = window.getVal('otherCosts');
  const maxDiscount    = window.getVal('maxDiscount');
  const quantity       = Math.max(1, window.getVal('quantity'));

  // ── Custos ──
  const materialCostPerGram = spoolCost / spoolWeight;
  const materialCost        = materialCostPerGram * partWeight;
  const supportCost         = materialCostPerGram * supportWeight;
  const finishingCost       = window.calcFinishingCost();
  const energyCost          = (printerWatts / 1000) * printHours * energyRate;
  const depreciationCost    = (printerCostRaw / printerLifespan) * printHours;
  const maintenanceCost     = (maintenanceCostRaw / monthlyHours) * printHours;
  const spaceCost           = (spaceCostMonthly / monthlyHours) * printHours;
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

  window.renderResult(window._lastResult); // Assumindo renderResult existe
  window.renderChart(window._lastResult); // Assumindo renderChart existe
  window.updateProgress();
  window.renderDynamicTips(window.generateDynamicTips(window._lastResult)); // Assumindo generateDynamicTips existe
  window.renderPlatformComparatorInResult(window._lastResult); // Assumindo renderPlatformComparatorInResult existe

  const resultEl = document.getElementById('result');
  resultEl?.classList.remove('hidden');
  setTimeout(() => resultEl?.scrollIntoView({ behavior:'smooth', block:'start' }), 100);

  window.showToast('Precificação concluída! 🎉', 'fa-circle-check');
};

// ═══════════════════════════════════════════════════════
// RENDERIZAÇÃO DO RESULTADO
// ═══════════════════════════════════════════════════════

window.renderResult = function(r) {
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

  Object.entries(fields).forEach(([id, val]) => window.setResult(id, val));

  const qLabel = document.getElementById('r-qty-label');
  if (qLabel) qLabel.textContent = r.quantity;
};

// ═══════════════════════════════════════════════════════
// GRÁFICO DE PIZZA
// ═══════════════════════════════════════════════════════

window.renderChart = function(r) {
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
  ctx.fillText(window.formatBRL(total), cx, cy + 8);

  // Legenda
  const legend = document.getElementById('chart-legend');
  if (legend) {
    legend.innerHTML = slices.map(d => `
      <div class="legend-item">
        <span class="legend-dot" style="background:${d.color}"></span>
        ${d.label} (${((d.value/total)*100).toFixed(1)}%)
      </div>`).join('');
  }
};

// ═══════════════════════════════════════════════════════
// ADICIONAR AO CATÁLOGO DO RESULTADO
// ═══════════════════════════════════════════════════════

window.addToCatalogFromResult = function() {
  if (!window._lastResult) {
    window.showToast('Calcule uma precificação primeiro!', 'fa-triangle-exclamation');
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

  window.renderCatalog(); // Assumindo renderCatalog existe

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

    window.calcCatalogMargin(); // Assumindo calcCatalogMargin existe

    const body = document.getElementById('catalog-form-body');
    if (body) body.style.display = '';
    document.getElementById('catalog-form-card')
      ?.scrollIntoView({ behavior:'smooth', block:'start' });

    window.showToast('Dados importados para o catálogo! 🎯', 'fa-cubes');
  }, 200);
};

// ═══════════════════════════════════════════════════════
// DICAS DINÂMICAS
// ═══════════════════════════════════════════════════════

// Assumindo QUALITY_TIPS e generateDynamicTips estão em suggestions.js
const QUALITY_TIPS = [
  { icon: '⚙️', title: 'Altura da Camada', value: '0.2mm', desc: 'Equilíbrio entre velocidade e detalhe.' },
  { icon: '💨', title: 'Velocidade de Impressão', value: '50-80mm/s', desc: 'Evita falhas e mantém qualidade.' },
  { icon: '🌡️', title: 'Temperatura do Bico', value: '200-220°C', desc: 'Ideal para PLA, boa fusão.' },
  { icon: '🛏️', title: 'Temperatura da Mesa', value: '50-60°C', desc: 'Melhora adesão da primeira camada.' },
  { icon: '🌬️', title: 'Ventilação da Peça', value: '100%', desc: 'Resfriamento rápido para detalhes finos.' },
  { icon: '📏', title: 'Retração', value: '1-5mm', desc: 'Evita stringing e blobs.' },
  { icon: '💧', title: 'Umidade do Filamento', value: '<20%', desc: 'Filamento seco evita bolhas e falhas.' },
  { icon: '🛠️', title: 'Manutenção Preventiva', value: 'Regular', desc: 'Limpeza e lubrificação prolongam a vida útil.' }
];

window.renderDynamicTips = function(tips) {
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
};

window.renderQualityTips = function() {
  const container = document.getElementById('quality-tips');
  if (!container || container.children.length > 0) return;

  container.innerHTML = QUALITY_TIPS.map(q => `
    <div class="quality-card">
      <div class="q-icon">${q.icon}</div>
      <div class="q-title">${q.title}</div>
      <div class="q-value">${q.value}</div>
      <div class="q-desc">${q.desc}</div>
    </div>`).join('');
};

// Assumindo que generateDynamicTips está em suggestions.js
window.generateDynamicTips = function(result) {
  const tips = [];

  if (result.profitMargin < 20) {
    tips.push({
      type: 'warning', icon: '⚠️', title: 'Margem de Lucro Baixa',
      desc: `Sua margem de ${result.profitMargin}% é muito baixa. Considere aumentar para garantir a sustentabilidade do negócio.`,
      badge: 'Negócio'
    });
  }

  if (result.failureRate > 10) {
    tips.push({
      type: 'danger', icon: '❌', title: 'Alta Taxa de Falha',
      desc: `Sua taxa de falha de ${result.failureRate}% impacta muito o custo. Revise configurações ou manutenção.`,
      badge: 'Produção'
    });
  }

  if (result.materialCostPerGram > 0.15 && result.materialType === 'PLA') {
    tips.push({
      type: 'economy', icon: '💰', title: 'PLA Caro',
      desc: `O custo do seu PLA (${window.formatBRL(result.materialCostPerGram)}/g) está acima da média. Pesquise fornecedores ou outras marcas.`,
      badge: 'Economia'
    });
  }

  if (result.printHours > 10 && result.energyCost > 5) {
    tips.push({
      type: 'warning', icon: '⚡', title: 'Alto Custo de Energia',
      desc: `Impressões longas (${result.printHours}h) com alto consumo de energia (${window.formatBRL(result.energyCost)}) podem ser otimizadas.`,
      badge: 'Energia'
    });
  }

  if (result.platformFee > 15) {
    tips.push({
      type: 'info', icon: '🛍️', title: 'Taxa de Plataforma Alta',
      desc: `A taxa de ${result.platformFee}% da plataforma reduz seu lucro. Explore vendas diretas ou outras plataformas.`,
      badge: 'Vendas'
    });
  }

  return tips;
};


// ═══════════════════════════════════════════════════════
// PRODUTOS
// ═══════════════════════════════════════════════════════

// Assumindo PRODUCTS está em suggestions.js
const PRODUCTS = [
  { id: 'p1', emoji: '🌱', name: 'Filamento PLA Premium', brand: 'Creality', price: 'R$ 119,90', specs: ['1kg', '1.75mm'], desc: 'Alta qualidade, cores vibrantes.', rating: 4.8, category: 'filament', tag: 'best' },
  { id: 'p2', emoji: '💪', name: 'Filamento PETG Resistente', brand: 'Esun', price: 'R$ 149,90', specs: ['1kg', '1.75mm'], desc: 'Ideal para peças funcionais.', rating: 4.5, category: 'filament', tag: 'hot' },
  { id: 'p3', emoji: '💎', name: 'Resina 8K de Alta Detalhe', brand: 'Anycubic', price: 'R$ 199,90', specs: ['1L', '405nm'], desc: 'Para impressões ultra-detalhadas.', rating: 4.9, category: 'resin', tag: 'premium' },
  { id: 'p4', emoji: '🚀', name: 'Impressora 3D Bambu Lab P1S', brand: 'Bambu Lab', price: 'R$ 5.999,00', specs: ['CoreXY', 'AMS'], desc: 'Velocidade e precisão incríveis.', rating: 5.0, category: 'printer', tag: 'best', highlight: true },
  { id: 'p5', emoji: '🛠️', name: 'Kit de Ferramentas Essencial', brand: 'Generic', price: 'R$ 79,90', specs: ['12 peças', 'Pós-processamento'], desc: 'Tudo que você precisa para acabamento.', rating: 4.2, category: 'tool', tag: 'new' },
  { id: 'p6', emoji: '🌈', name: 'Filamento PLA Multicolor', brand: '3D Fila', price: 'R$ 139,90', specs: ['1kg', '1.75mm'], desc: 'Cores gradientes para projetos criativos.', rating: 4.7, category: 'filament', tag: 'new' },
  { id: 'p7', emoji: '🧪', name: 'Resina Standard Rápida', brand: 'Elegoo', price: 'R$ 99,90', specs: ['1L', '405nm'], desc: 'Cura rápida, baixo odor.', rating: 4.3, category: 'resin', tag: 'hot' },
  { id: 'p8', emoji: '🧽', name: 'Estação de Lavagem e Cura', brand: 'Creality', price: 'R$ 899,00', specs: ['UV', 'Rotação'], desc: 'Otimiza o pós-processamento de resina.', rating: 4.6, category: 'tool', tag: 'best' },
  { id: 'p9', emoji: '🤖', name: 'Impressora 3D Ender 3 V3 SE', brand: 'Creality', price: 'R$ 1.799,00', specs: ['FDM', 'Auto-level'], desc: 'Excelente custo-benefício para iniciantes.', rating: 4.4, category: 'printer', tag: 'hot' },
  { id: 'p10', emoji: '🔥', name: 'Filamento ABS de Alta Temperatura', brand: 'Polimaker', price: 'R$ 159,90', specs: ['1kg', '1.75mm'], desc: 'Para peças que exigem resistência ao calor.', rating: 4.1, category: 'filament', tag: 'hot' }
];


window.renderProducts = function(filter = 'all') {
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
      <span class="product-badge-tag tag-${p.tag}">${window.tagLabel(p.tag)}</span>
      <div class="product-emoji">${p.emoji}</div>
      <div class="product-name">${p.name}</div>
      <div class="product-brand">${p.brand}</div>
      <div class="product-price">${p.price}</div>
      <div class="product-specs">
        ${p.specs.map(s => `<span class="spec-tag">${s}</span>`).join('')}
      </div>
      <div class="product-desc">${p.desc}</div>
      <div class="product-rating">
        ${window.renderStars(p.rating)}
        <small>${p.rating}</small>
      </div>
    </div>`).join('');
};

window.tagLabel = function(tag) {
  return { hot:'🔥 Popular', new:'✨ Novo', best:'⭐ Melhor', premium:'💎 Premium' }[tag] || tag;
};

window.renderStars = function(rating) {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return [
    ...Array(full).fill('<i class="fas fa-star"></i>'),
    ...Array(half).fill('<i class="fas fa-star-half-stroke"></i>'),
    ...Array(empty).fill('<i class="far fa-star"></i>'),
  ].join('');
};

window.initProductFilters = function() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      window.renderProducts(btn.dataset.filter);
    });
  });
};

// ═══════════════════════════════════════════════════════
// COMPARADOR DE MATERIAIS (MODAL)
// ═══════════════════════════════════════════════════════

window.openComparator = function() {
  const modal = document.getElementById('comparator-modal');
  if (modal) {
    modal.classList.add('show');
    // Adiciona um listener para fechar o modal ao clicar fora dele
    modal.addEventListener('click', function handler(event) {
      if (event.target === modal) { // Verifica se o clique foi no overlay, não no modal em si
        window.closeComparator();
        modal.removeEventListener('click', handler); // Remove o listener para evitar múltiplos
      }
    });
  }
};

window.closeComparator = function() {
  const modal = document.getElementById('comparator-modal');
  if (modal) {
    modal.classList.remove('show');
  }
};

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

  if (window._lastResult)  window.renderChart(window._lastResult);
  if (window._lastSimData) window.renderMonthlyChart(window._lastSimData); // Assumindo renderMonthlyChart existe
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
// RESET DO FORMULÁRIO
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
        ${ONBOARDING_STEPS.map((_, i) =>
          `<div class="onboarding-dot ${i === onboardingStep ? 'active' : ''}"></div>`
        ).join('')}
      </div>
      <div class="onboarding-actions">
        <button class="onboarding-skip" onclick="window.skipOnboarding()">Pular tour</button>
        <button class="onboarding-next" onclick="window.nextOnboardingStep()">
          ${isLast
            ? '<i class="fas fa-rocket"></i> Começar!'
            : 'Próximo <i class="fas fa-arrow-right"></i>'}
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

let deferredPrompt = null; // Única declaração de deferredPrompt

window.installPWA = function() {
  if (!deferredPrompt) {
    window.showToast('Use o menu do navegador para instalar!', 'fa-circle-info');
    return;
  }
  // Esconde o banner de instalação
  const pwaBanner = document.getElementById('pwa-banner');
  if (pwaBanner) {
    pwaBanner.classList.add('hidden');
  }
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(choice => {
    if (choice.outcome === 'accepted') window.showToast('Instalando o app... 🚀', 'fa-rocket');
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
  window.applyStoredTheme();
  window.setDefaults();
  window.initTabs();
  window.initProductFilters(); // Assumindo initProductFilters existe
  window.initSimulator(); // Assumindo initSimulator existe

  // Badge de orçamentos pendentes
  setTimeout(() => window.updateClientsBadge( // Assumindo updateClientsBadge e loadQuotes existem
    window.loadQuotes().filter(q => q.status === 'pending').length
  ), 500);

  window.renderHistory(); // Assumindo renderHistory existe
  window.renderQualityTips();
  window.renderProducts('all');

  // Listener para fechar o modal do comparador ao clicar no overlay
  document.getElementById('comparator-modal')
    ?.addEventListener('click', e => {
      if (e.target.id === 'comparator-modal') window.closeComparator();
    });

  // Adiciona listeners para atualizar o progresso em todos os inputs/selects
  document.querySelectorAll('input, select').forEach(el =>
    el.addEventListener('input', window.updateProgress)
  );

  setTimeout(window.showOnboarding, 800);

  console.log(
    '%c3D Pricer Pro v2.0 ✅',
    'color:#f07b30;font-weight:bold;font-size:16px'
  );

  // Registro do Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // Ajuste o caminho para o seu service-worker.js
      // Se estiver na raiz do projeto, use '/service-worker.js'
      // Se estiver em uma subpasta '3d-pricer-pro', use '/3d-pricer-pro/service-worker.js'
      navigator.serviceWorker.register('/3d-pricer-pro/service-worker.js')
        .then(reg => console.log('[PWA] SW registrado:', reg.scope))
        .catch(err => console.warn('[PWA] Erro no SW:', err));
    });
  }

  // Listener para o evento beforeinstallprompt (PWA)
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    // Mostra o banner PWA apenas se o usuário não o fechou antes
    if (localStorage.getItem('pwa-banner-closed') !== '1') {
      document.getElementById('pwa-banner')?.classList.remove('hidden');
    }
  });

  // Listener para quando o app é instalado (PWA)
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    document.getElementById('pwa-banner')?.classList.add('hidden');
    window.showToast('App instalado com sucesso! 🎉', 'fa-mobile-screen');
  });

  // Verifica se o banner PWA deve ser mostrado ao carregar a página (se não foi fechado antes)
  if (localStorage.getItem('pwa-banner-closed') === '1') {
    document.getElementById('pwa-banner')?.classList.add('hidden');
  }
});
