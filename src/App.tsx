import React, { useState, useCallback, useEffect } from 'react';
import { Landing } from './components/Landing';
import { Auth } from './components/Auth';
import { Panel } from './components/Panel';
import { StealthPage } from './components/StealthPage';

const API = '/api';

const defaultSettings: any = {
  name: 'FileUpShare', logo: '', quotaEnabled: false, quotaValue: 10, quotaUnit: 'GB',
  adText: '', encryptFiles: false, sharePasswordEnabled: false, sharePassword: '',
  uploadPasswordEnabled: false, uploadPassword: '', hideLifetimeOnPage: false, adEnabled: true,
  pageTheme: 'default', useCustomTime: true, customDate: '', customTime: '', timezone: 'Europe/Moscow',
  uiScale: 'default', headerScale: 'default', panelTheme: 'dark', stealthEnabled: false,
  storagePath: '/var/lib/fileupshare/shares', receivedPath: '/var/lib/fileupshare/received',
  botPollInterval: 3, botPollUnit: 'sec', accessDomain: '', accessPort: 3000, accessSSL: false, accessMode: 'ip'
};

async function api(path: string, opts?: RequestInit) {
  const res = await fetch(API + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...opts?.headers },
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

type View = 'landing' | 'auth' | 'panel';

const App: React.FC = () => {
  const [view, setView] = useState<View>('landing');
  const [auth, setAuth] = useState<any>({ firstRun: true, loggedIn: false });
  const [settings, setSettings] = useState<any>(defaultSettings);
  const [stats, setStats] = useState<any>({ filesInShare: 0, uploadPages: 0, receivedFiles: 0, usedSpaceMB: 0, totalSpaceMB: 51200 });
  const [shares, setShares] = useState<any[]>([]);
  const [uploads, setUploads] = useState<any[]>([]);
  const [receivedFiles, setReceivedFiles] = useState<any[]>([]);
  const [stealth, setStealth] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [apiOk, setApiOk] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api('/state');
      setAuth(data.auth || { firstRun: true, loggedIn: false });
      setSettings({ ...defaultSettings, ...(data.settings || {}) });
      setStats(data.stats || stats);
      setShares(data.shares || []);
      setUploads(data.uploads || []);
      setReceivedFiles(data.received || []);
      setStealth(data.stealth || false);
      setApiOk(true);
      if (data.auth?.loggedIn) setView('panel');
    } catch {
      setApiOk(false);
    }
    setLoaded(true);
  }, []);

  useEffect(() => { load(); }, [load]);

  const go = useCallback((v: View) => setView(v), []);

  const register = useCallback(async (u: string, p: string) => {
    try {
      await api('/register', { method: 'POST', body: JSON.stringify({ user: u, pass: p }) });
      await load();
      go('panel');
    } catch {}
  }, [load, go]);

  const login = useCallback(async (u: string, p: string) => {
    try {
      const r = await api('/login', { method: 'POST', body: JSON.stringify({ user: u, pass: p }) });
      if (r.ok) { await load(); go('panel'); }
      return r;
    } catch {
      return { ok: false };
    }
  }, [load, go]);

  const logout = useCallback(async () => {
    try { await api('/logout', { method: 'POST' }); } catch {}
    setAuth({ firstRun: false, loggedIn: false });
    go('landing');
  }, [go]);

  const updateSettings = useCallback(async (p: any) => {
    try {
      const r = await api('/settings', { method: 'PATCH', body: JSON.stringify(p) });
      setSettings({ ...defaultSettings, ...r });
    } catch {}
  }, []);

  const addShare = useCallback(async (item: any) => {
    try { const r = await api('/shares', { method: 'POST', body: JSON.stringify(item) }); setShares(r.shares || []); return r; } catch { return {}; }
  }, []);

  const removeShare = useCallback(async (id: string) => {
    try { const r = await api('/shares/' + id, { method: 'DELETE' }); setShares(r.shares || []); } catch {}
  }, []);

  const addUpload = useCallback(async (item: any) => {
    try { const r = await api('/uploads', { method: 'POST', body: JSON.stringify(item) }); setUploads(r.uploads || []); return r; } catch { return {}; }
  }, []);

  const removeUpload = useCallback(async (id: string) => {
    try { const r = await api('/uploads/' + id, { method: 'DELETE' }); setUploads(r.uploads || []); } catch {}
  }, []);

  const removeReceived = useCallback(async (id: string) => {
    try { const r = await api('/received/' + id, { method: 'DELETE' }); setReceivedFiles(r.received || []); } catch {}
  }, []);

  const changeCredentials = useCallback(async (l: string, p: string) => {
    try { await api('/credentials', { method: 'POST', body: JSON.stringify({ login: l, pass: p }) }); } catch {}
  }, []);

  if (!loaded) return null;

  if (stealth && view !== 'panel') return <StealthPage />;

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
