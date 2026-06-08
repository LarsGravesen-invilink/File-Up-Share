import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Shield, Zap, ArrowRight } from 'lucide-react';

interface Props {
  name: string;
  hidden?: boolean;
  onEnter: () => void;
}

export function Landing({ name, hidden, onEnter }: Props) {
  const [time, setTime] = useState(new Date().toLocaleTimeString('ru-RU'));

  useEffect(() => {
    const i = setInterval(() => setTime(new Date().toLocaleTimeString('ru-RU')), 1000);
    return () => clearInterval(i);
  }, []);

  const marqueeText = `${name} · Панель управления · Раздачи · Загрузки · `;
  const marqueeBottom = 'Безопасность · Шифрование · Мониторинг · Контроль · ';

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-[#0a0e1a]">
      <div className="noise-bg" />

      <div className="absolute inset-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-500/10 blur-[120px] animate-pulse-glow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full bg-blue-500/5 blur-[80px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 flex-shrink-0 overflow-hidden border-b border-white/3">
        <div className="marquee-track py-2 text-[11px] tracking-[0.3em] text-white/10 uppercase">
          <span>{Array(10).fill(marqueeText).join('')}</span>
          <span>{Array(10).fill(marqueeText).join('')}</span>
        </div>
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 shadow-2xl shadow-cyan-500/25 sm:mb-8 sm:h-20 sm:w-20"
          >
            <Upload className="h-7 w-7 text-white sm:h-9 sm:w-9" strokeWidth={2} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-3 bg-gradient-to-r from-white via-cyan-200 to-violet-200 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl md:text-6xl"
          >
            {name}
          </motion.h1>


          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mx-auto mb-8 max-w-md text-xs text-white/40 sm:mb-10 sm:text-base"
          >
            Панель управления раздачами и загрузками файлов на вашем Linux VPS
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mb-10 flex items-center justify-center gap-6 text-white/25 sm:mb-14 sm:gap-8"
          >
            <div className="flex items-center gap-1.5 text-[10px] sm:gap-2 sm:text-xs">
              <Shield className="h-3.5 w-3.5 text-cyan-400/50 sm:h-4 sm:w-4" />
              <span>Шифрование</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] sm:gap-2 sm:text-xs">
              <Zap className="h-3.5 w-3.5 text-violet-400/50 sm:h-4 sm:w-4" />
              <span>Быстро</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] sm:gap-2 sm:text-xs">
              <Upload className="h-3.5 w-3.5 text-blue-400/50 sm:h-4 sm:w-4" />
              <span>Надёжно</span>
            </div>
          </motion.div>

          {!hidden && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={onEnter}
              className="btn-glow group relative inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-7 py-3 text-sm font-semibold text-white shadow-2xl shadow-cyan-500/20 transition-shadow hover:shadow-cyan-500/30 sm:px-8 sm:py-3.5"
            >
              Войти в панель
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </motion.button>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.2 }}
            className="mt-6 text-[10px] text-white/15 sm:mt-8 sm:text-xs"
          >
            {time}
          </motion.div>
        </motion.div>
      </div>

      <div className="relative z-10 flex-shrink-0 overflow-hidden border-t border-white/3">
        <div className="marquee-track py-2 text-[11px] tracking-[0.3em] text-white/10 uppercase" style={{ animationDirection: 'reverse' }}>
          <span>{Array(10).fill(marqueeBottom).join('')}</span>
          <span>{Array(10).fill(marqueeBottom).join('')}</span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.5 }}
        className="absolute bottom-8 left-0 right-0 z-20 text-center text-[10px] text-white/15 sm:text-[11px]"
      >
        by LarsGravesen | invilink
      </motion.div>
    </div>
  );
}
