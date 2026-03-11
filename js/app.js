// ====== IT Asset Management Application ======
// Backend: PHP + MySQL via REST API

(function () {
    'use strict';

    const API = 'http://localhost/asset_miracle/api';

    // Category colors for charts
    const CATEGORY_COLORS = {
        "UPS": "#2563eb",
        "Laptop": "#7c3aed",
        "CPU": "#059669",
        "Switch": "#d97706",
        "Meja": "#dc2626",
        "Kursi": "#0891b2",
        "Monitor": "#c026d3",
        "Server": "#4f46e5",
        "Printer": "#ea580c",
        "Projector": "#65a30d",
        "AC": "#0d9488",
        "TV": "#e11d48",
        "Lemari": "#7c2d12",
        "Rak": "#6b7280",
        "Papan Tulis": "#a3a3a3",
        "Harddisk": "#1d4ed8",
        "Access Point": "#16a34a",
        "Router": "#9333ea",
        "Lainnya": "#64748b"
    };

    // ====== State ======
    let assets = [];
    let lendings = [];
    let handovers = [];

    // ====== API Helpers ======
    async function apiGet(endpoint, params = {}) {
        const url = new URL(endpoint, window.location.href);
        Object.entries(params).forEach(([k, v]) => {
            if (v !== '' && v !== null && v !== undefined) url.searchParams.set(k, v);
        });
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    }

    async function apiPost(endpoint, data) {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
        return json;
    }

    async function apiPut(endpoint, data) {
        const res = await fetch(endpoint, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
        return json;
    }

    async function apiDelete(endpoint, data) {
        const res = await fetch(endpoint, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
        return json;
    }

    // ====== Init ======
    async function init() {
        await loadData();
        setupNavigation();
        setupModals();
        setupFilters();
        setupSearch();
        setupReportButtons();
        setupHandoverModal();
        renderDashboard();
        renderAssets();
        renderLendings();
        renderHandovers();
        renderReports();
    }

    // ====== Data Loading ======
    async function loadData() {
        try {
            [assets, lendings, handovers] = await Promise.all([
                apiGet(`${API}/assets.php`),
                apiGet(`${API}/lendings.php`),
                apiGet(`${API}/handovers.php`),
            ]);
        } catch (err) {
            console.error('Failed to load data:', err);
            showToast('Gagal memuat data dari server', 'error');
            assets = [];
            lendings = [];
        }
    }

    async function refreshAssets() {
        try {
            assets = await apiGet(`${API}/assets.php`);
        } catch (err) {
            console.error('Failed to refresh assets:', err);
        }
    }

    async function refreshLendings() {
        try {
            lendings = await apiGet(`${API}/lendings.php`);
        } catch (err) {
            console.error('Failed to refresh lendings:', err);
        }
    }

    // ====== Navigation ======
    function setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        const pageTitles = {
            dashboard: 'Dashboard',
            assets: 'Data Aset',
            lending: 'Peminjaman Aset',
            handover: 'Serah Terima',
            reports: 'Laporan'
        };

        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;

                navItems.forEach(n => n.classList.remove('active'));
                item.classList.add('active');

                document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
                document.getElementById('page-' + page).classList.add('active');
                document.getElementById('pageTitle').textContent = pageTitles[page];

                // Close mobile sidebar
                document.getElementById('sidebar').classList.remove('open');

                // Refresh data when switching pages
                if (page === 'dashboard') renderDashboard();
                if (page === 'handover') renderHandovers();
                if (page === 'reports') renderReports();
            });
        });

        // Mobile sidebar toggle
        document.getElementById('mobileToggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
        });
    }

    // ====== Search ======
    function setupSearch() {
        document.getElementById('globalSearch').addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const activePage = document.querySelector('.page.active');

            if (activePage.id === 'page-assets') {
                renderAssets(query);
            } else if (activePage.id === 'page-lending') {
                renderLendings(query);
            }
        });
    }

    // ====== Modals ======
    function setupModals() {
        // Asset Modal
        document.getElementById('btnAddAsset').addEventListener('click', () => openAssetModal());
        document.getElementById('closeAssetModal').addEventListener('click', () => closeModal('assetModal'));
        document.getElementById('cancelAssetModal').addEventListener('click', () => closeModal('assetModal'));
        document.getElementById('assetForm').addEventListener('submit', handleAssetSubmit);

        // Lending Modal
        document.getElementById('btnAddLending').addEventListener('click', () => openLendingModal());
        document.getElementById('closeLendingModal').addEventListener('click', () => closeModal('lendingModal'));
        document.getElementById('cancelLendingModal').addEventListener('click', () => closeModal('lendingModal'));
        document.getElementById('lendingForm').addEventListener('submit', handleLendingSubmit);

        // Detail Modal
        document.getElementById('closeDetailModal').addEventListener('click', () => closeModal('detailModal'));
        document.getElementById('cancelDetailModal').addEventListener('click', () => closeModal('detailModal'));

        // Close on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) overlay.classList.remove('active');
            });
        });
    }

    function openModal(id) {
        document.getElementById(id).classList.add('active');
    }

    function closeModal(id) {
        document.getElementById(id).classList.remove('active');
    }

    // ====== Asset CRUD ======
    function openAssetModal(asset = null) {
        const form = document.getElementById('assetForm');
        form.reset();
        document.getElementById('assetId').value = '';
        document.getElementById('assetQty').value = 1;

        if (asset) {
            document.getElementById('assetModalTitle').textContent = 'Edit Aset';
            document.getElementById('assetId').value = asset.id;
            document.getElementById('assetCategory').value = asset.category;
            document.getElementById('assetName').value = asset.name;
            document.getElementById('assetCode').value = asset.code || '';
            document.getElementById('assetBrand').value = asset.brand || '';
            document.getElementById('assetMaterial').value = asset.material || '';
            document.getElementById('assetQty').value = asset.qty || 1;
            document.getElementById('assetCondition').value = asset.broken ? 'broken' : 'good';
            document.getElementById('assetPIC').value = asset.pic;
            document.getElementById('assetForSale').checked = asset.forSale;
            document.getElementById('assetObsolete').checked = asset.obsolete;
        } else {
            document.getElementById('assetModalTitle').textContent = 'Tambah Aset Baru';
        }

        openModal('assetModal');
    }

    async function handleAssetSubmit(e) {
        e.preventDefault();

        const id = document.getElementById('assetId').value;
        const condition = document.getElementById('assetCondition').value;

        const data = {
            category: document.getElementById('assetCategory').value,
            name: document.getElementById('assetName').value,
            code: document.getElementById('assetCode').value,
            brand: document.getElementById('assetBrand').value,
            material: document.getElementById('assetMaterial').value,
            qty: parseInt(document.getElementById('assetQty').value) || 1,
            good: condition === 'good',
            broken: condition === 'broken',
            pic: document.getElementById('assetPIC').value,
            forSale: document.getElementById('assetForSale').checked,
            obsolete: document.getElementById('assetObsolete').checked,
        };

        try {
            if (id) {
                data.id = parseInt(id);
                await apiPut(`${API}/assets.php`, data);
                showToast('Aset berhasil diperbarui', 'success');
            } else {
                await apiPost(`${API}/assets.php`, data);
                showToast('Aset baru berhasil ditambahkan', 'success');
            }

            await refreshAssets();
            renderAssets();
            renderDashboard();
            closeModal('assetModal');
        } catch (err) {
            showToast('Gagal menyimpan: ' + err.message, 'error');
        }
    }

    async function deleteAsset(id) {
        if (!confirm('Apakah Anda yakin ingin menghapus aset ini?')) return;

        try {
            await apiDelete(`${API}/assets.php`, { id });
            await refreshAssets();
            renderAssets();
            renderDashboard();
            showToast('Aset berhasil dihapus', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    function showAssetDetail(id) {
        const asset = assets.find(a => a.id === id);
        if (!asset) return;

        const statusBadges = [];
        if (asset.broken) statusBadges.push('<span class="badge badge-broken"><i class="fas fa-times-circle"></i> Rusak</span>');
        else statusBadges.push('<span class="badge badge-good"><i class="fas fa-check-circle"></i> Baik</span>');
        if (asset.forSale) statusBadges.push('<span class="badge badge-sale"><i class="fas fa-tag"></i> Dijual</span>');
        if (asset.obsolete) statusBadges.push('<span class="badge badge-obsolete"><i class="fas fa-archive"></i> Usang</span>');
        if (asset.lent) statusBadges.push('<span class="badge badge-lent"><i class="fas fa-hand-holding"></i> Dipinjam</span>');

        // Find lending history
        const history = lendings.filter(l => l.assetId === id);

        let historyHTML = '';
        if (history.length > 0) {
            historyHTML = `
                <div style="margin-top: 20px; border-top: 1px solid var(--gray-200); padding-top: 16px;">
                    <h4 style="margin-bottom: 12px; font-size: 0.9rem; color: var(--gray-600);">Riwayat Peminjaman</h4>
                    <table class="data-table">
                        <thead><tr><th>Peminjam</th><th>Tgl Pinjam</th><th>Tgl Kembali</th><th>Status</th></tr></thead>
                        <tbody>
                            ${history.map(l => `
                                <tr>
                                    <td>${escapeHtml(l.borrower)}</td>
                                    <td>${formatDate(l.lendDate)}</td>
                                    <td>${l.returnDate ? formatDate(l.returnDate) : '-'}</td>
                                    <td>${getLendingBadge(l)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>`;
        }

        document.getElementById('detailContent').innerHTML = `
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">Kategori</div>
                    <div class="detail-value">${escapeHtml(asset.category)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Nama Barang</div>
                    <div class="detail-value">${escapeHtml(asset.name)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Kode Aset</div>
                    <div class="detail-value">${asset.code ? escapeHtml(asset.code) : '-'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Merek</div>
                    <div class="detail-value">${asset.brand ? escapeHtml(asset.brand) : '-'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Bahan</div>
                    <div class="detail-value">${asset.material ? escapeHtml(asset.material) : '-'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Jumlah</div>
                    <div class="detail-value">${asset.qty}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">PIC</div>
                    <div class="detail-value">${escapeHtml(asset.pic)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Status</div>
                    <div class="detail-value">${statusBadges.join(' ')}</div>
                </div>
            </div>
            ${historyHTML}
        `;

        openModal('detailModal');
    }

    // ====== Lending CRUD ======
    function openLendingModal() {
        const form = document.getElementById('lendingForm');
        form.reset();
        document.getElementById('lendingId').value = '';
        document.getElementById('lendingModalTitle').textContent = 'Pinjam Aset';

        // Set default date
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('lendingDate').value = today;

        // Populate available assets
        const select = document.getElementById('lendingAsset');
        select.innerHTML = '<option value="">Pilih Aset</option>';
        assets
            .filter(a => !a.lent && a.good && !a.broken && !a.forSale && !a.obsolete)
            .forEach(a => {
                const opt = document.createElement('option');
                opt.value = a.id;
                opt.textContent = `${a.name}${a.code ? ' (' + a.code + ')' : ''} - ${a.brand || a.category}`;
                select.appendChild(opt);
            });

        openModal('lendingModal');
    }

    async function handleLendingSubmit(e) {
        e.preventDefault();

        const assetId = parseInt(document.getElementById('lendingAsset').value);
        const lendDate = document.getElementById('lendingDate').value;
        const dueDate = document.getElementById('lendingDue').value;

        if (new Date(dueDate) <= new Date(lendDate)) {
            showToast('Tanggal batas kembali harus setelah tanggal pinjam', 'error');
            return;
        }

        const data = {
            assetId: assetId,
            borrower: document.getElementById('lendingBorrower').value,
            department: document.getElementById('lendingDept').value,
            lendDate: lendDate,
            dueDate: dueDate,
            notes: document.getElementById('lendingNotes').value,
        };

        try {
            await apiPost(`${API}/lendings.php`, data);
            await Promise.all([refreshAssets(), refreshLendings()]);
            renderLendings();
            renderDashboard();
            renderAssets();
            closeModal('lendingModal');
            showToast('Peminjaman berhasil dicatat', 'success');
        } catch (err) {
            showToast('Gagal menyimpan: ' + err.message, 'error');
        }
    }

    async function returnAsset(lendingId) {
        if (!confirm('Konfirmasi pengembalian aset?')) return;

        try {
            await apiPut(`${API}/lendings.php`, { id: lendingId, action: 'return' });
            await Promise.all([refreshAssets(), refreshLendings()]);
            renderLendings();
            renderDashboard();
            renderAssets();
            showToast('Aset berhasil dikembalikan', 'success');
        } catch (err) {
            showToast('Gagal: ' + err.message, 'error');
        }
    }

    async function deleteLending(lendingId) {
        if (!confirm('Hapus catatan peminjaman ini?')) return;

        try {
            await apiDelete(`${API}/lendings.php`, { id: lendingId });
            await Promise.all([refreshAssets(), refreshLendings()]);
            renderLendings();
            renderDashboard();
            showToast('Catatan peminjaman dihapus', 'success');
        } catch (err) {
            showToast('Gagal: ' + err.message, 'error');
        }
    }

    // ====== Filters ======
    function setupFilters() {
        // Populate category filter
        const categories = [...new Set(assets.map(a => a.category))].sort();
        const catSelect = document.getElementById('filterCategory');
        categories.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            opt.textContent = c;
            catSelect.appendChild(opt);
        });

        // Populate PIC filter
        const pics = [...new Set(assets.map(a => a.pic))].sort();
        const picSelect = document.getElementById('filterPIC');
        pics.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p;
            opt.textContent = p;
            picSelect.appendChild(opt);
        });

        // Filter events
        document.getElementById('filterCategory').addEventListener('change', () => renderAssets());
        document.getElementById('filterCondition').addEventListener('change', () => renderAssets());
        document.getElementById('filterPIC').addEventListener('change', () => renderAssets());
        document.getElementById('filterLendingStatus').addEventListener('change', () => renderLendings());
    }

    // ====== Render Dashboard ======
    function renderDashboard() {
        const total = assets.length;
        const good = assets.filter(a => a.good && !a.broken).length;
        const broken = assets.filter(a => a.broken).length;
        const lent = lendings.filter(l => l.status === 'active').length;
        const forSale = assets.filter(a => a.forSale).length;
        const obsolete = assets.filter(a => a.obsolete).length;

        document.getElementById('totalAssets').textContent = total;
        document.getElementById('goodAssets').textContent = good;
        document.getElementById('brokenAssets').textContent = broken;
        document.getElementById('lentAssets').textContent = lent;

        // Category chart
        renderCategoryChart();

        // Condition summary
        renderConditionSummary(good, broken, forSale, obsolete);

        // Active lending table
        renderActiveLendingTable();
    }

    function renderCategoryChart() {
        const counts = {};
        assets.forEach(a => {
            counts[a.category] = (counts[a.category] || 0) + 1;
        });

        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        const max = sorted.length > 0 ? sorted[0][1] : 1;

        const container = document.getElementById('categoryChart');
        container.innerHTML = sorted.map(([cat, count]) => {
            const pct = (count / max * 100).toFixed(0);
            const color = CATEGORY_COLORS[cat] || '#64748b';
            return `
                <div class="chart-bar-row">
                    <span class="chart-bar-label">${escapeHtml(cat)}</span>
                    <div class="chart-bar-track">
                        <div class="chart-bar-fill" style="width: ${pct}%; background: ${color};">${count}</div>
                    </div>
                    <span class="chart-bar-count">${count}</span>
                </div>`;
        }).join('');
    }

    function renderConditionSummary(good, broken, forSale, obsolete) {
        const container = document.getElementById('conditionSummary');
        container.innerHTML = `
            <div class="condition-item">
                <span class="label"><span class="dot" style="background: var(--success);"></span> Baik</span>
                <span class="count" style="color: var(--success);">${good}</span>
            </div>
            <div class="condition-item">
                <span class="label"><span class="dot" style="background: var(--danger);"></span> Rusak</span>
                <span class="count" style="color: var(--danger);">${broken}</span>
            </div>
            <div class="condition-item">
                <span class="label"><span class="dot" style="background: var(--orange);"></span> Dijual</span>
                <span class="count" style="color: var(--orange);">${forSale}</span>
            </div>
            <div class="condition-item">
                <span class="label"><span class="dot" style="background: var(--gray-400);"></span> Usang</span>
                <span class="count" style="color: var(--gray-500);">${obsolete}</span>
            </div>
        `;
    }

    function renderActiveLendingTable() {
        const active = lendings.filter(l => l.status === 'active');
        const tbody = document.getElementById('activeLendingTable');

        if (active.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Tidak ada peminjaman aktif</td></tr>';
            return;
        }

        tbody.innerHTML = active.map(l => {
            const asset = assets.find(a => a.id === l.assetId);
            const assetName = asset ? asset.name : (l.assetName || 'Aset tidak ditemukan');
            const isOverdue = new Date(l.dueDate) < new Date();

            return `
                <tr>
                    <td>${escapeHtml(assetName)}</td>
                    <td>${escapeHtml(l.borrower)}</td>
                    <td>${formatDate(l.lendDate)}</td>
                    <td>${formatDate(l.dueDate)}</td>
                    <td>${isOverdue
                    ? '<span class="badge badge-overdue"><i class="fas fa-exclamation-triangle"></i> Terlambat</span>'
                    : '<span class="badge badge-active"><i class="fas fa-clock"></i> Dipinjam</span>'
                }</td>
                </tr>`;
        }).join('');
    }

    // ====== Render Assets ======
    function renderAssets(searchQuery = '') {
        const category = document.getElementById('filterCategory').value;
        const condition = document.getElementById('filterCondition').value;
        const pic = document.getElementById('filterPIC').value;
        const query = searchQuery || document.getElementById('globalSearch').value.toLowerCase();

        let filtered = assets.filter(a => {
            if (category && a.category !== category) return false;
            if (condition === 'good' && (a.broken || !a.good)) return false;
            if (condition === 'broken' && !a.broken) return false;
            if (pic && a.pic !== pic) return false;
            if (query) {
                const searchStr = `${a.name} ${a.category} ${a.brand} ${a.code} ${a.pic}`.toLowerCase();
                if (!searchStr.includes(query)) return false;
            }
            return true;
        });

        const tbody = document.getElementById('assetsTableBody');

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="empty-state">Tidak ada aset ditemukan</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map((a, idx) => {
            const statusBadges = [];
            if (a.forSale) statusBadges.push('<span class="badge badge-sale">Dijual</span>');
            if (a.obsolete) statusBadges.push('<span class="badge badge-obsolete">Usang</span>');
            if (a.lent) statusBadges.push('<span class="badge badge-lent">Dipinjam</span>');
            if (!a.forSale && !a.obsolete && !a.lent) statusBadges.push('<span class="badge badge-good">Tersedia</span>');

            return `
                <tr>
                    <td>${idx + 1}</td>
                    <td>${escapeHtml(a.category)}</td>
                    <td><strong>${escapeHtml(a.name)}</strong></td>
                    <td>${a.code ? escapeHtml(a.code) : '-'}</td>
                    <td>${a.brand ? escapeHtml(a.brand) : '-'}</td>
                    <td>${a.broken
                    ? '<span class="badge badge-broken"><i class="fas fa-times-circle"></i> Rusak</span>'
                    : '<span class="badge badge-good"><i class="fas fa-check-circle"></i> Baik</span>'
                }</td>
                    <td>${escapeHtml(a.pic)}</td>
                    <td>${statusBadges.join(' ')}</td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-icon view" title="Detail" onclick="window.appActions.viewAsset(${a.id})">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-icon edit" title="Edit" onclick="window.appActions.editAsset(${a.id})">
                                <i class="fas fa-pen"></i>
                            </button>
                            <button class="btn-icon delete" title="Hapus" onclick="window.appActions.deleteAsset(${a.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
        }).join('');
    }

    // ====== Render Lendings ======
    function renderLendings(searchQuery = '') {
        const statusFilter = document.getElementById('filterLendingStatus').value;
        const query = searchQuery || '';

        let filtered = lendings.filter(l => {
            // Check overdue
            const isOverdue = l.status === 'active' && new Date(l.dueDate) < new Date();
            const displayStatus = isOverdue ? 'overdue' : l.status;

            if (statusFilter && statusFilter !== displayStatus) {
                if (statusFilter === 'active' && displayStatus === 'overdue') { /* include overdue in active */ }
                else return false;
            }

            if (query) {
                const asset = assets.find(a => a.id === l.assetId);
                const searchStr = `${asset ? asset.name : ''} ${l.borrower} ${l.department}`.toLowerCase();
                if (!searchStr.includes(query)) return false;
            }

            return true;
        });

        const tbody = document.getElementById('lendingTableBody');

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="empty-state">Tidak ada data peminjaman</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map((l, idx) => {
            const asset = assets.find(a => a.id === l.assetId);
            const assetName = asset ? asset.name : (l.assetName || 'Aset tidak ditemukan');

            return `
                <tr>
                    <td>${idx + 1}</td>
                    <td><strong>${escapeHtml(assetName)}</strong></td>
                    <td>${escapeHtml(l.borrower)}</td>
                    <td>${escapeHtml(l.department)}</td>
                    <td>${formatDate(l.lendDate)}</td>
                    <td>${formatDate(l.dueDate)}</td>
                    <td>${l.returnDate ? formatDate(l.returnDate) : '-'}</td>
                    <td>${getLendingBadge(l)}</td>
                    <td>
                        <div class="action-btns">
                            ${l.status === 'active' ? `
                                <button class="btn-icon return" title="Kembalikan" onclick="window.appActions.returnAsset(${l.id})">
                                    <i class="fas fa-undo"></i>
                                </button>
                            ` : ''}
                            <button class="btn-icon delete" title="Hapus" onclick="window.appActions.deleteLending(${l.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
        }).join('');
    }

    // ====== Render Reports ======
    function renderReports() {
        renderCategoryReport();
        renderPICReport();
        renderLendingReport();
    }

    function renderCategoryReport() {
        const counts = {};
        assets.forEach(a => {
            if (!counts[a.category]) {
                counts[a.category] = { total: 0, good: 0, broken: 0, forSale: 0, obsolete: 0 };
            }
            counts[a.category].total++;
            if (a.good && !a.broken) counts[a.category].good++;
            if (a.broken) counts[a.category].broken++;
            if (a.forSale) counts[a.category].forSale++;
            if (a.obsolete) counts[a.category].obsolete++;
        });

        const sorted = Object.entries(counts).sort((a, b) => b[1].total - a[1].total);
        const tbody = document.getElementById('reportCategoryBody');

        tbody.innerHTML = sorted.map(([cat, data]) => `
            <tr>
                <td><strong>${escapeHtml(cat)}</strong></td>
                <td>${data.total}</td>
                <td><span style="color: var(--success); font-weight: 600;">${data.good}</span></td>
                <td><span style="color: var(--danger); font-weight: 600;">${data.broken}</span></td>
                <td>${data.forSale}</td>
                <td>${data.obsolete}</td>
            </tr>
        `).join('');

        // Add total row
        const totals = sorted.reduce((acc, [, d]) => ({
            total: acc.total + d.total,
            good: acc.good + d.good,
            broken: acc.broken + d.broken,
            forSale: acc.forSale + d.forSale,
            obsolete: acc.obsolete + d.obsolete,
        }), { total: 0, good: 0, broken: 0, forSale: 0, obsolete: 0 });

        tbody.innerHTML += `
            <tr style="font-weight: 700; background: var(--gray-50);">
                <td>TOTAL</td>
                <td>${totals.total}</td>
                <td style="color: var(--success);">${totals.good}</td>
                <td style="color: var(--danger);">${totals.broken}</td>
                <td>${totals.forSale}</td>
                <td>${totals.obsolete}</td>
            </tr>`;
    }

    function renderPICReport() {
        const counts = {};
        assets.forEach(a => {
            if (!counts[a.pic]) {
                counts[a.pic] = { total: 0, good: 0, broken: 0 };
            }
            counts[a.pic].total++;
            if (a.good && !a.broken) counts[a.pic].good++;
            if (a.broken) counts[a.pic].broken++;
        });

        const sorted = Object.entries(counts).sort((a, b) => b[1].total - a[1].total);
        const tbody = document.getElementById('reportPICBody');

        tbody.innerHTML = sorted.map(([pic, data]) => `
            <tr>
                <td><strong>${escapeHtml(pic)}</strong></td>
                <td>${data.total}</td>
                <td style="color: var(--success); font-weight: 600;">${data.good}</td>
                <td style="color: var(--danger); font-weight: 600;">${data.broken}</td>
            </tr>
        `).join('');
    }

    function renderLendingReport() {
        const tbody = document.getElementById('reportLendingBody');
        const completed = lendings.filter(l => l.status === 'returned');

        if (completed.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Belum ada riwayat peminjaman</td></tr>';
            return;
        }

        tbody.innerHTML = completed.map(l => {
            const asset = assets.find(a => a.id === l.assetId);
            const assetName = asset ? asset.name : (l.assetName || 'Aset tidak ditemukan');
            const days = Math.ceil((new Date(l.returnDate) - new Date(l.lendDate)) / (1000 * 60 * 60 * 24));

            return `
                <tr>
                    <td>${escapeHtml(assetName)}</td>
                    <td>${escapeHtml(l.borrower)}</td>
                    <td>${formatDate(l.lendDate)}</td>
                    <td>${formatDate(l.returnDate)}</td>
                    <td>${days} hari</td>
                </tr>`;
        }).join('');
    }

    // ====== Report Buttons ======
    function setupReportButtons() {
        document.getElementById('btnExportCSV').addEventListener('click', exportCSV);
        document.getElementById('btnPrint').addEventListener('click', () => window.print());
    }

    function exportCSV() {
        const headers = ['No', 'Kategori', 'Nama Barang', 'Kode', 'Merek', 'Bahan', 'Jumlah', 'Kondisi', 'PIC', 'Dijual', 'Usang'];
        const rows = assets.map((a, i) => [
            i + 1,
            a.category,
            a.name,
            a.code || '',
            a.brand || '',
            a.material || '',
            a.qty,
            a.broken ? 'Rusak' : 'Baik',
            a.pic,
            a.forSale ? 'Ya' : 'Tidak',
            a.obsolete ? 'Ya' : 'Tidak'
        ]);

        // Add BOM for Excel UTF-8 compatibility
        let csv = '\uFEFF' + headers.join(',') + '\n';
        rows.forEach(row => {
            csv += row.map(cell => {
                const str = String(cell);
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return '"' + str.replace(/"/g, '""') + '"';
                }
                return str;
            }).join(',') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'inventaris_it_' + new Date().toISOString().split('T')[0] + '.csv';
        link.click();
        URL.revokeObjectURL(url);
        showToast('File CSV berhasil diexport', 'success');
    }

    // ====== Helpers ======
    function getLendingBadge(lending) {
        if (lending.status === 'returned') {
            return '<span class="badge badge-returned"><i class="fas fa-check-circle"></i> Dikembalikan</span>';
        }
        const isOverdue = new Date(lending.dueDate) < new Date();
        if (isOverdue) {
            return '<span class="badge badge-overdue"><i class="fas fa-exclamation-triangle"></i> Terlambat</span>';
        }
        return '<span class="badge badge-active"><i class="fas fa-clock"></i> Dipinjam</span>';
    }

    function formatDate(dateStr) {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="${icons[type]}"></i><span>${escapeHtml(message)}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ====== Serah Terima / Handover ======
    let editingHandoverId = null;

    function setupHandoverModal() {
        // Tab switching
        document.querySelectorAll('.htab').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.htab').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.htab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('htab-' + btn.dataset.tab).classList.add('active');
            });
        });

        // Laptop modal
        document.getElementById('btnAddLaptopHandover').addEventListener('click', () => openHandoverModal('laptop'));
        document.getElementById('laptopHandoverForm').addEventListener('submit', (e) => handleHandoverSubmit(e, 'laptop'));

        // Add On modal
        document.getElementById('btnAddAddOnHandover').addEventListener('click', () => openHandoverModal('add_on'));
        document.getElementById('addOnHandoverForm').addEventListener('submit', (e) => handleHandoverSubmit(e, 'add_on'));
    }

    // Global function for dynamic list (called from inline onclick)
    window.addDynRow = function(containerId, value = '') {
        const container = document.getElementById(containerId);
        const idx = container.children.length;
        const letters = 'abcdefghijklmnopqrstuvwxyz';
        const letter = letters[idx] || (idx + 1);
        const row = document.createElement('div');
        row.className = 'dynlist-row';
        row.innerHTML = `
            <span class="dynlist-letter">${letter}.</span>
            <input type="text" class="dynlist-input" value="${escapeHtml(value)}" placeholder="Isi item...">
            <button type="button" class="btn-icon delete dynlist-remove" onclick="this.closest('.dynlist-row').remove(); reindexDynList('${containerId}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(row);
    };

    window.reindexDynList = function(containerId) {
        const letters = 'abcdefghijklmnopqrstuvwxyz';
        document.querySelectorAll(`#${containerId} .dynlist-letter`).forEach((span, i) => {
            span.textContent = (letters[i] || (i + 1)) + '.';
        });
    };

    function getDynListValues(containerId) {
        return Array.from(document.querySelectorAll(`#${containerId} .dynlist-input`))
            .map(inp => inp.value.trim())
            .filter(v => v !== '');
    }

    function openHandoverModal(type, data = null) {
        editingHandoverId = data ? data.id : null;
        const today = new Date().toISOString().split('T')[0];

        if (type === 'laptop') {
            document.getElementById('laptopHandoverForm').reset();
            document.getElementById('lp_softwareList').innerHTML = '';
            document.getElementById('lp_accessoriesList').innerHTML = '';

            if (data) {
                // Edit mode — fill existing data
                document.querySelector('#laptopHandoverModal .modal-header h3').innerHTML =
                    '<i class="fas fa-laptop"></i> Edit Form Serah Terima Laptop';
                document.querySelector('#laptopHandoverModal .modal-footer .btn-primary').innerHTML =
                    '<i class="fas fa-save"></i> Simpan Perubahan';
                document.getElementById('lp_date').value         = data.handover_date;
                document.getElementById('lp_deviceLabel').value  = data.device_label || '';
                document.getElementById('lp_fromName').value     = data.from_name || '';
                document.getElementById('lp_fromPosition').value = data.from_position || '';
                document.getElementById('lp_fromDept').value     = data.from_department || 'IT';
                document.getElementById('lp_deptHead').value     = data.dept_head || '';
                document.getElementById('lp_toName').value       = data.to_name || '';
                document.getElementById('lp_toPosition').value   = data.to_position || '';
                document.getElementById('lp_toDept').value       = data.to_department || '';
                document.getElementById('lp_toAddress').value    = data.to_address || '';
                document.getElementById('lp_merek').value        = data.merek || '';
                document.getElementById('lp_type').value         = data.type_device || '';
                document.getElementById('lp_sn').value           = data.serial_number || '';
                document.getElementById('lp_processor').value    = data.processor || '';
                document.getElementById('lp_storage').value      = data.storage || '';
                document.getElementById('lp_ram').value          = data.ram || '';
                document.getElementById('lp_screen').value       = data.screen_size || '';
                document.getElementById('lp_os').value           = data.os || '';
                document.getElementById('lp_office').value       = data.office_sw || '';
                (data.software_list || []).forEach(s => window.addDynRow('lp_softwareList', s));
                (data.accessories_list || []).forEach(a => window.addDynRow('lp_accessoriesList', a));
            } else {
                // Create mode — defaults
                document.querySelector('#laptopHandoverModal .modal-header h3').innerHTML =
                    '<i class="fas fa-laptop"></i> Form Serah Terima Laptop';
                document.querySelector('#laptopHandoverModal .modal-footer .btn-primary').innerHTML =
                    '<i class="fas fa-print"></i> Simpan & Cetak';
                document.getElementById('lp_date').value         = today;
                document.getElementById('lp_fromPosition').value = 'IT Hardware & Infrastructure Staff';
                document.getElementById('lp_fromDept').value     = 'IT';
                document.getElementById('lp_deviceLabel').value  = '1 (satu) Buah Laptop';
                ['Avast Free Antivirus','Google Chrome','Anydesk','Microsoft Edge','Office 365 Business','Tight VNC']
                    .forEach(s => window.addDynRow('lp_softwareList', s));
                ['Charger','Tas'].forEach(a => window.addDynRow('lp_accessoriesList', a));
            }
            openModal('laptopHandoverModal');
        } else {
            document.getElementById('addOnHandoverForm').reset();
            document.getElementById('ao_softwareList').innerHTML = '';
            document.getElementById('ao_accessoriesList').innerHTML = '';

            if (data) {
                document.querySelector('#addOnHandoverModal .modal-header h3').innerHTML =
                    '<i class="fas fa-tablet-alt"></i> Edit Form Serah Terima Add On';
                document.querySelector('#addOnHandoverModal .modal-footer .btn-primary').innerHTML =
                    '<i class="fas fa-save"></i> Simpan Perubahan';
                document.getElementById('ao_date').value         = data.handover_date;
                document.getElementById('ao_deviceLabel').value  = data.device_label || '';
                document.getElementById('ao_fromName').value     = data.from_name || '';
                document.getElementById('ao_fromPosition').value = data.from_position || '';
                document.getElementById('ao_fromDept').value     = data.from_department || 'IT';
                document.getElementById('ao_deptHead').value     = data.dept_head || '';
                document.getElementById('ao_toName').value       = data.to_name || '';
                document.getElementById('ao_toPosition').value   = data.to_position || '';
                document.getElementById('ao_toDept').value       = data.to_department || '';
                document.getElementById('ao_toAddress').value    = data.to_address || '';
                document.getElementById('ao_merek').value        = data.merek || '';
                document.getElementById('ao_type').value         = data.type_device || '';
                document.getElementById('ao_sn').value           = data.serial_number || '';
                document.getElementById('ao_processor').value    = data.processor || '';
                document.getElementById('ao_storage').value      = data.storage || '';
                document.getElementById('ao_ram').value          = data.ram || '';
                document.getElementById('ao_screen').value       = data.screen_size || '';
                (data.software_list || []).forEach(s => window.addDynRow('ao_softwareList', s));
                (data.accessories_list || []).forEach(a => window.addDynRow('ao_accessoriesList', a));
            } else {
                document.querySelector('#addOnHandoverModal .modal-header h3').innerHTML =
                    '<i class="fas fa-tablet-alt"></i> Form Serah Terima Add On';
                document.querySelector('#addOnHandoverModal .modal-footer .btn-primary').innerHTML =
                    '<i class="fas fa-print"></i> Simpan & Cetak';
                document.getElementById('ao_date').value         = today;
                document.getElementById('ao_fromPosition').value = 'IT Generalist';
                document.getElementById('ao_fromDept').value     = 'IT';
                document.getElementById('ao_deviceLabel').value  = '1 (satu) Buah Tablet PC';
                ['Kabel Data','Charger'].forEach(a => window.addDynRow('ao_accessoriesList', a));
            }
            openModal('addOnHandoverModal');
        }
    }

    async function editHandover(id) {
        try {
            const data = await apiGet(`${API}/handovers.php`, { id });
            openHandoverModal(data.type, data);
        } catch (err) {
            showToast('Gagal memuat data: ' + err.message, 'error');
        }
    }

    async function handleHandoverSubmit(e, type) {
        e.preventDefault();
        const p = type === 'laptop' ? 'lp' : 'ao';

        const data = {
            type,
            handoverDate:   document.getElementById(`${p}_date`).value,
            fromName:       document.getElementById(`${p}_fromName`).value.trim(),
            fromPosition:   document.getElementById(`${p}_fromPosition`).value.trim(),
            fromDepartment: document.getElementById(`${p}_fromDept`).value.trim(),
            deptHead:       document.getElementById(`${p}_deptHead`).value.trim(),
            toName:         document.getElementById(`${p}_toName`).value.trim(),
            toPosition:     document.getElementById(`${p}_toPosition`).value.trim(),
            toDepartment:   document.getElementById(`${p}_toDept`).value.trim(),
            toAddress:      document.getElementById(`${p}_toAddress`).value.trim(),
            deviceLabel:    document.getElementById(`${p}_deviceLabel`).value.trim(),
            merek:          document.getElementById(`${p}_merek`).value.trim(),
            typeDevice:     document.getElementById(`${p}_type`).value.trim(),
            serialNumber:   document.getElementById(`${p}_sn`).value.trim(),
            processor:      document.getElementById(`${p}_processor`).value.trim(),
            storage:        document.getElementById(`${p}_storage`).value.trim(),
            ram:            document.getElementById(`${p}_ram`).value.trim(),
            screenSize:     document.getElementById(`${p}_screen`).value.trim(),
            softwareList:    getDynListValues(`${p}_softwareList`),
            accessoriesList: getDynListValues(`${p}_accessoriesList`),
        };

        if (type === 'laptop') {
            data.os      = document.getElementById('lp_os').value.trim();
            data.officeSw = document.getElementById('lp_office').value.trim();
        }

        try {
            const modalId = type === 'laptop' ? 'laptopHandoverModal' : 'addOnHandoverModal';
            if (editingHandoverId) {
                // Edit mode — PUT
                data.id = editingHandoverId;
                await apiPut(`${API}/handovers.php`, data);
                showToast('Dokumen berhasil diperbarui', 'success');
                closeModal(modalId);
                handovers = await apiGet(`${API}/handovers.php`);
                renderHandovers();
            } else {
                // Create mode — POST
                const res = await apiPost(`${API}/handovers.php`, data);
                showToast('Dokumen berhasil disimpan', 'success');
                closeModal(modalId);
                handovers = await apiGet(`${API}/handovers.php`);
                renderHandovers();
                printHandover(res.id);
            }
            editingHandoverId = null;
        } catch (err) {
            showToast('Gagal menyimpan: ' + err.message, 'error');
        }
    }

    async function deleteHandover(id) {
        if (!confirm('Hapus dokumen serah terima ini?')) return;
        try {
            await apiDelete(`${API}/handovers.php`, { id });
            handovers = await apiGet(`${API}/handovers.php`);
            renderHandovers();
            showToast('Dokumen berhasil dihapus', 'success');
        } catch (err) {
            showToast('Gagal: ' + err.message, 'error');
        }
    }

    async function printHandover(id) {
        try {
            const data = await apiGet(`${API}/handovers.php`, { id });
            const html = data.type === 'laptop' ? buildLaptopPrintHTML(data) : buildAddOnPrintHTML(data);
            const win = window.open('', '_blank', 'width=900,height=750');
            win.document.write(html);
            win.document.close();
            win.focus();
            setTimeout(() => win.print(), 700);
        } catch (err) {
            showToast('Gagal membuka print: ' + err.message, 'error');
        }
    }

    function formatDateLong(dateStr) {
        if (!dateStr) return '-';
        const months = ['Januari','Februari','Maret','April','Mei','Juni',
                        'Juli','Agustus','September','Oktober','November','Desember'];
        const d = new Date(dateStr);
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }

    const PRINT_CSS = `
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:'Arial',sans-serif; font-size:11pt; color:#111; background:#fff; }
      .wrap { padding:15mm 20mm; }
      .center { text-align:center; }
      .bold { font-weight:bold; }
      .title { font-size:13pt; font-weight:bold; text-transform:uppercase; text-align:center; margin-bottom:16px; text-decoration:underline; }
      .intro { margin-bottom:10px; font-size:10.5pt; }
      .field-row { display:flex; margin-bottom:4px; font-size:10.5pt; }
      .field-label { min-width:110px; }
      .field-sep { min-width:10px; }
      .field-val { flex:1; }
      .indent { margin-left:30px; }
      .numbered-list { margin-left:30px; margin-bottom:10px; }
      .numbered-list .nitem { margin-bottom:3px; font-size:10.5pt; }
      .spec-table { width:100%; margin:8px 0 14px 40px; font-size:10.5pt; }
      .spec-table td { padding:2px 4px 2px 0; vertical-align:top; }
      .spec-table td:first-child { min-width:22px; }
      .spec-table td:nth-child(2) { min-width:130px; }
      .spec-table td:nth-child(3) { min-width:14px; }
      .sub-list { margin-left:40px; font-size:10.5pt; }
      .sub-list .sitem { margin-bottom:2px; }
      .legal { font-size:10.5pt; margin-bottom:6px; text-align:justify; line-height:1.55; }
      .legal-num { margin-left:30px; margin-bottom:8px; font-size:10.5pt; text-align:justify; line-height:1.55; }
      .closing { font-size:10.5pt; margin-bottom:14px; text-align:justify; }
      .date-line { font-size:10.5pt; margin-bottom:20px; }
      .sig-area { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px; }
      .sig-col { font-size:10.5pt; }
      .sig-col .sig-head { margin-bottom:4px; }
      .sig-col .sig-space { height:60px; }
      .sig-col .sig-row { display:flex; gap:40px; }
      .sig-col .sig-item { text-align:center; min-width:120px; }
      .sig-col .sig-line { border-bottom:1px solid #111; margin-bottom:4px; height:55px; }
      @media print { @page { margin:10mm; } body { font-size:10.5pt; } .wrap { padding:0; } }
    `;

    function buildLaptopPrintHTML(d) {
        const letters = 'abcdefghijklmnopqrstuvwxyz';
        const softwareRows = (d.software_list || []).map((s, i) =>
            `<tr><td>${letters[i]}.</td><td>${s}</td><td></td><td></td></tr>`).join('');
        const accRows = (d.accessories_list || []).map((a, i) =>
            `<tr><td>${letters[i]}.</td><td>${a}</td><td></td><td></td></tr>`).join('');
        const tanggal = formatDateLong(d.handover_date);
        const city = d.to_department.split(' ')[0] || 'Surabaya';

        return `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><title>Serah Terima Laptop - ${d.doc_number}</title>
<style>${PRINT_CSS}</style></head>
<body><div class="wrap">
  <p class="title">SERAH TERIMA FASILITAS PERUSAHAAN</p>

  <p class="intro">Yang bertandatangan dibawah ini :</p>
  <div style="margin-left:20px;margin-bottom:10px;">
    <div class="field-row"><span class="field-label">Nama</span><span class="field-sep">:</span><span class="field-val">${d.from_name}</span></div>
    <div class="field-row"><span class="field-label">Jabatan</span><span class="field-sep">:</span><span class="field-val">${d.from_position}</span></div>
    <div class="field-row"><span class="field-label">Departemen</span><span class="field-sep">:</span><span class="field-val">${d.from_department || 'IT'}</span></div>
  </div>
  <p class="legal" style="margin-left:0;margin-bottom:10px;">Dalam hal ini bertindak untuk dan atas nama PT. Grahadhika Sarana Purnajati sesuai dengan kewenangan jabatannya yang selanjutnya disebut sebagai <strong>Pihak Pertama</strong> atau Yang Menyerahkan</p>

  <div style="margin-left:20px;margin-bottom:10px;">
    <div class="field-row"><span class="field-label">Nama</span><span class="field-sep">:</span><span class="field-val">${d.to_name}</span></div>
    <div class="field-row"><span class="field-label">Jabatan</span><span class="field-sep">:</span><span class="field-val">${d.to_position}</span></div>
    <div class="field-row"><span class="field-label">Departemen</span><span class="field-sep">:</span><span class="field-val">${d.to_department}</span></div>
    ${d.to_address ? `<div class="field-row"><span class="field-label">Alamat</span><span class="field-sep">:</span><span class="field-val">${d.to_address}</span></div>` : ''}
  </div>
  <p class="legal" style="margin-bottom:12px;">Dalam hal ini bertindak untuk dan atas nama dirinya sendiri sesuai dengan jabatan, yang selanjutnya disebut sebagai <strong>Pihak Kedua</strong> atau Yang Menerima.</p>

  <p class="legal" style="margin-bottom:10px;">Bahwa untuk menunjang kinerja dari Pihak Kedua, maka dengan ini Pihak Pertama telah menyerahkan fasilitas perusahaan untuk digunakan oleh Pihak Kedua sesuai dengan data dibawah ini, antara Lain :</p>

  <p class="indent bold" style="margin-bottom:6px;">1. ${d.device_label || '1 (satu) Buah Laptop'}, dengan data spesifikasi sebagai berikut :</p>
  <table class="spec-table">
    <tr><td>a.</td><td>Merek</td><td>:</td><td>${d.merek || '-'}</td></tr>
    <tr><td>b.</td><td>Type</td><td>:</td><td>${d.type_device || '-'}</td></tr>
    <tr><td>c.</td><td>Serial Number</td><td>:</td><td>${d.serial_number || '-'}</td></tr>
    <tr><td>d.</td><td>Processor</td><td>:</td><td>${d.processor || '-'}</td></tr>
    <tr><td>e.</td><td>Storage</td><td>:</td><td>${d.storage || '-'}</td></tr>
    <tr><td>f.</td><td>RAM</td><td>:</td><td>${d.ram || '-'}</td></tr>
    <tr><td>g.</td><td>Ukuran Layar</td><td>:</td><td>${d.screen_size || '-'}</td></tr>
    ${d.os ? `<tr><td>h.</td><td>Sistem Operasi</td><td>:</td><td>${d.os}</td></tr>` : ''}
    ${d.office_sw ? `<tr><td>i.</td><td>Office</td><td>:</td><td>${d.office_sw}</td></tr>` : ''}
  </table>

  <p class="indent bold" style="margin-bottom:4px;">2. Software Terinstall, antara lain :</p>
  ${d.software_list && d.software_list.length > 0
    ? `<table class="spec-table">${softwareRows}</table>`
    : '<p class="sub-list">-</p>'}

  <p class="indent bold" style="margin-bottom:4px;">3. Kelengkapan tambahan, antara lain :</p>
  ${d.accessories_list && d.accessories_list.length > 0
    ? `<table class="spec-table">${accRows}</table>`
    : '<p class="sub-list">-</p>'}

  <p class="legal" style="margin-bottom:10px;">Fasilitas tersebut diserahkan oleh Pihak Pertama kepada Pihak Kedua berkaitan dengan jabatannya sebagai <strong>${d.to_position || d.to_department}</strong>, dengan dilakukannya serah terima ini maka berlaku beberapa hal yang harus diperhatikan, antara lain:</p>

  <div class="legal-num">1. Bahwa Fasilitas perusahaan yang diterima oleh Pihak Kedua tidak diperbolehkan untuk dipindah tangankan dan atau dilakukan pengalihan fasilitas kepada orang lain selain dan tanpa adanya persetujuan atasan dan Persetujuan Pihak Pertama.</div>
  <div class="legal-num">2. Bahwa Pihak Kedua bertanggung jawab secara penuh atas segala resiko yang terjadi dikarenakan timbulnya kerusakan dan atau kehilangan yang diakibatkan dari kelalaian Pihak Kedua yang dilakukan secara sengaja dan atau tidak sengaja selama penggunaan fasilitas tersebut. serta Pihak Kedua berkewajiban menanggung segala kerusakan secara pribadi seusai adanya pengecekan dari Pihak Pertama.</div>
  <div class="legal-num">3. Bahwa Pihak Kedua bersedia dalam berjalannya waktu penggunaan fasilitas perusahaan tersebut, untuk dapat diperiksa dan atau dilakukannya audit terkait dengan isi dan dokumen yang ada dalam fasilitas tersebut.</div>
  <div class="legal-num">4. Bahwa Pihak Kedua bertanggung Jawab secara penuh atas data, isi, konten dan dokumen yang berada didalam fasilitas perusahaan tersebut. Serta Pihak Kedua dilarang keras untuk menggunakan fasilitas perusahaan tersebut diluar kepentingan dan tujuan perusahaan yang dilakukan di dalam jam kerja maupun diluar jam kerja.</div>
  <div class="legal-num" style="margin-bottom:12px;">5. Apabila Pihak Kedua sudah tidak bekerja kembali dan atau mengundurkan diri. maka Pihak Kedua berkewajiban mengembalikan fasiltas perusahaan tersebut dalam keadaan baik sebagaimana mestinya.</div>

  <p class="closing">Demikian serah terima fasilitas perusahaan ini dibuat dan disetujui oleh PARA PIHAK dan menjadi hukum yang dapat dipertanggung jawabkan dikemudian hari.</p>

  <p class="date-line" style="margin-left:40%;">Surabaya, ${tanggal}</p>

  <div class="sig-area">
    <div class="sig-col">
      <div class="sig-head bold">Mengetahui,</div>
      <div class="sig-row" style="margin-top:4px;">
        <div class="sig-item">
          <div class="sig-line"></div>
          <div class="bold">${d.from_name}</div>
          <div>Departemen IT</div>
        </div>
        <div class="sig-item">
          <div class="sig-line"></div>
          <div class="bold">${d.dept_head || '(________________)'}</div>
          <div>Departemen Head</div>
        </div>
      </div>
    </div>
    <div class="sig-col">
      <div class="sig-head bold">Menyetujui,</div>
      <div class="sig-row" style="margin-top:4px;">
        <div class="sig-item">
          <div class="sig-line"></div>
          <div>(________________)</div>
          <div>HRD - Personalia</div>
        </div>
        <div class="sig-item">
          <div class="sig-line"></div>
          <div>(________________)</div>
          <div>Penerima</div>
        </div>
      </div>
    </div>
  </div>
</div></body></html>`;
    }

    function buildAddOnPrintHTML(d) {
        const letters = 'abcdefghijklmnopqrstuvwxyz';
        const softwareRows = (d.software_list || []).map((s, i) =>
            `<tr><td>${letters[i]}.</td><td>${s}</td><td></td><td></td></tr>`).join('');
        const accRows = (d.accessories_list || []).map((a, i) =>
            `<tr><td>${letters[i]}.</td><td>${a}</td><td></td><td></td></tr>`).join('');
        const tanggal = formatDateLong(d.handover_date);

        return `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><title>Serah Terima Add On - ${d.doc_number}</title>
<style>${PRINT_CSS}</style></head>
<body><div class="wrap">
  <p class="title">SERAH TERIMA FASILITAS PERUSAHAAN</p>

  <p class="intro">Yang bertandatangan dibawah ini :</p>
  <div style="margin-left:20px;margin-bottom:10px;">
    <div class="field-row"><span class="field-label">Nama</span><span class="field-sep">:</span><span class="field-val">${d.from_name}</span></div>
    <div class="field-row"><span class="field-label">Jabatan</span><span class="field-sep">:</span><span class="field-val">${d.from_position}</span></div>
    <div class="field-row"><span class="field-label">Departemen</span><span class="field-sep">:</span><span class="field-val">${d.from_department || 'IT'}</span></div>
  </div>
  <p class="legal" style="margin-bottom:10px;">Dalam hal ini bertindak untuk dan atas nama PT. Grahadhika Sarana Purnajati sesuai dengan kewenangan jabatannya yang selanjutnya disebut sebagai <strong>Pihak Pertama</strong> atau Yang Menyerahkan</p>

  <div style="margin-left:20px;margin-bottom:10px;">
    <div class="field-row"><span class="field-label">Nama</span><span class="field-sep">:</span><span class="field-val">${d.to_name}</span></div>
    <div class="field-row"><span class="field-label">Jabatan</span><span class="field-sep">:</span><span class="field-val">${d.to_position}</span></div>
    <div class="field-row"><span class="field-label">Departemen</span><span class="field-sep">:</span><span class="field-val">${d.to_department}</span></div>
    ${d.to_address ? `<div class="field-row"><span class="field-label">Alamat</span><span class="field-sep">:</span><span class="field-val">${d.to_address}</span></div>` : ''}
  </div>
  <p class="legal" style="margin-bottom:12px;">Dalam hal ini bertindak untuk dan atas nama dirinya sendiri sesuai dengan jabatan, yang selanjutnya disebut sebagai <strong>Pihak Kedua</strong> atau Yang Menerima.</p>

  <p class="legal" style="margin-bottom:10px;">Bahwa untuk menunjang kinerja dari Pihak Kedua, maka dengan ini Pihak Pertama telah menyerahkan fasilitas perusahaan untuk digunakan oleh Pihak Kedua sesuai dengan data dibawah ini, antara Lain :</p>

  <p class="indent bold" style="margin-bottom:6px;">1. ${d.device_label || '1 (satu) Buah Perangkat'}, dengan data spesifikasi sebagai berikut :</p>
  <table class="spec-table">
    <tr><td>a.</td><td>Merek</td><td>:</td><td>${d.merek || '-'}</td></tr>
    <tr><td>b.</td><td>Type</td><td>:</td><td>${d.type_device || '-'}</td></tr>
    <tr><td>c.</td><td>Serial Number</td><td>:</td><td>${d.serial_number || '-'}</td></tr>
    ${d.processor && d.processor !== '-' ? `<tr><td>d.</td><td>Processor</td><td>:</td><td>${d.processor}</td></tr>` : ''}
    <tr><td>${d.processor && d.processor !== '-' ? 'e' : 'd'}.</td><td>Storage</td><td>:</td><td>${d.storage || '-'}</td></tr>
    <tr><td>${d.processor && d.processor !== '-' ? 'f' : 'e'}.</td><td>RAM</td><td>:</td><td>${d.ram || '-'}</td></tr>
    <tr><td>${d.processor && d.processor !== '-' ? 'g' : 'f'}.</td><td>Ukuran Layar</td><td>:</td><td>${d.screen_size || '-'}</td></tr>
  </table>

  <p class="indent bold" style="margin-bottom:4px;">2. Software Terinstall, antara lain :</p>
  ${d.software_list && d.software_list.length > 0
    ? `<table class="spec-table">${softwareRows}</table>`
    : '<p class="sub-list">-</p>'}

  <p class="indent bold" style="margin-bottom:4px;">3. Kelengkapan tambahan, antara lain :</p>
  ${d.accessories_list && d.accessories_list.length > 0
    ? `<table class="spec-table">${accRows}</table>`
    : '<p class="sub-list">-</p>'}

  <p class="legal" style="margin-bottom:10px;">Fasilitas tersebut diserahkan oleh Pihak Pertama kepada Pihak Kedua berkaitan dengan jabatannya sebagai <strong>${d.to_position || d.to_department}</strong>, dengan dilakukannya serah terima ini maka berlaku beberapa hal yang harus diperhatikan, antara lain:</p>

  <div class="legal-num">1. Bahwa Fasilitas perusahaan yang diterima oleh Pihak Kedua tidak diperbolehkan untuk dipindah tangankan dan atau dilakukan pengalihan fasilitas kepada orang lain selain dan tanpa adanya persetujuan atasan dan Persetujuan Pihak Pertama.</div>
  <div class="legal-num">2. Bahwa Pihak Kedua bertanggung jawab secara penuh atas segala resiko yang terjadi dikarenakan timbulnya kerusakan dan atau kehilangan yang diakibatkan dari kelalaian Pihak Kedua yang dilakukan secara sengaja dan atau tidak sengaja selama penggunaan fasilitas tersebut. serta Pihak Kedua berkewajiban menanggung segala kerusakan secara pribadi seusai adanya pengecekan dari Pihak Pertama.</div>
  <div class="legal-num">3. Bahwa Pihak Kedua bersedia dalam berjalannya waktu penggunaan fasilitas perusahaan tersebut, untuk dapat diperiksa dan atau dilakukannya audit terkait dengan isi dan dokumen yang ada dalam fasilitas tersebut.</div>
  <div class="legal-num">4. Bahwa Pihak Kedua bertanggung Jawab secara penuh atas data, isi, konten dan dokumen yang berada didalam fasilitas perusahaan tersebut. Serta Pihak Kedua dilarang keras untuk menggunakan fasilitas perusahaan tersebut diluar kepentingan dan tujuan perusahaan yang dilakukan di dalam jam kerja maupun diluar jam kerja.</div>
  <div class="legal-num" style="margin-bottom:12px;">5. Apabila Pihak Kedua sudah tidak bekerja kembali dan atau mengundurkan diri. maka Pihak Kedua berkewajiban mengembalikan fasiltas perusahaan tersebut dalam keadaan baik sebagaimana mestinya.</div>

  <p class="closing">Demikian serah terima fasilitas perusahaan ini dibuat dan disetujui oleh PARA PIHAK dan menjadi hukum yang dapat dipertanggung jawabkan dikemudian hari.</p>

  <p class="date-line" style="margin-left:40%;">Surabaya, ${tanggal}</p>

  <div class="sig-area">
    <div class="sig-col">
      <div class="sig-head bold">Mengetahui,</div>
      <div class="sig-row" style="margin-top:4px;">
        <div class="sig-item">
          <div class="sig-line"></div>
          <div class="bold">${d.from_name}</div>
          <div>Departemen IT</div>
        </div>
        <div class="sig-item">
          <div class="sig-line"></div>
          <div class="bold">${d.dept_head || '(________________)'}</div>
          <div>Departemen Head</div>
        </div>
      </div>
    </div>
    <div class="sig-col">
      <div class="sig-head bold">Menyetujui,</div>
      <div class="sig-row" style="margin-top:4px;">
        <div class="sig-item">
          <div class="sig-line"></div>
          <div>(________________)</div>
          <div>HRD - Personalia</div>
        </div>
        <div class="sig-item">
          <div class="sig-line"></div>
          <div>(________________)</div>
          <div>Penerima</div>
        </div>
      </div>
    </div>
  </div>
</div></body></html>`;
    }

    function renderHandovers() {
        renderHandoverTable('laptop', 'laptopHandoverBody');
        renderHandoverTable('add_on', 'addOnHandoverBody');
    }

    function renderHandoverTable(type, tbodyId) {
        const filtered = handovers.filter(h => h.type === type);
        const tbody = document.getElementById(tbodyId);
        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="empty-state">Belum ada dokumen</td></tr>`;
            return;
        }
        tbody.innerHTML = filtered.map((h, idx) => `
            <tr>
                <td>${idx + 1}</td>
                <td><strong>${escapeHtml(h.doc_number)}</strong></td>
                <td>${formatDate(h.handover_date)}</td>
                <td>${escapeHtml(h.from_name)}</td>
                <td>${escapeHtml(h.to_name)}</td>
                <td>${escapeHtml(h.to_department)}</td>
                <td>${escapeHtml(h.merek || '')}${h.type_device ? ' ' + escapeHtml(h.type_device) : ''}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon view" title="Cetak" onclick="window.appActions.printHandover(${h.id})">
                            <i class="fas fa-print"></i>
                        </button>
                        <button class="btn-icon delete" title="Hapus" onclick="window.appActions.deleteHandover(${h.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>`).join('');
    }

    // ====== Global Action Handlers (for inline onclick) ======
    window.appActions = {
        viewAsset: showAssetDetail,
        editAsset: (id) => {
            const asset = assets.find(a => a.id === id);
            if (asset) openAssetModal(asset);
        },
        deleteAsset: deleteAsset,
        returnAsset: returnAsset,
        deleteLending: deleteLending,
        printHandover: printHandover,
        deleteHandover: deleteHandover,
        closeHandoverModal: (id) => closeModal(id),
    };

    // ====== Start ======
    document.addEventListener('DOMContentLoaded', init);
})();
