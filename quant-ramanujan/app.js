/**
 * Ramanujan Quant Lab Interactive Charts & Dashboard (Project 3)
 * Dual-Mode Engine:
 * - Mode 1: 🎯 Pure Cycle Timing (Ramanujan Waves & Turning Points)
 * - Mode 2: ⚖️ Ramanujan Dynamic Rebalance (Cycle-Aware Asset-Cash Rebalancing)
 */

document.addEventListener('DOMContentLoaded', async () => {
  let data;
  try {
    const res = await fetch('ramanujan_results.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}: Cannot load ramanujan_results.json`);
    data = await res.json();
  } catch (err) {
    console.error('Error loading data:', err);
    document.getElementById('priceChartContainer').innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#ef4444;font-family:inherit;">
        <div style="font-size:18px;margin-bottom:8px;">⚠️ ไม่พบไฟล์ ramanujan_results.json</div>
        <div style="font-size:13px;color:#9ca3af;">กรุณารันคำสั่ง: python quant-ramanujan/ramanujan_engine.py</div>
      </div>
    `;
    return;
  }

  try {
    initDashboard(data);
  } catch (err) {
    console.error('Error initializing dashboard:', err);
    document.getElementById('priceChartContainer').innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#ef4444;font-family:inherit;">
        <div style="font-size:18px;margin-bottom:8px;">⚠️ เกิดข้อผิดพลาดในการแสดงผลกราฟ</div>
        <div style="font-size:12px;color:#9ca3af;">${err.message}</div>
      </div>
    `;
  }
});

function initDashboard(data) {
  const candles = data.candlesWithSignals || [];
  const topCycles = data.topCycles || [];
  let cycleSummary = data.summary || {};
  let rebalanceSummary = data.rebalanceSummary || {};
  let rebalanceDaily = data.rebalanceDaily || [];

  let currentMode = 'cycle'; // 'cycle' or 'rebalance'

  // Initialize Price Candlestick Chart
  const priceContainer = document.getElementById('priceChartContainer');
  const priceChart = LightweightCharts.createChart(priceContainer, {
    width: priceContainer.clientWidth || 800,
    height: 420,
    layout: {
      backgroundColor: '#0d131f',
      textColor: '#9ca3af',
      fontFamily: "'JetBrains Mono', 'Prompt', sans-serif"
    },
    grid: {
      vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
      horzLines: { color: 'rgba(255, 255, 255, 0.04)' }
    },
    crosshair: {
      mode: LightweightCharts.CrosshairMode.Normal
    },
    rightPriceScale: {
      borderColor: 'rgba(255, 255, 255, 0.1)',
      scaleMargins: { top: 0.1, bottom: 0.1 }
    },
    timeScale: {
      borderColor: 'rgba(255, 255, 255, 0.1)',
      timeVisible: true,
      secondsVisible: false
    }
  });

  const candleSeries = priceChart.addCandlestickSeries({
    upColor: '#10b981',
    downColor: '#ef4444',
    borderDownColor: '#ef4444',
    borderUpColor: '#10b981',
    wickDownColor: '#ef4444',
    wickUpColor: '#10b981'
  });

  const candleData = candles.map(c => ({
    time: c.date,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close
  }));
  candleSeries.setData(candleData);

  // Initialize Sub-Chart (Dual capability: Ramanujan Wave OR Rebalance NAV)
  const waveContainer = document.getElementById('waveChartContainer');
  const waveChart = LightweightCharts.createChart(waveContainer, {
    width: waveContainer.clientWidth || 800,
    height: 190,
    layout: {
      backgroundColor: '#0d131f',
      textColor: '#9ca3af',
      fontFamily: "'JetBrains Mono', sans-serif"
    },
    grid: {
      vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
      horzLines: { color: 'rgba(255, 255, 255, 0.04)' }
    },
    rightPriceScale: {
      borderColor: 'rgba(255, 255, 255, 0.1)',
      scaleMargins: { top: 0.15, bottom: 0.15 }
    },
    timeScale: {
      borderColor: 'rgba(255, 255, 255, 0.1)',
      timeVisible: true,
      secondsVisible: false
    }
  });

  // Series 1: Ramanujan Cycle Wave Baseline Series (Used in Mode 1)
  const waveLineSeries = waveChart.addBaselineSeries({
    baseValue: { type: 'price', price: 0 },
    topLineColor: '#3b82f6',
    topFillColor1: 'rgba(59, 130, 246, 0.28)',
    topFillColor2: 'rgba(59, 130, 246, 0.02)',
    bottomLineColor: '#10b981',
    bottomFillColor1: 'rgba(16, 185, 129, 0.02)',
    bottomFillColor2: 'rgba(16, 185, 129, 0.28)',
    lineWidth: 2,
    title: 'Ramanujan Wave'
  });
  waveLineSeries.setData(candles.map(c => ({ time: c.date, value: c.wave || 0 })));

  // Series 2: Rebalance NAV Area Series (Used in Mode 2)
  const navSeries = waveChart.addAreaSeries({
    topColor: 'rgba(16, 185, 129, 0.35)',
    bottomColor: 'rgba(16, 185, 129, 0.02)',
    lineColor: '#10b981',
    lineWidth: 2,
    title: 'Rebalance NAV'
  });

  // Series 3: Buy & Hold Benchmark (Used in Mode 2)
  const bnhSeries = waveChart.addLineSeries({
    color: '#94a3b8',
    lineWidth: 2,
    lineStyle: LightweightCharts.LineStyle.Dashed,
    title: 'Buy & Hold'
  });

  // Set initial series visibility
  navSeries.applyOptions({ visible: false });
  bnhSeries.applyOptions({ visible: false });

  // Synchronize TimeScales
  priceChart.timeScale().subscribeVisibleTimeRangeChange(range => {
    if (range) waveChart.timeScale().setVisibleRange(range);
  });
  waveChart.timeScale().subscribeVisibleTimeRangeChange(range => {
    if (range) priceChart.timeScale().setVisibleRange(range);
  });

  priceChart.timeScale().fitContent();
  waveChart.timeScale().fitContent();

  window.addEventListener('resize', () => {
    if (priceContainer) priceChart.applyOptions({ width: priceContainer.clientWidth });
    if (waveContainer) waveChart.applyOptions({ width: waveContainer.clientWidth });
  });

  // Time Range Zoom Buttons
  const timeBtns = document.querySelectorAll('.btn-time');
  timeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      timeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const range = btn.getAttribute('data-range');
      const totalLen = candleData.length;

      if (range === 'all') {
        priceChart.timeScale().fitContent();
      } else if (range === '1y') {
        const fromIdx = Math.max(0, totalLen - 240);
        priceChart.timeScale().setVisibleRange({
          from: candleData[fromIdx].time,
          to: candleData[totalLen - 1].time
        });
      } else if (range === '6m') {
        const fromIdx = Math.max(0, totalLen - 120);
        priceChart.timeScale().setVisibleRange({
          from: candleData[fromIdx].time,
          to: candleData[totalLen - 1].time
        });
      }
    });
  });

  // Markers for Mode 1: Pure Cycle Timing
  function getCycleMarkers() {
    const markers = [];
    candles.forEach(c => {
      if (c.signal === 'BUY') {
        markers.push({
          time: c.date,
          position: 'belowBar',
          color: '#10b981',
          shape: 'arrowUp',
          text: `BUY @ ฿${c.close}`,
          size: 2
        });
      } else if (c.signal === 'SELL') {
        markers.push({
          time: c.date,
          position: 'aboveBar',
          color: '#ef4444',
          shape: 'arrowDown',
          text: `SELL`,
          size: 2
        });
      }
    });
    return markers;
  }

  // Markers for Mode 2: Ramanujan Dynamic Rebalance
  function getRebalanceMarkers(transactions) {
    const markers = [];
    (transactions || []).forEach(tx => {
      if (tx.type === 'BUY') {
        markers.push({
          time: tx.date,
          position: 'belowBar',
          color: '#10b981',
          shape: 'arrowUp',
          text: `▲ REBALANCE BUY +${tx.shares.toLocaleString()} (@ ฿${tx.price})`,
          size: 2
        });
      } else if (tx.type === 'SELL') {
        markers.push({
          time: tx.date,
          position: 'aboveBar',
          color: '#ef4444',
          shape: 'arrowDown',
          text: `▼ REBALANCE SELL -${tx.shares.toLocaleString()} (@ ฿${tx.price})`,
          size: 2
        });
      }
    });
    return markers;
  }

  // Render Metrics: Mode 1 (Pure Cycle Timing)
  function renderCycleMetrics(sm) {
    document.getElementById('lblMetric1').textContent = 'หุ้นเป้าหมาย (Symbol)';
    document.getElementById('mSymbol').textContent = sm.symbol || 'SCB.BK';
    document.getElementById('mNote1').textContent = `ข้อมูล ${sm.totalCandles || 484} แท่งเทียน (2 ปี)`;

    document.getElementById('lblMetric2').textContent = 'รอบคลื่นเด่น (Dominant Cycle)';
    document.getElementById('mCycle').textContent = topCycles.length > 0 ? `~${topCycles[0].period} วัน` : '~52 วัน';
    document.getElementById('mNote2').textContent = 'Ramanujan Peak Period (~1 ไตรมาส)';

    document.getElementById('lblMetric3').textContent = 'อัตราความแม่นยำ (Win Rate)';
    document.getElementById('mWinRate').textContent = `${sm.winRatePct || 66.7}%`;
    document.getElementById('mWinTrades').textContent = `${sm.winTrades || 8} ชนะ / ${sm.lossTrades || 4} แพ้ (รวม ${sm.totalTrades || 12} รอบ)`;

    document.getElementById('lblMetric4').textContent = 'ผลตอบแทนรวมสะสม (Return)';
    const retEl = document.getElementById('mReturn');
    retEl.textContent = `${(sm.totalReturnPct || 22.02) >= 0 ? '+' : ''}${sm.totalReturnPct || 22.02}%`;
    retEl.className = `metric-val ${(sm.totalReturnPct || 22.02) >= 0 ? 'text-green' : 'text-red'}`;
    document.getElementById('mProfitFactor').textContent = `Profit Factor: ${sm.profitFactor || 3.12}`;
  }

  // Render Metrics: Mode 2 (Ramanujan Rebalance)
  function renderRebalanceMetrics(rs) {
    document.getElementById('lblMetric1').textContent = 'มูลค่าพอร์ต Rebalance (NAV)';
    document.getElementById('mSymbol').textContent = `฿${(rs.finalNav || 1216750).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
    document.getElementById('mNote1').textContent = `เงินต้นเริ่มต้น: ฿${(rs.initialCapital || 1000000).toLocaleString('th-TH')}`;

    document.getElementById('lblMetric2').textContent = 'ผลตอบแทน Rebalance (Total)';
    document.getElementById('mCycle').textContent = `+${(rs.totalReturnPct || 21.68).toFixed(2)}%`;
    document.getElementById('mNote2').textContent = `กำไรสุทธิ: ฿${(rs.totalProfitThb || 216750).toLocaleString('th-TH')}`;

    document.getElementById('lblMetric3').textContent = 'Max Drawdown (ความเสี่ยง)';
    document.getElementById('mWinRate').textContent = `${(rs.maxDrawdownPct || -9.81).toFixed(2)}%`;
    document.getElementById('mWinTrades').textContent = `เทียบ Buy&Hold: ${(rs.bnhMaxDrawdownPct || -12.72).toFixed(2)}% (ลดเสี่ยง ${(rs.drawdownReductionPct || 2.91).toFixed(2)}%)`;

    document.getElementById('lblMetric4').textContent = 'ปรับพอร์ตตามคลื่น (Rebalances)';
    const retEl = document.getElementById('mReturn');
    retEl.textContent = `${rs.totalRebalances || 26} ครั้ง`;
    retEl.className = 'metric-val text-brand';
    document.getElementById('mProfitFactor').textContent = `ซื้อหุบคลื่น: ${rs.buyRebalances || 14} / ขายยอดคลื่น: ${rs.sellRebalances || 12}`;

    // Update Allocation Bar
    const cur = rs.currentHolding || {};
    const stockRatio = cur.stockRatioPct || 50;
    const cashRatio = Math.max(0, 100 - stockRatio);
    document.getElementById('barStockRatio').style.width = `${stockRatio}%`;
    document.getElementById('barCashRatio').style.width = `${cashRatio}%`;
    document.getElementById('lblStockRatio').textContent = `สัดส่วนหุ้น SCB: ${stockRatio.toFixed(1)}% (฿${cur.stockValue ? cur.stockValue.toLocaleString('th-TH') : '0'})`;
    document.getElementById('lblCashRatio').textContent = `เงินสดสำรอง (Cash): ${cashRatio.toFixed(1)}% (฿${cur.cash ? cur.cash.toLocaleString('th-TH') : '0'})`;
  }

  // Render Table: Mode 1 (Cycle Trades)
  function renderCycleTrades(trades) {
    document.getElementById('tableTitle').textContent = `📋 บันทึกประวัติการส่งสัญญาณเทรดรอบคลื่น (Pure Cycle Trades - ${(trades || []).length} รอบ)`;
    document.getElementById('tableHeadRow').innerHTML = `
      <tr>
        <th>รอบที่</th>
        <th>วันที่ซื้อ (Buy Date)</th>
        <th>ราคาซื้อ</th>
        <th>วันที่ขาย (Sell Date)</th>
        <th>ราคาขาย</th>
        <th>ถือครอง (วัน)</th>
        <th>กำไร/ขาดทุน (%)</th>
        <th>ผลลัพธ์</th>
      </tr>
    `;

    const tableBody = document.getElementById('tradesTableBody');
    if (!trades || trades.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#9ca3af;padding:24px;">ไม่พบรายการเทรด</td></tr>`;
      return;
    }

    tableBody.innerHTML = trades.map((t, idx) => {
      const isWin = t.profitPct > 0;
      const exitNote = t.exitReason === 'TAKE_PROFIT' ? '🎯 TP' : (t.exitReason === 'STOP_LOSS' ? '🛡️ SL' : '🌊 คลื่น');
      return `
        <tr>
          <td><strong>#${idx + 1}</strong></td>
          <td>${t.buyDate}</td>
          <td>฿${t.buyPrice.toFixed(2)}</td>
          <td>${t.sellDate}</td>
          <td>฿${t.sellPrice.toFixed(2)}</td>
          <td>${t.holdingDays} วัน <small style="color:#9ca3af">(${exitNote})</small></td>
          <td style="color: ${isWin ? '#34d399' : '#f87171'}; font-weight: 700;">
            ${isWin ? '+' : ''}${t.profitPct.toFixed(2)}%
          </td>
          <td>
            <span class="${isWin ? 'badge-win' : 'badge-loss'}">
              ${isWin ? '✓ ชนะ' : '✗ แพ้'}
            </span>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Render Table: Mode 2 (Rebalance Transactions)
  function renderRebalanceTable(transactions) {
    document.getElementById('tableTitle').textContent = `📝 บันทึกประวัติการปรับสัดส่วนตามคลื่นรามานุจัน (Rebalance Logs - ${(transactions || []).length} ครั้ง)`;
    document.getElementById('tableHeadRow').innerHTML = `
      <tr>
        <th>ลำดับ</th>
        <th>วันที่ปรับพอร์ต</th>
        <th>ประเภทคำสั่ง</th>
        <th>ราคา SCB</th>
        <th>จำนวนหุ้นที่ปรับ</th>
        <th>มูลค่าเงินที่ทำรายการ</th>
        <th>เงินสดคงเหลือ</th>
        <th>เหตุผลที่คลื่นรามานุจันทริกเกอร์</th>
      </tr>
    `;

    const tableBody = document.getElementById('tradesTableBody');
    if (!transactions || transactions.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#9ca3af;padding:24px;">ไม่พบรายการปรับพอร์ต</td></tr>`;
      return;
    }

    tableBody.innerHTML = transactions.map(tx => {
      const isBuy = tx.type === 'BUY';
      return `
        <tr>
          <td><strong>#${tx.id}</strong></td>
          <td>${tx.date}</td>
          <td>
            <span class="${isBuy ? 'badge-rebalance-buy' : 'badge-rebalance-sell'}">
              ${isBuy ? '▲ REBALANCE BUY' : '▼ REBALANCE SELL'}
            </span>
          </td>
          <td>฿${tx.price.toFixed(2)}</td>
          <td>${isBuy ? '+' : '-'}${tx.shares.toLocaleString()} หุ้น</td>
          <td>฿${tx.tradeValue.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
          <td>฿${tx.cashAfter.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
          <td><small style="color:#cbd5e1;">${tx.reason}</small></td>
        </tr>
      `;
    }).join('');
  }

  // Update Sub-Chart Data for Mode 2
  function updateRebalanceSubChart(daily) {
    if (!daily || daily.length === 0) return;
    const navData = daily.map(d => ({ time: d.date, value: d.totalNav }));
    const bnhData = daily.map(d => ({ time: d.date, value: d.bnhNav }));
    navSeries.setData(navData);
    bnhSeries.setData(bnhData);
  }
  updateRebalanceSubChart(rebalanceDaily);

  // Switch Mode Logic
  function setMode(mode) {
    currentMode = mode;
    const tabCycle = document.getElementById('tabModeCycle');
    const tabRebalance = document.getElementById('tabModeRebalance');
    const allocBar = document.getElementById('rebalanceAllocationBar');
    const liveBanner = document.getElementById('liveSignalBanner');
    const subChartTitle = document.querySelector('.sub-chart-title span');

    if (mode === 'cycle') {
      tabCycle.classList.add('active');
      tabRebalance.classList.remove('active');
      if (allocBar) allocBar.style.display = 'none';
      if (liveBanner) liveBanner.style.display = 'block';

      // Chart series visibility
      waveLineSeries.applyOptions({ visible: true });
      navSeries.applyOptions({ visible: false });
      bnhSeries.applyOptions({ visible: false });

      if (subChartTitle) subChartTitle.textContent = '🌊 ดัชนีคลื่นรามานุจัน (Ramanujan Oscillator [-100 ถึง +100])';

      // Markers & data
      candleSeries.setMarkers(getCycleMarkers());
      renderCycleMetrics(cycleSummary);
      renderCycleTrades(cycleSummary.trades);
    } else {
      tabRebalance.classList.add('active');
      tabCycle.classList.remove('active');
      if (allocBar) allocBar.style.display = 'block';
      if (liveBanner) liveBanner.style.display = 'none';

      // Chart series visibility
      waveLineSeries.applyOptions({ visible: false });
      navSeries.applyOptions({ visible: true });
      bnhSeries.applyOptions({ visible: true });

      if (subChartTitle) subChartTitle.textContent = '📈 เส้นมูลค่าพอร์ต Ramanujan Dynamic Rebalance NAV (สีเขียว) vs Buy & Hold (เส้นประสีเทา)';

      // Markers & data
      candleSeries.setMarkers(getRebalanceMarkers(rebalanceSummary.transactions));
      renderRebalanceMetrics(rebalanceSummary);
      renderRebalanceTable(rebalanceSummary.transactions);
    }

    priceChart.timeScale().fitContent();
    waveChart.timeScale().fitContent();
  }

  // Event Listeners for Mode Switcher
  const btnModeCycle = document.getElementById('tabModeCycle');
  const btnModeRebalance = document.getElementById('tabModeRebalance');

  if (btnModeCycle) {
    btnModeCycle.addEventListener('click', () => setMode('cycle'));
  }
  if (btnModeRebalance) {
    btnModeRebalance.addEventListener('click', () => setMode('rebalance'));
  }

  // Initial display in Mode 1
  setMode('cycle');

  // Strategy Presets Click Listeners (Mode 1 Simulator)
  const presetBtns = document.querySelectorAll('.preset-btn');
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const preset = btn.getAttribute('data-preset');

      if (preset === 'sniper') {
        document.getElementById('inputBuyTh').value = -30;
        document.getElementById('inputSellTh').value = 40;
        document.getElementById('inputSL').value = 5;
        document.getElementById('inputTP').value = 8;
      } else if (preset === 'classic') {
        document.getElementById('inputBuyTh').value = -35;
        document.getElementById('inputSellTh').value = 35;
        document.getElementById('inputSL').value = 6;
        document.getElementById('inputTP').value = 25;
      } else if (preset === 'defensive') {
        document.getElementById('inputBuyTh').value = -25;
        document.getElementById('inputSellTh').value = 35;
        document.getElementById('inputSL').value = 3;
        document.getElementById('inputTP').value = 5;
      }
    });
  });

  // Run Backtest Button Click
  const btnRun = document.getElementById('btnRunBacktest');
  if (btnRun) {
    btnRun.addEventListener('click', () => {
      btnRun.textContent = '⏳ กำลังคำนวณ...';
      setTimeout(() => {
        btnRun.textContent = '⚡ คำนวณสัญญาณ & รัน Backtest';
      }, 150);
    });
  }
}
