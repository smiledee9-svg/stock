# SCB Quantitative Intelligence & Trading Architecture Suite (SCB)

ชุดโมเดลวิเคราะห์และระบบเทรดเชิงปริมาณสำหรับหุ้น **SCB.BK (SCB X)** แบบครบวงจร ประกอบด้วย:
1. **Ramanujan Quantum Discrete Cycle Engine** (ตรวจจับวัฏจักรคลื่นไม่เชิงเส้น V1-V18, พยากรณ์รอบ, และแผนเทรด)
2. **SCB Daily Intelligence Archive** (คลังบันทึกข้อมูลรายวันแบบ 2-in-1: รอบเที่ยง 13:00 น. + รอบเย็น 17:30 น.)
3. **Goichi Hosoda Ichimoku 4-Layer Quantitative System** (Sanyaku Kouten, Wave N, Henka-bi, Nehaba Targets)
4. **Cloudflare Worker & MCP Server** (เชื่อมต่อ AI Agent ผ่าน Model Context Protocol)
5. **GitHub Actions Autonomous Pipeline** (ดึงข้อมูล SCB.BK อัตโนมัติทุกวันทำการ 2 รอบ)

---

## 📁 โครงสร้างโฟลเดอร์ (Architecture & File Map)

```text
SCB/
├── .agents/                               # Antigravity Agent Customizations & Skills
│   └── skills/
│       └── scb-ichimoku/
│           └── SKILL.md                   # คำสั่งและกฎวิเคราะห์ Ichimoku 4-Layer สำหรับ AI Agent
│
├── .github/
│   └── workflows/
│       └── ramanujan_bot.yml              # GitHub Actions Cron Pipeline (รัน 13:00 น. และ 17:30 น.)
│
├── cloudflare/                            # Cloudflare Worker & Model Context Protocol (MCP)
│   ├── wrangler.jsonc                     # ไฟล์คอนฟิก Cloudflare Wrangler
│   └── ichimoku-mcp-server.js             # MCP Server รันบน Cloudflare Worker
│
├── database/                              # SCB Daily Intelligence Archive (คลังข้อมูลรายวัน)
│   ├── index.html                         # หน้าเว็บตารางบันทึก 2-in-1 ประจำวัน
│   └── database.js                        # ตรรกะจัดเก็บ LocalStorage, ดึงค่าคำนวณอัตโนมัติ, JSON/CSV Export
│
├── trader/                                # Pure Goichi Hosoda Ichimoku Quantitative Suite
│   ├── index.html                         # แดชบอร์ดวิเคราะห์ Ichimoku 4 มิติ
│   ├── trader.js                          # เอนจินคำนวณ Sanyaku Kouten & Nehaba
│   ├── style.css                          # สไตล์ UI แบบ Dark Glassmorphism
│   └── data/                              # ชุดข้อมูลราคา SCB ย้อนหลัง 2 ปี
│
├── auto_update.py                         # สคริปต์หลัก ดึงข้อมูลแท่งเทียนสด + คำนวณคลื่น + สร้าง Data Bundle
├── fetch_scb.py                           # ตัวดึงข้อมูลราคา SCB.BK จาก Yahoo Finance (รองรับ Retry & Fallback)
├── ramanujan_engine.py                    # อัลกอริทึมแยกคลื่นรามานุจัน (Discrete Cycles V1-V18 & Coherence)
├── ramanujan_data.js                      # ไฟล์ Data Bundle สำหรับ Frontend Web App
├── ramanujan_results.json                 # ผลลัพธ์การคำนวณเวกเตอร์คลื่นทั้งหมดในรูปแบบ JSON
├── scb_candles.json                       # ประวัติแท่งเทียน SCB.BK ย้อนหลัง 970+ วัน
├── scb_candles.csv                        # ประวัติแท่งเทียน SCB.BK ในรูปแบบ CSV
├── index.html                             # หน้าเว็บหลัก Ramanujan Quant Lab & Interactive Charts
├── style.css                              # ดีไซน์ระบบ UI Dark Theme พรีเมียม
├── app.js                                 # คอนโทรลเลอร์หน้าเว็บ กราฟ คลื่น และการพยากรณ์
├── lightweight-charts.js                  # TradingView Lightweight Charts Library
└── requirements.txt                       # Python dependencies (numpy, pandas, requests)
```

---

## 🚀 การรันสคริปต์ในโฟลเดอร์นี้แบบ Standalone

### 1. ติดตั้ง Python Library
```bash
pip install -r requirements.txt
```

### 2. รันสคริปต์อัพเดทข้อมูลและคำนวณคลื่น
```bash
python auto_update.py
```

### 3. เปิดดูหน้าเว็บ
สามารถเปิดไฟล์ `index.html` บนเบราว์เซอร์ หรือรันผ่าน Live Server ได้ทันที

---

## 📦 การย้ายโฟลเดอร์นี้ออกไปเป็นโปรเจกต์แยก (Standalone Repository)
เมื่อต้องการแยกโปรเจกต์นี้ออกไปเป็นโฟลเดอร์หรือ Git Repository เดี่ยว:
1. คัดลอกโฟลเดอร์ `SCB/` ทั้งหมดไปยังโฟลเดอร์ปลายทางใหม่
2. สั่ง `git init` และเชื่อมต่อกับ GitHub Repository ใหม่
3. ไฟล์ `.github/workflows/ramanujan_bot.yml` ที่เตรียมไว้ในโฟลเดอร์นี้พร้อมทำงานในฐานะ Root Repository ได้ทันที 100%
