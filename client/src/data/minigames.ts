/**
 * Mini-Games Educativos - Guardian Grove
 */

// ===== JOGO DA MEMÓRIA ECOLÓGICA =====

export interface MemoryCard {
  id: string;
  icon: string;
  name: string;
  category: 'sustentabilidade' | 'reciclagem' | 'energia' | 'natureza';
  educationalTip: string;
  theme?: string;
}

export type CardTheme = 'default' | 'water' | 'forest' | 'energy';

export const MEMORY_CARDS: MemoryCard[] = [
  // Sustentabilidade
  { id: 'water', icon: '💧', name: 'Água', category: 'sustentabilidade', educationalTip: 'Feche a torneira ao escovar os dentes!' },
  { id: 'tree', icon: '🌳', name: 'Árvore', category: 'natureza', educationalTip: 'Árvores produzem oxigênio e filtram o ar!' },
  { id: 'recycle', icon: '♻️', name: 'Reciclagem', category: 'reciclagem', educationalTip: 'Separe o lixo para reciclagem!' },
  { id: 'solar', icon: '☀️', name: 'Energia Solar', category: 'energia', educationalTip: 'Energia solar é limpa e renovável!' },
  { id: 'bike', icon: '🚲', name: 'Bicicleta', category: 'sustentabilidade', educationalTip: 'Use bicicleta para reduzir poluição!' },
  { id: 'plant', icon: '🌱', name: 'Planta', category: 'natureza', educationalTip: 'Plantas tornam o ar mais limpo!' },
  { id: 'wind', icon: '💨', name: 'Energia Eólica', category: 'energia', educationalTip: 'Vento gera energia limpa!' },
  { id: 'compost', icon: '🍂', name: 'Compostagem', category: 'reciclagem', educationalTip: 'Transforme restos orgânicos em adubo!' },
  { id: 'earth', icon: '🌍', name: 'Planeta', category: 'natureza', educationalTip: 'Cuide do nosso planeta!' },
  { id: 'bag', icon: '🛍️', name: 'Sacola Reutilizável', category: 'sustentabilidade', educationalTip: 'Evite sacolas plásticas!' },
  { id: 'flower', icon: '🌸', name: 'Flor', category: 'natureza', educationalTip: 'Flores ajudam na polinização!' },
  { id: 'led', icon: '💡', name: 'LED', category: 'energia', educationalTip: 'Lâmpadas LED economizam energia!' },
];

export interface MemoryGameState {
  cards: Array<{ card: MemoryCard; isFlipped: boolean; isMatched: boolean; position: number }>;
  flippedCards: number[];
  matchedPairs: number;
  moves: number;
  timeElapsed: number;
  isComplete: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
}

// Temas de cartas
export const CARD_THEMES: Record<CardTheme, { name: string; icon: string; cards: MemoryCard[] }> = {
  default: {
    name: 'Todas as Categorias',
    icon: '🌍',
    cards: MEMORY_CARDS,
  },
  water: {
    name: 'Água e Vida',
    icon: '💧',
    cards: MEMORY_CARDS.filter(c => ['water', 'compost', 'plant', 'flower', 'earth', 'tree'].includes(c.id)),
  },
  forest: {
    name: 'Floresta',
    icon: '🌳',
    cards: MEMORY_CARDS.filter(c => ['tree', 'plant', 'flower', 'earth', 'leaf', 'compost'].includes(c.id)),
  },
  energy: {
    name: 'Energia Limpa',
    icon: '⚡',
    cards: MEMORY_CARDS.filter(c => ['solar', 'wind', 'led', 'bike', 'bag', 'recycle'].includes(c.id)),
  },
};

export function initMemoryGame(difficulty: 'easy' | 'medium' | 'hard', theme: CardTheme = 'default'): MemoryGameState {
  const pairCount = difficulty === 'easy' ? 6 : difficulty === 'medium' ? 8 : 12;
  const themeCards = CARD_THEMES[theme].cards;
  
  // Se o tema não tem cartas suficientes, usa todas
  const availableCards = themeCards.length >= pairCount ? themeCards : MEMORY_CARDS;
  const selectedCards = availableCards.slice(0, pairCount);
  
  // Duplica e embaralha
  const duplicatedCards = [...selectedCards, ...selectedCards];
  const shuffled = duplicatedCards
    .map((card, index) => ({
      card,
      isFlipped: false,
      isMatched: false,
      position: index,
    }))
    .sort(() => Math.random() - 0.5);
  
  return {
    cards: shuffled,
    flippedCards: [],
    matchedPairs: 0,
    moves: 0,
    timeElapsed: 0,
    isComplete: false,
    difficulty,
  };
}

// ===== RECICLA RÁPIDO (Tetris Ecológico) =====

export type RecycleMaterial = 'plastic' | 'paper' | 'metal' | 'glass' | 'organic';

export interface RecyclePiece {
  type: RecycleMaterial;
  icon: string;
  shape: boolean[][]; // Grid 2D da peça
  color: string;
  educationalTip: string;
}

export const RECYCLE_PIECES: RecyclePiece[] = [
  {
    type: 'plastic',
    icon: '🥤',
    shape: [[true, true], [true, true]], // Quadrado
    color: '#FF6B6B',
    educationalTip: 'Plástico leva 400 anos para se degradar!',
  },
  {
    type: 'paper',
    icon: '📄',
    shape: [[true], [true], [true], [true]], // Linha vertical
    color: '#4ECDC4',
    educationalTip: 'Recicle papel para salvar árvores!',
  },
  {
    type: 'metal',
    icon: '🥫',
    shape: [[true, true, true], [false, true, false]], // T
    color: '#95E1D3',
    educationalTip: 'Metal pode ser reciclado infinitamente!',
  },
  {
    type: 'glass',
    icon: '🍾',
    shape: [[true, true], [true, false]], // L
    color: '#F38181',
    educationalTip: 'Vidro é 100% reciclável!',
  },
  {
    type: 'organic',
    icon: '🍎',
    shape: [[true, true, true]], // Linha horizontal
    color: '#A8E6CF',
    educationalTip: 'Resíduos orgânicos viram adubo!',
  },
];

export interface RecycleGameState {
  grid: (RecycleMaterial | null)[][];
  currentPiece: RecyclePiece | null;
  currentPosition: { x: number; y: number };
  score: number;
  linesCleared: number;
  level: number;
  gameOver: boolean;
  nextPiece: RecyclePiece | null;
}

export function initRecycleGame(): RecycleGameState {
  const grid = Array(20).fill(null).map(() => Array(10).fill(null));
  
  return {
    grid,
    currentPiece: RECYCLE_PIECES[Math.floor(Math.random() * RECYCLE_PIECES.length)],
    currentPosition: { x: 4, y: 0 },
    score: 0,
    linesCleared: 0,
    level: 1,
    gameOver: false,
    nextPiece: RECYCLE_PIECES[Math.floor(Math.random() * RECYCLE_PIECES.length)],
  };
}

// ===== PLANTA & COMBINA (Match-3) =====

export type PlantType = 'tree' | 'flower' | 'leaf' | 'seed' | 'fruit';

export interface PlantTile {
  type: PlantType;
  icon: string;
  color: string;
  educationalTip: string;
}

export const PLANT_TILES: PlantTile[] = [
  { type: 'tree', icon: '🌳', color: '#2D5016', educationalTip: 'Árvores absorvem CO2!' },
  { type: 'flower', icon: '🌸', color: '#FF69B4', educationalTip: 'Flores atraem polinizadores!' },
  { type: 'leaf', icon: '🍃', color: '#90EE90', educationalTip: 'Folhas fazem fotossíntese!' },
  { type: 'seed', icon: '🌰', color: '#8B4513', educationalTip: 'Sementes geram novas plantas!' },
  { type: 'fruit', icon: '🍎', color: '#FF0000', educationalTip: 'Frutas alimentam animais!' },
];

export interface Match3GameState {
  grid: (PlantTile | null)[][];
  selectedTile: { x: number; y: number } | null;
  score: number;
  moves: number;
  targetScore: number;
  isComplete: boolean;
  combos: number;
}

export function initMatch3Game(): Match3GameState {
  const grid: (PlantTile | null)[][] = Array(8).fill(null).map(() =>
    Array(8).fill(null).map(() => PLANT_TILES[Math.floor(Math.random() * PLANT_TILES.length)])
  );
  
  // Remove matches iniciais
  removeInitialMatches(grid);
  
  return {
    grid,
    selectedTile: null,
    score: 0,
    moves: 30,
    targetScore: 1000,
    isComplete: false,
    combos: 0,
  };
}

function removeInitialMatches(grid: (PlantTile | null)[][]) {
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      if (x >= 2) {
        while (grid[y][x]?.type === grid[y][x - 1]?.type && grid[y][x]?.type === grid[y][x - 2]?.type) {
          grid[y][x] = PLANT_TILES[Math.floor(Math.random() * PLANT_TILES.length)];
        }
      }
      if (y >= 2) {
        while (grid[y][x]?.type === grid[y - 1][x]?.type && grid[y][x]?.type === grid[y - 2][x]?.type) {
          grid[y][x] = PLANT_TILES[Math.floor(Math.random() * PLANT_TILES.length)];
        }
      }
    }
  }
}

// ===== RECOMPENSAS =====

export interface MinigameReward {
  coronas: number;
  xp: number;
  virtueGain: {
    sustainability?: number;
    empathy?: number;
    knowledge?: number;
    creativity?: number;
  };
}

export function calculateMemoryReward(state: MemoryGameState): MinigameReward {
  const baseReward = state.difficulty === 'easy' ? 100 : state.difficulty === 'medium' ? 200 : 300;
  const moveBonus = Math.max(0, 100 - state.moves * 2);
  const timeBonus = Math.max(0, 200 - state.timeElapsed);
  
  return {
    coronas: baseReward + moveBonus + timeBonus,
    xp: 50 * (state.difficulty === 'easy' ? 1 : state.difficulty === 'medium' ? 2 : 3),
    virtueGain: { knowledge: 5 },
  };
}

export function calculateRecycleReward(state: RecycleGameState): MinigameReward {
  return {
    coronas: state.score,
    xp: Math.floor(state.linesCleared * 10),
    virtueGain: { sustainability: Math.floor(state.linesCleared / 2) },
  };
}

export function calculateMatch3Reward(state: Match3GameState): MinigameReward {
  const completion = state.score >= state.targetScore ? 500 : 0;
  
  return {
    coronas: Math.floor(state.score / 10) + completion,
    xp: Math.floor(state.score / 20),
    virtueGain: { creativity: Math.floor(state.combos / 3) },
  };
}

