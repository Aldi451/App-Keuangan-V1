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
        if (!value) { suggestions.classList.remove('show'); return; }
        const matches = dbCategories.filter(cat => cat.toLowerCase().includes(value) && cat.toLowerCase() !== value);
        if (matches.length > 0) {
            suggestions.innerHTML = matches.map(cat => `<div onclick="selectCategory('${cat.replace(/'/g, "\\'")}')">${cat}</div>`).join('');
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

// ==================== CURRENCY INPUT (PENYEBAB ERROR) ====================
function initCurrencyInput() {
    const input = document.getElementById('jumlah');
    if (!input) return;

    input.addEventListener('input', function() {
        // Mengambil angka saja
        let value = this.value.replace(/[^0-9]/g, '');
        if (value) {
            // Memformat menjadi separator ribuan (contoh: 1.000.000)
            this.value = new Intl.NumberFormat('id-ID').format(parseInt(value));
        } else {
            this.value = '';
        }
    });

    input.addEventListener('paste', function(e) {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
        if (pasted) this.value = new Intl.NumberFormat('id-ID').format(parseInt(pasted));
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

// ==================== SISA KODE SEPERTI BIASA ====================
// (Potongan fungsi toggleSection, Comparison, Simpan, LoadData, dan lainnya tetap utuh)

// ==================== DOM READY ====================
document.addEventListener('DOMContentLoaded', function() {
    setDefaultTanggal();
    setDefaultPeriode();
    initYearDropdown();
    initCategoryLookup();
    initCurrencyInput(); // Sekarang fungsi ini sudah aman dipanggil
    loadData();
    window.addEventListener('resize', () => {
        setTimeout(() => adjustAllBalanceCards(), 100);
        if (chart) { chart.resize(); }
        if (chartKategori) { chartKategori.resize(); }
    });
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.category-container')) {
            const sug = document.getElementById('kategoriSuggestions');
            if(sug) sug.classList.remove('show');
        }
    });
});
