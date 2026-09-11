# Group Money

**Group Money** is a polished, mobile-first static web demo of a South African **shared group money OS** (stokvel / burial society / choir).

Sample group: **Kopano Stokvel · Bloemfontein**. Demo / sample ZAR data on a **single device**. **NOT** a bank. **NOT** an NCR credit provider. **NOT** financial or legal advice. Faceless Plain Desk.

Shared DNA with [Life Desk](https://esteprinsloo101-web.github.io/life-desk/) and [Farm Desk](https://esteprinsloo101-web.github.io/farm-desk/): the app **reminds, prepares, closes books**; humans **Approve** payouts. Installable as a **PWA** (Add to Home Screen) with an offline-ish shell cache.

## Live URL

**https://esteprinsloo101-web.github.io/group-money/**

(GitHub Pages from `main`; allow a minute after push for deploy.)

## Modules

| Module | Role |
|--------|------|
| **Today** | Due processes · pot / late KPIs · books loop · reminders |
| **Members** | Roster · paid / late / pending |
| **Ledger** | Period progress · contribution entries |
| **Cycles** | Attest → close → payout Approve · sheet · history |
| **Loans / advances** | Log only (not credit) |
| **Disputes** | Open items |
| **Meeting pack** | Structured text + JSON from live books |
| **Science Desk** | Weekly improve tips (methods + limits) |
| **Settings** | Modules · quiet hours · notifications · export/import |

## Process types (ProcessRunner — not checklists)

- **Record contribution** — member → amount → log
- **Attest paid** — review roll → disputes → attest → lock (unlocks period close)
- **Period close** — gated on attest → totals → late notes → close (unlocks payout Approve)
- **Payout prep** — gated on close → sheet → committee Approve → mark prepped

## PWA (install + offline shell)

1. Open the live URL or local server in Chrome / Edge / Safari.
2. Use **Install** / **Add to Home Screen** when the banner appears (or browser menu).
3. On iOS Safari: Share → **Add to Home Screen**.
4. The service worker caches the shell: `index.html`, `app.js`, `styles.css`, `manifest.webmanifest` (+ icons). Offline use is **shell-only** — open the app once online first.

## Reminders v1

- **Today → Next reminders** shows the in-app queue for due / lead-window processes (tap to run the wizard).
- **Enable notifications** (or Settings → Request permission). If denied, the UI stays graceful — in-app queue still works.
- **Quiet hours** (default 21:00–07:00) are stored in `localStorage` with app state; alerts are skipped during quiet hours and fire times shift outside them.
- After you finish a process (**Done**), the next reminder is scheduled from the new **next due** (when permission is granted and the tab can run timers).

## Backup (export / import)

In **Settings → Backup**:

1. **Export JSON** — downloads app state (`group-money-v4` payload: books, processes, history, modules, prefs).
2. **Import JSON** — pick a previous export to restore (round-trip). Invalid files toast an error and leave current data alone.

## Meeting pack

**More → Meeting pack** builds agenda, roll, loop status, ledger slice, payout sheet, disputes and loans from **live localStorage books** (text preview + JSON download). Demo only — not a bank statement.

## Related download

This app is the **live books demo**. Printable Stokvel OS pack:  
https://stofficial.gumroad.com/l/ydbgne

## Open locally

Plain static files. No build step. **Serve over http(s)** so the service worker and notifications can register.

```bash
# from this folder
python3 -m http.server 8773
# then open http://127.0.0.1:8773/
```

Files: `index.html` · `styles.css` · `app.js` · `manifest.webmanifest` · `service-worker.js` · `icons/` · `README.md`

Storage key: `group-money-v4`

## Disclaimer

Demo / sample data only. **NOT** a bank / NCR credit provider / financial or legal advice. Does not move money or issue statements that replace your bank. Faceless Plain Desk.

## Update 2026-09-11

Platform bar: Science Desk, elderly UI, location+purpose onboarding.

**feat/pwa-reminders-export:** PWA manifest + service worker shell cache, install affordance, reminders v1 (notifications + quiet hours + post-Done schedule), JSON export/import backup, stronger attest → period_close → payout Approve loops, meeting pack text/JSON from live books.
