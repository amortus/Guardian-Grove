/**
 * Sistema de Combate - Guardian Grove
 * Gerencia batalhas táticas por turnos
 */

import type {
  Beast,
  BattleContext,
  CombatEntity,
  CombatAction,
  CombatResult,
  CombatEffect,
  Technique,
} from '../types';
import { chooseAIAction, assignAIBasedOnDifficulty } from './combat-ai';

/**
 * Cria uma nova entidade de combate a partir de uma Beast
 */
export function createCombatEntity(beast: Beast): CombatEntity {
  return {
    beast,
    currentHp: beast.currentHp,
    currentEssence: beast.essence,
    isDefending: false,
    activeEffects: [],
  };
}

/**
 * Inicia uma nova batalha
 */
export function initiateBattle(playerBeast: Beast, enemyBeast: Beast, canFlee: boolean = true): BattleContext {
  return {
    phase: 'intro',
    player: createCombatEntity(playerBeast),
    enemy: createCombatEntity(enemyBeast),
    turnCount: 0,
    combatLog: ['A batalha começou!'],
    winner: null,
    canFlee,
  };
}

/**
 * Verifica se uma técnica pode ser usada
 */
export function canUseTechnique(technique: Technique, essence: number): boolean {
  return essence >= technique.essenceCost;
}

/**
 * Calcula chance de acerto baseado em Foco vs Agilidade
 */
/**
 * Calcula chance de acerto baseado em Foco do atacante e Agilidade do defensor
 * NOVO: Agility tem MUITO mais impacto na esquiva
 */
function calculateHitChance(attackerFocus: number, defenderAgility: number, isDefending: boolean): number {
  const baseChance = 0.85; // 85% base
  
  // Focus: Até +12% de precisão (melhorado)
  // Focus 50 → +6%
  // Focus 100 → +12%
  const focusBonus = (attackerFocus / 100) * 0.12;
  
  // Agility: Até -30% de chance de ser atingido (MUITO aumentado)
  // Agility 50 → -15% (inimigo tem 15% menos chance de acertar)
  // Agility 100 → -30% (inimigo tem 30% menos chance de acertar)
  const agilityPenalty = (defenderAgility / 100) * 0.30;
  
  // Defendendo: -20% de chance de ser atingido
  const defendBonus = isDefending ? 0.20 : 0;

  // Chance final: 10% mínimo, 95% máximo
  return Math.max(0.10, Math.min(0.95, baseChance + focusBonus - agilityPenalty + defendBonus));
}

/**
 * Calcula chance de crítico baseado em Foco + Agilidade
 * NOVO: Crítico mais impactante e frequente
 */
function calculateCritChance(focus: number, agility: number): number {
  const baseChance = 0.05; // 5% base
  
  // Focus: Até +15% de crítico (antes era +10%)
  // Focus 50 → +5% (total 10%)
  // Focus 100 → +15% (total 20%)
  const focusBonus = (focus / 100) * 0.15;
  
  // Agility: Até +10% de crítico (antes era +5%)
  // Agility 50 → +5% (total 10%)
  // Agility 100 → +10% (total 15%)
  const agilityBonus = (agility / 100) * 0.10;
  
  // Máximo 35% de chance de crítico (antes era 30%)
  return Math.min(0.35, baseChance + focusBonus + agilityBonus);
}

/**
 * Calcula dano físico ou místico
 * SISTEMA RPG COMPLETO: Atributos têm GRANDE impacto
 */
function calculateDamage(
  technique: Technique,
  attacker: CombatEntity,
  defender: CombatEntity,
  isCritical: boolean
): number {
  const attrs = attacker.beast.attributes;
  const defAttrs = defender.beast.attributes;

  let baseDamage = technique.damage;
  
  // NOVO: Bônus de atributo MUITO MAIOR (80-100% do valor)
  if (technique.type === 'physical') {
    // Dano Físico = baseDamage + (Might * 0.8)
    // Might 50 → +40 dano
    // Might 100 → +80 dano
    baseDamage += attrs.might * 0.8;
  } else if (technique.type === 'mystical') {
    // Dano Místico = baseDamage + (Wit * 0.6 + Focus * 0.4)
    // Wit 50 + Focus 50 → +50 dano
    // Wit 100 + Focus 100 → +100 dano
    baseDamage += attrs.wit * 0.6 + attrs.focus * 0.4;
  }

  // NOVO: Defesa MAIOR (Ward * 0.5)
  // Ward 50 → -25 dano
  // Ward 100 → -50 dano
  const defense = defAttrs.ward * 0.5;
  baseDamage = Math.max(1, baseDamage - defense);

  // Defesa ativa reduz em 60% (aumentado de 50%)
  if (defender.isDefending) {
    baseDamage *= 0.4;
  }

  // NOVO: Crítico aumenta baseado em Focus
  // Base: +50% dano
  // Com Focus alto: até +100% dano
  const critMultiplier = 1.5 + (attrs.focus / 200); // 1.5x a 2.0x
  if (isCritical) {
    baseDamage *= critMultiplier;
  }

  return Math.floor(baseDamage);
}

/**
 * Verifica se a besta desobedece (baseado em Lealdade e Stress)
 */
function checkDisobedience(beast: Beast): boolean {
  const loyalty = beast.secondaryStats.loyalty;
  const stress = beast.secondaryStats.stress;
  
  // Chance base de desobediência
  let disobedChance = 0.05; // 5% base
  
  // Lealdade baixa aumenta chance
  if (loyalty < 30) {
    disobedChance += 0.3; // +30% se lealdade muito baixa
  } else if (loyalty < 50) {
    disobedChance += 0.15; // +15% se lealdade baixa
  }
  
  // Stress alto aumenta chance
  if (stress > 70) {
    disobedChance += 0.2; // +20% se stress muito alto
  } else if (stress > 50) {
    disobedChance += 0.1; // +10% se stress alto
  }
  
  return Math.random() < disobedChance;
}

/**
 * Executa uma técnica
 */
export function executeTechnique(
  attacker: CombatEntity,
  defender: CombatEntity,
  technique: Technique
): CombatResult {
  const messages: string[] = [];
  
  // Verifica desobediência
  if (checkDisobedience(attacker.beast)) {
    return {
      success: false,
      damage: 0,
      essenceCost: 0,
      disobeyed: true,
      critical: false,
      missed: false,
      effects: [],
      messages: [`${attacker.beast.name} desobedeceu e não atacou!`],
    };
  }

  // Consome essência
  attacker.currentEssence -= technique.essenceCost;

  // Calcula acerto
  const hitChance = calculateHitChance(
    attacker.beast.attributes.focus,
    defender.beast.attributes.agility,
    defender.isDefending
  );
  
  const hit = Math.random() < hitChance;
  
  if (!hit) {
    return {
      success: false,
      damage: 0,
      essenceCost: technique.essenceCost,
      disobeyed: false,
      critical: false,
      missed: true,
      effects: [],
      messages: [`${attacker.beast.name} errou ${technique.name}!`],
    };
  }

  // Calcula crítico
  const critChance = calculateCritChance(
    attacker.beast.attributes.focus,
    attacker.beast.attributes.agility
  );
  const isCritical = Math.random() < critChance;

  // Calcula dano
  const damage = calculateDamage(technique, attacker, defender, isCritical);
  
  // Aplica dano
  defender.currentHp = Math.max(0, defender.currentHp - damage);
  
  // Mensagem
  messages.push(`${attacker.beast.name} usou ${technique.name}!`);
  if (isCritical) {
    messages.push(`💥 Acerto crítico! ${damage} de dano!`);
  } else {
    messages.push(`${damage} de dano!`);
  }

  // Efeitos especiais (simplificado por enquanto)
  const effects: CombatEffect[] = [];
  
  return {
    success: true,
    damage,
    essenceCost: technique.essenceCost,
    disobeyed: false,
    critical: isCritical,
    missed: false,
    effects,
    messages,
  };
}

/**
 * Executa a ação de defender
 */
export function executeDefend(entity: CombatEntity): CombatResult {
  entity.isDefending = true;
  
  // Recupera um pouco de essência ao defender
  const essenceGain = Math.floor(entity.beast.maxEssence * 0.1);
  entity.currentEssence = Math.min(entity.beast.maxEssence, entity.currentEssence + essenceGain);
  
  return {
    success: true,
    damage: 0,
    essenceCost: 0,
    disobeyed: false,
    critical: false,
    missed: false,
    effects: [],
    messages: [
      `${entity.beast.name} está em posição defensiva!`,
      `+${essenceGain} Essência recuperada.`,
    ],
  };
}

/**
 * Processa efeitos ativos (DoT, buffs, debuffs)
 */
export function processActiveEffects(entity: CombatEntity): string[] {
  const messages: string[] = [];
  
  entity.activeEffects = entity.activeEffects.filter(effect => {
    if (effect.duration <= 0) return false;
    
    // Aplica efeito
    if (effect.type === 'damage') {
      entity.currentHp = Math.max(0, entity.currentHp - effect.value);
      messages.push(`${entity.beast.name} sofreu ${effect.value} de ${effect.description}`);
    } else if (effect.type === 'heal') {
      const healed = Math.min(effect.value, entity.beast.maxHp - entity.currentHp);
      entity.currentHp += healed;
      messages.push(`${entity.beast.name} recuperou ${healed} HP`);
    }
    
    // Decrementa duração
    effect.duration--;
    return effect.duration > 0;
  });
  
  return messages;
}

/**
 * Verifica se a batalha terminou
 */
export function checkBattleEnd(battle: BattleContext): void {
  if (battle.player.currentHp <= 0) {
    battle.phase = 'defeat';
    battle.winner = 'enemy';
    battle.combatLog.push('Você foi derrotado!');
  } else if (battle.enemy.currentHp <= 0) {
    battle.phase = 'victory';
    battle.winner = 'player';
    battle.combatLog.push('Vitória!');
  }
}

/**
 * Avança para o próximo turno
 */
export function nextTurn(battle: BattleContext): void {
  if (battle.phase === 'player_turn') {
    battle.phase = 'enemy_turn';
    battle.player.isDefending = false;
  } else if (battle.phase === 'enemy_turn') {
    battle.phase = 'player_turn';
    battle.enemy.isDefending = false;
    battle.turnCount++;
  }
}

/**
 * Escolhe ação da IA inimiga
 * @deprecated Use chooseAIAction from combat-ai.ts instead
 */
export function chooseEnemyAction(battle: BattleContext): CombatAction {
  const enemy = battle.enemy;
  
  // Estratégia simples (legacy):
  // 1. Se HP baixo (<30%) e tem essência, defende
  // 2. Senão, usa técnica aleatória que pode ser usada
  
  const hpPercent = enemy.currentHp / enemy.beast.maxHp;
  
  if (hpPercent < 0.3 && enemy.currentEssence > 0) {
    return { type: 'defend' };
  }
  
  // Filtra técnicas que podem ser usadas
  const usableTechniques = enemy.beast.techniques.filter(t => 
    canUseTechnique(t, enemy.currentEssence)
  );
  
  if (usableTechniques.length === 0) {
    // Sem técnicas disponíveis, defende
    return { type: 'defend' };
  }
  
  // Escolhe técnica aleatória
  const technique = usableTechniques[Math.floor(Math.random() * usableTechniques.length)];
  
  return {
    type: 'technique',
    techniqueId: technique.id,
  };
}

/**
 * Executa ação do jogador
 */
export function executePlayerAction(battle: BattleContext, action: CombatAction): CombatResult | null {
  if (battle.phase !== 'player_turn') {
    return null;
  }
  
  let result: CombatResult;
  
  if (action.type === 'technique') {
    const technique = battle.player.beast.techniques.find(t => t.id === action.techniqueId);
    if (!technique) return null;
    
    if (!canUseTechnique(technique, battle.player.currentEssence)) {
      return null;
    }
    
    result = executeTechnique(battle.player, battle.enemy, technique);
  } else if (action.type === 'defend') {
    result = executeDefend(battle.player);
  } else if (action.type === 'flee') {
    if (battle.canFlee) {
      battle.phase = 'fled';
      return {
        success: true,
        damage: 0,
        essenceCost: 0,
        disobeyed: false,
        critical: false,
        missed: false,
        effects: [],
        messages: ['Você fugiu da batalha!'],
      };
    }
    return null;
  } else {
    return null;
  }
  
  // Adiciona mensagens ao log
  battle.combatLog.push(...result.messages);
  
  // Processa efeitos
  const effectMessages = processActiveEffects(battle.enemy);
  battle.combatLog.push(...effectMessages);
  
  // Verifica fim de batalha
  checkBattleEnd(battle);
  
  if (battle.winner === null) {
    // Passa turno para inimigo
    nextTurn(battle);
  }
  
  return result;
}

/**
 * Executa turno do inimigo
 * @param battle Contexto da batalha
 * @param useAdvancedAI Se true, usa IA avançada. Se false, usa IA simples (legacy)
 */
export function executeEnemyTurn(battle: BattleContext, useAdvancedAI: boolean = true): CombatResult {
  let action: CombatAction;
  
  if (useAdvancedAI) {
    // Usa IA avançada
    const aiConfig = assignAIBasedOnDifficulty(battle.enemy.beast);
    action = chooseAIAction(battle, aiConfig);
  } else {
    // Usa IA simples (legacy)
    action = chooseEnemyAction(battle);
  }
  
  let result: CombatResult;
  
  if (action.type === 'technique') {
    const technique = battle.enemy.beast.techniques.find(t => t.id === action.techniqueId);
    if (!technique) {
      // Fallback para defesa
      result = executeDefend(battle.enemy);
    } else {
      result = executeTechnique(battle.enemy, battle.player, technique);
    }
  } else {
    result = executeDefend(battle.enemy);
  }
  
  // Adiciona mensagens ao log
  battle.combatLog.push(...result.messages);
  
  // Processa efeitos
  const effectMessages = processActiveEffects(battle.player);
  battle.combatLog.push(...effectMessages);
  
  // Verifica fim de batalha
  checkBattleEnd(battle);
  
  if (battle.phase !== 'victory' && battle.phase !== 'defeat') {
    // Passa turno para jogador
    nextTurn(battle);
  }
  
  return result;
}

/**
 * Aplica recompensas da batalha
 */
export function applyBattleRewards(battle: BattleContext, basePrize: number): void {
  if (battle.winner !== 'player') return;
  
  battle.rewards = {
    coronas: basePrize,
    experience: Math.floor(battle.enemy.beast.attributes.might * 0.5),
    items: [],
  };
}

