const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

const PORT = process.env.PORT || 3000;
const DATA = process.env.DATA_DIR || '/var/lib/fileupshare';
const DIST = path.join(__dirname, '..', 'dist');

const f = (p) => path.join(DATA, p);
const read = (p, d) => { try { return JSON.parse(fs.readFileSync(f(p), 'utf8')); } catch { return d; } };
const write = (p, d) => { fs.mkdirSync(path.dirname(f(p)), { recursive: true }); fs.writeFileSync(f(p), JSON.stringify(d)); };

const defaults = {
  name: 'FileUpShare', logo: '', quotaEnabled: false, quotaValue: 10, quotaUnit: 'GB',
  adText: '', encryptFiles: false, sharePasswordEnabled: false, sharePassword: '',
  uploadPasswordEnabled: false, uploadPassword: '', hideLifetimeOnPage: false, adEnabled: true,
  pageTheme: 'default', useCustomTime: true, customDate: '', customTime: '', timezone: 'Europe/Moscow',
  uiScale: 'default', headerScale: 'default', panelTheme: 'dark', stealthEnabled: false,
  storagePath: '/var/lib/fileupshare/shares', receivedPath: '/var/lib/fileupshare/received',
  botPollInterval: 3, botPollUnit: 'sec'
};

let settings = { ...defaults, ...read('settings.json', {}) };
let auth = read('auth.json', { firstRun: true, user: '', passHash: '' });
let shares = read('shares.json', []);
let uploads = read('uploads.json', []);
let received = read('received.json', []);
let session = null;
let fails = 0;
let lockUntil = 0;

const hash = (s) => crypto.createHash('sha256').update(s).digest('hex');
const id = () => crypto.randomBytes(6).toString('hex');

const getStats = () => {
  const t = os.totalmem();
  const fr = os.freemem();
  const cpus = os.cpus();
  let sharesSize = 0;
  try {
    const walk = (d) => { fs.readdirSync(d, { withFileTypes: true }).forEach(e => { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else sharesSize += fs.statSync(p).size; }); };
    if (fs.existsSync(settings.storagePath)) walk(settings.storagePath);
    if (fs.existsSync(settings.receivedPath)) walk(settings.receivedPath);
  } catch {}
  let totalDisk = 51200;
  try { const { execSync } = require('child_process'); const df = execSync('df -m / --output=size | tail -1').toString().trim(); totalDisk = parseInt(df) || 51200; } catch {}
  return {
    filesInShare: shares.length,
    uploadPages: uploads.length,
    receivedFiles: received.length,
    usedSpaceMB: Math.round(sharesSize / 1024 / 1024),
    totalSpaceMB: totalDisk,
    cpu: { model: cpus[0]?.model || 'Unknown', cores: cpus.length, usage: Math.round(cpus.reduce((a, c) => a + (1 - c.times.idle / Object.values(c.times).reduce((s, v) => s + v, 0)), 0) / cpus.length * 100) },
    ram: { total: Math.round(t / 1024 / 1024 / 1024 * 100) / 100, used: Math.round((t - fr) / 1024 / 1024 / 1024 * 100) / 100, free: Math.round(fr / 1024 / 1024 / 1024 * 100) / 100 },
    ip: Object.values(os.networkInterfaces()).flat().filter(i => i && !i.internal && i.family === 'IPv4')[0]?.address || '127.0.0.1',
    hostname: os.hostname()
  };
};

const body = (req) => new Promise((res) => { let d = ''; req.on('data', c => d += c); req.on('end', () => { try { res(JSON.parse(d)); } catch { res({}); } }); });

const srv = http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];
  const method = req.method;

  res.setHeader('Content-Type', 'application/json');

  if (url === '/api/state' && method === 'GET') {
    return res.end(JSON.stringify({
      auth: { firstRun: auth.firstRun !== false && !auth.passHash, loggedIn: !!session },
      settings, stats: getStats(), shares, uploads, received,
      stealth: fs.existsSync(f('stealth.lock'))
    }));
  }

  if (url === '/api/register' && method === 'POST') {
    const b = await body(req);
    auth = { firstRun: false, user: b.user || 'admin', passHash: hash(b.pass || 'admin') };
    write('auth.json', auth);
    session = id();
    return res.end(JSON.stringify({ ok: true }));
  }

  if (url === '/api/login' && method === 'POST') {
    if (Date.now() < lockUntil) {
      return res.end(JSON.stringify({ ok: false, locked: true, sec: Math.ceil((lockUntil - Date.now()) / 1000) }));
    }
    const b = await body(req);
    if (b.user === auth.user && hash(b.pass) === auth.passHash) {
      session = id(); fails = 0;
      return res.end(JSON.stringify({ ok: true }));
    }
    fails++;
    if (fails >= 3) { lockUntil = Date.now() + 300000; fails = 0; return res.end(JSON.stringify({ ok: false, locked: true, sec: 300 })); }
    return res.end(JSON.stringify({ ok: false }));
  }

  if (url === '/api/logout' && method === 'POST') {
    session = null;
    return res.end(JSON.stringify({ ok: true }));
  }

  if (url === '/api/settings' && method === 'PATCH') {
    const b = await body(req);
    settings = { ...settings, ...b };
    write('settings.json', settings);
    return res.end(JSON.stringify(settings));
  }

  if (url === '/api/credentials' && method === 'POST') {
    const b = await body(req);
    if (b.login) auth.user = b.login;
    if (b.pass) auth.passHash = hash(b.pass);
    write('auth.json', auth);
    session = null;
    return res.end(JSON.stringify({ ok: true }));
  }

  if (url === '/api/shares' && method === 'POST') {
    const b = await body(req);
    b.id = b.id || id();
    b.createdAt = Date.now();
    shares.unshift(b);
    write('shares.json', shares);
    return res.end(JSON.stringify({ shares }));
  }

  if (url.startsWith('/api/shares/') && method === 'DELETE') {
    const sid = url.split('/').pop();
    shares = shares.filter(s => s.id !== sid);
    write('shares.json', shares);
    return res.end(JSON.stringify({ shares }));
  }

  if (url === '/api/uploads' && method === 'POST') {
    const b = await body(req);
    b.id = b.id || id();
    b.createdAt = Date.now();
    uploads.unshift(b);
    write('uploads.json', uploads);
    return res.end(JSON.stringify({ uploads }));
  }

  if (url.startsWith('/api/uploads/') && method === 'DELETE') {
    const uid = url.split('/').pop();
    uploads = uploads.filter(u => u.id !== uid);
    write('uploads.json', uploads);
    return res.end(JSON.stringify({ uploads }));
  }

  if (url.startsWith('/api/received/') && method === 'DELETE') {
    const rid = url.split('/').pop();
    received = received.filter(r => r.id !== rid);
    write('received.json', received);
    return res.end(JSON.stringify({ received }));
  }

  if (url === '/api/stealth' && method === 'POST') {
    const b = await body(req);
    if (b.on) fs.writeFileSync(f('stealth.lock'), '1');
    else try { fs.unlinkSync(f('stealth.lock')); } catch {}
    return res.end(JSON.stringify({ ok: true }));
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'not found' }));
});

fs.mkdirSync(DATA, { recursive: true });
fs.mkdirSync(settings.storagePath, { recursive: true });
fs.mkdirSync(settings.receivedPath, { recursive: true });

srv.listen(PORT, () => {
  console.log('FileUpShare API running on port ' + PORT);
});
