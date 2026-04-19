export const THEME_COLORS = {
  green: { primary: '#16a34a', light: '#22c55e', secondary: '#4ade80', accent: '#86efac' },
  orange: { primary: '#ea580c', light: '#f97316', secondary: '#fb923c', accent: '#fdba74' },
  blue: { primary: '#2563eb', light: '#3b82f6', secondary: '#60a5fa', accent: '#93c5fd' },
  purple: { primary: '#9333ea', light: '#a855f7', secondary: '#c084fc', accent: '#d8b4fe' },
  pink: { primary: '#db2777', light: '#ec4899', secondary: '#f472b6', accent: '#f9a8d4' },
};

export type ThemeColorKey = keyof typeof THEME_COLORS;
