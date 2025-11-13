/**
 * Sistema de geração e gerenciamento de Bestas
 */

import type { Beast, BeastLine, Attributes, PersonalityTrait } from '../types';
import { getBeastLineData } from '../data/beasts';
import { getStartingTechniques } from '../data/techniques';

/**
 * Gera um ID único para a besta
 */
function generateBeastId(): string {
  return `beast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * ===== SISTEMA RPG: FÓRMULAS DE ATRIBUTOS =====
 */

/**
 * Calcula HP máximo baseado em Vitalidade
 * Fórmula RPG: HP = (Vitality * 3) + 50
 * Vitality 30 → 140 HP
 * Vitality 50 → 200 HP
 * Vitality 100 → 350 HP
 * 
 * EXPORTADO: Usado para recalcular HP ao carregar do servidor
 */
export function calculateMaxHp(vitality: number): number {
  return Math.floor(vitality * 3 + 50);
}

/**
 * Calcula Essência máxima baseada em Wit + Focus
 * Fórmula RPG: Essência = ((Wit + Focus) / 2) + 30
 * Wit 30 + Focus 30 → 60 Essência
 * Wit 50 + Focus 50 → 80 Essência
 * Wit 100 + Focus 100 → 130 Essência
 * 
 * EXPORTADO: Usado para recalcular Essência ao carregar do servidor
 */
export function calculateMaxEssence(wit: number, focus: number): number {
  return Math.floor((wit + focus) / 2 + 30);
}

/**
 * Recalcula TODOS os stats derivados de uma beast baseado nos atributos atuais
 * Útil ao carregar do servidor ou após usar elixires
 * 
 * IMPORTANTE: Preserva HP e Essência atuais proporcionalmente
 */
export function recalculateDerivedStats(beast: Beast): void {
  const attrs = beast.attributes;
  
  // Salvar proporções atuais
  const hpRatio = beast.maxHp > 0 ? beast.currentHp / beast.maxHp : 1;
  const essenceRatio = beast.maxEssence > 0 ? beast.essence / beast.maxEssence : 1;
  
  // Recalcular stats máximos
  const newMaxHp = calculateMaxHp(attrs.vitality);
  const newMaxEssence = calculateMaxEssence(attrs.wit, attrs.focus);
  
  // Atualizar máximos
  beast.maxHp = newMaxHp;
  beast.maxEssence = newMaxEssence;
  
  // Atualizar valores atuais mantendo proporção
  beast.currentHp = Math.min(Math.floor(newMaxHp * hpRatio), newMaxHp);
  beast.essence = Math.min(Math.floor(newMaxEssence * essenceRatio), newMaxEssence);
  
  console.log(`[Beast] Stats recalculados: HP ${beast.currentHp}/${beast.maxHp}, Essência ${beast.essence}/${beast.maxEssence}`);
}

/**
 * Gera uma nova Besta de uma linha específica
 */
export function createBeast(line: BeastLine, name: string, currentWeek: number = 0): Beast {
  const lineData = getBeastLineData(line);
  const startingTechniques = getStartingTechniques(line);
  const now = Date.now();

  // Copia atributos base
  const attributes: Attributes = { ...lineData.baseAttributes };

  // Adiciona pequena variação aleatória (-5% a +5%)
  Object.keys(attributes).forEach(key => {
    const attrKey = key as keyof Attributes;
    const base = attributes[attrKey];
    const variation = Math.floor(base * (Math.random() * 0.1 - 0.05));
    attributes[attrKey] = Math.max(10, base + variation);
  });

  const maxHp = calculateMaxHp(attributes.vitality);
  const maxEssence = calculateMaxEssence(attributes.wit, attributes.focus);

  // Traço inicial aleatório (simplificado para MVP)
  const possibleTraits: PersonalityTrait[] = ['loyal', 'brave', 'curious', 'lazy', 'proud'];
  const initialTrait = possibleTraits[Math.floor(Math.random() * possibleTraits.length)];

  const beast: Beast = {
    id: generateBeastId(),
    name,
    line,
    blood: 'common', // Por enquanto sempre comum
    affinity: lineData.affinity[0], // Primeira afinidade
    
    attributes,
    secondaryStats: {
      fatigue: 0,
      stress: 0,
      loyalty: 50,
      age: 0,
      maxAge: lineData.baseLifespan || 365, // dias (padrão 1 ano)
    },
    
    traits: [initialTrait],
    mood: 'happy',
    
    techniques: startingTechniques,
    currentHp: maxHp,
    maxHp,
    essence: maxEssence, // NOVO: Inicia com essência máxima
    maxEssence, // NOVO: Baseado em Wit + Focus
    
    birthWeek: currentWeek,
    birthDate: now, // timestamp de nascimento
    lastUpdate: now,
    lifeEvents: [{
      week: currentWeek,
      type: 'birth',
      description: `${name} nasceu de uma Relíquia de Eco`,
    }],
    victories: 0,
    defeats: 0,
  };

  return beast;
}

/**
 * Aplica crescimento de atributos baseado na curva e treino
 */
export function applyGrowth(beast: Beast, attribute: keyof Attributes, intensity: number = 1): number {
  const lineData = getBeastLineData(beast.line);
  const growthRate = lineData.growthCurve[attribute];
  
  // Multiplicadores de crescimento
  const multipliers = {
    none: 0,
    slow: 0.5,
    medium: 1.0,
    fast: 1.5,
    veryfast: 2.0,
  };

  const baseGrowth = multipliers[growthRate] * intensity;
  const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 a 1.2
  const growth = Math.floor(baseGrowth * randomFactor);

  // Aplica crescimento
  beast.attributes[attribute] = Math.min(beast.attributes[attribute] + growth, 150);

  // NOVO: Atualiza stats derivados quando atributos mudam
  if (attribute === 'vitality') {
    const newMaxHp = calculateMaxHp(beast.attributes.vitality);
    const hpDiff = newMaxHp - beast.maxHp;
    beast.maxHp = newMaxHp;
    beast.currentHp = Math.min(beast.currentHp + hpDiff, beast.maxHp);
  }
  
  // NOVO: Atualiza Essência máxima ao treinar Wit ou Focus
  if (attribute === 'wit' || attribute === 'focus') {
    const newMaxEssence = calculateMaxEssence(beast.attributes.wit, beast.attributes.focus);
    const essenceDiff = newMaxEssence - beast.maxEssence;
    beast.maxEssence = newMaxEssence;
    beast.essence = Math.min(beast.essence + essenceDiff, beast.maxEssence);
  }

  return growth;
}

/**
 * Envelhece a besta em 1 semana
 */
export function ageBeast(beast: Beast) {
  beast.secondaryStats.age++;
  
  // Recuperação natural de fadiga/stress ao envelhecer
  beast.secondaryStats.fatigue = Math.max(0, beast.secondaryStats.fatigue - 5);
  beast.secondaryStats.stress = Math.max(0, beast.secondaryStats.stress - 3);
  
  // Atualiza mood baseado em stress
  if (beast.secondaryStats.stress > 70) {
    beast.mood = 'angry';
  } else if (beast.secondaryStats.stress > 40) {
    beast.mood = 'tired';
  } else if (beast.secondaryStats.fatigue > 60) {
    beast.mood = 'tired';
  } else if (beast.secondaryStats.stress < 20 && beast.secondaryStats.fatigue < 30) {
    beast.mood = 'happy';
  } else {
    beast.mood = 'neutral';
  }
}

/**
 * Calcula idade da besta em dias reais
 * Usa ageInDays (processado no servidor a meia-noite) ao invés de calcular por timestamp
 */
export function calculateBeastAge(
  beast: Beast,
  currentTime?: number
): {
  ageInDays: number;
  isAlive: boolean;
  daysRemaining: number;
} {
  // Usar ageInDays se disponível (sistema de ciclo diário)
  // Caso contrário, calcular baseado no timestamp (fallback para compatibilidade)
  let ageInDays: number;
  
  if (beast.ageInDays !== undefined) {
    ageInDays = beast.ageInDays;
  } else if (beast.birthDate && currentTime) {
    // Fallback: calcular baseado em timestamp (compatibilidade com saves antigos)
    const msPerDay = 24 * 60 * 60 * 1000;
    ageInDays = Math.floor((currentTime - beast.birthDate) / msPerDay);
  } else {
    ageInDays = 0;
  }
  
  const lifespan = beast.secondaryStats.maxAge || 365; // dias (padrão 1 ano)
  
  return {
    ageInDays,
    isAlive: ageInDays < lifespan,
    daysRemaining: Math.max(0, lifespan - ageInDays),
  };
}

/**
 * Verifica se a besta está viva (baseado em dias reais)
 */
export function isBeastAlive(beast: Beast, currentTime?: number): boolean {
  const time = currentTime || Date.now();
  const { isAlive } = calculateBeastAge(beast, time);
  return isAlive;
}

/**
 * Calcula a fase de vida da besta (baseado em dias reais)
 */
export function getLifePhase(beast: Beast, currentTime?: number): 'infant' | 'young' | 'adult' | 'mature' | 'elder' {
  const time = currentTime || Date.now();
  const { ageInDays } = calculateBeastAge(beast, time);
  const maxAge = beast.secondaryStats.maxAge || 365;
  const percentage = (ageInDays / maxAge) * 100;

  if (percentage < 13) return 'infant';    // 0-47 dias
  if (percentage < 38) return 'young';     // 48-138 dias
  if (percentage < 75) return 'adult';     // 139-273 dias
  if (percentage < 90) return 'mature';    // 274-328 dias
  return 'elder';                          // 329+ dias
}

/**
 * Adiciona evento ao histórico da besta
 */
export function addLifeEvent(
  beast: Beast,
  week: number,
  type: Beast['lifeEvents'][0]['type'],
  description: string
) {
  beast.lifeEvents.push({ week, type, description });
}

/**
 * Cura a besta (recupera HP)
 */
export function healBeast(beast: Beast, amount: number) {
  beast.currentHp = Math.min(beast.currentHp + amount, beast.maxHp);
}

/**
 * Recupera essência
 */
export function recoverEssence(beast: Beast, amount: number) {
  beast.essence = Math.min(beast.essence + amount, beast.maxEssence);
}

/**
 * Reduz fadiga
 */
export function reduceFatigue(beast: Beast, amount: number) {
  beast.secondaryStats.fatigue = Math.max(0, beast.secondaryStats.fatigue - amount);
}

/**
 * Reduz stress
 */
export function reduceStress(beast: Beast, amount: number) {
  beast.secondaryStats.stress = Math.max(0, beast.secondaryStats.stress - amount);
}

/**
 * Adiciona fadiga
 */
export function addFatigue(beast: Beast, amount: number) {
  beast.secondaryStats.fatigue = Math.min(100, beast.secondaryStats.fatigue + amount);
}

/**
 * Adiciona stress
 */
export function addStress(beast: Beast, amount: number) {
  beast.secondaryStats.stress = Math.min(100, beast.secondaryStats.stress + amount);
}

/**
 * Serializa besta para save
 */
export function serializeBeast(beast: Beast): string {
  return JSON.stringify(beast);
}

/**
 * Deserializa besta do save
 */
export function deserializeBeast(data: string): Beast {
  return JSON.parse(data) as Beast;
}

