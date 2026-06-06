import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar, type Page } from './Sidebar';
import { InfoPage } from './pages/InfoPage';
import { CreateSharePage } from './pages/CreateSharePage';
import { CreateUploadPage } from './pages/CreateUploadPage';
import { SettingsPage } from './pages/SettingsPage';
import { DesignPage } from './pages/DesignPage';
import { SecurityPage } from './pages/SecurityPage';
import { MySharesPage } from './pages/MySharesPage';
import { MyUploadsPage } from './pages/MyUploadsPage';
import { ReceivedFilesPage } from './pages/ReceivedFilesPage';
import { TelegramPage } from './pages/TelegramPage';
import { ShareView } from './ShareView';
import { UploadView } from './UploadView';
import { QuotaModal } from './QuotaModal';
import { type Settings, type Stats, type ShareItem, type UploadPage as UPT, type ReceivedFile, isQuotaExceeded, uiScales, headerScales } from '../types';

const meta: Record<Page, { label: string }> = {
  'info': { label: 'Информация' },
  'create-share': { label: 'Создать раздачу' },
  'create-upload': { label: 'Создать загрузку' },
  'my-shares': { label: 'Мои раздачи' },
  'my-uploads': { label: 'Мои загрузки' },
  'received': { label: 'Принятые файлы' },
  'design': { label: 'Внешний вид' },
  'settings': { label: 'Настройка панели' },
  'security': { label: 'Безопасность' },
  'telegram': { label: 'Telegram bot' },
};

const LAST_PAGE_KEY = 'fus_lastPage';

interface LinkPopup { url: string; type: 'share' | 'upload' }

interface Props {
  onLogout: () => void;
  settings: Settings;
  stats: Stats;
  shares: ShareItem[];
  uploads: UPT[];
  onUpdate: (s: Partial<Settings>) => void;
  onAddShare: (item: ShareItem) => void;
  onAddUpload: (item: UPT) => void;
  onRemoveShare: (id: string) => void;
  onRemoveUpload: (id: string) => void;
  onChangeCredentials: (login: string, pass: string) => void;
  receivedFiles: ReceivedFile[];
  onRemoveReceived: (id: string) => void;
}

export const Panel: React.FC<Props> = ({
  onLogout, settings, stats, shares, uploads,
  onUpdate, onAddShare, onAddUpload, onRemoveShare, onRemoveUpload, onChangeCredentials,
  receivedFiles, onRemoveReceived
}) => {
  // Restore last page
  const savedPage = (localStorage.getItem(LAST_PAGE_KEY) || 'info') as Page;
  const [page, setPage] = useState<Page>(savedPage in meta ? savedPage : 'info');
  const [sidebar, setSidebar] = useState(false);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [previewShare, setPreviewShare] = useState<ShareItem | null>(null);
  const [previewUpload, setPreviewUpload] = useState<UPT | null>(null);
  const [linkPopup, setLinkPopup] = useState<LinkPopup | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [httpWarning, setHttpWarning] = useState(() => {
    const isHttp = !settings.accessSSL && settings.accessMode === 'domain';
    const shown = sessionStorage.getItem('fus_http_warn');
    return isHttp && !shown;
  });

  const zoomValue = uiScales[settings.uiScale]?.rem || 1;
  const hs = headerScales[settings.headerScale] || headerScales.default;

  // History stack for back button
  const historyRef = useRef<Page[]>([page]);

  // Save page to localStorage + push history
  const navigate = useCallback((p: Page) => {
    historyRef.current.push(p);
    setPage(p);
    localStorage.setItem(LAST_PAGE_KEY, p);
    window.history.pushState({ page: p }, '', '');
  }, []);

  // Initial history entry
  useEffect(() => {
    window.history.replaceState({ page }, '', '');
  }, []);

  useEffect(() => {
    const hasModal = sidebar || showQuotaModal || !!linkPopup || httpWarning;
    document.body.classList.toggle('modal-open', hasModal);
    return () => { document.body.classList.remove('modal-open'); };
  }, [sidebar, showQuotaModal, linkPopup, httpWarning]);

  // Handle browser back button
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      e.preventDefault();
      const stack = historyRef.current;
      if (stack.length > 1) {
        stack.pop();
        const prev = stack[stack.length - 1];
        setPage(prev);
        localStorage.setItem(LAST_PAGE_KEY, prev);
      } else {
        // Stay on current page, push state back
        window.history.pushState({ page }, '', '');
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [page]);

  useEffect(() => {
    if (isQuotaExceeded(settings, stats.usedSpaceMB)) setShowQuotaModal(true);
  }, [settings, stats.usedSpaceMB]);

  const handleCreateShare = (item: ShareItem) => {
    onAddShare(item);
    const url = `${location.origin}/s/${btoa(item.id)}`;
    setLinkPopup({ url, type: 'share' });
    navigate('my-shares');
  };

  const handleCreateUpload = (item: UPT) => {
    onAddUpload(item);
    const url = `${location.origin}/u/${btoa(item.id)}`;
    setLinkPopup({ url, type: 'upload' });
    navigate('my-uploads');
  };

  const copyPopupLink = () => {
    if (linkPopup) {
      navigator.clipboard?.writeText(linkPopup.url).then(() => {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      });
    }
  };

  // Preview views
  const previewOverlay = previewShare ? (
    <div className="fixed inset-0 z-[55] bg-bg overflow-y-auto">
      <ShareView item={previewShare} settings={settings} onBack={() => setPreviewShare(null)} isPreview />
    </div>
  ) : previewUpload ? (
    <div className="fixed inset-0 z-[55] bg-bg overflow-y-auto">
      <UploadView item={previewUpload} settings={settings} onBack={() => setPreviewUpload(null)} isPreview />
    </div>
  ) : null;

  const renderPage = () => {
    switch (page) {
      case 'info':
        return <InfoPage stats={{ ...stats, filesInShare: shares.length || stats.filesInShare, uploadPages: uploads.length || stats.uploadPages }} settings={settings} onNavigate={navigate} />;
      case 'create-share':
        return <CreateSharePage onCreateShare={handleCreateShare} onPreview={setPreviewShare} settings={settings} />;
      case 'create-upload':
        return <CreateUploadPage onCreateUpload={handleCreateUpload} onPreview={setPreviewUpload} settings={settings} />;
      case 'my-shares':
        return <MySharesPage shares={shares} onRemove={onRemoveShare} onNavigate={navigate} onPreview={setPreviewShare} />;
      case 'my-uploads':
        return <MyUploadsPage uploads={uploads} onRemove={onRemoveUpload} onNavigate={navigate} onPreview={setPreviewUpload} />;
      case 'received':
        return <ReceivedFilesPage files={receivedFiles} onRemove={onRemoveReceived} />;
      case 'design':
        return <DesignPage settings={settings} onUpdate={onUpdate} />;
      case 'settings':
        return <SettingsPage settings={settings} onUpdate={onUpdate} />;
      case 'security':
        return <SecurityPage settings={settings} onUpdate={onUpdate} onChangeCredentials={onChangeCredentials} onLogout={onLogout} botConfigured={false} />;
      case 'telegram':
        return <TelegramPage settings={settings} onUpdate={onUpdate} />;
      default:
        return (
          <div className="rounded-xl border border-accent/15 bg-surface/30 backdrop-blur-sm p-8 sm:p-10">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
              </div>
              <h2 className="text-[14px] font-semibold text-text mb-1">{(meta as any)[page]?.label || page}</h2>
              <span className="inline-flex h-6 px-2.5 rounded-md border border-accent/15 bg-accent/5 text-[10px] text-accent/70 font-medium items-center">В разработке</span>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`min-h-dvh bg-bg bg-grid relative overflow-hidden panel-transition panel-no-select ${settings.panelTheme === 'light' ? 'panel-light' : ''}`} style={{ zoom: zoomValue }}>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-radial pointer-events-none" />

      <Sidebar open={sidebar} onClose={() => setSidebar(false)} page={page} onNav={p => { setSidebar(false); navigate(p); }} onLogout={onLogout} name={settings.name} logo={settings.logo} panelTheme={settings.panelTheme} headerScale={hs} />

      <header className="sticky top-0 z-30 flex items-center px-4 sm:px-6 border-b border-accent/10 bg-bg/80 backdrop-blur-md" style={{ height: `${hs.headerH}px` }}>
        <button onClick={() => setSidebar(true)} className="rounded-lg flex items-center justify-center text-text-muted hover:text-accent hover:bg-accent/10 active:scale-95 transition-all mr-3" style={{ width: `${hs.menu + 14}px`, height: `${hs.menu + 14}px`, marginLeft: '-4px' }}>
          <svg width={hs.menu} height={hs.menu} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
        </button>
        <h1 className="font-semibold text-text truncate" style={{ fontSize: `${hs.text}px` }}>{meta[page].label}</h1>
      </header>

      <main className="relative z-10 px-4 sm:px-6 lg:px-8 py-5 max-w-2xl lg:max-w-3xl mx-auto">{renderPage()}</main>

      <footer className="relative z-10 py-3 text-center"><p className="text-[9px] text-text-muted/25">by invilink | LarsGravesen</p></footer>

      <QuotaModal show={showQuotaModal} onClose={() => setShowQuotaModal(false)} onSettings={() => { setShowQuotaModal(false); navigate('settings'); }} />

      {/* Link popup after create */}
      {linkPopup && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={() => setLinkPopup(null)} />
          <div className="relative w-full max-w-sm rounded-xl border border-accent/20 bg-surface/95 backdrop-blur-xl shadow-[0_0_50px_#00000080] p-5 animate-in">
            <div className="text-center mb-4">
              <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              </div>
              <h3 className="text-[14px] font-semibold text-text">
                {linkPopup.type === 'share' ? 'Раздача создана' : 'Загрузка создана'}
              </h3>
              <p className="text-[11px] text-text-muted mt-1">Скопируйте ссылку</p>
            </div>
            <div className="flex gap-2 mb-3">
              <input
                readOnly
                value={linkPopup.url}
                className="flex-1 h-9 px-3 rounded-md bg-bg/60 border border-border text-[10px] text-text font-mono outline-none"
                onClick={e => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={copyPopupLink}
                className={`h-9 px-4 rounded-md text-[11px] font-medium transition-all ${linkCopied ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-accent/90 text-bg hover:bg-accent'}`}
              >
                {linkCopied ? '✓' : 'Копировать'}
              </button>
            </div>
            <button onClick={() => setLinkPopup(null)} className="w-full h-9 rounded-md border border-border text-[12px] text-text-muted hover:text-text transition-colors">
              Закрыть
            </button>
          </div>
        </div>
      )}

      {previewOverlay}

      {httpWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative w-full max-w-sm rounded-xl border border-[#eab308]/20 bg-surface/95 backdrop-blur-xl p-5 animate-in">
            <div className="w-10 h-10 rounded-full bg-[#eab308]/10 border border-[#eab308]/20 flex items-center justify-center mx-auto mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <h3 className="text-[13px] font-semibold text-text text-center mb-2">Небезопасное соединение</h3>
            <p className="text-[11px] text-text-muted text-center mb-4">Панель работает без SSL шифрования. Данные передаются в открытом виде. Рекомендуется настроить HTTPS.</p>
            <button onClick={() => { setHttpWarning(false); sessionStorage.setItem('fus_http_warn', '1'); }} className="w-full h-9 rounded-md bg-[#eab308]/20 text-[#eab308] text-[11px] font-medium hover:bg-[#eab308]/30 transition-colors">
              Продолжить
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
