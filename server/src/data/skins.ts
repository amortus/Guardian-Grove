/**
 * Skin System Data - Guardian Grove Server
 * Usa as 10 beasts reais do jogo
 */

export interface Skin {
  id: string;
  name: string;
  description: string;
  model: string;
  icon: string;
  rarity: 'starter' | 'common' | 'rare' | 'epic' | 'legendary';
  price: number;
  category: 'guardian';
}

// ===== 3 SKINS INICIAIS =====
export const STARTER_SKINS: Skin[] = [
  {
    id: 'brontis',
    name: 'Brontis',
    description: 'Réptil Colosso. Lagarto bípede robusto com escamas verdes. Ótimo para iniciantes!',
    model: 'Brontis',
    icon: '🦎',
    rarity: 'starter',
    price: 0,
    category: 'guardian',
  },
  {
    id: 'feralis',
    name: 'Feralis',
    description: 'Felino Selvagem. Ágil e veloz, perfeito para ataques críticos rápidos.',
    model: 'Feralis',
    icon: '🐺',
    rarity: 'starter',
    price: 0,
    category: 'guardian',
  },
  {
    id: 'sylphid',
    name: 'Sylphid',
    description: 'Espírito Etéreo. Especialista em magia, corpo translúcido com asas de luz.',
    model: 'Sylphid',
    icon: '✨',
    rarity: 'starter',
    price: 0,
    category: 'guardian',
  },
];

// ===== 7 SKINS DA LOJA =====
export const SHOP_SKINS: Skin[] = [
  {
    id: 'terravox',
    name: 'Terravox',
    description: 'Golem de Pedra. Criatura massiva com cristais no peito. Tanque natural!',
    model: 'Terravox',
    icon: '🗿',
    rarity: 'common',
    price: 800,
    category: 'guardian',
  },
  {
    id: 'mirella',
    name: 'Mirella',
    description: 'Criatura Anfíbia. Corpo azul-esverdeado, amigável e equilibrada.',
    model: 'Mirella',
    icon: '🐸',
    rarity: 'common',
    price: 750,
    category: 'guardian',
  },
  {
    id: 'zephyra',
    name: 'Zephyra',
    description: 'Ave de Vento. Plumagem brilhante, esquiva altíssima e muito veloz!',
    model: 'Zephyra',
    icon: '🦅',
    rarity: 'rare',
    price: 1800,
    category: 'guardian',
  },
  {
    id: 'umbrix',
    name: 'Umbrix',
    description: 'Besta Sombria. Coberta por fumaça negra, drena essência dos inimigos.',
    model: 'Umbrix',
    icon: '👁️',
    rarity: 'rare',
    price: 2200,
    category: 'guardian',
  },
  {
    id: 'ignar',
    name: 'Ignar',
    description: 'Fera Ígnea. Crina flamejante, golpes devastadores de fogo!',
    model: 'Ignar',
    icon: '🔥',
    rarity: 'epic',
    price: 3500,
    category: 'guardian',
  },
  {
    id: 'olgrim',
    name: 'Olgrim',
    description: 'Olho Ancestral. Globo ocular flutuante com tentáculos, mestre da magia!',
    model: 'Olgrim',
    icon: '👁️‍🗨️',
    rarity: 'epic',
    price: 4200,
    category: 'guardian',
  },
  {
    id: 'raukor',
    name: 'Raukor',
    description: 'Lobo Ancestral. Pelagem prateada, cicatrizes lunares. O mais poderoso!',
    model: 'Raukor',
    icon: '🐺',
    rarity: 'legendary',
    price: 8000,
    category: 'guardian',
  },
];

export const ALL_SKINS = [...STARTER_SKINS, ...SHOP_SKINS];
