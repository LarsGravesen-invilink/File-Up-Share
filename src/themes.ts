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
  // Новые 20 тёмных тем
  { id: 'ink', name: 'Чернила', bg: '#0e0e12', text: '#d6d3e0', textMuted: '#6b6880', accent: '#9580ff', cardBg: 'rgba(149,128,255,0.05)', borderColor: 'rgba(149,128,255,0.08)', dark: true },
  { id: 'steel', name: 'Сталь', bg: '#0d1117', text: '#c9d1d9', textMuted: '#4d5969', accent: '#58a6ff', cardBg: 'rgba(88,166,255,0.04)', borderColor: 'rgba(88,166,255,0.07)', dark: true },
  { id: 'moss', name: 'Мох', bg: '#0d1510', text: '#c8d5c0', textMuted: '#526b4a', accent: '#7cb87a', cardBg: 'rgba(124,184,122,0.05)', borderColor: 'rgba(124,184,122,0.07)', dark: true },
  { id: 'coal', name: 'Уголь', bg: '#141414', text: '#e0e0e0', textMuted: '#5c5c5c', accent: '#d4a843', cardBg: 'rgba(212,168,67,0.05)', borderColor: 'rgba(212,168,67,0.07)', dark: true },
  { id: 'navy', name: 'Тёмно-синий', bg: '#080e1e', text: '#c5cee0', textMuted: '#3d5080', accent: '#4d7cfe', cardBg: 'rgba(77,124,254,0.05)', borderColor: 'rgba(77,124,254,0.08)', dark: true },
  { id: 'wine', name: 'Бургундия', bg: '#120810', text: '#e8ccd8', textMuted: '#7a4460', accent: '#c2637a', cardBg: 'rgba(194,99,122,0.05)', borderColor: 'rgba(194,99,122,0.07)', dark: true },
  { id: 'pine', name: 'Сосна', bg: '#091410', text: '#c0d8cc', textMuted: '#3d6655', accent: '#52b788', cardBg: 'rgba(82,183,136,0.05)', borderColor: 'rgba(82,183,136,0.07)', dark: true },
  { id: 'smoke', name: 'Дым', bg: '#141618', text: '#d8dde4', textMuted: '#5a6070', accent: '#a0aec0', cardBg: 'rgba(160,174,192,0.05)', borderColor: 'rgba(160,174,192,0.07)', dark: true },
  { id: 'nebula', name: 'Туманность', bg: '#0c0a18', text: '#d8d0f0', textMuted: '#6055a0', accent: '#b794f4', cardBg: 'rgba(183,148,244,0.05)', borderColor: 'rgba(183,148,244,0.08)', dark: true },
  { id: 'rust', name: 'Ржавчина', bg: '#130c08', text: '#e8d5c0', textMuted: '#7a5040', accent: '#c87941', cardBg: 'rgba(200,121,65,0.05)', borderColor: 'rgba(200,121,65,0.07)', dark: true },
  { id: 'arctic', name: 'Арктика', bg: '#091218', text: '#c8e0f0', textMuted: '#3d6880', accent: '#67c7e8', cardBg: 'rgba(103,199,232,0.04)', borderColor: 'rgba(103,199,232,0.07)', dark: true },
  { id: 'plum', name: 'Слива', bg: '#100d18', text: '#ddd0ee', textMuted: '#6a5888', accent: '#a78bfa', cardBg: 'rgba(167,139,250,0.05)', borderColor: 'rgba(167,139,250,0.07)', dark: true },
  { id: 'khaki', name: 'Хаки', bg: '#111008', text: '#ddd8c0', textMuted: '#706a3a', accent: '#c8b560', cardBg: 'rgba(200,181,96,0.05)', borderColor: 'rgba(200,181,96,0.07)', dark: true },
  { id: 'teal', name: 'Морская волна', bg: '#080e12', text: '#c0dcd8', textMuted: '#2c6060', accent: '#2dd4bf', cardBg: 'rgba(45,212,191,0.04)', borderColor: 'rgba(45,212,191,0.07)', dark: true },
  { id: 'ashen', name: 'Пепел', bg: '#111315', text: '#d0d4d8', textMuted: '#4a5260', accent: '#8899aa', cardBg: 'rgba(136,153,170,0.05)', borderColor: 'rgba(136,153,170,0.07)', dark: true },
  { id: 'espresso', name: 'Эспрессо', bg: '#0e0a08', text: '#e0d5c8', textMuted: '#6a5848', accent: '#c49a6c', cardBg: 'rgba(196,154,108,0.05)', borderColor: 'rgba(196,154,108,0.07)', dark: true },
  { id: 'indigo', name: 'Индиго', bg: '#0a0c1e', text: '#ced4f8', textMuted: '#454880', accent: '#6672f5', cardBg: 'rgba(102,114,245,0.05)', borderColor: 'rgba(102,114,245,0.08)', dark: true },
  { id: 'sage', name: 'Шалфей', bg: '#0c1210', text: '#ccd8cc', textMuted: '#485c48', accent: '#8fb89a', cardBg: 'rgba(143,184,154,0.05)', borderColor: 'rgba(143,184,154,0.07)', dark: true },
  { id: 'onyx', name: 'Оникс', bg: '#0a0a0a', text: '#c8c8c8', textMuted: '#484848', accent: '#686868', cardBg: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)', dark: true },
  { id: 'petrol', name: 'Петроль', bg: '#080f14', text: '#bfd4e0', textMuted: '#2a5068', accent: '#3891b8', cardBg: 'rgba(56,145,184,0.05)', borderColor: 'rgba(56,145,184,0.07)', dark: true },
];

export function getTheme(id: string): PageTheme {
  return themes.find(t => t.id === id) || themes[0];
}
