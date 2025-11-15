/**
 * Sistema de Eventos Temporários - Guardian Grove
 */

export interface GameEvent {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'xp_boost' | 'currency_boost' | 'special_rewards' | 'limited_time';
  startDate: Date;
  endDate: Date;
  bonuses: {
    xpMultiplier?: number;
    coronasMultiplier?: number;
    specialRewards?: Array<{ id: string; name: string; icon: string }>;
  };
  isActive: boolean;
}

export const GAME_EVENTS: GameEvent[] = [
  {
    id: 'weekend_xp_boost',
    name: '🌟 Fim de Semana de XP Duplo!',
    description: 'Ganhe 2x XP em todas as atividades durante o fim de semana!',
    icon: '⭐',
    type: 'xp_boost',
    startDate: new Date('2024-11-15T00:00:00'),
    endDate: new Date('2024-11-17T23:59:59'),
    bonuses: { xpMultiplier: 2 },
    isActive: false,
  },
  {
    id: 'happy_hour',
    name: '💰 Hora Feliz: Coronas +50%',
    description: 'Ganhe 50% mais Coronas em todas as missões!',
    icon: '💎',
    type: 'currency_boost',
    startDate: new Date('2024-11-14T18:00:00'),
    endDate: new Date('2024-11-14T20:00:00'),
    bonuses: { coronasMultiplier: 1.5 },
    isActive: false,
  },
  {
    id: 'eco_week',
    name: '🌿 Semana da Sustentabilidade',
    description: 'Complete missões ecológicas para ganhar recompensas exclusivas!',
    icon: '♻️',
    type: 'special_rewards',
    startDate: new Date('2024-11-13T00:00:00'),
    endDate: new Date('2024-11-20T23:59:59'),
    bonuses: {
      specialRewards: [
        { id: 'eco_badge', name: 'Medalha Eco', icon: '🌱' },
        { id: 'green_cape', name: 'Capa Verde', icon: '🦸' },
      ],
    },
    isActive: false,
  },
  {
    id: 'game_jam_launch',
    name: '🎉 Lançamento Guardian Grove!',
    description: 'Evento de lançamento! Todos os jogadores ganham bônus de boas-vindas!',
    icon: '🎊',
    type: 'special_rewards',
    startDate: new Date('2024-11-14T00:00:00'),
    endDate: new Date('2024-11-21T23:59:59'),
    bonuses: {
      xpMultiplier: 1.5,
      coronasMultiplier: 1.5,
      specialRewards: [
        { id: 'founder_badge', name: 'Medalha de Fundador', icon: '👑' },
      ],
    },
    isActive: false,
  },
];

export function getActiveEvents(): GameEvent[] {
  const now = new Date();
  
  return GAME_EVENTS.map(event => ({
    ...event,
    isActive: now >= event.startDate && now <= event.endDate,
  })).filter(e => e.isActive);
}

export function getUpcomingEvents(): GameEvent[] {
  const now = new Date();
  
  return GAME_EVENTS.filter(event => now < event.startDate)
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    .slice(0, 3);
}

export function getEventMultipliers(): { xp: number; coronas: number } {
  const activeEvents = getActiveEvents();
  
  let xpMultiplier = 1;
  let coronasMultiplier = 1;
  
  activeEvents.forEach(event => {
    if (event.bonuses.xpMultiplier) {
      xpMultiplier = Math.max(xpMultiplier, event.bonuses.xpMultiplier);
    }
    if (event.bonuses.coronasMultiplier) {
      coronasMultiplier = Math.max(coronasMultiplier, event.bonuses.coronasMultiplier);
    }
  });
  
  return { xp: xpMultiplier, coronas: coronasMultiplier };
}

export function hasActiveEvent(): boolean {
  return getActiveEvents().length > 0;
}

export function getEventTimeRemaining(event: GameEvent): string {
  const now = new Date();
  const diff = event.endDate.getTime() - now.getTime();
  
  if (diff <= 0) return 'Encerrado';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h restantes`;
  if (hours > 0) return `${hours}h ${minutes}m restantes`;
  return `${minutes}m restantes`;
}
