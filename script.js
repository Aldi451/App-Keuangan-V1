let user=JSON.parse(localStorage.getItem("user"));

if(!user){

window.location.href="index.html";

}

function rupiah(angka){

return "Rp "+angka.toLocaleString("id-ID");

}

async function simpan(){

let tanggal=document.getElementById("tanggal").value;
let jenis=document.getElementById("jenis").value;
let kategori=document.getElementById("kategori").value;
let jumlah=parseFloat(document.getElementById("jumlah").value);
let keterangan=document.getElementById("keterangan").value;

await supabaseClient
.from("transaksi")
.insert([{
user_id:user.id,
tanggal,
jenis,
kategori,
jumlah,
keterangan
}]);

loadData();

}

async function loadData(){

let bulan=document.getElementById("filterBulan").value;
let tahun=document.getElementById("filterTahun").value;

let query=supabaseClient
.from("transaksi")
.select("*")
.eq("user_id",user.id)
.order("tanggal");

if(bulan&&tahun){

let awal=`${tahun}-${bulan}-01`;

let akhir=new Date(tahun,bulan,0).getDate();

let akhirTanggal=`${tahun}-${bulan}-${akhir}`;

query=query
.gte("tanggal",awal)
.lte("tanggal",akhirTanggal);

}

const {data}=await query;

let tabel="";

let masuk=0;
let keluar=0;

data.forEach(row=>{

tabel+=`
<tr>
<td>${row.tanggal}</td>
<td>${row.jenis}</td>
<td>${row.kategori}</td>
<td>${rupiah(row.jumlah)}</td>
<td>${row.keterangan}</td>
<td>
<button onclick="edit(${row.id})">✏</button>
<button onclick="hapus(${row.id})">🗑</button>
</td>
</tr>
`;

if(row.jenis==="Masuk"){

masuk+=row.jumlah;

}else{

keluar+=row.jumlah;

}

});

document.getElementById("tabelTransaksi").innerHTML=tabel;

document.getElementById("totalMasuk").innerHTML=rupiah(masuk);
document.getElementById("totalKeluar").innerHTML=rupiah(keluar);

let saldo=masuk-keluar;

document.getElementById("saldo").innerHTML=rupiah(saldo);

let status="";
let classStatus="";

if(masuk===0 && keluar===0){

status="Belum ada pemasukan dan pengeluaran";

}else if(masuk>keluar){

status="Keuangan Membaik";
classStatus="status-baik";

}else if(masuk===keluar){

status="Keuangan Normal";
classStatus="status-normal";

}else{

status="Keuangan Boros";
classStatus="status-boros";

}

document.getElementById("statusKeuangan").innerHTML=
`<span class="${classStatus}">${status}</span>`;

}

async function hapus(id){

if(!confirm("Hapus transaksi?")) return;

await supabaseClient
.from("transaksi")
.delete()
.eq("id",id);

loadData();

}

function edit(id){

alert("Fitur edit masih sama seperti sebelumnya");

}

function toggleDark(){

document.body.classList.toggle("dark");

}

const supabaseUrl = "link url supabase";
const supabaseKey = "url key supabase";
const supabaseClient=supabase.createClient(supabaseUrl,supabaseKey);

let chart;
let editId=null;

function formatRupiah(angka){

return new Intl.NumberFormat('id-ID',{
style:'currency',
currency:'IDR'
}).format(angka);

}

function setDefaultTanggal(){

let today=new Date().toISOString().split('T')[0];
document.getElementById("tanggal").value=today;

}

function setDefaultPeriode(){

let today=new Date();

let bulan=String(today.getMonth()+1).padStart(2,'0');
let tahun=today.getFullYear();

document.getElementById("filterBulan").value=bulan;
document.getElementById("filterTahun").value=tahun;

}

async function simpan(){

let tanggal=document.getElementById("tanggal").value;
let jenis=document.getElementById("jenis").value;
let kategori=document.getElementById("kategori").value;
let jumlah=document.getElementById("jumlah").value;
let keterangan=document.getElementById("keterangan").value;

if(!tanggal || !kategori || !jumlah){
alert("Data belum lengkap");
return;
}

if(editId){

await supabaseClient
.from("transaksi")
.update({
tanggal,jenis,kategori,
jumlah:parseFloat(jumlah),
keterangan
})
.eq("id",editId);

editId=null;

document.getElementById("btnSimpan").innerText="Simpan";

alert("Data berhasil diupdate");

}else{

await supabaseClient
.from("transaksi")
.insert([{
tanggal,jenis,kategori,
jumlah:parseFloat(jumlah),
keterangan
}]);

alert("Data berhasil disimpan");

}

loadData();

}

async function loadData(){

let bulan=document.getElementById("filterBulan").value;
let tahun=document.getElementById("filterTahun").value;

let query=supabaseClient
.from("transaksi")
.select("*")
.order("tanggal",{ascending:true});

if(bulan && tahun){

let awal=`${tahun}-${bulan}-01`;
let akhir=new Date(tahun,bulan,0).getDate();
let akhirTanggal=`${tahun}-${bulan}-${akhir}`;

query=query.gte("tanggal",awal).lte("tanggal",akhirTanggal);

}

const {data,error}=await query;

if(error){
console.log(error);
return;
}

let tabel="";
let masuk=0;
let keluar=0;
let saldo=0;

if(!data || data.length===0){

document.getElementById("tabelTransaksi").innerHTML=
`<tr><td colspan="7" class="text-center">Belum ada transaksi</td></tr>`;

document.getElementById("openingBalance").innerText=formatRupiah(0);
document.getElementById("totalMasuk").innerText=formatRupiah(0);
document.getElementById("totalKeluar").innerText=formatRupiah(0);
document.getElementById("endingBalance").innerText=formatRupiah(0);

buatChart(0,0);

return;

}

data.forEach(row=>{

if(row.jenis==="Masuk"){
masuk+=row.jumlah;
saldo+=row.jumlah;
}else{
keluar+=row.jumlah;
saldo-=row.jumlah;
}

tabel+=`
<tr>

<td>${row.tanggal}</td>
<td>${row.jenis}</td>
<td>${row.kategori}</td>
<td>${formatRupiah(row.jumlah)}</td>
<td>${row.keterangan}</td>
<td>${formatRupiah(saldo)}</td>

<td>

<button class="btn btn-warning btn-sm"
onclick="editData('${row.id}','${row.tanggal}','${row.jenis}','${row.kategori}','${row.jumlah}','${row.keterangan}')">
Edit
</button>

<button class="btn btn-danger btn-sm"
onclick="hapusData('${row.id}')">
Hapus
</button>

</td>

</tr>
`;

});

document.getElementById("totalMasuk").innerText=formatRupiah(masuk);
document.getElementById("totalKeluar").innerText=formatRupiah(keluar);
document.getElementById("openingBalance").innerText=formatRupiah(0);
document.getElementById("endingBalance").innerText=formatRupiah(masuk-keluar);

document.getElementById("tabelTransaksi").innerHTML=tabel;

buatChart(masuk,keluar);

}

function editData(id,tanggal,jenis,kategori,jumlah,keterangan){

editId=id;

document.getElementById("tanggal").value=tanggal;
document.getElementById("jenis").value=jenis;
document.getElementById("kategori").value=kategori;
document.getElementById("jumlah").value=jumlah;
document.getElementById("keterangan").value=keterangan;

document.getElementById("btnSimpan").innerText="Update";

}

async function hapusData(id){

if(!confirm("Hapus transaksi ini?")) return;

await supabaseClient
.from("transaksi")
.delete()
.eq("id",id);

loadData();

}

function buatChart(masuk,keluar){

const ctx=document.getElementById("chartKeuangan");

if(chart){
chart.destroy();
}

chart=new Chart(ctx,{
type:'bar',
data:{
labels:["Pemasukan","Pengeluaran"],
datasets:[{
data:[masuk,keluar],
backgroundColor:["#28a745","#dc3545"]
}]
}
});

let status="";
let css="";

if(masuk===0 && keluar===0){
status="⚪ Belum ada pemasukan dan pengeluaran";
css="status-kosong";
}
else if(masuk>keluar){
status="🟢 Keuangan Membaik";
css="status-baik";
}
else if(keluar>masuk){
status="🔴 Pengeluaran Lebih Besar";
css="status-boros";
}
else{
status="🟡 Keuangan Normal";
css="status-normal";
}

let box=document.getElementById("statusBox");

box.className="p-3 rounded fw-bold "+css;
box.innerText=status;

}

setDefaultTanggal();
setDefaultPeriode();
loadData();

