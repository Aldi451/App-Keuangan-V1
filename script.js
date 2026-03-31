let user = JSON.parse(localStorage.getItem("user"));

if (!user) {
    window.location.href = "index.html";
}

const supabaseUrl = "https://rnllunfxsidqbjtojbjc.supabase.co";
const supabaseKey = "sb_publishable_xKbmQSrlq3nEhcGTvNy4Ng_OGYh8_it";
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// ==================== GLOBAL VARIABLES ====================
let chart = null;
let chartKategori = null;
let chartTrend = null;
let editId = null;
let dbCategories = [];
let comparisonData = null;
let showMonthlyComparison = true;
let showYearlyComparison = true;

// ==================== FORMAT FUNCTIONS ====================
function formatRupiah(angka) {
    if (angka === null || angka === undefined) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(angka);
}

function formatTanggal(tanggal) {
    if (!tanggal) return '-';
    const date = new Date(tanggal);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

function parseCurrencyInput(value) {
    const cleaned = value.toString().replace(/[^0-9]/g, '');
    return parseInt(cleaned) || 0;
}

// ==================== ANIMATION & AUTO-SIZE ====================
function adjustBalanceFontSize(element) {
    if (!element) return;
    const text = element.innerText;
    const textLength = text.length;
    
    element.style.fontSize = '';
    element.style.whiteSpace = 'nowrap';
    
    let fontSize = 20;
    
    if (textLength > 18) {
        fontSize = 14;
    } else if (textLength > 15) {
        fontSize = 16;
    } else if (textLength > 12) {
        fontSize = 18;
    } else {
        fontSize = 20;
    }
    
    if (window.innerWidth <= 576) {
        if (textLength > 16) {
            fontSize = 12;
        } else if (textLength > 13) {
            fontSize = 14;
        } else {
            fontSize = 16;
        }
    }
    
    element.style.fontSize = fontSize + 'px';
    element.style.lineHeight = '1.2';
}

function adjustAllBalanceCards() {
    const balanceElements = document.querySelectorAll('.balance-card h3');
    balanceElements.forEach(el => adjustBalanceFontSize(el));
}

// ==================== DEFAULT SETTINGS ====================
function setDefaultTanggal() {
    document.getElementById("tanggal").value = new Date().toISOString().split('T')[0];
}

function setDefaultPeriode() {
    const today = new Date();
    document.getElementById("filterBulan").value = String(today.getMonth() + 1).padStart(2, '0');
    document.getElementById("filterTahun").value = today.getFullYear();
}

function initYearDropdown() {
    const yearSelect = document.getElementById("filterTahun");
    if (!yearSelect) return;
    
    const currentYear = new Date().getFullYear();
    yearSelect.innerHTML = '';
    
    for (let year = currentYear - 5; year <= currentYear + 1; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.innerText = year;
        if (year === currentYear) option.selected = true;
        yearSelect.appendChild(option);
    }
}

function resetForm() {
    editId = null;
    document.getElementById("kategori").value = "";
    document.getElementById("jumlah").value = "";
    document.getElementById("keterangan").value = "";
    document.getElementById("btnSimpan").innerHTML = '<i class="bi bi-save"></i> Simpan';
    setDefaultTanggal();
}

// ==================== CATEGORY FUNCTIONS ====================
async function fetchCategoriesFromDB() {
    try {
        let { data, error } = await supabaseClient
            .from("kategori")
            .select("nama_kategori")
            .order("nama_kategori", { ascending: true });
            
        if (error) {
            data = [
                { nama_kategori: 'Makanan' }, { nama_kategori: 'Transportasi' },
                { nama_kategori: 'Belanja' }, { nama_kategori: 'Kesehatan' },
                { nama_kategori: 'Pendidikan' }, { nama_kategori: 'Hiburan' },
                { nama_kategori: 'Tagihan' }, { nama_kategori: 'Payroll' },
                { nama_kategori: 'Bonus tahunan' }, { nama_kategori: 'Investasi' },
                { nama_kategori: 'Tarik tunai' }, { nama_kategori: 'Fee bank' },
                { nama_kategori: 'Balancing' }, { nama_kategori: 'Top up' },
                { nama_kategori: 'Bank transfer' }, { nama_kategori: 'Lain-lain' }
            ];
        }
        
        dbCategories = data.map(row => row.nama_kategori).filter(n => n);
        updateDatalist();
    } catch (err) {
        dbCategories = ['Makanan', 'Transportasi', 'Belanja', 'Kesehatan', 'Pendidikan', 'Hiburan', 'Tagihan', 'Payroll', 'Bonus tahunan', 'Investasi','Tarik tunai', 'Fee bank', 'Balancing','Top up', 'Bank transfer', 'Lain-lain'];
        updateDatalist();
    }
}

function initCategoryLookup() {
    const suggestions = document.getElementById('kategoriSuggestions');
    const input = document.getElementById('kategori');
    
    fetchCategoriesFromDB();
    
    input.addEventListener('input', function() {
        const value = this.value.toLowerCase().trim();
        if (!value) {
            suggestions.classList.remove('show');
            return;
        }
        
        const matches = dbCategories.filter(cat => 
            cat.toLowerCase().includes(value) && cat.toLowerCase() !== value
        );
        
        if (matches.length > 0) {
            suggestions.innerHTML = matches.map(cat => 
                `<div onclick="selectCategory('${cat.replace(/'/g, "\\'")}')">${cat}</div>`
            ).join('');
            
            if (!dbCategories.some(c => c.toLowerCase() === value)) {
                suggestions.innerHTML += `<div class="add-new" onclick="addNewCategory('${value}')">+ Tambahkan "${input.value}"</div>`;
            }
            suggestions.classList.add('show');
        } else {
            suggestions.innerHTML = `<div class="add-new" onclick="addNewCategory('${value}')">+ Tambahkan "${input.value}"</div>`;
            suggestions.classList.add('show');
        }
    });
    
    input.addEventListener('blur', () => setTimeout(() => suggestions.classList.remove('show'), 200));
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') suggestions.classList.remove('show'); });
}

function updateDatalist() {
    const datalist = document.getElementById('kategoriList');
    if (!datalist) return;
    datalist.innerHTML = dbCategories.sort().map(cat => `<option value="${cat.replace(/"/g, '&quot;')}">`).join('');
}

function selectCategory(category) {
    document.getElementById('kategori').value = category;
    document.getElementById('kategoriSuggestions').classList.remove('show');
}

async function addNewCategory(category) {
    if (!category || !category.trim()) return;
    const categoryName = category.trim();
    
    if (dbCategories.includes(categoryName)) {
        document.getElementById('kategori').value = categoryName;
        document.getElementById('kategoriSuggestions').classList.remove('show');
        return;
    }
    
    try {
        const { error } = await supabaseClient.from("kategori").insert([{ nama_kategori: categoryName }]);
        if (error) {
            dbCategories.push(categoryName);
            dbCategories.sort();
            updateDatalist();
        } else {
            await fetchCategoriesFromDB();
        }
        document.getElementById('kategori').value = categoryName;
        document.getElementById('kategoriSuggestions').classList.remove('show');
    } catch (err) {
        dbCategories.push(categoryName);
        dbCategories.sort();
        updateDatalist();
        document.getElementById('kategori').value = categoryName;
        document.getElementById('kategoriSuggestions').classList.remove('show');
    }
}

// ==================== CURRENCY INPUT HANDLER ====================
function initCurrencyInput() {
    const input = document.getElementById('jumlah');
    if (!input) return;

    input.addEventListener('input', function() {
        let value = this.value.replace(/[^0-9]/g, '');
        if (value) {
            this.value = new Intl.NumberFormat('id-ID').format(parseInt(value));
        } else {
            this.value = '';
        }
    });

    input.addEventListener('blur', function() {
        if (this.value) {
            const num = parseInt(this.value.replace(/[^0-9]/g, ''));
            this.value = new Intl.NumberFormat('id-ID').format(num);
        }
    });

    input.addEventListener('focus', function() {
        if (this.value) this.value = this.value.replace(/[^0-9]/g, '');
    });
}

// ==================== LOAD & RENDER DATA ====================
async function loadData() {
    const container = document.getElementById("tableBody");
    if (!container) return;
    
    container.innerHTML = `<tr><td colspan="7" class="text-center py-4"><div class="spinner-border text-primary" role="status"></div><br><span class="mt-2 d-inline-block">Memuat data...</span></td></tr>`;
    
    const filterBulan = document.getElementById("filterBulan").value;
    const filterTahun = document.getElementById("filterTahun").value;
    
    try {
        let queryMasuk = supabaseClient.from("transaksi").select("jumlah").eq("jenis", "Masuk");
        let queryKeluar = supabaseClient.from("transaksi").select("jumlah").eq("jenis", "Keluar");
        let queryTabel = supabaseClient.from("transaksi").select("*").order("tanggal", { ascending: false });
        
        if (filterTahun) {
            const startDate = `${filterTahun}-01-01`;
            const endDate = `${filterTahun}-12-31`;
            
            if (filterBulan) {
                const daysInMonth = new Date(filterTahun, filterBulan, 0).getDate();
                const startM = `${filterTahun}-${filterBulan}-01`;
                const endM = `${filterTahun}-${filterBulan}-${daysInMonth}`;
                
                queryMasuk = queryMasuk.gte("tanggal", startM).lte("tanggal", endM);
                queryKeluar = queryKeluar.gte("tanggal", startM).lte("tanggal", endM);
                queryTabel = queryTabel.gte("tanggal", startM).lte("tanggal", endM);
                
                let queryOpening = supabaseClient.from("transaksi").select("jumlah, jenis").lt("tanggal", startM);
                const { data: dataOpening } = await queryOpening;
                let openBal = 0;
                if (dataOpening) {
                    dataOpening.forEach(t => {
                        if (t.jenis === 'Masuk') openBal += t.jumlah;
                        else openBal -= t.jumlah;
                    });
                }
                const openEl = document.getElementById("openingBalance");
                if (openEl) {
                    openEl.innerText = formatRupiah(openBal);
                    adjustBalanceFontSize(openEl);
                }
            } else {
                queryMasuk = queryMasuk.gte("tanggal", startDate).lte("tanggal", endDate);
                queryKeluar = queryKeluar.gte("tanggal", startDate).lte("tanggal", endDate);
                queryTabel = queryTabel.gte("tanggal", startDate).lte("tanggal", endDate);
                
                let queryOpening = supabaseClient.from("transaksi").select("jumlah, jenis").lt("tanggal", startDate);
                const { data: dataOpening } = await queryOpening;
                let openBal = 0;
                if (dataOpening) {
                    dataOpening.forEach(t => {
                        if (t.jenis === 'Masuk') openBal += t.jumlah;
                        else openBal -= t.jumlah;
                    });
                }
                const openEl = document.getElementById("openingBalance");
                if (openEl) {
                    openEl.innerText = formatRupiah(openBal);
                    adjustBalanceFontSize(openEl);
                }
            }
        }
        
        const [resMasuk, resKeluar, resTabel] = await Promise.all([queryMasuk, queryKeluar, queryTabel]);
        
        const totalM = resMasuk.data?.reduce((sum, item) => sum + item.jumlah, 0) || 0;
        const totalK = resKeluar.data?.reduce((sum, item) => sum + item.jumlah, 0) || 0;
        
        const mEl = document.getElementById("totalMasuk");
        const kEl = document.getElementById("totalKeluar");
        const eEl = document.getElementById("endingBalance");
        
        if (mEl) { mEl.innerText = formatRupiah(totalM); adjustBalanceFontSize(mEl); }
        if (kEl) { kEl.innerText = formatRupiah(totalK); adjustBalanceFontSize(kEl); }
        
        const openEl = document.getElementById("openingBalance");
        const openingVal = openEl ? parseCurrencyInput(openEl.innerText) : 0;
        const endingVal = openingVal + totalM - totalK;
        
        if (eEl) { eEl.innerText = formatRupiah(endingVal); adjustBalanceFontSize(eEl); }
        
        container.innerHTML = "";
        if (!resTabel.data || resTabel.data.length === 0) {
            container.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">Tidak ada data untuk periode ini</td></tr>`;
        } else {
            resTabel.data.forEach((item, index) => {
                const tr = document.createElement("tr");
                tr.className = "animate-fade-in";
                tr.style.animationDelay = `${index * 0.05}s`;
                tr.innerHTML = `
                    <td class="text-center">${index + 1}</td>
                    <td>${formatTanggal(item.tanggal)}</td>
                    <td><span class="badge ${item.jenis === 'Masuk' ? 'bg-success' : 'bg-danger'}">${item.jenis}</span></td>
                    <td>${item.kategori}</td>
                    <td class="text-end fw-bold ${item.jenis === 'Masuk' ? 'text-success' : 'text-danger'}">${formatRupiah(item.jumlah)}</td>
                    <td>${item.keterangan || '-'}</td>
                    <td class="text-center">
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-warning" onclick="editData('${item.id}', '${item.tanggal}', '${item.jenis}', '${item.kategori.replace(/'/g, "\\'")}', ${item.jumlah}, '${(item.keterangan || '').replace(/'/g, "\\'")}')">
                                <i class="bi bi-pencil-square"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="hapus('${item.id}')">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                `;
                container.appendChild(tr);
            });
        }
        
        renderChart(totalM, totalK);
        renderKategoriChart(resTabel.data || []);
        
        if (filterTahun) {
            await loadComparisonData(filterTahun, filterBulan);
        }
        
    } catch (err) {
        alert("Gagal memuat data: " + err.message);
    }
}

// ==================== SAVE & ACTION FUNCTIONS ====================
async function simpan() {
    const tanggal = document.getElementById("tanggal").value;
    const jenis = document.getElementById("jenis").value;
    const kategori = document.getElementById("kategori").value.trim();
    const jumlahInput = document.getElementById("jumlah").value;
    const keterangan = document.getElementById("keterangan").value.trim();
    
    const jumlah = parseCurrencyInput(jumlahInput);
    
    if (!tanggal || !kategori || !jumlah) {
        alert("Harap isi Tanggal, Kategori, dan Jumlah!");
        return;
    }
    
    const btnSimpan = document.getElementById("btnSimpan");
    btnSimpan.disabled = true;
    btnSimpan.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Menyimpan...';
    
    try {
        if (!dbCategories.includes(kategori)) {
            await addNewCategory(kategori);
        }
        
        let error;
        if (editId) {
            const { error: err } = await supabaseClient.from("transaksi").update({ tanggal, jenis, kategori, jumlah, keterangan }).eq("id", editId);
            error = err;
        } else {
            const { error: err } = await supabaseClient.from("transaksi").insert([{ tanggal, jenis, kategori, jumlah, keterangan }]);
            error = err;
        }
        
        if (error) throw error;
        
        alert(editId ? "Data berhasil diperbarui!" : "Data berhasil disimpan!");
        resetForm();
        loadData();
    } catch (err) {
        alert("Gagal menyimpan data: " + err.message);
    } finally {
        btnSimpan.disabled = false;
        btnSimpan.innerHTML = editId ? '<i class="bi bi-pencil-square"></i> Perbarui' : '<i class="bi bi-save"></i> Simpan';
    }
}

function editData(id, tanggal, jenis, kategori, jumlah, keterangan) {
    editId = id;
    document.getElementById("tanggal").value = tanggal;
    document.getElementById("jenis").value = jenis;
    document.getElementById("kategori").value = kategori;
    document.getElementById("jumlah").value = new Intl.NumberFormat('id-ID').format(jumlah);
    document.getElementById("keterangan").value = keterangan === 'null' ? '' : keterangan;
    
    document.getElementById("btnSimpan").innerHTML = '<i class="bi bi-pencil-square"></i> Perbarui';
    document.querySelector('.card-header.bg-primary').scrollIntoView({ behavior: 'smooth' });
}

async function hapus(id) {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;
    
    try {
        const { error } = await supabaseClient.from("transaksi").delete().eq("id", id);
        if (error) throw error;
        
        alert("Data berhasil dihapus!");
        loadData();
    } catch (err) {
        alert("Gagal menghapus data: " + err.message);
    }
}

// ==================== CHART RENDERING ====================
function renderChart(masuk, keluar) {
    const ctx = document.getElementById('myChart');
    if (!ctx) return;
    
    if (chart) chart.destroy();
    
    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pemasukan', 'Pengeluaran'],
            datasets: [{
                data: [masuk, keluar],
                backgroundColor: ['#198754', '#dc3545'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 12, padding: 15 } },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ` ${context.label}: ${formatRupiah(context.raw)}`;
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });
}

function renderKategoriChart(data) {
    const ctx = document.getElementById('chartKategori');
    if (!ctx) return;
    
    if (chartKategori) chartKategori.destroy();
    
    const pengeluaran = data.filter(item => item.jenis === 'Keluar');
    const kategoriMap = {};
    
    pengeluaran.forEach(item => {
        kategoriMap[item.kategori] = (kategoriMap[item.kategori] || 0) + item.jumlah;
    });
    
    const labels = Object.keys(kategoriMap);
    const values = Object.values(kategoriMap);
    
    const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', 
        '#FF9F40', '#8AC249', '#00BCD4', '#E91E63', '#9C27B0'
    ];
    
    chartKategori = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Pengeluaran per Kategori',
                data: values,
                backgroundColor: labels.map((_, i) => colors[i % colors.length]),
                borderRadius: 5
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) { return ` Total: ${formatRupiah(context.raw)}`; }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) { return 'Rp ' + value.toLocaleString('id-ID'); }
                    }
                }
            }
        }
    });
}

// ==================== COMPARISON & MORE ====================
async function loadComparisonData(tahun, bulan) {
    try {
        const { data } = await supabaseClient
            .from("transaksi")
            .select("jumlah, jenis, tanggal")
            .gte("tanggal", `${tahun - 1}-01-01`)
            .lte("tanggal", `${tahun}-12-31`);
            
        comparisonData = data || [];
        renderTrendChart(tahun);
    } catch (err) {
        console.error("Gagal memuat data pembanding:", err);
    }
}

function renderTrendChart(activeYear) {
    const ctx = document.getElementById('chartTrend');
    if (!ctx || !comparisonData) return;
    
    if (chartTrend) chartTrend.destroy();
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const currentYearData = new Array(12).fill(0);
    const lastYearData = new Array(12).fill(0);
    
    comparisonData.forEach(item => {
        const date = new Date(item.tanggal);
        const y = date.getFullYear();
        const m = date.getMonth();
        
        if (item.jenis === 'Keluar') {
            if (y === parseInt(activeYear)) currentYearData[m] += item.jumlah;
            else if (y === parseInt(activeYear) - 1) lastYearData[m] += item.jumlah;
        }
    });
    
    chartTrend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: `Pengeluaran ${activeYear}`,
                    data: currentYearData,
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: `Pengeluaran ${activeYear - 1}`,
                    borderColor: '#6c757d',
                    data: lastYearData,
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) { return ` ${context.dataset.label}: ${formatRupiah(context.raw)}`; }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: function(value) { return 'Rp ' + value.toLocaleString('id-ID'); } }
                }
            }
        }
    });
}

function toggleSection(sectionId, btn) {
    const sections = ['sectionGrafik', 'sectionSummary', 'sectionTransaksi', 'sectionPembanding'];
    sections.forEach(s => {
        const el = document.getElementById(s);
        if (el) el.classList.add('d-none');
    });
    
    const target = document.getElementById(sectionId);
    if (target) target.classList.remove('d-none');
    
    document.querySelectorAll('.btn-action').forEach(b => {
        b.classList.remove('btn-primary', 'btn-info', 'btn-success', 'btn-warning', 'btn-secondary', 'btn-dark', 'btn-outline-dark');
        b.classList.add('btn-outline-secondary');
    });
    
    if (sectionId === 'sectionGrafik') btn.classList.add('btn-primary');
    else if (sectionId === 'sectionSummary') btn.classList.add('btn-info');
    else if (sectionId === 'sectionTransaksi') btn.classList.add('btn-success');
    else if (sectionId === 'sectionPembanding') btn.classList.add('btn-warning');
}

// ==================== EXPORT & BACKUP ====================
async function exportExcel() {
    const filterBulan = document.getElementById("filterBulan").value;
    const filterTahun = document.getElementById("filterTahun").value;
    
    try {
        let query = supabaseClient.from("transaksi").select("*").order("tanggal", { ascending: false });
        if (filterTahun) {
            const startDate = `${filterTahun}-01-01`;
            const endDate = `${filterTahun}-12-31`;
            if (filterBulan) {
                const daysInMonth = new Date(filterTahun, filterBulan, 0).getDate();
                query = query.gte("tanggal", `${filterTahun}-${filterBulan}-01`).lte("tanggal", `${filterTahun}-${filterBulan}-${daysInMonth}`);
            } else {
                query = query.gte("tanggal", startDate).lte("tanggal", endDate);
            }
        }
        
        const { data } = await query;
        if (!data || data.length === 0) { alert("Tidak ada data untuk diexport!"); return; }
        
        const worksheetData = data.map((item, idx) => ({
            "No": idx + 1,
            "Tanggal": formatTanggal(item.tanggal),
            "Jenis": item.jenis,
            "Kategori": item.kategori,
            "Jumlah (Rp)": item.jumlah,
            "Keterangan": item.keterangan || "-"
        }));
        
        const ws = XLSX.utils.json_to_sheet(worksheetData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data Keuangan");
        XLSX.writeFile(wb, `Laporan_Keuangan_${filterBulan||'Semua'}_${filterTahun||'Semua'}.xlsx`);
    } catch (err) {
        alert("Gagal export excel: " + err.message);
    }
}

async function exportDatabaseBackup() {
    try {
        const { data: transaksi } = await supabaseClient.from("transaksi").select("*");
        const { data: kategori } = await supabaseClient.from("kategori").select("*");
        
        const backupData = {
            version: "1.0",
            backup_date: new Date().toISOString(),
            data: { transaksi: transaksi || [], kategori: kategori || [] }
        };
        
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `backup_keuangan_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (err) {
        alert("Gagal backup database: " + err.message);
    }
}

// ==================== DOM READY ====================
document.addEventListener('DOMContentLoaded', function() {
    setDefaultTanggal();
    setDefaultPeriode();
    initYearDropdown();
    initCategoryLookup();
    initCurrencyInput();
    loadData();
    
    window.addEventListener('resize', () => {
        setTimeout(() => adjustAllBalanceCards(), 100);
        if (chart) { chart.resize(); }
        if (chartKategori) { chartKategori.resize(); }
    });
    
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.category-container')) {
            const sug = document.getElementById('kategoriSuggestions');
            if (sug) sug.classList.remove('show');
        }
    });
});
