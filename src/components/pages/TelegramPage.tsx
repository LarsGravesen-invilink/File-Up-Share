import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Send, Bell, Clock, BarChart3, Zap } from 'lucide-react';
import { Toggle } from '../Toggle';
import type { Settings } from '../../types';

interface Props {
  settings: Settings;
  onUpdate: (patch: Partial<Settings>) => void;
}

export function TelegramPage({ settings, onUpdate }: Props) {
  const [notifications, setNotifications] = useState({
    newShare: true,
    newUpload: true,
    receivedFile: true,
    service: true,
  });

  const status = settings.botEnabled
    ? (settings.botToken ? 'Запущен' : 'Не настроен')
    : 'Остановлен';

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

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-xl p-5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-2 w-2 rounded-full ${statusDot}`} style={{ boxShadow: '0 0 8px currentColor' }} />
            <div>
              <span className={`text-sm font-medium ${statusColor}`}>{status}</span>
              <span className="ml-2 text-[11px] text-white/20">Telegram Bot API</span>
            </div>
          </div>
          <Toggle checked={settings.botEnabled} onChange={v => onUpdate({ botEnabled: v })} />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-xl p-5"
      >
        <h4 className="mb-4 flex items-center gap-2 text-xs font-medium text-white/40">
          <Zap className="h-3.5 w-3.5" />
          Подключение
        </h4>
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs text-white/30">Токен бота</label>
            <input
              value={settings.botToken}
              onChange={e => onUpdate({ botToken: e.target.value })}
              placeholder="123456789:ABCdef..."
              className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-xs font-mono text-white placeholder-white/15 outline-none focus:border-cyan-500/30"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-white/30">Chat ID / Channel ID</label>
            <input
              value={settings.botChatId}
              onChange={e => onUpdate({ botChatId: e.target.value })}
              placeholder="-1001234567890"
              className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-xs font-mono text-white placeholder-white/15 outline-none focus:border-cyan-500/30"
            />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-xl p-5"
      >
        <h4 className="mb-4 flex items-center gap-2 text-xs font-medium text-white/40">
          <Bell className="h-3.5 w-3.5" />
          Уведомления
        </h4>
        <div className="space-y-2">
          {([
            { key: 'newShare' as const, label: 'Новая раздача', icon: '📤' },
            { key: 'newUpload' as const, label: 'Новая загрузка', icon: '📥' },
            { key: 'receivedFile' as const, label: 'Принятый файл', icon: '📎' },
            { key: 'service' as const, label: 'Служебные', icon: '⚙️' },
          ]).map(n => (
            <div key={n.key} className="flex items-center justify-between rounded-lg bg-white/3 px-4 py-2.5">
              <div className="flex items-center gap-2 text-xs text-white/50">
                <span>{n.icon}</span> {n.label}
              </div>
              <Toggle
                checked={notifications[n.key]}
                onChange={v => setNotifications(prev => ({ ...prev, [n.key]: v }))}
              />
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card rounded-xl p-5"
      >
        <h4 className="mb-4 flex items-center gap-2 text-xs font-medium text-white/40">
          <Clock className="h-3.5 w-3.5" />
          Мониторинг
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs text-white/30">Интервал проверки</label>
            <input
              type="number"
              value={settings.botPollInterval}
              onChange={e => onUpdate({ botPollInterval: Number(e.target.value) })}
              min={1}
              className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/30"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-white/30">Единица</label>
            <select
              value={settings.botPollUnit}
              onChange={e => onUpdate({ botPollUnit: e.target.value })}
              className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/30"
            >
              <option value="sec">Секунды</option>
              <option value="min">Минуты</option>
            </select>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card rounded-xl p-5"
      >
        <h4 className="mb-3 flex items-center gap-2 text-xs font-medium text-white/40">
          <BarChart3 className="h-3.5 w-3.5" />
          Ежедневная сводка
        </h4>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/30">Отправлять в</span>
          <input
            type="time"
            defaultValue="09:00"
            className="rounded-lg border border-white/8 bg-white/5 px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-500/30"
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <button className="btn-glow flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 py-3 text-xs font-semibold text-white shadow-lg shadow-blue-500/15 transition hover:shadow-blue-500/25">
          <Send className="h-3.5 w-3.5" />
          Тест уведомления
        </button>
      </motion.div>
    </div>
  );
}
