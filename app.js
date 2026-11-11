/* CASHMATE MVP — stockage local IndexedDB, utilisable hors connexion */
const DB_NAME='cashmate_local_v1', DB_VERSION=1;
let db;
const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat('fr-FR',{maximumFractionDigits:0}).format(Number(n)||0)+' F';
const todayKey=()=>new Date().toISOString().slice(0,10);
const stamp=()=>new Date().toISOString();
const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);
function notify(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');clearTimeout(notify.timer);notify.timer=setTimeout(()=>t.classList.remove('show'),2500)}
function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,DB_VERSION);req.onupgradeneeded=()=>{const d=req.result;['products','sales','expenses','credits','settings'].forEach(s=>{if(!d.objectStoreNames.contains(s))d.createObjectStore(s,{keyPath:'id'})})};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
function all(store){return new Promise((res,rej)=>{const r=db.transaction(store).objectStore(store).getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
function put(store,obj){return new Promise((res,rej)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).put(obj);tx.oncomplete=()=>res(obj);tx.onerror=()=>rej(tx.error)})}
function remove(store,id){return new Promise((res,rej)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).delete(id);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)})}
async function settings(){return (await all('settings')).find(x=>x.id==='main')||{id:'main',shop:'Ma boutique'}}
function showView(name){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='view-'+name));document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===name));if(name==='products')renderProducts();if(name==='sales')renderSaleOptions();if(name==='expenses')renderExpenses();if(name==='customers')renderCredits();if(name==='reports')renderReports();if(name==='dashboard')renderDashboard();window.scrollTo(0,0)}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.go)));
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.close).classList.add('hidden')));
$('today').textContent=new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'short',year:'numeric'}).format(new Date());
$('connection').textContent=navigator.onLine?'Mode local activé':'Hors ligne • données locales';
window.addEventListener('online',()=>{$('connection').textContent='Mode local activé'});
window.addEventListener('offline',()=>{$('connection').textContent='Hors ligne • données locales'});

function productForm(p=null){$('product-form').classList.remove('hidden');$('product-form-title').textContent=p?'Modifier le produit':'Nouveau produit';$('product-id').value=p?.id||'';$('product-name').value=p?.name||'';$('product-cost').value=p?.cost??'';$('product-price').value=p?.price??'';$('product-qty').value=p?.qty??0;$('product-alert').value=p?.alert??3;$('product-form').scrollIntoView({behavior:'smooth',block:'start'})}
$('add-product').addEventListener('click',()=>productForm());


$('product-form').addEventListener('submit', async e => {

  e.preventDefault();

  const id = $('product-id').value || uid();

  const ancien = (await all('products')).find(x => x.id === id);

  const fichier = $('product-image').files[0];

  let image = ancien?.image || '';

  if (fichier) {

    image = await new Promise((resolve, reject) => {

      const lecteur = new FileReader();

      lecteur.onload = () => resolve(lecteur.result);

      lecteur.onerror = () => reject(lecteur.error);

      lecteur.readAsDataURL(fichier);

    });

  }

  const p = {

    id,

    name: $('product-name').value.trim(),

    cost: +$('product-cost').value,

    price: +$('product-price').value,

    qty: +$('product-qty').value,

    alert: +$('product-alert').value || 0,

    image,

    updatedAt: stamp()

  };

  if (!p.name || p.cost < 0 || p.price < 0 || p.qty < 0)

    return notify('Vérifiez les valeurs saisies.');

  await put('products', p);

  e.target.reset();

  $('product-form').classList.add('hidden');

  await renderProducts();

  await renderDashboard();

  notify('Produit enregistré.');

});
async function renderProducts(){const q=$('product-search').value.toLowerCase();const ps=(await all('products')).filter(p=>p.name.toLowerCase().includes(q));$('products-list').innerHTML=ps.length?ps.map(p=>`<div class="list-row"><div><b>${esc(p.name)}</b><small>Achat ${money(p.cost)} · Vente ${money(p.price)} · Stock ${p.qty}</small><div class="row-actions"><button class="mini-btn" data-edit="${p.id}">Modifier</button><button class="mini-btn danger" data-delete="${p.id}">Supprimer</button></div></div><strong>${money(p.price)}</strong></div>`).join(''):'<div class="empty">Aucun produit. Ajoutez votre premier article.</div>';document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=async()=>productForm((await all('products')).find(p=>p.id===b.dataset.edit)));document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=async()=>{if(confirm('Supprimer ce produit ? Les ventes déjà enregistrées seront conservées.')){await remove('products',b.dataset.delete);renderProducts();renderDashboard()}})}
$('product-search').addEventListener('input',renderProducts);

async function renderSaleOptions(){const ps=await all('products');$('sale-product').innerHTML='<option value="">Choisir un produit</option>'+ps.map(p=>`<option value="${p.id}">${esc(p.name)} — stock ${p.qty}</option>`).join('');$('sale-price').value='';$('sale-qty').value=1;updateSaleTotal()}
$('sale-product').addEventListener('change',async()=>{const p=(await all('products')).find(p=>p.id===$('sale-product').value);$('sale-price').value=p?.price??'';updateSaleTotal()});
['sale-price','sale-qty'].forEach(id=>$(id).addEventListener('input',updateSaleTotal));
$('sale-method').addEventListener('change',()=>$('sale-customer-wrap').classList.toggle('hidden',$('sale-method').value!=='Crédit client'));
function updateSaleTotal(){$('sale-total').textContent=money((+$('sale-price').value||0)*(+$('sale-qty').value||0))}
$('sale-form').addEventListener('submit',async e=>{e.preventDefault();const ps=await all('products'),p=ps.find(x=>x.id===$('sale-product').value),qty=+$('sale-qty').value,price=+$('sale-price').value,method=$('sale-method').value;if(!p)return notify('Choisissez un produit.');if(!Number.isInteger(qty)||qty<1||qty>p.qty)return notify('Stock insuffisant ou quantité invalide.');if(price<0)return notify('Prix invalide.');const total=qty*price;const sale={id:uid(),productId:p.id,productName:p.name,qty,unitPrice:price,unitCost:p.cost,total,method,customer:$('sale-customer').value.trim(),date:stamp(),day:todayKey()};p.qty-=qty;await put('products',p);await put('sales',sale);if(method==='Crédit client')await put('credits',{id:uid(),saleId:sale.id,customer:sale.customer||'Client sans nom',amount:total,paid:0,date:stamp()});e.target.reset();$('sale-qty').value=1;$('sale-customer-wrap').classList.add('hidden');await renderSaleOptions();await renderSales();await renderDashboard();notify('Vente enregistrée.')});
async function renderSales(){const ss=(await all('sales')).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,12);$('sales-list').innerHTML=ss.length?ss.map(s=>`<div class="list-row"><div><b>${esc(s.productName)} × ${s.qty}</b><small>${fmtDate(s.date)} · ${esc(s.method)}</small></div><strong>${money(s.total)}</strong></div>`).join(''):'<div class="empty">Aucune vente enregistrée.</div>'}
async function renderExpenses(){const es=(await all('expenses')).sort((a,b)=>b.date.localeCompare(a.date));$('expenses-list').innerHTML=es.length?es.map(x=>`<div class="list-row"><div><b>${esc(x.label)}</b><small>${fmtDate(x.date)}</small></div><strong>− ${money(x.amount)}</strong></div>`).join(''):'<div class="empty">Aucune dépense enregistrée.</div>'}
$('expense-form').addEventListener('submit',async e=>{e.preventDefault();const label=$('expense-label').value.trim(),amount=+$('expense-amount').value;if(!label||amount<=0)return notify('Saisissez un motif et un montant valides.');await put('expenses',{id:uid(),label,amount,date:stamp(),day:todayKey()});e.target.reset();await renderExpenses();await renderDashboard();notify('Dépense enregistrée.')});
async function renderCredits(){const cs=await all('credits');const open=cs.filter(c=>c.amount-c.paid>0);$('debt-total').textContent=money(open.reduce((a,c)=>a+c.amount-c.paid,0));$('credits-list').innerHTML=open.length?open.map(c=>`<div class="list-row"><div><b>${esc(c.customer)}</b><small>Crédit initial : ${money(c.amount)} · Payé : ${money(c.paid)}</small><div class="row-actions"><button class="mini-btn" data-pay="${c.id}">Enregistrer remboursement</button></div></div><strong>${money(c.amount-c.paid)}</strong></div>`).join(''):'<div class="empty">Aucun crédit client en cours.</div>';document.querySelectorAll('[data-pay]').forEach(b=>b.onclick=async()=>{const c=(await all('credits')).find(x=>x.id===b.dataset.pay);const remaining=c.amount-c.paid;const val=prompt('Montant du remboursement (maximum '+remaining+' FCFA)');if(val===null)return;const n=Number(val);if(!Number.isFinite(n)||n<=0||n>remaining)return notify('Montant invalide.');c.paid+=n;await put('credits',c);await renderCredits();notify('Remboursement enregistré.')})}
async function renderDashboard(){const [ss,es,ps,cs,st]=await Promise.all([all('sales'),all('expenses'),all('products'),all('credits'),settings()]);const day=todayKey(),todaySales=ss.filter(s=>s.day===day),todayExpenses=es.filter(x=>x.day===day);const rev=todaySales.reduce((a,s)=>a+s.total,0),cost=todaySales.reduce((a,s)=>a+s.unitCost*s.qty,0),exp=todayExpenses.reduce((a,x)=>a+x.amount,0);$('dash-sales').textContent=money(rev);$('dash-profit').textContent=money(rev-cost-exp);$('dash-expenses').textContent=money(exp);$('dash-stock').textContent=money(ps.reduce((a,p)=>a+p.cost*p.qty,0));$('low-stock').innerHTML=ps.filter(p=>p.qty<=p.alert).length?ps.filter(p=>p.qty<=p.alert).map(p=>`<div class="list-row"><div><b>${esc(p.name)}</b><small>Seuil : ${p.alert}</small></div><strong style="color:var(--danger)">${p.qty} restant(s)</strong></div>`).join(''):'<div class="empty">Aucun produit en stock faible.</div>';document.querySelector('.brand small').textContent=st.shop||'Gestion de boutique';}
async function renderReports(){const [ss,es]=await Promise.all([all('sales'),all('expenses')]);const rev=ss.reduce((a,s)=>a+s.total,0),cost=ss.reduce((a,s)=>a+s.unitCost*s.qty,0),exp=es.reduce((a,x)=>a+x.amount,0);$('report-sales').textContent=money(rev);$('report-cost').textContent=money(cost);$('report-expenses').textContent=money(exp);$('report-profit').textContent=money(rev-cost-exp)}
$('settings-form').addEventListener('submit',async e=>{e.preventDefault();await put('settings',{...(await settings()),shop:$('shop-name').value.trim()||'Ma boutique'});await renderDashboard();notify('Paramètres enregistrés.')});
$('export-data').addEventListener('click',async()=>{const data={app:'CASHMATE',version:1,exportedAt:stamp()};for(const s of ['products','sales','expenses','credits','settings'])data[s]=await all(s);const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='cashmate-sauvegarde-'+todayKey()+'.json';a.click();URL.revokeObjectURL(url);notify('Sauvegarde téléchargée.')});
$('import-data').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{const data=JSON.parse(await file.text());if(data.app!=='CASHMATE')throw Error('Fichier non reconnu');if(!confirm('Cette restauration remplacera vos données actuelles. Continuer ?'))return;for(const s of ['products','sales','expenses','credits','settings']){const tx=db.transaction(s,'readwrite');tx.objectStore(s).clear();(data[s]||[]).forEach(x=>tx.objectStore(s).put(x));await new Promise((r,j)=>{tx.oncomplete=r;tx.onerror=()=>j(tx.error)})}notify('Sauvegarde restaurée.');await refreshAll()}catch(err){notify('Impossible de lire cette sauvegarde.')}e.target.value=''});
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function fmtDate(v){return new Intl.DateTimeFormat('fr-FR',{dateStyle:'short',timeStyle:'short'}).format(new Date(v))}
async function refreshAll(){await renderDashboard();await renderProducts();await renderSales();await renderExpenses();await renderCredits();await renderReports();const st=await settings();$('shop-name').value=st.shop||''}
(async()=>{try{db=await openDB();await refreshAll();if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});}catch(e){console.error(e);notify('Erreur d’initialisation du stockage local.')}})();
