/**
 * SCB Daily Intelligence Archive & 2-in-1 Master Database Controller
 * Records 1 master row per trading day, encapsulating both Midday (13:00) & Evening (17:30) sessions
 */

const LOCAL_STORAGE_KEY = 'SCB_RAMANUJAN_JOURNAL_V2';
let currentFilter = 'all';
let searchQuery = '';
let currentPage = 1;
const ITEMS_PER_PAGE = 50;

// In-memory data store
let allDataRecords = [];

document.addEventListener('DOMContentLoaded', () => {
  initArchiveData();
  bindEventHandlers();
  updateKpiSummary();
  renderTable();
});

/**
 * Initialize 1-row-per-day data model by merging historical candles with 2-in-1 journal entries
 */
function initArchiveData() {
  const quantData = window.RAMANUJAN_DATA || {};
  const candles = quantData.candlesWithSignals || [];
  const journalEntries = getJournalEntries();

  // Create lookup map by date
  const journalMap = {};
  journalEntries.forEach(j => {
    journalMap[j.date] = j;
  });

  const records = [];
  const todayStr = quantData.predictiveIntelligence?.lastDate || new Date().toISOString().split('T')[0];
  const pred = quantData.predictiveIntelligence || {};

  // Check if today exists in candles
  const todayInCandles = candles.find(c => c.time === todayStr);

  // If today is in predictiveIntelligence but not in candles, prepend today as the top master row
  if (!todayInCandles && pred.lastDate) {
    const userJ = journalMap[pred.lastDate] || {};
    records.push({
      date: pred.lastDate,
      open: userJ.open || pred.lastPrice || 153.0,
      high: userJ.high || pred.lastPrice || 154.5,
      low: userJ.low || pred.lastPrice || 152.5,
      close: userJ.eveningPrice || pred.lastPrice || 153.5,
      volume: userJ.volume || 12182248,
      middayPrice: userJ.middayPrice || pred.lastPrice || 153.5,
      middayAction: userJ.middayAction || 'TRIGGER_WATCH',
      middayNote: userJ.middayNote || 'ราคาพักตัวรอบเช้า จ่อจุดชนวน ฿154.93',
      eveningPrice: userJ.eveningPrice || pred.lastPrice || 153.5,
      eveningAction: userJ.eveningAction || 'HOLD_CASH',
      eveningNote: userJ.eveningNote || 'รักษาฐานราคา Floor ฿144.05 ได้อย่างสมบูรณ์แบบ',
      v5: '+0.333',
      v20: '+0.901',
      rho: '+0.651',
      delta: `±${(pred.dynamicDeltaPct || 6.16).toFixed(2)}%`,
      signal: 'HOLD',
      signalDetail: 'จ่อจุดชนวน (Inflection Watch)',
      isJournal: !!journalMap[pred.lastDate],
      raw: pred
    });
  }

  // Iterate historical candles in reverse order (newest to oldest)
  for (let i = candles.length - 1; i >= 0; i--) {
    const c = candles[i];
    const userJ = journalMap[c.time] || {};

    const v5Num = typeof c.v_micro === 'number' ? c.v_micro : 0;
    const v20Num = typeof c.v_macro === 'number' ? c.v_macro : 0;
    const rhoNum = typeof c.rho_ram === 'number' ? c.rho_ram : 0;
    const deltaNum = typeof c.dynamic_delta === 'number' ? c.dynamic_delta * 100 : 3.5;

    // For today's candle, ensure midday values reflect today's live quotes
    const isToday = c.time === todayStr;
    const defaultMiddayPrice = isToday && pred.lastPrice ? pred.lastPrice : c.open;

    records.push({
      date: c.time,
      open: userJ.open !== undefined ? userJ.open : c.open,
      high: userJ.high !== undefined ? userJ.high : c.high,
      low: userJ.low !== undefined ? userJ.low : c.low,
      close: userJ.eveningPrice !== undefined ? userJ.eveningPrice : c.close,
      volume: userJ.volume !== undefined ? userJ.volume : c.volume,
      middayPrice: userJ.middayPrice !== undefined ? userJ.middayPrice : defaultMiddayPrice,
      middayAction: userJ.middayAction || (isToday ? 'TRIGGER_WATCH' : 'HOLD_CASH'),
      middayNote: userJ.middayNote || '',
      eveningPrice: userJ.eveningPrice !== undefined ? userJ.eveningPrice : c.close,
      eveningAction: userJ.eveningAction || c.signal || 'HOLD_CASH',
      eveningNote: userJ.eveningNote || '',
      v5: (v5Num >= 0 ? '+' : '') + v5Num.toFixed(3),
      v20: (v20Num >= 0 ? '+' : '') + v20Num.toFixed(3),
      rho: (rhoNum >= 0 ? '+' : '') + rhoNum.toFixed(3),
      delta: `±${deltaNum.toFixed(2)}%`,
      signal: c.signal || 'HOLD',
      signalDetail: c.signal_detail || '',
      isJournal: !!journalMap[c.time],
      raw: c
    });
  }

  allDataRecords = records;
}

/**
 * Get user journal entries from LocalStorage
 */
function getJournalEntries() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load journal entries from localStorage', e);
    return [];
  }
}

/**
 * Save or Merge user journal entry into LocalStorage
 */
function saveJournalEntry(entry) {
  const list = getJournalEntries();
  const existingIdx = list.findIndex(item => item.date === entry.date);

  if (existingIdx >= 0) {
    // Merge: preserve previous values if not updated
    const old = list[existingIdx];
    list[existingIdx] = {
      ...old,
      ...entry,
      middayNote: entry.middayNote || old.middayNote,
      eveningNote: entry.eveningNote || old.eveningNote,
      middayPrice: entry.middayPrice || old.middayPrice,
      eveningPrice: entry.eveningPrice || old.eveningPrice,
      updatedAt: new Date().toISOString()
    };
  } else {
    list.unshift(entry);
  }

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
}

/**
 * Update Top KPI Summary
 */
function updateKpiSummary() {
  const quantData = window.RAMANUJAN_DATA || {};
  const pred = quantData.predictiveIntelligence || {};
  const journalEntries = getJournalEntries();

  const elLastDate = document.getElementById('kpiLastDate');
  const elPrice = document.getElementById('kpiPrice');
  const elRange = document.getElementById('kpiRange');
  const elWaves = document.getElementById('kpiWaves');
  const elTotal = document.getElementById('kpiTotalRecords');
  const elJournal = document.getElementById('kpiJournalCount');

  if (elLastDate) elLastDate.textContent = pred.lastDate || '2026-10-27';
  if (elPrice) elPrice.textContent = `฿${(pred.lastPrice || 153.5).toFixed(2)}`;
  if (elRange && pred.expectedRange) {
    elRange.textContent = `Floor ฿${pred.expectedRange.floor.toFixed(2)} - Ceiling ฿${pred.expectedRange.ceiling.toFixed(2)}`;
  }
  if (elTotal) elTotal.textContent = `${allDataRecords.length} วัน`;
  if (elJournal) elJournal.textContent = `รวมบันทึกไดอารี่ ${journalEntries.length} วัน`;

  // Set default date in form to today
  const inputDate = document.getElementById('entryDate');
  if (inputDate && !inputDate.value) {
    inputDate.value = pred.lastDate || new Date().toISOString().split('T')[0];
  }
}

/**
 * Bind all DOM Event Handlers
 */
function bindEventHandlers() {
  // 1. Auto-fill button handler (detects today's 2 sessions)
  const btnAutoFill = document.getElementById('btnAutoFillToday');
  if (btnAutoFill) {
    btnAutoFill.addEventListener('click', () => {
      const quantData = window.RAMANUJAN_DATA || {};
      const pred = quantData.predictiveIntelligence || {};
      const candles = quantData.candlesWithSignals || [];
      const lastC = candles.length > 0 ? candles[candles.length - 1] : {};

      const inputDate = document.getElementById('entryDate');
      const inputOpen = document.getElementById('entryOpen');
      const inputHigh = document.getElementById('entryHigh');
      const inputLow = document.getElementById('entryLow');
      const inputVolume = document.getElementById('entryVolume');

      const inputMidPrice = document.getElementById('entryPriceMidday');
      const inputEvePrice = document.getElementById('entryPriceEvening');
      const inputMidNote = document.getElementById('entryNoteMidday');
      const inputEveNote = document.getElementById('entryNoteEvening');

      const todayDate = pred.lastDate || lastC.time || new Date().toISOString().split('T')[0];
      const todayPrice = pred.lastPrice || lastC.close || 153.50;

      if (inputDate) inputDate.value = todayDate;
      if (inputOpen) inputOpen.value = lastC.open || 153.0;
      if (inputHigh) inputHigh.value = lastC.high || 154.5;
      if (inputLow) inputLow.value = lastC.low || 152.5;
      if (inputVolume) inputVolume.value = lastC.volume || 12182248;

      if (inputMidPrice) inputMidPrice.value = todayPrice;
      if (inputEvePrice) inputEvePrice.value = todayPrice;

      if (inputMidNote && !inputMidNote.value) {
        inputMidNote.value = `รอบเที่ยง: SCB ยืน ฿${todayPrice.toFixed(2)} ยืนเหนือ Floor ฿${pred.expectedRange?.floor.toFixed(2) || '144.05'} คลื่น V5 บวกแข็งแกร่ง จ่อเบรก ฿154.93`;
      }
      if (inputEveNote && !inputEveNote.value) {
        inputEveNote.value = `รอบเย็น: ปิดตลาดรักษาฐานราคาสมบูรณ์แบบ วางแผนรับมือรอบเช้าวันพรุ่งนี้`;
      }
    });
  }

  // 2. Form Submit: Save 2-in-1 Entry
  const form = document.getElementById('dailyEntryForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const date = document.getElementById('entryDate').value;
      const open = parseFloat(document.getElementById('entryOpen').value) || undefined;
      const high = parseFloat(document.getElementById('entryHigh').value) || undefined;
      const low = parseFloat(document.getElementById('entryLow').value) || undefined;
      const volume = parseInt(document.getElementById('entryVolume').value) || undefined;

      const middayPrice = parseFloat(document.getElementById('entryPriceMidday').value) || undefined;
      const middayAction = document.getElementById('entryActionMidday').value;
      const middayNote = document.getElementById('entryNoteMidday').value;

      const eveningPrice = parseFloat(document.getElementById('entryPriceEvening').value) || undefined;
      const eveningAction = document.getElementById('entryActionEvening').value;
      const eveningNote = document.getElementById('entryNoteEvening').value;

      saveJournalEntry({
        date,
        open,
        high,
        low,
        volume,
        middayPrice,
        middayAction,
        middayNote,
        eveningPrice,
        eveningAction,
        eveningNote,
        updatedAt: new Date().toISOString()
      });

      alert(`✅ บันทึกข้อมูล 2-in-1 ประจำวันที่ ${date} สำเร็จเรียบร้อย!`);
      initArchiveData();
      updateKpiSummary();
      renderTable();
    });
  }

  // 3. Filter Tabs
  const filterBtns = document.querySelectorAll('.btn-filter-tab');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter || 'all';
      currentPage = 1;
      renderTable();
    });
  });

  // 4. Search input
  const searchInput = document.getElementById('dbSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      currentPage = 1;
      renderTable();
    });
  }

  // 5. Pagination Buttons
  const btnPrev = document.getElementById('btnPrevPage');
  const btnNext = document.getElementById('btnNextPage');
  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderTable();
      }
    });
  }
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      const maxPage = Math.ceil(getFilteredRecords().length / ITEMS_PER_PAGE);
      if (currentPage < maxPage) {
        currentPage++;
        renderTable();
      }
    });
  }

  // 6. Export JSON
  const btnExportJson = document.getElementById('btnExportJson');
  if (btnExportJson) {
    btnExportJson.addEventListener('click', exportDatabaseJson);
  }

  // 7. Export CSV
  const btnExportCsv = document.getElementById('btnExportCsv');
  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', exportDatabaseCsv);
  }

  // 8. Close Modal
  const btnCloseModal = document.getElementById('btnCloseModal');
  const modalBackdrop = document.getElementById('detailModal');
  if (btnCloseModal && modalBackdrop) {
    btnCloseModal.addEventListener('click', () => {
      modalBackdrop.style.display = 'none';
    });
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) modalBackdrop.style.display = 'none';
    });
  }
}

/**
 * Filter records based on current tab & search query
 */
function getFilteredRecords() {
  return allDataRecords.filter(item => {
    // 1. Tab Filter
    if (currentFilter === 'journal' && !item.isJournal) return false;
    if (currentFilter === 'signals' && item.signal === 'HOLD' && !item.signalDetail) return false;
    if (currentFilter === '2026' && !item.date.startsWith('2026')) return false;
    if (currentFilter === '2025' && !item.date.startsWith('2025')) return false;
    if (currentFilter === '2024' && !item.date.startsWith('2024')) return false;

    // 2. Text Search Query
    if (searchQuery) {
      const matchDate = item.date.toLowerCase().includes(searchQuery);
      const matchClose = (item.close || '').toString().includes(searchQuery);
      const matchMidNote = item.middayNote ? item.middayNote.toLowerCase().includes(searchQuery) : false;
      const matchEveNote = item.eveningNote ? item.eveningNote.toLowerCase().includes(searchQuery) : false;
      const matchSignal = item.signal.toLowerCase().includes(searchQuery);
      return matchDate || matchClose || matchMidNote || matchEveNote || matchSignal;
    }

    return true;
  });
}

/**
 * Render 1-Row-Per-Day Interactive Table
 */
function renderTable() {
  const tbody = document.getElementById('dbTableBody');
  if (!tbody) return;

  const filtered = getFilteredRecords();
  const total = filtered.length;
  const maxPage = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  if (currentPage > maxPage) currentPage = maxPage;

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, total);
  const pageItems = filtered.slice(startIndex, endIndex);

  // Update Pagination Info
  const elInfo = document.getElementById('paginationInfo');
  const elCurrent = document.getElementById('pageCurrentDisplay');
  const btnPrev = document.getElementById('btnPrevPage');
  const btnNext = document.getElementById('btnNextPage');

  if (elInfo) elInfo.textContent = total > 0 ? `แสดงรายการที่ ${startIndex + 1} - ${endIndex} จากทั้งหมด ${total} วัน` : 'ไม่พบข้อมูลที่ตรงกับเงื่อนไข';
  if (elCurrent) elCurrent.textContent = `หน้า ${currentPage} / ${maxPage}`;
  if (btnPrev) btnPrev.disabled = currentPage <= 1;
  if (btnNext) btnNext.disabled = currentPage >= maxPage;

  if (pageItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="12" style="text-align: center; padding: 30px; color: var(--text-muted);">🔍 ไม่พบรายการข้อมูลที่ตรงกับการค้นหา</td></tr>`;
    return;
  }

  tbody.innerHTML = pageItems.map(row => {
    // Format Midday Cell
    let midBadge = `<span class="badge-signal badge-watch">WATCH</span>`;
    if (row.middayAction === 'BUY_PROBE') midBadge = `<span class="badge-signal badge-buy">PROBE 30%</span>`;
    else if (row.middayAction === 'HOLD_CASH') midBadge = `<span class="badge-signal badge-hold">HOLD</span>`;
    else if (row.middayAction === 'AVOID_DROP') midBadge = `<span class="badge-signal badge-sell">AVOID</span>`;

    const midPriceDisplay = row.middayPrice ? `฿${row.middayPrice.toFixed(2)}` : '-';

    // Format Evening Cell
    let eveBadge = `<span class="badge-signal badge-hold">HOLD</span>`;
    if (row.signal === 'BUY' || row.eveningAction === 'CONFIRM_BUY') eveBadge = `<span class="badge-signal badge-buy">BUY ENTRY</span>`;
    else if (row.signal === 'SELL' || row.signal.includes('EXIT')) eveBadge = `<span class="badge-signal badge-sell">${row.signal}</span>`;
    else if (row.eveningAction === 'TAKE_PROFIT') eveBadge = `<span class="badge-signal badge-buy">TAKE PROFIT</span>`;
    else if (row.eveningAction === 'BREAKEVEN_SHIELD') eveBadge = `<span class="badge-signal badge-journal">SHIELD</span>`;

    const evePriceDisplay = row.close ? `฿${row.close.toFixed(2)}` : '-';

    const v5Color = row.v5.startsWith('+') ? '#34d399' : '#f87171';
    const v20Color = row.v20.startsWith('+') ? '#a78bfa' : '#f87171';

    // Combined Note Tooltip
    let noteText = '';
    if (row.middayNote) noteText += `[☀️ เที่ยง]: ${row.middayNote} `;
    if (row.eveningNote) noteText += `[🌙 เย็น]: ${row.eveningNote}`;
    if (!noteText && row.isJournal) noteText = 'มีการบันทึกไดอารี่ประจำวัน';

    return `
      <tr>
        <td><strong>${row.date}</strong></td>
        <td>฿${row.open ? row.open.toFixed(2) : '-'}</td>
        
        <!-- ☀️ รอบเที่ยง 13:00 น. -->
        <td>
          <div class="session-price-pill" style="color: #fbbf24;">
            <span>${midPriceDisplay}</span>
            ${midBadge}
          </div>
        </td>

        <!-- 🌙 รอบเย็น 17:30 น. (ปิดวัน) -->
        <td>
          <div class="session-price-pill" style="color: #38bdf8;">
            <span>${evePriceDisplay}</span>
            ${eveBadge}
          </div>
        </td>

        <td>
          <span style="color: #34d399;">${row.high ? row.high.toFixed(2) : '-'}</span> / 
          <span style="color: #f87171;">${row.low ? row.low.toFixed(2) : '-'}</span>
        </td>
        <td>${row.volume ? row.volume.toLocaleString() : '-'}</td>
        <td style="color: ${v5Color}; font-family: var(--font-code); font-weight: 700;">${row.v5}</td>
        <td style="color: ${v20Color}; font-family: var(--font-code); font-weight: 700;">${row.v20}</td>
        <td style="font-family: var(--font-code);">${row.rho}</td>
        <td style="font-family: var(--font-code);">${row.delta}</td>
        
        <td style="max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${noteText}">
          ${noteText ? `📝 ${noteText}` : '<span style="color: rgba(255,255,255,0.2);">-</span>'}
        </td>
        <td>
          <div style="display: flex; gap: 4px;">
            <button type="button" class="btn btn-sm btn-outline btn-view-detail" data-date="${row.date}" style="padding: 2px 8px; font-size: 0.75rem;" title="ดูรายละเอียด 18 มิติ">
              🔍 ดูลึก
            </button>
            <button type="button" class="btn btn-sm btn-outline btn-edit-entry" data-date="${row.date}" style="padding: 2px 8px; font-size: 0.75rem; border-color: #fbbf24; color: #fbbf24;" title="ดึงข้อมูลขึ้นมาแก้ไขในฟอร์ม">
              ✏️ แก้ไข
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Attach Detail Click Handler
  document.querySelectorAll('.btn-view-detail').forEach(btn => {
    btn.addEventListener('click', () => {
      const date = btn.dataset.date;
      showDetailModal(date);
    });
  });

  // Attach Edit Click Handler (Loads existing values into form)
  document.querySelectorAll('.btn-edit-entry').forEach(btn => {
    btn.addEventListener('click', () => {
      const date = btn.dataset.date;
      loadEntryIntoForm(date);
    });
  });
}

/**
 * Load existing daily record into form for easy editing
 */
function loadEntryIntoForm(date) {
  const row = allDataRecords.find(r => r.date === date);
  if (!row) return;

  const inputDate = document.getElementById('entryDate');
  const inputOpen = document.getElementById('entryOpen');
  const inputHigh = document.getElementById('entryHigh');
  const inputLow = document.getElementById('entryLow');
  const inputVolume = document.getElementById('entryVolume');

  const inputMidPrice = document.getElementById('entryPriceMidday');
  const inputEvePrice = document.getElementById('entryPriceEvening');
  const inputMidAction = document.getElementById('entryActionMidday');
  const inputEveAction = document.getElementById('entryActionEvening');
  const inputMidNote = document.getElementById('entryNoteMidday');
  const inputEveNote = document.getElementById('entryNoteEvening');

  if (inputDate) inputDate.value = row.date;
  if (inputOpen) inputOpen.value = row.open || '';
  if (inputHigh) inputHigh.value = row.high || '';
  if (inputLow) inputLow.value = row.low || '';
  if (inputVolume) inputVolume.value = row.volume || '';

  if (inputMidPrice) inputMidPrice.value = row.middayPrice || row.close || '';
  if (inputEvePrice) inputEvePrice.value = row.close || '';
  if (inputMidAction && row.middayAction) inputMidAction.value = row.middayAction;
  if (inputEveAction && row.eveningAction) inputEveAction.value = row.eveningAction;
  if (inputMidNote) inputMidNote.value = row.middayNote || '';
  if (inputEveNote) inputEveNote.value = row.eveningNote || '';

  // Scroll smoothly to form
  const formBox = document.querySelector('.form-box');
  if (formBox) {
    formBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Show Detailed Modal Inspector for 2-in-1 Daily Record
 */
function showDetailModal(date) {
  const record = allDataRecords.find(r => r.date === date);
  if (!record) return;

  const modal = document.getElementById('detailModal');
  const title = document.getElementById('modalTitle');
  const content = document.getElementById('modalContent');

  if (title) title.textContent = `🔬 ข้อมูลตรวจวัด 2-in-1 ประจำวัน: ${record.date}`;

  if (content) {
    content.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px;">
        <div><strong>ราคาเปิดเช้า (Open):</strong> ฿${record.open || '-'}</div>
        <div><strong>ราคาปิดสิ้นวัน (Close):</strong> ฿${record.close || '-'}</div>
        <div><strong>ราคาสูงสุดวัน (High):</strong> ฿${record.high || '-'}</div>
        <div><strong>ราคาต่ำสุดวัน (Low):</strong> ฿${record.low || '-'}</div>
        <div><strong>วอลุ่มซื้อขาย:</strong> ${record.volume ? record.volume.toLocaleString() + ' หุ้น' : '-'}</div>
        <div><strong>กรอบความผันผวน:</strong> ${record.delta}</div>
      </div>

      <!-- เปรียบเทียบ 2 รอบวันคู่ขนาน -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); padding: 12px; border-radius: 8px;">
          <h4 style="color: #fbbf24; margin-bottom: 6px;">☀️ รอบพักเที่ยง 13:00 น.</h4>
          <div>ราคาปิดเที่ยง: <strong>฿${record.middayPrice ? record.middayPrice.toFixed(2) : '-'}</strong></div>
          <div>แผนภาคบ่าย: <strong>${record.middayAction || 'TRIGGER_WATCH'}</strong></div>
          ${record.middayNote ? `<p style="margin-top: 6px; font-size: 0.82rem; color: #f3f4f6;">📝 ${record.middayNote}</p>` : ''}
        </div>
        <div style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); padding: 12px; border-radius: 8px;">
          <h4 style="color: #38bdf8; margin-bottom: 6px;">🌙 รอบปิดเย็น 17:30 น.</h4>
          <div>ราคาปิดสิ้นวัน: <strong>฿${record.close ? record.close.toFixed(2) : '-'}</strong></div>
          <div>สัญญาณระบบ: <strong>${record.signal} (${record.eveningAction || 'HOLD'})</strong></div>
          ${record.eveningNote ? `<p style="margin-top: 6px; font-size: 0.82rem; color: #f3f4f6;">📝 ${record.eveningNote}</p>` : ''}
        </div>
      </div>

      <!-- ค่าสถิติคลื่นรามานุจัน -->
      <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid var(--card-border); padding: 12px; border-radius: 8px;">
        <h4 style="color: #e2e8f0; margin-bottom: 6px;">📐 เวกเตอร์ฮาร์มอนิกรามานุจัน (Wave Vectors)</h4>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-family: var(--font-code);">
          <div>คลื่นสัปดาห์ V5: <strong>${record.v5}</strong></div>
          <div>คลื่นเดือน V20: <strong>${record.v20}</strong></div>
          <div>ความสอดคล้อง &rho;: <strong>${record.rho}</strong></div>
        </div>
      </div>
    `;
  }

  if (modal) modal.style.display = 'flex';
}

/**
 * Export entire 2-in-1 database to JSON file
 */
function exportDatabaseJson() {
  const quantData = window.RAMANUJAN_DATA || {};
  const journalEntries = getJournalEntries();

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    totalDays: allDataRecords.length,
    journalCount: journalEntries.length,
    journalMasterRecords: journalEntries,
    dailyMasterHistory: allDataRecords
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `SCB_2in1_Quant_Database_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Export entire 2-in-1 table to CSV format
 */
function exportDatabaseCsv() {
  const headers = [
    "Date", "Open", "Midday_Price_1300", "Midday_Action", "Midday_Note",
    "Evening_Close_1730", "Evening_Action", "Evening_Note",
    "High", "Low", "Volume", "V5_Micro", "V20_Macro", "Rho_Coherence", "Dynamic_Delta", "Signal"
  ];

  const rows = allDataRecords.map(r => [
    r.date,
    r.open || '',
    r.middayPrice || '',
    `"${r.middayAction || ''}"`,
    `"${(r.middayNote || '').replace(/"/g, '""')}"`,
    r.close || '',
    `"${r.eveningAction || ''}"`,
    `"${(r.eveningNote || '').replace(/"/g, '""')}"`,
    r.high || '',
    r.low || '',
    r.volume || '',
    `"${r.v5}"`,
    `"${r.v20}"`,
    `"${r.rho}"`,
    `"${r.delta}"`,
    `"${r.signal}"`
  ]);

  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', `SCB_2in1_Daily_Master_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(a);
  a.click();
  a.remove();
}
