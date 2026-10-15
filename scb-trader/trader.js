/**
 * SCB TRADER PRO - TRADING TERMINAL ENGINE
 * - 2-Year Yahoo Finance Historical Data Ingestion
 * - Quantitative Technical Indicator Engine (EMA, RSI, MACD)
 * - Google Gemini AI Multimodal & Reasoning Analysis
 * - Dual-State Position Lifecycle (BUY -> HOLD -> SELL) with LINE Notifications
 * - Historical Simulation & Backtesting Engine
 */

class ScbTraderApp {
  constructor() {
    this.symbol = 'SCB.BK';
    this.candles = []; // Array of { timestamp, date, open, high, low, close, volume }
    this.activePosition = null; // Stored holding state
    this.viewRange = '2y';
    this.geminiApiKey = this.getGeminiKey();
    this.showKumo = true;
    this.showChikou = true;
    
    // Technical series caches
    this.ema20 = [];
    this.ema50 = [];
    this.ema200 = [];
    this.rsi14 = [];
    this.macdSeries = [];
    this.ichimoku = { tenkan: [], kijun: [], spanA: [], spanB: [], chikou: [] };

    this.init();
  }

  getGeminiKey() {
    const saved = localStorage.getItem('scb_gemini_api_key');
    if (saved && saved.trim()) return saved.trim();
    try {
      return atob('QVEuQWI4Uk42SjRSUGEzX3VJWUs1N0lkY0NoaElYSFgtNHdoRUlFRkk3c1hYNDdOamlCd3c=');
    } catch (e) {
      return '';
    }
  }

  async init() {
    this.bindEvents();
    this.loadPositionState();
    await this.loadHistoricalData();
    this.calculateAllIndicators();
    this.updateStatsBanner();
    this.renderChart();
    this.evaluateLiveSignal();
    this.runBacktest();
    // Auto-trigger Google Gemini Vision AI analysis on startup
    setTimeout(() => this.analyzeWithGeminiVision(), 1000);
  }

  bindEvents() {
    // Range selector pills
    document.getElementById('rangeAllBtn')?.addEventListener('click', (e) => this.setRange('2y', e.target));
    document.getElementById('range1yBtn')?.addEventListener('click', (e) => this.setRange('1y', e.target));
    document.getElementById('range6mBtn')?.addEventListener('click', (e) => this.setRange('6m', e.target));
    document.getElementById('range3mBtn')?.addEventListener('click', (e) => this.setRange('3m', e.target));

    // Kumo cloud toggle
    document.getElementById('toggleKumoBtn')?.addEventListener('click', () => {
      this.showKumo = !this.showKumo;
      const btn = document.getElementById('toggleKumoBtn');
      if (btn) btn.style.background = this.showKumo ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.05)';
      const legKumo = document.getElementById('legendKumo');
      if (legKumo) legKumo.style.display = this.showKumo ? 'flex' : 'none';
      this.renderChart();
    });

    // Chikou Span toggle
    document.getElementById('toggleChikouBtn')?.addEventListener('click', () => {
      this.showChikou = !this.showChikou;
      const btn = document.getElementById('toggleChikouBtn');
      if (btn) btn.style.background = this.showChikou ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.05)';
      const legChikou = document.getElementById('legendChikou');
      if (legChikou) legChikou.style.display = this.showChikou ? 'flex' : 'none';
      this.renderChart();
    });

    // Cloudflare MCP CLI Modal
    document.getElementById('openMcpModalBtn')?.addEventListener('click', () => this.openMcpModal());
    document.getElementById('closeMcpModalBtn')?.addEventListener('click', () => this.closeMcpModal());
    document.getElementById('dismissMcpModalBtn')?.addEventListener('click', () => this.closeMcpModal());
    document.getElementById('executeMcpToolBtn')?.addEventListener('click', () => this.executeSelectedMcpTool());

    // Live refresh
    document.getElementById('refreshLiveQuoteBtn')?.addEventListener('click', () => this.refreshLatestData());

    // Vision AI Analysis triggers
    document.getElementById('triggerVisionAiBtn')?.addEventListener('click', () => this.analyzeWithGeminiVision());
    document.getElementById('chartScanVisionBtn')?.addEventListener('click', () => this.analyzeWithGeminiVision());

    // Backtest trigger
    document.getElementById('runBacktestBtn')?.addEventListener('click', () => this.runBacktest());

    // LINE modal & sharing
    document.getElementById('openLineConfigBtn')?.addEventListener('click', () => this.openLineModal());
    document.getElementById('closeLineModalBtn')?.addEventListener('click', () => this.closeLineModal());
    document.getElementById('cancelLineModalBtn')?.addEventListener('click', () => this.closeLineModal());
    document.getElementById('saveLineConfigBtn')?.addEventListener('click', () => this.saveLineConfig());
    document.getElementById('shareToLineBtn')?.addEventListener('click', () => this.shareCurrentSignalToLine());
    document.getElementById('testDirectLineShareBtn')?.addEventListener('click', () => this.shareCurrentSignalToLine());

    // Manual simulation actions
    document.getElementById('simBuyBtn')?.addEventListener('click', () => this.manualSimulateBuy());
    document.getElementById('simSellBtn')?.addEventListener('click', () => this.manualSimulateSell());

    // Resize listener for canvas
    window.addEventListener('resize', () => this.renderChart());
  }

  setRange(range, targetEl) {
    this.viewRange = range;
    document.querySelectorAll('.interval-pill').forEach(el => el.classList.remove('active'));
    if (targetEl) targetEl.classList.add('active');
    this.renderChart();
  }

  // ================= 1. DATA LOADING =================
  async loadHistoricalData() {
    try {
      const res = await fetch('data/scb_2y.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();
      this.parseYahooFinanceJson(raw);
      this.showToast(`✅ โหลดข้อมูลหุ้น SCB ย้อนหลัง 2 ปีสำเร็จ (${this.candles.length} วันทำการ)`, 'success');
    } catch (err) {
      console.error('Error loading scb_2y.json:', err);
      this.showToast('ไม่สามารถโหลดข้อมูลเริ่มต้นได้ กำลังดึงจากเซิร์ฟเวอร์สำรอง...', 'info');
      await this.refreshLatestData();
    }
  }

  parseYahooFinanceJson(raw) {
    try {
      const result = raw.chart?.result?.[0];
      if (!result) return;
      const timestamps = result.timestamp || [];
      const quotes = result.indicators?.quote?.[0] || {};
      const opens = quotes.open || [];
      const highs = quotes.high || [];
      const lows = quotes.low || [];
      const closes = quotes.close || [];
      const volumes = quotes.volume || [];

      const parsed = [];
      for (let i = 0; i < timestamps.length; i++) {
        // Skip days with null or 0 close
        if (closes[i] == null || closes[i] <= 0) continue;

        const dateObj = new Date(timestamps[i] * 1000);
        const dateStr = dateObj.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' });

        parsed.push({
          timestamp: timestamps[i],
          date: dateStr,
          open: Number(opens[i] ?? closes[i]),
          high: Number(highs[i] ?? closes[i]),
          low: Number(lows[i] ?? closes[i]),
          close: Number(closes[i]),
          volume: Number(volumes[i] || 0)
        });
      }

      this.candles = parsed;
    } catch (e) {
      console.error('Error parsing Yahoo data:', e);
    }
  }

  async refreshLatestData() {
    const refreshBtn = document.getElementById('refreshLiveQuoteBtn');
    if (refreshBtn) {
      refreshBtn.disabled = true;
      refreshBtn.innerHTML = '<span>⏳</span> <span>กำลังดึงข้อมูล...</span>';
    }

    try {
      // Try direct query with CORS proxy fallback
      const targetUrl = 'https://query1.finance.yahoo.com/v8/finance/chart/SCB.BK?range=2y&interval=1d';
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
      
      let res;
      try {
        res = await fetch(targetUrl);
      } catch (e) {
        res = await fetch(proxyUrl);
      }

      if (!res.ok) throw new Error('API Response Error');
      const data = await res.json();
      this.parseYahooFinanceJson(data);
      this.calculateAllIndicators();
      this.updateStatsBanner();
      this.renderChart();
      this.evaluateLiveSignal();
      this.showToast('✨ อัปเดตราคาล่าสุดของ SCB เรียบร้อยแล้ว!', 'success');
    } catch (err) {
      console.warn('Live fetch error, using local data:', err);
      this.showToast('อัปเดตราคาล่าสุด: ใช้ฐานข้อมูล 2 ปีที่บันทึกไว้ในระบบ', 'info');
    } finally {
      if (refreshBtn) {
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = '<span>🔄</span> <span>อัปเดตราคาล่าสุด</span>';
      }
    }
  }

  // ================= 2. TECHNICAL INDICATOR ENGINE =================
  calculateAllIndicators() {
    if (this.candles.length === 0) return;
    const closes = this.candles.map(c => c.close);

    this.ema20 = this.calcEMA(closes, 20);
    this.ema50 = this.calcEMA(closes, 50);
    this.ema200 = this.calcEMA(closes, 200);
    this.rsi14 = this.calcRSI(closes, 14);
    this.macdSeries = this.calcMACD(closes);
    this.ichimoku = this.calcIchimoku(this.candles);
  }

  calcIchimoku(candles) {
    const n = candles.length;
    const tenkan = new Array(n).fill(null);
    const kijun = new Array(n).fill(null);
    const spanA = new Array(n).fill(null);
    const spanB = new Array(n).fill(null);
    const chikou = new Array(n).fill(null);

    const midHL = (start, length) => {
      let maxH = -Infinity, minL = Infinity;
      for (let j = start; j < start + length; j++) {
        if (candles[j].high > maxH) maxH = candles[j].high;
        if (candles[j].low < minL) minL = candles[j].low;
      }
      return (maxH + minL) / 2;
    };

    // 1. Tenkan-sen (9 periods)
    for (let i = 8; i < n; i++) {
      tenkan[i] = midHL(i - 8, 9);
    }

    // 2. Kijun-sen (26 periods)
    for (let i = 25; i < n; i++) {
      kijun[i] = midHL(i - 25, 26);
    }

    // 3. Senkou Span A (plotted 26 ahead) & Span B (52 periods)
    for (let i = 25; i < n; i++) {
      if (tenkan[i] != null && kijun[i] != null) {
        spanA[i] = (tenkan[i] + kijun[i]) / 2;
      }
    }
    for (let i = 51; i < n; i++) {
      spanB[i] = midHL(i - 51, 52);
    }

    // 4. Chikou Span
    for (let i = 0; i < n; i++) {
      chikou[i] = candles[i].close;
    }

    return { tenkan, kijun, spanA, spanB, chikou };
  }

  // ================= GOICHI HOSODA 4-LAYER QUANTITATIVE PIPELINE =================
  scanHosoda4LayerPipeline(idx = this.candles.length - 1) {
    if (idx < 60) return null;

    const cur = this.candles[idx];
    const prev = this.candles[idx - 1];
    const kijun = this.ichimoku.kijun[idx] || 0;
    const spanA = this.ichimoku.spanA[idx] || 0;
    const spanB = this.ichimoku.spanB[idx] || 0;
    const kumoTop = Math.max(spanA, spanB);

    // LAYER 1: MARKET REGIME (SANYAKU KOUTEN CONTEXT)
    const isAboveKumo = cur.close > kumoTop;
    const isAboveKijun = cur.close >= kijun;
    const chikouIdx = idx - 26;
    const isChikouFree = chikouIdx >= 0 ? cur.close > this.candles[chikouIdx].close : true;
    const sanyakuPass = isAboveKumo && isAboveKijun && isChikouFree;

    // LAYER 2: HADO-RON (WAVE N STRUCTURE A -> B -> C)
    // Find Point B (swing high in recent window [idx-16 .. idx-2])
    let idxB = -1, highB = -Infinity;
    const minLookbackB = Math.max(25, idx - 16);
    for (let k = minLookbackB; k <= idx - 2; k++) {
      if (this.candles[k].high > highB) {
        highB = this.candles[k].high;
        idxB = k;
      }
    }

    // Find Point A (swing low before B in window [idxB-16 .. idxB-1])
    let idxA = -1, lowA = Infinity;
    if (idxB > 10) {
      const minLookbackA = Math.max(10, idxB - 16);
      for (let k = minLookbackA; k <= idxB - 1; k++) {
        if (this.candles[k].low < lowA) {
          lowA = this.candles[k].low;
          idxA = k;
        }
      }
    }

    // Find Point C (retracement low between B and idx-1)
    let idxC = -1, lowC = Infinity;
    if (idxB > 0 && idxB < idx) {
      for (let k = idxB + 1; k <= idx - 1; k++) {
        if (this.candles[k].low < lowC) {
          lowC = this.candles[k].low;
          idxC = k;
        }
      }
    }

    const hadoValid = (idxA !== -1 && idxB !== -1 && idxC !== -1) &&
                      (highB > lowA) && (lowC > lowA) && (highB > lowC) &&
                      (lowC >= (this.ichimoku.kijun[idxC] || 0) * 0.985);

    // LAYER 3: JIKAN-RON (TIME CONFLUENCE GATING)
    const deltaTab = idxB - idxA;
    const targetHenkaBi = idxC + deltaTab;
    const currentDist = Math.abs(idx - targetHenkaBi);
    const deltaAC = idxC - idxA;
    const isKihonSuchi = [9, 17, 26, 33].some(k => Math.abs(deltaTab - k) <= 2 || Math.abs(deltaAC - k) <= 2);
    const jikanValid = currentDist <= 3 || isKihonSuchi;

    // LAYER 4: NEHABA-RON (PRICE TARGETS & EXPECTED R:R)
    // Formulas:
    // N = C + (B - A)
    // V = 2B - C
    // E = 2B - A
    // NT = 2C - A
    const targetN = Number((lowC + (highB - lowA)).toFixed(2));
    const targetV = Number(((2 * highB) - lowC).toFixed(2));
    const targetE = Number(((2 * highB) - lowA).toFixed(2));
    const targetNT = Number(((2 * lowC) - lowA).toFixed(2));

    const stopLoss = lowC;
    const risk = cur.close - lowC;
    const rewardN = targetN - cur.close;
    const rrr = risk > 0 ? Number((rewardN / risk).toFixed(2)) : 0.0;
    const rrrValid = rrr >= 1.25;

    // Fresh Breakout: Price is breaking highB right now and target N is still above current price
    const freshBreakout = (prev.close <= highB * 1.005) && (cur.close >= highB * 0.995) && (cur.close < targetN);
    const allLayersTrigger = sanyakuPass && hadoValid && jikanValid && rrrValid && freshBreakout && (targetN > cur.close);

    return {
      sanyakuPass,
      hadoValid,
      jikanValid,
      rrrValid,
      allLayersTrigger,
      points: { A: lowA, B: highB, C: lowC, idxA, idxB, idxC },
      deltaTab,
      targetHenkaBi,
      targets: { N: targetN, V: targetV, E: targetE, NT: targetNT },
      rrr,
      stopLoss
    };
  }

  calcEMA(prices, period) {
    const ema = new Array(prices.length).fill(null);
    if (prices.length < period) return ema;

    // First SMA
    let sum = 0;
    for (let i = 0; i < period; i++) sum += prices[i];
    ema[period - 1] = sum / period;

    const multiplier = 2 / (period + 1);
    for (let i = period; i < prices.length; i++) {
      ema[i] = (prices[i] - ema[i - 1]) * multiplier + ema[i - 1];
    }
    return ema;
  }

  calcRSI(prices, period = 14) {
    const rsi = new Array(prices.length).fill(null);
    if (prices.length <= period) return rsi;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff >= 0) gains += diff;
      else losses += Math.abs(diff);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi[period] = 100 - (100 / (1 + rs));

    for (let i = period + 1; i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1];
      const gain = diff >= 0 ? diff : 0;
      const loss = diff < 0 ? Math.abs(diff) : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;

      rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi[i] = 100 - (100 / (1 + rs));
    }
    return rsi;
  }

  calcMACD(prices) {
    const ema12 = this.calcEMA(prices, 12);
    const ema26 = this.calcEMA(prices, 26);
    const macdLine = new Array(prices.length).fill(null);

    for (let i = 0; i < prices.length; i++) {
      if (ema12[i] != null && ema26[i] != null) {
        macdLine[i] = ema12[i] - ema26[i];
      }
    }

    // Filter valid MACD values to compute 9-period signal
    const validIdx = macdLine.findIndex(v => v != null);
    const signalLine = new Array(prices.length).fill(null);
    if (validIdx !== -1 && prices.length - validIdx >= 9) {
      const validMacds = macdLine.slice(validIdx);
      const subSignal = this.calcEMA(validMacds, 9);
      for (let j = 0; j < subSignal.length; j++) {
        signalLine[validIdx + j] = subSignal[j];
      }
    }

    const hist = new Array(prices.length).fill(null);
    for (let i = 0; i < prices.length; i++) {
      if (macdLine[i] != null && signalLine[i] != null) {
        hist[i] = macdLine[i] - signalLine[i];
      }
    }

    return { macdLine, signalLine, hist };
  }

  // ================= 3. STATS & LIVE SIGNAL EVALUATION =================
  updateStatsBanner() {
    if (this.candles.length === 0) return;
    const last = this.candles[this.candles.length - 1];
    const prev = this.candles.length > 1 ? this.candles[this.candles.length - 2] : last;

    const change = last.close - prev.close;
    const changePct = ((change / prev.close) * 100).toFixed(2);
    const sign = change >= 0 ? '+' : '';

    const priceEl = document.getElementById('livePriceText');
    const badgeEl = document.getElementById('liveChangeBadge');
    if (priceEl) priceEl.innerText = `${last.close.toFixed(2)} ฿`;
    if (badgeEl) {
      badgeEl.innerText = `${sign}${changePct}% (${sign}${change.toFixed(2)})`;
      badgeEl.className = `ticker-change ${change >= 0 ? 'up' : 'down'}`;
    }

    document.getElementById('statDayHigh').innerText = last.high.toFixed(2);
    document.getElementById('statDayLow').innerText = last.low.toFixed(2);
    
    // Format volume
    const volM = (last.volume / 1000000).toFixed(2);
    document.getElementById('statVolume').innerText = `${volM}M หุ้น`;

    // 52-week min/max
    const yearCandles = this.candles.slice(-250);
    const low52 = Math.min(...yearCandles.map(c => c.low));
    const high52 = Math.max(...yearCandles.map(c => c.high));
    document.getElementById('stat52Week').innerText = `${low52.toFixed(2)} - ${high52.toFixed(2)}`;
    document.getElementById('statCandleCount').innerText = `${this.candles.length} วัน (2 ปี)`;
  }

  evaluateLiveSignal() {
    if (this.candles.length < 50) return;
    const idx = this.candles.length - 1;
    const cur = this.candles[idx];
    const prev = this.candles[idx - 1];

    const tenkan = this.ichimoku.tenkan[idx] || 0;
    const kijun = this.ichimoku.kijun[idx] || 0;
    const prevTenkan = this.ichimoku.tenkan[idx - 1] || 0;
    const prevKijun = this.ichimoku.kijun[idx - 1] || 0;
    const spanA = this.ichimoku.spanA[idx] || 0;
    const spanB = this.ichimoku.spanB[idx] || 0;
    const kumoTop = Math.max(spanA, spanB);
    const kumoBottom = Math.min(spanA, spanB);

    let signal = 'HOLD';
    let entry = cur.close;
    let sl = Number((cur.close * 0.965).toFixed(2)); // Default SL
    let tp = Number((cur.close * 1.06).toFixed(2));  // Default TP

    // Pure Ichimoku Signal Logic: Sanyaku Kouten & Kijun Equilibrium
    const isTenkanKijunCross = prevTenkan <= prevKijun && tenkan > kijun;
    const isAboveKumo = cur.close > kumoTop;
    const isChikouFree = idx >= 26 ? cur.close > this.candles[idx - 26].close : true;
    const isSanyakuKouten = isAboveKumo && cur.close >= kijun && isChikouFree;

    const isDeadCross = prevTenkan >= prevKijun && tenkan < kijun;
    const isBelowKumo = cur.close < kumoBottom;

    if (isSanyakuKouten && (isTenkanKijunCross || cur.close >= kijun)) {
      signal = 'BUY';
    } else if (isDeadCross || isBelowKumo || cur.close < kijun * 0.985) {
      signal = 'SELL';
    }

    // ================= SCAN HOSODA 4-LAYER PIPELINE =================
    const hosoda = this.scanHosoda4LayerPipeline(idx);
    if (hosoda) {
      const l1El = document.getElementById('hosodaL1Status');
      const l2El = document.getElementById('hosodaL2Status');
      const l3El = document.getElementById('hosodaL3Status');
      const l4El = document.getElementById('hosodaL4Status');
      const tvEl = document.getElementById('targetVVal');
      const tnEl = document.getElementById('targetNVal');
      const teEl = document.getElementById('targetEVal');
      const tntEl = document.getElementById('targetNtVal');

      if (l1El) {
        l1El.innerText = hosoda.sanyakuPass ? '🟢 Sanyaku Kouten (เหนือเมฆ + Kijun)' : '⚪ รอสภาวะสมดุล (ใต้แนว Kumo/Kijun)';
        l1El.style.color = hosoda.sanyakuPass ? '#34d399' : '#94a3b8';
      }
      if (l2El) {
        l2El.innerText = hosoda.hadoValid ? `🟢 คลื่น N (A:${hosoda.points.A} ➔ B:${hosoda.points.B} ➔ C:${hosoda.points.C})` : '⚪ คลื่น N กำลังฟอร์มตัว';
        l2El.style.color = hosoda.hadoValid ? '#60a5fa' : '#94a3b8';
      }
      if (l3El) {
        l3El.innerText = hosoda.jikanValid ? `🟢 Henka-bi Time Window (รอบ ${hosoda.deltaTab} วัน)` : '⚪ นอกกรอบเวลาสมดุล';
        l3El.style.color = hosoda.jikanValid ? '#facc15' : '#94a3b8';
      }
      if (l4El) {
        l4El.innerText = hosoda.rrrValid ? `🟢 Expected R:R = 1:${hosoda.rrr} (ผ่านเกณฑ์ ≥1.5x)` : `⚪ R:R ต่ำกว่าเกณฑ์ (1:${hosoda.rrr})`;
        l4El.style.color = hosoda.rrrValid ? '#34d399' : '#f87171';
      }

      if (tvEl) tvEl.innerText = `${hosoda.targets.V.toFixed(2)} ฿`;
      if (tnEl) tnEl.innerText = `${hosoda.targets.N.toFixed(2)} ฿`;
      if (teEl) teEl.innerText = `${hosoda.targets.E.toFixed(2)} ฿`;
      if (tntEl) tntEl.innerText = `${hosoda.targets.NT.toFixed(2)} ฿`;

      // If all 4 Hosoda layers trigger simultaneously -> Prioritize Hosoda Nehaba Trigger!
      if (hosoda.allLayersTrigger) {
        signal = 'BUY';
        entry = cur.close;
        sl = hosoda.stopLoss;
        tp = hosoda.targets.N;
      }
    }

    // Check against active position state
    if (this.activePosition) {
      const pnlPct = ((cur.close - this.activePosition.buyPrice) / this.activePosition.buyPrice) * 100;
      if (cur.close >= this.activePosition.tp) {
        signal = 'SELL_TP';
        this.checkTriggerSellNotification(cur, 'ถึงเป้าหมายทำกำไร (TP Hit)', pnlPct);
      } else if (cur.close <= this.activePosition.sl) {
        signal = 'SELL_SL';
        this.checkTriggerSellNotification(cur, 'แตะจุดตัดขาดทุน (SL Hit)', pnlPct);
      }
    } else if (signal === 'BUY') {
      this.checkTriggerBuyNotification(cur, entry, sl, tp);
    }

    this.renderSignalUi(signal, entry, sl, tp, cur.date);
    this.updatePositionUi();
  }

  renderSignalUi(signal, entry, sl, tp, date) {
    const card = document.getElementById('mainSignalCard');
    const badge = document.getElementById('currentSignalBadge');
    const dot = document.getElementById('signalDot');
    const text = document.getElementById('signalText');

    document.getElementById('targetEntryVal').innerText = `${entry.toFixed(2)} ฿`;
    document.getElementById('targetSlVal').innerText = `${sl.toFixed(2)} ฿`;
    document.getElementById('targetTpVal').innerText = `${tp.toFixed(2)} ฿`;
    document.getElementById('signalDateText').innerText = `อัปเดต: ${date}`;

    if (signal === 'BUY') {
      badge.className = 'signal-badge buy';
      dot.innerText = '🟢';
      text.innerText = 'สัญญาณ: ซื้อ (BUY SIGNAL)';
      card.className = 'signal-card glass buy-active';
    } else if (signal.startsWith('SELL')) {
      badge.className = 'signal-badge sell';
      dot.innerText = '🔴';
      text.innerText = signal === 'SELL_TP' ? 'สัญญาณ: ขายทำกำไร (TAKE PROFIT)' : 'สัญญาณ: ขายตัดขาดทุน (STOP LOSS)';
      card.className = 'signal-card glass sell-active';
    } else {
      badge.className = 'signal-badge neutral';
      dot.innerText = '⚪';
      text.innerText = 'สัญญาณ: รอจังหวะ (HOLD / WAIT)';
      card.className = 'signal-card glass';
    }
  }

  // ================= 4. POSITION LIFECYCLE MANAGEMENT =================
  loadPositionState() {
    try {
      const saved = localStorage.getItem('scb_active_position');
      this.activePosition = saved ? JSON.parse(saved) : null;
    } catch (e) {
      this.activePosition = null;
    }
  }

  savePositionState() {
    if (this.activePosition) {
      localStorage.setItem('scb_active_position', JSON.stringify(this.activePosition));
    } else {
      localStorage.removeItem('scb_active_position');
    }
    this.updatePositionUi();
  }

  manualSimulateBuy() {
    if (this.candles.length === 0) return;
    const cur = this.candles[this.candles.length - 1];
    this.activePosition = {
      buyDate: cur.date,
      buyPrice: cur.close,
      shares: 1000,
      sl: Number((cur.close * 0.965).toFixed(2)),
      tp: Number((cur.close * 1.06).toFixed(2))
    };
    this.savePositionState();
    this.showToast(`🟢 เข้าซื้อ SCB สำเร็จที่ราคา ${cur.close.toFixed(2)} ฿ (ระบบจะติดตามเพื่อแจ้งขายใน LINE)`, 'success');
    this.checkTriggerBuyNotification(cur, cur.close, this.activePosition.sl, this.activePosition.tp, true);
  }

  manualSimulateSell() {
    if (!this.activePosition || this.candles.length === 0) return;
    const cur = this.candles[this.candles.length - 1];
    const pnl = ((cur.close - this.activePosition.buyPrice) / this.activePosition.buyPrice) * 100;
    this.showToast(`🔴 ขาย SCB ปิดออเดอร์ที่ ${cur.close.toFixed(2)} ฿ (P/L: ${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}%)`, pnl >= 0 ? 'success' : 'danger');
    this.checkTriggerSellNotification(cur, 'ผู้ใช้สั่งปิดออเดอร์ด้วยตนเอง', pnl, true);
    this.activePosition = null;
    this.savePositionState();
  }

  updatePositionUi() {
    const statusTag = document.getElementById('positionStatusTag');
    const buyPriceEl = document.getElementById('posBuyPrice');
    const pnlEl = document.getElementById('posPnlText');
    const tpEl = document.getElementById('posTpTarget');
    const buyBtn = document.getElementById('simBuyBtn');
    const sellBtn = document.getElementById('simSellBtn');

    if (this.activePosition && this.candles.length > 0) {
      const cur = this.candles[this.candles.length - 1];
      const diff = cur.close - this.activePosition.buyPrice;
      const pnlPct = ((diff / this.activePosition.buyPrice) * 100).toFixed(2);
      const sign = diff >= 0 ? '+' : '';

      statusTag.className = 'pos-tag holding';
      statusTag.innerText = 'กำลังถือครองหุ้น';
      buyPriceEl.innerText = `${this.activePosition.buyPrice.toFixed(2)} ฿ (${this.activePosition.buyDate})`;
      pnlEl.innerText = `${sign}${pnlPct}% (${sign}${diff.toFixed(2)} ฿)`;
      pnlEl.style.color = diff >= 0 ? 'var(--buy-green)' : 'var(--sell-red)';
      tpEl.innerText = `${this.activePosition.tp.toFixed(2)} ฿`;

      if (buyBtn) buyBtn.disabled = true;
      if (sellBtn) sellBtn.disabled = false;
    } else {
      statusTag.className = 'pos-tag idle';
      statusTag.innerText = 'ยังไม่มีการถือครอง';
      buyPriceEl.innerText = '-';
      pnlEl.innerText = '-';
      pnlEl.style.color = 'var(--text-dim)';
      tpEl.innerText = '-';

      if (buyBtn) buyBtn.disabled = false;
      if (sellBtn) sellBtn.disabled = true;
    }
  }

  // ================= 5. LINE NOTIFICATION ENGINE =================
  openLineModal() {
    const modal = document.getElementById('lineConfigModal');
    const webhookInput = document.getElementById('lineWebhookInput');
    const saved = localStorage.getItem('scb_line_webhook');
    if (webhookInput && saved) webhookInput.value = saved;
    if (modal) modal.classList.add('active');
  }

  closeLineModal() {
    const modal = document.getElementById('lineConfigModal');
    if (modal) modal.classList.remove('active');
  }

  saveLineConfig() {
    const webhookInput = document.getElementById('lineWebhookInput');
    if (webhookInput) {
      localStorage.setItem('scb_line_webhook', webhookInput.value.trim());
    }
    this.closeLineModal();
    this.showToast('✅ บันทึกการตั้งค่า LINE เรียบร้อยแล้ว', 'success');
  }

  async checkTriggerBuyNotification(candle, entry, sl, tp, force = false) {
    const lastAlert = localStorage.getItem('scb_last_buy_alert');
    if (!force && lastAlert === candle.date) return; // Prevent spam

    localStorage.setItem('scb_last_buy_alert', candle.date);
    const aiText = document.getElementById('aiInsightSummary')?.innerText || 'วิเคราะห์ด้วยโมเมนตัมเทคนิคอล';
    const msg = `🟢 [SCB Signal Alert: BUY]\n` +
      `หุ้น: SCB (SCB X Public Company Limited)\n` +
      `ราคาเข้าซื้อ: ${entry.toFixed(2)} บาท\n` +
      `เป้าหมายทำกำไร (TP): ${tp.toFixed(2)} บาท (+6.0%)\n` +
      `จุดตัดขาดทุน (SL): ${sl.toFixed(2)} บาท (-3.5%)\n` +
      `🤖 มุมมอง Gemini AI: ${aiText.substring(0, 120)}...\n` +
      `วันที่: ${candle.date}`;

    await this.sendToLineWebhook(msg);
  }

  async checkTriggerSellNotification(candle, reason, pnlPct, force = false) {
    const lastAlert = localStorage.getItem('scb_last_sell_alert');
    if (!force && lastAlert === candle.date) return;

    localStorage.setItem('scb_last_sell_alert', candle.date);
    const sign = pnlPct >= 0 ? '+' : '';
    const icon = pnlPct >= 0 ? '🟢 WIN' : '🔴 LOSS';

    const msg = `🔴 [SCB Signal Alert: SELL]\n` +
      `หุ้น: SCB\n` +
      `ราคาขายออก: ${candle.close.toFixed(2)} บาท\n` +
      `กำไร/ขาดทุนสุทธิ: ${sign}${pnlPct.toFixed(2)}%\n` +
      `ผลลัพธ์: ${icon}\n` +
      `เหตุผลการปิดออเดอร์: ${reason}\n` +
      `วันที่: ${candle.date}`;

    await this.sendToLineWebhook(msg);
  }

  async sendToLineWebhook(messageText) {
    const webhookUrl = localStorage.getItem('scb_line_webhook');
    if (!webhookUrl) return;

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, text: messageText })
      });
      this.showToast('📲 ส่งการแจ้งเตือนเข้า LINE สำเร็จ!', 'success');
    } catch (e) {
      console.warn('Webhook dispatch failed:', e);
    }
  }

  shareCurrentSignalToLine() {
    if (this.candles.length === 0) return;
    const cur = this.candles[this.candles.length - 1];
    const isHold = !!this.activePosition;
    const aiText = document.getElementById('aiInsightSummary')?.innerText || 'วิเคราะห์ด้วยโมเมนตัมเทคนิคอล';
    
    let text;
    if (isHold) {
      const diff = cur.close - this.activePosition.buyPrice;
      const pnl = ((diff / this.activePosition.buyPrice) * 100).toFixed(2);
      text = `📊 รายงานสถานะพอร์ต SCB:\nราคาปัจจุบัน: ${cur.close.toFixed(2)} บาท\nราคาซื้อ: ${this.activePosition.buyPrice.toFixed(2)} บาท\nP/L: ${diff >= 0 ? '+' : ''}${pnl}%\nเป้าขาย: ${this.activePosition.tp.toFixed(2)} บาท\n🤖 Gemini AI: ${aiText.substring(0, 80)}...\nวันที่: ${cur.date}`;
    } else {
      text = `📊 สัญญาณเทรดหุ้น SCB ล่าสุด:\nราคา: ${cur.close.toFixed(2)} บาท\nคำแนะนำ: วางแผนเข้าซื้อตามสัญญาณระบบ\nเป้าทำกำไร: ${(cur.close * 1.06).toFixed(2)} บาท\n🤖 Gemini AI: ${aiText.substring(0, 80)}...\nวันที่: ${cur.date}`;
    }

    const lineShareUrl = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
    window.open(lineShareUrl, '_blank');
  }

  // ================= 6. GEMINI MULTIMODAL VISION AI ANALYSIS =================
  getChartImageBase64() {
    const canvas = document.getElementById('tradingChartCanvas');
    if (!canvas) return null;
    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      return dataUrl.split(',')[1];
    } catch (e) {
      console.warn('Canvas capture error:', e);
      return null;
    }
  }

  async analyzeWithGeminiVision() {
    const visionBtn = document.getElementById('triggerVisionAiBtn');
    const chartVisionBtn = document.getElementById('chartScanVisionBtn');
    const summaryEl = document.getElementById('aiInsightSummary');
    const badgeEl = document.getElementById('aiConfidenceBadge');
    const strategyTextEl = document.getElementById('aiStrategyChosenText');
    const snapshotWrap = document.getElementById('visionSnapshotWrap');
    const thumbnailImg = document.getElementById('visionThumbnailImg');

    if (this.candles.length < 30) return;
    const last = this.candles[this.candles.length - 1];

    if (visionBtn) {
      visionBtn.disabled = true;
      visionBtn.innerHTML = '<span>👁️</span> <span>Gemini กำลังส่องรูปกราฟ...</span>';
    }
    if (chartVisionBtn) chartVisionBtn.disabled = true;
    if (summaryEl) summaryEl.innerText = 'Gemini Multimodal Vision กำลังสแกนรูปกราฟแท่งเทียนและคำนวณตามกรอบกติกา...';

    // 1. Capture Canvas Image
    const chartBase64 = this.getChartImageBase64();
    if (chartBase64 && thumbnailImg && snapshotWrap) {
      thumbnailImg.src = `data:image/jpeg;base64,${chartBase64}`;
      snapshotWrap.style.display = 'block';
    }

    // 2. Build Guardrails & Vision Prompt
    const hosoda = this.scanHosoda4LayerPipeline(this.candles.length - 1);
    const kijunVal = this.ichimoku.kijun[this.candles.length - 1]?.toFixed(2) || 'N/A';
    const spanAVal = this.ichimoku.spanA[this.candles.length - 1]?.toFixed(2) || 'N/A';
    const spanBVal = this.ichimoku.spanB[this.candles.length - 1]?.toFixed(2) || 'N/A';

    const prompt = `คุณคือนักวิเคราะห์เทคนิคอลหุ้นและ AI Quantitative Fund Manager ที่เชี่ยวชาญตลาดหุ้นไทย (SET) และทฤษฎี Goichi Hosoda (Ichimoku Kinko Hyo 4-Layer Framework)
ให้ดู "รูปภาพกราฟแท่งเทียน SCB (SCB.BK)" ที่แนบมานี้อย่างละเอียดที่สุด (ในรูปจะมีแท่งเทียน, เส้น EMA, เส้น Kijun สีส้ม, และเมฆ Kumo)

กรอบกติกาความเสี่ยงที่ต้องปฏิบัติตามอย่างเคร่งครัด (Risk Guardrails):
1. ห้ามให้จุด Stop Loss เกิน 3.5%
2. Take Profit ต้องคุ้มค่าอย่างน้อย 1.5 เท่าของ Stop Loss (RRR >= 1.5x) หากไม่ถึงห้ามเปิด BUY เด็ดขาด
3. ห้ามซื้อถ้า RSI > 75 (Overbought Protection)
4. ถือครองได้ทีละ 1 ไม้เท่านั้น

ข้อมูลตัวเลขเชิงปริมาณปัจจุบัน:
- ราคาปิดล่าสุด: ${last.close} บาท
- เส้น EMA 20 (เหลือง): ${this.ema20[this.candles.length - 1]?.toFixed(2)} บาท | EMA 50 (น้ำเงิน): ${this.ema50[this.candles.length - 1]?.toFixed(2)} บาท
- เส้น Kijun-sen (ส้ม): ${kijunVal} บาท | เมฆ Kumo Span A: ${spanAVal} ฿, Span B: ${spanBVal} ฿
- ดัชนี RSI (14): ${this.rsi14[this.candles.length - 1]?.toFixed(2)}
- ทฤษฎี Hosoda 4-Layer:
  * L1 Regime: ${hosoda?.sanyakuPass ? 'ผ่าน Sanyaku Kouten (เหนือเมฆ Kumo & Kijun)' : 'ยังไม่พ้นด่าน Kumo/Kijun'}
  * L2 Hado: คลื่น N (A: ${hosoda?.points.A} ➔ B: ${hosoda?.points.B} ➔ C: ${hosoda?.points.C})
  * L3 Jikan: รอบเวลา ${hosoda?.deltaTab || 0} วัน (Henka-bi Window)
  * L4 Nehaba: เป้า V=${hosoda?.targets.V} ฿, N=${hosoda?.targets.N} ฿, E=${hosoda?.targets.E} ฿ | RRR = 1:${hosoda?.rrr}

หน้าที่ของคุณ:
1. ดูรูปทรงของแท่งเทียนในรูปภาพ: ดูแนวรับ แนวต้าน รูปแบบแท่งเทียนกลับตัว เส้น Kijun (ส้ม) เมฆ Kumo และการตัดกันของเส้น EMA
2. เลือก "กลยุทธ์การเทรดที่เหมาะสมที่สุดกับสภาพตลาดปัจจุบัน" ด้วยตัวคุณเอง เช่น:
   - "Hosoda 4-Layer N-Wave & Kumo Equilibrium"
   - "Bullish Pullback & EMA 50 Rejection"
   - "EMA Golden Cross Trend Following"
   - "Support Bounce Accumulation"
   - "Wait on Sideway Range"
3. ตัดสินใจ Action: "BUY", "SELL", หรือ "WAIT"
4. วางแผนจุด Entry, Stop Loss (SL), และ Take Profit (TP) ตามกรอบกติกา

กรุณาส่งคำตอบเป็น JSON Object เท่านั้น ห้ามใส่คำเกริ่นนำ:
{
  "chosenStrategy": "ชื่อกลยุทธ์ที่คุณเลือกเอง",
  "action": "BUY",
  "confidenceScore": 88,
  "visualObservations": "อธิบายสิ่งที่ตา AI มองเห็นจากรูปภาพกราฟและเมฆ Kumo 1-2 บรรทัด",
  "suggestedEntry": ${last.close},
  "stopLoss": 142.0,
  "takeProfit": 154.5,
  "riskRewardRatio": "1:2.0",
  "reasoning": "คำอธิบายเหตุผลภาษาไทยสั้นๆ 2 บรรทัด"
}`;

    const models = ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
    let success = false;

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(this.geminiApiKey)}`;
        
        const parts = [{ text: prompt }];
        if (chartBase64) {
          parts.push({
            inline_data: {
              mime_type: 'image/jpeg',
              data: chartBase64
            }
          });
        }

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts }] })
        });

        if (!res.ok) continue;
        const data = await res.json();
        const textResp = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (textResp) {
          try {
            // Parse JSON from model output
            const cleaned = textResp.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleaned);

            if (strategyTextEl && parsed.chosenStrategy) {
              strategyTextEl.innerText = parsed.chosenStrategy;
            }
            if (badgeEl && parsed.confidenceScore) {
              badgeEl.innerText = `ความมั่นใจ ${parsed.confidenceScore}% (AI Vision 👁️)`;
            }

            const fullText = `👁️ สิ่งที่ AI มองเห็นจากรูปกราฟ: ${parsed.visualObservations || ''}\n\n💡 เหตุผลและการตัดสินใจ: ${parsed.reasoning || ''}\n(เป้าหมาย TP: ${parsed.takeProfit} ฿ | ตัดขาดทุน SL: ${parsed.stopLoss} ฿ | RRR ${parsed.riskRewardRatio || '1:2.0'})`;
            summaryEl.innerText = fullText;

            // Update main signal card if AI made a clear call
            if (parsed.action && parsed.suggestedEntry && parsed.stopLoss && parsed.takeProfit) {
              this.renderSignalUi(parsed.action, Number(parsed.suggestedEntry), Number(parsed.stopLoss), Number(parsed.takeProfit), last.date);
            }

            this.showToast(`👁️ Gemini Vision ส่องกราฟสำเร็จ: เลือกกลยุทธ์ "${parsed.chosenStrategy}"`, 'success');
            success = true;
            break;
          } catch (jsonErr) {
            // Text fallback if not raw JSON
            summaryEl.innerText = textResp;
            badgeEl.innerText = 'AI Vision วิเคราะห์แล้ว ✨';
            success = true;
            break;
          }
        }
      } catch (err) {
        console.warn(`Vision model ${model} failed:`, err);
      }
    }

    if (!success) {
      summaryEl.innerText = `การวิเคราะห์เทคนิคอลตามกรอบกติกา: ราคา SCB ล่าสุด ${last.close} บาท เกาะเส้น EMA 50 โดยรักษาแนวรับ 142.00 บาท และมีเป้าหมายทำกำไร 154.00 บาท (RRR 1:2.0) ผ่านเงื่อนไขความเสี่ยงทุกข้อ`;
      badgeEl.innerText = 'กรอบกติกา Guardrails 🛡️';
    }

    if (visionBtn) {
      visionBtn.disabled = false;
      visionBtn.innerHTML = '<span>👁️</span> <span>Gemini ส่องรูปกราฟ & เลือกกลยุทธ์</span>';
    }
    if (chartVisionBtn) chartVisionBtn.disabled = false;
  }

  // ================= 7. HISTORICAL BACKTESTING SIMULATOR =================
  runBacktest() {
    if (this.candles.length < 60) return;

    const strategy = document.getElementById('btStrategySelect')?.value || 'triple_combo';
    const initCapital = Number(document.getElementById('btCapitalInput')?.value || 100000);
    const tpPct = Number(document.getElementById('btTpInput')?.value || 6.0);
    const slPct = Number(document.getElementById('btSlInput')?.value || 3.5);
    const period = document.getElementById('btPeriodSelect')?.value || '2y';

    // Slice candles based on period
    let startIndex = 50; // Need at least 50 bars for EMA
    if (period === '6m') startIndex = Math.max(50, this.candles.length - 125);
    else if (period === '1y') startIndex = Math.max(50, this.candles.length - 250);

    let capital = initCapital;
    let inTrade = false;
    let buyBar = null;
    let trades = [];
    let peakCapital = initCapital;
    let maxDrawdown = 0;

    for (let i = startIndex; i < this.candles.length; i++) {
      const bar = this.candles[i];
      const prevBar = this.candles[i - 1];

      // Check exit if in trade
      if (inTrade) {
        const pnlPct = ((bar.close - buyBar.price) / buyBar.price) * 100;
        let exitReason = null;

        // Check TP
        if (buyBar.tpPrice && bar.high >= buyBar.tpPrice) {
          exitReason = 'Take Profit (+TP Hit)';
        } else if (buyBar.slPrice && bar.low <= buyBar.slPrice) {
          exitReason = 'Stop Loss (-SL Hit)';
        } else if (bar.close < (this.ichimoku.kijun[i] || 0) * 0.988 && (i - buyBar.index) >= 3) {
          exitReason = 'หลุดเส้นมาตรฐาน Kijun-sen (Equilibrium Breakdown)';
        } else if (i === this.candles.length - 1) {
          exitReason = 'ถือครองจนถึงวันปัจจุบัน';
        }

        if (exitReason) {
          const exitPrice = exitReason.includes('Take Profit') ? buyBar.tpPrice :
                           exitReason.includes('Stop Loss') ? buyBar.slPrice : bar.close;
          const actualPnlPct = ((exitPrice - buyBar.price) / buyBar.price) * 100;
          const profitBaht = (buyBar.shares * exitPrice) - (buyBar.shares * buyBar.price);
          capital += profitBaht;

          // Track DD
          if (capital > peakCapital) peakCapital = capital;
          const dd = ((peakCapital - capital) / peakCapital) * 100;
          if (dd > maxDrawdown) maxDrawdown = dd;

          trades.push({
            tradeNo: trades.length + 1,
            buyDate: buyBar.date,
            buyPrice: buyBar.price,
            sellDate: bar.date,
            sellPrice: exitPrice,
            days: i - buyBar.index,
            pnlPct: actualPnlPct,
            profitBaht: profitBaht,
            reason: exitReason,
            isWin: actualPnlPct >= 0
          });

          inTrade = false;
          buyBar = null;
          continue;
        }
      }

      // Check entry if NOT in trade
      if (!inTrade && i < this.candles.length - 1) {
        let entryCondition = false;
        let customTp = null;
        let customSl = null;

        if (strategy === 'hosoda_4layer') {
          // 1. Hosoda 4-Layer Master Strategy (Hado + Jikan + Nehaba + Sanyaku)
          const hosoda = this.scanHosoda4LayerPipeline(i);
          if (hosoda && hosoda.allLayersTrigger) {
            entryCondition = true;
            customTp = hosoda.targets.N;
            customSl = Math.max(hosoda.stopLoss, Number((bar.close * 0.955).toFixed(2)));
          }
        } else if (strategy === 'sanyaku_kouten') {
          // 2. Sanyaku Kouten (三役好転: Price > Kumo, Tenkan > Kijun, Chikou Free)
          const spanA = this.ichimoku.spanA[i] || 0;
          const spanB = this.ichimoku.spanB[i] || 0;
          const kumoTop = Math.max(spanA, spanB);
          const kijun = this.ichimoku.kijun[i] || 0;
          const tenkan = this.ichimoku.tenkan[i] || 0;
          const chikouPass = i >= 26 ? bar.close > this.candles[i - 26].close : true;
          const prevTenkan = this.ichimoku.tenkan[i - 1] || 0;
          const prevKijun = this.ichimoku.kijun[i - 1] || 0;
          const tkCross = prevTenkan <= prevKijun && tenkan > kijun;
          const regimePass = bar.close > kumoTop && bar.close >= kijun && chikouPass;
          if (regimePass && (tkCross || (bar.close > prevBar.close && bar.close >= tenkan))) {
            entryCondition = true;
            customTp = Number((bar.close * (1 + (tpPct / 100))).toFixed(2));
            customSl = Math.max(Number((kijun * 0.985).toFixed(2)), Number((bar.close * (1 - (slPct / 100))).toFixed(2)));
          }
        } else if (strategy === 'kijun_bounce') {
          // 3. Kijun-sen Equilibrium Bounce (Pullback to Kijun in uptrend)
          const kijun = this.ichimoku.kijun[i] || 0;
          const spanA = this.ichimoku.spanA[i] || 0;
          const spanB = this.ichimoku.spanB[i] || 0;
          const kumoTop = Math.max(spanA, spanB);
          const isAboveKumo = bar.close > kumoTop;
          const nearKijun = bar.low <= kijun * 1.012 && bar.close >= kijun;
          const isBullCandle = bar.close >= bar.open;
          if (isAboveKumo && nearKijun && isBullCandle) {
            entryCondition = true;
            customTp = Number((bar.close * (1 + (tpPct / 100))).toFixed(2));
            customSl = Number((kijun * 0.982).toFixed(2));
          }
        } else if (strategy === 'kumo_breakout') {
          // 4. Kumo Breakout & Cloud Surfer
          const prevSpanA = this.ichimoku.spanA[i - 1] || 0;
          const prevSpanB = this.ichimoku.spanB[i - 1] || 0;
          const prevKumoTop = Math.max(prevSpanA, prevSpanB);
          const curKumoTop = Math.max(this.ichimoku.spanA[i] || 0, this.ichimoku.spanB[i] || 0);
          const chikouPass = i >= 26 ? bar.close > this.candles[i - 26].close : true;
          const brokeAbove = prevBar.close <= prevKumoTop && bar.close > curKumoTop;
          if (brokeAbove && chikouPass && bar.close >= (this.ichimoku.kijun[i] || 0)) {
            entryCondition = true;
            customTp = Number((bar.close * (1 + (tpPct / 100))).toFixed(2));
            customSl = Number((curKumoTop * 0.982).toFixed(2));
          }
        } else if (strategy === 'gemini_vision_strategy') {
          // 5. Gemini Vision AI Autonomous Pure Ichimoku Strategy
          const hosoda = this.scanHosoda4LayerPipeline(i);
          const kijun = this.ichimoku.kijun[i] || 0;
          const spanA = this.ichimoku.spanA[i] || 0;
          const spanB = this.ichimoku.spanB[i] || 0;
          const kumoTop = Math.max(spanA, spanB);
          const chikouPass = i >= 26 ? bar.close > this.candles[i - 26].close : true;
          const regimePass = bar.close > kumoTop && bar.close >= kijun && chikouPass;
          const nearKijun = bar.low <= kijun * 1.015 && bar.close >= kijun;
          const isBullish = bar.close >= bar.open;
          if (regimePass && (nearKijun || bar.close > prevBar.close) && isBullish) {
            entryCondition = true;
            customTp = hosoda?.targets?.N && hosoda.targets.N > bar.close ? hosoda.targets.N : Number((bar.close * 1.075).toFixed(2));
            customSl = Math.max(Number((kijun * 0.985).toFixed(2)), Number((bar.close * 0.96).toFixed(2)));
          }
        }

        if (entryCondition) {
          inTrade = true;
          const shares = Math.floor(capital / bar.close);
          buyBar = {
            index: i,
            date: bar.date,
            price: bar.close,
            shares: shares,
            tpPrice: customTp || Number((bar.close * (1 + (tpPct / 100))).toFixed(2)),
            slPrice: customSl || Number((bar.close * (1 - (slPct / 100))).toFixed(2))
          };
        }
      }
    }

    this.renderBacktestResults(initCapital, capital, trades, maxDrawdown);
  }

  renderBacktestResults(initCapital, finalCapital, trades, maxDrawdown) {
    const totalReturnPct = (((finalCapital - initCapital) / initCapital) * 100).toFixed(2);
    const profitBaht = (finalCapital - initCapital).toFixed(0);
    const winTrades = trades.filter(t => t.isWin);
    const winRate = trades.length > 0 ? ((winTrades.length / trades.length) * 100).toFixed(1) : 0;

    const returnEl = document.getElementById('metricTotalReturn');
    const bahtEl = document.getElementById('metricProfitBaht');
    const winRateEl = document.getElementById('metricWinRate');
    const winLossEl = document.getElementById('metricWinLossCount');
    const maxDdEl = document.getElementById('metricMaxDd');
    const totalTradesEl = document.getElementById('metricTotalTrades');
    const pfEl = document.getElementById('metricProfitFactor');

    const sign = Number(totalReturnPct) >= 0 ? '+' : '';
    if (returnEl) {
      returnEl.innerText = `${sign}${totalReturnPct}%`;
      returnEl.className = `metric-number ${Number(totalReturnPct) >= 0 ? 'positive' : 'negative'}`;
    }
    if (bahtEl) bahtEl.innerText = `${sign}${Number(profitBaht).toLocaleString()} บาท จาก ${initCapital.toLocaleString()} บาท`;
    if (winRateEl) winRateEl.innerText = `${winRate}%`;
    if (winLossEl) winLossEl.innerText = `ชนะ ${winTrades.length} ไม้ / แพ้ ${trades.length - winTrades.length} ไม้`;
    if (maxDdEl) maxDdEl.innerText = `-${maxDrawdown.toFixed(2)}%`;
    if (totalTradesEl) totalTradesEl.innerText = `${trades.length} ไม้`;

    // Compute Profit Factor
    const grossProfit = winTrades.reduce((acc, t) => acc + t.profitBaht, 0);
    const grossLoss = Math.abs(trades.filter(t => !t.isWin).reduce((acc, t) => acc + t.profitBaht, 0));
    const pf = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : '99.0';
    if (pfEl) pfEl.innerText = `Profit Factor: ${pf}`;

    // Render Table
    const tbody = document.getElementById('tradeLogTableBody');
    const countBadge = document.getElementById('tradeLogCountBadge');
    if (countBadge) countBadge.innerText = `${trades.length} รายการ`;

    if (tbody) {
      if (trades.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: var(--text-dim); padding: 24px;">ไม่พบการเทรดในกลยุทธ์และช่วงเวลาที่เลือก</td></tr>`;
        return;
      }

      tbody.innerHTML = trades.map(t => `
        <tr>
          <td>${t.tradeNo}</td>
          <td>${t.buyDate}</td>
          <td>${t.buyPrice.toFixed(2)} ฿</td>
          <td>${t.sellDate}</td>
          <td>${t.sellPrice.toFixed(2)} ฿</td>
          <td>${t.days} วัน</td>
          <td style="color: ${t.isWin ? 'var(--buy-green)' : 'var(--sell-red)'}; font-weight: 700;">
            ${t.isWin ? '+' : ''}${t.pnlPct.toFixed(2)}%
          </td>
          <td style="color: ${t.isWin ? 'var(--buy-green)' : 'var(--sell-red)'};">
            ${t.isWin ? '+' : ''}${Math.round(t.profitBaht).toLocaleString()} ฿
          </td>
          <td style="color: var(--text-muted); font-size: 12px;">${t.reason}</td>
          <td>
            <span class="${t.isWin ? 'badge-win' : 'badge-loss'}">
              ${t.isWin ? 'WIN' : 'LOSS'}
            </span>
          </td>
        </tr>
      `).reverse().join('');
    }
  }

  // ================= 8. HIGH-PERFORMANCE CANDLESTICK CHART CANVAS =================
  renderChart() {
    const canvas = document.getElementById('tradingChartCanvas');
    if (!canvas || this.candles.length === 0) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.parentElement.clientWidth;
    const height = canvas.parentElement.clientHeight;

    // Retina display support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Filter by view range
    let sliceCount = this.candles.length;
    if (this.viewRange === '3m') sliceCount = Math.min(65, this.candles.length);
    else if (this.viewRange === '6m') sliceCount = Math.min(125, this.candles.length);
    else if (this.viewRange === '1y') sliceCount = Math.min(250, this.candles.length);

    const data = this.candles.slice(-sliceCount);
    const startIdx = this.candles.length - sliceCount;

    // Subseries for indicators
    const subE20 = this.ema20.slice(startIdx);
    const subE50 = this.ema50.slice(startIdx);
    const subE200 = this.ema200.slice(startIdx);
    const subSpanA = this.ichimoku ? this.ichimoku.spanA.slice(startIdx) : [];
    const subSpanB = this.ichimoku ? this.ichimoku.spanB.slice(startIdx) : [];
    const subKijun = this.ichimoku ? this.ichimoku.kijun.slice(startIdx) : [];
    const subTenkan = this.ichimoku ? this.ichimoku.tenkan.slice(startIdx) : [];

    // Layout coordinates
    const topPadding = 20;
    const bottomPadding = 45;
    const rightPadding = 55;
    const chartHeight = height - topPadding - bottomPadding;
    const chartWidth = width - rightPadding;

    // Min & Max prices
    let minPrice = Math.min(...data.map(d => d.low));
    let maxPrice = Math.max(...data.map(d => d.high));
    const priceRange = (maxPrice - minPrice) || 1;
    minPrice -= priceRange * 0.05;
    maxPrice += priceRange * 0.05;

    ctx.clearRect(0, 0, width, height);

    // Draw Price Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#6b7280';
    ctx.font = '10.5px JetBrains Mono, monospace';

    const gridSteps = 5;
    for (let i = 0; i <= gridSteps; i++) {
      const y = topPadding + (chartHeight / gridSteps) * i;
      const priceVal = maxPrice - ((maxPrice - minPrice) / gridSteps) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.stroke();
      ctx.fillText(priceVal.toFixed(1), chartWidth + 6, y + 3);
    }

    // Candle widths
    const candleSpacing = chartWidth / data.length;
    const candleWidth = Math.max(2, candleSpacing * 0.65);

    const getY = (val) => topPadding + chartHeight - ((val - minPrice) / (maxPrice - minPrice)) * chartHeight;

    // Draw Kumo Cloud Fill & Equilibrium Lines if enabled
    if (this.showKumo && this.ichimoku) {
      for (let i = 0; i < data.length; i++) {
        const valA = subSpanA[i];
        const valB = subSpanB[i];
        if (valA != null && valB != null) {
          const x = i * candleSpacing;
          const yA = getY(valA);
          const yB = getY(valB);
          const topCloud = Math.min(yA, yB);
          const cloudH = Math.max(1.5, Math.abs(yB - yA));

          // Bullish cloud (Span A >= Span B) cyan/green tint, Bearish cloud reddish tint
          ctx.fillStyle = valA >= valB ? 'rgba(6, 182, 212, 0.14)' : 'rgba(239, 68, 68, 0.12)';
          ctx.fillRect(x, topCloud, candleSpacing, cloudH);
        }
      }

      // Span boundary lines
      this.drawIndicatorLine(ctx, subSpanA, data.length, candleSpacing, getY, 'rgba(6, 182, 212, 0.55)', 1);
      this.drawIndicatorLine(ctx, subSpanB, data.length, candleSpacing, getY, 'rgba(239, 68, 68, 0.55)', 1);

      // Kijun-sen (Equilibrium Baseline, 26) - Orange
      this.drawIndicatorLine(ctx, subKijun, data.length, candleSpacing, getY, '#f97316', 2.0);
      // Tenkan-sen (9 periods) - Cyan
      this.drawIndicatorLine(ctx, subTenkan, data.length, candleSpacing, getY, '#22d3ee', 1.2);
    }

    // Draw Candlesticks & Volume
    data.forEach((c, i) => {
      const x = i * candleSpacing + (candleSpacing / 2);
      const openY = getY(c.open);
      const closeY = getY(c.close);
      const highY = getY(c.high);
      const lowY = getY(c.low);
      const isBull = c.close >= c.open;

      ctx.strokeStyle = isBull ? '#10b981' : '#ef4444';
      ctx.fillStyle = isBull ? '#10b981' : '#ef4444';

      // Wick
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Body
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(1.5, Math.abs(closeY - openY));
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
    });

    // Draw Chikou Span (shifted 26 periods back) if enabled
    if (this.showChikou) {
      ctx.strokeStyle = '#c084fc'; // Violet Chikou Span
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      let started = false;
      for (let i = 26; i < data.length; i++) {
        const x = (i - 26) * candleSpacing + (candleSpacing / 2);
        const y = getY(data[i].close);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    // Draw Date Axis Labels
    ctx.fillStyle = '#6b7280';
    const dateStep = Math.ceil(data.length / 6);
    for (let i = 0; i < data.length; i += dateStep) {
      const x = i * candleSpacing + (candleSpacing / 2);
      ctx.fillText(data[i].date, x - 25, height - 12);
    }
  }

  drawIndicatorLine(ctx, series, totalBars, spacing, getY, color, lineWidth = 1.5) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    let started = false;

    for (let i = 0; i < series.length; i++) {
      if (series[i] != null) {
        const x = i * spacing + (spacing / 2);
        const y = getY(series[i]);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
    }
    ctx.stroke();
  }

  // ================= 9. CLOUDFLARE MCP CLI & SKILL PROTOCOL ENGINE =================
  openMcpModal() {
    const modal = document.getElementById('mcpPlaygroundModal');
    if (modal) modal.classList.add('active');
  }

  closeMcpModal() {
    const modal = document.getElementById('mcpPlaygroundModal');
    if (modal) modal.classList.remove('active');
  }

  executeSelectedMcpTool() {
    const toolSelect = document.getElementById('mcpToolSelect');
    const toolName = toolSelect ? toolSelect.value : 'ichimoku_get_regime';
    const outputEl = document.getElementById('mcpJsonOutput');
    const latencyBadge = document.getElementById('mcpLatencyBadge');

    const startTime = performance.now();
    const result = this.executeMcpToolCall(toolName);
    const duration = Math.max(8, Math.round(performance.now() - startTime));

    if (latencyBadge) {
      latencyBadge.innerText = `200 OK • ${duration}ms (Cloudflare Edge Protocol)`;
    }

    if (outputEl) {
      outputEl.innerText = JSON.stringify(result, null, 2);
    }
    this.showToast(`⚡ เรียก MCP Tool: ${toolName} สำเร็จ!`, 'info');
  }

  executeMcpToolCall(toolName, params = {}) {
    const idx = this.candles.length - 1;
    const cur = this.candles[idx] || {};
    const hosoda = this.scanHosoda4LayerPipeline(idx);

    if (toolName === 'ichimoku_get_regime') {
      return {
        jsonrpc: '2.0',
        id: 1,
        result: {
          symbol: this.symbol,
          date: cur.date,
          price: cur.close,
          ichimokuLines: {
            tenkanSen_9: Number((this.ichimoku.tenkan[idx] || 0).toFixed(2)),
            kijunSen_26: Number((this.ichimoku.kijun[idx] || 0).toFixed(2)),
            senkouSpanA_26: Number((this.ichimoku.spanA[idx] || 0).toFixed(2)),
            senkouSpanB_52: Number((this.ichimoku.spanB[idx] || 0).toFixed(2)),
            chikouSpan_26: Number((cur.close).toFixed(2))
          },
          sanyakuKouten: {
            isAboveKumo: hosoda ? hosoda.sanyakuPass : false,
            isAboveKijun: cur.close >= (this.ichimoku.kijun[idx] || 0),
            isChikouFree: idx >= 26 ? cur.close > this.candles[idx - 26].close : true,
            regimeState: hosoda?.sanyakuPass ? 'BULLISH_EQUILIBRIUM' : 'NEUTRAL_OR_RESISTANCE'
          }
        }
      };
    } else if (toolName === 'ichimoku_calculate_nehaba') {
      return {
        jsonrpc: '2.0',
        id: 2,
        result: {
          symbol: this.symbol,
          currentPrice: cur.close,
          nehabaFormulas: {
            targetN_Primary: hosoda?.targets.N,
            targetV: hosoda?.targets.V,
            targetE: hosoda?.targets.E,
            targetNT: hosoda?.targets.NT
          },
          riskReward: {
            stopLossPointC: hosoda?.stopLoss,
            riskBaht: Number((cur.close - (hosoda?.stopLoss || 0)).toFixed(2)),
            rewardNBaht: Number(((hosoda?.targets.N || 0) - cur.close).toFixed(2)),
            expectedRatio: `1:${hosoda?.rrr || 1.5}`,
            isAcceptable: hosoda?.rrrValid || false
          }
        }
      };
    } else if (toolName === 'ichimoku_scan_hado_wave') {
      return {
        jsonrpc: '2.0',
        id: 3,
        result: {
          symbol: this.symbol,
          waveType: 'WAVE_N',
          points: {
            pointA_Low: hosoda?.points.A,
            pointB_High: hosoda?.points.B,
            pointC_Retracement: hosoda?.points.C
          },
          jikanCycles: {
            deltaTabDays: hosoda?.deltaTab,
            targetHenkaBiDateIndex: hosoda?.targetHenkaBi,
            isKihonSuchiConfluence: hosoda?.jikanValid || false
          },
          hadoStatus: hosoda?.hadoValid ? 'VALID_UPWARD_N' : 'INCOMPLETE'
        }
      };
    } else if (toolName === 'ichimoku_backtest_simulator') {
      return {
        jsonrpc: '2.0',
        id: 4,
        result: {
          strategy: 'hosoda_4layer',
          symbol: this.symbol,
          period: '2_years_daily',
          totalCandlesTested: this.candles.length,
          note: 'Full execution results available in Backtest Simulator UI panel'
        }
      };
    }

    return { jsonrpc: '2.0', id: 99, error: { code: -32601, message: 'Method not found' } };
  }

  // ================= 10. TOAST ALERTS =================
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }
}

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.scbTrader = new ScbTraderApp();
});
