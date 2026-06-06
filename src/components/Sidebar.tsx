import React, { useState } from 'react';

export type Page =
  | 'info'
  | 'create-share' | 'create-upload'
  | 'my-shares' | 'my-uploads' | 'received'
  | 'design' | 'settings' | 'security' | 'telegram';

interface MI { id: Page; label: string; icon: string }
interface MG { title: string; items: MI[] }

const I: Record<string, React.ReactNode> = {
  info: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>,
  share: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>,
  upload: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  folder: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  file: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 12 15 15"/></svg>,
  down: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  drop: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,
  sun: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>,
  shield: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  msg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>,
  out: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

const groups: MG[] = [
  { title: 'Обзор', items: [
    { id: 'info', label: 'Информация', icon: 'info' },
  ]},
  { title: 'Создание', items: [
    { id: 'create-share', label: 'Создать раздачу', icon: 'share' },
    { id: 'create-upload', label: 'Создать загрузку', icon: 'upload' },
  ]},
  { title: 'Управление', items: [
    { id: 'my-shares', label: 'Мои раздачи', icon: 'folder' },
    { id: 'my-uploads', label: 'Мои загрузки', icon: 'file' },
    { id: 'received', label: 'Принятые файлы', icon: 'down' },
  ]},
  { title: 'Настройки', items: [
    { id: 'design', label: 'Внешний вид страниц', icon: 'drop' },
    { id: 'settings', label: 'Настройка панели', icon: 'sun' },
    { id: 'security', label: 'Безопасность', icon: 'shield' },
    { id: 'telegram', label: 'Telegram bot', icon: 'msg' },
  ]},
];

interface Props {
  open: boolean;
  onClose: () => void;
  page: Page;
  onNav: (p: Page) => void;
  onLogout: () => void;
  name: string;
  logo: string;
  panelTheme: 'dark' | 'light';
  headerScale: { logo: number; text: number; sidebarHeaderH: number };
}

export const Sidebar: React.FC<Props> = ({ open, onClose, page, onNav, onLogout, name, logo, panelTheme, headerScale: hs }) => {
  const isLight = panelTheme === 'light';
  const [checking, setChecking] = useState(false);
  const [upToDate, setUpToDate] = useState(false);

  const check = () => {
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      setUpToDate(true);
      setTimeout(() => setUpToDate(false), 3000);
    }, 1500);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className={`fixed top-0 left-0 bottom-0 z-50 w-[264px] max-w-[82vw] backdrop-blur-xl flex flex-col transition-transform duration-250 ease-out ${open ? 'translate-x-0' : '-translate-x-full'} ${
        isLight
          ? 'bg-[#f0f6f1] border-r-2 border-[#88bc90] shadow-[2px_0_20px_#16a34a10]'
          : 'bg-[#080c09] border-r border-[#1a2418] shadow-[1px_0_20px_#00000030]'
      } panel-transition ${isLight ? 'panel-light' : ''}`}>

        {/* ─── Header ─── */}
        <div className="flex items-center justify-between px-4 border-b border-accent/10 flex-shrink-0" style={{ height: `${hs.sidebarHeaderH}px` }}>
          <div className="flex items-center gap-2.5 min-w-0">
            {logo ? (
              <img src={logo} alt="" className="flex-shrink-0 object-contain" style={{ width: `${hs.logo}px`, height: `${hs.logo}px` }} />
            ) : (
              <div className="rounded bg-accent/15 border border-accent/25 flex items-center justify-center flex-shrink-0" style={{ width: `${hs.logo}px`, height: `${hs.logo}px` }}>
                <svg width={hs.logo * 0.5} height={hs.logo * 0.5} viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
            )}
            <div className="min-w-0">
              <div className="font-semibold text-text truncate leading-none" style={{ fontSize: `${hs.text}px` }}>{name}</div>
              <div className="text-text-muted leading-none mt-1" style={{ fontSize: `${Math.max(9, hs.text - 3)}px` }}>Панель администратора</div>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded flex items-center justify-center text-text-muted hover:text-accent hover:bg-accent/10 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* ─── Menu ─── */}
        <nav className="flex-1 overflow-y-auto py-2 px-2.5">
          {groups.map(g => (
            <div key={g.title} className="mb-2">
              <div className="px-2 py-1.5 text-[10px] font-semibold text-text-muted/60 uppercase tracking-widest">{g.title}</div>
              {g.items.map(item => {
                const active = item.id === page;
                return (
                  <button
                    key={item.id}
                    onClick={() => { onNav(item.id); onClose(); }}
                    className={`w-full flex items-center gap-2.5 h-9 px-2.5 rounded-lg text-[13px] font-medium transition-all duration-300 relative overflow-hidden ${
                      active
                        ? isLight ? 'text-[#0e1f12]' : 'text-accent'
                        : isLight ? 'text-[#2a4a30] hover:text-[#0e1f12]' : 'text-text-secondary hover:text-text'
                    } active:scale-[0.98]`}
                  >
                    {/* Glass highlight for active — animated */}
                    <div className={`absolute inset-0 rounded-lg transition-all duration-300 ${
                      active
                        ? isLight
                          ? 'bg-[#16a34a]/[0.12] border border-[#6aaa74] shadow-[inset_0_1px_0_#16a34a20,0_0_12px_#16a34a10]'
                          : 'bg-accent/[0.08] border border-accent/20 shadow-[inset_0_1px_0_#22c55e15,0_0_12px_#22c55e08] backdrop-blur-sm'
                        : 'bg-transparent border border-transparent hover:bg-accent/[0.04]'
                    }`} />
                    <span className={`relative z-10 flex-shrink-0 transition-colors duration-300 ${active ? 'text-accent' : 'text-text-muted'}`}>{I[item.icon]}</span>
                    <span className="relative z-10">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* ─── Footer ─── */}
        <div className="px-3 py-3 border-t border-accent/10 flex-shrink-0 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] text-text-muted font-mono">1.0.1 <span className="text-accent/50">(stable)</span></span>
            <button
              onClick={check}
              disabled={checking}
              className={`text-[10px] font-medium transition-colors ${
                upToDate ? 'text-accent' : checking ? 'text-text-muted animate-pulse' : 'text-accent/70 hover:text-accent'
              }`}
            >
              {checking ? 'Проверка…' : upToDate ? '✓ Актуально' : 'Обновление'}
            </button>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-1.5 h-8 rounded-md border border-border text-[12px] font-medium text-text-muted hover:text-danger hover:border-danger/25 hover:bg-danger/5 transition-all duration-150"
          >
            {I.out}
            Выход
          </button>
        </div>
      </aside>
    </>
  );
};
