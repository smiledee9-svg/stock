/**
 * SCB Dynamic Rebalancing Quant Lab - Interactive Dashboard & Charts (Project 4)
 * Features:
 * - TradingView Lightweight Charts Candlestick & Rebalance Trade Markers
 * - Sub-chart: Portfolio NAV Equity Curve vs Buy & Hold Curve
 * - Client-side Real-time Simulator with Custom Stock:Cash Target Ratios & Threshold Bands
 */

document.addEventListener('DOMContentLoaded', async () => {
  let data;
  try {
    const res = await fetch('rebalance_results.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}: Cannot load rebalance_results.json`);
    data = await res.json();
  } catch (err) {
    console.error('Error loading data:', err);
    document.getElementById('priceChartContainer').innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#ef4444;font-family:inherit;">
        <div style="font-size:18px;margin-bottom:8px;">⚠️ ไม่พบไฟล์ rebalance_results.json</div>
        <div style="font-size:13px;color:#9ca3af;">กรุณารันคำสั่ง: python quant-rebalance/rebalance_engine.py</div>
      </div>
    `;
    return;
  }

  try {
    initRebalanceDashboard(data);
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

function initRebalanceDashboard(data) {
  const candles = data.candles || [];
  const rawDaily = data.dailyRecords || [];
  let summary = data.summary || {};

  // Initialize Price Candlestick Chart
  const priceContainer = document.getElementById('priceChartContainer');
  const priceChart = LightweightCharts.createChart(priceContainer, {
    width: priceContainer.clientWidth || 800,
    height: 420,
    layout: {
      backgroundColor: '#0d131f',
      textColor: '#94a3b8',
      fontFamily: "'JetBrains Mono', 'Prompt', sans-serif"
    },
    grid: {
      vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
      horzLines: { color: 'rgba(255, 255, 255, 0.04)' }
    },
    crosshair: {
      mode: LightweightCharts.CrosshairMode.Normal
    },
    timeScale: {
      borderColor: 'rgba(255, 255, 255, 0.1)',
      timeVisible: true,
      secondsVisible: false
    },
    rightPriceScale: {
      borderColor: 'rgba(255, 255, 255, 0.1)'
    }
  });

  const candleSeries = priceChart.addCandlestickSeries({
    upColor: '#10b981',
    downColor: '#ef4444',
    borderUpColor: '#10b981',
    borderDownColor: '#ef4444',
    wickUpColor: '#10b981',
    wickDownColor: '#ef4444'
  });

  const candleData = candles.map(c => ({
    time: c.date,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close
  }));
  candleSeries.setData(candleData);

  // Initialize Sub-chart (Equity Curve: NAV vs Buy&Hold)
  const equityContainer = document.getElementById('equityChartContainer');
  const equityChart = LightweightCharts.createChart(equityContainer, {
    width: equityContainer.clientWidth || 800,
    height: 240,
    layout: {
      backgroundColor: '#0d131f',
      textColor: '#94a3b8',
      fontFamily: "'JetBrains Mono', 'Prompt', sans-serif"
    },
    grid: {
      vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
      horzLines: { color: 'rgba(255, 255, 255, 0.04)' }
    },
    crosshair: {
      mode: LightweightCharts.CrosshairMode.Normal
    },
    timeScale: {
      borderColor: 'rgba(255, 255, 255, 0.1)'
    },
    rightPriceScale: {
      borderColor: 'rgba(255, 255, 255, 0.1)',
      scaleMargins: { top: 0.1, bottom: 0.1 }
    }
  });

  // Rebalance NAV Series (Blue/Teal line with area gradient)
  const navSeries = equityChart.addAreaSeries({
    topColor: 'rgba(16, 185, 129, 0.4)',
    bottomColor: 'rgba(16, 185, 129, 0.02)',
    lineColor: '#10b981',
    lineWidth: 2,
    title: 'Rebalance NAV'
  });

  // Buy & Hold Series (Gray dashed line)
  const bnhSeries = equityChart.addLineSeries({
    color: '#94a3b8',
    lineWidth: 2,
    lineStyle: LightweightCharts.LineStyle.Dashed,
    title: 'Buy & Hold'
  });

  // Cash Cushion Series (Amber line)
  const cashSeries = equityChart.addLineSeries({
    color: '#38bdf8',
    lineWidth: 1,
    lineStyle: LightweightCharts.LineStyle.Dotted,
    title: 'Cash Reserve'
  });

  function updateEquityData(daily) {
    const navData = daily.map(d => ({ time: d.date, value: d.totalNav }));
    const bnhData = daily.map(d => ({ time: d.date, value: d.bnhNav }));
    const cashData = daily.map(d => ({ time: d.date, value: d.cash }));

    navSeries.setData(navData);
    bnhSeries.setData(bnhData);
    cashSeries.setData(cashData);
  }
  updateEquityData(rawDaily);

  // Synchronize TimeScales
  let isSyncing = false;
  priceChart.timeScale().subscribeVisibleLogicalRangeChange(range => {
    if (isSyncing || !range) return;
    isSyncing = true;
    equityChart.timeScale().setVisibleLogicalRange(range);
    isSyncing = false;
  });

  equityChart.timeScale().subscribeVisibleLogicalRangeChange(range => {
    if (isSyncing || !range) return;
    isSyncing = true;
    priceChart.timeScale().setVisibleLogicalRange(range);
    isSyncing = false;
  });

  // Auto-resize on window resize
  window.addEventListener('resize', () => {
    if (priceContainer) priceChart.applyOptions({ width: priceContainer.clientWidth });
    if (equityContainer) equityChart.applyOptions({ width: equityContainer.clientWidth });
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

  // Render Metrics
  function renderMetrics(sm) {
    if (!sm) return;
    document.getElementById('mFinalNav').textContent = `฿${sm.finalNav.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
    
    const retEl = document.getElementById('mTotalReturn');
    retEl.textContent = `${sm.totalReturnPct >= 0 ? '+' : ''}${sm.totalReturnPct.toFixed(2)}%`;
    retEl.className = `metric-val ${sm.totalReturnPct >= 0 ? 'text-green' : 'text-red'}`;
    document.getElementById('mProfitThb').textContent = `กำไร: ฿${sm.totalProfitThb.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;

    document.getElementById('mBnhReturn').textContent = `${sm.bnhReturnPct >= 0 ? '+' : ''}${sm.bnhReturnPct.toFixed(2)}%`;
    document.getElementById('mBnhNav').textContent = `NAV: ฿${sm.bnhFinalNav.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;

    const ddEl = document.getElementById('mMaxDrawdown');
    ddEl.textContent = `${sm.maxDrawdownPct.toFixed(2)}%`;
    document.getElementById('mBnhDrawdown').textContent = `เทียบ Buy&Hold: ${sm.bnhMaxDrawdownPct.toFixed(2)}% (ลดความเสี่ยง ${sm.drawdownReductionPct.toFixed(2)}%)`;

    document.getElementById('mRebalanceCount').textContent = `${sm.totalRebalances} ครั้ง`;
    document.getElementById('mRebalanceBreakdown').textContent = `ซื้อถูก (BUY): ${sm.buyRebalances} / ขายกำไร (SELL): ${sm.sellRebalances}`;

    // Update Allocation Progress Bar
    const cur = sm.currentHolding || {};
    const stockRatio = cur.stockRatioPct || 50;
    const cashRatio = Math.max(0, 100 - stockRatio);
    document.getElementById('barStockRatio').style.width = `${stockRatio}%`;
    document.getElementById('barCashRatio').style.width = `${cashRatio}%`;
    document.getElementById('lblStockRatio').textContent = `หุ้น SCB: ${stockRatio.toFixed(1)}% (฿${cur.stockValue ? cur.stockValue.toLocaleString('th-TH') : '0'})`;
    document.getElementById('lblCashRatio').textContent = `เงินสด: ${cashRatio.toFixed(1)}% (฿${cur.cash ? cur.cash.toLocaleString('th-TH') : '0'})`;
  }

  // Render Transaction Log Table
  function renderTransactions(transactions) {
    const tableBody = document.getElementById('txTableBody');
    if (!tableBody) return;

    if (!transactions || transactions.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center;color:#94a3b8;padding:28px;">
            ยังไม่เกิดการกระตุ้น Rebalance ตาม Threshold Band ที่ตั้งไว้ (พอร์ตยังคงรักษาสัดส่วนอยู่ในกรอบปลอดภัย)
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = transactions.map(tx => {
      const isBuy = tx.type === 'BUY';
      return `
        <tr>
          <td><strong>#${tx.id}</strong></td>
          <td>${tx.date}</td>
          <td>
            <span class="${isBuy ? 'badge-buy' : 'badge-sell'}">
              ${isBuy ? '🟢 REBALANCE BUY' : '🔴 REBALANCE SELL'}
            </span>
          </td>
          <td>฿${tx.price.toFixed(2)}</td>
          <td>${isBuy ? '+' : '-'}${tx.shares.toLocaleString()} หุ้น</td>
          <td>฿${tx.tradeValue.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
          <td>฿${tx.cashAfter.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
          <td><small style="color:#94a3b8;">${tx.reason}</small></td>
        </tr>
      `;
    }).join('');
  }

  // Client-Side Dynamic Simulation
  function simulateRebalance(capital, targetRatio, bandPct) {
    const N = candles.length;
    if (N === 0) return;

    const minLot = 100;
    const p0 = candles[0].close;
    const initialStockVal = capital * targetRatio;
    let shares = Math.floor((initialStockVal / p0) / minLot) * minLot;
    let cash = capital - (shares * p0);

    const bnhShares = Math.floor((capital / p0) / minLot) * minLot;
    const bnhCashRem = capital - (bnhShares * p0);

    const daily = [];
    const txList = [];
    const upperRatio = targetRatio + (bandPct / 100);
    const lowerRatio = targetRatio - (bandPct / 100);
    const markers = [];

    let buyCount = 0;
    let sellCount = 0;
    let harvestedTotal = 0;

    for (let i = 0; i < N; i++) {
      const c = candles[i];
      const p = c.close;
      let stockVal = shares * p;
      let nav = stockVal + cash;
      let ratio = nav > 0 ? stockVal / nav : 0;

      let action = 'HOLD';

      if (i > 0) {
        if (ratio > upperRatio) {
          // Sell excess
          const targetVal = nav * targetRatio;
          const excess = stockVal - targetVal;
          const sellShares = Math.floor((excess / p) / minLot) * minLot;
          if (sellShares > 0) {
            shares -= sellShares;
            const tradeVal = sellShares * p;
            cash += tradeVal;
            action = 'REBALANCE_SELL';
            sellCount++;
            harvestedTotal += tradeVal;
            txList.push({
              id: txList.length + 1,
              date: c.date,
              price: p,
              type: 'SELL',
              shares: sellShares,
              tradeValue: tradeVal,
              cashAfter: cash,
              sharesAfter: shares,
              navAfter: (shares * p) + cash,
              reason: `สัดส่วนหุ้นแตะ ${(ratio * 100).toFixed(1)}% (> ${(upperRatio * 100).toFixed(1)}%) ขายล็อกเงินสด`
            });

            markers.push({
              time: c.date,
              position: 'aboveBar',
              color: '#ef4444',
              shape: 'arrowDown',
              text: `SELL -${sellShares.toLocaleString()} (@ ฿${p})`,
              size: 2
            });
          }
        } else if (ratio < lowerRatio) {
          // Buy deficit
          const targetVal = nav * targetRatio;
          const deficit = targetVal - stockVal;
          const maxAfford = Math.floor((cash / p) / minLot) * minLot;
          let buyShares = Math.floor((deficit / p) / minLot) * minLot;
          buyShares = Math.min(buyShares, maxAfford);

          if (buyShares > 0) {
            const tradeVal = buyShares * p;
            cash -= tradeVal;
            shares += buyShares;
            action = 'REBALANCE_BUY';
            buyCount++;
            txList.push({
              id: txList.length + 1,
              date: c.date,
              price: p,
              type: 'BUY',
              shares: buyShares,
              tradeValue: tradeVal,
              cashAfter: cash,
              sharesAfter: shares,
              navAfter: (shares * p) + cash,
              reason: `สัดส่วนหุ้นย่อแตะ ${(ratio * 100).toFixed(1)}% (< ${(lowerRatio * 100).toFixed(1)}%) ช้อนซื้อของถูก`
            });

            markers.push({
              time: c.date,
              position: 'belowBar',
              color: '#10b981',
              shape: 'arrowUp',
              text: `BUY +${buyShares.toLocaleString()} (@ ฿${p})`,
              size: 2
            });
          }
        }
      }

      stockVal = shares * p;
      nav = stockVal + cash;
      const bnhNav = (bnhShares * p) + bnhCashRem;

      daily.push({
        date: c.date,
        price: p,
        shares,
        stockValue: stockVal,
        cash,
        totalNav: nav,
        stockRatioPct: nav > 0 ? (stockVal / nav) * 100 : 0,
        bnhNav,
        action
      });
    }

    // Performance Calculations
    const finalNav = daily[daily.length - 1].totalNav;
    const totalReturnPct = ((finalNav - capital) / capital) * 100;
    const totalProfitThb = finalNav - capital;

    const finalBnhNav = daily[daily.length - 1].bnhNav;
    const bnhReturnPct = ((finalBnhNav - capital) / capital) * 100;
    const bnhProfitThb = finalBnhNav - capital;

    // Max Drawdowns
    let peak = -Infinity;
    let maxDd = 0;
    daily.forEach(d => {
      if (d.totalNav > peak) peak = d.totalNav;
      const dd = ((d.totalNav - peak) / peak) * 100;
      if (dd < maxDd) maxDd = dd;
    });

    let bnhPeak = -Infinity;
    let bnhMaxDd = 0;
    daily.forEach(d => {
      if (d.bnhNav > bnhPeak) bnhPeak = d.bnhNav;
      const dd = ((d.bnhNav - bnhPeak) / bnhPeak) * 100;
      if (dd < bnhMaxDd) bnhMaxDd = dd;
    });

    const newSummary = {
      symbol: 'SCB.BK',
      initialCapital: capital,
      finalNav,
      totalProfitThb,
      totalReturnPct,
      bnhFinalNav: finalBnhNav,
      bnhTotalProfitThb: bnhProfitThb,
      bnhReturnPct,
      maxDrawdownPct: maxDd,
      bnhMaxDrawdownPct: bnhMaxDd,
      drawdownReductionPct: Math.abs(bnhMaxDd) - Math.abs(maxDd),
      totalRebalances: txList.length,
      buyRebalances: buyCount,
      sellRebalances: sellCount,
      harvestedCashTotal: harvestedTotal,
      currentHolding: {
        shares,
        stockValue: daily[daily.length - 1].stockValue,
        cash: daily[daily.length - 1].cash,
        stockRatioPct: daily[daily.length - 1].stockRatioPct,
        lastPrice: candles[N - 1].close
      },
      transactions: txList
    };

    // Update Visuals
    candleSeries.setMarkers(markers);
    updateEquityData(daily);
    renderMetrics(newSummary);
    renderTransactions(txList);

    return newSummary;
  }

  // Initial Run with Default Parameters
  simulateRebalance(1000000, 0.50, 5.0);

  // Strategy Presets
  const presetBtns = document.querySelectorAll('.preset-btn');
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const preset = btn.getAttribute('data-preset');

      if (preset === 'balanced') {
        document.getElementById('inputTargetRatio').value = 50;
        document.getElementById('inputBand').value = 5;
      } else if (preset === 'conservative') {
        document.getElementById('inputTargetRatio').value = 30;
        document.getElementById('inputBand').value = 4;
      } else if (preset === 'aggressive') {
        document.getElementById('inputTargetRatio').value = 70;
        document.getElementById('inputBand').value = 5;
      } else if (preset === 'grid') {
        document.getElementById('inputTargetRatio').value = 50;
        document.getElementById('inputBand').value = 2.5;
      }

      const capital = parseFloat(document.getElementById('inputCapital').value) || 1000000;
      const targetRatio = (parseFloat(document.getElementById('inputTargetRatio').value) || 50) / 100;
      const bandPct = parseFloat(document.getElementById('inputBand').value) || 5;
      simulateRebalance(capital, targetRatio, bandPct);
    });
  });

  // Run Simulator Button Click
  const btnRun = document.getElementById('btnRunSimulator');
  if (btnRun) {
    btnRun.addEventListener('click', () => {
      btnRun.textContent = '⏳ กำลังคำนวณ...';
      setTimeout(() => {
        const capital = parseFloat(document.getElementById('inputCapital').value) || 1000000;
        const targetRatio = (parseFloat(document.getElementById('inputTargetRatio').value) || 50) / 100;
        const bandPct = parseFloat(document.getElementById('inputBand').value) || 5;
        simulateRebalance(capital, targetRatio, bandPct);
        btnRun.textContent = '⚡ คำนวณจำลองพอร์ต Rebalance';
      }, 100);
    });
  }
}
