"use client";

import type { Task } from "@/lib/types";
import { toMinutes, endMinutesAdjusted } from "@/lib/time";

/**
 * Signature visuelle de FocusDay : la journée comme un ruban de temps.
 * Une ligne verticale de 6h à 24h, les tâches placées à leur créneau,
 * et un curseur "maintenant" qui glisse en temps réel.
 */
const DAY_START = 5 * 60;  // 05:00 — couvre les lève-tôt
const DAY_END = 24 * 60;   // minuit
const RANGE = DAY_END - DAY_START;

function pct(min: number): number {
  return Math.max(0, Math.min(100, ((min - DAY_START) / RANGE) * 100));
}

const STATUS_DOT: Record<string, string> = {
  planned: "var(--text-mute)",
  in_progress: "var(--color-amber)",
  done: "var(--color-mint)",
  missed: "var(--color-rose)",
};

export default function DayTimeline({ tasks, now }: { tasks: Task[]; now: number }) {
  const nowVisible = now >= DAY_START && now <= DAY_END;
  const hours = [5, 8, 11, 14, 17, 20, 23];

  return (
    <div style={{ display: "flex", gap: "0.75rem", height: 420 }}>
      {/* Axe des heures */}
      <div style={{ position: "relative", width: 40, flexShrink: 0 }}>
        {hours.map((h) => (
          <span
            key={h}
            style={{
              position: "absolute",
              top: `${pct(h * 60)}%`,
              right: 0,
              transform: "translateY(-50%)",
              fontSize: "0.7rem",
              color: "var(--text-mute)",
              fontFamily: "var(--font-display)",
            }}
          >
            {String(h).padStart(2, "0")}h
          </span>
        ))}
      </div>

      {/* Ruban */}
      <div
        style={{
          position: "relative",
          width: 8,
          flexShrink: 0,
          background: "var(--bg-3)",
          borderRadius: 999,
        }}
      >
        {/* Curseur maintenant */}
        {nowVisible && (
          <div
            style={{
              position: "absolute",
              top: `${pct(now)}%`,
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "var(--color-amber)",
              border: "3px solid var(--bg)",
              boxShadow: "0 0 0 3px color-mix(in srgb, var(--color-amber) 30%, transparent)",
              animation: "var(--animate-pulse-now)",
              zIndex: 3,
            }}
          />
        )}
        {/* Segments de tâches (celles dans la plage visible) */}
        {tasks.filter((t) => endMinutesAdjusted(t.start, t.end) > DAY_START).map((t) => {
          const top = pct(toMinutes(t.start));
          // pct() se clampe à 100 : un créneau nocturne s'arrête donc
          // visuellement à minuit sur le ruban du jour.
          const height = Math.max(2, pct(endMinutesAdjusted(t.start, t.end)) - top);
          return (
            <div
              key={t.id}
              title={`${t.name} (${t.start}–${t.end})`}
              style={{
                position: "absolute",
                top: `${top}%`,
                height: `${height}%`,
                left: -3,
                width: 14,
                borderRadius: 8,
                background: STATUS_DOT[t.status],
                opacity: t.status === "missed" ? 0.4 : 0.85,
                zIndex: 2,
              }}
            />
          );
        })}
      </div>

      {/* Étiquettes des tâches alignées à leur créneau */}
      <div style={{ position: "relative", flex: 1 }}>
        {tasks.map((t) => (
          <div
            key={t.id}
            style={{
              position: "absolute",
              top: `${pct(toMinutes(t.start))}%`,
              left: 0,
              right: 0,
              fontSize: "0.78rem",
              color: "var(--text-soft)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              paddingLeft: 4,
            }}
          >
            <span style={{ color: STATUS_DOT[t.status], marginRight: 6 }}>●</span>
            {t.name}
          </div>
        ))}
        {nowVisible && (
          <div
            style={{
              position: "absolute",
              top: `${pct(now)}%`,
              transform: "translateY(-50%)",
              fontSize: "0.72rem",
              fontWeight: 600,
              color: "var(--color-amber)",
              right: 0,
            }}
          >
            maintenant
          </div>
        )}
      </div>
    </div>
  );
}
