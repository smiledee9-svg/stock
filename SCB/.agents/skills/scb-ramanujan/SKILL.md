---
name: scb-ramanujan
description: Pure Ramanujan Quantum Discrete Cycle Engine & SCB Intelligence Archive for SCB stock (SCB.BK). Use when analyzing non-linear cycles V1-V18, harmonic waves V5/V20, cycle coherence, dynamic step dt, risk-free pyramiding, or daily intelligence archive.
---

# SCB Pure Ramanujan Quantitative Cycle Engine

This skill provides comprehensive instructions for analyzing, backtesting, and monitoring **SCB.BK (SCB X)** using the **Ramanujan Quantum Discrete Cycle Framework**.

---

## 📐 The Core Mathematical Pillars

1. **Ramanujan Periodicity Theory (RPT) & Ramanujan Sums $c_q(n)$**:
   - Decomposes non-stationary stock series into discrete orthogonal harmonic frequency bases ($V_1$ through $V_{18}$).
   - Extracts dominant cyclical modes, especially $V_5$ (short-term momentum pulse) and $V_{20}$ (monthly swing cycle).

2. **Cycle Coherence & Confidence Metric**:
   - $\text{Coherence} = \text{Corr}(P_t, \sum_{k} w_k V_k) \cdot \text{Energy Ratio}$
   - Only triggers entry when Coherence exceeds threshold and phase alignment is positive.

3. **Dynamic Step $\delta_t$ & Risk-Free Pyramiding**:
   - Base position is entered upon cycle trough confirmation.
   - Secondary lot (pyramiding) is permitted ONLY when the initial position has accumulated sufficient profit buffer to adjust stop loss to break-even (Risk-Free).

4. **2-in-1 Daily Intelligence Journal**:
   - Stored in `database/` (1 master row per trading day).
   - Midday Session (13:00 น.): Intraday monitoring and trigger watch.
   - Evening Session (17:30 น.): End-of-day settlement and cycle crystallization.

---

## 🚀 Key Commands & Execution

- **Update Market Data & Calculate Cycles**:
  ```bash
  python auto_update.py
  ```
- **Files & Data Pipeline**:
  - `fetch_scb.py`: Yahoo Finance candlestick ingestion.
  - `ramanujan_engine.py`: Core algorithm generating cycles and predictions.
  - `ramanujan_data.js`: Frontend web application bundle.
  - `index.html`: Interactive chart and visual analytics lab.
  - `database/index.html`: Daily intelligence archive.
