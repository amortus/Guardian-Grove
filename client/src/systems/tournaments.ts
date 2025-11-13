/**
 * Sistema de Torneios - Guardian Grove
 * Gerencia torneios e geração de oponentes
 */

import type { Beast, BeastLine, TournamentRank } from '../types';
import { createBeast } from './beast';

/**
 * Gera uma besta inimiga para torneio
 */
export function generateTournamentOpponent(rank: TournamentRank, playerBeastLevel: number): Beast {
  // Escolhe linha aleatória
  const lines: BeastLine[] = ['olgrim', 'terravox', 'feralis', 'brontis', 'zephyra', 'ignar', 'mirella', 'umbrix', 'sylphid', 'raukor'];
  const randomLine = lines[Math.floor(Math.random() * lines.length)];
  
  // Calcula nível base do oponente baseado no rank
  let baseLevel: number;
  let levelVariation: number;
  
  switch (rank) {
    case 'bronze':
      baseLevel = Math.max(20, playerBeastLevel - 10);
      levelVariation = 10;
      break;
    case 'silver':
      baseLevel = Math.max(40, playerBeastLevel);
      levelVariation = 15;
      break;
    case 'gold':
      baseLevel = Math.max(80, playerBeastLevel + 10);
      levelVariation = 20;
      break;
    case 'mythic':
      baseLevel = Math.max(120, playerBeastLevel + 30);
      levelVariation = 30;
      break;
  }
  
  const enemyAge = baseLevel + Math.floor(Math.random() * levelVariation);
  
  // Cria besta inimiga
  const enemy = createBeast(randomLine, `Oponente ${rank.toUpperCase()}`, 0);
  
  // "Envelhe" a besta para simular treino
  for (let i = 0; i < enemyAge; i++) {
    // Aplica crescimento simulado
    const growthMultiplier = 1 + Math.random() * 0.5;
    enemy.attributes.might += growthMultiplier;
    enemy.attributes.wit += growthMultiplier;
    enemy.attributes.focus += growthMultiplier * 0.8;
    enemy.attributes.agility += growthMultiplier * 0.8;
    enemy.attributes.ward += growthMultiplier;
    enemy.attributes.vitality += growthMultiplier * 1.2;
  }
  
  // Atualiza HP e Essência
  enemy.maxHp = Math.floor(enemy.attributes.vitality * 5);
  enemy.currentHp = enemy.maxHp;
  enemy.maxEssence = 99;
  enemy.essence = 99;
  
  // Ajusta lealdade e stats secundários
  enemy.secondaryStats.loyalty = 80 + Math.floor(Math.random() * 20);
  enemy.secondaryStats.stress = Math.floor(Math.random() * 30);
  enemy.secondaryStats.fatigue = Math.floor(Math.random() * 30);
  enemy.secondaryStats.age = enemyAge;
  
  return enemy;
}

/**
 * Calcula prêmio em Coronas baseado no rank
 */
export function getTournamentPrize(rank: TournamentRank): number {
  switch (rank) {
    case 'bronze':
      return 500;
    case 'silver':
      return 1200;
    case 'gold':
      return 3000;
    case 'mythic':
      return 7000;
  }
}

/**
 * Calcula taxa de inscrição baseada no rank
 */
export function getTournamentFee(rank: TournamentRank): number {
  switch (rank) {
    case 'bronze':
      return 0; // Grátis para iniciantes
    case 'silver':
      return 300;
    case 'gold':
      return 800;
    case 'mythic':
      return 2000;
  }
}

/**
 * Verifica se o jogador pode participar do rank
 */
export function canEnterTournament(rank: TournamentRank, playerVictories: number, playerCoronas: number): boolean {
  const fee = getTournamentFee(rank);
  
  if (playerCoronas < fee) {
    return false;
  }
  
  // Requisitos de vitórias
  switch (rank) {
    case 'bronze':
      return true; // Sempre pode
    case 'silver':
      return playerVictories >= 1; // Precisa de 1 vitória Bronze
    case 'gold':
      return playerVictories >= 3; // Precisa de 3 vitórias totais
    case 'mythic':
      return playerVictories >= 8; // Precisa de 8 vitórias totais
  }
}

/**
 * Retorna nome amigável do rank
 */
export function getRankName(rank: TournamentRank): string {
  const names: Record<TournamentRank, string> = {
    bronze: 'Bronze',
    silver: 'Prata',
    gold: 'Ouro',
    mythic: 'Mítico',
  };
  return names[rank];
}

