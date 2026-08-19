export const radii = {
  none: 0,
  sm:   12,   // inset containers
  md:   16,   // input fields, compact chips
  lg:   20,   // secondary/compact cards
  xl:   32,   // primary cards (florest-inspired), hero surfaces, sheet tops
  '2xl': 32,  // large modal/bottom sheets
  pill: 9999, // floating dock, pill buttons, filter chips, FABs

  // Explicit Rebuild Key Aliases
  card_hero:      36, // full-width hero cards (Landing hero, Overview XP card, Profile hero)
  card_primary:   32,
  card_secondary: 20,
  input:          16,
};

export type ThemeRadii = typeof radii;

