# Group Money OS — setup

## 1) Open the app
```bash
cd app
python3 -m http.server 8766
```
Open http://localhost:8766 (http/https required for service worker).

## 2) Install
Add to Home Screen / Install when the browser offers it.

## 3) Books loop (core)
Today shows **attest → period close → Approve payout**:
1. Run **Attest** ProcessRunner (locks the roll)
2. Run **Period close** (gated until attested)
3. Run **Payout Approve** (gated until closed) — humans Approve; app does not move money

## 4) Meeting pack
Use Export text pack / Download JSON pack from the meeting tools to walk into a meeting with agenda, roll, totals, disputes from **current localStorage books**.

## 5) Notifications & backup
Settings → notifications + quiet hours (alerts only while app is open).  
Settings → Export / Import JSON with confirm replace.

## 6) Clear sample
Import your own Export after setup, or reset demo data from the app controls if present.
