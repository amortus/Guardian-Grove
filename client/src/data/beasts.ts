/**
 * Dados das 10 Linhas de Bestas - Guardian Grove
 * Baseado no GDD completo
 */

import type { BeastLine, ElementalAffinity, GrowthCurve, Attributes } from '../types';

export interface BeastLineData {
  line: BeastLine;
  name: string;
  description: string;
  affinity: ElementalAffinity[];
  baseAttributes: Attributes;
  growthCurve: GrowthCurve;
  baseLifespan: number; // Em semanas
  personality: string;
  strengths: string;
  weaknesses: string;
}

export const BEAST_LINES: Record<BeastLine, BeastLineData> = {
  olgrim: {
    line: 'olgrim',
    name: 'Olgrim (Mago Ancestral)',
    description: 'Um grande globo ocular flutuante com tentáculos etéreos. Sua pupila se contrai conforme sua emoção.',
    affinity: ['shadow', 'ether'],
    baseAttributes: {
      might: 20,
      wit: 90,
      focus: 70,
      agility: 50,
      ward: 25,
      vitality: 50,
    },
    growthCurve: {
      might: 'none',
      wit: 'veryfast',
      focus: 'fast',
      agility: 'medium',
      ward: 'none',
      vitality: 'slow',
    },
    baseLifespan: 130, // 2.5 anos
    personality: 'Curioso, mas facilmente entediado',
    strengths: 'Técnicas mágicas de longo alcance; alto dano místico',
    weaknesses: 'Corpo frágil, morre cedo se não for bem cuidado',
  },

  terravox: {
    line: 'terravox',
    name: 'Terravox (Golem de Pedra)',
    description: 'Criatura massiva de rochas vivas, com cristais emergindo do peito.',
    affinity: ['earth'],
    baseAttributes: {
      might: 80,
      wit: 20,
      focus: 45,
      agility: 25,
      ward: 95,
      vitality: 85,
    },
    growthCurve: {
      might: 'fast',
      wit: 'none',
      focus: 'slow',
      agility: 'none',
      ward: 'veryfast',
      vitality: 'veryfast',
    },
    baseLifespan: 208, // 4 anos
    personality: 'Paciente, obediente',
    strengths: 'Tanque natural; dificilmente abatido',
    weaknesses: 'Lento em recarregar Essência e atacar',
  },

  feralis: {
    line: 'feralis',
    name: 'Feralis (Felino Selvagem)',
    description: 'Felino grande de pelagem escura, olhos luminosos e cauda dupla.',
    affinity: ['air'],
    baseAttributes: {
      might: 65,
      wit: 45,
      focus: 65,
      agility: 85,
      ward: 45,
      vitality: 60,
    },
    growthCurve: {
      might: 'medium',
      wit: 'slow',
      focus: 'fast',
      agility: 'veryfast',
      ward: 'slow',
      vitality: 'medium',
    },
    baseLifespan: 156, // 3 anos
    personality: 'Orgulhoso, difícil de obedecer no início',
    strengths: 'Ataques críticos rápidos',
    weaknesses: 'Pouca resistência a golpes pesados',
  },

  brontis: {
    line: 'brontis',
    name: 'Brontis (Réptil Colosso)',
    description: 'Lagarto bípede robusto, com escamas verdes e chifres de osso.',
    affinity: ['earth', 'fire'],
    baseAttributes: {
      might: 75,
      wit: 45,
      focus: 45,
      agility: 45,
      ward: 65,
      vitality: 75,
    },
    growthCurve: {
      might: 'fast',
      wit: 'slow',
      focus: 'slow',
      agility: 'slow',
      ward: 'fast',
      vitality: 'fast',
    },
    baseLifespan: 166, // 3.2 anos
    personality: 'Teimoso, gosta de descanso',
    strengths: 'Ótimo "iniciante", fácil de treinar',
    weaknesses: 'Sem especialização clara',
  },

  zephyra: {
    line: 'zephyra',
    name: 'Zephyra (Ave de Vento)',
    description: 'Ave mística com plumagem brilhante e asas alongadas.',
    affinity: ['air'],
    baseAttributes: {
      might: 45,
      wit: 65,
      focus: 50,
      agility: 95,
      ward: 25,
      vitality: 45,
    },
    growthCurve: {
      might: 'slow',
      wit: 'medium',
      focus: 'medium',
      agility: 'veryfast',
      ward: 'none',
      vitality: 'slow',
    },
    baseLifespan: 156, // 3 anos
    personality: 'Energética, impaciente',
    strengths: 'Esquiva altíssima; excelente contra inimigos lentos',
    weaknesses: 'Morre rápido em ataques certeiros',
  },

  ignar: {
    line: 'ignar',
    name: 'Ignar (Fera Ígnea)',
    description: 'Criatura quadrúpede com crina flamejante e corpo de carvão ardente.',
    affinity: ['fire'],
    baseAttributes: {
      might: 95,
      wit: 45,
      focus: 45,
      agility: 65,
      ward: 60,
      vitality: 60,
    },
    growthCurve: {
      might: 'veryfast',
      wit: 'slow',
      focus: 'slow',
      agility: 'medium',
      ward: 'medium',
      vitality: 'medium',
    },
    baseLifespan: 140, // 2.7 anos
    personality: 'Impulsivo, agressivo',
    strengths: 'Golpes devastadores',
    weaknesses: 'Consome muita Essência e cansa rápido',
  },

  mirella: {
    line: 'mirella',
    name: 'Mirella (Criatura Anfíbia)',
    description: 'Corpo escamoso azul-esverdeado, nadadeiras que brilham no escuro.',
    affinity: ['water'],
    baseAttributes: {
      might: 60,
      wit: 60,
      focus: 60,
      agility: 60,
      ward: 60,
      vitality: 60,
    },
    growthCurve: {
      might: 'medium',
      wit: 'medium',
      focus: 'medium',
      agility: 'medium',
      ward: 'medium',
      vitality: 'medium',
    },
    baseLifespan: 156, // 3 anos
    personality: 'Amigável, dócil',
    strengths: 'Fácil de treinar; serve para iniciantes',
    weaknesses: 'Não tem especialidade forte',
  },

  umbrix: {
    line: 'umbrix',
    name: 'Umbrix (Besta Sombria)',
    description: 'Criatura quadrúpede coberta por fumaça negra, olhos vermelhos brilhantes.',
    affinity: ['shadow'],
    baseAttributes: {
      might: 45,
      wit: 85,
      focus: 70,
      agility: 65,
      ward: 45,
      vitality: 60,
    },
    growthCurve: {
      might: 'slow',
      wit: 'veryfast',
      focus: 'fast',
      agility: 'medium',
      ward: 'slow',
      vitality: 'medium',
    },
    baseLifespan: 156, // 3 anos
    personality: 'Maliciosa, pode trair ordens',
    strengths: 'Técnicas que drenam Essência do inimigo',
    weaknesses: 'Menor dano físico',
  },

  sylphid: {
    line: 'sylphid',
    name: 'Sylphid (Espírito Etéreo)',
    description: 'Aparência translúcida, corpo humanoide leve, asas de luz.',
    affinity: ['light', 'ether'],
    baseAttributes: {
      might: 20,
      wit: 95,
      focus: 90,
      agility: 65,
      ward: 25,
      vitality: 45,
    },
    growthCurve: {
      might: 'none',
      wit: 'veryfast',
      focus: 'veryfast',
      agility: 'medium',
      ward: 'none',
      vitality: 'slow',
    },
    baseLifespan: 145, // 2.8 anos
    personality: 'Sereno, distante',
    strengths: 'Especialista em magia',
    weaknesses: 'Pode ser derrotado com poucos ataques físicos',
  },

  raukor: {
    line: 'raukor',
    name: 'Raukor (Lobo Ancestral)',
    description: 'Lobo imenso com pelagem prateada, cicatrizes que brilham sob a lua.',
    affinity: ['moon', 'blood'],
    baseAttributes: {
      might: 80,
      wit: 45,
      focus: 65,
      agility: 70,
      ward: 65,
      vitality: 70,
    },
    growthCurve: {
      might: 'fast',
      wit: 'slow',
      focus: 'medium',
      agility: 'fast',
      ward: 'medium',
      vitality: 'fast',
    },
    baseLifespan: 182, // 3.5 anos
    personality: 'Leal, obedece com facilidade',
    strengths: 'Ótimo equilíbrio ofensivo/defensivo',
    weaknesses: 'Vulnerável a técnicas mágicas',
  },
};

/**
 * Retorna dados de uma linha específica
 */
export function getBeastLineData(line: BeastLine): BeastLineData {
  return BEAST_LINES[line];
}

/**
 * Retorna todas as linhas disponíveis
 */
export function getAllBeastLines(): BeastLine[] {
  return Object.keys(BEAST_LINES) as BeastLine[];
}

