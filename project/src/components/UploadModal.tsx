import { motion } from 'framer-motion';
import { Upload, X } from 'lucide-react';

interface Props {
  progress: number;
  onCancel: () => void;
  label?: string;
}

export function UploadModal({ progress, onCancel, label }: Props) {
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
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20">
            <Upload className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Загрузка файла</h3>
            <p className="text-[10px] text-white/30">{label || 'Пожалуйста, подождите...'}</p>
          </div>
        </div>

        <div className="mb-2 h-2 overflow-hidden rounded-full bg-white/5">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="mb-4 flex items-center justify-between text-xs">
          <span className="text-white/40">Прогресс</span>
          <span className="font-medium tabular-nums text-cyan-400">{progress}%</span>
        </div>

        <button
          onClick={onCancel}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 py-2 text-xs text-white/40 transition active:scale-95 hover:bg-white/5 hover:text-white/60"
        >
          <X className="h-3.5 w-3.5" />
          Отменить
        </button>
      </motion.div>
    </motion.div>
  );
}
