/**
 * Paleta de cores do Guardian Grove (versão vidro arcano)
 */

export const COLORS = {
  // Backgrounds base usados para contrastes gerais
  bg: {
    dark: '#030712',
    medium: '#05091A',
    light: '#0F172A',
  },

  // Primárias / acentos principais
  primary: {
    purple: '#7C3AED',
    purpleDark: '#5B21B6',
    green: '#22C55E',
    gold: '#FACC15',
    blue: '#38BDF8',
    red: '#F87171',
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
    fire: '#FB7185',
    water: '#38BDF8',
    earth: '#8B7355',
    air: '#94A3B8',
    shadow: '#1E293B',
    light: '#FACC15',
    ether: '#A855F7',
    moon: '#C4B5FD',
    blood: '#DC2626',
  },

  // UI (alerts, texto, etc.)
  ui: {
    success: '#22C55E',
    warning: '#F97316',
    error: '#F87171',
    info: '#38BDF8',
    text: '#F5F9FF',
    textDim: '#9CA3C2',
  },

  // Estados rápidos
  status: {
    happy: '#34D399',
    neutral: '#9CA3C2',
    sad: '#60A5FA',
    angry: '#F97316',
    tired: '#FACC15',
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

