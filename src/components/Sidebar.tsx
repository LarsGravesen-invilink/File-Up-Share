import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Share2, Upload, FolderOpen, Download,
  FileDown, Palette, Settings, Shield, Bot, Info,
  LogOut, X, ChevronRight
} from 'lucide-react';
import type { Page } from '../types';

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
}

export function Sidebar({ page, onNavigate, onLogout, open, onClose, name, logo, headerScale }: Props) {
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
        className={`fixed left-0 top-0 z-50 flex h-full w-[260px] flex-col border-r border-white/5 bg-[#0c1022]/95 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex-shrink-0 flex items-center justify-between border-b border-white/5 px-5 py-4">
          <div className={`flex items-center gap-3 origin-left transition-transform duration-200 ${brandScale}`}>
            {logo ? (
              <img src={logo} alt="" className="h-9 w-9 rounded-xl object-cover shadow-lg" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 shadow-lg shadow-cyan-500/20">
                <Upload className="h-4 w-4 text-white" />
              </div>
            )}
            <div>
              <span className="text-sm font-bold text-white">{name}</span>
              <span className="block text-[10px] text-white/25">v 1.0.1</span>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-white/30 transition-colors hover:bg-white/5 hover:text-white/60 lg:hidden">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-shrink-0 px-5 py-2 border-b border-white/3">
          <span className="text-[10px] font-medium tracking-wider text-white/15 uppercase">
            Панель администратора
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {menuGroups.map((group, gi) => (
            <div key={gi} className={gi > 0 ? 'mt-5' : ''}>
              {group.title && (
                <span className="mb-2 block px-3 text-[10px] font-semibold tracking-widest text-white/20 uppercase">
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
                        ? 'bg-gradient-to-r from-cyan-500/15 to-violet-500/10 text-white shadow-sm'
                        : 'text-white/40 hover:bg-white/5 hover:text-white/70'
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
                    {active && <ChevronRight className="h-3 w-3 text-white/20" />}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="flex-shrink-0 border-t border-white/5 p-3">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-white/30 transition-all hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Выйти
          </button>
        </div>
      </aside>
    </>
  );
}
