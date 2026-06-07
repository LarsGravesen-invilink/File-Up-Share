import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Upload } from 'lucide-react';
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
}

export function Panel({
  settings, stats, shares, uploads, received, logs,
  onUpdateSettings, onAddShare, onRemoveShare, onExtendShare,
  onAddUpload, onExtendUpload, onRemoveUpload, onRemoveReceived,
  onChangeCredentials, onRestart, onLogout,
}: Props) {
  const [page, setPage] = useState<Page>('info');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const marqueeText = `${settings.name} · v 1.0.1 · by LarsGravesen | invilink · `;
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

  return (
    <div className={`relative flex h-screen flex-col overflow-hidden bg-[#080c18] ${uiScaleClass} ${headerScaleClass}`}>
      <div className="noise-bg" />

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-cyan-500/3 blur-[150px]" />
        <div className="absolute bottom-0 left-[20%] w-[400px] h-[400px] rounded-full bg-violet-500/3 blur-[120px]" />
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
      />

      <div className="flex h-full flex-col lg:pl-[260px]">
        <header className="relative z-30 flex-shrink-0 border-b border-white/5 bg-[#080c18]/90 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-3 lg:px-6">
            <div className="flex items-center gap-3 panel-header-inner">
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-lg p-2 text-white/30 transition hover:bg-white/5 hover:text-white/60 lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-sm font-semibold text-white">{pageTitles[page]}</h1>
                <p className="text-[10px] text-white/20">{settings.name} · v 1.0.1</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-lg bg-white/3 px-3 py-1.5 sm:flex">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
                <span className="text-[10px] text-white/30">Онлайн</span>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20">
                <Upload className="h-3.5 w-3.5 text-cyan-400" />
              </div>
            </div>
          </div>
        </header>

        <main className="relative z-10 flex-1 overflow-y-auto p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="relative z-30 flex-shrink-0 border-t border-white/3 bg-[#080c18]/90 backdrop-blur-xl">
          <div className="overflow-hidden py-2 px-4 lg:px-6">
            <div className="marquee-track text-[10px] tracking-widest text-white/8">
              <span>{marqueeContent}</span>
              <span>{marqueeContent}</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
