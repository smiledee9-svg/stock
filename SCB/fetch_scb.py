"""
Fetch SCB.BK (SCB X Public Company Limited) 2 Years Daily Candles
from Yahoo Finance and save as JSON and CSV in quant-ramanujan/
"""
import os
import sys
import json
import time
from datetime import datetime
import requests
import pandas as pd

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

def fetch_scb_data(symbol="SCB.BK", period="4y", interval="1d", max_retries=3, retry_delay=15):
    output_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(output_dir, "scb_candles.json")
    csv_path = os.path.join(output_dir, "scb_candles.csv")

    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?range={period}&interval={interval}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    }

    data = None
    for attempt in range(1, max_retries + 1):
        try:
            print(f"[*] [{attempt}/{max_retries}] กำลังดึงข้อมูลหุ้น {symbol} ย้อนหลัง {period} จาก Yahoo Finance...")
            res = requests.get(url, headers=headers, timeout=20)
            if res.status_code == 200:
                raw_json = res.json()
                if "chart" in raw_json and "result" in raw_json["chart"] and raw_json["chart"]["result"]:
                    data = raw_json
                    print(f"[✓] เชื่อมต่อ Yahoo Finance สำเร็จ (HTTP 200)")
                    break
            print(f"[!] คำขอครั้งที่ {attempt} ไม่สำเร็จ (HTTP {res.status_code}) กำลังรอ {retry_delay} วินาทีเพื่อลองใหม่...")
        except Exception as err:
            print(f"[!] เกิดข้อผิดพลาดในรอบที่ {attempt}: {err}. กำลังรอ {retry_delay} วินาที...")
        
        if attempt < max_retries:
            time.sleep(retry_delay)

    # หากดึงข้อมูลออนไลน์ไม่สำเร็จ ให้เปิดใช้ข้อมูลแคชเดิมในเครื่องทันที (Zero Crash)
    if data is None:
        if os.path.exists(json_path):
            print(f"[!] ไม่สามารถเชื่อมต่อ Yahoo ได้ ใช้ข้อมูลแคชเดิมจาก {json_path}")
            with open(json_path, "r", encoding="utf-8") as f:
                return json.load(f)
        raise Exception(f"Failed to fetch data from Yahoo Finance after {max_retries} attempts and no local cache available.")

    result = data["chart"]["result"][0]
    timestamps = result.get("timestamp", [])
    indicators = result.get("indicators", {})
    quote = indicators.get("quote", [{}])[0]

    opens = quote.get("open", [])
    highs = quote.get("high", [])
    lows = quote.get("low", [])
    closes = quote.get("close", [])
    volumes = quote.get("volume", [])

    candles = []
    for i in range(len(timestamps)):
        # Skip null data days
        if closes[i] is None or opens[i] is None:
            continue

        ts = timestamps[i]
        dt = datetime.fromtimestamp(ts)
        date_str = dt.strftime("%Y-%m-%d")

        raw_o = float(opens[i])
        raw_h = float(highs[i]) if highs[i] is not None else raw_o
        raw_l = float(lows[i]) if lows[i] is not None else raw_o
        raw_c = float(closes[i])
        v = int(volumes[i]) if volumes[i] is not None else 0

        # Sanitization: Ensure High >= max(Open, Close) and Low <= min(Open, Close)
        clean_h = max(raw_h, raw_o, raw_c)
        clean_l = min(raw_l, raw_o, raw_c)

        o = round(raw_o, 2)
        h = round(clean_h, 2)
        l = round(clean_l, 2)
        c = round(raw_c, 2)

        candles.append({
            "timestamp": ts,
            "date": date_str,
            "open": o,
            "high": h,
            "low": l,
            "close": c,
            "volume": v
        })

    # Save to JSON
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(candles, f, ensure_ascii=False, indent=2)

    # Save to CSV
    df = pd.DataFrame(candles)
    df.to_csv(csv_path, index=False, encoding="utf-8")

    print(f"[✓] สำเร็จ! ได้ข้อมูลทั้งหมด {len(candles)} แท่งเทียน (ตั้งแต่ {candles[0]['date']} ถึง {candles[-1]['date']})")
    print(f"[✓] บันทึกไฟล์ที่:")
    print(f"    - {json_path}")
    print(f"    - {csv_path}")

    return candles

if __name__ == "__main__":
    fetch_scb_data()
