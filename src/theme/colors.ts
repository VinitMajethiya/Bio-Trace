export const lightPalette = {
  // Brand & Bio Greens
  primary: '#059669',          // BioVerse Emerald Green
  primaryDark: '#047857',      // Deep Accent Green
  primaryLight: '#34D399',     // Highlighting Green
  primarySubtle: '#E6F4EA',    // Light Mint Card Surface / Badge Tint
  primaryBorder: 'rgba(5, 150, 105, 0.20)',

  // Module Accents
  accentBlue: '#3B82F6',       // Circular / Waste Accent
  accentBlueSubtle: '#EFF6FF',
  accentGold: '#F59E0B',       // XP & Rewards Accent
  accentGoldSubtle: '#FEF3C7',

  // Surfaces & Backgrounds
  background: '#F4F7F5',       // Primary App Clean Off-White Background
  surface: '#FFFFFF',          // Pure White Card Surface
  surfaceSecondary: '#F8FAFC', // Nested Card Surface
  surfaceBorder: '#E2E8F0',    // Card Border

  // Text Colors
  textPrimary: '#0F172A',      // Slate Headings
  textSecondary: '#64748B',    // Subtitle & Body Muted Text
  textMuted: '#94A3B8',        // Disabled Text
  textInverse: '#FFFFFF',      // Text on Dark / Green Buttons
  textSuccess: '#047857',      // Status Positive Text
  textDanger: '#EF4444',       // Status Critical Text

  // Overlay & Glassmorphism
  overlayBackdrop: 'rgba(15, 23, 42, 0.60)',
  glassBackground: 'rgba(255, 255, 255, 0.85)',
};

export type ThemeColors = typeof lightPalette;
