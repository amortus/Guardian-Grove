/**
 * Catálogo de Decorações para o Rancho
 */

export type DecorationType = 'tree' | 'rock' | 'fountain' | 'statue' | 'flower' | 'fence' | 'path';
export type RanchTheme = 'default' | 'forest' | 'desert' | 'mountain' | 'crystal';

export interface Decoration {
  id: string;
  name: string;
  description: string;
  type: DecorationType;
  icon: string;
  price: number;
  model3D?: string;
  position?: { x: number; y: number; z: number };
  rotation?: number;
  scale?: number;
}

export interface RanchThemeData {
  id: RanchTheme;
  name: string;
  description: string;
  price: number;
  skyColor: string;
  groundTexture: string;
  ambientLight: string;
  unlockRequirement?: string;
}

/**
 * Catálogo de Decorações
 */
export const DECORATION_CATALOG: Decoration[] = [
  // Árvores
  { id: 'tree_oak', name: 'Carvalho', description: 'Árvore robusta', type: 'tree', icon: '🌳', price: 500 },
  { id: 'tree_pine', name: 'Pinheiro', description: 'Árvore alta', type: 'tree', icon: '🌲', price: 600 },
  { id: 'tree_palm', name: 'Palmeira', description: 'Árvore tropical', type: 'tree', icon: '🌴', price: 700 },
  { id: 'tree_cherry', name: 'Cerejeira', description: 'Árvore florida', type: 'tree', icon: '🌸', price: 1000 },
  
  // Pedras
  { id: 'rock_small', name: 'Pedra Pequena', description: 'Pedra decorativa', type: 'rock', icon: '🪨', price: 200 },
  { id: 'rock_large', name: 'Pedra Grande', description: 'Rocha imponente', type: 'rock', icon: '⛰️', price: 400 },
  { id: 'rock_crystal', name: 'Cristal', description: 'Cristal brilhante', type: 'rock', icon: '💎', price: 2000 },
  
  // Fontes
  { id: 'fountain_basic', name: 'Fonte Simples', description: 'Fonte de água', type: 'fountain', icon: '⛲', price: 1500 },
  { id: 'fountain_ornate', name: 'Fonte Ornamentada', description: 'Fonte luxuosa', type: 'fountain', icon: '🪷', price: 3000 },
  
  // Estátuas
  { id: 'statue_guardian', name: 'Estátua de Guardião', description: 'Guardião de pedra', type: 'statue', icon: '🗿', price: 2500 },
  { id: 'statue_beast', name: 'Estátua de Besta', description: 'Homenagem às bestas', type: 'statue', icon: '🦁', price: 5000 },
  { id: 'statue_angel', name: 'Estátua de Anjo', description: 'Anjo celestial', type: 'statue', icon: '👼', price: 8000 },
  
  // Flores
  { id: 'flower_rose', name: 'Rosas', description: 'Flores vermelhas', type: 'flower', icon: '🌹', price: 300 },
  { id: 'flower_tulip', name: 'Tulipas', description: 'Flores coloridas', type: 'flower', icon: '🌷', price: 350 },
  { id: 'flower_sunflower', name: 'Girassóis', description: 'Flores solares', type: 'flower', icon: '🌻', price: 400 },
  
  // Cercas
  { id: 'fence_wood', name: 'Cerca de Madeira', description: 'Cerca simples', type: 'fence', icon: '🪵', price: 100 },
  { id: 'fence_stone', name: 'Cerca de Pedra', description: 'Cerca durável', type: 'fence', icon: '🧱', price: 250 },
  { id: 'fence_iron', name: 'Cerca de Ferro', description: 'Cerca elegante', type: 'fence', icon: '⚔️', price: 500 },
  
  // Caminhos
  { id: 'path_dirt', name: 'Caminho de Terra', description: 'Caminho simples', type: 'path', icon: '🟫', price: 50 },
  { id: 'path_stone', name: 'Caminho de Pedra', description: 'Caminho pavimentado', type: 'path', icon: '⬜', price: 150 },
  { id: 'path_crystal', name: 'Caminho Cristalino', description: 'Caminho brilhante', type: 'path', icon: '💠', price: 500 },
];

/**
 * Temas de Rancho
 */
export const RANCH_THEMES: RanchThemeData[] = [
  {
    id: 'default',
    name: 'Padrão',
    description: 'Tema clássico do rancho',
    price: 0,
    skyColor: '#87CEEB',
    groundTexture: 'grass',
    ambientLight: '#ffffff',
  },
  {
    id: 'forest',
    name: 'Floresta',
    description: 'Rancho em meio à floresta',
    price: 5000,
    skyColor: '#6B8E23',
    groundTexture: 'moss',
    ambientLight: '#90EE90',
    unlockRequirement: 'Complete Floresta Eterna',
  },
  {
    id: 'desert',
    name: 'Deserto',
    description: 'Rancho no deserto',
    price: 8000,
    skyColor: '#FFD700',
    groundTexture: 'sand',
    ambientLight: '#FFFFE0',
    unlockRequirement: 'Complete 50 explorações',
  },
  {
    id: 'mountain',
    name: 'Montanha',
    description: 'Rancho nas montanhas',
    price: 12000,
    skyColor: '#4682B4',
    groundTexture: 'stone',
    ambientLight: '#B0C4DE',
    unlockRequirement: 'Complete Ruínas Antigas',
  },
  {
    id: 'crystal',
    name: 'Cristal',
    description: 'Rancho cristalino místico',
    price: 20000,
    skyColor: '#9370DB',
    groundTexture: 'crystal',
    ambientLight: '#DDA0DD',
    unlockRequirement: 'Complete Abismo Eterno',
  },
];

/**
 * Obtém decoração por ID
 */
export function getDecorationById(id: string): Decoration | undefined {
  return DECORATION_CATALOG.find(d => d.id === id);
}

/**
 * Obtém decorações por tipo
 */
export function getDecorationsByType(type: DecorationType): Decoration[] {
  return DECORATION_CATALOG.filter(d => d.type === type);
}

/**
 * Obtém tema por ID
 */
export function getThemeById(id: RanchTheme): RanchThemeData | undefined {
  return RANCH_THEMES.find(t => t.id === id);
}

