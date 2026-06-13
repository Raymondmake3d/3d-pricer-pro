'use strict';

// ═══════════════════════════════════════════════════════
// BASE DE DADOS — MATERIAIS
// ═══════════════════════════════════════════════════════

// Esta constante DEVE ser declarada apenas UMA VEZ e aqui.
window.MATERIAL_INFO = {
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
  "PVA": { "desc": "Material de suporte solúvel em água, ideal para geometrias complexas.", "tempNozzle": "190-220°C", "tempBed": "50-60°C", "avgPrice": 400, "alternatives": [] },
  "HIPS": { "desc": "Material de suporte solúvel em Limoneno, usado com ABS.", "tempNozzle": "230-245°C", "tempBed": "90-110°C", "avgPrice": 200, "alternatives": [] },
  "RESIN-STD": { "desc": "Resina padrão para detalhes finos e prototipagem.", "tempNozzle": "N/A", "tempBed": "N/A", "avgPrice": 180, "alternatives": ["RESIN-ABS", "RESIN-FLEX"] },
  "RESIN-ABS": { "desc": "Resina com maior resistência e flexibilidade, similar ao ABS.", "tempNozzle": "N/A", "tempBed": "N/A", "avgPrice": 250, "alternatives": ["RESIN-STD"] },
  "RESIN-FLEX": { "desc": "Resina flexível para peças que precisam dobrar.", "tempNozzle": "N/A", "tempBed": "N/A", "avgPrice": 300, "alternatives": [] },
  "RESIN-CAST": { "desc": "Resina para fundição, queima sem resíduos.", "tempNozzle": "N/A", "tempBed": "N/A", "avgPrice": 400, "alternatives": [] },
  "RESIN-DENT": { "desc": "Resina biocompatível para aplicações odontológicas.", "tempNozzle": "N/A", "tempBed": "N/A", "avgPrice": 600, "alternatives": [] },
  "SLS-PA12": { "desc": "Pó de Nylon 12 para SLS, alta resistência e precisão.", "tempNozzle": "N/A", "tempBed": "N/A", "avgPrice": 800, "alternatives": [] },
  "SLS-TPU": { "desc": "Pó de TPU para SLS, peças flexíveis e duráveis.", "tempNozzle": "N/A", "tempBed": "N/A", "avgPrice": 900, "alternatives": [] },
  "MJF-PA12": { "desc": "Pó de Nylon 12 para MJF, alta densidade e isotropia.", "tempNozzle": "N/A", "tempBed": "N/A", "avgPrice": 750, "alternatives": [] },
};

// ═══════════════════════════════════════════════════════
// BASE DE DADOS — PRODUTOS
// ═══════════════════════════════════════════════════════

window.PRODUCTS_DB = [
  { id:'p1', category:'printer', tag:'best', emoji:'🖨️',
    name:'Bambu Lab P1S', brand:'Bambu Lab', price:'R$ 4.999,00',
    specs:['CoreXY','300mm/s','Filamento','Auto-nivelamento'],
    desc:'Impressora 3D de alta velocidade e fácil uso.',
    rating:4.9, highlight:true },
  { id:'p2', category:'printer', tag:'value', emoji:'🖨️',
    name:'Creality Ender 3 V3 SE', brand:'Creality', price:'R$ 1.799,00',
    specs:['Bowden','250mm/s','Filamento','Auto-nivelamento'],
    desc:'Excelente custo-benefício para iniciantes.',
    rating:4.5, highlight:false },
  { id:'p3', category:'filament', tag:'best', emoji:'🧵',
    name:'Filamento PLA Bambu Lab', brand:'Bambu Lab', price:'R$ 189,00',
    specs:['PLA','1.75mm','1kg','Diversas cores'],
    desc:'PLA de alta qualidade, cores vibrantes e fácil impressão.',
    rating:4.8, highlight:true },
  { id:'p4', category:'filament', tag:'value', emoji:'🧵',
    name:'Filamento PETG Esun', brand:'Esun', price:'R$ 139,00',
    specs:['PETG','1.75mm','1kg','Resistente'],
    desc:'PETG com boa resistência mecânica e térmica.',
    rating:4.6, highlight:false },
  { id:'p5', category:'resin', tag:'best', emoji:'🧪',
    name:'Resina 8K Anycubic', brand:'Anycubic', price:'R$ 299,00',
    specs:['Resina UV','8K','500g','Alta precisão'],
    desc:'Resina de alta resolução para impressoras 8K.',
    rating:4.7, highlight:true },
  { id:'p6', category:'resin', tag:'value', emoji:'🧪',
    name:'Resina Standard Elegoo', brand:'Elegoo', price:'R$ 159,00',
    specs:['Resina UV','Standard','1kg','Cores variadas'],
    desc:'Resina de uso geral com bom equilíbrio entre preço e qualidade.',
    rating:4.5, highlight:false },
  { id:'p7', category:'tool', tag:'best', emoji:'🛠️',
    name:'Orca Slicer', brand:'Orca', price:'Grátis',
    specs:['Fatiador','Multi-plataforma','Recursos avançados','Perfis pré-configurados'],
    desc:'Fatiador poderoso e gratuito para controle total da impressão.',
    rating:4.9, highlight:true },
  { id:'p8', category:'tool', tag:'value', emoji:'🛠️',
    name:'Cura', brand:'Ultimaker', price:'Grátis',
    specs:['Fatiador','Fácil de usar','Comunidade grande','Plugins'],
    desc:'Fatiador popular e fácil de usar, ideal para iniciantes.',
    rating:4.7, highlight:false },
  { id:'p9', category:'printer', tag:'best', emoji:'🖨️',
    name:'Anycubic Photon Mono M5s', brand:'Anycubic', price:'R$ 3.499,00',
    specs:['MSLA','12K','Resina','Auto-nivelamento'],
    desc:'Impressora de resina de altíssima resolução.',
    rating:4.8, highlight:true },
  { id:'p10', category:'printer', tag:'value', emoji:'🖨️',
    name:'Elegoo Mars 4 Ultra', brand:'Elegoo', price:'R$ 2.299,00',
    specs:['MSLA','9K','Resina','Tela monocromática'],
    desc:'Impressora de resina com excelente custo-benefício.',
    rating:4.6, highlight:false },
  { id:'p11', category:'filament', tag:'best', emoji:'🧵',
    name:'Filamento PETG Bambu Lab', brand:'Bambu Lab', price:'R$ 219,00',
    specs:['PETG','1.75mm','1kg','Alta resistência'],
    desc:'PETG de alta performance, ideal para peças funcionais.',
    rating:4.8, highlight:true },
  { id:'p12', category:'filament', tag:'value', emoji:'🧵',
    name:'Filamento ABS Voolt3D', brand:'Voolt3D', price:'R$ 119,00',
    specs:['ABS','1.75mm','1kg','Durável'],
    desc:'ABS nacional com boa qualidade e preço acessível.',
    rating:4.4, highlight:false },
  { id:'p13', category:'resin', tag:'best', emoji:'🧪',
    name:'Resina ABS-Like Phrozen', brand:'Phrozen', price:'R$ 349,00',
    specs:['Resina UV','ABS-Like','1kg','Resistente'],
    desc:'Resina com propriedades mecânicas similares ao ABS.',
    rating:4.7, highlight:true },
  { id:'p14', category:'resin', tag:'value', emoji:'🧪',
    name:'Resina Water Washable Siraya Tech', brand:'Siraya Tech', price:'R$ 229,00',
    specs:['Resina UV','Lavável em água','1kg','Fácil limpeza'],
    desc:'Resina de fácil pós-processamento, sem necessidade de IPA.',
    rating:4.6, highlight:false },
  { id:'p15', category:'tool', tag:'best', emoji:'🧰',
    name:'Kit de Ferramentas 3D Print', brand:'Creality', price:'R$ 89,00',
    specs:['Espátula','Alicate','Estilete','Pinça'],
    desc:'Kit essencial para pós-processamento de impressões 3D.',
    rating:4.7, highlight:true },
  { id:'p16', category:'tool', tag:'value', emoji:'🧰',
    name:'Estufa de Filamento Sunlu', brand:'Sunlu', price:'R$ 199,00',
    specs:['Estufa','Secagem de filamento','Controle de temperatura','Display LCD'],
    desc:'Ajuda a manter o filamento seco e melhora a qualidade de impressão.',
    rating:4.5, highlight:false },
  { id:'p17', category:'printer', tag:'best', emoji:'🖨️',
    name:'Prusa MK4', brand:'Prusa Research', price:'R$ 6.999,00',
    specs:['CoreXY','200mm/s','Filamento','Open-source'],
    desc:'Impressora 3D robusta e confiável, com grande comunidade.',
    rating:4.9, highlight:true },
  { id:'p18', category:'printer', tag:'value', emoji:'🖨️',
    name:'Kingroon KLP1', brand:'Kingroon', price:'R$ 2.499,00',
    specs:['CoreXY','500mm/s','Filamento','Klipper'],
    desc:'Impressora 3D rápida com Klipper de fábrica.',
    rating:4.6, highlight:false },
  { id:'p19', category:'filament', tag:'best', emoji:'🧵',
    name:'Filamento ASA Bambu Lab', brand:'Bambu Lab', price:'R$ 249,00',
    specs:['ASA','1.75mm','1kg','Resistente a UV'],
    desc:'ASA de alta qualidade, ideal para peças externas.',
    rating:4.8, highlight:true },
  { id:'p20', category:'filament', tag:'value', emoji:'🧵',
    name:'Filamento TPU Flexível 3DFila', brand:'3DFila', price:'R$ 169,00',
    specs:['TPU','1.75mm','1kg','Flexível'],
    desc:'Filamento flexível para peças que precisam de elasticidade.',
    rating:4.5, highlight:false },
  { id:'p21', category:'tool', tag:'best', emoji:'🧪',
    name:'Wash & Cure Plus Elegoo', brand:'Elegoo', price:'R$ 379,00',
    specs:['Lavagem IPA','Cura UV 405nm','Timer','360° UV'],
    desc:'Estação completa de lavagem e cura para resina.',
    rating:4.8, highlight:false },
  { id:'p22', category:'tool', tag:'best', emoji:'🔧',
    name:'IPA 99.9% 1L Anidrol', brand:'Anidrol', price:'R$ 45,00',
    specs:['IPA 99.9%','1 Litro','Resina','Limpeza'],
    desc:'Isopropanol grau farmacêutico para lavagem de resina.',
    rating:4.6, highlight:false },
];

// ═══════════════════════════════════════════════════════
// BASE DE DADOS — DICAS DE QUALIDADE
// ═══════════════════════════════════════════════════════

window.QUALITY_TIPS = [
  { icon:'🌡️', title:'Temperatura do Bico',    value:'PLA: 200–215°C | PETG: 235–245°C',     desc:'Temperatura muito alta gera stringing. Muito baixa causa underextrusion.' },
  { icon:'🛏️', title:'Temperatura da Mesa',    value:'PLA: 55°C | PETG: 75°C | ABS: 100°C',  desc:'Mesa bem quente garante aderência e evita warping.' },
  { icon:'📏', title:'Altura de Camada',        value:'0.1mm (detalhe) → 0.3mm (velocidade)', desc:'Use 0.2mm como padrão. Para decorativas, 0.1mm.' },
  { icon:'💨', title:'Velocidade de Impressão', value:'PLA: até 300mm/s | PETG: até 150mm/s',  desc:'Alta velocidade pode causar perda de qualidade.' },
  { icon:'🔄', title:'Preenchimento (Infill)',  value:'15–20% decorativo | 40–60% funcional',  desc:'Gyroid é o melhor custo-benefício.' },
  { icon:'🧱', title:'Perímetros (Walls)',      value:'2 paredes (estética) | 4+ (resistência)',desc:'Mais paredes = mais resistência.' },
  { icon:'🌬️', title:'Resfriamento',           value:'PLA: 100% | PETG: 30–50% | ABS: 0%',   desc:'ABS e ASA precisam de zero resfriamento.' },
  { icon:'📦', title:'Armazenamento',           value:'Temperatura < 25°C | Umidade < 15%',    desc:'Use caixas secas com sílica gel.' },
  { icon:'⚙️', title:'Calibração de Fluxo',    value:'Extrusion multiplier: 0.95–1.05',       desc:'Calibre o fluxo por marca/cor de filamento.' },
  { icon:'🏠', title:'Primeira Camada',         value:'Live Adjust Z: crítico',                desc:'A primeira camada define tudo.' },
  { icon:'🔩', title:'Suportes',                value:'Normal: 50° | Tree: geometrias complexas',desc:'Suportes Árvore consomem menos material.' },
  { icon:'🎯', title:'Input Shaping',           value:'Reduz ghosting em alta velocidade',      desc:'Ative no Orca Flashforge para imprimir rápido com qualidade.' },
];

// ═══════════════════════════════════════════════════════
// DICAS DINÂMICAS
// ═══════════════════════════════════════════════════════

window.generateDynamicTips = function(data) {
  const tips = [];

  if (data.energyCost > 10) {
    tips.push({ type:'economy', icon:'⚡', title:'Custo de Energia Elevado',
      desc:`Seu custo de energia é ${window.formatBRL(data.energyCost)} nesta peça. Considere imprimir em horários de bandeira verde.`,
      badge:'Economia' });
  }

  if (data.printerWatts > 400) {
    tips.push({ type:'economy', icon:'🔌', title:'Impressora com Alto Consumo',
      desc:'Impressoras acima de 400W têm custo energético significativo. Para PLA e PETG, a câmara não precisa estar ativa.',
      badge:'Economia' });
  }

  if (data.materialCostPerGram > 0.35) {
    tips.push({ type:'economy', icon:'💰', title:'Material com Custo/g Elevado',
      desc:`R$ ${data.materialCostPerGram.toFixed(3)}/g é acima da média. Alternativas: ${window.getMaterialAlternatives(data.materialType)}.`,
      badge:'Economia' });
  }

  if (data.failureRate > 10) {
    tips.push({ type:'warning', icon:'⚠️', title:'Taxa de Falha Muito Alta',
      desc:`Uma taxa de ${data.failureRate}% é elevada. Uma taxa saudável fica entre 2–5%.`,
      badge:'Atenção' });
  }

  const depreciationPercent = (data.depreciationCost / data.directCost) * 100;
  if (depreciationPercent > 25) {
    tips.push({ type:'info', icon:'🖨️', title:'Alta Participação da Depreciação',
      desc:`A depreciação representa ${depreciationPercent.toFixed(1)}% do custo. Aumente o volume mensal para diluir esse custo fixo.`,
      badge:'Info' });
  }

  if (data.profitMargin < 20) {
    tips.push({ type:'warning', icon:'📉', title:'Margem de Lucro Baixa',
      desc:`Margem de ${data.profitMargin}% pode ser insuficiente. Recomenda-se no mínimo 30–40%.`,
      badge:'Atenção' });
  }

  const premiumSuggestion = window.getPremiumMaterialSuggestion(data.materialType);
  if (premiumSuggestion) {
    tips.push({ type:'quality', icon:'⬆️', title:'Opção de Qualidade Superior Disponível',
      desc: premiumSuggestion, badge:'Upgrade' });
  }

  if (data.printHours > 12) {
    tips.push({ type:'economy', icon:'⏱️', title:'Impressão de Longa Duração',
      desc:`${data.printHours}h de impressão é significativo. Considere aumentar altura de camada ou reduzir infill.`,
      badge:'Eficiência' });
  }

  if (data.partWeight < 20 && data.printHours > 2) {
    tips.push({ type:'info', icon:'🏗️', title:'Peça Leve com Tempo Elevado',
      desc:`Peça de ${data.partWeight}g com ${data.printHours}h indica alta complexidade. Aumente a altura de camada.`,
      badge:'Info' });
  }

  if (data.quantity > 1) {
    tips.push({ type:'economy', icon:'📦', title:'Ganho de Escala no Lote',
      desc:`Para ${data.quantity} unidades, negocie material em maior quantidade (desconto médio de 8–15%).`,
      badge:'Escala' });
  }

  if (data.materialType && data.materialType.startsWith('RESIN') && data.postProcessCost < 10) {
    tips.push({ type:'quality', icon:'🧪', title:'Pós-processamento de Resina Subestimado',
      desc:'Para resinas, inclua: IPA, cura UV, remoção de suportes e lixamento. Isso costuma adicionar R$ 15–40 ao custo real.',
      badge:'Qualidade' });
  }

  return tips;
};

window.getMaterialAlternatives = function(type) {
  const info = window.MATERIAL_INFO[type];
  if (!info || !info.alternatives.length) return 'consulte o comparador de materiais';
  return info.alternatives.join(', ');
};

window.getPremiumMaterialSuggestion = function(type) {
  const upgrades = {
    'PLA':       'Para peças funcionais, considere PETG ou PLA-CF. Custo adicional de ~30–80% com ganho significativo de performance.',
    'PETG':      'Para uso externo ou alta temperatura, ASA ou PA são excelentes alternativas.',
    'ABS':       'ASA substitui o ABS com vantagens reais: melhor resistência UV e menos warping.',
    'RESIN-STD': 'Resina ABS-Like oferece muito mais resistência ao impacto por apenas ~30% a mais.',
    'PLA-CF':    'Para resistência química além da rigidez, PETG-CF é o próximo passo.',
  };
  return upgrades[type] || null;
};

// ═══════════════════════════════════════════════════════
// RENDERIZAÇÃO DE DICAS DE QUALIDADE
// ═══════════════════════════════════════════════════════

window.renderQualityTips = function() {
  const container = document.getElementById('tab-tips');
  if (!container) return;

  container.innerHTML = `
    <div class="card">
      <div class="result-header">
        <h2><i class="fas fa-lightbulb"></i> Dicas de Otimização e Qualidade</h2>
      </div>
      <p class="section-desc">Aprimore suas impressões e otimize seus custos com estas dicas:</p>
      <div class="tips-grid">
        ${window.QUALITY_TIPS.map(tip => `
          <div class="tip-card">
            <div class="tip-icon">${tip.icon}</div>
            <div class="tip-content">
              <strong>${tip.title}</strong>
              <small>${tip.value}</small>
              <p>${tip.desc}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
};

// ═══════════════════════════════════════════════════════
// COMPARADOR DE MATERIAIS
// ═══════════════════════════════════════════════════════

window.generateComparatorHTML = function() {
  const materials = ['PLA','PETG','ABS','ASA','TPU','PLA-CF','PA','RESIN-STD'];
  const ratings = {
    'PLA':       [5,2,2,2,2,5,3],
    'PETG':      [4,3,3,4,3,4,3],
    'ABS':       [2,4,4,3,2,4,3],
    'ASA':       [2,4,4,3,5,3,3],
    'TPU':       [3,3,5,4,3,3,3],
    'PLA-CF':    [4,2,2,2,2,2,4],
    'PA':        [2,4,5,5,3,2,3],
    'RESIN-STD': [3,2,1,2,1,3,5],
  };
  const cols = ['Facilidade','Temp. Resist.','Impacto','Química','UV','Custo-Ben.','Detalhe'];

  let html = `<div class="comparator-scroll"><table class="comp-table">
    <thead><tr><th>Material</th>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead>
    <tbody>`;

  materials.forEach(mat => {
    const r = ratings[mat];
    html += `<tr><td class="mat-name">${mat}</td>
      ${r.map(v=>`<td><div class="comp-dots">
        ${Array.from({length:5},(_,i)=>`<span class="dot${i<v?' filled':''}"></span>`).join('')}
      </div></td>`).join('')}
    </tr>`;
  });

  html += `</tbody></table></div>`;
  return html;
};

// ═══════════════════════════════════════════════════════
// RENDERIZAÇÃO DE PRODUTOS
// ═══════════════════════════════════════════════════════

window.renderProducts = function(filter = 'all') {
  const container = document.getElementById('tab-products');
  if (!container) return;

  const filteredProducts = filter === 'all'
    ? window.PRODUCTS_DB
    : window.PRODUCTS_DB.filter(p => p.category === filter);

  container.innerHTML = `
    <div class="card">
      <div class="result-header">
        <h2><i class="fas fa-star"></i> Produtos Recomendados</h2>
      </div>
      <p class="section-desc">Encontre as melhores impressoras, filamentos, resinas e ferramentas para seu negócio.</p>
      <div class="product-filters">
        <button class="btn-small product-filter-btn ${filter === 'all' ? 'active' : ''}" onclick="window.renderProducts('all', this)">Todos</button>
        <button class="btn-small product-filter-btn ${filter === 'printer' ? 'active' : ''}" onclick="window.renderProducts('printer', this)">Impressoras</button>
        <button class="btn-small product-filter-btn ${filter === 'filament' ? 'active' : ''}" onclick="window.renderProducts('filament', this)">Filamentos</button>
        <button class="btn-small product-filter-btn ${filter === 'resin' ? 'active' : ''}" onclick="window.renderProducts('resin', this)">Resinas</button>
        <button class="btn-small product-filter-btn ${filter === 'tool' ? 'active' : ''}" onclick="window.renderProducts('tool', this)">Ferramentas</button>
      </div>
      <div class="products-grid">
        ${filteredProducts.map(product => `
          <div class="product-card ${product.highlight ? 'highlight' : ''}">
            <div class="product-header">
              <span class="product-emoji">${product.emoji}</span>
              <span class="product-tag ${product.tag}">${product.tag === 'best' ? 'Melhor' : product.tag === 'value' ? 'Custo-Benefício' : ''}</span>
            </div>
            <h3>${product.name}</h3>
            <p class="product-brand">${product.brand}</p>
            <div class="product-specs">
              ${product.specs.map(spec => `<span>${spec}</span>`).join('')}
            </div>
            <p class="product-desc">${product.desc}</p>
            <div class="product-footer">
              <span class="product-price">${product.price}</span>
              <div class="product-rating">
                ${Array.from({length: 5}, (_, i) => `<i class="fas fa-star ${i < Math.floor(product.rating) ? 'filled' : ''}"></i>`).join('')}
                <span>${product.rating}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
};

window.initProductFilters = function() {
  // Adiciona um listener para os botões de filtro de produtos
  document.querySelectorAll('.product-filter-btn').forEach(button => {
    button.addEventListener('click', function() {
      document.querySelectorAll('.product-filter-btn').forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      const filter = this.dataset.filter; // Assume que o data-filter está no botão
      window.renderProducts(filter);
    });
  });
};
