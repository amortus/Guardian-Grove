/**
 * Sistema de Recordes e Changelog - Guardian Grove
 */

// ===== RECORDES DE MINI-GAMES =====

export interface GameRecord {
  playerName: string;
  score: number;
  time?: number; // segundos
  moves?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  date: Date;
}

export interface MinigameRecords {
  memory: {
    bestTime: GameRecord[];
    bestMoves: GameRecord[];
    bestScore: GameRecord[];
  };
  // Futuros jogos aqui
}

export const MOCK_RECORDS: MinigameRecords = {
  memory: {
    bestTime: [
      { playerName: 'Guardião Rápido', score: 500, time: 18, moves: 16, difficulty: 'hard', date: new Date() },
      { playerName: 'Mestre Veloz', score: 450, time: 22, moves: 18, difficulty: 'hard', date: new Date() },
      { playerName: 'Flash Verde', score: 400, time: 25, moves: 20, difficulty: 'medium', date: new Date() },
    ],
    bestMoves: [
      { playerName: 'Mente Perfeita', score: 600, time: 35, moves: 12, difficulty: 'hard', date: new Date() },
      { playerName: 'Estrategista', score: 550, time: 40, moves: 14, difficulty: 'hard', date: new Date() },
      { playerName: 'Pensador', score: 500, time: 30, moves: 15, difficulty: 'medium', date: new Date() },
    ],
    bestScore: [
      { playerName: 'Campeão', score: 650, time: 20, moves: 14, difficulty: 'hard', date: new Date() },
      { playerName: 'Veterano', score: 600, time: 22, moves: 16, difficulty: 'hard', date: new Date() },
      { playerName: 'Experiente', score: 550, time: 25, moves: 18, difficulty: 'hard', date: new Date() },
    ],
  },
};

export function saveGameRecord(game: 'memory', category: 'bestTime' | 'bestMoves' | 'bestScore', record: GameRecord) {
  // TODO: Integrar com backend
  console.log(`[RECORDS] 🏆 Novo recorde em ${game} (${category}):`, record);
}

// ===== CHANGELOG / PATCH NOTES =====

export interface ChangelogEntry {
  version: string;
  date: string;
  type: 'major' | 'minor' | 'patch';
  title: string;
  changes: {
    category: 'new' | 'improved' | 'fixed' | 'removed';
    items: string[];
  }[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.0.0',
    date: '14/11/2024',
    type: 'major',
    title: 'Lançamento Guardian Grove!',
    changes: [
      {
        category: 'new',
        items: [
          '🌿 Hub 3D completo com Guardian Grove Sanctuary',
          '🎮 Jogo da Memória Ecológica com 12 cartas educativas',
          '🏆 Sistema de conquistas (31 conquistas)',
          '📚 Missões diárias e semanais',
          '🎰 Roleta diária com 16 recompensas',
          '🎖️ Leaderboard global com 6 categorias',
          '🗺️ Sistema de exploração com missões educativas',
          '🔨 Oficina de artesanato',
          '🛒 Sistema de mercado',
          '💬 Sistema de chat',
          '👥 Sistema de "ghosts" para ver outros jogadores',
        ],
      },
      {
        category: 'improved',
        items: [
          '✨ Gráficos 3D com Three.js',
          '🎨 Interface Canvas nativa',
          '🌳 Skybox animado com nuvens',
          '💡 Lanternas que acendem à noite',
        ],
      },
    ],
  },
  {
    version: '1.1.0',
    date: '14/11/2024',
    type: 'minor',
    title: 'Atualização de Polimento',
    changes: [
      {
        category: 'new',
        items: [
          '🎵 Sistema de áudio com efeitos sonoros',
          '💬 Diálogos educativos dos NPCs',
          '🌦️ Ciclo dia/noite dinâmico',
          '📊 Tutorial interativo para novos jogadores',
          '⌨️ Atalhos de teclado (I, C, H, M, G, A, L, R, ESC)',
          '🎨 Efeitos de partículas (conquistas, recompensas)',
          '🔔 Sistema de notificações in-game',
          '🎚️ Seletor de dificuldade nos mini-games',
          '🏆 Placar de recordes (melhor tempo/movimentos)',
          '🏅 Sistema de títulos e badges',
          '📸 Modo foto (tecla F)',
          '📱 Menu de ajuda completo',
          '🎯 Sistema de combo nos mini-games',
          '📊 Estatísticas detalhadas do perfil',
        ],
      },
      {
        category: 'improved',
        items: [
          '🎮 Mini-games agora contam para conquistas',
          '📚 Missões específicas para mini-games',
          '🌿 Balões de diálogo com dicas educacionais',
          '⚡ Performance otimizada',
        ],
      },
      {
        category: 'fixed',
        items: [
          '🐛 Correção de animação do personagem',
          '🐛 Ajustes de posicionamento de assets 3D',
          '🐛 Correção do sistema de ghosts',
        ],
      },
    ],
  },
];

export function getLatestChangelog(): ChangelogEntry {
  return CHANGELOG[CHANGELOG.length - 1];
}

export function hasUnreadChangelog(): boolean {
  const lastRead = localStorage.getItem('guardian_grove_last_changelog');
  const latest = getLatestChangelog();
  return lastRead !== latest.version;
}

export function markChangelogAsRead() {
  const latest = getLatestChangelog();
  localStorage.setItem('guardian_grove_last_changelog', latest.version);
}

