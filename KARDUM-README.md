# 🎴 KARDUM - Online Card Battle Game

## 📖 Visão Geral

**KARDUM** é um card game online competitivo tipo Hearthstone/Magic, desenvolvido a partir da base técnica do **Guardian Grove**.

### 🎯 Conceito Core

- **Gênero**: Card Game PvP/PvE
- **Plataforma**: Web (PWA) - Desktop & Mobile
- **Jogabilidade**: Batalhas táticas 1v1 em tempo real
- **Estilo**: Low-poly estilizado
- **Público**: Fãs de Hearthstone, Magic, Yu-Gi-Oh

### 🎮 Mecânicas Principais

1. **Deck de 30-40 cartas** com 1 General (herói)
2. **5 Raças**: Humanos, Devas, Orcs, Anões, Elfos
3. **8 Classes**: Warrior, Barbarian, Druid, Elementalist, Necromancer, Archer, Assassin, Chivalry
4. **Recursos de Guerra**: Sistema de mana (1-10, +1 por turno)
5. **Tipos de Carta**: General, Defender, Equipment, Mount, Consumable, Ability
6. **Fases de Jogo**: Draw → Strategy → Combat → End Turn

---

## 📚 Documentação

### 🚀 [QUICK START](./KARDUM-QUICK-START.md) ← **COMECE AQUI!**
**Protótipo funcionando em 30 minutos!**
- Setup rápido
- Código copy-paste
- 20 cartas de teste
- UI minimalista
- AI simples

### 📋 [MIGRATION PLAN](./KARDUM-MIGRATION-PLAN.md)
**Plano técnico completo de 8 semanas**
- Fase 1: Fundação (2 semanas)
- Fase 2: Combate PvP (2 semanas)
- Fase 3: Multiplayer (1 semana)
- Fase 4: Coleção/Deck (1 semana)
- Fase 5: PvE/AI (1 semana)
- Fase 6: Conteúdo (2+ semanas)

### 🔄 [KARDUM vs BEAST KEEPER](./KARDUM-vs-BEAST-KEEPER.md)
**Comparação detalhada**
- O que muda vs. Guardian Grove
- Sistemas reutilizáveis (70%+)
- Estrutura de dados
- Banco de dados
- Análise de viabilidade

---

## 🎯 Roadmap Rápido

### ✅ Fase 0: Protótipo (1 semana)
```
[x] Ler GDD do KARDUM
[x] Criar documentação
[ ] Protótipo offline funcionando
[ ] 20 cartas de teste
[ ] Playtest e validar diversão
```

### 📋 Fase 1: MVP Offline (2 semanas)
```
[ ] Sistema de cartas completo
[ ] 40 cartas balanceadas
[ ] AI básica funcional
[ ] UI melhorada
[ ] Sound effects
```

### 📋 Fase 2: Multiplayer (2 semanas)
```
[ ] Matchmaking PvP
[ ] WebSocket em tempo real
[ ] Validação server-side
[ ] Anti-cheat básico
```

### 📋 Fase 3: Progressão (1 semana)
```
[ ] Sistema de coleção
[ ] Deck builder
[ ] Packs de cartas (gacha)
[ ] Ranking system
```

### 📋 Fase 4: Conteúdo (ongoing)
```
[ ] 100+ cartas
[ ] 8 decks iniciais (1 por classe)
[ ] Eventos sazonais
[ ] Torneios
[ ] Season Pass
```

---

## 🏗️ Arquitetura

### Reaproveitamento do Guardian Grove

#### ✅ Mantém (70%+ do código)
- Sistema de combate por turnos
- WebSocket para tempo real
- Autenticação (Google OAuth + JWT)
- Banco de dados PostgreSQL
- Sistema de amigos
- Chat global
- PWA configurado
- Deploy (Railway/Vercel)

#### ➕ Adiciona
- Sistema de cartas e decks
- Recursos de Guerra (mana)
- Fases de jogo (Draw, Strategy, Combat)
- Matchmaking PvP
- Sistema de coleção (gacha)
- Deck Builder
- Tipos de cartas variados

#### ❌ Remove
- Sistema de criação de bestas
- Calendário semanal
- Trabalho/Treino/Descanso
- Dungeons e exploração
- Crafting
- NPCs e quests

---

## 🎴 Tipos de Carta

### 1. General (Herói)
```
- 1 por deck (obrigatório)
- Define classe do deck
- 25-30 HP
- 2-3 ATK
- Habilidade especial única
```

### 2. Defender (Soldado)
```
- Fica no campo de batalha
- Pode atacar/defender
- Stats: ATK/HP
- Habilidades especiais:
  - Taunt (obriga inimigo atacar)
  - Charge (ataca no turno que entra)
```

### 3. Equipment (Equipamento)
```
- Equipa em Defender ou General
- +ATK, +HP, efeitos especiais
- 1 equipamento por unidade
```

### 4. Mount (Montaria)
```
- DUAL PURPOSE: pode ser Defender OU Equipment
- Decide ao jogar
- Versatilidade estratégica
```

### 5. Consumable (Consumível)
```
- Uso único, depois vai pro cemitério
- Dano direto, cura, buffs, etc
- Efeitos instantâneos
```

### 6. Ability (Habilidade)
```
- Específica por classe
- Apenas Generais daquela classe podem usar
- 1 por turno
- Efeitos táticos poderosos
```

---

## 🎮 Gameplay Loop

### Matchmaking
```
1. Jogador entra na fila PvP
2. Sistema encontra oponente (MMR similar)
3. Carrega decks de ambos
4. Inicia partida
```

### Partida (Turno do Jogador)
```
1. DRAW PHASE (automático)
   ├─ +1 recurso máximo (até 10)
   ├─ Recarrega recursos ao máximo
   └─ Compra 1 carta do deck

2. STRATEGY PHASE (jogador decide)
   ├─ Joga cartas da mão (gasta recursos)
   ├─ Equipamentos: equipa em unidades
   ├─ Consumíveis: usa e destroi
   ├─ Defenders: entra em "positioning" (não ataca neste turno)
   └─ Abilities: 1 por turno

3. COMBAT PHASE (jogador decide)
   ├─ Ataca com Defenders (que não estão em positioning)
   ├─ Escolhe alvos (Defenders ou General inimigo)
   └─ Taunt obriga atacar defenders específicos

4. END TURN
   ├─ Remove status "positioning"
   ├─ Reset flags de ações
   └─ Passa turno para oponente
```

### Condições de Vitória
```
✅ Derrotar General inimigo (0 HP)
✅ Inimigo fica sem cartas (2 dano/turno no General)
```

---

## 💾 Banco de Dados

### Novas Tabelas

```sql
-- Cartas do jogo
cards
  ├─ id, name, type, race, class
  ├─ warResourceCost, attack, health
  ├─ effects (JSONB), imageUrl
  └─ rarity

-- Coleção do jogador
user_cards
  ├─ userId, cardId
  └─ quantity, acquiredAt

-- Decks
decks
  ├─ userId, name
  ├─ generalCardId
  └─ cards (JSONB array)

-- Partidas
matches
  ├─ player1Id, player2Id
  ├─ gameState (JSONB)
  ├─ winnerId, isPvP
  └─ startedAt, finishedAt

-- Replay
match_history
  ├─ matchId, turnNumber, phase
  └─ action (JSONB), timestamp
```

---

## 🎨 Estilo Visual

### Paleta de Cores por Raça

```
🔵 Humanos:  #3498db (azul tecnológico)
🟡 Devas:    #f1c40f (dourado divino)
🔴 Orcs:     #e74c3c (vermelho sangue)
⚪ Anões:    #95a5a6 (cinza metálico)
🟢 Elfos:    #2ecc71 (verde natural)
```

### Layout da Tela

```
┌─────────────────────────────────────────┐
│  [Oponente Info]    ⚡ Recursos         │
│  ┌────┐  ┌───┐ ┌───┐ ┌───┐ ┌───┐      │
│  │Gen │  │ D │ │ D │ │ D │ │ D │      │ Campo
│  └────┘  └───┘ └───┘ └───┘ └───┘      │ Oponente
│  ═════════════════════════════════      │
│                                         │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐              │ Campo
│  │ D │ │ D │ │ D │ │ D │  ┌────┐      │ Jogador
│  └───┘ └───┘ └───┘ └───┘  │Gen │      │
│                            └────┘      │
│  ╔═╗ ╔═╗ ╔═╗ ╔═╗ ╔═╗ ╔═╗ ╔═╗ ╔═╗    │ Mão
│  ║C║ ║C║ ║C║ ║C║ ║C║ ║C║ ║C║ ║C║    │
│  ╚═╝ ╚═╝ ╚═╝ ╚═╝ ╚═╝ ╚═╝ ╚═╝ ╚═╝    │
│                                         │
│  [Você]  HP: 28/30   ⚡ 7/10  [END]    │
└─────────────────────────────────────────┘

D = Defender
Gen = General
C = Card (Mão)
```

---

## 🛠️ Stack Técnico

### Frontend
```
- TypeScript + Vite
- Canvas 2D (rendering)
- WebSocket (tempo real)
- IndexedDB (cache offline)
- PWA (instalável)
```

### Backend
```
- Node.js + Express
- PostgreSQL (dados)
- WebSocket (ws library)
- JWT (autenticação)
```

### Deploy
```
- Frontend: Vercel
- Backend: Railway
- Database: Railway PostgreSQL
- Assets: Vercel CDN
```

---

## 💰 Monetização (Futuro)

### Free-to-Play + Microtransactions

```
✅ Jogo gratuito completo
  ├─ Deck inicial por classe (8 decks)
  ├─ Pode farmar todas as cartas
  └─ Sem pay-to-win

💰 Packs de Cartas
  ├─ Basic Pack: 100 gold (5 cartas)
  ├─ Premium Pack: 200 gold (1 rara garantida)
  └─ Legendary Pack: 500 gold (1 lendária)

💎 Cristais (moeda premium)
  ├─ Compra com $$$
  ├─ Acelera progressão
  └─ Cosmetics exclusivos

🎫 Season Pass (mensal)
  ├─ Track gratuito (todos ganham)
  ├─ Track premium ($9.99)
  └─ Cartas exclusivas, skins, emotes

🎨 Cosmetics
  ├─ Skins de General
  ├─ Card backs (verso de carta)
  ├─ Emotes animados
  └─ Efeitos visuais
```

---

## 📊 Métricas de Sucesso

### MVP (Fase 1)
```
✅ 40 cartas funcionais
✅ PvP funciona sem bugs críticos
✅ Partida completa em 10-15 min
✅ AI competente para modo solo
✅ 50+ beta testers
```

### Soft Launch (Fase 2)
```
✅ 100+ cartas
✅ Ranking system
✅ 500+ jogadores ativos
✅ 80%+ retention (7 dias)
✅ Tempo médio de sessão: 30+ min
```

### Full Launch (Fase 3)
```
✅ 200+ cartas
✅ 5000+ jogadores ativos
✅ Torneios semanais
✅ Streamers jogando
✅ Comunidade ativa (Discord/Reddit)
```

---

## 🤝 Como Contribuir

### Desenvolvimento
```
1. Clone o repositório
2. Leia KARDUM-QUICK-START.md
3. Implemente protótipo
4. Teste e valide
5. Abra PR com mudanças
```

### Design de Cartas
```
1. Use template em /docs/card-template.md
2. Balance: custo vs. poder
3. Playtest com comunidade
4. Submeta no Discord/Issues
```

### Arte
```
1. Sprites low-poly (estilo PS1)
2. Paleta de cores definida
3. Formato: PNG transparente
4. Tamanho: 256x256px
```

---

## 📞 Suporte

### Canais
- 💬 Discord: [Em breve]
- 🐛 Issues: GitHub Issues
- 📧 Email: [seu-email]
- 🐦 Twitter: [@seu-twitter]

### FAQ

**P: Preciso pagar para jogar?**  
R: Não! O jogo é 100% gratuito. Microtransações são opcionais e apenas aceleram progressão.

**P: Funciona no celular?**  
R: Sim! É um PWA que funciona em qualquer navegador moderno.

**P: Tem modo offline?**  
R: Sim! Você pode jogar contra AI mesmo sem internet.

**P: Como consigo novas cartas?**  
R: Jogando e ganhando recompensas, abrindo packs com gold, ou eventos especiais.

**P: É balanceado?**  
R: Estamos constantemente ajustando balance baseado em analytics e feedback da comunidade.

---

## 🏆 Créditos

### Time Core
- **Game Design**: [Seu Nome] - baseado no GDD KARDUM
- **Programação**: [Seu Nome] - adaptado de Guardian Grove
- **Arte**: [Em busca de artistas!]
- **Sound**: [Em busca de sound designers!]

### Inspirações
- **Hearthstone** (Blizzard) - mecânicas de card game
- **Magic: The Gathering** (Wizards) - profundidade estratégica
- **Guardian Grove** (base técnica) - sistema de combate

### Open Source
- Vite, TypeScript, Node.js
- PostgreSQL, Express
- Three.js (futuramente para 3D)

---

## 📜 Licença

MIT License - Veja [LICENSE](./LICENSE) para detalhes.

---

## 🚀 Status do Projeto

```
┌────────────────────────────────────┐
│  📊 KARDUM Development Status      │
├────────────────────────────────────┤
│  [█████░░░░░] 50% - Planning       │
│  [█░░░░░░░░░] 10% - Prototype      │
│  [░░░░░░░░░░]  0% - MVP            │
│  [░░░░░░░░░░]  0% - Beta           │
│  [░░░░░░░░░░]  0% - Launch         │
└────────────────────────────────────┘

Última atualização: 01/11/2025
Próximo milestone: Protótipo Offline
```

---

## 🎯 Call to Action

### Para Desenvolvedores
👉 **Leia o [QUICK START](./KARDUM-QUICK-START.md) e crie o protótipo!**

### Para Designers
👉 **Crie cartas usando o [Card Template](./docs/card-template.md)**

### Para Jogadores
👉 **Junte-se ao Discord e participe dos playtests!**

---

**Feito com ❤️ e muito ☕ por [Seu Nome]**

🎴 **KARDUM - O card game que você vai amar batalhar!** ⚔️

