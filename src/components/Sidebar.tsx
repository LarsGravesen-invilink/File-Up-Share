import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Share2, Upload, FolderOpen, Download,
  FileDown, Palette, Settings, Shield, Bot, Info,
  LogOut, X, ChevronRight, RefreshCw, ArrowDownCircle, Loader2, CheckCircle
} from 'lucide-react';
import type { Page } from '../types';
import * as api from '../api';

const menuGroups = [
  {
    title: 'Основное',
    items: [
      { id: 'info' as Page, label: 'Информация', icon: LayoutDashboard },
      { id: 'create-share' as Page, label: 'Создать раздачу', icon: Share2 },
      { id: 'create-upload' as Page, label: 'Создать загрузку', icon: Upload },
    ],
  },
  {
    title: 'Управление',
    items: [
      { id: 'my-shares' as Page, label: 'Мои раздачи', icon: FolderOpen },
      { id: 'my-uploads' as Page, label: 'Мои загрузки', icon: Download },
      { id: 'received' as Page, label: 'Принятые файлы', icon: FileDown },
    ],
  },
  {
    title: 'Настройки',
    items: [
      { id: 'design' as Page, label: 'Внешний вид', icon: Palette },
      { id: 'settings' as Page, label: 'Настройка панели', icon: Settings },
      { id: 'security' as Page, label: 'Безопасность', icon: Shield },
      { id: 'telegram' as Page, label: 'Telegram бот', icon: Bot },
    ],
  },
  {
    title: '',
    items: [
      { id: 'about' as Page, label: 'О панели', icon: Info },
    ],
  },
];

interface Props {
  page: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  open: boolean;
  onClose: () => void;
  name: string;
  logo: string;
  headerScale: string;
  isLight: boolean;
}

// ─── Steps definition (mirrors autoupdate.sh) ────────────────────────────────
const STEPS = [
  { key: 'Скачивание репозитория',                pct: 5  },
  { key: 'Резервное копирование данных',           pct: 15 },
  { key: 'Обновление системных файлов',            pct: 30 },
  { key: 'Восстановление пользовательских данных', pct: 40 },
  { key: 'Установка зависимостей',                 pct: 55 },
  { key: 'Сборка фронтенда',                      pct: 75 },
  { key: 'Перезапуск сервиса',                    pct: 90 },
  { key: 'Готово',                                pct: 100 },
];

// ─── UpdateModal (centered, full-screen overlay) ─────────────────────────────
interface UpdateModalProps {
  info: { current: string; latest: string; hasUpdate: boolean };
  onClose: () => void;
  onLogout: () => void;
}

function UpdateModal({ info, onClose, onLogout }: UpdateModalProps) {
  const [phase, setPhase] = useState<'confirm' | 'updating' | 'success' | 'error'>('confirm');
  const [pct, setPct]     = useState(0);
  const [step, setStep]   = useState('');
  const [errMsg, setErrMsg] = useState('');
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serverWentDown = useRef(false);

  useEffect(() => () => {
    if (pollRef.current) clearTimeout(pollRef.current);
  }, []);

  // Poll /api/update-status for real progress from the progress file
  const pollStatus = useCallback(() => {
    pollRef.current = setTimeout(async () => {
      try {
        const status = await api.checkUpdateStatus() as any;

        // Update progress display
        if (status.pct != null) setPct(status.pct);
        if (status.step)       setStep(status.step);

        if (status.done) {
          setPct(100);
          setStep('Готово');
          setPhase('success');
          // Auto-close + logout after 3 s
          setTimeout(async () => {
            await api.logout();
            window.location.reload();
          }, 3000);
          return;
        }
        if (status.error) {
          setErrMsg(status.error);
          setPhase('error');
          return;
        }

        // Server went down during restart — keep polling version endpoint
        serverWentDown.current = false;
        pollStatus();
      } catch {
        // Server unreachable — it's restarting
        if (!serverWentDown.current) {
          serverWentDown.current = true;
          setStep('Перезапуск сервиса');
          setPct(90);
        }
        // Poll /api/version to detect when server is back up
        pollRef.current = setTimeout(async () => {
          try {
            await api.checkVersion(true);
            // Server answered — update is done
            setPct(100);
            setStep('Готово');
            setPhase('success');
            setTimeout(async () => {
              await api.logout();
              window.location.reload();
            }, 3000);
          } catch {
            pollStatus(); // still down, keep trying
          }
        }, 2000);
      }
    }, 1500);
  }, []);

  const doUpdate = async () => {
    setPhase('updating');
    setPct(0);
    setStep('Запуск...');
    try {
      await api.runUpdate();
    } catch { /* server may close connection when it restarts mid-update */ }
    pollStatus();
  };

  const handleClose = () => {
    if (phase === 'updating') return;
    if (pollRef.current) clearTimeout(pollRef.current);
    onClose();
  };

  // Current step index for step list highlight
  const currentStepIdx = STEPS.findIndex(s => s.key === step);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={phase !== 'updating' ? handleClose : undefined}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="glass w-full max-w-md rounded-2xl p-7 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-600/20">
            <RefreshCw className={`h-5 w-5 text-cyan-400 ${phase === 'updating' ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">
              {phase === 'confirm'  && 'Обновить FileUpShare'}
              {phase === 'updating' && 'Установка обновления'}
              {phase === 'success'  && 'Обновление установлено'}
              {phase === 'error'    && 'Ошибка обновления'}
            </h3>
            {phase === 'confirm' && (
              <p className="text-[11px] text-white/40">
                {info.current} → <span className="text-cyan-400 font-medium">{info.latest}</span>
              </p>
            )}
          </div>
          {phase !== 'updating' && (
            <button
              onClick={handleClose}
              className="ml-auto rounded-lg p-1.5 text-white/30 transition hover:bg-white/5 hover:text-white/60"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* ── Confirm phase ── */}
        {phase === 'confirm' && (
          <>
            <p className="mb-5 text-xs text-yellow-400/70">
              Сервис будет перезапущен. Все файлы, ссылки и данные сохранятся автоматически.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="flex-1 rounded-lg border border-white/10 py-2.5 text-xs text-white/40 transition hover:bg-white/5 active:scale-95"
              >
                Отложить
              </button>
              <button
                onClick={doUpdate}
                className="btn-glow flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 py-2.5 text-xs font-medium text-white transition active:scale-95"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Обновить сейчас
              </button>
            </div>
          </>
        )}

        {/* ── Updating phase ── */}
        {phase === 'updating' && (
          <div className="space-y-4">
            {/* Progress bar */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[11px] text-white/40">{step || 'Подготовка...'}</span>
                <span className="text-[11px] font-medium text-cyan-400">{pct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-600"
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Step list */}
            <div className="space-y-1.5 rounded-xl bg-white/5 p-3">
              {STEPS.map((s, i) => {
                const isDone    = pct >= s.pct;
                const isActive  = i === currentStepIdx || (currentStepIdx === -1 && i === 0 && pct > 0);
                return (
                  <div key={s.key} className="flex items-center gap-2">
                    <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 transition-colors duration-300 ${
                      isDone   ? 'bg-emerald-400' :
                      isActive ? 'bg-cyan-400 animate-pulse' :
                                 'bg-white/15'
                    }`} />
                    <span className={`text-[11px] transition-colors duration-300 ${
                      isDone   ? 'text-white/60' :
                      isActive ? 'text-white/90' :
                                 'text-white/25'
                    }`}>{s.key}</span>
                  </div>
                );
              })}
            </div>

            <p className="text-center text-[10px] text-white/20">
              Не закрывайте страницу — она обновится автоматически
            </p>
          </div>
        )}

        {/* ── Success phase ── */}
        {phase === 'success' && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
              <CheckCircle className="h-8 w-8 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Обновление установлено успешно</p>
              <p className="mt-1 text-[11px] text-white/40">
                Выполняется выход и перезагрузка страницы...
              </p>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-emerald-500"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 3, ease: 'linear' }}
              />
            </div>
          </div>
        )}

        {/* ── Error phase ── */}
        {phase === 'error' && (
          <>
            <div className="mb-4 rounded-xl bg-red-500/10 p-3">
              <p className="text-[11px] text-red-400/90 font-mono break-all">{errMsg}</p>
            </div>
            <p className="mb-4 text-[11px] text-white/40">
              Проверьте логи: <code className="text-white/30">journalctl -u fileupshare -n 30</code>
            </p>
            <button
              onClick={handleClose}
              className="w-full rounded-lg border border-white/10 py-2.5 text-xs text-white/40 transition hover:bg-white/5 active:scale-95"
            >
              Закрыть
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── VersionChecker (sidebar widget) ─────────────────────────────────────────
export function VersionChecker({ isLight, onLogout }: { isLight: boolean; onLogout: () => void }) {
  const [info, setInfo]   = useState<{ current: string; latest: string; hasUpdate: boolean } | null>(null);
  const [checking, setChecking] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const check = useCallback(async (force?: boolean) => {
    setChecking(true);
    try {
      const r = await api.checkVersion(force);
      setInfo(r);
    } catch {}
    setChecking(false);
  }, []);

  // Check on mount
  useEffect(() => { check(true); }, [check]);

  return (
    <>
      <div className="flex items-center gap-2 rounded-lg px-3 py-1.5">
        {checking ? (
          <Loader2 className={`h-3 w-3 animate-spin ${isLight ? 'text-slate-400' : 'text-white/20'}`} />
        ) : info?.hasUpdate ? (
          <div className="flex flex-col gap-0.5 px-3 py-1.5">
            <div className="flex items-center gap-1.5">
              <ArrowDownCircle className="h-3 w-3 flex-shrink-0 text-cyan-400" />
              <span className="text-[10px] text-cyan-400">Новая версия {info.latest}</span>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className={`self-start text-[10px] font-medium underline underline-offset-2 transition hover:opacity-70 ${isLight ? 'text-cyan-600' : 'text-cyan-400'}`}
            >
              Обновить сейчас
            </button>
          </div>
        ) : (
          <>
            <CheckCircle className={`h-3 w-3 flex-shrink-0 ${isLight ? 'text-emerald-500' : 'text-emerald-400/50'}`} />
            <button
              onClick={() => check(true)}
              className={`text-[10px] transition hover:opacity-70 ${isLight ? 'text-slate-400' : 'text-white/20'}`}
            >
              v{info?.current ?? '…'} · Актуально
            </button>
          </>
        )}
      </div>

      <AnimatePresence>
        {showModal && info && (
          <UpdateModal
            info={info}
            onClose={() => setShowModal(false)}
            onLogout={onLogout}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
export function Sidebar({ page, onNavigate, onLogout, open, onClose, name, logo, headerScale, isLight }: Props) {
  const brandScale = headerScale === 'large' ? 'scale-[1.15]' : headerScale === 'medium' ? 'scale-[1.08]' : '';

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-[260px] flex-col border-r backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'} ${isLight ? 'border-black/5 bg-white/95' : 'border-white/5 bg-[#0c1022]/95'}`}
      >
        <div className={`flex-shrink-0 flex items-center justify-between border-b px-5 py-4 ${isLight ? 'border-black/5' : 'border-white/5'}`}>
          <div className={`flex items-center gap-3 origin-left transition-transform duration-200 ${brandScale}`}>
            {logo ? (
              <img src={logo} alt="" className="h-9 w-9 rounded-xl object-cover shadow-lg" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 shadow-lg shadow-cyan-500/20">
                <Upload className="h-4 w-4 text-white" />
              </div>
            )}
            <div>
              <span className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>{name}</span>
            </div>
          </div>
          <button onClick={onClose} className={`rounded-lg p-1.5 transition-colors lg:hidden ${isLight ? 'text-slate-400 hover:bg-black/5' : 'text-white/30 hover:bg-white/5 hover:text-white/60'}`}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className={`flex-shrink-0 px-5 py-2 border-b ${isLight ? 'border-black/3' : 'border-white/3'}`}>
          <span className={`text-[10px] font-medium tracking-wider uppercase ${isLight ? 'text-slate-400/60' : 'text-white/15'}`}>
            Панель администратора
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {menuGroups.map((group, gi) => (
            <div key={gi} className={gi > 0 ? 'mt-5' : ''}>
              {group.title && (
                <span className={`mb-2 block px-3 text-[10px] font-semibold tracking-widest uppercase ${isLight ? 'text-slate-400/50' : 'text-white/20'}`}>
                  {group.title}
                </span>
              )}
              {group.items.map(item => {
                const active = item.id === page;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => { onNavigate(item.id); onClose(); }}
                    className={`group relative mb-0.5 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] transition-all duration-200 ${
                      active
                        ? `bg-gradient-to-r from-cyan-500/15 to-violet-500/10 shadow-sm ${isLight ? 'text-slate-800' : 'text-white'}`
                        : `${isLight ? 'text-slate-500 hover:bg-black/5 hover:text-slate-700' : 'text-white/40 hover:bg-white/5 hover:text-white/70'}`
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-cyan-400 to-violet-500"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    <Icon className={`h-4 w-4 flex-shrink-0 ${active ? 'text-cyan-400' : ''}`} />
                    <span className="flex-1">{item.label}</span>
                    {active && <ChevronRight className={`h-3 w-3 ${isLight ? 'text-slate-400' : 'text-white/20'}`} />}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={`flex-shrink-0 border-t p-3 space-y-1.5 ${isLight ? 'border-black/5' : 'border-white/5'}`}>
          <VersionChecker isLight={isLight} onLogout={onLogout} />
          <button
            onClick={onLogout}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-all hover:bg-red-500/10 hover:text-red-400 ${isLight ? 'text-slate-400' : 'text-white/30'}`}
          >
            <LogOut className="h-4 w-4" />
            Выйти
          </button>
        </div>
      </aside>
    </>
  );
}
