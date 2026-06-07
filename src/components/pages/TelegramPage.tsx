import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Bell, Clock, BarChart3, Zap, Save, CheckCircle, Loader2 } from 'lucide-react';
import { Toggle } from '../Toggle';
import type { Settings } from '../../types';
import * as api from '../../api';

interface Props {
  settings: Settings;
  onUpdate: (patch: Partial<Settings>) => void;
}

export function TelegramPage({ settings, onUpdate }: Props) {
  const [enabled, setEnabled] = useState(settings.botEnabled);
  const [token, setToken] = useState(settings.botToken);
  const [chatId, setChatId] = useState(settings.botChatId);
  const [pollInterval, setPollInterval] = useState(settings.botPollInterval);
  const [pollUnit, setPollUnit] = useState(settings.botPollUnit);
  const [notifyShare, setNotifyShare] = useState(settings.botNotifyShare);
  const [notifyUpload, setNotifyUpload] = useState(settings.botNotifyUpload);
  const [notifyReceived, setNotifyReceived] = useState(settings.botNotifyReceived);
  const [notifyService, setNotifyService] = useState(settings.botNotifyService);
  const [dailySummary, setDailySummary] = useState(settings.botDailySummary);
  const [dailyTime, setDailyTime] = useState(settings.botDailySummaryTime);

  const [confirmModal, setConfirmModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null);

  useEffect(() => {
    setEnabled(settings.botEnabled);
    setToken(settings.botToken);
    setChatId(settings.botChatId);
    setPollInterval(settings.botPollInterval);
    setPollUnit(settings.botPollUnit);
    setNotifyShare(settings.botNotifyShare);
    setNotifyUpload(settings.botNotifyUpload);
    setNotifyReceived(settings.botNotifyReceived);
    setNotifyService(settings.botNotifyService);
    setDailySummary(settings.botDailySummary);
    setDailyTime(settings.botDailySummaryTime);
  }, [settings]);

  const hasChanges =
    enabled !== settings.botEnabled ||
    token !== settings.botToken ||
    chatId !== settings.botChatId ||
    pollInterval !== settings.botPollInterval ||
    pollUnit !== settings.botPollUnit ||
    notifyShare !== settings.botNotifyShare ||
    notifyUpload !== settings.botNotifyUpload ||
    notifyReceived !== settings.botNotifyReceived ||
    notifyService !== settings.botNotifyService ||
    dailySummary !== settings.botDailySummary ||
    dailyTime !== settings.botDailySummaryTime;

  const handleSave = async () => {
    setSaving(true);
    await onUpdate({
      botEnabled: enabled,
      botToken: token,
      botChatId: chatId,
      botPollInterval: pollInterval,
      botPollUnit: pollUnit,
      botNotifyShare: notifyShare,
      botNotifyUpload: notifyUpload,
      botNotifyReceived: notifyReceived,
      botNotifyService: notifyService,
      botDailySummary: dailySummary,
      botDailySummaryTime: dailyTime,
    });
    setSaving(false);
    setConfirmModal(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const r = await api.testBot();
      setTestResult(r);
    } catch (e: any) {
      setTestResult({ ok: false, error: e.message || 'Ошибка' });
    }
    setTesting(false);
    setTimeout(() => setTestResult(null), 4000);
  };

  const status = enabled ? (token ? 'Запущен' : 'Не настроен') : 'Остановлен';
  const statusColor = status === 'Запущен' ? 'text-emerald-400' : status === 'Остановлен' ? 'text-red-400' : 'text-yellow-400';
  const statusDot = status === 'Запущен' ? 'bg-emerald-400' : status === 'Остановлен' ? 'bg-red-400' : 'bg-yellow-400';

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
          <Bot className="h-4 w-4 text-blue-400" />
          Telegram бот
        </h3>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-2 w-2 rounded-full ${statusDot}`} style={{ boxShadow: '0 0 8px currentColor' }} />
            <div>
              <span className={`text-sm font-medium ${statusColor}`}>{status}</span>
              <span className="ml-2 text-[11px] text-white/20">Telegram Bot API</span>
            </div>
          </div>
          <Toggle checked={enabled} onChange={setEnabled} />
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-5">
        <h4 className="mb-4 flex items-center gap-2 text-xs font-medium text-white/40">
          <Zap className="h-3.5 w-3.5" /> Подключение
        </h4>
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs text-white/30">Токен бота</label>
            <input value={token} onChange={e => setToken(e.target.value)} onFocus={e => e.currentTarget.select()} placeholder="123456789:ABCdef..."
              className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-xs font-mono text-white placeholder-white/15 outline-none focus:border-cyan-500/30" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-white/30">Chat ID / Channel ID</label>
            <input value={chatId} onChange={e => setChatId(e.target.value)} onFocus={e => e.currentTarget.select()} placeholder="-1001234567890"
              className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-xs font-mono text-white placeholder-white/15 outline-none focus:border-cyan-500/30" />
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-xl p-5">
        <h4 className="mb-4 flex items-center gap-2 text-xs font-medium text-white/40">
          <Bell className="h-3.5 w-3.5" /> Уведомления
        </h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-lg bg-white/3 px-4 py-2.5">
            <div className="flex items-center gap-2 text-xs text-white/50"><span>📤</span> Новая раздача</div>
            <Toggle checked={notifyShare} onChange={setNotifyShare} />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-white/3 px-4 py-2.5">
            <div className="flex items-center gap-2 text-xs text-white/50"><span>📥</span> Новая загрузка</div>
            <Toggle checked={notifyUpload} onChange={setNotifyUpload} />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-white/3 px-4 py-2.5">
            <div className="flex items-center gap-2 text-xs text-white/50"><span>📎</span> Принятый файл</div>
            <Toggle checked={notifyReceived} onChange={setNotifyReceived} />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-white/3 px-4 py-2.5">
            <div className="flex items-center gap-2 text-xs text-white/50"><span>⚙️</span> Служебные</div>
            <Toggle checked={notifyService} onChange={setNotifyService} />
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card rounded-xl p-5">
        <h4 className="mb-4 flex items-center gap-2 text-xs font-medium text-white/40">
          <Clock className="h-3.5 w-3.5" /> Мониторинг
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs text-white/30">Интервал проверки</label>
            <input type="number" value={pollInterval} onChange={e => setPollInterval(Math.max(1, Number(e.target.value)))} onFocus={e => e.currentTarget.select()} min={1}
              className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/30" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-white/30">Единица</label>
            <select value={pollUnit} onChange={e => setPollUnit(e.target.value)}
              className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/30">
              <option value="sec">Секунды</option>
              <option value="min">Минуты</option>
            </select>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card rounded-xl p-5">
        <h4 className="mb-3 flex items-center gap-2 text-xs font-medium text-white/40">
          <BarChart3 className="h-3.5 w-3.5" /> Ежедневная сводка
        </h4>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/30">Отправлять в</span>
            <input type="time" value={dailyTime} onChange={e => setDailyTime(e.target.value)}
              className="rounded-lg border border-white/8 bg-white/5 px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-500/30" />
          </div>
          <Toggle checked={dailySummary} onChange={setDailySummary} />
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="space-y-3">
        <button
          onClick={() => setConfirmModal(true)}
          disabled={!hasChanges}
          className="btn-glow flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 py-3 text-xs font-semibold text-white shadow-lg shadow-cyan-500/15 transition hover:shadow-cyan-500/25 disabled:opacity-30"
        >
          <Save className="h-3.5 w-3.5" />
          Сохранить настройки
        </button>

        <button
          onClick={handleTest}
          disabled={testing || !token || !chatId}
          className="btn-glow flex w-full items-center justify-center gap-2 rounded-xl border border-white/8 bg-white/3 py-3 text-xs font-medium text-white/40 transition hover:bg-white/5 hover:text-white/60 disabled:opacity-30"
        >
          {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          Тест уведомления
        </button>
      </motion.div>

      <AnimatePresence>
        {saved && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-3">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-emerald-400">Настройки сохранены</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {testResult && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`flex items-center gap-2 rounded-xl px-4 py-3 ${testResult.ok ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
            <span className={`text-xs ${testResult.ok ? 'text-emerald-400' : 'text-red-400'}`}>
              {testResult.ok ? '✓ Уведомление отправлено' : '✗ ' + (testResult.error || 'Ошибка')}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="glass w-full max-w-sm rounded-2xl p-6">
              <div className="mb-1 flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-400" />
                <h3 className="text-base font-semibold text-white">Сохранить настройки?</h3>
              </div>
              <p className="mb-5 text-xs text-white/40">Настройки Telegram бота будут применены немедленно.</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmModal(false)} disabled={saving}
                  className="flex-1 rounded-lg border border-white/10 py-2.5 text-xs text-white/40 transition active:scale-95 hover:bg-white/5 disabled:opacity-50">
                  Отмена
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="btn-glow flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 py-2.5 text-xs font-medium text-white transition active:scale-95 disabled:opacity-50">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
