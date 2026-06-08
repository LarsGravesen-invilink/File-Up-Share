import { useState } from 'react';
import { motion } from 'framer-motion';
import { Palette, Check, Eye, EyeOff, Type } from 'lucide-react';
import { Toggle } from '../Toggle';
import type { Settings } from '../../types';
import { themes } from '../../themes';

interface Props {
  settings: Settings;
  onUpdate: (patch: Partial<Settings>) => void;
}

export function DesignPage({ settings, onUpdate }: Props) {
  const [confirmTheme, setConfirmTheme] = useState<string | null>(null);

  const applyTheme = (id: string) => {
    onUpdate({ pageTheme: id });
    setConfirmTheme(null);
  };

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
          <Palette className="h-4 w-4 text-violet-400" />
          Внешний вид страниц
        </h3>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-xl p-5"
      >
        <h4 className="mb-3 text-xs font-medium text-white/40">Темы страниц</h4>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {themes.map(t => (
            <button
              key={t.id}
              onClick={() => setConfirmTheme(t.id)}
              className={`group relative overflow-hidden rounded-lg p-3 text-left transition-all hover:scale-[1.02] ${
                settings.pageTheme === t.id ? 'ring-2 ring-cyan-500/50' : ''
              }`}
              style={{ background: t.bg }}
            >
              {settings.pageTheme === t.id && (
                <div className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500">
                  <Check className="h-2.5 w-2.5 text-white" />
                </div>
              )}
              <div className="h-1 w-6 rounded-full" style={{ background: t.accent }} />
              <div className="mt-2 text-[11px] font-medium" style={{ color: t.text }}>
                {t.name}
              </div>
              <div className="mt-0.5 text-[9px] opacity-40" style={{ color: t.text }}>
                {t.dark ? 'Тёмная' : 'Светлая'}
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-xl p-5"
      >
        <h4 className="mb-3 text-xs font-medium text-white/40">Дополнительно</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-white/3 px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-white/50">
              {settings.hideLifetimeOnPage ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              Скрыть таймер на страницах
            </div>
            <Toggle checked={settings.hideLifetimeOnPage} onChange={v => onUpdate({ hideLifetimeOnPage: v })} />
          </div>
          {settings.hideLifetimeOnPage && (
            <p className="px-1 text-[10px] text-white/15">Глобально скрывает обратный отсчёт на всех публичных страницах</p>
          )}

          <div className="rounded-lg bg-white/3 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-white/50">
                <Type className="h-3.5 w-3.5" />
                Рекламный блок
              </div>
              <Toggle checked={settings.adEnabled} onChange={v => onUpdate({ adEnabled: v })} />
            </div>
            {settings.adEnabled && (
              <>
                <textarea
                  value={settings.adText}
                  onChange={e => onUpdate({ adText: e.target.value })}
                  placeholder="Текст (ссылки станут кликабельными)"
                  rows={2}
                  className="mt-3 w-full resize-none rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/15 outline-none focus:border-cyan-500/30"
                />
                <p className="mt-1 text-[10px] text-white/15">Отображается внизу публичных страниц. Ссылки автоматически кликабельны.</p>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {confirmTheme && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass mx-4 w-full max-w-sm rounded-2xl p-6"
          >
            <h3 className="mb-2 text-base font-semibold text-white">Применить тему?</h3>
            <p className="mb-5 text-xs text-white/40">
              Тема «{themes.find(t => t.id === confirmTheme)?.name}» будет применена ко всем публичным страницам.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmTheme(null)}
                className="flex-1 rounded-lg border border-white/10 py-2 text-xs text-white/40 transition hover:bg-white/5"
              >
                Отмена
              </button>
              <button
                onClick={() => applyTheme(confirmTheme)}
                className="btn-glow flex-1 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 py-2 text-xs font-medium text-white transition"
              >
                Применить
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
