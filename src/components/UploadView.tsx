import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PublicLayout } from './PublicLayout';
import { UploadModal } from './UploadModal';
import { Plus, X, Send, CheckCircle, Loader2, Lock, FileIcon, MessageSquare } from 'lucide-react';
import { formatBytes } from '../helpers';
import * as api from '../api';

interface Props {
  encoded: string;
}

export function UploadView({ encoded }: Props) {
  const [upload, setUpload] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [comment, setComment] = useState('');
  const [needPassword, setNeedPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingIdx, setUploadingIdx] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [lastSentName, setLastSentName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadUpload(); }, [encoded]);

  const loadUpload = async () => {
    try {
      const data = await api.getPublicUpload(encoded);
      setConfig(data.config);
      if (data.upload.hasPassword) {
        setNeedPassword(true);
      }
      setUpload(data.upload);
    } catch {
      setError('Страница загрузки не найдена или срок действия истёк');
    }
    setLoading(false);
  };

  const verifyPassword = async () => {
    try {
      const data = await api.verifyUploadPassword(encoded, password);
      if (data.ok) {
        setUpload(data.upload);
        setNeedPassword(false);
        setPasswordError('');
      }
    } catch {
      setPasswordError('Неверный пароль');
    }
  };

  const addFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const max = upload.maxFiles - files.length;
    const newFiles = Array.from(e.target.files).slice(0, max);
    setFiles(prev => [...prev, ...newFiles]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const submit = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setUploadTotal(files.length);

    for (let i = 0; i < files.length; i++) {
      setUploadingIdx(i + 1);
      setUploadProgress(0);

      try {
        await api.uploadPublicFile(
          encoded,
          files[i],
          i === 0 ? comment : '',
          upload.password || '',
          (progress) => setUploadProgress(progress)
        );
        setLastSentName(files[i].name);
        setSentCount(prev => prev + 1);
      } catch {
        setUploading(false);
        return;
      }
    }

    setUploading(false);
    setFiles([]);
    setComment('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const cancelUpload = () => {
    api.cancelUpload();
    setUploading(false);
    setUploadProgress(0);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0e1a]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0e1a]">
        <p className="text-white/40">{error}</p>
      </div>
    );
  }

  if (!upload || !config) return null;

  return (
    <PublicLayout
      name={config.name}
      logo={config.logo}
      expiresAt={upload.expiresAt}
      hideLifetime={config.hideLifetimeOnPage || upload.hideTimer}
      adEnabled={config.adEnabled}
      adText={config.adText}
      pageTheme={config.pageTheme}
    >
      <AnimatePresence mode="wait">
        {needPassword ? (
          <motion.div
            key="password"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass-card mx-auto max-w-sm rounded-2xl p-6 text-center"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
              <Lock className="h-6 w-6 text-yellow-400" />
            </div>
            <h2 className="mb-2 text-lg font-semibold text-white">Доступ по паролю</h2>
            <p className="mb-5 text-xs text-white/30">Введите пароль для загрузки файлов</p>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setPasswordError(''); }}
              placeholder="Пароль"
              onKeyDown={e => e.key === 'Enter' && verifyPassword()}
              className="mb-3 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-center text-sm text-white placeholder-white/20 outline-none focus:border-cyan-500/50"
            />
            {passwordError && (
              <p className="mb-3 text-xs text-red-400">{passwordError}</p>
            )}
            <button
              onClick={verifyPassword}
              disabled={!password}
              className="btn-glow w-full rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 py-2.5 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-50"
            >
              Получить доступ
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {upload.cover && (
              <div className="overflow-hidden rounded-xl">
                <img src={upload.cover} alt="" className="aspect-[4/3] w-full object-cover" />
              </div>
            )}

            <div>
              <h1 className="text-lg font-bold text-white sm:text-xl">{upload.title}</h1>
              {upload.comment && (
                <p className="mt-1 text-xs text-white/30 sm:text-sm">{upload.comment}</p>
              )}
            </div>

            {sentCount > 0 && (
              <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 px-4 py-3">
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-emerald-400">
                    {sentCount === 1 ? 'Файл отправлен' : `Отправлено файлов: ${sentCount}`}
                  </p>
                  <p className="truncate text-[10px] text-emerald-400/50">{lastSentName}</p>
                </div>
              </div>
            )}

            <div>
              <input ref={fileRef} type="file" multiple onChange={addFiles} className="hidden" />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={files.length >= upload.maxFiles}
                className="btn-glow flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/3 py-8 text-xs text-white/30 transition active:scale-[0.98] hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:text-cyan-400/60 disabled:opacity-30 sm:py-10"
              >
                <Plus className="h-5 w-5" />
                <span>Выбрать файлы ({files.length}/{upload.maxFiles})</span>
              </button>
              <p className="mt-1.5 text-[10px] text-white/15">Макс. 10 ГБ на файл · любой тип</p>
            </div>

            {files.length > 0 && (
              <div className="space-y-1.5">
                {files.map((f, i) => (
                  <div key={i} className="glass-card flex items-center gap-2 rounded-lg px-3 py-2">
                    <FileIcon className="h-3.5 w-3.5 flex-shrink-0 text-cyan-400/50" />
                    <span className="flex-1 truncate text-xs text-white/50">{f.name}</span>
                    <span className="text-[10px] text-white/20">{formatBytes(f.size)}</span>
                    <button onClick={() => removeFile(i)} className="text-white/15 transition active:scale-90 hover:text-red-400">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {upload.allowComment && (
              <div>
                <div className="mb-1.5 flex items-center gap-1.5 text-[10px] text-white/25">
                  <MessageSquare className="h-3 w-3" /> Комментарий
                </div>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value.slice(0, 100))}
                  placeholder="Комментарий к файлу (необязательно)"
                  rows={2}
                  className="w-full resize-none rounded-xl border border-white/8 bg-white/5 px-3 py-2.5 text-xs text-white placeholder-white/15 outline-none focus:border-cyan-500/30 sm:text-sm"
                />
                <div className="mt-1 text-right text-[10px] text-white/15">{comment.length}/100</div>
              </div>
            )}

            <button
              onClick={submit}
              disabled={files.length === 0}
              className="btn-glow flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 py-3 text-xs font-semibold text-white shadow-lg shadow-cyan-500/15 transition active:scale-[0.97] hover:shadow-cyan-500/25 disabled:opacity-40 sm:text-sm"
            >
              <Send className="h-3.5 w-3.5" />
              Загрузить {files.length > 0 && `(${files.length})`}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {uploading && (
        <UploadModal
          progress={uploadProgress}
          onCancel={cancelUpload}
          label={uploadTotal > 1 ? `Файл ${uploadingIdx} из ${uploadTotal}` : undefined}
        />
      )}
    </PublicLayout>
  );
}
