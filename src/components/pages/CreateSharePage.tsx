import React, { useState, useRef, useCallback } from 'react';
import { generateId, formatBytes, type ShareItem, type ShareFile, type Settings } from '../../types';

interface Props {
  onCreateShare: (item: ShareItem) => void;
  onPreview: (item: ShareItem) => void;
  settings: Settings;
}

export const CreateSharePage: React.FC<Props> = ({ onCreateShare, onPreview, settings }) => {
  const globalPw = settings.sharePasswordEnabled;
  const [files, setFiles] = useState<ShareFile[]>([]);
  const [cover, setCover] = useState('');
  const [coverSrc, setCoverSrc] = useState('');
  const [cropMode, setCropMode] = useState(false);
  const [cropPos, setCropPos] = useState({ x: 50, y: 50 });
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [hideExt, setHideExt] = useState(false);
  const [mode, setMode] = useState<'download' | 'view'>('download');
  const [allowDl, setAllowDl] = useState(true);
  const [ltOn, setLtOn] = useState(true);
  const [ltH, setLtH] = useState(24);
  const [ltM, setLtM] = useState(0);
  const [pwOn, setPwOn] = useState(false);
  const [pw, setPw] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [creating, setCreating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);
  const cropAreaRef = useRef<HTMLDivElement>(null);

  const addFiles = useCallback((fileList: FileList) => {
    Array.from(fileList).forEach(f => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFiles(prev => [...prev, { name: f.name, type: f.type, data: e.target?.result as string, size: f.size }]);
      };
      reader.readAsDataURL(f);
    });
  }, []);

  const removeFile = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); };

  // Cover crop
  const handleCoverSelect = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setCoverSrc(e.target?.result as string);
      setCropMode(true);
      setCropPos({ x: 50, y: 50 });
    };
    reader.readAsDataURL(f);
  }, []);

  const applyCrop = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800; canvas.height = 600;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const scale = Math.max(800 / img.width, 600 / img.height);
      const sw = 800 / scale, sh = 600 / scale;
      const sx = (img.width - sw) * (cropPos.x / 100);
      const sy = (img.height - sh) * (cropPos.y / 100);
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 800, 600);
      setCover(canvas.toDataURL('image/jpeg', 0.85));
      setCropMode(false);
    };
    img.src = coverSrc;
  };

  const handleCropMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!cropAreaRef.current) return;
    const rect = cropAreaRef.current.getBoundingClientRect();
    const cx = 'touches' in e ? e.touches[0].clientX : (e.buttons ? e.clientX : -1);
    if (cx < 0) return;
    const cy = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setCropPos({ x: Math.max(0, Math.min(100, ((cx - rect.left) / rect.width) * 100)), y: Math.max(0, Math.min(100, ((cy - rect.top) / rect.height) * 100)) });
  };

  const fileIcon = (t: string) => {
    if (t.startsWith('image/')) return '🖼️';
    if (t.startsWith('video/')) return '🎬';
    if (t.startsWith('audio/')) return '🎵';
    if (t.includes('pdf')) return '📄';
    if (t.includes('zip') || t.includes('rar')) return '📦';
    return '📎';
  };

  const buildItem = (): ShareItem => {
    const f = files[0];
    return {
      id: generateId(),
      files,
      fileName: f?.name || '',
      fileType: f?.type || '',
      fileData: f?.data || '',
      fileSize: f?.size || 0,
      title, comment, cover, hideExtension: hideExt, allowDownload: mode === 'download' ? true : allowDl,
      mode, lifetimeEnabled: ltOn, lifetimeHours: ltH, lifetimeMinutes: ltM,
      password: pwOn ? pw : '', createdAt: Date.now(),
    };
  };

  const publish = () => { if (!files.length) return; setCreating(true); setTimeout(() => { onCreateShare(buildItem()); setCreating(false); }, 500); };
  const preview = () => { if (!files.length) return; onPreview({ ...buildItem(), id: 'preview' }); };

  const ic = "w-full h-9 px-3 rounded-md bg-surface/60 border border-border text-[13px] text-text placeholder:text-text-muted/40 outline-none focus:border-accent/50 transition-all";
  const dc = "w-full h-9 px-3 rounded-md bg-surface/20 border border-border/50 text-[13px] text-text-muted/50 outline-none cursor-not-allowed";

  return (
    <div className="space-y-4 animate-in">
      {/* Crop modal */}
      {cropMode && coverSrc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setCropMode(false)} />
          <div className="relative w-full max-w-md rounded-xl border border-accent/20 bg-surface/95 backdrop-blur-xl p-4 animate-in">
            <h3 className="text-[13px] font-semibold text-text text-center mb-2">Выберите область 4:3</h3>
            <p className="text-[10px] text-text-muted text-center mb-3">Перетаскивайте для выбора</p>
            <div ref={cropAreaRef} className="relative w-full rounded-lg overflow-hidden cursor-crosshair border border-border" style={{ aspectRatio: '4/3' }} onMouseMove={handleCropMove} onTouchMove={handleCropMove}>
              <img src={coverSrc} alt="" className="w-full h-full object-cover" style={{ objectPosition: `${cropPos.x}% ${cropPos.y}%` }} draggable={false} />
              <div className="absolute inset-0 border-2 border-accent/50 rounded-lg pointer-events-none" />
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setCropMode(false)} className="flex-1 h-9 rounded-md border border-border text-[11px] text-text-muted">Отмена</button>
              <button onClick={applyCrop} className="flex-1 h-9 rounded-md bg-accent text-bg text-[11px] font-medium">Применить</button>
            </div>
          </div>
        </div>
      )}

      {/* Files */}
      <div className="rounded-xl border border-accent/15 bg-surface/30 backdrop-blur-sm p-4 hover-tilt">
        <label className="block text-[11px] font-medium text-text-secondary mb-2">Файлы</label>
        {files.length === 0 ? (
          <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop} onClick={() => fileRef.current?.click()} className={`h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${dragOver ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/40'}`}>
            <input ref={fileRef} type="file" multiple onChange={e => e.target.files && addFiles(e.target.files)} className="hidden" />
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted/40 mb-1"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <p className="text-[11px] text-text-muted">Перетащите файлы или нажмите</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-surface/50 border border-border">
                <span className="text-base">{fileIcon(f.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium text-text truncate">{f.name}</div>
                  <div className="text-[9px] text-text-muted">{formatBytes(f.size)}</div>
                </div>
                <button onClick={() => removeFile(i)} className="w-5 h-5 rounded flex items-center justify-center text-text-muted hover:text-danger">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            ))}
            <button onClick={() => fileRef.current?.click()} className="w-full h-8 rounded-md border border-dashed border-border hover:border-accent/40 text-[10px] text-text-muted hover:text-text transition-colors">
              + Добавить ещё
            </button>
            <input ref={fileRef} type="file" multiple onChange={e => e.target.files && addFiles(e.target.files)} className="hidden" />
          </div>
        )}
      </div>

      {/* Cover */}
      <div className="rounded-xl border border-accent/15 bg-surface/30 backdrop-blur-sm p-4 hover-tilt">
        <label className="block text-[11px] font-medium text-text-secondary mb-2">Обложка</label>
        {cover ? (
          <div className="relative rounded-lg overflow-hidden border border-border" style={{ aspectRatio: '4/3' }}>
            <img src={cover} alt="" className="w-full h-full object-cover select-none" draggable={false} style={{ pointerEvents: 'none' }} />
            <button onClick={() => setCover('')} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center text-white/80 hover:text-white">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        ) : (
          <button onClick={() => coverFileRef.current?.click()} className="w-full h-14 rounded-lg border-2 border-dashed border-border hover:border-accent/40 flex items-center justify-center gap-2 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted/50"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <span className="text-[10px] text-text-muted">Добавить обложку</span>
          </button>
        )}
        <input ref={coverFileRef} type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleCoverSelect(e.target.files[0])} className="hidden" />
      </div>

      {/* Mode & Settings */}
      <div className="rounded-xl border border-accent/15 bg-surface/30 backdrop-blur-sm p-4 space-y-3 hover-tilt">
        <label className="block text-[11px] font-medium text-text-secondary">Режим и настройки</label>

        {/* Mode selector */}
        <div>
          <div className="text-[10px] text-text-muted mb-1.5">Режим раздачи</div>
          <div className="flex rounded-md border border-border overflow-hidden">
            <button onClick={() => setMode('download')} className={`flex-1 h-9 text-[11px] font-medium transition-colors ${mode === 'download' ? 'bg-accent/15 text-accent' : 'text-text-muted hover:text-text'}`}>Загрузка</button>
            <button onClick={() => setMode('view')} className={`flex-1 h-9 text-[11px] font-medium transition-colors ${mode === 'view' ? 'bg-accent/15 text-accent' : 'text-text-muted hover:text-text'}`}>Только просмотр</button>
          </div>
        </div>

        {/* Allow download — only in view mode */}
        {mode === 'view' && (
          <div className="flex items-center justify-between py-0.5">
            <span className="text-[11px] text-text-secondary">Разрешить скачивание</span>
            <button onClick={() => setAllowDl(!allowDl)} className={`w-8 h-4 rounded-full relative transition-colors ${allowDl ? 'bg-accent' : 'bg-border'}`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${allowDl ? 'left-[18px]' : 'left-0.5'}`} />
            </button>
          </div>
        )}

        {/* Lifetime */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-text-secondary w-20">Время жизни</span>
            <button onClick={() => setLtOn(!ltOn)} className={`w-8 h-4 rounded-full relative transition-colors ${ltOn ? 'bg-accent' : 'bg-border'}`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${ltOn ? 'left-[18px]' : 'left-0.5'}`} />
            </button>
          </div>
          <div className="flex items-center gap-1.5 flex-1">
            <input type="text" inputMode="numeric" value={ltH === 0 ? '' : ltH.toString()} onChange={e => setLtH(parseInt(e.target.value.replace(/\D/g, '')) || 0)} disabled={!ltOn} placeholder="0" className={(ltOn ? ic : dc) + ' w-14 text-center text-[12px]'} />
            <span className="text-[10px] text-text-muted">ч</span>
            <input type="text" inputMode="numeric" value={ltM === 0 ? '' : ltM.toString()} onChange={e => setLtM(Math.min(59, parseInt(e.target.value.replace(/\D/g, '')) || 0))} disabled={!ltOn} placeholder="0" className={(ltOn ? ic : dc) + ' w-14 text-center text-[12px]'} />
            <span className="text-[10px] text-text-muted">м</span>
          </div>
        </div>

        <div className="flex items-center justify-between py-0.5">
          <span className="text-[11px] text-text-secondary">Скрыть расширение</span>
          <button onClick={() => setHideExt(!hideExt)} className={`w-8 h-4 rounded-full relative transition-colors ${hideExt ? 'bg-accent' : 'bg-border'}`}>
            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${hideExt ? 'left-[18px]' : 'left-0.5'}`} />
          </button>
        </div>

        {!globalPw && (
          <div className="pt-1 border-t border-border/50">
            <div className="flex items-center justify-between py-0.5 mb-2">
              <span className="text-[11px] text-text-secondary">Пароль</span>
              <button onClick={() => setPwOn(!pwOn)} className={`w-8 h-4 rounded-full relative transition-colors ${pwOn ? 'bg-accent' : 'bg-border'}`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${pwOn ? 'left-[18px]' : 'left-0.5'}`} />
              </button>
            </div>
            <input type="text" value={pw} onChange={e => setPw(e.target.value)} disabled={!pwOn} placeholder="Пароль" className={pwOn ? ic : dc} />
          </div>
        )}
      </div>

      {/* Title & Comment */}
      <div className="rounded-xl border border-accent/15 bg-surface/30 backdrop-blur-sm p-4 space-y-3 hover-tilt">
        <div>
          <label className="block text-[11px] font-medium text-text-secondary mb-1">Заголовок</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Необязательно" className={ic} />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-text-secondary mb-1">Комментарий</label>
          <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Необязательно" rows={2} className={ic + ' resize-none h-auto py-2'} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={preview} disabled={!files.length} className="flex-1 h-10 rounded-lg border border-border text-[12px] font-medium text-text-secondary hover:text-text disabled:opacity-30 transition-colors">Предпросмотр</button>
        <button onClick={publish} disabled={!files.length || creating} className="flex-1 h-10 rounded-lg bg-accent/90 text-bg text-[12px] font-semibold hover:bg-accent active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none transition-all shadow-[0_0_15px_#22c55e15]">
          {creating ? '...' : 'Опубликовать'}
        </button>
      </div>
    </div>
  );
};
