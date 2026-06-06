export interface Settings {
  name: string;
  logo: string;
  quotaEnabled: boolean;
  quotaValue: number;
  quotaUnit: 'MB' | 'GB';
  adText: string;
  encryptFiles: boolean;
  sharePasswordEnabled: boolean;
  sharePassword: string;
  uploadPasswordEnabled: boolean;
  uploadPassword: string;
  hideLifetimeOnPage: boolean;
  adEnabled: boolean;
  pageTheme: string;
  useCustomTime: boolean;
  customDate: string;
  customTime: string;
  timezone: string;
  uiScale: 'default' | 'large' | 'huge';
  headerScale: 'default' | 'large' | 'huge';
  panelTheme: 'dark' | 'light';
  stealthEnabled: boolean;
  storagePath: string;
  receivedPath: string;
  botPollInterval: number;
  botPollUnit: 'sec' | 'min';
  accessDomain: string;
  accessPort: number;
  accessSSL: boolean;
  accessMode: 'ip' | 'domain';
}

export interface Stats {
  filesInShare: number;
  uploadPages: number;
  receivedFiles: number;
  usedSpaceMB: number;
  totalSpaceMB: number;
}

export interface ShareFile {
  name: string;
  type: string;
  data: string;
  size: number;
}

export interface ShareItem {
  id: string;
  files: ShareFile[];
  fileName: string;
  fileType: string;
  fileData: string;
  fileSize: number;
  title: string;
  comment: string;
  cover: string;
  hideExtension: boolean;
  allowDownload: boolean;
  mode: 'download' | 'view';
  lifetimeEnabled: boolean;
  lifetimeHours: number;
  lifetimeMinutes: number;
  password: string;
  createdAt: number;
}

export interface UploadPage {
  id: string;
  title: string;
  comment: string;
  lifetimeEnabled: boolean;
  lifetimeHours: number;
  lifetimeMinutes: number;
  maxFiles: number;
  maxUploads: number;
  currentUploads: number;
  password: string;
  allowComment: boolean;
  createdAt: number;
}

export interface ReceivedFile {
  id: string;
  uploadPageId: string;
  uploadPageTitle: string;
  fileName: string;
  fileType: string;
  fileData: string;
  fileSize: number;
  userComment: string;
  receivedAt: number;
}

export interface PageTheme {
  id: string;
  name: string;
  bg: string;
  surface: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentText: string;
  inputBg: string;
  inputBorder: string;
  inputText: string;
}

export const uiScales = {
  default: { label: 'Стандартный', rem: 1 },
  large: { label: 'Большой', rem: 1.125 },
  huge: { label: 'Огромный', rem: 1.25 },
} as const;

export const headerScales = {
  default: { label: 'Стандартный', h: 48, logo: 24, text: 13, menu: 18, headerH: 48, sidebarHeaderH: 52 },
  large: { label: 'Большой', h: 56, logo: 30, text: 15, menu: 22, headerH: 56, sidebarHeaderH: 60 },
  huge: { label: 'Огромный', h: 64, logo: 36, text: 17, menu: 26, headerH: 64, sidebarHeaderH: 68 },
} as const;

export const pageThemes: PageTheme[] = [
  { id: 'default', name: 'Панель', bg: '#050a06', surface: '#0a1210', border: '#1a2e22', text: '#e8f5e9', textMuted: '#5a7a63', accent: '#22c55e', accentText: '#050a06', inputBg: '#0a1210', inputBorder: '#1a2e22', inputText: '#e8f5e9' },
  { id: 'midnight', name: 'Полночь', bg: '#0a0a0f', surface: '#10101a', border: '#1e1e32', text: '#e0e0f0', textMuted: '#606080', accent: '#6366f1', accentText: '#ffffff', inputBg: '#10101a', inputBorder: '#1e1e32', inputText: '#e0e0f0' },
  { id: 'ocean', name: 'Океан', bg: '#040a10', surface: '#081420', border: '#102840', text: '#d0e8f8', textMuted: '#4080a0', accent: '#0ea5e9', accentText: '#040a10', inputBg: '#081420', inputBorder: '#102840', inputText: '#d0e8f8' },
  { id: 'ember', name: 'Угли', bg: '#0f0806', surface: '#1a100c', border: '#2e1a14', text: '#f5e8e0', textMuted: '#7a5a4a', accent: '#f97316', accentText: '#0f0806', inputBg: '#1a100c', inputBorder: '#2e1a14', inputText: '#f5e8e0' },
  { id: 'amethyst', name: 'Аметист', bg: '#0a060f', surface: '#140c1a', border: '#28142e', text: '#f0e0f5', textMuted: '#7a4a80', accent: '#a855f7', accentText: '#ffffff', inputBg: '#140c1a', inputBorder: '#28142e', inputText: '#f0e0f5' },
  { id: 'carbon', name: 'Карбон', bg: '#0c0c0c', surface: '#161616', border: '#2a2a2a', text: '#e4e4e4', textMuted: '#686868', accent: '#71717a', accentText: '#ffffff', inputBg: '#161616', inputBorder: '#2a2a2a', inputText: '#e4e4e4' },
  { id: 'light', name: 'Светлая', bg: '#f8faf8', surface: '#ffffff', border: '#d4ddd6', text: '#1a2e1e', textMuted: '#5a7a60', accent: '#16a34a', accentText: '#ffffff', inputBg: '#f0f4f0', inputBorder: '#c0d0c4', inputText: '#1a2e1e' },
  { id: 'snow', name: 'Снег', bg: '#f4f6fa', surface: '#ffffff', border: '#d0d8e4', text: '#1a1e2e', textMuted: '#5a6080', accent: '#3b82f6', accentText: '#ffffff', inputBg: '#eef2f8', inputBorder: '#c0c8d8', inputText: '#1a1e2e' },
  { id: 'cream', name: 'Кремовая', bg: '#faf8f4', surface: '#ffffff', border: '#e0d8cc', text: '#2e2418', textMuted: '#806a50', accent: '#d97706', accentText: '#ffffff', inputBg: '#f6f2ec', inputBorder: '#d8d0c0', inputText: '#2e2418' },
  { id: 'rose', name: 'Роза', bg: '#faf4f6', surface: '#ffffff', border: '#e4d0d8', text: '#2e1a22', textMuted: '#805060', accent: '#e11d48', accentText: '#ffffff', inputBg: '#f8f0f2', inputBorder: '#d8c0c8', inputText: '#2e1a22' },
  { id: 'mint', name: 'Мята', bg: '#f2faf6', surface: '#ffffff', border: '#c8e4d4', text: '#142820', textMuted: '#4a8068', accent: '#10b981', accentText: '#ffffff', inputBg: '#ecf8f2', inputBorder: '#b8d8c8', inputText: '#142820' },
];

export function getTheme(id: string): PageTheme {
  return pageThemes.find(t => t.id === id) || pageThemes[0];
}

export const russianTimezones = [
  { label: 'Калининград (UTC+2)', value: 'Europe/Kaliningrad' },
  { label: 'Москва (UTC+3)', value: 'Europe/Moscow' },
  { label: 'Самара (UTC+4)', value: 'Europe/Samara' },
  { label: 'Екатеринбург (UTC+5)', value: 'Asia/Yekaterinburg' },
  { label: 'Омск (UTC+6)', value: 'Asia/Omsk' },
  { label: 'Красноярск (UTC+7)', value: 'Asia/Krasnoyarsk' },
  { label: 'Иркутск (UTC+8)', value: 'Asia/Irkutsk' },
  { label: 'Якутск (UTC+9)', value: 'Asia/Yakutsk' },
  { label: 'Владивосток (UTC+10)', value: 'Asia/Vladivostok' },
  { label: 'Магадан (UTC+11)', value: 'Asia/Magadan' },
  { label: 'Камчатка (UTC+12)', value: 'Asia/Kamchatka' },
];

export function formatSize(mb: number): string {
  if (mb >= 1024) return (mb / 1024).toFixed(2);
  return mb.toFixed(1);
}

export function formatSizeUnit(mb: number): string {
  return mb >= 1024 ? 'Гигабайт' : 'Мегабайт';
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} ГБ`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} МБ`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${bytes} Б`;
}

export function isQuotaExceeded(settings: Settings, usedMB: number): boolean {
  if (!settings.quotaEnabled || settings.quotaValue === 0) return false;
  const quotaMB = settings.quotaUnit === 'GB' ? settings.quotaValue * 1024 : settings.quotaValue;
  return usedMB >= quotaMB;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}
