/**
 * Sistema de IA de Combate Avançada - Guardian Grove
 * IA inteligente e adaptativa para inimigos
 */

import type {
  BattleContext,
  CombatAction,
  Beast,
  Technique,
  BeastLine,
} from '../types';
import { canUseTechnique } from './combat';

// ===== TIPOS DE IA =====

export type AIPersonality = 
  | 'novice'      // Novato - Fácil, decisões ruins
  | 'veteran'     // Veterano - Médio, decisões balanceadas
  | 'elite'       // Elite - Difícil, decisões táticas
  | 'legendary'   // Lendário - Muito difícil, perfeito
  | 'berserker'   // Berserker - Agressão máxima, ignora defesa, ALL-IN
  | 'tank'        // Tank - Defesa extrema, guerra de atrito, jogo lento
  | 'sniper'      // Sniper - Calculista, espera momento perfeito, precision
  | 'trickster';  // Trickster - Imprevisível, aleatório, psicológico

export type AIStrategy = 
  | 'aggressive'  // Ataque constante, ignora defesa
  | 'defensive'   // Defesa frequente, ataca com cautela
  | 'balanced'    // Equilíbrio entre ataque e defesa
  | 'tactical'    // Usa técnicas estratégicas, analisa situação
  | 'adaptive';   // Adapta estratégia baseado no oponente

// ===== CONFIGURAÇÃO DE IA =====

export interface AIConfig {
  personality: AIPersonality;
  strategy: AIStrategy;
  aggressiveness: number;    // 0-100
  defensiveness: number;     // 0-100
  riskTolerance: number;     // 0-100
  tacticalThinking: number;  // 0-100
}

// ===== CONTEXTO DE DECISÃO =====

interface DecisionContext {
  myHpPercent: number;
  enemyHpPercent: number;
  myEssencePercent: number;
  enemyEssencePercent: number;
  turnCount: number;
  isEnemyDefending: boolean;
  myIsDefending: boolean;
  availableTechniques: Technique[];
  myBeast: Beast;
  enemyBeast: Beast;
}

// ===== PRESETS DE IA POR DIFICULDADE =====

export function getAIConfig(personality: AIPersonality): AIConfig {
  switch (personality) {
    case 'novice':
      return {
        personality: 'novice',
        strategy: 'balanced',
        aggressiveness: 40,
        defensiveness: 30,
        riskTolerance: 60,
        tacticalThinking: 20,
      };
    
    case 'veteran':
      return {
        personality: 'veteran',
        strategy: 'balanced',
        aggressiveness: 60,
        defensiveness: 50,
        riskTolerance: 40,
        tacticalThinking: 50,
      };
    
    case 'elite':
      return {
        personality: 'elite',
        strategy: 'tactical',
        aggressiveness: 70,
        defensiveness: 70,
        riskTolerance: 30,
        tacticalThinking: 80,
      };
    
    case 'legendary':
      return {
        personality: 'legendary',
        strategy: 'adaptive',
        aggressiveness: 85,
        defensiveness: 85,
        riskTolerance: 20,
        tacticalThinking: 95,
      };
    
    case 'berserker':
      return {
        personality: 'berserker',
        strategy: 'aggressive',
        aggressiveness: 100,      // MÁXIMO - Ataque sempre
        defensiveness: 5,          // MÍNIMO - Nunca defende
        riskTolerance: 95,         // Altíssimo - Não se importa com risco
        tacticalThinking: 15,      // Baixo - Age por instinto
      };
    
    case 'tank':
      return {
        personality: 'tank',
        strategy: 'defensive',
        aggressiveness: 20,        // Baixo - Ataca pouco
        defensiveness: 100,        // MÁXIMO - Defende sempre que pode
        riskTolerance: 5,          // Muito baixo - Evita risco
        tacticalThinking: 65,      // Alto - Pensa antes de agir
      };
    
    case 'sniper':
      return {
        personality: 'sniper',
        strategy: 'tactical',
        aggressiveness: 50,        // Médio - Ataca calculado
        defensiveness: 40,         // Médio-baixo - Defende se necessário
        riskTolerance: 25,         // Baixo - Calcula riscos
        tacticalThinking: 90,      // Muito alto - Extremamente calculista
      };
    
    case 'trickster':
      return {
        personality: 'trickster',
        strategy: 'balanced',
        aggressiveness: 55,        // Variável
        defensiveness: 45,         // Variável
        riskTolerance: 70,         // Alto - Arrisca para confundir
        tacticalThinking: 30,      // Baixo - Mais aleatório que tático
      };
    
    default:
      return getAIConfig('veteran');
  }
}

// ===== IA POR LINHA DE BESTA =====

/**
 * Ajusta comportamento baseado na linha da besta
 */
function getLineSpecificBehavior(line: BeastLine): Partial<AIConfig> {
  const behaviors: Record<BeastLine, Partial<AIConfig>> = {
    olgrim: { strategy: 'tactical', tacticalThinking: 90 },      // Olho Ancestral - Tático
    terravox: { strategy: 'defensive', defensiveness: 80 },      // Golem - Defensivo
    feralis: { strategy: 'aggressive', aggressiveness: 85 },     // Felino - Agressivo
    brontis: { strategy: 'balanced', defensiveness: 70 },        // Réptil - Balanceado defensivo
    zephyra: { strategy: 'tactical', aggressiveness: 70 },       // Ave - Tático agressivo
    ignar: { strategy: 'aggressive', aggressiveness: 90 },       // Fogo - Muito agressivo
    mirella: { strategy: 'adaptive', tacticalThinking: 75 },     // Anfíbio - Adaptativo
    umbrix: { strategy: 'tactical', tacticalThinking: 85 },      // Sombra - Tático
    sylphid: { strategy: 'defensive', tacticalThinking: 80 },    // Etéreo - Defensivo tático
    raukor: { strategy: 'balanced', aggressiveness: 65 },        // Lobo - Balanceado
  };
  
  return behaviors[line] || {};
}

// ===== ANÁLISE DE CONTEXTO =====

function analyzeContext(battle: BattleContext): DecisionContext {
  const enemy = battle.enemy;
  const player = battle.player;
  
  return {
    myHpPercent: enemy.currentHp / enemy.beast.maxHp,
    enemyHpPercent: player.currentHp / player.beast.maxHp,
    myEssencePercent: enemy.currentEssence / enemy.beast.maxEssence,
    enemyEssencePercent: player.currentEssence / player.beast.maxEssence,
    turnCount: battle.turnCount,
    isEnemyDefending: player.isDefending,
    myIsDefending: enemy.isDefending,
    availableTechniques: enemy.beast.techniques.filter(t => 
      canUseTechnique(t, enemy.currentEssence)
    ),
    myBeast: enemy.beast,
    enemyBeast: player.beast,
  };
}

// ===== AVALIAÇÃO DE TÉCNICAS =====

interface TechniqueScore {
  technique: Technique;
  score: number;
  reason: string;
}

/**
 * Avalia técnicas baseado no contexto
 */
function evaluateTechniques(
  context: DecisionContext,
  config: AIConfig
): TechniqueScore[] {
  const scores: TechniqueScore[] = [];
  
  for (const tech of context.availableTechniques) {
    let score = 50; // Base score
    let reason = '';
    
    // === AVALIAÇÃO POR TIPO ===
    
    if (tech.type === 'physical') {
      // Bônus se o inimigo tem baixa defesa
      const enemyWard = context.enemyBeast.attributes.ward;
      if (enemyWard < 30) {
        score += 20;
        reason += 'Inimigo com defesa baixa. ';
      }
      
      // Bônus se tenho alta força
      const myMight = context.myBeast.attributes.might;
      if (myMight > 60) {
        score += 15;
        reason += 'Força alta. ';
      }
    }
    
    if (tech.type === 'mystical') {
      // Bônus se tenho alta astúcia
      const myWit = context.myBeast.attributes.wit;
      if (myWit > 60) {
        score += 15;
        reason += 'Astúcia alta. ';
      }
      
      // Bônus se inimigo está defendendo (místico ignora parte da defesa)
      if (context.isEnemyDefending) {
        score += 10;
        reason += 'Inimigo defendendo. ';
      }
    }
    
    // === AVALIAÇÃO POR DANO ===
    
    const damageRatio = tech.damage / 50; // Normaliza dano
    score += damageRatio * 20;
    
    // === AVALIAÇÃO POR CUSTO ===
    
    const costRatio = tech.essenceCost / context.myBeast.maxEssence;
    
    // Se tenho muita essência, prefiro técnicas fortes
    if (context.myEssencePercent > 0.7) {
      score += (1 - costRatio) * 10;
    } else if (context.myEssencePercent < 0.3) {
      // Se tenho pouca essência, prefiro técnicas baratas
      score += costRatio * -30;
      reason += 'Essência baixa. ';
    }
    
    // === AVALIAÇÃO SITUACIONAL ===
    
    // Inimigo com HP baixo - prioriza técnicas de alto dano
    if (context.enemyHpPercent < 0.3) {
      score += (tech.damage / 50) * 30;
      reason += 'Inimigo com HP crítico! ';
    }
    
    // Meu HP baixo - prefere técnicas seguras (baixo custo)
    if (context.myHpPercent < 0.3) {
      score -= tech.essenceCost * 2;
      reason += 'Meu HP crítico. ';
    }
    
    // === AJUSTES POR PERSONALIDADE ===
    
    if (config.personality === 'novice') {
      // Novatos fazem escolhas ruins às vezes
      score += Math.random() * 30 - 15; // ±15 aleatoriedade
    } else if (config.personality === 'legendary') {
      // Lendários otimizam perfeitamente
      if (tech.damage >= 40 && tech.essenceCost <= 15) {
        score += 25;
        reason += 'Técnica otimizada. ';
      }
    } else if (config.personality === 'berserker') {
      // Berserker: SEMPRE escolhe a técnica de MAIOR DANO
      score += tech.damage * 2; // Dano em dobro no score
      reason += 'MÁXIMO DANO! ';
      
      // Ignora custo de essência
      if (tech.essenceCost > 0) {
        score += 20; // Prefere técnicas CARAS = FORTES
        reason += 'Custo alto = Forte! ';
      }
    } else if (config.personality === 'tank') {
      // Tank: Prefere técnicas BARATAS para conservar essência
      const costPenalty = (tech.essenceCost / context.myBeast.maxEssence) * 50;
      score -= costPenalty;
      reason += 'Conserva essência. ';
      
      // Evita técnicas caras
      if (tech.essenceCost > 15) {
        score -= 30;
        reason += 'Muito cara! ';
      }
    } else if (config.personality === 'sniper') {
      // Sniper: Espera o momento PERFEITO
      // Prioriza técnicas quando inimigo está vulnerável
      if (context.enemyHpPercent < 0.5) {
        score += tech.damage * 1.5;
        reason += 'Alvo vulnerável! ';
      }
      
      // Se inimigo defendendo, reduz score (espera)
      if (context.isEnemyDefending) {
        score -= 25;
        reason += 'Esperando abertura. ';
      }
      
      // Prioriza técnicas de alto dano + alta precisão
      if (tech.damage >= 40 && context.myBeast.attributes.focus > 60) {
        score += 30;
        reason += 'Precisão perfeita! ';
      }
    } else if (config.personality === 'trickster') {
      // Trickster: ALEATÓRIO e IMPREVISÍVEL
      const randomBoost = Math.random() * 60 - 30; // ±30 aleatoriedade ALTA
      score += randomBoost;
      reason += 'Imprevisível! ';
      
      // Às vezes escolhe técnicas ruins de propósito
      if (Math.random() < 0.2) {
        score = Math.random() * 40; // 20% chance de escolha aleatória
        reason += '?!?! ';
      }
    }
    
    // === AJUSTES POR ESTRATÉGIA ===
    
    if (config.strategy === 'aggressive') {
      score += tech.damage * 0.5;
    } else if (config.strategy === 'defensive') {
      score -= tech.essenceCost * 0.8;
    }
    
    scores.push({
      technique: tech,
      score: Math.max(0, score),
      reason: reason || 'Escolha padrão',
    });
  }
  
  return scores.sort((a, b) => b.score - a.score);
}

// ===== DECISÃO DE DEFENDER =====

/**
 * Calcula score para a ação de defender
 */
function evaluateDefend(context: DecisionContext, config: AIConfig): number {
  let score = 0;
  
  // === HP BAIXO ===
  if (context.myHpPercent < 0.4) {
    score += 40;
    if (context.myHpPercent < 0.25) {
      score += 30; // Muito crítico
    }
  }
  
  // === ESSÊNCIA BAIXA ===
  if (context.myEssencePercent < 0.3) {
    score += 30; // Precisa recuperar essência
  }
  
  // === INIMIGO COM ESSÊNCIA ALTA ===
  if (context.enemyEssencePercent > 0.7) {
    score += 20; // Inimigo pode usar técnica forte
  }
  
  // === ESTRATÉGIA DEFENSIVA ===
  if (config.strategy === 'defensive') {
    score += config.defensiveness * 0.5;
  }
  
  // === ESTRATÉGIA AGRESSIVA ===
  if (config.strategy === 'aggressive') {
    score -= config.aggressiveness * 0.3; // Não gosta de defender
  }
  
  // === PERSONALIDADE ===
  if (config.personality === 'novice') {
    // Novatos defendem em momentos errados
    score += Math.random() * 20 - 10;
  } else if (config.personality === 'elite' || config.personality === 'legendary') {
    // Elite/Lendário defende estrategicamente
    if (context.myHpPercent > 0.6 && context.myEssencePercent < 0.5) {
      score += 25; // Defende para recuperar essência
    }
  } else if (config.personality === 'berserker') {
    // Berserker: NUNCA DEFENDE (ou quase nunca)
    score = 0; // Zera o score de defesa
    
    // Só defende se estiver MORRENDO (< 10% HP)
    if (context.myHpPercent < 0.1) {
      score = 30; // Instinto de sobrevivência
    }
  } else if (config.personality === 'tank') {
    // Tank: SEMPRE DEFENDE
    score += 100; // Boost massivo
    
    // Defende ainda mais se inimigo tem essência alta
    if (context.enemyEssencePercent > 0.6) {
      score += 50;
    }
    
    // Defende em qualquer situação
    if (context.myHpPercent > 0.5) {
      score += 30; // Defende mesmo com HP alto
    }
  } else if (config.personality === 'sniper') {
    // Sniper: Defende ESTRATEGICAMENTE para esperar momento certo
    if (context.enemyHpPercent > 0.7) {
      score += 40; // Defende no início para observar
    }
    
    // Defende se inimigo está defendendo (jogo de paciência)
    if (context.isEnemyDefending) {
      score += 35;
    }
    
    // Não defende se inimigo está vulnerável
    if (context.enemyHpPercent < 0.3) {
      score -= 50; // Hora de atacar!
    }
  } else if (config.personality === 'trickster') {
    // Trickster: Defende ALEATORIAMENTE
    const randomDefense = Math.random() * 80;
    score += randomDefense;
    
    // 15% chance de defender em momento completamente aleatório
    if (Math.random() < 0.15) {
      score = 100; // Defende do nada
    }
  }
  
  // === TÁTICAS AVANÇADAS ===
  if (config.tacticalThinking >= 70) {
    // Analisa se vale a pena defender agora
    
    // Se o inimigo está com essência baixa, não precisa defender
    if (context.enemyEssencePercent < 0.2) {
      score -= 20;
    }
    
    // Se já defendeu no turno anterior, evita defender novamente
    if (context.myIsDefending) {
      score -= 30;
    }
  }
  
  return Math.max(0, score);
}

// ===== DECISÃO ADAPTATIVA =====

/**
 * Estratégia adaptativa - muda comportamento baseado na situação
 */
function adaptiveStrategy(context: DecisionContext, _config: AIConfig): AIStrategy {
  void _config; // Reservado para uso futuro
  
  // Início da batalha (turnos 1-3)
  if (context.turnCount <= 3) {
    if (context.myBeast.attributes.might > 60) {
      return 'aggressive'; // Força alta = pressiona rápido
    } else if (context.myBeast.attributes.ward > 60) {
      return 'defensive'; // Defesa alta = aguenta pressão
    }
    return 'balanced';
  }
  
  // Situação crítica (HP < 30%)
  if (context.myHpPercent < 0.3) {
    return 'defensive'; // Prioriza sobrevivência
  }
  
  // Vantagem (meu HP > HP inimigo)
  if (context.myHpPercent > context.enemyHpPercent + 0.2) {
    return 'aggressive'; // Pressiona para finalizar
  }
  
  // Desvantagem (meu HP < HP inimigo)
  if (context.myHpPercent < context.enemyHpPercent - 0.2) {
    return 'tactical'; // Joga estrategicamente
  }
  
  // Situação equilibrada
  return 'balanced';
}

// ===== ESCOLHA DE AÇÃO PRINCIPAL =====

/**
 * Escolhe a melhor ação baseado na IA
 */
export function chooseAIAction(
  battle: BattleContext,
  aiConfig?: Partial<AIConfig>
): CombatAction {
  // Contexto
  const context = analyzeContext(battle);
  
  // Configuração da IA
  let config = getAIConfig('veteran'); // Default
  
  // Aplica configuração customizada
  if (aiConfig) {
    config = { ...config, ...aiConfig };
  }
  
  // Aplica comportamento específico da linha
  const lineConfig = getLineSpecificBehavior(context.myBeast.line);
  config = { ...config, ...lineConfig };
  
  // Estratégia adaptativa
  if (config.strategy === 'adaptive') {
    const newStrategy = adaptiveStrategy(context, config);
    config = { ...config, strategy: newStrategy };
  }
  
  // === SEM TÉCNICAS DISPONÍVEIS ===
  if (context.availableTechniques.length === 0) {
    return { type: 'defend' };
  }
  
  // === AVALIA OPÇÕES ===
  
  const techniqueScores = evaluateTechniques(context, config);
  const defendScore = evaluateDefend(context, config);
  
  const bestTechnique = techniqueScores[0];
  
  // === DECISÃO FINAL ===
  
  // Adiciona aleatoriedade baseada em pensamento tático
  const randomFactor = (100 - config.tacticalThinking) / 100;
  const techniqueScore = bestTechnique ? bestTechnique.score * (1 + Math.random() * randomFactor * 0.2) : 0;
  const finalDefendScore = defendScore * (1 + Math.random() * randomFactor * 0.2);
  
  // Decide
  if (finalDefendScore > techniqueScore && finalDefendScore > 50) {
    return { type: 'defend' };
  }
  
  if (bestTechnique) {
    return {
      type: 'technique',
      techniqueId: bestTechnique.technique.id,
    };
  }
  
  // Fallback
  return { type: 'defend' };
}

// ===== IA AUTOMÁTICA (AMBOS OS LADOS) =====

/**
 * Escolhe ação para o jogador em modo automático
 */
export function choosePlayerAutoAction(
  battle: BattleContext,
  aggressive: boolean = false
): CombatAction {
  const context: DecisionContext = {
    myHpPercent: battle.player.currentHp / battle.player.beast.maxHp,
    enemyHpPercent: battle.enemy.currentHp / battle.enemy.beast.maxHp,
    myEssencePercent: battle.player.currentEssence / battle.player.beast.maxEssence,
    enemyEssencePercent: battle.enemy.currentEssence / battle.enemy.beast.maxEssence,
    turnCount: battle.turnCount,
    isEnemyDefending: battle.enemy.isDefending,
    myIsDefending: battle.player.isDefending,
    availableTechniques: battle.player.beast.techniques.filter(t => 
      canUseTechnique(t, battle.player.currentEssence)
    ),
    myBeast: battle.player.beast,
    enemyBeast: battle.enemy.beast,
  };
  
  const _config: AIConfig = aggressive
    ? getAIConfig('elite')
    : getAIConfig('veteran');
  
  const techniqueScores = evaluateTechniques(context, _config);
  const defendScore = evaluateDefend(context, _config);
  
  const bestTechnique = techniqueScores[0];
  
  if (defendScore > 60 && defendScore > (bestTechnique?.score || 0)) {
    return { type: 'defend' };
  }
  
  if (bestTechnique) {
    return {
      type: 'technique',
      techniqueId: bestTechnique.technique.id,
    };
  }
  
  return { type: 'defend' };
}

// ===== HELPER: ATRIBUIR IA AUTOMÁTICA =====

/**
 * Atribui configuração de IA baseado na dificuldade do inimigo
 */
export function assignAIBasedOnDifficulty(beast: Beast): AIConfig {
  // Calcula "poder" da besta
  const totalStats = 
    beast.attributes.might +
    beast.attributes.wit +
    beast.attributes.focus +
    beast.attributes.agility +
    beast.attributes.ward +
    beast.attributes.vitality;
  
  const avgStat = totalStats / 6;
  
  // Atribui IA baseado no poder
  if (avgStat < 30) {
    return getAIConfig('novice');
  } else if (avgStat < 50) {
    return getAIConfig('veteran');
  } else if (avgStat < 70) {
    return getAIConfig('elite');
  } else {
    return getAIConfig('legendary');
  }
}

// ===== LOGS DE DEBUG =====

export function logAIDecision(
  action: CombatAction,
  context: DecisionContext,
  config: AIConfig
): void {
  console.log('=== AI DECISION ===');
  console.log('Personality:', config.personality);
  console.log('Strategy:', config.strategy);
  console.log('HP:', `${(context.myHpPercent * 100).toFixed(0)}%`);
  console.log('Essence:', `${(context.myEssencePercent * 100).toFixed(0)}%`);
  console.log('Action:', action.type === 'technique' ? `Technique: ${action.techniqueId}` : 'DEFEND');
  console.log('==================');
}

