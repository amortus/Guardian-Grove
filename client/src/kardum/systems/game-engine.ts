/**
 * KARDUM - Game Engine
 * Sistema principal de jogo
 */

import {
  GameMatch,
  PlayerState,
  Card,
  DefenderCard,
  AbilityCard,
  GeneralCard,
  ConsumableCard,
  EquipmentCard,
  isDefenderCard,
  isAbilityCard,
  isConsumableCard,
  isEquipmentCard,
} from '../../../../shared/kardum-types';

/**
 * Engine do Jogo KARDUM
 */
export class KardumEngine {
  public match: GameMatch;
  private eventLog: string[] = [];

  constructor(playerGeneral: GeneralCard, opponentGeneral: GeneralCard, playerDeck: Card[], opponentDeck: Card[]) {
    this.match = {
      id: `match_${Date.now()}`,
      player: this.createPlayerState('Player', playerGeneral, playerDeck),
      opponent: this.createPlayerState('AI', opponentGeneral, opponentDeck),
      turn: 'player',
      phase: 'draw',
      turnNumber: 1,
      isPvP: false,
      createdAt: new Date(),
    };
  }

  /**
   * Inicia o jogo
   */
  start(): void {
    this.log('🎮 KARDUM - Iniciando partida!');
    
    // Comprar 5 cartas iniciais
    this.drawCards(this.match.player, 5);
    this.drawCards(this.match.opponent, 5);
    
    this.log(`${this.match.player.name} comprou 5 cartas`);
    this.log(`${this.match.opponent.name} comprou 5 cartas`);
    
    // Player 1 não compra no primeiro turno, vai direto pra strategy
    this.match.phase = 'strategy';
    this.match.player.hasDrawnThisTurn = true;
    
    this.log(`Turno 1 - ${this.match.player.name}`);
  }

  /**
   * Fase de compra
   */
  drawPhase(): void {
    const current = this.getCurrentPlayer();
    
    this.log(`\n📥 Fase de Compra - ${current.name}`);
    
    // +1 recurso máximo (até 10)
    if (current.maxResources < 10) {
      current.maxResources += 1;
      this.log(`+1 recurso máximo (agora ${current.maxResources})`);
    }
    
    // Recarrega recursos
    current.resources = current.maxResources;
    this.log(`Recursos recarregados: ${current.resources}`);
    
    // Compra 1 carta
    if (!current.hasDrawnThisTurn) {
      this.drawCards(current, 1);
      current.hasDrawnThisTurn = true;
    }
    
    this.match.phase = 'strategy';
  }

  /**
   * Joga uma carta
   */
  playCard(cardId: string, targetId?: string): boolean {
    const current = this.getCurrentPlayer();
    const opponent = this.getOpponent();
    const cardIndex = current.hand.findIndex(c => c.id === cardId);
    
    if (cardIndex === -1) {
      this.log(`❌ Carta ${cardId} não está na mão`);
      return false;
    }

    const card = current.hand[cardIndex];

    // Verifica recursos
    if (card.cost > current.resources) {
      this.log(`❌ Recursos insuficientes (precisa ${card.cost}, tem ${current.resources})`);
      return false;
    }

    // Validações específicas
    if (isAbilityCard(card) && current.hasPlayedAbility) {
      this.log(`❌ Já jogou 1 habilidade neste turno`);
      return false;
    }

    // Remove da mão e gasta recursos
    current.hand.splice(cardIndex, 1);
    current.resources -= card.cost;

    this.log(`🎴 ${current.name} jogou ${card.name} (custo: ${card.cost})`);

    // Executa baseado no tipo
    if (isDefenderCard(card)) {
      const defender = { ...card, state: 'positioning' } as DefenderCard;
      // Verifica se tem Charge (pode atacar imediatamente)
      const hasCharge = defender.abilities?.some(a => a.id === 'charge');
      if (hasCharge) {
        defender.state = 'field';
        this.log(`  ⚡ ${defender.name} tem Investida! Pode atacar neste turno.`);
      }
      current.field.push(defender);
      this.log(`  → ${defender.name} entrou em campo (${defender.attack}/${defender.health})`);
    } else if (isAbilityCard(card)) {
      this.executeAbility(card, targetId);
      current.graveyard.push(card);
      current.hasPlayedAbility = true;
    } else if (isConsumableCard(card)) {
      this.executeConsumable(card);
      current.graveyard.push(card);
    } else if (isEquipmentCard(card)) {
      // TODO: Implementar equipamento
      this.log(`  ⚠️ Equipamentos ainda não implementados`);
      current.graveyard.push(card);
    }

    return true;
  }

  /**
   * Ataca com um Defender
   */
  attack(attackerId: string, targetId: string): boolean {
    const current = this.getCurrentPlayer();
    const opponent = this.getOpponent();

    const attacker = current.field.find(d => d.id === attackerId);
    if (!attacker) {
      this.log(`❌ Atacante ${attackerId} não encontrado`);
      return false;
    }

    // Verifica se pode atacar
    if (attacker.state === 'positioning') {
      this.log(`❌ ${attacker.name} está se posicionando, não pode atacar`);
      return false;
    }

    // Encontra alvo
    let target: DefenderCard | GeneralCard | undefined;

    if (targetId === 'general') {
      // Verifica se há defenders com Taunt
      const tauntDefenders = opponent.field.filter(d => 
        d.abilities?.some(a => a.id === 'taunt')
      );
      
      if (tauntDefenders.length > 0) {
        this.log(`❌ Existe defender com Provocar! Deve atacar ele primeiro.`);
        return false;
      }
      
      target = opponent.general;
      this.log(`⚔️ ${attacker.name} ataca ${opponent.general.name}!`);
    } else {
      target = opponent.field.find(d => d.id === targetId);
      if (target) {
        this.log(`⚔️ ${attacker.name} ataca ${target.name}!`);
      }
    }

    if (!target) {
      this.log(`❌ Alvo ${targetId} não encontrado`);
      return false;
    }

    // Executa ataque
    target.health -= attacker.attack;
    this.log(`  → ${target.name} sofreu ${attacker.attack} de dano (HP: ${target.health})`);
    
    // Contra-ataque (se for defender)
    if (isDefenderCard(target)) {
      attacker.health -= target.attack;
      this.log(`  ← ${attacker.name} sofreu ${target.attack} de dano contra-ataque (HP: ${attacker.health})`);
    }

    // Remove defenders mortos
    if (isDefenderCard(target) && target.health <= 0) {
      const index = opponent.field.findIndex(d => d.id === target.id);
      if (index !== -1) {
        this.log(`  💀 ${target.name} foi destruído!`);
        opponent.graveyard.push(opponent.field[index]);
        opponent.field.splice(index, 1);
      }
    }

    // Remove atacante se morreu
    if (attacker.health <= 0) {
      const index = current.field.findIndex(d => d.id === attacker.id);
      if (index !== -1) {
        this.log(`  💀 ${attacker.name} foi destruído!`);
        current.graveyard.push(current.field[index]);
        current.field.splice(index, 1);
      }
    }

    return true;
  }

  /**
   * Passa o turno
   */
  endTurn(): void {
    const current = this.getCurrentPlayer();
    
    this.log(`\n🔄 ${current.name} passou o turno`);
    
    // Remove estado "positioning" dos defenders
    current.field.forEach(defender => {
      if (defender.state === 'positioning') {
        defender.state = 'field';
      }
    });

    // Reset flags de ações
    current.hasDrawnThisTurn = false;
    current.hasPlayedAbility = false;
    current.hasPlayedMount = false;

    // Troca de turno
    this.match.turn = this.match.turn === 'player' ? 'opponent' : 'player';
    
    if (this.match.turn === 'player') {
      this.match.turnNumber += 1;
    }
    
    // Próximo jogador começa na fase de compra
    this.match.phase = 'draw';
  }

  /**
   * Verifica vitória
   */
  checkWinner(): 'player' | 'opponent' | null {
    if (this.match.opponent.general.health <= 0) {
      this.match.winner = 'player';
      this.match.phase = 'finished';
      this.log(`\n🏆 ${this.match.player.name} VENCEU!`);
      return 'player';
    }
    
    if (this.match.player.general.health <= 0) {
      this.match.winner = 'opponent';
      this.match.phase = 'finished';
      this.log(`\n🏆 ${this.match.opponent.name} VENCEU!`);
      return 'opponent';
    }
    
    return null;
  }

  /**
   * Obtém log de eventos
   */
  getLog(): string[] {
    return [...this.eventLog];
  }

  /**
   * Limpa log
   */
  clearLog(): void {
    this.eventLog = [];
  }

  // ===== MÉTODOS PRIVADOS =====

  private createPlayerState(name: string, general: GeneralCard, deck: Card[]): PlayerState {
    return {
      name,
      general: { ...general },
      deck: this.shuffleDeck([...deck]),
      hand: [],
      field: [],
      graveyard: [],
      resources: 1,
      maxResources: 1,
      hasDrawnThisTurn: false,
      hasPlayedAbility: false,
      hasPlayedMount: false,
    };
  }

  private drawCards(player: PlayerState, count: number): void {
    for (let i = 0; i < count && player.deck.length > 0; i++) {
      const card = player.deck.pop()!;
      
      if (player.hand.length < 10) {
        player.hand.push(card);
      } else {
        // Mão cheia, carta é queimada
        player.graveyard.push(card);
        this.log(`  🔥 ${card.name} foi queimada (mão cheia)`);
      }
    }

    // Deck vazio = 2 dano no General (fadiga)
    if (player.deck.length === 0 && count > 0) {
      player.general.health -= 2;
      this.log(`  💔 ${player.name} sofreu 2 de fadiga (deck vazio)`);
    }
  }

  private executeAbility(ability: AbilityCard, targetId?: string): void {
    const current = this.getCurrentPlayer();
    const opponent = this.getOpponent();

    this.log(`  ✨ Efeito: ${ability.description}`);

    if (ability.damage) {
      if (ability.target === 'enemy_general' || targetId === 'general') {
        opponent.general.health -= ability.damage;
        this.log(`  → ${opponent.general.name} sofreu ${ability.damage} de dano (HP: ${opponent.general.health})`);
      } else if (ability.target === 'enemy_single' && targetId) {
        const target = opponent.field.find(d => d.id === targetId);
        if (target) {
          target.health -= ability.damage;
          this.log(`  → ${target.name} sofreu ${ability.damage} de dano (HP: ${target.health})`);
          
          if (target.health <= 0) {
            const index = opponent.field.findIndex(d => d.id === target.id);
            if (index !== -1) {
              this.log(`  💀 ${target.name} foi destruído!`);
              opponent.graveyard.push(opponent.field[index]);
              opponent.field.splice(index, 1);
            }
          }
        }
      } else if (ability.target === 'enemy_all') {
        opponent.field.forEach(defender => {
          defender.health -= ability.damage!;
          this.log(`  → ${defender.name} sofreu ${ability.damage} de dano (HP: ${defender.health})`);
        });
        
        // Remove mortos
        opponent.field = opponent.field.filter(d => {
          if (d.health <= 0) {
            this.log(`  💀 ${d.name} foi destruído!`);
            opponent.graveyard.push(d);
            return false;
          }
          return true;
        });
      }
    }

    if (ability.heal && ability.target === 'ally') {
      if (targetId === 'general') {
        const healed = Math.min(ability.heal, current.general.maxHealth - current.general.health);
        current.general.health += healed;
        this.log(`  → ${current.general.name} curou ${healed} HP (HP: ${current.general.health})`);
      } else if (targetId) {
        const target = current.field.find(d => d.id === targetId);
        if (target && target.maxHealth) {
          const healed = Math.min(ability.heal, target.maxHealth - target.health);
          target.health += healed;
          this.log(`  → ${target.name} curou ${healed} HP (HP: ${target.health})`);
        }
      }
    }
  }

  private executeConsumable(consumable: ConsumableCard): void {
    const current = this.getCurrentPlayer();
    
    this.log(`  💊 Efeito: ${consumable.description}`);
    
    consumable.effects.forEach(effect => {
      if (effect.type === 'heal' && effect.target === 'self') {
        const healed = Math.min(effect.value!, current.general.maxHealth - current.general.health);
        current.general.health += healed;
        this.log(`  → ${current.general.name} curou ${healed} HP (HP: ${current.general.health})`);
      }
    });
  }

  private getCurrentPlayer(): PlayerState {
    return this.match.turn === 'player' ? this.match.player : this.match.opponent;
  }

  private getOpponent(): PlayerState {
    return this.match.turn === 'player' ? this.match.opponent : this.match.player;
  }

  private shuffleDeck(deck: Card[]): Card[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private log(message: string): void {
    console.log(`[KARDUM] ${message}`);
    this.eventLog.push(message);
  }
}

