---
name: scb-pipeline-guard
description: Cloudflare Pages & GitHub Actions End-to-End Verification, Zero-Trust Data Integrity Guard, Stale Data Prevention & Auto-Healing Pipeline for SCB stock (SCB.BK). Use when checking if GitHub Actions auto-updated, verifying Cloudflare edge cache parity, detecting stale/mismatched data between Yahoo Finance and live web, or diagnosing schedule delays.
---

# 🛡️ SCB Pipeline Guard & Cloud Integrity System

A **Zero-Trust Verification and Auto-Healing Guard** for SCB.BK automated quant pipeline, designed to detect, prevent, and fix data desynchronization between **Yahoo Finance Live Market**, **GitHub Actions Cloud Scheduler**, **Git Remote Repository**, and **Cloudflare Pages CDN Edge**.

---

## 🏗️ The 4-Stage Zero-Trust Verification Chain

```
[1. Yahoo Finance API] ---> [2. GitHub Actions Cloud] ---> [3. Git Origin Main] ---> [4. Cloudflare Edge / User Browser]
  Source of Truth              Scheduled Bot Runner            Persistent Repository         Global CDN Cached Webpage
  (Price, Vol, Settle)         (Runs 12:55 & 17:35 BKK)        (Commit SHA & Candle JSON)    (Edge Cache & SPA Delivery)
```

1. **Stage 1: Yahoo Finance API (Source of Truth)**
   - Live endpoint: `https://query1.finance.yahoo.com/v8/finance/chart/SCB.BK?interval=1d&range=5d`
   - Ingests `regularMarketPrice`, settled evening close, and accumulated trading volume.
   - Detects session status:
     - `☀️ Midday Session`: 12:30 – 16:30 BKK (Interim price, incomplete volume).
     - `🌙 Evening Session`: 16:35+ BKK (Final settled closing price, full day volume).

2. **Stage 2: GitHub Actions Cloud Scheduler**
   - Workflow: `.github/workflows/ramanujan_bot.yml`
   - Schedule Triggers: `12:55 BKK` & `17:35 BKK` (with fail-safe backup runs at 13:15 & 17:55 BKK).
   - **Cloud Latency Rule:** GitHub Actions free-tier runner queue can experience 5–15 minutes dispatch delay during global peak hours.

3. **Stage 3: Git Remote Repository Parity**
   - Files verified: `scb_candles.json`, `scb_candles.csv`, `ramanujan_results.json`, `ramanujan_data.js`.
   - Dual-directory synchronization: `SCB/` and `quant-ramanujan/` must match identically.

4. **Stage 4: Cloudflare Pages Edge Cache**
   - Endpoint: `https://stock-manager.pages.dev/SCB/`
   - Cache Buster Header: `Cache-Control: no-cache, no-store, must-revalidate` + query parameter `?_t=<epoch>`.
   - Verifies whether visitors receive the fresh daily candle or an old browser/CDN cached version.

---

## ⚡ Quick Diagnostic Commands

### 1. Instant Read-Only Diagnostic
Run this script to inspect all 4 stages and receive a traffic-light verdict:
```bash
python .agents/skills/scb-pipeline-guard/scripts/verify_pipeline.py
```

### 2. One-Command Auto-Healing (`--heal`)
If a desynchronization or delay is detected, run with `--heal` to immediately fetch Yahoo market data, compute Ramanujan discrete cycles, sync directories, commit, and push to GitHub:
```bash
python .agents/skills/scb-pipeline-guard/scripts/verify_pipeline.py --heal
```

---

## 🚨 Common Failure Modes & Prevention Rules

| Failure Mode | Root Cause | Systemic Prevention Rule |
| :--- | :--- | :--- |
| **"ราคาเหมือนตอนเที่ยง ยังไม่อัปเดต?"** | หุ้นปิดราคาเดิม (Flat Close) แต่คนดูเข้าใจผิดว่าระบบไม่อัปเดต | ตรวจสอบ **Volume รวมสิ้นวัน** หาก Volume ขยับเพิ่มขึ้น แสดงว่าระบบอัปเดตข้อมูลเย็นสมบูรณ์แล้ว |
| **"GitHub Actions ยังไม่รันตามเวลา"** | Cloud Queue Delay บน GitHub Server (โดยเฉพาะช่วงหัวค่ำ 17:35–18:05 น.) | มี Fail-safe Backup Cron สำรองที่ 17:55 น. หรือรันคำสั่ง `--heal` เพื่อผลักข้อมูลขึ้นคลาวด์ทันที |
| **"เว็บแสดงข้อมูลเก่าทั้งที่ Git อัปเดตแล้ว"** | Browser / Cloudflare Edge Cache จำไฟล์เดิม | ใช้ Cache Buster Query (`ramanujan_data.js?v=TIMESTAMP`) ใน `index.html` เสมอ |
| **"Volume เป็น 0 หรือแท่งเทียนแหว่ง"** | ดึงข้อมูลเร็วเกินไปก่อนตลาด SET ทำการ Settlement เสร็จสิ้น | กำหนดเวลาตรวจวัดหลังตลาดปิดจริง: รอบเที่ยงตรวจ **12:55+**, รอบเย็นตรวจ **17:35+** |

---

## 📁 Skill Files
- `scripts/verify_pipeline.py`: Comprehensive Python diagnostic & auto-heal engine.
