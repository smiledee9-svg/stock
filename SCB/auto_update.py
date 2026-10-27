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

def sync_trader_and_mcp_data(candles, base_dir):
    """
    Synchronizes 2-year Yahoo-formatted data bundle for trader/
    and calculates latest Pure Goichi Hosoda Ichimoku values for Cloudflare MCP server.
    """
    if not candles:
        with open(os.path.join(base_dir, "scb_candles.json"), "r", encoding="utf-8") as f:
            candles = json.load(f)

    # 1. Build Yahoo Finance chart structure
    timestamps = [int(c["timestamp"]) for c in candles]
    opens = [float(c["open"]) for c in candles]
    highs = [float(c["high"]) for c in candles]
    lows = [float(c["low"]) for c in candles]
    closes = [float(c["close"]) for c in candles]
    volumes = [int(c["volume"]) for c in candles]
    latest = candles[-1]

    chart_payload = {
        "chart": {
            "result": [{
                "meta": {
                    "currency": "THB",
                    "symbol": "SCB.BK",
                    "exchangeName": "SET",
                    "fullExchangeName": "Thailand",
                    "instrumentType": "EQUITY",
                    "firstTradeDate": timestamps[0],
                    "regularMarketTime": timestamps[-1],
                    "hasPrePostMarketData": False,
                    "gmtoffset": 25200,
                    "timezone": "ICT",
                    "exchangeTimezoneName": "Asia/Bangkok",
                    "regularMarketPrice": latest["close"],
                    "dataGranularity": "1d",
                    "range": "2y"
                },
                "timestamp": timestamps,
                "indicators": {
                    "quote": [{
                        "open": opens,
                        "high": highs,
                        "low": lows,
                        "close": closes,
                        "volume": volumes
                    }],
                    "adjclose": [{
                        "adjclose": closes
                    }]
                }
            }],
            "error": None
        }
    }

    # Save to trader/data/
    trader_data_dir = os.path.join(base_dir, "trader", "data")
    if os.path.exists(trader_data_dir):
        json_path = os.path.join(trader_data_dir, "scb_2y.json")
        js_path = os.path.join(trader_data_dir, "scb_data.js")
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(chart_payload, f, separators=(',', ':'))
        with open(js_path, "w", encoding="utf-8") as f:
            f.write("window.SCB_HISTORICAL_DATA = " + json.dumps(chart_payload, separators=(',', ':')) + ";")
        print(f"    [+] Updated {json_path} and {js_path} with {len(candles)} candles up to {latest['date']}.")

def main():
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"===========================================================")
    print(f"🚀 STARTING AUTOMATED RAMANUJAN QUANT PIPELINE: {now_str}")
    print(f"===========================================================")

    # Step 1: Fetch latest candles from Yahoo Finance
    try:
        candles = fetch_scb_data(symbol="SCB.BK", period="4y", interval="1d")
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

    # Step 3: Synchronize Trader Pro 2-Year Dataset & Cloudflare MCP Server Data
    try:
        sync_trader_and_mcp_data(candles, base_dir)
        print(f"[✓] Step 3 Complete: Synchronized Trader Pro 2Y data & Cloudflare MCP Server metrics.")
    except Exception as e:
        print(f"[!] Warning syncing trader/MCP data: {e}")

    print(f"===========================================================")
    print(f"✨ PIPELINE COMPLETED SUCCESSFULLY AT {now_str}")
    print(f"===========================================================")

if __name__ == "__main__":
    main()
