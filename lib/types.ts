/**
 * Types du domaine FocusDay
 */

export type TaskStatus = "planned" | "in_progress" | "done" | "missed";

export interface Task {
  id: string;
  date: string;        // "2026-08-01" — le jour de la tâche
  name: string;
  description?: string;
  why?: string;        // « pourquoi c'est important » — le cœur du concept
  start: string;       // "09:00"
  end: string;         // "10:30"
  status: TaskStatus;
  startedAt?: string;  // ISO — quand réellement commencée
  completedAt?: string;
  createdAt: string;   // ISO
  archived?: boolean;  // rangée hors de la journée active, sans être supprimée
  archivedAt?: string; // ISO
}

export interface DebriefEntry {
  date: string;                 // "2026-08-01"
  reachedGoals: boolean;        // ai-je atteint mes objectifs ?
  didMore: boolean;             // ai-je fait plus que prévu ?
  missingNote?: string;         // ce qui manque / ce que j'ai fait en plus
  mood?: 1 | 2 | 3 | 4 | 5;     // ressenti de la journée
  createdAt: string;
}

export interface DayStats {
  total: number;
  done: number;
  inProgress: number;
  missed: number;
  planned: number;
  successRate: number;          // 0–100
}
