import { motion } from 'framer-motion';
import { Info, ExternalLink, Upload, Heart, Code2, Coffee } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
          <Info className="h-4 w-4 text-cyan-400" />
          О панели
        </h3>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card overflow-hidden rounded-xl"
      >
        <div className="relative border-b border-white/5 bg-gradient-to-r from-cyan-500/10 to-violet-500/10 px-6 py-10 text-center">
          <div className="absolute inset-0 animate-gradient bg-gradient-to-r from-cyan-500/5 via-violet-500/5 to-cyan-500/5" />
          <div className="relative">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 shadow-2xl shadow-cyan-500/20">
              <Upload className="h-7 w-7 text-white" />
            </div>
            <h2 className="mb-1 bg-gradient-to-r from-white to-white/80 bg-clip-text text-2xl font-bold text-transparent">
              FileUpShare
            </h2>
            <p className="text-sm text-white/30">v 1.0.5</p>
          </div>
        </div>

        <div className="p-6">
          <p className="text-sm leading-relaxed text-white/40">
            Панель управления раздачами и загрузками файлов на вашем Linux VPS.
            Полный контроль над файлами, гибкие настройки доступа, интеграция
            с Telegram, адаптивный интерфейс для любых устройств.
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-xl p-5"
      >
        <h4 className="mb-3 text-xs font-medium text-white/40">Автор</h4>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20">
            <Heart className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <div className="text-sm font-medium text-white">LarsGravesen | invilink</div>
            <div className="text-[11px] text-white/25">Разработка и поддержка</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        <a
          href="https://github.com/LarsGravesen-invilink/File-Up-Share"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-glow flex items-center justify-center gap-2 rounded-xl border border-white/8 bg-white/3 px-4 py-3 text-xs text-white/40 transition hover:bg-white/5 hover:text-white/60"
        >
          <Code2 className="h-4 w-4" />
          GitHub
        </a>
        <a
          href="https://t.me/larswall"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-glow flex items-center justify-center gap-2 rounded-xl border border-blue-500/15 bg-blue-500/5 px-4 py-3 text-xs text-blue-400/60 transition hover:bg-blue-500/10 hover:text-blue-400"
        >
          <ExternalLink className="h-4 w-4" />
          Telegram
        </a>
        <a
          href="https://pay.cloudtips.ru/p/6bba08e1"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-glow flex items-center justify-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-400/70 transition hover:bg-amber-500/10 hover:text-amber-400"
        >
          <Coffee className="h-4 w-4" />
          Поддержать
        </a>
      </motion.div>
    </div>
  );
}
