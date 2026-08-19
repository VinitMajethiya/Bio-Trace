# CHANGE-05-DASHBOARD.md — Health Score Dashboard (Spec from Reference Design)

## Reference design

The reference dashboard (`Dashboard.html`) has been fully analysed. The React Native implementation must faithfully reproduce every section and interactive behaviour from that file, translated into the EcoQuest dark theme (from CHANGE-07-THEME.md). Every section below maps 1:1 to a section in the HTML.

---

## Required packages (all Expo Go-compatible)

```bash
npx expo install react-native-svg          # gauge ring + trend chart
npx expo install @react-native-community/segmented-control  # period toggle
# react-native-reanimated is already installed
```

---

## Screen structure (top to bottom, matches HTML order)

```
<ScrollView>
  <TopBar />               # area selector + period toggle
  <HeroBanner />           # gauge ring + key stats
  <FactorGrid />           # 6 expandable factor cards
  <DuoRow />               # trend chart (left) + comparison bars (right)
  <InsightsGrid />         # positives (left) + negatives (right)
  <TablesSection />        # society table + institutions table
  <Footer />
</ScrollView>
```

---

## Section 1 — TopBar

### Area Selector (dropdown)

Renders as a pressable chip that opens a `Modal` (bottom sheet style) listing societies:

```
📍 Kothrud, Pune  ▾
```

On press → Modal with a `FlatList` of societies, each row showing:
- Society name
- Health score badge (color-coded by band: green/amber/red)

Active society has a green-tinted background row. Selecting a society closes the modal and re-renders the whole screen with new data.

### Period Toggle

```
[ This Month ]  [ This Quarter ★ ]
```

Custom two-button toggle using `TouchableOpacity`. Active button: `colors.green.primary` background + white text. Inactive: transparent + `colors.text.secondary`. Identical behaviour to the HTML's `.period-toggle`.

---

## Section 2 — Hero Banner

### Layout
Two-column on tablet, **single column on phone** (gauge on top, stats below — mirrors the HTML's `@media (max-width:880px)` breakpoint).

### Gauge Ring

Built with `react-native-svg`. Exact reproduction of the HTML gauge:

```tsx
// components/dashboard/GaugeRing.tsx
import Svg, { Circle } from "react-native-svg";
import Animated, { useSharedValue, withTiming } from "react-native-reanimated";

const RADIUS = 84;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SIZE = 220;

export function GaugeRing({ score }: { score: number }) {
  const offset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;
  // Animate stroke-dashoffset from CIRCUMFERENCE → offset on mount
  // Use withTiming(offset, { duration: 1000, easing: Easing.out(Easing.cubic) })

  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" }}>
      <Svg width={SIZE} height={SIZE} style={{ transform: [{ rotate: "-90deg" }] }}>
        {/* Background track */}
        <Circle cx={SIZE/2} cy={SIZE/2} r={RADIUS} fill="none"
          stroke={colors.green.faint} strokeWidth={18} />
        {/* Animated fill arc */}
        <Circle cx={SIZE/2} cy={SIZE/2} r={RADIUS} fill="none"
          stroke={factorColor(score)} strokeWidth={18}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={animatedOffset}   {/* animated value */}
          strokeLinecap="round" />
      </Svg>
      {/* Center overlay — positioned absolute */}
      <View style={styles.gaugeCenter}>
        {/* Animated count-up number — use animateNumber util */}
        <Text style={[typography.dataLarge, { fontSize: 56 }]}>{displayScore}</Text>
        <Text style={typography.caption}>/ 100</Text>
        <BandBadge band={band} />
      </View>
    </View>
  );
}
```

### Band badge (inside gauge center)

```
Excellent  →  bg: colors.green.primary,    text: white
Good       →  bg: colors.green.light,      text: colors.green.dark
Fair       →  bg: colors.amber.primary,    text: white
Needs Att. →  bg: colors.earth.primary,    text: white
Critical   →  bg: colors.error,            text: white
```

### Hero stats row (4 chips)

```
┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────┐
│  +6 pts  │  │ #3 of 18 │  │  1,420    │  │   62t    │
│ vs last  │  │ Pune rank│  │  species  │  │  CO₂e   │
└──────────┘  └──────────┘  └───────────┘  └──────────┘
```

- All four chips use `colors.background.surface` background + `colors.border` border
- Delta chip: positive delta → number in `colors.green.primary`; negative → `colors.error`
- Use `ScrollView horizontal` if chips overflow on small phones

---

## Section 3 — Factor Grid (6 cards, expandable)

This is the most important section. **Reproduce it exactly.**

### 6 factors (from HTML data)

| Key | Name | Weight | Icon family | Icon name |
|---|---|---|---|---|
| `biodiversity` | AI Biodiversity Index | 20% | MaterialCommunityIcons | `leaf` |
| `diversion` | Waste Diversion Rate | 20% | MaterialCommunityIcons | `recycle` |
| `carbon` | Carbon Impact (CO₂e) | 20% | MaterialCommunityIcons | `molecule-co2` |
| `ewaste` | E-Waste Safe Diversion | 15% | MaterialCommunityIcons | `chip` |
| `institutional` | Institutional Compliance | 15% | MaterialCommunityIcons | `office-building` |
| `participation` | Clan & Community | 10% | MaterialCommunityIcons | `account-group` |

### Card layout

```
┌─────────────────────────────────┐
│ [icon]          [20% weight]    │
│                                 │
│ AI Biodiversity Index           │
│ 72 /100                   +4 ▲  │
│ ████████░░░░  progress bar      │
│                                 │
│ ▼ (tap to expand)               │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│ Detail text here...             │
│ Sub-metric A         value A    │
│ Sub-metric B         value B    │
└─────────────────────────────────┘
```

- **Grid layout**: 2 columns (not 3 — phones are narrow). Use `FlatList` with `numColumns={2}` or two-column `flexWrap` View.
- **Expand/collapse**: use `react-native-reanimated` `useAnimatedStyle` + `withTiming` to animate `maxHeight` from 0 → auto when a card is tapped. Only one card open at a time (same as HTML `openFactor` state).
- **Icon background colors** match the HTML:
  - biodiversity, diversion, carbon, participation → `colors.green.faint` bg, `colors.green.primary` icon
  - ewaste → `colors.amber.faint` bg, `colors.amber.primary` icon
  - institutional → `rgba(200,82,59,0.15)` bg, `colors.error` icon
- **Weight badge**: small pill, `colors.amber.faint` bg, `colors.amber.light` text
- **Progress bar**: `colors.background.elevated` track, fill color = `factorColor(score)` (same logic as HTML)
- **Delta**: green if positive, red if negative, `colors.text.secondary` if zero

### `factorColor(score)` function

```ts
export function factorColor(score: number): string {
  if (score >= 75) return colors.green.primary;
  if (score >= 55) return colors.amber.primary;
  return colors.error;
}
```

---

## Section 4 — Duo Row: Trend Chart + Comparison

On phone: **stacked vertically** (chart on top, comparison below).

### Trend Chart (SVG line chart)

Built with `react-native-svg`. Reproduces the HTML's `renderTrend()` function:

```tsx
// components/dashboard/TrendChart.tsx
// - 6 months of data points
// - Gradient fill area under the line (LinearGradient from react-native-svg)
//   top stop: colors.green.primary at 40% opacity
//   bottom stop: colors.green.primary at 0%
// - Line: colors.green.primary, strokeWidth 3, rounded caps
// - Dots: white fill, colors.border stroke — on press show a tooltip
// - X-axis labels: month names, colors.text.secondary
// - Dashed baseline: horizontal line at y=bottom, colors.border dashed
// - Tooltip on dot press: small dark card showing "Jul · 78 pts"
//   use state to track which dot is pressed, position card accordingly
```

Chart dimensions: full card width (use `onLayout` to measure), height 180.

### Comparison Panel

Three horizontal bar rows:
```
[Society name]        78  ████████░░
[Pune city average]   71  ███████░░░
[Baner-Balewadi best] 90  █████████░
```

Each bar: `colors.background.elevated` track, fill = row-specific color:
- Society: `colors.green.primary`
- City average: `colors.amber.primary`
- Best: `colors.green.light`

Animate bar widths on mount with `withTiming`.

---

## Section 5 — Insights Grid

Two columns (stacked on phone): **What's working** (green) + **What needs attention** (red/amber).

Each insight item:
```
┌─────────────────────────────────┐
│ [✓]  Diversion rate held        │
│      flat rather than declining │
└─────────────────────────────────┘
```
- Green items: checkmark icon, `colors.green.faint` icon bg
- Red items: flag icon, `rgba(200,82,59,0.15)` icon bg
- Card: `colors.background.surface` bg, `colors.border` border, `border-radius: 14`

Section titles use `typography.title` with a colored dot prefix:
- "What's Working 🌱" — green dot
- "Needs Attention ⚠️" — amber dot

---

## Section 6 — Tables

Two tables, stacked vertically on phone.

### Table 1: Society / RWA Participation

Columns: Society Name | Participation % (with mini bar) | Kg Diverted

```
Magarpatta CHS     68%  ██████░░   810 kg
Amanora Greens     55%  █████░░░   650 kg
```

Data source: `societies` table joined with `pickup_requests` — aggregate by `society_id`.

### Table 2: Institutional Compliance

Columns: Institution Name | Status pill

Status pills:
- Onboarded: `colors.green.faint` bg, `colors.green.light` text
- Pending: `colors.amber.faint` bg, `colors.amber.primary` text
- Not started: `rgba(200,82,59,0.15)` bg, `colors.error` text

---

## Section 7 — Footer

Simple two-line text at bottom:
```
Score methodology: Weighted composite of 6 factors. 
Data refreshes every 24h. Last updated: [timestamp].
```

Use `typography.caption` + `colors.text.muted`.

---

## Data layer

### Supabase view / Edge Function

Do NOT make 6+ separate queries from the dashboard screen. Create a single Supabase Edge Function `get-dashboard-data` that accepts `{ society_id, period: "monthly" | "quarterly" }` and returns the full data shape the screen needs:

```ts
type DashboardData = {
  score: number;
  delta: number;
  rank: string;
  species: number;
  co2_tonnes: number;
  band: "excellent" | "good" | "fair" | "needs_attention" | "critical";
  factors: FactorData[];
  trend: number[];           // 6 data points
  cityAvg: number;
  best: { label: string; score: number };
  insights: { positives: string[]; negatives: string[] };
  societies: RWARow[];
  institutions: InstitutionRow[];
};
```

This keeps the screen thin (one fetch, no waterfalls) and makes the Edge Function the single place to update when the scoring formula changes.

### Real-time score updates

Subscribe to `territories` table changes on the dashboard screen — when `health_score` updates (from a new pickup or species sighting), re-fetch the dashboard data. Debounce re-fetches to max once per 30 seconds to avoid hammering the Edge Function during a demo with rapid events.

---

## Theme mapping (HTML → EcoQuest dark)

| HTML token | EcoQuest token |
|---|---|
| `--bg-canvas: #F8F6F0` | `colors.background.primary` |
| `--card-bg: #FFFFFF` | `colors.background.surface` |
| `--bv-green: #3B7A49` | `colors.green.primary` |
| `--bv-green-dark: #224A2B` | `colors.text.primary` (on green bg) |
| `--bv-light-green: #E2F0DD` | `colors.green.faint` |
| `--bv-highlight: #88C070` | `colors.green.light` |
| `--bv-amber: #D9822B` | `colors.amber.primary` |
| `--bv-danger: #C8523B` | `colors.error` |
| `--bv-border: #2D3A2F` | `colors.border` |
| `--sketch-shadow: 3px 4px 0px rgba(45,58,47,0.15)` | `elevation: 4` + `shadowColor: colors.border` |
| Caveat font (handwritten) | Space Grotesk Bold |
| `--ink-main: #1C241B` | `colors.text.primary` |
| `--ink-muted: #525E54` | `colors.text.secondary` |

> The sketch/hand-drawn border style (thick `#2D3A2F` border + offset shadow) is a signature of the reference design. **Preserve it** — use `borderWidth: 2`, `borderColor: colors.border`, and a matching `shadowOffset` on all cards. This is what makes the dashboard feel different from generic mobile UIs.

---

## Testing checklist

- [ ] Gauge ring animates from 0 → score on mount (1s eased)
- [ ] Score count-up number animates in sync with gauge
- [ ] Band badge color changes correctly across all 5 bands
- [ ] All 6 factor cards render with correct icon, weight, score, delta
- [ ] Tapping a factor card expands it (animated); tapping again collapses
- [ ] Only one factor card is open at a time
- [ ] Progress bars animate on mount
- [ ] Trend chart renders with gradient fill and interactive dot tooltips
- [ ] Comparison bars animate on mount
- [ ] Period toggle switches Monthly ↔ Quarterly data correctly
- [ ] Area selector opens a modal with all societies, selection re-renders screen
- [ ] Tables render with correct status pill colors
- [ ] Single Edge Function call fetches all data (check Network tab — should be 1 request)
- [ ] Real-time subscription re-fetches when health_score changes
