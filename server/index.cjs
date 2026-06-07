const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const os = require('os');
const { execSync } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../data');
const SHARES_DIR = path.join(DATA_DIR, 'shares');
const RECEIVED_DIR = path.join(DATA_DIR, 'received');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const CREDENTIALS_FILE = path.join(DATA_DIR, '.credentials');
const SESSIONS_FILE = path.join(DATA_DIR, '.sessions');
const SESSION_DURATION = 6 * 60 * 60 * 1000;

[SHARES_DIR, RECEIVED_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const defaultConfig = {
  name: 'FileUpShare',
  logo: '',
  panelTheme: 'dark',
  pageTheme: 'default',
  uiScale: 'default',
  headerScale: 'default',
  quotaEnabled: false,
  quotaValue: 10,
  quotaUnit: 'GB',
  adEnabled: true,
  adText: '',
  hideLifetimeOnPage: false,
  encryptFiles: false,
  sharePasswordEnabled: false,
  sharePassword: '',
  uploadPasswordEnabled: false,
  uploadPassword: '',
  stealthEnabled: false,
  storagePath: SHARES_DIR,
  receivedPath: RECEIVED_DIR,
  botEnabled: false,
  botToken: '',
  botChatId: '',
  botPollInterval: 3,
  botPollUnit: 'sec',
  timezone: 'Europe/Moscow',
};

let config = { ...defaultConfig };
let shares = [];
let uploads = [];
let received = [];
let logs = [];
let sessions = {};
let lastCpuInfo = null;

function loadData() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      config = { ...defaultConfig, ...raw.config };
      shares = raw.shares || [];
      uploads = raw.uploads || [];
      received = raw.received || [];
      logs = raw.logs || [];
    }
  } catch (e) { console.error('Load error:', e.message); }
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      sessions = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
    }
  } catch {}
}

function saveData() {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ config, shares, uploads, received, logs }, null, 2));
  } catch (e) { console.error('Save error:', e.message); }
}

function saveSessions() {
  try { fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions)); } catch {}
}

function hashPw(p) {
  return crypto.createHash('sha256').update(p + 'fus_s4lt_k3y').digest('hex');
}

function genToken() {
  return crypto.randomBytes(32).toString('hex');
}

function encodeId(id) {
  return Buffer.from(id).toString('base64').replace(/=/g, '');
}

function decodeId(enc) {
  try { return Buffer.from(enc, 'base64').toString('utf8'); } catch { return null; }
}

function addLog(message, type) {
  type = type || 'info';
  logs.unshift({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), timestamp: Date.now(), message, type });
  if (logs.length > 1000) logs = logs.slice(0, 1000);
  logs = logs.filter(l => l.timestamp > Date.now() - 72 * 3600000);
  saveData();
}

function getDirSize(dir) {
  let total = 0;
  try {
    if (!fs.existsSync(dir)) return 0;
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const full = path.join(dir, item);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) total += getDirSize(full);
      else total += stat.size;
    }
  } catch {}
  return total;
}

function getCpuUsage() {
  const cpus = os.cpus();
  let totalIdle = 0, totalTick = 0;
  cpus.forEach(c => {
    for (const t in c.times) totalTick += c.times[t];
    totalIdle += c.times.idle;
  });
  if (lastCpuInfo) {
    const idleDiff = totalIdle - lastCpuInfo.idle;
    const totalDiff = totalTick - lastCpuInfo.total;
    lastCpuInfo = { idle: totalIdle, total: totalTick };
    if (totalDiff === 0) return 0;
    return Math.round((1 - idleDiff / totalDiff) * 100);
  }
  lastCpuInfo = { idle: totalIdle, total: totalTick };
  return 0;
}

function getDiskSpace() {
  try {
    const out = execSync('df -BM --output=size,avail / 2>/dev/null || df -m / 2>/dev/null').toString();
    const lines = out.trim().split('\n');
    const parts = lines[lines.length - 1].trim().split(/\s+/);
    const total = parseInt(parts[0] || parts[1]) || 51200;
    return total;
  } catch { return 51200; }
}

function getStats() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const cpus = os.cpus();
  const shareBytes = getDirSize(config.storagePath || SHARES_DIR);
  const recvBytes = getDirSize(config.receivedPath || RECEIVED_DIR);
  const totalDiskMB = getDiskSpace();

  return {
    filesInShare: shares.reduce((s, sh) => s + (sh.files ? sh.files.length : 0), 0),
    uploadPages: uploads.filter(u => u.expiresAt > Date.now()).length,
    receivedFiles: received.length,
    usedSpaceMB: Math.round((shareBytes + recvBytes) / (1024 * 1024)),
    totalSpaceMB: totalDiskMB,
    ip: Object.values(os.networkInterfaces()).flat().find(i => i && !i.internal && i.family === 'IPv4')?.address || '127.0.0.1',
    hostname: os.hostname(),
    cpu: (cpus[0] && cpus[0].model) || 'Unknown',
    cpuCores: cpus.length,
    cpuPercent: getCpuUsage(),
    ramTotal: Math.round(totalMem / (1024 * 1024 * 1024) * 10) / 10,
    ramUsed: Math.round(usedMem / (1024 * 1024 * 1024) * 100) / 100,
    ramPercent: Math.round(usedMem / totalMem * 100),
  };
}

function getQuotaBytes() {
  if (!config.quotaEnabled) return Infinity;
  return config.quotaUnit === 'GB' ? config.quotaValue * 1024 * 1024 * 1024 : config.quotaValue * 1024 * 1024;
}

function getCurrentUsageBytes() {
  return getDirSize(config.storagePath || SHARES_DIR) + getDirSize(config.receivedPath || RECEIVED_DIR);
}

function cleanupExpired() {
  const now = Date.now();
  const grace = 24 * 3600000;

  shares = shares.filter(s => {
    if (s.expiresAt + grace < now) {
      if (s.files) {
        s.files.forEach(f => {
          try { fs.unlinkSync(path.join(SHARES_DIR, s.id, f.storedName || f.name)); } catch {}
        });
      }
      try { fs.rmSync(path.join(SHARES_DIR, s.id), { recursive: true, force: true }); } catch {}
      addLog('Автоудаление раздачи: ' + s.title, 'info');
      return false;
    }
    return true;
  });

  const expiredUploadIds = [];
  uploads = uploads.filter(u => {
    if (u.expiresAt + grace < now) {
      expiredUploadIds.push(u.id);
      addLog('Автоудаление загрузки: ' + u.title, 'info');
      return false;
    }
    return true;
  });

  if (expiredUploadIds.length > 0) {
    received = received.filter(r => {
      if (expiredUploadIds.includes(r.uploadId)) {
        try { fs.unlinkSync(path.join(RECEIVED_DIR, r.storedName)); } catch {}
        return false;
      }
      return true;
    });
  }

  saveData();
}

setInterval(cleanupExpired, 600000);
setInterval(getCpuUsage, 2000);
loadData();
cleanupExpired();

app.use(express.json({ limit: '50mb' }));

const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

const shareStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const sid = req.params.shareId || req.body.shareId || crypto.randomBytes(8).toString('hex');
    const dir = path.join(SHARES_DIR, sid);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    req.shareId = sid;
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, crypto.randomBytes(16).toString('hex') + path.extname(file.originalname));
  }
});

const recvStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(RECEIVED_DIR)) fs.mkdirSync(RECEIVED_DIR, { recursive: true });
    cb(null, RECEIVED_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, crypto.randomBytes(16).toString('hex') + path.extname(file.originalname));
  }
});

const shareUpload = multer({ storage: shareStorage, limits: { fileSize: 10737418240 } });
const recvUpload = multer({ storage: recvStorage, limits: { fileSize: 10737418240 } });

function auth(req, res, next) {
  const t = (req.headers.authorization || '').replace('Bearer ', '');
  if (!t || !sessions[t] || sessions[t].expiresAt < Date.now()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.userSession = sessions[t];
  next();
}

app.get('/api/state', (req, res) => {
  const t = (req.headers.authorization || '').replace('Bearer ', '');
  const hasCreds = fs.existsSync(CREDENTIALS_FILE);
  const ok = t && sessions[t] && sessions[t].expiresAt > Date.now();

  if (config.stealthEnabled && !ok) {
    return res.status(404).send('Not Found');
  }

  res.json({
    auth: { firstRun: !hasCreds, loggedIn: !!ok },
    config: ok ? config : { name: config.name, logo: config.logo },
    stats: ok ? getStats() : null,
    shares: ok ? shares.filter(s => s.expiresAt > Date.now()) : [],
    uploads: ok ? uploads.filter(u => u.expiresAt > Date.now()) : [],
    received: ok ? received : [],
    logs: ok ? logs : [],
  });
});

app.post('/api/register', (req, res) => {
  if (fs.existsSync(CREDENTIALS_FILE)) return res.status(400).json({ error: 'Exists' });
  const { login, password } = req.body;
  if (!login || login.length < 3 || !password || password.length < 4) return res.status(400).json({ error: 'Invalid' });
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify({ login, passwordHash: hashPw(password) }));
  const token = genToken();
  sessions[token] = { login, expiresAt: Date.now() + SESSION_DURATION };
  saveSessions();
  addLog('Создан аккаунт: ' + login, 'success');
  res.json({ ok: true, token });
});

app.post('/api/login', (req, res) => {
  if (!fs.existsSync(CREDENTIALS_FILE)) return res.status(400).json({ error: 'No account' });
  const { login, password } = req.body;
  let creds;
  try { creds = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8')); } catch { return res.status(500).json({ error: 'Read error' }); }
  if (creds.login !== login || creds.passwordHash !== hashPw(password)) {
    addLog('Неудачный вход: ' + login, 'warn');
    return res.status(401).json({ error: 'Invalid' });
  }
  const token = genToken();
  sessions[token] = { login, expiresAt: Date.now() + SESSION_DURATION };
  saveSessions();
  addLog('Вход: ' + login, 'success');
  res.json({ ok: true, token });
});

app.post('/api/logout', auth, (req, res) => {
  const t = (req.headers.authorization || '').replace('Bearer ', '');
  delete sessions[t];
  saveSessions();
  addLog('Выход', 'info');
  res.json({ ok: true });
});

app.post('/api/change-credentials', auth, (req, res) => {
  const { login, password } = req.body;
  if (!login || login.length < 3 || !password || password.length < 4) return res.status(400).json({ error: 'Invalid' });
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify({ login, passwordHash: hashPw(password) }));
  sessions = {};
  saveSessions();
  addLog('Данные входа изменены', 'success');
  res.json({ ok: true });
});

app.patch('/api/config', auth, (req, res) => {
  config = { ...config, ...req.body };
  saveData();
  res.json(config);
});

app.post('/api/shares', auth, (req, res) => {
  const s = req.body;
  s.id = s.id || crypto.randomBytes(8).toString('hex');
  s.link = '/s/' + encodeId(s.id);
  s.createdAt = s.createdAt || Date.now();
  if (config.sharePasswordEnabled && config.sharePassword) {
    s.password = config.sharePassword;
  }
  shares.unshift(s);
  saveData();
  addLog('Раздача: ' + s.title, 'success');
  res.json({ ok: true, share: s });
});

app.post('/api/shares/:shareId/upload', auth, shareUpload.array('files', 50), (req, res) => {
  const quota = getQuotaBytes();
  const used = getCurrentUsageBytes();
  const added = (req.files || []).reduce((s, f) => s + f.size, 0);
  if (used + added > quota) {
    (req.files || []).forEach(f => { try { fs.unlinkSync(f.path); } catch {} });
    return res.status(413).json({ error: 'Quota exceeded' });
  }
  const files = (req.files || []).map(f => ({ name: f.originalname, storedName: f.filename, size: f.size, type: f.mimetype }));
  res.json({ ok: true, shareId: req.shareId, files });
});

app.delete('/api/shares/:id', auth, (req, res) => {
  const s = shares.find(x => x.id === req.params.id);
  if (s) {
    (s.files || []).forEach(f => { try { fs.unlinkSync(path.join(SHARES_DIR, s.id, f.storedName || f.name)); } catch {} });
    try { fs.rmSync(path.join(SHARES_DIR, s.id), { recursive: true, force: true }); } catch {}
    shares = shares.filter(x => x.id !== req.params.id);
    saveData();
    addLog('Удалена раздача: ' + s.title, 'info');
  }
  res.json({ ok: true });
});

app.patch('/api/shares/:id/extend', auth, (req, res) => {
  const s = shares.find(x => x.id === req.params.id);
  if (s) {
    const h = req.body.hours || 24;
    s.expiresAt += h * 3600000;
    saveData();
    addLog('Продлена раздача: ' + s.title + ' +' + h + 'ч', 'info');
  }
  res.json({ ok: true, share: s });
});

app.post('/api/uploads', auth, (req, res) => {
  const u = req.body;
  u.id = u.id || crypto.randomBytes(8).toString('hex');
  u.link = '/u/' + encodeId(u.id);
  u.createdAt = u.createdAt || Date.now();
  u.usedUploads = 0;
  if (config.uploadPasswordEnabled && config.uploadPassword) {
    u.password = config.uploadPassword;
  }
  uploads.unshift(u);
  saveData();
  addLog('Загрузка: ' + u.title, 'success');
  res.json({ ok: true, upload: u });
});

app.delete('/api/uploads/:id', auth, (req, res) => {
  const u = uploads.find(x => x.id === req.params.id);
  if (u) {
    received.filter(r => r.uploadId === u.id).forEach(r => {
      try { fs.unlinkSync(path.join(RECEIVED_DIR, r.storedName)); } catch {}
    });
    received = received.filter(r => r.uploadId !== u.id);
    uploads = uploads.filter(x => x.id !== req.params.id);
    saveData();
    addLog('Удалена загрузка: ' + u.title, 'info');
  }
  res.json({ ok: true });
});

app.patch('/api/uploads/:id/extend', auth, (req, res) => {
  const u = uploads.find(x => x.id === req.params.id);
  if (u) {
    const h = req.body.hours || 24;
    u.expiresAt += h * 3600000;
    saveData();
    addLog('Продлена загрузка: ' + u.title + ' +' + h + 'ч', 'info');
  }
  res.json({ ok: true, upload: u });
});

app.delete('/api/received/:id', auth, (req, res) => {
  const r = received.find(x => x.id === req.params.id);
  if (r) {
    try { fs.unlinkSync(path.join(RECEIVED_DIR, r.storedName)); } catch {}
    received = received.filter(x => x.id !== req.params.id);
    saveData();
    addLog('Удалён файл: ' + r.name, 'info');
  }
  res.json({ ok: true });
});

app.get('/api/check', auth, (req, res) => {
  const results = [];
  results.push({ name: 'Node.js', status: 'ok', message: process.version });
  try {
    execSync('which nginx');
    results.push({ name: 'Nginx', status: 'ok', message: 'Установлен' });
  } catch {
    results.push({ name: 'Nginx', status: 'warn', message: 'Не найден' });
  }
  try {
    const sslDir = '/etc/letsencrypt/live';
    if (fs.existsSync(sslDir) && fs.readdirSync(sslDir).length > 0) {
      results.push({ name: 'SSL', status: 'ok', message: 'Сертификат найден' });
    } else {
      results.push({ name: 'SSL', status: 'warn', message: 'Не настроен' });
    }
  } catch {
    results.push({ name: 'SSL', status: 'warn', message: 'Не проверено' });
  }
  const shareDir = config.storagePath || SHARES_DIR;
  const recvDir = config.receivedPath || RECEIVED_DIR;
  try {
    fs.accessSync(shareDir, fs.constants.W_OK);
    fs.accessSync(recvDir, fs.constants.W_OK);
    results.push({ name: 'Хранилище', status: 'ok', message: 'Доступно для записи' });
  } catch {
    results.push({ name: 'Хранилище', status: 'err', message: 'Нет доступа' });
  }
  if (config.botEnabled && config.botToken) {
    results.push({ name: 'Telegram бот', status: 'ok', message: 'Настроен' });
  } else if (config.botEnabled) {
    results.push({ name: 'Telegram бот', status: 'warn', message: 'Нет токена' });
  } else {
    results.push({ name: 'Telegram бот', status: 'warn', message: 'Отключён' });
  }
  try {
    execSync('ping -c1 -W2 8.8.8.8 2>/dev/null || ping -n 1 -w 2000 8.8.8.8 2>nul');
    results.push({ name: 'Интернет', status: 'ok', message: 'Доступен' });
  } catch {
    results.push({ name: 'Интернет', status: 'err', message: 'Нет связи' });
  }
  res.json({ results });
});

app.get('/api/public/share/:enc', (req, res) => {
  if (config.stealthEnabled) return res.status(404).send('Not Found');
  const id = decodeId(req.params.enc);
  const s = shares.find(x => x.id === id && x.expiresAt > Date.now());
  if (!s) return res.status(404).json({ error: 'Not found' });
  const pub = { ...s };
  if (s.password) {
    pub.hasPassword = true;
    pub.files = [];
    pub.cover = '';
  }
  const cfg = { name: config.name, logo: config.logo, hideLifetimeOnPage: config.hideLifetimeOnPage, adEnabled: config.adEnabled, adText: config.adText, pageTheme: config.pageTheme };
  res.json({ share: pub, config: cfg });
});

app.post('/api/public/share/:enc/verify', (req, res) => {
  const id = decodeId(req.params.enc);
  const s = shares.find(x => x.id === id);
  if (!s) return res.status(404).json({ error: 'Not found' });
  if (s.password === req.body.password) {
    res.json({ ok: true, share: s });
  } else {
    res.status(401).json({ error: 'Wrong password' });
  }
});

app.get('/api/public/upload/:enc', (req, res) => {
  if (config.stealthEnabled) return res.status(404).send('Not Found');
  const id = decodeId(req.params.enc);
  const u = uploads.find(x => x.id === id && x.expiresAt > Date.now());
  if (!u) return res.status(404).json({ error: 'Not found' });
  const pub = { ...u };
  if (u.password) {
    pub.hasPassword = true;
  }
  const cfg = { name: config.name, logo: config.logo, hideLifetimeOnPage: config.hideLifetimeOnPage, adEnabled: config.adEnabled, adText: config.adText, pageTheme: config.pageTheme };
  res.json({ upload: pub, config: cfg });
});

app.post('/api/public/upload/:enc/verify', (req, res) => {
  const id = decodeId(req.params.enc);
  const u = uploads.find(x => x.id === id);
  if (!u) return res.status(404).json({ error: 'Not found' });
  if (u.password === req.body.password) {
    res.json({ ok: true, upload: u });
  } else {
    res.status(401).json({ error: 'Wrong password' });
  }
});

app.post('/api/public/upload/:enc/submit', recvUpload.single('file'), (req, res) => {
  const id = decodeId(req.params.enc);
  const u = uploads.find(x => x.id === id && x.expiresAt > Date.now());
  if (!u) {
    if (req.file) try { fs.unlinkSync(req.file.path); } catch {}
    return res.status(404).json({ error: 'Not found' });
  }
  if (u.password && req.body.password !== u.password) {
    if (req.file) try { fs.unlinkSync(req.file.path); } catch {}
    return res.status(401).json({ error: 'Wrong password' });
  }
  const quota = getQuotaBytes();
  const used = getCurrentUsageBytes();
  if (req.file && used + req.file.size > quota) {
    try { fs.unlinkSync(req.file.path); } catch {}
    return res.status(413).json({ error: 'Quota exceeded' });
  }
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const entry = {
    id: crypto.randomBytes(8).toString('hex'),
    name: req.file.originalname,
    storedName: req.file.filename,
    size: req.file.size,
    type: req.file.mimetype,
    receivedAt: Date.now(),
    uploadId: u.id,
    source: u.title,
    comment: (req.body.comment || '').slice(0, 100),
  };
  received.unshift(entry);
  u.usedUploads = (u.usedUploads || 0) + 1;
  saveData();
  addLog('Принят файл: ' + entry.name + ' (' + u.title + ')', 'success');
  res.json({ ok: true, file: entry });
});

app.get('/api/file/:dir/:filename', (req, res) => {
  let fp = path.join(SHARES_DIR, req.params.dir, req.params.filename);
  if (!fs.existsSync(fp)) {
    fp = path.join(RECEIVED_DIR, req.params.filename);
  }
  if (!fs.existsSync(fp)) return res.status(404).send('Not found');
  res.sendFile(path.resolve(fp));
});

app.get('/api/download/:dir/:filename', (req, res) => {
  let origName = req.params.filename;
  const s = shares.find(x => x.id === req.params.dir);
  if (s) {
    const f = (s.files || []).find(x => x.storedName === req.params.filename);
    if (f) origName = f.name;
  }
  const r = received.find(x => x.storedName === req.params.filename);
  if (r) origName = r.name;

  let fp = path.join(SHARES_DIR, req.params.dir, req.params.filename);
  if (!fs.existsSync(fp)) fp = path.join(RECEIVED_DIR, req.params.filename);
  if (!fs.existsSync(fp)) return res.status(404).send('Not found');
  res.download(path.resolve(fp), origName);
});

app.get('/api/received/:id/download', auth, (req, res) => {
  const r = received.find(x => x.id === req.params.id);
  if (!r) return res.status(404).send('Not found');
  const fp = path.join(RECEIVED_DIR, r.storedName);
  if (!fs.existsSync(fp)) return res.status(404).send('File missing');
  res.download(path.resolve(fp), r.name);
});

app.get('/api/received/:id/view', auth, (req, res) => {
  const r = received.find(x => x.id === req.params.id);
  if (!r) return res.status(404).send('Not found');
  const fp = path.join(RECEIVED_DIR, r.storedName);
  if (!fs.existsSync(fp)) return res.status(404).send('File missing');
  res.sendFile(path.resolve(fp));
});

if (fs.existsSync(distPath)) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log('FileUpShare v1.0.1 running on port ' + PORT);
  addLog('Сервис запущен на порту ' + PORT, 'success');
});
