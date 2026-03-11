const supabaseUrl = "https://qtcdtudnzlvrvtyyygwa.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0Y2R0dWRuemx2cnZ0eXl5Z3dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjEzMzAsImV4cCI6MjA4ODc5NzMzMH0.gVHcnBmD06MAMf7kw4QqHZZapuLqZ03Bqh4lFCPCu3k";

const supabaseClient=supabase.createClient(supabaseUrl,supabaseKey);

function togglePassword(id){

let input=document.getElementById(id);

if(input.type==="password"){
input.type="text";
}else{
input.type="password";
}

}

async function register(){

let username=document.getElementById("username").value;
let email=document.getElementById("email").value;
let phone=document.getElementById("phone").value;
let password=document.getElementById("password").value;

if(!username||!email||!phone||!password){
alert("Semua field wajib diisi");
return;
}

const {error}=await supabaseClient
.from("users")
.insert([{username,email,phone,password}]);

if(error){
alert("Register gagal");
console.log(error);
return;
}

alert("Register berhasil");

window.location.href="index.html";

}

async function login(){

let username=document.getElementById("username").value;
let password=document.getElementById("password").value;

const {data,error}=await supabaseClient
.from("users")
.select("*")
.eq("username",username)
.eq("password",password)
.single();

if(error||!data){
alert("Login gagal");
return;
}

localStorage.setItem("user",JSON.stringify(data));

window.location.href="dashboard.html";

}

async function lupaPassword(){

let input=prompt("Masukkan Email atau No HP");

const {data}=await supabaseClient
.from("users")
.select("*")
.or(`email.eq.${input},phone.eq.${input}`);

if(data.length===0){
alert("Data tidak ditemukan");
return;
}

alert("Link reset password dikirim");

}

function logout(){

localStorage.removeItem("user");

window.location.href="index.html";

}
