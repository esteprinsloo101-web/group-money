/* Group Money — static SA stokvel / burial / choir shared ledger demo
   Kopano Stokvel · Bloemfontein · localStorage · ZAR
   NOT a bank · NOT NCR · NOT financial advice */

(function () {
  "use strict";

  const STORAGE_KEY = "group-money-v4";

  /* PLATFORM_BAR_2026_09_11 */
  const SCIENCE_TIPS = [
  {
    "h": "Attest before meeting",
    "body": "Close ledger attest 48h before meeting. Note disputes raised early vs in-room.",
    "method": "Method: pre-read window \u00b7 Limit: late deposits still land"
  },
  {
    "h": "Payout checklist",
    "body": "Run payout wizard with bank link open. Tick only after EFT proof saved.",
    "method": "Method: dual control stub \u00b7 Limit: not NCR / banking advice"
  },
  {
    "h": "Dispute aging",
    "body": "List open disputes older than 14 days. Resolve or escalate one this week.",
    "method": "Method: aging triage \u00b7 Limit: member dynamics"
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
      disclaimer: "Attestation is a group transparency step — not a bank confirmation.",
      steps: [
        { key: "review", title: "Review roll", body: "Check who claims paid vs ledger." },
        { key: "attest", title: "Attest", body: "Treasurer / chair attests the roll for this period.", checks: ["I attest this period roll"] },
        { key: "confirm", title: "Lock attest", body: "Mark attestation complete.", checks: ["Attestation logged"] },
      ],
    },
    period_close: {
      label: "Period close",
      icon: "📒",
      defaultCadenceDays: 30,
      leadDays: 2,
      disclaimer: "Closing a period does not transfer funds.",
      steps: [
        { key: "totals", title: "Review totals", body: "Expected vs received · late list · advances." },
        { key: "late", title: "Note late members", body: "Flag who is still outstanding before close.", input: "note" },
        { key: "confirm", title: "Close period", body: "Lock this contribution period.", checks: ["Period closed in books"] },
      ],
    },
    payout_prep: {
      label: "Payout prep",
      icon: "💸",
      defaultCadenceDays: 30,
      leadDays: 7,
      disclaimer: "Committee Approves release. App does not pay out.",
      steps: [
        { key: "sheet", title: "Build payout sheet", body: "Confirm beneficiary, amount and rotation order." },
        { key: "approve", title: "Approve release", body: "Human Approve only.", checks: ["Committee Approves this payout sheet"] },
        { key: "confirm", title: "Mark prepped", body: "Sheet ready for bank / cash payout by humans.", checks: ["Payout prep complete"] },
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

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return seed();
      const data = JSON.parse(raw);
      data.modules = { ...DEFAULT_MODULES, ...(data.modules || {}) };
      if (!data.profile) data.profile = { onboarded: false, city: "", purpose: "", updatedAt: null };
      if (!Array.isArray(data.processes) || !data.processes.length) data.processes = seedProcesses(startOfDay(new Date()));
      if (!Array.isArray(data.history)) data.history = [];
      return data;
    } catch { return seed(); }
  }
  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

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
  function buildReminders() {
    const q = buildQueue().slice(0, 5);
    const base = new Date();
    return q.map((item, i) => {
      const fire = new Date(base);
      fire.setHours(7 + i, i === 0 ? 0 : 30, 0, 0);
      if (fire < base) fire.setDate(fire.getDate() + 1);
      return {
        when: fire.toLocaleDateString("en-ZA", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" }) + " · " +
              fire.toLocaleTimeString("en-ZA", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }),
        title: item.title, src: item.module,
      };
    });
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
    const rem = buildReminders();
    $("#reminder-panel").innerHTML = rem.length ? rem.map((r) => `
      <div class="reminder-item"><div class="r-time">${esc(r.when)}</div>
      <div class="r-body">${esc(r.title)}<div class="r-src">${esc(r.src)}</div></div></div>`).join("") : '<div class="empty">No scheduled reminders</div>';
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
    $("#period-meta").textContent = fmtMoney(state.period.received) + " / " + fmtMoney(state.period.expected) + " · closes " + fmtDate(state.period.closesAt) + (state.attested ? " · attested" : "");
    $("#period-bar").style.width = pct + "%";
    $("#ledger-list").innerHTML = state.ledger.map((e) => `
      <div class="ledger-row">
        <div><strong>${esc(e.label)}</strong><div class="h-meta">${fmtDate(e.at)} · ${esc(e.kind)}</div></div>
        <div class="ledger-amt ${e.amount >= 0 ? "pos" : "neg"}">${e.amount >= 0 ? "+" : ""}${fmtMoney(e.amount)}</div>
      </div>`).join("");
  }

  function renderCycles() {
    const card = $("#payout-approve");
    if (state.payoutApproved) card.classList.add("hidden"); else card.classList.remove("hidden");
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
      { id: "meeting", mod: "meeting", icon: "📋", title: "Meeting pack", meta: "Export stub" },
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
  function openProcessRunner(processId) {
    const proc = getProcess(processId);
    if (!proc) { toast("Process not found"); return; }
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
      html = `<div class="pr-phase-label">Start</div><div class="pr-title">${esc(proc.title)}</div>
        <div class="pr-meta">${esc(def.label)} · due ${fmtDate(proc.nextDue)} · cadence every ${proc.cadenceDays || "—"} days</div>
        <div class="pr-card"><h4>What happens</h4><p>Guided process (${def.steps.length} steps). Confirm next due on complete.</p>
        <p style="margin-top:8px;font-size:12px;color:var(--muted)">${esc(def.disclaimer || "")}</p></div>
        ${renderAccountLinks(proc)}
        ${proc.meta && proc.meta.amount ? `<div class="pr-card"><h4>Amount</h4><p>${fmtMoney(proc.meta.amount)}</p></div>` : ""}
        ${proc.meta && proc.meta.memberId ? `<div class="pr-card"><h4>Member</h4><p>${esc(memberName(proc.meta.memberId))}</p></div>` : ""}`;
      act = `<button type="button" class="btn btn-ghost" id="pr-cancel">Cancel</button><button type="button" class="btn btn-primary" id="pr-next">Start →</button>`;
    } else if (phase.startsWith("step:")) {
      const si = Number(phase.split(":")[1]); const step = def.steps[si];
      const showLinks = ["member", "approve", "account"].includes(step.key) || si === 0;
      html = `<div class="pr-phase-label">Step ${si + 1} of ${def.steps.length}</div>
        <div class="pr-title">${esc(step.title)}</div><div class="pr-meta">${esc(step.body)}</div>
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
    if (proc.type === "attest") state.attested = true;
    if (proc.type === "period_close") {
      state.period.label = "Closed · " + state.period.label;
      state.attested = true;
    }
    if (proc.type === "payout_prep") {
      state.payoutApproved = true;
    }

    state.history.unshift({ id: uid("h"), processId: proc.id, title: proc.title, type: proc.type, completedAt: isoDate(new Date()), nextDueSet: nextDue, note });
    if (state.history.length > 50) state.history.length = 50;
    save(); closeProcessRunner(); render(); toast("Done · next due " + fmtDate(nextDue));
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

  function exportMeetingPack() {
    const lines = [
      "KOPANO STOKVEL — MEETING PACK (DEMO)",
      "Generated: " + todayLabel(),
      "NOT a bank statement · NOT financial advice",
      "",
      "== Period ==",
      state.period.label + " · " + fmtMoney(state.period.received) + " / " + fmtMoney(state.period.expected),
      "Attested: " + (state.attested ? "yes" : "no"),
      "",
      "== Attendance / contribution roll ==",
      ...state.members.map((m) => m.name + " · " + m.role + " · " + m.status),
      "",
      "== Payout sheet ==",
      ...state.payoutSheet.map((p) => "#" + p.position + " " + memberName(p.memberId) + " · " + fmtMoney(p.amount) + " · " + p.note),
      "Approved: " + (state.payoutApproved ? "yes" : "pending"),
      "",
      "== Open disputes ==",
      ...state.disputes.filter((d) => d.status === "open").map((d) => d.title + " — " + d.note),
      "",
      "== Loans open ==",
      ...state.loans.filter((l) => l.status === "open").map((l) => memberName(l.memberId) + " · " + fmtMoney(l.amount) + " · " + l.note),
      "",
      "Related pack: " + GUMROAD,
    ];
    const out = $("#export-out");
    out.style.display = "block";
    out.textContent = lines.join("\n");
    toast("Meeting pack exported (stub)");
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
    state = seed(); save(); showView("today"); toast("Demo reset");
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
    `<p><strong>Group Money</strong> is a mobile-first demo of a shared group ledger for SA stokvels, burial societies and choirs.</p>
     <p>Multi-member feel on a <strong>single device</strong>. Record contributions, attest, close periods, prep payouts.</p>
     <p>Sample: Kopano Stokvel, Bloemfontein.</p>
     <p style="font-size:12px;color:var(--muted)">NOT a bank · NOT an NCR credit provider · NOT financial advice. Related printable pack: <a href="${GUMROAD}" target="_blank" rel="noopener">Stokvel OS on Gumroad</a>.</p>`));
  $("#modal-close").addEventListener("click", closeModal);
  $("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeModal(); });
  $("#pr-close").addEventListener("click", closeProcessRunner);
  $("#btn-add-process")?.addEventListener("click", () => openAddProcessModal());
  $("#btn-add-process-today")?.addEventListener("click", () => openAddProcessModal());
  $("#btn-export-pack")?.addEventListener("click", exportMeetingPack);
  $("#btn-payout-approve")?.addEventListener("click", () => {
    state.payoutApproved = true; save(); render(); toast("Payout sheet Approved (demo)");
  });
  $("#btn-payout-later")?.addEventListener("click", () => toast("Kept for Cycles"));
  document.getElementById("ob-save") && document.getElementById("ob-save").addEventListener("click", completeOnboarding);
  maybeOnboard();
  render();
})();
