/**
 * Ramanujan Quant Lab Interactive Charts & Dashboard
 * Features:
 * - Pure Mathematical Cycle Wave Analysis (Ramanujan Sums)
 * - Live Signal Tracker (Current active market position)
 * - Client-side Interactive Backtest Simulator with Custom Parameters
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
  let currentSummary = data.summary;

  // Initialize TradingView Candlestick Chart
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

  // Prepare candle data
  const candleData = candles.map(c => ({
    time: c.date,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close
  }));
  candleSeries.setData(candleData);

  // Initialize Ramanujan Cycle Wave Sub-Chart
  const waveContainer = document.getElementById('waveChartContainer');
  const waveChart = LightweightCharts.createChart(waveContainer, {
    width: waveContainer.clientWidth || 800,
    height: 180,
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

  const waveLineSeries = waveChart.addBaselineSeries({
    baseValue: { type: 'price', price: 0 },
    topLineColor: '#3b82f6',
    topFillColor1: 'rgba(59, 130, 246, 0.28)',
    topFillColor2: 'rgba(59, 130, 246, 0.02)',
    bottomLineColor: '#10b981',
    bottomFillColor1: 'rgba(16, 185, 129, 0.02)',
    bottomFillColor2: 'rgba(16, 185, 129, 0.28)',
    lineWidth: 2
  });

  const waveData = candles.map(c => ({
    time: c.date,
    value: c.wave || 0
  }));
  waveLineSeries.setData(waveData);

  // Synchronize time scales
  priceChart.timeScale().subscribeVisibleTimeRangeChange((range) => {
    if (range) waveChart.timeScale().setVisibleRange(range);
  });
  waveChart.timeScale().subscribeVisibleTimeRangeChange((range) => {
    if (range) priceChart.timeScale().setVisibleRange(range);
  });

  priceChart.timeScale().fitContent();
  waveChart.timeScale().fitContent();

  window.addEventListener('resize', () => {
    priceChart.applyOptions({ width: priceContainer.clientWidth });
    waveChart.applyOptions({ width: waveContainer.clientWidth });
  });

  // Time Range Controls
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

  // Helper: Update Metrics Cards
  function renderMetrics(summary) {
    if (!summary) return;
    document.getElementById('mSymbol').textContent = summary.symbol || 'SCB.BK';
    if (topCycles.length > 0) {
      document.getElementById('mCycle').textContent = `~${topCycles[0].period} วัน`;
    }
    document.getElementById('mWinRate').textContent = `${summary.winRatePct}%`;
    document.getElementById('mWinTrades').textContent = `${summary.winTrades} ชนะ / ${summary.lossTrades} แพ้ (รวม ${summary.totalTrades} รอบ)`;
    const retEl = document.getElementById('mReturn');
    retEl.textContent = `${summary.totalReturnPct >= 0 ? '+' : ''}${summary.totalReturnPct}%`;
    retEl.className = `metric-val ${summary.totalReturnPct >= 0 ? 'text-green' : 'text-red'}`;
    const pfEl = document.getElementById('mProfitFactor');
    if (pfEl) pfEl.textContent = `Profit Factor: ${summary.profitFactor}`;
  }

  // Helper: Update Trade History Table
  function renderTradeHistory(trades) {
    const tableBody = document.getElementById('tradesTableBody');
    if (!tableBody) return;
    if (!trades || trades.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#9ca3af;padding:24px;">ไม่พบรายการเทรดตามเงื่อนไขที่เลือก</td></tr>`;
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

  // Helper: Update Live Signal Banner
  function renderLiveSignal(activePosition, lastCandle) {
    const banner = document.getElementById('liveSignalBanner');
    if (!banner) return;

    if (activePosition && activePosition.status === 'ACTIVE_BUY') {
      document.getElementById('sigBadge').className = 'signal-tag tag-buy';
      document.getElementById('sigBadge').textContent = '🟢 สัญญาณปัจจุบัน: ถือครองสถานะ BUY';
      document.getElementById('sigBuyDate').textContent = activePosition.buyDate;
      document.getElementById('sigBuyPrice').textContent = `฿${activePosition.buyPrice.toFixed(2)}`;
      document.getElementById('sigCurrPrice').textContent = `฿${activePosition.currentPrice.toFixed(2)}`;
      document.getElementById('sigTargetPrice').textContent = `฿${activePosition.takeProfitPrice.toFixed(2)} (+8%)`;
      document.getElementById('sigStopPrice').textContent = `฿${activePosition.stopLossPrice.toFixed(2)} (-5%)`;
      const mom = lastCandle ? lastCandle.momentum : 0;
      document.getElementById('sigWaveStatus').textContent = mom >= 0 ? `กำลังหักหัวขึ้น (+${mom})` : `พักฐาน (${mom})`;
    } else {
      document.getElementById('sigBadge').className = 'signal-tag';
      document.getElementById('sigBadge').style.background = 'rgba(255,255,255,0.08)';
      document.getElementById('sigBadge').style.color = '#9ca3af';
      document.getElementById('sigBadge').textContent = '⚪ สัญญาณปัจจุบัน: รอจังหวะรอบคลื่นใหม่ (WAIT/HOLD)';
      document.getElementById('sigBuyDate').textContent = '-';
      document.getElementById('sigBuyPrice').textContent = '-';
      document.getElementById('sigCurrPrice').textContent = lastCandle ? `฿${lastCandle.close.toFixed(2)}` : '-';
      document.getElementById('sigTargetPrice').textContent = '-';
      document.getElementById('sigStopPrice').textContent = '-';
      document.getElementById('sigWaveStatus').textContent = lastCandle ? `Wave: ${lastCandle.wave}` : '-';
    }
  }

  // Core Simulation Function (runs instantly in client)
  function simulateQuant(buyTh, sellTh, slPct, tpPct) {
    const N = candles.length;
    const markers = [];
    const trades = [];
    let inPos = false;
    let buyPrice = 0;
    let buyDate = '';
    let buyIdx = 0;

    for (let i = 1; i < N; i++) {
      const cPrev = candles[i - 1];
      const cCurr = candles[i];
      const p = cCurr.close;
      const wPrev = cPrev.wave;
      const wCurr = cCurr.wave;
      const mPrev = cPrev.momentum;
      const mCurr = cCurr.momentum;

      // BUY Condition
      const isTurningUp = (wPrev <= buyTh) && (mCurr > 0 && (mPrev <= 0 || wCurr > wPrev + 2));

      // SELL Condition
      const isTurningDown = (wCurr >= sellTh && mCurr < 0);
      const hitStopLoss = inPos && (p <= buyPrice * (1.0 - slPct / 100.0));
      const hitTakeProfit = inPos && (tpPct > 0 && p >= buyPrice * (1.0 + tpPct / 100.0));

      if (!inPos && isTurningUp) {
        inPos = true;
        buyPrice = p;
        buyDate = cCurr.date;
        buyIdx = i;
        markers.push({
          time: cCurr.date,
          position: 'belowBar',
          color: '#10b981',
          shape: 'arrowUp',
          text: `BUY @ ฿${p.toFixed(1)}`,
          size: 2
        });
      } else if (inPos && (isTurningDown || hitStopLoss || hitTakeProfit)) {
        inPos = false;
        const profitPct = Number((((p - buyPrice) / buyPrice) * 100).toFixed(2));
        const holdingDays = i - buyIdx;
        const reason = hitTakeProfit ? 'TAKE_PROFIT' : (hitStopLoss ? 'STOP_LOSS' : 'CYCLE_PEAK');
        trades.push({
          buyDate,
          buyPrice,
          sellDate: cCurr.date,
          sellPrice: p,
          profitPct,
          holdingDays,
          exitReason: reason,
          status: profitPct > 0 ? 'WIN' : 'LOSS'
        });
        markers.push({
          time: cCurr.date,
          position: 'aboveBar',
          color: profitPct > 0 ? '#38bdf8' : '#ef4444',
          shape: 'arrowDown',
          text: `SELL (${profitPct > 0 ? '+' : ''}${profitPct}%)`,
          size: 2
        });
      }
    }

    // Active position
    let activePosition = null;
    if (inPos) {
      const lastP = candles[N - 1].close;
      const unrealizedPct = Number((((lastP - buyPrice) / buyPrice) * 100).toFixed(2));
      activePosition = {
        buyDate,
        buyPrice,
        currentPrice: lastP,
        unrealizedPct,
        holdingDays: N - 1 - buyIdx,
        stopLossPrice: Number((buyPrice * (1.0 - slPct / 100.0)).toFixed(2)),
        takeProfitPrice: Number((buyPrice * (1.0 + tpPct / 100.0)).toFixed(2)),
        status: 'ACTIVE_BUY'
      };
    }

    // Performance summary
    const totalTrades = trades.length;
    const wins = trades.filter(t => t.profitPct > 0);
    const losses = trades.filter(t => t.profitPct <= 0);
    const winRatePct = totalTrades > 0 ? Number(((wins.length / totalTrades) * 100).toFixed(2)) : 0;
    const totalReturnPct = Number((trades.reduce((sum, t) => sum + t.profitPct, 0)).toFixed(2));
    const grossProfit = wins.reduce((sum, t) => sum + t.profitPct, 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.profitPct, 0));
    const profitFactor = grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : grossProfit;

    const summaryResult = {
      symbol: 'SCB.BK',
      totalCandles: N,
      totalTrades,
      winTrades: wins.length,
      lossTrades: losses.length,
      winRatePct,
      totalReturnPct,
      profitFactor,
      trades,
      activePosition
    };

    // Update Chart Markers
    candleSeries.setMarkers(markers);

    // Update UI elements
    renderMetrics(summaryResult);
    renderTradeHistory(trades);
    renderLiveSignal(activePosition, candles[candles.length - 1]);

    return summaryResult;
  }

  // Initial Render from currentSummary or default parameters
  const lastCandle = candles.length > 0 ? candles[candles.length - 1] : null;
  renderMetrics(currentSummary);
  renderTradeHistory(currentSummary ? currentSummary.trades : []);
  renderLiveSignal(currentSummary ? currentSummary.activePosition : null, lastCandle);

  // Markers from initial data
  const initialMarkers = [];
  candles.forEach(c => {
    if (c.signal === 'BUY') {
      initialMarkers.push({
        time: c.date,
        position: 'belowBar',
        color: '#10b981',
        shape: 'arrowUp',
        text: `BUY @ ฿${c.close}`,
        size: 2
      });
    } else if (c.signal === 'SELL') {
      initialMarkers.push({
        time: c.date,
        position: 'aboveBar',
        color: '#ef4444',
        shape: 'arrowDown',
        text: 'SELL',
        size: 2
      });
    }
  });
  candleSeries.setMarkers(initialMarkers);

  // Strategy Presets Event Listeners
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

      const buyTh = parseFloat(document.getElementById('inputBuyTh').value);
      const sellTh = parseFloat(document.getElementById('inputSellTh').value);
      const slPct = parseFloat(document.getElementById('inputSL').value);
      const tpPct = parseFloat(document.getElementById('inputTP').value);
      simulateQuant(buyTh, sellTh, slPct, tpPct);
    });
  });

  // Run Backtest Button Click
  const btnRun = document.getElementById('btnRunBacktest');
  if (btnRun) {
    btnRun.addEventListener('click', () => {
      btnRun.textContent = '⏳ กำลังคำนวณ...';
      setTimeout(() => {
        const buyTh = parseFloat(document.getElementById('inputBuyTh').value);
        const sellTh = parseFloat(document.getElementById('inputSellTh').value);
        const slPct = parseFloat(document.getElementById('inputSL').value);
        const tpPct = parseFloat(document.getElementById('inputTP').value);
        simulateQuant(buyTh, sellTh, slPct, tpPct);
        btnRun.textContent = '⚡ คำนวณสัญญาณ & รัน Backtest';
      }, 100);
    });
  }
}
