const fs = require('fs');
const path = require('path');

function fail(msg){ console.error('ERROR:', msg); process.exitCode = 2; }

try{
  const root = path.resolve(__dirname, '..');
  const cssPath = path.join(root, 'css', 'styles.css');
  const jsPath = path.join(root, 'js', 'app.js');

  if(!fs.existsSync(cssPath)) fail('styles.css not found at ' + cssPath);
  if(!fs.existsSync(jsPath)) fail('app.js not found at ' + jsPath);

  const css = fs.readFileSync(cssPath, 'utf8');
  const js = fs.readFileSync(jsPath, 'utf8');

  // extract --secret-hex: "..."
  const hexMatch = css.match(/--secret-hex:\s*"([0-9a-fA-F]+)"/);
  if(!hexMatch) fail('secret hex not found in CSS');
  const secretHex = hexMatch[1];
  console.log('secretHex:', secretHex);

  function hexToStr(hex){
    return hex.replace(/[^0-9a-fA-F]/g,'').match(/.{1,2}/g).map(h=>String.fromCharCode(parseInt(h,16))).join('');
  }

  const key = hexToStr(secretHex);
  console.log('derived key:', JSON.stringify(key));

  // extract obf admin blob
  const obfMatch = js.match(/['"]admin['"]\s*:\s*['"]([^'"\n]+)['"]/);
  if(!obfMatch) fail('admin obf blob not found in js/app.js');
  const b64 = obfMatch[1];
  console.log('admin blob (base64):', b64);

  console.log('admin blob (hex):', Buffer.from(b64,'base64').toString('hex'));

  const data = Buffer.from(b64, 'base64');
  const keyBuf = Buffer.from(key, 'utf8');
  const out = Buffer.allocUnsafe(data.length);
  for(let i=0;i<data.length;i++) out[i] = data[i] ^ keyBuf[i % keyBuf.length];

  const password = out.toString('utf8');
  console.log('Decrypted admin password:', JSON.stringify(password));

  const expected = 'chillguy';
  if(password === expected){
    console.log('OK — decrypted password matches expected value:', expected);
    process.exitCode = 0;
  } else {
    console.log('MISMATCH — decrypted password does NOT match expected.');
    console.log('Expected:', expected);
    process.exitCode = 1;
  }

  // Also attempt to decrypt chillguy blob if present
  const chillMatch = js.match(/['"]chillguy['"]\s*:\s*['"]([^'"\n]+)['"]/);
  if(chillMatch){
    const c64 = chillMatch[1];
    const cdata = Buffer.from(c64,'base64');
    const cout = Buffer.allocUnsafe(cdata.length);
    for(let i=0;i<cdata.length;i++) cout[i] = cdata[i] ^ Buffer.from(key)[i % Buffer.from(key).length];
    console.log('chillguy blob (base64):', c64);
    console.log('chillguy decrypted:', JSON.stringify(cout.toString('utf8')));
  }

}catch(e){
  console.error('Exception during check:', e && e.stack || e);
  process.exitCode = 2;
}
