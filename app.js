/**
 * SmartStock - Complete Stock Management Application Logic
 */

// Initial Sample Data if empty
const SAMPLE_PRODUCTS = [
  {
    id: "prod_1",
    name: "เสื้อยืดคอตตอน สีดำ (Oversized)",
    sku: "TS-BLK-OS",
    category: "เสื้อผ้า",
    quantity: 24,
    minAlert: 8,
    price: 350,
    unit: "ตัว",
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod_2",
    name: "กางเกงคาร์โก้ ขากระบอก สีเขียวโอลีฟ",
    sku: "CG-GRN-32",
    category: "เสื้อผ้า",
    quantity: 3,
    minAlert: 5,
    price: 690,
    unit: "ตัว",
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod_3",
    name: "หมวกแก๊ปเบสบอล มินิมอล",
    sku: "CAP-MINI-01",
    category: "เครื่องประดับ",
    quantity: 15,
    minAlert: 5,
    price: 250,
    unit: "ใบ",
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod_4",
    name: "กระเป๋าผ้าแคนวาส รักษ์โลก",
    sku: "BAG-ECO-WHT",
    category: "เครื่องประดับ",
    quantity: 1,
    minAlert: 6,
    price: 190,
    unit: "ใบ",
    updatedAt: new Date().toISOString()
  }
];

const SAMPLE_HISTORY = [
  {
    id: "hist_1",
    productId: "prod_1",
    productName: "เสื้อยืดคอตตอน สีดำ (Oversized)",
    type: "IN",
    amount: 24,
    balanceAfter: 24,
    reason: "สต็อกล็อตใหม่จากโรงงาน",
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: "hist_2",
    productId: "prod_2",
    productName: "กางเกงคาร์โก้ ขากระบอก สีเขียวโอลีฟ",
    type: "OUT",
    amount: 2,
    balanceAfter: 3,
    reason: "ลูกค้าสั่งผ่านหน้าร้าน",
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: "hist_3",
    productId: "prod_4",
    productName: "กระเป๋าผ้าแคนวาส รักษ์โลก",
    type: "OUT",
    amount: 5,
    balanceAfter: 1,
    reason: "ขายทางออนไลน์ (Shopee/TikTok)",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];

// State Manager
class StockApp {
  constructor() {
    this.products = [];
    this.history = [];
    this.activeTab = 'inventory';
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

  // Load from LocalStorage
  loadState() {
    const savedProducts = localStorage.getItem('smartstock_products');
    const savedHistory = localStorage.getItem('smartstock_history');
    const savedTheme = localStorage.getItem('smartstock_theme');

    if (savedProducts) {
      try {
        this.products = JSON.parse(savedProducts);
      } catch (e) {
        this.products = [...SAMPLE_PRODUCTS];
      }
    } else {
      this.products = [...SAMPLE_PRODUCTS];
      this.saveProducts();
    }

    if (savedHistory) {
      try {
        this.history = JSON.parse(savedHistory);
      } catch (e) {
        this.history = [...SAMPLE_HISTORY];
      }
    } else {
      this.history = [...SAMPLE_HISTORY];
      this.saveHistory();
    }

    if (savedTheme === 'dark') {
      document.body.setAttribute('data-theme', 'dark');
    }
  }

  saveProducts() {
    localStorage.setItem('smartstock_products', JSON.stringify(this.products));
  }

  saveHistory() {
    localStorage.setItem('smartstock_history', JSON.stringify(this.history));
  }

  // Bind UI Events
  bindEvents() {
    // Theme Switcher
    const themeBtn = document.getElementById('themeToggleBtn');
    themeBtn.addEventListener('click', () => {
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

    // Navigation Tabs
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabTarget = tab.dataset.tab;
        this.switchTab(tabTarget);
      });
    });

    // Low stock trigger card in metrics
    document.getElementById('cardLowStockTrigger').addEventListener('click', () => {
      this.switchTab('alerts');
    });

    // Search input
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

    // Category Filter
    const catFilter = document.getElementById('categoryFilter');
    catFilter.addEventListener('change', (e) => {
      this.categoryFilter = e.target.value;
      this.renderProducts();
    });

    // History Type Filter
    const histFilter = document.getElementById('historyFilterType');
    histFilter.addEventListener('change', (e) => {
      this.historyFilter = e.target.value;
      this.renderHistory();
    });

    // Modals: Product Add/Edit
    const openAddBtn = document.getElementById('openAddModalBtn');
    const productModal = document.getElementById('productModal');
    const closeProductModal = document.getElementById('closeProductModalBtn');
    const cancelProductBtn = document.getElementById('cancelProductBtn');
    const productForm = document.getElementById('productForm');

    openAddBtn.addEventListener('click', () => this.openProductModal());
    closeProductModal.addEventListener('click', () => this.closeModal(productModal));
    cancelProductBtn.addEventListener('click', () => this.closeModal(productModal));
    productForm.addEventListener('submit', (e) => this.handleSaveProduct(e));

    // Modals: Quick Stock Adjust
    const actionModal = document.getElementById('stockActionModal');
    const closeActionModal = document.getElementById('closeActionModalBtn');
    const cancelActionBtn = document.getElementById('cancelActionBtn');
    const stockActionForm = document.getElementById('stockActionForm');
    const btnTypeIn = document.getElementById('btnTypeIn');
    const btnTypeOut = document.getElementById('btnTypeOut');

    btnTypeIn.addEventListener('click', () => this.setActionType('IN'));
    btnTypeOut.addEventListener('click', () => this.setActionType('OUT'));

    closeActionModal.addEventListener('click', () => this.closeModal(actionModal));
    cancelActionBtn.addEventListener('click', () => this.closeModal(actionModal));
    stockActionForm.addEventListener('submit', (e) => this.handleSaveStockAction(e));

    // Modals: Backup & Restore
    const backupBtn = document.getElementById('backupBtn');
    const backupModal = document.getElementById('backupModal');
    const closeBackupBtn = document.getElementById('closeBackupModalBtn');
    const closeBackupFooterBtn = document.getElementById('closeBackupFooterBtn');

    backupBtn.addEventListener('click', () => this.openModal(backupModal));
    closeBackupBtn.addEventListener('click', () => this.closeModal(backupModal));
    closeBackupFooterBtn.addEventListener('click', () => this.closeModal(backupModal));

    // Export JSON
    document.getElementById('exportJsonBtn').addEventListener('click', () => this.exportBackup());

    // Import JSON
    const importFileInput = document.getElementById('importFileInput');
    document.getElementById('importJsonBtn').addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', (e) => this.importBackup(e));

    // Load Sample Data
    document.getElementById('loadSampleDataBtn').addEventListener('click', () => {
      if (confirm('ต้องการโหลดข้อมูลตัวอย่างสินค้าหรือไม่? ข้อมูลปัจจุบันจะถูกแทนที่')) {
        this.products = JSON.parse(JSON.stringify(SAMPLE_PRODUCTS));
        this.history = JSON.parse(JSON.stringify(SAMPLE_HISTORY));
        this.saveProducts();
        this.saveHistory();
        this.render();
        this.closeModal(backupModal);
        this.showToast('โหลดข้อมูลตัวอย่างเรียบร้อย', 'success');
      }
    });

    // Reset All Data
    document.getElementById('resetAllDataBtn').addEventListener('click', () => {
      if (confirm('คำเตือน: คุณแน่ใจหรือไม่ว่าต้องการล้างสต็อกและประวัติทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
        this.products = [];
        this.history = [];
        this.saveProducts();
        this.saveHistory();
        this.render();
        this.closeModal(backupModal);
        this.showToast('ล้างข้อมูลเรียบร้อยแล้ว', 'warning');
      }
    });

    // Close modal on click outside
    window.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        this.closeModal(e.target);
      }
    });
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

  openModal(modalElem) {
    modalElem.classList.add('active');
  }

  closeModal(modalElem) {
    modalElem.classList.remove('active');
  }

  openProductModal(product = null) {
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');
    const title = document.getElementById('modalTitle');
    const editIdInput = document.getElementById('editProductId');

    form.reset();

    if (product) {
      title.textContent = 'แก้ไขรายละเอียดสินค้า';
      editIdInput.value = product.id;
      document.getElementById('prodName').value = product.name;
      document.getElementById('prodSku').value = product.sku || '';
      document.getElementById('prodCategory').value = product.category || '';
      document.getElementById('prodQuantity').value = product.quantity;
      document.getElementById('prodMinAlert').value = product.minAlert;
      document.getElementById('prodPrice').value = product.price || 0;
      document.getElementById('prodUnit').value = product.unit || 'ชิ้น';
    } else {
      title.textContent = 'เพิ่มสินค้าใหม่';
      editIdInput.value = '';
      document.getElementById('prodQuantity').value = 10;
      document.getElementById('prodMinAlert').value = 5;
      document.getElementById('prodPrice').value = 100;
      document.getElementById('prodUnit').value = 'ชิ้น';
    }

    this.openModal(modal);
  }

  handleSaveProduct(e) {
    e.preventDefault();
    const editId = document.getElementById('editProductId').value;
    const name = document.getElementById('prodName').value.trim();
    const sku = document.getElementById('prodSku').value.trim();
    const category = document.getElementById('prodCategory').value.trim() || 'ทั่วไป';
    const quantity = parseInt(document.getElementById('prodQuantity').value, 10) || 0;
    const minAlert = parseInt(document.getElementById('prodMinAlert').value, 10) || 0;
    const price = parseFloat(document.getElementById('prodPrice').value) || 0;
    const unit = document.getElementById('prodUnit').value.trim() || 'ชิ้น';

    if (editId) {
      // Edit existing product
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
          price,
          unit,
          updatedAt: new Date().toISOString()
        };

        // If quantity changed directly in edit, log it
        if (oldQty !== quantity) {
          const diff = quantity - oldQty;
          this.logHistory({
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
      // Create new product
      const newProduct = {
        id: 'prod_' + Date.now(),
        name,
        sku: sku || ('SKU-' + Math.floor(1000 + Math.random() * 9000)),
        category,
        quantity,
        minAlert,
        price,
        unit,
        updatedAt: new Date().toISOString()
      };
      this.products.unshift(newProduct);

      // Log initial stock
      if (quantity > 0) {
        this.logHistory({
          productId: newProduct.id,
          productName: name,
          type: 'IN',
          amount: quantity,
          balanceAfter: quantity,
          reason: 'เพิ่มสินค้าใหม่เข้าระบบ'
        });
      }

      this.showToast(`เพิ่ม "${name}" เข้าระบบแล้ว`, 'success');
    }

    this.saveProducts();
    this.closeModal(document.getElementById('productModal'));
    this.render();
  }

  // Stock Adjust Modal Trigger
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
      alert(`ไม่สามารถตัดของออกได้! จำนวนในสต็อกมีเพียง ${product.quantity} ${product.unit}`);
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

    // Log History
    this.logHistory({
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

    if (confirm(`คุณต้องการลบ "${product.name}" ออกจากระบบหรือไม่?`)) {
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

  // Backup Export
  exportBackup() {
    const backupData = {
      app: 'SmartStock',
      exportedAt: new Date().toISOString(),
      products: this.products,
      history: this.history
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    const dateFormatted = new Date().toISOString().slice(0, 10);
    downloadAnchor.setAttribute("download", `smartstock-backup-${dateFormatted}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    this.showToast('ดาวน์โหลดไฟล์สำรองเรียบร้อยแล้ว 💾', 'success');
  }

  // Backup Import
  importBackup(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (Array.isArray(parsed.products)) {
          this.products = parsed.products;
          this.history = Array.isArray(parsed.history) ? parsed.history : [];
          this.saveProducts();
          this.saveHistory();
          this.render();
          this.closeModal(document.getElementById('backupModal'));
          this.showToast('กู้คืนข้อมูลสต็อกสำเร็จเรียบร้อย! 🎉', 'success');
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

  // Toast System
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

  // Render Pipeline
  render() {
    this.renderMetrics();
    this.renderCategoryFilterOptions();
    this.renderProducts();
    this.renderHistory();
    this.renderAlerts();
  }

  renderMetrics() {
    const totalSKUs = this.products.length;
    const totalQuantity = this.products.reduce((sum, p) => sum + (p.quantity || 0), 0);
    const totalValue = this.products.reduce((sum, p) => sum + ((p.quantity || 0) * (p.price || 0)), 0);
    const lowStockCount = this.products.filter(p => (p.quantity || 0) <= (p.minAlert || 0)).length;

    document.getElementById('metricTotalSKUs').textContent = totalSKUs.toLocaleString();
    document.getElementById('metricTotalQuantity').textContent = totalQuantity.toLocaleString();
    document.getElementById('metricTotalValue').textContent = '฿' + totalValue.toLocaleString();
    document.getElementById('metricLowStockCount').textContent = lowStockCount.toLocaleString();
    document.getElementById('alertCountBadge').textContent = lowStockCount;

    const hint = document.getElementById('metricLowStockHint');
    if (lowStockCount > 0) {
      hint.textContent = `มี ${lowStockCount} รายการต้องเติมด่วน`;
      hint.style.color = 'var(--danger)';
    } else {
      hint.textContent = 'สต็อกอยู่ในเกณฑ์ปลอดภัย';
      hint.style.color = 'var(--success)';
    }
  }

  renderCategoryFilterOptions() {
    const select = document.getElementById('categoryFilter');
    const currentVal = select.value;
    const categories = Array.from(new Set(this.products.map(p => p.category).filter(Boolean)));

    let html = `<option value="ALL">📁 ทุกหมวดหมู่ (${this.products.length})</option>`;
    categories.forEach(cat => {
      const count = this.products.filter(p => p.category === cat).length;
      html += `<option value="${cat}">${cat} (${count})</option>`;
    });

    select.innerHTML = html;
    if (categories.includes(currentVal) || currentVal === 'ALL') {
      select.value = currentVal;
    }
  }

  renderProducts() {
    const grid = document.getElementById('productGrid');
    const emptyState = document.getElementById('emptyInventoryState');
    const countBadge = document.getElementById('productCountBadge');

    let filtered = this.products.filter(p => {
      const matchesSearch = !this.searchQuery || 
        p.name.toLowerCase().includes(this.searchQuery) ||
        (p.sku && p.sku.toLowerCase().includes(this.searchQuery)) ||
        (p.category && p.category.toLowerCase().includes(this.searchQuery));

      const matchesCategory = this.categoryFilter === 'ALL' || p.category === this.categoryFilter;

      return matchesSearch && matchesCategory;
    });

    countBadge.textContent = `${filtered.length} รายการ`;

    if (filtered.length === 0) {
      grid.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

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
              <span class="product-unit">${this.escapeHtml(item.unit || 'ชิ้น')}</span>
            </div>
            <div class="product-price-block">
              <div class="product-unit-price">฿${(item.price || 0).toLocaleString()}</div>
              <div class="product-min-threshold">เตือนเมื่อต่ำกว่า: ${item.minAlert}</div>
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

  editProductById(id) {
    const prod = this.products.find(p => p.id === id);
    if (prod) this.openProductModal(prod);
  }

  renderHistory() {
    const list = document.getElementById('historyList');
    const emptyState = document.getElementById('emptyHistoryState');

    let filtered = this.history;
    if (this.historyFilter !== 'ALL') {
      filtered = filtered.filter(h => h.type === this.historyFilter);
    }

    if (filtered.length === 0) {
      list.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    list.innerHTML = filtered.map(item => {
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

    const lowStockItems = this.products.filter(p => (p.quantity || 0) <= (p.minAlert || 0));

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

// Instantiate globally
window.addEventListener('DOMContentLoaded', () => {
  window.app = new StockApp();
});
