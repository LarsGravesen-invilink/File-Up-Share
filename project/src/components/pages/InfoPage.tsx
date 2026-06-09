import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Server, Cpu, Clock, Globe, HardDrive,
  Activity, FileText, RefreshCw, Search, AlertTriangle,
  CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import type { Stats, Settings, Page, LogEntry, CheckResult } from '../../types';
import { formatSize, formatSizeUnit } from '../../helpers';
import * as api from '../../api';

interface Props {
  stats: Stats;
  settings: Settings;
  logs: LogEntry[];
  onNavigate: (page: Page) => void;
  onRestart: () => void;
}

export function InfoPage({ stats, settings, logs, onNavigate, onRestart }: Props) {
  const [showLogs, setShowLogs] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkResults, setCheckResults] = useState<CheckResult[] | null>(null);
  const [restartModal, setRestartModal] = useState(false);
  const [restarting, setRestarting] = useState(false);

  const currentTime = useCurrentTime(settings.timezone);

  const diskUsedPct = stats.diskTotalMB > 0 ? Math.round(stats.usedSpaceMB / stats.diskTotalMB * 100) : 0;

  const cards = [
    { value: stats.filesInShare.toString(), unit: 'Файлов', label: 'В раздаче', emoji: '📤', page: 'my-shares' as Page, gradient: 'from-emerald-500 to-green-600' },
    { value: stats.uploadPages.toString(), unit: 'Страниц', label: 'Загрузки', emoji: '📥', page: 'my-uploads' as Page, gradient: 'from-blue-500 to-cyan-600' },
    { value: stats.receivedFiles.toString(), unit: 'Файлов', label: 'Принято', emoji: '📎', page: 'received' as Page, gradient: 'from-violet-500 to-purple-600' },
    { value: formatSize(stats.usedSpaceMB), unit: formatSizeUnit(stats.usedSpaceMB), label: `из ${formatSize(stats.diskTotalMB)} ${formatSizeUnit(stats.diskTotalMB)} диска`, emoji: '💾', page: 'info' as Page, gradient: 'from-orange-500 to-amber-600' },
  ];

  const runCheck = async () => {
    setChecking(true);
    setCheckResults(null);
    try {
      const data = await api.runCheck();
      setCheckResults(data.results as CheckResult[]);
    } catch {
      setCheckResults([{ name: 'Сервер', status: 'err', message: 'Нет ответа' }]);
    }
    setChecking(false);
  };

  const handleRestart = () => {
    setRestarting(true);
    setTimeout(() => {
      onRestart();
    }, 1000);
  };

  const filteredLogs = useMemo(() => {
    const cutoff = Date.now() - 72 * 60 * 60 * 1000;
    return logs.filter(l => l.timestamp > cutoff).slice(0, 100);
  }, [logs]);

  const statusIcon = (s: 'ok' | 'warn' | 'err') => {
    if (s === 'ok') return <CheckCircle className="h-4 w-4 text-emerald-400" />;
    if (s === 'warn') return <AlertCircle className="h-4 w-4 text-yellow-400" />;
    return <XCircle className="h-4 w-4 text-red-400" />;
  };

  const logTypeColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'text-emerald-400';
      case 'warn': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-white/40';
    }
  };

  const formatLogTime = (ts: number) => {
    return new Date(ts).toLocaleString('ru-RU', {
      timeZone: settings.timezone,
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate(c.page)}
            className="glass-card group rounded-xl p-4 text-left"
          >
            <div className="mb-3 text-2xl">{c.emoji}</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-white">{c.value}</span>
              <span className="text-xs text-white/30">{c.unit}</span>
            </div>
            <div className="mt-1 text-xs text-white/25">{c.label}</div>
          </motion.button>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="glass-card rounded-xl p-5"
      >
        <div className="mb-4 flex items-center gap-2">
          <Server className="h-4 w-4 text-cyan-400" />
          <span className="text-sm font-semibold text-white">Сервер</span>
          <span className="ml-auto text-[10px] text-white/20">Обновляется в реальном времени</span>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-lg bg-white/3 p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-white/30">
              <Globe className="h-3 w-3" /> IP
            </div>
            <div className="mt-1 text-sm font-medium text-white/70">{stats.ip}</div>
          </div>
          <div className="rounded-lg bg-white/3 p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-white/30">
              <HardDrive className="h-3 w-3" /> Имя
            </div>
            <div className="mt-1 text-sm font-medium text-white/70">{stats.hostname}</div>
          </div>
          <div className="rounded-lg bg-white/3 p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-white/30">
              <Clock className="h-3 w-3" /> Время ({settings.timezone.split('/')[1] || settings.timezone})
            </div>
            <div className="mt-1 text-sm font-medium text-white/70 tabular-nums">{currentTime}</div>
          </div>
          <div className="rounded-lg bg-white/3 p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-white/30">
              <Activity className="h-3 w-3" /> Порт
            </div>
            <div className="mt-1 text-sm font-medium text-white/70">3000</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="glass-card rounded-xl p-5"
      >
        <div className="mb-4 flex items-center gap-2">
          <Cpu className="h-4 w-4 text-violet-400" />
          <span className="text-sm font-semibold text-white">Ресурсы</span>
          <div className="ml-auto flex items-center gap-1">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-[10px] text-white/20">Live</span>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div>
                <span className="text-sm text-white/70">CPU</span>
                <span className="ml-2 text-[11px] text-white/25">{stats.cpuCores} vCPU · {stats.cpu}</span>
              </div>
              <span className="text-sm font-semibold text-cyan-400 tabular-nums">{Math.round(stats.cpuPercent)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400"
                initial={{ width: 0 }}
                animate={{ width: `${stats.cpuPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div>
                <span className="text-sm text-white/70">RAM</span>
                <span className="ml-2 text-[11px] text-white/25">{stats.ramTotal} ГБ DDR4</span>
              </div>
              <span className="text-sm font-semibold text-violet-400 tabular-nums">{Math.round(stats.ramPercent)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400"
                animate={{ width: `${stats.ramPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-white/20">
              <span>{stats.ramUsed.toFixed(2)} ГБ / {stats.ramTotal} ГБ</span>
              <span>Свободно: {(stats.ramTotal - stats.ramUsed).toFixed(2)} ГБ</span>
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div>
                <span className="text-sm text-white/70">Хранилище</span>
                <span className="ml-2 text-[11px] text-white/25">файлы сервиса</span>
              </div>
              <span className="text-sm font-semibold text-orange-400 tabular-nums">{diskUsedPct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
                animate={{ width: `${diskUsedPct}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-white/20">
              <span>Занято сервисом: {formatSize(stats.usedSpaceMB)} {formatSizeUnit(stats.usedSpaceMB)}</span>
              <span>Всего на VPS: {formatSize(stats.diskTotalMB)} {formatSizeUnit(stats.diskTotalMB)}</span>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="btn-glow flex items-center justify-center gap-2 rounded-xl border border-white/8 bg-white/3 px-4 py-3 text-xs font-medium text-white/50 transition-all hover:bg-white/6 hover:text-white/80"
        >
          <FileText className="h-4 w-4" />
          Логи панели
        </button>
        <button
          onClick={runCheck}
          disabled={checking}
          className="btn-glow flex items-center justify-center gap-2 rounded-xl border border-white/8 bg-white/3 px-4 py-3 text-xs font-medium text-white/50 transition-all hover:bg-white/6 hover:text-white/80 disabled:opacity-50"
        >
          {checking ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          {checking ? 'Проверка...' : 'Проверка системы'}
        </button>
        <button
          onClick={() => setRestartModal(true)}
          className="btn-glow flex items-center justify-center gap-2 rounded-xl border border-orange-500/15 bg-orange-500/5 px-4 py-3 text-xs font-medium text-orange-400/70 transition-all hover:bg-orange-500/10 hover:text-orange-400"
        >
          <RefreshCw className="h-4 w-4" />
          Перезапуск
        </button>
      </motion.div>

      <AnimatePresence>
        {showLogs && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card overflow-hidden rounded-xl"
          >
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
              <span className="text-sm font-semibold text-white">Логи панели</span>
              <span className="text-[10px] text-white/20">Хранение: 72ч · {filteredLogs.length} записей</span>
            </div>
            <div className="max-h-64 overflow-y-auto p-4">
              {filteredLogs.length > 0 ? filteredLogs.map((l) => (
                <div key={l.id} className="flex gap-2 py-1 font-mono text-[11px]">
                  <span className="text-white/20 tabular-nums">[{formatLogTime(l.timestamp)}]</span>
                  <span className={logTypeColor(l.type)}>{l.message}</span>
                </div>
              )) : (
                <div className="text-center text-xs text-white/20">Нет записей</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {checkResults && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass-card overflow-hidden rounded-xl"
          >
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
              <span className="text-sm font-semibold text-white">Проверка системы</span>
              <button onClick={() => setCheckResults(null)} className="text-xs text-white/20 hover:text-white/40">
                Закрыть
              </button>
            </div>
            <div className="divide-y divide-white/3">
              {checkResults.map((c, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  {statusIcon(c.status)}
                  <span className="flex-1 text-sm text-white/60">{c.name}</span>
                  <span className={`text-xs ${c.status === 'ok' ? 'text-emerald-400/70' : c.status === 'warn' ? 'text-yellow-400/70' : 'text-red-400/70'}`}>
                    {c.message}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {restartModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass mx-4 w-full max-w-sm rounded-2xl p-6"
            >
              <div className="mb-1 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-400" />
                <h3 className="text-base font-semibold text-white">Перезапуск панели</h3>
              </div>
              <p className="mb-2 text-xs text-white/40">
                Будут перезапущены все компоненты. Панель будет недоступна несколько секунд.
              </p>
              <p className="mb-5 text-xs text-orange-400/60">
                Текущая сессия авторизации будет завершена.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setRestartModal(false)}
                  disabled={restarting}
                  className="flex-1 rounded-lg border border-white/10 py-2.5 text-xs text-white/40 transition hover:bg-white/5 disabled:opacity-50"
                >
                  Отмена
                </button>
                <button
                  onClick={handleRestart}
                  disabled={restarting}
                  className="btn-glow flex flex-1 items-center justify-center gap-2 rounded-lg bg-orange-500/20 py-2.5 text-xs font-medium text-orange-400 transition-all hover:bg-orange-500/30 disabled:opacity-50"
                >
                  {restarting && <RefreshCw className="h-3 w-3 animate-spin" />}
                  {restarting ? 'Перезапуск...' : 'Перезапустить'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function useCurrentTime(timezone: string): string {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString('ru-RU', { timeZone: timezone, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString('ru-RU', { timeZone: timezone, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, [timezone]);

  return time;
}
