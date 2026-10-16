"""
Automated Pipeline: Fetch SCB.BK Candles -> Run Ramanujan Discrete Cycle Engine -> Export Results
Designed for automated execution via GitHub Actions (Midday 12:45 & Evening 17:30 SET)
"""
import os
import sys
import json
from datetime import datetime

# Configure UTF-8 encoding
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

base_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(base_dir)

from fetch_scb import fetch_scb_data
from ramanujan_engine import run_master_generation

def main():
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"===========================================================")
    print(f"🚀 STARTING AUTOMATED RAMANUJAN QUANT PIPELINE: {now_str}")
    print(f"===========================================================")

    # Step 1: Fetch latest candles from Yahoo Finance
    try:
        candles = fetch_scb_data(symbol="SCB.BK", period="2y", interval="1d")
        print(f"[✓] Step 1 Complete: Fetched {len(candles)} candles up to {candles[-1]['date']}")
    except Exception as e:
        print(f"[!] Warning fetching fresh data: {e}. Falling back to cached scb_candles.json")

    # Step 2: Run Ramanujan Master Engine & Predictive Intelligence
    try:
        run_master_generation()
        print(f"[✓] Step 2 Complete: Master Engine generated latest cycles and predictive scenarios.")
    except Exception as e:
        print(f"[X] Error running Ramanujan Engine: {e}")
        sys.exit(1)

    print(f"===========================================================")
    print(f"✨ PIPELINE COMPLETED SUCCESSFULLY AT {now_str}")
    print(f"===========================================================")

if __name__ == "__main__":
    main()
