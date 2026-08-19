export const colors = {
  // Base — forest floor + canopy light
  background: {
    primary: '#0F1A0F', // Deep forest floor
    surface: '#1A2B1A', // Card / surface background
    elevated: '#243524', // Elevated surfaces / modals
  },

  // Primary greens — living / healthy
  green: {
    primary: '#4CAF72', // Main CTA, active states, health score (good)
    light: '#A8D5B5', // Secondary green, subtle highlights
    faint: '#2A3D2A', // Green-tinted surface background
  },

  // Amber — urgency, rare finds, warnings
  amber: {
    primary: '#E8A920', // Rare species badge, warning states
    light: '#F5D780', // Amber chip background
    faint: '#2E2510', // Amber-tinted surface background
  },

  // Earth — grounding, organic, "Circular" module identity
  earth: {
    primary: '#8B6914', // Waste / Circular module accent
    light: '#C4A45A',
    faint: '#231A08',
  },

  // Sky — air, open space, clean
  sky: {
    primary: '#3A8EC4', // Map water, clean-air indicators
    light: '#89C4E8',
  },

  // Legendary — special finds, max achievement
  legendary: {
    primary: '#9B4DCA', // Legendary rarity badge
    glow: '#C47DFF',
  },

  // Neutrals
  text: {
    primary: '#E8F0E8', // Main readable text on dark backgrounds
    secondary: '#9AB09A', // Subdued labels, captions
    muted: '#5A705A', // Placeholder text, disabled states
  },
  border: '#2A3D2A',
  divider: '#1E2E1E',

  // Semantic
  error: '#E85454',
  success: '#4CAF72',
};

export const typography = {
  headline: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 28, lineHeight: 34, color: colors.text.primary },
  title: { fontFamily: 'SpaceGrotesk-SemiBold', fontSize: 20, lineHeight: 26, color: colors.text.primary },
  subtitle: { fontFamily: 'SpaceGrotesk-Medium', fontSize: 16, lineHeight: 22, color: colors.text.secondary },
  body: { fontFamily: 'SpaceGrotesk-Regular', fontSize: 15, lineHeight: 22, color: colors.text.primary },
  caption: { fontFamily: 'SpaceGrotesk-Regular', fontSize: 12, lineHeight: 17, color: colors.text.secondary },
  dataLarge: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 48, color: colors.green.primary },
  dataMedium: { fontFamily: 'SpaceGrotesk-SemiBold', fontSize: 24, color: colors.text.primary },
};
