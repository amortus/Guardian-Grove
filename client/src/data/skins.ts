/**
 * Sistema de Skins - Guardian Grove
 * Usa as 10 beasts reais do jogo
 */

export interface Skin {
  id: string;
  name: string;
  description: string;
  model: string; // Nome do arquivo .glb (nome da beast)
  icon: string;
  rarity: 'starter' | 'common' | 'rare' | 'epic' | 'legendary';
  price: number; // 0 = grátis/starter
  isOwned: boolean;
  isActive: boolean;
  category: 'guardian';
  affinity: string; // Ex: "earth", "fire", etc
}

// ===== 3 SKINS INICIAIS (Escolha no início do jogo) =====
export const STARTER_SKINS: Skin[] = [
  {
    id: 'brontis',
    name: 'Brontis',
    description: 'Réptil Colosso. Lagarto bípede robusto com escamas verdes. Ótimo para iniciantes!',
    model: 'Brontis',
    icon: '🦎',
    rarity: 'starter',
    price: 0,
    isOwned: true,
    isActive: false,
    category: 'guardian',
    affinity: 'earth/fire',
  },
  {
    id: 'feralis',
    name: 'Feralis',
    description: 'Felino Selvagem. Ágil e veloz, perfeito para ataques críticos rápidos.',
    model: 'Feralis',
    icon: '🐺',
    rarity: 'starter',
    price: 0,
    isOwned: true,
    isActive: false,
    category: 'guardian',
    affinity: 'air',
  },
  {
    id: 'sylphid',
    name: 'Sylphid',
    description: 'Espírito Etéreo. Especialista em magia, corpo translúcido com asas de luz.',
    model: 'Sylphid',
    icon: '✨',
    rarity: 'starter',
    price: 0,
    isOwned: true,
    isActive: false,
    category: 'guardian',
    affinity: 'light/ether',
  },
];

// ===== 7 SKINS DA LOJA (Premium) =====
export const SHOP_SKINS: Skin[] = [
  // Comuns (500-1000 Coronas)
  {
    id: 'terravox',
    name: 'Terravox',
    description: 'Golem de Pedra. Criatura massiva com cristais no peito. Tanque natural!',
    model: 'Terravox',
    icon: '🗿',
    rarity: 'common',
    price: 800,
    isOwned: false,
    isActive: false,
    category: 'guardian',
    affinity: 'earth',
  },
  {
    id: 'mirella',
    name: 'Mirella',
    description: 'Criatura Anfíbia. Corpo azul-esverdeado, amigável e equilibrada.',
    model: 'Mirella',
    icon: '🐸',
    rarity: 'common',
    price: 750,
    isOwned: false,
    isActive: false,
    category: 'guardian',
    affinity: 'water',
  },
  
  // Raros (1500-2500 Coronas)
  {
    id: 'zephyra',
    name: 'Zephyra',
    description: 'Ave de Vento. Plumagem brilhante, esquiva altíssima e muito veloz!',
    model: 'Zephyra',
    icon: '🦅',
    rarity: 'rare',
    price: 1800,
    isOwned: false,
    isActive: false,
    category: 'guardian',
    affinity: 'air',
  },
  {
    id: 'umbrix',
    name: 'Umbrix',
    description: 'Besta Sombria. Coberta por fumaça negra, drena essência dos inimigos.',
    model: 'Umbrix',
    icon: '👁️',
    rarity: 'rare',
    price: 2200,
    isOwned: false,
    isActive: false,
    category: 'guardian',
    affinity: 'shadow',
  },
  
  // Épicas (3000-5000 Coronas)
  {
    id: 'ignar',
    name: 'Ignar',
    description: 'Fera Ígnea. Crina flamejante, golpes devastadores de fogo!',
    model: 'Ignar',
    icon: '🔥',
    rarity: 'epic',
    price: 3500,
    isOwned: false,
    isActive: false,
    category: 'guardian',
    affinity: 'fire',
  },
  {
    id: 'olgrim',
    name: 'Olgrim',
    description: 'Olho Ancestral. Globo ocular flutuante com tentáculos, mestre da magia!',
    model: 'Olgrim',
    icon: '👁️‍🗨️',
    rarity: 'epic',
    price: 4200,
    isOwned: false,
    isActive: false,
    category: 'guardian',
    affinity: 'shadow/ether',
  },
  
  // Lendárias (7500+ Coronas)
  {
    id: 'raukor',
    name: 'Raukor',
    description: 'Lobo Ancestral. Pelagem prateada, cicatrizes lunares. O mais poderoso!',
    model: 'Raukor',
    icon: '🐺',
    rarity: 'legendary',
    price: 8000,
    isOwned: false,
    isActive: false,
    category: 'guardian',
    affinity: 'moon/blood',
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
    activeSkinId: 'brontis', // Brontis é o padrão
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
  
  // Usa o nome da beast como path do modelo
  return `/assets/3d/beasts/${skin.model}`;
}
