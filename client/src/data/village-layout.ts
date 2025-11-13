import type { NpcId } from '../types';
import type {
  VillageBuildingVariant,
  Vector3Like,
} from '../types/village';

export interface VillageBuildingBlueprint {
  id: string;
  icon: string;
  variant: VillageBuildingVariant;
  position: Vector3Like;
  rotation?: number;
  color: number;
  npcId?: NpcId;
  facilityId?: 'shop' | 'temple' | 'alchemy' | 'quests' | 'exploration' | 'dungeons' | 'achievements' | 'ranch';
  label: string;
  highlightColor?: number;
}

export const VILLAGE_BLUEPRINT: VillageBuildingBlueprint[] = [
  {
    id: 'facility:temple',
    icon: '🏛️',
    variant: 'temple',
    position: { x: 0, y: 0, z: -25 },
    color: 0xcbb5f5,
    npcId: 'liora',
    facilityId: 'temple',
    label: 'Templo dos Ecos',
    highlightColor: 0xf3e8ff,
  },
  {
    id: 'facility:shop',
    icon: '🛒',
    variant: 'shop',
    position: { x: -14, y: 0, z: 4 },
    color: 0xf5c06f,
    npcId: 'dalan',
    facilityId: 'shop',
    label: 'Mercado do Dalan',
    highlightColor: 0xfff3c4,
  },
  {
    id: 'facility:alchemy',
    icon: '⚗️',
    variant: 'alchemy',
    position: { x: 14, y: 0, z: 4 },
    color: 0x9f87ff,
    npcId: 'koran',
    facilityId: 'alchemy',
    label: 'Ateliê de Alquimia',
    highlightColor: 0xdcc8ff,
  },
  {
    id: 'facility:dungeon',
    icon: '🌀',
    variant: 'dungeon',
    position: { x: 0, y: 0, z: 15 },
    color: 0x4c6bd8,
    facilityId: 'dungeons',
    label: 'Portão das Profundezas',
    highlightColor: 0xbdd2ff,
  },
  {
    id: 'npc:ruvian',
    icon: '🧙',
    variant: 'house',
    position: { x: -18, y: 0, z: -9 },
    color: 0xd6c6a3,
    npcId: 'ruvian',
    label: 'Mestre Ruvian',
    highlightColor: 0xffeccc,
  },
  {
    id: 'npc:eryon',
    icon: '🎻',
    variant: 'tavern',
    position: { x: 12, y: 0, z: -10 },
    color: 0x8fbc8f,
    npcId: 'eryon',
    label: 'Taverna da Eryon',
    highlightColor: 0xdff5df,
  },
];
