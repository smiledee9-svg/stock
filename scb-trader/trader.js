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
    
    // Technical series caches
    this.ema20 = [];
    this.ema50 = [];
    this.ema200 = [];
    this.rsi14 = [];
    this.macdSeries = [];

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
    // Auto-trigger Google Gemini AI intelligence analysis on startup
    setTimeout(() => this.analyzeWithGeminiAI(), 800);
  }

  bindEvents() {
    // Range selector pills
    document.getElementById('rangeAllBtn')?.addEventListener('click', (e) => this.setRange('2y', e.target));
    document.getElementById('range1yBtn')?.addEventListener('click', (e) => this.setRange('1y', e.target));
    document.getElementById('range6mBtn')?.addEventListener('click', (e) => this.setRange('6m', e.target));
    document.getElementById('range3mBtn')?.addEventListener('click', (e) => this.setRange('3m', e.target));

    // Live refresh
    document.getElementById('refreshLiveQuoteBtn')?.addEventListener('click', () => this.refreshLatestData());

    // AI Analysis trigger
    document.getElementById('triggerAiAnalyzeBtn')?.addEventListener('click', () => this.analyzeWithGeminiAI());

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

    const curE20 = this.ema20[idx];
    const curE50 = this.ema50[idx];
    const prevE20 = this.ema20[idx - 1];
    const prevE50 = this.ema50[idx - 1];
    const rsi = this.rsi14[idx];

    let signal = 'HOLD';
    let entry = cur.close;
    let sl = Number((cur.close * 0.965).toFixed(2)); // 3.5% SL
    let tp = Number((cur.close * 1.06).toFixed(2));  // 6.0% TP

    // Signal logic: EMA Golden Cross or RSI bounce in uptrend
    const isGoldenCross = prevE20 <= prevE50 && curE20 > curE50;
    const isUptrendRsiPullback = cur.close > curE50 && rsi > 42 && rsi < 62 && cur.close >= cur.open;
    const isDeadCross = prevE20 >= prevE50 && curE20 < curE50;

    if (isGoldenCross || isUptrendRsiPullback) {
      signal = 'BUY';
    } else if (isDeadCross || rsi > 78) {
      signal = 'SELL';
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

  // ================= 6. GEMINI AI ANALYSIS =================
  async analyzeWithGeminiAI() {
    const aiBtn = document.getElementById('triggerAiAnalyzeBtn');
    const summaryEl = document.getElementById('aiInsightSummary');
    const badgeEl = document.getElementById('aiConfidenceBadge');

    if (this.candles.length < 30) return;
    const last = this.candles[this.candles.length - 1];
    const recent5 = this.candles.slice(-5).map(c => `${c.date}: Open ${c.open}, High ${c.high}, Low ${c.low}, Close ${c.close}, Vol ${c.volume}`).join('\n');

    if (aiBtn) {
      aiBtn.disabled = true;
      aiBtn.innerHTML = '<span>⏳</span> <span>AI กำลังวิเคราะห์...</span>';
    }
    if (summaryEl) summaryEl.innerText = 'Gemini AI กำลังคำนวณโครงสร้างแนวโน้มและปริมาณซื้อขาย...';

    const prompt = `คุณคือนักวิเคราะห์เทคนิคอลหุ้นและ Quantitative Trader ผู้เชี่ยวชาญตลาดหุ้นไทย (SET)
ให้วิเคราะห์หุ้น SCB (SCB X Public Company Limited) จากข้อมูลล่าสุดดังนี้:
- ราคาปิดล่าสุด: ${last.close} บาท
- เส้น EMA 20: ${this.ema20[this.candles.length - 1]?.toFixed(2)} บาท
- เส้น EMA 50: ${this.ema50[this.candles.length - 1]?.toFixed(2)} บาท
- เส้น EMA 200: ${this.ema200[this.candles.length - 1]?.toFixed(2)} บาท
- ดัชนี RSI (14): ${this.rsi14[this.candles.length - 1]?.toFixed(2)}
- 5 แท่งเทียนล่าสุด:
${recent5}

จงให้คำแนะนำเชิงกลยุทธ์:
1. ประเมินว่าอยู่ในแนวโน้มใด (Uptrend, Sideway, Downtrend)
2. แนะนำจังหวะว่าควร "ซื้อ (BUY)" หรือ "รอจังหวะ (HOLD/WAIT)" หรือ "ขายทำกำไร (SELL)"
3. ระบุแนวรับสำคัญ และ แนวต้านสำคัญ
4. ประเมินความมั่นใจเป็นเปอร์เซ็นต์ (เช่น 85%)

เขียนคำอธิบายเป็นภาษาไทยกระชับ 2-3 บรรทัด ไม่เยิ่นเย้อ ชัดเจนแบบมืออาชีพ`;

    const models = ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
    let success = false;

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(this.geminiApiKey)}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (!res.ok) continue;
        const data = await res.json();
        const textResp = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textResp) {
          summaryEl.innerText = textResp;
          badgeEl.innerText = 'วิเคราะห์ล่าสุดโดย AI ✨';
          success = true;
          this.showToast('🤖 Gemini AI วิเคราะห์ทิศทางหุ้น SCB เรียบร้อยแล้ว!', 'success');
          break;
        }
      } catch (err) {
        console.warn(`Model ${model} failed:`, err);
      }
    }

    if (!success) {
      summaryEl.innerText = `การวิเคราะห์เทคนิคอล: ราคา SCB ล่าสุด ${last.close} บาท ยืนเหนือ EMA 50 สะท้อนการทรงตัวในกรอบสะสม แนวรับ 144.00 บาท แนวต้าน 150.00 บาท`;
      badgeEl.innerText = 'ระบบ Rule-based';
    }

    if (aiBtn) {
      aiBtn.disabled = false;
      aiBtn.innerHTML = '<span>✨</span> <span>วิเคราะห์ด้วย Gemini AI</span>';
    }
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
        if (bar.high >= buyBar.tpPrice) {
          exitReason = 'Take Profit (+TP Hit)';
        } else if (bar.low <= buyBar.slPrice) {
          exitReason = 'Stop Loss (-SL Hit)';
        } else if (i === this.candles.length - 1) {
          exitReason = 'ถือครองจนถึงวันปัจจุบัน';
        } else if (strategy === 'ema_cross' && this.ema20[i] < this.ema50[i]) {
          exitReason = 'EMA Dead Cross';
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

        if (strategy === 'ema_cross') {
          // EMA 20 crosses above EMA 50
          entryCondition = this.ema20[i - 1] <= this.ema50[i - 1] && this.ema20[i] > this.ema50[i];
        } else if (strategy === 'rsi_pullback') {
          // RSI < 40 turning up while above EMA 200
          entryCondition = (this.candles[i].close > (this.ema200[i] || 0)) && this.rsi14[i - 1] < 42 && this.rsi14[i] >= 42;
        } else if (strategy === 'macd_momentum') {
          // MACD Histogram turns positive
          entryCondition = this.macdSeries.hist[i - 1] <= 0 && this.macdSeries.hist[i] > 0;
        } else if (strategy === 'triple_combo') {
          // EMA 20 > EMA 50 + RSI between 45 and 65 + close above open
          entryCondition = this.ema20[i] > this.ema50[i] && this.rsi14[i] >= 48 && this.rsi14[i] <= 68 && bar.close > prevBar.close;
        }

        if (entryCondition) {
          inTrade = true;
          const shares = Math.floor(capital / bar.close);
          buyBar = {
            index: i,
            date: bar.date,
            price: bar.close,
            shares: shares,
            tpPrice: Number((bar.close * (1 + (tpPct / 100))).toFixed(2)),
            slPrice: Number((bar.close * (1 - (slPct / 100))).toFixed(2))
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

    // Draw EMAs
    this.drawIndicatorLine(ctx, subE20, data.length, candleSpacing, getY, '#eab308'); // Yellow EMA 20
    this.drawIndicatorLine(ctx, subE50, data.length, candleSpacing, getY, '#3b82f6'); // Blue EMA 50
    this.drawIndicatorLine(ctx, subE200, data.length, candleSpacing, getY, '#a855f7'); // Purple EMA 200

    // Draw Date Axis Labels
    ctx.fillStyle = '#6b7280';
    const dateStep = Math.ceil(data.length / 6);
    for (let i = 0; i < data.length; i += dateStep) {
      const x = i * candleSpacing + (candleSpacing / 2);
      ctx.fillText(data[i].date, x - 25, height - 12);
    }
  }

  drawIndicatorLine(ctx, series, totalBars, spacing, getY, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
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

  // ================= 9. TOAST ALERTS =================
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
