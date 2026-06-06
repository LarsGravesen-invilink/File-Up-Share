import React, { useState, useCallback, useEffect } from 'react';
import { Landing } from './components/Landing';
import { Auth } from './components/Auth';
import { Panel } from './components/Panel';
import { StealthPage } from './components/StealthPage';

const API = '/api';

async function api(path: string, opts?: RequestInit) {
  const res = await fetch(API + path, { ...opts, headers: { 'Content-Type': 'application/json', ...opts?.headers } });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

type View = 'landing' | 'auth' | 'panel';

const App: React.FC = () => {
  const [view, setView] = useState<View>('landing');
  const [auth, setAuth] = useState<any>({ firstRun: true, loggedIn: false });
  const [settings, setSettings] = useState<any>(null);
  const [stats, setStats] = useState<any>({ filesInShare: 0, uploadPages: 0, receivedFiles: 0, usedSpaceMB: 0, totalSpaceMB: 51200 });
  const [shares, setShares] = useState<any[]>([]);
  const [uploads, setUploads] = useState<any[]>([]);
  const [receivedFiles, setReceivedFiles] = useState<any[]>([]);
  const [stealth, setStealth] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api('/state');
      setAuth(data.auth);
      setSettings(data.settings);
      setStats(data.stats);
      setShares(data.shares || []);
      setUploads(data.uploads || []);
      setReceivedFiles(data.received || []);
      setStealth(data.stealth || false);
      if (data.auth.loggedIn) setView('panel');
      setLoaded(true);
    } catch {
      setLoaded(true);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const go = useCallback((v: View) => setView(v), []);

  const register = useCallback(async (u: string, p: string) => {
    await api('/register', { method: 'POST', body: JSON.stringify({ user: u, pass: p }) });
    await load();
    go('panel');
  }, [load, go]);

  const login = useCallback(async (u: string, p: string) => {
    try {
      const r = await api('/login', { method: 'POST', body: JSON.stringify({ user: u, pass: p }) });
      if (r.ok) { await load(); go('panel'); }
      return r;
    } catch { return { ok: false }; }
  }, [load, go]);

  const logout = useCallback(async () => {
    await api('/logout', { method: 'POST' }).catch(() => {});
    setAuth({ firstRun: false, loggedIn: false });
    go('landing');
  }, [go]);

  const updateSettings = useCallback(async (p: any) => {
    const r = await api('/settings', { method: 'PATCH', body: JSON.stringify(p) });
    setSettings(r);
  }, []);

  const addShare = useCallback(async (item: any) => {
    const r = await api('/shares', { method: 'POST', body: JSON.stringify(item) });
    setShares(r.shares);
    return r;
  }, []);

  const removeShare = useCallback(async (id: string) => {
    const r = await api('/shares/' + id, { method: 'DELETE' });
    setShares(r.shares);
  }, []);

  const addUpload = useCallback(async (item: any) => {
    const r = await api('/uploads', { method: 'POST', body: JSON.stringify(item) });
    setUploads(r.uploads);
    return r;
  }, []);

  const removeUpload = useCallback(async (id: string) => {
    const r = await api('/uploads/' + id, { method: 'DELETE' });
    setUploads(r.uploads);
  }, []);

  const removeReceived = useCallback(async (id: string) => {
    const r = await api('/received/' + id, { method: 'DELETE' });
    setReceivedFiles(r.received);
  }, []);

  const changeCredentials = useCallback(async (l: string, p: string) => {
    await api('/credentials', { method: 'POST', body: JSON.stringify({ login: l, pass: p }) });
  }, []);

  if (!loaded) return null;

  if (stealth && view !== 'panel') return <StealthPage />;

  if (!settings) return null;

  return (
    <>
      {view === 'landing' && <Landing onLogin={() => go('auth')} name={settings.name} />}
      {view === 'auth' && (
        <Auth firstRun={auth.firstRun} onRegister={register} onLogin={login} onBack={() => go('landing')} name={settings.name} logo={settings.logo} />
      )}
      {view === 'panel' && (
        <Panel
          onLogout={logout}
          settings={settings}
          stats={stats}
          shares={shares}
          uploads={uploads}
          onUpdate={updateSettings}
          onAddShare={addShare}
          onAddUpload={addUpload}
          onRemoveShare={removeShare}
          onRemoveUpload={removeUpload}
          onChangeCredentials={changeCredentials}
          receivedFiles={receivedFiles}
          onRemoveReceived={removeReceived}
        />
      )}
    </>
  );
};

export default App;
