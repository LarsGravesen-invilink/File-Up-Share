import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, Clock, Lock, MessageSquare, Upload as UploadIcon, ImagePlus, X } from 'lucide-react';
import { Toggle } from '../Toggle';
import { SuccessModal } from '../SuccessModal';
import { DemoUploadModal } from '../DemoUploadModal';
import { CoverCropper } from '../CoverCropper';
import type { Upload as UploadType, Settings } from '../../types';
import { generateId, durationToMs } from '../../helpers';

interface Props {
  settings: Settings;
  onAdd: (upload: UploadType) => Promise<UploadType | null>;
}

export function CreateUploadPage({ settings, onAdd }: Props) {
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [lifetime, setLifetime] = useState(24);
  const [lifetimeUnit, setLifetimeUnit] = useState<'hours' | 'minutes'>('hours');
  const [maxFiles, setMaxFiles] = useState(5);
  const [allowComment, setAllowComment] = useState(true);
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [hideTimer, setHideTimer] = useState(false);
  const [coverData, setCoverData] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
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

  const [showDemo, setShowDemo] = useState(false);
  const [published, setPublished] = useState<{ link: string; title: string } | null>(null);

  const publish = async () => {
    const id = generateId();
    const now = Date.now();
    const ms = durationToMs(lifetime, lifetimeUnit);
    const upload: UploadType = {
      id,
      title: title.trim() || 'Без названия',
      comment: comment.trim(),
      lifetime,
      lifetimeUnit,
      maxFiles,
      maxUploads: 999,
      usedUploads: 0,
      allowComment,
      password: settings.uploadPasswordEnabled ? settings.uploadPassword : (usePassword ? password : ''),
      createdAt: now,
      expiresAt: now + ms,
      link: '',
    };

    const result = await onAdd(upload);
    if (result) {
      setPublished({
        link: window.location.origin + result.link,
        title: result.title,
      });
    }
  };

  const closeSuccess = () => {
    setPublished(null);
    setTitle('');
    setComment('');
    setPassword('');
    setUsePassword(false);
  };

  const demoData = {
    title: title || 'Демо загрузка',
    comment,
    allowComment,
    hideTimer,
    maxFiles,
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
          <UploadIcon className="h-4 w-4 text-blue-400" />
          Создать загрузку
        </h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs text-white/30">Заголовок</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Название страницы загрузки"
              className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/15 outline-none transition focus:border-cyan-500/30"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-white/30">Комментарий</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Инструкция для загрузчика"
              rows={2}
              className="w-full resize-none rounded-lg border border-white/8 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/15 outline-none transition focus:border-cyan-500/30"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-white/30">Обложка 4:3 <span className="text-white/15">(необязательно)</span></label>
            <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverSelect} className="hidden" />
            {coverData ? (
              <div className="flex items-center gap-3 rounded-lg bg-white/3 p-2">
                <img src={coverData} alt="" className="h-12 w-16 rounded-md object-cover" />
                <span className="flex-1 text-xs text-white/40">Обложка добавлена</span>
                <button onClick={() => coverInputRef.current?.click()} className="rounded-lg p-1.5 text-white/30 transition active:scale-90 hover:text-white/60">
                  <ImagePlus className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setCoverData('')} className="rounded-lg p-1.5 text-white/30 transition active:scale-90 hover:text-red-400">
                  <X className="h-3.5 w-3.5" />
                </button>
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

          <div>
            <label className="mb-1.5 flex items-center gap-1 text-xs text-white/30">
              <Download className="h-3 w-3" /> Макс. файлов за раз
            </label>
            <input
              type="number"
              value={maxFiles}
              onChange={e => setMaxFiles(Math.max(1, Number(e.target.value)))}
              min={1}
              max={50}
              className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/30"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg bg-white/3 px-4 py-3">
            <span className="text-xs text-white/50">Скрыть таймер на странице</span>
            <Toggle checked={hideTimer} onChange={setHideTimer} />
          </div>

          <div className="flex items-center justify-between rounded-lg bg-white/3 px-4 py-3">
            <div className="flex items-center gap-1.5 text-xs text-white/50">
              <MessageSquare className="h-3 w-3" /> Комментарий от отправителя
            </div>
            <Toggle checked={allowComment} onChange={setAllowComment} />
          </div>

          {!settings.uploadPasswordEnabled && (
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
          )}
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
          className="btn-glow flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 py-3 text-xs font-semibold text-white shadow-lg shadow-blue-500/15 transition hover:shadow-blue-500/25"
        >
          Создать
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
        <DemoUploadModal
          data={demoData}
          settings={settings}
          onClose={() => setShowDemo(false)}
        />
      )}

      {published && (
        <SuccessModal
          type="upload"
          title={published.title}
          link={published.link}
          onClose={closeSuccess}
        />
      )}
    </div>
  );
}
