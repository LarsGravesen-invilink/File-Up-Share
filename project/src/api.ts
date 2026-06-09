const API_BASE = '/api';

let authToken: string | null = localStorage.getItem('fus_token');

export function setToken(token: string | null) {
  authToken = token;
  if (token) localStorage.setItem('fus_token', token);
  else localStorage.removeItem('fus_token');
}

export function getToken() { return authToken; }

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (authToken) headers['Authorization'] = 'Bearer ' + authToken;

  const res = await fetch(API_BASE + path, { ...options, headers });
  if (res.status === 401 && !path.startsWith('/login') && !path.startsWith('/register') && !path.startsWith('/public/')) {
    setToken(null);
    window.location.reload();
  }
  const text = await res.text();
  if (!res.ok) throw new Error(text);
  try { return JSON.parse(text); } catch { throw new Error(text); }
}

export const getState = () => request<{
  auth: { firstRun: boolean; loggedIn: boolean };
  config: any; stats: any; shares: any[]; uploads: any[]; received: any[]; logs: any[];
}>('/state');

export const register = async (login: string, password: string) => {
  const r = await request<{ ok: boolean; token: string }>('/register', { method: 'POST', body: JSON.stringify({ login, password }) });
  if (r.ok && r.token) setToken(r.token);
  return r;
};

export const login = async (login: string, password: string) => {
  const r = await request<{ ok: boolean; token: string; error?: string }>('/login', { method: 'POST', body: JSON.stringify({ login, password }) });
  if (r.ok && r.token) setToken(r.token);
  return r;
};

export const logout = async () => {
  try { await request('/logout', { method: 'POST' }); } catch {}
  setToken(null);
};

export const changeCredentials = (login: string, password: string) =>
  request<{ ok: boolean }>('/change-credentials', { method: 'POST', body: JSON.stringify({ login, password }) });

export const updateConfig = (patch: Record<string, any>) =>
  request('/config', { method: 'PATCH', body: JSON.stringify(patch) });

export const createShare = (share: any) =>
  request<{ ok: boolean; share: any }>('/shares', { method: 'POST', body: JSON.stringify(share) });

export function uploadFiles(
  shareId: string,
  files: File[],
  onProgress?: (progress: number) => void
): Promise<{ ok: boolean; shareId: string; files: any[] }> {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    files.forEach(f => fd.append('files', f));
    const xhr = new XMLHttpRequest();
    xhr.open('POST', API_BASE + '/shares/' + shareId + '/upload');
    if (authToken) xhr.setRequestHeader('Authorization', 'Bearer ' + authToken);
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const pct = Math.round(e.loaded / e.total * 100);
        onProgress(pct >= 100 ? 95 : pct);
      }
    });
    xhr.addEventListener('load', () => {
      if (onProgress) onProgress(100);
      if (xhr.status === 200) resolve(JSON.parse(xhr.responseText));
      else reject(new Error(xhr.responseText));
    });
    xhr.addEventListener('error', () => reject(new Error('Upload failed')));
    xhr.addEventListener('abort', () => reject(new Error('Cancelled')));
    xhr.send(fd);
    (window as any).__currentUpload = xhr;
  });
}

export function uploadPublicFile(
  encoded: string,
  file: File,
  comment: string,
  password: string,
  onProgress?: (progress: number) => void
): Promise<{ ok: boolean; file: any }> {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('comment', comment);
    if (password) fd.append('password', password);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', API_BASE + '/public/upload/' + encoded + '/submit');
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const pct = Math.round(e.loaded / e.total * 100);
        onProgress(pct >= 100 ? 95 : pct);
      }
    });
    xhr.addEventListener('load', () => {
      if (onProgress) onProgress(100);
      if (xhr.status === 200) resolve(JSON.parse(xhr.responseText));
      else reject(new Error(xhr.responseText));
    });
    xhr.addEventListener('error', () => reject(new Error('Upload failed')));
    xhr.addEventListener('abort', () => reject(new Error('Cancelled')));
    xhr.send(fd);
    (window as any).__currentUpload = xhr;
  });
}

export function cancelUpload() {
  const xhr = (window as any).__currentUpload;
  if (xhr) { xhr.abort(); (window as any).__currentUpload = null; }
}

export const deleteShare = (id: string) =>
  request<{ ok: boolean }>('/shares/' + id, { method: 'DELETE' });

export const extendShare = (id: string, hours: number) =>
  request<{ ok: boolean; share: any }>('/shares/' + id + '/extend', { method: 'PATCH', body: JSON.stringify({ hours }) });

export const createUpload = (upload: any) =>
  request<{ ok: boolean; upload: any }>('/uploads', { method: 'POST', body: JSON.stringify(upload) });

export const deleteUpload = (id: string) =>
  request<{ ok: boolean }>('/uploads/' + id, { method: 'DELETE' });

export const extendUpload = (id: string, hours: number) =>
  request<{ ok: boolean; upload: any }>('/uploads/' + id + '/extend', { method: 'PATCH', body: JSON.stringify({ hours }) });

export const deleteReceived = (id: string) =>
  request<{ ok: boolean }>('/received/' + id, { method: 'DELETE' });

export const runCheck = () =>
  request<{ results: { name: string; status: string; message: string }[] }>('/check');

export const testBot = () =>
  request<{ ok: boolean; error?: string }>('/bot/test', { method: 'POST' });

export const getPublicShare = (encoded: string) =>
  request<{ share: any; config: any }>('/public/share/' + encoded);

export const verifySharePassword = (encoded: string, password: string) =>
  request<{ ok: boolean; share: any }>('/public/share/' + encoded + '/verify', { method: 'POST', body: JSON.stringify({ password }) });

export const getPublicUpload = (encoded: string) =>
  request<{ upload: any; config: any }>('/public/upload/' + encoded);

export const verifyUploadPassword = (encoded: string, password: string) =>
  request<{ ok: boolean; upload: any }>('/public/upload/' + encoded + '/verify', { method: 'POST', body: JSON.stringify({ password }) });

export const getFileUrl = (dir: string, name: string) => API_BASE + '/file/' + dir + '/' + name;
export const getDownloadUrl = (dir: string, name: string) => API_BASE + '/download/' + dir + '/' + name;
export const getReceivedDownloadUrl = (id: string) => API_BASE + '/received/' + id + '/download?token=' + (authToken || '');
export const getReceivedViewUrl = (id: string) => API_BASE + '/received/' + id + '/view?token=' + (authToken || '');

export const checkVersion = (force?: boolean) =>
  request<{ current: string; latest: string; hasUpdate: boolean }>('/version' + (force ? '?force=1' : ''));

export const runUpdate = () =>
  request<{ ok: boolean }>('/update', { method: 'POST' });
