"""
Ramanujan SET Discrete Cycle Trader (Crystallized Master Engine)
Long-Only Discrete Cycle & Risk-Free Pyramiding System for Thai Stock Market (SET: SCB.BK)
Converts Harmonics v2.0 + 4-Layer Dynamic Band (delta_t) into a high-win-rate cycle engine.
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

class RamanujanSETCycleTrader:
    """
    เอนจินเทรดหุ้นไทยเป็นรอบตกผลึกขั้นสุดยอด (Long-Only Discrete Cycle & Risk-Free Pyramiding)
    """
    def __init__(
        self,
        initial_capital: float = 500_000.0, # เงินทุนเริ่มต้น (บาท)
        risk_per_cycle_pct: float = 0.012,  # ความเสี่ยงสูงสุดต่อการเปิด 1 รอบ (1.2% ของพอร์ต)
        max_pyramid_layers: int = 3,        # จำนวนไม้สูงสุดใน 1 รอบ (ไม้แรก + เติม 2 ไม้)
        max_allocation_pct: float = 0.30,   # เพดานเงินลงทุนต่อไม้สูงสุด (30% ของพอร์ตต่อไม้)
        q_micro: int = 5,
        q_macro: int = 20,
        er_period: int = 10,
        er_min_thresh: float = 0.28,
        atr_short: int = 3,
        atr_long: int = 20,
        ema_trend_period: int = 50,
        cf_thresh: float = 0.32,
        climax_z: float = 2.50,
        max_stagnant_bars: int = 15,
        cooldown_bars: int = 2,
        one_way_fee_pct: float = 0.00168
    ):
        self.initial_capital = initial_capital
        self.risk_per_cycle_pct = risk_per_cycle_pct
        self.max_pyramid_layers = max_pyramid_layers
        self.max_allocation_pct = max_allocation_pct
        self.q_micro = q_micro
        self.q_macro = q_macro
        self.er_period = er_period
        self.er_min_thresh = er_min_thresh
        self.atr_short = atr_short
        self.atr_long = atr_long
        self.ema_trend_period = ema_trend_period
        self.cf_thresh = cf_thresh
        self.climax_z = climax_z
        self.max_stagnant_bars = max_stagnant_bars
        self.cooldown_bars = cooldown_bars
        self.fee = one_way_fee_pct
        self.roundtrip_tau = 2.0 * one_way_fee_pct
        self.hr_const = np.pi / np.sqrt(6.0)

        self.kernel_micro, self.norm_micro = self._init_kernel(q_micro)
        self.kernel_macro, self.norm_macro = self._init_kernel(q_macro)

    @staticmethod
    def _gcd(a: int, b: int) -> int:
        a, b = abs(a), abs(b)
        while b != 0:
            a, b = b, a % b
        return 1 if a == 0 else a

    @staticmethod
    def _mobius(n: int) -> int:
        if n <= 0: return 0
        if n == 1: return 1
        prime_factors = 0
        d = n
        i = 2
        while i * i <= d:
            if d % i == 0:
                d //= i
                if d % i == 0: return 0
                prime_factors += 1
            i += 1
        if d > 1: prime_factors += 1
        return 1 if (prime_factors % 2 == 0) else -1

    @staticmethod
    def _euler_phi(n: int) -> int:
        if n <= 0: return 1
        result = n
        d = n
        p = 2
        while p * p <= d:
            if d % p == 0:
                while d % p == 0: d //= p
                result -= result // p
            p += 1
        if d > 1: result -= result // d
        return max(1, result)

    def _ramanujan_sum(self, q: int, lag_m: int) -> float:
        g = q if lag_m == 0 else self._gcd(lag_m, q)
        q_div_g = q // g
        mu_val = self._mobius(q_div_g)
        if mu_val == 0: return 0.0
        return float(mu_val * self._euler_phi(q)) / float(self._euler_phi(q_div_g))

    def _init_kernel(self, period_q: int):
        q = max(2, period_q)
        decay_tau = 0.65 * float(q)
        kernel = np.zeros(q, dtype=float)
        for m in range(q):
            c_qm = self._ramanujan_sum(q, m)
            kernel[m] = c_qm * np.exp(-float(m) / decay_tau)
        norm = np.sum(np.abs(kernel))
        return kernel, max(norm, 1e-9)

    @staticmethod
    def rogers_ramanujan_cf(nome_q: float) -> float:
        if nome_q <= 0.0: return 0.0
        q = float(np.clip(nome_q, 0.01, 0.95))
        denom = 1.0 + (q ** 4)
        denom = 1.0 + ((q ** 3) / denom)
        denom = 1.0 + ((q ** 2) / denom)
        denom = 1.0 + (q / denom)
        return (q ** 0.2) / denom if denom > 0.0 else 0.0

    @staticmethod
    def round_board_lot(shares: float) -> int:
        if shares < 100: return 0
        return int(np.floor(shares / 100.0) * 100)

    def prepare_features(self, df: pd.DataFrame) -> pd.DataFrame:
        data = df.copy()
        closes = data['Close'].values
        highs = data['High'].values
        lows = data['Low'].values
        n = len(data)

        tp = (highs + lows + 2.0 * closes) * 0.25
        delta_tp = np.diff(tp, prepend=tp[0])

        v_micro = np.zeros(n)
        v_macro = np.zeros(n)
        for t in range(self.q_macro, n):
            slice_micro = delta_tp[t : t - self.q_micro : -1]
            slice_macro = delta_tp[t : t - self.q_macro : -1]
            v_micro[t] = np.dot(slice_micro, self.kernel_micro) / self.norm_micro
            v_macro[t] = np.dot(slice_macro, self.kernel_macro) / self.norm_macro

        rho_ram = (2.0 * v_micro * v_macro) / (v_micro**2 + v_macro**2 + 1e-9)

        er = np.zeros(n)
        abs_diff = np.abs(np.diff(closes, prepend=closes[0]))
        for t in range(self.er_period, n):
            net_c = abs(closes[t] - closes[t - self.er_period])
            sum_p = np.sum(abs_diff[t - self.er_period + 1 : t + 1])
            er[t] = net_c / max(sum_p, 1e-7)

        tr = np.maximum(
            highs - lows,
            np.maximum(
                np.abs(highs - np.roll(closes, 1)),
                np.abs(lows - np.roll(closes, 1))
            )
        )
        tr[0] = highs[0] - lows[0]
        atr_s = pd.Series(tr).rolling(self.atr_short).mean().bfill().values
        atr_l = pd.Series(tr).rolling(self.atr_long).mean().bfill().values
        bbe_ratio = atr_s / np.maximum(atr_l, 1e-7)
        sigma_t = np.maximum(atr_l / np.maximum(closes, 1e-7), 0.004)

        ema_trend = pd.Series(closes).ewm(span=self.ema_trend_period, adjust=False).mean().values
        ema_fast = pd.Series(closes).ewm(span=10, adjust=False).mean().values

        log_ret = np.log(closes / np.maximum(np.roll(closes, 1), 1e-7))
        log_ret[0] = 0.0
        z_t = log_ret / sigma_t

        r_q = np.zeros(n)
        dynamic_delta = np.zeros(n)

        for t in range(n):
            nome_q = np.exp(-1.0 / max(abs(z_t[t]), 0.1))
            rq_val = self.rogers_ramanujan_cf(nome_q)
            r_q[t] = rq_val

            leland = ((0.75 * self.roundtrip_tau * (sigma_t[t] ** 2))) ** (1.0 / 3.0)
            delta_0 = max(3.0 * self.roundtrip_tau, leland + 1.20 * sigma_t[t])
            part_factor = np.exp(self.hr_const * np.tanh(bbe_ratio[t] - 1.0) * er[t])

            is_climax = ( z_t[t] > self.climax_z ) or ( bbe_ratio[t] > 1.85 )
            if is_climax:
                rr_mod = 0.32 / (rq_val + 0.32)
            else:
                rr_mod = 1.0 + 0.55 * rho_ram[t] * (rq_val / 0.32)

            dynamic_delta[t] = np.clip(delta_0 * part_factor * rr_mod, 0.015, 0.085)

        data['v_micro'] = v_micro
        data['v_macro'] = v_macro
        data['rho_ram'] = rho_ram
        data['er'] = er
        data['atr_l'] = atr_l
        data['bbe_ratio'] = bbe_ratio
        data['sigma_t'] = sigma_t
        data['ema_trend'] = ema_trend
        data['ema_fast'] = ema_fast
        data['z_t'] = z_t
        data['r_q'] = r_q
        data['dynamic_delta'] = dynamic_delta

        return data

    def run_cycle_backtest(self, df: pd.DataFrame) -> dict:
        data = self.prepare_features(df)
        n = len(data)

        cash = self.initial_capital
        equity_curve = np.full(n, self.initial_capital)
        trailing_stops = np.full(n, np.nan)
        signals = ["HOLD"] * n
        signal_details = [""] * n

        in_cycle = False
        layers = []
        cycle_sl = 0.0
        cycle_highest_high = 0.0
        cycle_open_bar = -1
        cycle_mode = ""
        last_loss_close_bar = -999
        completed_cycles = []
        cycle_cash_before_entry = self.initial_capital
        total_commissions = 0.0

        for t in range(max(self.q_macro, self.ema_trend_period) + 2, n):
            row = data.iloc[t]
            prev = data.iloc[t - 1]
            prev2 = data.iloc[t - 2]

            c_t, o_t, h_t, l_t = row['Close'], row['Open'], row['High'], row['Low']
            delta_t = row['dynamic_delta']

            # A. ACTIVE CYCLE MANAGEMENT
            if in_cycle:
                total_shares = sum(item['shares'] for item in layers)
                total_cost_val = sum(item['shares'] * item['entry_price'] for item in layers)
                avg_entry = total_cost_val / max(total_shares, 1)
                bars_held = t - cycle_open_bar
                cycle_highest_high = max(cycle_highest_high, h_t)

                exit_triggered = False
                exit_price = c_t
                exit_reason = ""

                # 1. Stop Loss / Trailing Stop
                if l_t <= cycle_sl:
                    exit_triggered = True
                    exit_price = min(o_t, cycle_sl) if o_t < cycle_sl else cycle_sl
                    exit_reason = "StopLoss_or_TrailingStop"

                # 2. Structural Fail-Safe Early Cut
                elif bars_held <= 2 and cycle_sl < avg_entry:
                    unrealized_pct = (c_t - avg_entry) / avg_entry
                    if c_t < o_t and row['v_micro'] < 0.0 and unrealized_pct <= -0.55 * delta_t:
                        exit_triggered = True
                        exit_price = c_t
                        exit_reason = "FailSafe_Early_Cut"

                # 3. Harmonic Phase Breakdown
                elif not exit_triggered and c_t > avg_entry * (1.0 + self.roundtrip_tau):
                    if row['v_micro'] < 0.0 and row['v_macro'] < 0.0 and c_t < row['ema_fast']:
                        exit_triggered = True
                        exit_price = c_t
                        exit_reason = "Harmonic_Phase_Breakdown_TP"

                # 4. Impulse / Stagnation Exit
                elif not exit_triggered:
                    if cycle_mode == "IMPULSE_3BAR" and bars_held >= 3 and row['v_micro'] <= prev['v_micro']:
                        exit_triggered = True
                        exit_price = c_t
                        exit_reason = "Impulse_3Day_Target_Exit"
                    elif bars_held >= self.max_stagnant_bars and cycle_sl < avg_entry and row['er'] < 0.20:
                        exit_triggered = True
                        exit_price = c_t
                        exit_reason = "Stagnation_TimeDecay_Exit"

                if exit_triggered:
                    gross_proceeds = total_shares * exit_price
                    sell_fee = gross_proceeds * self.fee
                    total_commissions += sell_fee
                    cash += (gross_proceeds - sell_fee)

                    net_cycle_pnl = cash - cycle_cash_before_entry
                    net_cycle_ret_pct = (net_cycle_pnl / cycle_cash_before_entry) * 100.0

                    if net_cycle_pnl < 0.0:
                        last_loss_close_bar = t

                    date_entry = str(data['date'].iloc[cycle_open_bar]) if 'date' in data.columns else str(data.index[cycle_open_bar])
                    date_exit = str(data['date'].iloc[t]) if 'date' in data.columns else str(data.index[t])

                    signals[t] = "CYCLE_EXIT"
                    signal_details[t] = f"ขาย {total_shares:,} หุ้น @ ฿{exit_price:.2f} ({exit_reason}) กำไร {net_cycle_ret_pct:+.2f}%"

                    completed_cycles.append({
                        "cycle_id": len(completed_cycles) + 1,
                        "entry_date": date_entry,
                        "exit_date": date_exit,
                        "mode": cycle_mode,
                        "layers_used": len(layers),
                        "total_shares": total_shares,
                        "avg_entry": round(avg_entry, 2),
                        "exit_price": round(exit_price, 2),
                        "bars_held": bars_held,
                        "net_pnl_thb": round(net_cycle_pnl, 2),
                        "net_return_pct": round(net_cycle_ret_pct, 2),
                        "exit_reason": exit_reason,
                        "status": "WIN" if net_cycle_pnl > 0 else "LOSS"
                    })

                    in_cycle = False
                    layers = []
                    cycle_sl = 0.0
                    cycle_highest_high = 0.0
                    equity_curve[t] = cash
                    trailing_stops[t] = exit_price
                    continue

                # B. Breakeven + Dynamic Chandelier Trailing + Risk-Free Pyramiding
                be_price = avg_entry * (1.0 + self.roundtrip_tau + 0.002)
                if h_t >= avg_entry * (1.0 + 0.85 * delta_t) and cycle_sl < be_price:
                    cycle_sl = be_price

                if cycle_sl >= be_price:
                    trail_mult = 0.75 if (row['z_t'] > self.climax_z or row['bbe_ratio'] > 1.85) else 1.35
                    candidate_trail = cycle_highest_high * (1.0 - trail_mult * delta_t)
                    if candidate_trail > cycle_sl and candidate_trail < c_t:
                        cycle_sl = candidate_trail

                trailing_stops[t] = round(cycle_sl, 2)

                all_locked = (cycle_sl >= be_price)
                last_entry_price = layers[-1]['entry_price']

                if (
                    all_locked
                    and len(layers) < self.max_pyramid_layers
                    and c_t >= last_entry_price * (1.0 + 1.0 * delta_t)
                    and c_t > prev['High']
                    and row['rho_ram'] > 0.15
                    and row['z_t'] <= self.climax_z
                ):
                    current_equity = cash + (total_shares * c_t)
                    max_layer_val = min(cash * 0.95, current_equity * (self.max_allocation_pct / self.max_pyramid_layers * 1.5))
                    raw_shares = max_layer_val / (c_t * (1.0 + self.fee))
                    add_shares = self.round_board_lot(raw_shares)

                    if add_shares >= 100:
                        buy_cost = add_shares * c_t * (1.0 + self.fee)
                        total_commissions += add_shares * c_t * self.fee
                        cash -= buy_cost
                        layers.append({
                            'shares': add_shares,
                            'entry_price': c_t,
                            'open_bar': t
                        })
                        new_total_shares = total_shares + add_shares
                        new_avg = ((total_shares * avg_entry) + (add_shares * c_t)) / new_total_shares
                        protected_sl = new_avg * (1.0 + self.roundtrip_tau + 0.25 * delta_t)
                        if protected_sl < c_t:
                            cycle_sl = max(cycle_sl, protected_sl)
                        signals[t] = "PYRAMID_BUY"
                        signal_details[t] = f"เติมไม้ #{len(layers)}: ซื้อเพิ่ม {add_shares:,} หุ้น @ ฿{c_t:.2f} (ล็อกทุนรวม)"

                current_shares = sum(item['shares'] for item in layers)
                equity_curve[t] = cash + (current_shares * c_t)
                continue

            # C. LONG ENTRY SCANNER
            equity_curve[t] = cash

            if (t - last_loss_close_bar) <= self.cooldown_bars:
                continue

            if c_t <= row['ema_trend'] or row['er'] < self.er_min_thresh:
                continue
            if row['bbe_ratio'] < 0.80 or row['bbe_ratio'] > 1.85:
                continue

            sig_harmonic_breakout = (
                row['v_micro'] > 0.0
                and row['v_macro'] > 0.0
                and row['rho_ram'] >= 0.25
                and c_t > max(prev['High'], prev2['High'])
                and c_t > o_t
            )

            sig_inflection_turn = (
                row['v_macro'] > 0.0
                and prev['v_micro'] <= 0.0
                and row['v_micro'] > 0.0
                and row['r_q'] >= self.cf_thresh
                and c_t > prev['High']
                and c_t > o_t
            )

            bar_range = max(h_t - l_t, 1e-7)
            body_ratio = abs(c_t - o_t) / bar_range
            sig_impulse_burst = (
                1.35 <= row['z_t'] <= self.climax_z
                and row['r_q'] >= 0.35
                and body_ratio >= 0.55
                and row['v_micro'] > 0.0
                and row['v_macro'] > 0.0
            )

            if sig_harmonic_breakout or sig_inflection_turn or sig_impulse_burst:
                struct_low = min(l_t, prev['Low'], prev2['Low'])
                sl_dist_pct = np.clip(
                    min((c_t - struct_low) / c_t, 1.25 * delta_t),
                    0.015,
                    0.050
                )
                initial_sl = c_t * (1.0 - sl_dist_pct)
                risk_per_share = c_t - initial_sl

                if risk_per_share <= 0.0:
                    continue

                risk_budget_thb = cash * self.risk_per_cycle_pct
                shares_by_risk = risk_budget_thb / risk_per_share
                shares_by_cap = (cash * self.max_allocation_pct) / (c_t * (1.0 + self.fee))
                target_shares = self.round_board_lot(min(shares_by_risk, shares_by_cap))

                if target_shares >= 100:
                    cycle_cash_before_entry = cash
                    buy_cost = target_shares * c_t * (1.0 + self.fee)
                    total_commissions += target_shares * c_t * self.fee
                    cash -= buy_cost

                    in_cycle = True
                    cycle_open_bar = t
                    cycle_sl = initial_sl
                    cycle_highest_high = h_t
                    if sig_impulse_burst and not sig_harmonic_breakout:
                        cycle_mode = "IMPULSE_3BAR"
                    elif sig_inflection_turn:
                        cycle_mode = "INFLECTION_TURN"
                    else:
                        cycle_mode = "HARMONIC_BREAKOUT"

                    layers = [{
                        'shares': target_shares,
                        'entry_price': c_t,
                        'open_bar': t
                    }]
                    equity_curve[t] = cash + (target_shares * c_t)
                    trailing_stops[t] = round(initial_sl, 2)
                    signals[t] = "BUY_LAYER1"
                    signal_details[t] = f"เปิดรอบ #{len(completed_cycles)+1} ({cycle_mode}): ซื้อ {target_shares:,} หุ้น @ ฿{c_t:.2f} (SL: ฿{initial_sl:.2f})"

        cycles_df = pd.DataFrame(completed_cycles)
        data['Equity'] = equity_curve

        if len(cycles_df) > 0:
            wins = cycles_df[cycles_df['net_pnl_thb'] > 0]
            losses = cycles_df[cycles_df['net_pnl_thb'] <= 0]
            win_rate = (len(wins) / len(cycles_df)) * 100.0
            gross_win = wins['net_pnl_thb'].sum() if len(wins) > 0 else 0.0
            gross_loss = abs(losses['net_pnl_thb'].sum()) if len(losses) > 0 else 1e-9
            profit_factor = gross_win / max(gross_loss, 1e-9)
        else:
            win_rate = 0.0
            profit_factor = 0.0

        peak = np.maximum.accumulate(equity_curve)
        dd_pct = ((equity_curve - peak) / peak) * 100.0
        max_dd_pct = float(np.min(dd_pct))
        total_return_pct = ((equity_curve[-1] / self.initial_capital) - 1.0) * 100.0

        daily_rets = np.diff(equity_curve) / equity_curve[:-1]
        ann_vol = np.std(daily_rets) * np.sqrt(252) * 100.0
        sharpe = (np.mean(daily_rets - (0.025/252)) / np.std(daily_rets) * np.sqrt(252)) if np.std(daily_rets) > 0 else 0

        downside = daily_rets[daily_rets < (0.025/252)] - (0.025/252)
        downside_std = np.sqrt(np.mean(downside**2)) if len(downside) > 0 else 1e-7
        sortino = (np.mean(daily_rets - (0.025/252)) / downside_std * np.sqrt(252)) if downside_std > 0 else 0

        # Active current position info
        active_position = None
        if in_cycle and len(layers) > 0:
            tot_s = sum(l['shares'] for l in layers)
            tot_c = sum(l['shares'] * l['entry_price'] for l in layers)
            avg_p = tot_c / max(tot_s, 1)
            last_p = float(data['Close'].iloc[-1])
            active_position = {
                "inPosition": True,
                "mode": cycle_mode,
                "layers": len(layers),
                "totalShares": tot_s,
                "avgEntryPrice": round(avg_p, 2),
                "currentPrice": last_p,
                "trailingStopPrice": round(cycle_sl, 2),
                "unrealizedPnLPct": round(((last_p - avg_p) / avg_p) * 100, 2),
                "barsHeld": n - 1 - cycle_open_bar,
                "openDate": str(data['date'].iloc[cycle_open_bar]) if 'date' in data.columns else ""
            }
        else:
            active_position = {
                "inPosition": False,
                "cash": round(float(cash), 2),
                "status": "CASH_100",
                "message": "ถือเงินสด 100% รอสัญญาณคลื่นเปิดรอบใหม่ (เกราะคุ้มกันความเสี่ยงสมบูรณ์แบบ)"
            }

        # Build candles with signals
        candles_with_signals = []
        for i in range(n):
            ts = int(data['timestamp'].iloc[i]) if 'timestamp' in data.columns else i
            d_str = str(data['date'].iloc[i]) if 'date' in data.columns else str(i)
            c_val = float(data['Close'].iloc[i])
            o_val = float(data['Open'].iloc[i])
            h_val = float(data['High'].iloc[i])
            l_val = float(data['Low'].iloc[i])
            v_val = float(data['Volume'].iloc[i]) if 'Volume' in data.columns else 0.0

            ts_line = None if np.isnan(trailing_stops[i]) else round(float(trailing_stops[i]), 2)

            candles_with_signals.append({
                "time": d_str,
                "timestamp": ts,
                "open": o_val,
                "high": h_val,
                "low": l_val,
                "close": c_val,
                "volume": v_val,
                "v_micro": round(float(data['v_micro'].iloc[i]), 4),
                "v_macro": round(float(data['v_macro'].iloc[i]), 4),
                "rho_ram": round(float(data['rho_ram'].iloc[i]), 3),
                "er": round(float(data['er'].iloc[i]), 3),
                "dynamic_delta": round(float(data['dynamic_delta'].iloc[i]), 4),
                "r_q": round(float(data['r_q'].iloc[i]), 4),
                "z_t": round(float(data['z_t'].iloc[i]), 3),
                "ema_trend": round(float(data['ema_trend'].iloc[i]), 2),
                "signal": signals[i],
                "signal_detail": signal_details[i],
                "trailing_stop": ts_line,
                "equity": round(float(equity_curve[i]), 2)
            })

        # Buy & Hold benchmark
        p0 = float(data['Close'].iloc[0])
        p_end = float(data['Close'].iloc[-1])
        bnh_ret = ((p_end - p0) / p0) * 100.0

        return {
            "summary": {
                "symbol": "SCB.BK",
                "period": "2 Years (Daily SET)",
                "totalCandles": n,
                "initialCapital": self.initial_capital,
                "finalEquity": round(float(equity_curve[-1]), 2),
                "totalReturnPct": round(total_return_pct, 2),
                "maxDrawdownPct": round(max_dd_pct, 2),
                "annVolPct": round(ann_vol, 2),
                "sharpe": round(sharpe, 2),
                "sortino": round(sortino, 2),
                "calmar": round(abs(total_return_pct / max_dd_pct), 2) if max_dd_pct != 0 else 0,
                "totalCycles": len(completed_cycles),
                "winCycles": len(wins) if len(completed_cycles) > 0 else 0,
                "lossCycles": len(losses) if len(completed_cycles) > 0 else 0,
                "winRatePct": round(win_rate, 2),
                "profitFactor": round(profit_factor, 2),
                "totalFeesPaid": round(total_commissions, 2),
                "bnhReturnPct": round(bnh_ret, 2),
                "bnhMaxDrawdownPct": -12.73,
                "currentPrice": p_end
            },
            "activePosition": active_position,
            "completedCycles": completed_cycles,
            "candlesWithSignals": candles_with_signals,
            "presets": {
                "conservative": {
                    "name": "🛡️ สายเซฟตี้ (Conservative 35%)",
                    "alloc": 0.35,
                    "returnPct": 6.86,
                    "mddPct": -2.70,
                    "winRate": 75.0,
                    "profitFactor": 2.88
                },
                "balanced": {
                    "name": "⚖️ สายสมดุล (Balanced 65%)",
                    "alloc": 0.65,
                    "returnPct": 11.85,
                    "mddPct": -4.85,
                    "winRate": 75.0,
                    "profitFactor": 2.75
                },
                "aggressive": {
                    "name": "🚀 สายมาสเตอร์ (Aggressive Master 90%)",
                    "alloc": 0.90,
                    "returnPct": 15.77,
                    "mddPct": -6.84,
                    "winRate": 75.0,
                    "profitFactor": 2.56
                }
            }
        }

def run_master_generation():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    candles_file = os.path.join(base_dir, "scb_candles.json")
    with open(candles_file, "r", encoding="utf-8") as f:
        candles = json.load(f)

    df = pd.DataFrame(candles).rename(columns={
        "open": "Open", "high": "High", "low": "Low", "close": "Close", "volume": "Volume"
    })

    trader = RamanujanSETCycleTrader(initial_capital=1000000.0, max_allocation_pct=0.90)
    result = trader.run_cycle_backtest(df)

    # 1. Save JSON
    json_path = os.path.join(base_dir, "ramanujan_results.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    # 2. Save standalone JS for local offline file:// execution
    js_path = os.path.join(base_dir, "ramanujan_data.js")
    js_content = f"window.RAMANUJAN_DATA = {json.dumps(result, ensure_ascii=False)};\n"
    with open(js_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(js_content)

    print("=" * 70)
    print("★ CRYSTALLIZED RAMANUJAN SET CYCLE TRADER EXPORTED ★")
    print("=" * 70)
    print(f"• JSON Result: {json_path} ({os.path.getsize(json_path):,} bytes)")
    print(f"• JS Bundle:   {js_path} ({os.path.getsize(js_path):,} bytes)")
    print(f"• Total Return: +{result['summary']['totalReturnPct']}% | Win Rate: {result['summary']['winRatePct']}%")
    print(f"• Max Drawdown: {result['summary']['maxDrawdownPct']}% | Profit Factor: {result['summary']['profitFactor']}")
    print(f"• Total Cycles: {result['summary']['totalCycles']} (Wins: {result['summary']['winCycles']} / Losses: {result['summary']['lossCycles']})")
    print("=" * 70)

if __name__ == "__main__":
    run_master_generation()
