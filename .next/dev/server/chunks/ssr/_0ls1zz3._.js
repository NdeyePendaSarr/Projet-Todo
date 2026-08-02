module.exports = [
"[project]/lib/time.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Utilitaires de temps et de statut.
 * Le cœur du concept : dériver l'état d'une tâche depuis l'heure réelle.
 */ __turbopack_context__.s([
    "computeStats",
    ()=>computeStats,
    "crossesMidnight",
    ()=>crossesMidnight,
    "durationMinutes",
    ()=>durationMinutes,
    "endMinutesAdjusted",
    ()=>endMinutesAdjusted,
    "findConflict",
    ()=>findConflict,
    "formatDuration",
    ()=>formatDuration,
    "nowMinutes",
    ()=>nowMinutes,
    "nowRelativeTo",
    ()=>nowRelativeTo,
    "overlaps",
    ()=>overlaps,
    "prettyDate",
    ()=>prettyDate,
    "reconcileStatus",
    ()=>reconcileStatus,
    "reminderFor",
    ()=>reminderFor,
    "shiftISO",
    ()=>shiftISO,
    "spillsIntoNextDay",
    ()=>spillsIntoNextDay,
    "timePosition",
    ()=>timePosition,
    "toMinutes",
    ()=>toMinutes,
    "todayISO",
    ()=>todayISO
]);
function todayISO(d = new Date()) {
    // Date LOCALE (pas UTC) : sinon le soir, un utilisateur à l'ouest
    // verrait déjà le lendemain. On construit yyyy-mm-dd à la main.
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}
function toMinutes(hhmm) {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
}
function crossesMidnight(start, end) {
    return toMinutes(end) <= toMinutes(start);
}
function spillsIntoNextDay(start, end) {
    const e = toMinutes(end);
    return e > 0 && e <= toMinutes(start);
}
function endMinutesAdjusted(start, end) {
    const s = toMinutes(start);
    const e = toMinutes(end);
    return e <= s ? e + 24 * 60 : e;
}
function durationMinutes(start, end) {
    return endMinutesAdjusted(start, end) - toMinutes(start);
}
function shiftISO(iso, days) {
    const d = new Date(iso + "T00:00:00");
    d.setDate(d.getDate() + days);
    return todayISO(d);
}
function nowRelativeTo(taskDate, now = nowMinutes(), today = todayISO()) {
    return taskDate === today ? now : now + 24 * 60;
}
function nowMinutes(d = new Date()) {
    return d.getHours() * 60 + d.getMinutes();
}
function formatDuration(min) {
    const abs = Math.abs(Math.round(min));
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    if (h && m) return `${h} h ${String(m).padStart(2, "0")}`;
    if (h) return `${h} h`;
    return `${m} min`;
}
function reminderFor(task, rawNow = nowMinutes(), today = todayISO()) {
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
function timePosition(task, rawNow = nowMinutes(), today = todayISO()) {
    const now = nowRelativeTo(task.date, rawNow, today);
    const start = toMinutes(task.start);
    const end = endMinutesAdjusted(task.start, task.end);
    if (now < start) return "upcoming";
    if (now >= end) return "past";
    return "current";
}
function computeStats(tasks) {
    const total = tasks.length;
    const done = tasks.filter((t)=>t.status === "done").length;
    const inProgress = tasks.filter((t)=>t.status === "in_progress").length;
    const missed = tasks.filter((t)=>t.status === "missed").length;
    const planned = tasks.filter((t)=>t.status === "planned").length;
    const successRate = total ? Math.round(done / total * 100) : 0;
    return {
        total,
        done,
        inProgress,
        missed,
        planned,
        successRate
    };
}
function reconcileStatus(task, rawNow = nowMinutes(), today = todayISO()) {
    const now = nowRelativeTo(task.date, rawNow, today);
    if (task.status === "planned" && now >= endMinutesAdjusted(task.start, task.end)) {
        return {
            ...task,
            status: "missed"
        };
    }
    return task;
}
const FR_DAYS = [
    "dimanche",
    "lundi",
    "mardi",
    "mercredi",
    "jeudi",
    "vendredi",
    "samedi"
];
const FR_MONTHS = [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre"
];
function prettyDate(iso) {
    const d = new Date(iso + "T00:00:00");
    return `${FR_DAYS[d.getDay()]} ${d.getDate()} ${FR_MONTHS[d.getMonth()]}`;
}
function overlaps(aStart, aEnd, bStart, bEnd) {
    const as = toMinutes(aStart), ae = endMinutesAdjusted(aStart, aEnd);
    const bs0 = toMinutes(bStart), be0 = endMinutesAdjusted(bStart, bEnd);
    return [
        -24 * 60,
        0,
        24 * 60
    ].some((shift)=>{
        const bs = bs0 + shift, be = be0 + shift;
        return as < be && bs < ae;
    });
}
function findConflict(tasks, start, end, selfId) {
    return tasks.find((t)=>t.id !== selfId && overlaps(t.start, t.end, start, end)) ?? null;
}
}),
"[project]/lib/store.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Couche de stockage — abstraction volontaire.
 * Aujourd'hui : localStorage. Demain : pour brancher une vraie base
 * (Supabase, Firebase…), il suffit de réécrire CE fichier, sans
 * toucher au reste de l'app. C'est le même principe que le dossier
 * `content/` de Daba Glow : une seule source à changer.
 */ __turbopack_context__.s([
    "debriefStore",
    ()=>debriefStore,
    "taskStore",
    ()=>taskStore,
    "uid",
    ()=>uid
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$time$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/time.ts [app-ssr] (ecmascript)");
;
const TASKS_KEY = "focusday.tasks";
const DEBRIEF_KEY = "focusday.debriefs";
function read(key) {
    if ("TURBOPACK compile-time truthy", 1) return [];
    //TURBOPACK unreachable
    ;
}
function write(key, value) {
    if ("TURBOPACK compile-time truthy", 1) return;
    //TURBOPACK unreachable
    ;
}
const taskStore = {
    all () {
        return read(TASKS_KEY);
    },
    byDate (date) {
        const yesterday = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$time$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["shiftISO"])(date, -1);
        return read(TASKS_KEY).filter((t)=>!t.archived && (t.date === date || t.date === yesterday && (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$time$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["spillsIntoNextDay"])(t.start, t.end))).sort((a, b)=>{
            // les tâches nocturnes d'hier passent en tête : elles sont
            // "en cours" depuis avant minuit, donc antérieures dans la journée
            const key = (t)=>t.date === date ? t.start : `-${t.start}`;
            return key(a).localeCompare(key(b));
        });
    },
    archived () {
        return read(TASKS_KEY).filter((t)=>t.archived).sort((a, b)=>(b.archivedAt ?? "").localeCompare(a.archivedAt ?? ""));
    },
    save (task) {
        const tasks = read(TASKS_KEY);
        const i = tasks.findIndex((t)=>t.id === task.id);
        if (i >= 0) tasks[i] = task;
        else tasks.push(task);
        write(TASKS_KEY, tasks);
    },
    remove (id) {
        write(TASKS_KEY, read(TASKS_KEY).filter((t)=>t.id !== id));
    }
};
const debriefStore = {
    all () {
        return read(DEBRIEF_KEY);
    },
    byDate (date) {
        return read(DEBRIEF_KEY).find((d)=>d.date === date);
    },
    save (entry) {
        const list = read(DEBRIEF_KEY);
        const i = list.findIndex((d)=>d.date === entry.date);
        if (i >= 0) list[i] = entry;
        else list.push(entry);
        write(DEBRIEF_KEY, list);
    }
};
function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
}),
"[project]/lib/useTasks.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useNow",
    ()=>useNow,
    "useTasks",
    ()=>useTasks
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/store.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$time$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/time.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
function useNow() {
    const [now, setNow] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$time$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["nowMinutes"])());
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const id = setInterval(()=>setNow((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$time$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["nowMinutes"])()), 30_000);
        return ()=>clearInterval(id);
    }, []);
    return now;
}
function useTasks(date = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$time$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["todayISO"])()) {
    const [tasks, setTasks] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [ready, setReady] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const refresh = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        const list = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["taskStore"].byDate(date).map((t)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$time$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["reconcileStatus"])(t));
        // persister les bascules auto planned -> missed
        list.forEach((t)=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["taskStore"].save(t));
        setTasks(list);
    }, [
        date
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        refresh();
        setReady(true);
    }, [
        refresh
    ]);
    const addTask = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((data)=>{
        const task = {
            ...data,
            id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["uid"])(),
            date,
            status: "planned",
            createdAt: new Date().toISOString()
        };
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["taskStore"].save(task);
        refresh();
        return task;
    }, [
        date,
        refresh
    ]);
    const updateTask = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((id, patch)=>{
        const current = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["taskStore"].all().find((t)=>t.id === id);
        if (!current) return;
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["taskStore"].save({
            ...current,
            ...patch
        });
        refresh();
    }, [
        refresh
    ]);
    const setStatus = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((id, status)=>{
        const now = new Date().toISOString();
        const patch = {
            status
        };
        if (status === "in_progress") patch.startedAt = now;
        if (status === "done") patch.completedAt = now;
        updateTask(id, patch);
    }, [
        updateTask
    ]);
    const removeTask = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((id)=>{
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["taskStore"].remove(id);
        refresh();
    }, [
        refresh
    ]);
    const archiveTask = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((id)=>{
        updateTask(id, {
            archived: true,
            archivedAt: new Date().toISOString()
        });
    }, [
        updateTask
    ]);
    return {
        tasks,
        ready,
        addTask,
        updateTask,
        setStatus,
        removeTask,
        archiveTask,
        refresh
    };
}
}),
"[project]/lib/useReminders.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useReminders",
    ()=>useReminders
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$time$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/time.ts [app-ssr] (ecmascript)");
"use client";
;
;
function useReminders(tasks) {
    const [permission, setPermission] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("default");
    // mémorise les rappels déjà envoyés pour ne pas répéter (clé: jour+id+tranche)
    const sent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(new Set());
    // ref vers les tâches courantes : l'intervalle reste stable, pas recréé à chaque tick
    const tasksRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(tasks);
    tasksRef.current = tasks;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (("TURBOPACK compile-time value", "undefined") !== "undefined" && "Notification" in window) //TURBOPACK unreachable
        ;
    }, []);
    const requestPermission = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        if (!("Notification" in window)) return;
        const p = await Notification.requestPermission();
        setPermission(p);
    }, []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (permission !== "granted") return;
        const check = ()=>{
            const now = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$time$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["nowMinutes"])();
            tasksRef.current.forEach((task)=>{
                const msg = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$time$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["reminderFor"])(task, now);
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
                    new Notification("FocusDay", {
                        body: msg,
                        tag: task.id
                    });
                } catch  {
                /* ignore */ }
            });
        };
        check();
        const id = setInterval(check, 60_000);
        return ()=>clearInterval(id);
    }, [
        permission
    ]);
    return {
        permission,
        requestPermission
    };
}
}),
"[project]/components/NavBar.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>NavBar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ThemeProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ThemeProvider.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
const LINKS = [
    {
        href: "/",
        label: "Ma journée"
    },
    {
        href: "/dashboard",
        label: "Tableau de bord"
    },
    {
        href: "/history",
        label: "Historique"
    },
    {
        href: "/archive",
        label: "Archives"
    }
];
function NavBar() {
    const path = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePathname"])();
    const { theme, toggle } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ThemeProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useTheme"])();
    const [menuOpen, setMenuOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    // Referme le menu à chaque changement de page
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>setMenuOpen(false), [
        path
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
        style: {
            position: "sticky",
            top: 0,
            zIndex: 40,
            background: "color-mix(in srgb, var(--bg) 85%, transparent)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid var(--border)"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    maxWidth: 960,
                    margin: "0 auto",
                    padding: "0.9rem 1.25rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: "/",
                        style: {
                            display: "flex",
                            alignItems: "center",
                            gap: 8
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    width: 12,
                                    height: 12,
                                    borderRadius: "50%",
                                    background: "var(--color-amber)",
                                    boxShadow: "0 0 0 3px color-mix(in srgb, var(--color-amber) 25%, transparent)"
                                }
                            }, void 0, false, {
                                fileName: "[project]/components/NavBar.tsx",
                                lineNumber: 46,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    fontFamily: "var(--font-display)",
                                    fontWeight: 700,
                                    fontSize: "1.1rem"
                                },
                                children: [
                                    "Focus",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        style: {
                                            color: "var(--color-brand)"
                                        },
                                        children: "Day"
                                    }, void 0, false, {
                                        fileName: "[project]/components/NavBar.tsx",
                                        lineNumber: 56,
                                        columnNumber: 18
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/NavBar.tsx",
                                lineNumber: 55,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/NavBar.tsx",
                        lineNumber: 45,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                        className: "nav-links",
                        style: {
                            alignItems: "center",
                            gap: 4
                        },
                        children: [
                            LINKS.map((l)=>{
                                const active = path === l.href;
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    href: l.href,
                                    style: {
                                        fontSize: "0.88rem",
                                        fontWeight: active ? 600 : 500,
                                        color: active ? "var(--color-brand)" : "var(--text-soft)",
                                        padding: "0.45rem 0.75rem",
                                        borderRadius: 8,
                                        background: active ? "var(--bg-3)" : "transparent",
                                        transition: "all 0.2s",
                                        whiteSpace: "nowrap"
                                    },
                                    children: l.label
                                }, l.href, false, {
                                    fileName: "[project]/components/NavBar.tsx",
                                    lineNumber: 65,
                                    columnNumber: 15
                                }, this);
                            }),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: toggle,
                                "aria-label": theme === "dark" ? "Passer en clair" : "Passer en sombre",
                                className: "btn-ghost",
                                style: {
                                    marginLeft: 6,
                                    padding: "0.45rem 0.7rem",
                                    fontSize: "1rem",
                                    lineHeight: 1
                                },
                                children: theme === "dark" ? "☀" : "☾"
                            }, void 0, false, {
                                fileName: "[project]/components/NavBar.tsx",
                                lineNumber: 83,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/NavBar.tsx",
                        lineNumber: 61,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "nav-burger btn-ghost",
                        onClick: ()=>setMenuOpen((v)=>!v),
                        "aria-label": "Ouvrir le menu",
                        "aria-expanded": menuOpen,
                        style: {
                            padding: "0.5rem 0.65rem",
                            fontSize: "1.1rem",
                            lineHeight: 1
                        },
                        children: menuOpen ? "✕" : "☰"
                    }, void 0, false, {
                        fileName: "[project]/components/NavBar.tsx",
                        lineNumber: 94,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/NavBar.tsx",
                lineNumber: 34,
                columnNumber: 7
            }, this),
            menuOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "nav-mobile-panel",
                style: {
                    borderTop: "1px solid var(--border)",
                    background: "var(--bg-2)",
                    padding: "0.6rem 1.25rem 1rem",
                    display: "grid",
                    gap: 4,
                    animation: "var(--animate-slide-up)"
                },
                children: [
                    LINKS.map((l)=>{
                        const active = path === l.href;
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                            href: l.href,
                            style: {
                                fontSize: "0.95rem",
                                fontWeight: active ? 600 : 500,
                                color: active ? "var(--color-brand)" : "var(--text-soft)",
                                padding: "0.65rem 0.75rem",
                                borderRadius: 8,
                                background: active ? "var(--bg-3)" : "transparent"
                            },
                            children: l.label
                        }, l.href, false, {
                            fileName: "[project]/components/NavBar.tsx",
                            lineNumber: 121,
                            columnNumber: 15
                        }, this);
                    }),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: toggle,
                        className: "btn-ghost",
                        style: {
                            justifySelf: "start",
                            marginTop: 4
                        },
                        children: theme === "dark" ? "☀ Passer en clair" : "☾ Passer en sombre"
                    }, void 0, false, {
                        fileName: "[project]/components/NavBar.tsx",
                        lineNumber: 137,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/NavBar.tsx",
                lineNumber: 107,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/NavBar.tsx",
        lineNumber: 24,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/DayTimeline.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>DayTimeline
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$time$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/time.ts [app-ssr] (ecmascript)");
"use client";
;
;
/**
 * Signature visuelle de FocusDay : la journée comme un ruban de temps.
 * Une ligne verticale de 6h à 24h, les tâches placées à leur créneau,
 * et un curseur "maintenant" qui glisse en temps réel.
 */ const DAY_START = 5 * 60; // 05:00 — couvre les lève-tôt
const DAY_END = 24 * 60; // minuit
const RANGE = DAY_END - DAY_START;
function pct(min) {
    return Math.max(0, Math.min(100, (min - DAY_START) / RANGE * 100));
}
const STATUS_DOT = {
    planned: "var(--text-mute)",
    in_progress: "var(--color-amber)",
    done: "var(--color-mint)",
    missed: "var(--color-rose)"
};
function DayTimeline({ tasks, now }) {
    const nowVisible = now >= DAY_START && now <= DAY_END;
    const hours = [
        5,
        8,
        11,
        14,
        17,
        20,
        23
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            display: "flex",
            gap: "0.75rem",
            height: 420
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    position: "relative",
                    width: 40,
                    flexShrink: 0
                },
                children: hours.map((h)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        style: {
                            position: "absolute",
                            top: `${pct(h * 60)}%`,
                            right: 0,
                            transform: "translateY(-50%)",
                            fontSize: "0.7rem",
                            color: "var(--text-mute)",
                            fontFamily: "var(--font-display)"
                        },
                        children: [
                            String(h).padStart(2, "0"),
                            "h"
                        ]
                    }, h, true, {
                        fileName: "[project]/components/DayTimeline.tsx",
                        lineNumber: 35,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/components/DayTimeline.tsx",
                lineNumber: 33,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    position: "relative",
                    width: 8,
                    flexShrink: 0,
                    background: "var(--bg-3)",
                    borderRadius: 999
                },
                children: [
                    nowVisible && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
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
                            zIndex: 3
                        }
                    }, void 0, false, {
                        fileName: "[project]/components/DayTimeline.tsx",
                        lineNumber: 64,
                        columnNumber: 11
                    }, this),
                    tasks.filter((t)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$time$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["endMinutesAdjusted"])(t.start, t.end) > DAY_START).map((t)=>{
                        const top = pct((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$time$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toMinutes"])(t.start));
                        // pct() se clampe à 100 : un créneau nocturne s'arrête donc
                        // visuellement à minuit sur le ruban du jour.
                        const height = Math.max(2, pct((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$time$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["endMinutesAdjusted"])(t.start, t.end)) - top);
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            title: `${t.name} (${t.start}–${t.end})`,
                            style: {
                                position: "absolute",
                                top: `${top}%`,
                                height: `${height}%`,
                                left: -3,
                                width: 14,
                                borderRadius: 8,
                                background: STATUS_DOT[t.status],
                                opacity: t.status === "missed" ? 0.4 : 0.85,
                                zIndex: 2
                            }
                        }, t.id, false, {
                            fileName: "[project]/components/DayTimeline.tsx",
                            lineNumber: 88,
                            columnNumber: 13
                        }, this);
                    })
                ]
            }, void 0, true, {
                fileName: "[project]/components/DayTimeline.tsx",
                lineNumber: 53,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    position: "relative",
                    flex: 1
                },
                children: [
                    tasks.map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                position: "absolute",
                                top: `${pct((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$time$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toMinutes"])(t.start))}%`,
                                left: 0,
                                right: 0,
                                fontSize: "0.78rem",
                                color: "var(--text-soft)",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                paddingLeft: 4
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    style: {
                                        color: STATUS_DOT[t.status],
                                        marginRight: 6
                                    },
                                    children: "●"
                                }, void 0, false, {
                                    fileName: "[project]/components/DayTimeline.tsx",
                                    lineNumber: 125,
                                    columnNumber: 13
                                }, this),
                                t.name
                            ]
                        }, t.id, true, {
                            fileName: "[project]/components/DayTimeline.tsx",
                            lineNumber: 110,
                            columnNumber: 11
                        }, this)),
                    nowVisible && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            position: "absolute",
                            top: `${pct(now)}%`,
                            transform: "translateY(-50%)",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            color: "var(--color-amber)",
                            right: 0
                        },
                        children: "maintenant"
                    }, void 0, false, {
                        fileName: "[project]/components/DayTimeline.tsx",
                        lineNumber: 130,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/DayTimeline.tsx",
                lineNumber: 108,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/DayTimeline.tsx",
        lineNumber: 31,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/TaskCard.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>TaskCard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$time$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/time.ts [app-ssr] (ecmascript)");
"use client";
;
;
const STATUS_LABEL = {
    planned: "À faire",
    in_progress: "En cours",
    done: "Terminée",
    missed: "Manquée"
};
const STATUS_COLOR = {
    planned: "var(--text-soft)",
    in_progress: "var(--color-amber)",
    done: "var(--color-mint)",
    missed: "var(--color-rose)"
};
function TaskCard({ task, now, onStatus, onEdit, onArchive }) {
    const pos = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$time$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["timePosition"])(task, now);
    const duration = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$time$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["durationMinutes"])(task.start, task.end);
    const overnight = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$time$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["spillsIntoNextDay"])(task.start, task.end);
    const isCurrent = pos === "current" && task.status !== "done";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
        className: "task-card",
        style: {
            background: "var(--bg-2)",
            border: `1px solid ${isCurrent ? "var(--color-amber)" : "var(--border)"}`,
            borderRadius: 16,
            padding: "1rem 1.15rem",
            boxShadow: isCurrent ? "0 0 0 3px color-mix(in srgb, var(--color-amber) 15%, transparent)" : "var(--shadow)",
            transition: "border-color .3s, box-shadow .3s"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "1rem"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            minWidth: 0
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    marginBottom: 4
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        style: {
                                            fontFamily: "var(--font-display)",
                                            fontSize: "0.85rem",
                                            fontWeight: 600,
                                            color: "var(--color-brand)"
                                        },
                                        children: [
                                            task.start,
                                            "–",
                                            task.end
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/TaskCard.tsx",
                                        lineNumber: 53,
                                        columnNumber: 13
                                    }, this),
                                    overnight && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        title: "Se termine le lendemain",
                                        style: {
                                            fontSize: "0.65rem",
                                            fontWeight: 700,
                                            color: "var(--color-brand)",
                                            background: "var(--bg-3)",
                                            padding: "1px 5px",
                                            borderRadius: 999
                                        },
                                        children: "+1j"
                                    }, void 0, false, {
                                        fileName: "[project]/components/TaskCard.tsx",
                                        lineNumber: 64,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        style: {
                                            fontSize: "0.72rem",
                                            color: "var(--text-mute)"
                                        },
                                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$time$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatDuration"])(duration)
                                    }, void 0, false, {
                                        fileName: "[project]/components/TaskCard.tsx",
                                        lineNumber: 78,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/TaskCard.tsx",
                                lineNumber: 52,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                style: {
                                    fontFamily: "var(--font-display)",
                                    fontSize: "1.1rem",
                                    fontWeight: 600,
                                    textDecoration: task.status === "done" ? "line-through" : "none",
                                    opacity: task.status === "done" ? 0.6 : 1
                                },
                                children: task.name
                            }, void 0, false, {
                                fileName: "[project]/components/TaskCard.tsx",
                                lineNumber: 82,
                                columnNumber: 11
                            }, this),
                            task.description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                style: {
                                    fontSize: "0.88rem",
                                    color: "var(--text-soft)",
                                    marginTop: 2
                                },
                                children: task.description
                            }, void 0, false, {
                                fileName: "[project]/components/TaskCard.tsx",
                                lineNumber: 94,
                                columnNumber: 13
                            }, this),
                            task.why && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                style: {
                                    fontSize: "0.82rem",
                                    color: "var(--text-soft)",
                                    marginTop: 6,
                                    paddingLeft: 10,
                                    borderLeft: "2px solid var(--color-amber)",
                                    fontStyle: "italic"
                                },
                                children: task.why
                            }, void 0, false, {
                                fileName: "[project]/components/TaskCard.tsx",
                                lineNumber: 99,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/TaskCard.tsx",
                        lineNumber: 51,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-end",
                            gap: 8
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            style: {
                                fontSize: "0.72rem",
                                fontWeight: 600,
                                color: STATUS_COLOR[task.status],
                                whiteSpace: "nowrap"
                            },
                            children: [
                                "● ",
                                STATUS_LABEL[task.status]
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/TaskCard.tsx",
                            lineNumber: 115,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/TaskCard.tsx",
                        lineNumber: 114,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/TaskCard.tsx",
                lineNumber: 50,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "flex",
                    gap: 6,
                    marginTop: 12,
                    flexWrap: "wrap"
                },
                children: [
                    task.status !== "in_progress" && task.status !== "done" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "chip",
                        onClick: ()=>onStatus(task.id, "in_progress"),
                        children: "Démarrer"
                    }, void 0, false, {
                        fileName: "[project]/components/TaskCard.tsx",
                        lineNumber: 131,
                        columnNumber: 11
                    }, this),
                    task.status === "in_progress" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "chip chip-mint",
                        onClick: ()=>onStatus(task.id, "done"),
                        children: "Terminer"
                    }, void 0, false, {
                        fileName: "[project]/components/TaskCard.tsx",
                        lineNumber: 136,
                        columnNumber: 11
                    }, this),
                    task.status !== "done" && task.status !== "in_progress" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "chip chip-mint",
                        onClick: ()=>onStatus(task.id, "done"),
                        children: "Fait"
                    }, void 0, false, {
                        fileName: "[project]/components/TaskCard.tsx",
                        lineNumber: 141,
                        columnNumber: 11
                    }, this),
                    task.status === "done" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "chip",
                        onClick: ()=>onStatus(task.id, "planned"),
                        children: "Rouvrir"
                    }, void 0, false, {
                        fileName: "[project]/components/TaskCard.tsx",
                        lineNumber: 146,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "chip",
                        onClick: ()=>onEdit(task),
                        children: "Modifier"
                    }, void 0, false, {
                        fileName: "[project]/components/TaskCard.tsx",
                        lineNumber: 150,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "chip",
                        onClick: ()=>onArchive(task.id),
                        children: "Archiver"
                    }, void 0, false, {
                        fileName: "[project]/components/TaskCard.tsx",
                        lineNumber: 153,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/TaskCard.tsx",
                lineNumber: 129,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/TaskCard.tsx",
        lineNumber: 39,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/TaskForm.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>TaskForm
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$time$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/time.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
const EMPTY = {
    name: "",
    description: "",
    why: "",
    start: "09:00",
    end: "10:00"
};
function TaskForm({ open, editing, existingTasks = [], onClose, onSubmit }) {
    const [draft, setDraft] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(EMPTY);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (editing) {
            setDraft({
                name: editing.name,
                description: editing.description ?? "",
                why: editing.why ?? "",
                start: editing.start,
                end: editing.end
            });
        } else {
            setDraft(EMPTY);
        }
        setError(null);
    }, [
        editing,
        open
    ]);
    // Fermeture au clavier (Échap) — accessibilité
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!open) return;
        const onKey = (e)=>{
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return ()=>window.removeEventListener("keydown", onKey);
    }, [
        open,
        onClose
    ]);
    if (!open) return null;
    const conflict = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$time$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["findConflict"])(existingTasks, draft.start, draft.end, editing?.id);
    const submit = ()=>{
        if (!draft.name.trim()) return setError("Donne un nom à ton objectif.");
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$time$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toMinutes"])(draft.end) === (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$time$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toMinutes"])(draft.start)) return setError("Le créneau ne peut pas durer 0 minute.");
        onSubmit(draft);
    };
    const set = (k, v)=>setDraft((d)=>({
                ...d,
                [k]: v
            }));
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        onClick: onClose,
        style: {
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 50
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            onClick: (e)=>e.stopPropagation(),
            role: "dialog",
            "aria-modal": "true",
            "aria-label": editing ? "Modifier l\'objectif" : "Nouvel objectif",
            className: "card-surface",
            style: {
                width: "100%",
                maxWidth: 460,
                padding: "1.5rem",
                animation: "var(--animate-slide-up)"
            },
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                    style: {
                        fontFamily: "var(--font-display)",
                        fontSize: "1.3rem",
                        fontWeight: 700,
                        marginBottom: "1.2rem"
                    },
                    children: editing ? "Modifier l'objectif" : "Nouvel objectif"
                }, void 0, false, {
                    fileName: "[project]/components/TaskForm.tsx",
                    lineNumber: 99,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: {
                        display: "grid",
                        gap: "0.9rem"
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "field-label",
                                    children: "Nom de l'objectif"
                                }, void 0, false, {
                                    fileName: "[project]/components/TaskForm.tsx",
                                    lineNumber: 105,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    className: "field",
                                    autoFocus: true,
                                    value: draft.name,
                                    onChange: (e)=>set("name", e.target.value),
                                    placeholder: "Réviser le chapitre 3"
                                }, void 0, false, {
                                    fileName: "[project]/components/TaskForm.tsx",
                                    lineNumber: 106,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/TaskForm.tsx",
                            lineNumber: 104,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "0.9rem"
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "field-label",
                                            children: "Début"
                                        }, void 0, false, {
                                            fileName: "[project]/components/TaskForm.tsx",
                                            lineNumber: 117,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "time",
                                            className: "field",
                                            value: draft.start,
                                            onChange: (e)=>set("start", e.target.value)
                                        }, void 0, false, {
                                            fileName: "[project]/components/TaskForm.tsx",
                                            lineNumber: 118,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/TaskForm.tsx",
                                    lineNumber: 116,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "field-label",
                                            children: "Fin"
                                        }, void 0, false, {
                                            fileName: "[project]/components/TaskForm.tsx",
                                            lineNumber: 121,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "time",
                                            className: "field",
                                            value: draft.end,
                                            onChange: (e)=>set("end", e.target.value)
                                        }, void 0, false, {
                                            fileName: "[project]/components/TaskForm.tsx",
                                            lineNumber: 122,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/TaskForm.tsx",
                                    lineNumber: 120,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/TaskForm.tsx",
                            lineNumber: 115,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "field-label",
                                    children: "Description (optionnel)"
                                }, void 0, false, {
                                    fileName: "[project]/components/TaskForm.tsx",
                                    lineNumber: 127,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    className: "field",
                                    value: draft.description,
                                    onChange: (e)=>set("description", e.target.value),
                                    placeholder: "Exercices 1 à 10"
                                }, void 0, false, {
                                    fileName: "[project]/components/TaskForm.tsx",
                                    lineNumber: 128,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/TaskForm.tsx",
                            lineNumber: 126,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "field-label",
                                    children: "Pourquoi c'est important ?"
                                }, void 0, false, {
                                    fileName: "[project]/components/TaskForm.tsx",
                                    lineNumber: 137,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                    className: "field",
                                    rows: 2,
                                    value: draft.why,
                                    onChange: (e)=>set("why", e.target.value),
                                    placeholder: "Pour être prête à l'examen sans stresser.",
                                    style: {
                                        resize: "vertical"
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/components/TaskForm.tsx",
                                    lineNumber: 138,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/TaskForm.tsx",
                            lineNumber: 136,
                            columnNumber: 11
                        }, this),
                        error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            style: {
                                color: "var(--color-rose)",
                                fontSize: "0.85rem"
                            },
                            children: error
                        }, void 0, false, {
                            fileName: "[project]/components/TaskForm.tsx",
                            lineNumber: 149,
                            columnNumber: 13
                        }, this),
                        !error && (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$time$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["spillsIntoNextDay"])(draft.start, draft.end) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            style: {
                                color: "var(--color-brand)",
                                fontSize: "0.82rem"
                            },
                            children: [
                                "🌙 Ce créneau traverse minuit — il se terminera le lendemain à ",
                                draft.end,
                                "."
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/TaskForm.tsx",
                            lineNumber: 152,
                            columnNumber: 13
                        }, this),
                        !error && conflict && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            style: {
                                color: "var(--color-amber)",
                                fontSize: "0.82rem"
                            },
                            children: [
                                "⚠ Ce créneau chevauche « ",
                                conflict.name,
                                " » (",
                                conflict.start,
                                "–",
                                conflict.end,
                                "). Tu peux quand même l'ajouter."
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/TaskForm.tsx",
                            lineNumber: 157,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                display: "flex",
                                gap: "0.7rem",
                                justifyContent: "flex-end",
                                marginTop: "0.3rem"
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "btn-ghost",
                                    onClick: onClose,
                                    children: "Annuler"
                                }, void 0, false, {
                                    fileName: "[project]/components/TaskForm.tsx",
                                    lineNumber: 163,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "btn-primary",
                                    onClick: submit,
                                    children: editing ? "Enregistrer" : "Ajouter à ma journée"
                                }, void 0, false, {
                                    fileName: "[project]/components/TaskForm.tsx",
                                    lineNumber: 164,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/TaskForm.tsx",
                            lineNumber: 162,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/TaskForm.tsx",
                    lineNumber: 103,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/TaskForm.tsx",
            lineNumber: 86,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/TaskForm.tsx",
        lineNumber: 72,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/EveningDebrief.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>EveningDebrief
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/store.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$time$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/time.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
function EveningDebrief({ date, tasks, existing, onSaved }) {
    const stats = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$time$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["computeStats"])(tasks);
    const [reached, setReached] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(existing?.reachedGoals ?? null);
    const [didMore, setDidMore] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(existing?.didMore ?? false);
    const [note, setNote] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(existing?.missingNote ?? "");
    const [mood, setMood] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(existing?.mood ?? 3);
    const [saved, setSaved] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const save = ()=>{
        const entry = {
            date,
            reachedGoals: reached ?? false,
            didMore,
            missingNote: note.trim() || undefined,
            mood: mood,
            createdAt: new Date().toISOString()
        };
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["debriefStore"].save(entry);
        setSaved(true);
        onSaved();
        setTimeout(()=>setSaved(false), 2500);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "card-surface",
        style: {
            padding: "1.4rem"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                style: {
                    fontFamily: "var(--font-display)",
                    fontSize: "1.3rem",
                    fontWeight: 700,
                    marginBottom: 4
                },
                children: "Débrief du soir"
            }, void 0, false, {
                fileName: "[project]/components/EveningDebrief.tsx",
                lineNumber: 47,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                style: {
                    fontSize: "0.88rem",
                    color: "var(--text-soft)",
                    marginBottom: "1.3rem"
                },
                children: [
                    "Tu as terminé ",
                    stats.done,
                    "/",
                    stats.total,
                    " objectifs (",
                    stats.successRate,
                    "%). Prends un instant pour faire le point."
                ]
            }, void 0, true, {
                fileName: "[project]/components/EveningDebrief.tsx",
                lineNumber: 50,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: "grid",
                    gap: "1.2rem"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "field-label",
                                children: "As-tu atteint tes objectifs du jour ?"
                            }, void 0, false, {
                                fileName: "[project]/components/EveningDebrief.tsx",
                                lineNumber: 56,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: "flex",
                                    gap: 8
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: reached === true ? "btn-primary" : "btn-ghost",
                                        onClick: ()=>setReached(true),
                                        style: {
                                            flex: 1
                                        },
                                        children: "Oui"
                                    }, void 0, false, {
                                        fileName: "[project]/components/EveningDebrief.tsx",
                                        lineNumber: 58,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: reached === false ? "btn-primary" : "btn-ghost",
                                        onClick: ()=>setReached(false),
                                        style: {
                                            flex: 1
                                        },
                                        children: "Pas tout à fait"
                                    }, void 0, false, {
                                        fileName: "[project]/components/EveningDebrief.tsx",
                                        lineNumber: 59,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/EveningDebrief.tsx",
                                lineNumber: 57,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/EveningDebrief.tsx",
                        lineNumber: 55,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "field-label",
                                children: "As-tu fait plus que prévu ?"
                            }, void 0, false, {
                                fileName: "[project]/components/EveningDebrief.tsx",
                                lineNumber: 64,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: didMore ? "btn-primary" : "btn-ghost",
                                onClick: ()=>setDidMore((v)=>!v),
                                children: didMore ? "Oui, j'ai fait plus ✓" : "Non, m'en tenir au plan"
                            }, void 0, false, {
                                fileName: "[project]/components/EveningDebrief.tsx",
                                lineNumber: 65,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/EveningDebrief.tsx",
                        lineNumber: 63,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "field-label",
                                children: "Qu'est-ce qui a manqué, ou que tu as ajouté ?"
                            }, void 0, false, {
                                fileName: "[project]/components/EveningDebrief.tsx",
                                lineNumber: 71,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                className: "field",
                                rows: 3,
                                value: note,
                                onChange: (e)=>setNote(e.target.value),
                                placeholder: "J'ai reporté la lecture, mais j'ai avancé sur le projet…",
                                style: {
                                    resize: "vertical"
                                }
                            }, void 0, false, {
                                fileName: "[project]/components/EveningDebrief.tsx",
                                lineNumber: 72,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/EveningDebrief.tsx",
                        lineNumber: 70,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "field-label",
                                children: "Ta journée, dans l'ensemble"
                            }, void 0, false, {
                                fileName: "[project]/components/EveningDebrief.tsx",
                                lineNumber: 76,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: "flex",
                                    gap: 6
                                },
                                children: [
                                    "😔",
                                    "😕",
                                    "😐",
                                    "🙂",
                                    "😄"
                                ].map((emo, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>setMood(i + 1),
                                        "aria-label": `Humeur ${i + 1} sur 5`,
                                        style: {
                                            flex: 1,
                                            fontSize: "1.4rem",
                                            padding: "0.5rem",
                                            borderRadius: 10,
                                            border: `1px solid ${mood === i + 1 ? "var(--color-brand)" : "var(--border)"}`,
                                            background: mood === i + 1 ? "var(--bg-3)" : "transparent",
                                            cursor: "pointer",
                                            transition: "all 0.2s"
                                        },
                                        children: emo
                                    }, i, false, {
                                        fileName: "[project]/components/EveningDebrief.tsx",
                                        lineNumber: 79,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/components/EveningDebrief.tsx",
                                lineNumber: 77,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/EveningDebrief.tsx",
                        lineNumber: 75,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            alignItems: "center",
                            gap: "1rem",
                            justifyContent: "flex-end"
                        },
                        children: [
                            saved && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    color: "var(--color-mint)",
                                    fontSize: "0.85rem"
                                },
                                children: "Débrief enregistré ✓"
                            }, void 0, false, {
                                fileName: "[project]/components/EveningDebrief.tsx",
                                lineNumber: 101,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "btn-primary",
                                onClick: save,
                                disabled: reached === null,
                                children: "Enregistrer mon débrief"
                            }, void 0, false, {
                                fileName: "[project]/components/EveningDebrief.tsx",
                                lineNumber: 102,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/EveningDebrief.tsx",
                        lineNumber: 100,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/EveningDebrief.tsx",
                lineNumber: 54,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/EveningDebrief.tsx",
        lineNumber: 46,
        columnNumber: 5
    }, this);
}
}),
"[project]/app/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>HomePage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$useTasks$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/useTasks.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$useReminders$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/useReminders.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$time$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/time.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$NavBar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/NavBar.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$DayTimeline$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/DayTimeline.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$TaskCard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/TaskCard.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$TaskForm$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/TaskForm.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$EveningDebrief$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/EveningDebrief.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/store.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
;
;
;
;
;
function HomePage() {
    const today = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$time$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["todayISO"])();
    const { tasks, ready, addTask, updateTask, setStatus, archiveTask } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$useTasks$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useTasks"])(today);
    const now = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$useTasks$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useNow"])();
    const { permission, requestPermission } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$useReminders$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useReminders"])(tasks);
    const [formOpen, setFormOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [editing, setEditing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [debriefKey, setDebriefKey] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(0);
    const existingDebrief = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["debriefStore"].byDate(today), [
        today,
        debriefKey,
        tasks
    ]);
    // Le débrief apparaît en fin de journée (après 18h) ou s'il existe déjà
    const showDebrief = ready && tasks.length > 0 && (now >= 18 * 60 || existingDebrief);
    const stats = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$time$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["computeStats"])(tasks);
    const activeReminders = tasks.map((t)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$time$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["reminderFor"])(t, now)).filter((m)=>Boolean(m));
    const openNew = ()=>{
        setEditing(null);
        setFormOpen(true);
    };
    const openEdit = (t)=>{
        setEditing(t);
        setFormOpen(true);
    };
    const handleSubmit = (d)=>{
        if (editing) {
            updateTask(editing.id, {
                name: d.name,
                description: d.description,
                why: d.why,
                start: d.start,
                end: d.end
            });
        } else {
            addTask({
                name: d.name,
                description: d.description,
                why: d.why,
                start: d.start,
                end: d.end
            });
        }
        setFormOpen(false);
        setEditing(null);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$NavBar$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 51,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                style: {
                    maxWidth: 960,
                    margin: "0 auto",
                    padding: "1.5rem 1.25rem 4rem"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-end",
                            flexWrap: "wrap",
                            gap: "1rem",
                            marginBottom: "1.5rem"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        style: {
                                            fontSize: "0.8rem",
                                            fontWeight: 600,
                                            color: "var(--color-brand)",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.08em"
                                        },
                                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$time$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["prettyDate"])(today)
                                    }, void 0, false, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 56,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                        style: {
                                            fontFamily: "var(--font-display)",
                                            fontSize: "2rem",
                                            fontWeight: 700,
                                            marginTop: 4
                                        },
                                        children: "Ta journée"
                                    }, void 0, false, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 59,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 55,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "btn-primary",
                                onClick: openNew,
                                children: "+ Nouvel objectif"
                            }, void 0, false, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 63,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/page.tsx",
                        lineNumber: 54,
                        columnNumber: 9
                    }, this),
                    permission !== "granted" && ready && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "card-surface",
                        style: {
                            padding: "0.9rem 1.1rem",
                            marginBottom: "1.25rem",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "1rem",
                            flexWrap: "wrap"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                style: {
                                    fontSize: "0.9rem",
                                    color: "var(--text-soft)"
                                },
                                children: "Active les rappels pour être prévenue quand un créneau approche."
                            }, void 0, false, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 69,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "btn-ghost",
                                onClick: requestPermission,
                                children: "Activer les rappels"
                            }, void 0, false, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 72,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/page.tsx",
                        lineNumber: 68,
                        columnNumber: 11
                    }, this),
                    activeReminders.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "grid",
                            gap: 8,
                            marginBottom: "1.25rem"
                        },
                        children: activeReminders.map((msg, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    padding: "0.7rem 1rem",
                                    borderRadius: 12,
                                    background: "color-mix(in srgb, var(--color-amber) 12%, transparent)",
                                    border: "1px solid color-mix(in srgb, var(--color-amber) 30%, transparent)",
                                    fontSize: "0.88rem",
                                    color: "var(--text)"
                                },
                                children: [
                                    "⏳ ",
                                    msg
                                ]
                            }, i, true, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 80,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/app/page.tsx",
                        lineNumber: 78,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "grid",
                            gridTemplateColumns: "minmax(0, 1fr)",
                            gap: "1.5rem"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                className: "card-surface",
                                style: {
                                    padding: "1.3rem",
                                    display: "grid",
                                    gap: "1.2rem"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            display: "flex",
                                            gap: "1.5rem",
                                            flexWrap: "wrap"
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Stat, {
                                                label: "Objectifs",
                                                value: stats.total
                                            }, void 0, false, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 91,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Stat, {
                                                label: "Terminés",
                                                value: stats.done,
                                                color: "var(--color-mint)"
                                            }, void 0, false, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 92,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Stat, {
                                                label: "En cours",
                                                value: stats.inProgress,
                                                color: "var(--color-amber)"
                                            }, void 0, false, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 93,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Stat, {
                                                label: "Réussite",
                                                value: `${stats.successRate}%`,
                                                color: "var(--color-brand)"
                                            }, void 0, false, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 94,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 90,
                                        columnNumber: 13
                                    }, this),
                                    ready && tasks.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$DayTimeline$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                        tasks: tasks,
                                        now: now
                                    }, void 0, false, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 96,
                                        columnNumber: 43
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 89,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                style: {
                                    display: "grid",
                                    gap: "0.85rem"
                                },
                                children: [
                                    ready && tasks.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "card-surface",
                                        style: {
                                            padding: "2.5rem 1.5rem",
                                            textAlign: "center"
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                style: {
                                                    fontFamily: "var(--font-display)",
                                                    fontSize: "1.15rem",
                                                    fontWeight: 600,
                                                    marginBottom: 6
                                                },
                                                children: "Ta journée est une page blanche."
                                            }, void 0, false, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 103,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                style: {
                                                    color: "var(--text-soft)",
                                                    fontSize: "0.9rem",
                                                    marginBottom: "1.2rem"
                                                },
                                                children: "Ajoute ton premier objectif avec son créneau — et le pourquoi qui te motive."
                                            }, void 0, false, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 106,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                className: "btn-primary",
                                                onClick: openNew,
                                                children: "+ Nouvel objectif"
                                            }, void 0, false, {
                                                fileName: "[project]/app/page.tsx",
                                                lineNumber: 109,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/page.tsx",
                                        lineNumber: 102,
                                        columnNumber: 15
                                    }, this),
                                    tasks.map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$TaskCard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                            task: t,
                                            now: now,
                                            onStatus: setStatus,
                                            onEdit: openEdit,
                                            onArchive: archiveTask
                                        }, t.id, false, {
                                            fileName: "[project]/app/page.tsx",
                                            lineNumber: 113,
                                            columnNumber: 15
                                        }, this))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 100,
                                columnNumber: 11
                            }, this),
                            showDebrief && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$EveningDebrief$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                date: today,
                                tasks: tasks,
                                existing: existingDebrief,
                                onSaved: ()=>setDebriefKey((k)=>k + 1)
                            }, debriefKey, false, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 118,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/page.tsx",
                        lineNumber: 87,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 52,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$TaskForm$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                open: formOpen,
                editing: editing,
                existingTasks: tasks,
                onClose: ()=>{
                    setFormOpen(false);
                    setEditing(null);
                },
                onSubmit: handleSubmit
            }, void 0, false, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 129,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
function Stat({ label, value, color }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    fontFamily: "var(--font-display)",
                    fontSize: "1.8rem",
                    fontWeight: 700,
                    color: color ?? "var(--text)"
                },
                children: value
            }, void 0, false, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 137,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    fontSize: "0.78rem",
                    color: "var(--text-mute)"
                },
                children: label
            }, void 0, false, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 140,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/page.tsx",
        lineNumber: 136,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=_0ls1zz3._.js.map