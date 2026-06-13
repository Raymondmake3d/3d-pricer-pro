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
        case 'calc':
          // Não faz nada, a aba de cálculo é a padrão e não precisa de renderização inicial complexa
          break;
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
        case 'tips':
          window.renderQualityTips(); // Assumindo renderQualityTips existe
          break;
        case 'products':
          window.renderProducts('all'); // Assumindo renderProducts existe
          window.initProductFilters(); // Inicializa os filtros de produtos
          break;
        case 'simulator':
          window.runSimulator(); // Inicia o simulador ao abrir a aba
          break;
        case 'history':   window.renderHistory();        break;
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
    <button class="btn-remove" onclick="window.removeConsumable('${id}')">
      <i class="fas fa-trash"></i>
    </button>
  `;
  list.appendChild(row);
  window.calculate();
};

window.updateConsumable = function(id, field, value) {
  const consumable = State.consumables.find(c => c.id === id);
  if (consumable) {
    consumable[field] = field === 'name' ? value : parseFloat(value) || 0;
    window.calculate();
  }
};

window.removeConsumable = function(id) {
  State.consumables = State.consumables.filter(c => c.id !== id);
  document.getElementById(`crow-${id}`)?.remove();
  window.calculate();
};

// ═══════════════════════════════════════════════════════
// PÓS-PROCESSAMENTO DINÂMICO
// ═══════════════════════════════════════════════════════

window.addFinishing = function() {
  const id   = window.uid();
  State.finishings.push({ id, name:'', cost:0, time:0 });

  const list = document.getElementById('finishing-list');
  const row  = document.createElement('div');
  row.className = 'dynamic-row';
  row.id        = `frow-${id}`;
  row.innerHTML = `
    <input type="text"   placeholder="Ex: Lixar e Pintar"
           oninput="window.updateFinishing('${id}','name',this.value)"/>
    <input type="number" placeholder="Custo R$" min="0"
           oninput="window.updateFinishing('${id}','cost',this.value)"/>
    <input type="number" placeholder="Tempo (min)" min="0"
           oninput="window.updateFinishing('${id}','time',this.value)"/>
    <button class="btn-remove" onclick="window.removeFinishing('${id}')">
      <i class="fas fa-trash"></i>
    </button>
  `;
  list.appendChild(row);
  window.calculate();
};

window.updateFinishing = function(id, field, value) {
  const finishing = State.finishings.find(f => f.id === id);
  if (finishing) {
    finishing[field] = field === 'name' ? value : parseFloat(value) || 0;
    window.calculate();
  }
};

window.removeFinishing = function(id) {
  State.finishings = State.finishings.filter(f => f.id !== id);
  document.getElementById(`frow-${id}`)?.remove();
  window.calculate();
};

// ═══════════════════════════════════════════════════════
// CÁLCULO PRINCIPAL
// ═══════════════════════════════════════════════════════

window.calculate = function() {
  // 1. Dados da Impressora
  const printerCost       = window.getVal('printerCost');
  const printerLifespan   = window.getVal('printerLifespan');
  const printerWatts      = window.getVal('printerWatts');
  const maintenanceCost   = window.getVal('maintenanceCost');
  const spaceCost         = window.getVal('spaceCost');
  const monthlyHours      = window.getVal('monthlyHours');
  const printerName       = window.getStr('printerName') || 'Impressora Padrão';
  const printerType       = window.getStr('printerType');

  // 2. Dados do Material
  const spoolCost         = window.getVal('spoolCost');
  const spoolWeight       = window.getVal('spoolWeight');
  const partWeight        = window.getVal('partWeight');
  const materialType      = window.getStr('materialType') || 'Filamento';
  const failureRate       = window.getVal('failureRate');

  // 3. Dados da Impressão
  const printHours        = window.getVal('printHours');
  const energyRate        = window.getVal('energyRate');
  const setupHours        = window.getVal('setupHours');

  // 4. Dados do Negócio
  const profitMargin      = window.getVal('profitMargin');
  const taxRate           = window.getVal('taxRate');
  const platformFee       = window.getVal('platformFee');
  const packagingCost     = window.getVal('packagingCost');
  const quantity          = window.getVal('quantity') || 1;

  // Validações básicas
  if (printerLifespan <= 0 || monthlyHours <= 0 || spoolWeight <= 0 || energyRate <= 0) {
    document.getElementById('result')?.classList.add('hidden');
    return;
  }

  // Custo de Depreciação da Impressora (por hora)
  const depreciationPerHour = printerCost / printerLifespan;

  // Custo Fixo Mensal (manutenção + espaço)
  const totalFixedMonthlyCost = maintenanceCost + spaceCost;
  // Custo Fixo por Hora de Impressão
  const fixedCostPerHour = totalFixedMonthlyCost / monthlyHours;

  // Custo de Consumíveis Periódicos (por hora)
  const consumablesPerHour = State.consumables.reduce((sum, c) => {
    return sum + (c.cost / (c.lifeHours || 1));
  }, 0);

  // Custo do Material (por grama)
  const materialCostPerGram = spoolCost / spoolWeight;
  // Custo do Material por Peça (com taxa de falha)
  const rawMaterialCost = partWeight * materialCostPerGram;
  const materialCost = rawMaterialCost * (1 + failureRate / 100);

  // Custo de Energia por Hora
  const energyCostPerHour = (printerWatts / 1000) * energyRate;
  // Custo de Energia por Peça
  const energyCost = energyCostPerHour * printHours;

  // Custo de Mão de Obra (por hora, considerando setup)
  const laborCostPerHour = window.getVal('laborCostPerHour'); // Assumindo que existe um input para isso
  const laborCost = laborCostPerHour * printHours;
  const setupCost = laborCostPerHour * setupHours;

  // Custo de Pós-processamento
  const postProcessCost = State.finishings.reduce((sum, f) => sum + f.cost, 0);
  const postProcessTime = State.finishings.reduce((sum, f) => sum + f.time, 0); // em minutos
  const postProcessLaborCost = (laborCostPerHour / 60) * postProcessTime; // Custo da mão de obra do pós-processamento

  // Custo Direto Total por Peça
  const directCost =
    materialCost +
    energyCost +
    (depreciationPerHour * printHours) +
    (fixedCostPerHour * printHours) +
    consumablesPerHour * printHours +
    laborCost +
    setupCost +
    postProcessCost +
    postProcessLaborCost;

  // Preço de Venda Base (antes de impostos/taxas)
  const basePrice = directCost / (1 - profitMargin / 100);

  // Impostos e Taxas
  const taxAmount = basePrice * (taxRate / 100);
  const platformFeeAmount = basePrice * (platformFee / 100);

  // Preço Final Unitário
  const finalPrice = basePrice + taxAmount + platformFeeAmount + packagingCost;

  // Preço para Lote
  const batchPrice = finalPrice * quantity;

  // Margem de Lucro Real (sobre o preço final)
  const profitAmount = finalPrice - directCost - taxAmount - platformFeeAmount - packagingCost;
  const realProfitMargin = (profitAmount / finalPrice) * 100;

  // Preços Sugeridos
  const minPrice = directCost * 1.1; // 10% acima do custo direto
  const premiumPrice = finalPrice * 1.2; // 20% acima do preço sugerido

  // Desconto Máximo
  const maxDiscount = ((finalPrice - directCost) / finalPrice) * 100;
  const discountedPrice = finalPrice - (finalPrice * (maxDiscount / 100));

  // Atualiza os resultados na UI
  window.setResult('result-material-cost', materialCost);
  window.setResult('result-energy-cost', energyCost);
  window.setResult('result-depreciation-cost', depreciationPerHour * printHours);
  window.setResult('result-fixed-cost', fixedCostPerHour * printHours);
  window.setResult('result-consumables-cost', consumablesPerHour * printHours);
  window.setResult('result-labor-cost', laborCost + setupCost + postProcessLaborCost);
  window.setResult('result-post-process-cost', postProcessCost + postProcessLaborCost);
  window.setResult('result-other-costs', packagingCost);

  window.setResult('result-direct-cost', directCost);
  window.setResult('result-tax-amount', taxAmount);
  window.setResult('result-platform-fee', platformFeeAmount);
  window.setResult('result-profit-amount', profitAmount);

  window.setResult('result-final-price', finalPrice);
  window.setResult('result-batch-price', batchPrice);
  window.setResult('result-profit-margin', realProfitMargin);

  window.setResult('result-min-price', minPrice);
  window.setResult('result-suggested-price', finalPrice);
  window.setResult('result-premium-price', premiumPrice);
  window.setResult('result-max-discount', maxDiscount);
  window.setResult('result-discounted-price', discountedPrice);

  document.getElementById('result')?.classList.remove('hidden');

  // Armazena o último resultado para uso em outras abas/funções
  window._lastResult = {
    printerName, printerType,
    materialType, partWeight, printHours,
    finalPrice, directCost, profitMargin: realProfitMargin,
    taxRate, platformFee, packagingCost, quantity,
    materialCost, energyCost, depreciationCost: depreciationPerHour * printHours,
    fixedCost: fixedCostPerHour * printHours, consumablesCost: consumablesPerHour * printHours,
    laborCost: laborCost, setupCost: setupCost, postProcessCost: postProcessCost + postProcessLaborCost,
    otherCosts: packagingCost,
    taxAmount, platformFeeAmount, profitAmount,
    minPrice, premiumPrice, maxDiscount, discountedPrice,
    batchPrice,
  };

  // Atualiza as sugestões
  window.generateDynamicTips(window._lastResult);
  window.updateProgress();
};

// ═══════════════════════════════════════════════════════
// FUNÇÕES ESPECÍFICAS DA ABA DE PRECIFICAÇÃO
// ═══════════════════════════════════════════════════════

window.onPrinterTypeChange = function() {
  const printerType = window.getStr('printerType');
  const materialTypeSelect = document.getElementById('materialType');

  // Limpa as opções existentes
  materialTypeSelect.innerHTML = '<option value="">Selecione...</option>';

  // Adiciona opções baseadas no tipo de impressora
  if (printerType === 'FDM') {
    materialTypeSelect.innerHTML += `
      <option value="PLA">PLA</option>
      <option value="PETG">PETG</option>
      <option value="ABS">ABS</option>
      <option value="ASA">ASA</option>
      <option value="TPU">TPU (Flexível)</option>
      <option value="Nylon">Nylon</option>
      <option value="PC">Policarbonato (PC)</option>
      <option value="HIPS">HIPS</option>
      <option value="Outro">Outro Filamento</option>
    `;
  } else if (printerType === 'MSLA') {
    materialTypeSelect.innerHTML += `
      <option value="Resina Padrão">Resina Padrão</option>
      <option value="Resina Lavável em Água">Resina Lavável em Água</option>
      <option value="Resina ABS-Like">Resina ABS-Like</option>
      <option value="Resina Flexível">Resina Flexível</option>
      <option value="Resina Transparente">Resina Transparente</option>
      <option value="Resina de Engenharia">Resina de Engenharia</option>
      <option value="Outra Resina">Outra Resina</option>
    `;
  } else if (printerType === 'SLS') {
    materialTypeSelect.innerHTML += `
      <option value="Nylon PA12">Nylon PA12</option>
      <option value="TPU SLS">TPU (SLS)</option>
      <option value="PP SLS">Polipropileno (SLS)</option>
      <option value="Outro Pó">Outro Pó</option>
    `;
  } else if (printerType === 'MJF') {
    materialTypeSelect.innerHTML += `
      <option value="Nylon PA12 MJF">Nylon PA12 (MJF)</option>
      <option value="Nylon PA11 MJF">Nylon PA11 (MJF)</option>
      <option value="TPU MJF">TPU (MJF)</option>
      <option value="Outro MJF">Outro (MJF)</option>
    `;
  }
  // Dispara a mudança no material para atualizar as informações
  window.onMaterialChange();
  window.calculate();
};

window.onMaterialChange = function() {
  const materialType = window.getStr('materialType');
  const materialInfoDiv = document.getElementById('material-info');
  const spoolCostInput = document.getElementById('spoolCost');
  const materialData = window.MATERIAL_INFO[materialType]; // Acessando MATERIAL_INFO globalmente

  if (materialData) {
    materialInfoDiv.innerHTML = `
      <p><strong>Preço médio do carretel:</strong> ${window.formatBRL(materialData.avgPrice)}</p>
      <p><strong>Temperatura de impressão:</strong> ${materialData.temp}</p>
      <p><strong>Características:</strong> ${materialData.characteristics}</p>
      ${materialData.alternatives ? `<p><strong>Alternativas:</strong> ${materialData.alternatives}</p>` : ''}
    `;
    materialInfoDiv.classList.remove('hidden');
    // Preenche o custo do carretel se estiver vazio
    if (spoolCostInput && !spoolCostInput.value) {
      spoolCostInput.value = materialData.avgPrice;
    }
  } else {
    materialInfoDiv.classList.add('hidden');
  }
  window.calculate();
};

window.updateEnergyPreview = function() {
  const printerWatts = window.getVal('printerWatts');
  const energyRate = window.getVal('energyRate');
  const energyPreviewDiv = document.getElementById('energy-preview');

  if (printerWatts > 0 && energyRate > 0) {
    const costPerHour = (printerWatts / 1000) * energyRate;
    energyPreviewDiv.innerHTML = `
      <p>Custo estimado de energia por hora: <strong>${window.formatBRL(costPerHour)}</strong></p>
    `;
    energyPreviewDiv.classList.remove('hidden');
  } else {
    energyPreviewDiv.classList.add('hidden');
  }
  window.calculate();
};

// ═══════════════════════════════════════════════════════
// COMPARADOR DE MATERIAIS (MODAL)
// ═══════════════════════════════════════════════════════

window.openComparator = function() {
  const modal = document.getElementById('comparator-modal');
  if (modal) {
    modal.classList.remove('hidden'); // Mostra o modal
    // Renderiza o conteúdo do comparador
    window.renderPlatformComparatorInResult(); // Assumindo que esta função existe em tools.js
  }
};

window.closeComparator = function() {
  const modal = document.getElementById('comparator-modal');
  if (modal) {
    modal.classList.add('hidden'); // Esconde o modal
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

  // Redesenha gráficos se existirem e estiverem visíveis
  if (window._lastResult)  window.renderChart(window._lastResult); // Assumindo renderChart existe
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
    laborCostPerHour: 25, // Adicionado valor padrão para custo de mão de obra
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
  window.renderQualityTips(); // Assumindo renderQualityTips existe
  window.renderProducts('all'); // Assumindo renderProducts existe

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
