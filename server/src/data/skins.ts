/**
 * Skin System Data - Guardian Grove Server
 * Shared skin definitions (server-side copy)
 */

export interface Skin {
  id: string;
  name: string;
  description: string;
  model: string;
  icon: string;
  rarity: 'starter' | 'common' | 'rare' | 'epic' | 'legendary';
  price: number;
  category: 'guardian' | 'beast' | 'special';
}

// ===== SKINS INICIAIS (3 Guardiões Básicos) =====
export const STARTER_SKINS: Skin[] = [
  {
    id: 'feralis',
    name: 'Feralis',
    description: 'O guardião da floresta, ágil e veloz como o vento.',
    model: 'Feralis',
    icon: '🐺',
    rarity: 'starter',
    price: 0,
    category: 'guardian',
  },
  {
    id: 'terramor',
    name: 'Terramor',
    description: 'O guardião da terra, forte e resistente como as montanhas.',
    model: 'Terramor',
    icon: '🐻',
    rarity: 'starter',
    price: 0,
    category: 'guardian',
  },
  {
    id: 'aqualis',
    name: 'Aqualis',
    description: 'O guardião das águas, fluido e adaptável como o oceano.',
    model: 'Aqualis',
    icon: '🐚',
    rarity: 'starter',
    price: 0,
    category: 'guardian',
  },
];

// ===== SKINS DA LOJA (Premium) =====
export const SHOP_SKINS: Skin[] = [
  {
    id: 'sylvaris',
    name: 'Sylvaris',
    description: 'Espírito da floresta anciã, protetor das árvores sagradas.',
    model: 'Sylvaris',
    icon: '🦌',
    rarity: 'common',
    price: 500,
    category: 'guardian',
  },
  {
    id: 'ignatius',
    name: 'Ignatius',
    description: 'Guardião das chamas, traz o calor do sol para o Grove.',
    model: 'Ignatius',
    icon: '🔥',
    rarity: 'common',
    price: 750,
    category: 'guardian',
  },
  {
    id: 'lumina',
    name: 'Lumina',
    description: 'Ser de luz pura, ilumina os caminhos mais escuros.',
    model: 'Lumina',
    icon: '✨',
    rarity: 'rare',
    price: 1500,
    category: 'special',
  },
  {
    id: 'umbra',
    name: 'Umbra',
    description: 'Guardião das sombras, protetor da noite e dos sonhos.',
    model: 'Umbra',
    icon: '🌙',
    rarity: 'rare',
    price: 2000,
    category: 'special',
  },
  {
    id: 'glacius',
    name: 'Glacius',
    description: 'Senhor do gelo, traz o inverno para o santuário.',
    model: 'Glacius',
    icon: '❄️',
    rarity: 'rare',
    price: 2500,
    category: 'guardian',
  },
  {
    id: 'tempestus',
    name: 'Tempestus',
    description: 'Mestre das tempestades, controla ventos e trovões.',
    model: 'Tempestus',
    icon: '⚡',
    rarity: 'epic',
    price: 3500,
    category: 'guardian',
  },
  {
    id: 'verdantis',
    name: 'Verdantis',
    description: 'Guardião ancestral da natureza, faz plantas crescerem.',
    model: 'Verdantis',
    icon: '🌿',
    rarity: 'epic',
    price: 4000,
    category: 'special',
  },
  {
    id: 'celestia',
    name: 'Celestia',
    description: 'Guardião celestial, desceu dos céus para proteger o Grove.',
    model: 'Celestia',
    icon: '🌟',
    rarity: 'legendary',
    price: 7500,
    category: 'special',
  },
  {
    id: 'chronos',
    name: 'Chronos',
    description: 'Guardião do tempo, pode ver passado e futuro.',
    model: 'Chronos',
    icon: '⏳',
    rarity: 'legendary',
    price: 10000,
    category: 'special',
  },
];

export const ALL_SKINS = [...STARTER_SKINS, ...SHOP_SKINS];

