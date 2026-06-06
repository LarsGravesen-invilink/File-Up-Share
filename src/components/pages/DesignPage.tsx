import React, { useState } from 'react';
import type { Settings } from '../../types';
import { pageThemes, getTheme } from '../../types';

interface Props {
  settings: Settings;
  onUpdate: (s: Partial<Settings>) => void;
}

export const DesignPage: React.FC<Props> = ({ settings, onUpdate }) => {
  const [adText, setAdText] = useState(settings.adText);
  const [adEnabled, setAdEnabled] = useState(settings.adEnabled);
  const [hideLifetime, setHideLifetime] = useState(settings.hideLifetimeOnPage);
  const [themeId, setThemeId] = useState(settings.pageTheme);
  const [themeDropdown, setThemeDropdown] = useState(false);
  const [confirmTheme, setConfirmTheme] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onUpdate({ adText, adEnabled, hideLifetimeOnPage: hideLifetime, pageTheme: themeId });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleThemeSelect = (id: string) => {
    setConfirmTheme(id);
    setThemeDropdown(false);
  };

  const handleThemeConfirm = () => {
    if (confirmTheme) {
      setThemeId(confirmTheme);
      setConfirmTheme(null);
    }
  };

  const currentTheme = getTheme(themeId);

  return (
    <div className="space-y-4 animate-in">
      {/* Theme */}
      <div className="rounded-xl border border-accent/15 bg-surface/30 backdrop-blur-sm p-4">
        <h3 className="text-[12px] font-semibold text-text mb-4 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
          Тема страниц
        </h3>

        {/* Current theme preview */}
        <div className="mb-3">
          <label className="block text-[10px] text-text-muted mb-1.5">Текущая тема</label>
          <div className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-bg/50">
            {/* Mini preview */}
            <div className="w-16 h-10 rounded-md overflow-hidden border flex-shrink-0" style={{ borderColor: currentTheme.border, background: currentTheme.bg }}>
              <div className="h-2" style={{ background: currentTheme.surface, borderBottom: `1px solid ${currentTheme.border}` }} />
              <div className="flex flex-col items-center justify-center h-8 gap-0.5">
                <div className="w-6 h-0.5 rounded-full" style={{ background: currentTheme.text }} />
                <div className="w-8 h-1.5 rounded-sm" style={{ background: currentTheme.accent }} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium text-text">{currentTheme.name}</div>
              <div className="text-[9px] text-text-muted">{currentTheme.id === 'default' ? 'По умолчанию' : currentTheme.bg.startsWith('#f') || currentTheme.bg.startsWith('#e') ? 'Светлая' : 'Тёмная'}</div>
            </div>
            <button
              onClick={() => setThemeDropdown(!themeDropdown)}
              className="h-7 px-3 rounded-md border border-border text-[10px] text-text-secondary hover:text-text hover:border-border-light transition-colors"
            >
              Изменить
            </button>
          </div>
        </div>

        {/* Theme dropdown */}
        {themeDropdown && (
          <div className="rounded-lg border border-accent/15 bg-bg/95 p-2 space-y-1 mb-3 max-h-64 overflow-y-auto animate-in">
            <div className="text-[9px] text-text-muted/60 px-1 pb-1 uppercase tracking-wider">Тёмные</div>
            {pageThemes.filter(t => !t.bg.startsWith('#f') && !t.bg.startsWith('#e')).map(t => (
              <button
                key={t.id}
                onClick={() => handleThemeSelect(t.id)}
                className={`w-full flex items-center gap-2.5 p-2 rounded-md transition-colors ${themeId === t.id ? 'bg-accent/10' : 'hover:bg-surface-2/50'}`}
              >
                <div className="w-12 h-8 rounded overflow-hidden border flex-shrink-0" style={{ borderColor: t.border, background: t.bg }}>
                  <div className="h-1.5" style={{ background: t.surface, borderBottom: `1px solid ${t.border}` }} />
                  <div className="flex flex-col items-center justify-center h-6 gap-0.5">
                    <div className="w-5 h-0.5 rounded-full" style={{ background: t.text }} />
                    <div className="w-6 h-1 rounded-sm" style={{ background: t.accent }} />
                  </div>
                </div>
                <div className="text-[11px] text-text text-left">{t.name}</div>
                {themeId === t.id && <span className="text-[9px] text-accent ml-auto">✓</span>}
              </button>
            ))}
            <div className="text-[9px] text-text-muted/60 px-1 pt-2 pb-1 uppercase tracking-wider border-t border-border/50 mt-1">Светлые</div>
            {pageThemes.filter(t => t.bg.startsWith('#f') || t.bg.startsWith('#e')).map(t => (
              <button
                key={t.id}
                onClick={() => handleThemeSelect(t.id)}
                className={`w-full flex items-center gap-2.5 p-2 rounded-md transition-colors ${themeId === t.id ? 'bg-accent/10' : 'hover:bg-surface-2/50'}`}
              >
                <div className="w-12 h-8 rounded overflow-hidden border flex-shrink-0" style={{ borderColor: t.border, background: t.bg }}>
                  <div className="h-1.5" style={{ background: t.surface, borderBottom: `1px solid ${t.border}` }} />
                  <div className="flex flex-col items-center justify-center h-6 gap-0.5">
                    <div className="w-5 h-0.5 rounded-full" style={{ background: t.text }} />
                    <div className="w-6 h-1 rounded-sm" style={{ background: t.accent }} />
                  </div>
                </div>
                <div className="text-[11px] text-text text-left">{t.name}</div>
                {themeId === t.id && <span className="text-[9px] text-accent ml-auto">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Options */}
      <div className="rounded-xl border border-accent/15 bg-surface/30 backdrop-blur-sm p-4 space-y-3">
        <h3 className="text-[12px] font-semibold text-text mb-1 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
          Параметры
        </h3>

        <div className="flex items-center justify-between py-0.5">
          <div>
            <div className="text-[11px] text-text">Скрыть таймер</div>
            <div className="text-[9px] text-text-muted">Не показывать время жизни на странице</div>
          </div>
          <button onClick={() => setHideLifetime(!hideLifetime)} className={`w-8 h-4 rounded-full relative transition-colors ${hideLifetime ? 'bg-accent' : 'bg-border'}`}>
            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${hideLifetime ? 'left-[18px]' : 'left-0.5'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between py-0.5">
          <div>
            <div className="text-[11px] text-text">Рекламный блок</div>
            <div className="text-[9px] text-text-muted">Текст внизу публичных страниц</div>
          </div>
          <button onClick={() => setAdEnabled(!adEnabled)} className={`w-8 h-4 rounded-full relative transition-colors ${adEnabled ? 'bg-accent' : 'bg-border'}`}>
            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${adEnabled ? 'left-[18px]' : 'left-0.5'}`} />
          </button>
        </div>

        {adEnabled && (
          <div className="pt-2">
            <label className="block text-[10px] text-text-muted mb-1">Текст рекламы</label>
            <textarea
              value={adText}
              onChange={e => setAdText(e.target.value)}
              placeholder="Текст или ссылка"
              rows={2}
              className="w-full px-3 py-2 rounded-md bg-surface/60 border border-border text-[12px] text-text placeholder:text-text-muted/40 outline-none focus:border-accent/50 transition-all resize-none"
            />
            <p className="text-[9px] text-text-muted/50 mt-1">Ссылки кликабельны</p>
          </div>
        )}
      </div>

      <button onClick={handleSave} disabled={saved} className={`w-full h-10 rounded-lg text-[13px] font-semibold transition-all active:scale-[0.98] ${saved ? 'bg-accent/20 text-accent border border-accent/30 opacity-60 pointer-events-none' : 'bg-accent/90 text-bg hover:bg-accent shadow-[0_0_20px_#22c55e18]'}`}>
        {saved ? '✓ Сохранено' : 'Сохранить настройки'}
      </button>

      {/* Confirm theme modal */}
      {confirmTheme && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={() => setConfirmTheme(null)} />
          <div className="relative w-full max-w-xs rounded-xl border border-accent/20 bg-surface/95 backdrop-blur-xl p-5 animate-in">
            <h3 className="text-[13px] font-semibold text-text text-center mb-2">Применить тему?</h3>
            <p className="text-[11px] text-text-muted text-center mb-4">
              Тема «{getTheme(confirmTheme).name}» будет применена ко всем страницам раздач и загрузок
            </p>
            {/* Preview */}
            <div className="rounded-lg overflow-hidden border mb-4 mx-auto w-32 h-20" style={{ borderColor: getTheme(confirmTheme).border, background: getTheme(confirmTheme).bg }}>
              <div className="h-4 flex items-center px-2" style={{ background: getTheme(confirmTheme).surface, borderBottom: `1px solid ${getTheme(confirmTheme).border}` }}>
                <div className="w-6 h-1 rounded-full" style={{ background: getTheme(confirmTheme).textMuted }} />
              </div>
              <div className="flex flex-col items-center justify-center h-16 gap-1">
                <div className="w-12 h-1 rounded-full" style={{ background: getTheme(confirmTheme).text }} />
                <div className="w-8 h-1 rounded-full" style={{ background: getTheme(confirmTheme).textMuted }} />
                <div className="w-14 h-3 rounded-sm mt-1" style={{ background: getTheme(confirmTheme).accent }} />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmTheme(null)} className="flex-1 h-9 rounded-md border border-border text-[11px] text-text-muted hover:text-text transition-colors">Отмена</button>
              <button onClick={handleThemeConfirm} className="flex-1 h-9 rounded-md bg-accent text-bg text-[11px] font-medium hover:bg-accent/90 transition-colors">Применить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
