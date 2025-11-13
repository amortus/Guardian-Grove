/**
 * Paleta de cores do Guardian Grove (versão vidro arcano)
 */

export const COLORS = {
  // Fundos base inspirados no santuário (tons de verde musgo)
  bg: {
    dark: '#0a1b13',
    medium: '#123522',
    light: '#1f4b2f',
  },

  // Paleta primária para elementos interativos
  primary: {
    forest: '#2ea05c',
    forestDark: '#1f7b44',
    grove: '#6fdd6a',
    amber: '#f4ca64',
    sky: '#68c5df',
    flame: '#f7876b',
    flameDark: '#d86a48',
    // aliases legados para manter compatibilidade com UIs antigas
    gold: '#f4ca64',
    purple: '#2ea05c',
    purpleDark: '#1f7b44',
    green: '#6fdd6a',
    blue: '#68c5df',
    red: '#f7876b',
    redDark: '#d86a48',
  },

  // Atributos principais (mantidos para lógica de jogo)
  attributes: {
    might: '#F87171',      // Força
    wit: '#A855F7',        // Astúcia
    focus: '#38BDF8',      // Foco
    agility: '#34D399',    // Agilidade
    ward: '#64748B',       // Resistência
    vitality: '#FB7185',   // Vitalidade
  },

  // Elementos mágicos
  elements: {
    fire: '#ff8a70',
    water: '#4fc1e4',
    earth: '#b58a55',
    air: '#9fb7cd',
    shadow: '#1c2b32',
    light: '#ffe587',
    ether: '#8a7ae6',
    moon: '#cdd5ff',
    blood: '#dd3e45',
  },

  // UI (alerts, texto, etc.)
  ui: {
    success: '#63d18d',
    warning: '#ffb454',
    error: '#f16d6d',
    info: '#6ac8e6',
    text: '#f9fff4',
    textDim: '#c3d8c6',
  },

  // Estados rápidos
  status: {
    happy: '#7ae686',
    neutral: '#a4c2b0',
    sad: '#7db4f2',
    angry: '#ff9b54',
    tired: '#ffd27f',
  },
};

/**
 * Converte hex para rgba
 */
export function hexToRgba(hex: string, alpha: number = 1): string {
  const normalized = hex.replace('#', '');
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

