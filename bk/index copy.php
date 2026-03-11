<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IT Asset Management - MIRACLE CLINIC</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
</head>
<body>
    <!-- Sidebar -->
    <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
            <div class="logo">
                <i class="fas fa-server"></i>
                <span>IT Asset</span>
            </div>
            <button class="sidebar-toggle" id="sidebarToggle">
                <i class="fas fa-bars"></i>
            </button>
        </div>
        <nav class="sidebar-nav">
            <a href="#" class="nav-item active" data-page="dashboard">
                <i class="fas fa-chart-pie"></i>
                <span>Dashboard</span>
            </a>
            <a href="#" class="nav-item" data-page="assets">
                <i class="fas fa-boxes-stacked"></i>
                <span>Data Aset</span>
            </a>
            <a href="#" class="nav-item" data-page="lending">
                <i class="fas fa-hand-holding"></i>
                <span>Peminjaman</span>
            </a>
            <a href="#" class="nav-item" data-page="reports">
                <i class="fas fa-file-alt"></i>
                <span>Laporan</span>
            </a>
        </nav>
        <div class="sidebar-footer">
            <div class="user-info">
                <i class="fas fa-user-circle"></i>
                <span>Admin IT</span>
            </div>
        </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content" id="mainContent">
        <!-- Top Bar -->
        <header class="topbar">
            <button class="mobile-toggle" id="mobileToggle">
                <i class="fas fa-bars"></i>
            </button>
            <h1 class="page-title" id="pageTitle">Dashboard</h1>
            <div class="topbar-right">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input type="text" placeholder="Cari aset..." id="globalSearch">
                </div>
            </div>
        </header>

        <!-- Dashboard Page -->
        <section class="page active" id="page-dashboard">
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon bg-blue"><i class="fas fa-boxes-stacked"></i></div>
                    <div class="stat-info">
                        <span class="stat-number" id="totalAssets">0</span>
                        <span class="stat-label">Total Aset</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon bg-green"><i class="fas fa-check-circle"></i></div>
                    <div class="stat-info">
                        <span class="stat-number" id="goodAssets">0</span>
                        <span class="stat-label">Kondisi Baik</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon bg-red"><i class="fas fa-times-circle"></i></div>
                    <div class="stat-info">
                        <span class="stat-number" id="brokenAssets">0</span>
                        <span class="stat-label">Rusak</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon bg-orange"><i class="fas fa-hand-holding"></i></div>
                    <div class="stat-info">
                        <span class="stat-number" id="lentAssets">0</span>
                        <span class="stat-label">Dipinjam</span>
                    </div>
                </div>
            </div>

            <div class="dashboard-grid">
                <div class="card">
                    <div class="card-header">
                        <h3><i class="fas fa-chart-bar"></i> Aset per Kategori</h3>
                    </div>
                    <div class="card-body">
                        <div class="chart-container" id="categoryChart"></div>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <h3><i class="fas fa-chart-pie"></i> Kondisi Aset</h3>
                    </div>
                    <div class="card-body">
                        <div class="condition-summary" id="conditionSummary"></div>
                    </div>
                </div>
                <div class="card full-width">
                    <div class="card-header">
                        <h3><i class="fas fa-clock"></i> Peminjaman Aktif</h3>
                    </div>
                    <div class="card-body">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Aset</th>
                                    <th>Peminjam</th>
                                    <th>Tanggal Pinjam</th>
                                    <th>Batas Kembali</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody id="activeLendingTable">
                                <tr><td colspan="5" class="empty-state">Tidak ada peminjaman aktif</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>

        <!-- Assets Page -->
        <section class="page" id="page-assets">
            <div class="page-actions">
                <div class="filter-group">
                    <select id="filterCategory" class="filter-select">
                        <option value="">Semua Kategori</option>
                    </select>
                    <select id="filterCondition" class="filter-select">
                        <option value="">Semua Kondisi</option>
                        <option value="good">Baik</option>
                        <option value="broken">Rusak</option>
                    </select>
                    <select id="filterPIC" class="filter-select">
                        <option value="">Semua PIC</option>
                    </select>
                </div>
                <button class="btn btn-primary" id="btnAddAsset">
                    <i class="fas fa-plus"></i> Tambah Aset
                </button>
            </div>
            <div class="card">
                <div class="card-body no-padding">
                    <div class="table-responsive">
                        <table class="data-table" id="assetsTable">
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Kategori</th>
                                    <th>Nama Barang</th>
                                    <th>Kode</th>
                                    <th>Merek</th>
                                    <th>Kondisi</th>
                                    <th>PIC</th>
                                    <th>Status</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody id="assetsTableBody"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>

        <!-- Lending Page -->
        <section class="page" id="page-lending">
            <div class="page-actions">
                <div class="filter-group">
                    <select id="filterLendingStatus" class="filter-select">
                        <option value="">Semua Status</option>
                        <option value="active">Sedang Dipinjam</option>
                        <option value="returned">Sudah Dikembalikan</option>
                        <option value="overdue">Terlambat</option>
                    </select>
                </div>
                <button class="btn btn-primary" id="btnAddLending">
                    <i class="fas fa-plus"></i> Pinjam Aset
                </button>
            </div>
            <div class="card">
                <div class="card-body no-padding">
                    <div class="table-responsive">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Aset</th>
                                    <th>Peminjam</th>
                                    <th>Departemen</th>
                                    <th>Tgl Pinjam</th>
                                    <th>Batas Kembali</th>
                                    <th>Tgl Kembali</th>
                                    <th>Status</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody id="lendingTableBody"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>

        <!-- Reports Page -->
        <section class="page" id="page-reports">
            <div class="page-actions">
                <button class="btn btn-primary" id="btnExportCSV">
                    <i class="fas fa-file-csv"></i> Export CSV
                </button>
                <button class="btn btn-secondary" id="btnPrint">
                    <i class="fas fa-print"></i> Cetak
                </button>
            </div>
            <div class="reports-grid">
                <div class="card">
                    <div class="card-header">
                        <h3><i class="fas fa-list"></i> Ringkasan Aset per Kategori</h3>
                    </div>
                    <div class="card-body">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Kategori</th>
                                    <th>Total</th>
                                    <th>Baik</th>
                                    <th>Rusak</th>
                                    <th>Dijual</th>
                                    <th>Usang</th>
                                </tr>
                            </thead>
                            <tbody id="reportCategoryBody"></tbody>
                        </table>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <h3><i class="fas fa-users"></i> Aset per PIC</h3>
                    </div>
                    <div class="card-body">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>PIC</th>
                                    <th>Total Aset</th>
                                    <th>Baik</th>
                                    <th>Rusak</th>
                                </tr>
                            </thead>
                            <tbody id="reportPICBody"></tbody>
                        </table>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <h3><i class="fas fa-history"></i> Riwayat Peminjaman</h3>
                    </div>
                    <div class="card-body">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Aset</th>
                                    <th>Peminjam</th>
                                    <th>Tgl Pinjam</th>
                                    <th>Tgl Kembali</th>
                                    <th>Durasi</th>
                                </tr>
                            </thead>
                            <tbody id="reportLendingBody"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <!-- Modal: Add/Edit Asset -->
    <div class="modal-overlay" id="assetModal">
        <div class="modal">
            <div class="modal-header">
                <h3 id="assetModalTitle">Tambah Aset</h3>
                <button class="modal-close" id="closeAssetModal">&times;</button>
            </div>
            <form id="assetForm">
                <div class="modal-body">
                    <input type="hidden" id="assetId">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Kategori *</label>
                            <select id="assetCategory" required>
                                <option value="">Pilih Kategori</option>
                                <option value="Meja">Meja</option>
                                <option value="Kursi">Kursi</option>
                                <option value="Laptop">Laptop</option>
                                <option value="Monitor">Monitor</option>
                                <option value="CPU">CPU</option>
                                <option value="UPS">UPS</option>
                                <option value="Server">Server</option>
                                <option value="Switch">Switch</option>
                                <option value="Router">Router</option>
                                <option value="Printer">Printer</option>
                                <option value="Projector">Projector</option>
                                <option value="AC">AC</option>
                                <option value="TV">TV</option>
                                <option value="Lemari">Lemari</option>
                                <option value="Rak">Rak</option>
                                <option value="Papan Tulis">Papan Tulis</option>
                                <option value="Harddisk">Harddisk</option>
                                <option value="Access Point">Access Point</option>
                                <option value="Lainnya">Lainnya</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Nama / Jenis Barang *</label>
                            <input type="text" id="assetName" required placeholder="Contoh: Laptop Lenovo Thinkpad">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Kode Aset</label>
                            <input type="text" id="assetCode" placeholder="Contoh: L-07">
                        </div>
                        <div class="form-group">
                            <label>Merek</label>
                            <input type="text" id="assetBrand" placeholder="Contoh: Lenovo">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Bahan</label>
                            <select id="assetMaterial">
                                <option value="">Pilih Bahan</option>
                                <option value="Kayu">Kayu</option>
                                <option value="Besi">Besi</option>
                                <option value="Plastik">Plastik</option>
                                <option value="Kaca">Kaca</option>
                                <option value="Lainnya">Lainnya</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Jumlah</label>
                            <input type="number" id="assetQty" value="1" min="1">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Kondisi</label>
                            <select id="assetCondition">
                                <option value="good">Baik</option>
                                <option value="broken">Rusak</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>PIC *</label>
                            <input type="text" id="assetPIC" required placeholder="Nama penanggung jawab">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group checkbox-group">
                            <label><input type="checkbox" id="assetForSale"> Dijual</label>
                        </div>
                        <div class="form-group checkbox-group">
                            <label><input type="checkbox" id="assetObsolete"> Usang</label>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="cancelAssetModal">Batal</button>
                    <button type="submit" class="btn btn-primary">Simpan</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal: Add Lending -->
    <div class="modal-overlay" id="lendingModal">
        <div class="modal">
            <div class="modal-header">
                <h3 id="lendingModalTitle">Pinjam Aset</h3>
                <button class="modal-close" id="closeLendingModal">&times;</button>
            </div>
            <form id="lendingForm">
                <div class="modal-body">
                    <input type="hidden" id="lendingId">
                    <div class="form-group">
                        <label>Pilih Aset *</label>
                        <select id="lendingAsset" required>
                            <option value="">Pilih Aset</option>
                        </select>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Nama Peminjam *</label>
                            <input type="text" id="lendingBorrower" required placeholder="Nama peminjam">
                        </div>
                        <div class="form-group">
                            <label>Departemen *</label>
                            <input type="text" id="lendingDept" required placeholder="Departemen">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Tanggal Pinjam *</label>
                            <input type="date" id="lendingDate" required>
                        </div>
                        <div class="form-group">
                            <label>Batas Pengembalian *</label>
                            <input type="date" id="lendingDue" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Keterangan</label>
                        <textarea id="lendingNotes" rows="3" placeholder="Keperluan peminjaman..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="cancelLendingModal">Batal</button>
                    <button type="submit" class="btn btn-primary">Simpan</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal: Asset Detail -->
    <div class="modal-overlay" id="detailModal">
        <div class="modal">
            <div class="modal-header">
                <h3>Detail Aset</h3>
                <button class="modal-close" id="closeDetailModal">&times;</button>
            </div>
            <div class="modal-body" id="detailContent"></div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" id="cancelDetailModal">Tutup</button>
            </div>
        </div>
    </div>

    <!-- Toast Notification -->
    <div class="toast-container" id="toastContainer"></div>

    <script src="js/app.js"></script>
</body>
</html>
