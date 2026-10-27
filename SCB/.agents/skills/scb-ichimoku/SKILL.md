---
name: scb-ichimoku
description: Pure Goichi Hosoda Ichimoku Kinko Hyo 4-Layer Quantitative Analysis & Cloudflare MCP Server tool for SCB stock. Use when analyzing SCB.BK, Sanyaku Kouten equilibrium, Wave N (Hado-ron), Henka-bi (Jikan-ron), or Nehaba price targets (V, N, E, NT).
---

# SCB Pure Ichimoku Master Skill (Goichi Hosoda Framework)

This skill provides direct access to the **Pure Ichimoku Kinko Hyo** quantitative engine and **Cloudflare MCP Server** for trading and backtesting SCB stock (`SCB.BK`).

## ⛩️ The 3 Pillars of Goichi Hosoda

1. **Hado-ron (波動論 - Wave Theory)**:
   - Identifies Wave N ($A \to B \to C$)
   - Point A: Swing Low
   - Point B: Impulse High
   - Point C: Retracement Low (must respect Kijun-sen equilibrium)

2. **Jikan-ron (時間論 - Time Dimension)**:
   - Measures cycle lengths $\Delta T_{AB}$ and $\Delta T_{BC}$
   - Projects Henka-bi (change-day window)
   - Evaluates Kihon Suchi (9, 17, 26, 33 days)

3. **Nehaba-ron (値幅論 - Price Targets & R:R)**:
   - Target $N = C + (B - A)$ (Primary target)
   - Target $V = 2B - C$
   - Target $E = 2B - A$
   - Target $NT = 2C - A$
   - Expected $R:R = (N - B) / (B - C) \ge 1.45$

## ⚡ Cloudflare MCP Tools Available

- `ichimoku_get_regime`: Returns 5-line equilibrium state and Sanyaku Kouten confirmation.
- `ichimoku_calculate_nehaba`: Calculates targets $V, N, E, NT$ and verifies Expected R:R.
- `ichimoku_scan_hado_wave`: Analyzes Wave N structure and Henka-bi window.
- `ichimoku_backtest_simulator`: Executes 2-year daily backtesting.

## 🔗 Tri-Synergy Architecture (สามประสาน)

- **GitHub**: Source code and 2-year daily SCB dataset (`scb-trader/data/scb_2y.json`).
- **Cloudflare**: Hosting on Pages and MCP Server on Workers edge (`scb-trader/mcp/`).
- **Google Gemini AI**: Multimodal visual candlestick & Kumo cloud analysis via API key.
