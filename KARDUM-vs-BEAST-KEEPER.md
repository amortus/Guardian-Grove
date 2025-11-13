# 🔄 KARDUM vs Guardian Grove - Comparação Detalhada

## 📊 Visão Geral

### Guardian Grove (Atual)
**Gênero:** Simulador de criação + RPG tático  
**Gameplay:** Criar criaturas → Treinar → Batalhar em torneios  
**Loop Principal:** Semana → Treino/Trabalho → Torneio → Repeat

### KARDUM (Alvo)
**Gênero:** Card Game Online (tipo Hearthstone/Magic)  
**Gameplay:** Construir deck → Batalhar PvP/PvE → Coletar cartas  
**Loop Principal:** Matchmaking → Batalha → Recompensas → Deck Building

---

## 🎮 Comparação de Sistemas

### 1. COMBATE

#### Guardian Grove ✅
```
Sistema por Turnos:
- Jogador escolhe técnica (40 técnicas disponíveis)
- Barra de Essência (energia para técnicas)
- Ataque / Defender / Técnica Especial
- AI inimiga com personalidades (aggressive, defensive, etc)
- Sistema de dano baseado em atributos
```

**Reaproveitamento**: ⭐⭐⭐⭐⭐ (95%)
- Sistema de turnos → Turnos de KARDUM
- Barra de Essência → Recursos de Guerra
- Técnicas → Cartas de Habilidade
- AI → AI para modo PvE

#### KARDUM 🎯
```
Sistema de Fases:
- Fase Compra: +1 Recurso, compra 1 carta
- Fase Estratégia: Joga cartas (limite de recursos)
- Fase Combate: Atacar com Defenders
- Passar Turno
```

**Mudança Necessária**: Adicionar sistema de "jogar cartas" antes de atacar

---

### 2. PROGRESSÃO

#### Guardian Grove ✅
```
Progressão Temporal:
- Calendário semanal
- Besta envelhece (3 anos de vida)
- Treinar aumenta atributos
- Trabalhar gera moedas
- Torneios para ranking
```

**Reaproveitamento**: ⭐⭐ (30%)
- Moedas → Comprar packs de cartas
- Torneios → Ranking PvP
- Sistema de progressão → Desbloquear cartas

#### KARDUM 🎯
```
Progressão por Coleção:
- Ganhar cartas (packs, recompensas)
- Construir decks estratégicos
- Ranking PvP (Bronze → Prata → Ouro → Mítico)
- Desafios diários
- Season Pass (futuro)
```

**Mudança Necessária**: 
- Remover sistema de calendário/semanas
- Adicionar sistema de coleção de cartas
- Sistema de gacha/packs

---

### 3. RECURSOS

#### Guardian Grove ✅
```
Recursos:
- Coronas (moeda)
- Itens (comida, medicina, cristais)
- Inventário com quantidades
```

**Reaproveitamento**: ⭐⭐⭐⭐ (80%)
- Sistema de inventário → Coleção de cartas
- Moedas → Comprar packs
- Banco de dados já suporta items + quantities

#### KARDUM 🎯
```
Recursos:
- Gold (comprar packs, decks)
- Cristais (moeda premium - futuro)
- Cartas (coleção)
- Recursos de Guerra (in-game, por partida)
```

**Mudança Necessária**:
- Items viram Cards
- Adicionar sistema de "gacha" (abrir packs)

---

### 4. MULTIPLAYER

#### Guardian Grove ✅
```
Social:
- Sistema de amigos
- Chat global + whisper
- Leaderboards
- WebSocket funcional
```

**Reaproveitamento**: ⭐⭐⭐⭐⭐ (100%)
- Tudo pode ser reaproveitado!
- Adicionar apenas matchmaking

#### KARDUM 🎯
```
Multiplayer:
- Matchmaking PvP em tempo real
- Amigos + desafiar amigo
- Chat global
- Replay de partidas (futuro)
- Torneios oficiais (futuro)
```

**Mudança Necessária**:
- Adicionar fila de matchmaking
- Sistema de "desafiar amigo"
- WebSocket já existe, só adaptar mensagens

---

### 5. UI/UX

#### Guardian Grove ✅
```
Interface:
- Canvas 2D
- Sistema de UI modular (ui/*.ts)
- Battle UI já existe
- Menus estilo "grimório"
- Renderização de sprites
```

**Reaproveitamento**: ⭐⭐⭐⭐ (85%)
- Canvas → Campo de cartas
- Battle UI → Kardum Game UI
- Sistema de cliques/drag já existe

#### KARDUM 🎯
```
Interface Card Game:
┌─────────────────────────────────────┐
│  Oponente HP: 25/30    ⚡ 5/7       │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐           │
│  │ 3 │ │ 5 │ │ 2 │ │ 4 │  ← Campo  │
│  │ 4 │ │ 6 │ │ 3 │ │ 5 │    Inimigo│
│  └───┘ └───┘ └───┘ └───┘           │
│                                     │
│  ═══════════════════════════════    │
│                                     │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐           │
│  │ 2 │ │ 4 │ │ 3 │ │ 1 │  ← Seu    │
│  │ 3 │ │ 5 │ │ 2 │ │ 7 │    Campo  │
│  └───┘ └───┘ └───┘ └───┘           │
│                                     │
│  ╔═╗ ╔═╗ ╔═╗ ╔═╗ ╔═╗ ╔═╗ ╔═╗      │
│  ║2║ ║3║ ║5║ ║4║ ║1║ ║6║ ║3║  ← Mão│
│  ╚═╝ ╚═╝ ╚═╝ ╚═╝ ╚═╝ ╚═╝ ╚═╝      │
│                                     │
│  Você HP: 28/30    ⚡ 7/10          │
│              [END TURN]             │
└─────────────────────────────────────┘
```

**Mudança Necessária**:
- Redesign do layout (horizontal, tipo Hearthstone)
- Drag & Drop para jogar cartas
- Animações de ataque

---

## 🗂️ Estrutura de Dados

### Beast (Atual) → Card (Novo)

```typescript
// ANTES: Beast
interface Beast {
  id: string;
  name: string;
  line: BeastLine;           // Olgrim, Terravox, etc
  attributes: Attributes;     // might, wit, focus...
  techniques: string[];       // 40 técnicas
  currentHp: number;
  maxHp: number;
  essence: number;            // Energia para técnicas
}

// DEPOIS: Card
interface Card {
  id: string;
  name: string;
  type: CardType;             // general, defender, ability...
  race: Race;                 // human, orc, elf, dwarf, deva
  class?: ClassType;          // warrior, mage, etc
  warResourceCost: number;    // Custo para jogar (0-10)
  attack?: number;            // Para defenders/general
  health?: number;            // Para defenders/general
  effects?: CardEffect[];     // Efeitos especiais
}
```

**Similaridades**:
- `Beast.line` → `Card.race` (10 linhas → 5 raças)
- `Beast.techniques` → `Card.effects` (habilidades da carta)
- `Beast.currentHp` → `Card.health`
- `Beast.essence` → `warResources` (por jogador, não por carta)

---

### GameState (Atual) → GameMatch (Novo)

```typescript
// ANTES: Guardian Grove
interface GameState {
  playerName: string;
  week: number;              // Tempo linear
  coronas: number;
  activeBeast: Beast;        // 1 besta ativa
  inventory: Item[];
  currentBattle: Battle;     // Batalha atual
}

// DEPOIS: KARDUM
interface GameMatch {
  id: string;
  player1: PlayerState;      // Estado do jogador 1
  player2: PlayerState;      // Estado do jogador 2 (ou AI)
  turn: 1 | 2;              // De quem é o turno
  phase: GamePhase;         // draw, strategy, combat
  turnNumber: number;
}

interface PlayerState {
  general: GeneralCard;      // "Herói" do jogador
  deck: Card[];             // Cartas no baralho
  hand: Card[];             // Mão (até 10 cartas)
  field: DefenderCard[];    // Campo de batalha
  graveyard: Card[];        // Cemitério
  warResources: number;     // Recursos atuais (0-10)
}
```

**Diferença chave**: 
- Guardian Grove = 1 jogador vs AI (PvE focus)
- KARDUM = 2 jogadores em tempo real (PvP focus)

---

## 📦 Banco de Dados

### Migrations Atuais (Guardian Grove)

```sql
users
  ├── id, email, displayName
  └── googleId, createdAt

game_saves
  ├── id, userId, playerName
  ├── week, coronas, victories
  └── createdAt, updatedAt

beasts
  ├── id, gameSaveId, name, line
  ├── might, wit, focus, agility, ward, vitality
  ├── currentHp, maxHp, essence
  └── techniques (JSONB)

inventory_items
  ├── id, gameSaveId, itemId
  └── quantity

friends
  ├── id, userId, friendId
  └── status, createdAt

chat_messages
  ├── id, channel, sender
  └── message, timestamp
```

### Migrations Novas (KARDUM)

```sql
cards (nova)
  ├── id, name, type, race, class
  ├── warResourceCost, attack, health
  ├── effects (JSONB), imageUrl
  └── rarity

user_cards (nova) - Coleção do jogador
  ├── id, userId, cardId
  └── quantity, acquiredAt

decks (nova)
  ├── id, userId, name
  ├── generalCardId
  ├── cards (JSONB - array de IDs)
  └── createdAt, updatedAt

matches (nova) - Histórico de partidas
  ├── id, player1Id, player2Id
  ├── player1DeckId, player2DeckId
  ├── gameState (JSONB - estado completo)
  ├── winnerId, isPvP
  └── startedAt, finishedAt

match_history (nova) - Replay
  ├── id, matchId, turnNumber, phase
  ├── action (JSONB)
  └── timestamp

-- MANTER:
users (sem mudanças)
friends (sem mudanças)
chat_messages (sem mudanças)

-- REMOVER ou DEPRECATED:
game_saves (não precisa mais)
beasts (não precisa mais)
inventory_items (substituído por user_cards)
```

---

## 🔄 Fluxo de Jogo Comparado

### Guardian Grove (PvE Loop)

```
1. Jogador cria conta
2. Recebe primeira Besta (gerada proceduralmente)
3. LOOP SEMANAL:
   ├─ Escolhe ação da semana:
   │  ├─ Treinar (aumenta atributos)
   │  ├─ Trabalhar (ganha moedas)
   │  └─ Descansar (reduz fadiga)
   ├─ Besta envelhece (+1 semana)
   ├─ Pode entrar em torneio
   │  └─ Batalha vs AI
   └─ Volta ao início
4. Besta morre (após 3 anos)
5. Cria nova Besta (herança espiritual)
```

### KARDUM (PvP Loop)

```
1. Jogador cria conta
2. Recebe deck inicial (30 cartas + 1 General)
3. MATCHMAKING:
   ├─ Entra na fila PvP
   └─ Encontra oponente (MMR similar)
4. PARTIDA:
   ├─ Fase Draw: +1 recurso, compra 1 carta
   ├─ Fase Strategy: Joga cartas da mão
   ├─ Fase Combat: Ataca com defenders
   └─ Passa turno
5. FIM DE PARTIDA:
   ├─ General derrotado = PERDE
   ├─ Deck vazio = 2 dano/turno no General
   └─ Vencedor ganha recompensas (gold, XP, cartas)
6. Volta ao matchmaking OU
7. Abre packs / Edita deck
```

**Diferença principal**: 
- Guardian Grove = **progressão temporal** (semanas, envelhecimento)
- KARDUM = **progressão por coleção** (ganhar cartas, melhorar deck)

---

## 🎨 Arte e Assets

### Reaproveitamento de Assets

#### ✅ PODE REUSAR:

1. **Sprites de Bestas → Ilustrações de Cartas**
   ```
   Olgrim (olho flutuante) → Defender mágico
   Terravox (golem de pedra) → Defender tank
   Feralis (felino) → Defender ágil
   ... (todas as 10 linhas)
   ```

2. **Sistema de Cores por Raça**
   ```
   Humanos: #3498db (azul)
   Devas: #f1c40f (dourado)
   Orcs: #e74c3c (vermelho)
   Anões: #95a5a6 (cinza/metal)
   Elfos: #2ecc71 (verde)
   ```

3. **Ícones de Atributos**
   ```
   Might (Força) → Ataque de cartas
   Ward (Resistência) → Vida de cartas
   Focus (Foco) → Efeitos especiais
   ```

4. **UI Elements**
   ```
   Botões, painéis, barras
   Sistema de notificações
   Chat UI
   ```

#### ❌ PRECISA CRIAR NOVO:

1. **Layout do Campo de Cartas**
   - Regiões definidas (mão, campo, general)
   - Grid para posicionar defenders
   - Indicadores de alvo

2. **Animações de Carta**
   - Drag & drop
   - Flip (virar carta)
   - Ataque (arco de projétil)
   - Dano (shake/flash)

3. **Arte de Cartas**
   - Molduras por tipo (Defender, Ability, etc)
   - Backgrounds
   - Cristais de custo

---

## 🧮 Complexidade de Implementação

### Fácil (Reaproveitamento direto)
- ✅ Autenticação (já existe)
- ✅ Banco de dados (só adicionar tabelas)
- ✅ Chat (já funciona)
- ✅ Friends (já existe)
- ✅ WebSocket (adaptar mensagens)
- ✅ Sistema de turnos (base já existe)

### Médio (Adaptação necessária)
- 🟡 Sistema de cartas (novo, mas simples)
- 🟡 Deck building (UI nova)
- 🟡 Coleção de cartas (adaptar inventário)
- 🟡 UI do jogo (redesign do canvas)
- 🟡 Matchmaking (fila + pairing)

### Difícil (Sistema novo)
- 🔴 Balance de cartas (playtesting extensivo)
- 🔴 Sistema de efeitos complexos (chain effects)
- 🔴 Animações fluidas (polish)
- 🔴 Anti-cheat (validação server-side)
- 🔴 Replay system (gravar/reproduzir partidas)

---

## 💰 Modelo de Negócio

### Guardian Grove (Casual/Free)
```
Monetização (planejada):
- Jogo gratuito
- Opcional: Skins cosméticas
- Opcional: Aceleradores de tempo
```

### KARDUM (F2P + Microtransactions)
```
Monetização:
- ✅ Jogo gratuito (F2P)
- 💰 Packs de cartas (gacha)
  ├─ Basic Pack: 100 gold (5 cartas)
  ├─ Premium Pack: 200 gold (5 cartas + 1 rara garantida)
  └─ Legendary Pack: 500 gold (10 cartas + 1 lendária)
- 💎 Cristais (moeda premium)
  ├─ Comprar com $$$
  └─ Ganhar em eventos
- 🎫 Season Pass (mensal)
  ├─ Recompensas exclusivas
  └─ Cartas limitadas
- 🎨 Cosmetics
  ├─ Skins de General
  ├─ Card backs (verso de carta)
  └─ Emotes
```

**Hearthstone-like**: 
- Não é pay-to-win (pode farmar tudo grátis)
- Mas pagar acelera progressão

---

## 📱 Plataforma e Deploy

### Ambos (Mantém)
```
✅ PWA (Progressive Web App)
  ├─ Instalável no celular
  ├─ Funciona offline (match local vs AI)
  └─ Service Worker para cache

✅ Deploy
  ├─ Frontend: Vercel
  ├─ Backend: Railway
  └─ Database: PostgreSQL (Railway)

✅ Performance
  ├─ Vite (build rápido)
  ├─ TypeScript
  └─ Canvas 2D (60fps)
```

### KARDUM Adicional
```
➕ Futuro:
  ├─ App nativo (Electron/Tauri)
  ├─ Steam
  └─ Mobile stores (iOS/Android)
```

---

## 🎯 Público-Alvo

### Guardian Grove
```
👥 Público:
- Fãs de Pokémon/Monster Rancher
- Jogadores casuais
- Single-player focus
- Idade: 10-30 anos
```

### KARDUM
```
👥 Público:
- Fãs de Hearthstone/Magic
- Jogadores competitivos
- Multiplayer focus
- Idade: 13-40 anos
- Comunidade eSports (potencial)
```

**Mudança de mercado**: 
- Guardian Grove = Nicho (criação de criaturas)
- KARDUM = Mainstream (card games são populares)

---

## 🏆 Vantagens da Migração

### Por que fazer KARDUM em vez de continuar Guardian Grove?

#### 1. **Potencial de Crescimento**
- ✅ Card games têm comunidade ENORME (Hearthstone, Magic, Yu-Gi-Oh)
- ✅ eSports viável (torneios, streaming)
- ✅ Mais social (PvP direto)

#### 2. **Reaproveitamento de Código**
- ✅ 70% do código pode ser reutilizado
- ✅ Infraestrutura já pronta
- ✅ Menos trabalho que começar do zero

#### 3. **Monetização Melhor**
- ✅ Modelo F2P + gacha comprovado
- ✅ Players pagam por conveniência (packs)
- ✅ Season Pass recorrente

#### 4. **Escopo Mais Gerenciável**
- ✅ Não precisa de mundo aberto
- ✅ Foco em balance de cartas
- ✅ Conteúdo modular (adicionar cartas é mais fácil que adicionar bestas com ciclo de vida)

#### 5. **Replay Value**
- ✅ Cada partida é única
- ✅ Meta-game evolui com patches
- ✅ Players voltam para ranked

---

## ⚠️ Desafios da Migração

### O que vai dar trabalho:

#### 1. **Balance de Cartas**
```
Problema: Cada carta precisa ser testada exaustivamente
Solução: 
  ├─ Começar com 40 cartas simples
  ├─ Playtest com comunidade
  ├─ Patches frequentes
  └─ Analytics para ver cartas OP
```

#### 2. **Cheating/Exploits**
```
Problema: PvP = tentação de cheatar
Solução:
  ├─ TUDO validado no servidor
  ├─ Cliente só envia ações (não calcula)
  ├─ Logs de partida para review
  └─ Sistema de report
```

#### 3. **Matchmaking Justo**
```
Problema: Newbies vs Veterans = frustrante
Solução:
  ├─ MMR (MatchMaking Rating)
  ├─ Ranked tiers (Bronze → Legendary)
  ├─ Casual mode (sem rank)
  └─ Decks iniciais balanceados
```

#### 4. **Server Load**
```
Problema: Muitas partidas simultâneas
Solução:
  ├─ WebSocket eficiente
  ├─ Game state em Redis (cache)
  ├─ Horizontal scaling (mais servidores)
  └─ CDN para assets
```

---

## 📅 Roadmap Detalhado

### Fase 0: Preparação (1 semana)
```
✅ Ler GDD completo do KARDUM
✅ Decidir quais mecânicas implementar no MVP
✅ Criar protótipo em papel (playtest offline)
✅ Definir 40 cartas iniciais
```

### Fase 1: MVP Offline (2 semanas)
```
🎯 Objetivo: Jogo jogável offline vs AI

Semana 1:
- [ ] Criar tipos TypeScript (Card, Deck, Match)
- [ ] Sistema de cartas básico
- [ ] 20 cartas de teste (10 defenders, 10 abilities)
- [ ] UI minimalista (desenhar cartas)

Semana 2:
- [ ] Game loop completo (draw, strategy, combat)
- [ ] AI simples (joga aleatório)
- [ ] Testar e balancear
- [ ] Validar se é divertido ⭐
```

### Fase 2: Database e Coleção (1 semana)
```
- [ ] Migrations do banco (cards, decks, user_cards)
- [ ] API para carregar cartas
- [ ] Sistema de coleção
- [ ] Deck builder básico
```

### Fase 3: Multiplayer (2 semanas)
```
- [ ] Matchmaking system
- [ ] WebSocket para PvP
- [ ] Sincronização de estado
- [ ] Validação server-side
- [ ] Teste com 2 players
```

### Fase 4: Polish (2 semanas)
```
- [ ] Animações de cartas
- [ ] SFX e música
- [ ] UI melhorada
- [ ] Tutorial
- [ ] 40 cartas completas
```

### Fase 5: Soft Launch (1 semana)
```
- [ ] Deploy em produção
- [ ] Convidar 50-100 beta testers
- [ ] Coletar feedback
- [ ] Ajustar balance
```

### Fase 6: Expansão (ongoing)
```
- [ ] Adicionar +60 cartas
- [ ] Ranked system
- [ ] Season Pass
- [ ] Torneios
- [ ] Modo Draft (tipo Arena do Hearthstone)
```

---

## 🎮 Diferenças de Gameplay

### Exemplo de Turno

#### Guardian Grove (Turno de Batalha)
```
1. Escolhe técnica da Besta
   → "Investida Selvagem" (15 Essência, 20 dano)
2. Besta executa (ou desobedece se loyalty baixa)
3. Inimigo contra-ataca automaticamente
4. Repete até alguém morrer
```

#### KARDUM (Turno Completo)
```
1. DRAW PHASE (automático)
   → +1 recurso (agora 5/5)
   → Compra 1 carta

2. STRATEGY PHASE (jogador decide)
   → Joga "Soldado Humano" (2 recursos) → campo
   → Joga "Espada de Ferro" (2 recursos) → equipa em soldado
   → Joga "Bola de Fogo" (4 recursos) → mata defender inimigo
   → Sobra 0 recursos

3. COMBAT PHASE (jogador decide)
   → Ataca com Soldado (3 atk) no General inimigo
   → Ataca com outro Defender no defender inimigo

4. END TURN
   → Passa turno para oponente
```

**Complexidade maior em KARDUM**:
- Mais decisões por turno
- Gerenciamento de recursos
- Ordem de jogadas importa

---

## 🧩 Conclusão

### KARDUM é viável?

#### ✅ SIM, porque:

1. **70%+ do código já existe**
   - Sistema de combate
   - Multiplayer
   - Banco de dados
   - Autenticação

2. **Escopo gerenciável**
   - MVP com 40 cartas em 4 semanas
   - Polir em +4 semanas
   - Total: 8 semanas para v1.0

3. **Mercado comprovado**
   - Hearthstone fatura bilhões
   - Magic: Arena cresce 30%/ano
   - Yu-Gi-Oh Master Duel = 40M downloads

4. **Diferencial possível**
   - Estilo low-poly único
   - Mecânicas do GDD (Montarias dual-purpose)
   - Lore interessante (5 raças, 8 classes)

#### ⚠️ ATENÇÃO PARA:

1. **Balance é crítico**
   - Card games vivem ou morrem pelo balance
   - Playtest MUITO antes de lançar

2. **Comunidade importa**
   - Precisa ter jogadores online
   - Marketing é essencial
   - Discord/Reddit para feedback

3. **Conteúdo constante**
   - Novas cartas a cada 2-3 meses
   - Eventos sazonais
   - Meta-game precisa evoluir

---

**RECOMENDAÇÃO FINAL**: 

🚀 **FAÇA!** 

O Guardian Grove é um ótimo jogo, mas KARDUM tem muito mais potencial de crescimento e monetização. A base técnica já está pronta, então a transição é de baixo risco.

**Comece com o Protótipo Offline (Fase 1)** e valide se o gameplay é divertido antes de investir em multiplayer.

Boa sorte! 🎴⚔️

