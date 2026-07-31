import { TextStyle } from 'react-native';

export const typography: Record<string, TextStyle> = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: -0.5 },
  screenHeading: { fontSize: 22, lineHeight: 28, fontWeight: '800', letterSpacing: -0.3 },
  pageTitle: { fontSize: 18, lineHeight: 24, fontWeight: '700', letterSpacing: -0.2 },
  cardTitle: { fontSize: 16, lineHeight: 22, fontWeight: '700', letterSpacing: 0 },
  subtitle: { fontSize: 14, lineHeight: 20, fontWeight: '600', letterSpacing: 0 },
  body: { fontSize: 14, lineHeight: 20, fontWeight: '400', letterSpacing: 0 },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500', letterSpacing: 0.1 },
  badge: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 0.2 },
  tiny: { fontSize: 10, lineHeight: 12, fontWeight: '600', letterSpacing: 0.2 },
};

export type ThemeTypography = typeof typography;
