export type View = 'landing' | 'auth' | 'panel';

export type Page =
  | 'info'
  | 'create-share'
  | 'create-upload'
  | 'my-shares'
  | 'my-uploads'
  | 'received'
  | 'design'
  | 'settings'
  | 'security'
  | 'telegram'
  | 'about';

export interface Settings {
  name: string;
  logo: string;
  panelTheme: 'dark' | 'light';
  pageTheme: string;
  uiScale: string;
  headerScale: string;
  quotaEnabled: boolean;
  quotaValue: number;
  quotaUnit: string;
  adEnabled: boolean;
  adText: string;
  hideLifetimeOnPage: boolean;
  encryptFiles: boolean;
  sharePasswordEnabled: boolean;
  sharePassword: string;
  uploadPasswordEnabled: boolean;
  uploadPassword: string;
  stealthEnabled: boolean;
  storagePath: string;
  receivedPath: string;
  botEnabled: boolean;
  botToken: string;
  botChatId: string;
  botPollInterval: number;
  botPollUnit: string;
  botNotifyShare: boolean;
  botNotifyUpload: boolean;
  botNotifyReceived: boolean;
  botNotifyService: boolean;
  botDailySummary: boolean;
  botDailySummaryTime: string;
  timezone: string;
}

export interface Stats {
  filesInShare: number;
  uploadPages: number;
  receivedFiles: number;
  usedSpaceMB: number;
  totalSpaceMB: number;
  diskTotalMB: number;
  ip: string;
  hostname: string;
  cpu: string;
  cpuCores: number;
  cpuPercent: number;
  ramTotal: number;
  ramUsed: number;
  ramPercent: number;
}

export interface Share {
  id: string;
  title: string;
  comment: string;
  files: ShareFile[];
  cover: string;
  mode: 'download' | 'view';
  allowDownload: boolean;
  lifetime: number;
  lifetimeUnit: string;
  hideExtensions: boolean;
  password: string;
  createdAt: number;
  expiresAt: number;
  link: string;
}

export interface ShareFile {
  name: string;
  size: number;
  type: string;
}

export interface Upload {
  id: string;
  title: string;
  comment: string;
  lifetime: number;
  lifetimeUnit: string;
  maxFiles: number;
  maxUploads: number;
  usedUploads: number;
  allowComment: boolean;
  password: string;
  createdAt: number;
  expiresAt: number;
  link: string;
}

export interface ReceivedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  receivedAt: number;
  source: string;
  comment: string;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'warn' | 'error' | 'success';
}

export interface CheckResult {
  name: string;
  status: 'ok' | 'warn' | 'err';
  message: string;
}

export interface Session {
  loggedIn: boolean;
  firstRun: boolean;
  expiresAt: number;
}

export interface Credentials {
  login: string;
  passwordHash: string;
}
