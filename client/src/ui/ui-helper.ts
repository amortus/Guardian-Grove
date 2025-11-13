/**
 * Helpers para desenhar a nova UI em "vidro arcano"
 */

import { GLASS_THEME, GlassPanelVariant, withAlpha } from './theme';

type ShadowConfig = {
  color: string;
  blur: number;
  offsetX?: number;
  offsetY?: number;
};

type PanelOptions = {
  variant?: GlassPanelVariant;
  bgColor?: string;
  borderColor?: string;
  borderWidth?: number;
  alpha?: number;
  radius?: number;
  shadow?: boolean | ShadowConfig;
  highlightIntensity?: number;
};

type ButtonVariant = 'primary' | 'tab' | 'danger' | 'success' | 'ghost';

type ButtonOptions = {
  bgColor?: string;
  hoverColor?: string;
  textColor?: string;
  isHovered?: boolean;
  isDisabled?: boolean;
  fontSize?: number;
  variant?: ButtonVariant;
  isActive?: boolean;
  shadow?: boolean;
  flat?: boolean;
};

type BarOptions = {
  bgColor?: string;
  fillColor?: string;
  borderColor?: string;
  label?: string;
};

type RGBAColor = { r: number; g: number; b: number; a: number };

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const PANEL_VARIANTS: Record<GlassPanelVariant, { gradient: string[]; borderColor: string; radius: number; shadow: ShadowConfig; highlight: string }> = {
  default: {
    gradient: GLASS_THEME.palette.panel.gradient,
    borderColor: GLASS_THEME.palette.panel.border,
    radius: GLASS_THEME.radius.lg,
    shadow: GLASS_THEME.shadow.soft,
    highlight: 'rgba(255, 255, 255, 0.018)',
  },
  header: {
    gradient: GLASS_THEME.palette.header.gradient,
    borderColor: GLASS_THEME.palette.header.border,
    radius: 0,
    shadow: { color: 'rgba(3, 7, 18, 0.75)', blur: 32, offsetX: 0, offsetY: 20 },
    highlight: 'rgba(255, 255, 255, 0.012)',
  },
  card: {
    gradient: GLASS_THEME.palette.panel.gradient,
    borderColor: GLASS_THEME.palette.panel.border,
    radius: GLASS_THEME.radius.xl,
    shadow: GLASS_THEME.shadow.soft,
    highlight: 'rgba(255, 255, 255, 0.016)',
  },
  popup: {
    gradient: GLASS_THEME.palette.popup.gradient,
    borderColor: GLASS_THEME.palette.popup.border,
    radius: GLASS_THEME.radius.xl,
    shadow: GLASS_THEME.shadow.heavy,
    highlight: 'rgba(255, 255, 255, 0.019)',
  },
  input: {
    gradient: GLASS_THEME.palette.input.gradient,
    borderColor: GLASS_THEME.palette.input.border,
    radius: GLASS_THEME.radius.md,
    shadow: { color: 'rgba(12, 32, 72, 0.45)', blur: 18, offsetX: 0, offsetY: 8 },
    highlight: 'rgba(255, 255, 255, 0.023)',
  },
};

function parseColor(color: string): RGBAColor {
  if (color.startsWith('rgba')) {
    const matches = color.match(/rgba\(([^)]+)\)/);
    if (matches) {
      const [r, g, b, a] = matches[1].split(',').map((part) => parseFloat(part.trim()));
      return { r, g, b, a };
    }
  }

  if (color.startsWith('rgb')) {
    const matches = color.match(/rgb\(([^)]+)\)/);
    if (matches) {
      const [r, g, b] = matches[1].split(',').map((part) => parseFloat(part.trim()));
      return { r, g, b, a: 1 };
    }
  }

  const hex = color.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return { r, g, b, a: 1 };
}

function rgbaToString(color: RGBAColor): string {
  return `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${clamp(color.a, 0, 1)})`;
}

function lightenColor(color: RGBAColor, factor: number): RGBAColor {
  return {
    r: clamp(color.r + (255 - color.r) * factor, 0, 255),
    g: clamp(color.g + (255 - color.g) * factor, 0, 255),
    b: clamp(color.b + (255 - color.b) * factor, 0, 255),
    a: color.a,
  };
}

function darkenColor(color: RGBAColor, factor: number): RGBAColor {
  return {
    r: clamp(color.r * (1 - factor), 0, 255),
    g: clamp(color.g * (1 - factor), 0, 255),
    b: clamp(color.b * (1 - factor), 0, 255),
    a: color.a,
  };
}

function multiplyAlpha(color: RGBAColor, multiplier: number): RGBAColor {
  return { ...color, a: clamp(color.a * multiplier, 0, 1) };
}

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function buildGradientStops(altGradient: string[] | undefined, alphaMultiplier?: number): string[] {
  const stops = altGradient ?? GLASS_THEME.palette.panel.gradient;
  if (alphaMultiplier === undefined) {
    return stops;
  }
  return stops.map((stop) => {
    const rgba = parseColor(stop);
    return rgbaToString(multiplyAlpha(rgba, alphaMultiplier));
  });
}

/**
 * Desenha um painel de vidro com gradiente, brilho e borda suave.
 */
export function drawPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  options: PanelOptions = {},
): void {
  const variant = options.variant ?? 'default';
  const config = PANEL_VARIANTS[variant];
  const radius = options.radius ?? config.radius;
  const shadowConfig: ShadowConfig | undefined =
    options.shadow === false ? undefined : typeof options.shadow === 'object' ? options.shadow : config.shadow;

  const gradientStops = (() => {
    if (options.bgColor) {
      const base = parseColor(options.bgColor);
      const top = rgbaToString(lightenColor(multiplyAlpha(base, options.alpha ?? 1), 0.28));
      const bottom = rgbaToString(darkenColor(multiplyAlpha(base, options.alpha ?? 1), 0.32));
      return [top, bottom];
    }
    if (options.alpha !== undefined) {
    return buildGradientStops(config.gradient, options.alpha);
    }
    return config.gradient;
  })();

  const highlightColor = withAlpha(config.highlight, options.highlightIntensity ?? 1);

  ctx.save();
  if (shadowConfig) {
    ctx.shadowColor = shadowConfig.color;
    ctx.shadowBlur = shadowConfig.blur;
    ctx.shadowOffsetX = shadowConfig.offsetX ?? 0;
    ctx.shadowOffsetY = shadowConfig.offsetY ?? 10;
  }
  const gradient = ctx.createLinearGradient(0, y, 0, y + height);
  gradientStops.forEach((stop, index) => {
    gradient.addColorStop(index === 0 ? 0 : 1, stop);
  });
  roundedRectPath(ctx, x, y, width, height, radius);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundedRectPath(ctx, x, y, width, height, radius);
  ctx.clip();
  const highlightHeight = Math.max(4, height * 0.06);
  const highlight = ctx.createLinearGradient(0, y, 0, y + highlightHeight);
  highlight.addColorStop(0, highlightColor);
  highlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = highlight;
  ctx.fillRect(x, y, width, highlightHeight);
  ctx.restore();

  ctx.save();
  roundedRectPath(ctx, x, y, width, height, radius);
  ctx.lineWidth = options.borderWidth ?? 2;
  ctx.strokeStyle = options.borderColor ?? config.borderColor;
  ctx.stroke();
  ctx.restore();
}

/**
 * Desenha texto com anisotropia e sombra suave para leitura sobre vidro.
 */
export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: {
    color?: string;
    font?: string;
    align?: CanvasTextAlign;
    baseline?: CanvasTextBaseline;
    shadow?: boolean;
  } = {},
): void {
  const {
    color = GLASS_THEME.palette.text.primary,
    font = '16px monospace',
    align = 'left',
    baseline = 'top',
    shadow = true,
  } = options;

  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;

  if (shadow) {
    ctx.shadowColor = 'rgba(4, 12, 28, 0.55)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 3;
  }

  ctx.fillStyle = color;
  ctx.fillText(text, x, y);

  const needsOutline = (() => {
    const normalized = color.trim().toLowerCase();
    if (normalized === '#ffffff') return true;
    if (normalized === GLASS_THEME.button.text.base.toLowerCase()) return true;
    if (normalized === GLASS_THEME.palette.text.highlight.toLowerCase()) return true;
    if (normalized.startsWith('rgba')) {
      const match = normalized.match(/rgba\(([^)]+)\)/);
      if (match) {
        const parts = match[1].split(',').map((p) => p.trim());
        const r = parseFloat(parts[0] ?? '0');
        const g = parseFloat(parts[1] ?? '0');
        const b = parseFloat(parts[2] ?? '0');
        const a = parseFloat(parts[3] ?? '1');
        if (a < 0.05) return false;
        return r + g + b >= 690;
      }
    }
    if (normalized.startsWith('#')) {
      const hex = normalized.slice(1);
      if (hex.length === 6) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return r + g + b >= 690;
      }
    }
    return false;
  })();

  if (needsOutline) {
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.strokeText(text, x, y);
    ctx.restore();
  }

  if (shadow) {
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }
}

/**
 * Barra de progresso/atributo com look líquid glass.
 */
export function drawBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  current: number,
  max: number,
  options: BarOptions = {},
): void {
  const percentage = max === 0 ? 0 : clamp(current / max, 0, 1);
  const radius = Math.min(GLASS_THEME.bar.radius, height / 2);

  const baseBackground = options.bgColor ? parseColor(options.bgColor) : parseColor(GLASS_THEME.bar.background);
  const fillBaseColor = options.fillColor ? parseColor(options.fillColor) : parseColor(GLASS_THEME.bar.gradient[0]);
  const backgroundGradient = ctx.createLinearGradient(0, y, 0, y + height);
  backgroundGradient.addColorStop(0, rgbaToString(lightenColor(baseBackground, 0.15)));
  backgroundGradient.addColorStop(1, rgbaToString(darkenColor(baseBackground, 0.05)));

  ctx.save();
  roundedRectPath(ctx, x, y, width, height, radius);
  ctx.fillStyle = backgroundGradient;
  ctx.fill();
  ctx.restore();

  const fillWidth = width * percentage;
  if (fillWidth > 0) {
    const fillRadius = Math.min(radius, fillWidth / 2);
    const gradient = ctx.createLinearGradient(0, y, 0, y + height);
    const topColor = rgbaToString(lightenColor(fillBaseColor, 0.25));
    const bottomColor = rgbaToString(darkenColor(fillBaseColor, 0.25));
    gradient.addColorStop(0, topColor);
    gradient.addColorStop(1, bottomColor);

    ctx.save();
    roundedRectPath(ctx, x, y, fillWidth, height, fillRadius);
    ctx.fillStyle = gradient;
    ctx.fill();

    const highlight = ctx.createLinearGradient(0, y, 0, y + height * 0.6);
    highlight.addColorStop(0, GLASS_THEME.bar.highlight);
    highlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = highlight;
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  roundedRectPath(ctx, x, y, width, height, radius);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = options.borderColor ?? GLASS_THEME.bar.border;
  ctx.stroke();
  ctx.restore();

  if (options.label) {
    ctx.save();
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.strokeText(options.label, x + width / 2, y + height / 2);
    ctx.fillStyle = GLASS_THEME.palette.text.primary;
    ctx.fillText(options.label, x + width / 2, y + height / 2);
    ctx.restore();
  }
}

function resolveButtonBaseColor(options: ButtonOptions): RGBAColor {
  if (options.bgColor) {
    return parseColor(options.bgColor);
  }

  switch (options.variant) {
    case 'danger':
      return parseColor(GLASS_THEME.palette.accent.danger);
    case 'success':
      return parseColor(GLASS_THEME.palette.accent.emerald);
    case 'ghost':
      return parseColor('rgba(120, 160, 220, 0.4)');
    case 'tab':
      return parseColor(GLASS_THEME.palette.accent.cyan);
    default:
      return parseColor(GLASS_THEME.palette.accent.cyan);
  }
}

function resolveButtonBorder(options: ButtonOptions, isActive: boolean, isHovered: boolean): string {
  if (options.isDisabled) {
    return GLASS_THEME.button.border.disabled;
  }

  if (options.variant === 'tab') {
    return isActive ? GLASS_THEME.tabs.border.active : GLASS_THEME.tabs.border.base;
  }

  if (isActive) return GLASS_THEME.button.border.active;
  if (isHovered) return GLASS_THEME.button.border.hover;

  return GLASS_THEME.button.border.base;
}

/**
 * Botão estilizado com gradiente líquido.
 */
export function drawButton(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  text: string,
  options: ButtonOptions = {},
): void {
  const isHovered = options.isHovered ?? false;
  const isActive = options.isActive ?? false;
  const isDisabled = options.isDisabled ?? false;
  const fontSize = options.fontSize ?? 14;
  const variant = options.variant ?? 'primary';
  const radius = GLASS_THEME.radius.lg;
  const useShadow = options.shadow ?? true;
  const isFlat = options.flat ?? false;

  const baseColor = resolveButtonBaseColor(options);
  const lightenFactor = isFlat
    ? isActive
      ? 0.06
      : isHovered
        ? 0.08
        : 0.05
    : isActive
      ? 0.12
      : isHovered
        ? 0.18
        : 0.14;
  const darkenFactor = isFlat
    ? isActive
      ? 0.12
      : isHovered
        ? 0.1
        : 0.08
    : isActive
      ? 0.18
      : isHovered
        ? 0.14
        : 0.1;
  const [gradientTop, gradientBottom] = [
    rgbaToString(
      isDisabled
        ? lightenColor(parseColor('rgba(22, 36, 60, 0.36)'), 0.04)
        : lightenColor(baseColor, lightenFactor),
    ),
    rgbaToString(
      isDisabled
        ? parseColor('rgba(12, 24, 48, 0.22)')
        : darkenColor(baseColor, darkenFactor),
    ),
  ];

  ctx.save();
  if (!isDisabled && useShadow) {
    const shadow = GLASS_THEME.shadow.button;
    ctx.shadowColor = withAlpha(shadow.color, isHovered ? 0.95 : 0.75);
    ctx.shadowBlur = isFlat ? shadow.blur * 0.6 : shadow.blur;
    ctx.shadowOffsetX = shadow.offsetX ?? 0;
    ctx.shadowOffsetY = isFlat ? (shadow.offsetY ?? 10) * 0.6 : shadow.offsetY ?? 10;
  }
  const gradient = ctx.createLinearGradient(0, y, 0, y + height);
  gradient.addColorStop(0, gradientTop);
  gradient.addColorStop(1, gradientBottom);
  roundedRectPath(ctx, x, y, width, height, radius);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.restore();

  // Highlight droplet
  if (!isDisabled && !isFlat) {
    ctx.save();
    roundedRectPath(ctx, x, y, width, height, radius);
    ctx.clip();
    const droplet = ctx.createRadialGradient(x + width * 0.25, y + height * 0.25, 0, x + width * 0.25, y + height * 0.25, Math.max(width, height) * 0.9);
    droplet.addColorStop(0, GLASS_THEME.button.droplet);
    droplet.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.globalAlpha = isActive ? 0.7 : 1;
    ctx.fillStyle = droplet;
    ctx.fillRect(x, y, width, height);
    ctx.restore();
  }

  const borderColor = resolveButtonBorder(options, isActive, isHovered);

  ctx.save();
  roundedRectPath(ctx, x, y, width, height, radius);
  ctx.lineWidth = 2;
  ctx.strokeStyle = borderColor;
  ctx.stroke();
  ctx.restore();

  drawText(ctx, text, x + width / 2, y + height / 2, {
    align: 'center',
    baseline: 'middle',
    font: `bold ${fontSize}px monospace`,
    color: options.textColor ?? (isDisabled ? GLASS_THEME.button.text.disabled : GLASS_THEME.button.text.base),
    shadow: false,
  });

  if (variant === 'tab' && isActive) {
    ctx.save();
    ctx.fillStyle = withAlpha(GLASS_THEME.tabs.underline, 0.6);
    ctx.fillRect(x + 12, y + height - 4, width - 24, 2);
    ctx.restore();
  }
}

/**
 * Fundo de overlay translúcido para popups.
 */
export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  alpha: number = 1,
): void {
  ctx.save();
  const gradient = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.2, width / 2, height / 2, Math.max(width, height));
  const base = parseColor(GLASS_THEME.overlay.color);
  gradient.addColorStop(0, rgbaToString(multiplyAlpha(base, 0.9 * alpha)));
  gradient.addColorStop(1, rgbaToString(multiplyAlpha(base, 0.5 * alpha)));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

/**
 * Verifica se o mouse está sobre um retângulo.
 */
export function isMouseOver(
  mouseX: number,
  mouseY: number,
  x: number,
  y: number,
  width: number,
  height: number,
): boolean {
  return mouseX >= x && mouseX <= x + width && mouseY >= y && mouseY <= y + height;
}

/**
 * Quebra texto em múltiplas linhas respeitando largura máxima.
 */
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}
