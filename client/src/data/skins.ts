/**
 * Sistema de Skins - Guardian Grove
 * Gerencia todas as skins dos guardiões
 */

export interface Skin {
  id: string;
  name: string;
  description: string;
  model: string; // Nome do arquivo .glb
  icon: string;
  rarity: 'starter' | 'common' | 'rare' | 'epic' | 'legendary';
  price: number; // 0 = grátis/starter
  isOwned: boolean;
  isActive: boolean;
  category: 'guardian' | 'beast' | 'special';
  stats?: {
    speed?: number;
    power?: number;
    defense?: number;
  };
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
    isOwned: true,
    isActive: false,
    category: 'guardian',
    stats: { speed: 8, power: 6, defense: 5 },
  },
  {
    id: 'terramor',
    name: 'Terramor',
    description: 'O guardião da terra, forte e resistente como as montanhas.',
    model: 'Terramor',
    icon: '🐻',
    rarity: 'starter',
    price: 0,
    isOwned: true,
    isActive: false,
    category: 'guardian',
    stats: { speed: 5, power: 8, defense: 9 },
  },
  {
    id: 'aqualis',
    name: 'Aqualis',
    description: 'O guardião das águas, fluido e adaptável como o oceano.',
    model: 'Aqualis',
    icon: '🐚',
    rarity: 'starter',
    price: 0,
    isOwned: true,
    isActive: false,
    category: 'guardian',
    stats: { speed: 7, power: 7, defense: 7 },
  },
];

// ===== SKINS DA LOJA (Premium) =====
export const SHOP_SKINS: Skin[] = [
  // Comuns (500-1000 Coronas)
  {
    id: 'sylvaris',
    name: 'Sylvaris',
    description: 'Espírito da floresta anciã, protetor das árvores sagradas.',
    model: 'Sylvaris',
    icon: '🦌',
    rarity: 'common',
    price: 500,
    isOwned: false,
    isActive: false,
    category: 'guardian',
    stats: { speed: 7, power: 6, defense: 6 },
  },
  {
    id: 'ignatius',
    name: 'Ignatius',
    description: 'Guardião das chamas, traz o calor do sol para o Grove.',
    model: 'Ignatius',
    icon: '🔥',
    rarity: 'common',
    price: 750,
    isOwned: false,
    isActive: false,
    category: 'guardian',
    stats: { speed: 8, power: 9, defense: 4 },
  },
  
  // Raros (1500-2500 Coronas)
  {
    id: 'lumina',
    name: 'Lumina',
    description: 'Ser de luz pura, ilumina os caminhos mais escuros.',
    model: 'Lumina',
    icon: '✨',
    rarity: 'rare',
    price: 1500,
    isOwned: false,
    isActive: false,
    category: 'special',
    stats: { speed: 9, power: 7, defense: 6 },
  },
  {
    id: 'umbra',
    name: 'Umbra',
    description: 'Guardião das sombras, protetor da noite e dos sonhos.',
    model: 'Umbra',
    icon: '🌙',
    rarity: 'rare',
    price: 2000,
    isOwned: false,
    isActive: false,
    category: 'special',
    stats: { speed: 10, power: 6, defense: 5 },
  },
  {
    id: 'glacius',
    name: 'Glacius',
    description: 'Senhor do gelo, traz o inverno para o santuário.',
    model: 'Glacius',
    icon: '❄️',
    rarity: 'rare',
    price: 2500,
    isOwned: false,
    isActive: false,
    category: 'guardian',
    stats: { speed: 6, power: 8, defense: 8 },
  },
  
  // Épicas (3000-5000 Coronas)
  {
    id: 'tempestus',
    name: 'Tempestus',
    description: 'Mestre das tempestades, controla ventos e trovões.',
    model: 'Tempestus',
    icon: '⚡',
    rarity: 'epic',
    price: 3500,
    isOwned: false,
    isActive: false,
    category: 'guardian',
    stats: { speed: 9, power: 9, defense: 6 },
  },
  {
    id: 'verdantis',
    name: 'Verdantis',
    description: 'Guardião ancestral da natureza, faz plantas crescerem.',
    model: 'Verdantis',
    icon: '🌿',
    rarity: 'epic',
    price: 4000,
    isOwned: false,
    isActive: false,
    category: 'special',
    stats: { speed: 6, power: 8, defense: 9 },
  },
  
  // Lendárias (7500-10000 Coronas)
  {
    id: 'celestia',
    name: 'Celestia',
    description: 'Guardião celestial, desceu dos céus para proteger o Grove.',
    model: 'Celestia',
    icon: '🌟',
    rarity: 'legendary',
    price: 7500,
    isOwned: false,
    isActive: false,
    category: 'special',
    stats: { speed: 10, power: 10, defense: 8 },
  },
  {
    id: 'chronos',
    name: 'Chronos',
    description: 'Guardião do tempo, pode ver passado e futuro.',
    model: 'Chronos',
    icon: '⏳',
    rarity: 'legendary',
    price: 10000,
    isOwned: false,
    isActive: false,
    category: 'special',
    stats: { speed: 10, power: 9, defense: 10 },
  },
];

export const ALL_SKINS = [...STARTER_SKINS, ...SHOP_SKINS];

// ===== STATE MANAGEMENT =====

export interface SkinState {
  ownedSkins: string[]; // IDs das skins que o jogador possui
  activeSkinId: string; // ID da skin ativa
  totalSpent: number; // Total gasto em skins
}

export function getDefaultSkinState(): SkinState {
  return {
    ownedSkins: STARTER_SKINS.map(s => s.id), // Começa com as 3 básicas
    activeSkinId: 'feralis', // Feralis é o padrão
    totalSpent: 0,
  };
}

export function getSkinState(): SkinState {
  const saved = localStorage.getItem('guardian_grove_skins');
  
  if (saved) {
    return JSON.parse(saved);
  }
  
  return getDefaultSkinState();
}

export function saveSkinState(state: SkinState) {
  localStorage.setItem('guardian_grove_skins', JSON.stringify(state));
}

export function getAvailableSkins(): Skin[] {
  const state = getSkinState();
  
  return ALL_SKINS.map(skin => ({
    ...skin,
    isOwned: state.ownedSkins.includes(skin.id),
    isActive: skin.id === state.activeSkinId,
  }));
}

export function getActiveSkin(): Skin {
  const state = getSkinState();
  const skin = ALL_SKINS.find(s => s.id === state.activeSkinId);
  
  return skin ? { ...skin, isOwned: true, isActive: true } : STARTER_SKINS[0];
}

export function setActiveSkin(skinId: string): boolean {
  const state = getSkinState();
  
  // Verifica se o jogador possui a skin
  if (!state.ownedSkins.includes(skinId)) {
    return false;
  }
  
  state.activeSkinId = skinId;
  saveSkinState(state);
  
  console.log(`[SKINS] ✅ Skin ativa alterada para: ${skinId}`);
  return true;
}

export function purchaseSkin(skinId: string, currentCoronas: number): { success: boolean; newBalance?: number; message: string } {
  const state = getSkinState();
  const skin = ALL_SKINS.find(s => s.id === skinId);
  
  if (!skin) {
    return { success: false, message: 'Skin não encontrada!' };
  }
  
  if (state.ownedSkins.includes(skinId)) {
    return { success: false, message: 'Você já possui esta skin!' };
  }
  
  if (currentCoronas < skin.price) {
    return { success: false, message: `Coronas insuficientes! Faltam ${skin.price - currentCoronas}` };
  }
  
  // Compra bem-sucedida
  state.ownedSkins.push(skinId);
  state.totalSpent += skin.price;
  saveSkinState(state);
  
  console.log(`[SKINS] 🛒 Skin comprada: ${skin.name} por ${skin.price} Coronas`);
  
  return {
    success: true,
    newBalance: currentCoronas - skin.price,
    message: `${skin.name} adquirida com sucesso!`,
  };
}

export function getRarityColor(rarity: Skin['rarity']): string {
  switch (rarity) {
    case 'starter': return '#B7DDCD';
    case 'common': return '#B7DDCD';
    case 'rare': return '#6DC7A4';
    case 'epic': return '#FFC857';
    case 'legendary': return '#FFD700';
  }
}

export function getRarityName(rarity: Skin['rarity']): string {
  switch (rarity) {
    case 'starter': return 'Inicial';
    case 'common': return 'Comum';
    case 'rare': return 'Raro';
    case 'epic': return 'Épico';
    case 'legendary': return 'Lendário';
  }
}

// ===== FALLBACK PARA MODELOS FALTANTES =====
// Se um modelo .glb não existir, usa o Feralis como fallback
export function getSkinModelPath(skinId: string): string {
  const skin = ALL_SKINS.find(s => s.id === skinId);
  if (!skin) return '/assets/3d/beasts/Feralis';
  
  // Por enquanto, todos usam Feralis como base
  // Quando adicionar novos modelos, atualizar aqui
  return `/assets/3d/beasts/${skin.model}`;
}

