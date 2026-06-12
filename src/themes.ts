export interface PageTheme {
  id: string;
  name: string;
  bg: string;
  text: string;
  textMuted: string;
  accent: string;
  cardBg: string;
  borderColor: string;
  dark: boolean;
}

export const themes: PageTheme[] = [
  // Оригинальные 5 тёмных тем
  { id: 'default', name: 'Тёмный минимал', bg: '#0f172a', text: '#e2e8f0', textMuted: '#94a3b8', accent: '#06b6d4', cardBg: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.06)', dark: true },
  { id: 'midnight', name: 'Полночь', bg: '#0a0a1a', text: '#c8ceff', textMuted: '#7a7fb3', accent: '#818cf8', cardBg: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.06)', dark: true },
  { id: 'forest', name: 'Тёмный лес', bg: '#0a1a0f', text: '#c8e6c9', textMuted: '#6b9a6e', accent: '#4caf50', cardBg: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.06)', dark: true },
  { id: 'ocean', name: 'Глубокий океан', bg: '#0a1520', text: '#b3e5fc', textMuted: '#5a8aa8', accent: '#0288d1', cardBg: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.06)', dark: true },
  { id: 'ember', name: 'Угли', bg: '#1a0a0a', text: '#ffcdd2', textMuted: '#a06a6e', accent: '#ef5350', cardBg: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.06)', dark: true },
  // Новые 10 тёмных тем
  { id: 'obsidian', name: 'Обсидиан', bg: '#0d0d0f', text: '#d4d4d8', textMuted: '#71717a', accent: '#a78bfa', cardBg: 'rgba(167,139,250,0.05)', borderColor: 'rgba(167,139,250,0.08)', dark: true },
  { id: 'noir', name: 'Нуар', bg: '#111111', text: '#e5e5e5', textMuted: '#6b6b6b', accent: '#f5f5f5', cardBg: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.07)', dark: true },
  { id: 'aurora', name: 'Аврора', bg: '#060d1f', text: '#cffafe', textMuted: '#5eead4', accent: '#2dd4bf', cardBg: 'rgba(45,212,191,0.05)', borderColor: 'rgba(45,212,191,0.08)', dark: true },
  { id: 'carbon', name: 'Карбон', bg: '#161616', text: '#f4f4f4', textMuted: '#8d8d8d', accent: '#0f62fe', cardBg: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', dark: true },
  { id: 'dusk', name: 'Сумерки', bg: '#13111c', text: '#e4d9f5', textMuted: '#8b7aaa', accent: '#c084fc', cardBg: 'rgba(192,132,252,0.05)', borderColor: 'rgba(192,132,252,0.08)', dark: true },
  { id: 'slate', name: 'Сланец', bg: '#0f1117', text: '#cbd5e1', textMuted: '#475569', accent: '#38bdf8', cardBg: 'rgba(56,189,248,0.04)', borderColor: 'rgba(56,189,248,0.07)', dark: true },
  { id: 'copper', name: 'Медь', bg: '#100c08', text: '#fde8d8', textMuted: '#a07058', accent: '#f97316', cardBg: 'rgba(249,115,22,0.05)', borderColor: 'rgba(249,115,22,0.08)', dark: true },
  { id: 'abyss', name: 'Бездна', bg: '#070b14', text: '#bfc9e0', textMuted: '#4a5568', accent: '#667eea', cardBg: 'rgba(102,126,234,0.05)', borderColor: 'rgba(102,126,234,0.07)', dark: true },
  { id: 'graphite', name: 'Графит', bg: '#1c1c1e', text: '#f5f5f7', textMuted: '#8e8e93', accent: '#30d158', cardBg: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)', dark: true },
  { id: 'crimson', name: 'Малиновый закат', bg: '#110810', text: '#f9d0f0', textMuted: '#9b5e97', accent: '#e879f9', cardBg: 'rgba(232,121,249,0.05)', borderColor: 'rgba(232,121,249,0.08)', dark: true },
];

export function getTheme(id: string): PageTheme {
  return themes.find(t => t.id === id) || themes[0];
}
