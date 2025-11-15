/**
 * Sistema de Emotes e Comandos de Chat - Guardian Grove
 */

export interface ChatEmote {
  id: string;
  icon: string;
  name: string;
  command: string;
  animation?: string;
}

export const CHAT_EMOTES: ChatEmote[] = [
  { id: 'wave', icon: '👋', name: 'Acenar', command: '/wave', animation: 'wave' },
  { id: 'happy', icon: '😊', name: 'Feliz', command: '/happy' },
  { id: 'love', icon: '❤️', name: 'Amor', command: '/love' },
  { id: 'laugh', icon: '😂', name: 'Rir', command: '/laugh' },
  { id: 'cool', icon: '😎', name: 'Legal', command: '/cool' },
  { id: 'think', icon: '🤔', name: 'Pensar', command: '/think' },
  { id: 'sad', icon: '😢', name: 'Triste', command: '/sad' },
  { id: 'angry', icon: '😠', name: 'Bravo', command: '/angry' },
  { id: 'dance', icon: '💃', name: 'Dançar', command: '/dance', animation: 'dance' },
  { id: 'clap', icon: '👏', name: 'Aplaudir', command: '/clap' },
  { id: 'hi', icon: '🖐️', name: 'Oi', command: '/hi' },
  { id: 'bye', icon: '👋', name: 'Tchau', command: '/bye' },
  { id: 'yes', icon: '✅', name: 'Sim', command: '/yes' },
  { id: 'no', icon: '❌', name: 'Não', command: '/no' },
  { id: 'party', icon: '🎉', name: 'Festa', command: '/party' },
  { id: 'sleep', icon: '😴', name: 'Dormir', command: '/sleep' },
];

export const ECO_EMOTES: ChatEmote[] = [
  { id: 'recycle', icon: '♻️', name: 'Reciclar', command: '/recycle' },
  { id: 'plant', icon: '🌱', name: 'Plantar', command: '/plant' },
  { id: 'nature', icon: '🌿', name: 'Natureza', command: '/nature' },
  { id: 'earth', icon: '🌍', name: 'Terra', command: '/earth' },
  { id: 'tree', icon: '🌳', name: 'Árvore', command: '/tree' },
  { id: 'flower', icon: '🌸', name: 'Flor', command: '/flower' },
  { id: 'sun', icon: '☀️', name: 'Sol', command: '/sun' },
  { id: 'water', icon: '💧', name: 'Água', command: '/water' },
];

export const ALL_EMOTES = [...CHAT_EMOTES, ...ECO_EMOTES];

export interface ChatCommand {
  command: string;
  description: string;
  action: (args: string[]) => string | null;
}

export const CHAT_COMMANDS: ChatCommand[] = [
  {
    command: '/help',
    description: 'Mostra todos os comandos disponíveis',
    action: () => {
      const commands = CHAT_COMMANDS.map(c => `${c.command} - ${c.description}`).join('\n');
      return `📋 Comandos disponíveis:\n${commands}`;
    },
  },
  {
    command: '/emotes',
    description: 'Mostra todos os emotes',
    action: () => {
      const emotes = ALL_EMOTES.map(e => `${e.icon} ${e.command}`).join(' ');
      return `😊 Emotes: ${emotes}`;
    },
  },
  {
    command: '/time',
    description: 'Mostra o horário atual',
    action: () => {
      const now = new Date();
      return `🕐 ${now.toLocaleTimeString('pt-BR')}`;
    },
  },
  {
    command: '/status',
    description: 'Mostra seu status atual',
    action: () => {
      return `✨ Você está online no Guardian Grove Sanctuary!`;
    },
  },
  {
    command: '/clear',
    description: 'Limpa o chat',
    action: () => {
      return null; // Será tratado no UI
    },
  },
];

export function parseEmote(text: string): { text: string; emote: ChatEmote | null } {
  const emote = ALL_EMOTES.find(e => text.trim() === e.command);
  
  if (emote) {
    return { text: `${emote.icon} ${emote.name}`, emote };
  }
  
  return { text, emote: null };
}

export function parseCommand(text: string): string | null {
  const parts = text.trim().split(' ');
  const commandText = parts[0];
  const args = parts.slice(1);
  
  const command = CHAT_COMMANDS.find(c => c.command === commandText);
  
  if (command) {
    return command.action(args);
  }
  
  return null;
}

export function replaceBadWords(text: string): string {
  const badWords = ['palavra1', 'palavra2']; // Lista customizável
  let filtered = text;
  
  badWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filtered = filtered.replace(regex, '*'.repeat(word.length));
  });
  
  return filtered;
}

export interface QuickMessage {
  id: string;
  text: string;
  icon: string;
  category: 'greeting' | 'help' | 'thanks' | 'eco';
}

export const QUICK_MESSAGES: QuickMessage[] = [
  { id: 'hi', text: 'Olá!', icon: '👋', category: 'greeting' },
  { id: 'hello', text: 'Oi pessoal!', icon: '🖐️', category: 'greeting' },
  { id: 'bye', text: 'Até logo!', icon: '👋', category: 'greeting' },
  { id: 'thanks', text: 'Obrigado!', icon: '🙏', category: 'thanks' },
  { id: 'help_me', text: 'Alguém pode me ajudar?', icon: '❓', category: 'help' },
  { id: 'lets_play', text: 'Vamos jogar juntos!', icon: '🎮', category: 'help' },
  { id: 'great', text: 'Incrível!', icon: '🤩', category: 'thanks' },
  { id: 'eco_tip', text: 'Vamos salvar o planeta!', icon: '🌍', category: 'eco' },
  { id: 'recycle_tip', text: 'Não esqueça de reciclar!', icon: '♻️', category: 'eco' },
  { id: 'plant_tree', text: 'Plante uma árvore hoje!', icon: '🌳', category: 'eco' },
];

