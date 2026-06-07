import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, Upload, Moon, Sun, HardDrive, Maximize, Type,
  Clock, Globe
} from 'lucide-react';
import { Toggle } from '../Toggle';
import type { Settings as SettingsType } from '../../types';

const timezones = [
  { value: 'Europe/Moscow', label: 'Москва (UTC+3)' },
  { value: 'Europe/Kiev', label: 'Киев (UTC+2)' },
  { value: 'Europe/Minsk', label: 'Минск (UTC+3)' },
  { value: 'Asia/Almaty', label: 'Алматы (UTC+6)' },
  { value: 'Asia/Tashkent', label: 'Ташкент (UTC+5)' },
  { value: 'Asia/Yekaterinburg', label: 'Екатеринбург (UTC+5)' },
  { value: 'Asia/Novosibirsk', label: 'Новосибирск (UTC+7)' },
  { value: 'Asia/Vladivostok', label: 'Владивосток (UTC+10)' },
  { value: 'Europe/London', label: 'Лондон (UTC+0)' },
  { value: 'Europe/Berlin', label: 'Берлин (UTC+1)' },
  { value: 'America/New_York', label: 'Нью-Йорк (UTC-5)' },
];

interface Props {
  settings: SettingsType;
  onUpdate: (patch: Partial<SettingsType>) => void;
}

export function SettingsPage({ settings, onUpdate }: Props) {
  const [logoPreview, setLogoPreview] = useState(settings.logo);
  const logoRef = useRef<HTMLInputElement>(null);

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setLogoPreview(result);
      onUpdate({ logo: result });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
          <Settings className="h-4 w-4 text-cyan-400" />
          Настройка панели
        </h3>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-xl p-5"
      >
        <h4 className="mb-4 text-xs font-medium text-white/40">Брендинг</h4>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs text-white/30">Название сервиса</label>
            <input
              value={settings.name}
              onChange={e => onUpdate({ name: e.target.value })}
              className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/30"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-white/30">Логотип</label>
            <input ref={logoRef} type="file" accept="image/*" onChange={handleLogo} className="hidden" />
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-white/8 bg-white/3">
                {logoPreview ? (
                  <img src={logoPreview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Upload className="h-5 w-5 text-white/15" />
                )}
              </div>
              <button
                onClick={() => logoRef.current?.click()}
                className="rounded-lg border border-white/8 bg-white/3 px-4 py-2 text-xs text-white/40 transition hover:bg-white/5"
              >
                Загрузить
              </button>
              {logoPreview && (
                <button
                  onClick={() => { setLogoPreview(''); onUpdate({ logo: '' }); }}
                  className="text-xs text-red-400/50 transition hover:text-red-400"
                >
                  Удалить
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-xl p-5"
      >
        <h4 className="mb-4 text-xs font-medium text-white/40">Тема панели</h4>
        <div className="flex gap-3">
          <button
            onClick={() => onUpdate({ panelTheme: 'dark' })}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-xs font-medium transition ${
              settings.panelTheme === 'dark'
                ? 'bg-white/10 text-white ring-1 ring-white/20'
                : 'bg-white/3 text-white/30 hover:bg-white/5'
            }`}
          >
            <Moon className="h-4 w-4" /> Тёмная
          </button>
          <button
            onClick={() => onUpdate({ panelTheme: 'light' })}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-xs font-medium transition ${
              settings.panelTheme === 'light'
                ? 'bg-white/10 text-white ring-1 ring-white/20'
                : 'bg-white/3 text-white/30 hover:bg-white/5'
            }`}
          >
            <Sun className="h-4 w-4" /> Светлая
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-xl p-5"
      >
        <h4 className="mb-4 text-xs font-medium text-white/40">Хранилище</h4>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 flex items-center gap-1 text-xs text-white/30">
              <HardDrive className="h-3 w-3" /> Путь раздач
            </label>
            <input
              value={settings.storagePath}
              onChange={e => onUpdate({ storagePath: e.target.value })}
              className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-xs font-mono text-white/50 outline-none focus:border-cyan-500/30"
            />
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1 text-xs text-white/30">
              <HardDrive className="h-3 w-3" /> Путь загрузок
            </label>
            <input
              value={settings.receivedPath}
              onChange={e => onUpdate({ receivedPath: e.target.value })}
              className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-xs font-mono text-white/50 outline-none focus:border-cyan-500/30"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg bg-white/3 px-4 py-3">
            <span className="text-xs text-white/40">Квота хранилища</span>
            <Toggle checked={settings.quotaEnabled} onChange={v => onUpdate({ quotaEnabled: v })} />
          </div>

          {settings.quotaEnabled && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs text-white/30">Размер</label>
                <input
                  type="number"
                  value={settings.quotaValue}
                  onChange={e => onUpdate({ quotaValue: Number(e.target.value) })}
                  onFocus={e => e.currentTarget.select()}
                  min={1}
                  className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/30"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-white/30">Единица</label>
                <select
                  value={settings.quotaUnit}
                  onChange={e => onUpdate({ quotaUnit: e.target.value })}
                  className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/30"
                >
                  <option value="MB">МБ</option>
                  <option value="GB">ГБ</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card rounded-xl p-5"
      >
        <h4 className="mb-4 text-xs font-medium text-white/40">Масштаб</h4>
        <div className="space-y-4">
          <div>
            <label className="mb-2 flex items-center gap-1 text-xs text-white/30">
              <Maximize className="h-3 w-3" /> Масштаб интерфейса
            </label>
            <div className="flex gap-2">
              {(['default', 'medium', 'large'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => onUpdate({ uiScale: s })}
                  className={`flex-1 rounded-lg py-2.5 text-xs font-medium transition ${
                    settings.uiScale === s
                      ? 'bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/30'
                      : 'bg-white/3 text-white/30 hover:bg-white/5'
                  }`}
                >
                  {s === 'default' ? 'Стандарт' : s === 'medium' ? 'Средний' : 'Большой'}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[10px] text-white/15">Пропорционально увеличивает все элементы панели</p>
          </div>
          <div>
            <label className="mb-2 flex items-center gap-1 text-xs text-white/30">
              <Type className="h-3 w-3" /> Масштаб шапки
            </label>
            <div className="flex gap-2">
              {(['default', 'medium', 'large'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => onUpdate({ headerScale: s })}
                  className={`flex-1 rounded-lg py-2.5 text-xs font-medium transition ${
                    settings.headerScale === s
                      ? 'bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30'
                      : 'bg-white/3 text-white/30 hover:bg-white/5'
                  }`}
                >
                  {s === 'default' ? 'Стандарт' : s === 'medium' ? 'Средний' : 'Большой'}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[10px] text-white/15">Увеличивает шапку панели, логотип и кнопку меню</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card rounded-xl p-5"
      >
        <h4 className="mb-4 flex items-center gap-1 text-xs font-medium text-white/40">
          <Clock className="h-3 w-3" /> Дата и время
        </h4>
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 flex items-center gap-1 text-xs text-white/30">
              <Globe className="h-3 w-3" /> Часовой пояс
            </label>
            <select
              value={settings.timezone}
              onChange={e => onUpdate({ timezone: e.target.value })}
              className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/30"
            >
              {timezones.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
            <p className="mt-1.5 text-[10px] text-white/15">Используется во всей панели: дашборд, логи, таймеры, уведомления бота</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
