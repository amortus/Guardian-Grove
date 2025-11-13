/**
 * Sistema de Ciclo de Vida das Bestas
 * Envelhecimento, morte e herança
 */

import type { Beast, Technique } from '../types';

export interface BeastAgeStage {
  name: string;
  minWeeks: number;
  maxWeeks: number;
  description: string;
  visualEffect: 'young' | 'adult' | 'elder' | 'ancient';
  statModifier: number; // Multiplicador de stats (0.8 a 1.2)
}

export interface BeastMemorial {
  id: string;
  beastName: string;
  beastLine: string;
  deathWeek: number;
  ageAtDeath: number;
  achievements: string[];
  totalVictories: number;
  createdAt: number;
}

export interface InheritanceData {
  parentBeast: Beast;
  inheritedStats: {
    might: number;
    focus: number;
    ward: number;
    vitality: number;
    agility: number;
    wit: number;
  };
  spectralTechniques: Technique[];
  bonusTraits: string[];
}

/**
 * Estágios de idade da Besta
 */
export const AGE_STAGES: BeastAgeStage[] = [
  {
    name: 'Filhote',
    minWeeks: 0,
    maxWeeks: 20,
    description: 'Jovem e cheio de energia',
    visualEffect: 'young',
    statModifier: 0.9,
  },
  {
    name: 'Adulto',
    minWeeks: 21,
    maxWeeks: 80,
    description: 'No auge de suas capacidades',
    visualEffect: 'adult',
    statModifier: 1.0,
  },
  {
    name: 'Veterano',
    minWeeks: 81,
    maxWeeks: 130,
    description: 'Experiente e sábio',
    visualEffect: 'elder',
    statModifier: 1.1,
  },
  {
    name: 'Ancião',
    minWeeks: 131,
    maxWeeks: 155,
    description: 'Um verdadeiro mestre',
    visualEffect: 'ancient',
    statModifier: 1.2,
  },
];

/**
 * Idade máxima em semanas (3 anos)
 */
export const MAX_AGE_WEEKS = 156;

/**
 * Obtém estágio de idade da Besta
 */
export function getBeastAgeStage(ageInWeeks: number): BeastAgeStage {
  for (const stage of AGE_STAGES) {
    if (ageInWeeks >= stage.minWeeks && ageInWeeks <= stage.maxWeeks) {
      return stage;
    }
  }
  return AGE_STAGES[AGE_STAGES.length - 1]; // Retorna último estágio
}

/**
 * Verifica se a Besta morreu de velhice
 */
export function isDead(ageInWeeks: number): boolean {
  return ageInWeeks >= MAX_AGE_WEEKS;
}

/**
 * Calcula idade em semanas baseado no tempo de criação
 */
export function calculateAge(beast: Beast): number {
  return beast.secondaryStats.age;
}

/**
 * Cria memorial de Besta falecida
 */
export function createMemorial(
  beast: Beast,
  currentWeek: number,
  totalVictories: number
): BeastMemorial {
  const age = calculateAge(beast);
  
  return {
    id: `memorial_${beast.id}_${Date.now()}`,
    beastName: beast.name,
    beastLine: beast.line,
    deathWeek: currentWeek,
    ageAtDeath: age,
    achievements: [], // Conquistas associadas à Besta
    totalVictories,
    createdAt: Date.now(),
  };
}

/**
 * Prepara dados de herança para nova Besta
 */
export function prepareInheritance(parentBeast: Beast): InheritanceData {
  // Herda 50% dos atributos
  const inheritedStats = {
    might: Math.floor(parentBeast.attributes.might * 0.5),
    focus: Math.floor(parentBeast.attributes.focus * 0.5),
    ward: Math.floor(parentBeast.attributes.ward * 0.5),
    vitality: Math.floor(parentBeast.attributes.vitality * 0.5),
    agility: Math.floor(parentBeast.attributes.agility * 0.5),
    wit: Math.floor(parentBeast.attributes.wit * 0.5),
  };
  
  // Seleciona 2 técnicas aleatórias para versões espectrais
  const techniques = parentBeast.techniques || [];
  const shuffled = [...techniques].sort(() => Math.random() - 0.5);
  const selectedTechniques = shuffled.slice(0, Math.min(2, techniques.length));
  
  // Cria versões espectrais (damage aumentado em 20%)
  const spectralTechniques: Technique[] = selectedTechniques.map(tech => ({
    ...tech,
    id: `spectral_${tech.id}`,
    name: `☠️ ${tech.name} Espectral`,
    description: `Versão aprimorada herdada: ${tech.description}`,
    damage: Math.floor(tech.damage * 1.2),
    essenceCost: tech.essenceCost,
    type: tech.type,
    effect: tech.effect,
  }));
  
  // Bônus trait: "Reencarnada"
  const bonusTraits = ['Reencarnada (+10% XP)'];
  
  return {
    parentBeast,
    inheritedStats,
    spectralTechniques,
    bonusTraits,
  };
}

/**
 * Aplica herança à nova Besta
 */
export function applyInheritance(newBeast: Beast, inheritance: InheritanceData): Beast {
  // Aplicar stats herdados
  newBeast.attributes.might += inheritance.inheritedStats.might;
  newBeast.attributes.focus += inheritance.inheritedStats.focus;
  newBeast.attributes.ward += inheritance.inheritedStats.ward;
  newBeast.attributes.vitality += inheritance.inheritedStats.vitality;
  newBeast.attributes.agility += inheritance.inheritedStats.agility;
  newBeast.attributes.wit += inheritance.inheritedStats.wit;
  
  // Adicionar técnicas espectrais
  if (!newBeast.techniques) {
    newBeast.techniques = [];
  }
  newBeast.techniques.push(...inheritance.spectralTechniques);
  
  // Adicionar trait de reencarnação
  if (!newBeast.traits.includes('loyal')) {
    newBeast.traits.push('loyal'); // Trait de reencarnação
  }
  
  // Marcar como reencarnada
  (newBeast as any).isReincarnated = true;
  (newBeast as any).parentId = inheritance.parentBeast.id;
  
  return newBeast;
}

/**
 * Gera mensagem de cerimônia de Eco
 */
export function generateCeremonyMessage(beast: Beast, age: number, victories: number): string {
  const stage = getBeastAgeStage(age);
  
  return `
🌟 **Cerimônia de Eco** 🌟

${beast.name}, um nobre ${beast.line}, alcançou o fim de sua jornada terrena.

**Idade:** ${age} semanas (${stage.name})
**Vitórias:** ${victories}
**Lealdade:** ${beast.secondaryStats.loyalty}

*"Do eco nasce a vida, e à vida retorna o eco.
Que sua essência floresça em nova forma,
Mais forte, mais sábia, eternamente conectada."*

Uma nova Besta nascerá com parte de sua força e sabedoria.
  `.trim();
}

/**
 * Calcula bônus de XP para Bestas reencarnadas
 */
export function getReincarnationXPBonus(beast: Beast): number {
  if ((beast as any).isReincarnated) {
    return 0.1; // +10% XP
  }
  return 0;
}

/**
 * Verifica se é hora da cerimônia (Besta morreu)
 */
export function shouldPerformCeremony(beast: Beast | null): boolean {
  if (!beast) return false;
  const age = calculateAge(beast);
  return isDead(age);
}

/**
 * Obtém efeito visual baseado na idade
 */
export function getAgeVisualEffect(ageInWeeks: number): {
  filter: string;
  overlay: string;
  description: string;
} {
  const stage = getBeastAgeStage(ageInWeeks);
  
  switch (stage.visualEffect) {
    case 'young':
      return {
        filter: 'brightness(1.1) saturate(1.2)',
        overlay: '✨',
        description: 'Brilhante e vibrante',
      };
    case 'adult':
      return {
        filter: 'none',
        overlay: '',
        description: 'Forte e saudável',
      };
    case 'elder':
      return {
        filter: 'contrast(0.9) saturate(0.8)',
        overlay: '🍂',
        description: 'Marcas da experiência',
      };
    case 'ancient':
      return {
        filter: 'contrast(0.8) saturate(0.6) grayscale(0.2)',
        overlay: '👴',
        description: 'Sabedoria ancestral',
      };
    default:
      return {
        filter: 'none',
        overlay: '',
        description: '',
      };
  }
}

/**
 * Calcula dias restantes até a morte
 */
export function getDaysUntilDeath(beast: Beast): number {
  const age = calculateAge(beast);
  const weeksRemaining = MAX_AGE_WEEKS - age;
  return weeksRemaining * 7;
}

/**
 * Verifica se está próximo da morte (últimas 10 semanas)
 */
export function isNearDeath(beast: Beast): boolean {
  const age = calculateAge(beast);
  return age >= MAX_AGE_WEEKS - 10;
}

