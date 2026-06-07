import { motion } from 'framer-motion';
import { X, Clock, Plus, MessageSquare, Upload } from 'lucide-react';
import { liveCountdown } from '../helpers';
import type { Settings } from '../types';

interface DemoData {
  title: string;
  comment: string;
  allowComment: boolean;
  hideTimer: boolean;
  maxFiles: number;
  expiresAt: number;
}

interface Props {
  data: DemoData;
  settings: Settings;
  onClose: () => void;
}

export function DemoUploadModal({ data, settings, onClose }: Props) {
  const timeLeft = liveCountdown(data.expiresAt);

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
          <span className="text-xs text-white/30">Предпросмотр страницы загрузки</span>
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
                <Upload className="h-3 w-3 text-white" />
              </div>
              <span className="text-xs font-bold text-white">{settings.name}</span>
            </div>
            {!data.hideTimer && (
              <div className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2 py-1">
                <Clock className="h-3 w-3 text-cyan-400/60" />
                <span className="text-[10px] tabular-nums text-white/40">{timeLeft}</span>
              </div>
            )}
          </header>

          <div className="p-5 space-y-4">
            <div>
              <h1 className="text-base font-bold text-white">{data.title}</h1>
              {data.comment && (
                <p className="mt-1 text-xs text-white/30">{data.comment}</p>
              )}
            </div>

            <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/3 py-8 text-xs text-white/20">
              <Plus className="h-5 w-5" />
              <span>Выбрать файлы (0/{data.maxFiles})</span>
            </div>

            {data.allowComment && (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5 text-[10px] text-white/20">
                  <MessageSquare className="h-3 w-3" /> Комментарий
                </div>
                <div className="rounded-xl border border-white/8 bg-white/5 px-3 py-2.5 text-xs text-white/15">
                  Введите комментарий...
                </div>
                <div className="mt-1 text-right text-[10px] text-white/15">0/100</div>
              </div>
            )}

            <div className="rounded-xl bg-white/5 py-3 text-center text-xs text-white/20">
              Загрузить
            </div>
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
