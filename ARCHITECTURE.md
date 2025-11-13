# 🏗️ Arquitetura do Projeto - Guardian Grove

Documentação técnica da estrutura e decisões de design.

## 📁 Estrutura de Diretórios

```
Guardian-Grove/
├── public/                    # Assets estáticos servidos diretamente
│   ├── index.html            # HTML principal (canvas fullscreen)
│   ├── manifest.webmanifest  # PWA manifest
│   ├── sw.js                 # Service Worker (cache offline)
│   └── assets/               # Sprites, ícones, áudio
│       ├── icon-192.png
│       ├── icon-512.png
│       └── player.png
│
├── src/                       # Código-fonte TypeScript
│   ├── main.ts               # Bootstrap e ciclo de vida
│   ├── loop.ts               # Game loop (timestep fixo)
│   ├── input.ts              # Sistema de input unificado
│   ├── rendering.ts          # Canvas2D renderer
│   ├── world.ts              # Lógica do jogo e física
│   ├── storage.ts            # IndexedDB (persistência)
│   ├── ui.ts                 # HUD minimalista
│   ├── net.ts                # WebSocket client (opcional)
│   └── math.ts               # Utilidades matemáticas
│
├── server/                    # WebSocket server (opcional)
│   ├── ws-server.ts          # Node + ws (broadcast simples)
│   ├── package.json
│   └── README.md
│
├── scripts/                   # Build e geração de assets
│   ├── generate-assets.mjs            # Gera PNGs (requer canvas)
│   ├── generate-assets-simple.mjs     # Gera SVGs
│   └── create-placeholder-assets.mjs  # Cria placeholders base64
│
├── .vscode/                   # Configuração do editor
│   ├── settings.json
│   └── extensions.json
│
├── package.json              # Dependências e scripts npm
├── tsconfig.json             # Configuração TypeScript
├── vite.config.ts            # Bundler config
├── .eslintrc.cjs             # Linter rules
├── .prettierrc               # Code formatter
├── .gitignore                # Git ignore patterns
├── LICENSE                   # MIT License
├── README.md                 # Documentação principal
├── QUICKSTART.md             # Guia rápido
├── CONTRIBUTING.md           # Guia de contribuição
└── ARCHITECTURE.md           # Este arquivo
```

---

## 🔄 Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                         main.ts                              │
│  (Bootstrap, registra SW, carrega assets, inicia loop)      │
└────────────┬────────────────────────────────────────────────┘
             │
             ├─────────────────────────────────────────────────┐
             │                                                  │
             v                                                  v
┌─────────────────────┐                           ┌─────────────────────┐
│      loop.ts        │                           │    storage.ts       │
│ ┌─────────────────┐ │                           │                     │
│ │ requestAnimFrame│ │                           │  IndexedDB API      │
│ └────────┬────────┘ │                           │  - save()           │
│          │          │                           │  - load()           │
│   accumulate dt     │                           │  - remove()         │
│          │          │                           └─────────────────────┘
│          v          │
│  ┌──────────────┐   │
│  │ Fixed Update │   │──────┐
│  └──────┬───────┘   │      │
│         │           │      │
│         v           │      v
│  ┌──────────────┐   │   ┌────────────────┐
│  │    Render    │   │   │   input.ts     │
│  └──────────────┘   │   │                │
└─────────┬───────────┘   │ - Teclado      │
          │               │ - Pointer      │
          │               │ - Virtual Joy  │
          │               └────────┬───────┘
          │                        │
          v                        v
┌─────────────────────────────────────────┐
│            world.ts                      │
│  ┌───────────────────────────────────┐  │
│  │ update(dt, input)                 │  │
│  │  - Move player                    │  │
│  │  - Check collisions (AABB)        │  │
│  │  - Update game state              │  │
│  └───────────────────────────────────┘  │
│                                          │
│  State:                                  │
│  - player: { pos, vel, xp, items }      │
│  - solids: [{ x, y, w, h }]             │
│  - time                                  │
└─────────────┬───────────────────────────┘
              │
              v
┌─────────────────────────────────────────┐
│          rendering.ts                    │
│  ┌───────────────────────────────────┐  │
│  │ draw(world)                       │  │
│  │  - Clear background               │  │
│  │  - Draw map/grid                  │  │
│  │  - Draw solids                    │  │
│  │  - Draw player sprite             │  │
│  │  - Debug overlay                  │  │
│  └───────────────────────────────────┘  │
│                                          │
│  Canvas2D:                               │
│  - fillRect(), drawImage()              │
│  - sprite cache                          │
└──────────────────────────────────────────┘
              │
              v
┌─────────────────────────────────────────┐
│              ui.ts                       │
│  ┌───────────────────────────────────┐  │
│  │ draw(world, perf)                 │  │
│  │  - FPS counter                    │  │
│  │  - Player position                │  │
│  │  - XP/stats                       │  │
│  │  - Instructions                   │  │
│  └───────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

---

## 🧩 Módulos Principais

### 1. `main.ts` - Bootstrap

**Responsabilidades:**
- Inicializar canvas e contexto 2D
- Registrar Service Worker
- Carregar assets (sprites)
- Criar sistemas (input, renderer, world, ui)
- Restaurar save do IndexedDB
- Criar e iniciar game loop
- Auto-save periódico
- Pausa automática em visibilitychange

**Dependências:**
- Todos os outros módulos

### 2. `loop.ts` - Game Loop

**Padrão:** Fixed Timestep com Acumulação

```typescript
while (accumulator >= dt) {
  update(dt);  // Sempre dt fixo (ex: 1/60)
  accumulator -= dt;
}

render(alpha);  // Interpola entre estados (opcional)
```

**Por quê?**
- Física determinística (independente do FPS)
- Evita "spiral of death" com limite de steps
- Smooth rendering mesmo com lags

**Referência:** [Fix Your Timestep](https://gafferongames.com/post/fix_your_timestep/)

### 3. `input.ts` - Sistema de Input

**Unifica:**
- Teclado (WASD + setas)
- Mouse/Touch (pointer events)
- Virtual joystick (mobile)

**Expõe:**
```typescript
axisX(): number  // -1 a 1
axisY(): number  // -1 a 1
pointer: { x, y, down, justPressed, justReleased }
```

**Decisões:**
- Pointer events em vez de mouse+touch separados (menos código)
- Virtual joystick só ativa com touch no lado esquerdo
- Normalização diagonal para velocidade consistente

### 4. `world.ts` - Lógica do Jogo

**Estado:**
```typescript
interface World {
  player: Player;
  solids: Solid[];  // Obstáculos
  time: number;
  debug: boolean;
}
```

**Física:**
- AABB (Axis-Aligned Bounding Box) collision
- Resolução por menor eixo de penetração
- Move X → Resolve X → Move Y → Resolve Y

**Serialização:**
- `serializeWorld()` → Objeto JSON para save
- `deserializeWorld()` → Restaura estado

### 5. `rendering.ts` - Renderizador

**Canvas2D:**
- `fillRect()` para sólidos
- `drawImage()` para sprites
- `strokeRect()` para debug

**Pipeline:**
1. Clear background
2. Draw grid/map
3. Draw solids
4. Draw player (com flip horizontal)
5. Draw debug overlay (se ativo)

**Otimizações:**
- Sprites em cache (Map)
- Evita realocações (reutiliza contextos)

### 6. `storage.ts` - Persistência

**IndexedDB nativo:**
```typescript
save(key, value)   // Promise<void>
load<T>(key)       // Promise<T | null>
remove(key)        // Promise<void>
```

**Por que IndexedDB?**
- Mais espaço que localStorage (50MB+ vs 5-10MB)
- Assíncrono (não bloqueia main thread)
- Estruturado (armazena objetos complexos)
- Offline-friendly

### 7. `ui.ts` - Interface

**HUD minimalista:**
- FPS (colorido por performance)
- Posição do player
- XP/stats
- Instruções

**Acessibilidade:**
- Texto com sombra para legibilidade
- Cores contrastantes
- Font monospace (números alinhados)

### 8. `net.ts` - WebSocket (Opcional)

**Features:**
- Reconexão exponencial com jitter
- JSON auto-serialization
- Event callback system

**Uso:**
```typescript
const ws = createWSClient('ws://localhost:8080');
ws.on(data => console.log(data));
ws.send({ type: 'ping' });
```

---

## 🔒 Service Worker (PWA)

### Estratégia de Cache

**Precache (install):**
- `/index.html`
- `/manifest.webmanifest`
- Assets essenciais (sprites, ícones)

**Runtime Cache (fetch):**
- Cache-first para assets
- Network-first para HTML
- Fallback para offline

**Cleanup (activate):**
- Remove caches antigos
- Mantém apenas versão atual

### Versionamento

```javascript
const CACHE_VERSION = 'v1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
```

Incrementar `v1 → v2` ao fazer deploy força limpeza de caches antigos.

---

## ⚡ Performance

### Otimizações Implementadas

1. **Timestep Fixo:** Lógica independente de FPS
2. **Object Reuse:** Evita `new Object()` em loops
3. **Canvas Pixelated:** `image-rendering: pixelated` (GPU acelera)
4. **Pausa Automática:** `visibilitychange` para background tabs
5. **Sprite Cache:** `Map<string, Sprite>` evita reloads
6. **Pointer Events:** Unifica mouse+touch (menos listeners)

### Métricas

- **FPS alvo:** 60 (ajustável)
- **Update rate:** 16.67ms (1/60)
- **Bundle size:** ~50KB (minified + gzipped)
- **First load:** <1s (com cache)

### Profiling

```typescript
// loop.ts expõe:
getPerf(): PerfInfo {
  fps: number,
  avgFrameTime: number,
  steps: number
}
```

Use Chrome DevTools:
- Performance tab → Record
- Identifique bottlenecks
- Otimize hot paths

---

## 🧪 Testes (Futuro)

### Estrutura Sugerida

```
tests/
├── unit/
│   ├── math.test.ts          # clamp, lerp, distance
│   ├── collision.test.ts     # AABB overlap
│   └── storage.test.ts       # IndexedDB mock
│
├── integration/
│   ├── game-loop.test.ts     # Loop com mock time
│   └── input.test.ts         # Simulate events
│
└── e2e/
    └── gameplay.spec.ts      # Playwright/Puppeteer
```

### Ferramentas

- **Vitest:** Unit tests (Vite-native)
- **Playwright:** E2E tests
- **@testing-library:** DOM testing

---

## 🔐 Segurança

### Client-Side

✅ **Implementado:**
- CSP headers via `<meta>` (se hospedar adicionar)
- HTTPS-only Service Worker
- Input sanitization (tipos TypeScript)

⚠️ **TODO:**
- Validação server-side (se multiplayer)
- Rate limiting (WebSocket)
- XSS protection (se adicionar user content)

---

## 📦 Build & Deploy

### Processo

```bash
npm run build
│
├─ tsc           # Compila TypeScript → JavaScript
│
└─ vite build    # Bundler:
    │
    ├─ Tree-shaking (remove código não usado)
    ├─ Minificação (Terser)
    ├─ Code splitting (chunks)
    └─ Asset hashing (cache busting)
```

### Output

```
dist/
├── index.html           # HTML otimizado
├── manifest.webmanifest
├── sw.js                # Service Worker
├── assets/
│   ├── index-[hash].js  # Bundle principal
│   ├── player-[hash].png
│   └── icons...
```

### Deploy Targets

- **Netlify:** `netlify deploy --prod --dir=dist`
- **Vercel:** `vercel --prod`
- **GitHub Pages:** Push `dist/` para branch `gh-pages`
- **Cloudflare Pages:** Conecte repo, build auto

---

## 🔮 Próximas Melhorias

### Features

- [ ] Sistema de níveis/mapas múltiplos
- [ ] Inimigos com IA (pathfinding)
- [ ] Itens coletáveis e inventário
- [ ] Sistema de diálogo/quests
- [ ] Audio (Web Audio API)
- [ ] Partículas e efeitos visuais
- [ ] Leaderboard (local/online)

### Técnicas

- [ ] ECS (Entity Component System)
- [ ] Spatial hashing para colisões
- [ ] WebGL renderer (upgrade do Canvas2D)
- [ ] Web Workers para física pesada
- [ ] WebAssembly para lógica crítica
- [ ] Delta compression para netcode

### Plataformas

- [ ] Desktop (Electron/Tauri)
- [ ] Steam (via Steamworks)
- [ ] Itch.io (web + download)
- [ ] iOS (PWA ou Capacitor)

---

## 📚 Recursos

### Web APIs
- [Canvas2D API](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)
- [Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events)

### Game Dev
- [Game Programming Patterns](https://gameprogrammingpatterns.com/)
- [Red Blob Games](https://www.redblobgames.com/)
- [Gaffer On Games](https://gafferongames.com/)

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TS Performance Tips](https://github.com/microsoft/TypeScript/wiki/Performance)

---

**Última atualização:** 2025

