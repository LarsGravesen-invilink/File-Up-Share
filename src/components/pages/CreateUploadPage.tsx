import React, { useState } from 'react';
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

  const handleCreate = () => {
    setCreating(true);
    setTimeout(() => {
      onCreateUpload(buildItem());
      setCreating(false);
      setTitle('');
      setComment('');
      setLifetimeEnabled(true);
      setLifetimeHours(24);
      setLifetimeMinutes(0);
      setMaxFiles(1);
      setMaxUploads(1);
      setPasswordEnabled(false);
      setPassword('');
    }, 500);
  };

  const handlePreviewClick = () => {
    onPreview({ ...buildItem(), id: 'preview' });
  };

  const inputClass = "w-full h-9 px-3 rounded-md bg-surface/60 border border-border text-[13px] text-text placeholder:text-text-muted/40 outline-none focus:border-accent/50 transition-all";
  const disabledInputClass = "w-full h-9 px-3 rounded-md bg-surface/20 border border-border/50 text-[13px] text-text-muted/50 outline-none cursor-not-allowed";

  return (
    <div className="space-y-4 animate-in">
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

        {/* Password — hidden if global password set */}
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
        <button onClick={handleCreate} disabled={creating} className="flex-1 h-10 rounded-lg bg-accent/90 text-bg text-[12px] font-semibold hover:bg-accent disabled:opacity-30 transition-colors shadow-[0_0_15px_#22c55e15]">
          {creating ? 'Публикация...' : 'Опубликовать'}
        </button>
      </div>
    </div>
  );
};
