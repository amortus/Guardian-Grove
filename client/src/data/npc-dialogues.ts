/**
 * Diálogos e Dicas dos NPCs - Guardian Grove
 */

export interface NPCDialogue {
  npcId: string;
  npcName: string;
  location: 'craft' | 'market' | 'temple' | 'missions' | 'exploration';
  dialogues: string[];
  tips: string[];
}

export const NPC_DIALOGUES: NPCDialogue[] = [
  {
    npcId: 'dalan',
    npcName: 'Dalan',
    location: 'craft',
    dialogues: [
      'Bem-vindo à oficina! Cada item que criamos ajuda o Grove a prosperar.',
      'A melhor forma de aprender é fazendo. Vamos criar algo juntos?',
      'Materiais naturais são os melhores. O Grove nos dá tudo que precisamos!',
      'Você sabia? Reutilizar materiais economiza até 70% de energia!',
    ],
    tips: [
      '💡 Recicle sempre que possível!',
      '🔨 Itens craftados têm mais valor que comprados',
      '🌿 Use recursos naturais com sabedoria',
    ],
  },
  {
    npcId: 'liora',
    npcName: 'Liora',
    location: 'market',
    dialogues: [
      'O comércio justo beneficia a todos! Compre consciente.',
      'Cada Coroa que você gasta aqui volta para o Grove.',
      'Produtos locais reduzem a pegada de carbono em 80%!',
      'Qualidade é melhor que quantidade. Menos é mais!',
    ],
    tips: [
      '💰 Invista em itens duráveis',
      '🛍️ Sacolas reutilizáveis salvam o planeta',
      '🌍 Compre local, pense global',
    ],
  },
  {
    npcId: 'ruvian',
    npcName: 'Ruvian',
    location: 'temple',
    dialogues: [
      'A sabedoria está em harmonia com a natureza.',
      'Cada ação tem uma reação. Escolha com cuidado.',
      'O Grove nos ensina paciência e respeito.',
      'Meditação diária fortalece o espírito e o guardião.',
    ],
    tips: [
      '🧘 Equilíbrio é a chave',
      '🌳 Respeite todas as formas de vida',
      '✨ Virtudes tornam você mais forte',
    ],
  },
  {
    npcId: 'aria',
    npcName: 'Aria',
    location: 'missions',
    dialogues: [
      'Conhecimento é poder! Estude e cresça.',
      'Cada missão é uma oportunidade de aprender algo novo.',
      'A educação é a arma mais poderosa para mudar o mundo.',
      'Você já completou sua missão diária hoje?',
    ],
    tips: [
      '📚 Aprenda algo novo todo dia',
      '🎯 Missões diárias resetam à meia-noite',
      '🏆 Complete missões para desbloquear conquistas',
    ],
  },
  {
    npcId: 'explorer',
    npcName: 'Guardião Explorador',
    location: 'exploration',
    dialogues: [
      'A Trilha da Descoberta está cheia de segredos!',
      'Explore e desvende os mistérios do Grove.',
      'Cada exploração te torna mais sábio.',
      'Você está pronto para a aventura?',
    ],
    tips: [
      '🗺️ Explorações revelam conhecimento',
      '🎮 Jogue mini-games para treinar sua mente',
      '🌿 Cada descoberta fortalece o Grove',
    ],
  },
];

/**
 * Sabedoria do Dia - Mensagens educacionais
 */
export const DAILY_WISDOM = [
  '🌍 Você sabia? Separar o lixo pode reduzir 30% dos resíduos em aterros!',
  '💧 Uma torneira pingando desperdiça 46 litros de água por dia!',
  '🌳 Uma única árvore pode absorver até 22kg de CO2 por ano!',
  '♻️ Reciclar 1 tonelada de papel salva 17 árvores!',
  '☀️ A energia solar cresce 20% ao ano no mundo!',
  '🚲 Usar bicicleta por 10km evita 1,5kg de CO2 na atmosfera!',
  '🌱 Compostagem reduz até 50% do lixo doméstico!',
  '💡 LEDs usam 75% menos energia que lâmpadas comuns!',
  '🌊 Oceanos absorvem 30% do CO2 que produzimos!',
  '🍃 Plantar árvores é uma das formas mais eficazes de combater mudanças climáticas!',
];

/**
 * Retorna um diálogo aleatório do NPC
 */
export function getRandomDialogue(location: NPCDialogue['location']): string {
  const npc = NPC_DIALOGUES.find(n => n.location === location);
  if (!npc) return 'Olá, guardião!';
  
  const dialogues = npc.dialogues;
  return dialogues[Math.floor(Math.random() * dialogues.length)];
}

/**
 * Retorna uma dica aleatória do NPC
 */
export function getRandomTip(location: NPCDialogue['location']): string {
  const npc = NPC_DIALOGUES.find(n => n.location === location);
  if (!npc) return '💡 Explore o Grove!';
  
  const tips = npc.tips;
  return tips[Math.floor(Math.random() * tips.length)];
}

/**
 * Retorna a sabedoria do dia
 */
export function getDailyWisdom(): string {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return DAILY_WISDOM[dayOfYear % DAILY_WISDOM.length];
}

