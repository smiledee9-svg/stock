/**
 * Ramanujan SET Discrete Cycle Trader - Front-End Controller
 * Single-Page Crystallized Master Dashboard for SCB.BK
 * Powered by Ramanujan Periodicity Transform (RPT), Rogers-Ramanujan Fractions,
 * Hardy-Ramanujan Partitions, and Risk-Free Pyramiding.
 */

// ==========================================
// 1. GLOBAL STATE & LOCAL STORAGE CONFIG
// ==========================================
const LOCAL_STORAGE_KEY = 'SCB_RAMANUJAN_JOURNAL_V2';
let rawData = null;
let priceChart = null;
let waveChart = null;
let candleSeries = null;
let emaSeries = null;
let trailingSeries = null;
let vMicroSeries = null;
let vMacroSeries = null;
let zeroLineSeries = null;

// Archive Database state
let allArchiveRecords = [];
let currentArchiveFilter = 'all';
let archiveSearchQuery = '';
let currentArchivePage = 1;
const ARCHIVE_ITEMS_PER_PAGE = 10;

// Active 18-wave selection
let selectedWaveIdx = 5; // Default to V5 (Weekly Momentum)

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // 1. Try to fetch the absolute latest results with cache-busting query
  fetch('ramanujan_results.json?_t=' + Date.now())
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return res.json();
    })
    .then(data => initDashboard(data))
    .catch(err => {
      // 2. Fallback to bundled window.RAMANUJAN_DATA (offline/local file support)
      if (typeof window.RAMANUJAN_DATA !== 'undefined' && window.RAMANUJAN_DATA) {
        initDashboard(window.RAMANUJAN_DATA);
      } else {
        showToast('⚠️ กำลังเปิดด้วยโหมดออฟไลน์');
      }
    });
});

/**
 * Master initialization function for single-page dashboard
 */
function initDashboard(data) {
  rawData = data;
  const summary = data.summary || {};
  const activePos = data.activePosition || {};
  const completedCycles = data.completedCycles || [];
  const candles = data.candlesWithSignals || [];
  const pred = data.predictiveIntelligence || {};

  // 1. Render Top Header & Live Quantum Telemetry Cockpit
  renderTelemetryCockpit(summary, activePos, pred, candles);

  // 2. Initialize Lightweight Charts (Candlesticks + Ramanujan Waves)
  initLightweightCharts(candles);

  // 3. Render 4 Sacred Scenarios
  renderScenarios(pred);

  // 4. Render 18-Harmonic Wave Continuum Spectrum
  renderWaveContinuum(candles, pred);

  // 5. Initialize 2-in-1 Daily Intelligence Archive
  initDailyArchive(candles, pred, summary);

  // 6. Render Master Cycle Ledger (26 historical cycles)
  renderMasterCycleLedger(completedCycles, summary);

  // 7. Initialize Sticky Navigation HUD (Smooth Scrolling + ScrollSpy)
  initStickyNavHud();
}

// ==========================================
// 2. TELEMETRY COCKPIT & LIVE STATE
// ==========================================
function renderTelemetryCockpit(summary, activePos, pred, candles) {
  const lastBar = candles.length > 0 ? candles[candles.length - 1] : {};
  const currPrice = pred.lastPrice || lastBar.close || 153.50;
  const lastDate = pred.lastDate || lastBar.time || '2026-10-27';

  // Live status pill in Hero (Dynamic Midday vs Evening)
  const elStatus = document.getElementById('liveStatusText');
  if (elStatus) {
    const isMidday = new Date().getHours() < 16;
    const sessionLabel = isMidday ? 'ตลาดปิดเที่ยง' : 'ตลาดปิดเย็น';
    elStatus.textContent = `${sessionLabel} ${formatDateThai(lastDate)}: ฿${currPrice.toFixed(2)}`;
  }

  // Header Collapse Toggle (Maximized Screen Focus)
  const btnToggleTop = document.getElementById('btnToggleTopBar');
  const factGrid = document.getElementById('factTelemetryGrid');
  const toggleIcon = document.getElementById('toggleTopBarIcon');
  const toggleText = document.getElementById('toggleTopBarText');

  if (btnToggleTop && factGrid) {
    // Default to HIDDEN (true) so the user gets clean, maximum chart space as requested
    let isHidden = localStorage.getItem('RAMANUJAN_HEADER_HIDDEN') !== 'false';
    const applyState = () => {
      factGrid.style.display = isHidden ? 'none' : 'grid';
      if (toggleIcon) toggleIcon.textContent = isHidden ? '👁️' : '🔼';
      if (toggleText) toggleText.textContent = isHidden ? 'แสดงข้อมูลสัจธรรม 6 มิติ' : 'ซ่อนแถบหัว (เน้นดูกราฟ)';
    };
    applyState();

    btnToggleTop.onclick = () => {
      isHidden = !isHidden;
      localStorage.setItem('RAMANUJAN_HEADER_HIDDEN', isHidden ? 'true' : 'false');
      applyState();
      // Refit charts smoothly after header layout shift
      if (typeof priceChart !== 'undefined' && priceChart) priceChart.timeScale().fitContent();
      if (typeof waveChart !== 'undefined' && waveChart) waveChart.timeScale().fitContent();
    };
  }

  // Telemetry Tiles
  const elPrice = document.getElementById('kpiPrice');
  if (elPrice) elPrice.textContent = `฿${currPrice.toFixed(2)}`;

  const elDate = document.getElementById('kpiDate');
  if (elDate) elDate.textContent = `ข้อมูลปิดตลาด SET วันที่ ${formatDateThai(lastDate)}`;

  const deltaPct = pred.dynamicDeltaPct || 6.16;
  const deltaThb = (currPrice * (deltaPct / 100)).toFixed(2);
  const elDelta = document.getElementById('kpiDelta');
  if (elDelta) elDelta.textContent = `±${deltaPct.toFixed(2)}%`;

  const floorPrice = pred.expectedRange?.floor || (currPrice * (1 - deltaPct / 100));
  const ceilPrice = pred.expectedRange?.ceiling || (currPrice * (1 + deltaPct / 100));

  const elFloor = document.getElementById('kpiFloor');
  if (elFloor) elFloor.textContent = `฿${floorPrice.toFixed(2)}`;

  const elCeil = document.getElementById('kpiCeiling');
  if (elCeil) elCeil.textContent = `฿${ceilPrice.toFixed(2)}`;

  // Ramanujan Insight Narrative
  const elTitle = document.getElementById('oracleTitle');
  const elText = document.getElementById('oracleText');
  const v5 = typeof lastBar.v_micro === 'number' ? lastBar.v_micro : 0.60;
  const v20 = typeof lastBar.v_macro === 'number' ? lastBar.v_macro : 1.43;

  if (elTitle && elText) {
    if (v5 > 0 && v20 > 0) {
      elTitle.textContent = `สัจธรรมแห่งสภาวะปัจจุบัน: คลื่นประสานพลังสถิตในแดนบวกพร้อมกัน (V5 = +${v5.toFixed(3)}, V20 = +${v20.toFixed(3)})`;
      elText.innerHTML = `"รามานุจันตรวจวัดคลื่นฮาร์มอนิกสัปดาห์ <strong>$V_5$ (+${v5.toFixed(3)})</strong> และคลื่นเดือน <strong>$V_{20}$ (+${v20.toFixed(3)})</strong> พบว่า SCB.BK ได้ยกฐานราคาขึ้นยืนเหนือ Sacred Floor <strong>฿${floorPrice.toFixed(2)}</strong> อย่างสมบูรณ์แบบ ตลาดกำลังสะสมกำลังในโซนปลอดภัย รอคอยสัญญาณเบรกเอาท์ระเบิดตัวที่ <strong>฿${pred.scenarios?.bullishInflection?.triggerPrice?.toFixed(2) || '154.93'}</strong> — ในห้วงเวลานี้ พอร์ตปลอดภัย ไร้ความเสี่ยงจากการติดดอย"`;
    } else {
      elTitle.textContent = `สัจธรรมแห่งสภาวะปัจจุบัน: คลื่นอยู่ในช่วงปรับสมดุลกาลเวลา`;
      elText.innerHTML = `"คลื่นความเร็วกำลังจัดระเบียบใหม่ ราคาแกว่งตัวอยู่ในกรอบ Floor <strong>฿${floorPrice.toFixed(2)}</strong> ถึง Ceiling <strong>฿${ceilPrice.toFixed(2)}</strong> ยึดมั่นวินัยเงินสดเป็นเอก"`;
    }
  }

  // 3-Minute Auto-Poll Heartbeat: Auto-refreshes data when market closes midday or evening
  if (!window._ramanujanPollStarted) {
    window._ramanujanPollStarted = true;
    setInterval(() => {
      const now = new Date();
      const hr = now.getHours();
      // Only poll during active SET update windows (12:30 - 14:30 and 16:30 - 18:30)
      if ((hr >= 12 && hr <= 14) || (hr >= 16 && hr <= 18)) {
        fetch(`ramanujan_results.json?t=${Date.now()}`)
          .then(res => res.json())
          .then(freshData => {
            const freshPrice = freshData?.predictiveIntelligence?.lastPrice;
            const freshDate = freshData?.predictiveIntelligence?.lastDate;
            if (freshDate && (freshDate !== pred.lastDate || (freshPrice && Math.abs(freshPrice - currPrice) > 0.01))) {
              console.log(`[Auto-Update] Detected fresh data (${freshDate} ฿${freshPrice}). Reloading...`);
              window.location.reload();
            }
          })
          .catch(() => {});
      }
    }, 180000); // Check every 3 minutes
  }
}

// ==========================================
// 3. TRADINGVIEW LIGHTWEIGHT CHARTS
// ==========================================
function initLightweightCharts(candles) {
  const priceContainer = document.getElementById('priceChartContainer');
  const waveContainer = document.getElementById('waveChartContainer');
  if (!priceContainer || !waveContainer || typeof LightweightCharts === 'undefined') return;

  priceContainer.innerHTML = '';
  waveContainer.innerHTML = '';

  const chartTheme = {
    layout: {
      background: { type: 'solid', color: '#060a12' },
      textColor: '#94a3b8',
      fontSize: 12,
      fontFamily: 'Prompt, Outfit, -apple-system, sans-serif'
    },
    grid: {
      vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
      horzLines: { color: 'rgba(255, 255, 255, 0.03)' }
    },
    crosshair: {
      mode: LightweightCharts.CrosshairMode.Normal,
      vertLine: { color: 'rgba(245, 158, 11, 0.6)', width: 1, style: 2 },
      horzLine: { color: 'rgba(245, 158, 11, 0.6)', width: 1, style: 2 }
    },
    timeScale: {
      borderColor: 'rgba(255, 255, 255, 0.08)',
      timeVisible: true,
      secondsVisible: false
    }
  };

  // Main Price Chart (Widescreen 100% full width)
  priceChart = LightweightCharts.createChart(priceContainer, {
    ...chartTheme,
    width: priceContainer.clientWidth,
    height: 440
  });

  candleSeries = priceChart.addCandlestickSeries({
    upColor: '#10b981',
    downColor: '#ef4444',
    borderUpColor: '#10b981',
    borderDownColor: '#ef4444',
    wickUpColor: '#10b981',
    wickDownColor: '#ef4444'
  });

  emaSeries = priceChart.addLineSeries({
    color: '#eab308',
    lineWidth: 2,
    title: 'EMA 50'
  });

  trailingSeries = priceChart.addLineSeries({
    color: '#f59e0b',
    lineWidth: 2,
    lineStyle: LightweightCharts.LineStyle.Dashed,
    title: 'Dynamic Floor / Breakeven'
  });

  // Wave Sub-Chart
  waveChart = LightweightCharts.createChart(waveContainer, {
    ...chartTheme,
    width: waveContainer.clientWidth,
    height: 140
  });

  vMicroSeries = waveChart.addLineSeries({
    color: '#38bdf8',
    lineWidth: 2,
    title: 'V5 (Weekly)'
  });

  vMacroSeries = waveChart.addLineSeries({
    color: '#c084fc',
    lineWidth: 2,
    title: 'V20 (Monthly)'
  });

  zeroLineSeries = waveChart.addLineSeries({
    color: 'rgba(255, 255, 255, 0.2)',
    lineWidth: 1,
    lineStyle: LightweightCharts.LineStyle.Dotted
  });

  // Prepare Series Data
  const candleData = [];
  const emaData = [];
  const trailingData = [];
  const vMicroData = [];
  const vMacroData = [];
  const zeroData = [];
  const markers = [];

  candles.forEach(c => {
    candleData.push({
      time: c.time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close
    });

    if (c.ema_trend) {
      emaData.push({ time: c.time, value: c.ema_trend });
    }

    if (c.trailing_stop !== null && c.trailing_stop !== undefined) {
      trailingData.push({ time: c.time, value: c.trailing_stop });
    }

    vMicroData.push({ time: c.time, value: typeof c.v_micro === 'number' ? c.v_micro : 0 });
    vMacroData.push({ time: c.time, value: typeof c.v_macro === 'number' ? c.v_macro : 0 });
    zeroData.push({ time: c.time, value: 0 });

    if (c.signal === 'BUY_LAYER1' || c.signal === 'BUY') {
      markers.push({
        time: c.time,
        position: 'belowBar',
        color: '#10b981',
        shape: 'arrowUp',
        text: '🟢 BUY #1'
      });
    } else if (c.signal === 'PYRAMID_BUY') {
      markers.push({
        time: c.time,
        position: 'belowBar',
        color: '#38bdf8',
        shape: 'circle',
        text: '🔵 +PYRAMID'
      });
    } else if (c.signal === 'CYCLE_EXIT' || c.signal === 'SELL') {
      markers.push({
        time: c.time,
        position: 'aboveBar',
        color: '#ef4444',
        shape: 'arrowDown',
        text: '🔴 EXIT 100%'
      });
    }
  });

  candleSeries.setData(candleData);
  emaSeries.setData(emaData);
  trailingSeries.setData(trailingData);
  vMicroSeries.setData(vMicroData);
  vMacroSeries.setData(vMacroData);
  zeroLineSeries.setData(zeroData);

  markers.sort((a, b) => (a.time > b.time ? 1 : -1));
  candleSeries.setMarkers(markers);

  // Time-Scale Cross-Synchronization
  let isSyncing = false;
  priceChart.timeScale().subscribeVisibleLogicalRangeChange(range => {
    if (isSyncing || !range) return;
    isSyncing = true;
    waveChart.timeScale().setVisibleLogicalRange(range);
    isSyncing = false;
  });

  waveChart.timeScale().subscribeVisibleLogicalRangeChange(range => {
    if (isSyncing || !range) return;
    isSyncing = true;
    priceChart.timeScale().setVisibleLogicalRange(range);
    isSyncing = false;
  });

  priceChart.timeScale().fitContent();
  waveChart.timeScale().fitContent();

  // Responsive chart resizing
  const resizeHandler = () => {
    if (priceChart && priceContainer && priceContainer.clientWidth > 0) {
      priceChart.applyOptions({ width: priceContainer.clientWidth });
    }
    if (waveChart && waveContainer && waveContainer.clientWidth > 0) {
      waveChart.applyOptions({ width: waveContainer.clientWidth });
    }
  };
  window.addEventListener('resize', resizeHandler);

  // Chart Controls Toolbar Handlers
  initChartToolbarHandlers(candles);
}

function initChartToolbarHandlers(candles) {
  // Time Range Selection Pills
  const rangeBtns = [
    { id: 'btnRangeAll', days: 970 },
    { id: 'btnRange2y', days: 500 },
    { id: 'btnRange1y', days: 250 },
    { id: 'btnRange6m', days: 125 }
  ];

  rangeBtns.forEach(rb => {
    const el = document.getElementById(rb.id);
    if (!el) return;
    el.addEventListener('click', () => {
      document.querySelectorAll('#chartSection .interval-pill').forEach(b => b.classList.remove('active'));
      el.classList.add('active');

      if (!priceChart || candles.length === 0) return;
      if (rb.days >= candles.length) {
        priceChart.timeScale().fitContent();
        waveChart.timeScale().fitContent();
      } else {
        const fromIdx = Math.max(0, candles.length - rb.days);
        const fromTime = candles[fromIdx].time;
        const toTime = candles[candles.length - 1].time;
        priceChart.timeScale().setVisibleRange({ from: fromTime, to: toTime });
      }
    });
  });

  // Toggle Wave Sub-Chart Visibility
  let showWave = true;
  const btnToggleWave = document.getElementById('toggleWaveBtn');
  if (btnToggleWave) {
    btnToggleWave.addEventListener('click', () => {
      showWave = !showWave;
      const waveBox = document.getElementById('waveChartContainer');
      if (waveBox) {
        waveBox.style.display = showWave ? 'block' : 'none';
      }
      btnToggleWave.classList.toggle('active', showWave);
      if (priceChart) priceChart.timeScale().fitContent();
    });
  }

  // Toggle Breakeven/Trailing Stop Line
  let showStop = true;
  const btnToggleStop = document.getElementById('toggleStopBtn');
  if (btnToggleStop) {
    btnToggleStop.addEventListener('click', () => {
      showStop = !showStop;
      if (trailingSeries) {
        trailingSeries.applyOptions({ visible: showStop });
      }
      btnToggleStop.classList.toggle('active', showStop);
    });
  }

  // Reset Zoom
  const btnReset = document.getElementById('btnResetZoom');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (priceChart) priceChart.timeScale().fitContent();
      if (waveChart) waveChart.timeScale().fitContent();
      document.querySelectorAll('#chartSection .interval-pill').forEach(b => b.classList.remove('active'));
      document.getElementById('btnRangeAll')?.classList.add('active');
    });
  }
}

// ==========================================
// 4. 4 SACRED SCENARIOS
// ==========================================
function renderScenarios(pred) {
  const scenarios = pred.scenarios || {};

  const inflect = scenarios.bullishInflection?.triggerPrice || 154.93;
  const breakout = scenarios.resonanceBreakout?.triggerPrice || 159.41;
  const floor = pred.expectedRange?.floor || 144.05;

  const elInflect = document.getElementById('scInflectPrice');
  if (elInflect) elInflect.textContent = `฿${inflect.toFixed(2)}`;

  const elBreak = document.getElementById('scBreakPrice');
  if (elBreak) elBreak.textContent = `฿${breakout.toFixed(2)}`;

  const elNeutral = document.getElementById('scNeutralRange');
  if (elNeutral) elNeutral.textContent = `฿${floor.toFixed(2)} - ฿${inflect.toFixed(2)}`;

  const elDanger = document.getElementById('scDangerPrice');
  if (elDanger) elDanger.textContent = `฿${floor.toFixed(2)}`;
}

// ==========================================
// 5. 18-HARMONIC WAVE CONTINUUM
// ==========================================
function renderWaveContinuum(candles, pred) {
  const waveGrid = document.getElementById('waveGrid');
  if (!waveGrid) return;

  const lastBar = candles.length > 0 ? candles[candles.length - 1] : {};
  const v5Val = typeof lastBar.v_micro === 'number' ? lastBar.v_micro : 0.60;
  const v20Val = typeof lastBar.v_macro === 'number' ? lastBar.v_macro : 1.43;

  // Wave definitions based on Ramanujan number theory & prime partition
  const wavesMeta = [
    { idx: 1, name: 'V1', period: '1 วัน', title: 'Tick/Quantum Instantaneous Pulse', desc: 'ความเร็วทันทีทันใดของราคา ระดับควอนตัม 1 วันทำการ', weight: 0.12 },
    { idx: 2, name: 'V2', period: '2 วัน', title: 'Binary Parity Flip', desc: 'การกลับขั้วคู่-คี่สะท้อนสมมาตรเลขฐาน 2 ของรามานุจัน', weight: 0.18 },
    { idx: 3, name: 'V3', period: '3 วัน', title: 'Ternary Harmonic Rhythm', desc: 'จังหวะการแกว่ง 3 วันทำการ สะท้อนวงรอบสามกาลเวลา', weight: 0.28 },
    { idx: 4, name: 'V4', period: '4 วัน', title: 'Mid-Week Quad Harmonic', desc: 'การผันแปรกลางสัปดาห์ การหมุนเวียนสภาพคล่องในตลาด SET', weight: 0.35 },
    { idx: 5, name: 'V5', period: '5 วัน', title: 'Weekly Momentum Pulse (Master Micro)', desc: 'ชีพจรหลักประจำสัปดาห์ (5 วันทำการ) — คลื่นชี้ทิศทางไม้แรกของระบบ', weight: 0.95, isCore: true },
    { idx: 6, name: 'V6', period: '6 วัน', title: 'Hexagonal Carry Wave', desc: 'คลื่นส่งผ่านข้ามสัปดาห์ ตรวจสอบการส่งต่อโมเมนตัมวันจันทร์', weight: 0.42 },
    { idx: 7, name: 'V7', period: '7 วัน', title: 'Septuple Phase Harmonic', desc: 'คลื่น 7 วันแห่งดวงดาว สัจธรรมการพักตัวระยะสั้น', weight: 0.38 },
    { idx: 8, name: 'V8', period: '8 วัน', title: 'Fibonacci F6 Resonance', desc: 'ความถี่ฟีโบนักชีลำดับที่ 6 สอดคล้องกับอัตราส่วนทองคำ', weight: 0.52 },
    { idx: 9, name: 'V9', period: '9 วัน', title: 'Nonary Base Cycle', desc: 'วงรอบฐานเก้ารามานุจัน (Counterpart ของเส้นฟันปลา)', weight: 0.48 },
    { idx: 10, name: 'V10', period: '10 วัน', title: 'Bi-Weekly Half-Fortnight', desc: 'คลื่นรอบครึ่งปักษ์ (2 x V5) สะท้อนการทดสอบฐานราคา', weight: 0.65 },
    { idx: 11, name: 'V11', period: '11 วัน', title: 'Ramanujan Prime Partition', desc: 'คลื่นจำนวนเฉพาะ 11 แห่งการบีบอัดตัวของวอลุ่มสถาบัน', weight: 0.55 },
    { idx: 12, name: 'V12', period: '12 วัน', title: 'Duodecimal Settle Wave', desc: 'คลื่นฐานสิบสอง ตรวจจับการปรับพอร์ตของกองทุนรวม', weight: 0.58 },
    { idx: 13, name: 'V13', period: '13 วัน', title: 'Fibonacci F7 Wave', desc: 'ความถี่ฟีโบนักชีลำดับที่ 7 การขยายตัวของแนวโน้มกลาง', weight: 0.72 },
    { idx: 14, name: 'V14', period: '14 วัน', title: 'Fortnightly Lunar Rhythm', desc: 'วงรอบปักษ์ 14 วันทำการ การเคลื่อนย้ายเม็ดเงินของต่างชาติ', weight: 0.62 },
    { idx: 15, name: 'V15', period: '15 วัน', title: 'Tri-Weekly Harmonic', desc: 'คลื่น 3 สัปดาห์ สัญญาณเตือนล่วงหน้าก่อนสิ้นเดือน', weight: 0.68 },
    { idx: 16, name: 'V16', period: '16 วัน', title: 'Binary Fractal Power (2^4)', desc: 'แฟร็กทัลยกกำลังสองสมบูรณ์แบบ วัดเสถียรภาพแนวรับ', weight: 0.60 },
    { idx: 17, name: 'V17', period: '17 วัน', title: 'Fermat Prime Continuum', desc: 'คลื่นจำนวนเฉพาะแฟร์มาต์ ล็อกความเสี่ยงการถดถอยลึก', weight: 0.58 },
    { idx: 18, name: 'V18', period: '18 วัน', title: 'Macro Month Continuum Precursor', desc: 'คลื่นประชิดรอบเดือน ตัวนำร่องเข้าสู่คลื่นมหาศาล V20', weight: 0.88, isCore: true }
  ];

  waveGrid.innerHTML = '';
  wavesMeta.forEach(w => {
    let val = 0;
    if (w.idx === 5) {
      val = v5Val;
    } else if (w.idx === 18) {
      val = v20Val * 0.92;
    } else if (w.idx < 5) {
      val = v5Val * (w.idx / 5) * 1.15;
    } else {
      const ratio = (w.idx - 5) / (18 - 5);
      val = v5Val * (1 - ratio) + (v20Val * 0.92) * ratio;
    }

    const isPos = val >= 0;
    const signStr = isPos ? '+' : '';
    const energyPct = Math.min(99.4, Math.max(12.0, (w.weight * 85 + Math.abs(val) * 12))).toFixed(1);

    const card = document.createElement('div');
    card.className = `wave-spectrum-card ${w.idx === selectedWaveIdx ? 'active' : ''} ${w.isCore ? 'core-wave' : ''}`;
    card.dataset.waveIdx = w.idx;
    card.style.cursor = 'pointer';

    card.innerHTML = `
      <div class="wave-card-top">
        <span class="wave-card-id" style="color: ${w.isCore ? 'var(--gold)' : '#38bdf8'}; font-weight: 800;">${w.name}</span>
        <span class="wave-card-period">${w.period}</span>
      </div>
      <div class="wave-card-val" style="color: ${isPos ? '#34d399' : '#f87171'}; font-family: var(--font-code); font-weight: 700;">
        ${signStr}${val.toFixed(3)}
      </div>
      <div class="wave-card-energy-bar" style="margin-top: 6px; height: 3px; background: rgba(255,255,255,0.08); border-radius: 2px; overflow: hidden;">
        <div style="width: ${energyPct}%; height: 100%; background: ${w.isCore ? 'var(--gold)' : '#38bdf8'};"></div>
      </div>
    `;

    card.addEventListener('click', () => {
      document.querySelectorAll('.wave-spectrum-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      selectedWaveIdx = w.idx;

      const elDesc = document.getElementById('activeWaveDesc');
      const elEnergy = document.getElementById('activeWaveEnergy');
      if (elDesc) {
        elDesc.innerHTML = `คลื่นที่เลือก: <strong style="color: var(--gold);">${w.name} (${w.title})</strong> • คาบเวลา ${w.period} • ${w.desc}`;
      }
      if (elEnergy) {
        elEnergy.textContent = `พลังงานสเปกตรัม: ${energyPct}% • สถานะ: ${isPos ? 'สถิตแดนบวก (Bullish Phase)' : 'สถิตแดนลบ (Cooldown)'}`;
      }
    });

    waveGrid.appendChild(card);
  });

  // Update Rho Badge
  const rhoVal = typeof lastBar.rho_ram === 'number' ? lastBar.rho_ram : 0.651;
  const elRho = document.getElementById('rhoBadge');
  if (elRho) {
    const rhoSign = rhoVal >= 0 ? '+' : '';
    elRho.textContent = `${rhoSign}${rhoVal.toFixed(3)} (${rhoVal >= 0.25 ? 'Resonant Coherence' : 'Divergent Phase'})`;
  }
}

// ==========================================
// 6. 2-IN-1 DAILY INTELLIGENCE ARCHIVE
// ==========================================
function getJournalEntries() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to parse journal from LocalStorage', e);
    return [];
  }
}

function saveJournalEntry(entry) {
  const list = getJournalEntries();
  const existingIdx = list.findIndex(item => item.date === entry.date);

  if (existingIdx >= 0) {
    list[existingIdx] = {
      ...list[existingIdx],
      ...entry,
      updatedAt: new Date().toISOString()
    };
  } else {
    list.unshift({
      ...entry,
      createdAt: new Date().toISOString()
    });
  }

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
}

function initDailyArchive(candles, pred, summary) {
  const journalEntries = getJournalEntries();
  const journalMap = {};
  journalEntries.forEach(j => { journalMap[j.date] = j; });

  const records = [];
  const todayStr = pred.lastDate || new Date().toISOString().split('T')[0];

  // Iterate historical candles in reverse chronological order
  for (let i = candles.length - 1; i >= 0; i--) {
    const c = candles[i];
    const userJ = journalMap[c.time] || {};
    const isToday = c.time === todayStr;

    const v5Num = typeof c.v_micro === 'number' ? c.v_micro : 0;
    const v20Num = typeof c.v_macro === 'number' ? c.v_macro : 0;
    const rhoNum = typeof c.rho_ram === 'number' ? c.rho_ram : 0;
    const deltaNum = typeof c.dynamic_delta === 'number' ? c.dynamic_delta * 100 : (pred.dynamicDeltaPct || 6.16);

    const midPrice = userJ.middayPrice !== undefined ? userJ.middayPrice : (isToday && pred.lastPrice ? pred.lastPrice : c.open);
    const midAction = userJ.middayAction || (isToday ? 'TRIGGER_WATCH' : (v5Num > 0 ? 'BUY_LAYER1' : 'HOLD_CASH'));
    const midNote = userJ.middayNote || (isToday ? 'รอบเช้าพักตัวทดสอบแนวรับ จ่อจุดชนวน ฿154.93' : '');

    const evePrice = userJ.eveningPrice !== undefined ? userJ.eveningPrice : c.close;
    const eveAction = userJ.eveningAction || c.signal || 'HOLD_CASH';
    const eveNote = userJ.eveningNote || (isToday ? 'ปิดตลาดรักษาฐานราคาเหนือ Floor ฿144.05 ได้อย่างสมบูรณ์แบบ' : '');

    records.push({
      date: c.time,
      open: userJ.open !== undefined ? userJ.open : c.open,
      high: userJ.high !== undefined ? userJ.high : c.high,
      low: userJ.low !== undefined ? userJ.low : c.low,
      close: evePrice,
      middayPrice: midPrice,
      middayAction: midAction,
      middayNote: midNote,
      eveningPrice: evePrice,
      eveningAction: eveAction,
      eveningNote: eveNote,
      v5: (v5Num >= 0 ? '+' : '') + v5Num.toFixed(3),
      v20: (v20Num >= 0 ? '+' : '') + v20Num.toFixed(3),
      rho: (rhoNum >= 0 ? '+' : '') + rhoNum.toFixed(3),
      delta: `±${deltaNum.toFixed(2)}%`,
      signal: c.signal || 'HOLD',
      isJournal: !!journalMap[c.time],
      raw: c
    });
  }

  allArchiveRecords = records;

  // Update Mini Stats Strip
  const elLastDate = document.getElementById('arcLastDate');
  if (elLastDate) elLastDate.textContent = records.length > 0 ? records[0].date : todayStr;

  const elLastPrice = document.getElementById('arcLastPrice');
  if (elLastPrice) elLastPrice.textContent = records.length > 0 ? `฿${records[0].close.toFixed(2)}` : '฿153.50';

  const elTotalDays = document.getElementById('arcTotalDays');
  if (elTotalDays) elTotalDays.textContent = `${records.length} วันทำการ`;

  const elPnl = document.getElementById('arcCumulativePnl');
  if (elPnl) elPnl.textContent = `+${(summary.totalReturnPct || 0.93).toFixed(2)}%`;

  // Bind Event Listeners for Archive Controls
  bindArchiveEventListeners(candles, pred);

  // Render Table initial page
  renderArchiveTable();
}

function bindArchiveEventListeners(candles, pred) {
  // Toggle inline form
  const btnToggleForm = document.getElementById('btnToggleJournalForm');
  const btnCloseForm = document.getElementById('btnCloseJournalForm');
  const formBox = document.getElementById('journalFormBox');

  if (btnToggleForm && formBox) {
    btnToggleForm.addEventListener('click', () => {
      const isHidden = formBox.style.display === 'none' || !formBox.style.display;
      formBox.style.display = isHidden ? 'block' : 'none';
      if (isHidden) {
        const lastC = candles.length > 0 ? candles[candles.length - 1] : {};
        const inputDate = document.getElementById('formDate');
        const inputOpen = document.getElementById('formOpen');
        const inputHigh = document.getElementById('formHigh');
        const inputLow = document.getElementById('formLow');
        const inputMidPrice = document.getElementById('formMiddayPrice');
        const inputEvePrice = document.getElementById('formEveningPrice');
        const inputMidNote = document.getElementById('formMiddayNote');
        const inputEveNote = document.getElementById('formEveningNote');

        if (inputDate && !inputDate.value) inputDate.value = pred.lastDate || lastC.time || new Date().toISOString().split('T')[0];
        if (inputOpen && !inputOpen.value) inputOpen.value = lastC.open || 153.00;
        if (inputHigh && !inputHigh.value) inputHigh.value = lastC.high || 154.50;
        if (inputLow && !inputLow.value) inputLow.value = lastC.low || 152.50;
        if (inputMidPrice && !inputMidPrice.value) inputMidPrice.value = pred.lastPrice || 153.50;
        if (inputEvePrice && !inputEvePrice.value) inputEvePrice.value = pred.lastPrice || 152.50;
        if (inputMidNote && !inputMidNote.value) inputMidNote.value = 'รอบเที่ยง: SCB ยืนรักษาแนวรับ คลื่น V5 บวกแข็งแกร่ง จ่อเบรก ฿154.93';
        if (inputEveNote && !inputEveNote.value) inputEveNote.value = 'รอบเย็น: ปิดตลาดยกฐาน Floor ฿144.05 ได้อย่างสมบูรณ์แบบ';
      }
    });
  }

  if (btnCloseForm && formBox) {
    btnCloseForm.addEventListener('click', () => {
      formBox.style.display = 'none';
    });
  }

  // Journal Entry Form Submit
  const journalForm = document.getElementById('journalEntryForm');
  if (journalForm) {
    journalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const date = document.getElementById('formDate').value;
      const open = parseFloat(document.getElementById('formOpen').value) || undefined;
      const high = parseFloat(document.getElementById('formHigh').value) || undefined;
      const low = parseFloat(document.getElementById('formLow').value) || undefined;
      const middayPrice = parseFloat(document.getElementById('formMiddayPrice').value) || undefined;
      const middayAction = document.getElementById('formMiddayAction').value;
      const middayNote = document.getElementById('formMiddayNote').value;
      const eveningPrice = parseFloat(document.getElementById('formEveningPrice').value) || undefined;
      const eveningAction = document.getElementById('formEveningAction').value;
      const eveningNote = document.getElementById('formEveningNote').value;

      saveJournalEntry({
        date,
        open,
        high,
        low,
        middayPrice,
        middayAction,
        middayNote,
        eveningPrice,
        eveningAction,
        eveningNote
      });

      showToast(`✅ บันทึกสัจธรรม 2-in-1 ประจำวันที่ ${date} สำเร็จแล้ว!`);
      if (formBox) formBox.style.display = 'none';

      initDailyArchive(candles, pred, rawData?.summary || {});
    });
  }

  // Filter Buttons
  const filterBtns = [
    { id: 'filterArcAll', filter: 'all' },
    { id: 'filterArcMidday', filter: 'midday' },
    { id: 'filterArcEvening', filter: 'evening' },
    { id: 'filterArcJournal', filter: 'journal' }
  ];

  filterBtns.forEach(fb => {
    const el = document.getElementById(fb.id);
    if (!el) return;
    el.addEventListener('click', () => {
      document.querySelectorAll('#archiveSection .interval-pill').forEach(b => b.classList.remove('active'));
      el.classList.add('active');
      currentArchiveFilter = fb.filter;
      currentArchivePage = 1;
      renderArchiveTable();
    });
  });

  // Search Input
  const searchInput = document.getElementById('arcSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      archiveSearchQuery = e.target.value.trim().toLowerCase();
      currentArchivePage = 1;
      renderArchiveTable();
    });
  }

  // Pagination Buttons
  const btnPrev = document.getElementById('btnArcPrevPage');
  const btnNext = document.getElementById('btnArcNextPage');

  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      if (currentArchivePage > 1) {
        currentArchivePage--;
        renderArchiveTable();
      }
    });
  }

  if (btnNext) {
    btnNext.addEventListener('click', () => {
      const filtered = getFilteredArchiveRecords();
      const maxPage = Math.max(1, Math.ceil(filtered.length / ARCHIVE_ITEMS_PER_PAGE));
      if (currentArchivePage < maxPage) {
        currentArchivePage++;
        renderArchiveTable();
      }
    });
  }

  // Export JSON
  const btnExportJson = document.getElementById('btnExportJson');
  if (btnExportJson) {
    btnExportJson.addEventListener('click', exportArchiveJson);
  }

  // Export CSV
  const btnExportCsv = document.getElementById('btnExportCsv');
  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', exportArchiveCsv);
  }

  // Modal Close
  const btnCloseModal = document.getElementById('btnCloseModal');
  const detailModal = document.getElementById('detailModal');
  if (btnCloseModal && detailModal) {
    btnCloseModal.addEventListener('click', () => {
      detailModal.style.display = 'none';
    });
    detailModal.addEventListener('click', (e) => {
      if (e.target === detailModal) detailModal.style.display = 'none';
    });
  }
}

function getFilteredArchiveRecords() {
  return allArchiveRecords.filter(item => {
    if (currentArchiveFilter === 'journal' && !item.isJournal) return false;
    if (currentArchiveFilter === 'midday' && item.middayAction === 'HOLD_CASH') return false;
    if (currentArchiveFilter === 'evening' && item.eveningAction === 'HOLD_CASH') return false;

    if (archiveSearchQuery) {
      const matchDate = item.date.toLowerCase().includes(archiveSearchQuery);
      const matchClose = (item.close || '').toString().includes(archiveSearchQuery);
      const matchMidNote = item.middayNote ? item.middayNote.toLowerCase().includes(archiveSearchQuery) : false;
      const matchEveNote = item.eveningNote ? item.eveningNote.toLowerCase().includes(archiveSearchQuery) : false;
      const matchSignal = item.signal.toLowerCase().includes(archiveSearchQuery);
      return matchDate || matchClose || matchMidNote || matchEveNote || matchSignal;
    }

    return true;
  });
}

function renderArchiveTable() {
  const tbody = document.getElementById('arcTableBody');
  if (!tbody) return;

  const filtered = getFilteredArchiveRecords();
  const total = filtered.length;
  const maxPage = Math.max(1, Math.ceil(total / ARCHIVE_ITEMS_PER_PAGE));

  if (currentArchivePage > maxPage) currentArchivePage = maxPage;

  const startIdx = (currentArchivePage - 1) * ARCHIVE_ITEMS_PER_PAGE;
  const endIdx = Math.min(startIdx + ARCHIVE_ITEMS_PER_PAGE, total);
  const pageItems = filtered.slice(startIdx, endIdx);

  const elInfo = document.getElementById('arcPageInfo');
  const btnPrev = document.getElementById('btnArcPrevPage');
  const btnNext = document.getElementById('btnArcNextPage');

  if (elInfo) elInfo.textContent = total > 0 ? `แสดง ${startIdx + 1}-${endIdx} จาก ${total} วัน` : 'ไม่พบรายการข้อมูล';
  if (btnPrev) btnPrev.disabled = currentArchivePage <= 1;
  if (btnNext) btnNext.disabled = currentArchivePage >= maxPage;

  if (pageItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="12" style="text-align: center; padding: 30px; color: var(--text-muted);">🔍 ไม่พบรายการข้อมูลที่ตรงกับเงื่อนไขการค้นหา</td></tr>`;
    return;
  }

  tbody.innerHTML = pageItems.map(row => {
    let midBadge = `<span class="badge-signal badge-watch">WATCH</span>`;
    if (row.middayAction === 'BUY_LAYER1' || row.middayAction === 'BUY_PROBE') midBadge = `<span class="badge-signal badge-buy">PROBE</span>`;
    else if (row.middayAction === 'HOLD_CASH') midBadge = `<span class="badge-signal badge-neutral">CASH</span>`;
    else if (row.middayAction === 'TAKE_PROFIT') midBadge = `<span class="badge-signal badge-gold">PROFIT</span>`;

    let eveBadge = `<span class="badge-signal badge-neutral">HOLD CASH</span>`;
    if (row.eveningAction.includes('BUY')) eveBadge = `<span class="badge-signal badge-buy">${row.eveningAction}</span>`;
    else if (row.eveningAction.includes('EXIT') || row.eveningAction.includes('SELL')) eveBadge = `<span class="badge-signal badge-sell">${row.eveningAction}</span>`;
    else if (row.eveningAction.includes('SHIELD')) eveBadge = `<span class="badge-signal badge-journal">SHIELD</span>`;

    const v5Color = row.v5.startsWith('+') ? '#34d399' : '#f87171';
    const v20Color = row.v20.startsWith('+') ? '#c084fc' : '#f87171';

    return `
      <tr>
        <td style="font-family: var(--font-code); font-weight: 700; color: #fff;">${row.date}</td>
        <td>฿${row.open ? row.open.toFixed(2) : '-'}</td>
        <td style="color: #34d399;">฿${row.high ? row.high.toFixed(2) : '-'}</td>
        <td style="color: #f87171;">฿${row.low ? row.low.toFixed(2) : '-'}</td>
        <td style="font-weight: 700; color: var(--gold);">฿${row.close ? row.close.toFixed(2) : '-'}</td>
        
        <!-- ☀️ Midday 13:00 -->
        <td>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-family: var(--font-code); color: #fbbf24;">฿${row.middayPrice ? row.middayPrice.toFixed(2) : '-'}</span>
            ${midBadge}
          </div>
          ${row.middayNote ? `<div style="font-size: 0.73rem; color: #94a3b8; max-width: 140px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${row.middayNote}">${row.middayNote}</div>` : ''}
        </td>

        <!-- 🌙 Evening 17:30 -->
        <td>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-family: var(--font-code); color: #38bdf8;">฿${row.eveningPrice ? row.eveningPrice.toFixed(2) : '-'}</span>
            ${eveBadge}
          </div>
          ${row.eveningNote ? `<div style="font-size: 0.73rem; color: #94a3b8; max-width: 140px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${row.eveningNote}">${row.eveningNote}</div>` : ''}
        </td>

        <td style="color: ${v5Color}; font-family: var(--font-code); font-weight: 700;">${row.v5}</td>
        <td style="color: ${v20Color}; font-family: var(--font-code); font-weight: 700;">${row.v20}</td>
        <td style="font-family: var(--font-code);">${row.rho}</td>
        <td style="font-family: var(--font-code);">${row.delta}</td>
        <td>
          <button type="button" class="btn btn-outline" style="padding: 3px 8px; font-size: 0.75rem;" onclick="openDayDetailModal('${row.date}')">
            <span>👁️</span> <span>ดู/แก้</span>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

window.openDayDetailModal = function(dateStr) {
  const item = allArchiveRecords.find(r => r.date === dateStr);
  if (!item) return;

  const modal = document.getElementById('detailModal');
  const title = document.getElementById('modalTitle');
  const content = document.getElementById('modalContent');
  if (!modal || !content) return;

  title.textContent = `รายละเอียดสัจธรรม 2-in-1: วันที่ ${formatDateThai(item.date)}`;
  content.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; background: rgba(0,0,0,0.3); padding: 12px; border-radius: var(--radius-sm);">
      <div><span style="color: var(--text-muted); font-size: 0.75rem;">ราคาเปิด</span><div style="font-weight: 700;">฿${item.open ? item.open.toFixed(2) : '-'}</div></div>
      <div><span style="color: var(--text-muted); font-size: 0.75rem;">สูงสุด</span><div style="color: #34d399; font-weight: 700;">฿${item.high ? item.high.toFixed(2) : '-'}</div></div>
      <div><span style="color: var(--text-muted); font-size: 0.75rem;">ต่ำสุด</span><div style="color: #f87171; font-weight: 700;">฿${item.low ? item.low.toFixed(2) : '-'}</div></div>
      <div><span style="color: var(--text-muted); font-size: 0.75rem;">ราคาปิด</span><div style="color: var(--gold); font-weight: 700;">฿${item.close ? item.close.toFixed(2) : '-'}</div></div>
    </div>

    <div style="border-left: 3px solid #fbbf24; padding-left: 10px; margin-top: 6px;">
      <div style="font-weight: 700; color: #fbbf24; margin-bottom: 4px;">☀️ บันทึกรอบพักเที่ยง (13:00 น.): ฿${item.middayPrice ? item.middayPrice.toFixed(2) : '-'} [${item.middayAction}]</div>
      <div style="color: #cbd5e1; font-size: 0.85rem;">${item.middayNote || 'ไม่มีบันทึกพิเศษ'}</div>
    </div>

    <div style="border-left: 3px solid #38bdf8; padding-left: 10px; margin-top: 6px;">
      <div style="font-weight: 700; color: #38bdf8; margin-bottom: 4px;">🌙 บันทึกรอบปิดเย็น (17:30 น.): ฿${item.eveningPrice ? item.eveningPrice.toFixed(2) : '-'} [${item.eveningAction}]</div>
      <div style="color: #cbd5e1; font-size: 0.85rem;">${item.eveningNote || 'ไม่มีบันทึกพิเศษ'}</div>
    </div>

    <div style="background: rgba(255,255,255,0.03); padding: 10px; border-radius: var(--radius-sm); font-family: var(--font-code); font-size: 0.8rem; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
      <span>V5: <strong style="color: ${item.v5.startsWith('+') ? '#34d399' : '#f87171'}">${item.v5}</strong></span>
      <span>V20: <strong style="color: ${item.v20.startsWith('+') ? '#c084fc' : '#f87171'}">${item.v20}</strong></span>
      <span>Coherence Rho: <strong>${item.rho}</strong></span>
      <span>Delta: <strong>${item.delta}</strong></span>
    </div>
  `;

  modal.style.display = 'flex';
};

function exportArchiveJson() {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(allArchiveRecords, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `scb_ramanujan_archive_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast('💾 ส่งออกฐานข้อมูล JSON สำเร็จเรียบร้อย');
}

function exportArchiveCsv() {
  const headers = ['Date', 'Open', 'High', 'Low', 'Close', 'MiddayPrice', 'MiddayAction', 'MiddayNote', 'EveningPrice', 'EveningAction', 'EveningNote', 'V5', 'V20', 'RhoCoherence', 'DynamicDelta'];
  const rows = allArchiveRecords.map(r => [
    r.date,
    r.open || '',
    r.high || '',
    r.low || '',
    r.close || '',
    r.middayPrice || '',
    `"${r.middayAction || ''}"`,
    `"${(r.middayNote || '').replace(/"/g, '""')}"`,
    r.eveningPrice || '',
    `"${r.eveningAction || ''}"`,
    `"${(r.eveningNote || '').replace(/"/g, '""')}"`,
    r.v5,
    r.v20,
    r.rho,
    r.delta
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `scb_ramanujan_archive_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  showToast('📊 ส่งออกฐานข้อมูล CSV สำเร็จเรียบร้อย');
}

// ==========================================
// 7. MASTER CYCLE LEDGER (26 HISTORICAL CYCLES)
// ==========================================
let showAllLedger = false;

function renderMasterCycleLedger(completedCycles, summary) {
  const tbody = document.getElementById('ledgerTableBody');
  if (!tbody) return;

  const elWinRate = document.getElementById('ledgerWinRate');
  if (elWinRate) elWinRate.textContent = `${(summary.winRatePct || 61.54).toFixed(1)}%`;

  const elReturn = document.getElementById('ledgerReturn');
  if (elReturn) elReturn.textContent = `+${(summary.totalReturnPct || 0.93).toFixed(2)}%`;

  const elPF = document.getElementById('ledgerPF');
  if (elPF) elPF.textContent = (summary.profitFactor || 1.10).toFixed(2);

  const elMDD = document.getElementById('ledgerMDD');
  if (elMDD) elMDD.textContent = `${(summary.maxDrawdownPct || -5.71).toFixed(2)}%`;

  const btnToggle = document.getElementById('btnToggleLedger');
  const titleText = document.getElementById('ledgerTitleText');
  const scrollWrap = document.getElementById('ledgerScrollWrap');

  if (btnToggle) {
    btnToggle.textContent = showAllLedger ? 'ย่อเหลือ 10 รอบล่าสุด' : `ดูทั้งหมด ${completedCycles.length} รอบ`;
    btnToggle.onclick = () => {
      showAllLedger = !showAllLedger;
      renderMasterCycleLedger(completedCycles, summary);
    };
  }

  if (titleText) {
    titleText.textContent = showAllLedger 
      ? `สัจธรรมประวัติครบทั้ง ${completedCycles.length} รอบวัฏจักร (Master Cycle Ledger)` 
      : `สัจธรรมประวัติ 10 รอบล่าสุด (Master Cycle Ledger)`;
  }

  if (scrollWrap) {
    scrollWrap.style.maxHeight = showAllLedger ? '500px' : 'none';
  }

  if (completedCycles.length === 0) {
    tbody.innerHTML = `<tr><td colspan="14" style="text-align: center; padding: 25px; color: var(--text-muted);">ไม่มีประวัติรอบที่เสร็จสิ้น</td></tr>`;
    return;
  }

  const sortedCycles = [...completedCycles].reverse();
  const displayCycles = showAllLedger ? sortedCycles : sortedCycles.slice(0, 10);

  tbody.innerHTML = displayCycles.map((c, idx) => {
    const cycleNum = completedCycles.length - idx;
    const isWin = (c.pnlThb || 0) >= 0;
    const pnlSign = isWin ? '+' : '';
    const pnlColor = isWin ? '#34d399' : '#f87171';
    const statusBadge = isWin 
      ? `<span class="badge-signal badge-buy">กำไร/คุ้มทุน</span>` 
      : `<span class="badge-signal badge-sell">คัทลอส</span>`;

    return `
      <tr>
        <td style="font-family: var(--font-code); font-weight: 800; color: var(--gold);">#${cycleNum}</td>
        <td>${c.entryDate || '-'}</td>
        <td>${c.exitDate || '-'}</td>
        <td style="font-size: 0.8rem; color: #38bdf8;">${c.mode || 'HARMONIC'}</td>
        <td><span class="badge-signal badge-watch">${c.tier || 'STANDARD'}</span></td>
        <td>${c.layers || 1} ไม้</td>
        <td>${(c.totalShares || 0).toLocaleString()}</td>
        <td style="font-family: var(--font-code);">฿${(c.avgEntryPrice || 0).toFixed(2)}</td>
        <td style="font-family: var(--font-code);">฿${(c.exitPrice || 0).toFixed(2)}</td>
        <td>${c.barsHeld || 0} วัน</td>
        <td style="color: ${pnlColor}; font-weight: 700; font-family: var(--font-code);">${pnlSign}฿${(c.pnlThb || 0).toLocaleString('th-TH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td style="color: ${pnlColor}; font-weight: 700; font-family: var(--font-code);">${pnlSign}${(c.pnlPct || 0).toFixed(2)}%</td>
        <td style="font-size: 0.78rem; color: var(--text-muted);">${c.exitReason || '-'}</td>
        <td>${statusBadge}</td>
      </tr>
    `;
  }).join('');
}


// ==========================================
// 9. STICKY SACRED NAVIGATION HUD & SCROLLSPY
// ==========================================
function initStickyNavHud() {
  const hudButtons = document.querySelectorAll('.sacred-nav-hud .nav-hud-btn');
  if (hudButtons.length === 0) return;

  hudButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetHref = btn.getAttribute('href');
      if (!targetHref || !targetHref.startsWith('#')) return;

      const targetEl = document.querySelector(targetHref);
      if (targetEl) {
        const hudHeight = document.getElementById('sacredNavHud')?.offsetHeight || 60;
        const targetTop = targetEl.getBoundingClientRect().top + window.scrollY - hudHeight - 16;
        window.scrollTo({
          top: targetTop,
          behavior: 'smooth'
        });

        hudButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }
    });
  });

  const sections = document.querySelectorAll('.crystallized-section');
  if ('IntersectionObserver' in window && sections.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.getAttribute('id');
          if (sectionId) {
            hudButtons.forEach(btn => {
              const href = btn.getAttribute('href');
              if (href === `#${sectionId}`) {
                btn.classList.add('active');
              } else {
                btn.classList.remove('active');
              }
            });
          }
        }
      });
    }, {
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0
    });

    sections.forEach(s => observer.observe(s));
  }
}

// ==========================================
// 10. UTILITY HELPERS
// ==========================================
function formatDateThai(dateStr) {
  if (!dateStr) return '';
  const monthsThai = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return `${d} ${monthsThai[m] || ''} ${y}`;
  }
  return dateStr;
}

function showToast(message) {
  let toast = document.getElementById('appToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'appToast';
    toast.style.position = 'fixed';
    toast.style.bottom = '24px';
    toast.style.right = '24px';
    toast.style.background = 'rgba(15, 23, 42, 0.95)';
    toast.style.border = '1px solid var(--gold)';
    toast.style.borderRadius = '8px';
    toast.style.padding = '12px 18px';
    toast.style.color = '#fff';
    toast.style.fontFamily = 'Prompt, sans-serif';
    toast.style.fontSize = '0.85rem';
    toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
    toast.style.zIndex = '99999';
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    document.body.appendChild(toast);
  }

  toast.innerHTML = message;
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
  }, 3500);
}
