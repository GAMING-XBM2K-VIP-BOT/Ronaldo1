function toggleMobileNav(id){const el=document.getElementById(id);const btn=document.querySelector('.mobile-nav-toggle');if(!el)return;const open=el.classList.toggle('mobile-open');if(btn){btn.setAttribute('aria-expanded',open?'true':'false');btn.querySelector('span').textContent=open?'×':'☰';}if(open){document.addEventListener('click',function closeNav(e){if(!el.contains(e.target)&&!btn?.contains(e.target)){el.classList.remove('mobile-open');if(btn){btn.setAttribute('aria-expanded','false');btn.querySelector('span').textContent='☰';}document.removeEventListener('click',closeNav);}}, {once:true});}}let me=null,products=[],settings=null,users=[],orders=[];
function money(n){return `${settings?.currency_code||'RS'} ${Number(n||0).toFixed(2)}`}
function setBrand(){const name=settings?.SHOP_name || localStorage.getItem('SHOP_template_SHOP_name') || '';document.title=name ? name+' — Admin' : 'Admin';document.getElementById('adminSHOPName')?.replaceChildren(document.createTextNode(name));document.querySelectorAll('.brand').forEach(a=>{let label=a.querySelector('.brand-name');if(!label){label=document.createElement('span');label.className='brand-name';a.appendChild(label)}label.textContent=name;if(settings?.SHOP_logo_url){const mark=a.querySelector('.brand-mark');if(mark)mark.innerHTML=`<img src="${esc(settings.SHOP_logo_url)}" alt="" class="brand-logo">`}})}
const catLabels={nonroot_ff_proxy:'Non-root FF Proxy',ios_panel:'iOS Panel',root_panel:'Root Panel',pc_panel:'PC Panel',other:'Other'};
async function init(){const {data:{session}}=await sb.auth.getSession();if(!session)return location.href='login.html';const r=await sb.from('profiles').select('*').eq('id',session.user.id).single();if(r.error||!r.data?.is_admin){document.body.innerHTML='<main><div class="panel glass"><h1>403</h1><p>Admin access required.</p></div></main>';return}me=r.data;renderNav(session);setupTabs();await reloadAll()}
function renderNav(session){document.getElementById('adminNav').innerHTML=`<div class="nav-account"><img src="${esc(me.avatar_url||avatarFallback(session.user.email))}" class="nav-avatar"><div class="nav-account-copy"><b>${esc(me.full_name||session.user.email.split('@')[0])}</b><span>${esc(money(me.balance||0))}</span></div></div><a class="nav-link" href="index.html#SHOP">Products</a><a class="nav-link" href="dashboard.html">Dashboard</a><a class="nav-link active" href="admin.html">Admin</a><button class="btn primary small" onclick="signOut()">Sign out</button>`}
function avatarFallback(email){return 'https://ui-avatars.com/api/?name='+encodeURIComponent(email||'N')+'&background=171321&color=ffffff&size=256'}
function setupTabs(){document.querySelectorAll('.admin-menu button').forEach(b=>b.onclick=()=>activateAdminTab(b.dataset.adminTab));window.addEventListener('hashchange',()=>activateAdminTab(location.hash.replace('#','')||'overview'))}
function activateAdminTab(tab){if(!['overview','users','products','keys','payments','settings'].includes(tab))tab='overview';document.querySelectorAll('.admin-menu button').forEach(x=>x.classList.toggle('active',x.dataset.adminTab===tab));document.querySelectorAll('.admin-panel').forEach(x=>x.classList.remove('active'));document.getElementById('admin-'+tab).classList.add('active')}
async function reloadAll(){await Promise.all([loadProducts(),loadUsers(),loadPayments(),loadSettings(),loadOrders()]);renderOverview()}
async function loadProducts(){const r=await sb.from('products').select('*,product_variants(id,label,price,sort_order,active),product_keys(id,variant_id,status)').order('id');if(r.error)return alert(r.error.message);products=(r.data||[]).map(p=>({...p,product_variants:(p.product_variants||[]).filter(v=>v.active!==false)}));renderProducts();renderKeys()}
async function loadUsers(){const r=await sb.from('profiles').select('id,email,full_name,mobile_number,avatar_url,balance,is_admin,created_at').order('created_at',{ascending:false});if(r.error)return alert(r.error.message);users=r.data||[];document.getElementById('usersTable').innerHTML=`<table class="admin-table"><thead><tr><th>USER</th><th>MOBILE</th><th>BALANCE</th><th>ROLE</th><th>JOINED</th><th>ACTION</th></tr></thead><tbody>${users.map(u=>`<tr><td><div class="user-cell"><img class="user-avatar" src="${esc(u.avatar_url||avatarFallback(u.email))}"><div><b>${esc(u.full_name||'Unnamed user')}</b><br><small>${esc(u.email||'')}</small></div></div></td><td>${esc(u.mobile_number||'—')}</td><td>RS${Number(u.balance).toFixed(2)}</td><td><span class="role-pill ${u.is_admin?'admin':''}">${u.is_admin?'ADMIN':'CUSTOMER'}</span></td><td>${new Date(u.created_at).toLocaleDateString()}</td><td><button class="btn danger-btn small" onclick="deleteUser('${u.id}',${u.is_admin?'true':'false'},'${escAttr(u.email||'')}')" ${u.id===me?.id?'disabled':''}>Delete</button></td></tr>`).join('')}</tbody></table>`}

async function deleteUser(id){const user=users.find(x=>x.id===id);if(!user)return alert('User not found.');const email=user.email||'';if(id===me?.id)return alert('You cannot delete your own admin account.');if(user.is_admin)return alert('Admin accounts cannot be deleted from this panel.');const ok=confirm(`Delete ${email||'this user'} permanently?\n\nThis removes the account and its profile, balance, orders and payment history.`);if(!ok)return;const r=await sb.rpc('admin_delete_user',{p_user_id:id});if(r.error)return alert(r.error.message);await reloadAll();alert('User deleted successfully.')}
async function loadPayments(){const r=await sb.from('topup_requests').select('*,profiles(email,full_name,avatar_url)').order('created_at',{ascending:false});const list=r.data||[];document.getElementById('paymentsAdmin').innerHTML=list.map(x=>`<div class="admin-row-card"><div class="admin-person"><img class="user-avatar" src="${esc(x.profiles?.avatar_url||avatarFallback(x.profiles?.email))}"><div><b>${esc(x.profiles?.full_name||x.profiles?.email||x.user_id)}</b><br><small>${esc(money(x.amount))} · ${esc(x.reference||'No reference')} · ${new Date(x.created_at).toLocaleString()}</small></div></div><div class="admin-actions">${x.status==='pending'?`<button class="btn primary small" onclick="approve('${x.id}')">Approve</button><button class="btn danger-btn small" onclick="rejectReq('${x.id}')">Reject</button>`:`<span class="status ${x.status}">${x.status}</span>`}</div></div>`).join('')||'<p class="muted">No payment requests.</p>';document.getElementById('overviewPayments').innerHTML=list.filter(x=>x.status==='pending').slice(0,5).map(x=>`<div class="admin-row-card"><div class="admin-person"><img class="user-avatar" src="${esc(x.profiles?.avatar_url||avatarFallback(x.profiles?.email))}"><div><b>${esc(money(x.amount))}</b><br><small>${esc(x.profiles?.full_name||x.profiles?.email||x.user_id)} · ${esc(x.reference||'No ref')}</small></div></div><button class="btn primary small" onclick="approve('${x.id}')">Approve</button></div>`).join('')||'<p class="muted">No pending payments.</p>'}
async function loadSettings(){const r=await sb.from('payment_settings').select('*').eq('id',true).single();settings=r.data||{SHOP_name:'',SHOP_logo_url:'',currency_code:'RS',upi_id:'',qr_url:''};if(settings.SHOP_name)localStorage.setItem('SHOP_template_SHOP_name',settings.SHOP_name); if(settings.SHOP_logo_url)localStorage.setItem('SHOP_template_SHOP_logo',settings.SHOP_logo_url);document.getElementById('SHOPName').value=settings.SHOP_name || localStorage.getItem('SHOP_template_SHOP_name') || '';document.getElementById('SHOPLogo').value=settings.SHOP_logo_url||'';document.getElementById('currencyCode').value=settings.currency_code||'RS';document.getElementById('upiId').value=settings.upi_id||'';document.getElementById('qrUrl').value=settings.qr_url||'';document.getElementById('logoPreviewAdmin').innerHTML=settings.SHOP_logo_url?`<img class="settings-logo-preview" src="${esc(settings.SHOP_logo_url)}">`:'';document.getElementById('qrPreviewAdmin').innerHTML=settings.qr_url?`<img class="qr-admin" src="${esc(settings.qr_url)}">`:'';setBrand()}
async function loadOrders(){const r=await sb.from('orders').select('amount,created_at').order('created_at',{ascending:true});orders=r.data||[]}
function renderOverview(){const stock=products.reduce((a,p)=>a+(p.product_keys||[]).filter(k=>k.status==='available').length,0);const pending=document.querySelectorAll('#paymentsAdmin .status.pending').length;document.getElementById('overviewProducts').textContent=products.length;document.getElementById('overviewUsers').textContent=users.length;document.getElementById('overviewStock').textContent=stock;document.getElementById('overviewPending').textContent=pending;renderSalesChart()}
function renderSalesChart(){const now=new Date();const days=[];for(let i=6;i>=0;i--){const d=new Date(now);d.setHours(0,0,0,0);d.setDate(d.getDate()-i);days.push(d)}const vals=days.map(d=>orders.filter(o=>{const x=new Date(o.created_at);return x>=d&&x<new Date(d.getTime()+86400000)}).reduce((s,o)=>s+Number(o.amount||0),0));const total=vals.reduce((a,b)=>a+b,0),max=Math.max(...vals,1);document.getElementById('salesTotal').textContent=money(total);document.getElementById('salesChart').innerHTML=vals.map((v,i)=>`<div class="chart-col"><div class="chart-value">${v?money(v):'—'}</div><div class="chart-track"><div class="chart-bar" style="height:${Math.max(4,(v/max)*100)}%"></div></div><span>${days[i].toLocaleDateString(undefined,{weekday:'short'})}</span></div>`).join('')}
function renderProducts(){document.getElementById('productsAdmin').innerHTML=products.map(p=>`<div class="admin-row-card product-admin-card"><div style="flex:1"><div class="product-admin-title"><b>${esc(p.name)}</b><span class="category-chip">${esc(catLabels[p.category]||p.category)}</span></div><small>${esc(p.description||'No description')}</small><div class="variant-list">${(p.product_variants||[]).sort((a,b)=>a.sort_order-b.sort_order).map(v=>`<div class="variant-row"><span><b>${esc(v.label)}</b></span><span>${esc(money(v.price))}</span><span>${(p.product_keys||[]).filter(k=>k.variant_id===v.id&&k.status==='available').length} available</span></div>`).join('')}</div></div><div class="admin-actions"><button class="btn ghost small" onclick="openProductModal(${p.id})">Edit</button><button class="btn danger-btn small" onclick="deleteProduct(${p.id})">Delete</button></div></div>`).join('')||'<p class="muted">No products yet.</p>'}
function renderKeys(){document.getElementById('keysAdmin').innerHTML=products.map(p=>(p.product_variants||[]).map(v=>{const keys=(p.product_keys||[]).filter(k=>k.variant_id===v.id);return `<div class="admin-row-card"><div><b>${esc(p.name)} · ${esc(v.label)}</b><br><small>${keys.filter(k=>k.status==='available').length} available · ${keys.filter(k=>k.status==='sold').length} sold</small></div><button class="btn primary small" onclick="openKeyModal(${v.id},${p.id})">+ Add keys</button></div>`}).join('')).join('')||'<p class="muted">Create a product and duration first.</p>'}
function openProductModal(id){const p=id?products.find(x=>x.id===id):{name:'',description:'',image_url:'',demo_url:'',category:'nonroot_ff_proxy',active:true,product_variants:[]};document.getElementById('adminModal').innerHTML=`<div class="modal-backdrop" onclick="if(event.target===this)closeAdminModal()"><div class="modal glass"><div class="modal-top"><div><span class="eyebrow">${id?'EDIT PRODUCT':'NEW PRODUCT'}</span><h2>${id?'Update':'Create'} product</h2></div><button class="icon-btn" onclick="closeAdminModal()">×</button></div><div class="form-grid"><label>Title<input id="pName" value="${escAttr(p.name)}"></label><label>Category<select id="pCategory">${Object.entries(catLabels).map(([k,v])=>`<option value="${k}" ${p.category===k?'selected':''}>${v}</option>`).join('')}</select></label></div><label class="textarea-label">Product description<textarea id="pDesc" rows="5" placeholder="Write a clear, premium description of what the customer receives…">${esc(p.description||'')}</textarea></label><div class="form-grid"><label>Product image URL<input id="pImage" value="${escAttr(p.image_url||'')}"></label><label>YouTube demo URL<input id="pDemo" value="${escAttr(p.demo_url||'')}"></label></div><div class="editor-section"><div class="editor-section-head"><div><h3>Durations & prices</h3><p class="muted">Each duration is a separate purchasable option with its own price and key inventory.</p></div><button class="btn ghost small" onclick="addVariantRow()">+ Add duration</button></div><div id="variantEditor">${(p.product_variants||[]).sort((a,b)=>a.sort_order-b.sort_order).map(v=>variantEditorRow(v)).join('')}</div></div><div class="modal-actions"><button class="btn ghost" onclick="closeAdminModal()">Cancel</button><button class="btn primary" onclick="saveProduct(${id||'null'})">Save product</button></div></div></div>`}
function variantEditorRow(v={id:'',label:'',price:'',sort_order:1,active:true}){return `<div class="variant-edit" data-id="${v.id||''}"><input class="vLabel" placeholder="e.g. 1 Day" value="${escAttr(v.label)}"><input class="vPrice" type="number" min="0" step="0.01" placeholder="Price" value="${v.price??''}"><button type="button" class="icon-btn remove-variant" title="Remove duration" onclick="removeVariantEditorRow(this)">×</button></div>`}
function removeVariantEditorRow(btn){btn.parentElement.remove()}
function addVariantRow(){document.getElementById('variantEditor').insertAdjacentHTML('beforeend',variantEditorRow())}
async function saveProduct(id){
  const name=document.getElementById('pName').value.trim();
  if(!name)return alert('Product title is required.');

  const rows=[...document.querySelectorAll('.variant-edit')];
  const variants=[];
  for(let i=0;i<rows.length;i++){
    const label=rows[i].querySelector('.vLabel').value.trim();
    const rawPrice=rows[i].querySelector('.vPrice').value.trim();
    if(!label && !rawPrice) continue;
    const price=Number(rawPrice);
    if(!label) return alert(`Duration ${i+1}: label is required.`);
    if(!Number.isFinite(price) || price<0) return alert(`Duration ${i+1}: enter a valid price.`);
    variants.push({id:Number(rows[i].dataset.id)||null,label,price,sort_order:i+1});
  }
  const payload={
    name,
    description:document.getElementById('pDesc').value.trim(),
    image_url:document.getElementById('pImage').value.trim()||null,
    demo_url:document.getElementById('pDemo').value.trim()||null,
    category:document.getElementById('pCategory').value,
    active:true
  };

  let pid=id;
  if(id){
    const r=await sb.from('products').update(payload).eq('id',id);
    if(r.error)return alert(r.error.message);
  }else{
    const r=await sb.from('products').insert(payload).select().single();
    if(r.error)return alert(r.error.message);
    pid=r.data.id;
  }

  const old=(products.find(x=>x.id===pid)?.product_variants||[]);
  const submittedIds=[];

  for(const v of variants){
    let r;
    if(v.id){
      const belongs=old.some(x=>Number(x.id)===v.id);
      if(!belongs) return alert('Invalid duration reference. Please close and reopen the product editor.');
      r=await sb.from('product_variants')
        .update({label:v.label,price:v.price,sort_order:v.sort_order,active:true})
        .eq('id',v.id).eq('product_id',pid);
      submittedIds.push(v.id);
    }else{
      r=await sb.from('product_variants')
        .insert({product_id:pid,label:v.label,price:v.price,sort_order:v.sort_order,active:true})
        .select('id').single();
      if(!r.error && r.data?.id) submittedIds.push(Number(r.data.id));
    }
    if(r.error){
      if(!id) await sb.from('products').delete().eq('id',pid);
      return alert('Could not save duration: '+r.error.message);
    }
  }

  // Anything removed with × is permanently deleted, not archived/disabled.
  if(id){
    const removed=old.filter(v=>!submittedIds.includes(Number(v.id)));
    for(const v of removed){
      const r=await sb.rpc('admin_delete_variant',{p_variant_id:Number(v.id)});
      if(r.error)return alert('Could not delete duration "'+v.label+'": '+r.error.message);
    }
  }

  closeAdminModal();
  await reloadAll();
}

async function deleteProduct(id){
  const p=products.find(x=>x.id===id);
  if(!p)return alert('Product not found.');
  const confirmed=confirm(`Delete \"${p.name}\" permanently?\n\nThis is only allowed when the product has no existing orders. Products with order history are kept for historical records.`);
  if(!confirmed)return;
  const r=await sb.rpc('admin_delete_product',{p_product_id:id});
  if(r.error){ alert(r.error.message); return; }
  await reloadAll();
  alert('Product deleted successfully.');
}
function openKeyModal(variantId,productId){const p=products.find(x=>x.id===productId),v=p.product_variants.find(x=>x.id===variantId);document.getElementById('adminModal').innerHTML=`<div class="modal-backdrop"><div class="modal glass"><div class="modal-top"><div><span class="eyebrow">KEY INVENTORY</span><h2>${esc(p.name)} · ${esc(v.label)}</h2></div><button class="icon-btn" onclick="closeAdminModal()">×</button></div><p class="muted">Paste one key per line. Customers only receive a key after a successful purchase.</p><textarea id="keyText" rows="10" class="key-textarea" placeholder="KEY-ABC-123\nKEY-DEF-456"></textarea><div class="modal-actions"><button class="btn ghost" onclick="closeAdminModal()">Cancel</button><button class="btn primary" onclick="saveKeys(${variantId},${productId})">Add keys</button></div></div></div>`}
async function saveKeys(variantId,productId){const lines=document.getElementById('keyText').value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);if(!lines.length)return alert('Add at least one key.');const rows=lines.map(secret_key=>({product_id:productId,variant_id:variantId,secret_key,status:'available'}));const r=await sb.from('product_keys').insert(rows);if(r.error)return alert(r.error.message);closeAdminModal();await reloadAll()}
async function approve(id){const r=await sb.rpc('approve_topup',{p_request_id:id});if(r.error)return alert(r.error.message);await reloadAll()}
async function rejectReq(id){const r=await sb.from('topup_requests').update({status:'rejected',reviewed_at:new Date().toISOString()}).eq('id',id).eq('status','pending');if(r.error)alert(r.error.message);else reloadAll()}
async function uploadSHOPAsset(file,type){
  if(!file)return null;
  const {data:{session}}=await sb.auth.getSession();
  if(!session)return null;
  const ext=(file.name.split('.').pop()||'bin').toLowerCase().replace(/[^a-z0-9]/g,'');
  const path=`${type}/${crypto.randomUUID()}.${ext}`;
  const bucket=sb.storage.from('SHOP-assets');
  const up=await bucket.upload(path,file,{upsert:false,contentType:file.type||undefined,cacheControl:'3600'});
  if(up.error)throw up.error;
  const pub=bucket.getPublicUrl(path);
  return pub.data.publicUrl;
}
async function wireAssetUploads(){
  const logo=document.getElementById('SHOPLogoFile'),qr=document.getElementById('qrFile');
  if(logo)logo.addEventListener('change',async()=>{try{const f=logo.files?.[0];if(!f)return;document.getElementById('SHOPLogoUploadMsg').textContent='Uploading…';const url=await uploadSHOPAsset(f,'logo');if(url){document.getElementById('SHOPLogo').value=url;document.getElementById('logoPreviewAdmin').innerHTML=`<img class="settings-logo-preview" src="${esc(url)}">`;document.getElementById('SHOPLogoUploadMsg').textContent='Logo uploaded ✓';}}catch(e){document.getElementById('SHOPLogoUploadMsg').textContent=e.message||'Upload failed';}});
  if(qr)qr.addEventListener('change',async()=>{try{const f=qr.files?.[0];if(!f)return;document.getElementById('qrUploadMsg').textContent='Uploading…';const url=await uploadSHOPAsset(f,'qr');if(url){document.getElementById('qrUrl').value=url;document.getElementById('qrPreviewAdmin').innerHTML=`<img class="qr-admin" src="${esc(url)}">`;document.getElementById('qrUploadMsg').textContent='QR uploaded ✓';}}catch(e){document.getElementById('qrUploadMsg').textContent=e.message||'Upload failed';}});
}
async function saveSettings(){const SHOP_name=document.getElementById('SHOPName').value.trim().slice(0,80)||'Your SHOP',SHOP_logo_url=document.getElementById('SHOPLogo').value.trim()||null,currency_code=document.getElementById('currencyCode').value.trim().toUpperCase().slice(0,8)||'RS',upi_id=document.getElementById('upiId').value.trim(),qr_url=document.getElementById('qrUrl').value.trim();localStorage.setItem('SHOP_template_SHOP_name',SHOP_name); if(SHOP_logo_url)localStorage.setItem('SHOP_template_SHOP_logo',SHOP_logo_url);const r=await sb.from('payment_settings').upsert({id:true,SHOP_name,SHOP_logo_url,currency_code,upi_id,qr_url,updated_at:new Date().toISOString()});if(r.error)return document.getElementById('settingsMsg').textContent=r.error.message;document.getElementById('settingsMsg').textContent='Configuration saved.';await loadSettings()}
function closeAdminModal(){document.getElementById('adminModal').innerHTML=''}async function signOut(){await sb.auth.signOut();location.href='index.html'}function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}function escAttr(s){return esc(s).replace(/`/g,'&#096;')}
init();
