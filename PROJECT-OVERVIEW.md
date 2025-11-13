# 🎮 Guardian Grove - Visão Geral Completa do Projeto

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura Técnica](#arquitetura-técnica)
3. [Estrutura do Projeto](#estrutura-do-projeto)
4. [Sistemas Implementados](#sistemas-implementados)
5. [Assets e Recursos](#assets-e-recursos)
6. [Tecnologias Utilizadas](#tecnologias-utilizadas)
7. [Features Principais](#features-principais)
8. [Possibilidades de Reutilização](#possibilidades-de-reutilização)

---

## 🎯 Visão Geral

**Guardian Grove** é um simulador de criação e treinamento de criaturas místicas com batalhas estratégicas em tempo real pausável, desenvolvido como uma Progressive Web App (PWA) usando TypeScript puro e Web APIs modernas.

### Conceito do Jogo

- **Gênero**: Simulador de criaturas + RPG tático
- **Plataforma**: Web (PWA) - Desktop e Mobile
- **Estilo Visual**: Low-poly estilizado (inspiração PS1 com iluminação moderna)
- **Público-alvo**: Fãs de simulação, estratégia e jogos de criaturas colecionáveis

### Diferenciais

- Sistema procedural de geração de criaturas via "Relíquias de Eco"
- Ciclo de vida dinâmico (criação, maturação, envelhecimento e morte)
- Sistema de batalha tático em turnos
- Calendário real sincronizado com horário de Brasília
- Sistema de dia/noite visual dinâmico
- 10 linhas de criaturas únicas com personalidades distintas

---

## 🏗️ Arquitetura Técnica

### Stack Principal

```
Frontend (Client):
├── TypeScript (5.3.3)
├── Vite (build tool)
├── Three.js (renderização 3D)
├── Canvas 2D API (UI e renderização 2D)
├── IndexedDB (persistência offline)
└── Service Worker (PWA e cache)

Backend (Server):
├── Node.js + Express
├── TypeScript
├── PostgreSQL (banco de dados)
├── Socket.io (WebSocket para chat e real-time)
├── JWT (autenticação)
└── Passport.js (OAuth - Google)
```

### Arquitetura de Dados

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Game UI    │  │   3D Scene   │  │   Storage    │   │
│  │  (Canvas 2D) │  │  (Three.js)  │  │ (IndexedDB) │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                  │                  │           │
│         └──────────────────┼──────────────────┘           │
│                            │                              │
│                    ┌───────▼────────┐                      │
│                    │  Game State   │                      │
│                    │   (In-Memory) │                      │
│                    └───────┬────────┘                      │
└────────────────────────────┼──────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   API Client    │
                    │  (REST + WS)    │
                    └────────┬────────┘
                             │
┌────────────────────────────┼──────────────────────────────┐
│                    SERVER (Node.js)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Express    │  │  Socket.io   │  │  PostgreSQL  │   │
│  │   (REST API) │  │  (WebSocket)  │  │   (Database) │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                  │                  │           │
│         └──────────────────┼──────────────────┘           │
│                            │                              │
│                    ┌───────▼────────┐                      │
│                    │  Controllers   │                      │
│                    │  + Services    │                      │
│                    └────────────────┘                      │
└───────────────────────────────────────────────────────────┘
```

### Fluxo de Dados

1. **Inicialização**: Client carrega assets → Inicializa game state → Conecta ao servidor
2. **Gameplay**: Input → Update game state → Render (2D/3D) → Sync com servidor
3. **Persistência**: Auto-save local (IndexedDB) + Sync periódico com servidor
4. **Real-time**: WebSocket para chat, notificações e eventos em tempo real

---

## 📁 Estrutura do Projeto

```
vanilla-game/
├── client/                          # Frontend (TypeScript + Vite)
│   ├── src/
│   │   ├── 3d/                     # Sistema 3D (Three.js)
│   │   │   ├── scenes/             # Cenas 3D (Ranch, Village, Battle)
│   │   │   ├── models/             # Modelos 3D das criaturas
│   │   │   ├── events/             # Eventos ambientais (critters, chuva)
│   │   │   ├── materials/          # Shaders e materiais
│   │   │   └── terrain/            # Terreno e vegetação
│   │   ├── api/                    # Cliente API (REST)
│   │   ├── data/                   # Dados estáticos (beasts, items, etc)
│   │   ├── systems/                # Sistemas de jogo
│   │   │   ├── beast.ts            # Lógica das criaturas
│   │   │   ├── combat.ts           # Sistema de combate
│   │   │   ├── inventory.ts        # Inventário
│   │   │   ├── quests.ts           # Sistema de quests
│   │   │   ├── tournaments.ts      # Torneios
│   │   │   └── ...                 # Outros sistemas
│   │   ├── ui/                     # Interfaces de usuário
│   │   │   ├── game-ui.ts          # UI principal do jogo
│   │   │   ├── battle-ui.ts         # UI de batalha
│   │   │   ├── shop-ui.ts          # Loja
│   │   │   ├── village-3d-ui.ts    # UI da vila 3D
│   │   │   └── ...                 # Outras UIs
│   │   ├── utils/                  # Utilitários
│   │   │   ├── day-night.ts        # Sistema dia/noite
│   │   │   └── beast-age.ts        # Cálculo de idade
│   │   ├── main.ts                 # Entry point
│   │   ├── loop.ts                 # Game loop
│   │   ├── world.ts                # Mundo do jogo
│   │   └── types.ts                # Tipos TypeScript
│   ├── public/
│   │   └── assets/
│   │       └── 3d/                 # Assets 3D (GLB models)
│   │           ├── beasts/         # Modelos das 10 criaturas
│   │           ├── Ranch/          # Assets do rancho
│   │           └── Village/        # Assets da vila
│   └── package.json
│
├── server/                          # Backend (Node.js + Express)
│   ├── src/
│   │   ├── controllers/            # Controllers REST
│   │   ├── routes/                 # Rotas da API
│   │   ├── db/                     # Migrations e queries SQL
│   │   ├── services/               # Serviços (chat, eventos)
│   │   ├── middleware/             # Middleware (auth, etc)
│   │   └── index.ts                # Entry point
│   └── package.json
│
├── shared/                          # Código compartilhado
│   └── types.ts                    # Tipos compartilhados
│
└── package.json                    # Root (monorepo)
```

---

## ⚙️ Sistemas Implementados

### 1. Sistema de Criaturas (Beasts)

**10 Linhas de Criaturas Únicas:**
- Olgrim (olho flutuante)
- Terravox (golem de pedra)
- Feralis (felino ágil)
- Brontis (réptil bípede)
- Zephyra (ave veloz)
- Ignar (fera de fogo)
- Mirella (anfíbio)
- Umbrix (besta das sombras)
- Sylphid (espírito etéreo)
- Raukor (lobo lupino)

**Características:**
- Atributos: Força, Astúcia, Foco, Agilidade, Resistência, Vitalidade
- Estados: Fadiga, Stress, Lealdade, Idade
- Técnicas: 40+ técnicas únicas por criatura
- Sangues: Subvariações que alteram atributos e visual

### 2. Sistema de Combate

**Mecânicas:**
- Combate em turnos
- Barra de Essência (energia para técnicas)
- Sistema de desobediência (baseado em lealdade)
- AI com personalidades (agressiva, defensiva, etc)
- Visualização 3D das batalhas (opcional)

**Arquivos Principais:**
- `systems/combat.ts` - Lógica de combate
- `systems/combat-ai.ts` - IA dos oponentes
- `ui/battle-ui.ts` - Interface de batalha
- `3d/scenes/BattleScene3D.ts` - Cena 3D de batalha

### 3. Sistema de Progressão

**Calendário Real:**
- Sincronizado com horário de Brasília
- Sistema de dia/noite visual dinâmico
- Envelhecimento real das criaturas (baseado em dias reais)
- Eventos sazonais

**Rotina Semanal:**
- Treinar (aumenta atributos)
- Trabalhar (gera moedas)
- Descansar (reduz fadiga)
- Explorar (coleta itens raros)

### 4. Sistema 3D

**Cenas Implementadas:**
- **RanchScene3D**: Rancho 3D com criatura, terreno, vegetação
- **VillageScene3D**: Vila 3D com edifícios, NPCs, decorações
- **BattleScene3D**: Arena de batalha 3D
- **ImmersiveBattleScene3D**: Batalha imersiva com câmera dinâmica

**Features:**
- Estilo PS1 (low-poly, sem antialiasing)
- Sistema de iluminação dinâmica (dia/noite)
- Animações de criaturas
- Sistema de chuva e critters ambientais
- Fog e atmosfera

**Arquivos Principais:**
- `3d/ThreeScene.ts` - Classe base para cenas 3D
- `3d/scenes/*.ts` - Cenas específicas
- `3d/models/BeastModel.ts` - Modelos das criaturas
- `3d/materials/PS1Shader.ts` - Shader estilo PS1

### 5. Sistema de Inventário

**Itens:**
- Equipamentos
- Consumíveis
- Materiais de craft
- Relíquias de Eco

**Features:**
- Drag & drop
- Organização por categorias
- Sistema de stack
- Tooltips informativos

### 6. Sistema de Quests

**Tipos de Quests:**
- Main quests (história principal)
- Side quests (NPCs)
- Daily challenges
- Achievements

**Sistema de Progresso:**
- Tracking automático
- Recompensas
- Notificações

### 7. Sistema de Torneios

**Ligas:**
- Bronze
- Prata
- Ouro
- Mítico

**Mecânicas:**
- Ranking progressivo
- Recompensas por vitória
- Sistema de matchmaking

### 8. Sistema de Craft

**Features:**
- Receitas de craft
- Materiais de exploração
- Itens especiais
- Sistema de descoberta

### 9. Sistema de Exploração

**Features:**
- Locais exploráveis
- Materiais raros
- Eventos aleatórios
- Sistema de descoberta

### 10. Sistema de Relíquias de Eco

**Conceito:**
- Geração procedural de criaturas
- Entrada externa (música, texto, etc)
- Semente procedural única
- Criação de criaturas personalizadas

---

## 🎨 Assets e Recursos

### Assets 3D (GLB Models)

**Criaturas (10 linhas × múltiplas variações):**
- `assets/3d/beasts/Brontis/` - 9 modelos GLB
- `assets/3d/beasts/Feralis/` - 8 modelos GLB
- `assets/3d/beasts/Ignar/` - 9 modelos GLB
- `assets/3d/beasts/Mirella/` - 9 modelos GLB
- `assets/3d/beasts/Olgrim/` - 9 modelos GLB
- `assets/3d/beasts/Raukor/` - 9 modelos GLB
- `assets/3d/beasts/Sylphid/` - 9 modelos GLB
- `assets/3d/beasts/Terravox/` - 10 modelos GLB
- `assets/3d/beasts/Umbrix/` - 9 modelos GLB
- `assets/3d/beasts/Zephyra/` - 7 modelos GLB

**Total: ~87 modelos GLB de criaturas**

**Ambiente:**
- `assets/3d/Ranch/` - Casa, árvores, grama, rochas, lanternas, montanhas
- `assets/3d/Village/` - Templo, Taverna, Mercado, Craft, Dungeon, NPCs

**Total: ~107 modelos GLB no projeto**

### Assets 2D

- Ícones (192x192, 512x512)
- Sprites de referência
- UI elements

---

## 🛠️ Tecnologias Utilizadas

### Frontend

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| TypeScript | 5.3.3 | Linguagem principal |
| Vite | 5.1.0 | Build tool e dev server |
| Three.js | 0.180.0 | Renderização 3D |
| Socket.io-client | 4.8.1 | WebSocket client |
| Howler | 2.2.4 | Audio (planejado) |

### Backend

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Node.js | 18+ | Runtime |
| Express | 4.18.2 | Framework web |
| PostgreSQL | - | Banco de dados |
| Socket.io | 4.8.1 | WebSocket server |
| JWT | 9.0.2 | Autenticação |
| Passport.js | 0.7.0 | OAuth |

### Ferramentas

- **Git** - Controle de versão
- **Vercel** - Deploy frontend
- **Railway** - Deploy backend
- **PostgreSQL** - Banco de dados (Railway)

---

## ✨ Features Principais

### ✅ Implementadas

1. **Sistema de Autenticação**
   - Login/Registro
   - JWT tokens
   - OAuth Google (opcional)
   - Proteção de rotas

2. **Sistema de Criaturas Completo**
   - 10 linhas únicas
   - Atributos e estados
   - Sistema de envelhecimento
   - Visualização 3D

3. **Sistema de Combate**
   - Turnos
   - Barra de Essência
   - 40+ técnicas
   - AI inteligente

4. **Sistema 3D Completo**
   - Rancho 3D interativo
   - Vila 3D explorável
   - Batalhas 3D
   - Dia/noite dinâmico

5. **Sistema de Progressão**
   - Calendário real
   - Envelhecimento baseado em dias reais
   - Rotina semanal
   - Torneios

6. **Sistema de Persistência**
   - IndexedDB (offline-first)
   - Sync com servidor
   - Auto-save

7. **Sistema de UI Completo**
   - Canvas 2D para UI principal
   - Three.js para cenas 3D
   - Sistema de diálogos
   - Notificações

8. **Sistema de Chat**
   - WebSocket real-time
   - Canais
   - Histórico

9. **PWA Completo**
   - Service Worker
   - Manifest
   - Offline support
   - Instalável

10. **Sistema de Eventos Ambientais**
    - Critters (bichinhos voando)
    - Chuva dinâmica
    - NPCs caminhando
    - Efeitos atmosféricos

---

## 🔄 Possibilidades de Reutilização

### Sistemas Reutilizáveis (70%+ do código)

#### 1. **Sistema de Combate em Turnos** ⭐⭐⭐⭐⭐
- **Arquivos**: `systems/combat.ts`, `systems/combat-ai.ts`
- **Reutilização**: 95%
- **Adaptação**: Mudar técnicas por cartas, Essência por Mana
- **Uso**: Card games, RPGs turn-based, estratégia

#### 2. **Sistema 3D (Three.js)** ⭐⭐⭐⭐⭐
- **Arquivos**: `3d/ThreeScene.ts`, `3d/scenes/*.ts`
- **Reutilização**: 90%
- **Adaptação**: Trocar modelos, ajustar câmeras
- **Uso**: Qualquer jogo 3D web, visualizadores, demos

#### 3. **Sistema de UI (Canvas 2D)** ⭐⭐⭐⭐
- **Arquivos**: `ui/*.ts`, `ui-helper.ts`
- **Reutilização**: 85%
- **Adaptação**: Trocar temas, layouts
- **Uso**: Qualquer jogo 2D web, interfaces customizadas

#### 4. **Sistema de Persistência** ⭐⭐⭐⭐⭐
- **Arquivos**: `storage.ts`
- **Reutilização**: 100%
- **Adaptação**: Nenhuma
- **Uso**: Qualquer aplicação web que precise de save offline

#### 5. **Sistema de Autenticação** ⭐⭐⭐⭐
- **Arquivos**: `api/authApi.ts`, `server/src/controllers/authController.ts`
- **Reutilização**: 90%
- **Adaptação**: Trocar providers OAuth
- **Uso**: Qualquer app que precise de login

#### 6. **Sistema de Chat (WebSocket)** ⭐⭐⭐⭐
- **Arquivos**: `services/chatClient.ts`, `server/src/services/chatService.ts`
- **Reutilização**: 85%
- **Adaptação**: Trocar protocolo de mensagens
- **Uso**: Chat em tempo real, notificações, multiplayer

#### 7. **Sistema de Game Loop** ⭐⭐⭐⭐⭐
- **Arquivos**: `loop.ts`, `main.ts`
- **Reutilização**: 95%
- **Adaptação**: Ajustar timestep, adicionar sistemas
- **Uso**: Qualquer jogo web

#### 8. **Sistema de Dia/Noite** ⭐⭐⭐⭐
- **Arquivos**: `utils/day-night.ts`
- **Reutilização**: 100%
- **Adaptação**: Trocar timezone
- **Uso**: Qualquer jogo que precise de ciclo dia/noite

#### 9. **Sistema de Calendário Real** ⭐⭐⭐⭐
- **Arquivos**: `utils/day-night.ts`, `systems/calendar.ts`
- **Reutilização**: 100%
- **Adaptação**: Nenhuma
- **Uso**: Sistemas que precisam de calendário real

#### 10. **Sistema de Eventos** ⭐⭐⭐⭐
- **Arquivos**: `systems/events.ts`, `systems/game-events.ts`
- **Reutilização**: 80%
- **Adaptação**: Trocar tipos de eventos
- **Uso**: Sistema de eventos genérico

### Estrutura de Dados Reutilizável

#### Tipos TypeScript
- `types.ts` - Interfaces principais
- `shared/types.ts` - Tipos compartilhados
- **Reutilização**: 70-80% (ajustar campos específicos)

#### Banco de Dados
- Schema PostgreSQL bem estruturado
- Migrations organizadas
- **Reutilização**: 60-70% (ajustar tabelas específicas)

### Assets Reutilizáveis

#### Modelos 3D
- **107 modelos GLB** prontos para uso
- Estilo low-poly consistente
- **Reutilização**: 100% (trocar apenas se necessário)

#### Sistema de Materiais
- Shaders PS1-style
- Sistema de iluminação
- **Reutilização**: 90%

---

## 📊 Estatísticas do Projeto

### Código

- **Linhas de código**: ~15.000+ linhas TypeScript
- **Arquivos TypeScript**: ~134 arquivos
- **Sistemas principais**: 20+ sistemas
- **UI Components**: 29 componentes

### Assets

- **Modelos 3D**: 107 arquivos GLB
- **Criaturas**: 10 linhas × múltiplas variações
- **Ambientes**: 2 cenas principais (Ranch + Village)

### Funcionalidades

- **Sistemas de jogo**: 20+
- **Técnicas de combate**: 40+
- **Itens**: 100+
- **Quests**: 22+
- **Achievements**: 15+

---

## 🚀 Como Começar a Usar Este Projeto

### 1. Clonar e Instalar

```bash
git clone <repo-url>
cd vanilla-game
npm install
```

### 2. Configurar Ambiente

```bash
# Client
cd client
cp env.example .env
# Editar .env com suas configurações

# Server
cd server
cp env.example .env
# Editar .env com suas configurações (DB, JWT, etc)
```

### 3. Rodar em Desenvolvimento

```bash
# Root (roda client + server)
npm run dev

# Ou separadamente:
npm run dev:client
npm run dev:server
```

### 4. Build para Produção

```bash
npm run build
```

---

## 📚 Documentação Adicional

- **README.md** - Documentação principal
- **ARCHITECTURE.md** - Arquitetura detalhada
- **GDD.md** - Game Design Document
- **BATTLE-3D-SYSTEM.md** - Sistema de batalha 3D
- **3d/README-3D-SYSTEM.md** - Sistema 3D completo

---

## 🎯 Casos de Uso para Reutilização

### 1. Card Game (KARDUM)
- **Reutiliza**: Sistema de combate, UI, 3D, autenticação
- **Adapta**: Técnicas → Cartas, Essência → Mana
- **Novo**: Sistema de deck building

### 2. RPG Tático
- **Reutiliza**: Sistema 3D, combate, UI, persistência
- **Adapta**: Criaturas → Personagens, Técnicas → Habilidades
- **Novo**: Sistema de party, exploração de mapas

### 3. Simulador de Vida
- **Reutiliza**: Calendário real, dia/noite, persistência, UI
- **Adapta**: Criaturas → Personagens, Atributos → Stats
- **Novo**: Sistema de relacionamentos, trabalho

### 4. Visualizador 3D
- **Reutiliza**: Sistema 3D completo, Three.js setup
- **Adapta**: Trocar modelos, câmeras
- **Novo**: Sistema de apresentação

### 5. Multiplayer Game
- **Reutiliza**: WebSocket, autenticação, game loop, 3D
- **Adapta**: Adicionar sincronização de estado
- **Novo**: Sistema de matchmaking, rooms

---

## 💡 Conclusão

O **Guardian Grove** é um projeto completo e bem estruturado que oferece:

✅ **Sistemas robustos e reutilizáveis** (70%+ do código)  
✅ **Arquitetura escalável e modular**  
✅ **Assets 3D prontos para uso** (107 modelos)  
✅ **Documentação completa**  
✅ **Código TypeScript bem tipado**  
✅ **PWA completo e funcional**  
✅ **Backend REST + WebSocket**  

**Ideal para:**
- Criar novos jogos reutilizando sistemas
- Aprender arquitetura de jogos web
- Usar como base para projetos similares
- Estudo de Three.js e Canvas 2D
- Referência de PWA completo

---

**Última atualização**: Janeiro 2025  
**Versão**: 0.6.5  
**Status**: Em desenvolvimento ativo

