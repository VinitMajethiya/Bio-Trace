---
name: EcoQuest Airy
colors:
  surface: '#f4fbf3'
  surface-dim: '#d5dcd4'
  surface-bright: '#f4fbf3'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef6ed'
  surface-container: '#e9f0e7'
  surface-container-high: '#e3eae2'
  surface-container-highest: '#dde4dc'
  on-surface: '#161d18'
  on-surface-variant: '#3d4a40'
  inverse-surface: '#2b322d'
  inverse-on-surface: '#ecf3ea'
  outline: '#6d7a6f'
  outline-variant: '#bccabd'
  surface-tint: '#006d40'
  primary: '#006d40'
  on-primary: '#ffffff'
  primary-container: '#2bb673'
  on-primary-container: '#004024'
  inverse-primary: '#5cde97'
  secondary: '#97481b'
  on-secondary: '#ffffff'
  secondary-container: '#ff9967'
  on-secondary-container: '#773003'
  tertiary: '#a53845'
  on-tertiary: '#ffffff'
  tertiary-container: '#f97883'
  on-tertiary-container: '#6f0e21'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#7afbb1'
  primary-fixed-dim: '#5cde97'
  on-primary-fixed: '#002110'
  on-primary-fixed-variant: '#00522f'
  secondary-fixed: '#ffdbcc'
  secondary-fixed-dim: '#ffb693'
  on-secondary-fixed: '#351000'
  on-secondary-fixed-variant: '#793104'
  tertiary-fixed: '#ffdada'
  tertiary-fixed-dim: '#ffb3b6'
  on-tertiary-fixed: '#40000c'
  on-tertiary-fixed-variant: '#85202f'
  background: '#f4fbf3'
  on-background: '#161d18'
  surface-variant: '#dde4dc'
  mint-background: '#D9F3E9'
  forest-green: '#154212'
  emerald: '#00A86B'
  surface-white: '#FFFFFF'
  text-main: '#333333'
  text-muted: '#888888'
typography:
  display-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-padding: 24px
  gutter-md: 16px
  section-gap: 32px
  pill-padding-x: 20px
  pill-padding-y: 12px
---

## Brand & Style

This design system embodies an **Airy Optimism** style, evolving the previous tactile approach into a cleaner, more vibrant, and approachable aesthetic. The brand personality is cheerful, welcoming, and high-energy—moving away from deep forest shadows toward a world of "Sun-Drenched Serenity." 

The visual direction combines **Minimalism** with **Playful 3D accents**. It uses heavy white space, soft mint backdrops, and rounded containers to create a "toy-like" but professional interface. The emotional goal is to make environmental stewardship feel like a delightful, low-friction adventure. Layouts are uncluttered, prioritizing large, characterful 3D illustrations and high-contrast call-to-actions.

## Colors

The palette shifts from dark, heavy greens to a brighter, more luminous spectrum. 

- **Primary (Emerald/Mint):** #2BB673 is the heartbeat of the design, used for main action buttons and success states. It is supported by a soft **Mint Background** (#D9F3E9) which replaces the previous dark surfaces to create an open, airy feel.
- **Secondary (Coral Accent):** #FF9966 provides a high-contrast warm counterpart for price tags, urgent notifications, and special badges, ensuring critical info pops against the cool greens.
- **Neutral (Surface):** Pure white (#FFFFFF) is used for the "Pill" containers to create a clean distinction from the mint background.
- **Forest Green:** Retained as an accent for high-importance text or dark-mode icons to maintain brand continuity.

## Typography

The typography is **Playful & Rounded**. **Plus Jakarta Sans** remains the primary choice for headings and labels due to its soft geometric terminals. **Be Vietnam Pro** is utilized for body text to maintain high legibility within compact cards.

Hierarchy is strictly enforced:
- **Headlines:** Keep character counts low. Use "Title Case" for a friendlier, less formal tone.
- **Color Application:** Use Forest Green for titles to ensure they anchor the white cards, and Muted Grey (#888888) for supporting body copy to maintain the airy hierarchy.
- **Interactive Labels:** Use semi-bold weights for all clickable text to distinguish them from static information.

## Layout & Spacing

This design system uses a **Floating Card Grid**. Elements do not span the full width of the screen; instead, they are contained within floating white "pills" or cards with generous external margins.

- **Grid:** A 12-column fluid grid on desktop, shifting to a single-column stack on mobile.
- **Margins:** High emphasis on outer margins (24px) to let the Mint Background "frame" the content.
- **Card Spacing:** Use a 16px gutter between small cards (e.g., "Popular Now" items) and a 32px gap between major vertical sections.
- **Internal Padding:** Cards should feel spacious; never allow text to sit closer than 20px to a card edge.

## Elevation & Depth

Depth is communicated through **Soft Tonal Layering** rather than traditional shadows.

- **The Mint Base:** The lowest layer, providing a colored canvas.
- **White Pill Layers:** Main content containers are pure white. They do not use heavy shadows; instead, they use a very subtle, high-spread ambient glow `rgba(0, 0, 0, 0.03)` to barely lift them off the mint background.
- **Interactive Elements:** Buttons use a saturated gradient (Emerald to Mint) which creates a perceived "glow" and "pressable" depth without needing a physical shadow.
- **Illustration Depth:** 3D characters and icons are the primary source of depth, often "breaking the container" by overlapping card edges to create a sense of verticality.

## Shapes

The shape language is defined by the **"Hyper-Pill."** 

- **Containers:** All white cards use a 1rem to 1.5rem corner radius.
- **Buttons & Chips:** Always use a fully rounded "Pill" shape (999px radius).
- **Images:** Illustration backgrounds and thumbnails should mirror the container’s roundedness (1rem) or be encased in pill-shaped masks.
- **Small Details:** Even input fields and selection markers should avoid sharp angles, maintaining a minimum radius of 8px.

## Components

### Buttons
- **Primary Hero:** Pill-shaped, using a subtle vertical gradient from Emerald (#00A86B) to Mint (#2BB673). Text is white and centered.
- **Icon Buttons:** Circular white containers with a subtle 1px border or light ambient shadow, containing a Forest Green icon.

### Cards (The "Pill" Card)
- The core container. Pure white background with 1rem rounded corners. 
- Features a "Hero Section" for images/illustrations and a "Content Section" for text. 
- Price or status badges should float in the top-right corner of the image area, using the Secondary (Coral) color.

### Tags & Chips
- Used for categories (e.g., "Greenland", "Patagonia"). 
- Small, pill-shaped, using a semi-transparent version of the primary green with dark green text.

### Navigation
- **Bottom Bar:** A floating white pill that sits above the safe area. Active states are indicated by a simple color shift of the icon to Primary Emerald.

### Inputs & Search
- Recessed or outlined with a very thin, light-grey border. 
- Search bars should be fully pill-shaped with a magnifying glass icon on the right for a clean, modern look.