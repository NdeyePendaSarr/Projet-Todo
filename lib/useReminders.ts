"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Task } from "@/lib/types";
import { reminderFor, nowMinutes } from "@/lib/time";

type Permission = "default" | "granted" | "denied";

/**
 * Notifications de rappel. Niveau navigateur (Notification API) :
 * fonctionne quand l'onglet est ouvert. Architecture prête à recevoir
 * un vrai push serveur plus tard (il suffira de brancher un service worker).
 */
export function useReminders(tasks: Task[]) {
  const [permission, setPermission] = useState<Permission>("default");
  // mémorise les rappels déjà envoyés pour ne pas répéter (clé: jour+id+tranche)
  const sent = useRef<Set<string>>(new Set());
  // ref vers les tâches courantes : l'intervalle reste stable, pas recréé à chaque tick
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission as Permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return;
    const p = await Notification.requestPermission();
    setPermission(p as Permission);
  }, []);

  useEffect(() => {
    if (permission !== "granted") return;

    const check = () => {
      const now = nowMinutes();
      tasksRef.current.forEach((task) => {
        const msg = reminderFor(task, now);
        if (!msg) return;
        // une notif par tâche par tranche de 5 min pour éviter le spam
        // (la date évite toute collision si l'app reste ouverte plusieurs jours)
        const today = new Date().toDateString();
        const key = `${today}:${task.id}:${Math.floor(now / 5)}`;
        if (sent.current.has(key)) return;
        sent.current.add(key);
        // borne la taille pour éviter toute fuite mémoire sur longue session
        if (sent.current.size > 200) {
          sent.current = new Set(Array.from(sent.current).slice(-100));
        }
        try {
          new Notification("FocusDay", { body: msg, tag: task.id });
        } catch {
          /* ignore */
        }
      });
    };

    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [permission]);

  return { permission, requestPermission };
}
