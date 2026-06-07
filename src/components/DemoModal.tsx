import { motion } from 'framer-motion';
import { X, Clock, Download, Eye, Volume2, Film, Image, FileIcon } from 'lucide-react';
import { formatBytes, liveCountdown } from '../helpers';
import type { Settings } from '../types';

interface DemoShare {
  title: string;
  comment: string;
  cover: string;
  files: { name: string; size: number; type: string }[];
  mode: 'view' | 'download';
  allowDownload: boolean;
  hideExtensions: boolean;
  hideTimer: boolean;
  expiresAt: number;
}

interface Props {
  share: DemoShare;
  settings: Settings;
  onClose: () => void;
}

function getFileIcon(type: string) {
  if (type.startsWith('video')) return <Film className="h-4 w-4 text-blue-400" />;
  if (type.startsWith('audio')) return <Volume2 className="h-4 w-4 text-emerald-400" />;
  if (type.startsWith('image')) return <Image className="h-4 w-4 text-violet-400" />;
  return <FileIcon className="h-4 w-4 text-cyan-400" />;
}

function isAudio(type: string) {
  return type.startsWith('audio');
}

function isVisual(type: string) {
  return type.startsWith('video') || type.startsWith('image');
}

export function DemoModal({ share, settings, onClose }: Props) {
  const timeLeft = liveCountdown(share.expiresAt);
  const canDownload = share.mode === 'download' || share.allowDownload;
  const audioFiles = share.files.filter(file => isAudio(file.type));
  const visualFiles = share.files.filter(file => isVisual(file.type));
  const otherFiles = share.files.filter(file => !isAudio(file.type) && !isVisual(file.type));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm p-4 pb-10 pt-10"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-lg"
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs text-white/30">Предпросмотр страницы</span>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/30 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0e1a]">
          <header className="flex items-center justify-between border-b border-white/5 bg-[#0a0e1a]/90 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600">
                <span className="text-[10px] font-bold text-white">F</span>
              </div>
              <span className="text-xs font-bold text-white">{settings.name}</span>
            </div>
            {!share.hideTimer && (
              <div className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2 py-1">
                <Clock className="h-3 w-3 text-cyan-400/60" />
                <span className="text-[10px] tabular-nums text-white/40">{timeLeft}</span>
              </div>
            )}
          </header>

          {share.cover && (
            <img src={share.cover} alt="" className="aspect-[4/3] w-full object-cover" />
          )}

          <div className="p-5">
            <h1 className="text-base font-bold text-white">{share.title}</h1>
            {share.comment && (
              <p className="mt-1 text-xs text-white/30">{share.comment}</p>
            )}

            {visualFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {visualFiles.map((file, idx) => (
                  <div key={idx} className="overflow-hidden rounded-xl border border-white/5 bg-white/3 p-3">
                    <div className="mb-2 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
                        {getFileIcon(file.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm text-white">
                          {share.hideExtensions ? file.name.replace(/\.[^.]+$/, '') : file.name}
                        </div>
                        <div className="text-[10px] text-white/20">{formatBytes(file.size)}</div>
                      </div>
                    </div>
                    {canDownload && file.type.startsWith('video') && (
                      <button className="rounded-lg bg-cyan-500/10 px-3 py-1.5 text-[10px] font-medium text-cyan-400">
                        <Download className="mr-1 inline h-3 w-3" />
                        Скачать
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {audioFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {audioFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/3 p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
                      <Volume2 className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-white">
                        {share.hideExtensions ? file.name.replace(/\.[^.]+$/, '') : file.name}
                      </div>
                      <div className="text-[10px] text-white/20">{formatBytes(file.size)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {otherFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {otherFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/3 p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-white">
                        {share.hideExtensions ? file.name.replace(/\.[^.]+$/, '') : file.name}
                      </div>
                      <div className="text-[10px] text-white/20">{formatBytes(file.size)}</div>
                    </div>
                    {canDownload && (
                      <button className="rounded-lg bg-cyan-500/10 px-3 py-1.5 text-[10px] font-medium text-cyan-400">
                        <Download className="inline h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {share.files.length === 0 && (
              <div className="mt-4 rounded-xl border border-white/5 bg-white/3 p-6 text-center">
                <Eye className="mx-auto h-6 w-6 text-white/15" />
                <p className="mt-2 text-xs text-white/20">Без файлов</p>
              </div>
            )}
          </div>

          {settings.adEnabled && (
            <footer className="border-t border-white/5 bg-[#0a0e1a]/90 px-4 py-2 text-center text-[9px] text-white/20">
              {settings.adText || 'Создано с помощью FileUpShare'}
            </footer>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
