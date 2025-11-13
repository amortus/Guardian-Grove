# WebSocket Server (Opcional)

Servidor WebSocket de exemplo para testar funcionalidades multiplayer/online.

## Como usar

### 1. Instalar dependências

```bash
cd server
npm install
```

### 2. Rodar servidor

```bash
npm start
```

Servidor inicia em `ws://localhost:8080`

### 3. Conectar do jogo

No `src/main.ts`, descomente:

```typescript
import { createWSClient } from './net';

const wsClient = createWSClient('ws://localhost:8080');
wsClient.on(data => console.log('Received:', data));
wsClient.connect();
```

## Funcionalidades

- ✅ Broadcast de mensagens para todos os clientes
- ✅ Reconexão automática no cliente
- ✅ JSON serialization automática
- ⚠️ Sem autenticação (apenas para desenvolvimento!)

## Expandir

Para produção, considere:

- **Autenticação**: JWT tokens
- **Rooms/Lobbies**: Separar jogadores por salas
- **State sync**: Sincronização de estado do jogo
- **Validação server-side**: Prevenir cheating
- **Database**: Persistir dados dos jogadores
- **Load balancing**: Múltiplas instâncias com Redis

Frameworks recomendados:
- [Socket.IO](https://socket.io/)
- [ws](https://github.com/websockets/ws) (usado aqui)
- [uWebSockets.js](https://github.com/uNetworking/uWebSockets.js)

