/**
 * Sistema de Inventário
 * Gerencia itens e aplica seus efeitos
 */

import type { GameState, Beast, Item } from '../types';
import { canUseItem, useItem as useItemEffect, type ItemUseResult } from './item-effects';
import { recalculateDerivedStats } from './beast';

export interface ItemEffect {
  success: boolean;
  message: string;
  changes?: {
    fatigue?: number;
    stress?: number;
    hp?: number;
    essence?: number;
    mood?: string;
  };
}

/**
 * Usa um item do inventário em uma Besta
 */
export function useItem(gameState: GameState, item: Item, beast: Beast): ItemEffect {
  // DEBUG: Log do inventário atual
  console.log('[useItem] Tentando usar:', item.id, item.name);
  console.log('[useItem] Inventário atual:', gameState.inventory.map(i => `${i.id} x${i.quantity}`));
  
  // Verificar se o item está no inventário
  const inventoryItem = gameState.inventory.find(i => i.id === item.id);
  if (!inventoryItem || !inventoryItem.quantity || inventoryItem.quantity <= 0) {
    console.error('[useItem] ❌ Item não encontrado!', {
      searchId: item.id,
      inventoryIds: gameState.inventory.map(i => i.id)
    });
    return {
      success: false,
      message: 'Item não encontrado no inventário!',
    };
  }
  
  console.log('[useItem] ✅ Item encontrado:', inventoryItem.id, 'x' + inventoryItem.quantity);

  // Verificar se o item pode ser usado
  const canUse = canUseItem(item, beast);
  if (!canUse.canUse) {
    return {
      success: false,
      message: canUse.reason || 'Item não pode ser usado!',
    };
  }

  // Usar o novo sistema de efeitos de itens
  const result: ItemUseResult = useItemEffect(item, beast);

  // Se o efeito foi aplicado com sucesso, remover do inventário
  if (result.success) {
    inventoryItem.quantity -= 1;
    if (inventoryItem.quantity <= 0) {
      const index = gameState.inventory.indexOf(inventoryItem);
      gameState.inventory.splice(index, 1);
    }

    // Aplicar mudanças na besta
    let attributesChanged = false;
    if (result.changes) {
      if (result.changes.hp !== undefined) {
        beast.currentHp = result.changes.hp;
      }
      if (result.changes.essence !== undefined) {
        beast.essence = result.changes.essence;
      }
      if (result.changes.attributes) {
        Object.assign(beast.attributes, result.changes.attributes);
        attributesChanged = true;
      }
      if (result.changes.stress !== undefined) {
        beast.secondaryStats.stress = result.changes.stress;
      }
      if (result.changes.loyalty !== undefined) {
        beast.secondaryStats.loyalty = result.changes.loyalty;
      }
      if (result.changes.age !== undefined) {
        beast.secondaryStats.age = result.changes.age;
      }
      
      // CRÍTICO: Recalcular HP/Essência máximos se atributos mudaram (Vitality/Wit/Focus)
      if (attributesChanged) {
        console.log('[Inventory] Atributos mudaram - recalculando stats derivados...');
        recalculateDerivedStats(beast);
      }
    }
  }

  return {
    success: result.success,
    message: result.message,
    changes: result.changes ? {
      hp: result.changes.hp,
      essence: result.changes.essence,
      stress: result.changes.stress,
    } : undefined,
  };
}

/**
 * Efeitos de Alimentos
 */
function applyFoodEffect(item: Item, beast: Beast): ItemEffect {
  const changes: ItemEffect['changes'] = {};

  switch (item.id) {
    case 'basic_food':
      beast.secondaryStats.fatigue = Math.max(0, beast.secondaryStats.fatigue - 10);
      changes.fatigue = -10;
      break;

    case 'premium_food':
      beast.secondaryStats.fatigue = Math.max(0, beast.secondaryStats.fatigue - 20);
      changes.fatigue = -20;
      break;

    case 'vital_fruit':
      beast.secondaryStats.stress = Math.max(0, beast.secondaryStats.stress - 15);
      changes.stress = -15;
      break;

    case 'feast':
      beast.secondaryStats.fatigue = Math.max(0, beast.secondaryStats.fatigue - 30);
      beast.secondaryStats.stress = Math.max(0, beast.secondaryStats.stress - 20);
      changes.fatigue = -30;
      changes.stress = -20;
      break;

    default:
      return { success: false, message: 'Alimento desconhecido.' };
  }

  return {
    success: true,
    message: `${beast.name} consumiu ${item.name}!`,
    changes,
  };
}

/**
 * Efeitos de Ervas
 */
function applyHerbEffect(item: Item, beast: Beast): ItemEffect {
  const changes: ItemEffect['changes'] = {};

  switch (item.id) {
    case 'serene_herb':
      beast.secondaryStats.fatigue = Math.max(0, beast.secondaryStats.fatigue - 20);
      changes.fatigue = -20;
      break;

    case 'healing_herb':
      const hpRecover = Math.floor(beast.maxHp * 0.3);
      beast.currentHp = Math.min(beast.maxHp, beast.currentHp + hpRecover);
      changes.hp = hpRecover;
      break;

    case 'energy_herb':
      const essenceRecover = Math.floor(beast.maxEssence * 0.25);
      beast.essence = Math.min(beast.maxEssence, beast.essence + essenceRecover);
      changes.essence = essenceRecover;
      break;

    case 'mood_herb':
      // Melhora o humor
      if (beast.mood === 'sad' || beast.mood === 'angry') {
        beast.mood = 'neutral';
        changes.mood = 'neutral';
      } else if (beast.mood === 'neutral' || beast.mood === 'tired') {
        beast.mood = 'happy';
        changes.mood = 'happy';
      }
      break;

    default:
      return { success: false, message: 'Erva desconhecida.' };
  }

  return {
    success: true,
    message: `${item.name} aplicada em ${beast.name}!`,
    changes,
  };
}

/**
 * Efeitos de Cristais (permanentes)
 */
function applyCrystalEffect(item: Item, beast: Beast): ItemEffect {
  const changes: ItemEffect['changes'] = {};

  switch (item.id) {
    case 'echo_crystal':
      // Efeito aplicado na hora do treino
      return {
        success: true,
        message: `${beast.name} absorveu o Cristal de Eco! Chance de aprender técnicas aumentada.`,
      };

    case 'essence_crystal':
      beast.maxEssence += 10;
      beast.essence = beast.maxEssence;
      changes.essence = 10;
      return {
        success: true,
        message: `${beast.name} absorveu o Cristal de Essência! Essência máxima aumentou em 10!`,
        changes,
      };

    case 'vitality_crystal':
      beast.maxHp += 15;
      beast.currentHp = Math.min(beast.currentHp + 15, beast.maxHp);
      changes.hp = 15;
      return {
        success: true,
        message: `${beast.name} absorveu o Cristal Vital! HP máximo aumentou em 15!`,
        changes,
      };

    default:
      return { success: false, message: 'Cristal desconhecido.' };
  }
}

/**
 * Efeitos de Itens de Treino (buffs temporários)
 */
function applyTrainingEffect(item: Item, beast: Beast, _gameState: GameState): ItemEffect {
  // Adicionar flag de buff ativo ao beast
  if (!beast.activeBuffs) {
    beast.activeBuffs = [];
  }

  switch (item.id) {
    case 'training_weights':
      beast.activeBuffs.push({ type: 'might', value: 0.2, duration: 1 });
      return {
        success: true,
        message: `${beast.name} equipou Pesos de Treino! +20% ganho de Força no próximo treino!`,
      };

    case 'focus_charm':
      beast.activeBuffs.push({ type: 'focus', value: 0.2, duration: 1 });
      return {
        success: true,
        message: `${beast.name} equipou Talismã de Foco! +20% ganho de Foco no próximo treino!`,
      };

    case 'agility_boots':
      beast.activeBuffs.push({ type: 'agility', value: 0.2, duration: 1 });
      return {
        success: true,
        message: `${beast.name} equipou Botas de Agilidade! +20% ganho de Agilidade no próximo treino!`,
      };

    case 'wisdom_tome':
      beast.activeBuffs.push({ type: 'wit', value: 0.2, duration: 1 });
      return {
        success: true,
        message: `${beast.name} leu o Tomo da Sabedoria! +20% ganho de Astúcia no próximo treino!`,
      };

    default:
      return { success: false, message: 'Item de treino desconhecido.' };
  }
}

/**
 * Remove buffs expirados após uma ação
 */
export function decreaseBuffDurations(beast: Beast) {
  if (!beast.activeBuffs) return;

  beast.activeBuffs = beast.activeBuffs.filter(buff => {
    buff.duration -= 1;
    return buff.duration > 0;
  });
}

/**
 * Retorna o multiplicador de treino baseado nos buffs ativos
 */
export function getTrainingMultiplier(beast: Beast, attribute: string): number {
  if (!beast.activeBuffs) return 1;

  let multiplier = 1;
  for (const buff of beast.activeBuffs) {
    if (buff.type === attribute) {
      multiplier += buff.value;
    }
  }

  return multiplier;
}

