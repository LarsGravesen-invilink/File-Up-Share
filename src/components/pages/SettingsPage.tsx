import React, { useState, useRef, useCallback } from 'react';
import type { Settings } from '../../types';
import { russianTimezones, uiScales, headerScales } from '../../types';

interface Props {
  settings: Settings;
  onUpdate: (s: Partial<Settings>) => void;
}

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const max = 256;
        let { width: w, height: h } = img;
        if (w > h) { if (w > max) { h = (h * max) / w; w = max; } } else { if (h > max) { w = (w * max) / h; h = max; } }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject('err'); return; }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/png', 0.9));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Auto-format date: DD/MM/YYYY
const fmtDate = (raw: string, prev: string): string => {
  // If user is deleting, just strip non-digits and rebuild
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return digits.slice(0, 2) + '/' + digits.slice(2);
  return digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4);
};

// Auto-format time: HH:MM
const fmtTime = (raw: string, prev: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + ':' + digits.slice(2);
};

const inputCls = "w-full h-9 px-3 rounded-md bg-surface/60 border border-border text-[13px] text-text placeholder:text-text-muted/40 outline-none focus:border-accent/50 transition-all";
const disabledCls = "w-full h-9 px-3 rounded-md bg-surface/20 border border-border/50 text-[13px] text-text-muted/50 outline-none cursor-not-allowed";

const AccessSettings: React.FC<{ settings: Settings; onUpdate: (s: Partial<Settings>) => void }> = ({ settings, onUpdate }) => {
  const [domain, setDomain] = useState(settings.accessDomain || '');
  const [port, setPort] = useState(settings.accessPort ? settings.accessPort.toString() : '');
  const [ssl, setSsl] = useState(settings.accessSSL ?? true);
  const [err, setErr] = useState('');
  const [shake, setShake] = useState(false);
  const [modal, setModal] = useState(false);

  const needsPort = settings.accessMode === 'ip' || !settings.accessSSL;
  const changed = domain !== (settings.accessDomain || '') || port !== (settings.accessPort ? settings.accessPort.toString() : '') || ssl !== (settings.accessSSL ?? true);

  const validate = () => {
    if (domain && !/^[a-zA-Z0-9][a-zA-Z0-9\-\.]*\.[a-zA-Z]{2,}$/.test(domain)) {
      setErr('Некорректный формат домена');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return false;
    }
    if (port) {
      const p = parseInt(port);
      if (isNaN(p) || p < 1024 || p > 65535) {
        setErr('Порт: 1024–65535');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return false;
      }
    }
    return true;
  };

  const apply = () => {
    if (!validate()) return;
    setModal(true);
  };

  const confirm = () => {
    setModal(false);
    setErr('');
    const upd: Partial<Settings> = {};
    if (domain) {
      upd.accessDomain = domain;
      upd.accessMode = 'domain';
      upd.accessSSL = ssl;
    }
    if (port) upd.accessPort = parseInt(port);
    onUpdate(upd);
  };

  return (
    <div className="rounded-xl border border-accent/15 bg-surface/30 backdrop-blur-sm p-4 space-y-3">
      <h3 className="text-[12px] font-semibold text-text flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        Доступ к панели
      </h3>

      <div>
        <label className="block text-[10px] text-text-muted mb-1">Домен</label>
        <div style={{ animation: shake && err.includes('домен') ? 'shake 0.4s ease-in-out' : undefined }}>
          <input type="text" value={domain} onChange={e => { setDomain(e.target.value); setErr(''); }} placeholder={settings.accessDomain || 'example.com'} className={`${inputCls} font-mono text-[11px] ${err.includes('домен') ? 'border-[#ef4444] text-[#ef4444]' : ''}`} />
        </div>
      </div>

      {settings.accessMode === 'domain' && (
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] text-text">Получить SSL</div>
            <div className="text-[9px] text-text-muted">HTTPS шифрование</div>
          </div>
          <button onClick={() => setSsl(!ssl)} className={`w-8 h-4 rounded-full relative transition-colors ${ssl ? 'bg-accent' : 'bg-border'}`}>
            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${ssl ? 'left-[18px]' : 'left-0.5'}`} />
          </button>
        </div>
      )}

      {needsPort && (
        <div>
          <label className="block text-[10px] text-text-muted mb-1">Порт</label>
          <div style={{ animation: shake && err.includes('Порт') ? 'shake 0.4s ease-in-out' : undefined }}>
            <input type="text" inputMode="numeric" value={port} onChange={e => { setPort(e.target.value.replace(/\D/g, '').slice(0, 5)); setErr(''); }} placeholder={settings.accessPort ? settings.accessPort.toString() : '3000'} className={`${inputCls} w-20 text-center font-mono text-[11px] ${err.includes('Порт') ? 'border-[#ef4444] text-[#ef4444]' : ''}`} />
          </div>
          <p className="text-[9px] text-text-muted/50 mt-1">1024–65535</p>
        </div>
      )}

      {err && <p className="text-[9px] text-[#ef4444]">{err}</p>}

      {changed && (
        <button onClick={apply} className="w-full h-9 rounded-md bg-accent/90 text-bg text-[11px] font-medium hover:bg-accent transition-colors">
          Применить
        </button>
      )}

      {modal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setModal(false)} />
          <div className="relative w-full max-w-sm rounded-xl border border-accent/20 bg-surface/95 backdrop-blur-xl p-5 animate-in">
            <div className="w-10 h-10 rounded-full bg-[#eab308]/10 border border-[#eab308]/20 flex items-center justify-center mx-auto mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h3 className="text-[13px] font-semibold text-text text-center mb-2">Изменение доступа</h3>
            <p className="text-[11px] text-text-muted text-center mb-4">Панель будет перезапущена с новыми параметрами. Текущая сессия завершится.</p>
            <div className="flex gap-2">
              <button onClick={() => setModal(false)} className="flex-1 h-9 rounded-md border border-border text-[11px] text-text-muted">Отмена</button>
              <button onClick={confirm} className="flex-1 h-9 rounded-md bg-accent text-bg text-[11px] font-medium">Применить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const STORAGE_PREFIX = '/var/lib/fileupshare/';

const PathField: React.FC<{ label: string; suffix: string; onChange: (v: string) => void; changed: boolean; onApply: () => void }> = ({ label, suffix, onChange, changed, onApply }) => (
  <div>
    <label className="block text-[10px] text-text-muted mb-1 no-select">{label}</label>
    <div className="flex items-center rounded-md bg-surface/60 border border-border overflow-hidden focus-within:border-accent/50 transition-all">
      <span className="px-2 text-[10px] font-mono text-text-muted/50 select-none flex-shrink-0 bg-surface/30 no-select">{STORAGE_PREFIX}</span>
      <input
        type="text"
        value={suffix}
        onChange={e => onChange(e.target.value)}
        className="flex-1 h-9 px-1 bg-transparent text-[11px] font-mono text-text outline-none"
      />
    </div>
    {changed && (
      <button onClick={onApply} className="mt-1.5 h-7 px-3 rounded-md bg-accent/90 text-bg text-[10px] font-medium hover:bg-accent transition-colors">
        Применить новый путь
      </button>
    )}
  </div>
);

const StoragePaths: React.FC<{ settings: Settings; onUpdate: (s: Partial<Settings>) => void }> = ({ settings, onUpdate }) => {
  const defShareSuffix = 'shares';
  const defRecvSuffix = 'received';
  const getSuffix = (full: string) => full.startsWith(STORAGE_PREFIX) ? full.slice(STORAGE_PREFIX.length) : full;
  const cleanSuffix = (v: string) => v.replace(/[^a-zA-Z0-9_\-\/]/g, '').replace(/\/+/g, '/').replace(/^\//, '').replace(/\/$/, '');

  const [shareSuffix, setShareSuffix] = useState(getSuffix(settings.storagePath || STORAGE_PREFIX + defShareSuffix));
  const [recvSuffix, setRecvSuffix] = useState(getSuffix(settings.receivedPath || STORAGE_PREFIX + defRecvSuffix));
  const [modal, setModal] = useState<{ type: 'share' | 'received'; hasFiles: boolean } | null>(null);

  const origShareSuffix = getSuffix(settings.storagePath || STORAGE_PREFIX + defShareSuffix);
  const origRecvSuffix = getSuffix(settings.receivedPath || STORAGE_PREFIX + defRecvSuffix);
  const validShare = shareSuffix.trim() !== '' && shareSuffix.trim() !== '/';
  const validRecv = recvSuffix.trim() !== '' && recvSuffix.trim() !== '/';
  const spChanged = validShare && shareSuffix !== origShareSuffix;
  const rpChanged = validRecv && recvSuffix !== origRecvSuffix;

  const applyPath = (type: 'share' | 'received') => {
    setModal({ type, hasFiles: true });
  };

  const confirmApply = () => {
    if (modal) {
      const full = STORAGE_PREFIX + (modal.type === 'share' ? shareSuffix : recvSuffix);
      if (modal.type === 'share') onUpdate({ storagePath: full });
      else onUpdate({ receivedPath: full });
      setModal(null);
    }
  };


  return (
    <div className="space-y-3">
      <PathField label="Путь раздач" suffix={shareSuffix} onChange={setShareSuffix} changed={spChanged} onApply={() => applyPath('share')} />
      <PathField label="Путь загрузок" suffix={recvSuffix} onChange={setRecvSuffix} changed={rpChanged} onApply={() => applyPath('received')} />

      {modal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setModal(null)} />
          <div className="relative w-full max-w-sm rounded-xl border border-accent/20 bg-surface/95 backdrop-blur-xl p-5 animate-in">
            <h3 className="text-[13px] font-semibold text-text text-center mb-2">Изменение пути</h3>
            <p className="text-[10px] text-text-muted text-center mb-1">Новый путь:</p>
            <p className="text-[11px] text-text text-center font-mono mb-3">{STORAGE_PREFIX}{modal.type === 'share' ? shareSuffix : recvSuffix}</p>
            <p className="text-[11px] text-text-muted text-center mb-4">
              {modal.hasFiles ? 'Файлы будут перемещены из старой директории. Ссылки не изменятся.' : 'Путь будет применён для всех будущих файлов.'}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setModal(null)} className="flex-1 h-9 rounded-md border border-border text-[11px] text-text-muted">Отмена</button>
              <button onClick={confirmApply} className="flex-1 h-9 rounded-md bg-accent text-bg text-[11px] font-medium">{modal.hasFiles ? 'Переместить' : 'Применить'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const SettingsPage: React.FC<Props> = ({ settings, onUpdate }) => {
  const [name, setName] = useState(settings.name);
  const [logo, setLogo] = useState(settings.logo);
  const [qOn, setQOn] = useState(settings.quotaEnabled);
  const [qVal, setQVal] = useState(settings.quotaValue > 0 ? settings.quotaValue.toString() : '');
  const [qErr, setQErr] = useState(false);
  const [qShake, setQShake] = useState(false);
  const [qUnit, setQUnit] = useState<'MB' | 'GB'>(settings.quotaUnit);
  const [ctOn, setCTOn] = useState(settings.useCustomTime);
  const [ctDate, setCTDate] = useState(settings.customDate);
  const [ctTime, setCTTime] = useState(settings.customTime);
  const [tz, setTZ] = useState(settings.timezone);
  const [saved, setSaved] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    // Validate quota
    if (qOn && qVal) {
      const v = parseInt(qVal) || 0;
      const mb = qUnit === 'GB' ? v * 1024 : v;
      if (mb < 100 && v > 0) {
        setQErr(true);
        setQShake(true);
        setTimeout(() => setQShake(false), 500);
        return;
      }
    }
    setQErr(false);
    onUpdate({ name: name || 'FileUpShare', logo, quotaEnabled: qOn, quotaValue: parseInt(qVal) || 0, quotaUnit: qUnit, useCustomTime: ctOn, customDate: ctDate, customTime: ctTime, timezone: tz });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    try { setLogo(await compressImage(file)); } catch {}
  }, []);

  return (
    <div className="space-y-4 animate-in">
      {/* Branding */}
      <div className="rounded-xl border border-accent/15 bg-surface/30 backdrop-blur-sm p-4 space-y-4">
        <h3 className="text-[12px] font-semibold text-text flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
          Брендинг
        </h3>
        <div>
          <label className="block text-[11px] font-medium text-text-secondary mb-1.5">Название</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="FileUpShare" className={inputCls} />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-text-secondary mb-1.5">Логотип</label>
          <div className="flex gap-3">
            <div className="w-14 h-14 rounded-lg border border-border bg-bg/50 flex items-center justify-center overflow-hidden flex-shrink-0">
              {logo ? <img src={logo} alt="" className="max-w-full max-h-full object-contain" /> : <span className="text-text-muted/30 text-xl">🖼</span>}
            </div>
            <div className="flex-1">
              <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={e => { e.preventDefault(); setDragOver(false); e.dataTransfer.files[0] && handleFile(e.dataTransfer.files[0]); }} onClick={() => fileRef.current?.click()} className={`h-14 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer transition-all ${dragOver ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/40'}`}>
                <input ref={fileRef} type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" />
                <p className="text-[10px] text-text-muted">{dragOver ? 'Отпустите' : 'Перетащите или нажмите'}</p>
              </div>
              {logo && <button onClick={() => { setLogo(''); if (fileRef.current) fileRef.current.value = ''; }} className="mt-1.5 text-[10px] text-text-muted hover:text-danger transition-colors">Удалить</button>}
            </div>
          </div>
        </div>
      </div>

      {/* Panel theme */}
      <div className="rounded-xl border border-accent/15 bg-surface/30 backdrop-blur-sm p-4 space-y-3">
        <h3 className="text-[12px] font-semibold text-text flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
          Тема панели
        </h3>
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => onUpdate({ panelTheme: 'dark' })}
            className={`flex-1 h-10 flex items-center justify-center gap-2 text-[11px] font-medium transition-all ${settings.panelTheme === 'dark' ? 'bg-accent/15 text-accent' : 'text-text-muted hover:text-text'}`}
          >
            <div className="w-4 h-4 rounded-full bg-[#050a06] border border-[#1a2e22]" />
            Тёмная
          </button>
          <button
            onClick={() => onUpdate({ panelTheme: 'light' })}
            className={`flex-1 h-10 flex items-center justify-center gap-2 text-[11px] font-medium transition-all ${settings.panelTheme === 'light' ? 'bg-accent/15 text-accent' : 'text-text-muted hover:text-text'}`}
          >
            <div className="w-4 h-4 rounded-full bg-[#f4f8f5] border border-[#c8daca]" />
            Светлая
          </button>
        </div>
      </div>

      {/* Storage & Quota */}
      <div className="rounded-xl border border-accent/15 bg-surface/30 backdrop-blur-sm p-4 space-y-4">
        <h3 className="text-[12px] font-semibold text-text flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          Хранилище
        </h3>

        <StoragePaths settings={settings} onUpdate={onUpdate} />

        <div className="pt-3 border-t border-border/50">
          <div className="text-[11px] font-medium text-text mb-2">Квота</div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-text-secondary">Ограничить место</span>
          <button onClick={() => setQOn(!qOn)} className={`w-8 h-4 rounded-full relative transition-colors ${qOn ? 'bg-accent' : 'bg-border'}`}>
            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${qOn ? 'left-[18px]' : 'left-0.5'}`} />
          </button>
        </div>
        {qOn && (
          <div>
            <div className="flex items-center gap-1.5" style={{ animation: qShake ? 'shake 0.4s ease-in-out' : undefined }}>
              <input type="text" inputMode="numeric" value={qVal} onChange={e => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                setQVal(v);
                setQErr(false);
              }} placeholder="" className={`${inputCls} w-14 text-center text-[12px] ${qErr ? 'border-danger text-danger' : ''}`} />
              <div className="flex rounded-md border border-border overflow-hidden flex-shrink-0">
                {(['MB', 'GB'] as const).map(u => (
                  <button key={u} onClick={() => { setQUnit(u); setQErr(false); }} className={`px-2 h-9 text-[10px] font-medium transition-colors ${qUnit === u ? 'bg-accent/20 text-accent' : 'text-text-muted'}`}>{u}</button>
                ))}
              </div>
            </div>
            {qErr && <p className="text-[9px] text-danger mt-1">Минимум 100 МБ</p>}
            {!qErr && <p className="text-[9px] text-text-muted/50 mt-1">Минимум 100 МБ</p>}
          </div>
        )}
        </div>
      </div>

      {/* Access Settings */}
      <AccessSettings settings={settings} onUpdate={onUpdate} />

      {/* UI Scale */}
      <div className="rounded-xl border border-accent/15 bg-surface/30 backdrop-blur-sm p-4 space-y-3">
        <h3 className="text-[12px] font-semibold text-text flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          Масштаб интерфейса
        </h3>
        <div>
          <label className="block text-[10px] text-text-muted mb-1">Размер элементов</label>
          <select
            value={settings.uiScale}
            onChange={e => onUpdate({ uiScale: e.target.value as Settings['uiScale'] })}
            className={inputCls}
          >
            {(Object.keys(uiScales) as Array<keyof typeof uiScales>).map(k => (
              <option key={k} value={k}>{uiScales[k].label}</option>
            ))}
          </select>
          <p className="text-[9px] text-text-muted/50 mt-1">Масштабирует текст и элементы панели</p>
        </div>
      </div>

      {/* Header Scale */}
      <div className="rounded-xl border border-accent/15 bg-surface/30 backdrop-blur-sm p-4 space-y-3">
        <h3 className="text-[12px] font-semibold text-text flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent"><rect x="3" y="3" width="18" height="6" rx="2"/><line x1="3" y1="13" x2="21" y2="13"/><line x1="3" y1="17" x2="15" y2="17"/></svg>
          Масштаб верхней зоны
        </h3>
        <div>
          <label className="block text-[10px] text-text-muted mb-1">Шапка и логотип</label>
          <select
            value={settings.headerScale}
            onChange={e => onUpdate({ headerScale: e.target.value as Settings['headerScale'] })}
            className={inputCls}
          >
            {(Object.keys(headerScales) as Array<keyof typeof headerScales>).map(k => (
              <option key={k} value={k}>{headerScales[k].label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Date & Time */}
      <div className="rounded-xl border border-accent/15 bg-surface/30 backdrop-blur-sm p-4 space-y-3">
        <h3 className="text-[12px] font-semibold text-text flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Дата и время
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] text-text">Автоматическая синхронизация</div>
            <div className="text-[9px] text-text-muted">Выключите для ручной настройки</div>
          </div>
          <button onClick={() => setCTOn(!ctOn)} className={`w-8 h-4 rounded-full relative transition-colors ${ctOn ? 'bg-accent' : 'bg-border'}`}>
            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${ctOn ? 'left-[18px]' : 'left-0.5'}`} />
          </button>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-[9px] text-text-muted mb-1">Дата (ДД/ММ/ГГГГ)</label>
            <input type="text" inputMode="numeric" value={ctDate} onChange={e => setCTDate(fmtDate(e.target.value, ctDate))} disabled={ctOn} placeholder="01/01/2025" maxLength={10} className={!ctOn ? inputCls : disabledCls} />
          </div>
          <div className="flex-1">
            <label className="block text-[9px] text-text-muted mb-1">Время (ЧЧ:ММ)</label>
            <input type="text" inputMode="numeric" value={ctTime} onChange={e => setCTTime(fmtTime(e.target.value, ctTime))} disabled={ctOn} placeholder="12:00" maxLength={5} className={!ctOn ? inputCls : disabledCls} />
          </div>
        </div>
        <div>
          <label className="block text-[9px] text-text-muted mb-1">Часовой пояс</label>
          <select value={tz} onChange={e => setTZ(e.target.value)} disabled={ctOn} className={!ctOn ? inputCls : disabledCls}>
            {russianTimezones.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <p className="text-[9px] text-text-muted/50">{ctOn ? 'Автоматическая синхронизация' : 'Ручные настройки времени'}</p>
      </div>

      <button onClick={handleSave} className={`w-full h-10 rounded-lg text-[13px] font-semibold transition-all ${saved ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-accent/90 text-bg hover:bg-accent shadow-[0_0_20px_#22c55e18]'}`}>
        {saved ? '✓ Сохранено' : 'Сохранить настройки'}
      </button>
    </div>
  );
};
