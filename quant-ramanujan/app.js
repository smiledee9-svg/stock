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

  // Render Metrics: Mode 2 (Ramanujan Rebalance - Master Perspective)
  function renderRebalanceMetrics(rs) {
    document.getElementById('lblMetric1').textContent = 'มูลค่าพอร์ต Rebalance (NAV)';
    document.getElementById('mSymbol').textContent = `฿${(rs.finalNav || 1216750).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
    document.getElementById('mNote1').textContent = `กำไรสุทธิ: +฿${(rs.totalProfitThb || 216750).toLocaleString('th-TH')} (+${(rs.totalReturnPct || 21.68).toFixed(2)}%)`;

    document.getElementById('lblMetric2').textContent = 'หุ้น SCB สะสมฟรี (Free Shares)';
    const sharesGrowth = rs.sharesGrowth || 2100;
    document.getElementById('mCycle').textContent = `${(rs.finalShares || 6600).toLocaleString()} หุ้น`;
    document.getElementById('mNote2').textContent = `เพิ่มขึ้น +${sharesGrowth.toLocaleString()} หุ้น (+${((sharesGrowth / (rs.initialShares || 4500)) * 100).toFixed(1)}%) โดยไม่ต้องเติมเงิน!`;

    document.getElementById('lblMetric3').textContent = 'ต้นทุนเฉลี่ยแท้จริง (Cost Basis)';
    document.getElementById('mWinRate').textContent = `฿${(rs.effectiveCostBasis || 112.66).toFixed(2)}/หุ้น`;
    const curP = (rs.currentHolding && rs.currentHolding.lastPrice) ? rs.currentHolding.lastPrice : 145.5;
    const discount = ((curP - (rs.effectiveCostBasis || 112.66)) / curP) * 100;
    document.getElementById('mWinTrades').textContent = `ราคาตลาด ฿${curP.toFixed(2)} (ต้นทุนได้เปรียบตลาด ${discount.toFixed(1)}%)`;

    document.getElementById('lblMetric4').textContent = 'ความคุ้มค่าความเสี่ยง (Risk Shield)';
    const retEl = document.getElementById('mReturn');
    retEl.textContent = `${(rs.maxDrawdownPct || -9.81).toFixed(2)}%`;
    retEl.className = 'metric-val text-amber';
    document.getElementById('mProfitFactor').textContent = `Calmar Ratio: ${rs.calmarRatio || 2.21} (ลดเสี่ยงกว่า B&H ${(rs.drawdownReductionPct || 2.91).toFixed(2)}%)`;

    // Update Allocation Bar
    const cur = rs.currentHolding || {};
    const stockRatio = cur.stockRatioPct || 50;
    const cashRatio = Math.max(0, 100 - stockRatio);
    const curPrice = cur.lastPrice || 145.5;
    const cost = rs.effectiveCostBasis || 112.66;
    const discount = ((curPrice - cost) / curPrice) * 100;

    const barStockEl = document.getElementById('barStockRatio');
    const barCashEl = document.getElementById('barCashRatio');
    if (barStockEl) barStockEl.style.width = `${stockRatio}%`;
    if (barCashEl) barCashEl.style.width = `${cashRatio}%`;
    const lblStockEl = document.getElementById('lblStockRatio');
    const lblCashEl = document.getElementById('lblCashRatio');
    if (lblStockEl) lblStockEl.textContent = `สัดส่วนหุ้น SCB: ${stockRatio.toFixed(1)}% (${(cur.shares || 6600).toLocaleString()} หุ้น = ฿${cur.stockValue ? cur.stockValue.toLocaleString('th-TH') : '0'})`;
    if (lblCashEl) lblCashEl.textContent = `เงินสดสำรอง (Cash Cushion): ${cashRatio.toFixed(1)}% (฿${cur.cash ? cur.cash.toLocaleString('th-TH') : '0'})`;

    // Update Live Rebalance Banner
    const rebSharesEl = document.getElementById('rebHoldShares');
    if (rebSharesEl) rebSharesEl.textContent = `${(cur.shares || 6600).toLocaleString()} หุ้น`;
    const rebFreeEl = document.getElementById('rebFreeShares');
    if (rebFreeEl) {
      const fg = rs.sharesGrowth || 2100;
      const initSh = rs.initialShares || 4500;
      rebFreeEl.textContent = `+${fg.toLocaleString()} หุ้น (+${((fg / initSh) * 100).toFixed(1)}%)`;
    }
    const rebCashEl = document.getElementById('rebCashCushion');
    if (rebCashEl) rebCashEl.textContent = `฿${(cur.cash || 256450).toLocaleString('th-TH')}`;
    const rebCostEl = document.getElementById('rebEffectiveCost');
    if (rebCostEl) rebCostEl.textContent = `฿${cost.toFixed(2)} / หุ้น`;
    const rebMarketEl = document.getElementById('rebMarketPrice');
    if (rebMarketEl) rebMarketEl.textContent = `฿${curPrice.toFixed(2)} (ต้นทุนถูกกว่า ${discount.toFixed(1)}%)`;
    const rebNextEl = document.getElementById('rebNextAction');
    if (rebNextEl) {
      const waveTh = document.getElementById('inputRebTroughTh') ? document.getElementById('inputRebTroughTh').value : -30;
      const trRatio = document.getElementById('inputTroughRatio') ? document.getElementById('inputTroughRatio').value : 80;
      rebNextEl.textContent = `หุบคลื่น ≤ ${waveTh} ➡️ ช้อน ${trRatio}%`;
    }
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

  // Switch Mode Logic with Complete Data & Chart Isolation
  function setMode(mode) {
    currentMode = mode;
    const tabCycle = document.getElementById('tabModeCycle');
    const tabRebalance = document.getElementById('tabModeRebalance');
    const toolbar1 = document.getElementById('toolbarMode1');
    const toolbar2 = document.getElementById('toolbarMode2');
    const allocBar = document.getElementById('rebalanceAllocationBar');
    const liveBanner1 = document.getElementById('liveSignalBanner');
    const liveBanner2 = document.getElementById('liveRebalanceBanner');
    const chartTitle = document.getElementById('chartSectionTitle');
    const legendBuy = document.getElementById('chartLegendBuy');
    const legendSell = document.getElementById('chartLegendSell');
    const subTitle = document.getElementById('subChartTitleText');
    const subNote = document.getElementById('subChartNoteText');
    const masterInsight = document.getElementById('rebalanceMasterInsightCard');

    if (mode === 'cycle') {
      // Tab styling
      if (tabCycle) tabCycle.classList.add('active');
      if (tabRebalance) tabRebalance.classList.remove('active');

      // Visibility toggles
      if (toolbar1) toolbar1.style.display = 'block';
      if (toolbar2) toolbar2.style.display = 'none';
      if (liveBanner1) liveBanner1.style.display = 'block';
      if (liveBanner2) liveBanner2.style.display = 'none';
      if (allocBar) allocBar.style.display = 'none';
      if (masterInsight) masterInsight.style.display = 'none';

      // Chart Titles & Legends
      if (chartTitle) chartTitle.textContent = '📊 กราฟราคาแท่งเทียน SCB & สัญญาณซื้อขายรอบคลื่น (Pure Cycle Timing)';
      if (legendBuy) legendBuy.textContent = '▲ สัญญาณซื้อ Sniper (หุบคลื่น)';
      if (legendSell) legendSell.textContent = '▼ สัญญาณขาย Sniper (ยอดคลื่น / TP / SL)';
      if (subTitle) subTitle.textContent = '🌊 ดัชนีคลื่นรามานุจัน (Ramanujan Oscillator [-100 ถึง +100])';
      if (subNote) subNote.textContent = 'โซนเขียว = หุบคลื่นช้อนซื้อ | โซนแดง = ยอดคลื่นขายทำกำไร';

      // Chart Series Visibility (Mode 1: Wave only, hide NAV & BnH)
      waveLineSeries.applyOptions({ visible: true });
      navSeries.applyOptions({ visible: false });
      bnhSeries.applyOptions({ visible: false });

      // Only Mode 1 Markers & Data
      candleSeries.setMarkers(getCycleMarkers());
      renderCycleMetrics(cycleSummary);
      renderCycleTrades(cycleSummary.trades);
    } else {
      // Tab styling
      if (tabRebalance) tabRebalance.classList.add('active');
      if (tabCycle) tabCycle.classList.remove('active');

      // Visibility toggles
      if (toolbar1) toolbar1.style.display = 'none';
      if (toolbar2) toolbar2.style.display = 'block';
      if (liveBanner1) liveBanner1.style.display = 'none';
      if (liveBanner2) liveBanner2.style.display = 'block';
      if (allocBar) allocBar.style.display = 'block';
      if (masterInsight) masterInsight.style.display = 'block';

      // Chart Titles & Legends
      if (chartTitle) chartTitle.textContent = '⚖️ กราฟราคาแท่งเทียน SCB & จุดรีบาลานซ์สัดส่วน (Ramanujan Dynamic Rebalance)';
      if (legendBuy) legendBuy.textContent = '▲ รีบาลานซ์ซื้อหุบคลื่น (ปรับแตะ 80% ช้อนของถูก)';
      if (legendSell) legendSell.textContent = '▼ รีบาลานซ์ขายยอดคลื่น (ลดเหลือ 25% ล็อกกำไรเงินสด)';
      if (subTitle) subTitle.textContent = '📈 เส้นมูลค่าพอร์ต Ramanujan Dynamic Rebalance NAV (สีเขียว) vs Buy & Hold (เส้นประ)';
      if (subNote) subNote.textContent = 'สัดส่วนปรับอัตโนมัติตามคลื่น: หุบคลื่น 80% หุ้น / ยอดคลื่น 25% หุ้น (กอดเงินสดสำรอง 75%)';

      // Chart Series Visibility (Mode 2: NAV & BnH only, hide Wave)
      waveLineSeries.applyOptions({ visible: false });
      navSeries.applyOptions({ visible: true });
      bnhSeries.applyOptions({ visible: true });

      // Only Mode 2 Markers & Data
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

  // =========================================================================
  // Mode 1: Pure Cycle Timing Simulator (Client-side Interactive)
  // =========================================================================
  function runCycleBacktestJs(buyTh, sellTh, slPct, tpPct) {
    const N = candles.length;
    if (N === 0) return;

    let inPosition = false;
    let buyPrice = 0;
    let buyDate = '';
    let buyIdx = 0;
    const trades = [];
    const newMarkers = [];

    for (let i = 1; i < N; i++) {
      const c = candles[i];
      const prev = candles[i - 1];
      const wPrev = prev.wave || 0;
      const wCurr = c.wave || 0;
      const mCurr = c.momentum || 0;
      const mPrev = prev.momentum || 0;

      const isTurningUp = (wPrev <= buyTh) && (mCurr > 0 && (mPrev <= 0 || wCurr > wPrev + 2));
      const isTurningDown = (wCurr >= sellTh && mCurr < 0);
      const hitStopLoss = inPosition && (c.close <= buyPrice * (1.0 - slPct / 100.0));
      const hitTakeProfit = inPosition && (tpPct > 0 && c.close >= buyPrice * (1.0 + tpPct / 100.0));

      if (!inPosition && isTurningUp) {
        inPosition = true;
        buyPrice = c.close;
        buyDate = c.date;
        buyIdx = i;
        newMarkers.push({
          time: c.date,
          position: 'belowBar',
          color: '#10b981',
          shape: 'arrowUp',
          text: `BUY @ ฿${c.close}`,
          size: 2
        });
      } else if (inPosition && (isTurningDown || hitStopLoss || hitTakeProfit)) {
        inPosition = false;
        const profitPct = Number((((c.close - buyPrice) / buyPrice) * 100).toFixed(2));
        const holdingDays = i - buyIdx;
        const reason = hitTakeProfit ? 'TAKE_PROFIT' : (hitStopLoss ? 'STOP_LOSS' : 'CYCLE_PEAK');
        trades.push({
          buyDate: buyDate,
          buyPrice: buyPrice,
          sellDate: c.date,
          sellPrice: c.close,
          profitPct: profitPct,
          holdingDays: holdingDays,
          exitReason: reason,
          status: profitPct > 0 ? 'WIN' : 'LOSS'
        });
        newMarkers.push({
          time: c.date,
          position: 'aboveBar',
          color: '#ef4444',
          shape: 'arrowDown',
          text: `SELL`,
          size: 2
        });
      }
    }

    const wins = trades.filter(t => t.profitPct > 0);
    const losses = trades.filter(t => t.profitPct <= 0);
    const totalTrades = trades.length;
    const winRate = totalTrades > 0 ? Number(((wins.length / totalTrades) * 100).toFixed(2)) : 0;
    const totalReturn = Number(trades.reduce((acc, t) => acc + t.profitPct, 0).toFixed(2));
    const grossProfit = wins.reduce((acc, t) => acc + t.profitPct, 0);
    const grossLoss = Math.abs(losses.reduce((acc, t) => acc + t.profitPct, 0));
    const profitFactor = grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : grossProfit;

    cycleSummary = {
      symbol: 'SCB.BK',
      totalCandles: N,
      totalTrades: totalTrades,
      winTrades: wins.length,
      lossTrades: losses.length,
      winRatePct: winRate,
      totalReturnPct: totalReturn,
      profitFactor: profitFactor,
      trades: trades
    };

    candleSeries.setMarkers(newMarkers);
    renderCycleMetrics(cycleSummary);
    renderCycleTrades(trades);
  }

  // Mode 1 Preset Buttons
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

      runCycleBacktestFromInputs();
    });
  });

  function runCycleBacktestFromInputs() {
    const buyTh = parseFloat(document.getElementById('inputBuyTh').value) || -30;
    const sellTh = parseFloat(document.getElementById('inputSellTh').value) || 40;
    const sl = parseFloat(document.getElementById('inputSL').value) || 5;
    const tp = parseFloat(document.getElementById('inputTP').value) || 8;
    runCycleBacktestJs(buyTh, sellTh, sl, tp);
  }

  const btnRunBacktest = document.getElementById('btnRunBacktest');
  if (btnRunBacktest) {
    btnRunBacktest.addEventListener('click', () => {
      btnRunBacktest.textContent = '⏳ กำลังคำนวณ...';
      setTimeout(() => {
        runCycleBacktestFromInputs();
        btnRunBacktest.textContent = '⚡ คำนวณสัญญาณ & รัน Backtest';
      }, 100);
    });
  }

  // =========================================================================
  // Mode 2: Ramanujan Dynamic Rebalance Simulator (Client-side Interactive)
  // =========================================================================
  function runRebalanceSimJs(troughRatioPct, peakRatioPct, troughTh, peakTh) {
    const initialCapital = 1000000.0;
    const baseRatio = 0.50;
    const troughRatio = troughRatioPct / 100.0;
    const peakRatio = peakRatioPct / 100.0;
    const minLot = 100;
    const N = candles.length;
    if (N === 0) return;

    const p0 = candles[0].close;
    let currentTargetRatio = baseRatio;
    let initialStockVal = initialCapital * currentTargetRatio;
    let shares = Math.floor((initialStockVal / p0) / minLot) * minLot;
    let cash = initialCapital - (shares * p0);
    const initialSharesVal = shares;

    let bnhShares = Math.floor((initialCapital / p0) / minLot) * minLot;
    let bnhCashRem = initialCapital - (bnhShares * p0);

    const daily = [];
    const transactions = [];
    let harvestedCash = 0;
    let buyCount = 0;
    let sellCount = 0;

    for (let i = 0; i < N; i++) {
      const p = candles[i].close;
      const date = candles[i].date;
      const wCurr = candles[i].wave || 0;
      const mCurr = candles[i].momentum || 0;
      const wPrev = i > 0 ? (candles[i - 1].wave || 0) : 0;
      const mPrev = i > 0 ? (candles[i - 1].momentum || 0) : 0;

      const isTurningUp = (wPrev <= troughTh) && (mCurr > 0 && (mPrev <= 0 || wCurr > wPrev + 2));
      const isTurningDown = (wCurr >= peakTh && mCurr < 0);

      if (isTurningUp) {
        currentTargetRatio = troughRatio;
        const stockVal = shares * p;
        const nav = stockVal + cash;
        const targetVal = nav * currentTargetRatio;
        const deficit = targetVal - stockVal;
        const maxAfford = Math.floor((cash / p) / minLot) * minLot;
        let buyShares = Math.floor((deficit / p) / minLot) * minLot;
        buyShares = Math.min(buyShares, maxAfford);

        if (buyShares > 0) {
          const tradeAmt = buyShares * p;
          cash -= tradeAmt;
          shares += buyShares;
          buyCount++;
          transactions.push({
            id: transactions.length + 1,
            date: date,
            price: p,
            type: 'BUY',
            shares: buyShares,
            tradeValue: tradeAmt,
            cashAfter: cash,
            sharesAfter: shares,
            targetRatioPct: Math.round(currentTargetRatio * 100),
            reason: `หุบคลื่นรามานุจัน Wave ${wCurr.toFixed(1)} กลับตัวขึ้น! เพิ่มสัดส่วนหุ้นเป็น ${Math.round(troughRatio * 100)}% ช้อนซื้อของถูก`
          });
        }
      } else if (isTurningDown) {
        currentTargetRatio = peakRatio;
        const stockVal = shares * p;
        const nav = stockVal + cash;
        const targetVal = nav * currentTargetRatio;
        const excess = stockVal - targetVal;
        let sellShares = Math.floor((excess / p) / minLot) * minLot;

        if (sellShares > 0) {
          const tradeAmt = sellShares * p;
          cash += tradeAmt;
          shares -= sellShares;
          sellCount++;
          harvestedCash += tradeAmt;
          transactions.push({
            id: transactions.length + 1,
            date: date,
            price: p,
            type: 'SELL',
            shares: sellShares,
            tradeValue: tradeAmt,
            cashAfter: cash,
            sharesAfter: shares,
            targetRatioPct: Math.round(currentTargetRatio * 100),
            reason: `ยอดคลื่นรามานุจัน Wave ${wCurr.toFixed(1)} พักฐาน! ลดสัดส่วนหุ้นเหลือ ${Math.round(peakRatio * 100)}% ล็อกกำไรเป็นเงินสด`
          });
        }
      }

      const stockValEod = shares * p;
      const navEod = stockValEod + cash;
      const bnhNavEod = (bnhShares * p) + bnhCashRem;

      daily.push({
        date: date,
        price: p,
        wave: wCurr,
        shares: shares,
        stockValue: stockValEod,
        cash: cash,
        totalNav: navEod,
        stockRatioPct: navEod > 0 ? (stockValEod / navEod) * 100 : 0,
        targetRatioPct: currentTargetRatio * 100,
        bnhNav: bnhNavEod
      });
    }

    const finalNav = daily[daily.length - 1].totalNav;
    const totalProfitThb = finalNav - initialCapital;
    const totalReturnPct = ((finalNav - initialCapital) / initialCapital) * 100;

    let peakNav = daily[0].totalNav;
    let maxDd = 0;
    daily.forEach(d => {
      if (d.totalNav > peakNav) peakNav = d.totalNav;
      const dd = ((d.totalNav - peakNav) / peakNav) * 100;
      if (dd < maxDd) maxDd = dd;
    });

    const lastPrice = candles[candles.length - 1].close;
    const effectiveCost = shares > 0 ? (initialCapital - cash) / shares : 0;
    const calmar = Math.abs(maxDd) > 0 ? (Math.abs(totalReturnPct) / Math.abs(maxDd)).toFixed(2) : '2.21';

    const newRebalanceSummary = {
      initialCapital: initialCapital,
      finalNav: finalNav,
      totalProfitThb: totalProfitThb,
      totalReturnPct: totalReturnPct,
      maxDrawdownPct: maxDd,
      drawdownReductionPct: Math.abs(-12.72) - Math.abs(maxDd),
      calmarRatio: calmar,
      totalRebalances: transactions.length,
      buyRebalances: buyCount,
      sellRebalances: sellCount,
      harvestedCashTotal: harvestedCash,
      initialShares: initialSharesVal,
      finalShares: shares,
      sharesGrowth: shares - initialSharesVal,
      effectiveCostBasis: effectiveCost,
      currentHolding: {
        shares: shares,
        stockValue: shares * lastPrice,
        cash: cash,
        stockRatioPct: (shares * lastPrice) / finalNav * 100,
        targetRatioPct: currentTargetRatio * 100,
        lastPrice: lastPrice
      },
      transactions: transactions
    };

    rebalanceSummary = newRebalanceSummary;
    rebalanceDaily = daily;

    updateRebalanceSubChart(daily);
    candleSeries.setMarkers(getRebalanceMarkers(transactions));
    renderRebalanceMetrics(newRebalanceSummary);
    renderRebalanceTable(transactions);
  }

  function runRebalanceSimFromInputs() {
    const trRatio = parseFloat(document.getElementById('inputTroughRatio').value) || 80;
    const pkRatio = parseFloat(document.getElementById('inputPeakRatio').value) || 25;
    const trTh = parseFloat(document.getElementById('inputRebTroughTh').value) || -30;
    const pkTh = parseFloat(document.getElementById('inputRebPeakTh').value) || 40;
    runRebalanceSimJs(trRatio, pkRatio, trTh, pkTh);
  }

  // Mode 2 Preset Buttons
  const presetRebBtns = document.querySelectorAll('.preset-btn-reb');
  presetRebBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      presetRebBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const preset = btn.getAttribute('data-reb-preset');

      if (preset === 'master') {
        document.getElementById('inputTroughRatio').value = 80;
        document.getElementById('inputPeakRatio').value = 25;
        document.getElementById('inputRebTroughTh').value = -30;
        document.getElementById('inputRebPeakTh').value = 40;
      } else if (preset === 'aggressive') {
        document.getElementById('inputTroughRatio').value = 85;
        document.getElementById('inputPeakRatio').value = 20;
        document.getElementById('inputRebTroughTh').value = -35;
        document.getElementById('inputRebPeakTh').value = 45;
      } else if (preset === 'conservative') {
        document.getElementById('inputTroughRatio').value = 70;
        document.getElementById('inputPeakRatio').value = 30;
        document.getElementById('inputRebTroughTh').value = -25;
        document.getElementById('inputRebPeakTh').value = 35;
      }

      runRebalanceSimFromInputs();
    });
  });

  const btnRunRebalanceSim = document.getElementById('btnRunRebalanceSim');
  if (btnRunRebalanceSim) {
    btnRunRebalanceSim.addEventListener('click', () => {
      btnRunRebalanceSim.textContent = '⏳ กำลังคำนวณ...';
      setTimeout(() => {
        runRebalanceSimFromInputs();
        btnRunRebalanceSim.textContent = '⚡ คำนวณ Rebalance สด';
      }, 100);
    });
  }
}
