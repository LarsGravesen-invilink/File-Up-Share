import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Eye, EyeOff, KeyRound, ShieldAlert, Ghost, AlertTriangle, CheckCircle } from 'lucide-react';
import { Toggle } from '../Toggle';
import type { Settings } from '../../types';

interface Props {
  settings: Settings;
  onUpdate: (patch: Partial<Settings>) => void;
  onChangeCredentials: (login: string, password: string) => Promise<boolean>;
  onLogout: () => void;
}

export function SecurityPage({ settings, onUpdate, onChangeCredentials, onLogout }: Props) {
  const [newLogin, setNewLogin] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [successModal, setSuccessModal] = useState(false);

  const canSave = newLogin.trim().length >= 3 && newPass.trim().length >= 6 && newPass === confirmPass;

  const handleSave = () => {
    if (!canSave) return;
    setConfirmModal(true);
  };

  const confirmChange = async () => {
    const success = await onChangeCredentials(newLogin, newPass);
    setConfirmModal(false);
    if (success) {
      setSuccessModal(true);
      setNewLogin('');
      setNewPass('');
      setConfirmPass('');
      setTimeout(() => {
        setSuccessModal(false);
        onLogout();
      }, 2000);
    }
  };

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
          <Shield className="h-4 w-4 text-emerald-400" />
          Безопасность
        </h3>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-xl p-5"
      >
        <h4 className="mb-4 flex items-center gap-2 text-xs font-medium text-white/40">
          <KeyRound className="h-3.5 w-3.5" />
          Сменить логин и пароль
        </h4>
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs text-white/30">Новый логин (мин. 3 символа)</label>
            <input
              value={newLogin}
              onChange={e => setNewLogin(e.target.value)}
              onFocus={e => e.currentTarget.select()}
              placeholder="admin"
              className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/15 outline-none focus:border-cyan-500/30"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-white/30">Новый пароль (мин. 6 символов)</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                onFocus={e => e.currentTarget.select()}
                placeholder="••••••••"
                className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 pr-10 text-sm text-white placeholder-white/15 outline-none focus:border-cyan-500/30"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-white/30">Подтвердите пароль</label>
            <input
              type={showPass ? 'text' : 'password'}
              value={confirmPass}
              onChange={e => setConfirmPass(e.target.value)}
              onFocus={e => e.currentTarget.select()}
              placeholder="••••••••"
              className="w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/15 outline-none focus:border-cyan-500/30"
            />
          </div>
          {newPass && confirmPass && newPass !== confirmPass && (
            <p className="text-xs text-red-400/70">Пароли не совпадают</p>
          )}

          <button
            onClick={handleSave}
            disabled={!canSave}
            className="btn-glow w-full rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-600 py-2.5 text-xs font-semibold text-white transition disabled:opacity-40"
          >
            Сохранить
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-xl p-5"
      >
        <h4 className="mb-4 flex items-center gap-2 text-xs font-medium text-white/40">
          <ShieldAlert className="h-3.5 w-3.5" />
          Шифрование и пароли
        </h4>
        <div className="space-y-3">
          <div className="rounded-lg bg-white/3 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="text-xs text-white/50">Шифрование файлов на сервере</div>
              <Toggle checked={settings.encryptFiles} onChange={v => onUpdate({ encryptFiles: v })} />
            </div>
            <p className="mt-1.5 text-[10px] text-white/15">Файлы хранятся в зашифрованном виде, при скачивании расшифровываются</p>
          </div>

          <div className="rounded-lg bg-white/3 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="text-xs text-white/50">Глобальный пароль раздач</div>
              <Toggle checked={settings.sharePasswordEnabled} onChange={v => onUpdate({ sharePasswordEnabled: v })} />
            </div>
            {settings.sharePasswordEnabled && (
              <input
                type="text"
                value={settings.sharePassword}
                onChange={e => onUpdate({ sharePassword: e.target.value })}
                onFocus={e => e.currentTarget.select()}
                placeholder="Пароль для всех раздач"
                className="mt-2 w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/15 outline-none focus:border-cyan-500/30"
              />
            )}
            {settings.sharePasswordEnabled && (
              <p className="mt-1.5 text-[10px] text-white/15">Применяется ко всем новым раздачам. Индивидуальный пароль при создании скрывается.</p>
            )}
          </div>

          <div className="rounded-lg bg-white/3 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="text-xs text-white/50">Глобальный пароль загрузок</div>
              <Toggle checked={settings.uploadPasswordEnabled} onChange={v => onUpdate({ uploadPasswordEnabled: v })} />
            </div>
            {settings.uploadPasswordEnabled && (
              <input
                type="text"
                value={settings.uploadPassword}
                onChange={e => onUpdate({ uploadPassword: e.target.value })}
                onFocus={e => e.currentTarget.select()}
                placeholder="Пароль для всех загрузок"
                className="mt-2 w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/15 outline-none focus:border-cyan-500/30"
              />
            )}
            {settings.uploadPasswordEnabled && (
              <p className="mt-1.5 text-[10px] text-white/15">Применяется ко всем новым страницам загрузки. Индивидуальный пароль при создании скрывается.</p>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-xl p-5"
      >
        <h4 className="mb-3 flex items-center gap-2 text-xs font-medium text-white/40">
          <Ghost className="h-3.5 w-3.5" />
          Режим невидимки
        </h4>
        {!(settings.botEnabled && settings.botToken) ? (
          <div className="rounded-lg bg-yellow-500/5 px-4 py-3">
            <p className="text-[11px] text-yellow-400/60">
              Для работы режима невидимки необходимо настроить и включить Telegram бота в разделе «Telegram бот».
            </p>
          </div>
        ) : (
          <>
            <p className="mb-3 text-[11px] text-white/20">
              Скрывает кнопку входа на главной странице и сбрасывает все сессии.
              Публичные страницы раздач и загрузок продолжают работать.
            </p>
            <div className="mb-3 rounded-lg bg-white/3 px-4 py-3">
              <p className="text-[11px] text-white/25">
                <b className="text-white/40">Бот:</b> /hide — скрыть, /show — восстановить
              </p>
              <p className="mt-1 text-[11px] text-white/25">
                <b className="text-white/40">Терминал:</b> fileupshare-hide, fileupshare-show
              </p>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-white/3 px-4 py-3">
              <div className="text-xs text-white/50">Режим невидимки</div>
              <Toggle checked={settings.stealthEnabled} onChange={v => onUpdate({ stealthEnabled: v })} />
            </div>
            {settings.stealthEnabled && (
              <p className="mt-2 text-[10px] text-yellow-400/50">
                Панель скрыта. Вход невозможен с главной страницы.
              </p>
            )}
          </>
        )}
      </motion.div>

      <AnimatePresence>
        {confirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass mx-4 w-full max-w-sm rounded-2xl p-6"
            >
              <div className="mb-1 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <h3 className="text-base font-semibold text-white">Подтверждение</h3>
              </div>
              <p className="mb-2 text-xs text-white/40">
                Вы уверены, что хотите изменить учётные данные?
              </p>
              <p className="mb-5 text-xs text-yellow-400/60">
                После изменения текущая сессия будет завершена.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmModal(false)}
                  className="flex-1 rounded-lg border border-white/10 py-2.5 text-xs text-white/40 transition hover:bg-white/5"
                >
                  Отмена
                </button>
                <button
                  onClick={confirmChange}
                  className="btn-glow flex-1 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-600 py-2.5 text-xs font-medium text-white transition"
                >
                  Подтвердить
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {successModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass mx-4 w-full max-w-sm rounded-2xl p-6 text-center"
            >
              <CheckCircle className="mx-auto mb-3 h-10 w-10 text-emerald-400" />
              <h3 className="mb-2 text-base font-semibold text-white">Данные обновлены</h3>
              <p className="text-xs text-white/40">Сессия будет завершена...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
