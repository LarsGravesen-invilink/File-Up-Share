import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Copy, Share2, Check, X } from 'lucide-react';

interface Props {
  type: 'share' | 'upload';
  title: string;
  link: string;
  onClose: () => void;
}

export function SuccessModal({ type, title, link, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const el = document.createElement('textarea');
      el.value = link;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    const text = type === 'share' ? 'С Вами поделились файлом' : 'Вас просят загрузить файл';
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: link });
      } catch {}
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass w-full max-w-sm rounded-2xl p-6"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-white/20 hover:bg-white/5 hover:text-white/40"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20">
            <CheckCircle className="h-7 w-7 text-emerald-400" />
          </div>
          <h3 className="text-base font-semibold text-white">
            {type === 'share' ? 'Раздача создана' : 'Загрузка создана'}
          </h3>
          <p className="mt-1 text-xs text-white/30">{title}</p>
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-[10px] text-white/30">Ссылка на страницу</label>
          <div className="flex gap-2">
            <input
              readOnly
              value={link}
              onFocus={e => (e.target as HTMLInputElement).select()}
              className="flex-1 rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-xs text-cyan-400 outline-none"
            />
            <button
              onClick={copyLink}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                copied
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25'
              }`}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Скопировано' : 'Копировать'}
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={shareLink}
            className="btn-glow flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 py-2.5 text-xs font-semibold text-white"
          >
            <Share2 className="h-3.5 w-3.5" />
            Поделиться
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-white/10 py-2.5 text-xs text-white/40 transition hover:bg-white/5"
          >
            Закрыть
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
