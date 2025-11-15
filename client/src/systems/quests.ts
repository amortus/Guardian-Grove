/**
 * Sistema de Quests/Missões
 * Missões que dão recompensas
 */

import type { GameEvent } from './game-events';
import type { GameState } from '../types';

export interface Quest {
  id: string;
  name: string;
  description: string;
  type: 'battle' | 'training' | 'collection' | 'social';
  goal: QuestGoal;
  rewards: QuestRewards;
  isCompleted: boolean;
  isActive: boolean;
  progress: number;
}

export interface QuestGoal {
  type: 'win_battles' | 'train' | 'rest' | 'work' | 'collect_item' | 'talk_to_npc' | 'reach_level' | 'spend_money' | 
        'exploration_completed' | 'money_accumulated' | 'craft' | 'win_streak' | 'materials_collected' | 'money_from_work' | 'unique_items';
  target: number | string;
  current: number;
}

export interface QuestRewards {
  coronas?: number;
  items?: Array<{ itemId: string; quantity: number }>;
  experience?: number;
  unlockFeature?: string;
}

/**
 * Quests Disponíveis
 */
const LEGACY_QUESTS: Quest[] = [
  // Quests Iniciantes
  {
    id: 'first_victory',
    name: 'Primeira Vitória',
    description: 'Ganhe sua primeira batalha em um torneio',
    type: 'battle',
    goal: { type: 'win_battles', target: 1, current: 0 },
    rewards: {
      coronas: 200,
      items: [{ itemId: 'premium_food', quantity: 2 }],
    },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },
  {
    id: 'first_training',
    name: 'Treinamento Básico',
    description: 'Treine sua besta 3 vezes',
    type: 'training',
    goal: { type: 'train', target: 3, current: 0 },
    rewards: {
      coronas: 150,
      items: [{ itemId: 'training_weights', quantity: 1 }],
    },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },
  {
    id: 'rest_master',
    name: 'Mestre do Descanso',
    description: 'Descanse 5 vezes para cuidar bem da sua besta',
    type: 'training',
    goal: { type: 'rest', target: 5, current: 0 },
    rewards: {
      coronas: 100,
      items: [{ itemId: 'serene_herb', quantity: 3 }],
    },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },

  // Quests Intermediárias
  {
    id: 'silver_champion',
    name: 'Campeão de Prata',
    description: 'Ganhe 5 batalhas em torneios',
    type: 'battle',
    goal: { type: 'win_battles', target: 5, current: 0 },
    rewards: {
      coronas: 500,
      items: [
        { itemId: 'echo_crystal', quantity: 1 },
        { itemId: 'healing_herb', quantity: 2 },
      ],
    },
    isCompleted: false,
    isActive: false, // Desbloqueia depois da primeira vitória
    progress: 0,
  },
  {
    id: 'social_butterfly',
    name: 'Borboleta Social',
    description: 'Fale com todos os NPCs da vila',
    type: 'social',
    goal: { type: 'talk_to_npc', target: 4, current: 0 },
    rewards: {
      coronas: 300,
      items: [{ itemId: 'vital_fruit', quantity: 5 }],
    },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },
  {
    id: 'big_spender',
    name: 'Grande Gastador',
    description: 'Gaste 1000 Coronas na loja',
    type: 'collection',
    goal: { type: 'spend_money', target: 1000, current: 0 },
    rewards: {
      coronas: 500,
      items: [{ itemId: 'elixir_vitality', quantity: 1 }],
    },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },

  // Quests Avançadas
  {
    id: 'gold_legend',
    name: 'Lenda Dourada',
    description: 'Ganhe 10 batalhas em torneios',
    type: 'battle',
    goal: { type: 'win_battles', target: 10, current: 0 },
    rewards: {
      coronas: 1500,
      items: [
        { itemId: 'legendary_crystal', quantity: 1 },
        { itemId: 'ancient_relic', quantity: 1 },
      ],
    },
    isCompleted: false,
    isActive: false, // Desbloqueia depois de Silver Champion
    progress: 0,
  },
  {
    id: 'master_trainer',
    name: 'Mestre Treinador',
    description: 'Treine sua besta 20 vezes',
    type: 'training',
    goal: { type: 'train', target: 20, current: 0 },
    rewards: {
      coronas: 1000,
      items: [{ itemId: 'master_training_manual', quantity: 1 }],
    },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'relic_collector',
    name: 'Colecionador de Relíquias',
    description: 'Possua 5 relíquias diferentes',
    type: 'collection',
    goal: { type: 'collect_item', target: 5, current: 0 },
    rewards: {
      coronas: 2000,
      items: [{ itemId: 'legendary_relic', quantity: 1 }],
    },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  
  // ===== NOVAS MISSÕES VARIADAS =====
  
  {
    id: 'explorer_rookie',
    name: 'Explorador Novato',
    description: 'Complete 5 explorações',
    type: 'collection',
    goal: { type: 'exploration_completed', target: 5, current: 0 },
    rewards: {
      coronas: 400,
      items: [{ itemId: 'explorer_compass', quantity: 1 }],
    },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },
  
  {
    id: 'explorer_veteran',
    name: 'Explorador Veterano',
    description: 'Complete 25 explorações',
    type: 'collection',
    goal: { type: 'exploration_completed', target: 25, current: 0 },
    rewards: {
      coronas: 1500,
      items: [
        { itemId: 'legendary_map', quantity: 1 },
        { itemId: 'ancient_compass', quantity: 1 },
      ],
    },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  
  {
    id: 'wealth_builder',
    name: 'Construtor de Riquezas',
    description: 'Acumule 5000 Coronas',
    type: 'collection',
    goal: { type: 'money_accumulated', target: 5000, current: 0 },
    rewards: {
      coronas: 1000,
      items: [{ itemId: 'golden_crown', quantity: 1 }],
    },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },
  
  {
    id: 'hardworker',
    name: 'Trabalhador Dedicado',
    description: 'Complete 10 trabalhos',
    type: 'training',
    goal: { type: 'work', target: 10, current: 0 },
    rewards: {
      coronas: 600,
      items: [{ itemId: 'work_certificate', quantity: 1 }],
    },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },
  
  {
    id: 'master_crafter_quest',
    name: 'Artesão Habilidoso',
    description: 'Crafte 15 itens diferentes',
    type: 'collection',
    goal: { type: 'craft', target: 15, current: 0 },
    rewards: {
      coronas: 800,
      items: [
        { itemId: 'master_crafting_kit', quantity: 1 },
        { itemId: 'rare_materials_pack', quantity: 3 },
      ],
    },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },
  
  {
    id: 'relaxation_expert',
    name: 'Especialista em Relaxamento',
    description: 'Descanse 15 vezes',
    type: 'training',
    goal: { type: 'rest', target: 15, current: 0 },
    rewards: {
      coronas: 500,
      items: [
        { itemId: 'meditation_guide', quantity: 1 },
        { itemId: 'serene_herb', quantity: 5 },
      ],
    },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },
  
  {
    id: 'battle_survivor',
    name: 'Sobrevivente de Batalhas',
    description: 'Ganhe 3 batalhas seguidas sem perder',
    type: 'battle',
    goal: { type: 'win_streak', target: 3, current: 0 },
    rewards: {
      coronas: 700,
      items: [{ itemId: 'victory_banner', quantity: 1 }],
    },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },
  
  {
    id: 'material_gatherer',
    name: 'Coletor de Materiais',
    description: 'Colete 50 materiais em explorações',
    type: 'collection',
    goal: { type: 'materials_collected', target: 50, current: 0 },
    rewards: {
      coronas: 600,
      items: [
        { itemId: 'gatherers_bag', quantity: 1 },
        { itemId: 'material_magnet', quantity: 1 },
      ],
    },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },
  
  {
    id: 'big_earner',
    name: 'Grande Faturador',
    description: 'Ganhe 10000 Coronas através de trabalhos',
    type: 'training',
    goal: { type: 'money_from_work', target: 10000, current: 0 },
    rewards: {
      coronas: 2500,
      items: [{ itemId: 'entrepreneurs_medal', quantity: 1 }],
    },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  
  {
    id: 'equipment_collector',
    name: 'Colecionador de Equipamentos',
    description: 'Possua 20 itens diferentes no inventário',
    type: 'collection',
    goal: { type: 'unique_items', target: 20, current: 0 },
    rewards: {
      coronas: 1200,
      items: [{ itemId: 'collectors_vault', quantity: 1 }],
    },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },
  
  // ===== MISSÕES ADICIONAIS (50+ NOVAS) =====
  
  // === BATALHA (10 missões) ===
  {
    id: 'battle_initiate',
    name: 'Iniciante nas Batalhas',
    description: 'Vença 2 batalhas',
    type: 'battle',
    goal: { type: 'win_battles', target: 2, current: 0 },
    rewards: { coronas: 250 },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },
  {
    id: 'battle_bronze',
    name: 'Bronze em Batalhas',
    description: 'Vença 15 batalhas',
    type: 'battle',
    goal: { type: 'win_battles', target: 15, current: 0 },
    rewards: { coronas: 1200, items: [{ itemId: 'bronze_medal', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'battle_master',
    name: 'Mestre das Batalhas',
    description: 'Vença 50 batalhas',
    type: 'battle',
    goal: { type: 'win_battles', target: 50, current: 0 },
    rewards: { coronas: 3500, items: [{ itemId: 'battle_master_trophy', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'battle_legend',
    name: 'Lenda das Batalhas',
    description: 'Vença 100 batalhas',
    type: 'battle',
    goal: { type: 'win_battles', target: 100, current: 0 },
    rewards: { coronas: 8000, items: [{ itemId: 'legendary_warrior_crown', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'undefeated_warrior',
    name: 'Guerreiro Invicto',
    description: 'Ganhe 5 batalhas seguidas',
    type: 'battle',
    goal: { type: 'win_streak', target: 5, current: 0 },
    rewards: { coronas: 1000, items: [{ itemId: 'undefeated_shield', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'perfect_streak',
    name: 'Sequência Perfeita',
    description: 'Ganhe 10 batalhas seguidas',
    type: 'battle',
    goal: { type: 'win_streak', target: 10, current: 0 },
    rewards: { coronas: 2500, items: [{ itemId: 'perfect_streak_banner', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  
  // === TREINO (10 missões) ===
  {
    id: 'training_beginner',
    name: 'Treinamento Iniciante',
    description: 'Treine 5 vezes',
    type: 'training',
    goal: { type: 'train', target: 5, current: 0 },
    rewards: { coronas: 200 },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },
  {
    id: 'training_intermediate',
    name: 'Treinamento Intermediário',
    description: 'Treine 10 vezes',
    type: 'training',
    goal: { type: 'train', target: 10, current: 0 },
    rewards: { coronas: 450, items: [{ itemId: 'training_manual', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'training_advanced',
    name: 'Treinamento Avançado',
    description: 'Treine 50 vezes',
    type: 'training',
    goal: { type: 'train', target: 50, current: 0 },
    rewards: { coronas: 2000, items: [{ itemId: 'advanced_training_manual', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'training_legend',
    name: 'Lenda do Treino',
    description: 'Treine 100 vezes',
    type: 'training',
    goal: { type: 'train', target: 100, current: 0 },
    rewards: { coronas: 5000, items: [{ itemId: 'legendary_training_tome', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  
  // === TRABALHO (8 missões) ===
  {
    id: 'worker_apprentice',
    name: 'Aprendiz de Trabalho',
    description: 'Complete 5 trabalhos',
    type: 'training',
    goal: { type: 'work', target: 5, current: 0 },
    rewards: { coronas: 350 },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },
  {
    id: 'worker_professional',
    name: 'Trabalhador Profissional',
    description: 'Complete 25 trabalhos',
    type: 'training',
    goal: { type: 'work', target: 25, current: 0 },
    rewards: { coronas: 1800, items: [{ itemId: 'professional_certificate', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'worker_elite',
    name: 'Trabalhador Elite',
    description: 'Complete 50 trabalhos',
    type: 'training',
    goal: { type: 'work', target: 50, current: 0 },
    rewards: { coronas: 4000, items: [{ itemId: 'elite_work_badge', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'millionaire_worker',
    name: 'Trabalhador Milionário',
    description: 'Ganhe 25000 Coronas através de trabalhos',
    type: 'training',
    goal: { type: 'money_from_work', target: 25000, current: 0 },
    rewards: { coronas: 5000, items: [{ itemId: 'millionaire_trophy', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  
  // === DESCANSO (8 missões) ===
  {
    id: 'rest_beginner',
    name: 'Descanso Iniciante',
    description: 'Descanse 3 vezes',
    type: 'training',
    goal: { type: 'rest', target: 3, current: 0 },
    rewards: { coronas: 80 },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },
  {
    id: 'rest_intermediate',
    name: 'Descanso Intermediário',
    description: 'Descanse 10 vezes',
    type: 'training',
    goal: { type: 'rest', target: 10, current: 0 },
    rewards: { coronas: 350, items: [{ itemId: 'relaxation_guide', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'rest_master',
    name: 'Mestre do Relaxamento',
    description: 'Descanse 30 vezes',
    type: 'training',
    goal: { type: 'rest', target: 30, current: 0 },
    rewards: { coronas: 1200, items: [{ itemId: 'master_relaxation_kit', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'zen_master',
    name: 'Mestre Zen',
    description: 'Descanse 100 vezes',
    type: 'training',
    goal: { type: 'rest', target: 100, current: 0 },
    rewards: { coronas: 4000, items: [{ itemId: 'zen_meditation_stone', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  
  // === EXPLORAÇÃO (12 missões) ===
  {
    id: 'explorer_beginner',
    name: 'Explorador Iniciante',
    description: 'Complete 3 explorações',
    type: 'collection',
    goal: { type: 'exploration_completed', target: 3, current: 0 },
    rewards: { coronas: 250 },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },
  {
    id: 'explorer_intermediate',
    name: 'Explorador Intermediário',
    description: 'Complete 10 explorações',
    type: 'collection',
    goal: { type: 'exploration_completed', target: 10, current: 0 },
    rewards: { coronas: 700, items: [{ itemId: 'explorer_map', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'explorer_advanced',
    name: 'Explorador Avançado',
    description: 'Complete 50 explorações',
    type: 'collection',
    goal: { type: 'exploration_completed', target: 50, current: 0 },
    rewards: { coronas: 3000, items: [{ itemId: 'advanced_compass', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'explorer_legend',
    name: 'Lenda da Exploração',
    description: 'Complete 100 explorações',
    type: 'collection',
    goal: { type: 'exploration_completed', target: 100, current: 0 },
    rewards: { coronas: 7000, items: [{ itemId: 'legendary_explorer_crown', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'material_hunter',
    name: 'Caçador de Materiais',
    description: 'Colete 100 materiais',
    type: 'collection',
    goal: { type: 'materials_collected', target: 100, current: 0 },
    rewards: { coronas: 900, items: [{ itemId: 'hunters_pack', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'material_expert',
    name: 'Especialista em Materiais',
    description: 'Colete 250 materiais',
    type: 'collection',
    goal: { type: 'materials_collected', target: 250, current: 0 },
    rewards: { coronas: 2500, items: [{ itemId: 'expert_gatherer_bag', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'material_master',
    name: 'Mestre dos Materiais',
    description: 'Colete 500 materiais',
    type: 'collection',
    goal: { type: 'materials_collected', target: 500, current: 0 },
    rewards: { coronas: 5500, items: [{ itemId: 'master_material_vacuum', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  
  // === CRAFT (8 missões) ===
  {
    id: 'crafter_beginner',
    name: 'Artesão Iniciante',
    description: 'Crafte 5 itens',
    type: 'collection',
    goal: { type: 'craft', target: 5, current: 0 },
    rewards: { coronas: 300 },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },
  {
    id: 'crafter_intermediate',
    name: 'Artesão Intermediário',
    description: 'Crafte 20 itens',
    type: 'collection',
    goal: { type: 'craft', target: 20, current: 0 },
    rewards: { coronas: 950, items: [{ itemId: 'intermediate_crafting_tools', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'crafter_advanced',
    name: 'Artesão Avançado',
    description: 'Crafte 40 itens',
    type: 'collection',
    goal: { type: 'craft', target: 40, current: 0 },
    rewards: { coronas: 2800, items: [{ itemId: 'advanced_crafting_station', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'crafter_legend',
    name: 'Lenda do Craft',
    description: 'Crafte 100 itens',
    type: 'collection',
    goal: { type: 'craft', target: 100, current: 0 },
    rewards: { coronas: 7500, items: [{ itemId: 'legendary_crafters_hammer', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  
  // === ECONOMIA (10 missões) ===
  {
    id: 'first_coins',
    name: 'Primeiras Moedas',
    description: 'Acumule 1000 Coronas',
    type: 'collection',
    goal: { type: 'money_accumulated', target: 1000, current: 0 },
    rewards: { coronas: 200 },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },
  {
    id: 'small_fortune',
    name: 'Pequena Fortuna',
    description: 'Acumule 10000 Coronas',
    type: 'collection',
    goal: { type: 'money_accumulated', target: 10000, current: 0 },
    rewards: { coronas: 2000, items: [{ itemId: 'fortune_pouch', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'wealthy_guardian',
    name: 'Guardião Abastado',
    description: 'Acumule 25000 Coronas',
    type: 'collection',
    goal: { type: 'money_accumulated', target: 25000, current: 0 },
    rewards: { coronas: 5000, items: [{ itemId: 'wealthy_crown', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'millionaire',
    name: 'Milionário',
    description: 'Acumule 50000 Coronas',
    type: 'collection',
    goal: { type: 'money_accumulated', target: 50000, current: 0 },
    rewards: { coronas: 10000, items: [{ itemId: 'millionaire_treasure', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'moderate_spender',
    name: 'Gastador Moderado',
    description: 'Gaste 2500 Coronas',
    type: 'collection',
    goal: { type: 'spend_money', target: 2500, current: 0 },
    rewards: { coronas: 600 },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'big_shopper',
    name: 'Grande Comprador',
    description: 'Gaste 10000 Coronas',
    type: 'collection',
    goal: { type: 'spend_money', target: 10000, current: 0 },
    rewards: { coronas: 2500, items: [{ itemId: 'shopping_badge', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'shopping_king',
    name: 'Rei das Compras',
    description: 'Gaste 25000 Coronas',
    type: 'collection',
    goal: { type: 'spend_money', target: 25000, current: 0 },
    rewards: { coronas: 6000, items: [{ itemId: 'shopping_king_card', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  
  // === SOCIAL (5 missões) ===
  {
    id: 'friendly_guardian',
    name: 'Guardião Amigável',
    description: 'Fale com 2 NPCs diferentes',
    type: 'social',
    goal: { type: 'talk_to_npc', target: 2, current: 0 },
    rewards: { coronas: 150 },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },
  {
    id: 'village_friend',
    name: 'Amigo da Vila',
    description: 'Fale com todos os 4 NPCs',
    type: 'social',
    goal: { type: 'talk_to_npc', target: 4, current: 0 },
    rewards: { coronas: 400, items: [{ itemId: 'friendship_medal', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'social_expert',
    name: 'Especialista Social',
    description: 'Fale com NPCs 20 vezes',
    type: 'social',
    goal: { type: 'talk_to_npc', target: 20, current: 0 },
    rewards: { coronas: 1500, items: [{ itemId: 'social_expert_pin', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  
  // === COLEÇÃO & INVENTÁRIO (12 missões) ===
  {
    id: 'hoarder_beginner',
    name: 'Colecionador Iniciante',
    description: 'Possua 10 itens diferentes',
    type: 'collection',
    goal: { type: 'unique_items', target: 10, current: 0 },
    rewards: { coronas: 400 },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },
  {
    id: 'hoarder_intermediate',
    name: 'Colecionador Intermediário',
    description: 'Possua 30 itens diferentes',
    type: 'collection',
    goal: { type: 'unique_items', target: 30, current: 0 },
    rewards: { coronas: 1500, items: [{ itemId: 'collection_display', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'hoarder_master',
    name: 'Mestre Colecionador',
    description: 'Possua 50 itens diferentes',
    type: 'collection',
    goal: { type: 'unique_items', target: 50, current: 0 },
    rewards: { coronas: 4000, items: [{ itemId: 'master_collection_vault', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'material_novice',
    name: 'Novato em Materiais',
    description: 'Colete 25 materiais',
    type: 'collection',
    goal: { type: 'materials_collected', target: 25, current: 0 },
    rewards: { coronas: 350 },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },
  {
    id: 'material_professional',
    name: 'Profissional de Materiais',
    description: 'Colete 150 materiais',
    type: 'collection',
    goal: { type: 'materials_collected', target: 150, current: 0 },
    rewards: { coronas: 1800, items: [{ itemId: 'professional_gatherer_kit', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'material_legend',
    name: 'Lenda dos Materiais',
    description: 'Colete 1000 materiais',
    type: 'collection',
    goal: { type: 'materials_collected', target: 1000, current: 0 },
    rewards: { coronas: 10000, items: [{ itemId: 'legendary_gatherer_amulet', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  
  // === COMBINADAS & ESPECIAIS (15 missões) ===
  {
    id: 'well_rounded',
    name: 'Guardião Completo',
    description: 'Treine, descanse e trabalhe pelo menos 1 vez cada',
    type: 'training',
    goal: { type: 'train', target: 1, current: 0 }, // Simplificado
    rewards: { coronas: 500, items: [{ itemId: 'well_rounded_medal', quantity: 1 }] },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },
  {
    id: 'hard_worker_bonus',
    name: 'Trabalhador Incansável',
    description: 'Complete 75 trabalhos',
    type: 'training',
    goal: { type: 'work', target: 75, current: 0 },
    rewards: { coronas: 6500, items: [{ itemId: 'tireless_worker_medal', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'work_champion',
    name: 'Campeão do Trabalho',
    description: 'Complete 150 trabalhos',
    type: 'training',
    goal: { type: 'work', target: 150, current: 0 },
    rewards: { coronas: 15000, items: [{ itemId: 'work_champion_trophy', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'rest_champion',
    name: 'Campeão do Descanso',
    description: 'Descanse 150 vezes',
    type: 'training',
    goal: { type: 'rest', target: 150, current: 0 },
    rewards: { coronas: 6500, items: [{ itemId: 'rest_champion_pillow', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'balanced_guardian',
    name: 'Guardião Equilibrado',
    description: 'Treine e descanse 20 vezes cada',
    type: 'training',
    goal: { type: 'train', target: 20, current: 0 }, // Simplificado
    rewards: { coronas: 1800, items: [{ itemId: 'balance_amulet', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'explorer_marathon',
    name: 'Maratona de Exploração',
    description: 'Complete 200 explorações',
    type: 'collection',
    goal: { type: 'exploration_completed', target: 200, current: 0 },
    rewards: { coronas: 15000, items: [{ itemId: 'marathon_explorer_flag', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'battle_marathon',
    name: 'Maratona de Batalhas',
    description: 'Vença 200 batalhas',
    type: 'battle',
    goal: { type: 'win_battles', target: 200, current: 0 },
    rewards: { coronas: 18000, items: [{ itemId: 'battle_marathon_crown', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'craft_marathon',
    name: 'Maratona de Craft',
    description: 'Crafte 200 itens',
    type: 'collection',
    goal: { type: 'craft', target: 200, current: 0 },
    rewards: { coronas: 16000, items: [{ itemId: 'craft_marathon_anvil', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'material_hoarder',
    name: 'Acumulador de Materiais',
    description: 'Colete 2000 materiais',
    type: 'collection',
    goal: { type: 'materials_collected', target: 2000, current: 0 },
    rewards: { coronas: 20000, items: [{ itemId: 'material_hoarder_warehouse', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'ultimate_collector',
    name: 'Colecionador Supremo',
    description: 'Possua 100 itens diferentes',
    type: 'collection',
    goal: { type: 'unique_items', target: 100, current: 0 },
    rewards: { coronas: 25000, items: [{ itemId: 'ultimate_collection_museum', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'money_tycoon',
    name: 'Magnata',
    description: 'Acumule 100000 Coronas',
    type: 'collection',
    goal: { type: 'money_accumulated', target: 100000, current: 0 },
    rewards: { coronas: 20000, items: [{ itemId: 'tycoon_golden_statue', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'ultimate_spender',
    name: 'Gastador Supremo',
    description: 'Gaste 50000 Coronas',
    type: 'collection',
    goal: { type: 'spend_money', target: 50000, current: 0 },
    rewards: { coronas: 12000, items: [{ itemId: 'ultimate_spender_card', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'training_marathon',
    name: 'Maratona de Treino',
    description: 'Treine 250 vezes',
    type: 'training',
    goal: { type: 'train', target: 250, current: 0 },
    rewards: { coronas: 12000, items: [{ itemId: 'training_marathon_belt', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'ultimate_warrior',
    name: 'Guerreiro Supremo',
    description: 'Ganhe 15 batalhas seguidas',
    type: 'battle',
    goal: { type: 'win_streak', target: 15, current: 0 },
    rewards: { coronas: 5000, items: [{ itemId: 'ultimate_warrior_sword', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'unstoppable',
    name: 'Imparável',
    description: 'Ganhe 25 batalhas seguidas',
    type: 'battle',
    goal: { type: 'win_streak', target: 25, current: 0 },
    rewards: { coronas: 10000, items: [{ itemId: 'unstoppable_legend_armor', quantity: 1 }] },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
];

const GUARDIAN_GROVE_QUESTS: Quest[] = [
  {
    id: 'grove_explorer',
    name: 'Explorador do Grove',
    description: 'Complete 3 explorações na Trilha da Descoberta.',
    type: 'collection',
    goal: { type: 'exploration_completed', target: 3, current: 0 },
    rewards: {
      coronas: 200,
      items: [{ itemId: 'vital_fruit', quantity: 2 }],
    },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },
  {
    id: 'grove_cartographer',
    name: 'Cartógrafo da Floresta',
    description: 'Complete 10 explorações para mapear todo o santuário.',
    type: 'collection',
    goal: { type: 'exploration_completed', target: 10, current: 0 },
    rewards: {
      coronas: 600,
      items: [{ itemId: 'explorer_compass', quantity: 1 }],
    },
    isCompleted: false,
    isActive: false,
    progress: 0,
  },
  {
    id: 'craft_apprentice',
    name: 'Aprendiz de Artesão',
    description: 'Crie 5 itens na oficina do Craft.',
    type: 'collection',
    goal: { type: 'craft', target: 5, current: 0 },
    rewards: {
      coronas: 250,
      items: [{ itemId: 'training_weights', quantity: 1 }],
    },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },
  {
    id: 'market_supporter',
    name: 'Apoiador do Mercado',
    description: 'Gaste 500 Coronas no Market para apoiar os comerciantes locais.',
    type: 'collection',
    goal: { type: 'spend_money', target: 500, current: 0 },
    rewards: {
      coronas: 300,
      items: [{ itemId: 'focus_charm', quantity: 1 }],
    },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },
  {
    id: 'grove_storyteller',
    name: 'Historiador do Grove',
    description: 'Converse com 4 NPCs diferentes para coletar histórias do santuário.',
    type: 'social',
    goal: { type: 'talk_to_npc', target: 4, current: 0 },
    rewards: {
      coronas: 200,
      items: [{ itemId: 'mood_herb', quantity: 2 }],
    },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },
  {
    id: 'resource_alchemist',
    name: 'Coletor Sustentável',
    description: 'Colete 20 materiais durante explorações.',
    type: 'collection',
    goal: { type: 'materials_collected', target: 20, current: 0 },
    rewards: {
      coronas: 400,
      items: [{ itemId: 'serene_herb', quantity: 3 }],
    },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },
  {
    id: 'wealth_caretaker',
    name: 'Patrono Verde',
    description: 'Acumule 2.000 Coronas para investir no santuário.',
    type: 'collection',
    goal: { type: 'money_accumulated', target: 2000, current: 0 },
    rewards: {
      coronas: 800,
      items: [{ itemId: 'ancient_relic', quantity: 1 }],
    },
    isCompleted: false,
    isActive: true,
    progress: 0,
  },
];

export const AVAILABLE_QUESTS: Quest[] = GUARDIAN_GROVE_QUESTS;

// REMOVIDO: Sistema antigo de tracking (trackAction, updateQuestProgress, trackSpending)
// Agora tudo funciona via eventos (updateQuests + game-events.ts)
// Isso previne contagem duplicada de progresso

/**
 * Retorna quests completadas e não coletadas
 */
export function getCompletedQuests(quests: Quest[]): Quest[] {
  return quests.filter(q => q.isCompleted);
}

/**
 * Retorna quests ativas
 */
export function getActiveQuests(quests: Quest[]): Quest[] {
  return quests.filter(q => q.isActive && !q.isCompleted);
}

/**
 * Desbloqueia quests baseado em progresso
 */
export function unlockQuests(quests: Quest[]): void {
  const explorerQuest = quests.find(q => q.id === 'grove_explorer' && q.isCompleted);
  if (explorerQuest) {
    const cartographerQuest = quests.find(q => q.id === 'grove_cartographer');
    if (cartographerQuest && !cartographerQuest.isActive) {
      cartographerQuest.isActive = true;
      cartographerQuest.goal.current = 0;
      cartographerQuest.progress = 0;
      console.log('[Quest] Desbloqueada: Cartógrafo da Floresta');
    }
  }
}

// ===== NOVO SISTEMA DE EVENTOS =====

/**
 * Atualiza quests baseado em eventos do jogo
 */
export function updateQuests(event: GameEvent, gameState: GameState): void {
  if (!gameState.quests) return;
  
  for (const quest of gameState.quests) {
    // CRÍTICO: Ignorar quests completadas ou inativas
    // BUG FIX: Antes contava progresso mesmo com isActive: false
    if (quest.isCompleted || !quest.isActive) continue;
    
    let progressIncrement = 0;
    
    // Match event type com quest goal type
    switch (event.type) {
      case 'battle_won':
        if (quest.goal.type === 'win_battles') {
          progressIncrement = 1;
        }
        break;
        
      case 'beast_trained':
        if (quest.goal.type === 'train') {
          progressIncrement = 1;
        }
        break;
        
      case 'beast_rested':
        if (quest.goal.type === 'rest') {
          progressIncrement = 1;
        }
        break;
        
      case 'beast_worked':
        if (quest.goal.type === 'work') {
          progressIncrement = 1;
        }
        // Também rastrear dinheiro ganho de trabalho
        if (quest.goal.type === 'money_from_work') {
          progressIncrement = event.coronasEarned;
        }
        break;
        
      case 'exploration_completed':
        if (quest.goal.type === 'exploration_completed') {
          progressIncrement = 1;
        }
        if (quest.goal.type === 'materials_collected') {
          // Materiais coletados durante a exploração
          progressIncrement = event.distance / 100; // Estimativa
        }
        break;
        
      case 'item_crafted':
        if (quest.goal.type === 'craft') {
          progressIncrement = 1;
        }
        break;
        
      case 'money_earned':
        if (quest.goal.type === 'money_accumulated') {
          // Verificar dinheiro total atual
          const currentMoney = gameState.coronas || 0;
          quest.goal.current = currentMoney;
          progressIncrement = 0; // Já setamos current
        }
        break;
        
      case 'win_streak':
        if (quest.goal.type === 'win_streak') {
          quest.goal.current = event.currentStreak;
          progressIncrement = 0; // Já setamos current
        }
        break;
        
      case 'item_collected':
        if (quest.goal.type === 'collect_item') {
          // Verificar se é o item específico da quest
          if (quest.goal.target === event.itemId) {
            progressIncrement = event.quantity;
          }
        }
        // Rastrear materiais coletados
        if (quest.goal.type === 'materials_collected' && event.source === 'exploration') {
          progressIncrement = event.quantity;
        }
        // Rastrear itens únicos no inventário
        if (quest.goal.type === 'unique_items') {
          const uniqueItems = new Set(gameState.inventory.map(i => i.id)).size;
          quest.goal.current = uniqueItems;
          progressIncrement = 0; // Já setamos current
        }
        break;
        
      case 'npc_talked':
        if (quest.goal.type === 'talk_to_npc') {
          progressIncrement = 1;
        }
        break;
        
      case 'money_spent':
        if (quest.goal.type === 'spend_money') {
          progressIncrement = event.amount;
        }
        break;
        
      case 'level_up':
        if (quest.goal.type === 'reach_level') {
          if (typeof quest.goal.target === 'number' && event.newLevel >= quest.goal.target) {
            quest.goal.current = event.newLevel;
            progressIncrement = 0; // Já setamos current
          }
        }
        break;
    }
    
    // Incrementar progresso
    if (progressIncrement > 0) {
      quest.goal.current += progressIncrement;
      // BUG FIX: progress deve ser 0-1, não 0-100!
      quest.progress = Math.min(quest.goal.current / (quest.goal.target as number), 1);
      
      console.log(`[Quest] ${quest.name}: ${quest.goal.current}/${quest.goal.target} (${Math.floor(quest.progress * 100)}%)`);
    }
    
    // Verificar se completou
    if (typeof quest.goal.target === 'number' && quest.goal.current >= quest.goal.target) {
      completeQuest(quest, gameState);
    }
  }
  
  // Desbloquear quests encadeadas
  unlockQuests(gameState.quests);
}

/**
 * Completa uma quest e aplica recompensas
 */
function completeQuest(quest: Quest, gameState: GameState): void {
  if (quest.isCompleted) return;
  
  quest.isCompleted = true;
  quest.progress = 1; // BUG FIX: 1 (100%), não 100
  
  console.log(`[Quest] ✅ COMPLETED: ${quest.name}`);
  
  // BUG FIX: Aplicar recompensas no gameState.economy, não gameState
  if (quest.rewards.coronas) {
    if (!gameState.economy) gameState.economy = { coronas: 0 };
    gameState.economy.coronas = (gameState.economy.coronas || 0) + quest.rewards.coronas;
    console.log(`[Quest] Reward: +${quest.rewards.coronas} coronas (total: ${gameState.economy.coronas})`);
  }
  
  if (quest.rewards.experience && gameState.activeBeast) {
    gameState.activeBeast.experience = (gameState.activeBeast.experience || 0) + quest.rewards.experience;
    console.log(`[Quest] Reward: +${quest.rewards.experience} XP`);
  }
  
  if (quest.rewards.items) {
    for (const itemReward of quest.rewards.items) {
      const existing = gameState.inventory.find(i => i.id === itemReward.itemId);
      if (existing) {
        existing.quantity = (existing.quantity || 0) + itemReward.quantity;
      } else {
        // Criar item no inventário
        gameState.inventory.push({
          id: itemReward.itemId,
          name: itemReward.itemId,
          category: 'special',
          effect: 'Quest reward',
          price: 0,
          description: 'Recompensa de quest',
          quantity: itemReward.quantity,
        });
      }
      console.log(`[Quest] Reward: +${itemReward.quantity}x ${itemReward.itemId}`);
    }
  }
}

