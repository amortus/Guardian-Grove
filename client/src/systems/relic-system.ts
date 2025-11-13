/**
 * Sistema de Relíquias de Eco - Guardian Grove
 * Geração procedural de bestas baseado em input do usuário
 */

import type { Beast, BeastLine, BeastBlood, ElementalAffinity, PersonalityTrait } from '../types';
import { createBeast } from './beast';

/**
 * Converte uma string em um número hash (seed)
 */
function stringToSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Gerador de números pseudo-aleatórios baseado em seed
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  choice<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }
}

/**
 * Gera uma besta proceduralmente baseado em uma Relíquia de Eco
 */
export function generateBeastFromRelic(
  relicInput: string,
  guardianName: string,
  week: number
): Beast {
  // Converte input em seed
  const seed = stringToSeed(relicInput);
  const rng = new SeededRandom(seed);

  // Escolhe linha baseado no seed
  const lines: BeastLine[] = [
    'olgrim', 'terravox', 'feralis', 'brontis', 'zephyra',
    'ignar', 'mirella', 'umbrix', 'sylphid', 'raukor'
  ];
  const line = rng.choice(lines);

  // Escolhe sangue (subvariação) baseado no seed
  const bloods: BeastBlood[] = ['common', 'pale', 'crimson', 'azure', 'verdant'];
  const blood = rng.choice(bloods);

  // Escolhe afinidade elemental baseado no seed
  const affinities: ElementalAffinity[] = [
    'fire', 'water', 'earth', 'air', 'shadow', 'light'
  ];
  const affinity = rng.choice(affinities);

  // Cria a besta base com o nome escolhido pelo jogador
  const beast = createBeast(line, guardianName, week);

  // Aplica modificadores procedurais
  // Nome já foi definido em createBeast() como guardianName
  beast.blood = blood;
  beast.affinity = affinity;

  // Adiciona traço de personalidade único baseado no seed
  const possibleTraits: PersonalityTrait[] = [
    'loyal', 'brave', 'patient', 'disciplined', 'curious',
    'lazy', 'proud', 'anxious', 'solitary', 'eccentric',
    'stubborn', 'fearful', 'aggressive', 'impulsive', 'frail'
  ];
  const uniqueTrait = rng.choice(possibleTraits);
  if (!beast.traits.includes(uniqueTrait)) {
    beast.traits.push(uniqueTrait);
  }

  // Pequenos ajustes nos atributos baseado no sangue
  applyBloodModifiers(beast, blood, rng);

  // Adiciona evento de vida
  beast.lifeEvents.push({
    week,
    type: 'birth',
    description: `Nasceu das Relíquias de Eco: "${relicInput.substring(0, 30)}..."`,
  });

  return beast;
}

/**
 * Gera um nome procedural para a besta
 */
function generateProceduralName(input: string, line: BeastLine, rng: SeededRandom): string {
  // Prefixos baseados na linha
  const prefixes: Record<BeastLine, string[]> = {
    olgrim: ['Ocul', 'Vis', 'Spec', 'Aur'],
    terravox: ['Terr', 'Roc', 'Mont', 'Krag'],
    feralis: ['Fel', 'Lynx', 'Panthyr', 'Claw'],
    brontis: ['Bron', 'Rex', 'Saur', 'Drax'],
    zephyra: ['Zeph', 'Aero', 'Skye', 'Wind'],
    ignar: ['Ignis', 'Pyro', 'Flare', 'Ember'],
    mirella: ['Aqua', 'Mare', 'Coral', 'Tide'],
    umbrix: ['Umbra', 'Nox', 'Shade', 'Void'],
    sylphid: ['Lux', 'Astra', 'Nova', 'Gleam'],
    raukor: ['Fang', 'Howl', 'Fenrir', 'Wolf'],
  };

  // Sufixos baseados no input
  const suffixes = ['os', 'is', 'ar', 'on', 'ax', 'ys', 'en', 'ix', 'or', 'us'];

  const prefix = rng.choice(prefixes[line]);
  const suffix = rng.choice(suffixes);

  // Usa parte do input para tornar mais único
  const inputHash = stringToSeed(input) % 100;
  const number = inputHash > 50 ? ` ${inputHash}` : '';

  return `${prefix}${suffix}${number}`;
}

/**
 * Aplica modificadores baseados no sangue (subvariação)
 */
function applyBloodModifiers(beast: Beast, blood: BeastBlood, rng: SeededRandom): void {
  switch (blood) {
    case 'pale':
      // Pálido: +Astúcia, -Vitalidade
      beast.attributes.wit += rng.nextInt(3, 7);
      beast.attributes.vitality -= rng.nextInt(2, 5);
      beast.maxHp = Math.max(50, beast.maxHp - 20);
      beast.currentHp = beast.maxHp;
      break;

    case 'crimson':
      // Carmesim: +Força, -Foco
      beast.attributes.might += rng.nextInt(3, 7);
      beast.attributes.focus -= rng.nextInt(2, 5);
      break;

    case 'azure':
      // Azul: +Agilidade, -Resistência
      beast.attributes.agility += rng.nextInt(3, 7);
      beast.attributes.ward -= rng.nextInt(2, 5);
      break;

    case 'verdant':
      // Verde: +Vitalidade, -Força
      beast.attributes.vitality += rng.nextInt(3, 7);
      beast.attributes.might -= rng.nextInt(2, 5);
      beast.maxHp += 30;
      beast.currentHp = beast.maxHp;
      break;

    case 'common':
      // Comum: balanceado, sem modificadores
      break;
  }

  // Garante que nenhum atributo fique negativo
  Object.keys(beast.attributes).forEach(key => {
    const attr = key as keyof typeof beast.attributes;
    beast.attributes[attr] = Math.max(10, beast.attributes[attr]);
  });
}

/**
 * Gera uma descrição da Relíquia baseado no input
 */
export function generateRelicDescription(input: string): string {
  const seed = stringToSeed(input);
  const rng = new SeededRandom(seed);

  const colors = ['Âmbar', 'Cristalina', 'Azulada', 'Dourada', 'Prateada', 'Violeta', 'Esmeralda'];
  const patterns = ['pulsante', 'radiante', 'sussurrante', 'vibrante', 'etérea', 'sombria'];
  const sounds = ['melodia antiga', 'eco distante', 'harmonia suave', 'ressonância profunda'];

  const color = rng.choice(colors);
  const pattern = rng.choice(patterns);
  const sound = rng.choice(sounds);

  return `Uma relíquia ${color.toLowerCase()}, ${pattern}, que emana uma ${sound}.`;
}

/**
 * Valida se um input é válido para gerar uma Relíquia
 */
export function validateRelicInput(input: string): { valid: boolean; error?: string } {
  if (!input || input.trim().length === 0) {
    return { valid: false, error: 'Digite algo para criar uma Relíquia de Eco.' };
  }

  if (input.length < 3) {
    return { valid: false, error: 'A entrada deve ter pelo menos 3 caracteres.' };
  }

  if (input.length > 200) {
    return { valid: false, error: 'A entrada não pode ter mais de 200 caracteres.' };
  }

  return { valid: true };
}

