# Guardian Grove 🎮

**Simulador de criação e treinamento de criaturas** com batalhas estratégicas em tempo real pausável.

Feito com **TypeScript puro** e **Web APIs** (sem engines/frameworks de jogo).

## 🌟 Sobre o Jogo

Em **Guardian Grove**, você é um Guardião Aprendiz no vilarejo de Vale Esmeralda. Sua missão é criar e treinar **Bestas** - criaturas místicas nascidas de **Relíquias de Eco** no Templo dos Ecos.

### Características Principais

- 🐾 **10 Linhas de Bestas** únicas com personalidades distintas
- ⚔️ **Sistema de Combate Tático** em turnos com barra de Essência
- 📅 **Ciclo de Vida Dinâmico** - suas criaturas envelhecem e morrem
- 🔮 **Geração Procedural** via Relíquias de Eco
- 🏆 **Torneios Progressivos** (Bronze → Prata → Ouro → Mítico)
- 💼 **Rotina Semanal** - Treinar, Trabalhar, Descansar ou Explorar
- 🧬 **Herança Espiritual** - passe traços e técnicas para próximas gerações
- 🎨 **Estilo Low-Poly** inspirado em PS1 com cores vibrantes

## ✨ Features

- 🎮 **Movimento fluído**: WASD/Setas + touch/virtual joystick
- 🧱 **Colisão AABB**: Física determinística com timestep fixo
- 💾 **Offline-first**: IndexedDB para save automático
- 📱 **PWA completo**: Instalável no Android/iOS
- 🌐 **Service Worker**: Cache inteligente para uso offline
- 🎯 **Responsivo**: Canvas full screen, touch-friendly
- ⚡ **Performance**: Loop otimizado 60Hz com acumulação
- 🔌 **WebSocket**: Cliente com reconexão (opcional)

## 📋 Requisitos

- **Node.js** v18+ (LTS recomendado)
- **npm** ou **yarn**
- Navegador moderno (Chrome, Firefox, Safari, Edge)

## 🚀 Instalação e Uso

### 1. Instalar dependências

```bash
cd Guardian-Grove
npm install
```

### 2. Gerar assets (ícones e sprites)

```bash
# Instala dependência para gerar PNGs
npm install canvas --save-dev

# Gera assets placeholder
npm run generate-assets
```

**Alternativa manual**: Se `canvas` não compilar, crie os arquivos manualmente:
- `public/assets/icon-192.png` (192x192)
- `public/assets/icon-512.png` (512x512)
- `public/assets/player.png` (32x32)

Use qualquer editor de imagem ou ferramentas online como [Pixlr](https://pixlr.com/br/e/).

### 3. Rodar em desenvolvimento

```bash
npm run dev
```

Abre automaticamente em `http://localhost:5173`

### 4. Build para produção

```bash
npm run build
```

Output: `dist/` (pronto para deploy)

### 5. Preview do build

```bash
npm run preview
```

## 🎮 Controles

### Teclado/Mouse
- **WASD** ou **Setas**: Mover personagem
- **P**: Toggle debug mode
- **Mouse**: Interações (futuro)

### Mobile/Touch
- **Touch lado esquerdo**: Virtual joystick
- **Touch direito**: Ações (futuro)

## 💾 Sistema de Save

- **Auto-save**: A cada 5 segundos
- **Save ao pausar**: Quando você sai ou minimiza o app
- **Persistência**: IndexedDB local (funciona offline)

**Resetar progresso**: Abra DevTools → Application → IndexedDB → `vanilla_game` → Delete

## 📱 PWA (Progressive Web App)

### Instalar no Desktop

1. Abra o jogo no Chrome/Edge
2. Clique no ícone de instalação (⊕) na barra de endereços
3. Ou vá em Menu → "Instalar aplicativo"

### Instalar no Mobile (Android/iOS)

**Android (Chrome):**
1. Abra o jogo
2. Menu → "Adicionar à tela inicial"
3. Confirme

**iOS (Safari):**
1. Abra o jogo
2. Botão de compartilhar → "Adicionar à Tela de Início"

### Testar Offline

1. Abra o jogo uma vez (para cachear)
2. DevTools → Application → Service Workers → "Offline"
3. Recarregue a página → Deve funcionar offline!

## 📦 Deploy

### Opção 1: Netlify (Recomendado)

```bash
# Build local
npm run build

# Instalar Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

### Opção 2: Vercel

```bash
npm install -g vercel
vercel --prod
```

### Opção 3: GitHub Pages

```bash
npm run build
# Commit a pasta dist/ e configure GitHub Pages para servir de /dist
```

### Opção 4: Servidor próprio

Qualquer servidor HTTP estático (nginx, Apache, Caddy):

```bash
npm run build
# Copie dist/* para /var/www/html ou equivalente
```

## 📲 Android App (TWA - Trusted Web Activity)

Converta o PWA em app Android nativo:

### 1. Instalar Bubblewrap CLI

```bash
npm install -g @bubblewrap/cli
```

### 2. Inicializar projeto TWA

```bash
bubblewrap init --manifest https://seu-dominio.com/manifest.webmanifest
```

Responda as perguntas:
- **App name**: Guardian Grove
- **Package name**: com.seudominio.beastkeepers
- **Host**: seu-dominio.com
- **Start URL**: /
- **Icon**: Use os ícones de `public/assets/`

### 3. Build do APK

```bash
# Debug (para testes)
bubblewrap build

# Produção (assinado)
bubblewrap build --release
```

### 4. Instalar no dispositivo

```bash
# Conecte o celular via USB com debug ativado
adb install app-release-signed.apk
```

### 5. Publicar na Play Store

1. Crie conta de desenvolvedor ($25 única vez)
2. Siga o wizard de upload do APK
3. Preencha metadados, screenshots, etc.
4. Envie para revisão

**Documentação completa**: [Bubblewrap Guide](https://github.com/GoogleChromeLabs/bubblewrap)

## 🔌 WebSocket (Multiplayer Opcional)

### Servidor de teste local

```bash
# Terminal 1: Start WS server
node server/ws-server.js

# Terminal 2: Start game
npm run dev
```

### Integrar no jogo

Descomente no `src/main.ts`:

```typescript
import { createWSClient } from './net';

const wsClient = createWSClient('ws://localhost:8080');

wsClient.on(data => {
  console.log('Received:', data);
  // Atualizar outros players, sincronizar estado, etc.
});

wsClient.connect();

// Enviar posição do player
setInterval(() => {
  wsClient.send({
    type: 'player_position',
    x: world.player.pos.x,
    y: world.player.pos.y,
  });
}, 100);
```

## ⚡ Performance Tips

### 1. Resolução lógica

Ajuste em `src/main.ts`:

```typescript
const logicalWidth = 800;  // Reduza para 640 ou 480
const logicalHeight = 600; // Reduza para 480 ou 360
```

Menor resolução = mais FPS, mas menos nítido.

### 2. Framerate alvo

Ajuste em `src/main.ts`:

```typescript
const loop = createLoop(
  60, // 30 para economizar bateria no mobile
  // ...
);
```

### 3. Pausa automática

Já implementado! O jogo pausa quando você minimiza/troca de aba.

### 4. Minimize alocações

Evite criar objetos novos em loops críticos:

```typescript
// ❌ Ruim
for (let i = 0; i < entities.length; i++) {
  const pos = { x: 0, y: 0 }; // Nova alocação a cada frame!
}

// ✅ Bom
const tempPos = { x: 0, y: 0 }; // Reutiliza
for (let i = 0; i < entities.length; i++) {
  tempPos.x = entities[i].x;
  tempPos.y = entities[i].y;
}
```

### 5. Pooling de objetos

Para partículas/projéteis, use object pooling (já preparado em `world.ts`).

## 🛠️ Desenvolvimento

### Estrutura de código

```
src/
  main.ts        # Bootstrap e ciclo de vida
  loop.ts        # Game loop com timestep fixo
  input.ts       # Sistema de input unificado
  rendering.ts   # Canvas2D renderer
  world.ts       # Lógica do jogo e física
  storage.ts     # IndexedDB (saves)
  ui.ts          # HUD (FPS, posição, etc.)
  net.ts         # Cliente WebSocket (opcional)
  math.ts        # Utilidades matemáticas
```

### Adicionar novos sistemas

1. **Inimigos**:
   - Adicione array `enemies: Enemy[]` em `World`
   - Implemente `updateEnemies()` em `world.ts`
   - Desenhe em `rendering.ts`

2. **Itens coletáveis**:
   - Array `items: Item[]` com posição
   - Detecção de colisão circular
   - Remova do array ao coletar

3. **Som**:
   - Use Web Audio API
   - Crie `audio.ts` com `playSound(id)`
   - Adicione toggle mudo na UI

### Linting & Formatting

```bash
npm run lint
npm run format
```

### Type checking

```bash
npm run typecheck
```

## 🎨 Customização

### Alterar cores/tema

Edite `src/rendering.ts`:

```typescript
// Background
ctx.fillStyle = '#0f1419'; // Seu hex aqui

// Grid
ctx.strokeStyle = '#1a202c';

// Player
ctx.fillStyle = '#48bb78';
```

### Adicionar sprites animados

```typescript
interface AnimatedSprite {
  frames: HTMLImageElement[];
  frameTime: number;
  currentFrame: number;
}

// Update no loop
sprite.currentFrame = Math.floor(world.time / sprite.frameTime) % sprite.frames.length;
```

### Criar mapa de tiles

```typescript
interface TileMap {
  tiles: number[][]; // Grid de IDs
  tilesheet: HTMLImageElement;
  tileSize: number;
}

function drawTileMap(ctx: CanvasRenderingContext2D, map: TileMap) {
  for (let y = 0; y < map.tiles.length; y++) {
    for (let x = 0; x < map.tiles[y].length; x++) {
      const tileId = map.tiles[y][x];
      const sx = (tileId % 8) * map.tileSize; // 8 tiles por linha
      const sy = Math.floor(tileId / 8) * map.tileSize;
      ctx.drawImage(
        map.tilesheet,
        sx, sy, map.tileSize, map.tileSize,
        x * map.tileSize, y * map.tileSize, map.tileSize, map.tileSize
      );
    }
  }
}
```

## ♿ Acessibilidade

- ✅ Controles alternativos (teclado + touch)
- ✅ Pausa automática ao perder foco
- ⚠️ Adicionar: modo high contrast
- ⚠️ Adicionar: legendas para efeitos sonoros

## 🐛 Troubleshooting

### Canvas não aparece
- Verifique que `#game` existe no HTML
- Confirme que JavaScript está habilitado
- Abra DevTools → Console para erros

### Service Worker não registra
- Só funciona em HTTPS ou localhost
- Limpe cache: DevTools → Application → Clear storage

### Save não persiste
- IndexedDB pode estar desabilitado (modo privado)
- Verifique permissões do navegador

### Jogo lento no mobile
- Reduza resolução lógica
- Diminua FPS alvo para 30
- Remova efeitos visuais complexos

### Assets não carregam
- Verifique caminhos: `/assets/player.png` (relativo à public/)
- Confirme que `npm run generate-assets` foi executado
- Inspecione Network tab no DevTools

## 📚 Recursos & Referências

### Web APIs
- [Canvas2D](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events)

### Game Dev
- [Fix Your Timestep](https://gafferongames.com/post/fix_your_timestep/)
- [AABB Collision](https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection)
- [Game Programming Patterns](https://gameprogrammingpatterns.com/)

### PWA
- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Trusted Web Activity](https://developer.chrome.com/docs/android/trusted-web-activity/)
- [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap)

## 📄 Licença

MIT License - Use livremente!

## 🙏 Créditos

Feito com TypeScript, Web APIs e ☕

---

**Divirta-se programando! 🚀**

