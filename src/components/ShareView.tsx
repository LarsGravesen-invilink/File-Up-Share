import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PublicLayout } from './PublicLayout';
import { AudioPlayer } from './AudioPlayer';
import { autolink } from '../utils/autolink';
import { Download, Eye, Lock, Loader2, Volume2, ChevronLeft, ChevronRight, Film, Image } from 'lucide-react';
import { formatBytes } from '../helpers';
import * as api from '../api';
import { applyPublicPageMeta } from '../utils/pageMeta';

interface Props {
  encoded: string;
}

function getMediaType(type: string): 'video' | 'audio' | 'image' | null {
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  if (type.startsWith('image/')) return 'image';
  return null;
}

export function ShareView({ encoded }: Props) {
  const [share, setShare] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [needPassword, setNeedPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  useEffect(() => {
    loadShare();
  }, [encoded]);

  useEffect(() => {
    if (!config) return;
    return applyPublicPageMeta(config);
  }, [config]);

  const loadShare = async () => {
    try {
      const data = await api.getPublicShare(encoded);
      setConfig(data.config);
      if (data.share.hasPassword) {
        setNeedPassword(true);
        setShare({ ...data.share, files: [] });
      } else {
        setShare(data.share);
      }
    } catch {
      setError('Раздача не найдена или срок действия истёк');
    }
    setLoading(false);
  };

  const verifyPassword = async () => {
    setVerifying(true);
    setPasswordError('');
    try {
      const data = await api.verifySharePassword(encoded, password);
      if (data.ok) {
        setShare(data.share);
        setNeedPassword(false);
      }
    } catch {
      setPasswordError('Неверный пароль');
    }
    setVerifying(false);
  };

  const handleAudioPlay = (fileId: string) => {
    Object.entries(audioRefs.current).forEach(([id, audio]) => {
      if (id !== fileId && !audio.paused) {
        audio.pause();
      }
    });
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
        <div className="text-center">
          <p className="text-white/40">{error}</p>
        </div>
      </div>
    );
  }

  if (!share || !config) return null;

  const mediaFiles = share.files?.filter((f: any) => getMediaType(f.type)) || [];
  const audioFiles = mediaFiles.filter((f: any) => getMediaType(f.type) === 'audio');
  const visualFiles = mediaFiles.filter((f: any) => getMediaType(f.type) !== 'audio');
  const otherFiles = share.files?.filter((f: any) => !getMediaType(f.type)) || [];
  const isViewMode = share.mode === 'view';
  const canDownload = !isViewMode || share.allowDownload;
  const currentVisual = visualFiles[currentIndex] || null;

  return (
    <PublicLayout
      name={config.name}
      logo={config.logo}
      expiresAt={share.expiresAt}
      hideLifetime={config.hideLifetimeOnPage || share.hideTimer}
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
            <p className="mb-5 text-xs text-white/30">Введите пароль для просмотра содержимого</p>
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
              disabled={verifying || !password}
              className="btn-glow w-full rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {verifying ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Получить доступ'}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {share.cover && (
              <div className="overflow-hidden rounded-xl">
                <img src={share.cover} alt="" className="aspect-[4/3] w-full object-cover" />
              </div>
            )}

            {share.title && (
              <div>
                <h1 className="text-lg font-bold text-white sm:text-xl">{share.title}</h1>
                {share.comment && (
                  <p className="mt-1 text-xs text-white/30 sm:text-sm">{autolink(share.comment)}</p>
                )}
              </div>
            )}

            {isViewMode && visualFiles.length > 0 && (
              <div className="glass-card overflow-hidden rounded-xl">
                {visualFiles.length > 1 && (
                  <div className="flex items-center justify-between border-b border-white/5 px-4 py-2">
                    <button
                      onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                      disabled={currentIndex === 0}
                      className="rounded-lg p-1.5 text-white/30 transition hover:bg-white/5 hover:text-white/60 disabled:opacity-30"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-xs text-white/30">{currentIndex + 1} / {visualFiles.length}</span>
                    <button
                      onClick={() => setCurrentIndex(i => Math.min(visualFiles.length - 1, i + 1))}
                      disabled={currentIndex === visualFiles.length - 1}
                      className="rounded-lg p-1.5 text-white/30 transition hover:bg-white/5 hover:text-white/60 disabled:opacity-30"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {currentVisual && getMediaType(currentVisual.type) === 'video' && (
                  <div>
                    <div className="relative aspect-video bg-black">
                      <video
                        src={api.getFileUrl(share.id, currentVisual.storedName)}
                        controls
                        preload="auto"
                        playsInline
                        controlsList={!canDownload ? 'nodownload' : ''}
                        className="h-full w-full"
                        style={{ pointerEvents: 'auto' }}
                        onContextMenu={!canDownload ? (e) => e.preventDefault() : undefined}
                      />
                    </div>
                    {canDownload && (
                      <div className="border-t border-white/5 p-3">
                        <a
                          href={api.getDownloadUrl(share.id, currentVisual.storedName)}
                          className="btn-glow flex items-center justify-center gap-2 rounded-lg bg-cyan-500/15 px-4 py-2.5 text-xs font-medium text-cyan-400 transition hover:bg-cyan-500/25"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Скачать видео
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {currentVisual && getMediaType(currentVisual.type) === 'image' && (
                  <div className="relative">
                    <img
                      src={api.getFileUrl(share.id, currentVisual.storedName)}
                      alt={currentVisual.name}
                      className="w-full"
                      onContextMenu={!canDownload ? (e) => e.preventDefault() : undefined}
                      draggable={canDownload}
                    />
                  </div>
                )}
              </div>
            )}

            {isViewMode && audioFiles.length > 0 && (
              <div className="space-y-2">
                {audioFiles.map((file: any) => (
                  <div key={file.storedName} className="glass-card rounded-xl p-3">
                    <div className="mb-2.5 flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/20">
                        <Volume2 className="h-3.5 w-3.5 text-violet-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm text-white">{share.hideExtensions ? file.name.replace(/\.[^.]+$/, '') : file.name}</div>
                        <div className="text-[10px] text-white/20">{formatBytes(file.size)}</div>
                      </div>
                    </div>
                    <AudioPlayer
                      src={api.getFileUrl(share.id, file.storedName)}
                      controlsList={!canDownload ? 'nodownload' : ''}
                      onPlay={() => handleAudioPlay(file.storedName)}
                      onContextMenu={!canDownload ? (e: React.MouseEvent<HTMLAudioElement>) => e.preventDefault() : undefined}
                      audioRef={el => { if (el) audioRefs.current[file.storedName] = el; else delete audioRefs.current[file.storedName]; }}
                    />
                  </div>
                ))}
              </div>
            )}

            {(!isViewMode || otherFiles.length > 0) && (
              <div className="space-y-2">
                {(isViewMode ? otherFiles : share.files || []).map((file: any) => (
                  <div key={file.storedName} className="glass-card flex items-center gap-3 rounded-xl p-3 sm:p-4">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/5 sm:h-10 sm:w-10">
                      {file.type.startsWith('video') ? <Film className="h-4 w-4 text-blue-400" /> : file.type.startsWith('image') ? <Image className="h-4 w-4 text-violet-400" /> : <Eye className="h-4 w-4 text-cyan-400" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-white">
                        {share.hideExtensions ? file.name.replace(/\.[^.]+$/, '') : file.name}
                      </div>
                      <div className="text-[10px] text-white/20 sm:text-[11px]">{formatBytes(file.size)}</div>
                    </div>
                    {canDownload && (
                      <a
                        href={api.getDownloadUrl(share.id, file.storedName)}
                        className="btn-glow flex items-center gap-1.5 rounded-lg bg-cyan-500/10 px-3 py-1.5 text-[11px] font-medium text-cyan-400 transition hover:bg-cyan-500/20 sm:text-xs"
                      >
                        <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        <span className="hidden sm:inline">Скачать</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </PublicLayout>
  );
}
