import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Palette, Check, Eye, EyeOff, Type, Save, ChevronDown } from 'lucide-react';
import { Toggle } from '../Toggle';
import type { Settings } from '../../types';
import { themes } from '../../themes';

interface Props {
  settings: Settings;
  onUpdate: (patch: Partial<Settings>) => void;
}

export function DesignPage({ settings, onUpdate }: Props) {
  const [confirmTheme, setConfirmTheme] = useState<string | null>(null);
  const [adTextLocal, setAdTextLocal] = useState(settings.adText);
  const [adSaved, setAdSaved] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentTheme = themes.find(t => t.id === settings.pageTheme) || themes[0];

  const applyTheme = (id: string) => {
    onUpdate({ pageTheme: id });
    setConfirmTheme(null);
  };

  const saveAdText = () => {
    onUpdate({ adText: adTextLocal });
    setAdSaved(true);
    setTimeout(() => setAdSaved(false), 2000);
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
        style={{ position: 'relative', zIndex: dropdownOpen ? 10 : undefined }}
      >
        <h4 className="mb-3 text-xs font-medium text-white/40">Темы страниц</h4>
        <div ref={dropdownRef} className="relative">
          {/* Trigger button */}
          <button
            onClick={() => setDropdownOpen(v => !v)}
            className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/4 px-4 py-3 text-left transition hover:bg-white/6 active:scale-[0.99]"
          >
            {/* Mini preview swatch */}
            <div className="flex h-9 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg" style={{ background: currentTheme.bg, border: '1px solid ' + currentTheme.borderColor }}>
              <div className="flex flex-col gap-1 px-1.5">
                <div className="h-0.5 w-8 rounded-full" style={{ background: currentTheme.accent }} />
                <div className="h-0.5 w-5 rounded-full" style={{ background: currentTheme.textMuted, opacity: 0.6 }} />
                <div className="h-0.5 w-6 rounded-full" style={{ background: currentTheme.textMuted, opacity: 0.3 }} />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-white">{currentTheme.name}</div>
              <div className="text-[10px] text-white/30">Тёмная тема</div>
            </div>
            <ChevronDown className={`h-4 w-4 flex-shrink-0 text-white/30 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown list */}
          {dropdownOpen && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-white/10 bg-[#1a1f2e] shadow-2xl shadow-black/60">
              <div className="max-h-72 overflow-y-auto py-1">
                {themes.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setDropdownOpen(false); setConfirmTheme(t.id); }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-white/5 active:bg-white/8"
                  >
                    {/* Swatch */}
                    <div className="flex h-8 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg" style={{ background: t.bg, border: '1px solid ' + t.borderColor }}>
                      <div className="flex flex-col gap-1 px-1.5">
                        <div className="h-0.5 w-7 rounded-full" style={{ background: t.accent }} />
                        <div className="h-0.5 w-4 rounded-full" style={{ background: t.textMuted, opacity: 0.5 }} />
                        <div className="h-0.5 w-5 rounded-full" style={{ background: t.textMuted, opacity: 0.25 }} />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium text-white/90">{t.name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="h-1.5 w-1.5 rounded-full" style={{ background: t.accent }} />
                        <span className="text-[10px]" style={{ color: t.accent + 'cc' }}>
                          {t.bg} · {t.accent}
                        </span>
                      </div>
                    </div>
                    {settings.pageTheme === t.id && (
                      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-cyan-500/20">
                        <Check className="h-3 w-3 text-cyan-400" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
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
                  value={adTextLocal}
                  onChange={e => setAdTextLocal(e.target.value)}
                  placeholder="Текст (ссылки станут кликабельными)"
                  rows={2}
                  autoComplete="off"
                  className="mt-3 w-full resize-none rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/15 outline-none focus:border-cyan-500/30"
                />
                <p className="mt-1 text-[10px] text-white/15">
                  Отображается внизу публичных страниц. Текст некопируем, ссылки кликабельны.
                </p>
                <button
                  onClick={saveAdText}
                  className={`btn-glow mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold text-white transition active:scale-95 ${
                    adSaved
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-gradient-to-r from-violet-500/80 to-cyan-600/80 hover:from-violet-500 hover:to-cyan-600'
                  }`}
                >
                  {adSaved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                  {adSaved ? 'Сохранено' : 'Сохранить рекламный блок'}
                </button>
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
                className="flex-1 rounded-lg border border-white/10 py-2 text-xs text-white/40 transition active:scale-95 hover:bg-white/5"
              >
                Отмена
              </button>
              <button
                onClick={() => applyTheme(confirmTheme)}
                className="btn-glow flex-1 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 py-2 text-xs font-medium text-white transition active:scale-95"
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
