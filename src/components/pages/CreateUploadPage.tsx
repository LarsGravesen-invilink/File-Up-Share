import React, { useState, useRef } from 'react';
import { generateId, type UploadPage, type Settings } from '../../types';

interface Props {
  onCreateUpload: (item: UploadPage) => void;
  onPreview: (item: UploadPage) => void;
  settings: Settings;
}

export const CreateUploadPage: React.FC<Props> = ({ onCreateUpload, onPreview, settings }) => {
  const globalPw = settings.uploadPasswordEnabled;
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [lifetimeEnabled, setLifetimeEnabled] = useState(true);
  const [lifetimeHours, setLifetimeHours] = useState(24);
  const [lifetimeMinutes, setLifetimeMinutes] = useState(0);
  const [maxFiles, setMaxFiles] = useState(1);
  const [maxUploads, setMaxUploads] = useState(1);
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [password, setPassword] = useState('');
  const [allowComment, setAllowComment] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const abortRef = useRef<boolean>(false);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const buildItem = (): UploadPage => ({
    id: generateId(),
    title,
    comment,
    lifetimeEnabled,
    lifetimeHours,
    lifetimeMinutes,
    maxFiles,
    maxUploads,
    currentUploads: 0,
    password: passwordEnabled ? password : '',
    allowComment,
    createdAt: Date.now(),
  });

  const cancelUpload = () => {
    abortRef.current = true;
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    setCreating(false);
    setUploadProgress(0);
  };

  const handleCreate = () => {
    abortRef.current = false;
    setCreating(true);
    setUploadProgress(0);

    const duration = 800;
    const step = 100 / (duration / 50);
    let progress = 0;

    progressIntervalRef.current = setInterval(() => {
      if (abortRef.current) return;
      progress = Math.min(progress + step * (0.7 + Math.random() * 0.6), 95);
      setUploadProgress(progress);
    }, 50);

    Promise.resolve().then(async () => {
      await new Promise(r => setTimeout(r, duration));
      if (abortRef.current) return;
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setUploadProgress(100);
      await new Promise(r => setTimeout(r, 200));
      if (abortRef.current) return;
      onCreateUpload(buildItem());
      setCreating(false);
      setUploadProgress(0);
      setTitle('');
      setComment('');
      setLifetimeEnabled(true);
      setLifetimeHours(24);
      setLifetimeMinutes(0);
      setMaxFiles(1);
      setMaxUploads(1);
      setPasswordEnabled(false);
      setPassword('');
    });
  };

  const handlePreviewClick = () => {
    onPreview({ ...buildItem(), id: 'preview' });
  };

  const inputClass = "w-full h-9 px-3 rounded-md bg-surface/60 border border-border text-[13px] text-text placeholder:text-text-muted/40 outline-none focus:border-accent/50 transition-all";
  const disabledInputClass = "w-full h-9 px-3 rounded-md bg-surface/20 border border-border/50 text-[13px] text-text-muted/50 outline-none cursor-not-allowed";

  return (
    <div className="space-y-4 animate-in">
      {/* Upload progress modal */}
      {creating && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm rounded-2xl border border-accent/20 bg-surface/95 backdrop-blur-xl p-6 animate-in shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent animate-bounce">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <div>
                <div className="text-[13px] font-semibold text-text">Идёт загрузка</div>
                <div className="text-[10px] text-text-muted">Создание страницы загрузки...</div>
              </div>
            </div>

            <div className="relative h-2 rounded-full bg-border/60 overflow-hidden mb-2">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-accent transition-all duration-100"
                style={{ width: `${uploadProgress}%` }}
              />
              <div className="absolute inset-0 rounded-full bg-accent/20 animate-pulse" style={{ display: uploadProgress >= 100 ? 'none' : 'block' }} />
            </div>
            <div className="flex items-center justify-between mb-5">
              <span className="text-[10px] text-text-muted">
                {uploadProgress < 100 ? 'Сохранение настроек...' : 'Завершение...'}
              </span>
              <span className="text-[10px] font-mono text-accent">{Math.round(uploadProgress)}%</span>
            </div>

            <button
              onClick={cancelUpload}
              className="w-full h-9 rounded-lg border border-border text-[12px] font-medium text-text-muted hover:text-text hover:border-accent/40 transition-colors"
            >
              Отменить
            </button>
          </div>
        </div>
      )}

      {/* Title & Comment */}
      <div className="rounded-xl border border-accent/15 bg-surface/30 backdrop-blur-sm p-4 space-y-3">
        <label className="block text-[11px] font-medium text-text-secondary">Информация</label>
        <div>
          <label className="block text-[10px] text-text-muted mb-1">Заголовок</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Например: Загрузите файлы" className={inputClass} />
        </div>
        <div>
          <label className="block text-[10px] text-text-muted mb-1">Комментарий</label>
          <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Инструкция для загрузчика" rows={2} className={inputClass + ' resize-none h-auto py-2'} />
        </div>
      </div>

      {/* Settings */}
      <div className="rounded-xl border border-accent/15 bg-surface/30 backdrop-blur-sm p-4 space-y-3">
        <label className="block text-[11px] font-medium text-text-secondary">Настройки</label>

        {/* Lifetime */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-text-secondary w-20">Время жизни</span>
            <button onClick={() => setLifetimeEnabled(!lifetimeEnabled)} className={`w-8 h-4 rounded-full relative transition-colors ${lifetimeEnabled ? 'bg-accent' : 'bg-border'}`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${lifetimeEnabled ? 'left-[18px]' : 'left-0.5'}`} />
            </button>
          </div>
          <div className="flex items-center gap-1.5 flex-1">
            <input type="text" inputMode="numeric" value={lifetimeHours === 0 ? '' : lifetimeHours.toString()} onChange={e => setLifetimeHours(parseInt(e.target.value.replace(/\D/g, '')) || 0)} disabled={!lifetimeEnabled} placeholder="0" className={(lifetimeEnabled ? inputClass : disabledInputClass) + ' w-14 text-center text-[12px]'} />
            <span className="text-[10px] text-text-muted">ч</span>
            <input type="text" inputMode="numeric" value={lifetimeMinutes === 0 ? '' : lifetimeMinutes.toString()} onChange={e => { const v = parseInt(e.target.value.replace(/\D/g, '')) || 0; setLifetimeMinutes(Math.min(59, v)); }} disabled={!lifetimeEnabled} placeholder="0" className={(lifetimeEnabled ? inputClass : disabledInputClass) + ' w-14 text-center text-[12px]'} />
            <span className="text-[10px] text-text-muted">м</span>
          </div>
        </div>

        {/* Limits */}
        <div className="pt-2 border-t border-border/50 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] text-text">Файлов за раз</div>
              <div className="text-[9px] text-text-muted">Макс. файлов в одной загрузке</div>
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={maxFiles === 1 ? '' : maxFiles.toString()}
              onChange={e => setMaxFiles(Math.max(1, parseInt(e.target.value.replace(/\D/g, '')) || 1))}
              placeholder="1"
              className={inputClass + ' w-16 text-center text-[12px]'}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] text-text">Загрузок всего</div>
              <div className="text-[9px] text-text-muted">Сколько раз можно загрузить</div>
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={maxUploads === 1 ? '' : maxUploads.toString()}
              onChange={e => setMaxUploads(Math.max(1, parseInt(e.target.value.replace(/\D/g, '')) || 1))}
              placeholder="1"
              className={inputClass + ' w-16 text-center text-[12px]'}
            />
          </div>
        </div>

        {/* Allow user comment */}
        <div className="flex items-center justify-between py-0.5">
          <div>
            <div className="text-[11px] text-text">Комментарий загрузчика</div>
            <div className="text-[9px] text-text-muted">Разрешить пользователю оставить комментарий</div>
          </div>
          <button onClick={() => setAllowComment(!allowComment)} className={`w-8 h-4 rounded-full relative transition-colors ${allowComment ? 'bg-accent' : 'bg-border'}`}>
            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${allowComment ? 'left-[18px]' : 'left-0.5'}`} />
          </button>
        </div>

        {/* Password */}
        {!globalPw && (<div className="pt-2 border-t border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-text-secondary">Пароль доступа</span>
            <button onClick={() => setPasswordEnabled(!passwordEnabled)} className={`w-8 h-4 rounded-full relative transition-colors ${passwordEnabled ? 'bg-accent' : 'bg-border'}`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${passwordEnabled ? 'left-[18px]' : 'left-0.5'}`} />
            </button>
          </div>
          <input
            type="text"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={!passwordEnabled}
            placeholder="Введите пароль"
            className={passwordEnabled ? inputClass : disabledInputClass}
          />
        </div>)}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={handlePreviewClick} className="flex-1 h-10 rounded-lg border border-border text-[12px] font-medium text-text-secondary hover:text-text transition-colors">
          Предпросмотр
        </button>
        <button onClick={handleCreate} disabled={creating} className="flex-1 h-10 rounded-lg bg-accent/90 text-bg text-[12px] font-semibold hover:bg-accent active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none transition-all shadow-[0_0_15px_#22c55e15]">
          Опубликовать
        </button>
      </div>
    </div>
  );
};
