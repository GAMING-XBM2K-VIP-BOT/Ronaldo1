let signup=false;
function setMode(v){
  signup=v;
  document.getElementById('loginTab').classList.toggle('active',!signup);
  document.getElementById('signupTab').classList.toggle('active',signup);
  document.getElementById('confirmWrap').style.display=signup?'block':'none';
  document.getElementById('forgotLink').style.display=signup?'none':'inline-flex';
  document.getElementById('submitBtn').innerHTML=signup?'Create account <span>→</span>':'Login <span>→</span>';
  document.getElementById('msg').textContent='';
}
async function submitAuth(e){
  e.preventDefault();
  const email=document.getElementById('email').value.trim(), pass=document.getElementById('password').value;
  if(signup&&pass!==document.getElementById('confirm').value)return msg('Passwords do not match.');
  msg('Please wait…');
  const r=signup?await sb.auth.signUp({email,password:pass}):await sb.auth.signInWithPassword({email,password:pass});
  if(r.error)return msg(r.error.message);
  if(signup){
    // Supabase can intentionally return a successful response with no identities
    // for an email that already exists, depending on Auth settings.
    if(!r.data?.user || (Array.isArray(r.data.user.identities) && r.data.user.identities.length===0)){
      return msg('This email is already registered. Please log in or use Forgot password.');
    }
    msg(r.data.session ? 'Account created successfully.' : 'Account created. Check your email if confirmation is enabled, then log in.');
    setMode(false)
  }
  else location.href='dashboard.html';
}
async function forgotPassword(){
  const email=document.getElementById('email').value.trim();
  if(!email)return msg('Enter your email first, then click Forgot password.');
  msg('Sending password reset email…');
  const redirectTo = `${getPublicAppUrl()}/update-password.html`;
  const r=await sb.auth.resetPasswordForEmail(email, { redirectTo });
  if(r.error)return msg(r.error.message);
  msg('Reset email sent. Check your inbox and spam folder.');
}
function msg(x){document.getElementById('msg').textContent=x}
document.getElementById('authForm').addEventListener('submit',submitAuth);
const params=new URLSearchParams(location.search);setMode(params.get('mode')==='register');


async function loadAuthBranding(){
  const cachedName=localStorage.getItem('SHOP_template_SHOP_name') || '';
  const cachedLogo=localStorage.getItem('SHOP_template_SHOP_logo') || '';
  applyAuthBranding(cachedName,cachedLogo);
  try{
    const r=await sb.from('payment_settings').select('SHOP_name,SHOP_logo_url').eq('id',true).single();
    if(r.data){
      const name=(r.data.SHOP_name||'').trim();
      const logo=(r.data.SHOP_logo_url||'').trim();
      if(name) localStorage.setItem('SHOP_template_SHOP_name',name);
      if(logo) localStorage.setItem('SHOP_template_SHOP_logo',logo);
      applyAuthBranding(name||cachedName,logo||cachedLogo);
    }
  }catch(e){}
}
function applyAuthBranding(name,logo){
  if(name){ document.title=name+' — Account'; document.querySelectorAll('.brand-name').forEach(el=>el.textContent=name); }
  if(logo){ document.querySelectorAll('.brand-mark').forEach(el=>el.innerHTML=`<img src="${esc(logo)}" alt="SHOP logo" class="brand-logo auth-logo">`); }
}
function esc(v){const d=document.createElement('div');d.textContent=v;return d.innerHTML}
loadAuthBranding();
