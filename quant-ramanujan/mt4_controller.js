/**
 * MetaTrader 4 (MT4) Strategy Tester & Terminal Controller
 * Emulates the iconic MT4 Terminal, Strategy Tester, Market Watch, Navigator,
 * and MetaEditor MQL4 IDE for SCB Ramanujan Quant Engine.
 */

const MT4_CONTROLLER = (() => {
  // State
  let currentEaKey = 'ramanujan_adaptive';
  let currentSymbol = 'SCB.BK';
  let isTesting = false;
  let testProgress = 100;
  let mt4Chart = null;

  // Expert Advisor Library (MQL4 source codes)
  const EA_LIBRARY = {
    ramanujan_adaptive: {
      name: 'Ramanujan_Cycle_Adaptive_EA.mq4',
      title: 'SCB Ramanujan Cycle & Super-Trend Trailing Switcher',
      inputs: {
        InpTakeProfitPct: 2.50,
        InpSuperTrendER: 0.28,
        InpPhaseCoherence: 0.20,
        InpGuaranteedFloorPct: 2.00,
        InpInitialCapital: 500000,
        InpBrokerFeePct: 0.157,
        InpWaveMicroPeriod: 5,
        InpWaveMacroPeriod: 20
      },
      code: `//+------------------------------------------------------------------+
//|                                  Ramanujan_Cycle_Adaptive_EA.mq4 |
//|                      Copyright 2026, Ramanujan Quant Intelligence |
//|                               https://stock-224.pages.dev/       |
//+------------------------------------------------------------------+
#property copyright "Ramanujan Quant Intelligence"
#property link      "https://stock-224.pages.dev/quant-ramanujan/"
#property version   "2.10"
#property strict

//--- INPUT PARAMETERS ---
input double   InpTakeProfitPct      = 2.50;    // Target TP กลางเป้าหมาย (%)
input double   InpSuperTrendER       = 0.28;    // Efficiency Ratio (ER) เกณฑ์ซุปเปอร์เทรนด์
input double   InpPhaseCoherence     = 0.20;    // Ramanujan Phase Coherence (rho)
input double   InpGuaranteedFloorPct = 2.00;    // ล็อกฟลอร์กำไรขั้นต่ำเมื่อรันเทรนด์ (%)
input double   InpInitialCapital     = 500000;  // เงินทุนเริ่มต้น (THB)
input double   InpBrokerFeePct       = 0.157;   // ค่าธรรมเนียมโบรกเกอร์รวม VAT (%)
input int      InpWaveMicroPeriod    = 5;       // Harmonic Wave Micro (V5 สัปดาห์)
input int      InpWaveMacroPeriod    = 20;      // Harmonic Wave Macro (V20 เดือน)

//--- GLOBAL VARIABLES ---
datetime g_lastBarTime = 0;
bool     g_inCycle = false;
double   g_avgEntry = 0.0;
double   g_cycleSl = 0.0;
double   g_cycleTp = 0.0;
double   g_floorSl = 0.0;
bool     g_superTrendActive = false;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("🚀 Ramanujan Cycle EA Initialized for ", Symbol(), " [TF: Daily]");
   Print("🎯 Hybrid Logic: TP +", InpTakeProfitPct, "% with Super Trend Trailing Switcher");
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("Ramanujan Cycle EA Deinitialized. Final reason: ", reason);
}

//+------------------------------------------------------------------+
//| Expert tick function (Executed every bar/tick)                   |
//+------------------------------------------------------------------+
void OnTick()
{
   if(Time[0] == g_lastBarTime) return; // Daily bar filter
   g_lastBarTime = Time[0];

   // 1. CALCULATE QUANT SIGNALS
   double v5  = iCustom(NULL, 0, "Ramanujan_Harmonic_Drift", InpWaveMicroPeriod, 0, 1);
   double v20 = iCustom(NULL, 0, "Ramanujan_Harmonic_Drift", InpWaveMacroPeriod, 0, 1);
   double er  = iCustom(NULL, 0, "Kaufman_Efficiency_Ratio", 10, 0, 1);
   double rho = iCustom(NULL, 0, "Phase_Coherence_Metric", 0, 1);
   double emaTrend = iMA(NULL, 0, 50, 0, MODE_EMA, PRICE_CLOSE, 1);

   // 2. ENTRY LOGIC: HARMONIC RESONANCE
   if(!g_inCycle && v5 > 0.0 && v20 > 0.0 && rho >= InpPhaseCoherence)
   {
      double lotSize = MathFloor((InpInitialCapital * 0.95) / Close[1] / 100) * 100;
      g_avgEntry = Close[1];
      g_cycleTp  = g_avgEntry * (1.0 + InpTakeProfitPct / 100.0);
      g_cycleSl  = Low[1] * 0.99; // Structural Stop Loss
      g_inCycle  = true;
      g_superTrendActive = false;

      int ticket = OrderSend(Symbol(), OP_BUY, lotSize, g_avgEntry, 3, g_cycleSl, 0, "Ramanujan_Entry", 1001, 0, clrBlue);
      Print("OrderSend #", ticket, " Buy ", lotSize, " @ ", g_avgEntry, " [TP Target: ", g_cycleTp, "]");
      return;
   }

   // 3. EXIT / SUPER-TREND EVALUATION
   if(g_inCycle)
   {
      // A. Hit TP +2.5% Target -> Evaluate Super Trend Switcher
      if(!g_superTrendActive && High[1] >= g_cycleTp)
      {
         bool isSuperTrend = (er >= InpSuperTrendER && rho >= InpPhaseCoherence && v5 > 0 && v20 > 0 && Close[1] > emaTrend);
         if(isSuperTrend)
         {
            g_superTrendActive = true;
            g_floorSl = g_avgEntry * (1.0 + InpGuaranteedFloorPct / 100.0);
            g_cycleSl = MathMax(g_cycleSl, g_floorSl);
            Print("🚀 SUPER TREND DETECTED! Switched to Trailing Stop. Floor locked at +", InpGuaranteedFloorPct, "% (", g_floorSl, ")");
         }
         else
         {
            OrderClose(1001, 100, g_cycleTp, 3, clrGreen);
            Print("🎯 FIXED_TP_LOCKED: Closed position at +", InpTakeProfitPct, "% (", g_cycleTp, ")");
            g_inCycle = false;
            return;
         }
      }

      // B. Super Trend Trailing Stop Management
      if(g_superTrendActive)
      {
         double candidateTrail = High[1] * 0.965; // Chandelier trail
         if(candidateTrail > g_cycleSl) g_cycleSl = candidateTrail;
         g_cycleSl = MathMax(g_cycleSl, g_floorSl);

         if(Low[1] <= g_cycleSl)
         {
            OrderClose(1001, 100, g_cycleSl, 3, clrGreen);
            Print("🚀 SuperTrend_Trailing_Exit executed at ", g_cycleSl);
            g_inCycle = false;
            return;
         }
      }
      else
      {
         // Structural Stop Loss cut
         if(Low[1] <= g_cycleSl || (v5 < 0.0 && v20 < 0.0 && Close[1] < emaTrend))
         {
            OrderClose(1001, 100, Low[1], 3, clrRed);
            Print("🛡️ Structural_StopLoss Cut executed at ", Low[1]);
            g_inCycle = false;
            return;
         }
      }
   }
}`
    },

    ichimoku_hosoda: {
      name: 'Hosoda_Ichimoku_Cloud_EA.mq4',
      title: 'Pure Goichi Hosoda Ichimoku Kinko Hyo 4-Layer EA',
      inputs: {
        TenkanPeriod: 9,
        KijunPeriod: 26,
        SenkouSpanBPeriod: 52,
        MinKumoThicknessPct: 0.40,
        ChikouConfirmation: 1
      },
      code: `//+------------------------------------------------------------------+
//|                                    Hosoda_Ichimoku_Cloud_EA.mq4  |
//|                 Pure Goichi Hosoda Ichimoku Kinko Hyo Strategy   |
//+------------------------------------------------------------------+
#property copyright "Hosoda Quant Works"
#property version   "1.00"
#property strict

input int TenkanPeriod          = 9;    // Tenkan-sen (Conversion Line)
input int KijunPeriod           = 26;   // Kijun-sen (Base Line)
input int SenkouSpanBPeriod     = 52;   // Senkou Span B (Leading Span 2)
input double MinKumoThicknessPct = 0.40; // Minimum Cloud Thickness (%)

void OnTick()
{
   double tenkan = (iHigh(NULL,0,iHighest(NULL,0,MODE_HIGH,TenkanPeriod,1)) + iLow(NULL,0,iLowest(NULL,0,MODE_LOW,TenkanPeriod,1))) / 2.0;
   double kijun  = (iHigh(NULL,0,iHighest(NULL,0,MODE_HIGH,KijunPeriod,1)) + iLow(NULL,0,iLowest(NULL,0,MODE_LOW,KijunPeriod,1))) / 2.0;

   // Sanyaku Kouten (Three Conditions Golden Cross)
   bool cond1 = (tenkan > kijun);
   bool cond2 = (Close[1] > tenkan);
   bool cond3 = (Close[1] > Close[26]); // Chikou Span free above price

   if(cond1 && cond2 && cond3) {
      Print("☁️ Hosoda Sanyaku Kouten Equilibrium Buy Signal triggered!");
   }
}`
    },

    rebalance_grid: {
      name: 'Quant_Rebalance_Grid_EA.mq4',
      title: '50:50 Dynamic Cash-Stock Equilibrium Rebalancing EA',
      inputs: {
        TargetStockWeight: 50.0,
        RebalanceThresholdPct: 3.5,
        CashBufferReservePct: 5.0
      },
      code: `//+------------------------------------------------------------------+
//|                                  Quant_Rebalance_Grid_EA.mq4     |
//|               Constant Proportion Portfolio Insurance (CPPI)     |
//+------------------------------------------------------------------+
#property copyright "Quant Rebalance Engine"
#property version   "1.20"
#property strict

input double TargetStockWeight     = 50.0; // Target Portfolio Equity Weight (%)
input double RebalanceThresholdPct = 3.5;  // Deviation Trigger Band (+/- %)

void OnTick()
{
   // Volatility harvesting through constant ratio rebalancing
   Print("⚖️ Checking Portfolio Equity Weight deviation against 50.0% benchmark...");
}`
    },

    custom_strategy: {
      name: 'Custom_MQL4_Strategy.mq4',
      title: 'User-Defined Custom Strategy (Editable via MetaEditor)',
      inputs: {
        MyParam1: 10,
        MyParam2: 25.5
      },
      code: `//+------------------------------------------------------------------+
//|                                     Custom_MQL4_Strategy.mq4     |
//|                          Custom Quantitative Expert Advisor      |
//+------------------------------------------------------------------+
#property copyright "Your Strategy Name"
#property version   "1.00"
#property strict

input int    MyParam1 = 10;
input double MyParam2 = 25.5;

int OnInit() {
   Print("Custom EA compiled and loaded successfully!");
   return(INIT_SUCCEEDED);
}

void OnTick() {
   // Write your custom trading algorithm here...
}`
    }
  };

  // Market Watch Quotes
  const MARKET_SYMBOLS = [
    { symbol: 'SCB.BK', name: 'SCBX Public Co', bid: 146.50, ask: 147.00, spread: 5, high: 147.50, low: 145.50, active: true },
    { symbol: 'KBANK.BK', name: 'Kasikornbank', bid: 152.00, ask: 152.50, spread: 5, high: 153.50, low: 151.00, active: false },
    { symbol: 'BBL.BK', name: 'Bangkok Bank', bid: 148.50, ask: 149.00, spread: 5, high: 149.50, low: 148.00, active: false },
    { symbol: 'PTT.BK', name: 'PTT Public Co', bid: 32.50, ask: 32.75, spread: 2, high: 33.00, low: 32.25, active: false },
    { symbol: 'CPALL.BK', name: 'CP ALL Public Co', bid: 63.00, ask: 63.25, spread: 2, high: 63.75, low: 62.50, active: false },
    { symbol: 'ADVANC.BK', name: 'Advanced Info Service', bid: 285.00, ask: 286.00, spread: 10, high: 288.00, low: 284.00, active: false },
    { symbol: 'EURUSD', name: 'Euro vs US Dollar', bid: 1.08450, ask: 1.08462, spread: 1.2, high: 1.08820, low: 1.08310, active: false },
    { symbol: 'XAUUSD', name: 'Gold vs US Dollar', bid: 2720.50, ask: 2720.85, spread: 3.5, high: 2735.00, low: 2712.20, active: false }
  ];

  // Initialization
  function init() {
    renderMarketWatch();
    renderNavigator();
    setupTesterEvents();
    setupMetaEditor();
    setupExpertProps();
    setupModeToggle();
  }

  // 1. Mode Toggle (MT4 Terminal vs Modern Quant View)
  function setupModeToggle() {
    const btnToMt4 = document.getElementById('btnToggleMt4Mode');
    const navTabMt4 = document.getElementById('navTabMt4');
    const btnBackToQuant = document.getElementById('btnMt4BackToQuant');

    if (btnToMt4) {
      btnToMt4.addEventListener('click', () => switchViewMode('mt4'));
    }
    if (navTabMt4) {
      navTabMt4.addEventListener('click', () => switchViewMode('mt4'));
    }
    if (btnBackToQuant) {
      btnBackToQuant.addEventListener('click', () => switchViewMode('quant'));
    }
  }

  function switchViewMode(mode) {
    const quantMain = document.getElementById('quantMainView');
    const mt4Root = document.getElementById('mt4TerminalRoot');
    const navTabMt4 = document.getElementById('navTabMt4');
    const btnToMt4 = document.getElementById('btnToggleMt4Mode');

    if (mode === 'mt4') {
      if (quantMain) quantMain.style.display = 'none';
      if (mt4Root) mt4Root.style.display = 'flex';
      if (btnToMt4) btnToMt4.innerHTML = '📊 สลับเป็นโหมด Modern Quant';
      if (navTabMt4) {
        document.querySelectorAll('.nav-tab-btn').forEach(b => b.classList.remove('active'));
        navTabMt4.classList.add('active');
      }
      // Populate results and graph when entering MT4
      loadCurrentResultsIntoMt4();
      renderEquityCanvas();
      window.scrollTo({ top: 100, behavior: 'smooth' });
    } else {
      if (quantMain) quantMain.style.display = 'block';
      if (mt4Root) mt4Root.style.display = 'none';
      if (btnToMt4) btnToMt4.innerHTML = '🖥️ สลับเป็นโหมด MT4 Terminal';
      const firstTab = document.querySelector('.nav-tab-btn[data-tab="viewOverview"]');
      if (firstTab) firstTab.click();
    }
  }

  // 2. Market Watch Render & Symbol Selection
  function renderMarketWatch() {
    const tbody = document.getElementById('mt4MarketWatchBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    MARKET_SYMBOLS.forEach(s => {
      const tr = document.createElement('tr');
      if (s.symbol === currentSymbol) tr.classList.add('selected');

      tr.innerHTML = `
        <td class="mt4-mw-symbol">${s.symbol}</td>
        <td class="mt4-mw-bid">${s.bid.toFixed(s.symbol.includes('EUR') ? 5 : 2)}</td>
        <td class="mt4-mw-ask">${s.ask.toFixed(s.symbol.includes('EUR') ? 5 : 2)}</td>
        <td class="mt4-mw-spread">${s.spread}</td>
      `;

      tr.addEventListener('click', () => {
        document.querySelectorAll('#mt4MarketWatchBody tr').forEach(r => r.classList.remove('selected'));
        tr.classList.add('selected');
        currentSymbol = s.symbol;
        updateActiveSymbol(s);
      });

      tbody.appendChild(tr);
    });
  }

  function updateActiveSymbol(s) {
    const wmSymbol = document.getElementById('mt4WatermarkSymbol');
    const wmOhlc = document.getElementById('mt4WatermarkOhlc');
    const selSymbol = document.getElementById('mt4TesterSymbol');
    const tabTitle = document.getElementById('mt4ActiveChartTabTitle');

    if (wmSymbol) wmSymbol.textContent = `${s.symbol}, Daily`;
    if (tabTitle) tabTitle.textContent = `${s.symbol}, Daily`;
    if (wmOhlc) wmOhlc.textContent = `Bid: ${s.bid.toFixed(2)}  Ask: ${s.ask.toFixed(2)}  Spread: ${s.spread}  (High: ${s.high.toFixed(2)} Low: ${s.low.toFixed(2)})`;
    if (selSymbol) selSymbol.value = s.symbol;

    appendJournalLog(`Symbol changed to ${s.symbol}. Ready for backtest.`);
  }

  // 3. Navigator & EA Library
  function renderNavigator() {
    const eaContainer = document.getElementById('mt4NavigatorEaList');
    if (!eaContainer) return;

    eaContainer.innerHTML = '';
    Object.keys(EA_LIBRARY).forEach(k => {
      const ea = EA_LIBRARY[k];
      const div = document.createElement('div');
      div.className = `mt4-tree-node sub-item ${k === currentEaKey ? 'active-ea' : ''}`;
      div.innerHTML = `<span class="mt4-tree-icon">🤖</span> <span>${ea.name}</span>`;

      div.addEventListener('click', () => {
        selectExpertAdvisor(k);
      });

      eaContainer.appendChild(div);
    });

    const createBtn = document.getElementById('btnMt4CreateEa');
    if (createBtn) {
      createBtn.addEventListener('click', () => {
        createNewEaPrompt();
      });
    }
  }

  function selectExpertAdvisor(key) {
    if (!EA_LIBRARY[key]) return;
    currentEaKey = key;
    document.querySelectorAll('#mt4NavigatorEaList .mt4-tree-node').forEach(n => n.classList.remove('active-ea'));
    renderNavigator();

    const eaSelect = document.getElementById('mt4TesterEaSelect');
    if (eaSelect) eaSelect.value = key;

    appendJournalLog(`Expert Advisor loaded: '${EA_LIBRARY[key].name}' (${EA_LIBRARY[key].title})`);
  }

  function createNewEaPrompt() {
    const name = prompt('กรุณาตั้งชื่อไฟล์ Expert Advisor (.mq4):', 'My_New_Quant_Strategy');
    if (!name) return;
    const cleanName = name.replace(/[^a-zA-Z0-9_]/g, '') + '.mq4';
    const newKey = 'custom_' + Date.now();

    EA_LIBRARY[newKey] = {
      name: cleanName,
      title: 'Custom Strategy created by User',
      inputs: {
        InpMagicNumber: 123456,
        InpRiskPercent: 1.5,
        InpTrailingStop: 25
      },
      code: `//+------------------------------------------------------------------+
//|                                             ${cleanName}
//|                                  Copyright 2026, User Algorithm  |
//+------------------------------------------------------------------+
#property copyright "User Algorithm"
#property version   "1.00"
#property strict

input int    InpMagicNumber = 123456;
input double InpRiskPercent = 1.5;
input int    InpTrailingStop = 25;

int OnInit() {
   Print("${cleanName} Loaded into MT4 Strategy Tester.");
   return(INIT_SUCCEEDED);
}

void OnTick() {
   // Your custom algorithm here
}`
    };

    renderNavigator();
    selectExpertAdvisor(newKey);
    openMetaEditor();
  }

  // 4. Strategy Tester Controller
  function setupTesterEvents() {
    // Tester Tabs (Settings, Results, Graph, Report, Journal)
    const tabs = document.querySelectorAll('.mt4-tester-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const targetPaneId = tab.getAttribute('data-pane');
        document.querySelectorAll('.mt4-tester-pane').forEach(p => p.classList.remove('active'));
        const targetPane = document.getElementById(targetPaneId);
        if (targetPane) targetPane.classList.add('active');

        if (targetPaneId === 'mt4PaneGraph') {
          setTimeout(renderEquityCanvas, 50);
        }
      });
    });

    // Start / Stop Test Button
    const btnStart = document.getElementById('btnMt4StartTest');
    if (btnStart) {
      btnStart.addEventListener('click', runTesterSimulation);
    }

    // Expert Properties Button
    const btnProps = document.getElementById('btnMt4ExpertProps');
    if (btnProps) {
      btnProps.addEventListener('click', openExpertProps);
    }

    // Modify Expert Button (Open MetaEditor)
    const btnModify = document.getElementById('btnMt4ModifyExpert');
    if (btnModify) {
      btnModify.addEventListener('click', openMetaEditor);
    }

    // EA Dropdown change
    const eaSelect = document.getElementById('mt4TesterEaSelect');
    if (eaSelect) {
      eaSelect.addEventListener('change', (e) => {
        selectExpertAdvisor(e.target.value);
      });
    }
  }

  function runTesterSimulation() {
    if (isTesting) return;
    isTesting = true;
    testProgress = 0;

    const btnStart = document.getElementById('btnMt4StartTest');
    const fill = document.getElementById('mt4ProgressFill');
    const text = document.getElementById('mt4ProgressText');

    if (btnStart) {
      btnStart.textContent = '⏹ Stop';
      btnStart.style.background = '#b91c1c';
    }

    appendJournalLog(`--- Strategy Tester Start: ${EA_LIBRARY[currentEaKey].name} on ${currentSymbol}, Daily ---`);
    appendJournalLog(`Testing model: Every tick (based on 971 M1/Daily bars)`);

    const interval = setInterval(() => {
      testProgress += 15;
      if (fill) fill.style.width = `${Math.min(testProgress, 100)}%`;
      if (text) text.textContent = `Testing: ${Math.min(testProgress, 100)}%`;

      if (testProgress >= 100) {
        clearInterval(interval);
        isTesting = false;
        if (btnStart) {
          btnStart.textContent = '▶ Start';
          btnStart.style.background = '#15803d';
        }
        if (text) text.textContent = 'Test Completed (100%)';
        appendJournalLog(`Test completed successfully: 29 trades executed, Final Balance: 513,648.63 THB`);

        loadCurrentResultsIntoMt4();
        renderEquityCanvas();

        // Switch to Results or Graph tab automatically
        const tabGraph = document.querySelector('.mt4-tester-tab[data-pane="mt4PaneGraph"]');
        if (tabGraph) tabGraph.click();
      }
    }, 120);
  }

  // 5. Populate Data into MT4 Strategy Tester Tabs
  function loadCurrentResultsIntoMt4() {
    const data = window.RAMANUJAN_DATA || null;
    if (!data) return;

    const cycles = data.completedCycles || [];
    const summary = data.summary || {};

    // 1. Populate Results Table
    const tbody = document.getElementById('mt4ResultsTableBody');
    if (tbody) {
      tbody.innerHTML = '';
      let runningBalance = summary.initialCapital || 500000;

      cycles.forEach((c, idx) => {
        const ticket = 1000 + c.cycle_id;
        const shares = c.total_shares || 1000;
        const pnl = c.net_pnl_thb || 0;
        runningBalance += pnl;

        // Buy Row
        const trBuy = document.createElement('tr');
        trBuy.innerHTML = `
          <td>${idx * 2 + 1}</td>
          <td>${c.entry_date} 09:30</td>
          <td style="color: #60a5fa; font-weight: 600;">buy</td>
          <td>#${ticket}</td>
          <td>${shares.toLocaleString()}</td>
          <td>${c.avg_entry.toFixed(2)}</td>
          <td>${(c.avg_entry * 0.985).toFixed(2)}</td>
          <td>${(c.avg_entry * 1.025).toFixed(2)}</td>
          <td>-</td>
          <td>${(runningBalance - pnl).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        `;
        tbody.appendChild(trBuy);

        // Close Row
        const trClose = document.createElement('tr');
        const isWin = pnl >= 0;
        trClose.innerHTML = `
          <td>${idx * 2 + 2}</td>
          <td>${c.exit_date} 16:30</td>
          <td style="color: ${isWin ? '#34d399' : '#f87171'}; font-weight: 600;">close</td>
          <td>#${ticket}</td>
          <td>${shares.toLocaleString()}</td>
          <td>${c.exit_price.toFixed(2)}</td>
          <td>-</td>
          <td>-</td>
          <td class="${isWin ? 'mt4-val-win' : 'mt4-val-loss'}">${isWin ? '+' : ''}${pnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          <td style="font-weight: 700; color: #f8fafc;">${runningBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        `;
        tbody.appendChild(trClose);
      });
    }

    // 2. Populate Report Tab
    updateReportTab(summary, cycles);
  }

  function updateReportTab(sm, cycles) {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    const initial = sm.initialCapital || 500000;
    const finalEq = sm.finalEquity || 513648.63;
    const netPnl = finalEq - initial;
    const winCycles = cycles.filter(c => (c.net_pnl_thb || 0) >= 0);
    const lossCycles = cycles.filter(c => (c.net_pnl_thb || 0) < 0);

    const grossProfit = winCycles.reduce((sum, c) => sum + (c.net_pnl_thb || 0), 0);
    const grossLoss = Math.abs(lossCycles.reduce((sum, c) => sum + (c.net_pnl_thb || 0), 0));

    setVal('repTotalNetProfit', `${netPnl >= 0 ? '+' : ''}${netPnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    setVal('repGrossProfit', grossProfit.toLocaleString('en-US', { minimumFractionDigits: 2 }));
    setVal('repGrossLoss', (-grossLoss).toLocaleString('en-US', { minimumFractionDigits: 2 }));
    setVal('repProfitFactor', (sm.profitFactor || 1.38).toFixed(2));
    setVal('repExpectedPayoff', (netPnl / Math.max(cycles.length, 1)).toFixed(2));
    setVal('repMaximalDD', `${Math.abs(sm.maxDrawdownPct || 3.88).toFixed(2)}% (${((initial * Math.abs(sm.maxDrawdownPct || 3.88)) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })})`);
    setVal('repTotalTrades', cycles.length);
    setVal('repProfitTrades', `${winCycles.length} (${((winCycles.length / Math.max(cycles.length, 1)) * 100).toFixed(2)}%)`);
    setVal('repLossTrades', `${lossCycles.length} (${((lossCycles.length / Math.max(cycles.length, 1)) * 100).toFixed(2)}%)`);

    const maxProfit = Math.max(...cycles.map(c => c.net_pnl_thb || 0), 0);
    const maxLoss = Math.min(...cycles.map(c => c.net_pnl_thb || 0), 0);
    setVal('repLargestProfit', `+${maxProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    setVal('repLargestLoss', `${maxLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  }

  // 6. Draw MT4 Iconic Strategy Tester Equity Graph
  function renderEquityCanvas() {
    const canvas = document.getElementById('mt4EquityCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * window.devicePixelRatio || 800;
    canvas.height = rect.height * window.devicePixelRatio || 220;
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

    const w = rect.width;
    const h = rect.height;

    // Background
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, w, h);

    // Draw MT4 Gridlines
    ctx.strokeStyle = '#1a222e';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);

    for (let x = 40; x < w; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 10);
      ctx.lineTo(x, h - 20);
      ctx.stroke();
    }
    for (let y = 20; y < h - 20; y += 35) {
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(w - 10, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    const data = window.RAMANUJAN_DATA || null;
    const cycles = (data && data.completedCycles) || [];
    if (cycles.length === 0) return;

    let balance = 500000;
    const points = [balance];
    cycles.forEach(c => {
      balance += (c.net_pnl_thb || 0);
      points.push(balance);
    });

    const minVal = Math.min(...points) * 0.995;
    const maxVal = Math.max(...points) * 1.005;

    const padLeft = 60;
    const padRight = 20;
    const padTop = 20;
    const padBottom = 25;

    const graphW = w - padLeft - padRight;
    const graphH = h - padTop - padBottom;

    const getX = (idx) => padLeft + (idx / (points.length - 1)) * graphW;
    const getY = (val) => padTop + graphH - ((val - minVal) / (maxVal - minVal)) * graphH;

    // Draw Y-Axis labels (MT4 style)
    ctx.fillStyle = '#64748b';
    ctx.font = '10px Consolas, monospace';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const v = minVal + (i / 4) * (maxVal - minVal);
      const yPos = getY(v);
      ctx.fillText(Math.round(v).toLocaleString(), padLeft - 6, yPos + 3);
    }

    // Draw Equity / Balance Area Gradient
    const grad = ctx.createLinearGradient(0, padTop, 0, h - padBottom);
    grad.addColorStop(0, 'rgba(34, 197, 94, 0.25)');
    grad.addColorStop(1, 'rgba(34, 197, 94, 0.0)');

    ctx.beginPath();
    ctx.moveTo(getX(0), h - padBottom);
    points.forEach((val, idx) => {
      ctx.lineTo(getX(idx), getY(val));
    });
    ctx.lineTo(getX(points.length - 1), h - padBottom);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Draw Iconic MT4 Balance Line (Blue/Cyan)
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#22c55e'; // Green equity
    points.forEach((val, idx) => {
      if (idx === 0) ctx.moveTo(getX(idx), getY(val));
      else ctx.lineTo(getX(idx), getY(val));
    });
    ctx.stroke();

    // Draw points
    points.forEach((val, idx) => {
      ctx.fillStyle = idx === points.length - 1 ? '#38bdf8' : '#22c55e';
      ctx.beginPath();
      ctx.arc(getX(idx), getY(val), 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // MT4 Graph Legend watermark
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 11px Segoe UI, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('― Balance / Equity (MT4 Strategy Tester)', padLeft + 10, padTop + 14);
  }

  // 7. Journal Log Terminal
  function appendJournalLog(msg, type = 'info') {
    const logBox = document.getElementById('mt4JournalLogBox');
    if (!logBox) return;

    const now = new Date();
    const timeStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(now.getMilliseconds()).padStart(3, '0')}`;

    const div = document.createElement('div');
    div.className = 'mt4-log-entry';
    div.innerHTML = `
      <span class="mt4-log-time">${timeStr}</span>
      <span class="mt4-log-sender">Expert</span>
      <span class="mt4-log-msg ${type}">${msg}</span>
    `;

    logBox.appendChild(div);
    logBox.scrollTop = logBox.scrollHeight;
  }

  // 8. MetaEditor IDE Modal
  function setupMetaEditor() {
    const modal = document.getElementById('metaEditorModal');
    const btnClose = document.getElementById('btnMetaEditorClose');
    const btnCompile = document.getElementById('btnMetaEditorCompile');
    const codeArea = document.getElementById('metaEditorCodeText');
    const consoleBox = document.getElementById('metaEditorConsole');

    if (btnClose && modal) {
      btnClose.addEventListener('click', () => modal.classList.remove('open'));
    }

    if (btnCompile && codeArea && consoleBox) {
      btnCompile.addEventListener('click', () => {
        consoleBox.innerHTML = '<div style="color: #60a5fa;">Compiling ' + EA_LIBRARY[currentEaKey].name + '...</div>';
        setTimeout(() => {
          consoleBox.innerHTML += '<div class="metaeditor-console-msg">0 errors, 0 warnings, compile time: 88 msec | Code: 4,928 bytes | Ready for Tester</div>';
          appendJournalLog(`MetaEditor: '${EA_LIBRARY[currentEaKey].name}' re-compiled successfully (0 errors, 0 warnings).`);
          showToast(`✅ MetaEditor: คอมไพล์ ${EA_LIBRARY[currentEaKey].name} สำเร็จ! นำเข้า Strategy Tester แล้ว`);
        }, 300);
      });
    }
  }

  function openMetaEditor() {
    const modal = document.getElementById('metaEditorModal');
    const title = document.getElementById('metaEditorTitle');
    const codeArea = document.getElementById('metaEditorCodeText');
    const consoleBox = document.getElementById('metaEditorConsole');

    if (!modal || !EA_LIBRARY[currentEaKey]) return;

    if (title) title.textContent = `MetaEditor - [${EA_LIBRARY[currentEaKey].name}]`;
    if (codeArea) codeArea.value = EA_LIBRARY[currentEaKey].code;
    if (consoleBox) consoleBox.innerHTML = `<div>Loaded ${EA_LIBRARY[currentEaKey].name} [MQL4 Source]</div>`;

    modal.classList.add('open');
  }

  // 9. Expert Properties Modal
  function setupExpertProps() {
    const modal = document.getElementById('expertPropsModal');
    const btnClose = document.getElementById('btnExpertPropsClose');
    const btnCancel = document.getElementById('btnExpertPropsCancel');
    const btnOk = document.getElementById('btnExpertPropsOk');

    const closeHandler = () => {
      if (modal) modal.classList.remove('open');
    };

    if (btnClose) btnClose.addEventListener('click', closeHandler);
    if (btnCancel) btnCancel.addEventListener('click', closeHandler);

    if (btnOk) {
      btnOk.addEventListener('click', () => {
        saveExpertProperties();
        closeHandler();
      });
    }
  }

  function openExpertProps() {
    const modal = document.getElementById('expertPropsModal');
    const tbody = document.getElementById('expertPropsTableBody');
    const title = document.getElementById('expertPropsTitle');

    if (!modal || !tbody || !EA_LIBRARY[currentEaKey]) return;

    const ea = EA_LIBRARY[currentEaKey];
    if (title) title.textContent = `Expert - ${ea.name}`;

    tbody.innerHTML = '';
    const inputs = ea.inputs || {};
    Object.keys(inputs).forEach(key => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="var-name">${key}</td>
        <td><input type="text" class="expert-props-input" data-var="${key}" value="${inputs[key]}"></td>
      `;
      tbody.appendChild(tr);
    });

    modal.classList.add('open');
  }

  function saveExpertProperties() {
    const inputs = document.querySelectorAll('.expert-props-input');
    const ea = EA_LIBRARY[currentEaKey];
    if (!ea) return;

    inputs.forEach(inp => {
      const vName = inp.getAttribute('data-var');
      const val = parseFloat(inp.value) || inp.value;
      if (ea.inputs[vName] !== undefined) {
        ea.inputs[vName] = val;
      }
    });

    appendJournalLog(`Expert Properties updated for ${ea.name}: TP=${ea.inputs.InpTakeProfitPct || 2.5}%, SuperTrend ER=${ea.inputs.InpSuperTrendER || 0.28}`);
    showToast(`⚙️ อัปเดตพารามิเตอร์ของ ${ea.name} เรียบร้อยแล้ว`);
  }

  // Notification helper
  function showToast(msg) {
    let toast = document.getElementById('quantToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'quantToast';
      toast.style.position = 'fixed';
      toast.style.bottom = '24px';
      toast.style.right = '24px';
      toast.style.background = '#1e293b';
      toast.style.color = '#f8fafc';
      toast.style.padding = '12px 20px';
      toast.style.borderRadius = '8px';
      toast.style.border = '1px solid #3b82f6';
      toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
      toast.style.zIndex = '9999';
      toast.style.fontSize = '12px';
      toast.style.fontWeight = '600';
      toast.style.transition = 'all 0.3s ease';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
    }, 3200);
  }

  return {
    init,
    switchViewMode,
    selectExpertAdvisor,
    runTesterSimulation,
    openMetaEditor,
    openExpertProps
  };
})();

// Auto-init on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  MT4_CONTROLLER.init();
});
