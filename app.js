/**
 * SmartStock - Multi-Store Architecture Application Logic
 */

const DEFAULT_STORES = [
  {
    id: "store_1",
    code: "01",
    name: "สาขา 1 (ร้านขายแบตเตอรี่)",
    desc: "สต็อกแบตเตอรี่รถยนต์หน้าร้าน พร้อมตรวจนับและคำนวณสั่งเพิ่มอัตโนมัติ",
    createdAt: new Date().toISOString()
  },
  {
    id: "store_2",
    code: "02",
    name: "สาขา 2 (คลังสินค้าออนไลน์)",
    desc: "สต็อกสำหรับส่งออเดอร์ Shopee, TikTok, Lazada",
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_PRODUCTS = [
  {
    id: "prod_1",
    storeId: "store_1",
    name: "GS 46B24L",
    sku: "GS-46B24L",
    category: "แบตเตอรี่ (ขั้ว L)",
    quantity: 2,       // นับได้จริง (ช่อง C2)
    minAlert: 5,       // สต็อกเป้าหมาย (ช่อง B2)
    costPrice: 1400,   // ราคาทุน/หน่วย
    price: 1850,       // ราคาขาย/หน่วย
    unit: "",
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod_2",
    storeId: "store_1",
    name: "3K 55D23L",
    sku: "3K-55D23L",
    category: "แบตเตอรี่ (ขั้ว L)",
    quantity: 5,       // นับได้จริง (ช่อง C3)
    minAlert: 5,       // สต็อกเป้าหมาย (ช่อง B3)
    costPrice: 1600,   // ราคาทุน/หน่วย
    price: 2100,       // ราคาขาย/หน่วย
    unit: "",
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod_3",
    storeId: "store_1",
    name: "FB 105D31L",
    sku: "FB-105D31L",
    category: "แบตเตอรี่ (กะบะ/ดีเซล)",
    quantity: 1,       // นับได้จริง (ช่อง C4)
    minAlert: 5,       // สต็อกเป้าหมาย (ช่อง B4)
    costPrice: 2200,   // ราคาทุน/หน่วย
    price: 2850,       // ราคาขาย/หน่วย
    unit: "",
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod_4",
    storeId: "store_1",
    name: "Amaron LN3",
    sku: "AMR-LN3",
    category: "แบตเตอรี่ (DIN ยุโรป)",
    quantity: 6,       // นับได้จริง (ช่อง C5 เกินเป้าหมาย)
    minAlert: 5,       // สต็อกเป้าหมาย (ช่อง B5)
    costPrice: 2500,   // ราคาทุน/หน่วย
    price: 3200,       // ราคาขาย/หน่วย
    unit: "",
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod_5",
    storeId: "store_1",
    name: "Panasonic 50B24L",
    sku: "PANA-50B24L",
    category: "แบตเตอรี่ (ขั้ว L)",
    quantity: 3,
    minAlert: 5,
    costPrice: 1500,   // ราคาทุน/หน่วย
    price: 1950,       // ราคาขาย/หน่วย
    unit: "",
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod_6",
    storeId: "store_1",
    name: "Yuasa 75D23L",
    sku: "YUA-75D23L",
    category: "แบตเตอรี่ (ขั้ว L)",
    quantity: 0,
    minAlert: 4,
    costPrice: 1750,   // ราคาทุน/หน่วย
    price: 2250,       // ราคาขาย/หน่วย
    unit: "",
    updatedAt: new Date().toISOString()
  },
  // สินค้าตัวอย่างสำหรับ สาขา 2 (คลังสินค้าออนไลน์)
  {
    id: "prod_7",
    storeId: "store_2",
    name: "GS MFX-60L",
    sku: "GS-MFX60L",
    category: "แบตเตอรี่ (ขั้ว L)",
    quantity: 4,
    minAlert: 6,
    costPrice: 1650,
    price: 2150,
    unit: "",
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod_8",
    storeId: "store_2",
    name: "3K MAX-75R",
    sku: "3K-MAX75R",
    category: "แบตเตอรี่ (ขั้ว R)",
    quantity: 1,
    minAlert: 4,
    costPrice: 1800,
    price: 2350,
    unit: "",
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod_9",
    storeId: "store_2",
    name: "FB S-95 (Start-Stop)",
    sku: "FB-S95",
    category: "แบตเตอรี่ (EFB/ISS)",
    quantity: 0,
    minAlert: 3,
    costPrice: 2700,
    price: 3450,
    unit: "",
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod_10",
    storeId: "store_2",
    name: "Amaron 85D23L Hi-Life",
    sku: "AMR-85D23L",
    category: "แบตเตอรี่ (ขั้ว L)",
    quantity: 5,
    minAlert: 5,
    costPrice: 2100,
    price: 2700,
    unit: "",
    updatedAt: new Date().toISOString()
  }
];

const DEFAULT_HISTORY = [
  {
    id: "hist_1",
    storeId: "store_1",
    productId: "prod_1",
    productName: "GS 46B24L",
    type: "IN",
    amount: 5,
    balanceAfter: 5,
    reason: "รับเข้าสต็อกแบตเตอรี่ล็อตใหม่",
    timestamp: new Date(Date.now() - 3600000 * 48).toISOString()
  },
  {
    id: "hist_2",
    storeId: "store_1",
    productId: "prod_1",
    productName: "GS 46B24L",
    type: "OUT",
    amount: 3,
    balanceAfter: 2,
    reason: "ลูกค้าเปลี่ยนแบตหน้าร้าน",
    timestamp: new Date(Date.now() - 3600000 * 8).toISOString()
  },
  {
    id: "hist_3",
    storeId: "store_1",
    productId: "prod_3",
    productName: "FB 105D31L",
    type: "OUT",
    amount: 4,
    balanceAfter: 1,
    reason: "รถกระบะเปลี่ยนแบตเตอรี่",
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: "hist_4",
    storeId: "store_2",
    productId: "prod_7",
    productName: "GS MFX-60L",
    type: "IN",
    amount: 10,
    balanceAfter: 10,
    reason: "รับเข้าคลังสินค้าออนไลน์ ล็อตใหม่",
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: "hist_5",
    storeId: "store_2",
    productId: "prod_7",
    productName: "GS MFX-60L",
    type: "OUT",
    amount: 6,
    balanceAfter: 4,
    reason: "แพ็คส่งออเดอร์ Shopee / TikTok",
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

class MultiStoreStockApp {
  constructor() {
    this.stores = [];
    this.products = [];
    this.history = [];

    this.currentStoreId = null; // null = Hub view
    this.activeTab = 'inventory'; // within store view
    this.inventoryViewMode = 'table'; // 'table' (ตารางย่อ 4 ช่อง) or 'cards'
    this.searchQuery = '';
    this.categoryFilter = 'ALL';
    this.historyFilter = 'ALL';

    this.init();
  }

  init() {
    this.loadState();
    this.bindEvents();
    this.render();
  }

  loadState() {
    const savedStores = localStorage.getItem('smartstock_stores');
    const savedProducts = localStorage.getItem('smartstock_products');
    const savedHistory = localStorage.getItem('smartstock_history');
    const savedTheme = localStorage.getItem('smartstock_theme');
    const savedCurrentStore = localStorage.getItem('smartstock_current_store');

    if (savedStores) {
      try {
        this.stores = JSON.parse(savedStores);
      } catch (e) {
        this.stores = JSON.parse(JSON.stringify(DEFAULT_STORES));
      }
    } else {
      this.stores = JSON.parse(JSON.stringify(DEFAULT_STORES));
    }

    if (savedProducts) {
      try {
        this.products = JSON.parse(savedProducts);
      } catch (e) {
        this.products = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
      }
    } else {
      this.products = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
    }

    if (savedHistory) {
      try {
        this.history = JSON.parse(savedHistory);
      } catch (e) {
        this.history = JSON.parse(JSON.stringify(DEFAULT_HISTORY));
      }
    } else {
      this.history = JSON.parse(JSON.stringify(DEFAULT_HISTORY));
    }

    // Auto-migrate and upgrade data schema
    this.upgradeAndMigrateData();

    if (savedTheme === 'dark') {
      document.body.setAttribute('data-theme', 'dark');
    }

    if (savedCurrentStore && this.stores.some(s => s.id === savedCurrentStore)) {
      this.currentStoreId = savedCurrentStore;
    } else {
      this.currentStoreId = null;
    }
  }

  // ระบบตรวจสอบและอัปเกรดความสมบูรณ์ของโครงสร้างข้อมูล (Data Integrity & Schema Upgrade)
  upgradeAndMigrateData() {
    let hasChanges = false;

    // 1. ตรวจสอบร้านค้า (Stores)
    if (!this.stores || this.stores.length === 0) {
      this.stores = JSON.parse(JSON.stringify(DEFAULT_STORES));
      hasChanges = true;
    }

    this.stores = this.stores.map((s, idx) => {
      let updatedStore = { ...s };
      let changed = false;
      const expectedCode = String(idx + 1).padStart(2, '0');
      if (!updatedStore.code) {
        updatedStore.code = expectedCode;
        changed = true;
      }
      if (!updatedStore.createdAt) {
        updatedStore.createdAt = new Date().toISOString();
        changed = true;
      }
      if (changed) hasChanges = true;
      return updatedStore;
    });

    const storeIds = new Set(this.stores.map(s => s.id));
    const fallbackStoreId = this.stores[0]?.id || 'store_1';

    // 2. ตรวจสอบสินค้า (Products)
    const defaultCosts = {
      'GS-46B24L': 1400,
      '3K-55D23L': 1600,
      'FB-105D31L': 2200,
      'AMR-LN3': 2500,
      'PANA-50B24L': 1500,
      'YUA-75D23L': 1750,
      'GS-MFX60L': 1650,
      '3K-MAX75R': 1800,
      'FB-S95': 2700,
      'AMR-85D23L': 2100
    };

    if (!this.products) this.products = [];

    // Migrate default clothing store to Battery Shop if detected
    const firstStore = this.stores[0];
    const hasClothing = this.products.some(p => p.name && (p.name.includes("เสื้อยืด") || p.name.includes("กางเกง")));
    if (firstStore && (firstStore.name.includes("หน้าร้านสยาม") || hasClothing)) {
      this.stores[0] = {
        ...this.stores[0],
        name: "สาขา 1 (ร้านขายแบตเตอรี่)",
        desc: "สต็อกแบตเตอรี่รถยนต์หน้าร้าน พร้อมตรวจนับและคำนวณสั่งเพิ่มอัตโนมัติ"
      };
      const otherProducts = this.products.filter(p => p.storeId !== this.stores[0].id && !p.name.includes("เสื้อยืด") && !p.name.includes("กางเกง"));
      this.products = [...DEFAULT_PRODUCTS, ...otherProducts];
      this.history = [...DEFAULT_HISTORY];
      hasChanges = true;
    }

    // Auto-populate default products for store_2 if store_2 exists but has no products
    const hasStore2 = this.stores.some(s => s.id === 'store_2');
    const store2HasProducts = this.products.some(p => p.storeId === 'store_2');
    if (hasStore2 && !store2HasProducts) {
      const defaultStore2Products = DEFAULT_PRODUCTS.filter(p => p.storeId === 'store_2');
      if (defaultStore2Products.length > 0) {
        this.products.push(...JSON.parse(JSON.stringify(defaultStore2Products)));
        hasChanges = true;
      }
    }

    this.products = this.products.map(p => {
      let updated = { ...p };
      let changed = false;

      // จัดการสินค้าที่ไม่มีสาขาหรือสาขาถูกลบ (Orphaned product fallback)
      if (!updated.storeId || !storeIds.has(updated.storeId)) {
        updated.storeId = fallbackStoreId;
        changed = true;
      }

      // ตรวจสอบราคาทุน (costPrice)
      if (updated.costPrice === undefined || updated.costPrice === null || isNaN(updated.costPrice)) {
        updated.costPrice = defaultCosts[p.sku] || Math.round((p.price || 0) * 0.75);
        changed = true;
      }

      // ตรวจสอบราคาขาย (price)
      if (updated.price === undefined || updated.price === null || isNaN(updated.price)) {
        updated.price = Math.round((updated.costPrice || 0) * 1.3);
        changed = true;
      }

      // ตรวจสอบสต็อกเป้าหมายและจำนวนนับได้จริง
      if (typeof updated.minAlert !== 'number' || isNaN(updated.minAlert)) {
        updated.minAlert = parseInt(updated.minAlert, 10) || 5;
        changed = true;
      }
      if (typeof updated.quantity !== 'number' || isNaN(updated.quantity)) {
        updated.quantity = parseInt(updated.quantity, 10) || 0;
        changed = true;
      }

      // เคลียร์หน่วยนับตกค้าง 'ลูก'
      if (updated.unit === 'ลูก') {
        updated.unit = '';
        changed = true;
      }

      if (!updated.updatedAt) {
        updated.updatedAt = new Date().toISOString();
        changed = true;
      }

      if (changed) hasChanges = true;
      return updated;
    });

    // 3. ตรวจสอบประวัติ (History)
    if (!this.history) this.history = [];
    this.history = this.history.map(h => {
      let updated = { ...h };
      let changed = false;
      if (!updated.storeId || !storeIds.has(updated.storeId)) {
        updated.storeId = fallbackStoreId;
        changed = true;
      }
      if (!updated.timestamp) {
        updated.timestamp = new Date().toISOString();
        changed = true;
      }
      if (typeof updated.amount !== 'number') {
        updated.amount = parseInt(updated.amount, 10) || 1;
        changed = true;
      }
      if (changed) hasChanges = true;
      return updated;
    });

    if (hasChanges) {
      this.saveStores();
      this.saveProducts();
      this.saveHistory();
    }

    return hasChanges;
  }

  saveStores() {
    localStorage.setItem('smartstock_stores', JSON.stringify(this.stores));
  }

  saveProducts() {
    localStorage.setItem('smartstock_products', JSON.stringify(this.products));
  }

  saveHistory() {
    localStorage.setItem('smartstock_history', JSON.stringify(this.history));
  }

  bindEvents() {
    // Theme Switcher
    document.getElementById('themeToggleBtn').addEventListener('click', () => {
      const isDark = document.body.getAttribute('data-theme') === 'dark';
      if (isDark) {
        document.body.removeAttribute('data-theme');
        localStorage.setItem('smartstock_theme', 'light');
        this.showToast('เปลี่ยนเป็นโหมดสว่าง ☀️');
      } else {
        document.body.setAttribute('data-theme', 'dark');
        localStorage.setItem('smartstock_theme', 'dark');
        this.showToast('เปลี่ยนเป็นโหมดมืด 🌙');
      }
    });

    // Brand click = return to Hub
    document.getElementById('brandHomeTrigger').addEventListener('click', () => {
      this.goToHubView();
    });

    // Back to Hub button
    document.getElementById('backToHubBtn').addEventListener('click', () => {
      this.goToHubView();
    });

    // Store Modal
    const storeModal = document.getElementById('storeModal');
    const openAddStoreBtn = document.getElementById('openAddStoreBtn');
    const closeStoreModalBtn = document.getElementById('closeStoreModalBtn');
    const cancelStoreBtn = document.getElementById('cancelStoreBtn');
    const storeForm = document.getElementById('storeForm');

    openAddStoreBtn.addEventListener('click', () => this.openStoreModal());
    closeStoreModalBtn.addEventListener('click', () => this.closeModal(storeModal));
    cancelStoreBtn.addEventListener('click', () => this.closeModal(storeModal));
    storeForm.addEventListener('submit', (e) => this.handleSaveStore(e));

    // Edit Current Store button
    document.getElementById('editCurrentStoreBtn').addEventListener('click', () => {
      const store = this.stores.find(s => s.id === this.currentStoreId);
      if (store) this.openStoreModal(store);
    });

    // Navigation Tabs in Store
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchTab(tab.dataset.tab);
      });
    });

    // Low stock trigger card in metrics (if exists)
    const lowStockCard = document.getElementById('cardLowStockTrigger');
    if (lowStockCard) {
      lowStockCard.addEventListener('click', () => {
        this.switchTab('alerts');
      });
    }

    // Search and Filters
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');

    searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.trim().toLowerCase();
      clearSearchBtn.hidden = !this.searchQuery;
      this.renderProducts();
    });

    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      this.searchQuery = '';
      clearSearchBtn.hidden = true;
      this.renderProducts();
    });

    const catFilterEl = document.getElementById('categoryFilter');
    if (catFilterEl) {
      catFilterEl.addEventListener('change', (e) => {
        this.categoryFilter = e.target.value;
        this.renderProducts();
      });
    }

    document.getElementById('historyFilterType').addEventListener('change', (e) => {
      this.historyFilter = e.target.value;
      this.renderHistory();
    });

    // View mode toggles (ตารางย่อ 4 ช่อง / การ์ด)
    const viewTableBtn = document.getElementById('viewModeTableBtn');
    const viewCardsBtn = document.getElementById('viewModeCardsBtn');
    if (viewTableBtn) viewTableBtn.addEventListener('click', () => this.switchInventoryView('table'));
    if (viewCardsBtn) viewCardsBtn.addEventListener('click', () => this.switchInventoryView('cards'));

    // Send order to LINE button
    const copyOrderBtn = document.getElementById('copyOrderListBtn');
    if (copyOrderBtn) copyOrderBtn.addEventListener('click', () => this.sendOrderListToLine());

    // LINE Settings
    const openLineSettingsBtn = document.getElementById('openLineSettingsBtn');
    const lineSettingsModal = document.getElementById('lineSettingsModal');
    const closeLineSettingsModalBtn = document.getElementById('closeLineSettingsModalBtn');
    const cancelLineSettingsBtn = document.getElementById('cancelLineSettingsBtn');
    const clearLineSettingsBtn = document.getElementById('clearLineSettingsBtn');
    const lineSettingsForm = document.getElementById('lineSettingsForm');

    if (openLineSettingsBtn) openLineSettingsBtn.addEventListener('click', () => this.openLineSettingsModal());
    if (closeLineSettingsModalBtn) closeLineSettingsModalBtn.addEventListener('click', () => this.closeModal(lineSettingsModal));
    if (cancelLineSettingsBtn) cancelLineSettingsBtn.addEventListener('click', () => this.closeModal(lineSettingsModal));
    if (clearLineSettingsBtn) clearLineSettingsBtn.addEventListener('click', () => this.clearLineSettings());
    if (lineSettingsForm) lineSettingsForm.addEventListener('submit', (e) => this.handleSaveLineSettings(e));

    const openLineFromBackupBtn = document.getElementById('openLineFromBackupBtn');
    if (openLineFromBackupBtn) {
      openLineFromBackupBtn.addEventListener('click', () => {
        const backupModal = document.getElementById('backupModal');
        if (backupModal) this.closeModal(backupModal);
        this.openLineSettingsModal();
      });
    }

    // Product Modal
    const productModal = document.getElementById('productModal');
    document.getElementById('openAddModalBtn').addEventListener('click', () => this.openProductModal());
    document.getElementById('closeProductModalBtn').addEventListener('click', () => this.closeModal(productModal));
    document.getElementById('cancelProductBtn').addEventListener('click', () => this.closeModal(productModal));
    document.getElementById('productForm').addEventListener('submit', (e) => this.handleSaveProduct(e));

    // Stock Adjust Modal
    const actionModal = document.getElementById('stockActionModal');
    document.getElementById('btnTypeIn').addEventListener('click', () => this.setActionType('IN'));
    document.getElementById('btnTypeOut').addEventListener('click', () => this.setActionType('OUT'));
    document.getElementById('closeActionModalBtn').addEventListener('click', () => this.closeModal(actionModal));
    document.getElementById('cancelActionBtn').addEventListener('click', () => this.closeModal(actionModal));
    document.getElementById('stockActionForm').addEventListener('submit', (e) => this.handleSaveStockAction(e));

    // Backup & Restore
    const backupModal = document.getElementById('backupModal');
    document.getElementById('backupBtn').addEventListener('click', () => this.openModal(backupModal));
    document.getElementById('closeBackupModalBtn').addEventListener('click', () => this.closeModal(backupModal));
    document.getElementById('closeBackupFooterBtn').addEventListener('click', () => this.closeModal(backupModal));
    document.getElementById('exportJsonBtn').addEventListener('click', () => this.exportBackup());

    const importFileInput = document.getElementById('importFileInput');
    document.getElementById('importJsonBtn').addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', (e) => this.importBackup(e));

    // Load Sample Data
    document.getElementById('loadSampleDataBtn').addEventListener('click', () => {
      if (confirm('ต้องการโหลดข้อมูลตัวอย่างร้านค้าและสินค้าหรือไม่? ข้อมูลปัจจุบันจะถูกแทนที่')) {
        this.stores = JSON.parse(JSON.stringify(DEFAULT_STORES));
        this.products = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
        this.history = JSON.parse(JSON.stringify(DEFAULT_HISTORY));
        this.saveStores();
        this.saveProducts();
        this.saveHistory();
        this.currentStoreId = null;
        this.render();
        this.closeModal(backupModal);
        this.showToast('โหลดข้อมูลตัวอย่าง 2 สาขาเรียบร้อย 🎉', 'success');
      }
    });

    // Reset All Data
    document.getElementById('resetAllDataBtn').addEventListener('click', () => {
      if (confirm('คำเตือน: คุณแน่ใจหรือไม่ว่าต้องการล้างร้านค้าและสต็อกทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
        this.stores = [];
        this.products = [];
        this.history = [];
        this.saveStores();
        this.saveProducts();
        this.saveHistory();
        this.currentStoreId = null;
        this.render();
        this.closeModal(backupModal);
        this.showToast('ล้างข้อมูลเรียบร้อยแล้ว', 'warning');
      }
    });

    // Close on outside modal click
    window.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        this.closeModal(e.target);
      }
    });

    // Voice Input System Initialization
    this.initVoiceSystem();

    // Scan Bill / Image Import System Initialization
    this.initScanBillSystem();
  }

  // View Navigation
  goToHubView() {
    this.currentStoreId = null;
    localStorage.removeItem('smartstock_current_store');
    this.render();
  }

  selectStore(storeId) {
    this.currentStoreId = storeId;
    localStorage.setItem('smartstock_current_store', storeId);
    this.activeTab = 'inventory';
    this.searchQuery = '';
    this.categoryFilter = 'ALL';
    this.render();
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}Tab`);
    });

    if (tabName === 'alerts') {
      this.renderAlerts();
    } else if (tabName === 'history') {
      this.renderHistory();
    }
  }

  openModal(elem) {
    elem.classList.add('active');
  }

  closeModal(elem) {
    elem.classList.remove('active');
    this.stopAnyActiveVoice();
  }

  // Store Management
  openStoreModal(store = null) {
    const modal = document.getElementById('storeModal');
    const form = document.getElementById('storeForm');
    const title = document.getElementById('storeModalTitle');
    const editIdInput = document.getElementById('editStoreId');
    const codeInput = document.getElementById('storeCodeInput');
    const descInput = document.getElementById('storeDescInput');

    form.reset();

    if (store) {
      title.textContent = 'แก้ไขข้อมูลร้านค้า';
      editIdInput.value = store.id;
      document.getElementById('storeNameInput').value = store.name;
      if (codeInput) codeInput.value = store.code || '01';
      descInput.value = store.desc || '';
    } else {
      title.textContent = 'เพิ่มร้านค้าใหม่';
      editIdInput.value = '';
      const nextNum = this.stores.length + 1;
      if (codeInput) codeInput.value = String(nextNum).padStart(2, '0');
      descInput.value = '';
    }

    this.openModal(modal);
  }

  handleSaveStore(e) {
    e.preventDefault();
    const editId = document.getElementById('editStoreId').value;
    const name = document.getElementById('storeNameInput').value.trim();
    const codeInput = document.getElementById('storeCodeInput');
    const code = codeInput ? codeInput.value.trim() : '';
    const desc = document.getElementById('storeDescInput').value.trim();

    if (editId) {
      const index = this.stores.findIndex(s => s.id === editId);
      if (index !== -1) {
        this.stores[index] = {
          ...this.stores[index],
          name,
          desc
        };
        this.showToast(`แก้ไขร้าน "${name}" เรียบร้อย`, 'success');
      }
    } else {
      const nextNum = this.stores.length + 1;
      const storeCode = code || String(nextNum).padStart(2, '0');
      const newStore = {
        id: 'store_' + Date.now(),
        code: storeCode,
        name,
        desc,
        createdAt: new Date().toISOString()
      };
      this.stores.push(newStore);
      this.showToast(`เพิ่มร้าน "${name}" (#${newStore.code}) เรียบร้อย 🎉`, 'success');
    }

    this.saveStores();
    this.closeModal(document.getElementById('storeModal'));
    this.render();
  }

  deleteStore(storeId) {
    const store = this.stores.find(s => s.id === storeId);
    if (!store) return;

    const itemCount = this.products.filter(p => p.storeId === storeId).length;
    const msg = itemCount > 0 
      ? `คุณต้องการลบร้าน "${store.name}" พร้อมสินค้าทั้ง ${itemCount} รายการในร้านนี้หรือไม่?`
      : `คุณต้องการลบร้าน "${store.name}" หรือไม่?`;

    if (confirm(msg)) {
      this.stores = this.stores.filter(s => s.id !== storeId);
      this.products = this.products.filter(p => p.storeId !== storeId);
      this.history = this.history.filter(h => h.storeId !== storeId);
      this.saveStores();
      this.saveProducts();
      this.saveHistory();

      if (this.currentStoreId === storeId) {
        this.currentStoreId = null;
        localStorage.removeItem('smartstock_current_store');
      }

      this.render();
      this.showToast(`ลบร้าน "${store.name}" เรียบร้อยแล้ว`, 'warning');
    }
  }

  setModalUnit(unit) {
    const input = document.getElementById('prodUnit');
    if (input) input.value = unit;
    document.querySelectorAll('.unit-quick-chip').forEach(chip => {
      chip.classList.toggle('active', chip.textContent.trim() === unit);
    });
  }

  // Product Management
  openProductModal(product = null) {
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');
    const title = document.getElementById('modalTitle');
    const editIdInput = document.getElementById('editProductId');
    const store = this.stores.find(s => s.id === this.currentStoreId);
    const isBattery = store && store.name.includes('แบต');

    form.reset();

    const deleteBtn = document.getElementById('deleteProductModalBtn');

    if (product) {
      title.textContent = 'แก้ไขรายการสินค้า';
      editIdInput.value = product.id;
      if (deleteBtn) {
        deleteBtn.style.display = 'inline-flex';
        deleteBtn.onclick = () => {
          this.closeModal(modal);
          this.deleteProduct(product.id);
        };
      }
      document.getElementById('prodName').value = product.name;
      const skuEl = document.getElementById('prodSku');
      if (skuEl) skuEl.value = product.sku || '';
      const catEl = document.getElementById('prodCategory');
      if (catEl) catEl.value = product.category || '';
      document.getElementById('prodCostPrice').value = product.costPrice !== undefined ? product.costPrice : Math.round((product.price || 0) * 0.75);
      document.getElementById('prodPrice').value = product.price || 0;
      document.getElementById('prodMinAlert').value = product.minAlert || 5;
      document.getElementById('prodQuantity').value = product.quantity !== undefined ? product.quantity : 5;
      const currentUnit = (product.unit && product.unit !== 'ลูก') ? product.unit : '';
      document.getElementById('prodUnit').value = currentUnit;
      this.setModalUnit(currentUnit);
    } else {
      title.textContent = `เพิ่มรายการใน "${store ? store.name : 'ร้านนี้'}"`;
      editIdInput.value = '';
      if (deleteBtn) {
        deleteBtn.style.display = 'none';
        deleteBtn.onclick = null;
      }
      const skuEl = document.getElementById('prodSku');
      if (skuEl) skuEl.value = '';
      const catEl = document.getElementById('prodCategory');
      if (catEl) catEl.value = isBattery ? 'แบตเตอรี่' : 'ทั่วไป';

      // Smart Defaults for easiest and fastest input
      const defaultUnit = '';
      document.getElementById('prodCostPrice').value = isBattery ? 1400 : 180;
      document.getElementById('prodPrice').value = isBattery ? 1850 : 250;
      document.getElementById('prodMinAlert').value = 5;
      document.getElementById('prodQuantity').value = 5;
      document.getElementById('prodUnit').value = defaultUnit;
      this.setModalUnit(defaultUnit);
    }

    this.openModal(modal);
    setTimeout(() => {
      const nameInput = document.getElementById('prodName');
      if (nameInput) nameInput.focus();
    }, 150);
  }

  handleSaveProduct(e) {
    e.preventDefault();
    if (!this.currentStoreId) {
      this.showToast('กรุณาเลือกร้านค้าก่อนเพิ่มสินค้า', 'warning');
      return;
    }

    const store = this.stores.find(s => s.id === this.currentStoreId);
    const isBattery = store && store.name.includes('แบต');
    const defaultCat = isBattery ? 'แบตเตอรี่' : 'ทั่วไป';
    const defaultUnit = '';

    const editId = document.getElementById('editProductId').value;
    const name = document.getElementById('prodName').value.trim();
    if (!name) {
      this.showToast('กรุณากรอกชื่อรายการสินค้า', 'warning');
      return;
    }

    const skuEl = document.getElementById('prodSku');
    const sku = skuEl ? skuEl.value.trim() : '';
    const catEl = document.getElementById('prodCategory');
    const category = catEl ? (catEl.value.trim() || defaultCat) : defaultCat;

    const costPrice = parseFloat(document.getElementById('prodCostPrice').value) || 0;
    const price = parseFloat(document.getElementById('prodPrice').value) || 0;
    const minAlert = parseInt(document.getElementById('prodMinAlert').value, 10) || 0;
    const quantity = parseInt(document.getElementById('prodQuantity').value, 10) || 0;
    const unit = document.getElementById('prodUnit').value.trim() || defaultUnit;

    if (editId) {
      const index = this.products.findIndex(p => p.id === editId);
      if (index !== -1) {
        const oldQty = this.products[index].quantity;
        this.products[index] = {
          ...this.products[index],
          name,
          sku,
          category,
          quantity,
          minAlert,
          costPrice,
          price,
          unit,
          updatedAt: new Date().toISOString()
        };

        if (oldQty !== quantity) {
          const diff = quantity - oldQty;
          this.logHistory({
            storeId: this.currentStoreId,
            productId: editId,
            productName: name,
            type: diff > 0 ? 'IN' : 'OUT',
            amount: Math.abs(diff),
            balanceAfter: quantity,
            reason: 'ปรับยอดคงเหลือจากการแก้ไขข้อมูล'
          });
        }
        this.showToast(`แก้ไขข้อมูล "${name}" สำเร็จ`, 'success');
      }
    } else {
      const newProduct = {
        id: 'prod_' + Date.now(),
        storeId: this.currentStoreId,
        name,
        sku: sku || '',
        category,
        quantity,
        minAlert,
        costPrice,
        price,
        unit,
        updatedAt: new Date().toISOString()
      };
      this.products.unshift(newProduct);

      if (quantity > 0) {
        this.logHistory({
          storeId: this.currentStoreId,
          productId: newProduct.id,
          productName: name,
          type: 'IN',
          amount: quantity,
          balanceAfter: quantity,
          reason: 'เพิ่มสินค้าใหม่เข้าร้าน'
        });
      }

      this.showToast(`เพิ่ม "${name}" เข้าร้านสำเร็จ 🎉`, 'success');
    }

    this.saveProducts();
    this.closeModal(document.getElementById('productModal'));
    this.render();
  }

  // Stock Adjustment (IN/OUT)
  openStockAction(productId, type = 'IN') {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    document.getElementById('actionProductId').value = product.id;
    document.getElementById('actionProdName').textContent = product.name;
    document.getElementById('actionCurrentStock').textContent = product.quantity;
    document.getElementById('actionProdUnit').textContent = product.unit || 'ชิ้น';
    document.getElementById('actionAmount').value = '';
    document.getElementById('actionReason').value = '';

    this.setActionType(type);
    this.openModal(document.getElementById('stockActionModal'));
    setTimeout(() => {
      document.getElementById('actionAmount').focus();
    }, 150);
  }

  setActionType(type) {
    document.getElementById('actionType').value = type;
    const btnIn = document.getElementById('btnTypeIn');
    const btnOut = document.getElementById('btnTypeOut');
    const title = document.getElementById('actionModalTitle');

    if (type === 'IN') {
      btnIn.classList.add('active');
      btnOut.classList.remove('active');
      title.textContent = '📥 รับของเข้าสต็อก';
      document.getElementById('confirmActionBtn').textContent = 'บันทึกรับของเข้า';
    } else {
      btnOut.classList.add('active');
      btnIn.classList.remove('active');
      title.textContent = '📤 ตัดของออกจากสต็อก';
      document.getElementById('confirmActionBtn').textContent = 'บันทึกตัดของออก';
    }
  }

  handleSaveStockAction(e) {
    e.preventDefault();
    const prodId = document.getElementById('actionProductId').value;
    const type = document.getElementById('actionType').value;
    const amount = parseInt(document.getElementById('actionAmount').value, 10);
    const reasonInput = document.getElementById('actionReason').value.trim();

    if (!amount || amount <= 0) {
      alert('กรุณากรอกจำนวนที่ถูกต้อง (มากกว่า 0)');
      return;
    }

    const product = this.products.find(p => p.id === prodId);
    if (!product) return;

    if (type === 'OUT' && amount > product.quantity) {
      alert(`ไม่สามารถตัดของออกได้! จำนวนคงเหลือมีเพียง ${product.quantity} ${product.unit}`);
      return;
    }

    const defaultReason = type === 'IN' ? 'รับของเข้าเพิ่ม' : 'ตัดของออก/ขาย';
    const reason = reasonInput || defaultReason;

    if (type === 'IN') {
      product.quantity += amount;
    } else {
      product.quantity -= amount;
    }
    product.updatedAt = new Date().toISOString();

    this.logHistory({
      storeId: product.storeId,
      productId: product.id,
      productName: product.name,
      type: type,
      amount: amount,
      balanceAfter: product.quantity,
      reason: reason
    });

    this.saveProducts();
    this.closeModal(document.getElementById('stockActionModal'));
    this.render();

    const actionText = type === 'IN' ? `เพิ่ม +${amount}` : `ตัดออก -${amount}`;
    this.showToast(`${actionText} ${product.unit} ("${product.name}") สำเร็จ!`, 'success');
  }

  deleteProduct(productId) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    if (confirm(`คุณต้องการลบ "${product.name}" ออกจากร้านนี้หรือไม่?`)) {
      this.products = this.products.filter(p => p.id !== productId);
      this.saveProducts();
      this.render();
      this.showToast(`ลบ "${product.name}" เรียบร้อยแล้ว`, 'warning');
    }
  }

  logHistory(record) {
    const historyItem = {
      id: 'hist_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      ...record
    };
    this.history.unshift(historyItem);
    this.saveHistory();
  }

  // Backup & Restore
  exportBackup() {
    const backupData = {
      app: 'MultiStoreSmartStock',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      stores: this.stores,
      products: this.products,
      history: this.history,
      lineSettings: {
        target: localStorage.getItem('smartstock_line_target') || '',
        header: localStorage.getItem('smartstock_line_header') || ''
      }
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    const dateFormatted = new Date().toISOString().slice(0, 10);
    downloadAnchor.setAttribute("download", `multistock-backup-${dateFormatted}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    this.showToast('ดาวน์โหลดไฟล์สำรองทุกร้านเรียบร้อย 💾', 'success');
  }

  importBackup(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (Array.isArray(parsed.stores) && Array.isArray(parsed.products)) {
          this.stores = parsed.stores;
          this.products = parsed.products;
          this.history = Array.isArray(parsed.history) ? parsed.history : [];

          // Restore LINE configuration if present in backup
          if (parsed.lineSettings) {
            if (parsed.lineSettings.target) {
              localStorage.setItem('smartstock_line_target', parsed.lineSettings.target);
            }
            if (parsed.lineSettings.header) {
              localStorage.setItem('smartstock_line_header', parsed.lineSettings.header);
            }
          }

          // Automatically upgrade and sanitize imported data schema
          this.upgradeAndMigrateData();
          this.saveStores();
          this.saveProducts();
          this.saveHistory();
          this.currentStoreId = null;
          this.render();
          this.closeModal(document.getElementById('backupModal'));
          this.showToast('กู้คืนและอัปเกรดข้อมูลทุกสาขาสำเร็จเรียบร้อย! 🎉', 'success');
        } else {
          alert('รูปแบบไฟล์ JSON ไม่ถูกต้องสำหรับระบบ SmartStock');
        }
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์ JSON');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span>${message}</span>
      <span style="cursor:pointer; opacity: 0.7;" onclick="this.parentElement.remove()">&times;</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 3200);
  }

  // Master Render Loop
  render() {
    const hubView = document.getElementById('storesHubView');
    const detailView = document.getElementById('storeDetailView');
    const subtitle = document.getElementById('headerSubtitle');
    const brandHome = document.getElementById('brandHomeTrigger');
    const headerStoreInfo = document.getElementById('headerStoreInfo');
    const editBtn = document.getElementById('editCurrentStoreBtn');
    const openAddStoreBtn = document.getElementById('openAddStoreBtn');
    const backToHubBtn = document.getElementById('backToHubBtn');

    if (!this.currentStoreId) {
      // Show Hub View
      hubView.style.display = 'block';
      detailView.style.display = 'none';
      if (brandHome) brandHome.style.display = 'flex';
      if (headerStoreInfo) headerStoreInfo.style.display = 'none';
      if (editBtn) editBtn.style.display = 'none';
      if (openAddStoreBtn) openAddStoreBtn.style.display = 'inline-flex';
      if (backToHubBtn) backToHubBtn.style.display = 'none';
      if (subtitle) subtitle.textContent = 'เลือกร้านค้าเพื่อเริ่มต้น';
      this.renderHub();
    } else {
      // Show Store Detail View
      const currentStore = this.stores.find(s => s.id === this.currentStoreId);
      if (!currentStore) {
        this.goToHubView();
        return;
      }

      hubView.style.display = 'none';
      detailView.style.display = 'block';
      if (brandHome) brandHome.style.display = 'none';
      if (headerStoreInfo) headerStoreInfo.style.display = 'flex';
      if (editBtn) editBtn.style.display = 'none'; // หน้านี้ไม่ได้ใช้ ซ่อนตามคำขอ
      if (openAddStoreBtn) openAddStoreBtn.style.display = 'none'; // หน้านี้ไม่ได้ใช้ ซ่อนตามคำขอ
      if (backToHubBtn) backToHubBtn.style.display = 'inline-flex'; // แสดงปุ่มเลือกร้านอื่นที่แถบ Header ด้านบน
      if (subtitle) subtitle.textContent = `กำลังจัดการ: ${currentStore.name}`;

      const nameEl = document.getElementById('currentStoreName');
      if (nameEl) nameEl.textContent = currentStore.name;
      const codeBadge = document.getElementById('currentStoreCode');
      if (codeBadge) codeBadge.textContent = currentStore.code ? `#${currentStore.code}` : '#01';

      this.renderStoreDetail();
    }
  }

  // Render Hub
  renderHub() {
    const grid = document.getElementById('storesGrid');
    const emptyState = document.getElementById('emptyStoresState');
    const badge = document.getElementById('storesCountBadge');

    badge.textContent = `${this.stores.length} สาขา`;

    // Overview Stats
    // Product mapping (fallback unassigned products to first store)
    const firstStoreId = this.stores[0]?.id;

    if (this.stores.length === 0) {
      grid.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    grid.innerHTML = this.stores.map((store, idx) => {
      const storeCode = store.code || String(idx + 1).padStart(2, '0');
      const storeProducts = this.products.filter(p => p.storeId === store.id || (!p.storeId && store.id === firstStoreId));
      const skuCount = storeProducts.length;
      const piecesCount = storeProducts.reduce((sum, p) => sum + (p.quantity || 0), 0);
      const lowCount = storeProducts.filter(p => (p.quantity || 0) <= (p.minAlert || 0)).length;

      return `
        <article class="store-card">
          <!-- ชั้นบน: กล่องสรุปสถิติ + ปุ่มจัดการสต็อก -->
          <div class="store-card-right">
            <div class="store-stats-row">
              <div class="store-stat-item">
                <span class="store-stat-val store-stat-code">${storeCode}</span>
                <span class="store-stat-lbl">
                  <span class="lbl-desktop">รหัสสาขา</span>
                  <span class="lbl-mobile">รหัส</span>
                </span>
              </div>
              <div class="store-stat-item">
                <span class="store-stat-val">${skuCount}</span>
                <span class="store-stat-lbl">
                  <span class="lbl-desktop">รายการสินค้า</span>
                  <span class="lbl-mobile">รายการ</span>
                </span>
              </div>
              <div class="store-stat-item">
                <span class="store-stat-val">${piecesCount.toLocaleString()}</span>
                <span class="store-stat-lbl">
                  <span class="lbl-desktop">จำนวนชิ้นรวม</span>
                  <span class="lbl-mobile">ชิ้น</span>
                </span>
              </div>
            </div>

            <div class="store-card-actions">
              <button class="btn-open-store" onclick="window.app.selectStore('${store.id}')">
                <span class="btn-text-desktop">เปิดจัดการสต็อก</span>
                <span class="btn-text-mobile">เปิดสต็อก</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
              <button class="btn-card-more" title="แก้ไขข้อมูลร้าน" onclick="window.app.openEditStoreModal('${store.id}')">
                ✏️
              </button>
              <button class="btn-card-more btn-delete-store" title="ลบร้านนี้" onclick="window.app.deleteStore('${store.id}')">
                🗑️
              </button>
            </div>
          </div>

          <!-- ชั้นล่าง: ชื่อสาขา + ป้ายสถานะ + คำอธิบายร้าน -->
          <div class="store-card-left">
            <div class="store-info-content">
              <div class="store-title-wrap">
                <h4 class="store-name-title">${this.escapeHtml(store.name)}</h4>
                <div class="store-status-wrap">
                  ${lowCount > 0 ? `<span class="stock-status-pill status-warning">⚠️ ใกล้หมด ${lowCount}</span>` : `<span class="stock-status-pill status-normal">ปกติ</span>`}
                </div>
              </div>
              <p class="store-desc-text">${this.escapeHtml(store.desc || 'ไม่มีรายละเอียด')}</p>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  openEditStoreModal(storeId) {
    const store = this.stores.find(s => s.id === storeId);
    if (store) this.openStoreModal(store);
  }

  // Render Store Detail
  renderStoreDetail() {
    const storeProducts = this.products.filter(p => p.storeId === this.currentStoreId);
    const totalSKUs = storeProducts.length;
    const totalQuantity = storeProducts.reduce((sum, p) => sum + (p.quantity || 0), 0);
    const totalValue = storeProducts.reduce((sum, p) => sum + ((p.quantity || 0) * (p.price || 0)), 0);
    const lowStockCount = storeProducts.filter(p => (p.quantity || 0) <= (p.minAlert || 0)).length;

    const elSKU = document.getElementById('metricTotalSKUs');
    if (elSKU) elSKU.textContent = totalSKUs.toLocaleString();
    const elQty = document.getElementById('metricTotalQuantity');
    if (elQty) elQty.textContent = totalQuantity.toLocaleString();
    const elVal = document.getElementById('metricTotalValue');
    if (elVal) elVal.textContent = '฿' + totalValue.toLocaleString();
    const elLow = document.getElementById('metricLowStockCount');
    if (elLow) elLow.textContent = lowStockCount.toLocaleString();
    const elBadge = document.getElementById('alertCountBadge');
    if (elBadge) elBadge.textContent = lowStockCount;

    const hint = document.getElementById('metricLowStockHint');
    if (hint) {
      if (lowStockCount > 0) {
        hint.textContent = `มี ${lowStockCount} รายการต้องเติมด่วน`;
        hint.style.color = 'var(--danger)';
      } else {
        hint.textContent = 'สต็อกอยู่ในเกณฑ์ปลอดภัย';
        hint.style.color = 'var(--success)';
      }
    }

    this.renderCategoryFilterOptions(storeProducts);
    this.renderProducts();
    this.renderHistory();
    this.renderAlerts();
  }

  renderCategoryFilterOptions(storeProducts) {
    const select = document.getElementById('categoryFilter');
    if (!select) return;
    const currentVal = select.value;
    const categories = Array.from(new Set(storeProducts.map(p => p.category).filter(Boolean)));

    let html = `<option value="ALL">📁 ทุกหมวดหมู่ (${storeProducts.length})</option>`;
    categories.forEach(cat => {
      const count = storeProducts.filter(p => p.category === cat).length;
      html += `<option value="${cat}">${cat} (${count})</option>`;
    });

    select.innerHTML = html;
    if (categories.includes(currentVal) || currentVal === 'ALL') {
      select.value = currentVal;
    }
  }

  renderProducts() {
    const tableBody = document.getElementById('stockTableBody');
    const tableView = document.getElementById('inventoryTableView');
    const grid = document.getElementById('productGrid');
    const emptyState = document.getElementById('emptyInventoryState');
    const countBadge = document.getElementById('productCountBadge');
    const summaryBanner = document.getElementById('orderSummaryBanner');

    const store = this.stores.find(s => s.id === this.currentStoreId);
    const storeProducts = this.products.filter(p => p.storeId === this.currentStoreId);

    const queryWords = this.searchQuery ? this.searchQuery.toLowerCase().split(/\s+/).filter(Boolean) : [];

    let filtered = storeProducts.filter(p => {
      let matchesSearch = true;
      if (queryWords.length > 0) {
        // รองรับการค้นหาภาษาไทยและอังกฤษ ทั้งชื่อรุ่น, หมวดหมู่, รหัสสินค้า
        const textToSearch = `${p.name} ${p.sku || ''} ${p.category || ''}`.toLowerCase();
        // ตัดช่องว่างและขีด เพื่อให้ค้นหาแบบย่อได้ เช่น "46b24" เจอ "GS 46B24L"
        const compactText = textToSearch.replace(/[-\s]/g, '');

        matchesSearch = queryWords.every(word => {
          const compactWord = word.replace(/[-\s]/g, '');
          return textToSearch.includes(word) || (compactWord && compactText.includes(compactWord));
        });
      }

      const matchesCategory = this.categoryFilter === 'ALL' || p.category === this.categoryFilter;

      return matchesSearch && matchesCategory;
    });

    if (countBadge) countBadge.textContent = `${filtered.length} รายการ`;

    if (filtered.length === 0) {
      if (tableBody) tableBody.innerHTML = '';
      if (grid) grid.innerHTML = '';
      if (tableView) tableView.style.display = 'none';
      if (grid) grid.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    // Check items needing ordering for copy button badge
    const needOrderItems = filtered.filter(p => Math.max(0, (p.minAlert || 5) - (p.quantity || 0)) > 0);

    const copyOrderBtn = document.getElementById('copyOrderListBtn');
    if (copyOrderBtn) {
      if (needOrderItems.length > 0) {
        copyOrderBtn.className = 'btn btn-primary';
      } else {
        copyOrderBtn.className = 'btn btn-secondary';
      }
      copyOrderBtn.innerHTML = `<span>📋 สั่งของเข้า LINE</span>`;
    }

    // 1. Render Compact 4-Column Table View (แบบย่อ ง่าย เบา เร็ว ตามรูป)
    if (tableBody) {
      tableBody.innerHTML = filtered.map((item, idx) => {
        const rowNum = idx + 2;
        const target = item.minAlert || 5;
        const actual = item.quantity || 0;
        const needOrder = Math.max(0, target - actual);
        const unit = (item.unit && item.unit !== 'ลูก') ? ` ${this.escapeHtml(item.unit)}` : '';

        return `
          <tr class="${needOrder > 0 ? 'row-needs-order' : ''}">
            <!-- 1. รายการ (ชื่อสินค้า / ยี่ห้อ / รุ่น) -->
            <td>
              <div class="col-name-wrapper">
                <button class="battery-name-btn" type="button" title="คลิกเพื่อแก้ไขหรือลบสินค้านี้" onclick="window.app.editProductById('${item.id}')">
                  <span>${this.escapeHtml(item.name)}</span>
                  <span class="edit-icon-hint" aria-hidden="true">✏️</span>
                </button>
              </div>
            </td>

            <!-- 2. ราคาทุน/หน่วย -->
            <td class="text-center">
              <div class="price-val-wrapper">
                <span class="cost-price-val">฿${(item.costPrice || 0).toLocaleString()}</span>
              </div>
            </td>

            <!-- 3. ราคาขาย/หน่วย -->
            <td class="text-center">
              <div class="price-val-wrapper">
                <span class="sell-price-val">฿${(item.price || 0).toLocaleString()}</span>
              </div>
            </td>

            <!-- 4. สต็อกเป้าหมาย (คลิกพิมพ์ตัวเลข หรือกดไอคอนไมค์สั่งด้วยเสียง) -->
            <td class="text-center">
              <div class="stock-qty-cell target-cell actual-count-stepper">
                <span class="stock-qty-val val-target actual-val" id="val-target-${item.id}" title="คลิกเพื่อพิมพ์สต็อกเป้าหมาย" onclick="window.app.quickSetTarget('${item.id}')">${target}</span>
                <button class="cell-mic-btn stepper-mic-btn mic-target-btn" type="button" id="mic-target-${item.id}" title="พูดสต็อกเป้าหมาย (เช่น '5', 'เป้า 5')" onclick="window.app.toggleRowVoiceInput('${item.id}', 'target')">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="22"></line>
                  </svg>
                </button>
              </div>
            </td>

            <!-- 5. นับได้จริง (คลิกพิมพ์ตัวเลข หรือกดไอคอนไมค์สั่งด้วยเสียง) -->
            <td class="text-center">
              <div class="stock-qty-cell actual-cell actual-count-stepper">
                <span class="stock-qty-val val-actual actual-val" id="val-actual-${item.id}" title="คลิกเพื่อพิมพ์จำนวนที่นับได้ตรงๆ" onclick="window.app.quickSetCount('${item.id}')">${actual}</span>
                <button class="cell-mic-btn stepper-mic-btn mic-actual-btn" type="button" id="mic-actual-${item.id}" title="พูดจำนวนนับได้จริง (เช่น '2', 'นับได้ 2')" onclick="window.app.toggleRowVoiceInput('${item.id}', 'actual')">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="22"></line>
                  </svg>
                </button>
              </div>
            </td>

            <!-- 6. ต้องสั่งเพิ่ม (สรุปสั้นๆ: เพิ่มเท่าไร สีแดง / ไม่ต้องเพิ่ม สีเขียว) -->
            <td class="text-center">
              ${needOrder > 0 
                ? `<span class="order-badge-simple need-order">เพิ่ม ${needOrder}${unit}</span>` 
                : `<span class="order-badge-simple stock-ok">ไม่ต้องเพิ่ม</span>`}
            </td>
          </tr>
        `;
      }).join('');
    }

    // 2. Render Cards View (ทางเลือก)
    if (grid) {
      grid.innerHTML = filtered.map(item => {
        const isLow = (item.quantity || 0) <= (item.minAlert || 0);
        const isOut = (item.quantity || 0) === 0;

        let statusPill = '';
        if (isOut) {
          statusPill = `<span class="stock-status-pill status-danger">สินค้าหมด</span>`;
        } else if (isLow) {
          statusPill = `<span class="stock-status-pill status-warning">ใกล้หมดสต็อก</span>`;
        } else {
          statusPill = `<span class="stock-status-pill status-normal">ปกติ</span>`;
        }

        return `
          <article class="product-card ${isLow ? 'is-low-stock' : ''}">
            <div class="product-card-top">
              <div>
                <span class="product-sku">${this.escapeHtml(item.sku || 'SKU-NONE')}</span>
                <h3 class="product-name">${this.escapeHtml(item.name)}</h3>
                <div class="product-cat">หมวดหมู่: ${this.escapeHtml(item.category || 'ทั่วไป')}</div>
              </div>
              <div>${statusPill}</div>
            </div>

            <div class="product-stats-row">
              <div class="product-qty-block">
                <span class="product-qty-number ${isLow ? 'alert-text' : ''}">${item.quantity}</span>
                <span class="product-unit">${(item.unit && item.unit !== 'ลูก') ? this.escapeHtml(item.unit) : ''}</span>
              </div>
              <div class="product-price-block">
                <div class="product-unit-price">฿${(item.price || 0).toLocaleString()}</div>
                <div class="product-min-threshold">เป้าหมาย: ${item.minAlert}${(item.unit && item.unit !== 'ลูก') ? ' ' + this.escapeHtml(item.unit) : ''}</div>
              </div>
            </div>

            <div class="product-card-actions">
              <button class="btn-stock-in" onclick="window.app.openStockAction('${item.id}', 'IN')">
                + รับเข้า
              </button>
              <button class="btn-stock-out" onclick="window.app.openStockAction('${item.id}', 'OUT')">
                - ตัดออก
              </button>
              <button class="btn-card-more" title="แก้ไขสินค้า" onclick="window.app.editProductById('${item.id}')">
                ✏️
              </button>
              <button class="btn-card-more" title="ลบสินค้า" onclick="window.app.deleteProduct('${item.id}')">
                🗑️
              </button>
            </div>
          </article>
        `;
      }).join('');
    }

    // Apply view mode visibility
    this.switchInventoryView(this.inventoryViewMode || 'table');
  }

  switchInventoryView(mode) {
    this.inventoryViewMode = mode;
    const tableBtn = document.getElementById('viewModeTableBtn');
    const cardsBtn = document.getElementById('viewModeCardsBtn');
    const tableView = document.getElementById('inventoryTableView');
    const cardsView = document.getElementById('productGrid');

    if (mode === 'table') {
      if (tableBtn) tableBtn.classList.add('active');
      if (cardsBtn) cardsBtn.classList.remove('active');
      if (tableView) tableView.style.display = 'block';
      if (cardsView) cardsView.style.display = 'none';
    } else {
      if (cardsBtn) cardsBtn.classList.add('active');
      if (tableBtn) tableBtn.classList.remove('active');
      if (cardsView) cardsView.style.display = 'grid';
      if (tableView) tableView.style.display = 'none';
    }
  }

  quickAdjustTarget(productId, delta) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    const oldTarget = product.minAlert || 0;
    const newTarget = Math.max(0, oldTarget + delta);
    if (newTarget === oldTarget) return;

    product.minAlert = newTarget;
    product.updatedAt = new Date().toISOString();

    this.saveProducts();
    this.renderStoreDetail();
    const unitStr = (product.unit && product.unit !== 'ลูก') ? ` ${product.unit}` : '';
    this.showToast(`${product.name}: ปรับสต็อกเป้าหมายเป็น ${newTarget}${unitStr}`, 'info');
  }

  quickSetTarget(productId) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    const input = prompt(`กรอกสต็อกเป้าหมายของ "${product.name}":`, product.minAlert || 0);
    if (input === null) return;

    const newTarget = parseInt(input, 10);
    if (isNaN(newTarget) || newTarget < 0) {
      alert('กรุณากรอกตัวเลขจำนวนเต็มที่ถูกต้อง (0 ขึ้นไป)');
      return;
    }

    product.minAlert = newTarget;
    product.updatedAt = new Date().toISOString();

    this.saveProducts();
    this.renderStoreDetail();
    const unitStr = (product.unit && product.unit !== 'ลูก') ? ` ${product.unit}` : '';
    this.showToast(`อัปเดตเป้าหมาย "${product.name}" เป็น ${newTarget}${unitStr} เรียบร้อย`, 'success');
  }

  quickAdjustCount(productId, delta) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    const oldQty = product.quantity || 0;
    const newQty = Math.max(0, oldQty + delta);
    if (newQty === oldQty) return;

    product.quantity = newQty;
    product.updatedAt = new Date().toISOString();

    this.logHistory({
      storeId: product.storeId,
      productId: product.id,
      productName: product.name,
      type: delta > 0 ? 'IN' : 'OUT',
      amount: Math.abs(delta),
      balanceAfter: newQty,
      reason: 'นับสต็อกด่วนหน้าร้าน'
    });

    this.saveProducts();
    this.renderStoreDetail();
    const unitStr = (product.unit && product.unit !== 'ลูก') ? ` ${product.unit}` : '';
    this.showToast(`${product.name}: นับได้จริง ${newQty}${unitStr}`, 'info');
  }

  quickSetCount(productId) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    const input = prompt(`กรอกจำนวนที่นับได้จริงของ "${product.name}":`, product.quantity || 0);
    if (input === null) return;

    const newQty = parseInt(input, 10);
    if (isNaN(newQty) || newQty < 0) {
      alert('กรุณากรอกตัวเลขจำนวนเต็มที่ถูกต้อง (0 ขึ้นไป)');
      return;
    }

    const oldQty = product.quantity || 0;
    const diff = newQty - oldQty;
    product.quantity = newQty;
    product.updatedAt = new Date().toISOString();

    if (diff !== 0) {
      this.logHistory({
        storeId: product.storeId,
        productId: product.id,
        productName: product.name,
        type: diff > 0 ? 'IN' : 'OUT',
        amount: Math.abs(diff),
        balanceAfter: newQty,
        reason: 'ปรับยอดจากการนับสต็อก'
      });
    }

    this.saveProducts();
    this.renderStoreDetail();
    const unitStr = (product.unit && product.unit !== 'ลูก') ? ` ${product.unit}` : '';
    this.showToast(`อัปเดต "${product.name}" เป็น ${newQty}${unitStr} เรียบร้อย`, 'success');
  }

  // แยกวิเคราะห์ตัวเลขสำหรับระบบเสียงสั่งปรับสต็อก (เป้าหมาย / นับได้จริง)
  parseQuantityFromVoice(rawText) {
    if (!rawText) return null;
    let text = String(rawText).trim();

    // 1. นำ comma ในตัวเลขออก (เช่น "1,000" -> "1000")
    text = text.replace(/(\d),(\d)/g, '$1$2');

    // 2. ตรวจหาตัวเลขอารบิกโดยตรง (เช่น "5", "เป้า 5", "นับได้ 2", "10 ชิ้น")
    const numMatch = text.match(/\d+/);
    if (numMatch) {
      const val = parseInt(numMatch[0], 10);
      if (!isNaN(val)) return val;
    }

    // 3. แปลงเลขไทย (๑, ๒, ๓...)
    const thaiDigitMap = { '๐': 0, '๑': 1, '๒': 2, '๓': 3, '๔': 4, '๕': 5, '๖': 6, '๗': 7, '๘': 8, '๙': 9 };
    let thaiDigitStr = '';
    for (const ch of text) {
      if (thaiDigitMap[ch] !== undefined) thaiDigitStr += thaiDigitMap[ch];
    }
    if (thaiDigitStr.length > 0) {
      const val = parseInt(thaiDigitStr, 10);
      if (!isNaN(val)) return val;
    }

    // 4. ตัดคำนำหน้าและคำลงท้าย
    let clean = text
      .replace(/(?:สต็อกเป้าหมาย|เป้าสต็อก|สต็อกเป้า|เป้าหมาย|ตั้งเป้า|เป้า|สต็อกจริง|นับได้จริง|นับจริง|นับได้|มีสต็อก|ของมี|ยอดนับ|มีจริง|มี|เหลือ|จำนวน|ปรับเป็น)/gi, '')
      .replace(/(?:ลูก|ชิ้น|กล่อง|ตัว|ก้อน|ใบ|อัน|แพ็ค|เครื่อง|ถัง|กระป๋อง|ครับ|ค่ะ|คะ)/gi, '')
      .trim();

    // 5. แปลงเลขหลักสิบผสมหลักหน่วย (เช่น ยี่สิบสอง, สามสิบห้า, สี่สิบสอง)
    const tensMap = { 'ยี่สิบ': 20, 'สามสิบ': 30, 'สี่สิบ': 40, 'ห้าสิบ': 50, 'หกสิบ': 60, 'เจ็ดสิบ': 70, 'แปดสิบ': 80, 'เก้าสิบ': 90 };
    const onesMap = { 'หนึ่ง': 1, 'เอ็ด': 1, 'สอง': 2, 'สาม': 3, 'สี่': 4, 'ห้า': 5, 'หก': 6, 'เจ็ด': 7, 'แปด': 8, 'เก้า': 9 };
    for (const [tWord, tVal] of Object.entries(tensMap)) {
      if (clean.includes(tWord)) {
        const remainder = clean.replace(tWord, '').trim();
        if (!remainder) return tVal;
        for (const [oWord, oVal] of Object.entries(onesMap)) {
          if (remainder.includes(oWord)) {
            return tVal + oVal;
          }
        }
        return tVal;
      }
    }

    // 6. แปลงคำอ่านภาษาไทยเดี่ยวๆ
    const thaiWordMap = {
      'ศูนย์': 0, 'หนึ่ง': 1, 'เอ็ด': 1, 'สอง': 2, 'ยี่': 2, 'สาม': 3, 'สี่': 4,
      'ห้า': 5, 'หก': 6, 'เจ็ด': 7, 'แปด': 8, 'เก้า': 9, 'สิบ': 10,
      'สิบเอ็ด': 11, 'สิบสอง': 12, 'สิบสาม': 13, 'สิบสี่': 14, 'สิบห้า': 15,
      'สิบหก': 16, 'สิบเจ็ด': 17, 'สิบแปด': 18, 'สิบเก้า': 19,
      'หนึ่งร้อย': 100, 'ร้อย': 100
    };

    if (thaiWordMap[clean] !== undefined) {
      return thaiWordMap[clean];
    }

    const sortedWords = Object.keys(thaiWordMap).sort((a, b) => b.length - a.length);
    for (const w of sortedWords) {
      if (clean.includes(w)) {
        return thaiWordMap[w];
      }
    }

    return null;
  }

  // กดไอคอนไมค์ประจำช่อง (แยกอิสระ: 'target' สต็อกเป้าหมาย / 'actual' นับได้จริง)
  toggleRowVoiceInput(productId, fieldType) {
    const btnId = `mic-${fieldType}-${productId}`;
    const btn = document.getElementById(btnId);
    const isListening = btn && btn.classList.contains('listening');

    if (isListening) {
      this.stopAnyActiveVoice();
      this.playVoiceSound('error');
      return;
    }

    if (!this.speechSupported) {
      this.showToast('เบราว์เซอร์นี้ยังไม่รองรับระบบสั่งงานด้วยเสียง แนะนำให้เปิดด้วย Chrome หรือ Safari ครับ', 'warning');
      return;
    }

    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    this.stopAnyActiveVoice();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'th-TH';
    recognition.continuous = false;
    recognition.interimResults = false;

    const valEl = document.getElementById(`val-${fieldType}-${productId}`);

    if (btn) btn.classList.add('listening');
    if (valEl) valEl.classList.add('listening-val');
    this.playVoiceSound('start');
    this.activeVoiceRecognition = recognition;

    const fieldLabel = fieldType === 'target' ? 'สต็อกเป้าหมาย' : 'นับได้จริง';
    this.showToast(`🎙️ กำลังฟัง [${fieldLabel}] ของ "${product.name}"... พูดตัวเลขได้เลย`, 'info', 2500);

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      const parsedNumber = this.parseQuantityFromVoice(transcript);

      if (parsedNumber !== null && !isNaN(parsedNumber) && parsedNumber >= 0) {
        if (fieldType === 'target') {
          product.minAlert = parsedNumber;
          product.updatedAt = new Date().toISOString();
          this.saveProducts();
          this.renderStoreDetail();
          this.playVoiceSound('success');
          const unitStr = (product.unit && product.unit !== 'ลูก') ? ` ${product.unit}` : '';
          this.showToast(`🎯 ${product.name}: ปรับสต็อกเป้าหมายเป็น ${parsedNumber}${unitStr} 🎙️`, 'success');
        } else {
          const oldQty = product.quantity || 0;
          const diff = parsedNumber - oldQty;
          product.quantity = parsedNumber;
          product.updatedAt = new Date().toISOString();

          if (diff !== 0) {
            this.logHistory({
              storeId: product.storeId,
              productId: product.id,
              productName: product.name,
              type: diff > 0 ? 'IN' : 'OUT',
              amount: Math.abs(diff),
              balanceAfter: parsedNumber,
              reason: 'นับสต็อกด้วยเสียงหน้าร้าน'
            });
          }

          this.saveProducts();
          this.renderStoreDetail();
          this.playVoiceSound('success');
          const unitStr = (product.unit && product.unit !== 'ลูก') ? ` ${product.unit}` : '';
          this.showToast(`📦 ${product.name}: นับได้จริง ${parsedNumber}${unitStr} 🎙️`, 'success');
        }
      } else {
        this.playVoiceSound('error');
        this.showToast(`ได้ยินว่า "${transcript}" แต่ไม่พบตัวเลข กรุณาลองพูดตัวเลขชัดๆ อีกครั้งครับ`, 'warning');
      }
    };

    recognition.onerror = (e) => {
      this.stopAnyActiveVoice();
      this.playVoiceSound('error');
      if (e.error === 'not-allowed') {
        this.showToast('กรุณากดยินยอม (Allow) ให้เบราว์เซอร์ใช้ไมโครโฟน เพื่อสั่งงานด้วยเสียง', 'warning');
      }
    };

    recognition.onend = () => {
      if (btn) btn.classList.remove('listening');
      if (valEl) valEl.classList.remove('listening-val');
      this.activeVoiceRecognition = null;
    };

    try {
      recognition.start();
    } catch (err) {
      this.stopAnyActiveVoice();
    }
  }

  openLineSettingsModal() {
    const modal = document.getElementById('lineSettingsModal');
    if (!modal) return;
    const store = this.stores.find(s => s.id === this.currentStoreId);
    const targetInput = document.getElementById('lineTargetInput');
    const headerInput = document.getElementById('lineCustomHeaderInput');

    const savedTarget = (store && store.lineTarget) || localStorage.getItem('smartstock_line_target') || '';
    const savedHeader = (store && store.lineCustomHeader) || localStorage.getItem('smartstock_line_header') || '';

    if (targetInput) targetInput.value = savedTarget;
    if (headerInput) headerInput.value = savedHeader;

    this.openModal(modal);
    setTimeout(() => {
      if (targetInput) targetInput.focus();
    }, 150);
  }

  handleSaveLineSettings(e) {
    e.preventDefault();
    const modal = document.getElementById('lineSettingsModal');
    const targetInput = document.getElementById('lineTargetInput');
    const headerInput = document.getElementById('lineCustomHeaderInput');

    const targetVal = targetInput ? targetInput.value.trim() : '';
    const headerVal = headerInput ? headerInput.value.trim() : '';

    localStorage.setItem('smartstock_line_target', targetVal);
    if (headerVal) {
      localStorage.setItem('smartstock_line_header', headerVal);
    } else {
      localStorage.removeItem('smartstock_line_header');
    }

    if (this.currentStoreId) {
      const storeIndex = this.stores.findIndex(s => s.id === this.currentStoreId);
      if (storeIndex !== -1) {
        this.stores[storeIndex].lineTarget = targetVal;
        this.stores[storeIndex].lineCustomHeader = headerVal;
        this.saveStores();
      }
    }

    this.closeModal(modal);
    if (targetVal) {
      this.showToast(`บันทึก LINE: ${targetVal} เรียบร้อย 💬 พร้อมสั่งของ!`, 'success');
    } else {
      this.showToast('บันทึกการตั้งค่าแล้ว (จะเปิดเลือกผู้รับใน LINE ตามปกติ)', 'info');
    }
  }

  clearLineSettings() {
    const targetInput = document.getElementById('lineTargetInput');
    const headerInput = document.getElementById('lineCustomHeaderInput');
    if (targetInput) targetInput.value = '';
    if (headerInput) headerInput.value = '';

    localStorage.removeItem('smartstock_line_target');
    localStorage.removeItem('smartstock_line_header');

    if (this.currentStoreId) {
      const storeIndex = this.stores.findIndex(s => s.id === this.currentStoreId);
      if (storeIndex !== -1) {
        delete this.stores[storeIndex].lineTarget;
        delete this.stores[storeIndex].lineCustomHeader;
        this.saveStores();
      }
    }

    const modal = document.getElementById('lineSettingsModal');
    this.closeModal(modal);
    this.showToast('ล้างการตั้งค่า LINE เรียบร้อย', 'info');
  }

  sendOrderListToLine() {
    const store = this.stores.find(s => s.id === this.currentStoreId);
    const storeProducts = this.products.filter(p => p.storeId === this.currentStoreId);
    const needOrderItems = storeProducts.filter(p => Math.max(0, (p.minAlert || 5) - (p.quantity || 0)) > 0);

    if (needOrderItems.length === 0) {
      this.showToast('ทุกรุ่นมีสต็อกเพียงพอ ไม่มียอดที่ต้องสั่งเพิ่ม 🎉', 'success');
      return;
    }

    const dateStr = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    const lineTarget = (store && store.lineTarget) || localStorage.getItem('smartstock_line_target') || '';
    const customHeader = (store && store.lineCustomHeader) || localStorage.getItem('smartstock_line_header') || 'รายการสั่งของ';

    let text = `📦 ${customHeader} - ${store ? store.name : 'ร้านค้า'}\n`;
    text += `📅 วันที่: ${dateStr}\n`;
    text += `------------------------------------\n`;
    needOrderItems.forEach((p, idx) => {
      const target = p.minAlert || 5;
      const actual = p.quantity || 0;
      const need = Math.max(0, target - actual);
      const unitLabel = (p.unit && p.unit !== 'ลูก') ? ` ${p.unit}` : '';
      text += `${idx + 1}. ${p.name}\n   ┗ 🟢 จำนวน: ${need}${unitLabel}\n`;
    });
    text = text.trimEnd() + '\n';
    const totalOrder = needOrderItems.reduce((sum, p) => sum + Math.max(0, (p.minAlert || 5) - (p.quantity || 0)), 0);
    text += `------------------------------------\n`;
    text += `📌 รวมทั้งหมด: ${totalOrder}`;

    // Copy to clipboard always for safety/instant paste
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }

    let lineUrl = '';
    const cleanTarget = (lineTarget || '').trim();

    if (!cleanTarget) {
      // โหมดแชร์ LINE อิสระ (ไม่ระบุผู้รับ): รองรับทั้ง PC และมือถือ เลือกกลุ่มหรือ Keep Memo ส่งได้ทันที ไม่ติด QR Code
      lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
      window.open(lineUrl, '_blank');
      this.showToast('เปิด LINE เรียบร้อย 🚀 เลือกกลุ่มหรือ Keep Memo เพื่อส่งได้ทันที!', 'success');
      return;
    }

    if (cleanTarget.startsWith('http://') || cleanTarget.startsWith('https://')) {
      lineUrl = cleanTarget;
    } else if (cleanTarget.startsWith('@')) {
      // LINE OA: open 1-on-1 chat with prefilled text
      lineUrl = `https://line.me/R/oaMessage/${encodeURIComponent(cleanTarget)}/?${encodeURIComponent(text)}`;
    } else {
      // Personal LINE ID: open line chat or add friend profile
      lineUrl = `https://line.me/ti/p/~${encodeURIComponent(cleanTarget)}`;
    }

    window.open(lineUrl, '_blank');
    this.showToast(`คัดลอกข้อความและเปิด LINE: ${cleanTarget} เรียบร้อย 🚀 พร้อมส่งได้ทันที!`, 'success');
  }

  // Backward compatibility alias
  copyOrderList() {
    this.sendOrderListToLine();
  }

  editProductById(id) {
    const prod = this.products.find(p => p.id === id);
    if (prod) this.openProductModal(prod);
  }

  renderHistory() {
    const list = document.getElementById('historyList');
    const emptyState = document.getElementById('emptyHistoryState');

    let storeHistory = this.history.filter(h => h.storeId === this.currentStoreId);

    if (this.historyFilter !== 'ALL') {
      storeHistory = storeHistory.filter(h => h.type === this.historyFilter);
    }

    if (storeHistory.length === 0) {
      list.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    list.innerHTML = storeHistory.map(item => {
      const isIn = item.type === 'IN';
      const timeStr = this.formatDate(item.timestamp);
      const sign = isIn ? '+' : '-';
      const badgeClass = isIn ? 'in' : 'out';

      return `
        <div class="history-item">
          <div class="history-left">
            <div class="history-type-icon ${badgeClass}">
              ${isIn ? '📥' : '📤'}
            </div>
            <div class="history-details">
              <div class="history-prod-name">${this.escapeHtml(item.productName)}</div>
              <div class="history-reason">${this.escapeHtml(item.reason || '')}</div>
              <div class="history-time">${timeStr}</div>
            </div>
          </div>
          <div class="history-right">
            <div class="history-diff-badge ${badgeClass}">${sign}${item.amount}</div>
            <div class="history-balance">คงเหลือ: ${item.balanceAfter}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderAlerts() {
    const grid = document.getElementById('lowStockGrid');
    const safeState = document.getElementById('allGoodState');

    const storeProducts = this.products.filter(p => p.storeId === this.currentStoreId);
    const lowStockItems = storeProducts.filter(p => (p.quantity || 0) <= (p.minAlert || 0));

    if (lowStockItems.length === 0) {
      grid.innerHTML = '';
      safeState.style.display = 'block';
      return;
    }

    safeState.style.display = 'none';

    grid.innerHTML = lowStockItems.map(p => {
      const isOut = p.quantity === 0;
      return `
        <div class="low-stock-item">
          <div class="low-stock-info">
            <h4>${this.escapeHtml(p.name)}</h4>
            <p>
              ${isOut ? '❌ สินค้าหมดแล้ว (0 ชิ้น)' : `⚠️ เหลือเพียง ${p.quantity} ${p.unit} (จุดเตือน: ${p.minAlert})`}
            </p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="window.app.openStockAction('${p.id}', 'IN')">
            + เติมสต็อกด่วน
          </button>
        </div>
      `;
    }).join('');
  }

  formatDate(isoString) {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  }

  // ================= VOICE INPUT & SPEECH SYSTEM =================
  initVoiceSystem() {
    this.activeVoiceRecognition = null;
    this.currentVoiceTarget = null;

    // Check Speech Recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.speechSupported = !!SpeechRecognition;

    // 1. Smart Voice Button in Product Modal
    const voiceSmartBtn = document.getElementById('voiceSmartBtn');
    if (voiceSmartBtn) {
      voiceSmartBtn.addEventListener('click', () => this.toggleVoiceSmartInput());
    }

    // 2. Specific field voice button (ชื่อสินค้า)
    const voiceNameFieldBtn = document.getElementById('voiceNameFieldBtn');
    if (voiceNameFieldBtn) {
      voiceNameFieldBtn.addEventListener('click', () => this.toggleVoiceFieldInput('prodName'));
    }

    // 3. Search Bar Voice Button
    const voiceSearchBtn = document.getElementById('voiceSearchBtn');
    if (voiceSearchBtn) {
      voiceSearchBtn.addEventListener('click', () => this.toggleVoiceSearchInput());
    }
  }

  playVoiceSound(type = 'start') {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'start') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'error') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch (e) {}
  }

  normalizeVoiceText(raw) {
    if (!raw) return '';
    let text = raw.trim();

    // 1. Remove commas inside numbers (e.g. "1,400" -> "1400", "1,850" -> "1850")
    text = text.replace(/(\d),(\d)/g, '$1$2');

    // 2. Standardize common Thai battery brands into standard uppercase
    text = text.replace(/จี\s*เอส/gi, 'GS');
    text = text.replace(/สาม\s*เค|3\s*เค/gi, '3K');
    text = text.replace(/เอฟ\s*บี/gi, 'FB');
    text = text.replace(/พานาโซนิค|พานา/gi, 'Panasonic');
    text = text.replace(/ยัวซ่า|ยูอาซ่า/gi, 'Yuasa');
    text = text.replace(/อมารอน|อามารอน/gi, 'Amaron');
    text = text.replace(/โบลิเดน|โบลิเด็น/gi, 'Boliden');
    text = text.replace(/พูม่า|พูมา/gi, 'Puma');
    text = text.replace(/บ๊อช|บอช/gi, 'Bosch');
    text = text.replace(/ฮิตาชิ/gi, 'Hitachi');
    text = text.replace(/เดลคอร์/gi, 'Delkor');
    text = text.replace(/วาร์ต้า|วาร์ตา/gi, 'Varta');
    text = text.replace(/โรเค็ต|ร็อกเก็ต/gi, 'Rocket');
    text = text.replace(/ดีไอเอ็น|ดิน/gi, 'DIN');
    text = text.replace(/อี\s*เอฟ\s*บี/gi, 'EFB');
    text = text.replace(/เอ\s*จี\s*เอ็ม/gi, 'AGM');

    // 3. Convert Thai spoken numbers directly attached to action keywords
    const thaiNumMap = {
      'ศูนย์': 0, 'หนึ่ง': 1, 'สอง': 2, 'สาม': 3, 'สี่': 4,
      'ห้า': 5, 'หก': 6, 'เจ็ด': 7, 'แปด': 8, 'เก้า': 9, 'สิบ': 10
    };
    for (const [k, v] of Object.entries(thaiNumMap)) {
      // Handles both connected words (e.g. "เป้าห้า" -> "เป้า 5", "นับได้สอง" -> "นับได้ 2")
      const rKeyword = new RegExp(`(สต็อกเป้าหมาย|เป้าสต็อก|สต็อกเป้า|เป้าหมาย|ตั้งเป้า|เป้า|สต็อกจริง|นับได้จริง|นับจริง|นับได้|มีสต็อก|ของมี|ยอดนับ|มีจริง|มี|เหลือ|ทุน|ขาย)\\s*${k}`, 'gi');
      text = text.replace(rKeyword, `$1 ${v}`);
    }

    // 4. Standardize battery size letters (B, D, L, R, LN, DIN)
    text = text.replace(/(\d+)\s*(?:b|บี)\s*(\d+)\s*(?:l|แอล)/gi, '$1B$2L');
    text = text.replace(/(\d+)\s*(?:b|บี)\s*(\d+)\s*(?:r|อาร์)/gi, '$1B$2R');
    text = text.replace(/(\d+)\s*(?:d|ดี)\s*(\d+)\s*(?:l|แอล)/gi, '$1D$2L');
    text = text.replace(/(\d+)\s*(?:d|ดี)\s*(\d+)\s*(?:r|อาร์)/gi, '$1D$2R');
    text = text.replace(/(?:ln|แอล\s*เอ็น)\s*(\d+)/gi, 'LN$1');
    text = text.replace(/(?:din|ดิน|ดี\s*ไอ\s*เอ็น)\s*(\d+)/gi, 'DIN$1');

    // 5. Clean Thai polarity & vehicle terms
    text = text.replace(/ขั้ว\s*(?:แอล|l)/gi, 'ขั้ว L');
    text = text.replace(/ขั้ว\s*(?:อาร์|r)/gi, 'ขั้ว R');
    text = text.replace(/กะบะ/gi, 'กระบะ');

    return text;
  }

  parseVoiceProduct(raw) {
    let text = this.normalizeVoiceText(raw);
    const result = {
      name: '',
      costPrice: null,
      price: null,
      minAlert: null,
      quantity: null
    };

    // 1. Cost Price: "ทุน 1400", "ทุน 1,400 บาท", "รับมา 1400", "ราคาทุน 1400 บาท"
    const costMatch = text.match(/(?:ราคาทุน|ต้นทุน|ทุนลูกละ|ทุนชิ้นละ|ทุน|ซื้อมา|รับมา)\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:บาท)?/i);
    if (costMatch) {
      result.costPrice = parseFloat(costMatch[1].replace(/,/g, ''));
      text = text.replace(costMatch[0], ' ');
    }

    // 2. Selling Price: "ราคาขาย 1850", "ขาย 1850 บาท", "ขายจริง 1850", "ขายหน้าร้าน 1850"
    const priceMatch = text.match(/(?:ราคาขายจริง|ราคาขาย|ขายหน้าร้าน|ขายจริง|ขายลูกละ|ขายชิ้นละ|ขาย)\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:บาท)?/i);
    if (priceMatch) {
      result.price = parseFloat(priceMatch[1].replace(/,/g, ''));
      text = text.replace(priceMatch[0], ' ');
    }

    // 3. Target Stock: "สต็อกเป้าหมาย 5", "เป้าหมาย 5 ลูก", "ตั้งเป้า 5", "เป้า 5"
    const targetMatch = text.match(/(?:สต็อกเป้าหมาย|เป้าสต็อก|สต็อกเป้า|เป้าหมาย|ตั้งเป้า|เป้า)\s*[:=]?\s*([0-9]+)\s*(?:ลูก|ชิ้น|กล่อง|ตัว|ก้อน|ใบ)?/i);
    if (targetMatch) {
      result.minAlert = parseInt(targetMatch[1], 10);
      text = text.replace(targetMatch[0], ' ');
    }

    // 4. Actual Counted Stock: "นับได้จริง 2", "นับได้ 2", "มีจริง 2", "เหลือ 2 ลูก"
    const actualMatch = text.match(/(?:สต็อกจริง|นับได้จริง|นับจริง|นับได้|มีสต็อก|ของมี|ยอดนับ|มีจริง|มี|เหลือ)\s*[:=]?\s*([0-9]+)\s*(?:ลูก|ชิ้น|กล่อง|ตัว|ก้อน|ใบ)?/i);
    if (actualMatch) {
      result.quantity = parseInt(actualMatch[1], 10);
      text = text.replace(actualMatch[0], ' ');
    }

    // 5. Clean up stray currency words and trigger phrases from product name
    text = text.replace(/\b(?:บาท)\b/gi, ' ');
    text = text.replace(/(?:^|\s+)บาท(?:\s+|$)/gi, ' ');
    text = text.replace(/^(?:เพิ่มสินค้า|เพิ่มรายการ|เพิ่ม|บันทึก|รายการ|สินค้า)\s*/i, '');
    text = text.replace(/[,;:]+/g, ' ');
    text = text.replace(/\s+/g, ' ').trim();

    if (text.length > 0) {
      result.name = text;
    }

    return result;
  }

  stopAnyActiveVoice() {
    if (this.activeVoiceRecognition) {
      try {
        this.activeVoiceRecognition.stop();
      } catch (e) {}
      this.activeVoiceRecognition = null;
    }
    document.querySelectorAll('.stepper-mic-btn.listening').forEach(btn => btn.classList.remove('listening'));
    document.querySelectorAll('.actual-val.listening-val').forEach(el => el.classList.remove('listening-val'));
    this.setVoiceUiState('idle');
  }

  setVoiceUiState(state) {
    const smartBtn = document.getElementById('voiceSmartBtn');
    const title = document.getElementById('voiceSmartTitle');
    const indicator = document.getElementById('voiceStatusIndicator');
    const vuMeter = document.getElementById('analogVuMeter');
    const transcriptBox = document.getElementById('voiceLiveTranscript');

    if (state === 'idle') {
      if (smartBtn) {
        smartBtn.classList.remove('listening', 'connecting');
      }
      if (title) title.innerHTML = '🎙️ แตะแล้วพูดเพื่อกรอกอัตโนมัติ';
      if (indicator) {
        indicator.className = 'voice-status-indicator status-idle';
        indicator.title = 'สถานะไมค์: สแตนด์บาย (แตะเพื่อเริ่ม)';
      }
      if (vuMeter) vuMeter.classList.remove('active');
      if (transcriptBox) transcriptBox.style.display = 'none';

      const nameBtn = document.getElementById('voiceNameFieldBtn');
      if (nameBtn) nameBtn.classList.remove('listening');
      const searchBtn = document.getElementById('voiceSearchBtn');
      if (searchBtn) searchBtn.classList.remove('listening');
      document.querySelectorAll('.stepper-mic-btn.listening').forEach(btn => btn.classList.remove('listening'));
      document.querySelectorAll('.actual-val.listening-val').forEach(el => el.classList.remove('listening-val'));

    } else if (state === 'connecting') {
      if (smartBtn) {
        smartBtn.classList.remove('listening');
        smartBtn.classList.add('connecting');
      }
      if (title) title.innerHTML = '<span style="color: #f59e0b;">⏳ กำลังเชื่อมต่อไมโครโฟน...</span>';
      if (indicator) {
        indicator.className = 'voice-status-indicator status-connecting';
        indicator.title = 'กำลังเชื่อมต่อสัญญาณไมค์...';
      }
      if (vuMeter) vuMeter.classList.remove('active');

    } else if (state === 'live') {
      if (smartBtn) {
        smartBtn.classList.remove('connecting');
        smartBtn.classList.add('listening');
      }
      if (title) title.innerHTML = '<span style="color: #22c55e;">🟢 ไมค์เชื่อมต่อแล้ว... พูดได้เลยครับ</span>';
      if (indicator) {
        indicator.className = 'voice-status-indicator status-live';
        indicator.title = 'ไมค์เปิดแล้ว สัญญาณพร้อม (กำลังรับฟังเสียง)';
      }
      if (vuMeter) vuMeter.classList.add('active');
      if (transcriptBox) transcriptBox.style.display = 'flex';

    } else if (state === 'error') {
      if (smartBtn) {
        smartBtn.classList.remove('listening', 'connecting');
      }
      if (title) title.innerHTML = '<span style="color: #ef4444;">❌ ไมค์ไม่พร้อมใช้งาน หรือถูกบล็อก</span>';
      if (indicator) {
        indicator.className = 'voice-status-indicator status-error';
        indicator.title = 'ไมค์ขัดข้องหรือยังไม่ได้อนุญาต';
      }
      if (vuMeter) vuMeter.classList.remove('active');
    }
  }

  toggleVoiceSmartInput() {
    const smartBtn = document.getElementById('voiceSmartBtn');
    const isListening = smartBtn && (smartBtn.classList.contains('listening') || smartBtn.classList.contains('connecting'));

    if (isListening) {
      this.stopAnyActiveVoice();
      this.playVoiceSound('error');
      return;
    }

    if (!this.speechSupported) {
      this.showToast('เบราว์เซอร์นี้ยังไม่รองรับระบบสั่งงานด้วยเสียง แนะนำให้เปิดด้วย Chrome หรือ Safari ครับ', 'warning');
      return;
    }

    this.stopAnyActiveVoice();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'th-TH';
    recognition.continuous = false;
    recognition.interimResults = true;

    const transcriptBox = document.getElementById('voiceLiveTranscript');
    const transcriptText = document.getElementById('voiceTranscriptText');

    // 1. สเต็ปที่ 1: กำลังเชื่อมต่อไมค์ทันทีที่กดปุ่ม (ไฟสีส้ม Connecting)
    this.setVoiceUiState('connecting');
    if (transcriptText) transcriptText.textContent = 'กำลังเชื่อมต่อไมโครโฟน...';

    this.activeVoiceRecognition = recognition;

    // 2. สเต็ปที่ 2: เมื่อไมโครโฟนของฮาร์ดแวร์เปิดติดจริง (onstart) -> ไฟเขียวอนาล็อกติดสว่าง 🟢 พร้อมเสียงชิล์ม
    recognition.onstart = () => {
      this.setVoiceUiState('live');
      this.playVoiceSound('start');
      if (transcriptText) transcriptText.textContent = 'กำลังฟัง...';
    };

    recognition.onresult = (e) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) {
          final += e.results[i][0].transcript;
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      if (transcriptText) {
        transcriptText.textContent = final || interim || '...';
      }
      if (final) {
        this.handleSmartVoiceResult(final);
      }
    };

    recognition.onerror = (e) => {
      this.setVoiceUiState('error');
      this.playVoiceSound('error');
      if (e.error === 'not-allowed') {
        this.showToast('กรุณากดยินยอม (Allow) ให้เบราว์เซอร์ใช้ไมโครโฟน เพื่อสั่งงานด้วยเสียง', 'warning');
      } else if (e.error !== 'no-speech') {
        this.showToast('ไม่ได้ยินเสียง หรือเกิดข้อผิดพลาด ลองใหม่อีกครั้งครับ', 'info');
      }
      setTimeout(() => {
        this.setVoiceUiState('idle');
      }, 2500);
    };

    recognition.onend = () => {
      this.setVoiceUiState('idle');
      this.activeVoiceRecognition = null;
    };

    try {
      recognition.start();
    } catch (err) {
      this.setVoiceUiState('error');
      this.activeVoiceRecognition = null;
    }
  }

  handleSmartVoiceResult(rawTranscript) {
    const parsed = this.parseVoiceProduct(rawTranscript);
    let updatedCount = 0;

    const flashField = (id) => {
      const el = document.getElementById(id);
      if (el) {
        el.classList.remove('voice-highlight');
        void el.offsetWidth;
        el.classList.add('voice-highlight');
      }
    };

    if (parsed.name) {
      const nameEl = document.getElementById('prodName');
      if (nameEl) {
        nameEl.value = parsed.name;
        flashField('prodName');
        updatedCount++;
      }

      // Auto-assign smart SKU and category
      const skuEl = document.getElementById('prodSku');
      if (skuEl) {
        skuEl.value = parsed.name.replace(/\s+/g, '-').toUpperCase();
      }

      const catEl = document.getElementById('prodCategory');
      if (catEl) {
        const lowerName = parsed.name.toLowerCase();
        if (lowerName.includes('ขั้ว l') || lowerName.includes('b24l') || lowerName.includes('d23l') || lowerName.includes('d31l')) {
          catEl.value = 'แบตเตอรี่ (ขั้ว L)';
        } else if (lowerName.includes('ขั้ว r') || lowerName.includes('b24r') || lowerName.includes('d23r') || lowerName.includes('d31r')) {
          catEl.value = 'แบตเตอรี่ (ขั้ว R)';
        } else if (lowerName.includes('din') || lowerName.includes('ln')) {
          catEl.value = 'แบตเตอรี่ (DIN ยุโรป)';
        } else if (lowerName.includes('ดีเซล') || lowerName.includes('กระบะ') || lowerName.includes('d31')) {
          catEl.value = 'แบตเตอรี่ (กระบะ/ดีเซล)';
        } else if (lowerName.includes('efb') || lowerName.includes('iss') || lowerName.includes('agm')) {
          catEl.value = 'แบตเตอรี่ (EFB/ISS)';
        }
      }
    }

    if (parsed.costPrice !== null) {
      const costEl = document.getElementById('prodCostPrice');
      if (costEl) {
        costEl.value = parsed.costPrice;
        flashField('prodCostPrice');
        updatedCount++;
      }
    }

    if (parsed.price !== null) {
      const priceEl = document.getElementById('prodPrice');
      if (priceEl) {
        priceEl.value = parsed.price;
        flashField('prodPrice');
        updatedCount++;
      }
    }

    if (parsed.minAlert !== null) {
      const targetEl = document.getElementById('prodMinAlert');
      if (targetEl) {
        targetEl.value = parsed.minAlert;
        flashField('prodMinAlert');
        updatedCount++;
      }
    }

    if (parsed.quantity !== null) {
      const qtyEl = document.getElementById('prodQuantity');
      if (qtyEl) {
        qtyEl.value = parsed.quantity;
        flashField('prodQuantity');
        updatedCount++;
      }
    }

    this.playVoiceSound('success');
    if (parsed.name) {
      this.showToast(`กรอกข้อมูลสำเร็จ: ${parsed.name} 🚀`, 'success');
    } else {
      this.showToast('ดึงข้อมูลจากเสียงเรียบร้อย ตรวจสอบและกดบันทึกได้ทันที ✨', 'success');
    }
  }

  toggleVoiceFieldInput(fieldId) {
    const fieldBtn = document.getElementById('voiceNameFieldBtn');
    const isListening = fieldBtn && fieldBtn.classList.contains('listening');

    if (isListening) {
      this.stopAnyActiveVoice();
      this.playVoiceSound('error');
      return;
    }

    if (!this.speechSupported) {
      this.showToast('เบราว์เซอร์นี้ยังไม่รองรับระบบสั่งงานด้วยเสียง แนะนำให้เปิดด้วย Chrome หรือ Safari ครับ', 'warning');
      return;
    }

    this.stopAnyActiveVoice();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'th-TH';
    recognition.continuous = false;
    recognition.interimResults = false;

    if (fieldBtn) fieldBtn.classList.add('listening');
    this.playVoiceSound('start');
    this.activeVoiceRecognition = recognition;

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      const normalized = this.normalizeVoiceText(transcript)
        .replace(/^(?:ชื่อ|รุ่น|สินค้า)\s*/i, '')
        .trim();

      const input = document.getElementById(fieldId);
      if (input) {
        input.value = normalized;
        input.classList.remove('voice-highlight');
        void input.offsetWidth;
        input.classList.add('voice-highlight');
        input.focus();
      }
      this.playVoiceSound('success');
      this.showToast(`กรอกชื่อสินค้า: ${normalized} 🎙️`, 'success');
    };

    recognition.onerror = () => {
      this.stopAnyActiveVoice();
      this.playVoiceSound('error');
    };

    recognition.onend = () => {
      this.stopAnyActiveVoice();
    };

    try {
      recognition.start();
    } catch (err) {
      this.stopAnyActiveVoice();
    }
  }

  toggleVoiceSearchInput() {
    const searchBtn = document.getElementById('voiceSearchBtn');
    const isListening = searchBtn && searchBtn.classList.contains('listening');

    if (isListening) {
      this.stopAnyActiveVoice();
      this.playVoiceSound('error');
      return;
    }

    if (!this.speechSupported) {
      this.showToast('เบราว์เซอร์นี้ยังไม่รองรับระบบสั่งงานด้วยเสียง แนะนำให้เปิดด้วย Chrome หรือ Safari ครับ', 'warning');
      return;
    }

    this.stopAnyActiveVoice();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'th-TH';
    recognition.continuous = false;
    recognition.interimResults = false;

    if (searchBtn) searchBtn.classList.add('listening');
    this.playVoiceSound('start');
    this.activeVoiceRecognition = recognition;

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      const normalized = this.normalizeVoiceText(transcript).trim();

      const searchInput = document.getElementById('searchInput');
      const clearSearchBtn = document.getElementById('clearSearchBtn');
      if (searchInput) {
        searchInput.value = normalized;
        this.searchQuery = normalized.toLowerCase();
        if (clearSearchBtn) clearSearchBtn.hidden = !this.searchQuery;
        this.renderProducts();
      }
      this.playVoiceSound('success');
      this.showToast(`ค้นหาด้วยเสียง: "${normalized}" 🔍`, 'success');
    };

    recognition.onerror = () => {
      this.stopAnyActiveVoice();
      this.playVoiceSound('error');
    };

    recognition.onend = () => {
      this.stopAnyActiveVoice();
    };

    try {
      recognition.start();
    } catch (err) {
      this.stopAnyActiveVoice();
    }
  }

  // ================= SCAN BILL & IMAGE IMPORT SYSTEM (AI VISION) =================
  initScanBillSystem() {
    this.currentBillImage = null;
    this.extractedBillItems = [];

    const openBtn = document.getElementById('openScanBillModalBtn');
    const closeBtn = document.getElementById('closeScanBillModalBtn');
    const cancelBtn = document.getElementById('cancelScanBillBtn');
    const modal = document.getElementById('scanBillModal');

    if (openBtn) openBtn.addEventListener('click', () => this.openScanBillModal());
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal(modal));
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeModal(modal));

    // API Key Save Button
    const saveKeyBtn = document.getElementById('saveGeminiApiKeyBtn');
    if (saveKeyBtn) {
      saveKeyBtn.addEventListener('click', () => this.saveGeminiApiKey());
    }

    // Camera & Gallery Trigger Buttons
    const triggerCamBtn = document.getElementById('triggerCameraBtn');
    const triggerGalBtn = document.getElementById('triggerGalleryBtn');
    const cameraInput = document.getElementById('billCameraInput');
    const galleryInput = document.getElementById('billGalleryInput');

    if (triggerCamBtn && cameraInput) {
      triggerCamBtn.addEventListener('click', () => cameraInput.click());
      cameraInput.addEventListener('change', (e) => this.handleBillFileSelect(e.target.files[0]));
    }

    if (triggerGalBtn && galleryInput) {
      triggerGalBtn.addEventListener('click', () => galleryInput.click());
      galleryInput.addEventListener('change', (e) => this.handleBillFileSelect(e.target.files[0]));
    }

    // Reselect Image Button
    const reselectBtn = document.getElementById('reselectImageBtn');
    if (reselectBtn) {
      reselectBtn.addEventListener('click', () => this.resetScanImageState());
    }

    // Process AI Button
    const processBtn = document.getElementById('processAiBtn');
    if (processBtn) {
      processBtn.addEventListener('click', () => this.processBillImageWithAi());
    }

    // Add New Extracted Row Button
    const addRowBtn = document.getElementById('addNewExtractedRowBtn');
    if (addRowBtn) {
      addRowBtn.addEventListener('click', () => this.addNewExtractedRow(''));
    }

    // Confirm Import Scanned Button
    const confirmBtn = document.getElementById('confirmImportScannedBtn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => this.confirmImportScannedItems());
    }
  }

  openScanBillModal() {
    const modal = document.getElementById('scanBillModal');
    if (!modal) return;

    this.resetScanImageState();
    this.updateGeminiKeyStatusUI();
    this.openModal(modal);
  }

  updateGeminiKeyStatusUI() {
    const keyInput = document.getElementById('geminiApiKeyInput');
    const keyBox = document.getElementById('geminiKeyConfigBox');
    const statusMsg = document.getElementById('geminiKeyStatusMessage');
    const savedKey = localStorage.getItem('smartstock_gemini_api_key') || '';

    if (savedKey) {
      if (keyInput) keyInput.value = savedKey;
      if (keyBox) keyBox.classList.add('key-saved');
      if (statusMsg) {
        statusMsg.innerHTML = '✅ <strong style="color: var(--success-text);">เชื่อมต่อ Google Gemini AI เรียบร้อยแล้ว</strong> (หากต้องการเปลี่ยน Key สามารถพิมพ์ทับแล้วกดบันทึกได้)';
      }
    } else {
      if (keyInput) keyInput.value = '';
      if (keyBox) keyBox.classList.remove('key-saved');
      if (statusMsg) {
        statusMsg.innerHTML = '💡 ใส่รหัส API Key ครั้งแรกครั้งเดียว (ฟรี ไม่ต้องใส่บัตรเครดิต) แท็บเล็ตจะจำไว้ตลอดไป';
      }
    }
  }

  saveGeminiApiKey() {
    const keyInput = document.getElementById('geminiApiKeyInput');
    const key = keyInput ? keyInput.value.trim() : '';

    if (!key) {
      this.showToast('กรุณากรอกรหัส Google Gemini API Key', 'warning');
      return;
    }

    localStorage.setItem('smartstock_gemini_api_key', key);
    this.updateGeminiKeyStatusUI();
    this.showToast('บันทึก Google Gemini API Key สำเร็จ 🎉', 'success');
    this.playVoiceSound('success');
  }

  resetScanImageState() {
    this.currentBillImage = null;
    this.extractedBillItems = [];

    const actionButtons = document.getElementById('scanActionButtons');
    const previewWrap = document.getElementById('scanImagePreviewWrap');
    const loadingWrap = document.getElementById('scanLoadingWrap');
    const resultSection = document.getElementById('scanResultSection');
    const confirmBtn = document.getElementById('confirmImportScannedBtn');
    const cameraInput = document.getElementById('billCameraInput');
    const galleryInput = document.getElementById('billGalleryInput');

    if (cameraInput) cameraInput.value = '';
    if (galleryInput) galleryInput.value = '';
    if (actionButtons) actionButtons.style.display = 'grid';
    if (previewWrap) previewWrap.style.display = 'none';
    if (loadingWrap) loadingWrap.style.display = 'none';
    if (resultSection) resultSection.style.display = 'none';
    if (confirmBtn) confirmBtn.style.display = 'none';
  }

  async handleBillFileSelect(file) {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.showToast('กรุณาเลือกไฟล์รูปภาพเท่านั้นครับ', 'warning');
      return;
    }

    try {
      this.showToast('กำลังเตรียมรูปภาพ...', 'info', 1500);
      const compressed = await this.compressImage(file, 1600, 0.85);
      this.currentBillImage = compressed;

      const previewImg = document.getElementById('scanImagePreview');
      const previewWrap = document.getElementById('scanImagePreviewWrap');
      const actionButtons = document.getElementById('scanActionButtons');

      if (previewImg) previewImg.src = compressed.dataUrl;
      if (previewWrap) previewWrap.style.display = 'block';
      if (actionButtons) actionButtons.style.display = 'none';

      // If API key is already configured, auto-trigger AI analysis for fast 1-click UX!
      const apiKey = localStorage.getItem('smartstock_gemini_api_key');
      if (apiKey) {
        this.processBillImageWithAi();
      } else {
        this.showToast('รูปพร้อมแล้ว กรุณากรอก API Key ด้านบนเพื่อเริ่มวิเคราะห์', 'warning');
      }
    } catch (err) {
      console.error(err);
      this.showToast('ไม่สามารถประมวลผลรูปภาพได้ กรุณาลองใหม่อีกครั้ง', 'danger');
    }
  }

  compressImage(file, maxDimension = 1600, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          const base64Data = dataUrl.split(',')[1];
          resolve({ dataUrl, base64Data, mimeType: 'image/jpeg' });
        };
        img.onerror = () => reject(new Error('ไม่สามารถโหลดภาพ'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์'));
      reader.readAsDataURL(file);
    });
  }

  async processBillImageWithAi() {
    if (!this.currentBillImage) {
      this.showToast('กรุณาถ่ายรูปหรือเลือกรูปภาพก่อนครับ', 'warning');
      return;
    }

    const apiKey = localStorage.getItem('smartstock_gemini_api_key');
    if (!apiKey) {
      this.showToast('กรุณากรอก Google Gemini API Key ด้านบนก่อนครับ (รับฟรีได้ทันที)', 'warning');
      const input = document.getElementById('geminiApiKeyInput');
      if (input) input.focus();
      return;
    }

    const previewWrap = document.getElementById('scanImagePreviewWrap');
    const loadingWrap = document.getElementById('scanLoadingWrap');
    const resultSection = document.getElementById('scanResultSection');
    const actionButtons = document.getElementById('scanActionButtons');

    if (previewWrap) previewWrap.style.display = 'none';
    if (actionButtons) actionButtons.style.display = 'none';
    if (resultSection) resultSection.style.display = 'none';
    if (loadingWrap) loadingWrap.style.display = 'block';

    try {
      const items = await this.callGeminiVisionApi(apiKey, this.currentBillImage.base64Data, this.currentBillImage.mimeType);

      if (loadingWrap) loadingWrap.style.display = 'none';

      if (!items || items.length === 0) {
        this.showToast('ไม่พบรายการสินค้าในรูปภาพ กรุณาถ่ายให้เห็นตัวหนังสือชัดเจนขึ้นครับ', 'warning');
        if (previewWrap) previewWrap.style.display = 'block';
        return;
      }

      this.extractedBillItems = items;
      this.renderExtractedItems(items);
      this.playVoiceSound('success');
      this.showToast(`✨ AI สแกนพบ ${items.length} รายการสินค้า ตรวจสอบแล้วกดนำเข้าได้เลย!`, 'success');
    } catch (err) {
      console.error(err);
      if (loadingWrap) loadingWrap.style.display = 'none';
      if (previewWrap) previewWrap.style.display = 'block';
      this.playVoiceSound('error');

      const msg = err.message || '';
      if (msg.includes('API_KEY_INVALID') || msg.includes('400') || msg.includes('API key not valid')) {
        this.showToast('รหัส Google Gemini API Key ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้งครับ', 'danger');
      } else {
        this.showToast(`เกิดข้อผิดพลาด: ${msg || 'ไม่สามารถวิเคราะห์รูปภาพได้'}`, 'danger');
      }
    }
  }

  async callGeminiVisionApi(apiKey, base64Data, mimeType = 'image/jpeg') {
    const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash'];
    let lastError = null;

    const promptText = `คุณคือผู้ช่วยจัดการสต็อกสินค้าที่มีความเชี่ยวชาญสูง
วิเคราะห์รูปภาพนี้ซึ่งเป็นบิล, ใบเสร็จ, ใบส่งของ, หรือกระดาษจดสต็อก
หน้าที่สำคัญที่สุดของคุณ: ค้นหาและดึงเอาเฉพาะ "ชื่อรุ่น หรือ ชื่อรายการสินค้า" เท่านั้น!

กฎเหล็กที่ต้องปฏิบัติตามอย่างเคร่งครัด:
1. กรองทิ้งข้อมูลอื่นทั้งหมด: ห้ามเอาชื่อร้านค้า, ห้ามเอาเลขที่บิล, ห้ามเอาวันที่, ห้ามเอาที่อยู่, ห้ามเอาเบอร์โทร, ห้ามเอาราคา, ห้ามเอายอดเงินรวม, ห้ามเอาภาษี, ห้ามเอาลายเซ็น
2. แยกแต่ละรายการสินค้าออกมา ห้ามรวมเป็นก้อนเดียว
3. ส่งคำตอบกลับมาเป็น JSON Array ของ String เท่านั้น ห้ามใส่คำอธิบายอื่น ห้ามใส่ข้อความเกริ่นนำ
ตัวอย่างผลลัพธ์ที่ถูกต้อง:
["แบตเตอรี่ GS MFX-60L", "3K ADX65L ขั้ว L", "FB S-650"]`;

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const payload = {
          contents: [
            {
              parts: [
                { text: promptText },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Data
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            topP: 0.8
          }
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error?.message || `HTTP ${res.status}`;
          lastError = new Error(`Model ${model}: ${errMsg}`);
          continue; // Try next model
        }

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) {
          return this.parseExtractedItemsText(text);
        }
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error('ไม่สามารถเชื่อมต่อกับ Google Gemini AI ได้');
  }

  parseExtractedItemsText(rawText) {
    let clean = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
    try {
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed)) {
        return parsed.map(item => String(item).trim()).filter(Boolean);
      }
    } catch (e) {}

    // Fallback parser line-by-line
    return clean
      .split('\n')
      .map(line => line.replace(/^[-*•\d+.)\s]+/, '').replace(/^["']|["'],?$/g, '').trim())
      .filter(line => line.length > 0 && !line.startsWith('[') && !line.startsWith(']'));
  }

  renderExtractedItems(items) {
    const listContainer = document.getElementById('extractedItemsList');
    const resultSection = document.getElementById('scanResultSection');
    const countText = document.getElementById('scannedCountText');
    const confirmBtn = document.getElementById('confirmImportScannedBtn');

    if (!listContainer || !resultSection) return;

    listContainer.innerHTML = '';
    resultSection.style.display = 'block';
    if (confirmBtn) confirmBtn.style.display = 'inline-flex';

    items.forEach((itemText, idx) => {
      this.createExtractedRowElement(listContainer, itemText, idx + 1);
    });

    this.updateExtractedCountBadge();
  }

  createExtractedRowElement(container, nameText, num) {
    const row = document.createElement('div');
    row.className = 'extracted-item-row';

    // Check if store already has this product name (case-insensitive)
    const exists = this.products.some(p => 
      p.storeId === this.currentStoreId && 
      p.name.trim().toLowerCase() === nameText.trim().toLowerCase()
    );

    row.innerHTML = `
      <span class="extracted-item-num">${num}.</span>
      <input type="text" class="extracted-item-input" value="${this.escapeHtml(nameText)}" placeholder="ชื่อรายการสินค้า" autocomplete="off">
      <span class="badge-item-status ${exists ? 'badge-item-exists' : 'badge-item-new'}">
        ${exists ? '✓ มีในร้านแล้ว' : '✨ สินค้าใหม่'}
      </span>
      <button type="button" class="btn-remove-extracted" title="ลบรายการนี้" aria-label="ลบ">&times;</button>
    `;

    const input = row.querySelector('.extracted-item-input');
    const badge = row.querySelector('.badge-item-status');
    const removeBtn = row.querySelector('.btn-remove-extracted');

    if (input && badge) {
      input.addEventListener('input', () => {
        const currentName = input.value.trim().toLowerCase();
        const nowExists = this.products.some(p => 
          p.storeId === this.currentStoreId && 
          p.name.trim().toLowerCase() === currentName
        );
        if (nowExists) {
          badge.className = 'badge-item-status badge-item-exists';
          badge.textContent = '✓ มีในร้านแล้ว';
        } else {
          badge.className = 'badge-item-status badge-item-new';
          badge.textContent = '✨ สินค้าใหม่';
        }
      });
    }

    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        row.remove();
        this.updateExtractedRowNumbers();
        this.updateExtractedCountBadge();
      });
    }

    container.appendChild(row);
  }

  addNewExtractedRow(initialName = '') {
    const container = document.getElementById('extractedItemsList');
    if (!container) return;
    const count = container.querySelectorAll('.extracted-item-row').length;
    this.createExtractedRowElement(container, initialName, count + 1);
    this.updateExtractedCountBadge();

    // Focus on new input
    const inputs = container.querySelectorAll('.extracted-item-input');
    if (inputs.length > 0) {
      const lastInput = inputs[inputs.length - 1];
      lastInput.focus();
    }
  }

  updateExtractedRowNumbers() {
    const rows = document.querySelectorAll('#extractedItemsList .extracted-item-row');
    rows.forEach((row, idx) => {
      const numEl = row.querySelector('.extracted-item-num');
      if (numEl) numEl.textContent = `${idx + 1}.`;
    });
  }

  updateExtractedCountBadge() {
    const rows = document.querySelectorAll('#extractedItemsList .extracted-item-row');
    const countText = document.getElementById('scannedCountText');
    const confirmBtn = document.getElementById('confirmImportScannedBtn');

    if (countText) {
      countText.textContent = `พบ ${rows.length} รายการ`;
    }

    if (confirmBtn) {
      confirmBtn.style.display = rows.length > 0 ? 'inline-flex' : 'none';
    }
  }

  confirmImportScannedItems() {
    if (!this.currentStoreId) {
      this.showToast('กรุณาเลือกร้านค้าก่อนนำเข้าสต็อก', 'warning');
      return;
    }

    const rows = document.querySelectorAll('#extractedItemsList .extracted-item-row');
    const itemsToAdd = [];
    rows.forEach(row => {
      const input = row.querySelector('.extracted-item-input');
      const name = input ? input.value.trim() : '';
      if (name) itemsToAdd.push(name);
    });

    if (itemsToAdd.length === 0) {
      this.showToast('ไม่พบรายการสินค้าที่จะนำเข้า', 'warning');
      return;
    }

    const store = this.stores.find(s => s.id === this.currentStoreId);
    const isBattery = store && store.name.includes('แบต');
    const defaultCat = isBattery ? 'แบตเตอรี่' : 'ทั่วไป';

    let addedCount = 0;
    let existingCount = 0;

    itemsToAdd.forEach(name => {
      // Check if store already has this product name (case-insensitive)
      const existing = this.products.find(p => 
        p.storeId === this.currentStoreId && 
        p.name.trim().toLowerCase() === name.toLowerCase()
      );

      if (existing) {
        existingCount++;
        return; // Don't duplicate if identical name already exists
      }

      // Smart category deduction
      let category = defaultCat;
      const lower = name.toLowerCase();
      if (lower.includes('ขั้ว l') || lower.includes('b24l') || lower.includes('d23l') || lower.includes('d31l')) {
        category = 'แบตเตอรี่ (ขั้ว L)';
      } else if (lower.includes('ขั้ว r') || lower.includes('b24r') || lower.includes('d23r') || lower.includes('d31r')) {
        category = 'แบตเตอรี่ (ขั้ว R)';
      } else if (lower.includes('din') || lower.includes('ln')) {
        category = 'แบตเตอรี่ (DIN ยุโรป)';
      } else if (lower.includes('ดีเซล') || lower.includes('กระบะ') || lower.includes('d31')) {
        category = 'แบตเตอรี่ (กระบะ/ดีเซล)';
      } else if (lower.includes('efb') || lower.includes('iss') || lower.includes('agm')) {
        category = 'แบตเตอรี่ (EFB/ISS)';
      }

      const newProduct = {
        id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        storeId: this.currentStoreId,
        name: name,
        sku: name.replace(/\s+/g, '-').toUpperCase(),
        category: category,
        quantity: 0,
        minAlert: 5,
        costPrice: 0,
        price: 0,
        unit: isBattery ? 'ลูก' : 'ชิ้น',
        updatedAt: new Date().toISOString()
      };

      this.products.unshift(newProduct);
      addedCount++;
    });

    if (addedCount > 0) {
      this.saveProducts();
      this.renderStoreDetail();
      this.closeModal(document.getElementById('scanBillModal'));
      let msg = `นำเข้ารายการสินค้าใหม่ ${addedCount} รายการ สำเร็จ! 🎉`;
      if (existingCount > 0) {
        msg += ` (ข้ามรายการที่มีอยู่แล้ว ${existingCount} รายการ)`;
      }
      this.showToast(msg, 'success');
      this.playVoiceSound('success');
    } else {
      this.showToast(`สินค้าทั้ง ${existingCount} รายการมีอยู่ในสต็อกร้านนี้เรียบร้อยแล้ว`, 'info');
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

// Global Instantiate
window.addEventListener('DOMContentLoaded', () => {
  window.app = new MultiStoreStockApp();
});
