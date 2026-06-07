import { useState, useCallback, useEffect } from 'react';
import * as api from './api';
import type { Settings, Stats, Share, Upload, ReceivedFile, LogEntry, Session } from './types';

const defaultSettings: Settings = {
  name: 'FileUpShare',
  logo: '',
  panelTheme: 'dark',
  pageTheme: 'default',
  uiScale: 'default',
  headerScale: 'default',
  quotaEnabled: false,
  quotaValue: 10,
  quotaUnit: 'GB',
  adEnabled: true,
  adText: '',
  hideLifetimeOnPage: false,
  encryptFiles: false,
  sharePasswordEnabled: false,
  sharePassword: '',
  uploadPasswordEnabled: false,
  uploadPassword: '',
  stealthEnabled: false,
  storagePath: '/var/lib/fileupshare/shares',
  receivedPath: '/var/lib/fileupshare/received',
  botEnabled: false,
  botToken: '',
  botChatId: '',
  botPollInterval: 3,
  botPollUnit: 'sec',
  timezone: 'Europe/Moscow',
};

const defaultStats: Stats = {
  filesInShare: 0,
  uploadPages: 0,
  receivedFiles: 0,
  usedSpaceMB: 0,
  totalSpaceMB: 51200,
  ip: '—',
  hostname: '—',
  cpu: '—',
  cpuCores: 0,
  cpuPercent: 0,
  ramTotal: 0,
  ramUsed: 0,
  ramPercent: 0,
};

export function useStore() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [stats, setStats] = useState<Stats>(defaultStats);
  const [shares, setShares] = useState<Share[]>([]);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [received, setReceived] = useState<ReceivedFile[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [session, setSession] = useState<Session>({ loggedIn: false, firstRun: true, expiresAt: 0 });
  const [loading, setLoading] = useState(true);

  const loadState = useCallback(async () => {
    try {
      const state = await api.getState();
      setSession({
        loggedIn: state.auth.loggedIn,
        firstRun: state.auth.firstRun,
        expiresAt: state.auth.loggedIn ? Date.now() + 6 * 60 * 60 * 1000 : 0,
      });
      if (state.config && typeof state.config === 'object') {
        setSettings({ ...defaultSettings, ...(state.config as Partial<Settings>) });
      }
      if (state.stats) {
        setStats(state.stats);
      }
      setShares(state.shares || []);
      setUploads(state.uploads || []);
      setReceived(state.received || []);
      setLogs(state.logs || []);
    } catch (e) {
      console.error('Failed to load state:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadState();
  }, [loadState]);

  useEffect(() => {
    if (!session.loggedIn) return;
    const interval = setInterval(async () => {
      try {
        const state = await api.getState();
        if (state.stats) setStats(state.stats);
        if (state.shares) setShares(state.shares);
        if (state.uploads) setUploads(state.uploads);
        if (state.received) setReceived(state.received);
        if (state.logs) setLogs(state.logs);
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [session.loggedIn]);

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    try {
      const updated = await api.updateConfig(patch);
      if (updated && typeof updated === 'object') {
        setSettings(prev => ({ ...prev, ...(updated as Partial<Settings>) }));
      }
    } catch {}
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await api.login(username, password);
      if (res.ok) {
        await loadState();
        return true;
      }
    } catch {}
    return false;
  }, [loadState]);

  const register = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await api.register(username, password);
      if (res.ok) {
        await loadState();
        return true;
      }
    } catch {}
    return false;
  }, [loadState]);

  const logout = useCallback(async () => {
    await api.logout();
    setSession({ loggedIn: false, firstRun: false, expiresAt: 0 });
    setShares([]);
    setUploads([]);
    setReceived([]);
    setLogs([]);
  }, []);

  const changeCredentials = useCallback(async (newLogin: string, newPassword: string): Promise<boolean> => {
    try {
      const res = await api.changeCredentials(newLogin, newPassword);
      return res.ok;
    } catch {}
    return false;
  }, []);

  const addShare = useCallback(async (share: Share) => {
    try {
      const res = await api.createShare(share);
      if (res.ok && res.share) {
        setShares(prev => [res.share, ...prev]);
        return res.share;
      }
    } catch {}
    return null;
  }, []);

  const removeShare = useCallback(async (id: string) => {
    try {
      await api.deleteShare(id);
      setShares(prev => prev.filter(s => s.id !== id));
    } catch {}
  }, []);

  const extendShare = useCallback(async (id: string, hours: number) => {
    try {
      const res = await api.extendShare(id, hours);
      if (res.ok && res.share) {
        setShares(prev => prev.map(s => s.id === id ? res.share : s));
      }
    } catch {}
  }, []);

  const addUpload = useCallback(async (upload: Upload) => {
    try {
      const res = await api.createUpload(upload);
      if (res.ok && res.upload) {
        setUploads(prev => [res.upload, ...prev]);
        return res.upload;
      }
    } catch {}
    return null;
  }, []);

  const extendUpload = useCallback(async (id: string, hours: number) => {
    try {
      const res = await api.extendUpload(id, hours);
      if (res.ok && res.upload) {
        setUploads(prev => prev.map(u => u.id === id ? res.upload : u));
      } else {
        setUploads(prev => prev.map(u => u.id === id ? { ...u, expiresAt: u.expiresAt + hours * 3600000 } : u));
      }
    } catch {}
  }, []);

  const removeUpload = useCallback(async (id: string) => {
    try {
      await api.deleteUpload(id);
      setUploads(prev => prev.filter(u => u.id !== id));
    } catch {}
  }, []);

  const removeReceived = useCallback(async (id: string) => {
    try {
      await api.deleteReceived(id);
      setReceived(prev => prev.filter(r => r.id !== id));
    } catch {}
  }, []);

  const restartPanel = useCallback(async () => {
    await logout();
    setTimeout(() => window.location.reload(), 500);
  }, [logout]);

  return {
    settings,
    stats,
    shares,
    uploads,
    received,
    logs,
    session,
    loading,
    updateSettings,
    login,
    register,
    logout,
    changeCredentials,
    addShare,
    removeShare,
    extendShare,
    addUpload,
    extendUpload,
    removeUpload,
    removeReceived,
    restartPanel,
    loadState,
  };
}
