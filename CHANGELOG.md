# 📝 Changelog

Todas as mudanças notáveis neste projeto serão documentadas aqui.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto segue [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [1.0.0] - 2025-10-19

### ✨ Adicionado (Initial Release)

#### Core Features
- Game loop com timestep fixo (60 FPS) e acumulação
- Sistema de input unificado (teclado + mouse + touch)
- Virtual joystick para mobile
- Renderizador Canvas2D com sprites
- Física AABB para colisão
- Sistema de save/load com IndexedDB
- HUD minimalista (FPS, posição, XP, tempo)
- Pausa automática em `visibilitychange`

#### PWA
- Manifest completo para instalação
- Service Worker com cache offline-first
- Ícones 192x192 e 512x512
- Suporte total para Android/iOS

#### Networking (Opcional)
- Cliente WebSocket com reconexão exponencial
- Servidor demo Node.js + ws
- Serialização JSON automática

#### Developer Experience
- TypeScript strict mode
- ESLint + Prettier configurados
- Vite como bundler/dev server
- Hot reload no desenvolvimento
- Scripts de build otimizados

#### Documentação
- README completo (15+ seções)
- QUICKSTART para início rápido
- ARCHITECTURE com diagramas técnicos
- CONTRIBUTING com style guide
- EXAMPLES com snippets úteis
- PROJECT_SUMMARY executivo
- Este CHANGELOG

#### Assets
- 3 scripts de geração de assets:
  - `generate-assets.mjs` (canvas → PNG)
  - `generate-assets-simple.mjs` (SVG)
  - `create-placeholder-assets.mjs` (base64)
- Sprites placeholder incluídos

#### Outros
- LICENSE MIT
- .gitignore configurado
- .vscode settings (format on save)
- Suporte TWA documentado (Android)

### 🎮 Gameplay

- Movimento fluído com normalização diagonal
- Colisão sólida com 4 obstáculos de exemplo
- Sistema de XP (incremento automático de teste)
- Debug mode (tecla P)
- Grid visual de fundo

### 📊 Performance

- Bundle: ~50KB (minified + gzipped)
- FPS alvo: 60 (ajustável)
- First load: < 1s
- Offline-capable após primeiro load

---

## [Unreleased]

### 🔮 Planejado

#### Features
- [ ] Sistema de inimigos com IA
- [ ] Itens coletáveis
- [ ] Sistema de diálogo/NPCs
- [ ] Múltiplos níveis/mapas
- [ ] Sistema de som (Web Audio API)
- [ ] Partículas e efeitos visuais
- [ ] Leaderboard local
- [ ] Conquistas/achievements

#### Técnico
- [ ] Unit tests (Vitest)
- [ ] E2E tests (Playwright)
- [ ] WebGL renderer opcional
- [ ] ECS architecture (Entity Component System)
- [ ] Spatial hashing para colisões
- [ ] Web Workers para física

#### Plataformas
- [ ] Desktop build (Electron/Tauri)
- [ ] Steam integration
- [ ] Itch.io publish
- [ ] TWA build automatizado (CI/CD)

#### Multiplayer
- [ ] State synchronization
- [ ] Lag compensation
- [ ] Server-side validation
- [ ] Matchmaking simples
- [ ] Chat in-game

---

## Como Contribuir

Veja [CONTRIBUTING.md](CONTRIBUTING.md) para detalhes sobre:
- Como submeter pull requests
- Convenção de commits
- Style guide
- Checklist de PR

---

## Versionamento

- **Major (X.0.0)**: Mudanças incompatíveis na API
- **Minor (1.X.0)**: Novas features compatíveis
- **Patch (1.0.X)**: Bug fixes

---

**[1.0.0]**: https://github.com/SEU_USER/Guardian-Grove/releases/tag/v1.0.0

