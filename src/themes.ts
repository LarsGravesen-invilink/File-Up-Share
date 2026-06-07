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
  { id: 'default', name: 'Тёмный минимал', bg: '#0f172a', text: '#e2e8f0', textMuted: '#94a3b8', accent: '#06b6d4', cardBg: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.06)', dark: true },
  { id: 'midnight', name: 'Полночь', bg: '#0a0a1a', text: '#c8ceff', textMuted: '#7a7fb3', accent: '#818cf8', cardBg: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.06)', dark: true },
  { id: 'forest', name: 'Тёмный лес', bg: '#0a1a0f', text: '#c8e6c9', textMuted: '#6b9a6e', accent: '#4caf50', cardBg: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.06)', dark: true },
  { id: 'ocean', name: 'Глубокий океан', bg: '#0a1520', text: '#b3e5fc', textMuted: '#5a8aa8', accent: '#0288d1', cardBg: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.06)', dark: true },
  { id: 'ember', name: 'Угли', bg: '#1a0a0a', text: '#ffcdd2', textMuted: '#a06a6e', accent: '#ef5350', cardBg: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.06)', dark: true },
  { id: 'void', name: 'Пустота', bg: '#050505', text: '#a0a0a0', textMuted: '#555555', accent: '#7c3aed', cardBg: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)', dark: true },
  { id: 'snow', name: 'Снег', bg: '#f0f2f5', text: '#1e293b', textMuted: '#64748b', accent: '#3b82f6', cardBg: 'rgba(0,0,0,0.03)', borderColor: 'rgba(0,0,0,0.08)', dark: false },
  { id: 'cream', name: 'Кремовый', bg: '#faf8f0', text: '#713f12', textMuted: '#a17339', accent: '#ca8a04', cardBg: 'rgba(0,0,0,0.03)', borderColor: 'rgba(0,0,0,0.07)', dark: false },
  { id: 'lavender', name: 'Лаванда', bg: '#f0eef8', text: '#4c1d95', textMuted: '#7c5bb5', accent: '#8b5cf6', cardBg: 'rgba(0,0,0,0.03)', borderColor: 'rgba(0,0,0,0.06)', dark: false },
  { id: 'mint', name: 'Мята', bg: '#edf7f2', text: '#065f46', textMuted: '#3a8a6a', accent: '#10b981', cardBg: 'rgba(0,0,0,0.03)', borderColor: 'rgba(0,0,0,0.06)', dark: false },
  { id: 'rose', name: 'Роза', bg: '#f8f0f1', text: '#9f1239', textMuted: '#c4546e', accent: '#f43f5e', cardBg: 'rgba(0,0,0,0.03)', borderColor: 'rgba(0,0,0,0.06)', dark: false },
];

export function getTheme(id: string): PageTheme {
  return themes.find(t => t.id === id) || themes[0];
}
