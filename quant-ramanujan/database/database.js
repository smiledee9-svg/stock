/**
 * SCB Daily Intelligence Archive & Historical Database Controller
 * Manages daily telemetry snapshots, user journal entries, searching, filtering, and export
 */

const LOCAL_STORAGE_KEY = 'SCB_RAMANUJAN_JOURNAL_V1';
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
 * Initialize and merge automated historical candles with user journal entries
 */
function initArchiveData() {
  const quantData = window.RAMANUJAN_DATA || {};
  const candles = quantData.candlesWithSignals || [];
  const journalEntries = getJournalEntries();

  // Create lookup map for user journal notes by date
  const journalMap = {};
  journalEntries.forEach(j => {
    journalMap[j.date] = j;
  });

  // Map candles (reverse order: newest first)
  const records = [];

  // Check if today's candle exists
  const todayStr = quantData.predictiveIntelligence?.lastDate || new Date().toISOString().split('T')[0];
  const hasToday = candles.some(c => c.time === todayStr);

  // If today's predictive intelligence has a date not yet in candles, prepend it
  if (!hasToday && quantData.predictiveIntelligence) {
    const p = quantData.predictiveIntelligence;
    records.push({
      date: p.lastDate || todayStr,
      session: 'midday',
      open: p.lastPrice || 153.5,
      high: p.lastPrice || 153.5,
      low: p.lastPrice || 153.5,
      close: p.lastPrice || 153.5,
      volume: 0,
      v5: '+0.333',
      v20: '+0.901',
      rho: '+0.651',
      delta: `±${(p.dynamicDeltaPct || 5.72).toFixed(2)}%`,
      signal: 'HOLD',
      signalDetail: 'รอจังหวะกลับตัว (Watchlist)',
      note: journalMap[p.lastDate]?.note || 'ข้อมูลตรวจวัดล่าสุดประจำวัน',
      isJournal: !!journalMap[p.lastDate],
      raw: p
    });
  }

  // Add historical candles in reverse chronological order
  for (let i = candles.length - 1; i >= 0; i--) {
    const c = candles[i];
    const userJ = journalMap[c.time];

    const v5Num = typeof c.v_micro === 'number' ? c.v_micro : 0;
    const v20Num = typeof c.v_macro === 'number' ? c.v_macro : 0;
    const rhoNum = typeof c.rho_ram === 'number' ? c.rho_ram : 0;
    const deltaNum = typeof c.dynamic_delta === 'number' ? c.dynamic_delta * 100 : 3.5;

    records.push({
      date: c.time,
      session: userJ ? userJ.session : 'evening',
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
      v5: (v5Num >= 0 ? '+' : '') + v5Num.toFixed(3),
      v20: (v20Num >= 0 ? '+' : '') + v20Num.toFixed(3),
      rho: (rhoNum >= 0 ? '+' : '') + rhoNum.toFixed(3),
      delta: `±${deltaNum.toFixed(2)}%`,
      signal: c.signal || 'HOLD',
      signalDetail: c.signal_detail || '',
      note: userJ ? userJ.note : '',
      action: userJ ? userJ.action : '',
      isJournal: !!userJ,
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
 * Save user journal entry to LocalStorage
 */
function saveJournalEntry(entry) {
  const list = getJournalEntries();
  const existingIdx = list.findIndex(item => item.date === entry.date);
  if (existingIdx >= 0) {
    list[existingIdx] = entry;
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
  if (elJournal) elJournal.textContent = `รวมบันทึกส่วนตัว ${journalEntries.length} รายการ`;

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
  // 1. Auto-fill button handler
  const btnAutoFill = document.getElementById('btnAutoFillToday');
  if (btnAutoFill) {
    btnAutoFill.addEventListener('click', () => {
      const quantData = window.RAMANUJAN_DATA || {};
      const pred = quantData.predictiveIntelligence || {};
      const candles = quantData.candlesWithSignals || [];
      const lastC = candles.length > 0 ? candles[candles.length - 1] : {};

      const inputDate = document.getElementById('entryDate');
      const inputPrice = document.getElementById('entryPrice');
      const inputVolume = document.getElementById('entryVolume');
      const inputV5 = document.getElementById('entryV5');
      const inputV20 = document.getElementById('entryV20');
      const inputNote = document.getElementById('entryNote');

      if (inputDate) inputDate.value = pred.lastDate || lastC.time || new Date().toISOString().split('T')[0];
      if (inputPrice) inputPrice.value = pred.lastPrice || lastC.close || 153.50;
      if (inputVolume) inputVolume.value = lastC.volume || 12182248;

      const v5Val = typeof lastC.v_micro === 'number' ? (lastC.v_micro >= 0 ? '+' : '') + lastC.v_micro.toFixed(3) : '+0.333';
      const v20Val = typeof lastC.v_macro === 'number' ? (lastC.v_macro >= 0 ? '+' : '') + lastC.v_macro.toFixed(3) : '+0.901';
      if (inputV5) inputV5.value = v5Val;
      if (inputV20) inputV20.value = v20Val;

      if (inputNote && !inputNote.value) {
        inputNote.value = `ตรวจวัดรอบวัน: ราคา ฿${(pred.lastPrice || 153.50).toFixed(2)} ยืนเหนือ Floor ฿${pred.expectedRange?.floor.toFixed(2) || '144.05'} คลื่นสัปดาห์ V5 เป็นบวกหนุนการฟื้นตัว`;
      }
    });
  }

  // 2. Form Submit (Save Journal)
  const form = document.getElementById('dailyEntryForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const date = document.getElementById('entryDate').value;
      const session = document.getElementById('entrySession').value;
      const price = parseFloat(document.getElementById('entryPrice').value) || 0;
      const volume = parseInt(document.getElementById('entryVolume').value) || 0;
      const v5 = document.getElementById('entryV5').value;
      const v20 = document.getElementById('entryV20').value;
      const action = document.getElementById('entryAction').value;
      const note = document.getElementById('entryNote').value;

      saveJournalEntry({
        date,
        session,
        price,
        volume,
        v5,
        v20,
        action,
        note,
        updatedAt: new Date().toISOString()
      });

      alert(`✅ บันทึกข้อมูลวันที่ ${date} ลงในคลังเรียบร้อยแล้ว!`);
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
 * Filter records based on current filter & search query
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
      const matchPrice = item.close.toString().includes(searchQuery);
      const matchNote = item.note ? item.note.toLowerCase().includes(searchQuery) : false;
      const matchSignal = item.signal.toLowerCase().includes(searchQuery);
      return matchDate || matchPrice || matchNote || matchSignal;
    }

    return true;
  });
}

/**
 * Render Data Table & Pagination
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

  if (elInfo) elInfo.textContent = total > 0 ? `แสดงรายการที่ ${startIndex + 1} - ${endIndex} จากทั้งหมด ${total} รายการ` : 'ไม่พบข้อมูลที่ตรงกับเงื่อนไข';
  if (elCurrent) elCurrent.textContent = `หน้า ${currentPage} / ${maxPage}`;
  if (btnPrev) btnPrev.disabled = currentPage <= 1;
  if (btnNext) btnNext.disabled = currentPage >= maxPage;

  if (pageItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="13" style="text-align: center; padding: 30px; color: var(--text-muted);">🔍 ไม่พบรายการข้อมูลที่ตรงกับการค้นหา</td></tr>`;
    return;
  }

  tbody.innerHTML = pageItems.map(row => {
    let signalBadge = `<span class="badge-signal badge-hold">HOLD</span>`;
    if (row.signal === 'BUY') signalBadge = `<span class="badge-signal badge-buy">BUY ENTRY</span>`;
    else if (row.signal === 'SELL' || row.signal.includes('EXIT')) signalBadge = `<span class="badge-signal badge-sell">${row.signal}</span>`;
    else if (row.isJournal) signalBadge = `<span class="badge-signal badge-journal">JOURNAL</span>`;

    const v5Color = row.v5.startsWith('+') ? '#34d399' : '#f87171';
    const v20Color = row.v20.startsWith('+') ? '#a78bfa' : '#f87171';
    const sessionTag = row.session === 'midday' ? '☀️ 13:00' : '🌙 17:30';

    return `
      <tr>
        <td><strong>${row.date}</strong> <span style="font-size: 0.72rem; color: var(--text-muted);">${sessionTag}</span></td>
        <td>฿${row.open ? row.open.toFixed(2) : '-'}</td>
        <td style="color: #34d399;">฿${row.high ? row.high.toFixed(2) : '-'}</td>
        <td style="color: #f87171;">฿${row.low ? row.low.toFixed(2) : '-'}</td>
        <td><strong>฿${row.close ? row.close.toFixed(2) : '-'}</strong></td>
        <td>${row.volume ? row.volume.toLocaleString() : '-'}</td>
        <td style="color: ${v5Color}; font-family: var(--font-code); font-weight: 700;">${row.v5}</td>
        <td style="color: ${v20Color}; font-family: var(--font-code); font-weight: 700;">${row.v20}</td>
        <td style="font-family: var(--font-code);">${row.rho}</td>
        <td style="font-family: var(--font-code);">${row.delta}</td>
        <td>${signalBadge}</td>
        <td style="max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${row.note || ''}">
          ${row.note ? `📝 ${row.note}` : '<span style="color: rgba(255,255,255,0.2);">-</span>'}
        </td>
        <td>
          <button type="button" class="btn btn-sm btn-outline btn-view-detail" data-date="${row.date}" style="padding: 2px 8px; font-size: 0.75rem;">
            🔍 ดูลึก
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Attach modal detail click handlers
  document.querySelectorAll('.btn-view-detail').forEach(btn => {
    btn.addEventListener('click', () => {
      const date = btn.dataset.date;
      showDetailModal(date);
    });
  });
}

/**
 * Show Detailed Modal Inspector for a specific date
 */
function showDetailModal(date) {
  const record = allDataRecords.find(r => r.date === date);
  if (!record) return;

  const modal = document.getElementById('detailModal');
  const title = document.getElementById('modalTitle');
  const content = document.getElementById('modalContent');

  if (title) title.textContent = `🔬 ข้อมูลตรวจวัดละเอียด: ${record.date} (${record.session === 'midday' ? 'รอบเที่ยง 13:00 น.' : 'รอบเย็น 17:30 น.'})`;

  if (content) {
    content.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px;">
        <div><strong>ราคาเปิด (Open):</strong> ฿${record.open || '-'}</div>
        <div><strong>ราคาปิด (Close):</strong> ฿${record.close || '-'}</div>
        <div><strong>ราคาสูงสุด (High):</strong> ฿${record.high || '-'}</div>
        <div><strong>ราคาต่ำสุด (Low):</strong> ฿${record.low || '-'}</div>
        <div><strong>ปริมาณซื้อขาย:</strong> ${record.volume ? record.volume.toLocaleString() + ' หุ้น' : '-'}</div>
        <div><strong>กรอบไดนามิก:</strong> ${record.delta}</div>
      </div>
      <div style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); padding: 12px; border-radius: 8px;">
        <h4 style="color: #38bdf8; margin-bottom: 6px;">🌊 สถิติคลื่นความเร็วรามานุจัน (Wave Vectors)</h4>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-family: var(--font-code);">
          <div>คลื่นสัปดาห์ V5: <strong>${record.v5}</strong></div>
          <div>คลื่นเดือน V20: <strong>${record.v20}</strong></div>
          <div>ความสอดคล้อง &rho;: <strong>${record.rho}</strong></div>
        </div>
      </div>
      ${record.note ? `
        <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); padding: 12px; border-radius: 8px;">
          <h4 style="color: #fbbf24; margin-bottom: 4px;">📝 บันทึกความจำส่วนตัว (Trader Note)</h4>
          <p style="color: #fff; line-height: 1.5;">${record.note}</p>
        </div>
      ` : ''}
    `;
  }

  if (modal) modal.style.display = 'flex';
}

/**
 * Export entire database and journal to JSON file
 */
function exportDatabaseJson() {
  const quantData = window.RAMANUJAN_DATA || {};
  const journalEntries = getJournalEntries();

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    totalRecords: allDataRecords.length,
    journalCount: journalEntries.length,
    userJournal: journalEntries,
    predictiveIntelligence: quantData.predictiveIntelligence || {},
    history: allDataRecords
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `SCB_Quant_Database_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Export entire historical table to CSV format
 */
function exportDatabaseCsv() {
  const headers = ["Date", "Session", "Open", "High", "Low", "Close", "Volume", "V5_Micro", "V20_Macro", "Rho_Coherence", "Dynamic_Delta", "Signal", "Trader_Note"];
  const rows = allDataRecords.map(r => [
    r.date,
    r.session,
    r.open || '',
    r.high || '',
    r.low || '',
    r.close || '',
    r.volume || '',
    `"${r.v5}"`,
    `"${r.v20}"`,
    `"${r.rho}"`,
    `"${r.delta}"`,
    `"${r.signal}"`,
    `"${(r.note || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', `SCB_Daily_Archive_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(a);
  a.click();
  a.remove();
}
