"""
SCB 2-Year Quantitative Rebalancing Engine (Project 4)
Simulating Dynamic Cash-Asset Rebalancing on SCB.BK historical candles.
Compares Rebalancing Strategy vs Classic Buy & Hold.
"""
import os
import sys
import json
import numpy as np
import pandas as pd

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

class RebalanceQuantModel:
    def __init__(self, candles_json_path=None):
        if candles_json_path is None:
            # Fallback to sibling quant-ramanujan or local
            local_path = os.path.join(os.path.dirname(__file__), "scb_candles.json")
            sibling_path = os.path.join(os.path.dirname(__file__), "..", "quant-ramanujan", "scb_candles.json")
            candles_json_path = local_path if os.path.exists(local_path) else sibling_path

        with open(candles_json_path, "r", encoding="utf-8") as f:
            self.candles = json.load(f)

        self.df = pd.DataFrame(self.candles)
        self.prices = self.df["close"].values
        self.dates = self.df["date"].values
        self.timestamps = self.df["timestamp"].values

    def run_simulation(self, initial_capital=1000000.0, target_stock_ratio=0.50, band_pct=5.0, min_trade_lot=100):
        """
        Dynamic Threshold/Band Rebalance Simulation
        - initial_capital: Initial portfolio value in THB (e.g. 1,000,000)
        - target_stock_ratio: Target proportion of SCB Stock (e.g. 0.50 = 50% Stock, 50% Cash)
        - band_pct: Trigger threshold in % deviation (e.g. 5.0% means rebalance when stock ratio deviates by ±5%)
        - min_trade_lot: Minimum trade lot size for Thai stock market (standard 100 shares)
        """
        N = len(self.prices)
        if N == 0:
            return {}, []

        # Initial allocation at Day 0
        p0 = float(self.prices[0])
        initial_stock_val = initial_capital * target_stock_ratio
        initial_cash = initial_capital - initial_stock_val
        
        # Initial shares (rounded to nearest 100 shares lot)
        shares = int((initial_stock_val / p0) // min_trade_lot) * min_trade_lot
        cash = initial_capital - (shares * p0)

        # Baseline: Buy & Hold (100% stock)
        bnh_shares = int((initial_capital / p0) // min_trade_lot) * min_trade_lot
        bnh_cash_rem = initial_capital - (bnh_shares * p0)

        daily_records = []
        transactions = []
        harvested_cash_profit = 0.0

        upper_ratio = target_stock_ratio + (band_pct / 100.0)
        lower_ratio = target_stock_ratio - (band_pct / 100.0)

        rebalance_count_buy = 0
        rebalance_count_sell = 0

        # Day 0 record
        stock_val0 = shares * p0
        total_nav0 = stock_val0 + cash
        bnh_nav0 = (bnh_shares * p0) + bnh_cash_rem

        daily_records.append({
            "date": self.dates[0],
            "timestamp": int(self.timestamps[0]),
            "price": p0,
            "shares": shares,
            "stockValue": round(stock_val0, 2),
            "cash": round(cash, 2),
            "totalNav": round(total_nav0, 2),
            "stockRatioPct": round((stock_val0 / total_nav0) * 100, 2),
            "bnhNav": round(bnh_nav0, 2),
            "action": "INITIAL_ALLOCATION",
            "sharesChanged": shares,
            "tradeAmount": round(shares * p0, 2)
        })

        for i in range(1, N):
            p = float(self.prices[i])
            date = self.dates[i]
            ts = int(self.timestamps[i])

            stock_val = shares * p
            nav = stock_val + cash
            stock_ratio = stock_val / nav if nav > 0 else 0.0

            action = "HOLD"
            shares_diff = 0
            trade_amt = 0.0

            # Check Rebalance Trigger
            if stock_ratio > upper_ratio:
                # Stock appreciated -> Target is to restore to target_stock_ratio
                target_val = nav * target_stock_ratio
                excess_val = stock_val - target_val
                # Number of shares to sell
                shares_to_sell = int((excess_val / p) // min_trade_lot) * min_trade_lot
                if shares_to_sell > 0:
                    shares -= shares_to_sell
                    trade_amt = shares_to_sell * p
                    cash += trade_amt
                    action = "REBALANCE_SELL"
                    rebalance_count_sell += 1
                    shares_diff = -shares_to_sell
                    harvested_cash_profit += trade_amt
                    transactions.append({
                        "id": len(transactions) + 1,
                        "date": date,
                        "price": p,
                        "type": "SELL",
                        "shares": shares_to_sell,
                        "tradeValue": round(trade_amt, 2),
                        "cashAfter": round(cash, 2),
                        "sharesAfter": shares,
                        "navAfter": round(shares * p + cash, 2),
                        "reason": f"สัดส่วนหุ้นพุ่งแตะ {round(stock_ratio * 100, 1)}% (> {round(upper_ratio * 100, 1)}%) ขายล็อกกำไรเงินสด"
                    })

            elif stock_ratio < lower_ratio:
                # Stock dropped -> Target is to buy more cheap shares to restore to target_stock_ratio
                target_val = nav * target_stock_ratio
                deficit_val = target_val - stock_val
                # Number of shares to buy limited by available cash
                max_affordable_shares = int((cash / p) // min_trade_lot) * min_trade_lot
                shares_to_buy = int((deficit_val / p) // min_trade_lot) * min_trade_lot
                shares_to_buy = min(shares_to_buy, max_affordable_shares)

                if shares_to_buy > 0:
                    trade_amt = shares_to_buy * p
                    cash -= trade_amt
                    shares += shares_to_buy
                    action = "REBALANCE_BUY"
                    rebalance_count_buy += 1
                    shares_diff = shares_to_buy
                    transactions.append({
                        "id": len(transactions) + 1,
                        "date": date,
                        "price": p,
                        "type": "BUY",
                        "shares": shares_to_buy,
                        "tradeValue": round(trade_amt, 2),
                        "cashAfter": round(cash, 2),
                        "sharesAfter": shares,
                        "navAfter": round(shares * p + cash, 2),
                        "reason": f"สัดส่วนหุ้นย่อแตะ {round(stock_ratio * 100, 1)}% (< {round(lower_ratio * 100, 1)}%) ใช้เงินสดช้อนซื้อของถูก"
                    })

            # End of day calculation
            stock_val_eod = shares * p
            nav_eod = stock_val_eod + cash
            bnh_nav_eod = (bnh_shares * p) + bnh_cash_rem

            daily_records.append({
                "date": date,
                "timestamp": ts,
                "price": p,
                "shares": shares,
                "stockValue": round(stock_val_eod, 2),
                "cash": round(cash, 2),
                "totalNav": round(nav_eod, 2),
                "stockRatioPct": round((stock_val_eod / nav_eod) * 100, 2) if nav_eod > 0 else 0,
                "bnhNav": round(bnh_nav_eod, 2),
                "action": action,
                "sharesChanged": shares_diff,
                "tradeAmount": round(trade_amt, 2)
            })

        # Calculate Performance Metrics
        final_nav = daily_records[-1]["totalNav"]
        total_return_pct = round(((final_nav - initial_capital) / initial_capital) * 100, 2)
        total_profit_thb = round(final_nav - initial_capital, 2)

        final_bnh_nav = daily_records[-1]["bnhNav"]
        bnh_return_pct = round(((final_bnh_nav - initial_capital) / initial_capital) * 100, 2)
        bnh_profit_thb = round(final_bnh_nav - initial_capital, 2)

        # Max Drawdown calculation for Rebalancing vs Buy & Hold
        nav_series = [r["totalNav"] for r in daily_records]
        peak_nav = np.maximum.accumulate(nav_series)
        dd_series = (nav_series - peak_nav) / peak_nav * 100
        max_drawdown_pct = round(float(np.min(dd_series)), 2)

        bnh_series = [r["bnhNav"] for r in daily_records]
        peak_bnh = np.maximum.accumulate(bnh_series)
        bnh_dd_series = (bnh_series - peak_bnh) / peak_bnh * 100
        bnh_max_dd_pct = round(float(np.min(bnh_dd_series)), 2)

        # Volatility / Risk comparison
        pct_changes = pd.Series(nav_series).pct_change().dropna()
        annualized_vol = round(float(pct_changes.std() * np.sqrt(245) * 100), 2)

        summary = {
            "symbol": "SCB.BK",
            "period": "2 Years (Daily)",
            "totalCandles": N,
            "initialCapital": initial_capital,
            "finalNav": round(final_nav, 2),
            "totalProfitThb": total_profit_thb,
            "totalReturnPct": total_return_pct,
            "bnhFinalNav": round(final_bnh_nav, 2),
            "bnhTotalProfitThb": bnh_profit_thb,
            "bnhReturnPct": bnh_return_pct,
            "alphaVsBnhPct": round(total_return_pct - bnh_return_pct, 2),
            "maxDrawdownPct": max_drawdown_pct,
            "bnhMaxDrawdownPct": bnh_max_dd_pct,
            "drawdownReductionPct": round(abs(bnh_max_dd_pct) - abs(max_drawdown_pct), 2),
            "annualizedVolatilityPct": annualized_vol,
            "targetStockRatioPct": round(target_stock_ratio * 100, 1),
            "bandPct": band_pct,
            "totalRebalances": len(transactions),
            "buyRebalances": rebalance_count_buy,
            "sellRebalances": rebalance_count_sell,
            "harvestedCashTotal": round(harvested_cash_profit, 2),
            "currentHolding": {
                "shares": shares,
                "stockValue": round(daily_records[-1]["stockValue"], 2),
                "cash": round(daily_records[-1]["cash"], 2),
                "stockRatioPct": daily_records[-1]["stockRatioPct"],
                "lastPrice": float(self.prices[-1])
            },
            "transactions": transactions
        }

        return summary, daily_records

    def save_analysis(self, output_dir=None):
        if output_dir is None:
            output_dir = os.path.dirname(os.path.abspath(__file__))
        os.makedirs(output_dir, exist_ok=True)

        # Default 50:50 allocation with 5% band
        summary, daily_records = self.run_simulation(initial_capital=1000000.0, target_stock_ratio=0.50, band_pct=5.0)

        result_payload = {
            "summary": summary,
            "dailyRecords": daily_records,
            "candles": self.candles
        }

        out_path = os.path.join(output_dir, "rebalance_results.json")
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(result_payload, f, ensure_ascii=False, indent=2)

        print("=" * 68)
        print("★ ผลการทดสอบกลยุทธ์รีบาลานซ์พอร์ต (SCB Dynamic Rebalancing Engine) ★")
        print("=" * 68)
        print(f"• หุ้นเป้าหมาย           : SCB.BK (ย้อนหลัง 2 ปี {summary['totalCandles']} วัน)")
        print(f"• เงินลงทุนเริ่มต้น       : ฿{summary['initialCapital']:,.2f}")
        print(f"• สัดส่วนเป้าหมาย        : หุ้น {summary['targetStockRatioPct']}% : เงินสด {100 - summary['targetStockRatioPct']}% (Band ±{summary['bandPct']}%)")
        print(f"• มูลค่าพอร์ตสุดท้าย (NAV) : ฿{summary['finalNav']:,.2f} (+{summary['totalReturnPct']}%)")
        print(f"• ผลตอบแทน Buy & Hold   : ฿{summary['bnhFinalNav']:,.2f} ({summary['bnhReturnPct']:+}%)")
        print(f"• Max Drawdown (Rebalance): {summary['maxDrawdownPct']}% (เทียบกับ Buy&Hold {summary['bnhMaxDrawdownPct']}%)")
        print(f"• ความเสี่ยงลดลง (Cushion): ลดการขาดทุนสูงสุดได้ถึง {summary['drawdownReductionPct']}%")
        print(f"• จำนวนครั้งที่ปรับพอร์ต : {summary['totalRebalances']} ครั้ง (ซื้อของถูก {summary['buyRebalances']} / ขายทำกำไร {summary['sellRebalances']})")
        print(f"[✓] บันทึกผลวิเคราะห์ที่    : {out_path}")
        print("=" * 68)

        return result_payload

if __name__ == "__main__":
    model = RebalanceQuantModel()
    model.save_analysis()
