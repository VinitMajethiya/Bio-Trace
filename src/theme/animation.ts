export const animation = {
  durations: {
    fast: 150,
    normal: 250,
    slow: 350,
    pulse: 1200,
  },
  spring: {
    gentle: { damping: 20, stiffness: 180 },
    bouncy: { damping: 12, stiffness: 200 },
    stiff: { damping: 25, stiffness: 300 },
  },
};

export type ThemeAnimation = typeof animation;
