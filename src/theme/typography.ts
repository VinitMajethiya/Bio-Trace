import { TextStyle } from 'react-native';

export const typography: Record<string, TextStyle> = {
  // EcoQuest Airy Typography Scale
  display_xl:   { fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 40, lineHeight: 48, fontWeight: '800', letterSpacing: -0.8 },
  display:      { fontFamily: 'PlusJakartaSans-Bold', fontSize: 36, lineHeight: 42, fontWeight: '700', letterSpacing: -0.8 },
  headline_lg:  { fontFamily: 'PlusJakartaSans-Bold', fontSize: 24, lineHeight: 32, fontWeight: '700', letterSpacing: -0.4 },
  heading:      { fontFamily: 'PlusJakartaSans-Bold', fontSize: 26, lineHeight: 32, fontWeight: '700', letterSpacing: -0.4 },
  title_md:     { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 18, lineHeight: 24, fontWeight: '600', letterSpacing: -0.2 },
  title:        { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 18, lineHeight: 24, fontWeight: '600', letterSpacing: -0.2 },
  body_lg:      { fontFamily: 'BeVietnamPro-Regular', fontSize: 16, lineHeight: 24, fontWeight: '400', letterSpacing: 0 },
  body_md:      { fontFamily: 'BeVietnamPro-Regular', fontSize: 14, lineHeight: 20, fontWeight: '400', letterSpacing: 0 },
  body:         { fontFamily: 'BeVietnamPro-Regular', fontSize: 15, lineHeight: 22, fontWeight: '400', letterSpacing: 0 },
  label_sm:     { fontFamily: 'PlusJakartaSans-Bold', fontSize: 12, lineHeight: 16, fontWeight: '700', letterSpacing: 0.1 },
  label:        { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 13, lineHeight: 18, fontWeight: '600', letterSpacing: 0.1 },
  caption:      { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 11, lineHeight: 14, fontWeight: '600', letterSpacing: 0.4 },
  data_large:   { fontFamily: 'PlusJakartaSans-Bold', fontSize: 48, lineHeight: 56, fontWeight: '700', letterSpacing: -1.0 },
  data_medium:  { fontFamily: 'PlusJakartaSans-Bold', fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.5 },

  // Preserved Backward-Compatible Key Mappings
  displayXl:     { fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 40, lineHeight: 48, fontWeight: '800', letterSpacing: -0.8 },
  headlineLg:    { fontFamily: 'PlusJakartaSans-Bold', fontSize: 24, lineHeight: 32, fontWeight: '700', letterSpacing: -0.4 },
  titleMd:       { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 18, lineHeight: 24, fontWeight: '600', letterSpacing: -0.2 },
  bodyLg:        { fontFamily: 'BeVietnamPro-Regular', fontSize: 16, lineHeight: 24, fontWeight: '400', letterSpacing: 0 },
  bodyMd:        { fontFamily: 'BeVietnamPro-Regular', fontSize: 14, lineHeight: 20, fontWeight: '400', letterSpacing: 0 },
  labelSm:       { fontFamily: 'PlusJakartaSans-Bold', fontSize: 12, lineHeight: 16, fontWeight: '700', letterSpacing: 0.1 },
  screenHeading: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 26, lineHeight: 32, fontWeight: '700', letterSpacing: -0.4 },
  pageTitle:     { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 18, lineHeight: 24, fontWeight: '600', letterSpacing: -0.2 },
  cardTitle:     { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 18, lineHeight: 24, fontWeight: '600', letterSpacing: -0.2 },
  subtitle:      { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 13, lineHeight: 18, fontWeight: '600', letterSpacing: 0.1 },
  badge:         { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 11, lineHeight: 14, fontWeight: '600', letterSpacing: 0.4 },
  tiny:          { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 10, lineHeight: 12, fontWeight: '600', letterSpacing: 0.2 },
  dataLarge:     { fontFamily: 'PlusJakartaSans-Bold', fontSize: 48, lineHeight: 56, fontWeight: '700', letterSpacing: -1.0 },
  dataMedium:    { fontFamily: 'PlusJakartaSans-Bold', fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.5 },
};

export type ThemeTypography = typeof typography;
