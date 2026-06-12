import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, Copy, Trash2, ExternalLink, Clock, Lock, FileIcon, Share as ShareIcon, Plus, Check, Eye, Download } from 'lucide-react';
import type { Share } from '../../types';
import { formatDate, timeLeft, formatBytes } from '../../helpers';

interface Props {
  shares: Share[];
  onRemove: (id: string) => void;
  onExtend: (id: string, hours: number) => void;
}

export function MySharesPage({ shares, onRemove, onExtend }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [extendModal, setExtendModal] = useState<string | null>(null);
  const [extendHours, setExtendHours] = useState(24);
  const [extendMinutes, setExtendMinutes] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const copyLink = async (share: Share) => {
    const url = window.location.origin + share.link;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement('textarea');
      el.value = url;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopiedId(share.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const shareLink = async (share: Share) => {
    const url = window.location.origin + share.link;
    const text = 'С Вами поделились файлом';
    if (navigator.share) {
      try {
        await navigator.share({ title: share.title, text, url });
      } catch (e: any) {
        // Ignore AbortError (user dismissed) and other errors
      }
    }
  };

  const handleExtend = () => {
    if (extendModal) {
      const totalHours = extendHours + extendMinutes / 60;
      onExtend(extendModal, totalHours);
      setExtendModal(null);
      setExtendHours(24);
      setExtendMinutes(0);
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm) {
      onRemove(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  const activeShares = shares.filter(s => s.expiresAt > Date.now());

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
          <FolderOpen className="h-4 w-4 text-emerald-400" />
          Мои раздачи
          <span className="ml-1 rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-white/25">{activeShares.length}</span>
        </h3>
      </motion.div>

      {activeShares.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card flex flex-col items-center justify-center rounded-xl py-16 text-center"
        >
          <FolderOpen className="mb-3 h-8 w-8 text-white/10" />
          <p className="text-sm text-white/20">Нет активных раздач</p>
          <p className="mt-1 text-xs text-white/10">Создайте первую раздачу</p>
        </motion.div>
      ) : (
        <AnimatePresence>
          {activeShares.map((share, i) => (
            <motion.div
              key={share.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card group rounded-xl p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="truncate text-sm font-medium text-white">{share.title}</h4>
                    {share.password && <Lock className="h-3 w-3 flex-shrink-0 text-yellow-400/50" />}
                    <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${share.mode === 'view' ? 'bg-violet-500/15 text-violet-400' : 'bg-cyan-500/15 text-cyan-400'}`}>
                      {share.mode === 'view' ? <Eye className="inline h-2.5 w-2.5" /> : <Download className="inline h-2.5 w-2.5" />}
                    </span>
                  </div>
                  {share.comment && (
                    <p className="mt-0.5 truncate text-xs text-white/25">{share.comment}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-white/20">
                    <span className="flex items-center gap-1">
                      <FileIcon className="h-3 w-3" />
                      {share.files.length} файл{share.files.length !== 1 ? 'ов' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {timeLeft(share.expiresAt)}
                    </span>
                    <span>{formatDate(share.createdAt)}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {share.files.slice(0, 3).map((f, fi) => (
                      <span key={fi} className="rounded bg-white/3 px-2 py-0.5 text-[10px] text-white/20">
                        {f.name} · {formatBytes(f.size)}
                      </span>
                    ))}
                    {share.files.length > 3 && (
                      <span className="rounded bg-white/3 px-2 py-0.5 text-[10px] text-white/15">
                        +{share.files.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-shrink-0 gap-1">
                  <button
                    onClick={() => copyLink(share)}
                    className={`rounded-lg p-2 transition active:scale-90 active:opacity-70 ${copiedId === share.id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20'}`}
                    title="Копировать ссылку"
                  >
                    {copiedId === share.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => shareLink(share)}
                    className="rounded-lg p-2 bg-blue-500/10 text-blue-400 transition active:scale-90 active:opacity-70 hover:bg-blue-500/20"
                    title="Поделиться"
                  >
                    <ShareIcon className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setExtendModal(share.id)}
                    className="rounded-lg p-2 bg-emerald-500/10 text-emerald-400 transition active:scale-90 active:opacity-70 hover:bg-emerald-500/20"
                    title="Продлить"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  <a
                    href={share.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg p-2 bg-violet-500/10 text-violet-400 transition active:scale-90 active:opacity-70 hover:bg-violet-500/20"
                    title="Открыть"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <button
                    onClick={() => setDeleteConfirm(share.id)}
                    className="rounded-lg p-2 bg-red-500/10 text-red-400 transition active:scale-90 active:opacity-70 hover:bg-red-500/20"
                    title="Удалить"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      {/* Модалка продления */}
      <AnimatePresence>
        {extendModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="glass w-full max-w-sm rounded-2xl p-6"
            >
              <h3 className="mb-4 text-sm font-semibold text-white">Продлить раздачу</h3>
              <div className="mb-4">
                <label className="mb-1.5 block text-xs text-white/30">Добавить время</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={extendHours}
                      onChange={e => setExtendHours(Math.max(0, Number(e.target.value)))}
                      min={0}
                      className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/30"
                      placeholder="0"
                    />
                    <span className="mt-1 block text-center text-[10px] text-white/20">часов</span>
                  </div>
                  <span className="text-white/30 text-sm pb-5">:</span>
                  <div className="flex-1">
                    <input
                      type="number"
                      value={extendMinutes}
                      onChange={e => setExtendMinutes(Math.min(59, Math.max(0, Number(e.target.value))))}
                      min={0}
                      max={59}
                      className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/30"
                      placeholder="0"
                    />
                    <span className="mt-1 block text-center text-[10px] text-white/20">минут</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setExtendModal(null)}
                  className="flex-1 rounded-lg border border-white/10 py-2 text-xs text-white/40 hover:bg-white/5"
                >
                  Отмена
                </button>
                <button
                  onClick={handleExtend}
                  className="btn-glow flex-1 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-600 py-2 text-xs font-medium text-white"
                >
                  Продлить
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Модалка подтверждения удаления */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="glass w-full max-w-sm rounded-2xl p-6"
            >
              <h3 className="mb-2 text-sm font-semibold text-white">Удалить раздачу?</h3>
              <p className="mb-5 text-xs text-white/40">Раздача будет удалена безвозвратно. Ссылка перестанет работать.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 rounded-lg border border-white/10 py-2 text-xs text-white/40 transition active:scale-95 hover:bg-white/5"
                >
                  Отмена
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 rounded-lg bg-red-500/20 py-2 text-xs font-medium text-red-400 transition active:scale-95 hover:bg-red-500/30"
                >
                  Удалить
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
