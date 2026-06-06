import React, { useState, useEffect } from 'react';
import { formatSize, formatSizeUnit, type Stats, type Settings } from '../../types';
import type { Page } from '../Sidebar';

interface Props {
  stats: Stats;
  settings: Settings;
  onNavigate: (page: Page) => void;
}

// Mock server info for preview
const serverInfo = {
  ip: '185.92.148.27',
  hostname: 'vps-fileupshare',
  ports: [80, 443, 3000],
};

const checkItems = [
  { name: 'Nginx', status: 'ok' as const },
  { name: 'Node.js сервис', status: 'ok' as const },
  { name: 'SSL сертификат', status: 'ok' as const },
  { name: 'База данных', status: 'ok' as const },
  { name: 'Директория раздач', status: 'ok' as const },
  { name: 'Директория загрузок', status: 'ok' as const },
  { name: 'Telegram bot', status: 'warn' as const },
  { name: 'Cron задачи', status: 'ok' as const },
  { name: 'Свободное место', status: 'ok' as const },
  { name: 'Права доступа', status: 'ok' as const },
];

const mockLogs = [
  { t: '14:32:01', type: 'info', msg: 'Создана раздача abc123' },
  { t: '14:30:15', type: 'info', msg: 'Пользователь авторизован' },
  { t: '14:28:44', type: 'bot', msg: 'Уведомление отправлено' },
  { t: '14:25:00', type: 'info', msg: 'Загружен файл report.pdf (2.4 МБ)' },
  { t: '14:20:12', type: 'warn', msg: 'Бот: таймаут соединения, повтор...' },
  { t: '14:15:33', type: 'info', msg: 'Сервис запущен' },
  { t: '13:50:00', type: 'err', msg: 'Ошибка записи: ENOSPC' },
  { t: '13:45:22', type: 'info', msg: 'Обращение GET /s/YWJj (200)' },
];

export const InfoPage: React.FC<Props> = ({ stats, settings, onNavigate }) => {
  const [time, setTime] = useState(new Date().toLocaleTimeString('ru-RU'));
  const [showLogs, setShowLogs] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkResults, setCheckResults] = useState<typeof checkItems | null>(null);
  const [restarting, setRestarting] = useState(false);

  useEffect(() => {
    const i = setInterval(() => setTime(new Date().toLocaleTimeString('ru-RU')), 1000);
    return () => clearInterval(i);
  }, []);

  const quotaMB = settings.quotaEnabled && settings.quotaValue > 0
    ? (settings.quotaUnit === 'GB' ? settings.quotaValue * 1024 : settings.quotaValue)
    : stats.totalSpaceMB;

  const cards = [
    { value: stats.filesInShare.toString(), unit: 'Файлов', label: 'В раздаче', icon: '📤', page: 'my-shares' as Page, color: '#22c55e' },
    { value: stats.uploadPages.toString(), unit: 'Страниц', label: 'Загрузки', icon: '📥', page: 'my-uploads' as Page, color: '#60a5fa' },
    { value: stats.receivedFiles.toString(), unit: 'Файлов', label: 'Принято', icon: '📎', page: 'received' as Page, color: '#a78bfa' },
    { value: formatSize(stats.usedSpaceMB), unit: formatSizeUnit(stats.usedSpaceMB), label: `из ${formatSize(quotaMB)}`, icon: '💾', page: 'settings' as Page, color: '#fb923c' },
  ];

  const runCheck = () => {
    setChecking(true);
    setCheckResults(null);
    setTimeout(() => { setChecking(false); setCheckResults(checkItems); }, 2000);
  };

  const restart = () => {
    setRestarting(true);
    setTimeout(() => setRestarting(false), 3000);
  };

  const statusIcon = (s: 'ok' | 'warn' | 'err') => s === 'ok' ? '✓' : s === 'warn' ? '!' : '✗';
  const statusColor = (s: 'ok' | 'warn' | 'err') => s === 'ok' ? '#22c55e' : s === 'warn' ? '#eab308' : '#ef4444';

  return (
    <div className="space-y-4 animate-in">
      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3">
        {cards.map((c, i) => (
          <button key={i} onClick={() => onNavigate(c.page)} className="rounded-xl border border-accent/10 bg-surface/30 backdrop-blur-sm p-4 hover:border-accent/25 hover:bg-surface/50 transition-all text-left group hover-tilt">
            <div className="text-lg mb-2">{c.icon}</div>
            <div className="text-xl sm:text-2xl font-bold text-text mb-0.5">{c.value}</div>
            <div className="text-[10px] text-text-muted">{c.unit}</div>
            <div className="text-[9px] text-text-muted/60 mt-0.5">{c.label}</div>
          </button>
        ))}
      </div>

      {/* Server info */}
      <div className="rounded-xl border border-accent/10 bg-surface/30 backdrop-blur-sm p-4 hover-tilt">
        <h3 className="text-[12px] font-semibold text-text mb-3 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
          Сервер
        </h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          <div>
            <div className="text-[9px] text-text-muted">IP</div>
            <div className="text-[12px] text-text font-mono">{serverInfo.ip}</div>
          </div>
          <div>
            <div className="text-[9px] text-text-muted">Имя</div>
            <div className="text-[12px] text-text font-mono truncate">{serverInfo.hostname}</div>
          </div>
          <div>
            <div className="text-[9px] text-text-muted">Время</div>
            <div className="text-[12px] text-text font-mono">{time}</div>
          </div>
          <div>
            <div className="text-[9px] text-text-muted">Порты</div>
            <div className="text-[12px] text-text font-mono">{serverInfo.ports.join(', ')}</div>
          </div>
        </div>
      </div>

      {/* CPU & RAM */}
      <div className="rounded-xl border border-accent/10 bg-surface/30 backdrop-blur-sm p-4 hover-tilt">
        <h3 className="text-[12px] font-semibold text-text mb-3 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>
          Ресурсы
        </h3>
        <div className="space-y-3">
          {/* CPU */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-[11px] text-text">CPU</span>
                <span className="text-[9px] text-text-muted ml-1.5">2 vCPU · Intel Xeon</span>
              </div>
              <span className="text-[11px] font-mono text-accent">12%</span>
            </div>
            <div className="h-1.5 rounded-full bg-bg overflow-hidden">
              <div className="h-full rounded-full bg-accent transition-all duration-1000" style={{ width: '12%' }} />
            </div>
          </div>
          {/* RAM */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-[11px] text-text">RAM</span>
                <span className="text-[9px] text-text-muted ml-1.5">4 ГБ DDR4</span>
              </div>
              <span className="text-[11px] font-mono" style={{ color: '#fb923c' }}>68%</span>
            </div>
            <div className="h-1.5 rounded-full bg-bg overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000" style={{ width: '68%', background: '#fb923c' }} />
            </div>
            <div className="flex justify-between mt-0.5">
              <span className="text-[9px] text-text-muted">2.72 ГБ / 4 ГБ</span>
              <span className="text-[9px] text-text-muted">Свободно: 1.28 ГБ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {/* Logs */}
        <button onClick={() => setShowLogs(!showLogs)} className="flex-1 h-9 rounded-lg border border-accent/15 bg-surface/30 text-[11px] font-medium text-text-secondary hover:text-text hover:border-accent/25 transition-colors flex items-center justify-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          Логи
        </button>

        {/* Check */}
        <button onClick={runCheck} disabled={checking} className="flex-1 h-9 rounded-lg border border-accent/15 bg-surface/30 text-[11px] font-medium text-text-secondary hover:text-text hover:border-accent/25 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          {checking ? 'Проверка...' : 'Проверить'}
        </button>

        {/* Restart */}
        <button onClick={restart} disabled={restarting} className="flex-1 h-9 rounded-lg border border-danger/20 bg-danger/5 text-[11px] font-medium text-danger hover:bg-danger/10 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50" title="Перезапускает Nginx, Node.js сервис и Telegram bot">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          {restarting ? 'Перезапуск...' : 'Перезапуск'}
        </button>
      </div>

      {/* Logs panel */}
      {showLogs && (
        <div className="rounded-xl border border-accent/10 bg-surface/30 backdrop-blur-sm overflow-hidden animate-in">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
            <span className="text-[11px] font-semibold text-text">Логи панели</span>
            <span className="text-[9px] text-text-muted">Автоочистка: 72ч</span>
          </div>
          <div className="max-h-48 overflow-y-auto p-2 space-y-0.5 font-mono">
            {mockLogs.map((l, i) => (
              <div key={i} className="flex items-start gap-2 px-1 py-0.5 rounded text-[10px]">
                <span className="text-text-muted/60 flex-shrink-0">{l.t}</span>
                <span className={`flex-shrink-0 w-3 text-center ${l.type === 'err' ? 'text-danger' : l.type === 'warn' ? 'text-warning' : l.type === 'bot' ? 'text-blue' : 'text-text-muted'}`}>
                  {l.type === 'err' ? '✗' : l.type === 'warn' ? '!' : '·'}
                </span>
                <span className={`flex-1 ${l.type === 'err' ? 'text-danger' : 'text-text-secondary'}`}>{l.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Check results */}
      {checkResults && (
        <div className="rounded-xl border border-accent/10 bg-surface/30 backdrop-blur-sm p-3 space-y-1 animate-in">
          <div className="text-[11px] font-semibold text-text mb-2">Проверка системы</div>
          {checkResults.map((c, i) => (
            <div key={i} className="flex items-center gap-2 py-1 px-1.5 rounded" style={{ background: statusColor(c.status) + '08' }}>
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: statusColor(c.status) + '20', color: statusColor(c.status) }}>
                {statusIcon(c.status)}
              </span>
              <span className="text-[11px] flex-1" style={{ color: statusColor(c.status) === '#22c55e' ? 'var(--color-text)' : statusColor(c.status) }}>
                {c.name}
              </span>
              <span className="text-[9px]" style={{ color: statusColor(c.status) }}>
                {c.status === 'ok' ? 'OK' : c.status === 'warn' ? 'Внимание' : 'Ошибка'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
