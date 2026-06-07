import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Upload, Eye, Download, Lock, Clock, FileIcon, Image as LucideImage, Film, Music, ImagePlus } from 'lucide-react';
import { Toggle } from '../Toggle';
import { DemoModal } from '../DemoModal';
import { UploadModal } from '../UploadModal';
import { SuccessModal } from '../SuccessModal';
import { CoverCropper } from '../CoverCropper';
import type { Share, ShareFile, Settings } from '../../types';
import { generateId, formatBytes, durationToMs } from '../../helpers';
import * as api from '../../api';

interface Props {
  settings: Settings;
  onAdd: (share: Share) => Promise<Share | null>;
}

function getFileIcon(type: string) {
  if (type.startsWith('video')) return <Film className="h-3.5 w-3.5 text-blue-400" />;
  if (type.startsWith('audio')) return <Music className="h-3.5 w-3.5 text-emerald-400" />;
  if (type.startsWith('image')) return <LucideImage className="h-3.5 w-3.5 text-violet-400" />;
  return <FileIcon className="h-3.5 w-3.5 text-cyan-400" />;
}

function isMediaFile(type: string) {
  return type.startsWith('video') || type.startsWith('audio') || type.startsWith('image');
}

export function CreateSharePage({ settings, onAdd }: Props) {
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<'view' | 'download'>('view');
  const [allowDownload, setAllowDownload] = useState(false);
  const [hideTimer, setHideTimer] = useState(false);
  const [lifetime, setLifetime] = useState(24);
  const [lifetimeUnit, setLifetimeUnit] = useState<'hours' | 'minutes'>('hours');
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [hideExtensions, setHideExtensions] = useState(false);
  const [coverData, setCoverData] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  const [showDemo, setShowDemo] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [published, setPublished] = useState<{ link: string; title: string } | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    if (mode === 'view') {
      const mediaOnly = newFiles.filter(f => isMediaFile(f.type));
      setFiles(prev => [...prev, ...mediaOnly]);
    } else {
      setFiles(prev => [...prev, ...newFiles]);
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const canPublish = Boolean(title.trim() || files.length > 0);

  const handleModeChange = (newMode: 'view' | 'download') => {
    setMode(newMode);
    if (newMode === 'view') {
      setFiles(prev => prev.filter(f => isMediaFile(f.type)));
      setAllowDownload(false);
    }
  };

  const publish = async () => {
    if (!canPublish) return;

    const id = generateId();
    const now = Date.now();
    const ms = durationToMs(lifetime, lifetimeUnit);

    const shareFiles: ShareFile[] = files.map(f => ({
      name: f.name,
      size: f.size,
      type: f.type,
      storedName: '',
    } as ShareFile & { storedName: string }));

    const share: Share = {
      id,
      title: title.trim() || 'Без названия',
      comment: comment.trim(),
      files: shareFiles,
      cover: coverData,
      mode,
      allowDownload: mode === 'download' ? true : allowDownload,
      lifetime,
      lifetimeUnit,
      hideExtensions,
      hideTimer,
      password: usePassword ? password : '',
      createdAt: now,
      expiresAt: now + ms,
      link: '',
    } as Share & { hideTimer?: boolean };

    if (files.length > 0) {
      setUploading(true);
      setUploadProgress(0);

      try {
        const uploadResult = await api.uploadFiles(id, files, (progress) => {
          setUploadProgress(progress);
        });
        share.files = uploadResult.files;
        share.id = uploadResult.shareId;
      } catch {
        setUploading(false);
        return;
      }
    }

    const result = await onAdd(share);
    setUploading(false);

    if (result) {
      setPublished({
        link: window.location.origin + result.link,
        title: result.title,
      });
    }
  };

  const cancelUpload = () => {
    api.cancelUpload();
    setUploading(false);
    setUploadProgress(0);
  };

  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setCoverFile(file);
      setShowCropper(true);
    }
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  const handleCoverCropped = (dataUrl: string) => {
    setCoverData(dataUrl);
    setShowCropper(false);
    setCoverFile(null);
  };

  const closeSuccess = () => {
    setPublished(null);
    setTitle('');
    setComment('');
    setFiles([]);
    setPassword('');
    setUsePassword(false);
    setCoverData('');
  };

  const demoShare = {
    title: title || 'Демо раздача',
    comment,
    cover: coverData,
    files: files.map(f => ({ name: f.name, size: f.size, type: f.type, storedName: '' })),
    mode,
    allowDownload: mode === 'download' ? true : allowDownload,
    hideExtensions,
    hideTimer,
    password: usePassword ? password : '',
    expiresAt: Date.now() + durationToMs(lifetime, lifetimeUnit),
  };

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-5"
      >
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
          <Upload className="h-4 w-4 text-cyan-400" />
          Создать раздачу
        </h3>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs text-white/30">Заголовок</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Название раздачи"
              className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/15 outline-none transition focus:border-cyan-500/30"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-white/30">Комментарий</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Описание (необязательно)"
              rows={2}
              className="w-full resize-none rounded-lg border border-white/8 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/15 outline-none transition focus:border-cyan-500/30"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-white/30">Обложка 4:3 <span className="text-white/15">(необязательно)</span></label>
            <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverSelect} className="hidden" />
            {coverData ? (
              <div className="relative overflow-hidden rounded-lg">
                <img src={coverData} alt="" className="aspect-[4/3] w-full object-cover" />
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => coverInputRef.current?.click()}
                    className="rounded-lg bg-black/50 p-1.5 text-white/60 transition active:scale-90 hover:bg-black/70 hover:text-white"
                  >
                    <ImagePlus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setCoverData('')}
                    className="rounded-lg bg-black/50 p-1.5 text-white/60 transition active:scale-90 hover:bg-red-500/50 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => coverInputRef.current?.click()}
                className="btn-glow flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/10 bg-white/3 py-4 text-xs text-white/25 transition hover:border-violet-500/30 hover:bg-violet-500/5 hover:text-violet-400/60"
              >
                <ImagePlus className="h-4 w-4" />
                Добавить обложку
              </button>
            )}
          </div>

          <div>
            <label className="mb-2 block text-xs text-white/30">Режим</label>
            <div className="flex gap-2">
              <button
                onClick={() => handleModeChange('view')}
                className={`flex-1 rounded-lg px-3 py-2.5 text-xs font-medium transition ${mode === 'view' ? 'bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30' : 'bg-white/3 text-white/30 hover:bg-white/5'}`}
              >
                <Eye className="mx-auto mb-1 h-4 w-4" />
                Просмотр
                <span className="mt-1 block text-[9px] opacity-50">Только медиа</span>
              </button>
              <button
                onClick={() => handleModeChange('download')}
                className={`flex-1 rounded-lg px-3 py-2.5 text-xs font-medium transition ${mode === 'download' ? 'bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/30' : 'bg-white/3 text-white/30 hover:bg-white/5'}`}
              >
                <Download className="mx-auto mb-1 h-4 w-4" />
                Загрузка
                <span className="mt-1 block text-[9px] opacity-50">Любые файлы</span>
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs text-white/30">
              Файлы {mode === 'view' && <span className="text-white/15">(только видео, аудио, изображения)</span>}
            </label>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept={mode === 'view' ? 'video/*,audio/*,image/*' : '*'}
              onChange={addFiles}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="btn-glow flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/10 bg-white/3 py-5 text-xs text-white/30 transition hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:text-cyan-400/60"
            >
              <Plus className="h-4 w-4" />
              Добавить файлы
            </button>
            <AnimatePresence>
              {files.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 space-y-1.5">
                  {files.map((f, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-center gap-2 rounded-lg bg-white/3 px-3 py-2"
                    >
                      {getFileIcon(f.type)}
                      <span className="flex-1 truncate text-xs text-white/50">{f.name}</span>
                      <span className="text-[10px] text-white/20">{formatBytes(f.size)}</span>
                      <button onClick={() => removeFile(i)} className="text-white/15 hover:text-red-400">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            <p className="mt-2 text-[10px] text-white/15">
              {mode === 'view' ? 'Только заголовок и комментарий без файла — тоже возможно' : 'Без ограничений на размер и тип файлов'}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-xl p-5"
      >
        <h3 className="mb-4 text-sm font-semibold text-white">Параметры страницы</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-xs text-white/30">
                <Clock className="h-3 w-3" /> Время жизни
              </label>
              <input
                type="number"
                value={lifetime}
                onChange={e => setLifetime(Math.max(1, Number(e.target.value)))}
                min={1}
                className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-white/30">Единица</label>
              <select
                value={lifetimeUnit}
                onChange={e => setLifetimeUnit(e.target.value as 'hours' | 'minutes')}
                className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/30"
              >
                <option value="hours">Часы</option>
                <option value="minutes">Минуты</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-white/3 px-4 py-3">
            <span className="text-xs text-white/50">Скрыть таймер на странице</span>
            <Toggle checked={hideTimer} onChange={setHideTimer} />
          </div>

          <div className="flex items-center justify-between rounded-lg bg-white/3 px-4 py-3">
            <span className="text-xs text-white/50">Скрыть расширения файлов</span>
            <Toggle checked={hideExtensions} onChange={setHideExtensions} />
          </div>

          <div className={`flex items-center justify-between rounded-lg px-4 py-3 ${mode === 'download' ? 'bg-white/3 opacity-40' : 'bg-white/3'}`}>
            <span className="text-xs text-white/50">Разрешить скачивание</span>
            <Toggle checked={mode === 'download' ? true : allowDownload} onChange={setAllowDownload} disabled={mode === 'download'} />
          </div>

          <div className="rounded-lg bg-white/3 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-white/50">
                <Lock className="h-3 w-3" /> Пароль для доступа
              </div>
              <Toggle checked={usePassword} onChange={setUsePassword} />
            </div>
            {usePassword && (
              <input
                type="text"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Введите пароль"
                className="mt-2 w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/15 outline-none focus:border-cyan-500/30"
              />
            )}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex gap-3"
      >
        <button
          onClick={() => setShowDemo(true)}
          className="btn-glow flex-1 rounded-xl border border-white/8 bg-white/3 py-3 text-xs font-medium text-white/40 transition hover:bg-white/5 hover:text-white/60"
        >
          Демо
        </button>
        <button
          onClick={publish}
          disabled={!canPublish}
          className="btn-glow flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 py-3 text-xs font-semibold text-white shadow-lg shadow-cyan-500/15 transition hover:shadow-cyan-500/25 disabled:opacity-40"
        >
          Опубликовать
        </button>
      </motion.div>

      {showCropper && coverFile && (
        <CoverCropper
          imageFile={coverFile}
          onCrop={handleCoverCropped}
          onCancel={() => { setShowCropper(false); setCoverFile(null); }}
        />
      )}

      {showDemo && (
        <DemoModal
          share={demoShare}
          settings={settings}
          onClose={() => setShowDemo(false)}
        />
      )}

      {uploading && (
        <UploadModal
          progress={uploadProgress}
          onCancel={cancelUpload}
        />
      )}

      {published && (
        <SuccessModal
          type="share"
          title={published.title}
          link={published.link}
          onClose={closeSuccess}
        />
      )}
    </div>
  );
}
