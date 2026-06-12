import { useState, useEffect, useCallback } from 'react';
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

function VersionChecker({ isLight }: { isLight: boolean }) {
  const [info, setInfo] = useState<{ current: string; latest: string; hasUpdate: boolean } | null>(null);
  const [checking, setChecking] = useState(false);
  const [updateModal, setUpdateModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  const check = useCallback(async (force?: boolean) => {
    setChecking(true);
    try {
      const r = await api.checkVersion(force);
      setInfo(r);
    } catch {}
    setChecking(false);
  }, []);

  useEffect(() => { check(); }, [check]);

  const doUpdate = async () => {
    setUpdating(true);
    try {
      await api.runUpdate();
    } catch {}
    setTimeout(() => window.location.reload(), 5000);
  };

  return (
    <>
      <div className="flex items-center gap-2 rounded-lg px-3 py-1.5">
        {checking ? (
          <Loader2 className={`h-3 w-3 animate-spin ${isLight ? 'text-slate-400' : 'text-white/20'}`} />
        ) : info?.hasUpdate ? (
          <div className="flex flex-col gap-0.5 px-3 py-1.5">
            <div className="flex items-center gap-1.5">
              <ArrowDownCircle className="h-3 w-3 flex-shrink-0 text-cyan-400" />
              <span className="text-[10px] text-cyan-400">Обнаружена новая версия {info.latest}</span>
            </div>
            <button
              onClick={() => setUpdateModal(true)}
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
              v{info?.current || '1.0.2'} · Актуально
            </button>
          </>
        )}
      </div>

      <AnimatePresence>
        {updateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="glass w-full max-w-sm rounded-2xl p-6"
            >
              <div className="mb-1 flex items-center gap-2">
                <RefreshCw className={`h-5 w-5 text-cyan-400 ${updating ? 'animate-spin' : ''}`} />
                <h3 className="text-base font-semibold text-white">
                  {updating ? 'Обновление...' : 'Обновить панель?'}
                </h3>
              </div>
              {!updating && (
                <>
                  <p className="mb-1 text-xs text-white/40">
                    Обновление до версии <b className="text-cyan-400">{info?.latest}</b>
                  </p>
                  <p className="mb-5 text-xs text-yellow-400/60">
                    Сервис будет перезапущен. Потребуется повторная авторизация. Все файлы и данные сохранятся.
                  </p>
                </>
              )}
              {updating && (
                <p className="mb-5 text-xs text-white/30">
                  Загрузка, сборка и перезапуск... Страница перезагрузится автоматически.
                </p>
              )}
              <div className="flex gap-2">
                {!updating && (
                  <button
                    onClick={() => setUpdateModal(false)}
                    className="flex-1 rounded-lg border border-white/10 py-2.5 text-xs text-white/40 transition active:scale-95 hover:bg-white/5"
                  >
                    Отложить
                  </button>
                )}
                <button
                  onClick={doUpdate}
                  disabled={updating}
                  className="btn-glow flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 py-2.5 text-xs font-medium text-white transition active:scale-95 disabled:opacity-50"
                >
                  {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  {updating ? 'Обновление...' : 'Обновить'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

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
          <VersionChecker isLight={isLight} />
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
