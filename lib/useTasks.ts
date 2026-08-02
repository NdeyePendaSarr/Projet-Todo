"use client";

import { useCallback, useEffect, useState } from "react";
import type { Task, TaskStatus } from "@/lib/types";
import { taskStore, uid } from "@/lib/store";
import { todayISO, reconcileStatus, nowMinutes } from "@/lib/time";

/** Rafraîchit "maintenant" chaque minute pour faire vivre la timeline. */
export function useNow() {
  const [now, setNow] = useState(() => nowMinutes());
  useEffect(() => {
    const id = setInterval(() => setNow(nowMinutes()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function useTasks(date: string = todayISO()) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    const list = taskStore.byDate(date).map((t) => reconcileStatus(t));
    // persister les bascules auto planned -> missed
    list.forEach((t) => taskStore.save(t));
    setTasks(list);
  }, [date]);

  useEffect(() => {
    refresh();
    setReady(true);
  }, [refresh]);

  const addTask = useCallback(
    (data: Omit<Task, "id" | "status" | "createdAt" | "date">) => {
      const task: Task = {
        ...data,
        id: uid(),
        date,
        status: "planned",
        createdAt: new Date().toISOString(),
      };
      taskStore.save(task);
      refresh();
      return task;
    },
    [date, refresh]
  );

  const updateTask = useCallback(
    (id: string, patch: Partial<Task>) => {
      const current = taskStore.all().find((t) => t.id === id);
      if (!current) return;
      taskStore.save({ ...current, ...patch });
      refresh();
    },
    [refresh]
  );

  const setStatus = useCallback(
    (id: string, status: TaskStatus) => {
      const now = new Date().toISOString();
      const patch: Partial<Task> = { status };
      if (status === "in_progress") patch.startedAt = now;
      if (status === "done") patch.completedAt = now;
      updateTask(id, patch);
    },
    [updateTask]
  );

  const removeTask = useCallback(
    (id: string) => {
      taskStore.remove(id);
      refresh();
    },
    [refresh]
  );

  const archiveTask = useCallback(
    (id: string) => {
      updateTask(id, { archived: true, archivedAt: new Date().toISOString() });
    },
    [updateTask]
  );

  return { tasks, ready, addTask, updateTask, setStatus, removeTask, archiveTask, refresh };
}
