/**
 * Utilitaires de temps et de statut.
 * Le cœur du concept : dériver l'état d'une tâche depuis l'heure réelle.
 */

import type { Task, DayStats } from "./types";

export function todayISO(d = new Date()): string {
  // Date LOCALE (pas UTC) : sinon le soir, un utilisateur à l'ouest
  // verrait déjà le lendemain. On construit yyyy-mm-dd à la main.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** "09:30" -> minutes depuis minuit */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Une tâche traverse minuit si sa fin est <= son début
 * (ex: 22:00 -> 01:00). C'est le cas des créneaux nocturnes.
 * Note : "22:00 -> 00:00" est aussi <= au sens strict (0 <= 1320),
 * mais ne déborde sur AUCUNE heure du lendemain — voir spillsIntoNextDay.
 */
export function crossesMidnight(start: string, end: string): boolean {
  return toMinutes(end) <= toMinutes(start);
}

/**
 * Le créneau déborde-t-il vraiment sur le jour suivant ?
 * "22:00-00:00" se termine PILE à minuit (2h), mais rien ne se passe
 * le lendemain : ce n'est pas un vrai débordement, juste une fin à
 * l'heure ronde. "22:00-01:00" déborde réellement d'1h sur demain.
 * C'est cette distinction qui doit piloter le badge "+1j" et le fait
 * qu'une tâche reste visible sur "Ma journée" du lendemain.
 */
export function spillsIntoNextDay(start: string, end: string): boolean {
  const e = toMinutes(end);
  return e > 0 && e <= toMinutes(start);
}

/**
 * Minutes de fin, décalées de +24h si le créneau traverse minuit.
 * Permet de comparer start/end dans un même référentiel continu
 * au lieu de recomparer deux valeurs 0-1439 qui "rebouclent".
 */
export function endMinutesAdjusted(start: string, end: string): number {
  const s = toMinutes(start);
  const e = toMinutes(end);
  return e <= s ? e + 24 * 60 : e;
}

/** Durée réelle d'un créneau, y compris s'il traverse minuit. */
export function durationMinutes(start: string, end: string): number {
  return endMinutesAdjusted(start, end) - toMinutes(start);
}

/** "2026-08-01" décalé de N jours (peut être négatif) -> "yyyy-mm-dd" */
export function shiftISO(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return todayISO(d);
}

/**
 * "Maintenant", replacé dans le référentiel temporel de la tâche.
 * Si la tâche a été créée hier (elle déborde sur aujourd'hui), on décale
 * "maintenant" de +24h pour rester cohérent avec start/end de la tâche.
 */
export function nowRelativeTo(taskDate: string, now = nowMinutes(), today = todayISO()): number {
  return taskDate === today ? now : now + 24 * 60;
}

/** minutes depuis minuit, pour maintenant */
export function nowMinutes(d = new Date()): number {
  return d.getHours() * 60 + d.getMinutes();
}

/** Formate une durée en minutes -> "1 h 15" ou "40 min" */
export function formatDuration(min: number): string {
  const abs = Math.abs(Math.round(min));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h && m) return `${h} h ${String(m).padStart(2, "0")}`;
  if (h) return `${h} h`;
  return `${m} min`;
}

/**
 * Message de rappel selon la position de "maintenant" par rapport au créneau.
 * Retourne null si aucun rappel pertinent (tâche déjà commencée/terminée, ou loin).
 */
export function reminderFor(task: Task, rawNow = nowMinutes(), today = todayISO()): string | null {
  if (task.status === "done" || task.status === "in_progress") return null;
  const now = nowRelativeTo(task.date, rawNow, today);
  const start = toMinutes(task.start);
  const end = endMinutesAdjusted(task.start, task.end);
  const delta = start - now;

  if (delta > 0 && delta <= 15) {
    return `« ${task.name} » commence dans ${formatDuration(delta)}.`;
  }
  if (now >= start && now < end) {
    return `« ${task.name} » a commencé. Il reste ${formatDuration(end - now)} — tu l'as démarrée ?`;
  }
  if (now >= end && task.status === "planned") {
    return `Le créneau de « ${task.name} » est passé. Terminée, ou à reporter ?`;
  }
  return null;
}

/** Position temporelle d'une tâche : à venir, en cours (horaire), passée */
export function timePosition(
  task: Task,
  rawNow = nowMinutes(),
  today = todayISO()
): "upcoming" | "current" | "past" {
  const now = nowRelativeTo(task.date, rawNow, today);
  const start = toMinutes(task.start);
  const end = endMinutesAdjusted(task.start, task.end);
  if (now < start) return "upcoming";
  if (now >= end) return "past";
  return "current";
}

export function computeStats(tasks: Task[]): DayStats {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const missed = tasks.filter((t) => t.status === "missed").length;
  const planned = tasks.filter((t) => t.status === "planned").length;
  const successRate = total ? Math.round((done / total) * 100) : 0;
  return { total, done, inProgress, missed, planned, successRate };
}

/** Auto-bascule : une tâche "planned" dont le créneau est fini passe "missed" */
export function reconcileStatus(task: Task, rawNow = nowMinutes(), today = todayISO()): Task {
  const now = nowRelativeTo(task.date, rawNow, today);
  if (task.status === "planned" && now >= endMinutesAdjusted(task.start, task.end)) {
    return { ...task, status: "missed" };
  }
  return task;
}

const FR_DAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const FR_MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

export function prettyDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return `${FR_DAYS[d.getDay()]} ${d.getDate()} ${FR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Deux tâches se chevauchent-elles dans le temps ?
 * Gère les créneaux qui traversent minuit (ex: 22:00-01:00) en testant
 * la paire sur une fenêtre de 48h glissante (-24h / 0 / +24h) : ça évite
 * de rater un chevauchement à cause du "rebouclage" à minuit.
 */
export function overlaps(
  aStart: string, aEnd: string,
  bStart: string, bEnd: string
): boolean {
  const as = toMinutes(aStart), ae = endMinutesAdjusted(aStart, aEnd);
  const bs0 = toMinutes(bStart), be0 = endMinutesAdjusted(bStart, bEnd);
  return [-24 * 60, 0, 24 * 60].some((shift) => {
    const bs = bs0 + shift, be = be0 + shift;
    return as < be && bs < ae;
  });
}

/** Renvoie la 1re tâche existante qui chevauche le créneau donné (hors self). */
export function findConflict<T extends { id: string; start: string; end: string }>(
  tasks: T[],
  start: string, end: string, selfId?: string
): T | null {
  return (
    tasks.find(
      (t) => t.id !== selfId && overlaps(t.start, t.end, start, end)
    ) ?? null
  );
}
