import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Upload, RefreshCw } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { InfoPage } from './pages/InfoPage';
import { CreateSharePage } from './pages/CreateSharePage';
import { CreateUploadPage } from './pages/CreateUploadPage';
import { MySharesPage } from './pages/MySharesPage';
import { MyUploadsPage } from './pages/MyUploadsPage';
import { ReceivedFilesPage } from './pages/ReceivedFilesPage';
import { DesignPage } from './pages/DesignPage';
import { SettingsPage } from './pages/SettingsPage';
import { SecurityPage } from './pages/SecurityPage';
import { TelegramPage } from './pages/TelegramPage';
import { AboutPage } from './pages/AboutPage';
import type { Page, Settings, Stats, Share, Upload as UploadType, ReceivedFile, LogEntry } from '../types';
import * as api from '../api';

const pageTitles: Record<Page, string> = {
  'info': 'Информация',
  'create-share': 'Создать раздачу',
  'create-upload': 'Создать загрузку',
  'my-shares': 'Мои раздачи',
  'my-uploads': 'Мои загрузки',
  'received': 'Принятые файлы',
  'design': 'Внешний вид',
  'settings': 'Настройка панели',
  'security': 'Безопасность',
  'telegram': 'Telegram бот',
  'about': 'О панели',
};

interface Props {
  settings: Settings;
  stats: Stats;
  shares: Share[];
  uploads: UploadType[];
  received: ReceivedFile[];
  logs: LogEntry[];
  onUpdateSettings: (patch: Partial<Settings>) => void;
  onAddShare: (share: Share) => Promise<Share | null>;
  onRemoveShare: (id: string) => void;
  onExtendShare: (id: string, hours: number) => void;
  onAddUpload: (upload: UploadType) => Promise<UploadType | null>;
  onExtendUpload: (id: string, hours: number) => void;
  onRemoveUpload: (id: string) => void;
  onRemoveReceived: (id: string) => void;
  onChangeCredentials: (login: string, password: string) => Promise<boolean>;
  onRestart: () => void;
  onLogout: () => void;
  onRefresh: () => Promise<void>;
}

const PULL_THRESHOLD = 64; // px до срабатывания
const PULL_MAX = 90;       // максимальное визуальное смещение

export function Panel({
  settings, stats, shares, uploads, received, logs,
  onUpdateSettings, onAddShare, onRemoveShare, onExtendShare,
  onAddUpload, onExtendUpload, onRemoveUpload, onRemoveReceived,
  onChangeCredentials, onRestart, onLogout, onRefresh,
}: Props) {
  const [page, setPageState] = useState<Page>(() => {
    const saved = localStorage.getItem('fus_page');
    if (saved && ['info','create-share','create-upload','my-shares','my-uploads','received','design','settings','security','telegram','about'].includes(saved)) {
      return saved as Page;
    }
    return 'info';
  });

  const setPage = (p: Page) => {
    // Push a history entry so the back button/gesture goes back one step
    history.pushState({ fusPage: p }, '');
    setPageState(p);
    localStorage.setItem('fus_page', p);
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string>('1.0.3');
  useEffect(() => {
    api.checkVersion().then(r => setCurrentVersion(r.current)).catch(() => {});
  }, []);

  // Handle browser/gesture back: close sidebar or go back one page step
  useEffect(() => {
    // Seed an initial state so first back press is intercepted
    history.replaceState({ fusPage: page }, '');

    const handlePopState = (e: PopStateEvent) => {
      if (sidebarOpen) {
        setSidebarOpen(false);
        // Re-push so future back still works
        history.pushState({ fusPage: page }, '');
        return;
      }
      const prev = e.state?.fusPage as Page | undefined;
      if (prev && prev !== page) {
        setPageState(prev);
        localStorage.setItem('fus_page', prev);
      } else {
        // No meaningful prev state — just navigate to info as safe fallback
        history.pushState({ fusPage: 'info' }, '');
        setPageState('info');
        localStorage.setItem('fus_page', 'info');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sidebarOpen]);

  // Pull-to-refresh state
  const [pullY, setPullY] = useState(0);
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const mainRef = useRef<HTMLElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (mainRef.current && mainRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
      setPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling || refreshing) return;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy > 0) {
      // Плавное затухание при растяжении
      const clamped = Math.min(PULL_MAX, dy * 0.45);
      setPullY(clamped);
    }
  }, [pulling, refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling) return;
    setPulling(false);
    if (pullY >= PULL_THRESHOLD * 0.45) {
      setRefreshing(true);
      setPullY(PULL_THRESHOLD * 0.45);
      try { await onRefresh(); } catch {}
      setRefreshing(false);
    }
    setPullY(0);
  }, [pulling, pullY, onRefresh]);

  const uiScaleClass = useMemo(() => {
    if (settings.uiScale === 'medium') return 'scale-medium';
    if (settings.uiScale === 'large') return 'scale-large';
    return 'scale-default';
  }, [settings.uiScale]);

  const headerScaleClass = useMemo(() => {
    if (settings.headerScale === 'medium') return 'header-scale-medium';
    if (settings.headerScale === 'large') return 'header-scale-large';
    return 'header-scale-default';
  }, [settings.headerScale]);

  const marqueeText = `${settings.name} · v ${currentVersion} · by LarsGravesen | invilink · `;
  const marqueeContent = Array(12).fill(marqueeText).join('');

  const renderPage = () => {
    switch (page) {
      case 'info':
        return <InfoPage stats={stats} settings={settings} logs={logs} onNavigate={setPage} onRestart={onRestart} />;
      case 'create-share':
        return <CreateSharePage settings={settings} onAdd={onAddShare} />;
      case 'create-upload':
        return <CreateUploadPage settings={settings} onAdd={onAddUpload} />;
      case 'my-shares':
        return <MySharesPage shares={shares} onRemove={onRemoveShare} onExtend={onExtendShare} />;
      case 'my-uploads':
        return <MyUploadsPage uploads={uploads} onRemove={onRemoveUpload} onExtend={onExtendUpload} />;
      case 'received':
        return <ReceivedFilesPage files={received} onRemove={onRemoveReceived} />;
      case 'design':
        return <DesignPage settings={settings} onUpdate={onUpdateSettings} />;
      case 'settings':
        return <SettingsPage settings={settings} onUpdate={onUpdateSettings} />;
      case 'security':
        return <SecurityPage settings={settings} onUpdate={onUpdateSettings} onChangeCredentials={onChangeCredentials} onLogout={onLogout} />;
      case 'telegram':
        return <TelegramPage settings={settings} onUpdate={onUpdateSettings} />;
      case 'about':
        return <AboutPage />;
      default:
        return null;
    }
  };

  const isLight = settings.panelTheme === 'light';
  const pullProgress = Math.min(1, pullY / (PULL_THRESHOLD * 0.45));

  return (
    <div className={`panel-root relative flex flex-col overflow-hidden ${isLight ? 'theme-light bg-[#f0f1f5]' : 'bg-[#080c18]'} ${uiScaleClass} ${headerScaleClass}`}>
      <div className="noise-bg" />

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className={`absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[150px] ${isLight ? 'bg-cyan-400/5' : 'bg-cyan-500/3'}`} />
        <div className={`absolute bottom-0 left-[20%] w-[400px] h-[400px] rounded-full blur-[120px] ${isLight ? 'bg-violet-400/5' : 'bg-violet-500/3'}`} />
      </div>

      <Sidebar
        page={page}
        onNavigate={setPage}
        onLogout={onLogout}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        name={settings.name}
        logo={settings.logo}
        headerScale={settings.headerScale}
        isLight={isLight}
      />

      <div className="flex min-h-0 flex-1 flex-col lg:pl-[260px]">
        <header className={`relative z-30 flex-shrink-0 border-b backdrop-blur-xl ${isLight ? 'border-black/5 bg-white/80' : 'border-white/5 bg-[#080c18]/90'}`}>
          <div className="flex items-center justify-between px-4 py-3 lg:px-6">
            <div className="flex items-center gap-3 panel-header-inner">
              <button
                onClick={() => setSidebarOpen(true)}
                className={`rounded-lg p-2 transition lg:hidden ${isLight ? 'text-slate-400 hover:bg-black/5 hover:text-slate-600' : 'text-white/30 hover:bg-white/5 hover:text-white/60'}`}
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <h1 className={`text-base font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>{pageTitles[page]}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`hidden items-center gap-2 rounded-lg px-3 py-1.5 sm:flex ${isLight ? 'bg-black/3' : 'bg-white/3'}`}>
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
                <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>Онлайн</span>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20">
                <Upload className="h-3.5 w-3.5 text-cyan-400" />
              </div>
            </div>
          </div>
        </header>

        <main
          ref={mainRef}
          className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-none p-4 lg:p-6"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Pull-to-refresh индикатор */}
          <div
            className="pointer-events-none flex items-center justify-center overflow-hidden transition-all duration-200"
            style={{ height: pullY > 0 || refreshing ? `${refreshing ? 36 : pullY}px` : 0, opacity: refreshing ? 1 : pullProgress }}
          >
            <RefreshCw
              className={`h-5 w-5 text-cyan-400 transition-transform duration-200 ${refreshing ? 'animate-spin' : ''}`}
              style={{ transform: `rotate(${pullProgress * 180}deg)` }}
            />
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className={`relative z-30 flex-shrink-0 border-t backdrop-blur-xl ${isLight ? 'border-black/5 bg-white/80' : 'border-white/3 bg-[#080c18]/90'}`}>
          <div className="overflow-hidden py-2 px-4 lg:px-6">
            <div className={`marquee-track text-[10px] tracking-widest ${isLight ? 'text-black/6' : 'text-white/8'}`}>
              <span>{marqueeContent}</span>
              <span>{marqueeContent}</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
