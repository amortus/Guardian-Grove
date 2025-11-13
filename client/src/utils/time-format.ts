/**
 * Utilitários de Formatação de Tempo
 * Formata timestamps e durações para exibição
 */

/**
 * Formata duração em milissegundos para string legível
 */
export function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    const hrs = hours % 24;
    return `${days}d ${hrs}h`;
  } else if (hours > 0) {
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  } else if (minutes > 0) {
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Formata timestamp para data/hora em português (Brasília)
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formata timestamp para apenas hora (Brasília)
 */
export function formatHour(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Obtém data atual de Brasília
 */
export function getBrasiliaDate(): Date {
  return new Date(new Date().toLocaleString('en-US', {
    timeZone: 'America/Sao_Paulo',
  }));
}

