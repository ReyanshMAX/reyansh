import type { TileColor } from './tiles';

export const TILE_STYLE: Record<TileColor, { bg: string; fg: string; border: string | null; btnBg: string; btnFg: string }> = {
  blue:   { bg: '#2B44FF', fg: '#FFFFFF', border: null,                btnBg: '#FFFFFF', btnFg: '#111111' },
  orange: { bg: '#FF5A36', fg: '#111111', border: null,                btnBg: '#111111', btnFg: '#FFFFFF' },
  green:  { bg: '#3DDC97', fg: '#111111', border: null,                btnBg: '#111111', btnFg: '#FFFFFF' },
  yellow: { bg: '#FFC93C', fg: '#111111', border: null,                btnBg: '#111111', btnFg: '#FFFFFF' },
  white:  { bg: '#FFFFFF', fg: '#111111', border: '2.5px solid #111111', btnBg: '#111111', btnFg: '#FFFFFF' },
  black:  { bg: '#111111', fg: '#FFF4E4', border: null,                btnBg: '#FFF4E4', btnFg: '#111111' },
};
