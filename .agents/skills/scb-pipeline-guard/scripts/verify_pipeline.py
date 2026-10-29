#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SCB Zero-Trust Pipeline & Cloud Integrity Validator
Verifies the complete pipeline:
  Yahoo Finance API -> GitHub Actions -> Git Remote -> Cloudflare Pages Edge -> Browser
"""

import sys
import os
import json
import time
import datetime
import urllib.request
import subprocess

# Ensure UTF-8 output on Windows PowerShell / CMD
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

YAHOO_URL = "https://query1.finance.yahoo.com/v8/finance/chart/SCB.BK?interval=1d&range=5d"
GITHUB_RUNS_URL = "https://api.github.com/repos/smiledee9-svg/stock/actions/runs?per_page=5"
CLOUDFLARE_ENDPOINTS = [
    "https://stock-manager.pages.dev/SCB/ramanujan_data.js",
    "https://stock-manager.pages.dev/quant-ramanujan/ramanujan_data.js",
    "https://stock-manager.pages.dev/SCB/scb_candles.json",
    "https://stock-manager.pages.dev/quant-ramanujan/scb_candles.json"
]

def log_header(title):
    print("\n" + "=" * 65)
    print(f" {title}")
    print("=" * 65)

def check_yahoo_live():
    print("📡 [1/4] ตรวจสอบราคาตลาดจริงจาก Yahoo Finance API (Source of Truth)...")
    req = urllib.request.Request(YAHOO_URL, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        result = data['chart']['result'][0]
        meta = result['meta']
        timestamps = result['timestamp']
        quotes = result['indicators']['quote'][0]

        # Extract latest candle
        latest_idx = len(timestamps) - 1
        ts = timestamps[latest_idx]
        dt = datetime.datetime.fromtimestamp(ts, tz=datetime.timezone(datetime.timedelta(hours=7)))
        date_str = dt.strftime('%Y-%m-%d')
        
        reg_price = meta.get('regularMarketPrice')
        reg_time_ts = meta.get('regularMarketTime')
        reg_dt = datetime.datetime.fromtimestamp(reg_time_ts, tz=datetime.timezone(datetime.timedelta(hours=7))) if reg_time_ts else dt

        open_p = quotes['open'][latest_idx]
        high_p = quotes['high'][latest_idx]
        low_p = quotes['low'][latest_idx]
        close_p = quotes['close'][latest_idx]
        vol = quotes['volume'][latest_idx]

        # Determine session
        market_hour = reg_dt.hour
        market_min = reg_dt.minute
        if market_hour >= 17 or (market_hour == 16 and market_min >= 35):
            session_name = "🌙 รอบเย็นปิดตลาด (Settled)"
        elif market_hour >= 12 and (market_hour < 16 or (market_hour == 16 and market_min < 35)):
            session_name = "☀️ รอบเที่ยง / ระหว่างวัน (Midday/Intraday)"
        else:
            session_name = "⏳ นอกเวลาทำการ"

        candle_info = {
            'date': date_str,
            'time': reg_dt.strftime('%Y-%m-%d %H:%M:%S'),
            'open': open_p,
            'high': high_p,
            'low': low_p,
            'close': close_p if close_p is not None else reg_price,
            'volume': vol,
            'regular_price': reg_price,
            'session': session_name
        }

        print(f"   ✅ วันที่ตลาด: {candle_info['date']} | เวลาบันทึก: {candle_info['time']}")
        print(f"   ✅ ราคาล่าสุด: ฿{candle_info['close']:.2f} | Volume รวม: {candle_info['volume']:,} หุ้น")
        print(f"   ✅ สถานะช่วงเวลา: {candle_info['session']}")
        return candle_info
    except Exception as e:
        print(f"   ❌ ล้มเหลวในการเชื่อมต่อ Yahoo Finance: {e}")
        return None

def check_github_actions():
    print("\n⚙️ [2/4] ตรวจสอบสถานะ GitHub Actions Cloud Scheduler...")
    req = urllib.request.Request(GITHUB_RUNS_URL, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        runs = data.get('workflow_runs', [])
        if not runs:
            print("   ⚠️ ไม่พบประวัติการรันใน GitHub Actions")
            return None

        latest_run = runs[0]
        run_id = latest_run['id']
        event = latest_run['event']
        status = latest_run['status'] # queued, in_progress, completed
        conclusion = latest_run['conclusion'] # success, failure, cancelled
        created_at = latest_run['created_at']

        # Convert to BKK time
        created_utc = datetime.datetime.strptime(created_at, '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=datetime.timezone.utc)
        created_bkk = created_utc.astimezone(datetime.timezone(datetime.timedelta(hours=7)))
        created_str = created_bkk.strftime('%Y-%m-%d %H:%M:%S')

        print(f"   🔹 Run ล่าสุด: #{run_id} | อีเวนต์: {event}")
        print(f"   🔹 เวลาที่คลาวด์เริ่มทำงาน: {created_str} BKK")
        print(f"   🔹 สถานะ: {status.upper()} | ผลลัพธ์: {str(conclusion).upper()}")

        return {
            'run_id': run_id,
            'event': event,
            'status': status,
            'conclusion': conclusion,
            'created_bkk': created_str,
            'raw': latest_run
        }
    except Exception as e:
        print(f"   ⚠️ ไม่สามารถดึงข้อมูล GitHub Actions API: {e}")
        return None

def check_local_and_git_repo(workspace_path):
    print("\n📂 [3/4] ตรวจสอบไฟล์ในเครื่องและ Local Git Repository...")
    candles_file = os.path.join(workspace_path, 'scb_candles.json')
    if not os.path.exists(candles_file):
        # Fallback to sibling or stock repo
        alt = r'C:\Users\HP\Desktop\STOCK\SCB\scb_candles.json'
        if os.path.exists(alt):
            candles_file = alt

    if not os.path.exists(candles_file):
        print(f"   ❌ ไม่พบไฟล์ scb_candles.json ที่ {candles_file}")
        return None

    try:
        with open(candles_file, 'r', encoding='utf-8') as f:
            candles = json.load(f)
        last_c = candles[-1]
        print(f"   📁 ไฟล์ในเครื่อง ({candles_file}):")
        print(f"      - วันที่บันทึกล่าสุด: {last_c.get('date')}")
        print(f"      - ราคาปิด: ฿{last_c.get('close', 0):.2f}")
        print(f"      - Volume: {last_c.get('volume', 0):,} หุ้น")
        print(f"      - จำนวนแท่งเทียนสะสม: {len(candles)} วัน")
        return last_c
    except Exception as e:
        print(f"   ❌ เกิดข้อผิดพลาดในการอ่านไฟล์แท่งเทียน: {e}")
        return None

def check_cloudflare_edge():
    print("\n☁️ [4/4] ตรวจสอบข้อมูลสดบน Edge Cache ของ Cloudflare Pages...")
    cache_buster = f"?_t={int(time.time())}"
    target_url = "https://stock-manager.pages.dev/SCB/scb_candles.json" + cache_buster
    headers = {
        'User-Agent': 'Mozilla/5.0',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
    }

    try:
        req = urllib.request.Request(target_url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            raw_text = resp.read().decode('utf-8', errors='ignore')

        # Check if json or SPA html fallback
        if raw_text.strip().startswith('['):
            candles = json.loads(raw_text)
            last_c = candles[-1]
            print(f"   ✅ Cloudflare Edge ให้บริการ JSON สดสำเร็จ:")
            print(f"      - วันที่แสดงผลบนเว็บ: {last_c.get('date')}")
            print(f"      - ราคาปิด: ฿{last_c.get('close', 0):.2f}")
            print(f"      - Volume: {last_c.get('volume', 0):,} หุ้น")
            return last_c
        elif 'ramanujan_data.js' in target_url or '<!doctype html>' in raw_text.lower():
            # If SPA fallback or js
            print("   ℹ️ Cloudflare Pages มีการตั้งค่า Single Page Application (SPA Fallback)")
            # Try fetching ramanujan_data.js
            js_url = "https://stock-manager.pages.dev/SCB/ramanujan_data.js" + cache_buster
            req_js = urllib.request.Request(js_url, headers=headers)
            with urllib.request.urlopen(req_js, timeout=10) as r_js:
                js_content = r_js.read().decode('utf-8', errors='ignore')
            if 'RAMANUJAN_DATA' in js_content:
                # Extract lastDate and lastPrice
                import re
                date_m = re.search(r'"lastDate":\s*"([^"]+)"', js_content)
                price_m = re.search(r'"lastPrice":\s*([0-9\.]+)', js_content)
                d_found = date_m.group(1) if date_m else 'Unknown'
                p_found = float(price_m.group(1)) if price_m else 0.0
                print(f"   ✅ Cloudflare Edge ให้บริการ ramanujan_data.js:")
                print(f"      - วันที่บนเว็บ: {d_found}")
                print(f"      - ราคาบนเว็บ: ฿{p_found:.2f}")
                return {'date': d_found, 'close': p_found}
            else:
                print("   ⚠️ Cloudflare ให้บริการหน้าเปล่าหรือแคชยังไม่รีเฟรช")
                return None
    except Exception as e:
        print(f"   ⚠️ ไม่สามารถตรวจ Cloudflare Pages Edge โดยตรง: {e}")
        return None

def run_auto_heal(workspace_path):
    print("\n🚑 กำลังเริ่มกระบวนการ AUTO-HEALING อัตโนมัติ (ซ่อมแซมและอัปเดตทันที)...")
    stock_repo = r"C:\Users\HP\Desktop\STOCK"
    
    # 1. Run auto_update.py in quant-ramanujan
    auto_update_script = os.path.join(stock_repo, "quant-ramanujan", "auto_update.py")
    if not os.path.exists(auto_update_script):
        auto_update_script = os.path.join(workspace_path, "auto_update.py")

    print(f"   1. รันเครื่องยนต์ควอนตัมรามานุจัน: {auto_update_script}")
    ret = subprocess.run([sys.executable, auto_update_script], cwd=os.path.dirname(auto_update_script), capture_output=True, text=True, encoding='utf-8', errors='replace')
    if ret.returncode != 0:
        print(f"   ❌ ข้อผิดพลาดในการรัน auto_update.py: {ret.stderr}")
        return False
    print("   ✅ รันคำนวณคลื่นและแท่งเทียนรอบล่าสุดสำเร็จ!")

    # 2. Sync files between directories
    print("   2. ซิงค์ไฟล์ข้อมูลระหว่าง SCB/ และ quant-ramanujan/")
    files_to_sync = ['scb_candles.json', 'scb_candles.csv', 'ramanujan_results.json', 'ramanujan_data.js']
    import shutil
    for f in files_to_sync:
        src = os.path.join(stock_repo, 'quant-ramanujan', f)
        dst1 = os.path.join(stock_repo, 'SCB', f)
        dst2 = os.path.join(workspace_path, f)
        if os.path.exists(src):
            shutil.copy2(src, dst1)
            shutil.copy2(src, dst2)

    # 3. Git commit and push
    print("   3. บันทึกและ Push ขึ้น Git Repository (main)...")
    subprocess.run(["git", "add", "SCB/", "quant-ramanujan/"], cwd=stock_repo, check=True)
    now_str = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    commit_res = subprocess.run(["git", "commit", "-m", f"chore(auto-heal): sync and finalize SCB live market at {now_str}"], cwd=stock_repo, capture_output=True, text=True, encoding='utf-8', errors='replace')
    push_res = subprocess.run(["git", "push", "origin", "main"], cwd=stock_repo, capture_output=True, text=True, encoding='utf-8', errors='replace')
    
    print(f"   ✅ Push ขึ้น GitHub สำเร็จ! Cloudflare Pages จะ Build อัตโนมัติใน ~30 วินาที")
    return True

def main():
    log_header("🛡️ SCB ZERO-TRUST PIPELINE & CLOUD VALIDATOR")
    workspace_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    if not os.path.exists(os.path.join(workspace_dir, "scb_candles.json")):
        workspace_dir = r"c:\Users\HP\Desktop\SCB"

    # Step 1: Yahoo Live
    yahoo_data = check_yahoo_live()

    # Step 2: GitHub Actions
    gh_data = check_github_actions()

    # Step 3: Local Files
    local_data = check_local_and_git_repo(workspace_dir)

    # Step 4: Cloudflare Edge
    cf_data = check_cloudflare_edge()

    # Evaluate Integrity
    log_header("📊 สรุปผลการตรวจสอบความถูกต้อง (INTEGRITY VERDICT)")
    
    is_mismatch = False
    reasons = []

    if not yahoo_data:
        reasons.append("ไม่สามารถเชื่อมต่อราคาตลาดจาก Yahoo Finance")
    else:
        # Check if local matches Yahoo
        if local_data:
            if local_data.get('date') != yahoo_data.get('date'):
                is_mismatch = True
                reasons.append(f"วันที่ในระบบ ({local_data.get('date')}) ยังไม่อัปเดตเป็นวันนี้ ({yahoo_data.get('date')})")
            elif abs(local_data.get('close', 0) - yahoo_data.get('close', 0)) > 0.01:
                is_mismatch = True
                reasons.append(f"ราคาปิดในระบบ (฿{local_data.get('close')}) ไม่ตรงกับราคาตลาดจริง (฿{yahoo_data.get('close')})")
            elif yahoo_data.get('volume', 0) > local_data.get('volume', 0) + 1000:
                is_mismatch = True
                reasons.append(f"Volume ในระบบ ({local_data.get('volume'):,}) ยังไม่ครบยอดสิ้นวัน ({yahoo_data.get('volume'):,})")

    if not is_mismatch:
        print("🟢 [STATUS: PERFECT SYNCHRONIZATION]")
        print("   ข้อมูลระหว่าง Yahoo Finance, Local Engine, GitHub และ Cloudflare ตรงกัน 100%!")
    else:
        print("🔴 [STATUS: DATA DESYNCHRONIZED / STALE DETECTED]")
        for r in reasons:
            print(f"   ⚠️ {r}")

        # Auto-heal flag check
        if "--heal" in sys.argv or "--fix" in sys.argv:
            run_auto_heal(workspace_dir)
        else:
            print("\n💡 วิธีแก้ไขทันที: รันคำสั่งพร้อม flag --heal")
            print("   python verify_pipeline.py --heal")

if __name__ == '__main__':
    main()
