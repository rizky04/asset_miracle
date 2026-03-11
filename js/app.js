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
        renderDashboard();
        renderAssets();
        renderLendings();
        renderReports();
    }

    // ====== Data Loading ======
    async function loadData() {
        try {
            [assets, lendings] = await Promise.all([
                apiGet(`${API}/assets.php`),
                apiGet(`${API}/lendings.php`),
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
    };

    // ====== Start ======
    document.addEventListener('DOMContentLoaded', init);
})();
