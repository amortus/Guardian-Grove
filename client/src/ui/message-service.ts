export interface GameMessageOptions {
  title?: string;
  onClose?: () => void;
}

type MessageHandler = (message: string, options?: GameMessageOptions) => void;

let handler: MessageHandler | null = null;

/**
 * Registers a global message handler used to display in-game popups.
 * Should be called once from the main entry point after modal UI is ready.
 */
export function registerMessageHandler(fn: MessageHandler): void {
  handler = fn;
}

/**
 * Shows an in-game modal message. Falls back to console warning if no handler registered.
 */
export function showGameMessage(message: string, options?: GameMessageOptions): void {
  if (handler) {
    handler(message, options);
  } else {
    console.warn('[GameMessage] No handler registered. Message:', options?.title ?? 'Info', message);
  }
}

/**
 * Convenience helper for error messages.
 */
export function showGameError(message: string, onClose?: () => void): void {
  showGameMessage(message, {
    title: '⚠️ Erro',
    onClose,
  });
}

