const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const os = require('os');

const app = express();
const PORT = parseInt(process.env.PORT) || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../data');
const SHARES_DIR = path.join(DATA_DIR, 'shares');
const RECEIVED_DIR = path.join(DATA_DIR, 'received');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const CRED_FILE = path.join(DATA_DIR, '.credentials');
const SESS_FILE = path.join(DATA_DIR, '.sessions');
const SESS_TTL = 6 * 3600000;

function mkdirp(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }
mkdirp(SHARES_DIR);
mkdirp(RECEIVED_DIR);

var config = {
  name: 'FileUpShare', logo: '', panelTheme: 'dark', pageTheme: 'default',
  uiScale: 'default', headerScale: 'default',
  quotaEnabled: false, quotaValue: 10, quotaUnit: 'GB',
  adEnabled: true, adText: '', hideLifetimeOnPage: false,
  encryptFiles: false,
  sharePasswordEnabled: false, sharePassword: '',
  uploadPasswordEnabled: false, uploadPassword: '',
  stealthEnabled: false,
  storagePath: SHARES_DIR, receivedPath: RECEIVED_DIR,
  botEnabled: false, botToken: '', botChatId: '',
  botPollInterval: 3, botPollUnit: 'sec',
  botNotifyShare: true, botNotifyUpload: true, botNotifyReceived: true, botNotifyService: true,
  botDailySummary: false, botDailySummaryTime: '09:00',
  timezone: 'Europe/Moscow'
};
var shares = [];
var uploads = [];
var received = [];
var logs = [];
var sessions = {};
var cpuPrev = null;

function tgApi(method, body, cb) {
  if (!config.botToken) return;
  var https = require('https');
  var data = JSON.stringify(body);
  var opts = {
    hostname: 'api.telegram.org',
    path: '/bot' + config.botToken + '/' + method,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
  };
  try {
    var req = https.request(opts, function(resp) {
      var chunks = '';
      resp.on('data', function(c) { chunks += c; });
      resp.on('end', function() { if (cb) try { cb(JSON.parse(chunks)); } catch(e) {} });
    });
    req.on('error', function() {});
    req.write(data);
    req.end();
  } catch (e) {}
}

function botSend(text, buttons) {
  if (!config.botEnabled || !config.botToken || !config.botChatId) return;
  var body = { chat_id: config.botChatId, text: text, parse_mode: 'HTML' };
  if (buttons && buttons.length > 0) {
    body.reply_markup = { inline_keyboard: buttons };
  }
  tgApi('sendMessage', body);
}

function botSendFile(chatId, fileId, storedName) {
  if (!config.botToken) return;
  var r = received.find(function(x) { return x.id === fileId; });
  if (!r) return;
  var fp = path.join(RECEIVED_DIR, r.storedName);
  if (!fs.existsSync(fp)) return;
  var https = require('https');
  var FormData = null;
  try {
    var boundary = '----FUS' + crypto.randomBytes(8).toString('hex');
    var fileData = fs.readFileSync(fp);
    var pre = '--' + boundary + '\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n' + chatId + '\r\n' +
      '--' + boundary + '\r\nContent-Disposition: form-data; name="document"; filename="' + r.name + '"\r\nContent-Type: application/octet-stream\r\n\r\n';
    var post = '\r\n--' + boundary + '--\r\n';
    var body = Buffer.concat([Buffer.from(pre), fileData, Buffer.from(post)]);
    var opts = {
      hostname: 'api.telegram.org',
      path: '/bot' + config.botToken + '/sendDocument',
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data; boundary=' + boundary, 'Content-Length': body.length }
    };
    var req = https.request(opts);
    req.on('error', function() {});
    req.write(body);
    req.end();
  } catch (e) {}
}

function fmtSize(bytes) {
  if (bytes < 1024) return bytes + ' Б';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' КБ';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' МБ';
  return (bytes / 1073741824).toFixed(1) + ' ГБ';
}

function fmtDate(ts) {
  var d = new Date(ts);
  var tz = config.timezone || 'Europe/Moscow';
  try { return d.toLocaleString('ru-RU', { timeZone: tz, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch(e) { return d.toLocaleString('ru-RU'); }
}

function fmtTime(ms) {
  var h = Math.floor(ms / 3600000);
  var m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return h + 'ч ' + m + 'м';
  return m + 'м';
}

function botNotify(type, data) {
  if (type === 'share' && !config.botNotifyShare) return;
  if (type === 'upload' && !config.botNotifyUpload) return;
  if (type === 'received' && !config.botNotifyReceived) return;
  if (type === 'service' && !config.botNotifyService) return;

  var text = '';
  var buttons = [];

  if (type === 'share') {
    var s = data;
    text = '📤  <b>СОЗДАНА НОВАЯ РАЗДАЧА</b>\n\n' +
      '📌  <b>' + s.title + '</b>\n';
    if (s.comment) text += '💬  ' + s.comment + '\n';
    text += '\n';
    text += '📁  Файлов: ' + (s.files ? s.files.length : 0) + '\n';
    text += '⏱  Время жизни: ' + fmtTime(s.expiresAt - s.createdAt) + '\n';
    text += '🔒  Пароль: ' + (s.password ? 'Да' : 'Нет') + '\n';
    text += '👁  Режим: ' + (s.mode === 'view' ? 'Просмотр' : 'Загрузка') + '\n';
    text += '\n🕐  ' + fmtDate(s.createdAt);
    buttons = [[{ text: '🗑 Стереть', callback_data: 'delete_msg' }]];
  }

  if (type === 'upload') {
    var u = data;
    text = '📥  <b>СОЗДАНА НОВАЯ ЗАГРУЗКА</b>\n\n' +
      '📌  <b>' + u.title + '</b>\n';
    if (u.comment) text += '💬  ' + u.comment + '\n';
    text += '\n';
    text += '📁  Макс. файлов: ' + (u.maxFiles || '∞') + '\n';
    text += '⏱  Время жизни: ' + fmtTime(u.expiresAt - u.createdAt) + '\n';
    text += '🔒  Пароль: ' + (u.password ? 'Да' : 'Нет') + '\n';
    text += '\n🕐  ' + fmtDate(u.createdAt);
    buttons = [[{ text: '🗑 Стереть', callback_data: 'delete_msg' }]];
  }

  if (type === 'received') {
    var r = data;
    text = '📎  <b>ПОЛУЧЕН НОВЫЙ ФАЙЛ</b>\n\n' +
      '📄  <b>' + r.name + '</b>\n\n' +
      '📐  Размер: ' + fmtSize(r.size) + '\n' +
      '📂  Тип: ' + r.type + '\n' +
      '📋  Источник: ' + r.source + '\n';
    if (r.comment) text += '💬  Комментарий: ' + r.comment + '\n';
    text += '\n🕐  ' + fmtDate(r.receivedAt);
    buttons = [
      [{ text: '📥 Получить файл', callback_data: 'get_file:' + r.id }],
      [{ text: '🗑 Стереть', callback_data: 'delete_msg' }]
    ];
  }

  if (type === 'service') {
    text = '⚙️  <b>СЛУЖЕБНОЕ</b>\n\n' + data;
    buttons = [[{ text: '🗑 Стереть', callback_data: 'delete_msg' }]];
  }

  botSend(text, buttons);
}

var lastUpdateId = 0;
var botCmdInterval = null;

function startBotCommands() {
  if (botCmdInterval) clearInterval(botCmdInterval);
  botCmdInterval = setInterval(pollBotCommands, 2000);
  pollBotCommands();
}

function pollBotCommands() {
  if (!config.botEnabled || !config.botToken) return;
  tgApi('getUpdates', { offset: lastUpdateId + 1, timeout: 0 }, function(resp) {
    if (!resp || !resp.ok || !resp.result) return;
    resp.result.forEach(function(upd) {
      lastUpdateId = upd.update_id;
      if (upd.callback_query) {
        var cb = upd.callback_query;
        var cbData = cb.data || '';
        if (cbData === 'delete_msg') {
          tgApi('deleteMessage', { chat_id: cb.message.chat.id, message_id: cb.message.message_id });
          tgApi('answerCallbackQuery', { callback_query_id: cb.id, text: 'Удалено' });
        } else if (cbData === 'cmd_hide') {
          if (config.botNotifyService === false) return;
          config.stealthEnabled = true;
          sessions = {}; saveSess(); save();
          tgApi('answerCallbackQuery', { callback_query_id: cb.id, text: '🔒 Панель скрыта' });
          tgApi('editMessageText', {
            chat_id: cb.message.chat.id, message_id: cb.message.message_id,
            text: '🔒  <b>ПАНЕЛЬ СКРЫТА</b>\n\n🛡  Режим невидимки активирован\n🚫  Кнопка входа скрыта\n🔑  Сессии сброшены\n\n🔓  Восстановить: /show\n🖥  Терминал: <code>fileupshare-show</code>\n\n🕐  ' + fmtDate(Date.now()),
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: [[{ text: '🔓 Показать панель', callback_data: 'cmd_show' }], [{ text: '🗑 Стереть', callback_data: 'delete_msg' }]] }
          });
          log('Stealth ON (кнопка)', 'warn');
        } else if (cbData === 'cmd_show') {
          if (config.botNotifyService === false) return;
          config.stealthEnabled = false; save();
          tgApi('answerCallbackQuery', { callback_query_id: cb.id, text: '🔓 Панель восстановлена' });
          tgApi('editMessageText', {
            chat_id: cb.message.chat.id, message_id: cb.message.message_id,
            text: '🔓  <b>ПАНЕЛЬ ВОССТАНОВЛЕНА</b>\n\n✅  Режим невидимки отключён\n🔑  Кнопка входа доступна\n\n🔒  Скрыть: /hide\n🖥  Терминал: <code>fileupshare-hide</code>\n\n🕐  ' + fmtDate(Date.now()),
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: [[{ text: '🔒 Скрыть панель', callback_data: 'cmd_hide' }], [{ text: '🗑 Стереть', callback_data: 'delete_msg' }]] }
          });
          log('Stealth OFF (кнопка)', 'success');
        } else if (cbData.indexOf('get_file:') === 0) {
          var fid = cbData.split(':')[1];
          botSendFile(cb.message.chat.id, fid);
          tgApi('answerCallbackQuery', { callback_query_id: cb.id, text: 'Отправляю файл...' });
        }
      }
      var msg = upd.message || upd.channel_post;
      if (msg && msg.text) {
        var cmd = msg.text.trim().split('@')[0].toLowerCase();
        var chatId = msg.chat.id;
        if (cmd === '/hide') {
          // Проверяем, включена ли функция бота слушать /hide /show
          if (config.botNotifyService === false) return;
          config.stealthEnabled = true;
          sessions = {}; saveSess(); save();
          var hideText = '🔒  <b>ПАНЕЛЬ СКРЫТА</b>\n\n' +
            '🛡  Режим невидимки активирован\n' +
            '🚫  Кнопка входа скрыта на главной странице\n' +
            '🔑  Все активные сессии сброшены\n\n' +
            '📤  Публичные страницы раздач и загрузок\n      продолжают работать\n\n' +
            '🔓  Восстановить: /show\n' +
            '🖥  Терминал: <code>fileupshare-show</code>\n\n' +
            '🕐  ' + fmtDate(Date.now());
          tgApi('sendMessage', { chat_id: chatId, text: hideText, parse_mode: 'HTML',
            reply_markup: { inline_keyboard: [[{ text: '🔓 Показать панель', callback_data: 'cmd_show' }], [{ text: '🗑 Стереть', callback_data: 'delete_msg' }]] }
          });
          log('Stealth ON (бот)', 'warn');
        } else if (cmd === '/show') {
          if (config.botNotifyService === false) return;
          config.stealthEnabled = false; save();
          var showText = '🔓  <b>ПАНЕЛЬ ВОССТАНОВЛЕНА</b>\n\n' +
            '✅  Режим невидимки отключён\n' +
            '🔑  Кнопка входа доступна на главной странице\n\n' +
            '🔒  Скрыть: /hide\n' +
            '🖥  Терминал: <code>fileupshare-hide</code>\n\n' +
            '🕐  ' + fmtDate(Date.now());
          tgApi('sendMessage', { chat_id: chatId, text: showText, parse_mode: 'HTML',
            reply_markup: { inline_keyboard: [[{ text: '🔒 Скрыть панель', callback_data: 'cmd_hide' }], [{ text: '🗑 Стереть', callback_data: 'delete_msg' }]] }
          });
          log('Stealth OFF (бот)', 'success');
        }
      }
    });
  });
}

setTimeout(startBotCommands, 2000);

var lastDailySent = '';

function checkDailySummary() {
  if (!config.botEnabled || !config.botToken || !config.botChatId) return;
  if (!config.botDailySummary) return;
  var tz = config.timezone || 'Europe/Moscow';
  var now = new Date();
  var timeStr;
  try { timeStr = now.toLocaleTimeString('ru-RU', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }); }
  catch(e) { timeStr = now.toTimeString().slice(0,5); }
  var dateKey = now.toISOString().slice(0,10);
  if (timeStr === config.botDailySummaryTime && lastDailySent !== dateKey) {
    lastDailySent = dateKey;
    sendDailySummary();
  }
}

function sendDailySummary() {
  var now = Date.now();
  var dayAgo = now - 86400000;
  var newReceived = received.filter(function(r) { return r.receivedAt > dayAgo; }).length;
  var activeShares = shares.filter(function(s) { return s.expiresAt > now; }).length;
  var activeUploads = uploads.filter(function(u) { return u.expiresAt > now; }).length;
  var shareBytes = dirSize(SHARES_DIR);
  var recvBytes = dirSize(RECEIVED_DIR);
  var totalUsed = shareBytes + recvBytes;
  var diskMB = getDiskMB();
  var usedMB = Math.round(totalUsed / 1048576);
  var freeMB = diskMB - usedMB;
  if (freeMB < 0) freeMB = 0;
  var text = '📊  <b>ЕЖЕДНЕВНЫЙ ОТЧЁТ СЕРВИСА</b>\n\n' +
    '📅  Период: ' + fmtDate(dayAgo) + ' — ' + fmtDate(now) + '\n\n' +
    '📎  Файлов получено за сутки: <b>' + newReceived + '</b>\n' +
    '📤  Активных раздач: <b>' + activeShares + '</b>\n' +
    '📥  Активных загрузок: <b>' + activeUploads + '</b>\n' +
    '📦  Всего принятых файлов: <b>' + received.length + '</b>\n\n' +
    '💾  <b>Хранилище</b>\n' +
    '├  Раздачи: ' + fmtSize(shareBytes) + '\n' +
    '├  Принятые: ' + fmtSize(recvBytes) + '\n' +
    '├  Итого занято: <b>' + fmtSize(totalUsed) + '</b>\n' +
    '└  Свободно: <b>' + (freeMB >= 1024 ? (freeMB / 1024).toFixed(1) + ' ГБ' : freeMB + ' МБ') + '</b>\n\n' +
    '🕐  ' + fmtDate(now);
  var buttons = [[{ text: '🗑 Стереть', callback_data: 'delete_msg' }]];
  botSend(text, buttons);
  log('Ежедневная сводка отправлена', 'info');
}

setInterval(checkDailySummary, 60000);

function load() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      var d = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      config = Object.assign({}, config, d.config || {});
      shares = d.shares || [];
      uploads = d.uploads || [];
      received = d.received || [];
      logs = d.logs || [];
    }
  } catch (e) { console.error('Load err:', e.message); }
  try {
    if (fs.existsSync(SESS_FILE)) sessions = JSON.parse(fs.readFileSync(SESS_FILE, 'utf8'));
  } catch (e) {}
}

function save() {
  try { fs.writeFileSync(CONFIG_FILE, JSON.stringify({ config: config, shares: shares, uploads: uploads, received: received, logs: logs })); } catch (e) {}
}

function saveSess() {
  try { fs.writeFileSync(SESS_FILE, JSON.stringify(sessions)); } catch (e) {}
}

function hash(p) { return crypto.createHash('sha256').update(p + '_fus_salt').digest('hex'); }
function token() { return crypto.randomBytes(32).toString('hex'); }
function eid(id) { return Buffer.from(id).toString('base64').replace(/=/g, ''); }
function did(e) { try { return Buffer.from(e, 'base64').toString('utf8'); } catch (x) { return null; } }

function log(msg, type) {
  logs.unshift({ id: Date.now().toString(36) + Math.random().toString(36).slice(2,6), timestamp: Date.now(), message: msg, type: type || 'info' });
  if (logs.length > 500) logs = logs.slice(0, 500);
  var cut = Date.now() - 259200000;
  logs = logs.filter(function(l) { return l.timestamp > cut; });
  save();
}

function dirSize(d) {
  var t = 0;
  try {
    if (!fs.existsSync(d)) return 0;
    fs.readdirSync(d).forEach(function(f) {
      var fp = path.join(d, f);
      var s = fs.statSync(fp);
      t += s.isDirectory() ? dirSize(fp) : s.size;
    });
  } catch (e) {}
  return t;
}

function cpuUsage() {
  var cpus = os.cpus();
  var idle = 0, total = 0;
  cpus.forEach(function(c) {
    for (var k in c.times) total += c.times[k];
    idle += c.times.idle;
  });
  var pct = 0;
  if (cpuPrev) {
    var di = idle - cpuPrev.idle;
    var dt = total - cpuPrev.total;
    if (dt > 0) pct = Math.round((1 - di / dt) * 100);
  }
  cpuPrev = { idle: idle, total: total };
  return pct;
}

function getDiskMB() {
  try {
    var child = require('child_process');
    var out = child.execSync('df -BM --output=size,avail "' + DATA_DIR + '" 2>/dev/null').toString();
    var lines = out.trim().split('\n');
    if (lines.length >= 2) {
      var parts = lines[1].trim().split(/\s+/);
      var totalMB = parseInt(parts[0]) || 0;
      return totalMB;
    }
  } catch (e) {}
  try {
    var child2 = require('child_process');
    var out2 = child2.execSync('df -m "' + DATA_DIR + '" 2>/dev/null').toString();
    var lines2 = out2.trim().split('\n');
    if (lines2.length >= 2) {
      var parts2 = lines2[1].trim().split(/\s+/);
      return parseInt(parts2[1]) || 0;
    }
  } catch (e2) {}
  return 0;
}

function stats() {
  var tm = os.totalmem(), fm = os.freemem(), um = tm - fm;
  var c = os.cpus();
  var ss = dirSize(SHARES_DIR) + dirSize(RECEIVED_DIR);
  var diskTotal = getDiskMB();
  var ifaces = os.networkInterfaces();
  var ip = '127.0.0.1';
  Object.keys(ifaces).forEach(function(k) {
    (ifaces[k] || []).forEach(function(i) { if (!i.internal && i.family === 'IPv4') ip = i.address; });
  });
  return {
    filesInShare: shares.reduce(function(s, x) { return s + (x.files ? x.files.length : 0); }, 0),
    uploadPages: uploads.filter(function(u) { return u.expiresAt > Date.now(); }).length,
    receivedFiles: received.length,
    usedSpaceMB: Math.round(ss / 1048576),
    totalSpaceMB: diskTotal,
    diskTotalMB: diskTotal,
    ip: ip, hostname: os.hostname(),
    cpu: c[0] ? c[0].model : 'Unknown', cpuCores: c.length, cpuPercent: cpuUsage(),
    ramTotal: Math.round(tm / 1073741824 * 10) / 10,
    ramUsed: Math.round(um / 1073741824 * 100) / 100,
    ramPercent: Math.round(um / tm * 100)
  };
}

function cleanup() {
  var now = Date.now(), grace = 86400000;
  var delUp = [];
  shares = shares.filter(function(s) {
    if (s.expiresAt + grace < now) {
      (s.files || []).forEach(function(f) { try { fs.unlinkSync(path.join(SHARES_DIR, s.id, f.storedName || f.name)); } catch (e) {} });
      try { fs.rmSync(path.join(SHARES_DIR, s.id), { recursive: true, force: true }); } catch (e) {}
      return false;
    }
    // Если срок не истёк но все файлы раздачи удалены с диска вручную — удаляем страницу сразу
    if (s.files && s.files.length > 0) {
      var allMissing = s.files.every(function(f) {
        return !fs.existsSync(path.join(SHARES_DIR, s.id, f.storedName || f.name));
      });
      if (allMissing) {
        try { fs.rmSync(path.join(SHARES_DIR, s.id), { recursive: true, force: true }); } catch (e) {}
        log('Раздача удалена: файлы отсутствуют на диске — ' + s.title, 'warn');
        return false;
      }
    }
    return true;
  });
  uploads = uploads.filter(function(u) {
    if (u.expiresAt + grace < now) { delUp.push(u.id); return false; }
    return true;
  });
  if (delUp.length) {
    received = received.filter(function(r) {
      if (delUp.indexOf(r.uploadId) >= 0) { try { fs.unlinkSync(path.join(RECEIVED_DIR, r.storedName)); } catch (e) {} return false; }
      return true;
    });
  }
  // Удаляем принятые файлы, физически отсутствующие на диске
  received = received.filter(function(r) {
    var fp = path.join(RECEIVED_DIR, r.storedName);
    if (!fs.existsSync(fp)) {
      log('Принятый файл удалён: отсутствует на диске — ' + r.name, 'warn');
      return false;
    }
    return true;
  });
  save();
}

setInterval(cleanup, 600000);
setInterval(cpuUsage, 3000);
load();
cleanup();

app.use(express.json({ limit: '50mb' }));

var distCandidates = [
  path.join(__dirname, '../dist'),
  path.join(__dirname, 'dist'),
  '/opt/fileupshare/dist'
];
var distPath = null;
distCandidates.forEach(function(dp) {
  if (!distPath && fs.existsSync(path.join(dp, 'index.html'))) distPath = dp;
});
if (distPath) {
  app.use(express.static(distPath));
  console.log('Static: ' + distPath);
}

var shareStor = multer.diskStorage({
  destination: function(req, file, cb) {
    var sid = req.params.shareId || crypto.randomBytes(8).toString('hex');
    var dir = path.join(SHARES_DIR, sid);
    mkdirp(dir);
    req.shareId = sid;
    cb(null, dir);
  },
  filename: function(req, file, cb) {
    cb(null, crypto.randomBytes(16).toString('hex') + path.extname(file.originalname));
  }
});
var recvStor = multer.diskStorage({
  destination: function(req, file, cb) { mkdirp(RECEIVED_DIR); cb(null, RECEIVED_DIR); },
  filename: function(req, file, cb) {
    cb(null, crypto.randomBytes(16).toString('hex') + path.extname(file.originalname));
  }
});
var shareUp = multer({ storage: shareStor, limits: { fileSize: 10737418240 } });
var recvUp = multer({ storage: recvStor, limits: { fileSize: 10737418240 } });

function auth(req, res, next) {
  var t = (req.headers.authorization || '').replace('Bearer ', '') || req.query.token || '';
  if (!t || !sessions[t] || sessions[t].expiresAt < Date.now()) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

app.post('/api/stealth', function(req, res) {
  var b = req.body || {};
  if (!b.password || !fs.existsSync(CRED_FILE)) return res.status(401).json({ error: 'Unauthorized' });
  var cred;
  try { cred = JSON.parse(fs.readFileSync(CRED_FILE, 'utf8')); } catch(e) { return res.status(500).json({ error: 'Read error' }); }
  if (cred.passwordHash !== hash(b.password)) return res.status(401).json({ error: 'Wrong password' });
  if (b.action === 'hide') {
    config.stealthEnabled = true;
    sessions = {}; saveSess(); save();
    log('Stealth ON (CLI)', 'warn');
    res.json({ ok: true, stealth: true });
  } else if (b.action === 'show') {
    config.stealthEnabled = false;
    save();
    log('Stealth OFF (CLI)', 'success');
    res.json({ ok: true, stealth: false });
  } else {
    res.status(400).json({ error: 'Invalid action' });
  }
});

app.get('/api/state', function(req, res) {
  var t = (req.headers.authorization || '').replace('Bearer ', '');
  var ok = t && sessions[t] && sessions[t].expiresAt > Date.now();
  var hasCred = fs.existsSync(CRED_FILE);
  res.json({
    auth: { firstRun: !hasCred, loggedIn: !!ok },
    config: ok ? config : { name: config.name, logo: config.logo, stealthEnabled: config.stealthEnabled },
    stats: ok ? stats() : null,
    shares: ok ? shares.filter(function(s) { return s.expiresAt > Date.now(); }) : [],
    uploads: ok ? uploads.filter(function(u) { return u.expiresAt > Date.now(); }) : [],
    received: ok ? received : [],
    logs: ok ? logs : []
  });
});

app.post('/api/register', function(req, res) {
  if (fs.existsSync(CRED_FILE)) return res.status(400).json({ error: 'Exists' });
  var b = req.body || {};
  if (!b.login || b.login.length < 3 || !b.password || b.password.length < 6) return res.status(400).json({ error: 'Invalid' });
  fs.writeFileSync(CRED_FILE, JSON.stringify({ login: b.login, passwordHash: hash(b.password) }));
  var tk = token();
  sessions[tk] = { login: b.login, expiresAt: Date.now() + SESS_TTL };
  saveSess();
  log('Аккаунт создан: ' + b.login, 'success');
  res.json({ ok: true, token: tk });
});

app.post('/api/login', function(req, res) {
  if (!fs.existsSync(CRED_FILE)) return res.status(400).json({ error: 'No account' });
  var b = req.body || {};
  var cred;
  try { cred = JSON.parse(fs.readFileSync(CRED_FILE, 'utf8')); } catch (e) { return res.status(500).json({ error: 'Read error' }); }
  if (cred.login !== b.login || cred.passwordHash !== hash(b.password)) {
    log('Неудачный вход: ' + (b.login || ''), 'warn');
    return res.status(401).json({ error: 'Invalid' });
  }
  var tk = token();
  sessions[tk] = { login: b.login, expiresAt: Date.now() + SESS_TTL };
  saveSess();
  log('Вход: ' + b.login, 'success');
  res.json({ ok: true, token: tk });
});

app.post('/api/logout', auth, function(req, res) {
  var t = (req.headers.authorization || '').replace('Bearer ', '');
  delete sessions[t]; saveSess();
  log('Выход', 'info');
  res.json({ ok: true });
});

app.post('/api/change-credentials', auth, function(req, res) {
  var b = req.body || {};
  if (!b.login || b.login.length < 3 || !b.password || b.password.length < 6) return res.status(400).json({ error: 'Invalid' });
  fs.writeFileSync(CRED_FILE, JSON.stringify({ login: b.login, passwordHash: hash(b.password) }));
  sessions = {}; saveSess();
  log('Данные входа изменены', 'success');
  res.json({ ok: true });
});

app.patch('/api/config', auth, function(req, res) {
  var hadBot = config.botEnabled;
  var hadToken = config.botToken;
  var hadChatId = config.botChatId;
  config = Object.assign({}, config, req.body);
  save();
  var tokenChanged = req.body.botToken && req.body.botToken !== hadToken;
  var chatIdChanged = req.body.botChatId && req.body.botChatId !== hadChatId;
  var botJustEnabled = config.botEnabled && !hadBot;
  if (config.botEnabled !== hadBot || req.body.botToken) {
    startBotCommands();
  }
  // Send welcome message only once when bot is first connected or token/chatId changes
  if (config.botEnabled && config.botToken && config.botChatId) {
    if (botJustEnabled || tokenChanged || chatIdChanged) {
      setTimeout(function() {
        tgApi('sendMessage', {
          chat_id: config.botChatId,
          text: '✅  <b>ВЫ ДОБАВИЛИ БОТА</b>',
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: [[{ text: '🗑 Стереть', callback_data: 'delete_msg' }]] }
        });
      }, 500);
    }
  }
  res.json(config);
});

app.post('/api/shares', auth, function(req, res) {
  var s = req.body;
  s.id = s.id || crypto.randomBytes(8).toString('hex');
  s.link = '/s/' + eid(s.id);
  s.createdAt = s.createdAt || Date.now();
  if (config.sharePasswordEnabled && config.sharePassword) s.password = config.sharePassword;
  shares.unshift(s); save();
  log('Раздача: ' + s.title, 'success');
  botNotify('share', s);
  res.json({ ok: true, share: s });
});

app.post('/api/shares/:shareId/upload', auth, function(req, res) {
  shareUp.array('files', 50)(req, res, function(err) {
    if (err) return res.status(400).json({ error: err.message || 'Upload error' });
    var files = (req.files || []).map(function(f) {
      return { name: f.originalname, storedName: f.filename, size: f.size, type: f.mimetype };
    });
    res.json({ ok: true, shareId: req.shareId, files: files });
  });
});

app.delete('/api/shares/:id', auth, function(req, res) {
  var s = shares.find(function(x) { return x.id === req.params.id; });
  if (s) {
    (s.files || []).forEach(function(f) { try { fs.unlinkSync(path.join(SHARES_DIR, s.id, f.storedName || f.name)); } catch (e) {} });
    try { fs.rmSync(path.join(SHARES_DIR, s.id), { recursive: true, force: true }); } catch (e) {}
    shares = shares.filter(function(x) { return x.id !== req.params.id; });
    save(); log('Удалена раздача: ' + s.title, 'info');
  }
  res.json({ ok: true });
});

app.patch('/api/shares/:id/extend', auth, function(req, res) {
  var s = shares.find(function(x) { return x.id === req.params.id; });
  if (s) { var h = (req.body || {}).hours || 24; s.expiresAt += h * 3600000; save(); }
  res.json({ ok: true, share: s });
});

app.post('/api/uploads', auth, function(req, res) {
  var u = req.body;
  u.id = u.id || crypto.randomBytes(8).toString('hex');
  u.link = '/u/' + eid(u.id);
  u.createdAt = u.createdAt || Date.now();
  u.usedUploads = 0;
  if (config.uploadPasswordEnabled && config.uploadPassword) u.password = config.uploadPassword;
  uploads.unshift(u); save();
  log('Загрузка: ' + u.title, 'success');
  botNotify('upload', u);
  res.json({ ok: true, upload: u });
});

app.delete('/api/uploads/:id', auth, function(req, res) {
  var u = uploads.find(function(x) { return x.id === req.params.id; });
  if (u) {
    received = received.filter(function(r) {
      if (r.uploadId === u.id) { try { fs.unlinkSync(path.join(RECEIVED_DIR, r.storedName)); } catch (e) {} return false; }
      return true;
    });
    uploads = uploads.filter(function(x) { return x.id !== req.params.id; });
    save(); log('Удалена загрузка: ' + u.title, 'info');
  }
  res.json({ ok: true });
});

app.patch('/api/uploads/:id/extend', auth, function(req, res) {
  var u = uploads.find(function(x) { return x.id === req.params.id; });
  if (u) { var h = (req.body || {}).hours || 24; u.expiresAt += h * 3600000; save(); }
  res.json({ ok: true, upload: u });
});

app.delete('/api/received/:id', auth, function(req, res) {
  var r = received.find(function(x) { return x.id === req.params.id; });
  if (r) {
    try { fs.unlinkSync(path.join(RECEIVED_DIR, r.storedName)); } catch (e) {}
    received = received.filter(function(x) { return x.id !== req.params.id; });
    save(); log('Удалён: ' + r.name, 'info');
  }
  res.json({ ok: true });
});

app.get('/api/received/:id/download', auth, function(req, res) {
  var r = received.find(function(x) { return x.id === req.params.id; });
  if (!r) return res.status(404).send('Not found');
  var fp = path.join(RECEIVED_DIR, r.storedName);
  if (!fs.existsSync(fp)) return res.status(404).send('Missing');
  var safeName = encodeURIComponent(r.name).replace(/['()]/g, escape);
  res.setHeader('Content-Disposition', 'attachment; filename="' + r.name + "\"; filename*=UTF-8''" + safeName);
  res.setHeader('Content-Type', 'application/octet-stream');
  res.sendFile(path.resolve(fp));
});

app.get('/api/received/:id/view', auth, function(req, res) {
  var r = received.find(function(x) { return x.id === req.params.id; });
  if (!r) return res.status(404).send('Not found');
  var fp = path.join(RECEIVED_DIR, r.storedName);
  if (!fs.existsSync(fp)) return res.status(404).send('Missing');
  res.sendFile(path.resolve(fp));
});

app.get('/api/check', auth, function(req, res) {
  var results = [];
  results.push({ name: 'Node.js', status: 'ok', message: process.version });
  try { require('child_process').execSync('which nginx 2>/dev/null'); results.push({ name: 'Nginx', status: 'ok', message: 'OK' }); }
  catch (e) { results.push({ name: 'Nginx', status: 'warn', message: 'Не найден' }); }
  var sd = config.storagePath || SHARES_DIR;
  try { fs.accessSync(sd, fs.constants.W_OK); results.push({ name: 'Хранилище', status: 'ok', message: 'OK' }); }
  catch (e) { results.push({ name: 'Хранилище', status: 'err', message: 'Нет доступа' }); }
  if (config.botEnabled && config.botToken) results.push({ name: 'Telegram', status: 'ok', message: 'Настроен' });
  else results.push({ name: 'Telegram', status: 'warn', message: config.botEnabled ? 'Нет токена' : 'Выключен' });
  res.json({ results: results });
});

app.post('/api/bot/test', auth, function(req, res) {
  if (!config.botToken || !config.botChatId) return res.status(400).json({ error: 'Не настроен' });
  var text = '✅  <b>FILEUPSHARE</b>\n\n' +
    '🔔  Тестовое уведомление\n\n' +
    '📡  Панель работает корректно\n' +
    '🕐  ' + fmtDate(Date.now());
  var body = {
    chat_id: config.botChatId,
    text: text,
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: [[{ text: '🗑 Стереть', callback_data: 'delete_msg' }]] }
  };
  tgApi('sendMessage', body, function(resp) {
    if (resp && resp.ok) {
      res.json({ ok: true });
      log('Тест бота: OK', 'success');
    } else {
      res.status(400).json({ error: (resp && resp.description) || 'Ошибка' });
    }
  });
});

app.get('/api/public/share/:enc', function(req, res) {
  var id = did(req.params.enc);
  var s = shares.find(function(x) { return x.id === id && x.expiresAt > Date.now(); });
  if (!s) return res.status(404).json({ error: 'Not found' });
  var pub = JSON.parse(JSON.stringify(s));
  if (s.password) { pub.hasPassword = true; pub.files = []; pub.cover = ''; }
  res.json({ share: pub, config: { name: config.name, logo: config.logo, hideLifetimeOnPage: config.hideLifetimeOnPage, adEnabled: config.adEnabled, adText: config.adText, pageTheme: config.pageTheme } });
});

app.post('/api/public/share/:enc/verify', function(req, res) {
  var id = did(req.params.enc);
  var s = shares.find(function(x) { return x.id === id; });
  if (!s) return res.status(404).json({ error: 'Not found' });
  if (s.password === (req.body || {}).password) res.json({ ok: true, share: s });
  else res.status(401).json({ error: 'Wrong' });
});

app.get('/api/public/upload/:enc', function(req, res) {
  var id = did(req.params.enc);
  var u = uploads.find(function(x) { return x.id === id && x.expiresAt > Date.now(); });
  if (!u) return res.status(404).json({ error: 'Not found' });
  var pub = JSON.parse(JSON.stringify(u));
  if (u.password) pub.hasPassword = true;
  res.json({ upload: pub, config: { name: config.name, logo: config.logo, hideLifetimeOnPage: config.hideLifetimeOnPage, adEnabled: config.adEnabled, adText: config.adText, pageTheme: config.pageTheme } });
});

app.post('/api/public/upload/:enc/verify', function(req, res) {
  var id = did(req.params.enc);
  var u = uploads.find(function(x) { return x.id === id; });
  if (!u) return res.status(404).json({ error: 'Not found' });
  if (u.password === (req.body || {}).password) res.json({ ok: true, upload: u });
  else res.status(401).json({ error: 'Wrong' });
});

app.post('/api/public/upload/:enc/submit', function(req, res) {
  var uploadStart = Date.now();
  var contentLength = req.headers['content-length'] || 'unknown';
  console.log('[UPLOAD] START content-length=' + contentLength + ' ip=' + (req.headers['x-real-ip'] || req.ip));
  req.on('aborted', function() {
    console.log('[UPLOAD] ABORTED by client after ' + (Date.now() - uploadStart) + 'ms');
  });
  req.on('error', function(e) {
    console.log('[UPLOAD] REQ ERROR after ' + (Date.now() - uploadStart) + 'ms: ' + e.message);
  });
  recvUp.single('file')(req, res, function(err) {
    if (err) {
      console.log('[UPLOAD] MULTER ERROR after ' + (Date.now() - uploadStart) + 'ms: ' + err.message + ' code=' + err.code);
      return res.status(400).json({ error: err.message || 'Upload error' });
    }
    var id = did(req.params.enc);
    var u = uploads.find(function(x) { return x.id === id && x.expiresAt > Date.now(); });
    if (!u || !req.file) { if (req.file) try { fs.unlinkSync(req.file.path); } catch (e) {} return res.status(404).json({ error: 'Not found' }); }
    var entry = {
      id: crypto.randomBytes(8).toString('hex'),
      name: req.file.originalname, storedName: req.file.filename,
      size: req.file.size, type: req.file.mimetype,
      receivedAt: Date.now(), uploadId: u.id, source: u.title,
      comment: ((req.body || {}).comment || '').slice(0, 100)
    };
    received.unshift(entry);
    u.usedUploads = (u.usedUploads || 0) + 1;
    save();
    log('Файл: ' + entry.name + ' ← ' + u.title, 'success');
    botNotify('received', entry);
    res.json({ ok: true, file: entry });
  });
});

app.get('/api/file/:dir/:filename', function(req, res) {
  var fp = path.join(SHARES_DIR, req.params.dir, req.params.filename);
  if (!fs.existsSync(fp)) fp = path.join(RECEIVED_DIR, req.params.filename);
  if (!fs.existsSync(fp)) return res.status(404).send('Not found');

  var stat = fs.statSync(fp);
  var fileSize = stat.size;
  var ext = path.extname(req.params.filename).toLowerCase();
  var videoExts = ['.mp4', '.webm', '.ogg', '.mkv', '.mov', '.avi', '.m4v'];
  var isVideo = videoExts.indexOf(ext) !== -1;

  if (isVideo) {
    var mimeMap = { '.mp4': 'video/mp4', '.webm': 'video/webm', '.ogg': 'video/ogg', '.mkv': 'video/x-matroska', '.mov': 'video/quicktime', '.avi': 'video/x-msvideo', '.m4v': 'video/mp4' };
    var mimeType = mimeMap[ext] || 'video/mp4';
    var rangeHeader = req.headers['range'];

    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    if (rangeHeader) {
      var parts = rangeHeader.replace(/bytes=/, '').split('-');
      var start = parseInt(parts[0], 10);
      var end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      // Clamp chunk to 2MB for smooth streaming
      var chunkSize = 2 * 1024 * 1024;
      if (end - start + 1 > chunkSize) end = start + chunkSize - 1;
      if (end >= fileSize) end = fileSize - 1;
      var contentLength = end - start + 1;
      res.writeHead(206, {
        'Content-Range': 'bytes ' + start + '-' + end + '/' + fileSize,
        'Accept-Ranges': 'bytes',
        'Content-Length': contentLength,
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=3600',
      });
      var stream = fs.createReadStream(fp, { start: start, end: end });
      stream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
      });
      fs.createReadStream(fp).pipe(res);
    }
  } else {
    res.sendFile(path.resolve(fp));
  }
});

app.get('/api/download/:dir/:filename', function(req, res) {
  var orig = req.params.filename;
  var s = shares.find(function(x) { return x.id === req.params.dir; });
  if (s) { var f = (s.files || []).find(function(x) { return x.storedName === req.params.filename; }); if (f) orig = f.name; }
  var r = received.find(function(x) { return x.storedName === req.params.filename; }); if (r) orig = r.name;
  var fp = path.join(SHARES_DIR, req.params.dir, req.params.filename);
  if (!fs.existsSync(fp)) fp = path.join(RECEIVED_DIR, req.params.filename);
  if (!fs.existsSync(fp)) return res.status(404).send('Not found');
  var safeName = encodeURIComponent(orig).replace(/['()]/g, escape);
  res.setHeader('Content-Disposition', 'attachment; filename="' + orig + "\"; filename*=UTF-8''" + safeName);
  res.setHeader('Content-Type', 'application/octet-stream');
  res.sendFile(path.resolve(fp));
});

var CURRENT_VERSION = '1.0.5';
var VERSION_URL = 'https://raw.githubusercontent.com/LarsGravesen-invilink/File-Up-Share/main/version.json';
var cachedVersion = { version: CURRENT_VERSION, checked: 0 };

function checkVersion(cb) {
  var https = require('https');
  https.get(VERSION_URL, function(resp) {
    var body = '';
    resp.on('data', function(c) { body += c; });
    resp.on('end', function() {
      try {
        var j = JSON.parse(body);
        cachedVersion = { version: j.version || CURRENT_VERSION, checked: Date.now() };
        if (cb) cb(null, cachedVersion);
      } catch(e) { if (cb) cb(e); }
    });
  }).on('error', function(e) { if (cb) cb(e); });
}

setInterval(function() { checkVersion(); }, 6 * 3600000);
setTimeout(function() { checkVersion(); }, 5000);

app.get('/api/version', auth, function(req, res) {
  var force = req.query.force === '1';
  if (force || Date.now() - cachedVersion.checked > 3600000) {
    checkVersion(function(err) {
      res.json({ current: CURRENT_VERSION, latest: cachedVersion.version, hasUpdate: cachedVersion.version !== CURRENT_VERSION });
    });
  } else {
    res.json({ current: CURRENT_VERSION, latest: cachedVersion.version, hasUpdate: cachedVersion.version !== CURRENT_VERSION });
  }
});

app.post('/api/update', auth, function(req, res) {
  res.json({ ok: true, message: 'Обновление запущено' });
  log('Обновление панели...', 'warn');
  sessions = {}; saveSess();
  setTimeout(function() {
    try {
      var child = require('child_process');
      var scriptPath = path.join(__dirname, '../autoupdate.sh');
      child.execSync('bash ' + scriptPath, { timeout: 300000 });
    } catch(e) {
      log('Ошибка обновления: ' + e.message, 'error');
    }
  }, 500);
});

if (distPath) {
  app.get('*', function(req, res) {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('*', function(req, res) {
    res.send('<html><body style="background:#0a0e1a;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h2>FileUpShare</h2><p style="opacity:.4">Панель не собрана</p><p style="opacity:.3;font-size:13px">cd /opt/fileupshare && npm install && npm run build && systemctl restart fileupshare</p></div></body></html>');
  });
}

// Global error middleware - catches any unhandled Express errors (e.g. multer errors passed via next(err))
app.use(function(err, req, res, next) {
  console.error('Express error:', err.message);
  if (!res.headersSent) res.status(500).json({ error: err.message || 'Server error' });
});

// Prevent Node.js from crashing on unhandled promise rejections or exceptions
// (e.g. busboy/multer emitting errors when a client aborts a large upload)
process.on('uncaughtException', function(err) {
  console.error('Uncaught exception (ignored to keep server alive):', err.message);
});
process.on('unhandledRejection', function(reason) {
  console.error('Unhandled rejection (ignored to keep server alive):', reason);
});

var server = app.listen(PORT, '0.0.0.0', function() {
  console.log('FileUpShare v' + CURRENT_VERSION + ' on port ' + PORT);
  log('Запуск v' + CURRENT_VERSION + ' на порту ' + PORT, 'success');
});
// Increase timeouts to support large file uploads (up to 10 GB)
// Node.js default server.timeout is 0 (no timeout) in newer versions,
// but headersTimeout defaults to 60s and keepAliveTimeout to 5s,
// which can interrupt slow large-file uploads.
server.timeout = 0;            // no socket inactivity timeout
server.keepAliveTimeout = 0;   // no keep-alive timeout
server.headersTimeout = 0;     // no headers timeout
server.requestTimeout = 0;     // no request timeout (Node.js 18+ default is 300s — kills large uploads)
