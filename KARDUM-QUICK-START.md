# 🚀 KARDUM - Quick Start Guide

## ⚡ Comece AGORA em 30 minutos!

Este guia te ajuda a criar um **protótipo funcional offline** de KARDUM em menos de 1 hora.

---

## 📝 Passo 1: Preparação (5 min)

### 1.1 Crie uma branch nova

```bash
cd vanilla-game
git checkout -b feature/kardum-card-game
```

### 1.2 Crie a estrutura de pastas

```bash
# Tipos compartilhados
mkdir -p shared/kardum

# Cliente
mkdir -p client/src/kardum/systems
mkdir -p client/src/kardum/ui
mkdir -p client/src/kardum/data

# Servidor (para depois)
mkdir -p server/src/kardum
```

---

## 🎴 Passo 2: Tipos Base (10 min)

### Criar `shared/kardum/types.ts`

```typescript
/**
 * Tipos KARDUM - Card Game
 */

// Raças
export type Race = 'human' | 'deva' | 'orc' | 'dwarf' | 'elf';

// Classes
export type ClassType = 'warrior' | 'mage' | 'rogue';

// Tipos de Carta
export type CardType = 'general' | 'defender' | 'ability';

// Carta Base
export interface Card {
  id: string;
  name: string;
  type: CardType;
  cost: number;          // Recursos de Guerra (0-10)
  attack?: number;       // Para defenders/general
  health?: number;       // Para defenders/general
  description: string;
  rarity: 'common' | 'rare' | 'epic';
}

// General (herói)
export interface GeneralCard extends Card {
  type: 'general';
  class: ClassType;
  race: Race;
  attack: number;
  health: number;
  maxHealth: number;
}

// Defender (soldado)
export interface DefenderCard extends Card {
  type: 'defender';
  race: Race;
  attack: number;
  health: number;
  canAttackOnEnter?: boolean; // Investida
  taunt?: boolean;             // Provocar
}

// Ability (habilidade)
export interface AbilityCard extends Card {
  type: 'ability';
  class: ClassType;
  damage?: number;
  heal?: number;
  target: 'enemy' | 'ally' | 'self';
}

// Estado do Jogador
export interface PlayerState {
  name: string;
  general: GeneralCard;
  deck: Card[];
  hand: Card[];
  field: DefenderCard[];
  graveyard: Card[];
  resources: number;         // Atual (gasta)
  maxResources: number;      // Máximo (aumenta 1 por turno)
}

// Partida
export interface GameMatch {
  player: PlayerState;
  opponent: PlayerState;
  turn: 'player' | 'opponent';
  phase: 'draw' | 'strategy' | 'combat';
  turnNumber: number;
}
```

---

## 🎨 Passo 3: Cartas de Teste (10 min)

### Criar `client/src/kardum/data/cards.ts`

```typescript
import { Card, GeneralCard, DefenderCard, AbilityCard } from '../../../../shared/kardum/types';

/**
 * 20 Cartas de Teste para MVP
 */

// ===== GENERAIS =====

export const GENERAL_WARRIOR: GeneralCard = {
  id: 'gen_warrior',
  name: 'Comandante Marcus',
  type: 'general',
  class: 'warrior',
  race: 'human',
  cost: 0,
  attack: 3,
  health: 30,
  maxHealth: 30,
  description: 'General humano guerreiro.',
  rarity: 'common',
};

export const GENERAL_MAGE: GeneralCard = {
  id: 'gen_mage',
  name: 'Sylvanas Arcana',
  type: 'general',
  class: 'mage',
  race: 'elf',
  cost: 0,
  attack: 2,
  health: 25,
  maxHealth: 25,
  description: 'General elfo mago.',
  rarity: 'common',
};

// ===== DEFENDERS =====

export const DEFENDER_SOLDIER: DefenderCard = {
  id: 'def_soldier',
  name: 'Soldado Humano',
  type: 'defender',
  race: 'human',
  cost: 2,
  attack: 2,
  health: 3,
  description: 'Soldado básico.',
  rarity: 'common',
};

export const DEFENDER_BERSERKER: DefenderCard = {
  id: 'def_berserker',
  name: 'Berserker Orc',
  type: 'defender',
  race: 'orc',
  cost: 4,
  attack: 5,
  health: 4,
  description: 'Ataca no turno que entra!',
  canAttackOnEnter: true,
  rarity: 'rare',
};

export const DEFENDER_TANK: DefenderCard = {
  id: 'def_tank',
  name: 'Guardião Anão',
  type: 'defender',
  race: 'dwarf',
  cost: 3,
  attack: 1,
  health: 7,
  description: 'Inimigos devem atacar ele primeiro.',
  taunt: true,
  rarity: 'common',
};

export const DEFENDER_ARCHER: DefenderCard = {
  id: 'def_archer',
  name: 'Arqueiro Elfo',
  type: 'defender',
  race: 'elf',
  cost: 3,
  attack: 3,
  health: 2,
  description: 'Alto ataque, baixa vida.',
  rarity: 'common',
};

export const DEFENDER_PRIEST: DefenderCard = {
  id: 'def_priest',
  name: 'Sacerdote Deva',
  type: 'defender',
  race: 'deva',
  cost: 3,
  attack: 1,
  health: 5,
  description: 'Suporte divino.',
  rarity: 'common',
};

// ===== ABILITIES =====

export const ABILITY_FIREBALL: AbilityCard = {
  id: 'abi_fireball',
  name: 'Bola de Fogo',
  type: 'ability',
  class: 'mage',
  cost: 4,
  damage: 5,
  target: 'enemy',
  description: 'Causa 5 de dano a um inimigo.',
  rarity: 'common',
};

export const ABILITY_HEAL: AbilityCard = {
  id: 'abi_heal',
  name: 'Cura',
  type: 'ability',
  class: 'mage',
  cost: 3,
  heal: 5,
  target: 'ally',
  description: 'Cura 5 de vida em um aliado.',
  rarity: 'common',
};

export const ABILITY_CHARGE: AbilityCard = {
  id: 'abi_charge',
  name: 'Investida',
  type: 'ability',
  class: 'warrior',
  cost: 3,
  damage: 3,
  target: 'enemy',
  description: 'Causa 3 de dano.',
  rarity: 'common',
};

// ===== DECK INICIAL =====

export const STARTER_DECK: Card[] = [
  // 10x Soldados
  ...Array(10).fill(null).map(() => ({ ...DEFENDER_SOLDIER })),
  
  // 3x Arqueiros
  ...Array(3).fill(null).map(() => ({ ...DEFENDER_ARCHER })),
  
  // 2x Tanks
  ...Array(2).fill(null).map(() => ({ ...DEFENDER_TANK })),
  
  // 5x Fireballs
  ...Array(5).fill(null).map(() => ({ ...ABILITY_FIREBALL })),
  
  // 5x Heal
  ...Array(5).fill(null).map(() => ({ ...ABILITY_HEAL })),
  
  // 3x Charge
  ...Array(3).fill(null).map(() => ({ ...ABILITY_CHARGE })),
  
  // 2x Berserkers
  ...Array(2).fill(null).map(() => ({ ...DEFENDER_BERSERKER })),
];

// Total: 30 cartas

export const ALL_CARDS = [
  GENERAL_WARRIOR,
  GENERAL_MAGE,
  DEFENDER_SOLDIER,
  DEFENDER_BERSERKER,
  DEFENDER_TANK,
  DEFENDER_ARCHER,
  DEFENDER_PRIEST,
  ABILITY_FIREBALL,
  ABILITY_HEAL,
  ABILITY_CHARGE,
];
```

---

## 🎮 Passo 4: Game Engine (15 min)

### Criar `client/src/kardum/systems/game-engine.ts`

```typescript
import {
  GameMatch,
  PlayerState,
  Card,
  DefenderCard,
  AbilityCard,
  GeneralCard,
} from '../../../../shared/kardum/types';

/**
 * Engine do Jogo KARDUM
 */
export class KardumEngine {
  public match: GameMatch;

  constructor(playerGeneral: GeneralCard, opponentGeneral: GeneralCard, deck: Card[]) {
    this.match = {
      player: this.createPlayerState('Player', playerGeneral, deck),
      opponent: this.createPlayerState('AI', opponentGeneral, this.shuffleDeck([...deck])),
      turn: 'player',
      phase: 'draw',
      turnNumber: 1,
    };
  }

  /**
   * Inicia o jogo
   */
  start(): void {
    // Comprar 5 cartas iniciais
    this.drawCards(this.match.player, 5);
    this.drawCards(this.match.opponent, 5);
    
    // Player 1 não compra no primeiro turno
    this.match.phase = 'strategy';
  }

  /**
   * Fase de compra
   */
  drawPhase(): void {
    const current = this.getCurrentPlayer();
    
    // +1 recurso máximo (até 10)
    if (current.maxResources < 10) {
      current.maxResources += 1;
    }
    
    // Recarrega recursos
    current.resources = current.maxResources;
    
    // Compra 1 carta
    this.drawCards(current, 1);
    
    this.match.phase = 'strategy';
  }

  /**
   * Joga uma carta
   */
  playCard(cardId: string, targetId?: string): boolean {
    const current = this.getCurrentPlayer();
    const cardIndex = current.hand.findIndex(c => c.id === cardId);
    
    if (cardIndex === -1) {
      console.error('Carta não está na mão');
      return false;
    }

    const card = current.hand[cardIndex];

    // Verifica recursos
    if (card.cost > current.resources) {
      console.error('Recursos insuficientes');
      return false;
    }

    // Remove da mão e gasta recursos
    current.hand.splice(cardIndex, 1);
    current.resources -= card.cost;

    // Executa baseado no tipo
    switch (card.type) {
      case 'defender':
        const defender = { ...card } as DefenderCard;
        current.field.push(defender);
        break;

      case 'ability':
        const ability = card as AbilityCard;
        this.executeAbility(ability, targetId);
        current.graveyard.push(card);
        break;
    }

    return true;
  }

  /**
   * Ataca
   */
  attack(attackerId: string, targetId: string): boolean {
    const current = this.getCurrentPlayer();
    const opponent = this.getOpponent();

    const attacker = current.field.find(d => d.id === attackerId);
    if (!attacker) return false;

    // Encontra alvo
    let target: DefenderCard | GeneralCard | undefined;

    if (targetId === 'general') {
      // Verifica Taunt
      const hasTaunt = opponent.field.some(d => d.taunt);
      if (hasTaunt) {
        console.error('Existe defender com Taunt, ataque ele primeiro');
        return false;
      }
      target = opponent.general;
    } else {
      target = opponent.field.find(d => d.id === targetId);
    }

    if (!target) return false;

    // Executa ataque
    target.health -= attacker.attack;
    
    // Contra-ataque (se for defender)
    if (target.type === 'defender') {
      attacker.health -= target.attack;
    }

    // Remove mortos
    if (target.type === 'defender' && target.health <= 0) {
      const index = opponent.field.findIndex(d => d.id === target.id);
      opponent.graveyard.push(opponent.field[index]);
      opponent.field.splice(index, 1);
    }

    if (attacker.health <= 0) {
      const index = current.field.findIndex(d => d.id === attacker.id);
      current.graveyard.push(current.field[index]);
      current.field.splice(index, 1);
    }

    return true;
  }

  /**
   * Passa o turno
   */
  endTurn(): void {
    this.match.turn = this.match.turn === 'player' ? 'opponent' : 'player';
    this.match.turnNumber += 1;
    this.match.phase = 'draw';
    this.drawPhase();
  }

  /**
   * Verifica vitória
   */
  checkWinner(): 'player' | 'opponent' | null {
    if (this.match.opponent.general.health <= 0) return 'player';
    if (this.match.player.general.health <= 0) return 'opponent';
    return null;
  }

  // ===== HELPERS =====

  private createPlayerState(name: string, general: GeneralCard, deck: Card[]): PlayerState {
    return {
      name,
      general: { ...general },
      deck: this.shuffleDeck(deck),
      hand: [],
      field: [],
      graveyard: [],
      resources: 1,
      maxResources: 1,
    };
  }

  private drawCards(player: PlayerState, count: number): void {
    for (let i = 0; i < count && player.deck.length > 0; i++) {
      const card = player.deck.pop()!;
      
      if (player.hand.length < 10) {
        player.hand.push(card);
      } else {
        player.graveyard.push(card);
      }
    }

    // Deck vazio = 2 dano no General
    if (player.deck.length === 0) {
      player.general.health -= 2;
    }
  }

  private executeAbility(ability: AbilityCard, targetId?: string): void {
    const opponent = this.getOpponent();

    if (ability.damage) {
      if (targetId === 'general') {
        opponent.general.health -= ability.damage;
      } else {
        const target = opponent.field.find(d => d.id === targetId);
        if (target) {
          target.health -= ability.damage;
          if (target.health <= 0) {
            const index = opponent.field.findIndex(d => d.id === target.id);
            opponent.graveyard.push(opponent.field[index]);
            opponent.field.splice(index, 1);
          }
        }
      }
    }

    if (ability.heal) {
      const current = this.getCurrentPlayer();
      if (targetId === 'general') {
        current.general.health = Math.min(
          current.general.health + ability.heal,
          current.general.maxHealth
        );
      }
    }
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
}
```

---

## 🖼️ Passo 5: UI Simples (20 min)

### Criar `client/src/kardum/ui/game-ui.ts`

```typescript
import { GameMatch, Card, DefenderCard } from '../../../../shared/kardum/types';

/**
 * UI Minimalista para KARDUM
 */
export class KardumGameUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private match: GameMatch;

  // Callbacks
  onPlayCard?: (cardId: string) => void;
  onAttack?: (attackerId: string, targetId: string) => void;
  onEndTurn?: () => void;

  constructor(canvas: HTMLCanvasElement, match: GameMatch) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.match = match;

    this.setupEvents();
  }

  /**
   * Renderiza o jogo
   */
  render(): void {
    this.clear();
    this.drawBackground();

    // Oponente (topo)
    this.drawPlayerArea(this.match.opponent, 50, true);

    // Jogador (base)
    this.drawPlayerArea(this.match.player, 500, false);

    // HUD
    this.drawHUD();
  }

  /**
   * Desenha área de um jogador
   */
  private drawPlayerArea(player: any, y: number, isOpponent: boolean): void {
    const ctx = this.ctx;

    // General
    ctx.fillStyle = isOpponent ? '#e74c3c' : '#3498db';
    ctx.fillRect(50, y, 80, 100);
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(player.general.name, 90, y + 20);
    ctx.fillText(`${player.general.attack}/${player.general.health}`, 90, y + 80);

    // Campo (defenders)
    player.field.forEach((defender: DefenderCard, i: number) => {
      const x = 200 + i * 90;
      ctx.fillStyle = '#95a5a6';
      ctx.fillRect(x, y + 20, 70, 90);
      ctx.fillStyle = '#fff';
      ctx.fillText(defender.name.substring(0, 8), x + 35, y + 40);
      ctx.fillText(`${defender.attack}/${defender.health}`, x + 35, y + 90);
    });

    // Mão (só do jogador)
    if (!isOpponent) {
      player.hand.forEach((card: Card, i: number) => {
        const x = 100 + i * 80;
        const cardY = 650;
        
        // Carta
        ctx.fillStyle = card.type === 'defender' ? '#3498db' : '#9b59b6';
        ctx.fillRect(x, cardY, 70, 100);
        
        // Nome
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.fillText(card.name.substring(0, 10), x + 35, cardY + 20);
        
        // Custo
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.arc(x + 15, cardY + 15, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(card.cost.toString(), x + 15, cardY + 20);

        // Stats (se for defender)
        if (card.type === 'defender' && 'attack' in card) {
          ctx.fillStyle = '#fff';
          ctx.font = '12px Arial';
          ctx.fillText(`${card.attack}/${card.health}`, x + 35, cardY + 80);
        }
      });
    }
  }

  /**
   * Desenha HUD
   */
  private drawHUD(): void {
    const ctx = this.ctx;
    const player = this.match.player;

    // Recursos
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(20, 20, 150, 40);
    ctx.fillStyle = '#f39c12';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`⚡ ${player.resources}/${player.maxResources}`, 30, 45);

    // Turno
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(600, 20, 180, 40);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`Turn: ${this.match.turnNumber}`, 610, 45);

    // Botão End Turn
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(1100, 400, 120, 50);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('END TURN', 1160, 430);
  }

  private clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawBackground(): void {
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private setupEvents(): void {
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Verifica clique no botão End Turn
      if (x >= 1100 && x <= 1220 && y >= 400 && y <= 450) {
        if (this.onEndTurn) this.onEndTurn();
      }

      // Verifica clique nas cartas da mão
      this.match.player.hand.forEach((card, i) => {
        const cardX = 100 + i * 80;
        const cardY = 650;

        if (x >= cardX && x <= cardX + 70 && y >= cardY && y <= cardY + 100) {
          if (this.onPlayCard) this.onPlayCard(card.id);
        }
      });
    });
  }
}
```

---

## 🎯 Passo 6: Integração (10 min)

### Criar `client/src/kardum/index.ts`

```typescript
import { KardumEngine } from './systems/game-engine';
import { KardumGameUI } from './ui/game-ui';
import { GENERAL_WARRIOR, GENERAL_MAGE, STARTER_DECK } from './data/cards';

/**
 * Entry Point do KARDUM
 */
export function startKardumGame(canvas: HTMLCanvasElement): void {
  console.log('[KARDUM] Starting game...');

  // Cria partida
  const engine = new KardumEngine(
    GENERAL_WARRIOR,
    GENERAL_MAGE,
    STARTER_DECK
  );

  engine.start();

  // Cria UI
  const ui = new KardumGameUI(canvas, engine.match);

  // Setup callbacks
  ui.onPlayCard = (cardId: string) => {
    if (engine.match.turn === 'player') {
      const success = engine.playCard(cardId);
      if (success) {
        ui.render();
      }
    }
  };

  ui.onEndTurn = () => {
    if (engine.match.turn === 'player') {
      engine.endTurn();
      
      // Turno da AI (simples)
      setTimeout(() => {
        playAITurn(engine);
        ui.render();
        
        // Volta para o jogador
        engine.endTurn();
        ui.render();
      }, 1000);
    }
  };

  // Renderiza inicial
  ui.render();

  // Game loop
  setInterval(() => {
    ui.render();
    
    // Verifica vitória
    const winner = engine.checkWinner();
    if (winner) {
      alert(`${winner === 'player' ? 'Você venceu!' : 'Você perdeu!'}`);
    }
  }, 100);
}

/**
 * AI simples - joga aleatoriamente
 */
function playAITurn(engine: KardumEngine): void {
  const ai = engine.match.opponent;

  // Joga uma carta aleatória se tiver recursos
  const playableCards = ai.hand.filter(c => c.cost <= ai.resources);
  
  if (playableCards.length > 0 && Math.random() > 0.3) {
    const card = playableCards[Math.floor(Math.random() * playableCards.length)];
    
    // Se for defender, joga
    if (card.type === 'defender') {
      engine.playCard(card.id);
    }
    
    // Se for ability, joga no general do jogador
    if (card.type === 'ability') {
      engine.playCard(card.id, 'general');
    }
  }

  // Ataca com todos defenders
  ai.field.forEach(defender => {
    // Ataca um alvo aleatório
    const playerField = engine.match.player.field;
    const target = playerField.length > 0 
      ? playerField[0].id 
      : 'general';
    
    engine.attack(defender.id, target);
  });
}
```

---

## 🔌 Passo 7: Ativar no Main (5 min)

### Modificar `client/src/main.ts`

```typescript
// No topo do arquivo, adicione:
import { startKardumGame } from './kardum/index';

// Dentro da função main(), SUBSTITUA tudo por:

async function main() {
  console.log('[Main] Starting Kardum...');

  const canvas = document.getElementById('game') as HTMLCanvasElement;
  if (!canvas) {
    throw new Error('Canvas not found');
  }

  canvas.width = 1280;
  canvas.height = 800;

  // Inicia KARDUM
  startKardumGame(canvas);
}

main();
```

---

## ▶️ Testar!

```bash
cd client
npm run dev
```

Abra o navegador em `http://localhost:5173`

**Você deve ver**:
- Campo do oponente (topo)
- Campo seu (base)
- Cartas na sua mão
- Botão "END TURN"

**Como jogar**:
1. Clique em uma carta na mão para jogá-la
2. Clique em "END TURN" para passar o turno
3. AI joga automaticamente
4. Repita até alguém vencer

---

## ✅ Checklist de Validação

- [ ] Cartas aparecem na mão?
- [ ] Consegue jogar cartas?
- [ ] Recursos diminuem ao jogar?
- [ ] Defenders aparecem no campo?
- [ ] Botão End Turn funciona?
- [ ] AI joga cartas?
- [ ] Batalha acontece?
- [ ] Vida do General diminui?
- [ ] Jogo termina quando General morre?

---

## 🎉 Próximos Passos

Se tudo funcionou, **parabéns! Você tem um protótipo jogável!**

### Melhorias Imediatas (escolha 1-2):

1. **Melhorar AI**
   - Fazer ela jogar mais estrategicamente
   - Atacar alvos fracos primeiro

2. **Adicionar Animações**
   - Cartas voando da mão para o campo
   - Efeito de dano (flash vermelho)
   - Partículas quando carta é jogada

3. **UI Melhor**
   - Drag & drop para jogar cartas
   - Mostrar descrição da carta ao passar mouse
   - Botões de ataque visíveis

4. **Mais Cartas**
   - Criar 20 novas cartas
   - Testar balance

5. **Sistema de Alvo**
   - Permitir escolher onde atacar
   - Mostrar alvos válidos

---

## 🐛 Troubleshooting

### "Cannot find module 'kardum/types'"
```bash
# Verifique se criou a pasta shared/kardum/
ls -la shared/kardum/
```

### "Canvas is null"
```bash
# Verifique se o HTML tem <canvas id="game">
grep "canvas" client/index.html
```

### "Cards não aparecem"
```bash
# Abra DevTools Console (F12)
# Procure por erros vermelhos
# Console.log para debug:
console.log('Hand:', engine.match.player.hand);
```

---

## 📚 Recursos

- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Game Programming Patterns](https://gameprogrammingpatterns.com/)

---

**Boa sorte! Em 30 minutos você terá seu card game funcionando! 🎴**

Se der qualquer erro, abra uma issue ou me chame! 😊

