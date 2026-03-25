let user=JSON.parse(localStorage.getItem("user"));

if(!user){

window.location.href="index.html";

}

const supabaseUrl = "You URL";
const supabaseKey = "You Key";
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

let chart = null;
let chartKategori = null;
let chartTrend = null;
let editId = null;
let dbCategories = [];
let pendingRestoreData = null;

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
  const cleaned = value.toString().replace(/[^0-9-]/g, '');
  return parseInt(cleaned) || 0;
}

// ==================== AUTO FONT SIZE FOR BALANCE CARDS ====================
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

// ==================== CURRENCY INPUT ====================
function initCurrencyInput() {
  const input = document.getElementById('jumlah');
  
  input.addEventListener('input', function() {
    let value = this.value.replace(/[^0-9]/g, '');
    if (value) this.value = new Intl.NumberFormat('id-ID').format(parseInt(value));
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

// ==================== TOGGLE SECTION ====================
function toggleSection(sectionId, btn) {
  const section = document.getElementById(sectionId);
  const icon = btn ? btn.querySelector('i') : null;
  
  if (!section) return;
  
  if (section.classList.contains('collapsed')) {
    section.classList.remove('collapsed');
    if (btn) btn.classList.remove('collapsed');
    if (icon) icon.style.transform = 'rotate(0deg)';
    
    if (sectionId === 'sectionGrafik') setTimeout(() => loadData(), 150);
    if (sectionId === 'sectionSummary') setTimeout(() => generateSummaryCategory(), 150);
    if (sectionId === 'sectionTransaksi') setTimeout(() => loadData(), 150);
  } else {
    section.classList.add('collapsed');
    if (btn) btn.classList.add('collapsed');
    if (icon) icon.style.transform = 'rotate(-90deg)';
  }
}

// ==================== SAVE TRANSACTION ====================
async function simpan() {
  const tanggal = document.getElementById("tanggal").value;
  const jenis = document.getElementById("jenis").value;
  const kategori = document.getElementById("kategori").value.trim();
  const jumlahRaw = document.getElementById("jumlah").value;
  const keterangan = document.getElementById("keterangan").value.trim();
  
  const jumlah = parseCurrencyInput(jumlahRaw);
  
  if (!tanggal || !kategori || !jumlah) {
    alert("⚠️ Data belum lengkap!");
    return;
  }
  
  const dataPayload = { tanggal, jenis, kategori, jumlah, keterangan: keterangan || null };
  
  try {
    if (editId) {
      const { error } = await supabaseClient.from("transaksi").update(dataPayload).eq("id", editId);
      if (error) throw error;
      alert("✅ Data berhasil diupdate");
    } else {
      const { error } = await supabaseClient.from("transaksi").insert([dataPayload]);
      if (error) throw error;
      alert("✅ Data berhasil disimpan");
    }
    resetForm();
    loadData();
  } catch (error) {
    alert("❌ Error: " + error.message);
  }
}

// ==================== LOAD DATA ====================
async function loadData() {
  const bulan = document.getElementById("filterBulan").value;
  const tahun = document.getElementById("filterTahun").value;
  
  const loadingTable = document.getElementById('loadingTable');
  const sectionTransaksi = document.getElementById('sectionTransaksi');
  
  if (sectionTransaksi && sectionTransaksi.classList.contains('collapsed')) {
    sectionTransaksi.classList.remove('collapsed');
    const btn = document.querySelector('button[onclick*="sectionTransaksi"]');
    if (btn) {
      btn.classList.remove('collapsed');
      const icon = btn.querySelector('i');
      if (icon) icon.style.transform = 'rotate(0deg)';
    }
  }
  
  if (loadingTable) loadingTable.classList.add('show');
  
  let awal = null, akhirTanggal = null;
  if (bulan && tahun) {
    awal = `${tahun}-${bulan}-01`;
    const lastDay = new Date(tahun, parseInt(bulan), 0).getDate();
    akhirTanggal = `${tahun}-${bulan}-${String(lastDay).padStart(2, '0')}`;
  }
  
  let opening = 0;
  if (awal) {
    const { data: beforeData } = await supabaseClient.from("transaksi").select("jenis, jumlah").lt("tanggal", awal);
    if (beforeData) {
      beforeData.forEach(row => {
        if (row.jenis === "Masuk") opening += (row.jumlah || 0);
        else opening -= (row.jumlah || 0);
      });
    }
  }
  
  let query = supabaseClient.from("transaksi").select("id, tanggal, jenis, kategori, jumlah, keterangan").order("tanggal", { ascending: true }).order("id", { ascending: true });
  
  if (bulan && tahun) {
    query = query.gte("tanggal", awal).lte("tanggal", akhirTanggal);
  }
  
  const { data, error } = await query;
  
  if (loadingTable) loadingTable.classList.remove('show');
  
  if (error) {
    const tbl = document.getElementById("tabelTransaksi");
    if (tbl) tbl.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">❌ Error: ${error.message}</td></tr>`;
    return;
  }
  
  let tabel = "", masuk = 0, keluar = 0, saldo = opening;
  
  if (!data || data.length === 0) {
    const tbl = document.getElementById("tabelTransaksi");
    const count = document.getElementById("transactionCount");
    if (tbl) tbl.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">📭 Belum ada transaksi</td></tr>`;
    if (count) count.innerText = "0 transaksi";
    updateBalanceCards(opening, 0, 0, opening, 0);
    
    if (document.getElementById('sectionGrafik') && !document.getElementById('sectionGrafik').classList.contains('collapsed')) {
      buatChart(0, 0);
      buatChartKategori([]);
      await buatTrend();
    }
    return;
  }
  
  data.forEach(row => {
    const amount = row.jumlah || 0;
    if (row.jenis === "Masuk") { masuk += amount; saldo += amount; }
    else { keluar += amount; saldo -= amount; }
    
    const badgeClass = row.jenis === 'Masuk' ? 'success' : 'danger';
    const amountClass = row.jenis === 'Masuk' ? 'text-success' : 'text-danger';
    
    tabel += `<tr>
      <td><small>${formatTanggal(row.tanggal) || '-'}</small></td>
      <td><span class="badge bg-${badgeClass}">${row.jenis}</span></td>
      <td>${row.kategori || '-'}</td>
      <td class="text-end fw-bold ${amountClass}">${formatRupiah(amount)}</td>
      <td><small>${row.keterangan || '-'}</small></td>
      <td class="text-end"><small>${formatRupiah(saldo)}</small></td>
      <td class="text-center">
        <button class="btn btn-warning btn-sm py-0 px-2 me-1" onclick='editData("${row.id}","${row.tanggal}","${row.jenis}","${row.kategori}","${row.jumlah}","${row.keterangan || ""}")'><i class="bi bi-pencil"></i></button>
        <button class="btn btn-danger btn-sm py-0 px-2" onclick="hapusData('${row.id}')"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`;
  });
  
  const ending = opening + (masuk - keluar);
  const count = document.getElementById("transactionCount");
  if (count) count.innerText = `${data.length} transaksi`;
  
  updateBalanceCards(opening, masuk, keluar, ending, data.length);
  
  const tbl = document.getElementById("tabelTransaksi");
  if (tbl) tbl.innerHTML = tabel;
  
  if (document.getElementById('sectionGrafik') && !document.getElementById('sectionGrafik').classList.contains('collapsed')) {
    buatChart(masuk, keluar);
    buatChartKategori(data);
    await buatTrend();
  }
  
  if (document.getElementById('sectionSummary') && !document.getElementById('sectionSummary').classList.contains('collapsed')) {
    generateSummaryCategory(data);
  }
}

// ==================== UPDATE BALANCE CARDS ====================
function updateBalanceCards(opening, masuk, keluar, ending, total) {
  const el = document.getElementById("openingBalance");
  if (el) {
    el.innerText = formatRupiah(opening);
  }
  
  const el2 = document.getElementById("totalMasuk");
  if (el2) {
    el2.innerText = formatRupiah(masuk);
  }
  
  const el3 = document.getElementById("totalKeluar");
  if (el3) {
    el3.innerText = formatRupiah(keluar);
  }
  
  const el4 = document.getElementById("endingBalance");
  if (el4) {
    el4.innerText = formatRupiah(ending);
  }
  
  const el5 = document.getElementById("totalTransaksi");
  if (el5) el5.innerText = total;
  
  setTimeout(() => adjustAllBalanceCards(), 100);
}

// ==================== CHART FUNCTIONS ====================
function buatChart(masuk, keluar) {
  const canvas = document.getElementById("chartKeuangan");
  if (!canvas) return;
  
  const ctx = canvas.getContext("2d");
  if (chart) { chart.destroy(); chart = null; }
  
  const formatAngka = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(angka);
  };
  
  const formatAxis = (value) => {
    if (value >= 1000000000) {
      return 'Rp ' + (value / 1000000000).toFixed(1) + ' M';
    } else if (value >= 1000000) {
      return 'Rp ' + (value / 1000000).toFixed(1) + ' jt';
    } else if (value >= 1000) {
      return 'Rp ' + (value / 1000).toFixed(0) + ' rb';
    }
    return 'Rp ' + value;
  };
  
  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ["Pemasukan", "Pengeluaran"],
      datasets: [{
        label: "Jumlah",
        data: [masuk || 0, keluar || 0],
        backgroundColor: ['rgba(25, 135, 84, 0.85)', 'rgba(220, 53, 69, 0.85)'],
        borderColor: ['rgba(25, 135, 84, 1)', 'rgba(220, 53, 69, 1)'],
        borderWidth: 2,
        borderRadius: 10,
        borderSkipped: false,
        barThickness: 'flex',
        maxBarThickness: 100
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: window.innerWidth < 576 ? 1.5 : 2,
      layout: { padding: { top: 30, right: 30, bottom: 50, left: 30 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          padding: 14,
          cornerRadius: 8,
          titleFont: { size: 14, weight: 'bold', family: "'Segoe UI', sans-serif" },
          bodyFont: { size: 13, family: "'Segoe UI', sans-serif" },
          displayColors: false,
          callbacks: {
            label: function(context) {
              return ' ' + formatAngka(context.parsed.y);
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0, 0, 0, 0.04)', drawBorder: false, lineWidth: 1 },
          ticks: {
            padding: 12,
            font: { size: window.innerWidth < 576 ? 10 : 11, family: "'Segoe UI', sans-serif" },
            color: '#666',
            maxRotation: 0,
            autoSkip: true,
            callback: function(value) { return formatAxis(value); }
          },
          border: { display: false },
          suggestedMax: Math.max(masuk, keluar) * 1.15
        },
        x: {
          grid: { display: false, drawBorder: false },
          ticks: {
            padding: 18,
            font: { size: window.innerWidth < 576 ? 12 : 13, weight: '600', family: "'Segoe UI', sans-serif" },
            color: '#333',
            maxRotation: 0,
            minRotation: 0
          },
          border: { display: false }
        }
      },
      animation: { duration: 800, easing: 'easeOutQuart', animateScale: true, animateRotate: true },
      onResize: (chart, size) => { chart.options.aspectRatio = size.width < 576 ? 1.5 : 2; }
    }
  });
  
  updateStatusBox(masuk, keluar);
  updateChartInfo(masuk, keluar);
}

function updateChartInfo(masuk, keluar) {
  const saldo = (masuk || 0) - (keluar || 0);
  
  const elPemasukan = document.getElementById('infoPemasukan');
  const elPengeluaran = document.getElementById('infoPengeluaran');
  const elSaldoValue = document.getElementById('infoSaldoValue');
  const elSaldoBox = document.getElementById('infoSaldo');
  
  if (elPemasukan) elPemasukan.innerText = formatRupiah(masuk || 0);
  if (elPengeluaran) elPengeluaran.innerText = formatRupiah(keluar || 0);
  if (elSaldoValue) elSaldoValue.innerText = formatRupiah(Math.abs(saldo));
  
  if (elSaldoBox) {
    if (saldo >= 0) {
      elSaldoBox.className = 'info-box p-3 rounded bg-success bg-gradient text-white';
    } else {
      elSaldoBox.className = 'info-box p-3 rounded bg-danger bg-gradient text-white';
    }
  }
}

function updateStatusBox(masuk, keluar) {
  let status = "", css = "";
  if ((masuk === 0 || !masuk) && (keluar === 0 || !keluar)) { 
    status = "⚪ Belum ada transaksi"; 
    css = "status-kosong"; 
  } else if ((masuk || 0) > (keluar || 0)) { 
    status = "🟢 Keuangan Membaik"; 
    css = "status-baik"; 
  } else if ((keluar || 0) > (masuk || 0)) { 
    status = "🔴 Keuangan Boros"; 
    css = "status-boros"; 
  } else { 
    status = "🟡 Keuangan normal"; 
    css = "status-normal"; 
  }
  
  const box = document.getElementById("statusBox");
  if (box) { 
    box.className = "p-3 rounded fw-bold " + css; 
    box.innerText = status; 
  }
}

function buatChartKategori(data) {
  const canvas = document.getElementById("chartKategori");
  if (!canvas) return;
  
  const ctx = canvas.getContext("2d");
  if (chartKategori) { chartKategori.destroy(); chartKategori = null; }
  
  let kategoriMap = {};
  if (data && Array.isArray(data)) {
    data.forEach(row => {
      if (row.jenis === "Keluar" && row.kategori) {
        const kat = row.kategori.trim();
        if (kat) kategoriMap[kat] = (kategoriMap[kat] || 0) + (row.jumlah || 0);
      }
    });
  }
  
  const labels = Object.keys(kategoriMap);
  const values = Object.values(kategoriMap);
  
  if (labels.length === 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "14px sans-serif";
    ctx.fillStyle = "#6c757d";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("📭 Belum ada data", canvas.width/2, canvas.height/2);
    return;
  }
  
  const colors = ['rgba(102, 126, 234, 0.8)', 'rgba(118, 75, 162, 0.8)', 'rgba(240, 147, 251, 0.8)', 'rgba(245, 87, 108, 0.8)', 'rgba(56, 239, 125, 0.8)', 'rgba(17, 153, 142, 0.8)'];
  
  chartKategori = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{ data: values, backgroundColor: colors.slice(0, labels.length), borderColor: '#fff', borderWidth: 3 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true, font: { size: 10 } } }
      }
    }
  });
}

async function buatTrend() {
  const canvas = document.getElementById("chartTrend");
  if (!canvas) return;
  
  const ctx = canvas.getContext("2d");
  if (chartTrend) { chartTrend.destroy(); chartTrend = null; }
  
  const { data, error } = await supabaseClient.from("transaksi").select("tanggal, jenis, jumlah").order("tanggal", { ascending: true });
  if (error) return;
  
  let monthlyData = {};
  if (data && Array.isArray(data)) {
    data.forEach(row => {
      if (!row.tanggal) return;
      const periode = row.tanggal.substring(0, 7);
      const amount = row.jumlah || 0;
      if (!monthlyData[periode]) monthlyData[periode] = { masuk: 0, keluar: 0 };
      if (row.jenis === "Masuk") monthlyData[periode].masuk += amount;
      else monthlyData[periode].keluar += amount;
    });
  }
  
  const labels = Object.keys(monthlyData).sort();
  const values = labels.map(l => (monthlyData[l].masuk || 0) - (monthlyData[l].keluar || 0));
  
  if (labels.length === 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "14px sans-serif";
    ctx.fillStyle = "#6c757d";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("📈 Belum ada data", canvas.width/2, canvas.height/2);
    return;
  }
  
  const displayLabels = labels.map(l => {
    const [year, month] = l.split('-');
    const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    return months[parseInt(month)-1] + ' ' + year;
  });
  
  chartTrend = new Chart(ctx, {
    type: 'line',
    data: {
      labels: displayLabels,
      datasets: [{ label: "Saldo Bersih", data: values, borderColor: "#667eea", backgroundColor: "rgba(102, 126, 234, 0.15)", fill: true, tension: 0.4 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true, position: 'top' } }
    }
  });
}

// ==================== SUMMARY CATEGORY ====================
function generateSummaryCategory(data = null) {
  const container = document.getElementById('summaryContainer');
  if (!container) return;
  
  if (!data) {
    container.innerHTML = '<div class="col-12 text-muted text-center py-4"><i class="bi bi-info-circle me-2"></i>Klik "Tampilkan" untuk melihat summary</div>';
    return;
  }
  
  const summary = {};
  if (data && Array.isArray(data) && data.length > 0) {
    data.forEach(row => {
      const kat = row.kategori?.trim();
      if (!kat) return;
      if (!summary[kat]) summary[kat] = { masuk: 0, keluar: 0, count: 0 };
      summary[kat].count++;
      if (row.jenis === "Masuk") summary[kat].masuk += (row.jumlah || 0);
      else summary[kat].keluar += (row.jumlah || 0);
    });
  }
  
  if (Object.keys(summary).length === 0) {
    container.innerHTML = '<div class="col-12 text-muted text-center py-4"><i class="bi bi-emoji-frown me-2"></i>Tidak ada data</div>';
    return;
  }
  
  const sorted = Object.entries(summary).sort((a, b) => ((b[1].masuk || 0) + (b[1].keluar || 0)) - ((a[1].masuk || 0) + (a[1].keluar || 0)));
  
  container.innerHTML = sorted.map(([kategori, stats]) => {
    const masuk = stats.masuk || 0;
    const keluar = stats.keluar || 0;
    const netto = masuk - keluar;
    const isPositive = netto >= 0;
    
    return `<div class="col-md-4 col-sm-6">
      <div class="card summary-card ${isPositive ? 'masuk' : 'keluar'} p-3 h-100">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <div><h6 class="mb-0 fw-bold">${kategori}</h6><small class="text-muted">${stats.count}x transaksi</small></div>
          <span class="badge bg-${isPositive ? 'success' : 'danger'} rounded-pill">${isPositive ? '↑' : '↓'}</span>
        </div>
        <hr class="my-2">
        <div class="row text-center small">
          <div class="col-6 border-end"><div class="text-success fw-bold">${formatRupiah(masuk)}</div><small class="text-muted">Masuk</small></div>
          <div class="col-6"><div class="text-danger fw-bold">${formatRupiah(keluar)}</div><small class="text-muted">Keluar</small></div>
        </div>
        <div class="mt-2 pt-2 border-top text-center">
          <small class="text-muted d-block">Netto</small>
          <strong class="${isPositive ? 'text-success' : 'text-danger'}" style="font-size: 1.1rem">${formatRupiah(Math.abs(netto))}</strong>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ==================== EDIT & DELETE ====================
function editData(id, tanggal, jenis, kategori, jumlah, keterangan) {
  editId = id;
  document.getElementById("tanggal").value = tanggal || '';
  document.getElementById("jenis").value = jenis || 'Masuk';
  document.getElementById("kategori").value = kategori || '';
  document.getElementById("jumlah").value = jumlah ? new Intl.NumberFormat('id-ID').format(jumlah) : '';
  document.getElementById("keterangan").value = keterangan || '';
  document.getElementById("btnSimpan").innerHTML = '<i class="bi bi-pencil-square"></i> Update';
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function hapusData(id) {
  if (!confirm("⚠️ Yakin ingin menghapus?")) return;
  const { error } = await supabaseClient.from("transaksi").delete().eq("id", id);
  if (error) { alert("❌ Error: " + error.message); return; }
  alert("✅ Transaksi dihapus");
  loadData();
}

// ==================== EXPORT EXCEL ====================
async function exportExcel() {
  const btn = document.querySelector('button[onclick="exportExcel()"]');
  const originalText = btn ? btn.innerHTML : '';
  
  if (btn) { btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Exporting...'; btn.disabled = true; }
  
  try {
    const { data, error } = await supabaseClient.from("transaksi").select("id, tanggal, jenis, kategori, jumlah, keterangan").order("tanggal", { ascending: false });
    if (error) throw error;
    if (!data || data.length === 0) { alert("📭 Tidak ada data"); return; }
    
    const exportData = data.map(row => ({ 'Tanggal': row.tanggal, 'Jenis': row.jenis, 'Kategori': row.kategori, 'Jumlah': row.jumlah, 'Keterangan': row.keterangan || '' }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transaksi");
    
    const filename = 'laporan_keuangan_' + new Date().toISOString().split('T')[0] + '.xlsx';
    XLSX.writeFile(wb, filename);
    alert('✅ Export berhasil: ' + filename);
  } catch (err) {
    alert("❌ Error export: " + err.message);
  } finally {
    if (btn && originalText) { btn.innerHTML = originalText; btn.disabled = false; }
  }
}

// ==================== BACKUP & RESTORE ====================
async function exportDatabaseBackup() {
  const modal = new bootstrap.Modal(document.getElementById('progressModal'));
  const title = document.getElementById('progressModalTitle');
  const message = document.getElementById('progressModalMessage');
  const progressBar = document.getElementById('progressBar');
  const progressDetail = document.getElementById('progressDetail');
  
  title.innerText = '📦 Export Backup Database';
  message.innerText = 'Mengambil data dari Supabase...';
  progressBar.style.width = '0%';
  progressDetail.innerText = '';
  modal.show();
  
  try {
    progressBar.style.width = '20%';
    progressDetail.innerText = 'Mengambil tabel: transaksi...';
    
    let { data: transaksi, error: errTrans } = await supabaseClient.from('transaksi').select('*').order('tanggal', { ascending: true });
    if (errTrans) throw new Error('Gagal fetch transaksi: ' + errTrans.message);
    
    progressBar.style.width = '40%';
    progressDetail.innerText = 'Mengambil tabel: kategori (jika ada)...';
    
    let kategori = [];
    let { data: katData, error: errKat } = await supabaseClient.from('kategori').select('*').order('nama_kategori', { ascending: true });
    if (!errKat && katData) { kategori = katData; }
    
    progressBar.style.width = '60%';
    progressDetail.innerText = 'Mengumpulkan metadata...';
    
    const backupData = {
      meta: {
        exportedAt: new Date().toISOString(),
        exportedBy: 'Dashboard Keuangan v1.0',
        supabaseUrl: supabaseUrl,
        schema: {
          transaksi: ['id', 'tanggal', 'jenis', 'kategori', 'jumlah', 'keterangan', 'created_at'],
          kategori: kategori.length > 0 ? ['id', 'nama_kategori', 'created_at'] : []
        }
      },
      data: { transaksi: transaksi || [], kategori: kategori || [] },
      stats: {
        totalTransaksi: transaksi?.length || 0,
        totalKategori: kategori?.length || 0,
        dateRange: transaksi?.length > 0 ? { from: transaksi[0].tanggal, to: transaksi[transaksi.length - 1].tanggal } : null
      }
    };
    
    progressBar.style.width = '80%';
    message.innerText = 'Membuat file backup...';
    
    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    progressBar.style.width = '100%';
    message.innerText = '✅ Backup siap diunduh!';
    progressDetail.innerText = 'Mengunduh file...';
    
    const a = document.createElement('a');
    const filename = `backup_keuangan_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setTimeout(() => {
      modal.hide();
      alert(`✅ Backup berhasil!\n\n📁 File: ${filename}\n📊 Transaksi: ${backupData.stats.totalTransaksi}\n🏷️ Kategori: ${backupData.stats.totalKategori}\n\n💡 Simpan file ini di tempat aman!`);
    }, 500);
  } catch (error) {
    message.innerText = '❌ Gagal export backup';
    progressDetail.innerText = error.message;
    progressBar.classList.remove('progress-bar-animated');
    progressBar.classList.add('bg-danger');
    
    setTimeout(() => {
      modal.hide();
      progressBar.classList.remove('bg-danger');
      progressBar.classList.add('progress-bar-animated');
      alert('❌ Error export backup:\n' + error.message);
    }, 1500);
  }
}

async function importDatabaseBackup(input) {
  const file = input.files[0];
  if (!file) return;
  
  if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
    alert('❌ File harus berformat .json');
    input.value = '';
    return;
  }
  
  try {
    const content = await file.text();
    const backupData = JSON.parse(content);
    
    if (!backupData.meta || !backupData.data) {
      throw new Error('Format file backup tidak valid');
    }
    
    document.getElementById('restoreFileName').innerText = file.name;
    document.getElementById('restoreFileDate').innerText = new Date(backupData.meta.exportedAt).toLocaleString('id-ID');
    document.getElementById('restoreFileCount').innerText = backupData.stats?.totalTransaksi || backupData.data.transaksi?.length || 0;
    
    pendingRestoreData = backupData;
    
    const modal = new bootstrap.Modal(document.getElementById('confirmRestoreModal'));
    modal.show();
  } catch (error) {
    alert('❌ Gagal membaca file backup:\n' + error.message);
  } finally {
    input.value = '';
  }
}

async function confirmRestore() {
  if (!pendingRestoreData) {
    alert('❌ Tidak ada data backup yang siap direstore');
    return;
  }
  
  const confirmModal = bootstrap.Modal.getInstance(document.getElementById('confirmRestoreModal'));
  confirmModal.hide();
  
  const progressModal = new bootstrap.Modal(document.getElementById('progressModal'));
  const title = document.getElementById('progressModalTitle');
  const message = document.getElementById('progressModalMessage');
  const progressBar = document.getElementById('progressBar');
  const progressDetail = document.getElementById('progressDetail');
  
  title.innerText = '🔄 Restore Database';
  message.innerText = 'Memulai proses restore...';
  progressBar.style.width = '0%';
  progressBar.className = 'progress-bar progress-bar-striped progress-bar-animated';
  progressDetail.innerText = '';
  progressModal.show();
  
  try {
    const { data: backupData } = pendingRestoreData;
    let successCount = 0, skipCount = 0, errorCount = 0;
    
    if (backupData.kategori && backupData.kategori.length > 0) {
      progressBar.style.width = '20%';
      message.innerText = 'Memulihkan kategori...';
      
      const existingKategori = await getExistingKategori();
      
      for (let i = 0; i < backupData.kategori.length; i++) {
        const kat = backupData.kategori[i];
        progressDetail.innerText = `Kategori ${i+1}/${backupData.kategori.length}: ${kat.nama_kategori}`;
        
        if (existingKategori.includes(kat.nama_kategori)) { skipCount++; continue; }
        
        const { error } = await supabaseClient.from('kategori').insert([{ nama_kategori: kat.nama_kategori }]);
        if (error) { errorCount++; } else { successCount++; }
        
        const progress = 20 + (i / backupData.kategori.length) * 20;
        progressBar.style.width = `${progress}%`;
        
        if (i % 10 === 0) await new Promise(r => setTimeout(r, 100));
      }
    }
    
    await fetchCategoriesFromDB();
    
    if (backupData.transaksi && backupData.transaksi.length > 0) {
      progressBar.style.width = '40%';
      message.innerText = 'Memulihkan transaksi...';
      
      const existingIds = await getExistingTransaksiIds();
      
      for (let i = 0; i < backupData.transaksi.length; i++) {
        const trx = backupData.transaksi[i];
        progressDetail.innerText = `Transaksi ${i+1}/${backupData.transaksi.length}: ${trx.tanggal}`;
        
        if (existingIds.includes(trx.id)) { skipCount++; continue; }
        
        const { error } = await supabaseClient.from('transaksi').insert([{
          tanggal: trx.tanggal,
          jenis: trx.jenis,
          kategori: trx.kategori,
          jumlah: trx.jumlah,
          keterangan: trx.keterangan || null
        }]);
        
        if (error) { errorCount++; } else { successCount++; }
        
        const progress = 40 + (i / backupData.transaksi.length) * 55;
        progressBar.style.width = `${progress}%`;
        
        if (i % 20 === 0) await new Promise(r => setTimeout(r, 150));
      }
    }
    
    progressBar.style.width = '100%';
    message.innerText = '✅ Restore selesai!';
    progressDetail.innerText = `Berhasil: ${successCount}, Dilewati: ${skipCount}, Error: ${errorCount}`;
    
    setTimeout(async () => {
      progressModal.hide();
      pendingRestoreData = null;
      await loadData();
      alert(`🎉 Restore Selesai!\n\n✅ Data berhasil: ${successCount}\n⏭️ Dilewati (duplikat): ${skipCount}\n❌ Gagal: ${errorCount}\n\n🔄 Dashboard telah diperbarui.`);
    }, 800);
  } catch (error) {
    message.innerText = '❌ Restore gagal';
    progressDetail.innerText = error.message;
    progressBar.classList.remove('progress-bar-animated');
    progressBar.classList.add('bg-danger');
    
    setTimeout(() => {
      progressModal.hide();
      progressBar.classList.remove('bg-danger');
      progressBar.classList.add('progress-bar-animated');
      alert('❌ Error saat restore:\n' + error.message);
    }, 1500);
  }
}

async function getExistingKategori() {
  try {
    const { data } = await supabaseClient.from('kategori').select('nama_kategori');
    return data?.map(k => k.nama_kategori) || [];
  } catch { return []; }
}

async function getExistingTransaksiIds() {
  try {
    const { data } = await supabaseClient.from('transaksi').select('id');
    return data?.map(t => t.id) || [];
  } catch { return []; }
}

// ==================== DOM READY ====================
document.addEventListener('DOMContentLoaded', function() {
  setDefaultTanggal();
  setDefaultPeriode();
  initCategoryLookup();
  initCurrencyInput();
  loadData();
  
  // Single resize handler for all
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

console.log("💰 Dashboard loaded!");
