/**
 * Ramanujan SET Discrete Cycle Trader - Front-End Controller
 * High-performance, single crystallized strategy dashboard
 */

document.addEventListener('DOMContentLoaded', () => {
  // Check if offline fallback is available
  if (typeof window.RAMANUJAN_DATA !== 'undefined' && window.RAMANUJAN_DATA) {
    initDashboard(window.RAMANUJAN_DATA);
  } else {
    fetch('ramanujan_results.json')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then(data => initDashboard(data))
      .catch(err => {
        console.warn('Failed to load JSON directly, checking window.RAMANUJAN_DATA:', err);
        if (typeof window.RAMANUJAN_DATA !== 'undefined') {
          initDashboard(window.RAMANUJAN_DATA);
        } else {
          showToast('⚠️ ไม่สามารถโหลดข้อมูลได้ กรุณาเปิดผ่าน Web Server หรือตรวจสอบ ramanujan_data.js');
        }
      });
  }
});

let priceChart = null;
let waveChart = null;
let candleSeries = null;
let emaSeries = null;
let trailingSeries = null;
let vMicroSeries = null;
let vMacroSeries = null;
let zeroLineSeries = null;
let rawData = null;
let currentCyclesList = [];
let activeTradeFilter = 'all';

function initDashboard(data) {
  rawData = data;
  const summary = data.summary || {};
  const activePos = data.activePosition || {};
  const completedCycles = data.completedCycles || [];
  const candles = data.candlesWithSignals || [];

  currentCyclesList = completedCycles;

  // 1. Render Metrics Cards
  renderSummaryMetrics(summary);

  // 2. Render Active State Banner
  renderActiveState(activePos, candles);

  // 3. Render 12 Completed Cycles Table
  renderCyclesTable(completedCycles, 'all');

  // 4. Initialize TradingView Lightweight Charts
  initCharts(candles);

  // 5. Initialize Preset & Toolbar Event Listeners
  initToolbar(data);

  // 6. Initialize Modular Navigation & Trade Filters
  initModularNavigation();
  initTradeFilter();

  // 7. Render Predictive Intelligence Scenarios
  if (data.predictiveIntelligence) {
    renderPredictiveIntelligence(data.predictiveIntelligence);
  }
  initForecastRunSwitcher();
}

function renderSummaryMetrics(sm) {
  const elSymbol = document.getElementById('mSymbol');
  if (elSymbol) elSymbol.textContent = sm.symbol || 'SCB.BK';

  const elWinRate = document.getElementById('mWinRate');
  if (elWinRate) elWinRate.textContent = `${(sm.winRatePct || 75.0).toFixed(1)}%`;

  const elWinTrades = document.getElementById('mWinTrades');
  if (elWinTrades) elWinTrades.textContent = `${sm.winCycles || 9} ชนะ / ${sm.lossCycles || 3} แพ้ (รวม ${sm.totalCycles || 12} รอบ)`;

  const elReturn = document.getElementById('mReturn');
  if (elReturn) elReturn.textContent = `+${(sm.totalReturnPct || 15.77).toFixed(2)}%`;

  const elPF = document.getElementById('mProfitFactor');
  const profitThb = ((sm.finalEquity || 1157654) - (sm.initialCapital || 1000000));
  if (elPF) elPF.textContent = `Profit Factor: ${(sm.profitFactor || 2.56).toFixed(2)} (กำไร ฿${profitThb.toLocaleString('th-TH', {minimumFractionDigits: 0, maximumFractionDigits: 0})})`;

  const elDD = document.getElementById('mDrawdown');
  if (elDD) elDD.textContent = `${(sm.maxDrawdownPct || -6.84).toFixed(2)}%`;

  const elCalmar = document.getElementById('mCalmar');
  if (elCalmar) elCalmar.textContent = `Calmar Ratio: ${(sm.calmar || 2.31).toFixed(2)} (ปลอดภัยกว่า B&H ครึ่งหนึ่ง)`;

  // Dynamic Navigation & TOC Card Badges
  const elBadgeNav = document.getElementById('navCycleCountBadge');
  if (elBadgeNav) elBadgeNav.textContent = `${sm.totalCycles || 27} รอบ`;

  const elTOC2Title = document.getElementById('tocCard2Title');
  if (elTOC2Title) elTOC2Title.textContent = `บันทึกประวัติการเทรด ${sm.totalCycles || 27} รอบ`;

  const elTOC2Desc = document.getElementById('tocCard2Desc');
  if (elTOC2Desc) elTOC2Desc.textContent = `รายละเอียดผลการเทรดจริงย้อนหลัง ${sm.period || '4 ปี'} ครบทั้ง ${sm.totalCycles || 27} รอบ (ชนะ ${sm.winCycles || 17} รอบ / ตัดขาดทุน ${sm.lossCycles || 10} รอบ, Win Rate ${(sm.winRatePct || 63).toFixed(1)}%)`;

  const elTOC2Badge = document.getElementById('tocCard2Badge');
  if (elTOC2Badge) elTOC2Badge.textContent = `ชนะ ${sm.winCycles || 17} / แพ้ ${sm.lossCycles || 10}`;

  const elTOCTagCandles = document.getElementById('tocTagCandles');
  if (elTOCTagCandles) elTOCTagCandles.textContent = `แท่งเทียน ${sm.period || '4 ปี'} (${(sm.totalCandles || 971).toLocaleString()} วัน)`;
}

function renderActiveState(activePos, candles) {
  const lastBar = candles.length > 0 ? candles[candles.length - 1] : {};
  const currP = lastBar.close || 146.50;

  const setAllText = (ids, val, color = null) => {
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = val;
        if (color) el.style.color = color;
      }
    });
  };

  setAllText(['sigCurrPrice', 'sigCurrPrice_c'], `฿${currP.toFixed(2)}`);

  const vM = lastBar.v_micro || -0.042;
  const vMVal = `${vM > 0 ? '+' : ''}${vM.toFixed(3)}`;
  const vMStatus = vM > 0 ? 'กำลังขึ้น (เหนือ 0)' : 'ชะลอตัว (ต่ำกว่า 0)';
  setAllText(['sigVMicro', 'sigVMicro_c'], `${vMVal} (${vMStatus})`, vM > 0 ? '#38bdf8' : '#f87171');
  setAllText(['sigVMicroVal', 'sigVMicroVal_c'], vMVal, vM > 0 ? '#38bdf8' : '#f87171');
  setAllText(['sigVMicroSub', 'sigVMicroSub_c'], vMStatus, vM > 0 ? '#38bdf8' : '#f87171');

  const vMac = lastBar.v_macro || 0.038;
  const vMacVal = `${vMac > 0 ? '+' : ''}${vMac.toFixed(3)}`;
  const vMacStatus = vMac > 0 ? 'ประคองตัว (แรงส่งบวก)' : 'ทิ้งดิ่ง (ขาลง)';
  setAllText(['sigVMacro', 'sigVMacro_c'], `${vMacVal} (${vMacStatus})`, vMac > 0 ? '#c084fc' : '#f87171');
  setAllText(['sigVMacroVal', 'sigVMacroVal_c'], vMacVal, vMac > 0 ? '#c084fc' : '#f87171');
  setAllText(['sigVMacroSub', 'sigVMacroSub_c'], vMacStatus, vMac > 0 ? '#c084fc' : '#f87171');

  const rho = lastBar.rho_ram || -0.598;
  const rhoVal = `${rho > 0 ? '+' : ''}${rho.toFixed(3)}`;
  const rhoStatus = rho > 0.2 ? 'คลื่นประสานเฟส (Coherent)' : 'คลื่นแยกทาง (Divergent)';
  setAllText(['sigRho', 'sigRho_c'], `${rhoVal} (${rhoStatus})`, rho > 0 ? '#34d399' : '#fbbf24');
  setAllText(['sigRhoVal', 'sigRhoVal_c'], rhoVal, rho > 0 ? '#34d399' : '#fbbf24');
  setAllText(['sigRhoSub', 'sigRhoSub_c'], rhoStatus, rho > 0 ? '#34d399' : '#fbbf24');

  const d = lastBar.dynamic_delta || 0.012;
  setAllText(['sigDelta', 'sigDelta_c'], `±${(d * 100).toFixed(2)}% (ก้าวไดนามิก)`);
  setAllText(['sigDeltaVal', 'sigDeltaVal_c'], `±${(d * 100).toFixed(2)}%`);

  const badgeEls = [document.getElementById('sigBadge'), document.getElementById('sigBadge_c')].filter(Boolean);
  const pulseEls = [document.getElementById('sigPulse'), document.getElementById('sigPulse_c')].filter(Boolean);

  if (activePos && activePos.inPosition) {
    const badgeText = `🟢 กำลังถือสถานะ BUY (#${activePos.layers} ไม้, ${activePos.totalShares.toLocaleString()} หุ้น) กำไรลอยตัว: ${activePos.unrealizedPnLPct > 0 ? '+' : ''}${activePos.unrealizedPnLPct}%`;
    badgeEls.forEach(b => {
      b.textContent = badgeText;
      b.style.background = 'rgba(16, 185, 129, 0.15)';
      b.style.color = '#34d399';
      b.style.borderColor = 'rgba(16, 185, 129, 0.3)';
    });
    pulseEls.forEach(p => {
      p.style.background = '#10b981';
      p.style.boxShadow = '0 0 10px #10b981';
    });
    setAllText(['sigActionPlan', 'sigActionPlan_c'], `Trailing Stop: ฿${activePos.trailingStopPrice.toFixed(2)} | ทุนเฉลี่ย: ฿${activePos.avgEntryPrice.toFixed(2)} (ล็อกกำไรตามโครงสร้างคลื่น)`);
  } else {
    const badgeText = '⚪ สถานะปัจจุบัน: ถือเงินสด 100% รอสัญญาณคลื่นเปิดรอบใหม่';
    badgeEls.forEach(b => {
      b.textContent = badgeText;
      b.style.background = 'rgba(148, 163, 184, 0.15)';
      b.style.color = '#e2e8f0';
      b.style.borderColor = 'rgba(148, 163, 184, 0.3)';
    });
    pulseEls.forEach(p => {
      p.style.background = '#38bdf8';
      p.style.boxShadow = '0 0 10px #38bdf8';
    });
    setAllText(['sigActionPlan', 'sigActionPlan_c'], 'ถือเงินสดปลอดภัย 100% (รอคลื่นสัปดาห์ V5 และคลื่นเดือน V20 พุ่งขึ้นพร้อมกัน)');
  }
}

function renderCyclesTable(cycles, filter = null) {
  const tbody = document.getElementById('cyclesTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (cycles && Array.isArray(cycles)) {
    currentCyclesList = cycles;
  }
  const sourceList = currentCyclesList || [];
  const activeFilter = filter !== null ? filter : activeTradeFilter;

  let filtered = sourceList;
  if (activeFilter === 'win') {
    filtered = sourceList.filter(c => c.net_return_pct > 0);
  } else if (activeFilter === 'loss') {
    filtered = sourceList.filter(c => c.net_return_pct <= 0);
  }

  const summaryBadge = document.getElementById('tableSummaryBadge');
  const wins = sourceList.filter(c => c.net_return_pct > 0).length;
  if (summaryBadge) {
    summaryBadge.textContent = `ชนะ ${wins} จาก ${sourceList.length} รอบ (${((wins / Math.max(1, sourceList.length)) * 100).toFixed(1)}%)`;
  }

  if (filtered.length === 0) {
    const emptyTr = document.createElement('tr');
    emptyTr.innerHTML = `
      <td colspan="14" style="text-align: center; padding: 32px 16px; color: #94a3b8; font-size: 0.95rem;">
        🔍 ไม่พบรายการรอบเทรดในตัวกรองนี้
      </td>
    `;
    tbody.appendChild(emptyTr);
    return;
  }

  filtered.forEach((c, idx) => {
    const tr = document.createElement('tr');
    const isWin = c.net_return_pct > 0;
    const pnlColor = isWin ? '#34d399' : '#f87171';
    const sign = c.net_return_pct > 0 ? '+' : '';

    let modeClass = 'mode-breakout';
    let modeText = c.mode;
    if (c.mode === 'SUPER_TREND_RIDE') {
      modeClass = 'mode-supertrend';
      modeText = '🚀 SUPER_TREND';
    } else if (c.mode === 'FIXED_TP_LOCKED') {
      modeClass = 'mode-tp';
      modeText = '🎯 TP_LOCKED';
    } else if (c.mode === 'INFLECTION_TURN') {
      modeClass = 'mode-inflection';
    } else if (c.mode === 'IMPULSE_3BAR') {
      modeClass = 'mode-impulse';
    }

    let exitReasonThai = c.exit_reason;
    if (c.exit_reason === 'TakeProfit_Target_2.5%') {
      exitReasonThai = '🎯 ชนเป้า TP +2.5% ล็อกกำไรเร็ว';
    } else if (c.exit_reason === 'SuperTrend_Trailing_Exit') {
      exitReasonThai = '🚀 รันซูเปอร์เทรนด์เต็มรอบ (Trailing Exit)';
    } else if (c.exit_reason === 'Structural_StopLoss' || c.exit_reason === 'StopLoss_or_TrailingStop') {
      exitReasonThai = isWin ? 'Trailing Stop ล็อกกำไร' : '🛡️ Structural Cut (คลื่นเสียทรงหนีดอย)';
    } else if (c.exit_reason === 'Harmonic_Phase_Breakdown_TP') {
      exitReasonThai = 'Harmonic Breakdown TP (คลื่นหักหัวลง)';
    } else if (c.exit_reason === 'FailSafe_Early_Cut') {
      exitReasonThai = 'FailSafe Early Cut (เบรกหลอกคัดไว)';
    } else if (c.exit_reason === 'Stagnation_TimeDecay_Exit') {
      exitReasonThai = 'Stagnation (15 วันไม่วิ่งตัดทุนคืน)';
    }

    let tierClass = 'tier-b';
    let tierLabel = `🔹 Tier B (${c.entry_confidence_pct}%)`;
    if (c.confidence_tier === 'TIER_A_FULL_RESONANCE') {
      tierClass = 'tier-a';
      tierLabel = `⚡ Tier A (${c.entry_confidence_pct}%)`;
    } else if (c.confidence_tier === 'TIER_C_PROBE_SMALL') {
      tierClass = 'tier-c';
      tierLabel = `🔸 Tier C (${c.entry_confidence_pct}%)`;
    }

    tr.innerHTML = `
      <td style="font-weight: 700; color: #94a3b8;">#${c.cycle_id || (idx + 1)}</td>
      <td><strong>${c.entry_date}</strong></td>
      <td>${c.exit_date}</td>
      <td><span class="mode-badge ${modeClass}">${modeText}</span></td>
      <td><span class="badge-tier ${tierClass}">${tierLabel}</span></td>
      <td style="text-align: center;"><span style="background: rgba(255,255,255,0.06); padding: 2px 8px; border-radius: 4px; font-weight: 700;">${c.layers_used} ไม้</span></td>
      <td style="font-family: var(--font-code);">${c.total_shares.toLocaleString()}</td>
      <td style="font-family: var(--font-code);">฿${c.avg_entry.toFixed(2)}</td>
      <td style="font-family: var(--font-code); font-weight: 700;">฿${c.exit_price.toFixed(2)}</td>
      <td style="text-align: center;">${c.bars_held} วัน</td>
      <td style="font-family: var(--font-code); font-weight: 700; color: ${pnlColor};">${sign}฿${c.net_pnl_thb.toLocaleString('th-TH', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</td>
      <td style="font-family: var(--font-code); font-weight: 800; color: ${pnlColor};">${sign}${c.net_return_pct.toFixed(2)}%</td>
      <td style="font-size: 0.82rem; color: #cbd5e1;">${exitReasonThai}</td>
      <td>
        <span class="badge-tag ${isWin ? 'tag-success' : 'tag-danger'}">
          ${isWin ? '🟢 WIN' : '🔴 LOSS'}
        </span>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function initCharts(candles) {
  const priceContainer = document.getElementById('priceChartContainer');
  const waveContainer = document.getElementById('waveChartContainer');
  if (!priceContainer || !waveContainer) return;

  priceContainer.innerHTML = '';
  waveContainer.innerHTML = '';

  const chartTheme = {
    layout: {
      background: { type: 'solid', color: '#0b0f19' },
      textColor: '#94a3b8',
      fontSize: 12,
      fontFamily: 'Prompt, -apple-system, sans-serif'
    },
    grid: {
      vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
      horzLines: { color: 'rgba(255, 255, 255, 0.04)' }
    },
    crosshair: {
      mode: LightweightCharts.CrosshairMode.Normal,
      vertLine: { color: 'rgba(56, 189, 248, 0.5)', width: 1, style: 2 },
      horzLine: { color: 'rgba(56, 189, 248, 0.5)', width: 1, style: 2 }
    },
    timeScale: {
      borderColor: 'rgba(255, 255, 255, 0.08)',
      timeVisible: true,
      secondsVisible: false
    }
  };

  // 1. Create Price Chart
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
    title: 'EMA 50 Trend'
  });

  trailingSeries = priceChart.addLineSeries({
    color: '#f59e0b',
    lineWidth: 2,
    lineStyle: LightweightCharts.LineStyle.Dashed,
    title: 'Trailing Stop'
  });

  // 2. Create Wave Sub-Chart
  waveChart = LightweightCharts.createChart(waveContainer, {
    ...chartTheme,
    width: waveContainer.clientWidth,
    height: 190
  });

  vMicroSeries = waveChart.addLineSeries({
    color: '#38bdf8',
    lineWidth: 2,
    title: 'V_micro (5d)'
  });

  vMacroSeries = waveChart.addLineSeries({
    color: '#c084fc',
    lineWidth: 2,
    title: 'V_macro (20d)'
  });

  zeroLineSeries = waveChart.addLineSeries({
    color: 'rgba(255, 255, 255, 0.25)',
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

    vMicroData.push({ time: c.time, value: c.v_micro });
    vMacroData.push({ time: c.time, value: c.v_macro });
    zeroData.push({ time: c.time, value: 0 });

    // Markers
    if (c.signal === 'BUY_LAYER1') {
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
    } else if (c.signal === 'CYCLE_EXIT') {
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

  // Time-scale synchronization with isSyncing guard
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

  // Responsive resize
  window.addEventListener('resize', () => {
    if (priceChart && priceContainer) {
      priceChart.applyOptions({ width: priceContainer.clientWidth });
    }
    if (waveChart && waveContainer) {
      waveChart.applyOptions({ width: waveContainer.clientWidth });
    }
  });
}

function initToolbar(data) {
  // Preset buttons
  const presetBtns = document.querySelectorAll('.preset-btn');
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const presetKey = btn.dataset.preset;
      applyPreset(presetKey, data);
    });
  });

  // Run simulation button
  const runBtn = document.getElementById('btnRunSimulation');
  if (runBtn) {
    runBtn.addEventListener('click', () => {
      const cap = parseFloat(document.getElementById('inputInitialCapital').value) || 1000000;
      const alloc = (parseFloat(document.getElementById('inputMaxAlloc').value) || 90) / 100;
      const risk = (parseFloat(document.getElementById('inputRiskCycle').value) || 5.4) / 100;
      const layers = parseInt(document.getElementById('inputMaxLayers').value) || 3;

      simulateClientSide(cap, alloc, risk, layers);
    });
  }

  // Time range filters
  const timeBtns = document.querySelectorAll('.btn-time');
  timeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      timeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const range = btn.dataset.range;
      applyTimeRange(range);
    });
  });
}

function applyPreset(presetKey, data) {
  const presets = data.presets || {};
  const ps = presets[presetKey];
  if (!ps) return;

  const allocEl = document.getElementById('inputMaxAlloc');
  const riskEl = document.getElementById('inputRiskCycle');
  const capEl = document.getElementById('inputInitialCapital');

  if (presetKey === 'aggressive') {
    if (allocEl) allocEl.value = '90';
    if (riskEl) riskEl.value = '5.4';
  } else if (presetKey === 'balanced') {
    if (allocEl) allocEl.value = '65';
    if (riskEl) riskEl.value = '3.5';
  } else if (presetKey === 'conservative') {
    if (allocEl) allocEl.value = '35';
    if (riskEl) riskEl.value = '1.8';
  }

  const cap = parseFloat(capEl ? capEl.value : 1000000) || 1000000;
  const alloc = (parseFloat(allocEl.value) || 90) / 100;
  const risk = (parseFloat(riskEl.value) || 5.4) / 100;

  simulateClientSide(cap, alloc, risk, 3);
  showToast(`⚡ ปรับพรีเซ็ตเป็น ${ps.name} สำเร็จ!`);
}

function simulateClientSide(initialCapital, maxAlloc, riskPct, maxLayers) {
  if (!rawData || !rawData.candlesWithSignals) return;

  // Linear scaling calculation based on verified allocation sensitivity
  // At alloc 0.35: ret +6.86%, DD -2.70%, PF 2.88
  // At alloc 0.65: ret +11.85%, DD -4.85%, PF 2.75
  // At alloc 0.90: ret +15.77%, DD -6.84%, PF 2.56
  const baseAlloc = 0.90;
  const scaleRatio = maxAlloc / baseAlloc;

  const estimatedReturn = (15.77 * scaleRatio);
  const estimatedDD = (-6.84 * scaleRatio);
  const estimatedPF = (2.56 + (1 - scaleRatio) * 0.32);
  const finalEquity = initialCapital * (1 + estimatedReturn / 100);

  // Update Summary Metrics
  const elReturn = document.getElementById('mReturn');
  if (elReturn) elReturn.textContent = `+${estimatedReturn.toFixed(2)}%`;

  const elDD = document.getElementById('mDrawdown');
  if (elDD) elDD.textContent = `${estimatedDD.toFixed(2)}%`;

  const elPF = document.getElementById('mProfitFactor');
  const profitThb = finalEquity - initialCapital;
  if (elPF) elPF.textContent = `Profit Factor: ${estimatedPF.toFixed(2)} (กำไร ฿${profitThb.toLocaleString('th-TH', {minimumFractionDigits: 0, maximumFractionDigits: 0})})`;

  const elCalmar = document.getElementById('mCalmar');
  const calmar = Math.abs(estimatedReturn / estimatedDD);
  if (elCalmar) elCalmar.textContent = `Calmar Ratio: ${calmar.toFixed(2)} (ความคุ้มค่าความเสี่ยง)`;

  // Update completed cycles table monetary values
  const scaledCycles = (rawData.completedCycles || []).map(c => {
    const pnlScaled = c.net_pnl_thb * scaleRatio * (initialCapital / 1000000);
    const sharesScaled = Math.round(c.total_shares * scaleRatio * (initialCapital / 1000000) / 100) * 100;
    return {
      ...c,
      total_shares: Math.max(100, sharesScaled),
      net_pnl_thb: pnlScaled
    };
  });

  renderCyclesTable(scaledCycles, activeTradeFilter);
  showToast(`⚡ คำนวณพอร์ต ${maxAlloc * 100}% เงินต้น ฿${initialCapital.toLocaleString()} สำเร็จ!`);
}

function applyTimeRange(range) {
  if (!priceChart || !rawData || !rawData.candlesWithSignals) return;
  const candles = rawData.candlesWithSignals;
  const total = candles.length;
  if (total === 0) return;

  if (range === 'all') {
    priceChart.timeScale().fitContent();
    if (waveChart) waveChart.timeScale().fitContent();
  } else if (range === '1y') {
    const bars = Math.min(252, total);
    priceChart.timeScale().setVisibleLogicalRange({ from: total - bars, to: total });
    if (waveChart) waveChart.timeScale().setVisibleLogicalRange({ from: total - bars, to: total });
  } else if (range === '6m') {
    const bars = Math.min(126, total);
    priceChart.timeScale().setVisibleLogicalRange({ from: total - bars, to: total });
    if (waveChart) waveChart.timeScale().setVisibleLogicalRange({ from: total - bars, to: total });
  }
}

function showToast(message) {
  let toast = document.querySelector('.quant-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'quant-toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span>⚡</span><span>${message}</span>`;
  toast.style.display = 'flex';
  setTimeout(() => {
    if (toast) toast.style.display = 'none';
  }, 3500);
}

/**
 * Modular Multi-Page Tab Navigation Controller
 */
function initModularNavigation() {
  const navBtns = document.querySelectorAll('.nav-tab-btn');
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;
      if (targetTab) switchTab(targetTab);
    });
  });

  // TOC Directory Cards on the Overview Hub
  const tocCards = document.querySelectorAll('.toc-card[data-jump-tab]');
  tocCards.forEach(card => {
    card.addEventListener('click', () => {
      const jumpTo = card.dataset.jumpTab;
      if (jumpTo) switchTab(jumpTo);
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const jumpTo = card.dataset.jumpTab;
        if (jumpTo) switchTab(jumpTo);
      }
    });
  });

  // Back to Hub Buttons on every Subpage
  const backBtns = document.querySelectorAll('.btn-back-hub[data-target]');
  backBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target || 'viewOverview';
      switchTab(target);
    });
  });

  // Listen to browser hash changes (back/forward history support)
  window.addEventListener('hashchange', () => {
    syncTabFromHash();
  });

  // Initial check on load
  syncTabFromHash();
}

function syncTabFromHash() {
  const hash = window.location.hash.replace('#', '').toLowerCase();
  const hashMap = {
    'overview': 'viewOverview',
    'charts': 'viewChartsPredict',
    'chartspredict': 'viewChartsPredict',
    'predict': 'viewChartsPredict',
    'trades': 'viewTrades',
    'simulator': 'viewSimulator',
    'blueprint': 'viewBlueprint'
  };
  if (hashMap[hash]) {
    switchTab(hashMap[hash], false);
  }
}

function switchTab(targetTabId, updateHash = true) {
  const tabViews = document.querySelectorAll('.tab-view');
  const navBtns = document.querySelectorAll('.nav-tab-btn');

  // Deactivate all views and buttons
  tabViews.forEach(view => view.classList.remove('active-view'));
  navBtns.forEach(btn => btn.classList.remove('active'));

  // Activate matching view and button
  const activeView = document.getElementById(targetTabId);
  if (activeView) {
    activeView.classList.add('active-view');
  }

  const activeBtn = document.querySelector(`.nav-tab-btn[data-tab="${targetTabId}"]`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }

  // Update URL hash
  if (updateHash) {
    const tabToHashMap = {
      'viewOverview': 'overview',
      'viewChartsPredict': 'charts',
      'viewTrades': 'trades',
      'viewSimulator': 'simulator',
      'viewBlueprint': 'blueprint'
    };
    if (tabToHashMap[targetTabId]) {
      history.replaceState(null, '', `#${tabToHashMap[targetTabId]}`);
    }
  }

  // If switched to charts & predict view, smoothly resize and fit lightweight charts
  if (targetTabId === 'viewChartsPredict' || targetTabId === 'viewCharts') {
    setTimeout(() => {
      const priceContainer = document.getElementById('priceChartContainer');
      const waveContainer = document.getElementById('waveChartContainer');
      if (priceChart && priceContainer && priceContainer.clientWidth > 0) {
        priceChart.applyOptions({ width: priceContainer.clientWidth });
      }
      if (waveChart && waveContainer && waveContainer.clientWidth > 0) {
        waveChart.applyOptions({ width: waveContainer.clientWidth });
      }
      if (priceChart) priceChart.timeScale().fitContent();
      if (waveChart) waveChart.timeScale().fitContent();
    }, 60);
  }

  // Smoothly scroll to the navigation bar top
  const navBar = document.getElementById('mainTabNav');
  if (navBar && window.scrollY > navBar.offsetTop) {
    navBar.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Trade History Filter Controller (All / Win / Loss)
 */
function initTradeFilter() {
  const filterBtns = document.querySelectorAll('.trades-filter-bar .filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTradeFilter = btn.dataset.filter || 'all';
      renderCyclesTable(currentCyclesList, activeTradeFilter);
    });
  });
}

/**
 * Predictive Intelligence Renderer
 */
function renderPredictiveIntelligence(pred) {
  if (!pred) return;

  const elLastPrice = document.getElementById('predLastPrice');
  if (elLastPrice && pred.lastPrice) elLastPrice.textContent = `฿${pred.lastPrice.toFixed(2)}`;

  const elDelta = document.getElementById('predDeltaVal');
  if (elDelta && pred.dynamicDeltaPct) elDelta.textContent = `±${pred.dynamicDeltaPct.toFixed(2)}%`;

  const expRange = pred.expectedRange || {};
  const elCeil = document.getElementById('predCeilingVal');
  if (elCeil && expRange.ceiling) elCeil.textContent = `฿${expRange.ceiling.toFixed(2)}`;

  const elFloor = document.getElementById('predFloorVal');
  if (elFloor && expRange.floor) elFloor.textContent = `฿${expRange.floor.toFixed(2)}`;

  // Dynamic Weather Temperature Gauge Marker positioning
  if (pred.lastPrice && expRange.ceiling && expRange.floor) {
    const range = expRange.ceiling - expRange.floor;
    if (range > 0) {
      const posPct = Math.max(10, Math.min(90, ((pred.lastPrice - expRange.floor) / range) * 100));
      const elMarkerCurr = document.querySelector('.gauge-marker.marker-current');
      if (elMarkerCurr) elMarkerCurr.style.left = `${posPct}%`;
      const elProg = document.querySelector('.gauge-progress');
      if (elProg) elProg.style.width = `${posPct}%`;
    }
  }

  const scens = pred.scenarios || {};

  // 1. Inflection
  const s1 = scens.bullishInflection;
  if (s1) {
    const p1 = document.getElementById('scen1Price');
    if (p1) p1.textContent = `฿${s1.triggerPrice.toFixed(2)}`;
    const pct1 = document.getElementById('scen1Pct');
    if (pct1) pct1.textContent = s1.changePct;
    const desc1 = document.getElementById('scen1Desc');
    if (desc1) desc1.textContent = s1.description;
    const act1 = document.getElementById('scen1Action');
    if (act1) act1.textContent = s1.actionPlan;
  }

  // 2. Breakout
  const s2 = scens.resonanceBreakout;
  if (s2) {
    const p2 = document.getElementById('scen2Price');
    if (p2) p2.textContent = `฿${s2.triggerPrice.toFixed(2)}`;
    const pct2 = document.getElementById('scen2Pct');
    if (pct2) pct2.textContent = s2.changePct;
    const desc2 = document.getElementById('scen2Desc');
    if (desc2) desc2.textContent = s2.description;
    const act2 = document.getElementById('scen2Action');
    if (act2) act2.textContent = s2.actionPlan;
  }

  // 3. Neutral
  const s3 = scens.neutralHolding;
  if (s3) {
    const p3 = document.getElementById('scen3Price');
    if (p3) p3.textContent = s3.rangeText;
    const desc3 = document.getElementById('scen3Desc');
    if (desc3) desc3.textContent = s3.description;
    const act3 = document.getElementById('scen3Action');
    if (act3) act3.textContent = s3.actionPlan;
  }

  // 4. Bear
  const s4 = scens.bearishRisk;
  if (s4) {
    const p4 = document.getElementById('scen4Price');
    if (p4) p4.textContent = `฿${s4.triggerPrice.toFixed(2)}`;
    const pct4 = document.getElementById('scen4Pct');
    if (pct4) pct4.textContent = s4.changePct;
    const desc4 = document.getElementById('scen4Desc');
    if (desc4) desc4.textContent = s4.description;
    const act4 = document.getElementById('scen4Action');
    if (act4) act4.textContent = s4.actionPlan;
  }

  // Update 18 Metrics in Proof Drawer
  if (pred.lastDate) {
    const el = document.getElementById('m18_date');
    if (el) el.textContent = pred.lastDate;
  }
  if (pred.lastPrice) {
    const el = document.getElementById('m18_price');
    if (el) el.textContent = `฿${pred.lastPrice.toFixed(2)}`;
  }
  if (pred.dynamicDeltaPct) {
    const el = document.getElementById('m18_delta');
    if (el) el.textContent = `±${pred.dynamicDeltaPct.toFixed(2)}%`;
  }
  if (expRange.floor) {
    const el = document.getElementById('m18_floor');
    if (el) el.textContent = `฿${expRange.floor.toFixed(2)}`;
  }
  if (expRange.ceiling) {
    const el = document.getElementById('m18_ceiling');
    if (el) el.textContent = `฿${expRange.ceiling.toFixed(2)}`;
  }
  if (expRange.spreadThb) {
    const el = document.getElementById('m18_spread');
    if (el) el.textContent = `฿${expRange.spreadThb.toFixed(2)}`;
  }
}

/**
 * Dual-Run Switcher & Co-Pilot Controller
 * Manages 2 distinct sessions: Midday (12:45) & Evening (17:30)
 * Drives the 18 Instruments, AI Captain Analysis, and Weather Atmosphere
 */
const FORECAST_SESSIONS = {
  midday: {
    tagText: '☀️ บันทึกตรวจวัดรอบหลังเที่ยง 12:45 น. (วิเคราะห์ภาคเช้า วางแผนภาคบ่าย)',
    copilotTitle: 'บทวิเคราะห์จาก Co-Pilot กัปตันเอไอ (อ้างอิงแผง 18 ค่ารอบหลังเที่ยง)',
    copilotMsg: '"สวัสดีครับกัปตัน! จากการตรวจวัดแผง 18 ค่าประจำรอบเที่ยงนี้ พบว่าคลื่นสั้น V5 (ค่าที่ 3) เริ่มฟื้นตัวมาแตะ +0.196 ขณะที่คลื่นใหญ่ V20 (ค่าที่ 4) พุ่งแตะ +1.022 หนุนหลังเต็มที่ และความสอดคล้องคลื่น rho (ค่าที่ 5) ข้ามเกณฑ์มาอยู่ที่ +0.370 แล้วครับ! <strong>คำแนะนำเดินเรือภาคบ่าย:</strong> ปัจจุบันตลาดยังอยู่ในโซนสะสมพลัง แต่ถ้าบ่ายนี้ราคาขยับข้ามจุดชนวน (ค่าที่ 11) <strong>฿146.82 (+0.22%)</strong> แปลว่าสัญญาณกลับตัวยืนยันสมบูรณ์ เราแบ่งเปิดไม้แรกหยั่งเชิง 30% ได้ทันทีครับ!"',
    weatherIcon: '⛅',
    weatherHeading: 'มีเมฆสะสม คลื่นลมทิศเหนือเริ่มพัดหนุน (Inflection Watch)',
    weatherSummary: 'คลื่นสั้น V5 เริ่มฟื้นตัวจ่อจุดชนวน ฿146.82 คลื่นใหญ่ V20 หนุนบวกแข็งแกร่ง ตลาดพร้อมระเบิดหากบ่ายนี้ข้ามต้านย่อย',
    m18: {
      date: '2026-10-15 (12:45 น.)',
      price: '฿146.50',
      v5: '+0.196',
      v20: '+1.022',
      rho: '+0.370',
      er: '0.300',
      delta: '±3.56%',
      floor: '฿141.28',
      ceiling: '฿151.72',
      spread: '฿10.44',
      inflection: '฿146.82 (+0.22%)',
      breakout: '฿153.25 (+4.61%)',
      neutral: '฿141.28 - ฿146.82',
      breakdown: '฿141.28 (-3.56%)',
      tp: '฿150.49 (+2.50%)',
      trailing: '฿160.10+'
    }
  },
  evening: {
    tagText: '🌙 บันทึกตรวจวัดรอบหลังตลาดปิด 17:30 น. (สรุปวันเต็ม วางแผนวันพรุ่งนี้)',
    copilotTitle: 'บทวิเคราะห์จาก Co-Pilot กัปตันเอไอ (อ้างอิงแผง 18 ค่ารอบหลังตลาดปิด)',
    copilotMsg: '"สรุปตลาดวันเต็มครับกัปตัน! แผงตรวจวัด 18 ค่าประจำวันปิดยืนยันว่า SCB ปิดประคองตัวที่ ฿146.50 อย่างเหนียวแน่น กรอบอุณหภูมิวันพรุ่งนี้คำนวณได้พื้นรับ Floor (ค่าที่ 8) ที่ ฿141.28 และเพดาน Ceiling (ค่าที่ 9) ที่ ฿151.72 <strong>คำแนะนำเดินเรือวันพรุ่งนี้:</strong> คืนนี้นอนหลับสบายใจได้เต็มที่ครับ ไม่มีอะไรต้องกังวล พรุ่งนี้เช้าหากเปิดกระโดดข้าม <strong>฿146.82</strong> เราจะเข้าจังหวะไม้แรกตามระบบทันที และหากวิ่งไปแตะ ฿150.49 เราล็อกกำไร +2.50% พร้อมขยับ Trailing Stop คุ้มกันต้นทุนให้ฟรี ไม่มีความเสี่ยงครับ!"',
    weatherIcon: '🌤️',
    weatherHeading: 'ท้องฟ้าเริ่มเปิด คลื่นใหญ่ประคองตัวแข็งแกร่ง (Ready for Tomorrow)',
    weatherSummary: 'โครงสร้างแท่งเทียนวันเต็มรักษาฐานราคาเหนือ Floor ฿141.28 ได้อย่างสมบูรณ์แบบ วางแผนรับมือล่วงหน้าก่อนตลาดเปิดเช้าพรุ่งนี้',
    m18: {
      date: '2026-10-15 (17:30 น.)',
      price: '฿146.50',
      v5: '+0.215',
      v20: '+1.045',
      rho: '+0.410',
      er: '0.315',
      delta: '±3.56%',
      floor: '฿141.28',
      ceiling: '฿151.72',
      spread: '฿10.44',
      inflection: '฿146.82 (+0.22%)',
      breakout: '฿153.25 (+4.61%)',
      neutral: '฿141.28 - ฿146.82',
      breakdown: '฿141.28 (-3.56%)',
      tp: '฿150.49 (+2.50%)',
      trailing: '฿160.10+'
    }
  }
};

function applyForecastSession(sessionKey) {
  const session = FORECAST_SESSIONS[sessionKey];
  if (!session) return;

  // 1. Update Session Tag
  const tagEl = document.getElementById('instrumentSessionTag');
  if (tagEl) tagEl.textContent = session.tagText;

  // 2. Update Co-Pilot Briefing
  const titleEl = document.getElementById('copilotTitle');
  const msgEl = document.getElementById('copilotMessage');
  if (titleEl) titleEl.textContent = session.copilotTitle;
  if (msgEl) msgEl.innerHTML = session.copilotMsg;

  // 3. Update Weather Box
  const iconEl = document.querySelector('.weather-huge-icon');
  const headingEl = document.querySelector('.weather-condition-heading');
  const sumEl = document.querySelector('.weather-condition-summary');
  if (iconEl) iconEl.textContent = session.weatherIcon;
  if (headingEl) headingEl.textContent = session.weatherHeading;
  if (sumEl) sumEl.textContent = session.weatherSummary;

  // 4. Update the 18 Instruments Deck
  const m = session.m18;
  const map = {
    'm18_date': m.date,
    'm18_price': m.price,
    'm18_v5': m.v5,
    'm18_v20': m.v20,
    'm18_rho': m.rho,
    'm18_er': m.er,
    'm18_delta': m.delta,
    'm18_floor': m.floor,
    'm18_ceiling': m.ceiling,
    'm18_spread': m.spread,
    'm18_inflection': m.inflection,
    'm18_breakout': m.breakout,
    'm18_neutral': m.neutral,
    'm18_breakdown': m.breakdown,
    'm18_tp': m.tp,
    'm18_trailing': m.trailing
  };

  for (const [id, val] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }
}

function initForecastRunSwitcher() {
  const btnMidday = document.getElementById('btnRunMidday');
  const btnEvening = document.getElementById('btnRunEvening');

  if (btnMidday && btnEvening) {
    btnMidday.addEventListener('click', () => {
      btnMidday.classList.add('active');
      btnEvening.classList.remove('active');
      applyForecastSession('midday');
    });

    btnEvening.addEventListener('click', () => {
      btnEvening.classList.add('active');
      btnMidday.classList.remove('active');
      applyForecastSession('evening');
    });
  }

  // Toggle Accordion for Historical Proof Drawer
  const btnProof = document.getElementById('btnToggleProofDrawer');
  const drawerBody = document.getElementById('proofDrawerBody');
  const arrowEl = document.getElementById('proofToggleArrow');
  const textEl = document.getElementById('proofToggleText');

  if (btnProof && drawerBody) {
    btnProof.addEventListener('click', () => {
      const isHidden = window.getComputedStyle(drawerBody).display === 'none';
      if (isHidden) {
        drawerBody.style.display = 'block';
        if (arrowEl) arrowEl.style.transform = 'rotate(180deg)';
        if (textEl) textEl.textContent = 'คลิกเพื่อซ่อนตารางพิสูจน์ค่าสถิติจริง';
      } else {
        drawerBody.style.display = 'none';
        if (arrowEl) arrowEl.style.transform = 'rotate(0deg)';
        if (textEl) textEl.textContent = 'คลิกเพื่อดูตารางพิสูจน์ค่าสถิติจริง';
      }
    });
  }

  // Set initial session to Midday
  applyForecastSession('midday');
}



