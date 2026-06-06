const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

const PORT = process.env.PORT || 3000;
const DATA = process.env.DATA_DIR || '/var/lib/fileupshare';

const fp = (p) => path.join(DATA, p);

const readJSON = (name, fallback) => {
  try { return JSON.parse(fs.readFileSync(fp(name), 'utf8')); } catch { return fallback; }
};

const writeJSON = (name, data) => {
  try { fs.mkdirSync(path.dirname(fp(name)), { recursive: true }); fs.writeFileSync(fp(name), JSON.stringify(data, null, 2)); } catch (e) { console.error('Write error:', name, e.message); }
};

const hash = (s) => crypto.createHash('sha256').update(String(s || '')).digest('hex');
const genId = () => crypto.randomBytes(6).toString('hex');

const defSettings = {
  name: 'FileUpShare', logo: '', quotaEnabled: false, quotaValue: 10, quotaUnit: 'GB',
  adText: '', encryptFiles: false, sharePasswordEnabled: false, sharePassword: '',
  uploadPasswordEnabled: false, uploadPassword: '', hideLifetimeOnPage: false, adEnabled: true,
  pageTheme: 'default', useCustomTime: true, customDate: '', customTime: '', timezone: 'Europe/Moscow',
  uiScale: 'default', headerScale: 'default', panelTheme: 'dark', stealthEnabled: false,
  storagePath: path.join(DATA, 'shares'), receivedPath: path.join(DATA, 'received'),
  botPollInterval: 3, botPollUnit: 'sec', accessDomain: '', accessPort: 3000, accessSSL: false, accessMode: 'ip'
};

let settings = { ...defSettings, ...readJSON('settings.json', {}) };
let auth = readJSON('auth.json', { firstRun: true, user: '', passHash: '' });
let shares = readJSON('shares.json', []);
let uploads = readJSON('uploads.json', []);
let received = readJSON('received.json', []);
let session = null;
let fails = 0;
let lockUntil = 0;

const getStats = () => {
  try {
    const t = os.totalmem();
    const fr = os.freemem();
    const cpus = os.cpus();
    let totalDisk = 51200;
    try { const { execSync } = require('child_process'); totalDisk = parseInt(execSync('df -m / --output=avail 2>/dev/null | tail -1').toString().trim()) || 51200; } catch {}
    return {
      filesInShare: shares.length, uploadPages: uploads.length, receivedFiles: received.length,
      usedSpaceMB: 0, totalSpaceMB: totalDisk,
      cpu: { model: (cpus[0] || {}).model || 'Unknown', cores: cpus.length, usage: 0 },
      ram: { total: +(t / 1073741824).toFixed(2), used: +((t - fr) / 1073741824).toFixed(2), free: +(fr / 1073741824).toFixed(2) },
      ip: (Object.values(os.networkInterfaces()).flat().filter(i => i && !i.internal && i.family === 'IPv4')[0] || {}).address || '127.0.0.1', hostname: os.hostname()
    };
  } catch {
    return { filesInShare: 0, uploadPages: 0, receivedFiles: 0, usedSpaceMB: 0, totalSpaceMB: 51200, cpu: {}, ram: {}, ip: '127.0.0.1', hostname: '' };
  }
};

const parseBody = (req) => new Promise((resolve) => {
  let d = '';
  req.on('data', (c) => { d += c; if (d.length > 50e6) { d = ''; req.destroy(); } });
  req.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve({}); } });
  req.on('error', () => resolve({}));
});

const json = (res, data) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)); };

const server = http.createServer(async (req, res) => {
  const url = (req.url || '').split('?')[0];
  const method = req.method || 'GET';

  try {
    if (url === '/api/state' && method === 'GET') {
      return json(res, { auth: { firstRun: !auth.passHash, loggedIn: !!session }, settings, stats: getStats(), shares, uploads, received, stealth: fs.existsSync(fp('stealth.lock')) });
    }

    if (url === '/api/register' && method === 'POST') {
      const b = await parseBody(req);
      if (!b.user || !b.pass) return json(res, { ok: false, error: 'Empty data' });
      auth = { user: String(b.user), passHash: hash(b.pass) };
      writeJSON('auth.json', auth);
      session = genId();
      return json(res, { ok: true });
    }

    if (url === '/api/login' && method === 'POST') {
      if (Date.now() < lockUntil) return json(res, { ok: false, locked: true, sec: Math.ceil((lockUntil - Date.now()) / 1000) });
      const b = await parseBody(req);
      if (String(b.user) === auth.user && hash(b.pass) === auth.passHash) { session = genId(); fails = 0; return json(res, { ok: true }); }
      fails++;
      if (fails >= 3) { lockUntil = Date.now() + 300000; fails = 0; return json(res, { ok: false, locked: true, sec: 300 }); }
      return json(res, { ok: false });
    }

    if (url === '/api/logout' && method === 'POST') { session = null; return json(res, { ok: true }); }

    if (url === '/api/settings' && method === 'PATCH') { const b = await parseBody(req); settings = { ...settings, ...b }; writeJSON('settings.json', settings); return json(res, settings); }

    if (url === '/api/credentials' && method === 'POST') { const b = await parseBody(req); if (b.login) auth.user = String(b.login); if (b.pass) auth.passHash = hash(b.pass); writeJSON('auth.json', auth); session = null; return json(res, { ok: true }); }

    if (url === '/api/shares' && method === 'POST') { const b = await parseBody(req); b.id = b.id || genId(); b.createdAt = b.createdAt || Date.now(); shares.unshift(b); writeJSON('shares.json', shares); return json(res, { shares }); }

    if (url.match(/^\/api\/shares\//) && method === 'DELETE') { const sid = url.split('/').pop(); shares = shares.filter(s => s.id !== sid); writeJSON('shares.json', shares); return json(res, { shares }); }

    if (url === '/api/uploads' && method === 'POST') { const b = await parseBody(req); b.id = b.id || genId(); b.createdAt = b.createdAt || Date.now(); uploads.unshift(b); writeJSON('uploads.json', uploads); return json(res, { uploads }); }

    if (url.match(/^\/api\/uploads\//) && method === 'DELETE') { const uid = url.split('/').pop(); uploads = uploads.filter(u => u.id !== uid); writeJSON('uploads.json', uploads); return json(res, { uploads }); }

    if (url.match(/^\/api\/received\//) && method === 'DELETE') { const rid = url.split('/').pop(); received = received.filter(r => r.id !== rid); writeJSON('received.json', received); return json(res, { received }); }

    if (url === '/api/stealth' && method === 'POST') { const b = await parseBody(req); try { if (b.on) fs.writeFileSync(fp('stealth.lock'), '1'); else fs.unlinkSync(fp('stealth.lock')); } catch {} return json(res, { ok: true }); }

    if (url.match(/^\/api\/public\/share\//) && method === 'GET') {
      const encoded = url.split('/').pop();
      try {
        const sid = Buffer.from(encoded, 'base64').toString();
        const share = shares.find(s => s.id === sid);
        if (share) return json(res, { share, settings: { name: settings.name, logo: settings.logo, pageTheme: settings.pageTheme, adEnabled: settings.adEnabled, adText: settings.adText, hideLifetimeOnPage: settings.hideLifetimeOnPage, sharePasswordEnabled: settings.sharePasswordEnabled, sharePassword: settings.sharePassword } });
      } catch {}
      res.statusCode = 404;
      return json(res, { error: 'not found' });
    }

    if (url.match(/^\/api\/public\/upload\//) && method === 'GET') {
      const encoded = url.split('/').pop();
      try {
        const uid = Buffer.from(encoded, 'base64').toString();
        const upload = uploads.find(u => u.id === uid);
        if (upload) return json(res, { upload, settings: { name: settings.name, logo: settings.logo, pageTheme: settings.pageTheme, adEnabled: settings.adEnabled, adText: settings.adText, hideLifetimeOnPage: settings.hideLifetimeOnPage, uploadPasswordEnabled: settings.uploadPasswordEnabled, uploadPassword: settings.uploadPassword } });
      } catch {}
      res.statusCode = 404;
      return json(res, { error: 'not found' });
    }

    res.statusCode = 404;
    json(res, { error: 'not found' });
  } catch (e) {
    console.error('API error:', e.message);
    res.statusCode = 500;
    json(res, { error: 'internal error' });
  }
});

try { fs.mkdirSync(DATA, { recursive: true }); } catch {}
try { fs.mkdirSync(settings.storagePath, { recursive: true }); } catch {}
try { fs.mkdirSync(settings.receivedPath, { recursive: true }); } catch {}

server.listen(PORT, '0.0.0.0', () => { console.log('FileUpShare API on port ' + PORT); });

process.on('uncaughtException', (e) => { console.error('Uncaught:', e.message); });
process.on('unhandledRejection', (e) => { console.error('Unhandled:', e); });
