export const animation = {
  durations: {
    fast:   150,
    normal: 250,
    slow:   350,
    pulse:  1200,
    healthRing: 1000,
    levelBar: 800,
  },
  spring: {
    gentle: { damping: 20, stiffness: 180, mass: 0.8 },
    bouncy: { damping: 12, stiffness: 200, mass: 0.8 },
    stiff:  { damping: 25, stiffness: 300, mass: 1.0 },
  },
  pressScale: 0.96,
};

export type ThemeAnimation = typeof animation;
