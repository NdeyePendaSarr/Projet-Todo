"use client";

import { useEffect, useState, useCallback } from "react";
import type { Task } from "@/lib/types";
import { taskStore } from "@/lib/store";
import { prettyDate } from "@/lib/time";
import NavBar from "@/components/NavBar";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function ArchivePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [toDelete, setToDelete] = useState<Task | null>(null);

  const load = useCallback(() => setTasks(taskStore.archived()), []);
  useEffect(() => { load(); }, [load]);

  const unarchive = (t: Task) => {
    taskStore.save({ ...t, archived: false, archivedAt: undefined });
    load();
  };

  const confirmDelete = () => {
    if (toDelete) {
      taskStore.remove(toDelete.id);
      setToDelete(null);
      load();
    }
  };

  return (
    <>
      <NavBar />
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "1.5rem 1.25rem 4rem" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 700, marginBottom: "0.35rem" }}>
          Archives
        </h1>
        <p style={{ color: "var(--text-soft)", fontSize: "0.92rem", marginBottom: "1.5rem" }}>
          Les objectifs que tu as rangés. Tu peux les restaurer, ou les supprimer définitivement.
        </p>

        {tasks.length === 0 ? (
          <div className="card-surface" style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-mute)" }}>
            Aucun objectif archivé. Depuis « Ma journée », le bouton « Archiver » range un objectif ici.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {tasks.map((t) => (
              <div key={t.id} className="card-surface" style={{ padding: "0.9rem 1.1rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: "0.8rem", fontWeight: 600, color: "var(--color-brand)" }}>
                      {t.start}–{t.end}
                    </span>
                    <h3 style={{ fontSize: "0.98rem", fontWeight: 600 }}>{t.name}</h3>
                  </div>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-mute)", marginTop: 2 }}>
                    {prettyDate(t.date)}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="chip" onClick={() => unarchive(t)}>Restaurer</button>
                  <button className="chip chip-rose" onClick={() => setToDelete(t)}>Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Supprimer définitivement ?"
        message={toDelete ? `« ${toDelete.name} » sera supprimé pour de bon. Cette action est irréversible.` : ""}
        confirmLabel="Supprimer"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
