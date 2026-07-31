import { lightPalette } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { radii } from './radii';
import { shadows } from './shadows';
import { zIndex } from './zIndex';
import { layout } from './layout';
import { animation } from './animation';

export const theme = {
  colors: lightPalette,
  typography,
  spacing,
  radii,
  shadows,
  zIndex,
  layout,
  animation,
  isDark: false,
};

export type Theme = typeof theme;

export * from './colors';
export * from './typography';
export * from './spacing';
export * from './radii';
export * from './shadows';
export * from './zIndex';
export * from './layout';
export * from './animation';
