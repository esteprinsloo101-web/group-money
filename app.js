/* Group Money — static SA stokvel / burial / choir shared ledger demo
   Kopano Stokvel · Bloemfontein · localStorage · ZAR
   NOT a bank · NOT NCR · NOT financial advice */

(function () {
  "use strict";

  const STORAGE_KEY = "group-money-v4";

  /* PLATFORM_BAR_2026_09_11 */
  const SCIENCE_TIPS = [
  {
    "h": "Attest → close gate",
    "body": "Run Attest ProcessRunner 48h before the meeting. Period close stays gated until attest locks.",
    "method": "Method: ordered ProcessRunner loop · Limit: late deposits still land"
  },
  {
    "h": "Close unlocks Approve",
    "body": "Only after period close should payout Approve fire. Keep bank link open; humans still Approve.",
    "method": "Method: dual-control ProcessRunner · Limit: not NCR / banking advice"
  },
  {
    "h": "Meeting pack from books",
    "body": "Export text + JSON meeting pack from live localStorage state — roll, loop status, disputes, loans.",
    "method": "Method: structured pack from books · Limit: not a bank statement"
  }
];
  const PURPOSE_MODULE_PRESETS = {
  "stokvel": {
    "members": true,
    "ledger": true,
    "cycles": true,
    "loans": true,
    "disputes": true,
    "meeting": true,
    "science": true
  },
  "household": {
    "members": true,
    "ledger": true,
    "cycles": false,
    "loans": false,
    "disputes": false,
    "meeting": true,
    "science": true
  },
  "farm": {
    "members": true,
    "ledger": true,
    "cycles": true,
    "loans": true,
    "disputes": true,
    "meeting": true,
    "science": true
  },
  "trade": {
    "members": true,
    "ledger": true,
    "cycles": true,
    "loans": false,
    "disputes": true,
    "meeting": true,
    "science": true
  },
  "rentals": {
    "members": true,
    "ledger": true,
    "cycles": true,
    "loans": false,
    "disputes": true,
    "meeting": true,
    "science": true
  },
  "flood": {
    "members": true,
    "ledger": false,
    "cycles": false,
    "loans": false,
    "disputes": false,
    "meeting": true,
    "science": true
  },
  "decisions": {
    "members": true,
    "ledger": true,
    "cycles": true,
    "loans": false,
    "disputes": true,
    "meeting": true,
    "science": true
  }
};

  const TZ = "Africa/Johannesburg";
  const GUMROAD = "https://stofficial.gumroad.com/l/ydbgne";

  const PROCESS_TYPES = {
    record_contribution: {
      label: "Record contribution",
      icon: "R",
      defaultCadenceDays: 30,
      leadDays: 5,
      disclaimer: "NOT a bank. You record what members paid — app does not move money.",
      steps: [
        { key: "member", title: "Confirm member", body: "Pick who paid for this period (demo: confirm listed member)." },
        { key: "amount", title: "Enter amount (ZAR)", body: "Record the contribution amount received.", input: "amount" },
        { key: "confirm", title: "Log receipt", body: "Mark when cash / EFT is confirmed on your side.", checks: ["Contribution recorded in books"] },
      ],
    },
    attest: {
      label: "Attest paid",
      icon: "✓",
      defaultCadenceDays: 30,
      leadDays: 3,
      disclaimer: "Attestation is a group transparency step — not a bank confirmation. Not financial or legal advice.",
      steps: [
        { key: "review", title: "Review roll", body: "Compare member status vs ledger entries for this period. Note open disputes before you attest." },
        { key: "disputes", title: "Flag disputes", body: "Confirm open disputes are listed for the meeting pack (do not bury them).", checks: ["Open disputes reviewed for the pack"] },
        { key: "attest", title: "Attest", body: "Treasurer / chair attests the paid / late / pending roll for this period.", checks: ["I attest this period roll"] },
        { key: "confirm", title: "Lock attest", body: "Mark attestation complete so period close can run.", checks: ["Attestation logged · unlocks period close"] },
      ],
    },
    period_close: {
      label: "Period close",
      icon: "📒",
      defaultCadenceDays: 30,
      leadDays: 2,
      disclaimer: "Closing a period does not transfer funds. Requires attest first. Not financial or legal advice.",
      requires: "attested",
      steps: [
        { key: "gate", title: "Confirm attest", body: "Period close stays gated until the roll is attested." },
        { key: "totals", title: "Review totals", body: "Expected vs received · late list · advances · pot balance." },
        { key: "late", title: "Note late members", body: "Flag who is still outstanding before close.", input: "note" },
        { key: "confirm", title: "Close period", body: "Lock this contribution period. Unlocks payout Approve.", checks: ["Period closed in books · unlocks payout Approve"] },
      ],
    },
    payout_prep: {
      label: "Payout prep",
      icon: "💸",
      defaultCadenceDays: 30,
      leadDays: 7,
      disclaimer: "Committee Approves release. App does not pay out. Requires period close. Not financial or legal advice.",
      requires: "periodClosed",
      steps: [
        { key: "gate", title: "Confirm period closed", body: "Payout Approve stays gated until period close is done." },
        { key: "sheet", title: "Build payout sheet", body: "Confirm beneficiary, amount and rotation order from live books." },
        { key: "approve", title: "Approve release", body: "Human / committee Approve only — dual-control feel.", checks: ["Committee Approves this payout sheet"] },
        { key: "confirm", title: "Mark prepped", body: "Sheet ready for bank / cash payout by humans.", checks: ["Payout prep complete · books loop closed for cycle"] },
      ],
    },
    custom: {
      label: "Custom process",
      icon: "◎",
      defaultCadenceDays: 30,
      leadDays: 5,
      disclaimer: "Demo process — adapt to your group.",
      steps: [
        { key: "do", title: "Do the work", body: "Follow your own steps." },
        { key: "confirm", title: "Confirm done", body: "Mark complete.", checks: ["Work completed"] },
      ],
    },
  };

  const DEFAULT_MODULES = {
    members: true, ledger: true, cycles: true, loans: true, disputes: true, meeting: true,
    science: true,
  };

  function seed() {
    const today = startOfDay(new Date());
    return {
      modules: { ...DEFAULT_MODULES },
      profile: { onboarded: false, city: "", purpose: "", updatedAt: null },
      group: { name: "Kopano Stokvel", city: "Bloemfontein", type: "Monthly savings · rotating payout", contribution: 500 },
      period: {
        label: "September 2026",
        expected: 5000,
        received: 3500,
        closesAt: isoDate(addDays(today, 4)),
      },
      members: [
        { id: "m1", name: "Thandi Mokoena", role: "Chair", status: "paid", phone: "082 100 2000" },
        { id: "m2", name: "Pieter Botha", role: "Treasurer", status: "paid", phone: "083 300 4000" },
        { id: "m3", name: "Naledi Molefe", role: "Member", status: "paid", phone: "072 500 6000" },
        { id: "m4", name: "Jaco van Wyk", role: "Member", status: "late", phone: "084 700 8000" },
        { id: "m5", name: "Priya Naidoo", role: "Member", status: "late", phone: "081 900 1000" },
        { id: "m6", name: "Sipho Dlamini", role: "Member", status: "paid", phone: "073 111 2222" },
        { id: "m7", name: "Annemie Kruger", role: "Secretary", status: "paid", phone: "082 333 4444" },
        { id: "m8", name: "Lebo Khumalo", role: "Member", status: "pending", phone: "071 555 6666" },
        { id: "m9", name: "Farah Ismail", role: "Member", status: "paid", phone: "083 777 8888" },
        { id: "m10", name: "Johan Smit", role: "Member", status: "paid", phone: "072 999 0000" },
      ],
      ledger: [
        { id: "l1", at: isoDate(addDays(today, -2)), memberId: "m1", label: "Contribution — Thandi", amount: 500, kind: "in" },
        { id: "l2", at: isoDate(addDays(today, -2)), memberId: "m2", label: "Contribution — Pieter", amount: 500, kind: "in" },
        { id: "l3", at: isoDate(addDays(today, -1)), memberId: "m3", label: "Contribution — Naledi", amount: 500, kind: "in" },
        { id: "l4", at: isoDate(addDays(today, -1)), memberId: "m6", label: "Contribution — Sipho", amount: 500, kind: "in" },
        { id: "l5", at: isoDate(addDays(today, -1)), memberId: "m7", label: "Contribution — Annemie", amount: 500, kind: "in" },
        { id: "l6", at: isoDate(today), memberId: "m9", label: "Contribution — Farah", amount: 500, kind: "in" },
        { id: "l7", at: isoDate(today), memberId: "m10", label: "Contribution — Johan", amount: 500, kind: "in" },
        { id: "l8", at: isoDate(addDays(today, -20)), memberId: "m4", label: "Advance — Jaco", amount: -800, kind: "loan" },
        { id: "l9", at: isoDate(addDays(today, -40)), memberId: "m1", label: "Payout Aug — Thandi", amount: -4500, kind: "payout" },
      ],
      loans: [
        { id: "ln1", memberId: "m4", amount: 800, at: isoDate(addDays(today, -20)), status: "open", note: "School fees advance" },
        { id: "ln2", memberId: "m8", amount: 300, at: isoDate(addDays(today, -55)), status: "repaid", note: "Transport" },
      ],
      disputes: [
        { id: "dp1", title: "Jaco — Aug contribution disputed", status: "open", openedAt: isoDate(addDays(today, -6)), note: "Claims EFT sent; treasurer not seeing it" },
        { id: "dp2", title: "Rotation order clarification", status: "closed", openedAt: isoDate(addDays(today, -40)), note: "Resolved in Aug meeting" },
      ],
      payoutSheet: [
        { memberId: "m4", amount: 5000, position: 1, note: "Next up (Sep)" },
        { memberId: "m5", amount: 5000, position: 2, note: "Oct" },
        { memberId: "m8", amount: 5000, position: 3, note: "Nov" },
      ],
      cycles: [
        { id: "cy1", label: "Aug 2026", beneficiary: "Thandi Mokoena", amount: 4500, status: "paid" },
        { id: "cy2", label: "Jul 2026", beneficiary: "Pieter Botha", amount: 4500, status: "paid" },
      ],
      payoutApproved: false,
      attested: false,
      periodClosed: false,
      attestedAt: null,
      periodClosedAt: null,
      payoutApprovedAt: null,
      prefs: {
        quietStart: 21,
        quietEnd: 7,
        notificationsEnabled: true,
        lastNotified: {},
        installDismissed: false,
      },
      processes: seedProcesses(today),
      history: [],
    };
  }

  function seedProcesses(today) {
    return [
      {
        id: "pr-contrib-m4", type: "record_contribution", title: "Record — Jaco van Wyk (late)",
        nextDue: isoDate(addDays(today, -1)), cadenceDays: 30, leadDays: 5, module: "ledger",
        accountLinks: [{ label: "WhatsApp Jaco", url: "https://wa.me/27847008000" }],
        meta: { memberId: "m4", amount: 500 },
      },
      {
        id: "pr-contrib-m5", type: "record_contribution", title: "Record — Priya Naidoo (late)",
        nextDue: isoDate(today), cadenceDays: 30, leadDays: 5, module: "ledger",
        accountLinks: [{ label: "WhatsApp Priya", url: "https://wa.me/27819001000" }],
        meta: { memberId: "m5", amount: 500 },
      },
      {
        id: "pr-attest", type: "attest", title: "Attest September roll",
        nextDue: isoDate(addDays(today, 2)), cadenceDays: 30, leadDays: 3, module: "ledger",
        accountLinks: [],
        meta: {},
      },
      {
        id: "pr-close", type: "period_close", title: "Close September period",
        nextDue: isoDate(addDays(today, 4)), cadenceDays: 30, leadDays: 2, module: "ledger",
        accountLinks: [],
        meta: {},
      },
      {
        id: "pr-payout", type: "payout_prep", title: "Payout prep — Jaco (next)",
        nextDue: isoDate(addDays(today, 3)), cadenceDays: 30, leadDays: 7, module: "cycles",
        accountLinks: [{ label: "Bank note stub", url: "https://www.fnb.co.za/" }],
        meta: { memberId: "m4", amount: 5000 },
      },
      {
        id: "pr-contrib-m8", type: "record_contribution", title: "Record — Lebo Khumalo (pending)",
        nextDue: isoDate(addDays(today, 1)), cadenceDays: 30, leadDays: 5, module: "ledger",
        accountLinks: [{ label: "WhatsApp Lebo", url: "https://wa.me/27715556666" }],
        meta: { memberId: "m8", amount: 500 },
      },
    ];
  }

  function uid(prefix) { return prefix + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function startOfDay(d) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
  function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function isoDate(d) {
    const x = new Date(d);
    return x.getFullYear() + "-" + String(x.getMonth()+1).padStart(2,"0") + "-" + String(x.getDate()).padStart(2,"0");
  }
  function parseISO(s) { const [y,m,d] = s.split("-").map(Number); return new Date(y, m-1, d); }
  function daysUntil(iso) { return Math.round((startOfDay(parseISO(iso)) - startOfDay(new Date())) / 86400000); }
  function fmtDate(iso) {
    try { return parseISO(iso).toLocaleDateString("en-ZA", { timeZone: TZ, weekday: "short", day: "numeric", month: "short", year: "numeric" }); }
    catch { return iso; }
  }
  function fmtMoney(n) { return "R" + Number(n).toLocaleString("en-ZA"); }
  function todayLabel() {
    return new Date().toLocaleDateString("en-ZA", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" });
  }
  function esc(s) {
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }
  function memberName(id) { const m = state.members.find((x) => x.id === id); return m ? m.name : "—"; }

  function defaultPrefs() {
    return {
      quietStart: 21,
      quietEnd: 7,
      notificationsEnabled: true,
      lastNotified: {},
      installDismissed: false,
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return seed();
      const data = JSON.parse(raw);
      data.modules = { ...DEFAULT_MODULES, ...(data.modules || {}) };
      if (!data.profile) data.profile = { onboarded: false, city: "", purpose: "", updatedAt: null };
      if (!Array.isArray(data.processes) || !data.processes.length) data.processes = seedProcesses(startOfDay(new Date()));
      if (!Array.isArray(data.history)) data.history = [];
      data.prefs = Object.assign(defaultPrefs(), data.prefs || {});
      if (typeof data.attested !== "boolean") data.attested = false;
      if (typeof data.periodClosed !== "boolean") data.periodClosed = false;
      if (typeof data.payoutApproved !== "boolean") data.payoutApproved = false;
      return data;
    } catch { return seed(); }
  }
  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function getPrefs() {
    if (!state.prefs) state.prefs = defaultPrefs();
    return state.prefs;
  }

  let state = load();
  let currentView = "today";

  function potBalance() {
    return state.ledger.reduce((s, e) => s + e.amount, 0);
  }
  function processDue(p) { return daysUntil(p.nextDue); }
  function processInQueue(p) {
    if (p.paused) return false;
    if (p.module && state.modules[p.module] === false) return false;
    const lead = p.leadDays != null ? p.leadDays : (PROCESS_TYPES[p.type] || PROCESS_TYPES.custom).leadDays;
    return processDue(p) <= lead;
  }
  function buildQueue() {
    const items = [];
    (state.processes || []).filter(processInQueue).forEach((p) => {
      const due = processDue(p);
      const def = PROCESS_TYPES[p.type] || PROCESS_TYPES.custom;
      items.push({
        processId: p.id, module: p.module || "ledger", title: p.title,
        meta: (def.label || p.type) + " · due " + fmtDate(p.nextDue) + (p.accountLinks && p.accountLinks.length ? " · link" : ""),
        severity: due < 0 ? "red" : due <= 2 ? "amber" : "green",
        due, icon: def.icon || "◎",
      });
    });
    items.sort((a,b) => a.due - b.due || a.title.localeCompare(b.title));
    return items;
  }
  function inQuietHours(date) {
    const prefs = getPrefs();
    const h = (date || new Date()).getHours();
    const start = Number(prefs.quietStart);
    const end = Number(prefs.quietEnd);
    if (Number.isNaN(start) || Number.isNaN(end)) return false;
    if (start === end) return false;
    if (start < end) return h >= start && h < end;
    return h >= start || h < end;
  }

  function nextOutsideQuiet(from) {
    const d = new Date(from || Date.now());
    let guard = 0;
    while (inQuietHours(d) && guard < 48) {
      d.setMinutes(0, 0, 0);
      d.setHours(d.getHours() + 1);
      guard++;
    }
    return d;
  }

  function notifPermission() {
    if (!("Notification" in window)) return "unsupported";
    return Notification.permission;
  }

  function requestNotificationPermission() {
    if (!("Notification" in window)) {
      toast("Notifications not supported here");
      return Promise.resolve("unsupported");
    }
    if (Notification.permission === "granted") return Promise.resolve("granted");
    if (Notification.permission === "denied") {
      toast("Notifications blocked — enable in browser settings if you want alerts");
      return Promise.resolve("denied");
    }
    return Notification.requestPermission()
      .then(function (p) {
        if (p === "granted") toast("Notifications on");
        else if (p === "denied") toast("Notifications denied — in-app reminders still work");
        else toast("Notifications not enabled");
        render();
        return p;
      })
      .catch(function () {
        toast("Could not request notifications");
        return "denied";
      });
  }

  function fireDueNotification(item) {
    const prefs = getPrefs();
    if (!prefs.notificationsEnabled) return;
    if (notifPermission() !== "granted") return;
    if (inQuietHours(new Date())) return;
    const key = item.processId || item.id;
    const today = isoDate(new Date());
    if (prefs.lastNotified[key] === today) return;
    try {
      const n = new Notification("Group Money · due", {
        body: item.title + (item.due < 0 ? " (overdue)" : item.due === 0 ? " (today)" : " · in " + item.due + "d"),
        tag: "group-money-" + key,
        icon: "icons/icon-192.png",
      });
      prefs.lastNotified[key] = today;
      save();
      n.onclick = function () {
        window.focus();
        if (item.processId) openProcessRunner(item.processId);
        n.close();
      };
    } catch (e) {
      /* graceful */
    }
  }

  function checkDueNotifications() {
    const prefs = getPrefs();
    if (!prefs.notificationsEnabled) return;
    if (notifPermission() !== "granted") return;
    if (inQuietHours(new Date())) return;
    buildQueue()
      .filter(function (item) { return item.due <= 0; })
      .slice(0, 3)
      .forEach(fireDueNotification);
  }

  var reminderTimers = {};

  function clearReminderTimer(processId) {
    if (reminderTimers[processId]) {
      clearTimeout(reminderTimers[processId]);
      delete reminderTimers[processId];
    }
  }

  function scheduleReminderForProcess(proc) {
    if (!proc || !proc.nextDue) return;
    clearReminderTimer(proc.id);
    const prefs = getPrefs();
    if (!prefs.notificationsEnabled) return;
    if (notifPermission() !== "granted") return;

    const dueDay = startOfDay(parseISO(proc.nextDue));
    const lead = proc.leadDays != null ? proc.leadDays : (PROCESS_TYPES[proc.type] || PROCESS_TYPES.custom).leadDays;
    let fireAt = addDays(dueDay, -Math.min(lead, 1));
    fireAt.setHours(8, 0, 0, 0);
    fireAt = nextOutsideQuiet(fireAt);
    const delay = fireAt.getTime() - Date.now();
    if (delay <= 0) {
      const soon = nextOutsideQuiet(new Date(Date.now() + 1500));
      const d2 = soon.getTime() - Date.now();
      if (d2 < 86400000) {
        reminderTimers[proc.id] = setTimeout(function () {
          fireDueNotification({
            processId: proc.id,
            id: proc.id,
            title: proc.title,
            due: processDue(proc),
          });
        }, Math.max(500, d2));
      }
      return;
    }
    if (delay > 2147483647) return;
    reminderTimers[proc.id] = setTimeout(function () {
      fireDueNotification({
        processId: proc.id,
        id: proc.id,
        title: proc.title,
        due: processDue(proc),
      });
    }, delay);
  }

  function rescheduleAllReminders() {
    (state.processes || []).forEach(scheduleReminderForProcess);
  }

  function buildReminders() {
    const q = buildQueue().slice(0, 8);
    const base = new Date();
    const quietNow = inQuietHours(base);
    return q.map(function (item, i) {
      let fire = new Date(base);
      fire.setMinutes(0, 0, 0);
      if (item.due <= 0) {
        fire = nextOutsideQuiet(new Date(base.getTime() + (quietNow ? 0 : 60 * 1000)));
      } else {
        fire = addDays(startOfDay(base), Math.max(0, item.due));
        fire.setHours(8 + (i % 3), i % 2 === 0 ? 0 : 30, 0, 0);
        fire = nextOutsideQuiet(fire);
      }
      const time = fire.toLocaleTimeString("en-ZA", {
        timeZone: TZ,
        hour: "2-digit",
        minute: "2-digit",
      });
      const day = fire.toLocaleDateString("en-ZA", {
        timeZone: TZ,
        weekday: "short",
        day: "numeric",
        month: "short",
      });
      return {
        when: day + " · " + time,
        title: item.title,
        src: item.module + (quietNow && item.due <= 0 ? " · quiet hours" : ""),
        processId: item.processId,
        due: item.due,
        quietShifted: quietNow && item.due <= 0,
      };
    });
  }

  function loopStatus() {
    return {
      attested: !!state.attested,
      periodClosed: !!state.periodClosed,
      payoutApproved: !!state.payoutApproved,
    };
  }

  function renderLoopTrack(el) {
    if (!el) return;
    const L = loopStatus();
    const steps = [
      { key: "attest", label: "Attest", done: L.attested, blocked: false, open: !L.attested },
      { key: "close", label: "Period close", done: L.periodClosed, blocked: !L.attested && !L.periodClosed, open: L.attested && !L.periodClosed },
      { key: "approve", label: "Payout Approve", done: L.payoutApproved, blocked: !L.periodClosed && !L.payoutApproved, open: L.periodClosed && !L.payoutApproved },
    ];
    el.innerHTML = steps.map(function (s) {
      const cls = s.done ? "done" : s.blocked ? "blocked" : s.open ? "open" : "";
      const stateTxt = s.done ? "Done" : s.blocked ? "Gated" : "Next";
      return '<div class="loop-step ' + cls + '"><div class="ls-label">' + esc(s.label) + '</div><div class="ls-state">' + stateTxt + '</div></div>';
    }).join("");
  }

  function $(sel) { return document.querySelector(sel); }
  function toast(msg) {
    const el = $("#toast"); el.textContent = msg; el.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove("show"), 2200);
  }
  function showView(name) {
    currentView = name;
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    const el = document.getElementById("view-" + name);
    if (el) el.classList.add("active");
    const primary = ["today", "members", "ledger", "cycles", "more"];
    document.querySelectorAll("#bottom-nav button").forEach((b) => {
      if (primary.includes(name)) b.classList.toggle("active", b.dataset.nav === name);
      else b.classList.toggle("active", b.dataset.nav === "more");
    });
    render(); window.scrollTo(0, 0);
  }
  function openModal(title, html) {
    $("#modal-title").textContent = title; $("#modal-body").innerHTML = html;
    $("#modal").classList.add("open"); $("#modal").setAttribute("aria-hidden", "false");
  }
  function closeModal() {
    $("#modal").classList.remove("open"); $("#modal").setAttribute("aria-hidden", "true");
  }
  function renderNavVisibility() {
    document.querySelectorAll("#bottom-nav button[data-mod]").forEach((btn) => {
      btn.classList.toggle("hidden-nav", !state.modules[btn.dataset.mod]);
    });
  }
  function renderHistoryPanel(el, limit) {
    if (!el) return;
    const hist = (state.history || []).slice(0, limit || 8);
    if (!hist.length) { el.innerHTML = '<div class="empty">No completions yet — run a process from the queue</div>'; return; }
    el.innerHTML = hist.map((h) => `
      <div class="history-item"><div><strong>${esc(h.title)}</strong> · done</div>
      <div class="h-meta">${fmtDate(h.completedAt)} · next ${fmtDate(h.nextDueSet)}${h.note ? " · " + esc(h.note) : ""}</div></div>`).join("");
  }

  function renderToday() {
    $("#today-date").textContent = todayLabel();
    const queue = buildQueue();
    $("#today-count").innerHTML = '<span class="dot"></span> ' + queue.length + " due";
    $("#kpi-pot").textContent = fmtMoney(potBalance());
    $("#kpi-late").textContent = String(state.members.filter((m) => m.status === "late" || m.status === "pending").length);
    const root = $("#today-queue");
    root.innerHTML = queue.length ? queue.map((item) => `
      <button type="button" class="row sev-${item.severity}" data-process="${item.processId}">
        <div class="row-icon">${item.icon}</div>
        <div class="row-body"><div class="row-title">${esc(item.title)}</div><div class="row-meta">${esc(item.meta)}</div></div>
        <div class="row-right"><span class="badge ${item.severity === "red" ? "danger" : item.severity === "amber" ? "warn" : "ok"}">${item.due < 0 ? "Overdue" : item.due === 0 ? "Today" : item.due + "d"}</span></div>
      </button>`).join("") : '<div class="empty">Nothing due — books are clear for now.</div>';
    renderLoopTrack($("#loop-track"));
    const rem = buildReminders();
    const rp = $("#reminder-panel");
    const rb = $("#reminder-badge");
    if (rb) rb.textContent = rem.length ? rem.length + " queued" : "auto";
    if (!rem.length) {
      rp.innerHTML = '<div class="empty">No scheduled reminders</div>';
    } else {
      rp.innerHTML = rem.map((r) => `
        <button type="button" class="reminder-item ${r.due <= 0 ? "due-now" : ""}" ${r.processId ? 'data-process="' + r.processId + '"' : ""}>
          <div class="r-time">${esc(r.when)}</div>
          <div class="r-body">${esc(r.title)}<div class="r-src ${r.quietShifted ? "quiet" : ""}">${esc(r.src)}</div></div>
        </button>`).join("");
    }
    const en = $("#btn-enable-notifs");
    if (en) {
      const perm = notifPermission();
      if (perm === "granted") en.textContent = "Notifications on";
      else if (perm === "denied") en.textContent = "Notifications blocked";
      else if (perm === "unsupported") en.textContent = "Notifications unsupported";
      else en.textContent = "Enable notifications";
    }
    renderHistoryPanel($("#history-panel"), 5);
  }

  function renderMembers() {
    $("#members-list").innerHTML = state.members.map((m) => `
      <div class="row sev-${m.status === "late" ? "red" : m.status === "pending" ? "amber" : "green"}">
        <div class="row-icon">👤</div>
        <div class="row-body">
          <div class="row-title">${esc(m.name)}</div>
          <div class="row-meta">${esc(m.role)} · ${esc(m.phone)}</div>
        </div>
        <div class="row-right"><span class="badge ${m.status === "paid" ? "ok" : m.status === "late" ? "danger" : "warn"}">${esc(m.status)}</span></div>
      </div>`).join("");
  }

  function renderLedger() {
    $("#period-badge").textContent = state.period.label;
    const pct = Math.min(100, Math.round((state.period.received / state.period.expected) * 100));
    $("#period-meta").textContent = fmtMoney(state.period.received) + " / " + fmtMoney(state.period.expected) + " · closes " + fmtDate(state.period.closesAt) + (state.attested ? " · attested" : " · attest pending") + (state.periodClosed ? " · closed" : "");
    $("#period-bar").style.width = pct + "%";
    $("#ledger-list").innerHTML = state.ledger.map((e) => `
      <div class="ledger-row">
        <div><strong>${esc(e.label)}</strong><div class="h-meta">${fmtDate(e.at)} · ${esc(e.kind)}</div></div>
        <div class="ledger-amt ${e.amount >= 0 ? "pos" : "neg"}">${e.amount >= 0 ? "+" : ""}${fmtMoney(e.amount)}</div>
      </div>`).join("");
  }

  function renderCycles() {
    renderLoopTrack($("#loop-track-cycles"));
    const L = loopStatus();
    const hint = $("#loop-gate-hint");
    if (hint) {
      if (!L.attested) hint.textContent = "Run Attest September roll first (ProcessRunner). Period close and payout Approve stay gated.";
      else if (!L.periodClosed) hint.textContent = "Roll attested. Run Close September period next — then payout Approve unlocks.";
      else if (!L.payoutApproved) hint.textContent = "Period closed. Committee can Approve the payout sheet (button or payout ProcessRunner).";
      else hint.textContent = "Loop complete for this demo cycle. Reset demo or wait for next cadence to re-open.";
    }
    const card = $("#payout-approve");
    const canApprove = L.periodClosed && !L.payoutApproved;
    if (L.payoutApproved) card.classList.add("hidden"); else card.classList.remove("hidden");
    const approveBtn = $("#btn-payout-approve");
    if (approveBtn) {
      approveBtn.disabled = !canApprove;
      approveBtn.title = canApprove ? "Committee Approves release" : "Close the period first";
    }
    const copy = $("#payout-copy");
    if (copy) {
      if (!L.periodClosed) copy.textContent = "Payout Approve is gated until attest → period close complete. App prepared the sheet — humans still Approve. Not financial or legal advice.";
      else if (!L.payoutApproved) copy.textContent = "Period is closed. Review the sheet, then committee Approves release. App does not move money.";
      else copy.textContent = "Payout sheet Approved (demo).";
    }
    const badge = $("#payout-sheet-badge");
    if (badge) badge.textContent = L.payoutApproved ? "approved" : L.periodClosed ? "ready" : "draft";
    $("#payout-sheet").innerHTML = state.payoutSheet.map((p) => `
      <div class="ledger-row">
        <div><strong>#${p.position} ${esc(memberName(p.memberId))}</strong><div class="h-meta">${esc(p.note)}</div></div>
        <div class="ledger-amt pos">${fmtMoney(p.amount)}</div>
      </div>`).join("");
    $("#cycle-history").innerHTML = state.cycles.map((c) => `
      <div class="ledger-row">
        <div><strong>${esc(c.label)}</strong><div class="h-meta">${esc(c.beneficiary)}</div></div>
        <div class="ledger-amt neg">${fmtMoney(c.amount)} · ${esc(c.status)}</div>
      </div>`).join("") || '<div class="empty">No prior cycles</div>';
  }

  function renderMore() {
    const items = [
      { id: "loans", mod: "loans", icon: "💸", title: "Loans / advances", meta: "Log only · not NCR" },
      { id: "disputes", mod: "disputes", icon: "⚠", title: "Disputes", meta: "Open items" },
      { id: "meeting", mod: "meeting", icon: "📋", title: "Meeting pack", meta: "Text + JSON from books" },
      { id: "science", mod: "science", icon: "🔬", title: "Science Desk", meta: "Weekly tips · methods" },
      { id: "settings", mod: null, icon: "⚙", title: "Settings", meta: "Modules · processes" },
    ];
    $("#more-grid").innerHTML = items.filter((i) => !i.mod || state.modules[i.mod]).map((i) => `
      <button type="button" class="more-item" data-nav="${i.id}">
        <div class="mi-icon">${i.icon}</div>
        <div class="mi-body"><div class="mi-title">${i.title}</div><div class="mi-meta">${i.meta}</div></div>
        <div class="mi-chevron">›</div>
      </button>`).join("");
  }

  function renderLoans() {
    $("#loans-list").innerHTML = state.loans.map((ln) => `
      <div class="row sev-${ln.status === "open" ? "amber" : "green"}">
        <div class="row-icon">💸</div>
        <div class="row-body">
          <div class="row-title">${esc(memberName(ln.memberId))} · ${fmtMoney(ln.amount)}</div>
          <div class="row-meta">${fmtDate(ln.at)} · ${esc(ln.note)}</div>
        </div>
        <div class="row-right"><span class="badge ${ln.status === "open" ? "warn" : "ok"}">${esc(ln.status)}</span></div>
      </div>`).join("") || '<div class="empty">No loans logged</div>';
  }

  function renderDisputes() {
    $("#disputes-list").innerHTML = state.disputes.map((d) => `
      <div class="row sev-${d.status === "open" ? "red" : "green"}">
        <div class="row-icon">⚠</div>
        <div class="row-body">
          <div class="row-title">${esc(d.title)}</div>
          <div class="row-meta">${fmtDate(d.openedAt)} · ${esc(d.note)}</div>
        </div>
        <div class="row-right"><span class="badge ${d.status === "open" ? "danger" : "ok"}">${esc(d.status)}</span></div>
      </div>`).join("");
  }

  function renderSettings() {
    const settingsView = document.getElementById("view-settings");
    if (settingsView && !document.getElementById("profile-card")) {
      const card = document.createElement("div");
      card.className = "card mb-12";
      card.id = "profile-card";
      card.innerHTML = '<div class="card-head"><h3>Location &amp; purpose</h3><span class="badge teal">adapt</span></div><p id="profile-summary" style="font-size:15px;color:var(--text-dim);margin-bottom:10px"></p><button type="button" class="btn btn-ghost btn-block" id="btn-redo-onboard">Change city / purpose</button>';
      const first = settingsView.querySelector(".card, .toggle-list, #module-toggles");
      if (first) {
        const wrap = first.closest(".card") || first;
        settingsView.insertBefore(card, wrap);
      } else settingsView.insertBefore(card, settingsView.firstChild);
      document.getElementById("btn-redo-onboard").addEventListener("click", function () { state.profile.onboarded = false; save(); showOnboarding(); });
    }
    const ps = document.getElementById("profile-summary");
    if (ps && state.profile) ps.textContent = (state.profile.city || "—") + " · " + (state.profile.purpose || "—");

    const labels = { members: "Members", ledger: "Ledger / period", cycles: "Cycles / payout", loans: "Loans / advances", disputes: "Disputes", meeting: "Meeting pack", science: "Science Desk"
    };
    $("#module-toggles").innerHTML = Object.keys(DEFAULT_MODULES).map((k) => `
      <label class="toggle-row">
        <div><div class="t-label">${labels[k] || k}</div><div class="t-meta">Show in nav / More</div></div>
        <div class="switch"><input type="checkbox" data-mod-toggle="${k}" ${state.modules[k] ? "checked" : ""} /><span class="slider"></span></div>
      </label>`).join("");
    $("#process-list").innerHTML = state.processes.map((p) => {
      const def = PROCESS_TYPES[p.type] || PROCESS_TYPES.custom;
      return `<button type="button" class="row btn-like" data-edit-process="${p.id}">
        <div class="row-icon">${def.icon || "◎"}</div>
        <div class="row-body"><div class="row-title">${esc(p.title)}</div>
        <div class="row-meta">${esc(def.label)} · next ${fmtDate(p.nextDue)} · every ${p.cadenceDays}d</div></div>
        <div class="row-right"><span class="badge muted">edit</span></div></button>`;
    }).join("") || '<div class="empty">No processes</div>';
    renderHistoryPanel($("#history-list-full"), 20);
    const prefs = getPrefs();
    const qs = $("#quiet-start");
    const qe = $("#quiet-end");
    const pn = $("#pref-notifs");
    const ns = $("#notif-status");
    if (qs && document.activeElement !== qs) qs.value = String(prefs.quietStart);
    if (qe && document.activeElement !== qe) qe.value = String(prefs.quietEnd);
    if (pn) pn.checked = !!prefs.notificationsEnabled;
    if (ns) {
      const perm = notifPermission();
      ns.textContent = "Permission: " + perm + (inQuietHours(new Date()) ? " · currently in quiet hours" : " · outside quiet hours");
    }
  }

  function render() {
    renderNavVisibility();
    if (currentView === "science") renderScience();
    renderToday();
    if (state.modules.members) renderMembers();
    if (state.modules.ledger) renderLedger();
    if (state.modules.cycles) renderCycles();
    renderMore();
    if (state.modules.loans) renderLoans();
    if (state.modules.disputes) renderDisputes();
    renderSettings();
  }

  /* ProcessRunner */
  let prState = null;
  function getProcess(id) { return (state.processes || []).find((p) => p.id === id); }
  function prPhases(proc) {
    const def = PROCESS_TYPES[proc.type] || PROCESS_TYPES.custom;
    return ["start", ...(def.steps || []).map((_, i) => "step:" + i), "done", "nextdue"];
  }
  function loopGateMessage(proc) {
    const def = PROCESS_TYPES[proc.type] || PROCESS_TYPES.custom;
    if (def.requires === "attested" && !state.attested) {
      return "Attest the period roll first — period close stays gated.";
    }
    if (def.requires === "periodClosed" && !state.periodClosed) {
      return "Close the period first — payout Approve stays gated until then.";
    }
    return null;
  }

  function openProcessRunner(processId) {
    const proc = getProcess(processId);
    if (!proc) { toast("Process not found"); return; }
    const gate = loopGateMessage(proc);
    if (gate) { toast(gate); return; }
    prState = { processId, phaseIndex: 0, answers: {}, checks: {} };
    $("#process-runner").classList.add("open");
    $("#process-runner").setAttribute("aria-hidden", "false");
    renderProcessRunner();
  }
  function closeProcessRunner() {
    prState = null;
    $("#process-runner").classList.remove("open");
    $("#process-runner").setAttribute("aria-hidden", "true");
  }
  function suggestNextDue(proc) {
    const days = Number(proc.cadenceDays) || (PROCESS_TYPES[proc.type] || PROCESS_TYPES.custom).defaultCadenceDays || 30;
    return isoDate(addDays(new Date(), Math.max(1, days || 30)));
  }
  function renderAccountLinks(proc) {
    const links = proc.accountLinks || [];
    if (!links.length) return `<div class="pr-card"><p style="font-size:12px;color:var(--muted)">No account link yet — add in Settings.</p></div>`;
    return `<div class="pr-card"><h4>Account links</h4>` + links.map((a) =>
      `<button type="button" class="pr-link-btn" data-open-link="${esc(a.url)}"><span>Open · ${esc(a.label)}</span><span>↗</span></button>`).join("") + `</div>`;
  }
  function renderProcessRunner() {
    if (!prState) return;
    const proc = getProcess(prState.processId);
    if (!proc) return closeProcessRunner();
    const def = PROCESS_TYPES[proc.type] || PROCESS_TYPES.custom;
    const phases = prPhases(proc);
    const phase = phases[prState.phaseIndex];
    $("#pr-title").textContent = proc.title;
    $("#pr-badge").textContent = (prState.phaseIndex + 1) + "/" + phases.length;
    $("#pr-stepper").innerHTML = phases.map((_, i) =>
      `<span class="${i < prState.phaseIndex ? "done" : i === prState.phaseIndex ? "on" : ""}"></span>`).join("");
    const body = $("#pr-body"); const actions = $("#pr-actions");
    let html = "", act = "";
    if (phase === "start") {
      const lateN = state.members.filter((m) => m.status === "late" || m.status === "pending").length;
      const openD = state.disputes.filter((d) => d.status === "open").length;
      const L = loopStatus();
      const booksSnap = (proc.type === "attest" || proc.type === "period_close" || proc.type === "payout_prep") ? `
        <div class="pr-card"><h4>Live books</h4>
          <p>${esc(state.period.label)} · ${fmtMoney(state.period.received)} / ${fmtMoney(state.period.expected)}</p>
          <p style="margin-top:6px;font-size:13px;color:var(--muted)">Late/pending: ${lateN} · Open disputes: ${openD} · Pot ${fmtMoney(potBalance())}</p>
          <p style="margin-top:6px;font-size:13px;color:var(--muted)">Loop: attest ${L.attested ? "✓" : "·"} → close ${L.periodClosed ? "✓" : "·"} → Approve ${L.payoutApproved ? "✓" : "·"}</p>
        </div>` : "";
      html = `<div class="pr-phase-label">Start</div><div class="pr-title">${esc(proc.title)}</div>
        <div class="pr-meta">${esc(def.label)} · due ${fmtDate(proc.nextDue)} · cadence every ${proc.cadenceDays || "—"} days</div>
        <div class="pr-card"><h4>What happens</h4><p>Guided ProcessRunner (${def.steps.length} steps) — not a checklist. Confirm next due on complete.</p>
        <p style="margin-top:8px;font-size:12px;color:var(--muted)">${esc(def.disclaimer || "")}</p></div>
        ${booksSnap}
        ${renderAccountLinks(proc)}
        ${proc.meta && proc.meta.amount ? `<div class="pr-card"><h4>Amount</h4><p>${fmtMoney(proc.meta.amount)}</p></div>` : ""}
        ${proc.meta && proc.meta.memberId ? `<div class="pr-card"><h4>Member</h4><p>${esc(memberName(proc.meta.memberId))}</p></div>` : ""}`;
      act = `<button type="button" class="btn btn-ghost" id="pr-cancel">Cancel</button><button type="button" class="btn btn-primary" id="pr-next">Start →</button>`;
    } else if (phase.startsWith("step:")) {
      const si = Number(phase.split(":")[1]); const step = def.steps[si];
      const showLinks = ["member", "approve", "account"].includes(step.key) || si === 0;
      let gateHtml = "";
      if (step.key === "gate") {
        const L = loopStatus();
        if (proc.type === "period_close") {
          gateHtml = `<div class="pr-card"><h4>Gate</h4><p>${L.attested ? "Attest complete — you may close." : "Attest missing — go back and run attest first."}</p></div>`;
        } else if (proc.type === "payout_prep") {
          gateHtml = `<div class="pr-card"><h4>Gate</h4><p>${L.periodClosed ? "Period closed — committee may Approve." : "Period still open — close books first."}</p></div>`;
        }
      }
      if (step.key === "totals" || step.key === "review") {
        const late = state.members.filter((m) => m.status === "late" || m.status === "pending");
        gateHtml += `<div class="pr-card"><h4>Roll snapshot</h4>` +
          state.members.slice(0, 10).map((m) => `<p style="font-size:13px">${esc(m.name)} · <strong>${esc(m.status)}</strong></p>`).join("") +
          (late.length ? `<p style="margin-top:8px;font-size:12px;color:var(--muted)">${late.length} late/pending</p>` : "") +
          `</div>`;
      }
      if (step.key === "sheet") {
        gateHtml += `<div class="pr-card"><h4>Payout sheet</h4>` +
          state.payoutSheet.map((p) => `<p style="font-size:13px">#${p.position} ${esc(memberName(p.memberId))} · ${fmtMoney(p.amount)} · ${esc(p.note)}</p>`).join("") +
          `</div>`;
      }
      if (step.key === "disputes") {
        const open = state.disputes.filter((d) => d.status === "open");
        gateHtml += `<div class="pr-card"><h4>Open disputes</h4>` +
          (open.length ? open.map((d) => `<p style="font-size:13px">${esc(d.title)} — ${esc(d.note)}</p>`).join("") : "<p>None open</p>") +
          `</div>`;
      }
      html = `<div class="pr-phase-label">Step ${si + 1} of ${def.steps.length}</div>
        <div class="pr-title">${esc(step.title)}</div><div class="pr-meta">${esc(step.body)}</div>
        ${gateHtml}
        ${showLinks ? renderAccountLinks(proc) : ""}
        ${step.checks ? `<div class="pr-card">${step.checks.map((c, i) =>
          `<label class="pr-check"><input type="checkbox" data-pr-check="${si}-${i}" ${prState.checks[si+"-"+i] ? "checked" : ""} /><span>${esc(c)}</span></label>`).join("")}</div>` : ""}
        ${step.input === "amount" ? `<div class="form-row"><label>Amount (ZAR)</label><input type="number" id="pr-amount" value="${esc(prState.answers.amount || (proc.meta && proc.meta.amount) || state.group.contribution)}" /></div>` : ""}
        ${step.input === "note" ? `<div class="form-row"><label>Notes</label><textarea id="pr-note">${esc(prState.answers.note || "")}</textarea></div>` : ""}
        <p style="font-size:11px;color:var(--muted);margin-top:8px">${esc(def.disclaimer || "")}</p>`;
      act = `<button type="button" class="btn btn-ghost" id="pr-back">Back</button><button type="button" class="btn btn-primary" id="pr-next">Continue →</button>`;
    } else if (phase === "done") {
      html = `<div class="pr-done-hero"><div class="big">✓</div><h4>Marked done</h4><p class="pr-meta">${esc(proc.title)} complete.</p></div>
        <div class="pr-card"><h4>Next</h4><p>Set next due so this returns to Today.</p></div>`;
      act = `<button type="button" class="btn btn-ghost" id="pr-back">Back</button><button type="button" class="btn btn-primary" id="pr-next">Set next due →</button>`;
    } else if (phase === "nextdue") {
      const suggested = prState.suggestedNext || suggestNextDue(proc); prState.suggestedNext = suggested;
      html = `<div class="pr-phase-label">Next due</div><div class="pr-title">When should this return?</div>
        <div class="form-row"><label>Next due date</label><input type="date" id="pr-next-due" value="${suggested}" /></div>
        <div class="form-row"><label>Cadence (days)</label><input type="number" id="pr-cadence" value="${proc.cadenceDays || 30}" min="1" /></div>
        <div class="form-row"><label>Note</label><input type="text" id="pr-final-note" value="${esc(prState.answers.note || "")}" /></div>`;
      act = `<button type="button" class="btn btn-ghost" id="pr-back">Back</button><button type="button" class="btn btn-primary" id="pr-finish">Confirm &amp; close</button>`;
    }
    body.innerHTML = html; actions.innerHTML = act;
    $("#pr-cancel")?.addEventListener("click", closeProcessRunner);
    $("#pr-back")?.addEventListener("click", () => { if (prState.phaseIndex > 0) { prState.phaseIndex--; renderProcessRunner(); } });
    $("#pr-next")?.addEventListener("click", () => {
      if (!validatePrStep(phase, def)) return;
      const note = document.getElementById("pr-note"); if (note) prState.answers.note = note.value.trim();
      const amt = document.getElementById("pr-amount"); if (amt) prState.answers.amount = amt.value.trim();
      prState.phaseIndex++; renderProcessRunner();
    });
    $("#pr-finish")?.addEventListener("click", () => finishProcess(proc));
    body.querySelectorAll("[data-pr-check]").forEach((el) => el.addEventListener("change", () => { prState.checks[el.getAttribute("data-pr-check")] = el.checked; }));
    body.querySelectorAll("[data-open-link]").forEach((btn) => btn.addEventListener("click", () => {
      const url = btn.getAttribute("data-open-link"); if (url) window.open(url, "_blank", "noopener,noreferrer");
    }));
  }
  function validatePrStep(phase, def) {
    if (!phase.startsWith("step:")) return true;
    const si = Number(phase.split(":")[1]); const step = def.steps[si];
    if (step.checks) {
      for (let i = 0; i < step.checks.length; i++) {
        if (!prState.checks[si + "-" + i]) { toast("Tick all confirmations to continue"); return false; }
      }
    }
    return true;
  }
  function finishProcess(proc) {
    const nextDue = (document.getElementById("pr-next-due") && document.getElementById("pr-next-due").value) || suggestNextDue(proc);
    const cadence = Math.max(1, Number(document.getElementById("pr-cadence") && document.getElementById("pr-cadence").value) || proc.cadenceDays || 30);
    const note = (document.getElementById("pr-final-note") && document.getElementById("pr-final-note").value.trim()) || prState.answers.note || "";
    proc.nextDue = nextDue; proc.cadenceDays = cadence; proc.lastCompletedAt = isoDate(new Date());

    if (proc.type === "record_contribution" && proc.meta && proc.meta.memberId) {
      const m = state.members.find((x) => x.id === proc.meta.memberId);
      const amt = Number(prState.answers.amount) || proc.meta.amount || state.group.contribution;
      if (m) m.status = "paid";
      state.ledger.unshift({ id: uid("l"), at: isoDate(new Date()), memberId: proc.meta.memberId, label: "Contribution — " + (m ? m.name : ""), amount: amt, kind: "in" });
      state.period.received = Math.min(state.period.expected, state.period.received + amt);
    }
    const nowIso = new Date().toISOString();
    if (proc.type === "attest") {
      state.attested = true;
      state.attestedAt = nowIso;
    }
    if (proc.type === "period_close") {
      if (!state.attested) { toast("Attest first"); return; }
      if (!String(state.period.label).startsWith("Closed")) {
        state.period.label = "Closed · " + state.period.label;
      }
      state.attested = true;
      state.periodClosed = true;
      state.periodClosedAt = nowIso;
    }
    if (proc.type === "payout_prep") {
      if (!state.periodClosed) { toast("Close period first"); return; }
      state.payoutApproved = true;
      state.payoutApprovedAt = nowIso;
      const next = state.payoutSheet[0];
      if (next) {
        state.cycles.unshift({
          id: uid("cy"),
          label: state.period.label.replace(/^Closed · /, ""),
          beneficiary: memberName(next.memberId),
          amount: next.amount,
          status: "approved-demo",
        });
      }
    }

    state.history.unshift({ id: uid("h"), processId: proc.id, title: proc.title, type: proc.type, completedAt: isoDate(new Date()), nextDueSet: nextDue, note });
    if (state.history.length > 50) state.history.length = 50;
    save();
    scheduleReminderForProcess(proc);
    closeProcessRunner();
    render();
    toast("Done · next due " + fmtDate(nextDue));
  }

  function openAddProcessModal(editId) {
    const editing = editId ? getProcess(editId) : null;
    const types = Object.keys(PROCESS_TYPES).map((k) =>
      `<option value="${k}" ${editing && editing.type === k ? "selected" : ""}>${esc(PROCESS_TYPES[k].label)}</option>`).join("");
    openModal(editing ? "Edit process" : "Add recurring process", `
      <div class="form-row"><label>Title</label><input type="text" id="np-title" value="${editing ? esc(editing.title) : ""}" /></div>
      <div class="form-row"><label>Process type</label><select id="np-type">${types}</select></div>
      <div class="form-row"><label>Next due</label><input type="date" id="np-due" value="${editing ? editing.nextDue : isoDate(addDays(new Date(), 1))}" /></div>
      <div class="form-row"><label>Cadence (days)</label><input type="number" id="np-cadence" min="1" value="${editing ? editing.cadenceDays : 30}" /></div>
      <div class="form-row"><label>Lead days</label><input type="number" id="np-lead" min="0" value="${editing ? editing.leadDays : 5}" /></div>
      <div class="form-row"><label>Account link label</label><input type="text" id="np-link-label" value="${editing && editing.accountLinks && editing.accountLinks[0] ? esc(editing.accountLinks[0].label) : ""}" /></div>
      <div class="form-row"><label>Account link URL</label><input type="url" id="np-link-url" value="${editing && editing.accountLinks && editing.accountLinks[0] ? esc(editing.accountLinks[0].url) : ""}" /></div>
      <div class="btn-row"><button type="button" class="btn btn-primary btn-block" id="np-save">${editing ? "Save" : "Add process"}</button></div>
      ${editing ? `<button type="button" class="btn btn-danger btn-block" id="np-run" style="margin-top:8px">Run wizard now</button>
                   <button type="button" class="btn btn-ghost btn-block" id="np-delete" style="margin-top:8px">Delete</button>` : ""}
      <p style="font-size:11px;color:var(--muted);margin-top:10px">NOT a bank. Links open in a new tab.</p>`);
    setTimeout(() => {
      $("#np-save")?.addEventListener("click", () => {
        const title = $("#np-title").value.trim(); if (!title) { toast("Enter a title"); return; }
        const type = $("#np-type").value;
        const nextDue = $("#np-due").value || isoDate(addDays(new Date(), 1));
        const cadenceDays = Math.max(1, Number($("#np-cadence").value) || 30);
        const leadDays = Math.max(0, Number($("#np-lead").value) || 5);
        const label = $("#np-link-label").value.trim(); const url = $("#np-link-url").value.trim();
        const links = label && url ? [{ label, url }] : url ? [{ label: "Open", url }] : [];
        const moduleGuess = type === "payout_prep" ? "cycles" : "ledger";
        if (editing) Object.assign(editing, { title, type, nextDue, cadenceDays, leadDays, module: moduleGuess, accountLinks: links.length ? links : editing.accountLinks || [] });
        else state.processes.unshift({ id: uid("pr"), type, title, nextDue, cadenceDays, leadDays, module: moduleGuess, accountLinks: links, meta: {} });
        save(); closeModal(); render(); toast(editing ? "Updated" : "Added");
      });
      $("#np-run")?.addEventListener("click", () => { closeModal(); openProcessRunner(editing.id); });
      $("#np-delete")?.addEventListener("click", () => {
        if (!confirm("Delete?")) return;
        state.processes = state.processes.filter((p) => p.id !== editing.id);
        save(); closeModal(); render(); toast("Deleted");
      });
    }, 0);
  }

  function buildMeetingPackObject() {
    const L = loopStatus();
    return {
      app: "group-money",
      kind: "meeting-pack",
      version: 1,
      generatedAt: new Date().toISOString(),
      disclaimer: "Demo only. NOT a bank statement. NOT financial, NCR, or legal advice. Faceless Plain Desk.",
      group: state.group,
      period: state.period,
      loop: {
        attested: L.attested,
        attestedAt: state.attestedAt || null,
        periodClosed: L.periodClosed,
        periodClosedAt: state.periodClosedAt || null,
        payoutApproved: L.payoutApproved,
        payoutApprovedAt: state.payoutApprovedAt || null,
      },
      potBalance: potBalance(),
      agenda: [
        "1. Attendance / apologies",
        "2. Attest contribution roll",
        "3. Period close totals + late notes",
        "4. Payout sheet review + committee Approve",
        "5. Open disputes",
        "6. Open loans / advances (log only)",
        "7. Next meeting",
      ],
      roll: state.members.map(function (m) {
        return { id: m.id, name: m.name, role: m.role, status: m.status, phone: m.phone };
      }),
      ledgerRecent: (state.ledger || []).slice(0, 20),
      payoutSheet: state.payoutSheet.map(function (p) {
        return {
          position: p.position,
          memberId: p.memberId,
          memberName: memberName(p.memberId),
          amount: p.amount,
          note: p.note,
        };
      }),
      cycles: state.cycles,
      disputesOpen: state.disputes.filter(function (d) { return d.status === "open"; }),
      loansOpen: state.loans.filter(function (l) { return l.status === "open"; }),
      relatedPack: GUMROAD,
    };
  }

  function meetingPackText(pack) {
    const lines = [
      (pack.group && pack.group.name ? pack.group.name.toUpperCase() : "GROUP MONEY") + " — MEETING PACK",
      "Generated: " + todayLabel() + " (" + pack.generatedAt + ")",
      pack.disclaimer,
      "",
      "== Agenda ==",
      ...pack.agenda,
      "",
      "== Period ==",
      pack.period.label + " · " + fmtMoney(pack.period.received) + " / " + fmtMoney(pack.period.expected),
      "Closes: " + pack.period.closesAt,
      "Pot (demo): " + fmtMoney(pack.potBalance),
      "",
      "== Loop (attest → close → Approve) ==",
      "Attested: " + (pack.loop.attested ? "yes @ " + (pack.loop.attestedAt || "—") : "no"),
      "Period closed: " + (pack.loop.periodClosed ? "yes @ " + (pack.loop.periodClosedAt || "—") : "no"),
      "Payout Approved: " + (pack.loop.payoutApproved ? "yes @ " + (pack.loop.payoutApprovedAt || "—") : "pending"),
      "",
      "== Attendance / contribution roll ==",
      ...pack.roll.map(function (m) { return m.name + " · " + m.role + " · " + m.status; }),
      "",
      "== Recent ledger ==",
      ...pack.ledgerRecent.map(function (e) {
        return e.at + " · " + e.label + " · " + (e.amount >= 0 ? "+" : "") + fmtMoney(e.amount) + " · " + e.kind;
      }),
      "",
      "== Payout sheet ==",
      ...pack.payoutSheet.map(function (p) {
        return "#" + p.position + " " + p.memberName + " · " + fmtMoney(p.amount) + " · " + p.note;
      }),
      "",
      "== Open disputes ==",
      ...(pack.disputesOpen.length
        ? pack.disputesOpen.map(function (d) { return d.title + " — " + d.note; })
        : ["(none)"]),
      "",
      "== Loans open (log only · not NCR) ==",
      ...(pack.loansOpen.length
        ? pack.loansOpen.map(function (l) {
            return memberName(l.memberId) + " · " + fmtMoney(l.amount) + " · " + l.note;
          })
        : ["(none)"]),
      "",
      "Related printable pack: " + pack.relatedPack,
    ];
    return lines.join("\n");
  }

  function exportMeetingPack() {
    const pack = buildMeetingPackObject();
    const text = meetingPackText(pack);
    const out = $("#export-out");
    out.style.display = "block";
    out.textContent = text;
    toast("Meeting pack from live books");
  }

  function downloadMeetingPackJson() {
    const pack = buildMeetingPackObject();
    const blob = new Blob([JSON.stringify(pack, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "group-money-meeting-pack-" + isoDate(new Date()) + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    const out = $("#export-out");
    out.style.display = "block";
    out.textContent = meetingPackText(pack);
    toast("Meeting pack JSON downloaded");
  }


  /* PLATFORM_BAR_2026_09_11 helpers */
  function renderScience() {
    const root = document.getElementById("science-tips");
    if (!root) return;
    root.innerHTML = SCIENCE_TIPS.map((t) =>
      '<div class="science-tip"><h4>' + esc(t.h) + '</h4><p>' + esc(t.body) + '</p><div class="method">' + esc(t.method) + '</div></div>'
    ).join("");
  }

  function applyPurposeModules(purpose) {
    const preset = PURPOSE_MODULE_PRESETS[purpose];
    if (!preset || !state.modules) return;
    Object.keys(state.modules).forEach((k) => {
      if (Object.prototype.hasOwnProperty.call(preset, k)) state.modules[k] = !!preset[k];
    });
  }

  function updateBrandLocation() {
    const sub = document.querySelector(".brand-text p");
    if (!sub || !state.profile) return;
    const city = state.profile.city || "";
    const purpose = state.profile.purpose || "";
    if (city || purpose) sub.textContent = [city, purpose].filter(Boolean).join(" · ");
  }

  function showOnboarding() {
    const el = document.getElementById("onboard");
    if (!el) return;
    const city = document.getElementById("ob-city");
    const purpose = document.getElementById("ob-purpose");
    if (city && state.profile) city.value = state.profile.city || "Bloemfontein";
    if (purpose && state.profile) purpose.value = state.profile.purpose || "stokvel";
    el.classList.add("open");
    el.setAttribute("aria-hidden", "false");
  }

  function hideOnboarding() {
    const el = document.getElementById("onboard");
    if (!el) return;
    el.classList.remove("open");
    el.setAttribute("aria-hidden", "true");
  }

  function completeOnboarding() {
    const city = (document.getElementById("ob-city") && document.getElementById("ob-city").value || "").trim();
    const purpose = (document.getElementById("ob-purpose") && document.getElementById("ob-purpose").value) || "";
    if (!city) { toast("Enter your city / region"); return; }
    if (!purpose) { toast("Choose what you run"); return; }
    state.profile = { onboarded: true, city: city, purpose: purpose, updatedAt: new Date().toISOString() };
    applyPurposeModules(purpose);
    save();
    hideOnboarding();
    updateBrandLocation();
    render();
    toast("Saved · modules adapted");
  }

  function maybeOnboard() {
    if (!state.profile) state.profile = { onboarded: false, city: "", purpose: "", updatedAt: null };
    if (!state.profile.onboarded) showOnboarding();
    else updateBrandLocation();
  }


  function resetDemo() {
    if (!confirm("Reset all Group Money demo data?")) return;
    Object.keys(reminderTimers).forEach(clearReminderTimer);
    state = seed(); save(); showView("today");
    updateInstallBanner();
    rescheduleAllReminders();
    toast("Demo reset");
  }

  document.getElementById("bottom-nav").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-nav]"); if (btn) showView(btn.dataset.nav);
  });
  document.getElementById("main").addEventListener("click", (e) => {
    const back = e.target.closest(".back-link[data-nav]"); if (back) { showView(back.dataset.nav); return; }
    const more = e.target.closest(".more-item[data-nav]"); if (more) { showView(more.dataset.nav); return; }
    const procBtn = e.target.closest("[data-process]"); if (procBtn) { openProcessRunner(procBtn.getAttribute("data-process")); return; }
    const editProc = e.target.closest("[data-edit-process]"); if (editProc) { openAddProcessModal(editProc.getAttribute("data-edit-process")); return; }
    const modToggle = e.target.closest("[data-mod-toggle]");
    if (modToggle) { state.modules[modToggle.dataset.modToggle] = !!modToggle.checked; save(); render(); toast((modToggle.checked ? "Enabled " : "Hidden ") + modToggle.dataset.modToggle); }
  });
  $("#btn-reset").addEventListener("click", resetDemo);
  $("#btn-reset-2").addEventListener("click", resetDemo);
  $("#btn-info").addEventListener("click", () => openModal("About Group Money",
    `<p><strong>Group Money</strong> is a mobile-first Faceless Plain Desk demo of a shared group ledger for SA stokvels, burial societies and choirs.</p>
     <p>Multi-member feel on a <strong>single device</strong>. ProcessRunner loop: <strong>attest → period close → payout Approve</strong>.</p>
     <p>Sample: Kopano Stokvel, Bloemfontein. Installable PWA · JSON backup in Settings.</p>
     <p style="font-size:12px;color:var(--muted)">NOT a bank · NOT an NCR credit provider · NOT financial or legal advice. Related printable pack: <a href="${GUMROAD}" target="_blank" rel="noopener">Stokvel OS on Gumroad</a>.</p>`));
  $("#modal-close").addEventListener("click", closeModal);
  $("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeModal(); });
  $("#pr-close").addEventListener("click", closeProcessRunner);
  $("#btn-add-process")?.addEventListener("click", () => openAddProcessModal());
  $("#btn-add-process-today")?.addEventListener("click", () => openAddProcessModal());
  $("#btn-export-pack")?.addEventListener("click", exportMeetingPack);
  $("#btn-export-pack-json")?.addEventListener("click", downloadMeetingPackJson);
  $("#btn-payout-approve")?.addEventListener("click", () => {
    if (!state.periodClosed) {
      toast("Close the period first — payout Approve is gated");
      return;
    }
    state.payoutApproved = true;
    state.payoutApprovedAt = new Date().toISOString();
    const next = state.payoutSheet[0];
    if (next) {
      state.cycles.unshift({
        id: uid("cy"),
        label: String(state.period.label).replace(/^Closed · /, ""),
        beneficiary: memberName(next.memberId),
        amount: next.amount,
        status: "approved-demo",
      });
    }
    save();
    render();
    toast("Payout sheet Approved (demo)");
  });
  $("#btn-payout-later")?.addEventListener("click", () => toast("Kept for Cycles"));
  document.getElementById("ob-save") && document.getElementById("ob-save").addEventListener("click", completeOnboarding);

  /* ── backup export / import ── */
  function collectExportPayload() {
    return {
      app: "group-money",
      version: 1,
      exportedAt: new Date().toISOString(),
      keys: {
        [STORAGE_KEY]: state,
      },
    };
  }

  function exportJson() {
    const payload = collectExportPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "group-money-backup-" + isoDate(new Date()) + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast("Exported JSON backup");
  }

  function applyImportPayload(data) {
    if (!data || typeof data !== "object") throw new Error("Invalid file");
    let next = null;
    if (data.keys && data.keys[STORAGE_KEY]) next = data.keys[STORAGE_KEY];
    else if (data.state && typeof data.state === "object") next = data.state;
    else if (data.processes || data.modules || data.members) next = data;
    else if (data.keys) {
      const vals = Object.keys(data.keys);
      if (vals.length === 1) next = data.keys[vals[0]];
    }
    if (!next || typeof next !== "object") throw new Error("No Group Money state in file");
    next.modules = Object.assign({}, DEFAULT_MODULES, next.modules || {});
    next.prefs = Object.assign(defaultPrefs(), next.prefs || {});
    if (!Array.isArray(next.processes)) next.processes = seedProcesses(startOfDay(new Date()));
    if (!Array.isArray(next.history)) next.history = [];
    if (!next.profile) next.profile = { onboarded: false, city: "", purpose: "", updatedAt: null };
    if (typeof next.attested !== "boolean") next.attested = false;
    if (typeof next.periodClosed !== "boolean") next.periodClosed = false;
    if (typeof next.payoutApproved !== "boolean") next.payoutApproved = false;
    state = next;
    save();
    rescheduleAllReminders();
    render();
    updateInstallBanner();
    toast("Import complete");
  }

  function importJsonFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const data = JSON.parse(String(reader.result || ""));
        applyImportPayload(data);
      } catch (err) {
        toast("Import failed — check JSON");
      }
    };
    reader.onerror = function () { toast("Could not read file"); };
    reader.readAsText(file);
  }

  /* ── PWA install affordance ── */
  var deferredInstall = null;
  function updateInstallBanner() {
    const banner = $("#install-banner");
    if (!banner) return;
    const prefs = getPrefs();
    const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    if (standalone || prefs.installDismissed) {
      banner.classList.add("hidden");
      return;
    }
    if (deferredInstall) {
      banner.classList.remove("hidden");
      const btn = $("#btn-install");
      if (btn) btn.textContent = "Install";
    } else {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS && !prefs.installDismissed) {
        banner.classList.remove("hidden");
        const btn = $("#btn-install");
        if (btn) btn.textContent = "How to";
      } else {
        banner.classList.add("hidden");
      }
    }
  }
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredInstall = e;
    updateInstallBanner();
  });
  window.addEventListener("appinstalled", function () {
    deferredInstall = null;
    getPrefs().installDismissed = true;
    save();
    updateInstallBanner();
    toast("Group Money installed");
  });

  $("#btn-install") && $("#btn-install").addEventListener("click", function () {
    if (deferredInstall) {
      deferredInstall.prompt();
      deferredInstall.userChoice.then(function (choice) {
        deferredInstall = null;
        if (choice && choice.outcome === "accepted") {
          getPrefs().installDismissed = true;
          save();
        }
        updateInstallBanner();
      });
      return;
    }
    openModal(
      "Add to Home Screen",
      `<p style="font-size:15px;line-height:1.55">On iPhone/iPad: Safari → Share → <strong>Add to Home Screen</strong>.</p>
       <p style="font-size:15px;line-height:1.55;margin-top:8px">On Android Chrome: menu → <strong>Install app</strong> / Add to Home screen.</p>
       <p style="font-size:13px;color:var(--muted);margin-top:10px">Offline shell caches index, app.js, styles, and manifest. NOT a bank · NOT financial or legal advice.</p>`
    );
  });
  $("#btn-install-dismiss") && $("#btn-install-dismiss").addEventListener("click", function () {
    getPrefs().installDismissed = true;
    save();
    updateInstallBanner();
  });

  $("#btn-enable-notifs") && $("#btn-enable-notifs").addEventListener("click", function () {
    getPrefs().notificationsEnabled = true;
    save();
    requestNotificationPermission().then(function () {
      checkDueNotifications();
      rescheduleAllReminders();
    });
  });
  $("#btn-request-notifs") && $("#btn-request-notifs").addEventListener("click", function () {
    getPrefs().notificationsEnabled = true;
    save();
    requestNotificationPermission().then(function () {
      checkDueNotifications();
      rescheduleAllReminders();
      render();
    });
  });
  $("#pref-notifs") && $("#pref-notifs").addEventListener("change", function (e) {
    getPrefs().notificationsEnabled = !!e.target.checked;
    save();
    if (e.target.checked) {
      requestNotificationPermission().then(function () { rescheduleAllReminders(); });
    } else {
      Object.keys(reminderTimers).forEach(clearReminderTimer);
      toast("Reminder alerts off — queue still shows in Today");
    }
    render();
  });
  function saveQuietFromInputs() {
    const prefs = getPrefs();
    const qs = $("#quiet-start");
    const qe = $("#quiet-end");
    if (qs) {
      let v = Math.max(0, Math.min(23, Number(qs.value)));
      if (Number.isNaN(v)) v = 21;
      prefs.quietStart = v;
    }
    if (qe) {
      let v = Math.max(0, Math.min(23, Number(qe.value)));
      if (Number.isNaN(v)) v = 7;
      prefs.quietEnd = v;
    }
    save();
    rescheduleAllReminders();
    toast("Quiet hours saved");
    render();
  }
  $("#quiet-start") && $("#quiet-start").addEventListener("change", saveQuietFromInputs);
  $("#quiet-end") && $("#quiet-end").addEventListener("change", saveQuietFromInputs);

  $("#btn-export-json") && $("#btn-export-json").addEventListener("click", exportJson);
  $("#btn-import-json") && $("#btn-import-json").addEventListener("click", function () {
    const f = $("#import-file");
    if (f) f.click();
  });
  $("#import-file") && $("#import-file").addEventListener("change", function (e) {
    const file = e.target.files && e.target.files[0];
    importJsonFile(file);
    e.target.value = "";
  });

  /* boot */
  maybeOnboard();
  render();
  updateInstallBanner();
  rescheduleAllReminders();
  checkDueNotifications();
  setInterval(function () {
    checkDueNotifications();
  }, 5 * 60 * 1000);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") checkDueNotifications();
  });
})();
