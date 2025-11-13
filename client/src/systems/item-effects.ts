/**
 * Sistema de Efeitos de Itens
 * Gerencia o uso de itens no inventário e seus efeitos nas bestas
 */

import { Beast, Item } from '../types';
import { recalculateDerivedStats } from './beast';

export interface ItemUseResult {
  success: boolean;
  message: string;
  changes?: {
    hp?: number;
    essence?: number;
    attributes?: Partial<Beast['attributes']>;
    stress?: number;
    loyalty?: number;
    age?: number;
  };
}

export function canUseItem(item: Item, beast: Beast): {canUse: boolean; reason?: string} {
  // Validações por tipo de item
  if (item.id.includes('healing') && beast.currentHp >= beast.maxHp) {
    return {canUse: false, reason: 'HP já está cheio!'};
  }
  
  if (item.id.includes('essence') && beast.essence >= beast.maxEssence) {
    return {canUse: false, reason: 'Essência já está cheia!'};
  }
  
  // Validar limites de elixires
  if (item.id.includes('elixir')) {
    const limit = checkElixirLimit(item, beast);
    if (!limit.canUse) return limit;
  }
  
  return {canUse: true};
}

function checkElixirLimit(item: Item, beast: Beast): {canUse: boolean; reason?: string} {
  const usage = beast.elixirUsage || {};
  
  // Elixires de atributos
  if (item.id === 'might_elixir_item') {
    if ((usage.might || 0) >= 5) return {canUse: false, reason: 'Limite de 5 Elixires de Força atingido!'};
    if ((usage.total || 0) >= 20) return {canUse: false, reason: 'Limite total de 20 elixires atingido!'};
  }
  
  if (item.id === 'wit_elixir_item') {
    if ((usage.wit || 0) >= 5) return {canUse: false, reason: 'Limite de 5 Elixires de Astúcia atingido!'};
    if ((usage.total || 0) >= 20) return {canUse: false, reason: 'Limite total de 20 elixires atingido!'};
  }
  
  if (item.id === 'focus_elixir_item') {
    if ((usage.focus || 0) >= 5) return {canUse: false, reason: 'Limite de 5 Elixires de Foco atingido!'};
    if ((usage.total || 0) >= 20) return {canUse: false, reason: 'Limite total de 20 elixires atingido!'};
  }
  
  if (item.id === 'agility_elixir_item') {
    if ((usage.agility || 0) >= 5) return {canUse: false, reason: 'Limite de 5 Elixires de Agilidade atingido!'};
    if ((usage.total || 0) >= 20) return {canUse: false, reason: 'Limite total de 20 elixires atingido!'};
  }
  
  if (item.id === 'ward_elixir_item') {
    if ((usage.ward || 0) >= 5) return {canUse: false, reason: 'Limite de 5 Elixires de Resistência atingido!'};
    if ((usage.total || 0) >= 20) return {canUse: false, reason: 'Limite total de 20 elixires atingido!'};
  }
  
  if (item.id === 'vitality_elixir_item') {
    if ((usage.vitality || 0) >= 5) return {canUse: false, reason: 'Limite de 5 Elixires de Vitalidade atingido!'};
    if ((usage.total || 0) >= 20) return {canUse: false, reason: 'Limite total de 20 elixires atingido!'};
  }
  
  // Elixir da Juventude
  if (item.id === 'youth_elixir_item' && (usage.youth || 0) >= 3) {
    return {canUse: false, reason: 'Limite de 3 Elixires da Juventude atingido!'};
  }
  
  // Elixir da Imortalidade
  if (item.id === 'immortality_elixir_item' && (usage.immortality || 0) >= 1) {
    return {canUse: false, reason: 'Limite de 1 Elixir da Imortalidade atingido!'};
  }
  
  return {canUse: true};
}

export function useItem(item: Item, beast: Beast): ItemUseResult {
  // Aplicar efeitos baseado no tipo de item
  const result: ItemUseResult = {success: true, message: '', changes: {}};
  
  switch(item.id) {
    // Poções de cura
    case 'basic_healing_potion_item':
      result.changes.hp = Math.min(beast.currentHp + 20, beast.maxHp);
      result.message = 'Curou 20 HP!';
      break;
    
    case 'greater_healing_potion_item':
      result.changes.hp = Math.min(beast.currentHp + 50, beast.maxHp);
      result.message = 'Curou 50 HP!';
      break;
    
    case 'superior_healing_potion_item':
      result.changes.hp = beast.maxHp;
      result.message = 'HP completamente restaurado!';
      break;
    
    // Poções de essência
    case 'basic_essence_potion_item':
      result.changes.essence = Math.min(beast.essence + 15, beast.maxEssence);
      result.message = 'Restaurou 15 Essência!';
      break;
    
    case 'greater_essence_potion_item':
      result.changes.essence = Math.min(beast.essence + 35, beast.maxEssence);
      result.message = 'Restaurou 35 Essência!';
      break;
    
    case 'superior_essence_potion_item':
      result.changes.essence = beast.maxEssence;
      result.message = 'Essência completamente restaurada!';
      break;
    
    // Elixires de atributos
    case 'might_elixir_item':
      result.changes.attributes = {might: (beast.attributes.might || 0) + 1};
      if (!beast.elixirUsage) beast.elixirUsage = {};
      beast.elixirUsage.might = (beast.elixirUsage.might || 0) + 1;
      beast.elixirUsage.total = (beast.elixirUsage.total || 0) + 1;
      result.message = '+1 Força permanente!';
      break;
    
    case 'wit_elixir_item':
      result.changes.attributes = {wit: (beast.attributes.wit || 0) + 1};
      if (!beast.elixirUsage) beast.elixirUsage = {};
      beast.elixirUsage.wit = (beast.elixirUsage.wit || 0) + 1;
      beast.elixirUsage.total = (beast.elixirUsage.total || 0) + 1;
      result.message = '+1 Astúcia permanente!';
      break;
    
    case 'focus_elixir_item':
      result.changes.attributes = {focus: (beast.attributes.focus || 0) + 1};
      if (!beast.elixirUsage) beast.elixirUsage = {};
      beast.elixirUsage.focus = (beast.elixirUsage.focus || 0) + 1;
      beast.elixirUsage.total = (beast.elixirUsage.total || 0) + 1;
      result.message = '+1 Foco permanente!';
      break;
    
    case 'agility_elixir_item':
      result.changes.attributes = {agility: (beast.attributes.agility || 0) + 1};
      if (!beast.elixirUsage) beast.elixirUsage = {};
      beast.elixirUsage.agility = (beast.elixirUsage.agility || 0) + 1;
      beast.elixirUsage.total = (beast.elixirUsage.total || 0) + 1;
      result.message = '+1 Agilidade permanente!';
      break;
    
    case 'ward_elixir_item':
      result.changes.attributes = {ward: (beast.attributes.ward || 0) + 1};
      if (!beast.elixirUsage) beast.elixirUsage = {};
      beast.elixirUsage.ward = (beast.elixirUsage.ward || 0) + 1;
      beast.elixirUsage.total = (beast.elixirUsage.total || 0) + 1;
      result.message = '+1 Resistência permanente!';
      break;
    
    case 'vitality_elixir_item':
      result.changes.attributes = {vitality: (beast.attributes.vitality || 0) + 1};
      if (!beast.elixirUsage) beast.elixirUsage = {};
      beast.elixirUsage.vitality = (beast.elixirUsage.vitality || 0) + 1;
      beast.elixirUsage.total = (beast.elixirUsage.total || 0) + 1;
      result.message = '+1 Vitalidade permanente!';
      break;
    
    // Elixires especiais
    case 'youth_elixir_item':
      result.changes.age = Math.max(0, beast.secondaryStats.age - 10);
      if (!beast.elixirUsage) beast.elixirUsage = {};
      beast.elixirUsage.youth = (beast.elixirUsage.youth || 0) + 1;
      result.message = 'Idade reduzida em 10 semanas!';
      break;
    
    case 'immortality_elixir_item':
      result.changes.age = 0;
      if (!beast.elixirUsage) beast.elixirUsage = {};
      beast.elixirUsage.immortality = 1;
      result.message = 'Imortalidade concedida!';
      break;
    
    // Itens de redução de stress
    case 'calming_herb_item':
      result.changes.stress = Math.max(0, beast.secondaryStats.stress - 20);
      result.message = 'Stress reduzido em 20!';
      break;
    
    case 'serenity_crystal_item':
      result.changes.stress = Math.max(0, beast.secondaryStats.stress - 40);
      result.message = 'Stress reduzido em 40!';
      break;
    
    // Itens de aumento de lealdade
    case 'loyalty_treat_item':
      result.changes.loyalty = Math.min(100, beast.secondaryStats.loyalty + 15);
      result.message = 'Lealdade aumentada em 15!';
      break;
    
    case 'bonding_crystal_item':
      result.changes.loyalty = Math.min(100, beast.secondaryStats.loyalty + 30);
      result.message = 'Lealdade aumentada em 30!';
      break;
    
    // ===== POÇÕES DE CURA (IDs DA LOJA) =====
    case 'super_healing_potion_item':
      result.changes.hp = Math.min(beast.currentHp + 50, beast.maxHp);
      result.message = 'Curou 50 HP!';
      break;
    
    case 'hyper_healing_potion_item':
      result.changes.hp = Math.min(beast.currentHp + 100, beast.maxHp);
      result.message = 'Curou 100 HP!';
      break;
    
    case 'max_healing_potion_item':
      result.changes.hp = beast.maxHp;
      result.message = 'HP completamente restaurado!';
      break;
    
    case 'full_restore_potion_item':
      result.changes.hp = beast.maxHp;
      result.changes.essence = beast.maxEssence;
      result.changes.stress = 0;
      result.message = 'HP e Essência restaurados, Stress e Fadiga removidos!';
      break;
    
    // ===== ELIXIRES DE ESSÊNCIA =====
    case 'basic_essence_elixir_item':
      result.changes.essence = Math.min(beast.essence + 10, beast.maxEssence);
      result.message = 'Restaurou 10 Essência!';
      break;
    
    case 'super_essence_elixir_item':
      result.changes.essence = Math.min(beast.essence + 25, beast.maxEssence);
      result.message = 'Restaurou 25 Essência!';
      break;
    
    case 'max_essence_elixir_item':
      result.changes.essence = beast.maxEssence;
      result.message = 'Essência completamente restaurada!';
      break;
    
    // ===== ELIXIR ESPECIAL =====
    case 'universal_elixir_item':
      if (!result.changes.attributes) result.changes.attributes = {};
      result.changes.attributes.might = (beast.attributes.might || 0) + 5;
      result.changes.attributes.wit = (beast.attributes.wit || 0) + 5;
      result.changes.attributes.focus = (beast.attributes.focus || 0) + 5;
      result.changes.attributes.agility = (beast.attributes.agility || 0) + 5;
      result.changes.attributes.ward = (beast.attributes.ward || 0) + 5;
      result.changes.attributes.vitality = (beast.attributes.vitality || 0) + 5;
      if (!beast.elixirUsage) beast.elixirUsage = {};
      beast.elixirUsage.total = (beast.elixirUsage.total || 0) + 6;
      result.message = '+5 em TODOS os atributos!';
      break;
    
    // ===== ANTÍDOTO E OUTROS =====
    case 'antidote_potion_item':
      result.changes.stress = 0;
      result.message = 'Todos os efeitos negativos removidos!';
      break;
    
    case 'awakening_potion_item':
      result.changes.stress = 0;
      result.message = 'Fadiga removida e energia restaurada!';
      break;
    
    // ===== ITENS DE ALIMENTO (se não estiverem no sistema antigo) =====
    case 'vital_fruit':
      result.changes.stress = Math.max(0, beast.secondaryStats.stress - 15);
      result.message = 'Stress reduzido em 15!';
      break;
    
    case 'serene_herb':
      result.changes.stress = Math.max(0, beast.secondaryStats.stress - 10);
      result.message = 'Stress reduzido em 10!';
      break;
    
    case 'healing_herb':
      result.changes.hp = Math.min(beast.currentHp + Math.floor(beast.maxHp * 0.3), beast.maxHp);
      result.message = `Curou ${Math.floor(beast.maxHp * 0.3)} HP!`;
      break;
    
    case 'energy_herb':
      result.changes.essence = Math.min(beast.essence + Math.floor(beast.maxEssence * 0.25), beast.maxEssence);
      result.message = `Restaurou ${Math.floor(beast.maxEssence * 0.25)} Essência!`;
      break;
    
    case 'mood_herb':
      result.message = 'Humor melhorado!';
      break;
    
    // ===== ELIXIRES ESPECIAIS (LOJA) =====
    case 'stress_relief_elixir_item':
      result.changes.stress = 0;
      result.message = 'Stress completamente removido!';
      break;
    
    case 'loyalty_elixir_item':
      result.changes.loyalty = 100;
      result.message = 'Lealdade máxima atingida!';
      break;
    
    case 'renewed_vigor_potion_item':
      // Verifica se já usou hoje
      if (beast.dailyPotionUsed) {
        result.success = false;
        result.message = 'Você já usou uma Poção de Vigor Renovado hoje! Aguarde até amanhã.';
      } else {
        // Reseta contador de treinos diários
        beast.dailyTrainingCount = 0;
        beast.dailyPotionUsed = true;
        beast.lastPotionReset = Date.now();
        result.message = '✨ Vigor renovado! Você pode treinar mais 5 vezes hoje!';
      }
      break;
    
    case 'experience_elixir_item':
      if (beast.experience) beast.experience += 500;
      result.message = '+500 XP ganhos!';
      break;
    
    // ===== POÇÕES TEMPORÁRIAS (BATALHA) =====
    case 'x_might_potion_item':
      result.message = '+5 Força por 3 batalhas!';
      break;
    
    case 'x_ward_potion_item':
      result.message = '+5 Resistência por 3 batalhas!';
      break;
    
    case 'x_agility_potion_item':
      result.message = '+5 Agilidade por 3 batalhas!';
      break;
    
    case 'x_focus_potion_item':
      result.message = '+5 Foco por 3 batalhas!';
      break;
    
    // ===== ELIXIRES LENDÁRIOS =====
    case 'divine_elixir_item':
      if (!result.changes.attributes) result.changes.attributes = {};
      result.changes.attributes.might = (beast.attributes.might || 0) + 10;
      result.changes.attributes.wit = (beast.attributes.wit || 0) + 10;
      result.changes.attributes.focus = (beast.attributes.focus || 0) + 10;
      result.changes.attributes.agility = (beast.attributes.agility || 0) + 10;
      result.changes.attributes.ward = (beast.attributes.ward || 0) + 10;
      result.changes.attributes.vitality = (beast.attributes.vitality || 0) + 10;
      result.changes.hp = beast.maxHp;
      result.changes.essence = beast.maxEssence;
      result.changes.stress = 0;
      if (!beast.elixirUsage) beast.elixirUsage = {};
      beast.elixirUsage.total = (beast.elixirUsage.total || 0) + 6;
      result.message = 'Elixir Divino! +10 em TODOS os atributos + Cura completa!';
      break;
    
    // ===== ALIMENTOS BÁSICOS =====
    case 'basic_food':
      result.message = 'Fadiga reduzida em 10!';
      break;
    
    case 'premium_food':
      result.message = 'Fadiga reduzida em 20!';
      break;
    
    case 'feast':
      result.changes.stress = Math.max(0, beast.secondaryStats.stress - 20);
      result.message = 'Fadiga -30, Stress -20!';
      break;
    
    default:
      result.success = false;
      result.message = 'Item não pode ser usado!';
      break;
  }
  
  return result;
}

/**
 * Obtém informações sobre os limites de elixires de uma besta
 */
export function getElixirUsageInfo(beast: Beast): {
  attributeElixirs: {type: string; used: number; max: number}[];
  specialElixirs: {type: string; used: number; max: number}[];
  totalUsed: number;
  totalMax: number;
} {
  const usage = beast.elixirUsage || {};
  
  const attributeElixirs = [
    {type: 'Força', used: usage.might || 0, max: 5},
    {type: 'Astúcia', used: usage.wit || 0, max: 5},
    {type: 'Foco', used: usage.focus || 0, max: 5},
    {type: 'Agilidade', used: usage.agility || 0, max: 5},
    {type: 'Resistência', used: usage.ward || 0, max: 5},
    {type: 'Vitalidade', used: usage.vitality || 0, max: 5},
  ];
  
  const specialElixirs = [
    {type: 'Juventude', used: usage.youth || 0, max: 3},
    {type: 'Imortalidade', used: usage.immortality || 0, max: 1},
  ];
  
  return {
    attributeElixirs,
    specialElixirs,
    totalUsed: usage.total || 0,
    totalMax: 20
  };
}
