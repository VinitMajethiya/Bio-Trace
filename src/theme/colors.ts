export const lightPalette = {
  // --- EcoQuest Airy Design System Palette (Stitch Specs) ---
  canvas_airy: '#f4fbf3',
  mint_background: '#D9F3E9',
  surface_white: '#FFFFFF',
  primary_emerald: '#00A86B',
  emerald_vivid: '#2BB673',
  forest_green: '#154212',
  coral: '#FF9966',
  coral_subtle: '#FFDBCC',
  coral_dark: '#97481B',
  outline_variant: '#BCCABD',
  text_airy_primary: '#161d18',
  text_airy_secondary: '#3d4a40',
  text_airy_muted: '#6d7a6f',

  // --- Preserved Canvas Systems ---
  canvas_dark: '#f4fbf3', // Re-directed to Airy backdrop for sun-drenched theme
  surface_dark: '#FFFFFF',
  card_light: '#FFFFFF',
  card_tint: '#E9F0E7',

  canvas_warm: '#f4fbf3',
  card_warm: '#FFFFFF',
  card_warm_soft: '#FFFDF9',

  // Green System
  green_vivid: '#2BB673',
  green_deep: '#154212',
  green_muted: '#3d4a40',
  green_glow: 'rgba(43, 182, 115, 0.15)',

  // Text Tokens
  text_on_dark_primary: '#161d18',
  text_on_dark_secondary: '#3d4a40',
  text_on_dark_muted: '#6d7a6f',

  text_on_warm_primary: '#161d18',
  text_on_warm_secondary: '#3d4a40',
  text_on_warm_muted: '#6d7a6f',

  // Semantic & Warning Palette (Caution Gold #E8A920)
  amber: '#FF9966',
  amber_subtle: '#FFDBCC',
  warning: '#E8A920',
  warningSubtle: 'rgba(232, 169, 32, 0.15)',
  legendary: '#A53845',
  legendary_subtle: '#FFDADA',
  danger: '#BA1A1A',
  danger_subtle: '#FFDAD6',

  // Leaderboard Podium Medal Ranks
  podiumGold: '#E8A920',
  podiumSilver: '#94A3B8',
  podiumBronze: '#D97706',

  // --- Preserved Backward-Compatible Palette Keys ---
  primary: '#2BB673',
  primaryDark: '#154212',
  primaryLight: '#00A86B',
  primarySubtle: 'rgba(43, 182, 115, 0.15)',
  primaryBorder: 'rgba(43, 182, 115, 0.20)',

  /** @deprecated Alias for warning / Caution Gold (#E8A920). Maintained for backward compatibility. */
  accentGold: '#E8A920',
  /** @deprecated Alias for warningSubtle. Maintained for backward compatibility. */
  accentGoldSubtle: 'rgba(232, 169, 32, 0.15)',

  accentBlue: '#3B82F6',
  accentBlueSubtle: '#EFF6FF',
  accentRed: '#BA1A1A',
  accentRedSubtle: '#FFDAD6',

  background: '#f4fbf3',
  surface: '#FFFFFF',
  surfaceSecondary: '#D9F3E9',
  surfaceBorder: '#BCCABD',

  textPrimary: '#161d18',
  textSecondary: '#3d4a40',
  textMuted: '#6d7a6f',
  textInverse: '#FFFFFF',
  textSuccess: '#2BB673',
  textDanger: '#BA1A1A',

  overlayBackdrop: 'rgba(22, 29, 24, 0.50)',
  glassBackground: 'rgba(255, 255, 255, 0.92)',
};

export type ThemeColors = typeof lightPalette;
