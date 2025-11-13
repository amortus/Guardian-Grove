/**
 * Theme tokens for the "crystal glass" UI overhaul.
 * These tokens centralize colors, radii, shadows and gradients so we can
 * keep the look consistent across every canvas-based UI module.
 */

export const GLASS_THEME = {
  palette: {
    background: '#040f1e',
    header: {
      gradient: ['rgba(15, 18, 32, 0.96)', 'rgba(10, 13, 24, 0.96)'],
      border: 'rgba(74, 85, 104, 0.55)',
    },
    panel: {
      gradient: ['rgba(16, 52, 90, 0.96)', 'rgba(8, 26, 48, 0.97)'],
      border: 'rgba(96, 185, 242, 0.42)',
    },
    popup: {
      gradient: ['rgba(18, 60, 104, 0.92)', 'rgba(6, 24, 44, 0.95)'],
      border: 'rgba(135, 205, 255, 0.62)',
    },
    input: {
      gradient: ['rgba(18, 48, 88, 0.9)', 'rgba(10, 28, 58, 0.94)'],
      border: 'rgba(120, 195, 255, 0.78)',
    },
    text: {
      primary: '#DDEBFA',
      secondary: 'rgba(168, 198, 226, 0.85)',
      muted: 'rgba(128, 154, 190, 0.68)',
      highlight: '#FFFFFF',
    },
    accent: {
      cyan: '#3CC2FF',
      cyanSoft: 'rgba(60, 194, 255, 0.26)',
      lilac: '#8DA8FF',
      purple: '#3F6EE3',
      emerald: '#4FE2B2',
      amber: '#FFCA66',
      danger: '#FF7A7A',
    },
    overlay: 'rgba(3, 7, 18, 0.65)',
  },
  radius: {
    sm: 10,
    md: 16,
    lg: 22,
    xl: 28,
    pill: 999,
  },
  shadow: {
    soft: { color: 'rgba(5, 15, 35, 0.55)', blur: 26, offsetX: 0, offsetY: 12 },
    heavy: { color: 'rgba(2, 6, 18, 0.8)', blur: 44, offsetX: 0, offsetY: 26 },
    button: { color: 'rgba(32, 110, 210, 0.5)', blur: 20, offsetX: 0, offsetY: 12 },
  },
  button: {
    gradient: {
      primary: ['rgba(54, 158, 255, 0.6)', 'rgba(26, 84, 176, 0.5)'],
      hover: ['rgba(72, 188, 255, 0.74)', 'rgba(32, 104, 198, 0.6)'],
      active: ['rgba(26, 72, 150, 0.8)', 'rgba(18, 48, 120, 0.7)'],
      disabled: ['rgba(20, 44, 74, 0.22)', 'rgba(14, 30, 54, 0.18)'],
    },
    border: {
      base: 'rgba(150, 205, 255, 0.78)',
      hover: 'rgba(195, 230, 255, 0.88)',
      active: 'rgba(135, 195, 255, 0.85)',
      disabled: 'rgba(110, 135, 170, 0.45)',
    },
    text: {
      base: '#F7FAFF',
      disabled: 'rgba(170, 190, 215, 0.55)',
    },
    droplet: 'rgba(255, 255, 255, 0.28)',
  },
  tabs: {
    gradient: {
      base: ['rgba(26, 78, 138, 0.5)', 'rgba(18, 48, 94, 0.4)'],
      active: ['rgba(44, 126, 198, 0.68)', 'rgba(28, 72, 150, 0.48)'],
    },
    border: {
      base: 'rgba(145, 205, 255, 0.72)',
      active: 'rgba(210, 245, 255, 0.94)',
    },
    underline: 'rgba(110, 195, 255, 0.92)',
    glow: 'rgba(68, 155, 255, 0.46)',
  },
  bar: {
    background: 'rgba(12, 34, 60, 0.52)',
    border: 'rgba(125, 190, 250, 0.58)',
    gradient: ['rgba(80, 174, 255, 0.86)', 'rgba(44, 118, 212, 0.74)'],
    success: ['rgba(78, 212, 158, 0.86)', 'rgba(44, 168, 126, 0.74)'],
    warning: ['rgba(252, 172, 72, 0.86)', 'rgba(230, 128, 44, 0.74)'],
    radius: 14,
    highlight: 'rgba(255, 255, 255, 0.28)',
  },
  overlay: {
    color: 'rgba(3, 7, 18, 0.65)',
  },
};

export type GlassPanelVariant = 'default' | 'header' | 'card' | 'popup' | 'input';

export function withAlpha(color: string, alpha: number): string {
  if (color.startsWith('rgba')) {
    const matches = color.match(/rgba?\(([^)]+)\)/);
    if (!matches) return color;
    const parts = matches[1].split(',').map((p) => p.trim());
    const [r, g, b] = parts;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  if (color.startsWith('rgb')) {
    const matches = color.match(/rgb\(([^)]+)\)/);
    if (!matches) return color;
    const parts = matches[1].split(',').map((p) => p.trim());
    const [r, g, b] = parts;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  const hex = color.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

