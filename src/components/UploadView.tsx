import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { UploadPage, Settings } from '../types';
import { formatBytes, getTheme } from '../types';

interface Props {
  item: UploadPage;
  settings: Settings;
  onBack?: () => void;
  isPreview?: boolean;
}

const parseLinks = (text: string): React.ReactNode[] => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline" style={{ userSelect: 'text' }}>{part}</a>;
    }
    return <span key={i}>{part}</span>;
  });
};

export const UploadView: React.FC<Props> = ({ item, settings, onBack, isPreview }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [expired, setExpired] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [userComment, setUserComment] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const theme = getTheme(settings.pageTheme);
  const showTimer = item.lifetimeEnabled && !settings.hideLifetimeOnPage;
  const showAd = settings.adEnabled && settings.adText;

  const requiredPassword = item.password || (settings.uploadPasswordEnabled ? settings.uploadPassword : '');
  const needsPassword = requiredPassword && !unlocked && !isPreview;
  const limitReached = item.currentUploads >= item.maxUploads;

  useEffect(() => {
    if (!item.lifetimeEnabled) return;
    const totalMs = (item.lifetimeHours * 60 + item.lifetimeMinutes) * 60 * 1000;
    const expiresAt = item.createdAt + totalMs;

    const update = () => {
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) { setExpired(true); setTimeLeft('Истекло'); return; }
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      setTimeLeft(h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [item]);

  const handleUnlock = () => {
    if (passwordInput === requiredPassword) {
      setUnlocked(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  const handleFiles = useCallback((newFiles: FileList) => {
    const arr = Array.from(newFiles).slice(0, item.maxFiles - files.length);
    setFiles(prev => [...prev, ...arr].slice(0, item.maxFiles));
  }, [files.length, item.maxFiles]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleUpload = () => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setUploaded(true);
      setFiles([]);
    }, 1500);
  };

  // Password screen
  if (needsPassword) {
    return (
      <div className="min-h-dvh bg-bg bg-grid flex flex-col">
        <header className="flex items-center px-4 sm:px-6 h-12 border-b border-accent/10 bg-bg/80">
          <div className="flex items-center gap-2">
            {isPreview && onBack && (
              <button onClick={onBack} className="mr-2 text-[11px] text-text-muted hover:text-accent">← Назад</button>
            )}
            {settings.logo ? (
              <img src={settings.logo} alt="" className="w-5 h-5 object-contain" />
            ) : (
              <div className="w-5 h-5 rounded bg-accent/15 flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </div>
            )}
            <span className="text-[12px] font-medium text-text">{settings.name}</span>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-xs text-center">
            <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h2 className="text-base font-semibold text-text mb-1">Требуется пароль</h2>
            <p className="text-[12px] text-text-muted mb-5">Введите пароль для доступа</p>
            <input
              type="password"
              value={passwordInput}
              onChange={e => { setPasswordInput(e.target.value); setPasswordError(false); }}
              onKeyDown={e => e.key === 'Enter' && handleUnlock()}
              placeholder="Пароль"
              className={`w-full h-10 px-4 rounded-lg bg-surface/60 border text-[13px] text-text text-center outline-none transition-all mb-3 ${
                passwordError ? 'border-danger' : 'border-border focus:border-accent/50'
              }`}
            />
            {passwordError && <p className="text-[11px] text-danger mb-3">Неверный пароль</p>}
            <button onClick={handleUnlock} className="w-full h-10 rounded-lg bg-accent text-bg text-[13px] font-semibold hover:bg-accent/90 transition-colors shadow-[0_0_20px_#22c55e20]">
              Получить доступ
            </button>
          </div>
        </main>
      </div>
    );
  }

  const adTxt = settings.adEnabled ? (settings.adText || '') : '';
  const showDefAd = settings.adEnabled && !settings.adText;

  return (
    <div className="min-h-dvh flex flex-col select-none share-bg" style={{ color: theme.text }}>
      <style>{`@keyframes bg-move{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}.share-bg{background:linear-gradient(135deg,${theme.bg},${theme.bg}dd,${theme.bg}bb,${theme.bg});background-size:400% 400%;animation:bg-move 15s ease infinite}@keyframes marquee-name{0%{transform:translateX(100%)}100%{transform:translateX(-100%)}}.name-marquee{animation:marquee-name 8s linear infinite}`}</style>
      <div className="sticky top-0 z-20 flex items-center justify-between px-5 sm:px-8 py-4 flex-shrink-0 backdrop-blur-md" style={{ background: theme.bg + 'dd' }}>
        <div className="flex items-center gap-3 min-w-0">
          {isPreview && onBack && <button onClick={onBack} className="mr-2 text-[11px] opacity-60 hover:opacity-100" style={{ color: theme.textMuted }}>←</button>}
          {settings.logo ? <img src={settings.logo} alt="" className="w-5 h-5 object-contain flex-shrink-0" /> : (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: theme.accent + '20' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            </div>
          )}
          <div className="text-[15px] font-semibold" style={{ color: theme.text }}>{settings.name}</div>
        </div>
        {showTimer && <div className="text-[12px] font-mono font-bold" style={{ color: expired ? '#ef4444' : theme.textMuted }}>{timeLeft}</div>}
      </div>

      <main className="flex-1 flex flex-col items-center px-4 sm:px-6 pt-6 pb-4">
        {(item.title || item.comment) && (
          <div className="text-center mb-5 max-w-md">
            {item.title && <h1 className="text-base font-semibold text-text mb-1">{parseLinks(item.title)}</h1>}
            {item.comment && <p className="text-[12px] text-text-muted italic">{parseLinks(item.comment)}</p>}
          </div>
        )}

        <div className="w-full max-w-md">
          {expired ? (
            <div className="text-center py-10">
              <div className="text-3xl mb-3">⏰</div>
              <div className="text-[14px] font-medium text-text mb-1">Загрузка недоступна</div>
              <div className="text-[12px] text-text-muted">Срок действия закончился</div>
            </div>
          ) : limitReached ? (
            <div className="text-center py-10">
              <div className="text-3xl mb-3">✅</div>
              <div className="text-[14px] font-medium text-text mb-1">Лимит достигнут</div>
              <div className="text-[12px] text-text-muted">Все загрузки использованы</div>
            </div>
          ) : uploaded ? (
            <div className="text-center py-10">
              <div className="text-3xl mb-3">✅</div>
              <div className="text-[14px] font-medium text-text mb-1">Файлы загружены!</div>
              <div className="text-[12px] text-text-muted">Спасибо за загрузку</div>
            </div>
          ) : (
            <>
              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`h-40 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                  dragOver ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/40 hover:bg-accent/5'
                }`}
              >
                <input
                  ref={fileRef}
                  type="file"
                  multiple={item.maxFiles > 1}
                  onChange={e => e.target.files && handleFiles(e.target.files)}
                  className="hidden"
                />
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted/40 mb-2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p className="text-[12px] text-text-muted mb-1">Перетащите файлы или нажмите</p>
                <p className="text-[10px] text-text-muted/60">до {item.maxFiles} файлов</p>
              </div>

              {/* File list */}
              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-surface/50 border border-border">
                      <div className="text-lg">📎</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-medium text-text truncate">{f.name}</div>
                        <div className="text-[9px] text-text-muted">{formatBytes(f.size)}</div>
                      </div>
                      <button onClick={() => removeFile(i)} className="w-5 h-5 rounded flex items-center justify-center text-text-muted hover:text-danger">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Comment field */}
              {item.allowComment && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-text-muted">Комментарий</label>
                    <span className={`text-[9px] font-mono ${userComment.length >= 100 ? 'text-danger' : 'text-text-muted/50'}`}>
                      {userComment.length}/100
                    </span>
                  </div>
                  <textarea
                    value={userComment}
                    onChange={e => setUserComment(e.target.value.slice(0, 100))}
                    disabled={files.length === 0}
                    placeholder={files.length === 0 ? 'Сначала добавьте файл' : 'Оставьте комментарий...'}
                    rows={2}
                    maxLength={100}
                    className={`w-full px-3 py-2 rounded-md border text-[12px] outline-none resize-none transition-all ${
                      files.length === 0
                        ? 'bg-surface/20 border-border/50 text-text-muted/50 cursor-not-allowed'
                        : 'bg-surface/60 border-border text-text placeholder:text-text-muted/40 focus:border-accent/50'
                    }`}
                  />
                </div>
              )}

              {/* Upload button */}
              {files.length > 0 && (
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full mt-4 h-10 rounded-lg text-[13px] font-semibold disabled:opacity-50 transition-opacity hover:opacity-80"
                  style={{ background: theme.text + '18', color: theme.text, border: `1px solid ${theme.text}25` }}
                >
                  {uploading ? 'Загрузка...' : `Загрузить ${files.length} файл${files.length > 1 ? 'а/ов' : ''}`}
                </button>
              )}
            </>
          )}
        </div>
      </main>

      {settings.adEnabled && (
        <div className="sticky bottom-0 px-4 py-3 text-center flex-shrink-0 backdrop-blur-md" style={{ background: theme.bg + 'cc' }}>
          <p className="text-[9px] leading-relaxed" style={{ color: theme.textMuted + 'aa', userSelect: 'text' }}>
            {showDefAd ? (
              <>Хотите так же управлять получением и раздачей файлов с помощью своего сервера Linux? Посетите страницу проекта <a href="https://github.com/LarsGravesen-invilink/File-Up-Share" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: theme.accent }}>GitHub</a></>
            ) : (
              parseLinks(adTxt)
            )}
          </p>
        </div>
      )}
    </div>
  );
};
