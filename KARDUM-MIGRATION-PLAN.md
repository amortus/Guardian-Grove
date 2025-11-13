# 🎴 KARDUM - Plano de Migração e Desenvolvimento

## 📋 Análise do Projeto Atual (Guardian Grove)

### ✅ O que já temos e podemos reutilizar:

#### 1. **Infraestrutura Sólida**
- ✅ Cliente TypeScript + Vite (build rápido, hot reload)
- ✅ Servidor Node.js + Express + PostgreSQL
- ✅ Sistema de autenticação (Google OAuth + JWT)
- ✅ WebSocket para tempo real (já funcional)
- ✅ Sistema de save/persistência
- ✅ PWA configurado (instalável mobile/desktop)
- ✅ Deploy configurado (Railway/Vercel)

#### 2. **Sistemas Reutilizáveis**
- ✅ **Sistema de Combate por Turnos** - Base perfeita para o card game
  - Já tem fase de jogador/inimigo
  - Sistema de ações (atacar, defender, técnicas)
  - Barra de recursos (Essência → pode virar Recursos de Guerra)
  - AI inimiga (pode virar AI para PvE)
  
- ✅ **UI/Canvas System** - Canvas 2D + rendering
  - Sistema de UI modular (`client/src/ui/`)
  - Sistema de batalha visual (`battle-ui.ts`)
  - Renderização de sprites e animações
  
- ✅ **Sistema de Inventário** - Pode virar coleção de cartas
  - Sistema de itens + quantidades
  - Sistema de equipamentos
  
- ✅ **Sistema Social**
  - Friends system
  - Chat (global + whisper)
  - Ranking/Leaderboards

#### 3. **Banco de Dados Pronto**
- ✅ Migrations system estruturado
- ✅ Tabelas de usuários, saves, inventário
- ✅ Sistema de amigos já implementado
- ✅ Sistema de chat + histórico

---

## 🎯 Plano de Transformação: Guardian Grove → KARDUM

### Fase 1: Fundação do Card Game (Semana 1-2)
**Objetivo**: Criar as estruturas base de cartas e deck

#### 1.1 Modelagem de Dados (3 dias)

**Criar tipos TypeScript compartilhados** (`shared/types-kardum.ts`):

```typescript
// Raças
export type Race = 'human' | 'deva' | 'orc' | 'dwarf' | 'elf';

// Classes (para Generais e Habilidades)
export type ClassType = 
  | 'warrior' | 'barbarian' | 'druid' | 'elementalist'
  | 'necromancer' | 'archer' | 'assassin' | 'chivalry';

// Tipos de Carta
export type CardType = 
  | 'general'      // 1 por deck, é o "herói"
  | 'defender'     // Soldados, ficam em campo
  | 'equipment'    // Equipam em Defender/General
  | 'mount'        // Pode ser Defender OU Equipment
  | 'consumable'   // Uso único, depois destroi
  | 'ability';     // Habilidades especiais por classe

// Estados de Carta
export type CardState = 
  | 'deck'         // No baralho
  | 'hand'         // Na mão do jogador
  | 'field'        // No campo de batalha
  | 'graveyard'    // Cemitério (destruída)
  | 'positioning'; // Entrou neste turno (não pode atacar)

// Carta Base
export interface Card {
  id: string;
  name: string;
  type: CardType;
  race?: Race;              // Só para General/Defender
  class?: ClassType;        // Só para General/Ability
  warResourceCost: number;  // Custo para jogar (0-10)
  attack?: number;          // Só para Defender/General
  health?: number;          // Só para Defender/General
  description: string;
  effects?: CardEffect[];   // Efeitos especiais
  imageUrl?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// General (herói do jogador)
export interface GeneralCard extends Card {
  type: 'general';
  class: ClassType;
  race: Race;
  attack: number;
  health: number;
  maxHealth: number;
  ability?: string;         // Habilidade especial do General
}

// Defender (soldados)
export interface DefenderCard extends Card {
  type: 'defender';
  race: Race;
  attack: number;
  health: number;
  canAttackOnEnter?: boolean; // "Investida" - pode atacar no turno que entra
  taunt?: boolean;             // "Provocar" - obriga inimigo atacar ele
  equipmentSlot?: EquipmentCard | null; // Equipamento anexado
}

// Equipment (equipamentos)
export interface EquipmentCard extends Card {
  type: 'equipment';
  attachTo: 'defender' | 'general' | 'both';
  attackBonus?: number;
  healthBonus?: number;
  effects?: CardEffect[];
}

// Mount (montarias - dual purpose)
export interface MountCard extends Card {
  type: 'mount';
  mode?: 'defender' | 'equipment'; // Decidido ao jogar
  // Se modo Defender:
  attack?: number;
  health?: number;
  // Se modo Equipment:
  attackBonus?: number;
  healthBonus?: number;
  areaEffect?: boolean; // Afeta múltiplos Defenders
}

// Consumable (consumíveis)
export interface ConsumableCard extends Card {
  type: 'consumable';
  targetType: 'self' | 'ally' | 'enemy' | 'all';
  effects: CardEffect[];
}

// Ability (habilidades por classe)
export interface AbilityCard extends Card {
  type: 'ability';
  class: ClassType; // Só Generais desta classe podem usar
  targetType: 'self' | 'ally' | 'enemy' | 'all';
  effects: CardEffect[];
}

// Efeitos de Carta
export interface CardEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'draw' | 'destroy' | 'return_hand';
  value?: number;
  duration?: number; // Em turnos
  target: 'self' | 'ally' | 'enemy' | 'all' | 'random';
}

// Deck
export interface Deck {
  id: string;
  name: string;
  userId: number;
  general: GeneralCard;      // 1 obrigatório
  cards: Card[];             // 30-40 cartas
  createdAt: Date;
  updatedAt: Date;
}

// Estado do Jogo (Match)
export interface GameMatch {
  id: string;
  player1: PlayerState;
  player2: PlayerState | null; // Null se for PvE
  turn: 1 | 2;                 // De quem é o turno
  phase: GamePhase;
  turnNumber: number;
  createdAt: Date;
  isPvP: boolean;
}

export type GamePhase = 
  | 'waiting'        // Esperando oponente
  | 'draw'           // Fase de Compra
  | 'strategy'       // Fase de Estratégia (jogar cartas)
  | 'combat'         // Fase de Combate (atacar)
  | 'end_turn'       // Passando turno
  | 'finished';      // Jogo acabou

export interface PlayerState {
  userId: number;
  username: string;
  general: GeneralCard;       // General em campo
  deck: Card[];               // Cartas no deck
  hand: Card[];               // Cartas na mão (max 10)
  field: DefenderCard[];      // Defenders em campo
  graveyard: Card[];          // Cemitério
  warResources: number;       // Recursos atuais (0-10)
  maxWarResources: number;    // Máximo de recursos (aumenta 1 por turno)
  hasDrawnThisTurn: boolean;
  hasPlayedAbility: boolean;  // 1 ability por turno
  hasPlayedMount: boolean;    // 1 mount por turno
}
```

#### 1.2 Migrations do Banco de Dados (2 dias)

**Criar migrations** (`server/src/db/migrations/`):

```sql
-- 100_kardum_cards.sql
CREATE TABLE IF NOT EXISTS cards (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL,
  race VARCHAR(20),
  class VARCHAR(20),
  war_resource_cost INTEGER NOT NULL,
  attack INTEGER,
  health INTEGER,
  description TEXT NOT NULL,
  effects JSONB,
  image_url VARCHAR(255),
  rarity VARCHAR(20) DEFAULT 'common',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cards_type ON cards(type);
CREATE INDEX idx_cards_race ON cards(race);
CREATE INDEX idx_cards_class ON cards(class);

-- 101_kardum_decks.sql
CREATE TABLE IF NOT EXISTS decks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  general_card_id VARCHAR(50) REFERENCES cards(id),
  cards JSONB NOT NULL, -- Array de card IDs
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_decks_user ON decks(user_id);
CREATE INDEX idx_decks_general ON decks(general_card_id);

-- 102_kardum_card_collection.sql
-- Cartas que o jogador possui (coleção)
CREATE TABLE IF NOT EXISTS user_cards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  card_id VARCHAR(50) REFERENCES cards(id),
  quantity INTEGER DEFAULT 1,
  acquired_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, card_id)
);

CREATE INDEX idx_user_cards_user ON user_cards(user_id);

-- 103_kardum_matches.sql
CREATE TABLE IF NOT EXISTS matches (
  id VARCHAR(50) PRIMARY KEY,
  player1_id INTEGER REFERENCES users(id),
  player2_id INTEGER REFERENCES users(id),
  player1_deck_id INTEGER REFERENCES decks(id),
  player2_deck_id INTEGER REFERENCES decks(id),
  game_state JSONB NOT NULL, -- Estado completo do jogo
  winner_id INTEGER REFERENCES users(id),
  is_pvp BOOLEAN DEFAULT true,
  started_at TIMESTAMP DEFAULT NOW(),
  finished_at TIMESTAMP
);

CREATE INDEX idx_matches_player1 ON matches(player1_id);
CREATE INDEX idx_matches_player2 ON matches(player2_id);
CREATE INDEX idx_matches_started ON matches(started_at);

-- 104_kardum_match_history.sql
CREATE TABLE IF NOT EXISTS match_history (
  id SERIAL PRIMARY KEY,
  match_id VARCHAR(50) REFERENCES matches(id) ON DELETE CASCADE,
  turn_number INTEGER NOT NULL,
  phase VARCHAR(20) NOT NULL,
  action JSONB NOT NULL, -- Ação realizada
  timestamp BIGINT NOT NULL
);

CREATE INDEX idx_match_history_match ON match_history(match_id);
CREATE INDEX idx_match_history_turn ON match_history(match_id, turn_number);
```

#### 1.3 Sistema de Cartas (3 dias)

**Criar sistema de cartas** (`client/src/systems/card-system.ts`):

```typescript
import { Card, Deck, CardEffect } from '../../../shared/types-kardum';

/**
 * Sistema de Gerenciamento de Cartas
 */
export class CardSystem {
  private cards: Map<string, Card> = new Map();

  /**
   * Carrega todas as cartas disponíveis
   */
  async loadCards(): Promise<void> {
    // Carrega do servidor ou de data/cards.ts
    const response = await fetch('/api/cards');
    const cardsData = await response.json();
    
    cardsData.forEach((card: Card) => {
      this.cards.set(card.id, card);
    });
  }

  /**
   * Obtém carta por ID
   */
  getCard(id: string): Card | undefined {
    return this.cards.get(id);
  }

  /**
   * Valida se um deck é válido
   */
  validateDeck(deck: Deck): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Deve ter exatamente 1 General
    if (!deck.general) {
      errors.push('Deck precisa de 1 General');
    }

    // Deve ter entre 30-40 cartas
    if (deck.cards.length < 30 || deck.cards.length > 40) {
      errors.push('Deck deve ter entre 30 e 40 cartas');
    }

    // Verifica se habilidades são da classe do General
    const abilityCards = deck.cards.filter(c => c.type === 'ability');
    abilityCards.forEach(card => {
      if (card.class !== deck.general.class) {
        errors.push(`Habilidade ${card.name} não é da classe ${deck.general.class}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Aplica efeito de carta
   */
  applyCardEffect(effect: CardEffect, source: Card, target: Card): void {
    switch (effect.type) {
      case 'damage':
        if ('health' in target && typeof target.health === 'number') {
          target.health -= effect.value || 0;
        }
        break;
      
      case 'heal':
        if ('health' in target && typeof target.health === 'number') {
          target.health = Math.min(target.health + (effect.value || 0), target.health);
        }
        break;

      case 'buff':
        // Implementar sistema de buffs
        break;

      // ... outros efeitos
    }
  }
}
```

---

### Fase 2: Sistema de Combate PvP (Semana 3-4)
**Objetivo**: Implementar o loop de jogo KARDUM

#### 2.1 Game Loop (4 dias)

**Criar sistema de match** (`client/src/systems/kardum-match.ts`):

```typescript
import { GameMatch, PlayerState, GamePhase, Card, DefenderCard } from '../../../shared/types-kardum';

/**
 * Sistema de Match KARDUM
 */
export class KardumMatch {
  private match: GameMatch;
  private onStateChange?: (match: GameMatch) => void;

  constructor(match: GameMatch) {
    this.match = match;
  }

  /**
   * Inicia o jogo
   */
  start(): void {
    // Player 1 começa (não compra carta no primeiro turno)
    this.match.phase = 'strategy';
    this.match.turn = 1;
    this.match.turnNumber = 1;
    
    // Comprar 5 cartas iniciais para cada jogador
    this.drawCards(this.match.player1, 5);
    if (this.match.player2) {
      this.drawCards(this.match.player2, 5);
    }

    this.notifyStateChange();
  }

  /**
   * Fase de Compra
   */
  drawPhase(): void {
    const currentPlayer = this.getCurrentPlayer();
    
    // Adiciona 1 recurso de guerra (max 10)
    if (currentPlayer.maxWarResources < 10) {
      currentPlayer.maxWarResources += 1;
    }
    
    // Recarrega recursos para o máximo
    currentPlayer.warResources = currentPlayer.maxWarResources;
    
    // Compra 1 carta (exceto no primeiro turno do jogo)
    if (this.match.turnNumber > 1) {
      this.drawCards(currentPlayer, 1);
    }
    
    this.match.phase = 'strategy';
    this.notifyStateChange();
  }

  /**
   * Fase de Estratégia - Jogar cartas
   */
  playCard(cardId: string, options?: { mode?: 'defender' | 'equipment'; targetId?: string }): boolean {
    const currentPlayer = this.getCurrentPlayer();
    const cardIndex = currentPlayer.hand.findIndex(c => c.id === cardId);
    
    if (cardIndex === -1) {
      console.error('Carta não está na mão');
      return false;
    }

    const card = currentPlayer.hand[cardIndex];

    // Verifica recursos
    if (card.warResourceCost > currentPlayer.warResources) {
      console.error('Recursos insuficientes');
      return false;
    }

    // Validações específicas por tipo
    if (card.type === 'ability' && currentPlayer.hasPlayedAbility) {
      console.error('Já jogou 1 habilidade neste turno');
      return false;
    }

    if (card.type === 'mount' && currentPlayer.hasPlayedMount) {
      console.error('Já jogou 1 montaria neste turno');
      return false;
    }

    // Remove da mão e gasta recursos
    currentPlayer.hand.splice(cardIndex, 1);
    currentPlayer.warResources -= card.warResourceCost;

    // Coloca em campo baseado no tipo
    switch (card.type) {
      case 'defender':
        const defender = card as DefenderCard;
        defender.state = 'positioning'; // Não pode atacar neste turno
        currentPlayer.field.push(defender);
        break;

      case 'mount':
        if (options?.mode === 'defender') {
          // Montaria como Defender
          currentPlayer.field.push(card as DefenderCard);
        } else {
          // Montaria como Equipment (implementar lógica de equip)
        }
        currentPlayer.hasPlayedMount = true;
        break;

      case 'consumable':
        // Aplica efeito e joga no cemitério
        this.applyCardEffects(card, options?.targetId);
        currentPlayer.graveyard.push(card);
        break;

      case 'ability':
        this.applyCardEffects(card, options?.targetId);
        currentPlayer.graveyard.push(card);
        currentPlayer.hasPlayedAbility = true;
        break;

      case 'equipment':
        // Equipar em target (Defender ou General)
        this.equipCard(card, options?.targetId);
        break;
    }

    this.notifyStateChange();
    return true;
  }

  /**
   * Fase de Combate - Atacar
   */
  attack(attackerId: string, targetId: string): boolean {
    const currentPlayer = this.getCurrentPlayer();
    const opponent = this.getOpponent();

    // Encontra atacante
    const attacker = currentPlayer.field.find(d => d.id === attackerId);
    if (!attacker) {
      console.error('Atacante não encontrado');
      return false;
    }

    // Verifica se pode atacar
    if (attacker.state === 'positioning' && !attacker.canAttackOnEnter) {
      console.error('Carta está se posicionando, não pode atacar');
      return false;
    }

    // Encontra alvo
    let target: Card | null = null;
    
    if (targetId === 'general') {
      target = opponent.general;
      
      // Verifica se há defenders com Taunt
      const tauntDefenders = opponent.field.filter(d => d.taunt);
      if (tauntDefenders.length > 0) {
        console.error('Existem defenders com Taunt, deve atacar eles primeiro');
        return false;
      }
    } else {
      target = opponent.field.find(d => d.id === targetId) || null;
    }

    if (!target) {
      console.error('Alvo não encontrado');
      return false;
    }

    // Executa ataque
    if ('health' in target && 'attack' in attacker) {
      target.health -= attacker.attack || 0;
      
      // Se alvo é defender, ele contra-ataca
      if ('attack' in target && target.type === 'defender') {
        attacker.health -= target.attack || 0;
      }

      // Remove defenders mortos
      if (target.type === 'defender' && target.health <= 0) {
        const index = opponent.field.findIndex(d => d.id === target.id);
        if (index !== -1) {
          opponent.graveyard.push(opponent.field[index]);
          opponent.field.splice(index, 1);
        }
      }

      // Remove atacante se morreu
      if (attacker.health <= 0) {
        const index = currentPlayer.field.findIndex(d => d.id === attacker.id);
        if (index !== -1) {
          currentPlayer.graveyard.push(currentPlayer.field[index]);
          currentPlayer.field.splice(index, 1);
        }
      }

      // Verifica vitória
      if (opponent.general.health <= 0) {
        this.match.phase = 'finished';
        // Define vencedor
      }
    }

    this.notifyStateChange();
    return true;
  }

  /**
   * Passa o turno
   */
  endTurn(): void {
    const currentPlayer = this.getCurrentPlayer();
    
    // Remove estado "positioning" dos defenders
    currentPlayer.field.forEach(defender => {
      if (defender.state === 'positioning') {
        defender.state = 'field';
      }
    });

    // Reset flags de ações
    currentPlayer.hasDrawnThisTurn = false;
    currentPlayer.hasPlayedAbility = false;
    currentPlayer.hasPlayedMount = false;

    // Troca de turno
    this.match.turn = this.match.turn === 1 ? 2 : 1;
    this.match.turnNumber += 1;
    
    // Próximo jogador começa na fase de compra
    this.match.phase = 'draw';
    this.drawPhase();
  }

  // Helpers
  private getCurrentPlayer(): PlayerState {
    return this.match.turn === 1 ? this.match.player1 : this.match.player2!;
  }

  private getOpponent(): PlayerState {
    return this.match.turn === 1 ? this.match.player2! : this.match.player1;
  }

  private drawCards(player: PlayerState, count: number): void {
    for (let i = 0; i < count && player.deck.length > 0; i++) {
      const card = player.deck.pop()!;
      
      if (player.hand.length < 10) {
        player.hand.push(card);
      } else {
        // Mão cheia, carta é queimada
        player.graveyard.push(card);
      }
    }

    // Se deck vazio, General sofre 2 de dano por compra
    if (player.deck.length === 0) {
      player.general.health -= 2;
    }
  }

  private applyCardEffects(card: Card, targetId?: string): void {
    // Implementar lógica de efeitos
  }

  private equipCard(equipment: Card, targetId?: string): void {
    // Implementar lógica de equipamento
  }

  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.match);
    }
  }
}
```

#### 2.2 UI do Card Game (4 dias)

**Criar UI do jogo** (`client/src/ui/kardum-game-ui.ts`):

```typescript
/**
 * UI do Jogo KARDUM
 * Layout tipo Hearthstone
 */
export class KardumGameUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private match: GameMatch;

  // Regiões da tela
  private regions = {
    // Oponente (topo)
    opponentGeneral: { x: 640, y: 50, w: 120, h: 160 },
    opponentField: { x: 100, y: 220, w: 1200, h: 180 },
    
    // Centro
    playerField: { x: 100, y: 450, w: 1200, h: 180 },
    
    // Jogador (base)
    playerHand: { x: 100, y: 680, w: 1200, h: 140 },
    playerGeneral: { x: 640, y: 840, w: 120, h: 160 },
    
    // HUD
    resources: { x: 20, y: 20, w: 200, h: 50 },
    endTurnButton: { x: 1150, y: 500, w: 120, h: 50 },
  };

  constructor(canvas: HTMLCanvasElement, match: GameMatch) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.match = match;
  }

  /**
   * Renderiza o jogo
   */
  render(): void {
    this.clear();
    this.drawBackground();
    
    const currentPlayer = this.getCurrentPlayer();
    const opponent = this.getOpponent();

    // Desenha campo do oponente (invertido)
    this.drawGeneral(opponent.general, this.regions.opponentGeneral, true);
    this.drawField(opponent.field, this.regions.opponentField, true);

    // Desenha campo do jogador
    this.drawField(currentPlayer.field, this.regions.playerField, false);
    this.drawHand(currentPlayer.hand, this.regions.playerHand);
    this.drawGeneral(currentPlayer.general, this.regions.playerGeneral, false);

    // HUD
    this.drawResources(currentPlayer);
    this.drawEndTurnButton();
    this.drawPhaseIndicator();
  }

  /**
   * Desenha uma carta
   */
  private drawCard(card: Card, x: number, y: number, width: number, height: number, faceDown = false): void {
    const ctx = this.ctx;

    if (faceDown) {
      // Verso da carta
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(x, y, width, height);
      ctx.strokeStyle = '#ecf0f1';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);
      return;
    }

    // Frente da carta
    // Background baseado no tipo
    const typeColors = {
      general: '#e74c3c',
      defender: '#3498db',
      equipment: '#95a5a6',
      mount: '#f39c12',
      consumable: '#2ecc71',
      ability: '#9b59b6',
    };

    ctx.fillStyle = typeColors[card.type] || '#34495e';
    ctx.fillRect(x, y, width, height);

    // Borda
    ctx.strokeStyle = '#ecf0f1';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    // Nome
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(card.name, x + width / 2, y + 20);

    // Custo (canto superior esquerdo)
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.arc(x + 20, y + 20, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(card.warResourceCost.toString(), x + 20, y + 25);

    // Stats (se for Defender/General)
    if ('attack' in card && 'health' in card) {
      // Ataque (canto inferior esquerdo)
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.arc(x + 20, y + height - 20, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(card.attack!.toString(), x + 20, y + height - 15);

      // Vida (canto inferior direito)
      ctx.fillStyle = '#2ecc71';
      ctx.beginPath();
      ctx.arc(x + width - 20, y + height - 20, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillText(card.health!.toString(), x + width - 20, y + height - 15);
    }

    // Descrição (truncada)
    ctx.fillStyle = '#ecf0f1';
    ctx.font = '10px Arial';
    const maxWidth = width - 20;
    const description = this.truncateText(card.description, maxWidth);
    ctx.fillText(description, x + width / 2, y + height / 2);
  }

  /**
   * Desenha General
   */
  private drawGeneral(general: GeneralCard, region: any, isOpponent: boolean): void {
    this.drawCard(general, region.x, region.y, region.w, region.h, isOpponent);
  }

  /**
   * Desenha campo de batalha
   */
  private drawField(field: DefenderCard[], region: any, isOpponent: boolean): void {
    const cardWidth = 100;
    const cardHeight = 140;
    const spacing = 10;
    const maxCards = 7; // Limite de 7 defenders no campo

    field.forEach((card, index) => {
      const x = region.x + (cardWidth + spacing) * index;
      const y = region.y + 20;

      this.drawCard(card, x, y, cardWidth, cardHeight, isOpponent);

      // Indicador de "Positioning"
      if (card.state === 'positioning' && !isOpponent) {
        this.ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        this.ctx.fillRect(x, y, cardWidth, cardHeight);
        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('ZZZ', x + cardWidth / 2, y + cardHeight / 2);
      }
    });
  }

  /**
   * Desenha mão do jogador
   */
  private drawHand(hand: Card[], region: any): void {
    const cardWidth = 80;
    const cardHeight = 110;
    const spacing = 10;
    const totalWidth = (cardWidth + spacing) * hand.length;
    const startX = region.x + (region.w - totalWidth) / 2;

    hand.forEach((card, index) => {
      const x = startX + (cardWidth + spacing) * index;
      const y = region.y + 20;

      this.drawCard(card, x, y, cardWidth, cardHeight);
    });
  }

  /**
   * Desenha recursos de guerra
   */
  private drawResources(player: PlayerState): void {
    const region = this.regions.resources;
    const ctx = this.ctx;

    // Background
    ctx.fillStyle = 'rgba(44, 62, 80, 0.8)';
    ctx.fillRect(region.x, region.y, region.w, region.h);

    // Texto
    ctx.fillStyle = '#f39c12';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`⚡ ${player.warResources} / ${player.maxWarResources}`, region.x + 10, region.y + 30);
  }

  /**
   * Desenha botão de passar turno
   */
  private drawEndTurnButton(): void {
    const region = this.regions.endTurnButton;
    const ctx = this.ctx;

    // Botão
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(region.x, region.y, region.w, region.h);

    // Texto
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('End Turn', region.x + region.w / 2, region.y + region.h / 2 + 5);
  }

  /**
   * Desenha indicador de fase
   */
  private drawPhaseIndicator(): void {
    const ctx = this.ctx;
    const phaseNames = {
      draw: 'Draw Phase',
      strategy: 'Strategy Phase',
      combat: 'Combat Phase',
      end_turn: 'Ending Turn...',
      finished: 'Game Over',
    };

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(500, 10, 200, 40);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(phaseNames[this.match.phase], 600, 35);
  }

  // Helpers
  private clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawBackground(): void {
    // Gradiente
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#2c3e50');
    gradient.addColorStop(1, '#34495e');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private truncateText(text: string, maxWidth: number): string {
    // Implementar truncamento de texto
    return text.substring(0, 30) + '...';
  }

  private getCurrentPlayer(): PlayerState {
    return this.match.turn === 1 ? this.match.player1 : this.match.player2!;
  }

  private getOpponent(): PlayerState {
    return this.match.turn === 1 ? this.match.player2! : this.match.player1;
  }
}
```

---

### Fase 3: Multiplayer e WebSocket (Semana 5)

#### 3.1 WebSocket para PvP em Tempo Real (3 dias)

**Atualizar servidor WebSocket** (`server/src/services/kardumService.ts`):

```typescript
import { WebSocket } from 'ws';
import { GameMatch, PlayerState } from '../../../shared/types-kardum';

/**
 * Serviço de Matchmaking e PvP
 */
export class KardumService {
  private waitingPlayers: Map<number, WebSocket> = new Map();
  private activeMatches: Map<string, GameMatch> = new Map();

  /**
   * Jogador entra na fila de matchmaking
   */
  enterQueue(userId: number, ws: WebSocket): void {
    this.waitingPlayers.set(userId, ws);

    // Tenta encontrar oponente
    if (this.waitingPlayers.size >= 2) {
      this.createMatch();
    } else {
      ws.send(JSON.stringify({
        type: 'queue_waiting',
        message: 'Procurando oponente...',
      }));
    }
  }

  /**
   * Cria uma partida entre 2 jogadores
   */
  private createMatch(): void {
    const players = Array.from(this.waitingPlayers.entries()).slice(0, 2);
    
    if (players.length < 2) return;

    const [[player1Id, player1Ws], [player2Id, player2Ws]] = players;

    // Remove da fila
    this.waitingPlayers.delete(player1Id);
    this.waitingPlayers.delete(player2Id);

    // Cria match
    const matchId = `match_${Date.now()}_${player1Id}_${player2Id}`;
    const match: GameMatch = {
      id: matchId,
      player1: this.createPlayerState(player1Id),
      player2: this.createPlayerState(player2Id),
      turn: 1,
      phase: 'waiting',
      turnNumber: 0,
      createdAt: new Date(),
      isPvP: true,
    };

    this.activeMatches.set(matchId, match);

    // Notifica jogadores
    player1Ws.send(JSON.stringify({
      type: 'match_found',
      matchId,
      yourTurn: true,
      match,
    }));

    player2Ws.send(JSON.stringify({
      type: 'match_found',
      matchId,
      yourTurn: false,
      match,
    }));
  }

  /**
   * Processa ação do jogador
   */
  handlePlayerAction(userId: number, matchId: string, action: any): void {
    const match = this.activeMatches.get(matchId);
    if (!match) return;

    // Valida se é o turno do jogador
    const isPlayer1 = match.player1.userId === userId;
    const isPlayerTurn = (match.turn === 1 && isPlayer1) || (match.turn === 2 && !isPlayer1);

    if (!isPlayerTurn) {
      console.error('Não é o turno deste jogador');
      return;
    }

    // Aplica ação no match
    // ... lógica de jogo ...

    // Atualiza estado e notifica ambos jogadores
    this.broadcastMatchState(matchId);
  }

  /**
   * Envia estado do jogo para ambos jogadores
   */
  private broadcastMatchState(matchId: string): void {
    const match = this.activeMatches.get(matchId);
    if (!match) return;

    // Envia para ambos jogadores
    // ... implementar broadcast ...
  }

  private createPlayerState(userId: number): PlayerState {
    // Carrega deck do banco e cria PlayerState
    // ... implementar ...
    return {} as PlayerState;
  }
}
```

#### 3.2 Cliente WebSocket (2 days)

**Atualizar cliente** (`client/src/services/kardumClient.ts`):

```typescript
/**
 * Cliente WebSocket para PvP
 */
export class KardumClient {
  private ws: WebSocket | null = null;
  private matchId: string | null = null;
  
  // Callbacks
  onMatchFound?: (match: GameMatch) => void;
  onMatchUpdate?: (match: GameMatch) => void;
  onOpponentAction?: (action: any) => void;

  /**
   * Conecta ao servidor
   */
  connect(): void {
    this.ws = new WebSocket('ws://localhost:8080/kardum');

    this.ws.onopen = () => {
      console.log('[Kardum] Conectado ao servidor');
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onerror = (error) => {
      console.error('[Kardum] Erro:', error);
    };

    this.ws.onclose = () => {
      console.log('[Kardum] Desconectado');
      // Tentar reconectar após 3 segundos
      setTimeout(() => this.connect(), 3000);
    };
  }

  /**
   * Entra na fila de matchmaking
   */
  enterQueue(): void {
    this.send({ type: 'enter_queue' });
  }

  /**
   * Joga uma carta
   */
  playCard(cardId: string, options?: any): void {
    this.send({
      type: 'play_card',
      matchId: this.matchId,
      cardId,
      options,
    });
  }

  /**
   * Ataca
   */
  attack(attackerId: string, targetId: string): void {
    this.send({
      type: 'attack',
      matchId: this.matchId,
      attackerId,
      targetId,
    });
  }

  /**
   * Passa o turno
   */
  endTurn(): void {
    this.send({
      type: 'end_turn',
      matchId: this.matchId,
    });
  }

  private handleMessage(message: any): void {
    switch (message.type) {
      case 'queue_waiting':
        console.log('[Kardum] Esperando oponente...');
        break;

      case 'match_found':
        this.matchId = message.matchId;
        if (this.onMatchFound) {
          this.onMatchFound(message.match);
        }
        break;

      case 'match_update':
        if (this.onMatchUpdate) {
          this.onMatchUpdate(message.match);
        }
        break;

      case 'opponent_action':
        if (this.onOpponentAction) {
          this.onOpponentAction(message.action);
        }
        break;
    }
  }

  private send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
}
```

---

### Fase 4: Coleção de Cartas e Deck Builder (Semana 6)

#### 4.1 Sistema de Coleção (2 dias)

```typescript
/**
 * Sistema de Coleção de Cartas
 */
export class CardCollection {
  private userCards: Map<string, number> = new Map(); // cardId -> quantity

  /**
   * Carrega coleção do usuário
   */
  async loadCollection(userId: number): Promise<void> {
    const response = await fetch(`/api/users/${userId}/cards`);
    const cards = await response.json();

    cards.forEach((card: { cardId: string; quantity: number }) => {
      this.userCards.set(card.cardId, card.quantity);
    });
  }

  /**
   * Verifica se usuário possui a carta
   */
  hasCard(cardId: string): boolean {
    return this.userCards.has(cardId) && this.userCards.get(cardId)! > 0;
  }

  /**
   * Adiciona carta à coleção
   */
  async addCard(cardId: string, quantity: number = 1): Promise<void> {
    const current = this.userCards.get(cardId) || 0;
    this.userCards.set(cardId, current + quantity);

    // Salva no servidor
    await fetch('/api/cards/collection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId, quantity }),
    });
  }

  /**
   * Abre um pacote de cartas (gacha)
   */
  async openPack(packType: 'basic' | 'premium' | 'legendary'): Promise<Card[]> {
    const response = await fetch('/api/cards/open-pack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packType }),
    });

    const { cards } = await response.json();
    
    // Adiciona à coleção
    cards.forEach((card: Card) => {
      this.addCard(card.id);
    });

    return cards;
  }
}
```

#### 4.2 Deck Builder UI (3 dias)

```typescript
/**
 * Interface de Construção de Deck
 */
export class DeckBuilderUI {
  private collection: CardCollection;
  private currentDeck: Deck;

  constructor(collection: CardCollection) {
    this.collection = collection;
    this.currentDeck = this.createEmptyDeck();
  }

  /**
   * Renderiza deck builder
   */
  render(): void {
    // Grid de cartas da coleção (esquerda)
    this.renderCollection();

    // Deck atual (direita)
    this.renderDeck();

    // Informações do deck
    this.renderDeckInfo();
  }

  /**
   * Adiciona carta ao deck
   */
  addCard(cardId: string): boolean {
    // Validações
    if (this.currentDeck.cards.length >= 40) {
      console.error('Deck cheio (máx 40 cartas)');
      return false;
    }

    if (!this.collection.hasCard(cardId)) {
      console.error('Você não possui esta carta');
      return false;
    }

    const card = getCardById(cardId);
    
    // Adiciona
    this.currentDeck.cards.push(card);
    return true;
  }

  /**
   * Remove carta do deck
   */
  removeCard(cardId: string): void {
    const index = this.currentDeck.cards.findIndex(c => c.id === cardId);
    if (index !== -1) {
      this.currentDeck.cards.splice(index, 1);
    }
  }

  /**
   * Salva deck
   */
  async saveDeck(): Promise<void> {
    const validation = validateDeck(this.currentDeck);
    
    if (!validation.valid) {
      alert('Deck inválido:\\n' + validation.errors.join('\\n'));
      return;
    }

    await fetch('/api/decks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.currentDeck),
    });

    alert('Deck salvo com sucesso!');
  }

  private createEmptyDeck(): Deck {
    return {
      id: '',
      name: 'Novo Deck',
      userId: 0,
      general: null as any,
      cards: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
```

---

### Fase 5: Modo PvE e AI (Semana 7)

#### 5.1 AI Inimiga (3 dias)

**Adaptar AI do Guardian Grove** (`client/src/systems/kardum-ai.ts`):

```typescript
/**
 * AI para modo PvE
 */
export class KardumAI {
  private difficulty: 'easy' | 'medium' | 'hard';

  constructor(difficulty: 'easy' | 'medium' | 'hard' = 'medium') {
    this.difficulty = difficulty;
  }

  /**
   * Decide próxima ação da AI
   */
  decideAction(match: GameMatch): AIAction {
    const aiPlayer = match.player2!;
    const humanPlayer = match.player1;

    // Estratégia baseada em dificuldade
    if (this.difficulty === 'easy') {
      return this.easyStrategy(aiPlayer, humanPlayer);
    } else if (this.difficulty === 'medium') {
      return this.mediumStrategy(aiPlayer, humanPlayer);
    } else {
      return this.hardStrategy(aiPlayer, humanPlayer);
    }
  }

  /**
   * Estratégia fácil - joga aleatoriamente
   */
  private easyStrategy(ai: PlayerState, human: PlayerState): AIAction {
    // Joga carta aleatória se tiver recursos
    const playableCards = ai.hand.filter(c => c.warResourceCost <= ai.warResources);
    
    if (playableCards.length > 0 && Math.random() > 0.5) {
      const card = playableCards[Math.floor(Math.random() * playableCards.length)];
      return { type: 'play_card', cardId: card.id };
    }

    // Ataca aleatoriamente
    if (ai.field.length > 0 && Math.random() > 0.3) {
      const attacker = ai.field[Math.floor(Math.random() * ai.field.length)];
      const target = human.field.length > 0 
        ? human.field[0] 
        : human.general;
      
      return { type: 'attack', attackerId: attacker.id, targetId: target.id };
    }

    // Passa turno
    return { type: 'end_turn' };
  }

  /**
   * Estratégia média - lógica básica
   */
  private mediumStrategy(ai: PlayerState, human: PlayerState): AIAction {
    // Prioridade: jogar defenders primeiro
    const defenders = ai.hand.filter(c => c.type === 'defender' && c.warResourceCost <= ai.warResources);
    
    if (defenders.length > 0) {
      const card = defenders[0];
      return { type: 'play_card', cardId: card.id };
    }

    // Ataca com todos defenders disponíveis
    const availableAttackers = ai.field.filter(d => d.state !== 'positioning');
    
    if (availableAttackers.length > 0) {
      const attacker = availableAttackers[0];
      
      // Se humano tem defenders, ataca eles primeiro
      const target = human.field.length > 0 
        ? human.field[0] 
        : human.general;
      
      return { type: 'attack', attackerId: attacker.id, targetId: target.id };
    }

    // Joga carta de suporte
    const supportCards = ai.hand.filter(c => 
      (c.type === 'consumable' || c.type === 'equipment') && 
      c.warResourceCost <= ai.warResources
    );
    
    if (supportCards.length > 0) {
      return { type: 'play_card', cardId: supportCards[0].id };
    }

    return { type: 'end_turn' };
  }

  /**
   * Estratégia difícil - otimizada
   */
  private hardStrategy(ai: PlayerState, human: PlayerState): AIAction {
    // Análise de tabuleiro
    const aiPower = this.calculateBoardPower(ai);
    const humanPower = this.calculateBoardPower(human);

    // Se humano está mais forte, joga defensivo
    if (humanPower > aiPower * 1.5) {
      return this.defensivePlay(ai, human);
    }

    // Se AI está dominando, joga agressivo
    if (aiPower > humanPower * 1.3) {
      return this.aggressivePlay(ai, human);
    }

    // Joga balanceado
    return this.balancedPlay(ai, human);
  }

  private calculateBoardPower(player: PlayerState): number {
    let power = player.general.health + player.general.attack;
    
    player.field.forEach(defender => {
      power += defender.attack + defender.health;
    });

    return power;
  }

  private defensivePlay(ai: PlayerState, human: PlayerState): AIAction {
    // Joga defenders com alta vida
    const tankDefenders = ai.hand.filter(c => 
      c.type === 'defender' && 
      'health' in c && 
      c.health! > 5 && 
      c.warResourceCost <= ai.warResources
    );

    if (tankDefenders.length > 0) {
      return { type: 'play_card', cardId: tankDefenders[0].id };
    }

    return { type: 'end_turn' };
  }

  private aggressivePlay(ai: PlayerState, human: PlayerState): AIAction {
    // Ataca General diretamente se possível
    const canAttackGeneral = human.field.every(d => !d.taunt);

    if (canAttackGeneral && ai.field.length > 0) {
      const attacker = ai.field[0];
      return { type: 'attack', attackerId: attacker.id, targetId: 'general' };
    }

    // Ataca defenders fracos
    const weakDefender = human.field.find(d => d.health <= 2);
    if (weakDefender && ai.field.length > 0) {
      return { type: 'attack', attackerId: ai.field[0].id, targetId: weakDefender.id };
    }

    return { type: 'end_turn' };
  }

  private balancedPlay(ai: PlayerState, human: PlayerState): AIAction {
    // Mix de estratégias
    return this.mediumStrategy(ai, human);
  }
}

interface AIAction {
  type: 'play_card' | 'attack' | 'end_turn';
  cardId?: string;
  attackerId?: string;
  targetId?: string;
}
```

---

### Fase 6: Conteúdo e Balanceamento (Semana 8+)

#### 6.1 Criar Cartas Iniciais (5 dias)

**Database de cartas** (`client/src/data/kardum-cards.ts`):

```typescript
import { Card, GeneralCard, DefenderCard, AbilityCard } from '../../../shared/types-kardum';

/**
 * Todas as cartas do jogo
 */
export const ALL_CARDS: Card[] = [
  // ===== GENERAIS =====
  
  // Warrior Human
  {
    id: 'general_warrior_human',
    name: 'Comandante Marcus',
    type: 'general',
    class: 'warrior',
    race: 'human',
    warResourceCost: 0, // General começa em jogo
    attack: 3,
    health: 30,
    maxHealth: 30,
    description: 'General humano especializado em combate corpo a corpo.',
    ability: 'warrior_rage', // +2 ataque para todos allies
    rarity: 'common',
  } as GeneralCard,

  // Elementalist Elf
  {
    id: 'general_elementalist_elf',
    name: 'Sylvanas Tempestade',
    type: 'general',
    class: 'elementalist',
    race: 'elf',
    warResourceCost: 0,
    attack: 2,
    health: 25,
    maxHealth: 25,
    description: 'Elfa mestre dos elementos.',
    ability: 'elemental_burst', // Dano em área 2 para todos inimigos
    rarity: 'common',
  } as GeneralCard,

  // ... mais 6 generais (1 de cada classe principal)

  // ===== DEFENDERS =====
  
  {
    id: 'defender_human_soldier',
    name: 'Soldado Humano',
    type: 'defender',
    race: 'human',
    warResourceCost: 2,
    attack: 2,
    health: 3,
    description: 'Soldado básico do exército humano.',
    rarity: 'common',
  } as DefenderCard,

  {
    id: 'defender_orc_berserker',
    name: 'Berserker Orc',
    type: 'defender',
    race: 'orc',
    warResourceCost: 4,
    attack: 5,
    health: 4,
    description: 'Guerreiro orc furioso.',
    canAttackOnEnter: true, // INVESTIDA
    rarity: 'rare',
  } as DefenderCard,

  {
    id: 'defender_dwarf_guardian',
    name: 'Guardião Anão',
    type: 'defender',
    race: 'dwarf',
    warResourceCost: 3,
    attack: 1,
    health: 7,
    description: 'Tanque resistente.',
    taunt: true, // PROVOCAR
    rarity: 'common',
  } as DefenderCard,

  // ... criar 30-40 defenders variados

  // ===== HABILIDADES =====
  
  {
    id: 'ability_warrior_charge',
    name: 'Investida Feroz',
    type: 'ability',
    class: 'warrior',
    warResourceCost: 3,
    description: 'Dá 3 de dano ao inimigo alvo.',
    targetType: 'enemy',
    effects: [
      { type: 'damage', value: 3, target: 'enemy' },
    ],
    rarity: 'common',
  } as AbilityCard,

  {
    id: 'ability_druid_heal',
    name: 'Toque Curativo',
    type: 'ability',
    class: 'druid',
    warResourceCost: 2,
    description: 'Cura 5 de vida em um aliado.',
    targetType: 'ally',
    effects: [
      { type: 'heal', value: 5, target: 'ally' },
    ],
    rarity: 'common',
  } as AbilityCard,

  // ... criar 20-30 habilidades (distribuir entre classes)

  // ===== EQUIPAMENTOS =====
  
  {
    id: 'equipment_sword',
    name: 'Espada de Ferro',
    type: 'equipment',
    warResourceCost: 2,
    attachTo: 'defender',
    attackBonus: 2,
    description: '+2 de ataque para um Defender.',
    rarity: 'common',
  } as EquipmentCard,

  // ... criar 15-20 equipamentos

  // ===== MONTARIAS =====
  
  {
    id: 'mount_warhorse',
    name: 'Cavalo de Guerra',
    type: 'mount',
    warResourceCost: 4,
    attack: 3,
    health: 4,
    attackBonus: 1,
    description: 'Pode ser jogado como Defender 3/4 OU equipado para dar +1 ataque.',
    rarity: 'rare',
  } as MountCard,

  // ... criar 10-15 montarias

  // ===== CONSUMÍVEIS =====
  
  {
    id: 'consumable_fireball',
    name: 'Bola de Fogo',
    type: 'consumable',
    warResourceCost: 4,
    targetType: 'enemy',
    description: 'Causa 5 de dano a um inimigo.',
    effects: [
      { type: 'damage', value: 5, target: 'enemy' },
    ],
    rarity: 'common',
  } as ConsumableCard,

  // ... criar 20-25 consumíveis
];

/**
 * Decks iniciais gratuitos
 */
export const STARTER_DECKS: Deck[] = [
  {
    id: 'starter_warrior',
    name: 'Deck Iniciante - Warrior',
    userId: 0,
    general: ALL_CARDS.find(c => c.id === 'general_warrior_human') as GeneralCard,
    cards: [
      // 30 cartas balanceadas para iniciantes
      // 15x defenders comuns
      // 10x habilidades warrior
      // 3x equipamentos
      // 2x consumíveis
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // ... mais 7 decks (1 por classe)
];
```

---

## 🎨 Adaptações Visuais

### Aproveitar Assets do Guardian Grove

1. **Sprites de Criaturas** → **Ilustrações de Cartas**
   - Bestas podem virar Defenders de raças diferentes
   - Usar sistema de cores para diferenciar raças

2. **UI de Batalha** → **Campo de Cartas**
   - Adaptar layout para horizontal (tipo Hearthstone)
   - Regiões: Mão, Campo Aliado, Campo Inimigo, General

3. **Sistema 3D** (Opcional para Fase 2)
   - Usar Three.js existente para animações de cartas
   - Efeitos visuais em 3D quando joga cartas

---

## 📊 Cronograma Resumido

| Fase | Duração | Entregável |
|------|---------|------------|
| 1. Fundação | 2 semanas | Tipos, Banco, Sistema de Cartas |
| 2. Combate PvP | 2 semanas | Game Loop, UI, Matchmaking |
| 3. Multiplayer | 1 semana | WebSocket, PvP em tempo real |
| 4. Coleção/Deck | 1 semana | Coleção, Deck Builder |
| 5. PvE e AI | 1 semana | Modo singleplayer, AI inimiga |
| 6. Conteúdo | 2+ semanas | 100+ cartas, balanceamento |

**TOTAL: ~10 semanas para MVP funcional**

---

## 🔄 O que Muda vs. Guardian Grove

### REMOVE:
- ❌ Sistema de criação de bestas (Relíquias de Eco)
- ❌ Sistema de calendário semanal
- ❌ Sistema de trabalho/treino/descanso
- ❌ Dungeons e exploração
- ❌ Sistema de crafting
- ❌ NPCs e quests

### MANTÉM:
- ✅ Sistema de combate (base para card game)
- ✅ Inventário (agora é coleção de cartas)
- ✅ Sistema de amigos
- ✅ Chat global
- ✅ Autenticação e saves
- ✅ Ranking/Leaderboards
- ✅ WebSocket para tempo real

### ADICIONA:
- ➕ Sistema de cartas e decks
- ➕ Recursos de Guerra (mana system)
- ➕ Fases de jogo (Draw, Strategy, Combat)
- ➕ Matchmaking PvP
- ➕ Sistema de coleção (gacha)
- ➕ Deck Builder
- ➕ Tipos de cartas (Defender, Equipment, etc)

---

## 🚀 Próximos Passos Imediatos

### Recomendação: Começar com Protótipo Mínimo

**Semana 1 - Protótipo Offline:**
1. Criar tipos TypeScript compartilhados
2. Implementar game loop básico (1 jogador vs AI simples)
3. UI minimalista no canvas
4. 10 cartas de teste (5 defenders, 5 habilidades)

**Semana 2 - Testar Mecânicas:**
1. Jogar e testar balance
2. Ajustar regras conforme necessário
3. Validar se o jogo é divertido

**Semana 3+ - Expansão:**
1. Adicionar PvP
2. Criar mais cartas
3. Melhorar UI
4. Sistema de coleção

---

## 💡 Dicas Importantes

1. **Não tente fazer tudo de uma vez**
   - Comece com modo offline vs AI
   - PvP vem depois que o jogo estiver divertido

2. **Balance é crítico**
   - Playtest MUITO antes de criar 100 cartas
   - Ajuste custos, ataques, vidas constantemente

3. **UI é crucial para card games**
   - Jogadores precisam ler cartas rapidamente
   - Animações e feedback visual fazem MUITA diferença

4. **Reaproveitamento é chave**
   - Sistema de combate do Guardian Grove é 70% do que você precisa
   - WebSocket já funciona, só adaptar mensagens

5. **MVP primeiro, polimento depois**
   - Foco em gameplay funcional
   - Arte e efeitos vêm na Fase 2

---

## 🎯 Objetivo Final

**KARDUM - Online Card Battle Game**
- 🎴 100+ cartas únicas
- 👥 PvP em tempo real (matchmaking)
- 🤖 PvE com AI progressiva
- 🏆 Ranking global
- 💬 Chat social
- 📦 Sistema de packs e coleção
- 🎨 Arte low-poly estilizada
- 📱 PWA (joga no browser e mobile)

---

**Pronto para começar? Qual fase você quer que eu implemente primeiro?** 🚀

