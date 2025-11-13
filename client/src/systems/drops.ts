/**
 * Sistema de Drops de Combate
 * Gerencia recompensas de itens após vitórias
 */

import type { Item, TournamentRank } from '../types';
import { SHOP_ITEMS, RARE_ITEMS } from '../data/shop';

export interface DropResult {
  items: Item[];
  message: string;
}

/**
 * Calcula drops baseado no rank do torneio
 */
export function calculateTournamentDrops(rank: TournamentRank): DropResult {
  const items: Item[] = [];
  let message = '';

  switch (rank) {
    case 'bronze':
      // 50% chance de 1 item comum
      if (Math.random() < 0.5) {
        const commonItems = SHOP_ITEMS.filter(i => i.price <= 150);
        const item = commonItems[Math.floor(Math.random() * commonItems.length)];
        items.push({ ...item, quantity: 1 });
        message = `🎁 Você encontrou: ${item.name}!`;
      } else {
        message = '💰 Apenas prêmio em dinheiro desta vez.';
      }
      break;

    case 'silver':
      // 70% chance de 1 item, 30% chance de 2 itens
      const silverCount = Math.random() < 0.7 ? 1 : 2;
      const silverItems = SHOP_ITEMS.filter(i => i.price <= 300);
      
      for (let i = 0; i < silverCount; i++) {
        const item = silverItems[Math.floor(Math.random() * silverItems.length)];
        items.push({ ...item, quantity: 1 });
      }
      
      message = silverCount === 1
        ? `🎁 Você encontrou: ${items[0].name}!`
        : `🎁 Você encontrou: ${items.map(i => i.name).join(' e ')}!`;
      break;

    case 'gold':
      // Sempre 2 itens, 40% chance de 1 ser raro
      const goldItems = SHOP_ITEMS.filter(i => i.price <= 500);
      
      // Primeiro item sempre comum/médio
      const item1 = goldItems[Math.floor(Math.random() * goldItems.length)];
      items.push({ ...item1, quantity: 1 });
      
      // Segundo item: 40% raro, 60% comum
      if (Math.random() < 0.4) {
        const rareItem = RARE_ITEMS[Math.floor(Math.random() * RARE_ITEMS.length)];
        items.push({ ...rareItem, quantity: 1 });
      } else {
        const item2 = goldItems[Math.floor(Math.random() * goldItems.length)];
        items.push({ ...item2, quantity: 1 });
      }
      
      message = `🏆 Você encontrou: ${items.map(i => i.name).join(' e ')}!`;
      break;

    case 'mythic':
      // Sempre 1 item raro + 1-2 itens comuns
      const rareItem = RARE_ITEMS[Math.floor(Math.random() * RARE_ITEMS.length)];
      items.push({ ...rareItem, quantity: 1 });
      
      const mythicCount = Math.random() < 0.5 ? 1 : 2;
      const mythicItems = SHOP_ITEMS.filter(i => i.price <= 500);
      
      for (let i = 0; i < mythicCount; i++) {
        const item = mythicItems[Math.floor(Math.random() * mythicItems.length)];
        items.push({ ...item, quantity: 1 });
      }
      
      message = `✨ LENDÁRIO! Você encontrou: ${items.map(i => i.name).join(', ')}!`;
      break;
  }

  return { items, message };
}

/**
 * Drops aleatórios de eventos especiais
 */
export function getEventDrop(): DropResult | null {
  // 20% chance de drop em eventos
  if (Math.random() > 0.2) {
    return null;
  }

  const allItems = [...SHOP_ITEMS, ...RARE_ITEMS];
  const item = allItems[Math.floor(Math.random() * allItems.length)];
  
  return {
    items: [{ ...item, quantity: 1 }],
    message: `🎁 Você encontrou: ${item.name}!`,
  };
}

/**
 * Drops de exploração (futuro)
 */
export function getExplorationDrop(area: string): DropResult {
  // Placeholder para sistema de exploração
  const commonItems = SHOP_ITEMS.filter(i => i.price <= 200);
  const item = commonItems[Math.floor(Math.random() * commonItems.length)];
  
  return {
    items: [{ ...item, quantity: 1 }],
    message: `🗺️ Você encontrou ${item.name} explorando ${area}!`,
  };
}

