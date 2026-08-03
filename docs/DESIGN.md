---
version: alpha
name: Family List
description: A wayfinding design system for a shared grocery list that sorts itself into the order you walk a shop.
colors:
  zone-fresh: "#A3F2B5"
  zone-bake: "#FFE78F"
  zone-butcher: "#FFC3A0"
  zone-cold: "#9CD2EA"
  zone-dry: "#E9E2C8"
  on-zone: "#111111"
  paper: "#EFEFEF"
  surface: "#FFFFFF"
  surface-sunk: "#E8E8E6"
  ink: "#111111"
  ink-2: "#55565A"
  ink-3: "#8A8B90"
  edge: "#1111111A"
  edge-strong: "#11111147"
  action: "#111111"
  on-action: "#FFFFFF"
  danger: "#A32B1C"
  scrim: "#11111180"
  surface-veil: "#FFFFFFF2"
  paper-veil: "#EFEFEFF2"
  dark-zone-dry: "#CFC7AB"
  dark-paper: "#121316"
  dark-surface: "#1A1C20"
  dark-surface-sunk: "#24262B"
  dark-ink: "#F4F4F5"
  dark-ink-2: "#A7A9AE"
  dark-ink-3: "#75777D"
  dark-edge: "#FFFFFF1F"
  dark-edge-strong: "#FFFFFF52"
  dark-action: "#A3F2B5"
  dark-on-action: "#111111"
  dark-danger: "#FF9B8A"
  dark-scrim: "#00000099"
  dark-surface-veil: "#1A1C20F2"
  dark-paper-veil: "#121316F2"

typography:
  sign:
    fontFamily: Archivo
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.05
    fontVariation: "'wdth' 115"
    fontFeature: uppercase
  h1:
    fontFamily: Archivo
    fontSize: 22px
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: -0.01em
  h2:
    fontFamily: Archivo
    fontSize: 17px
    fontWeight: 700
    lineHeight: 1.25
    fontVariation: "'wdth' 115"
  body:
    fontFamily: Archivo
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.45
  sm:
    fontFamily: Archivo
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: Archivo
    fontSize: 11px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: 0.09em
  data:
    fontFamily: Azeret Mono
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.2
    fontFeature: tabular-nums

rounded:
  edge: 4px
  box: 8px
  sheet: 12px
  pill: 999px

spacing:
  hair: 2px
  tight: 4px
  snug: 8px
  base: 12px
  gutter: 16px
  section: 24px
  band: 40px

components:
  sheet:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.sheet}"
  aisle-sign:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.h2}"
    padding: "{spacing.snug} {spacing.gutter}"
  item-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    padding: "{spacing.snug} {spacing.gutter}"
    height: 44px
  rail-segment:
    rounded: "{rounded.edge}"
    height: 44px
    width: 24px
  field:
    backgroundColor: "{colors.surface-sunk}"
    textColor: "{colors.ink}"
    typography: "{typography.sm}"
    rounded: "{rounded.box}"
    padding: "{spacing.snug} {spacing.base}"
  btn-action:
    backgroundColor: "{colors.action}"
    textColor: "{colors.on-action}"
    typography: "{typography.sm}"
    rounded: "{rounded.box}"
    padding: "{spacing.snug} 14px"
  btn-quiet:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.sm}"
    rounded: "{rounded.box}"
    padding: "{spacing.snug} 14px"
  btn-bare:
    backgroundColor: transparent
    textColor: "{colors.ink-2}"
    typography: "{typography.sm}"
    rounded: "{rounded.box}"
    padding: "6px"
  checkbox:
    backgroundColor: transparent
    rounded: "{rounded.edge}"
    size: 20px
  checkbox-checked:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.edge}"
    size: 20px
  tick:
    rounded: "{rounded.pill}"
    width: 3px
  zone-chip:
    backgroundColor: "{colors.surface-sunk}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "2px {spacing.snug}"
  tab:
    backgroundColor: transparent
    textColor: "{colors.ink-3}"
    typography: "{typography.label}"
    padding: "{spacing.base} 0"
  tab-active:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    padding: "{spacing.base} 0"
  eyebrow:
    backgroundColor: transparent
    textColor: "{colors.ink-3}"
    typography: "{typography.label}"
  dialog:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.sheet}"
    padding: "{spacing.section} 20px"
  toast:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.sm}"
    rounded: "{rounded.box}"
    padding: "10px {spacing.gutter}"
---

# Family List Design System

## Overview

Family List is a shared grocery list for one household, read almost entirely on a
phone held in one hand while standing in a shop. Its single job is to say **what
to grab next, in the order you will walk past it** — the list sorts itself to a
particular store's aisle order, and several people check things off at once.

Everything here follows from that. The interface is a route, not a dashboard: one
continuous run of aisles under signs you read overhead, with quantities set like
shelf tags. Colour is wayfinding and nothing else.

It must never become a dashboard of statistics about shopping, a grid of identical
cards, or a page that needs a second look to find the next item.

## Colors

Five palette colours each own one region of the shop — `zone-fresh` for produce,
`zone-bake` for bakery and snacks, `zone-butcher` for the meat and fish counters,
`zone-cold` for dairy, frozen and drinks, `zone-dry` for pantry, household and
personal care. **A palette colour appears only where it tells you where something
lives.** That one rule is what keeps the app from decorating itself: there are no
coloured statistic cards, no pastel status badges, no gradient bars.

Everything structural is ink on paper. `ink`, `ink-2` and `ink-3` carry the whole
text hierarchy; `paper`, `surface` and `surface-sunk` carry the three depths;
`edge` and `edge-strong` draw every boundary. `action` is the single interactive
colour and inverts between themes — near-black on light, mint on dark — so a
primary button always sits at maximum contrast against its background. `danger`
is reserved for destructive actions and appears on hover only.

Translucency is tokenised rather than expressed with an opacity modifier.
`scrim` backs dialogs, `surface-veil` and `paper-veil` back the sticky header and
aisle signs so content reads as passing underneath. This is not a style
preference: an opacity modifier such as `bg-ink/50` does not survive a theme built
with `@theme inline`, because Tailwind cannot resolve the alpha of a `var()` and
silently emits the opaque colour instead. Any new translucent surface needs its
own token.

Zones hold their hue across both themes because they are signage, and signage
doesn't change colour when the lights go down. The one exception is `zone-dry`:
the original cream was too close to white to function as a mark, so it is a
deeper sand, darkened again for dark mode. State that isn't a place is expressed
without colour — an item in the cart is a filled ink box and struck-through text,
never a green one, because green already means produce.

## Typography

Archivo, carrying its width axis, is the only text face; Azeret Mono is the data
face. Archivo is a grotesque with the plain, slightly industrial cast of packaging
and wayfinding type, and its width axis is what makes the system work: hierarchy
comes from **width and size, not weight**.

The `sign` and `h2` roles widen to `wdth 115` and set in caps — these are the
hanging aisle signs, the app's loudest voice, and the tab bar borrows the same
treatment so navigating the app sounds like navigating the shop. Everything else
sits at normal width, and **nothing below the sign roles goes above weight 500**.
The previous design set almost every element to 800–900, which meant nothing could
be emphasised; the restraint here is what lets the signs read.

Azeret Mono handles quantities, counts, room codes and relative times, always with
tabular figures so numbers line up down a column and can be compared. Its slightly
mechanical figures are the shelf-tag voice against Archivo's signage.

## Layout

The list is a single continuous run, not a stack of cards: aisle sections follow
one another inside one sheet, divided by hairlines, in walking order. On phones the
sheet goes edge to edge with no radius, because insetting a list you scan wastes
the narrowest dimension you have. From 640px it becomes a bounded sheet.

Content is capped at 1024px — wide enough for the catalog's aligned data columns,
narrow enough that a list line never becomes a tiring horizontal sweep. The
in-store view narrows further to 768px. Spacing follows a 4px rhythm; rows sit at
`snug` vertical and `gutter` horizontal padding, sections at `section`.

Aisle signs stick below the header while you are in their aisle, which is the
overhead-sign metaphor doing real work: on a long list you always know which
aisle the row under your thumb belongs to. Data columns in the catalog drop out
progressively — quantity at `sm`, purchase count at `md`, last-bought at `lg` —
so a phone shows names and a desktop shows the full record.

## Elevation & Depth

Depth is carried by hairlines and three background levels, not by shadows. `paper`
is the app, `surface` is a sheet on it, `surface-sunk` is a well cut into that
sheet for inputs and picked-up rows. Every boundary is a single `edge` hairline.

Only two things genuinely float, and only those two cast a shadow: the sticky
header (`shadow-sticky`, so content passing underneath reads as underneath) and
dialogs and the toast (`shadow-float`). Everything else is flat. The previous
design put a soft shadow on every card, which flattened the hierarchy by making
each element claim the same lift.

## Shapes

Four radii, each with a job. `edge` (4px) is for small marks — checkboxes, rail
segments, ticks. `box` (8px) is the working radius for anything you press or type
into. `sheet` (12px) is for the large surfaces: sheets and dialogs. `pill` is
reserved for things that are genuinely capsule-shaped: presence monograms, zone
chips, the live dot.

**Fields and buttons share the `box` radius, and neither is a pill.** The previous
design made every input, select, badge and button `rounded-full`, so a text field
looked exactly like a button and long values curved awkwardly inside a capsule.
Radius here distinguishes classes of thing rather than decorating all of them
identically.

## Components

`.sheet` is the base surface — flat, hairline-bounded, edge-to-edge below 640px.
Aisle signs (`.sign` at `h2`) sit sticky at the top of each section with the aisle
number in mono, a zone `.tick`, the name, and `remaining/total` right-aligned.

Item rows are 44px, and carry no zone colour of their own: the sign above them
already says where they are. Each has a square `checkbox` — square, not round,
because it is a multi-select — that fills with ink when picked up and strikes the
name through. Quantity sits in a bordered stepper with the value in `data`.

Buttons come in three weights: `btn-action` for the one primary move on a screen,
`btn-quiet` for secondary actions, `btn-bare` for icon-only controls in rows.
Inputs all use `.field`. Labels use `.eyebrow`. `.zone-chip` names a zone inline
where no sign is present.

The **aisle rail** is the signature component and the only place a chart-like form
appears. One segment per aisle in walking order, each as wide as the item count
waiting there, coloured by its zone, filling from the left as items go in the cart,
with the current aisle outlined. It replaces a progress bar, a set of statistic
cards and an aisle picker at once, and it is labelled `Entrance` and `Checkout` at
its ends because it is a route. Selecting a segment jumps to that aisle.

All dialogs share one shell: labelled, `Escape` to dismiss, focus moved to the
panel on open and returned to the trigger on close, and a bottom sheet on phones.

## Do's and Don'ts

**Do**

- Use a palette colour only to say where in the shop something is. Anything else
  is ink, paper and hairlines.
- Get hierarchy from width and size. Widen to `wdth 115` and set caps for signage;
  leave everything else at normal width and weight 400–500.
- Set every number in `data` with tabular figures, and align comparable numbers in
  a column.
- Keep one `btn-action` per screen, and make its label the thing that happens:
  "Add to list", "Start walkthrough", "Clear the list".
- Let the list run edge to edge on phones, and keep rows at or under 44px so more
  of the trip is visible at once.
- Write plainly and actively, in sentence case: no exclamation marks, no emoji, and
  errors and empty states that name the next action.

**Don't**

- Don't build a row of big-number statistic cards, or a grid of identical cards
  standing in for hierarchy. The rail already carries trip state.
- Don't make fields pill-shaped, or give a field and a button the same silhouette.
- Don't use green for "done" or any palette colour for status — green is produce.
  Completion is ink fill plus a strikethrough.
- Don't add decoration that carries no information: no blurred gradient blobs, no
  glow, no zero-padded numbers, no shadow on every card.
- Don't reach past weight 500 for body text, captions or inputs.
- Don't animate anything except the check-off feedback, and let
  `prefers-reduced-motion` remove it.
