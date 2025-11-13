/**
 * Sistema de Craft
 * Combina itens para criar novos
 */

import type { Item } from '../types';
import { POKEMON_INSPIRED_RECIPES } from '../data/pokemon-inspired-recipes';

export interface CraftRecipe {
  id: string;
  name: string;
  description: string;
  ingredients: Array<{ itemId: string; quantity: number }>;
  result: { itemId: string; quantity: number };
  resultItem?: Item; // Item resultante para preview
}

/**
 * Receitas de Craft Disponíveis (Apenas Pokémon)
 */
export const CRAFT_RECIPES: CraftRecipe[] = POKEMON_INSPIRED_RECIPES;

/**
 * Verifica se o jogador tem os ingredientes necessários
 */
export function canCraft(recipe: CraftRecipe, inventory: Item[]): boolean {
  for (const ingredient of recipe.ingredients) {
    const item = inventory.find(i => i.id === ingredient.itemId);
    if (!item || !item.quantity || item.quantity < ingredient.quantity) {
      return false;
    }
  }
  return true;
}

/**
 * Consome os ingredientes e retorna o item craftado
 */
export function executeCraft(recipe: CraftRecipe, inventory: Item[]): { success: boolean; message: string; result?: Item } {
  // Verificar se pode craftar
  if (!canCraft(recipe, inventory)) {
    return {
      success: false,
      message: 'Você não tem os ingredientes necessários!',
    };
  }

  // Consumir ingredientes
  for (const ingredient of recipe.ingredients) {
    const item = inventory.find(i => i.id === ingredient.itemId);
    if (item && item.quantity) {
      item.quantity -= ingredient.quantity;
      
      // Remover do inventário se quantidade chegar a 0
      if (item.quantity <= 0) {
        const index = inventory.indexOf(item);
        inventory.splice(index, 1);
      }
    }
  }

  // Criar item resultante (será adicionado ao inventário externamente)
  return {
    success: true,
    message: `✨ ${recipe.name} craftado com sucesso!`,
    result: {
      id: recipe.result.itemId,
      name: recipe.name,
      category: 'crystal', // Placeholder, será substituído pelo item real
      effect: '',
      price: 0,
      description: '',
      quantity: recipe.result.quantity,
    },
  };
}

/**
 * Retorna receitas que o jogador pode craftar
 */
export function getAvailableRecipes(inventory: Item[]): CraftRecipe[] {
  return CRAFT_RECIPES.filter(recipe => canCraft(recipe, inventory));
}

/**
 * Retorna todas as receitas
 */
export function getAllRecipes(): CraftRecipe[] {
  return CRAFT_RECIPES;
}

