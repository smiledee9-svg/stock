"""
Ramanujan Mathematical Cycle & Turning Point Engine
Based on Ramanujan Sums c_q(n) and Ramanujan-Fourier Periodicity Transform (RFT)
Applied to SCB.BK Historical Market Data
"""
import os
import sys
import json
import math
import numpy as np
import pandas as pd

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

def gcd(a, b):
    while b:
        a, b = b, a % b
    return a

def mobius(n):
    """Compute Mobius function mu(n)"""
    if n == 1:
        return 1
    p = 0
    d = 2
    temp = n
    while d * d <= temp:
        if temp % d == 0:
            temp //= d
            p += 1
            if temp % d == 0:
                return 0  # squared factor
        d += 1
    if temp > 1:
        p += 1
    return -1 if p % 2 != 0 else 1

def euler_phi(n):
    """Euler totient function phi(n)"""
    result = n
    p = 2
    temp = n
    while p * p <= temp:
        if temp % p == 0:
            while temp % p == 0:
                temp //= p
            result -= result // p
        p += 1
    if temp > 1:
        result -= result // temp
    return result

def ramanujan_sum(q, n):
    """
    Ramanujan Sum c_q(n) = sum_{d | gcd(n, q)} mu(q/d) * d
    """
    g = gcd(n, q)
    total = 0
    d = 1
    while d * d <= g:
        if g % d == 0:
            total += mobius(q // d) * d
            if d * d != g:
                other_d = g // d
                total += mobius(q // other_d) * other_d
        d += 1
    return total

class RamanujanQuantModel:
    def __init__(self, candles_json_path=None):
        if candles_json_path is None:
            candles_json_path = os.path.join(os.path.dirname(__file__), "scb_candles.json")
        with open(candles_json_path, "r", encoding="utf-8") as f:
            self.candles = json.load(f)

        self.df = pd.DataFrame(self.candles)
        self.prices = self.df["close"].values
        self.dates = self.df["date"].values

    def compute_ramanujan_spectrum(self, min_period=3, max_period=60, window=120):
        """
        Calculate Ramanujan energy spectrum across candidate integer periods q
        """
        recent_prices = self.prices[-window:]
        # Detrend with linear detrending or highpass
        trend = np.linspace(recent_prices[0], recent_prices[-1], len(recent_prices))
        detrended = recent_prices - trend

        spectrum = []
        n_arr = np.arange(len(detrended))
        N = len(detrended)

        for q in range(min_period, max_period + 1):
            phi_q = euler_phi(q)
            # Calculate c_q(n) array
            cq = np.array([ramanujan_sum(q, n) for n in n_arr])
            # Ramanujan coefficient
            A_q = np.sum(detrended * cq) / (phi_q * N)
            energy = (A_q ** 2) * phi_q
            spectrum.append({
                "period": q,
                "energy": float(energy),
                "coeff": float(A_q)
            })

        spectrum.sort(key=lambda x: x["energy"], reverse=True)
        return spectrum

    def calculate_cycle_wave(self, window=40, dominant_top_k=3):
        """
        Synthesize Ramanujan cyclical wave across entire historical timeline
        using sliding window analysis.
        """
        N = len(self.prices)
        cycle_wave = np.zeros(N)
        momentum = np.zeros(N)

        # Use normalized close prices
        ma = pd.Series(self.prices).rolling(window=20, min_periods=1).mean().values
        detrended = self.prices - ma

        # Candidate periods: 5 (weekly), 10 (biweekly), 15, 20 (monthly), 30, 45, 60
        candidate_periods = [5, 8, 10, 13, 16, 21, 30, 42, 55]

        for i in range(15, N):
            sub_series = detrended[max(0, i - window):i + 1]
            sub_len = len(sub_series)
            n_arr = np.arange(sub_len)

            # Find top dominant periods in this sub-series
            energies = []
            coeffs = []
            for q in candidate_periods:
                if q >= sub_len:
                    continue
                phi_q = euler_phi(q)
                cq = np.array([ramanujan_sum(q, n) for n in n_arr])
                Aq = np.sum(sub_series * cq) / (phi_q * sub_len)
                energy = (Aq ** 2) * phi_q
                energies.append((energy, q, Aq))

            energies.sort(reverse=True)
            top = energies[:dominant_top_k]

            # Reconstruct point i
            val = 0
            for en, q, Aq in top:
                val += Aq * ramanujan_sum(q, sub_len - 1)
            cycle_wave[i] = val

        # Normalize wave between -100 and +100
        std = np.std(cycle_wave) if np.std(cycle_wave) > 0 else 1.0
        normalized_wave = np.clip((cycle_wave / (2.0 * std)) * 100, -100, 100)

        # Compute wave slope/momentum
        for i in range(1, N):
            momentum[i] = normalized_wave[i] - normalized_wave[i - 1]

        return normalized_wave, momentum

    def generate_signals_and_backtest(self, buy_threshold=-30, sell_threshold=40, stop_loss_pct=5.0, take_profit_pct=8.0):
        """
        Run backtest based on Ramanujan Turning Point Signals with Take-Profit and Stop-Loss
        """
        wave, mom = self.calculate_cycle_wave()
        N = len(self.prices)

        signals = []  # 'BUY', 'SELL', 'HOLD'
        trades = []
        in_position = False
        buy_price = 0.0
        buy_date = ""
        buy_index = 0

        for i in range(1, N):
            date = self.dates[i]
            price = self.prices[i]
            w_prev = wave[i - 1]
            w_curr = wave[i]
            m_prev = mom[i - 1]
            m_curr = mom[i]

            sig = "HOLD"

            # BUY CONDITION:
            # 1. Wave is in trough/oversold territory (<= buy_threshold)
            # 2. Wave momentum turns up (m_curr > 0 and (m_prev <= 0 or w_curr > w_prev + 2))
            is_turning_up = (w_prev <= buy_threshold) and (m_curr > 0 and (m_prev <= 0 or w_curr > w_prev + 2))

            # SELL CONDITION:
            # 1. Wave is in peak/overbought territory (>= sell_threshold) and momentum turns down
            # 2. Or hit Stop-Loss (e.g. 5%)
            # 3. Or hit Take-Profit (e.g. 8%)
            is_turning_down = (w_curr >= sell_threshold and m_curr < 0)
            hit_stop_loss = in_position and (price <= buy_price * (1.0 - stop_loss_pct / 100.0))
            hit_take_profit = in_position and (take_profit_pct > 0 and price >= buy_price * (1.0 + take_profit_pct / 100.0))

            if not in_position and is_turning_up:
                sig = "BUY"
                in_position = True
                buy_price = price
                buy_date = date
                buy_index = i
            elif in_position and (is_turning_down or hit_stop_loss or hit_take_profit):
                sig = "SELL"
                in_position = False
                profit_pct = round(((price - buy_price) / buy_price) * 100, 2)
                holding_days = i - buy_index
                reason = "TAKE_PROFIT" if hit_take_profit else ("STOP_LOSS" if hit_stop_loss else "CYCLE_PEAK")
                trades.append({
                    "buyDate": buy_date,
                    "buyPrice": buy_price,
                    "sellDate": date,
                    "sellPrice": price,
                    "profitPct": profit_pct,
                    "holdingDays": holding_days,
                    "exitReason": reason,
                    "status": "WIN" if profit_pct > 0 else "LOSS"
                })

            signals.append({
                "date": date,
                "price": price,
                "wave": round(float(w_curr), 2),
                "momentum": round(float(m_curr), 2),
                "signal": sig
            })

        # Summary statistics
        total_trades = len(trades)
        wins = [t for t in trades if t["profitPct"] > 0]
        losses = [t for t in trades if t["profitPct"] <= 0]
        win_rate = round((len(wins) / total_trades * 100), 2) if total_trades > 0 else 0
        total_return = round(sum(t["profitPct"] for t in trades), 2)
        avg_profit = round(np.mean([t["profitPct"] for t in trades]), 2) if total_trades > 0 else 0
        max_drawdown = round(min([t["profitPct"] for t in trades]), 2) if total_trades > 0 else 0

        # Profit Factor
        gross_profit = sum(t["profitPct"] for t in wins) if wins else 0
        gross_loss = abs(sum(t["profitPct"] for t in losses)) if losses else 1
        profit_factor = round(gross_profit / gross_loss, 2) if gross_loss > 0 else gross_profit

        # Active Open Position
        active_position = None
        if in_position:
            last_price = float(self.prices[-1])
            unrealized_pct = round(((last_price - buy_price) / buy_price) * 100, 2)
            active_position = {
                "buyDate": buy_date,
                "buyPrice": float(buy_price),
                "currentPrice": last_price,
                "unrealizedPct": unrealized_pct,
                "holdingDays": int(N - 1 - buy_index),
                "stopLossPrice": round(buy_price * (1.0 - stop_loss_pct / 100.0), 2),
                "takeProfitPrice": round(buy_price * (1.0 + take_profit_pct / 100.0), 2),
                "status": "ACTIVE_BUY"
            }

        backtest_summary = {
            "symbol": "SCB.BK",
            "period": "2 Years (Daily)",
            "totalCandles": N,
            "totalTrades": total_trades,
            "winTrades": len(wins),
            "lossTrades": len(losses),
            "winRatePct": win_rate,
            "totalReturnPct": total_return,
            "avgProfitPerTradePct": avg_profit,
            "maxLossTradePct": max_drawdown,
            "profitFactor": profit_factor,
            "trades": trades,
            "activePosition": active_position
        }

        return signals, backtest_summary

    def simulate_ramanujan_rebalance(self, initial_capital=1000000.0, base_ratio=0.50, trough_ratio=0.80, peak_ratio=0.25, buy_threshold=-30, sell_threshold=40, min_lot=100):
        """
        Ramanujan Dynamic Cycle-Aware Rebalance Strategy:
        - In Troughs (<= buy_threshold & turning up): Target = trough_ratio (80% Stock) -> Buy Low!
        - In Peaks (>= sell_threshold & turning down): Target = peak_ratio (25% Stock) -> Lock Cash!
        - Otherwise: Base ratio = base_ratio (50% Stock)
        """
        wave, mom = self.calculate_cycle_wave()
        N = len(self.prices)
        p0 = float(self.prices[0])

        current_target_ratio = base_ratio
        initial_stock_val = initial_capital * current_target_ratio
        shares = int((initial_stock_val / p0) // min_lot) * min_lot
        cash = initial_capital - (shares * p0)

        bnh_shares = int((initial_capital / p0) // min_lot) * min_lot
        bnh_cash_rem = initial_capital - (bnh_shares * p0)

        daily = []
        transactions = []
        harvested_cash = 0.0
        rebalance_buy_count = 0
        rebalance_sell_count = 0

        for i in range(N):
            p = float(self.prices[i])
            date = self.dates[i]
            ts = int(self.df["timestamp"].values[i])
            w_curr = wave[i]
            m_curr = mom[i]
            w_prev = wave[i - 1] if i > 0 else 0
            m_prev = mom[i - 1] if i > 0 else 0

            # Signal Detection
            is_turning_up = (w_prev <= buy_threshold) and (m_curr > 0 and (m_prev <= 0 or w_curr > w_prev + 2))
            is_turning_down = (w_curr >= sell_threshold and m_curr < 0)

            action = "HOLD"
            shares_diff = 0
            trade_amt = 0.0

            if is_turning_up:
                current_target_ratio = trough_ratio
                # Trigger Aggressive Rebalance Buy
                stock_val = shares * p
                nav = stock_val + cash
                target_val = nav * current_target_ratio
                deficit = target_val - stock_val
                max_afford = int((cash / p) // min_lot) * min_lot
                buy_shares = int((deficit / p) // min_lot) * min_lot
                buy_shares = min(buy_shares, max_afford)

                if buy_shares > 0:
                    trade_amt = buy_shares * p
                    cash -= trade_amt
                    shares += buy_shares
                    action = "RAMANUJAN_BUY"
                    shares_diff = buy_shares
                    rebalance_buy_count += 1
                    transactions.append({
                        "id": len(transactions) + 1,
                        "date": date,
                        "price": p,
                        "type": "BUY",
                        "shares": buy_shares,
                        "tradeValue": round(trade_amt, 2),
                        "cashAfter": round(cash, 2),
                        "sharesAfter": shares,
                        "targetRatioPct": round(current_target_ratio * 100, 1),
                        "reason": f"หุบคลื่นรามานุจัน Wave {round(w_curr, 1)} กลับตัวขึ้น! เพิ่มสัดส่วนหุ้นเป็น {round(trough_ratio*100)}% ช้อนซื้อของถูก"
                    })

            elif is_turning_down:
                current_target_ratio = peak_ratio
                # Trigger Defensive Rebalance Sell
                stock_val = shares * p
                nav = stock_val + cash
                target_val = nav * current_target_ratio
                excess = stock_val - target_val
                sell_shares = int((excess / p) // min_lot) * min_lot

                if sell_shares > 0:
                    trade_amt = sell_shares * p
                    cash += trade_amt
                    shares -= sell_shares
                    action = "RAMANUJAN_SELL"
                    shares_diff = -sell_shares
                    rebalance_sell_count += 1
                    harvested_cash += trade_amt
                    transactions.append({
                        "id": len(transactions) + 1,
                        "date": date,
                        "price": p,
                        "type": "SELL",
                        "shares": sell_shares,
                        "tradeValue": round(trade_amt, 2),
                        "cashAfter": round(cash, 2),
                        "sharesAfter": shares,
                        "targetRatioPct": round(current_target_ratio * 100, 1),
                        "reason": f"ยอดคลื่นรามานุจัน Wave {round(w_curr, 1)} พักฐาน! ลดสัดส่วนหุ้นเหลือ {round(peak_ratio*100)}% ล็อกกำไรเป็นเงินสด"
                    })

            stock_val_eod = shares * p
            nav_eod = stock_val_eod + cash
            bnh_nav_eod = (bnh_shares * p) + bnh_cash_rem

            daily.append({
                "date": date,
                "timestamp": ts,
                "price": p,
                "wave": round(float(w_curr), 2),
                "shares": shares,
                "stockValue": round(stock_val_eod, 2),
                "cash": round(cash, 2),
                "totalNav": round(nav_eod, 2),
                "stockRatioPct": round((stock_val_eod / nav_eod) * 100, 2) if nav_eod > 0 else 0,
                "targetRatioPct": round(current_target_ratio * 100, 1),
                "bnhNav": round(bnh_nav_eod, 2),
                "action": action,
                "sharesChanged": shares_diff,
                "tradeAmount": round(trade_amt, 2)
            })

        final_nav = daily[-1]["totalNav"]
        total_return_pct = round(((final_nav - initial_capital) / initial_capital) * 100, 2)
        total_profit_thb = round(final_nav - initial_capital, 2)

        final_bnh_nav = daily[-1]["bnhNav"]
        bnh_return_pct = round(((final_bnh_nav - initial_capital) / initial_capital) * 100, 2)
        bnh_profit_thb = round(final_bnh_nav - initial_capital, 2)

        # Max Drawdown
        nav_series = [d["totalNav"] for d in daily]
        peak_nav = np.maximum.accumulate(nav_series)
        dd_series = (nav_series - peak_nav) / peak_nav * 100
        max_drawdown_pct = round(float(np.min(dd_series)), 2)

        bnh_series = [d["bnhNav"] for d in daily]
        peak_bnh = np.maximum.accumulate(bnh_series)
        bnh_dd_series = (bnh_series - peak_bnh) / peak_bnh * 100
        bnh_max_dd_pct = round(float(np.min(bnh_dd_series)), 2)

        initial_shares_val = int((initial_capital * base_ratio / p0) // min_lot) * min_lot
        calmar = round(total_return_pct / abs(max_drawdown_pct), 2) if max_drawdown_pct != 0 else 0
        last_wave = float(wave[-1])
        current_phase = "🌊 หุบคลื่น (Trough - โซนช้อนซื้อหุ้น 80%)" if last_wave <= buy_threshold else ("⛰️ ยอดคลื่น (Peak - โซนล็อกเงินสด 75%)" if last_wave >= sell_threshold else "⚖️ โซนสมดุล (Neutral - 50:50)")

        rebalance_summary = {
            "initialCapital": initial_capital,
            "finalNav": round(final_nav, 2),
            "totalProfitThb": total_profit_thb,
            "totalReturnPct": total_return_pct,
            "bnhFinalNav": round(final_bnh_nav, 2),
            "bnhTotalProfitThb": bnh_profit_thb,
            "bnhReturnPct": bnh_return_pct,
            "maxDrawdownPct": max_drawdown_pct,
            "bnhMaxDrawdownPct": bnh_max_dd_pct,
            "drawdownReductionPct": round(abs(bnh_max_dd_pct) - abs(max_drawdown_pct), 2),
            "calmarRatio": calmar,
            "currentPhase": current_phase,
            "totalRebalances": len(transactions),
            "buyRebalances": rebalance_buy_count,
            "sellRebalances": rebalance_sell_count,
            "harvestedCashTotal": round(harvested_cash, 2),
            "initialShares": initial_shares_val,
            "finalShares": shares,
            "sharesGrowth": shares - initial_shares_val,
            "effectiveCostBasis": round((initial_capital - cash) / shares, 2) if shares > 0 else 0,
            "currentHolding": {
                "shares": shares,
                "stockValue": round(daily[-1]["stockValue"], 2),
                "cash": round(daily[-1]["cash"], 2),
                "stockRatioPct": daily[-1]["stockRatioPct"],
                "targetRatioPct": current_target_ratio * 100,
                "lastPrice": float(self.prices[-1])
            },
            "transactions": transactions
        }

        return rebalance_summary, daily

    def run_full_analysis(self):
        output_dir = os.path.dirname(os.path.abspath(__file__))
        signals, summary = self.generate_signals_and_backtest()
        rebalance_summary, rebalance_daily = self.simulate_ramanujan_rebalance()
        spectrum = self.compute_ramanujan_spectrum()

        combined_result = {
            "summary": summary,
            "rebalanceSummary": rebalance_summary,
            "rebalanceDaily": rebalance_daily,
            "topCycles": spectrum[:5],
            "candlesWithSignals": []
        }

        # Merge signals with candle records for chart display
        sig_map = {s["date"]: s for s in signals}
        for c in self.candles:
            date = c["date"]
            sig_info = sig_map.get(date, {"wave": 0, "momentum": 0, "signal": "HOLD"})
            combined_result["candlesWithSignals"].append({
                "date": date,
                "timestamp": c["timestamp"],
                "open": c["open"],
                "high": c["high"],
                "low": c["low"],
                "close": c["close"],
                "volume": c["volume"],
                "wave": sig_info["wave"],
                "momentum": sig_info["momentum"],
                "signal": sig_info["signal"]
            })

        out_path = os.path.join(output_dir, "ramanujan_results.json")
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(combined_result, f, ensure_ascii=False, indent=2)

        print("=" * 65)
        print("★ ผลการทดสอบโมเดลคลื่นรามานุจัน (Ramanujan Cycle Engine) หุ้น SCB ★")
        print("=" * 65)
        print(f"• จำนวนแท่งเทียนย้อนหลัง 2 ปี : {summary['totalCandles']} วัน")
        print(f"• วัฏจักรคลื่นเด่น (Dominant Cycles) : {[c['period'] for c in spectrum[:3]]} วัน")
        print(f"• จำนวนรอบการเทรดที่ทริกเกอร์ : {summary['totalTrades']} รอบ")
        print(f"• อัตราความแม่นยำ (Win Rate)  : {summary['winRatePct']}% ({summary['winTrades']} ชนะ / {summary['lossTrades']} แพ้)")
        print(f"• ผลตอบแทนรวมสะสม (Return)  : +{summary['totalReturnPct']}%")
        print(f"• กำไรเฉลี่ยต่อรอบ (Avg/Trade) : +{summary['avgProfitPerTradePct']}%")
        print(f"• Profit Factor             : {summary['profitFactor']}")
        print(f"[✓] บันทึกผลวิเคราะห์ที่: {out_path}")
        print("=" * 65)

        return combined_result

if __name__ == "__main__":
    model = RamanujanQuantModel()
    model.run_full_analysis()
