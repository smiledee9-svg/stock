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
        this.stores = [...DEFAULT_STORES];
      }
    } else {
      this.stores = [...DEFAULT_STORES];
      this.saveStores();
    }

    // Ensure all stores have sequential code (01, 02, ...)
    this.stores = this.stores.map((s, idx) => ({
      ...s,
      code: s.code || String(idx + 1).padStart(2, '0')
    }));

    if (savedProducts) {
      try {
        this.products = JSON.parse(savedProducts);
      } catch (e) {
        this.products = [...DEFAULT_PRODUCTS];
      }
    } else {
      this.products = [...DEFAULT_PRODUCTS];
      this.saveProducts();
    }

    // Auto-migrate costPrice if missing
    const defaultCosts = {
      'GS-46B24L': 1400,
      '3K-55D23L': 1600,
      'FB-105D31L': 2200,
      'AMR-LN3': 2500,
      'PANA-50B24L': 1500,
      'YUA-75D23L': 1750
    };
    let costUpdated = false;
    this.products = this.products.map(p => {
      let updated = { ...p };
      let changed = false;
      if (updated.costPrice === undefined || updated.costPrice === null) {
        updated.costPrice = defaultCosts[p.sku] || Math.round((p.price || 0) * 0.75);
        changed = true;
      }
      if (updated.unit === 'ลูก') {
        updated.unit = '';
        changed = true;
      }
      if (changed) {
        costUpdated = true;
        return updated;
      }
      return p;
    });
    if (costUpdated) {
      this.saveProducts();
    }

    // Auto-migrate default clothing store to Battery Shop if detected
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
      this.saveStores();
      this.saveProducts();
      this.saveHistory();
    }

    if (savedHistory) {
      try {
        this.history = JSON.parse(savedHistory);
      } catch (e) {
        this.history = [...DEFAULT_HISTORY];
      }
    } else {
      this.history = [...DEFAULT_HISTORY];
      this.saveHistory();
    }

    if (savedTheme === 'dark') {
      document.body.setAttribute('data-theme', 'dark');
    }

    if (savedCurrentStore && this.stores.some(s => s.id === savedCurrentStore)) {
      this.currentStoreId = savedCurrentStore;
    } else {
      this.currentStoreId = null;
    }
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

    // Copy order list button
    const copyOrderBtn = document.getElementById('copyOrderListBtn');
    if (copyOrderBtn) copyOrderBtn.addEventListener('click', () => this.copyOrderList());

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

    if (product) {
      title.textContent = 'แก้ไขรายการสินค้า';
      editIdInput.value = product.id;
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
      exportedAt: new Date().toISOString(),
      stores: this.stores,
      products: this.products,
      history: this.history
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
          this.saveStores();
          this.saveProducts();
          this.saveHistory();
          this.currentStoreId = null;
          this.render();
          this.closeModal(document.getElementById('backupModal'));
          this.showToast('กู้คืนข้อมูลทุกสาขาสำเร็จเรียบร้อย! 🎉', 'success');
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
    const copyOrderBtn = document.getElementById('copyOrderListBtn');

    if (!this.currentStoreId) {
      // Show Hub View
      hubView.style.display = 'block';
      detailView.style.display = 'none';
      if (brandHome) brandHome.style.display = 'flex';
      if (headerStoreInfo) headerStoreInfo.style.display = 'none';
      if (editBtn) editBtn.style.display = 'none';
      if (openAddStoreBtn) openAddStoreBtn.style.display = 'inline-flex';
      if (copyOrderBtn) copyOrderBtn.style.display = 'none';
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
      if (copyOrderBtn) copyOrderBtn.style.display = 'inline-flex'; // รวมไว้ที่แถบด้านบนตามคำขอ
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
          <div>
            <!-- บรรทัดบน: สำหรับ 01 ฝั่งซ้าย และ ข้อความใกล้หมด ฝั่งขวา -->
            <div class="store-card-header">
              <div class="store-avatar">${storeCode}</div>
              <div>
                ${lowCount > 0 ? `<span class="stock-status-pill status-warning">⚠️ ใกล้หมด ${lowCount}</span>` : `<span class="stock-status-pill status-normal">ปกติ</span>`}
              </div>
            </div>

            <!-- บรรทัดที่สอง: สำหรับข้อความใหญ่สีขาว เต็มพื้นที่ทำให้อ่านง่าย -->
            <h4 class="store-name-title">${this.escapeHtml(store.name)}</h4>

            <p class="store-desc-text">${this.escapeHtml(store.desc || 'ไม่มีรายละเอียด')}</p>

            <div class="store-stats-row">
              <div class="store-stat-item">
                <span class="store-stat-val">${skuCount}</span>
                <span class="store-stat-lbl">รายการสินค้า</span>
              </div>
              <div class="store-stat-item">
                <span class="store-stat-val">${piecesCount.toLocaleString()}</span>
                <span class="store-stat-lbl">จำนวนชิ้นรวม</span>
              </div>
            </div>
          </div>

          <div class="store-card-actions">
            <button class="btn-open-store" onclick="window.app.selectStore('${store.id}')">
              <span>เปิดจัดการสต็อก</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
            <button class="btn-card-more" title="แก้ไขชื่อร้าน" onclick="window.app.openEditStoreModal('${store.id}')">
              ✏️
            </button>
            <button class="btn-card-more" title="ลบร้านนี้" onclick="window.app.deleteStore('${store.id}')">
              🗑️
            </button>
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
        copyOrderBtn.className = 'btn btn-primary btn-sm';
        copyOrderBtn.innerHTML = `<span>📋 คัดลอกรายการสั่งของ (${needOrderItems.length})</span>`;
      } else {
        copyOrderBtn.className = 'btn btn-secondary btn-sm';
        copyOrderBtn.innerHTML = `<span>📋 คัดลอกรายการสั่งของ</span>`;
      }
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
                <span class="battery-name">${this.escapeHtml(item.name)}</span>
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

            <!-- 4. สต็อกเป้าหมาย (ปรับได้แบบส่วนนับได้จริง) -->
            <td class="text-center">
              <div class="actual-count-stepper">
                <button class="stepper-btn" type="button" title="ลดเป้าหมาย 1" onclick="window.app.quickAdjustTarget('${item.id}', -1)">−</button>
                <span class="actual-val" title="คลิกเพื่อพิมพ์สต็อกเป้าหมาย" onclick="window.app.quickSetTarget('${item.id}')">${target}</span>
                <button class="stepper-btn" type="button" title="เพิ่มเป้าหมาย 1" onclick="window.app.quickAdjustTarget('${item.id}', 1)">+</button>
              </div>
            </td>

            <!-- 5. นับได้จริง (นับง่ายเร็วด้วยปุ่ม +/- หรือคลิกพิมพ์เลข) -->
            <td class="text-center">
              <div class="actual-count-stepper">
                <button class="stepper-btn" type="button" title="ลด 1" onclick="window.app.quickAdjustCount('${item.id}', -1)">−</button>
                <span class="actual-val" title="คลิกเพื่อพิมพ์จำนวนที่นับได้ตรงๆ" onclick="window.app.quickSetCount('${item.id}')">${actual}</span>
                <button class="stepper-btn" type="button" title="เพิ่ม 1" onclick="window.app.quickAdjustCount('${item.id}', 1)">+</button>
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

  copyOrderList() {
    const store = this.stores.find(s => s.id === this.currentStoreId);
    const storeProducts = this.products.filter(p => p.storeId === this.currentStoreId);
    const needOrderItems = storeProducts.filter(p => Math.max(0, (p.minAlert || 5) - (p.quantity || 0)) > 0);

    if (needOrderItems.length === 0) {
      this.showToast('ทุกรุ่นมีสต็อกเพียงพอ ไม่มียอดที่ต้องสั่งเพิ่ม 🎉', 'success');
      return;
    }

    const dateStr = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    let text = `📦 รายการสั่งของเพิ่ม - ${store ? store.name : 'ร้านค้า'}\n`;
    text += `📅 ประจำวันที่: ${dateStr}\n`;
    text += `====================================\n`;
    needOrderItems.forEach((p, idx) => {
      const target = p.minAlert || 5;
      const actual = p.quantity || 0;
      const need = Math.max(0, target - actual);
      const unitLabel = (p.unit && p.unit !== 'ลูก') ? ` ${p.unit}` : '';
      text += `${idx + 1}. ${p.name} : สั่งเพิ่ม ${need}${unitLabel} (เป้า ${target}, นับได้ ${actual})\n`;
    });
    const totalOrder = needOrderItems.reduce((sum, p) => sum + Math.max(0, (p.minAlert || 5) - (p.quantity || 0)), 0);
    text += `====================================\n`;
    text += `📌 รวมต้องสั่งทั้งหมด: ${totalOrder} (${needOrderItems.length} รายการ)\n`;
    text += `(คำนวณจากสูตร: =MAX(0, สต็อกเป้าหมาย - นับได้จริง))`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        this.showToast(`คัดลอกรายการสั่งของ ${needOrderItems.length} รุ่นเรียบร้อย 📋 ส่งใน LINE ได้ทันที!`, 'success');
      }).catch(() => {
        prompt('คัดลอกข้อความด้านล่างนี้ได้เลยครับ:', text);
      });
    } else {
      prompt('คัดลอกข้อความด้านล่างนี้ได้เลยครับ:', text);
    }
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
