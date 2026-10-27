# SCB Ramanujan Discrete Cycle Engine (SET Long-Only)

ระบบวิเคราะห์และเทรดเชิงปริมาณสำหรับหุ้น **SCB.BK (SCB X)** ตกผลึกขั้นสุดยอดด้วย **ทฤษฎีจำนวนของรามานุจัน (Ramanujan Quantum Discrete Cycle Theory)**

---

## 🌟 จุดเด่นของระบบรามานุจัน (Core Ramanujan Architecture)
1. **Ramanujan Quantum Discrete Cycle Engine**:
   - ตรวจจับวงรอบวัฏจักรคลื่นไม่เชิงเส้น ($V_1 - V_{18}$)
   - สกัดสัญญาณฮาร์มอนิกหลัก ($V_5, V_{20}$) และคำนวณ Coherence ชัดเจน
   - ระบบก้าวไดนามิก $\delta_t$ และการเติมไม้งอกไร้ความเสี่ยง (Risk-Free Pyramiding)
2. **SCB Daily Intelligence Archive (คลังข้อมูลรายวัน 2-in-1)**:
   - บันทึก 1 แถวต่อวัน รวมทั้งรอบพักเที่ยง (13:00 น.) และรอบตลาดปิดเย็น (17:30 น.)
   - คำนวณกำไร/ขาดทุนสะสม, Drawdown, และ Export JSON/CSV สำรองข้อมูล
3. **Interactive TradingView Lightweight Charts**:
   - กราฟแท่งเทียน Candlestick ระดับโปร พร้อมเส้นจำลองรอบคลื่นรามานุจัน และจุดเข้าออกสถานะ
4. **GitHub Actions Autonomous Pipeline**:
   - รันอัพเดทราคา SCB.BK อัตโนมัติทุกวันทำการ 2 รอบ (13:00 น. และ 17:30 น.)

---

## 📁 โครงสร้างโฟลเดอร์ (Ramanujan-Only Architecture)

```text
SCB/
├── .github/
│   └── workflows/
│       └── ramanujan_bot.yml      # GitHub Actions Cron Pipeline (รัน 13:00 น. และ 17:30 น.)
│
├── database/                      # SCB Daily Intelligence Archive (คลังข้อมูลรามานุจัน 2-in-1)
│   ├── index.html                 # หน้าเว็บตารางบันทึกประจำวัน
│   └── database.js                # ตรรกะจัดเก็บ LocalStorage, ดึงค่าคำนวณอัตโนมัติ, JSON/CSV Export
│
├── database.html                  # ลิงก์เชื่อมโยงไปยังหน้าคลังข้อมูล database/
├── index.html                     # หน้าเว็บหลัก Ramanujan Quant Lab & Interactive Charts
├── style.css                      # ดีไซน์ระบบ UI Dark Glassmorphism พรีเมียม
├── app.js                         # คอนโทรลเลอร์หน้าเว็บ กราฟ คลื่น และการพยากรณ์รามานุจัน
├── lightweight-charts.js          # TradingView Lightweight Charts Library
├── auto_update.py                 # สคริปต์หลัก ดึงข้อมูลแท่งเทียนสด + คำนวณคลื่นรามานุจัน + สร้าง Data Bundle
├── fetch_scb.py                   # ตัวดึงข้อมูลราคา SCB.BK จาก Yahoo Finance (พร้อมระบบ Retry & Fallback)
├── ramanujan_engine.py            # อัลกอริทึมแยกคลื่นรามานุจัน (Discrete Cycles V1-V18 & Coherence)
├── ramanujan_data.js              # ไฟล์ Data Bundle สำหรับ Frontend Web App
├── ramanujan_results.json         # ผลลัพธ์การคำนวณเวกเตอร์คลื่นทั้งหมดในรูปแบบ JSON
├── scb_candles.json               # ประวัติแท่งเทียน SCB.BK ย้อนหลัง 970+ วัน
├── scb_candles.csv                # ประวัติแท่งเทียน SCB.BK ในรูปแบบ CSV
├── requirements.txt               # Python dependencies (numpy, pandas, requests)
└── README.md                      # เอกสารอธิบายระบบรามานุจัน
```

---

## 🚀 วิธีการใช้งาน

### 1. ติดตั้ง Library ที่จำเป็น
```bash
pip install -r requirements.txt
```

### 2. รันสคริปต์คำนวณคลื่นรามานุจัน
```bash
python auto_update.py
```

### 3. เปิดดูหน้าเว็บ
เปิดไฟล์ `index.html` บนเบราว์เซอร์เพื่อเข้าสู่ **Ramanujan Quant Lab & Interactive Charts** หรือเปิด `database.html` เพื่อดูคลังบันทึกผลประจำวัน
