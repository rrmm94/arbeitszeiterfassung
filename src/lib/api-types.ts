export type DayStatus = "KRANK" | "URLAUB" | "FEIERTAG" | "FERIEN" | "WOCHENENDE" | "WERKTAG";

export interface SchoolSegmentDTO {
  id?: number;
  start: string;
  end: string;
  isExtra: boolean;
  reason?: string | null;
}

export interface HomeSegmentDTO {
  id?: number;
  start: string;
  end: string;
  categoryId: number;
  description?: string | null;
  category?: { id: number; name: string; color: string };
}

export interface DayEntryDTO {
  id: number;
  date: string;
  breakMinutes: number;
  blocksOverride: number | null;
  blocksOverrideReason: string | null;
  noTeachingReason: string | null;
  scheduleNote: string | null;
  note: string | null;
  schoolSegments: SchoolSegmentDTO[];
  homeSegments: HomeSegmentDTO[];
}

export interface DayComputedDTO {
  date: string;
  status: DayStatus;
  statusLabel?: string;
  weekNumber: number;
  isSchoolDay: boolean;
  schoolMinutes: number;
  breakMinutes: number;
  homeMinutes: number;
  homeMinutesByCategory: Record<number, number>;
  nettoMinutes: number;
  nettoHours: number;
  blocksWorked: number;
  blocksSoll: number;
  bereitschaftBlocks: number;
  sollMinutes: number;
  sollHours: number;
  diffHours: number;
  hasEntry: boolean;
  noTeachingReason: string | null;
}

export interface SuggestedPlanDTO {
  segments: { start: string; end: string }[];
  breakMinutes: number;
  blocksSoll: number;
  bereitschaftBlocks: number;
}

export interface DayResponseDTO {
  entry: DayEntryDTO | null;
  computed: DayComputedDTO;
  suggested: SuggestedPlanDTO | null;
  weekday: number;
  halfYear: "HY1" | "HY2";
}

export interface WorkCategoryDTO {
  id: number;
  name: string;
  color: string;
  archived: boolean;
  sortOrder: number;
}
