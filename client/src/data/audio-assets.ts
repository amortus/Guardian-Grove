/**
 * Mapeamento de Assets de Áudio - Guardian Grove
 * 
 * Para adicionar sons reais:
 * 1. Baixe SFX de: https://freesound.org (CC0 License)
 * 2. Baixe música de: https://incompetech.com ou https://freemusicarchive.org (CC)
 * 3. Coloque em: /public/assets/audio/
 * 4. Atualize os paths abaixo
 */

export interface AudioAsset {
  id: string;
  name: string;
  path: string;
  volume: number;
  loop?: boolean;
  category: 'sfx' | 'music' | 'ambient';
}

// ===== MÚSICA DE FUNDO =====
export const MUSIC_TRACKS: AudioAsset[] = [
  {
    id: 'hub_theme',
    name: 'Guardian Grove Theme',
    path: '/assets/audio/music/hub_theme.mp3',
    volume: 0.3,
    loop: true,
    category: 'music',
  },
  {
    id: 'exploration_theme',
    name: 'Exploration Theme',
    path: '/assets/audio/music/exploration.mp3',
    volume: 0.3,
    loop: true,
    category: 'music',
  },
  {
    id: 'minigame_theme',
    name: 'Mini-Game Theme',
    path: '/assets/audio/music/minigame.mp3',
    volume: 0.25,
    loop: true,
    category: 'music',
  },
];

// ===== SOM AMBIENTE =====
export const AMBIENT_SOUNDS: AudioAsset[] = [
  {
    id: 'forest_ambient',
    name: 'Forest Ambience',
    path: '/assets/audio/ambient/forest.mp3',
    volume: 0.2,
    loop: true,
    category: 'ambient',
  },
  {
    id: 'birds',
    name: 'Bird Sounds',
    path: '/assets/audio/ambient/birds.mp3',
    volume: 0.15,
    loop: true,
    category: 'ambient',
  },
  {
    id: 'wind',
    name: 'Wind',
    path: '/assets/audio/ambient/wind.mp3',
    volume: 0.1,
    loop: true,
    category: 'ambient',
  },
];

// ===== EFEITOS SONOROS =====
export const SFX_ASSETS: AudioAsset[] = [
  {
    id: 'click',
    name: 'Click',
    path: '/assets/audio/sfx/click.mp3',
    volume: 0.5,
    category: 'sfx',
  },
  {
    id: 'success',
    name: 'Success',
    path: '/assets/audio/sfx/success.mp3',
    volume: 0.6,
    category: 'sfx',
  },
  {
    id: 'error',
    name: 'Error',
    path: '/assets/audio/sfx/error.mp3',
    volume: 0.5,
    category: 'sfx',
  },
  {
    id: 'card_flip',
    name: 'Card Flip',
    path: '/assets/audio/sfx/card_flip.mp3',
    volume: 0.4,
    category: 'sfx',
  },
  {
    id: 'match',
    name: 'Match',
    path: '/assets/audio/sfx/match.mp3',
    volume: 0.5,
    category: 'sfx',
  },
  {
    id: 'achievement',
    name: 'Achievement Unlocked',
    path: '/assets/audio/sfx/achievement.mp3',
    volume: 0.7,
    category: 'sfx',
  },
  {
    id: 'quest_complete',
    name: 'Quest Complete',
    path: '/assets/audio/sfx/quest_complete.mp3',
    volume: 0.6,
    category: 'sfx',
  },
  {
    id: 'level_up',
    name: 'Level Up',
    path: '/assets/audio/sfx/level_up.mp3',
    volume: 0.7,
    category: 'sfx',
  },
  {
    id: 'coin',
    name: 'Coin',
    path: '/assets/audio/sfx/coin.mp3',
    volume: 0.4,
    category: 'sfx',
  },
  {
    id: 'notification',
    name: 'Notification',
    path: '/assets/audio/sfx/notification.mp3',
    volume: 0.5,
    category: 'sfx',
  },
];

// ===== GUIA DE DOWNLOAD =====
export const AUDIO_DOWNLOAD_GUIDE = {
  freesound: {
    url: 'https://freesound.org',
    license: 'CC0 / CC-BY',
    recommendations: [
      'UI Click - Pesquise: "button click"',
      'Success Sound - Pesquise: "success jingle"',
      'Achievement - Pesquise: "achievement fanfare"',
      'Card Flip - Pesquise: "card flip paper"',
      'Coin - Pesquise: "coin pickup"',
      'Forest Ambient - Pesquise: "forest ambience"',
      'Birds - Pesquise: "birds chirping"',
    ],
  },
  incompetech: {
    url: 'https://incompetech.com/music/royalty-free/music.html',
    license: 'CC-BY 4.0',
    recommendations: [
      'Peaceful/Ambient - Categoria: "Ambient"',
      'Adventure - Categoria: "Adventure"',
      'Relaxing - Categoria: "Relaxing"',
    ],
  },
  freeMusicArchive: {
    url: 'https://freemusicarchive.org',
    license: 'CC0 / CC-BY',
    recommendations: [
      'Nature/Ambient music',
      'Relaxing instrumental',
    ],
  },
};

/**
 * Verifica se um asset de áudio existe
 */
export async function checkAudioAssetExists(path: string): Promise<boolean> {
  try {
    const response = await fetch(path, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Retorna fallback para áudio procedural se o asset não existir
 */
export function shouldUseFallback(assetId: string): boolean {
  // Por enquanto, sempre usa fallback procedural
  // Quando adicionar arquivos reais, remova esta função
  return true;
}

