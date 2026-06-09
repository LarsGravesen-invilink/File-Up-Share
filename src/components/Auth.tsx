import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, User, Loader2, UserPlus, AlertTriangle } from 'lucide-react';

interface Props {
  firstRun: boolean;
  onLogin: (user: string, pass: string) => Promise<boolean>;
  onRegister: (user: string, pass: string) => Promise<boolean>;
  onBack: () => void;
}

export function Auth({ firstRun, onLogin, onRegister, onBack }: Props) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const doRegister = async () => {
    setShowConfirm(false);
    setLoading(true);
    setError('');
    try {
      const success = await onRegister(user.trim(), pass);
      if (!success) {
        setError('Ошибка создания аккаунта');
      }
    } catch {
      setError('Ошибка соединения с сервером');
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.trim() || !pass.trim()) {
      setError('Заполните все поля');
      return;
    }
    if (firstRun && user.trim().length < 3) {
      setError('Логин минимум 3 символа');
      return;
    }
    if (firstRun && pass.trim().length < 6) {
      setError('Пароль минимум 6 символов');
      return;
    }

    if (firstRun) {
      setShowConfirm(true);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const success = await onLogin(user.trim(), pass);
      if (!success) {
        setError('Неверный логин или пароль');
      }
    } catch {
      setError('Ошибка соединения с сервером');
    }

    setLoading(false);
  };

  const marqueeText = 'FileUpShare · Авторизация · Панель управления · ';
  const marqueeContent = Array(10).fill(marqueeText).join('');

  return (
    <div className="auth-root relative flex flex-col overflow-hidden bg-[#0a0e1a]">
      <div className="noise-bg" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[30%] w-[400px] h-[400px] rounded-full bg-cyan-500/8 blur-[100px]" />
        <div className="absolute bottom-[20%] right-[20%] w-[350px] h-[350px] rounded-full bg-violet-500/8 blur-[100px]" />
      </div>

      {/* Контент — прижат к верху на мобильных, по центру на десктопе */}
      <div className="relative z-10 flex flex-1 items-start justify-center px-4 pt-[12vh] sm:items-center sm:pt-0">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          <div className="glass rounded-2xl p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${firstRun ? 'bg-gradient-to-br from-emerald-500 to-cyan-600' : 'bg-gradient-to-br from-cyan-500 to-violet-600'}`}>
                {firstRun ? <UserPlus className="h-5 w-5 text-white" /> : <Lock className="h-5 w-5 text-white" />}
              </div>
              <div>
                <h2 className="text-base font-semibold text-white sm:text-lg">
                  {firstRun ? 'Создать аккаунт' : 'Вход в панель'}
                </h2>
                <p className="text-[10px] text-white/30 sm:text-xs">
                  {firstRun ? 'Первый запуск — задайте данные для входа' : 'Введите данные для входа'}
                </p>
              </div>
            </div>

            {firstRun && (
              <div className="mb-4 rounded-lg bg-cyan-500/10 px-3 py-2 text-[11px] text-cyan-400/70">
                Эти данные будут зашифрованы и использованы для всех последующих входов.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/40">
                  Логин {firstRun && <span className="text-white/20">(мин. 3 символа)</span>}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
                  <input
                    type="text"
                    value={user}
                    onChange={e => { setUser(e.target.value); setError(''); }}
                    disabled={loading}
                    placeholder="admin"
                    autoComplete={firstRun ? 'off' : 'username'}
                    className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/40">
                  Пароль {firstRun && <span className="text-white/20">(мин. 6 символов)</span>}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={pass}
                    onChange={e => { setPass(e.target.value); setError(''); }}
                    disabled={loading}
                    placeholder="••••••••"
                    autoComplete={firstRun ? 'new-password' : 'current-password'}
                    className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-10 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 transition-colors hover:text-white/50"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                className={`btn-glow flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white shadow-lg transition-all disabled:opacity-60 ${
                  firstRun
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-600 shadow-emerald-500/15 hover:shadow-emerald-500/25'
                    : 'bg-gradient-to-r from-cyan-500 to-violet-600 shadow-cyan-500/15 hover:shadow-cyan-500/25'
                }`}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  firstRun ? 'Создать аккаунт' : 'Войти'
                )}
              </button>
            </form>

            {!firstRun && (
              <p className="mt-4 text-center text-[10px] text-white/15">
                Сессия активна 6 часов
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Бегущая строка внизу */}
      <div className="relative z-10 flex-shrink-0 border-t border-white/3">
        <div className="overflow-hidden py-2 px-4">
          <div className="marquee-track text-[10px] tracking-widest text-white/8">
            <span>{marqueeContent}</span>
            <span>{marqueeContent}</span>
          </div>
        </div>
      </div>

      {/* Модальное окно подтверждения при первом создании аккаунта */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="glass w-full max-w-sm rounded-2xl p-6"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/20">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                </div>
                <h3 className="text-base font-semibold text-white">Внимание!</h3>
              </div>
              <p className="mb-5 text-sm text-white/60 leading-relaxed">
                Запомните данные для входа! Они потребуются при повторном входе.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowConfirm(false); }}
                  className="flex-1 rounded-lg border border-white/10 py-2.5 text-xs text-white/40 transition hover:bg-white/5 active:scale-95"
                >
                  Отмена
                </button>
                <button
                  onClick={doRegister}
                  className="btn-glow flex-1 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:shadow-emerald-500/30 active:scale-95"
                >
                  Применить
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
