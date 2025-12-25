// Frontend-only static site app
// Users (obfuscated passwords):
// chillguy -> password123 (obf: HgQcHVoOAAdQVlY=)
// admin -> chillguy (obf: DQ0GAkEGBw0=)

(function(){
  'use strict';

  // --- DATA: posts and users ---
  const posts = [
    {id:1,title:'Pixel Pilots',user:'admin',excerpt:'A scrolling shooter that defined weekend arcades. Retro synth and 8-bit explosions.'},
    {id:2,title:'Dungeon Blocks',user:'chillguy',excerpt:'Tile-based puzzling with a joystick — gravity and tiles, pixel-perfect thrills.'},
    {id:3,title:'Neon Racers',user:'admin',excerpt:'Top-down racers with neon roads and turbo boosts. Drift and win the championship.'},
    {id:4,title:'Castle Quest',user:'chillguy',excerpt:'Epic platforming with limited lives and big bosses. Save the pixel kingdom.'},
    {id:5,title:'Arcade Basketball',user:'admin',excerpt:'One-button hoops, endless high-score chasing in smoky arcades.'}
  ];

  // encrypted (XOR+base64) password blobs (obfuscated)
  const obf = {
    'chillguy':'HgQcHVoOAAdQVlY=',
  'admin':'DQ0GAkEGBxo='
  };

  // obfuscated flags (XOR+base64 with same key)
  const obfFlags = {
    admin: 'KCkuKVYAFg4ICkhOBAgJHAoCB14EFk4JAQlBRhwcDw0S',
    chillguy: 'KCkuKVYCGgoNCAJYEkgaAQgfHEIMGxAEABg='
  };

  // --- Helpers ---
  function b64ToBytes(b64){
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i);
    return arr;
  }

  function hexToStr(hex){
    // remove non-hex
    hex = (hex||'').replace(/[^0-9a-fA-F]/g,'');
    let out='';
    for(let i=0;i<hex.length;i+=2){
      out += String.fromCharCode(parseInt(hex.substr(i,2),16));
    }
    return out;
  }

  function getKeyFromCSS(){
    // Reads the CSS custom property that contains hex of the key
    const css = getComputedStyle(document.documentElement).getPropertyValue('--secret-hex') || '';
    return hexToStr(css);
  }

  function xorDecryptBase64(b64, keyStr){
    const data = b64ToBytes(b64);
    const key = new TextEncoder().encode(keyStr);
    const out = new Uint8Array(data.length);
    for(let i=0;i<data.length;i++){
      out[i] = data[i] ^ key[i % key.length];
    }
    return new TextDecoder().decode(out);
  }

  // --- Auth emulation (/api/login, /api/logout) ---
  const originalFetch = window.fetch.bind(window);
  window.fetch = async function(input, init){
    const url = (typeof input === 'string') ? input : input.url;
    try{
      // normalize pathname and query
      let parsed = null;
      try{ parsed = new URL(url, location.href); }catch(e){ parsed = null; }
      const pathname = parsed ? parsed.pathname : url;

      if(pathname.endsWith('/api/login')){
        // Support GET (credentials in query) and POST (JSON body)
        let username = '';
        let password = '';
        if(init && init.method && init.method.toUpperCase() === 'GET'){
          if(parsed){ username = parsed.searchParams.get('username') || ''; password = parsed.searchParams.get('password') || ''; }
        }
        if((!username || !password) && init && init.body){
          try{ const body = JSON.parse(init.body); username = body.username || username; password = body.password || password; }catch(e){}
        }

        const key = getKeyFromCSS();
        const stored = obf[username];
        await delay(150); // fake latency
        if(!stored) return fakeResponse(403,{ok:false,msg:'Unknown user'});
        const real = xorDecryptBase64(stored, key);
        if(password === real){
          // success
          const token = btoa(username + ':' + Date.now());
          localStorage.setItem('session', JSON.stringify({user:username,token}));
          return fakeResponse(200,{ok:true,user:username,token});
        } else {
          return fakeResponse(401,{ok:false,msg:'Invalid credentials'});
        }
      }

      if(pathname.endsWith('/api/logout')){
        localStorage.removeItem('session');
        await delay(80);
        return fakeResponse(200,{ok:true});
      }
    }catch(e){
      return fakeResponse(500,{ok:false,msg:'error'});
    }
    // otherwise passthrough
    return originalFetch(input, init);
  };

  function fakeResponse(status,json){
    return new Response(JSON.stringify(json),{
      status:status,
      headers:{'Content-Type':'application/json'}
    });
  }

  function delay(ms){return new Promise(r=>setTimeout(r,ms));}

  // --- UI rendering and routing ---
  const el = {
    posts: document.getElementById('posts'),
    loginForm: document.getElementById('login-form'),
    username: document.getElementById('username'),
    password: document.getElementById('password'),
    loginMsg: document.getElementById('login-msg'),
    logoutBtn: document.getElementById('logout-btn'),
    adminSection: document.getElementById('admin'),
    adminMsg: document.getElementById('admin-msg'),
    adminControls: document.getElementById('admin-controls')
  };

  function renderPosts(){
    el.posts.innerHTML = '';
    for(const p of posts){
      const card = document.createElement('article');
      card.className = 'post';
      card.innerHTML = `<h3>${escapeHtml(p.title)}</h3>
        <div class="meta">by <strong>${escapeHtml(p.user)}</strong></div>
        <div class="excerpt">${escapeHtml(p.excerpt)}</div>`;
      el.posts.appendChild(card);
    }
  }

  // populate visible obfuscated blobs on page (before login they remain obfuscated)
  function populateObfuscatedFlags(){
    const a = document.getElementById('obf-admin');
    const c = document.getElementById('obf-chill');
    if(a) a.textContent = obfFlags.admin;
    if(c) c.textContent = obfFlags.chillguy;
  }

  function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  async function handleLogin(e){
    e && e.preventDefault();
    const username = el.username.value.trim();
    const password = el.password.value;
    el.loginMsg.textContent = 'Signing in...';
    try{
      // Use GET method with credentials in query string per new API requirement
      const q = `?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
      const res = await fetch('/api/login' + q, { method: 'GET' });
      const j = await res.json();
      if(res.ok){
        el.loginMsg.textContent = `Signed in as ${j.user}`;
        renderAdminArea();
      } else {
        el.loginMsg.textContent = j.msg || 'Sign in failed';
      }
    }catch(err){ el.loginMsg.textContent = 'Network error'; }
  }

  async function handleLogout(){
    await fetch('/api/logout',{method:'POST'});
    el.loginMsg.textContent = 'Logged out';
    renderAdminArea();
  }

  function currentSession(){
    return JSON.parse(localStorage.getItem('session')||'null');
  }

  function renderAdminArea(){
    const s = currentSession();
    if(!s){
      el.adminMsg.textContent = 'Please login to view admin content.';
      el.adminControls.classList.add('hidden');
      return;
    }
    if(s.user === 'admin'){
      el.adminMsg.textContent = 'Administrator access granted.';
      el.adminControls.classList.remove('hidden');
      // reveal admin flag
      const key = getKeyFromCSS();
      const flag = xorDecryptBase64(obfFlags.admin, key);
      const elFlag = document.getElementById('flag-admin-decrypted');
      if(elFlag) elFlag.textContent = flag;
    } else if(s.user === 'chillguy'){
      el.adminMsg.innerHTML = 'You are signed in as <strong>chillguy</strong>.';
      // reveal chillguy flag in admin message
      const key = getKeyFromCSS();
      const flag = xorDecryptBase64(obfFlags.chillguy, key);
      const p = document.createElement('div');
      p.className = 'hint';
      p.textContent = 'Your flag: ' + flag + ' — Hint: the admin password is already on this site.';
      // replace existing hint only once
      if(!el.adminMsg.dataset.hinted){
        el.adminMsg.appendChild(p);
        el.adminMsg.dataset.hinted = '1';
      }
      el.adminControls.classList.add('hidden');
      // small additional hint element visible only to chillguy
      const hint = document.createElement('div');
      hint.className = 'hint';
      hint.innerHTML = 'Hint: check the site assets and styles — something hex-encoded hides the key.';
      if(!el.adminMsg.dataset.hinted2){
        el.adminMsg.appendChild(hint);
        el.adminMsg.dataset.hinted2 = '1';
      }
    } else {
      el.adminMsg.textContent = 'You do not have admin privileges.';
      el.adminControls.classList.add('hidden');
    }
  }

  // --- Small router for hash nav ---
  function showSection(id){
    document.querySelectorAll('main .panel').forEach(p=>p.classList.add('hidden'));
    const elsec = document.getElementById(id);
    if(elsec) elsec.classList.remove('hidden');
    // focus small behavior
  }

  // --- Init ---
  document.getElementById('nav-home').addEventListener('click',()=>showSection('home'));
  document.getElementById('nav-admin').addEventListener('click',()=>{
    showSection('admin'); renderAdminArea();
  });
  document.getElementById('nav-login').addEventListener('click',()=>showSection('login'));
  el.loginForm.addEventListener('submit', handleLogin);
  el.logoutBtn.addEventListener('click', handleLogout);

  renderPosts();
  populateObfuscatedFlags();
  // default view
  showSection('home');
  renderAdminArea();

  // --- Expose debug helpers (not needed for use) ---
  window._app = {posts, obf, getKeyFromCSS, xorDecryptBase64};

})();
