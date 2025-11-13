/**
 * Técnicas das Bestas - Guardian Grove
 * Árvores de técnicas exclusivas por linha
 */

import type { Technique, BeastLine } from '../types';

export const TECHNIQUES: Record<string, Technique> = {
  // ===== OLGRIM (Olho Ancestral) =====
  ethereal_ray: {
    id: 'ethereal_ray',
    name: 'Raio Etéreo',
    essenceCost: 18,
    damage: 45,
    type: 'mystical',
    description: 'Ataque de energia linear',
  },
  paralyzing_gaze: {
    id: 'paralyzing_gaze',
    name: 'Olhar Paralisante',
    essenceCost: 22,
    damage: 30,
    type: 'mystical',
    effect: 'Chance de atordoar',
    description: 'Chance de paralisar o inimigo temporariamente',
  },
  mental_explosion: {
    id: 'mental_explosion',
    name: 'Explosão Mental',
    essenceCost: 28,
    damage: 65,
    type: 'mystical',
    effect: 'Reduz Foco do oponente',
    description: 'Alto dano mágico com chance de reduzir precisão',
  },
  fragment_rain: {
    id: 'fragment_rain',
    name: 'Chuva de Fragmentos',
    essenceCost: 35,
    damage: 80,
    type: 'mystical',
    effect: 'Múltiplos raios',
    description: 'Dispara múltiplos raios com dano acumulado',
  },

  // ===== TERRAVOX (Golem de Pedra) =====
  seismic_punch: {
    id: 'seismic_punch',
    name: 'Soco Sísmico',
    essenceCost: 20,
    damage: 70,
    type: 'physical',
    effect: 'Empurra inimigo',
    description: 'Golpe físico pesado que pode empurrar',
  },
  living_wall: {
    id: 'living_wall',
    name: 'Muralha Viva',
    essenceCost: 25,
    damage: 0,
    type: 'defensive',
    effect: 'Reduz dano por 10s',
    description: 'Reduz todo dano recebido temporariamente',
  },
  crystal_crush: {
    id: 'crystal_crush',
    name: 'Esmagamento de Cristal',
    essenceCost: 30,
    damage: 90,
    type: 'physical',
    effect: 'Quebra defesa',
    description: 'Ataque brutal que quebra a guarda inimiga',
  },
  mountain_echo: {
    id: 'mountain_echo',
    name: 'Eco da Montanha',
    essenceCost: 40,
    damage: 60,
    type: 'physical',
    effect: 'Onda de choque',
    description: 'Libera onda de choque devastadora',
  },

  // ===== FERALIS (Felino Selvagem) =====
  twin_claws: {
    id: 'twin_claws',
    name: 'Garras Gêmeas',
    essenceCost: 12,
    damage: 50,
    type: 'physical',
    effect: 'Crítico elevado',
    description: 'Ataque duplo com alta chance de crítico',
  },
  cutting_leap: {
    id: 'cutting_leap',
    name: 'Salto Cortante',
    essenceCost: 18,
    damage: 55,
    type: 'physical',
    description: 'Avança no inimigo causando dano rápido',
  },
  predator_instinct: {
    id: 'predator_instinct',
    name: 'Instinto Predador',
    essenceCost: 25,
    damage: 0,
    type: 'utility',
    effect: 'Aumenta crítico',
    description: 'Aumenta chance de crítico temporariamente',
  },
  savage_cry: {
    id: 'savage_cry',
    name: 'Grito Selvagem',
    essenceCost: 30,
    damage: 0,
    type: 'utility',
    effect: 'Reduz lealdade inimiga',
    description: 'Assusta o inimigo, reduzindo sua obediência',
  },

  // ===== BRONTIS (Réptil Colosso) =====
  brutal_headbutt: {
    id: 'brutal_headbutt',
    name: 'Cabeçada Brutal',
    essenceCost: 15,
    damage: 60,
    type: 'physical',
    description: 'Ataque físico simples e confiável',
  },
  tail_destroyer: {
    id: 'tail_destroyer',
    name: 'Cauda Destruidora',
    essenceCost: 20,
    damage: 65,
    type: 'physical',
    effect: 'Empurra',
    description: 'Golpe de cauda com chance de empurrar',
  },
  gastric_flame: {
    id: 'gastric_flame',
    name: 'Chama Gástrica',
    essenceCost: 28,
    damage: 70,
    type: 'mystical',
    effect: 'Dano contínuo',
    description: 'Sopro de fogo com dano ao longo do tempo',
  },
  earth_tremor: {
    id: 'earth_tremor',
    name: 'Tremor Terrestre',
    essenceCost: 35,
    damage: 40,
    type: 'physical',
    effect: 'Reduz Agilidade',
    description: 'Vibração que reduz velocidade do inimigo',
  },

  // ===== ZEPHYRA (Ave de Vento) =====
  cutting_wing: {
    id: 'cutting_wing',
    name: 'Asa Cortante',
    essenceCost: 12,
    damage: 40,
    type: 'physical',
    description: 'Ataque rápido de precisão',
  },
  ascending_gust: {
    id: 'ascending_gust',
    name: 'Rajada Ascendente',
    essenceCost: 18,
    damage: 45,
    type: 'mystical',
    effect: 'Empurra',
    description: 'Corrente de vento que empurra o inimigo',
  },
  low_flight: {
    id: 'low_flight',
    name: 'Voo Rasante',
    essenceCost: 20,
    damage: 55,
    type: 'physical',
    effect: 'Alta esquiva',
    description: 'Ataque veloz com esquiva embutida',
  },
  celestial_storm: {
    id: 'celestial_storm',
    name: 'Tempestade Celeste',
    essenceCost: 35,
    damage: 50,
    type: 'mystical',
    effect: 'Reduz acerto',
    description: 'Invoca ventos fortes que reduzem precisão',
  },

  // ===== IGNAR (Fera Ígnea) =====
  fire_whip: {
    id: 'fire_whip',
    name: 'Chicote de Fogo',
    essenceCost: 18,
    damage: 60,
    type: 'mystical',
    description: 'Ataque flamejante contínuo',
  },
  igneous_explosion: {
    id: 'igneous_explosion',
    name: 'Explosão Ígnea',
    essenceCost: 28,
    damage: 85,
    type: 'mystical',
    description: 'Bola de fogo de alto dano',
  },
  volcanic_roar: {
    id: 'volcanic_roar',
    name: 'Rugido Vulcânico',
    essenceCost: 35,
    damage: 0,
    type: 'utility',
    effect: 'Reduz resistência',
    description: 'Reduz defesa do inimigo',
  },
  flaming_collision: {
    id: 'flaming_collision',
    name: 'Colisão Flamejante',
    essenceCost: 40,
    damage: 120,
    type: 'physical',
    effect: 'Deixa vulnerável',
    description: 'Ataque suicida poderoso, mas perigoso',
  },

  // ===== MIRELLA (Criatura Anfíbia) =====
  water_jet: {
    id: 'water_jet',
    name: 'Jato d\'Água',
    essenceCost: 15,
    damage: 45,
    type: 'mystical',
    description: 'Ataque linear de água',
  },
  reflective_scale: {
    id: 'reflective_scale',
    name: 'Escama Refletora',
    essenceCost: 20,
    damage: 0,
    type: 'defensive',
    effect: 'Reduz dano mágico',
    description: 'Reduz dano mágico por 10 segundos',
  },
  aquatic_tail_strike: {
    id: 'aquatic_tail_strike',
    name: 'Golpe de Cauda Aquática',
    essenceCost: 18,
    damage: 55,
    type: 'physical',
    effect: 'Chance de atordoar',
    description: 'Ataque físico com chance de atordoar',
  },
  deluge: {
    id: 'deluge',
    name: 'Dilúvio',
    essenceCost: 32,
    damage: 60,
    type: 'mystical',
    effect: 'Reduz Agilidade',
    description: 'Inunda o campo, reduzindo velocidade',
  },

  // ===== UMBRIX (Besta Sombria) =====
  shadow_bite: {
    id: 'shadow_bite',
    name: 'Mordida Sombria',
    essenceCost: 16,
    damage: 50,
    type: 'physical',
    effect: 'Drena Essência',
    description: 'Dano físico + drenagem de Essência',
  },
  stalking_shadow: {
    id: 'stalking_shadow',
    name: 'Sombra Perseguidora',
    essenceCost: 22,
    damage: 55,
    type: 'mystical',
    effect: 'Ignora esquiva',
    description: 'Ataque que ignora parte da esquiva',
  },
  black_mist: {
    id: 'black_mist',
    name: 'Névoa Negra',
    essenceCost: 28,
    damage: 0,
    type: 'utility',
    effect: 'Reduz Foco',
    description: 'Reduz precisão do inimigo',
  },
  soul_devourer: {
    id: 'soul_devourer',
    name: 'Devorador de Almas',
    essenceCost: 40,
    damage: 90,
    type: 'mystical',
    effect: 'Recupera HP',
    description: 'Golpe devastador que recupera Vitalidade',
  },

  // ===== SYLPHID (Espírito Etéreo) =====
  light_ray: {
    id: 'light_ray',
    name: 'Raio de Luz',
    essenceCost: 15,
    damage: 50,
    type: 'mystical',
    description: 'Ataque mágico simples',
  },
  luminous_barrier: {
    id: 'luminous_barrier',
    name: 'Barreira Luminosa',
    essenceCost: 20,
    damage: 0,
    type: 'defensive',
    effect: 'Reduz dano mágico',
    description: 'Reduz dano recebido por magia',
  },
  radiant_blade: {
    id: 'radiant_blade',
    name: 'Lâmina Radiante',
    essenceCost: 25,
    damage: 70,
    type: 'mystical',
    description: 'Corte de energia de alta precisão',
  },
  purification: {
    id: 'purification',
    name: 'Purificação',
    essenceCost: 35,
    damage: 0,
    type: 'utility',
    effect: 'Remove buffs + cura',
    description: 'Remove buffs do inimigo e cura o usuário',
  },

  // ===== RAUKOR (Lobo Ancestral) =====
  lupine_charge: {
    id: 'lupine_charge',
    name: 'Investida Lupina',
    essenceCost: 15,
    damage: 60,
    type: 'physical',
    description: 'Ataque físico veloz',
  },
  lunar_fangs: {
    id: 'lunar_fangs',
    name: 'Presas Lunares',
    essenceCost: 22,
    damage: 75,
    type: 'physical',
    effect: 'Alta chance de crítico',
    description: 'Alto dano físico com chance de crítico',
  },
  moon_howl: {
    id: 'moon_howl',
    name: 'Uivo da Lua',
    essenceCost: 28,
    damage: 0,
    type: 'utility',
    effect: 'Aumenta lealdade',
    description: 'Aumenta própria lealdade temporariamente',
  },
  relentless_hunt: {
    id: 'relentless_hunt',
    name: 'Caçada Implacável',
    essenceCost: 35,
    damage: 90,
    type: 'physical',
    effect: 'Múltiplos ataques',
    description: 'Sequência de ataques rápidos',
  },
};

/**
 * Retorna técnicas iniciais de uma linha
 */
export function getStartingTechniques(line: BeastLine): Technique[] {
  const techniqueMap: Record<BeastLine, string[]> = {
    olgrim: ['ethereal_ray'],
    terravox: ['seismic_punch'],
    feralis: ['twin_claws'],
    brontis: ['brutal_headbutt'],
    zephyra: ['cutting_wing'],
    ignar: ['fire_whip'],
    mirella: ['water_jet'],
    umbrix: ['shadow_bite'],
    sylphid: ['light_ray'],
    raukor: ['lupine_charge'],
  };

  return techniqueMap[line].map(id => TECHNIQUES[id]);
}

/**
 * Retorna todas as técnicas de uma linha
 */
export function getLineTechniques(line: BeastLine): Technique[] {
  const techniqueMap: Record<BeastLine, string[]> = {
    olgrim: ['ethereal_ray', 'paralyzing_gaze', 'mental_explosion', 'fragment_rain'],
    terravox: ['seismic_punch', 'living_wall', 'crystal_crush', 'mountain_echo'],
    feralis: ['twin_claws', 'cutting_leap', 'predator_instinct', 'savage_cry'],
    brontis: ['brutal_headbutt', 'tail_destroyer', 'gastric_flame', 'earth_tremor'],
    zephyra: ['cutting_wing', 'ascending_gust', 'low_flight', 'celestial_storm'],
    ignar: ['fire_whip', 'igneous_explosion', 'volcanic_roar', 'flaming_collision'],
    mirella: ['water_jet', 'reflective_scale', 'aquatic_tail_strike', 'deluge'],
    umbrix: ['shadow_bite', 'stalking_shadow', 'black_mist', 'soul_devourer'],
    sylphid: ['light_ray', 'luminous_barrier', 'radiant_blade', 'purification'],
    raukor: ['lupine_charge', 'lunar_fangs', 'moon_howl', 'relentless_hunt'],
  };

  return techniqueMap[line].map(id => TECHNIQUES[id]);
}

