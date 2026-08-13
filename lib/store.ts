/**
 * Couche de stockage — abstraction volontaire.
 * Aujourd'hui : localStorage. Demain : pour brancher une vraie base
 * (Supabase, Firebase…), il suffit de réécrire CE fichier, sans
 * toucher au reste de l'app. C'est le même principe que le dossier
 * `content/` de Daba Glow : une seule source à changer.
 */

import type { Task, DebriefEntry } from "./types";
import { spillsIntoNextDay, shiftISO } from "./time";

const TASKS_KEY = "focusday.tasks";
const DEBRIEF_KEY = "focusday.debriefs";

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, value: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

/* ---------- Tâches ---------- */
export const taskStore = {
  all(): Task[] {
    return read<Task>(TASKS_KEY);
  },
  byDate(date: string): Task[] {
    const yesterday = shiftISO(date, -1);
    return read<Task>(TASKS_KEY)
      .filter(
        (t) =>
          !t.archived &&
          (t.date === date ||
            // tâche d'hier qui déborde sur aujourd'hui (créneau nocturne)
            (t.date === yesterday && spillsIntoNextDay(t.start, t.end)))
      )
      .sort((a, b) => {
        // les tâches nocturnes d'hier passent en tête : elles sont
        // "en cours" depuis avant minuit, donc antérieures dans la journée
        const key = (t: Task) => (t.date === date ? t.start : `-${t.start}`);
        return key(a).localeCompare(key(b));
      });
  },
  archived(): Task[] {
    return read<Task>(TASKS_KEY)
      .filter((t) => t.archived)
      .sort((a, b) => (b.archivedAt ?? "").localeCompare(a.archivedAt ?? ""));
  },
  save(task: Task): void {
    const tasks = read<Task>(TASKS_KEY);
    const i = tasks.findIndex((t) => t.id === task.id);
    if (i >= 0) tasks[i] = task;
    else tasks.push(task);
    write(TASKS_KEY, tasks);
  },
  remove(id: string): void {
    write(
      TASKS_KEY,
      read<Task>(TASKS_KEY).filter((t) => t.id !== id)
    );
  },
};

/* ---------- Débriefings ---------- */
export const debriefStore = {
  all(): DebriefEntry[] {
    return read<DebriefEntry>(DEBRIEF_KEY);
  },
  byDate(date: string): DebriefEntry | undefined {
    return read<DebriefEntry>(DEBRIEF_KEY).find((d) => d.date === date);
  },
  save(entry: DebriefEntry): void {
    const list = read<DebriefEntry>(DEBRIEF_KEY);
    const i = list.findIndex((d) => d.date === entry.date);
    if (i >= 0) list[i] = entry;
    else list.push(entry);
    write(DEBRIEF_KEY, list);
  },
};

export function uid(): string {
  // randomUUID : natif, sans collision, dispo navigateur (contexte sûr) + Node 16+.
  // Repli sur l'ancienne méthode pour les rares environnements sans Web Crypto.
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
