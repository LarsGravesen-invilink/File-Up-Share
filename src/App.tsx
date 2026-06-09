import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Landing } from './components/Landing';
import { Auth } from './components/Auth';
import { Panel } from './components/Panel';
import { ShareView } from './components/ShareView';
import { UploadView } from './components/UploadView';
import { useStore } from './store';
import type { View } from './types';
import { Loader2 } from 'lucide-react';

export default function App() {
  const store = useStore();
  const [view, setView] = useState<View>('landing');

  useEffect(() => {
    if (!store.loading) {
      if (store.session.loggedIn) {
        setView('panel');
      } else {
        setView('landing');
      }
    }
  }, [store.loading, store.session.loggedIn]);

  const handleLogin = useCallback(async (user: string, pass: string): Promise<boolean> => {
    const success = await store.login(user, pass);
    if (success) {
      setView('panel');
    }
    return success;
  }, [store]);

  const handleRegister = useCallback(async (user: string, pass: string): Promise<boolean> => {
    const success = await store.register(user, pass);
    if (success) {
      setView('panel');
    }
    return success;
  }, [store]);

  const handleLogout = useCallback(async () => {
    await store.logout();
    setView('landing');
  }, [store]);

  const path = window.location.pathname;
  if (path.startsWith('/s/')) {
    return <ShareView encoded={path.slice(3)} />;
  }
  if (path.startsWith('/u/')) {
    return <UploadView encoded={path.slice(3)} />;
  }

  if (store.loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0e1a]">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-cyan-400" />
          <p className="mt-3 text-xs text-white/30">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {view === 'landing' && (
        <Landing
          key="landing"
          name={store.settings.name}
          hidden={(store.settings as any).stealthEnabled}
          onEnter={() => setView('auth')}
        />
      )}
      {view === 'auth' && (
        <Auth
          key="auth"
          firstRun={store.session.firstRun}
          onLogin={handleLogin}
          onRegister={handleRegister}
          onBack={() => setView('landing')}
        />
      )}
      {view === 'panel' && (
        <Panel
          key="panel"
          settings={store.settings}
          stats={store.stats}
          shares={store.shares}
          uploads={store.uploads}
          received={store.received}
          logs={store.logs}
          onUpdateSettings={store.updateSettings}
          onAddShare={store.addShare}
          onRemoveShare={store.removeShare}
          onExtendShare={store.extendShare}
          onAddUpload={store.addUpload}
          onExtendUpload={store.extendUpload}
          onRemoveUpload={store.removeUpload}
          onRemoveReceived={store.removeReceived}
          onChangeCredentials={store.changeCredentials}
          onRestart={store.restartPanel}
          onLogout={handleLogout}
          onRefresh={store.loadState}
        />
      )}
    </AnimatePresence>
  );
}
