'use strict';

// ═══════════════════════════════════════════════════════
// UTILITÁRIO COMPARTILHADO
// ═══════════════════════════════════════════════════════

function formatBRL(value) {
  return (value || 0).toLocaleString('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 2,
  });
}

// ═══════════════════════════════════════════════════════
// BASE DE DADOS — MATERIAIS
// ═══════════════════════════════════════════════════════

const MATERIAL_INFO = {
  'PLA': {
    desc: 'Material mais popular. Fácil de imprimir, boa rigidez, baixa resistência ao calor (≈60°C). Ideal para peças decorativas e protótipos.',
    tempNozzle: '190–220°C', tempBed: '50–60°C',
    density: 1.24, shrinkage: 0.2,
    pros: ['Fácil impressão','Baixo warping','Biodegradável','Preço acessível'],
    cons: ['Baixa resistência térmica','Frágil sob impacto','Não adequado para uso externo'],
    alternatives: ['PETG','PLA-CF','ASA'],
    avgPrice: 80,
  },
  'PETG': {
    desc: 'Excelente equilíbrio entre rigidez e flexibilidade. Resistente a água e produtos químicos. Boa resistência ao calor (≈80°C).',
    tempNozzle: '230–250°C', tempBed: '70–85°C',
    density: 1.27, shrinkage: 0.3,
    pros: ['Boa resistência química','Translúcido disponível','Menor warping que ABS','Resistente à umidade'],
    cons: ['Stringing frequente','Absorve umidade','Mais difícil que PLA'],
    alternatives: ['PLA','ABS','ASA'],
    avgPrice: 95,
  },
  'ABS': {
    desc: 'Resistente ao calor (≈100°C) e impactos. Requer ambiente controlado. Exala fumes — use com ventilação.',
    tempNozzle: '220–250°C', tempBed: '90–110°C',
    density: 1.04, shrinkage: 0.8,
    pros: ['Alta resistência térmica','Pós-processamento fácil (acetona)','Leve','Resistente a impactos'],
    cons: ['Warping intenso','Requer câmara fechada','Fumes tóxicos','Difícil de imprimir'],
    alternatives: ['ASA','PETG','PC'],
    avgPrice: 90,
  },
  'ASA': {
    desc: 'Evolução do ABS com resistência UV superior. Ideal para uso externo. Mesmas propriedades térmicas, menos warping.',
    tempNozzle: '240–260°C', tempBed: '90–110°C',
    density: 1.07, shrinkage: 0.6,
    pros: ['Resistente a UV','Menos warping que ABS','Uso externo','Boa resistência térmica'],
    cons: ['Requer câmara','Preço superior ao ABS','Fumes presentes'],
    alternatives: ['ABS','PETG','PA'],
    avgPrice: 110,
  },
  'TPU': {
    desc: 'Filamento flexível. Excelente para peças que precisam dobrar, absorver impacto ou ter grip. Impressão lenta necessária.',
    tempNozzle: '220–240°C', tempBed: '30–60°C',
    density: 1.21, shrinkage: 0.5,
    pros: ['Flexível e elástico','Resistente a abrasão','Boa aderência','Resistente a óleos'],
    cons: ['Impressão lenta','Difícil com extrusor Bowden','Stringing','Higroscópico'],
    alternatives: ['TPE','Ninjaflex'],
    avgPrice: 140,
  },
  'PLA-CF': {
    desc: 'PLA reforçado com fibra de carbono. Muito mais rígido e leve. Requer bico endurecido. Acabamento fosco premium.',
    tempNozzle: '200–230°C', tempBed: '50–60°C',
    density: 1.18, shrinkage: 0.3,
    pros: ['Altíssima rigidez','Leve','Acabamento premium','Ótima resistência'],
    cons: ['Abrasivo — desgasta bico padrão','Mais frágil em flexão','Preço elevado'],
    alternatives: ['PETG-CF','PA-CF'],
    avgPrice: 220,
  },
  'PETG-CF': {
    desc: 'PETG com fibra de carbono. Une resistência química do PETG com a rigidez do CF. Requer bico endurecido.',
    tempNozzle: '240–260°C', tempBed: '70–85°C',
    density: 1.30, shrinkage: 0.3,
    pros: ['Rígido e resistente','Boa resistência química','Menos frágil que PLA-CF'],
    cons: ['Abrasivo','Preço elevado','Requer bico endurecido'],
    alternatives: ['PA-CF','PLA-CF'],
    avgPrice: 260,
  },
  'PA': {
    desc: 'Nylon. Alta resistência mecânica e ao impacto. Muito higroscópico — precisa secar antes de imprimir.',
    tempNozzle: '240–270°C', tempBed: '70–90°C',
    density: 1.14, shrinkage: 1.0,
    pros: ['Alta resistência mecânica','Boa resistência química','Durável'],
    cons: ['Muito higroscópico','Warping','Difícil de imprimir','Preço alto'],
    alternatives: ['PA-CF','PETG','ASA'],
    avgPrice: 180,
  },
  'PA-CF': {
    desc: 'Nylon com fibra de carbono. Um dos materiais de engenharia mais resistentes para FDM. Requer bico endurecido e câmara aquecida.',
    tempNozzle: '260–290°C', tempBed: '80–100°C',
    density: 1.10, shrinkage: 0.6,
    pros: ['Resistência excepcional','Rígido e leve','Alta temperatura'],
    cons: ['Muito exigente','Requer câmara e bico endurecido','Preço muito alto'],
    alternatives: ['PC','PETG-CF'],
    avgPrice: 380,
  },
  'PC': {
    desc: 'Policarbonato. Resistência térmica altíssima (≈130°C). Transparente. Usado em peças de engenharia de alta performance.',
    tempNozzle: '270–310°C', tempBed: '100–120°C',
    density: 1.20, shrinkage: 0.5,
    pros: ['Alta resistência térmica','Transparente','Forte e duro'],
    cons: ['Muito difícil de imprimir','Requer hotend all-metal','Warping severo','Absorve umidade'],
    alternatives: ['ASA','ABS','PA'],
    avgPrice: 200,
  },
  'PVA': {
    desc: 'Material de suporte solúvel em água. Ideal para geometrias complexas com suportes impossíveis de remover manualmente.',
    tempNozzle: '180–200°C', tempBed: '45–60°C',
    density: 1.23, shrinkage: 0.3,
    pros: ['Solúvel em água','Suportes perfeitos','Sem marcas na peça'],
    cons: ['Muito higroscópico','Caro','Impressão lenta','Requer 2ª extrusora'],
    alternatives: ['HIPS (solúvel em limoneno)'],
    avgPrice: 350,
  },
  'RESIN-STD': {
    desc: 'Resina padrão MSLA/LCD. Altíssimo detalhe. Requer pós-cura (lavagem em IPA + exposição UV). Manuseio com EPI.',
    tempNozzle: 'N/A', tempBed: 'N/A',
    density: 1.10, shrinkage: 0.4,
    pros: ['Altíssima resolução','Superfície lisa','Detalhes finos','Variadas cores'],
    cons: ['Frágil','Requer pós-processamento','Tóxica no manuseio','Odor forte'],
    alternatives: ['RESIN-ABS','RESIN-8K'],
    avgPrice: 120,
  },
  'RESIN-ABS': {
    desc: 'Resina ABS-Like. Mais resistente e menos frágil que resina padrão. Boa para peças funcionais com alta definição.',
    tempNozzle: 'N/A', tempBed: 'N/A',
    density: 1.12, shrinkage: 0.35,
    pros: ['Mais resistente que padrão','Bom detalhe','Menos quebradiça'],
    cons: ['Mais cara','Ainda requer EPI','Pós-processamento necessário'],
    alternatives: ['RESIN-ENG','RESIN-STD'],
    avgPrice: 160,
  },
  'RESIN-8K': {
    desc: 'Resina de alta resolução para impressoras 8K. Detalhe extremo. Ideal para miniaturas, joias e peças de precisão máxima.',
    tempNozzle: 'N/A', tempBed: 'N/A',
    density: 1.09, shrinkage: 0.3,
    pros: ['Resolução extrema','Superfície impecável','Excelente para miniaturas e joias'],
    cons: ['Cara','Compatível só com impressoras 8K','Frágil'],
    alternatives: ['RESIN-CAST'],
    avgPrice: 220,
  },
  'RESIN-ENG': {
    desc: 'Resina de engenharia. Alta resistência mecânica e térmica mantendo o detalhe das resinas. Usada em peças funcionais de precisão.',
    tempNozzle: 'N/A', tempBed: 'N/A',
    density: 1.15, shrinkage: 0.4,
    pros: ['Resistência mecânica superior','Alta temperatura','Detalhe fino'],
    cons: ['Preço muito alto','Impressão mais lenta','Pós-cura exigente'],
    alternatives: ['RESIN-ABS','PA-CF'],
    avgPrice: 380,
  },
  'RESIN-CAST': {
    desc: 'Resina para fundição (castable). Queima sem resíduo para fundição em metal. Usada em joias e peças metálicas de precisão.',
    tempNozzle: 'N/A', tempBed: 'N/A',
    density: 1.05, shrinkage: 0.25,
    pros: ['Queima sem resíduo','Ideal para fundição em metal','Altíssimo detalhe'],
    cons: ['Cara','Uso específico','Requer forno de queima'],
    alternatives: ['RESIN-8K'],
    avgPrice: 500,
  },
  'OUTRO': {
    desc: 'Material personalizado. Insira manualmente o custo por grama.',
    tempNozzle: '—', tempBed: '—',
    density: 1.20, shrinkage: 0.5,
    pros: ['Flexibilidade total de configuração'],
    cons: ['Sem dados automáticos'],
    alternatives: [],
    avgPrice: 0,
  },
};

// ═══════════════════════════════════════════════════════
// BASE DE DADOS — PRODUTOS EM DESTAQUE
// ═══════════════════════════════════════════════════════

const PRODUCTS = [
  { id:'p01', category:'filament', tag:'best', emoji:'🧵',
    name:'PLA Basic eSUN', brand:'eSUN', price:'R$ 79,90',
    specs:['PLA','1kg','1.75mm','+20 cores'],
    desc:'Melhor custo-benefício do mercado. Ótima consistência de diâmetro e excelente acabamento.',
    rating:4.8, highlight:true },
  { id:'p02', category:'filament', tag:'hot', emoji:'🧵',
    name:'PETG Bambu Lab', brand:'Bambu Lab', price:'R$ 129,00',
    specs:['PETG','1kg','1.75mm','Seco de fábrica'],
    desc:'Certificado para impressoras Bambu. Alta consistência e mínimo stringing.',
    rating:4.9, highlight:false },
  { id:'p03', category:'filament', tag:'new', emoji:'🧵',
    name:'PLA-CF Bambu Lab', brand:'Bambu Lab', price:'R$ 219,00',
    specs:['PLA-CF','1kg','1.75mm','Bico endurecido'],
    desc:'Alta rigidez e acabamento fosco premium. Requer bico de aço endurecido.',
    rating:4.7, highlight:false },
  { id:'p04', category:'filament', tag:'best', emoji:'🧵',
    name:'PETG-CF Polymaker PolyMax', brand:'Polymaker', price:'R$ 249,00',
    specs:['PETG-CF','750g','1.75mm','Endurecido'],
    desc:'Resistência mecânica superior. Excelente para peças funcionais e de engenharia.',
    rating:4.6, highlight:false },
  { id:'p05', category:'filament', tag:'hot', emoji:'🧵',
    name:'PA12-CF Bambu Lab', brand:'Bambu Lab', price:'R$ 389,00',
    specs:['PA-CF','500g','1.75mm','Alta Temp'],
    desc:'Nylon carbono de alta performance. Para peças de engenharia exigentes.',
    rating:4.8, highlight:false },
  { id:'p06', category:'filament', tag:'new', emoji:'🧵',
    name:'ASA Formfutura ApolloX', brand:'Formfutura', price:'R$ 189,00',
    specs:['ASA','750g','1.75mm','UV Resist'],
    desc:'Resistência UV excepcional. Ideal para peças externas com longa vida útil.',
    rating:4.5, highlight:false },
  { id:'p07', category:'filament', tag:'best', emoji:'🧵',
    name:'TPU 95A eSUN', brand:'eSUN', price:'R$ 139,00',
    specs:['TPU','1kg','1.75mm','95A Shore'],
    desc:'Flexível e durável. Ótimo para protetores, juntas e peças com grip.',
    rating:4.6, highlight:false },
  { id:'p08', category:'filament', tag:'premium', emoji:'🧵',
    name:'PC Polymaker PolyLite', brand:'Polymaker', price:'R$ 199,00',
    specs:['PC','1kg','1.75mm','130°C'],
    desc:'Alta resistência térmica e transparência. Para peças de engenharia premium.',
    rating:4.4, highlight:false },
  { id:'p09', category:'resin', tag:'best', emoji:'🧪',
    name:'ABS-Like Elegoo', brand:'Elegoo', price:'R$ 119,00',
    specs:['ABS-Like','1kg','MSLA','Multicolor'],
    desc:'Resina de grande custo-benefício. Menos frágil que padrão, excelente detalhe.',
    rating:4.7, highlight:true },
  { id:'p10', category:'resin', tag:'new', emoji:'🧪',
    name:'Water Washable Anycubic', brand:'Anycubic', price:'R$ 149,00',
    specs:['Água Lavável','1kg','MSLA','Sem IPA'],
    desc:'Lava apenas com água. Muito mais prática e econômica no pós-processamento.',
    rating:4.5, highlight:false },
  { id:'p11', category:'resin', tag:'premium', emoji:'🧪',
    name:'Resin 8K Phrozen Aqua', brand:'Phrozen', price:'R$ 229,00',
    specs:['8K Ultra','1kg','8K printers','Alta res.'],
    desc:'Resolução extrema para miniaturas, joias e peças com detalhes finos.',
    rating:4.9, highlight:false },
  { id:'p12', category:'resin', tag:'hot', emoji:'🧪',
    name:'Engineering Resin Formlabs', brand:'Formlabs', price:'R$ 580,00',
    specs:['Eng. Grade','1L','Form 3','Alta Temp'],
    desc:'Resina de engenharia líder do mercado. Usada em protótipos funcionais profissionais.',
    rating:4.8, highlight:false },
  { id:'p13', category:'printer', tag:'hot', emoji:'🖨️',
    name:'Bambu Lab P1S', brand:'Bambu Lab', price:'R$ 8.990,00',
    specs:['FDM','Câmara','AMS','700mm/s'],
    desc:'A impressora mais rápida e automatizada do mercado. Câmara fechada para materiais exigentes.',
    rating:4.9, highlight:true },
  { id:'p14', category:'printer', tag:'best', emoji:'🖨️',
    name:'Bambu Lab A1 Mini', brand:'Bambu Lab', price:'R$ 3.290,00',
    specs:['FDM','Compacta','AMS Lite','500mm/s'],
    desc:'Compacta, rápida e com multifilamento. Perfeita para iniciantes e makers.',
    rating:4.8, highlight:false },
  { id:'p15', category:'printer', tag:'new', emoji:'🖨️',
    name:'Bambu Lab X1E', brand:'Bambu Lab', price:'R$ 14.500,00',
    specs:['FDM','Industrial','AMS','300°C HE'],
    desc:'Versão enterprise do X1C. Para materiais de engenharia e uso profissional.',
    rating:4.9, highlight:false },
  { id:'p16', category:'printer', tag:'best', emoji:'🖨️',
    name:'Elegoo Saturn 4 Ultra', brand:'Elegoo', price:'R$ 4.200,00',
    specs:['MSLA','12K','310×220mm','Mono'],
    desc:'Grande formato MSLA com resolução 12K. Referência em custo-benefício para resina.',
    rating:4.7, highlight:false },
  { id:'p17', category:'printer', tag:'premium', emoji:'🖨️',
    name:'Prusa MK4S', brand:'Prusa', price:'R$ 5.800,00',
    specs:['FDM','Open','Input Shaping','220x220'],
    desc:'Referência em qualidade e confiabilidade. Ecossistema aberto e comunidade enorme.',
    rating:4.8, highlight:false },
  { id:'p18', category:'printer', tag:'hot', emoji:'🖨️',
    name:'Creality K2 Plus', brand:'Creality', price:'R$ 6.500,00',
    specs:['FDM','Câmara','CFS 4 cores','600mm/s'],
    desc:'Grande formato com câmara e multifilamento. Excelente custo para grande volume.',
    rating:4.5, highlight:false },
  { id:'p19', category:'tool', tag:'best', emoji:'🔧',
    name:'Secador eSUN eBox Lite', brand:'eSUN', price:'R$ 189,00',
    specs:['0–70°C','Temporizador','Imprime seco','Display'],
    desc:'Mantém o filamento seco durante a impressão. Essencial para PA, TPU e PETG.',
    rating:4.7, highlight:false },
  { id:'p20', category:'tool', tag:'hot', emoji:'🔧',
    name:'Kit Bicos Endurecidos Bambu', brand:'Bambu Lab', price:'R$ 89,00',
    specs:['Aço endurecido','0.4mm','CF/GF','P/X/A'],
    desc:'Essencial para impressão com materiais abrasivos como CF e GF.',
    rating:4.9, highlight:false },
  { id:'p21', category:'tool', tag:'new', emoji:'🔧',
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

const QUALITY_TIPS = [
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

function generateDynamicTips(data) {
  const tips = [];

  if (data.energyCost > 10) {
    tips.push({ type:'economy', icon:'⚡', title:'Custo de Energia Elevado',
      desc:`Seu custo de energia é ${formatBRL(data.energyCost)} nesta peça. Considere imprimir em horários de bandeira verde.`,
      badge:'Economia' });
  }

  if (data.printerWatts > 400) {
    tips.push({ type:'economy', icon:'🔌', title:'Impressora com Alto Consumo',
      desc:'Impressoras acima de 400W têm custo energético significativo. Para PLA e PETG, a câmara não precisa estar ativa.',
      badge:'Economia' });
  }

  if (data.materialCostPerGram > 0.35) {
    tips.push({ type:'economy', icon:'💰', title:'Material com Custo/g Elevado',
      desc:`R$ ${data.materialCostPerGram.toFixed(3)}/g é acima da média. Alternativas: ${getMaterialAlternatives(data.materialType)}.`,
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

  const premiumSuggestion = getPremiumMaterialSuggestion(data.materialType);
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
}

function getMaterialAlternatives(type) {
  const info = MATERIAL_INFO[type];
  if (!info || !info.alternatives.length) return 'consulte o comparador de materiais';
  return info.alternatives.join(', ');
}

function getPremiumMaterialSuggestion(type) {
  const upgrades = {
    'PLA':       'Para peças funcionais, considere PETG ou PLA-CF. Custo adicional de ~30–80% com ganho significativo de performance.',
    'PETG':      'Para uso externo ou alta temperatura, ASA ou PA são excelentes alternativas.',
    'ABS':       'ASA substitui o ABS com vantagens reais: melhor resistência UV e menos warping.',
    'RESIN-STD': 'Resina ABS-Like oferece muito mais resistência ao impacto por apenas ~30% a mais.',
    'PLA-CF':    'Para resistência química além da rigidez, PETG-CF é o próximo passo.',
  };
  return upgrades[type] || null;
}

// ═══════════════════════════════════════════════════════
// COMPARADOR DE MATERIAIS
// ═══════════════════════════════════════════════════════

function generateComparatorHTML() {
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
}
