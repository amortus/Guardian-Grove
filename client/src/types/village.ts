//! Tipos compartilhados para a Vila 3D interativa
//!
//! Define variantes de construções e a configuração usada para renderizar
//! cada edifício na cena 3D, permitindo que diferentes módulos (UI, cena 3D,
//! layout de dados) compartilhem a mesma estrutura sem dependências cíclicas.

export type VillageBuildingVariant =
  | 'house'
  | 'shop'
  | 'alchemy'
  | 'temple'
  | 'tavern'
  | 'guild'
  | 'dungeon';

export type VillageBuildingKind = 'npc' | 'facility';

export type VillageFacilityId =
  | 'shop'
  | 'temple'
  | 'alchemy'
  | 'quests'
  | 'exploration'
  | 'dungeons'
  | 'achievements'
  | 'ranch';

export interface Vector3Like {
  x: number;
  y: number;
  z: number;
}

export interface VillageBuildingConfig {
  id: string;
  label: string;
  icon: string;
  color: number;
  position: Vector3Like;
  rotation?: number;
  variant: VillageBuildingVariant;
  kind: VillageBuildingKind;
  npcId?: string;
  facilityId?: VillageFacilityId;
  isLocked?: boolean;
  highlightColor?: number;
}
