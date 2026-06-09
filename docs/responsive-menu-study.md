# Mobile Responsiveness, Input Modalities, and Menu Animation: A Practitioner's Study

A complete reference for transitioning a desktop CSS layout to mobile, handling mouse vs touch input correctly, building tactile
press-and-release micro-interactions, and animating a dropdown menu whose closed state is `display:none`. Every non-obvious claim is cited
inline. Browser versions and [Baseline](https://web.dev/baseline) tier (widely-available vs newly-available) are given wherever support
matters. The closing section maps each principle onto concrete findings in this Astro 6 blog.

> All browser-support figures and the open/close animation technique below were independently verified against MDN, web.dev, caniuse, and
> the MDN browser-compat-data tracker, and the Astro/Tailwind build behavior was reproduced empirically in this repository. Corrections from
> that verification pass are folded into the text (notably the precise Safari versions for entry-animation primitives, the precise Firefox
> `display`-transition behavior, and the framing of the press/release timing as a design choice rather than a literal sourced rule).

---

## Table of contents

1. [Responsive media-query strategy: desktop → mobile](#1-responsive-media-query-strategy-desktop--mobile)
2. [Mouse vs touch: hover gating and the sticky-hover bug](#2-mouse-vs-touch-hover-gating-and-the-sticky-hover-bug)
3. [Press-and-release micro-interactions](#3-press-and-release-micro-interactions)
4. [Animating a menu open and closed when the closed state is `display:none`](#4-animating-a-menu-open-and-closed-when-the-closed-state-is-displaynone)
5. [How this applies to THIS blog](#5-how-this-applies-to-this-blog)

---

## 1. Responsive media-query strategy: desktop → mobile

### 1.1 Why mobile-first (`min-width`) usually beats desktop-first (`max-width`)

The mobile-first approach authors base styles for the narrowest viewport, then _adds_ capability with `min-width` queries as space appears.
MDN describes it directly: "create a simple single-column layout for narrow-screen devices…, then check for wider screens and implement a
multiple-column layout when you know that you have enough screen width to handle it. Designing for mobile first is known as mobile first
design." ([MDN — Mobile first](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Responsive/Mobile_first))

The **why** comes down to how the cascade composes:

- **`min-width` is purely additive.** Each larger breakpoint layers enhancements on top of a working baseline, so a viewport never lands in
  an "unstyled at this width" state. Desktop-first stacks _subtractive_ overrides that must each be individually undone at every smaller
  step, compounding specificity and override debt.
- **The cheapest layout ships to the most constrained devices.** The mobile baseline is the least expensive layout to render, and desktop
  enhancements sit behind a query that constrained devices never evaluate.

`web.dev` is deliberately undogmatic about mandating mobile-first, but its content-driven breakpoint guidance (below) composes most cleanly
with `min-width`. ([web.dev — Media queries](https://web.dev/learn/design/media-queries/))

**Pragmatic caveat for an existing desktop-first codebase.** If a project already collapses its layout with `max-width` queries
(`@media (max-width: 48rem)`), that is a legitimate, internally consistent style. Rewriting every component to `min-width` is a large
mechanical change with real regression risk. The pragmatic recommendation is to **standardize the breakpoint _values and units_ first**, and
prefer `min-width` only for _new_ components — not to force a wholesale inversion.

### 1.2 Choose breakpoints from content, not from device sizes

Both primary sources are explicit. `web.dev`: "It's best to choose your breakpoints based on your content rather than popular device sizes,
as those are subject to change." ([web.dev — Media queries](https://web.dev/learn/design/media-queries/)) MDN adds that you should set a
breakpoint "at the point where the content starts to look bad" and prefer "relative units rather than absolute sizes of an individual
device." ([MDN — Mobile first](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Responsive/Mobile_first))

In practice: widen the browser from narrow to wide and add a breakpoint _only where a layout actually breaks_ — a line of text exceeds the
ideal measure, a flex row crowds, a grid no longer fits. Device-size lists (375 / 768 / 1024 …) are a fragile proxy. A layout driven by a
content measure (e.g. a `--measure-prose` token) should derive its breakpoints from that measure, not from phone-model dimensions.

### 1.3 The off-by-one overlap when mixing `max-width` and `min-width`

When you pair `(max-width: 768px)` with `(min-width: 768px)`, **both match at exactly 768px**, so two conflicting rule sets apply and source
order silently decides — a real boundary bug.

Bootstrap documents the canonical workaround and ties it to range-syntax availability: "Why subtract .02px? Browsers don't currently support
range context queries, so we work around the limitations of `min-` and `max-` prefixes and viewports with fractional widths (which can occur
under certain conditions on high-dpi devices, for instance) by using values with higher precision."
([Bootstrap — Breakpoints](https://getbootstrap.com/docs/5.0/layout/breakpoints/)) The `0.02px` figure is a deliberate margin: large enough
to survive sub-pixel rounding, small enough to stay below the smallest representable gap.

Two correct fixes, in order of preference:

1. **Don't overlap at all.** With mobile-first `min-width` queries, ranges never share a boundary value, so the off-by-one cannot arise.
   This is the strongest practical argument for `min-width` authoring.
2. **If you must bound a range** (a style that applies _only_ below a breakpoint while a different style applies at/above it), use the
   fractional offset (`1023.98px`) or exclusive range syntax (§1.5).

A `max-width: 1023.98px` reading gate paired conceptually with `min-width: 1024px` is exactly this pattern done correctly: the `.98px`
fraction prevents a sub-pixel double-match seam.

### 1.4 `rem` vs `px` in media conditions — standardize on `rem`

Standardize on **`rem`** for width breakpoints. Both sources favor relative units for text-led content. MDN recommends "relative units
rather than absolute sizes"
([MDN — Mobile first](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Responsive/Mobile_first)); `web.dev`: "If your
content is mostly text-based, it probably makes more sense to use a relative unit that's based on text size, like `em` or `ch`… pixels
remain appropriate for image-based layouts." ([web.dev — Media queries](https://web.dev/learn/design/media-queries/))

For an editorial blog whose layout is driven by a text measure, `rem` breakpoints mean the layout reflows _in step with the reader's browser
font-size preference_: a reader who sets a 24px default holds the single-column layout longer, because the reading column needs more
viewport to fit.

> **Important nuance:** inside a _media condition_, `rem` and `em` **both** resolve against the root/initial font size, not a local one — so
> `rem` is the unambiguous choice and matches a documented `--bp-*` scale. (The historical WebKit bug where `rem` in a media query ignored
> the root font-size was fixed in Safari 15 (2021); `rem` is otherwise universal in media queries — Chrome 4, Firefox 3.6, Safari 5, Edge
> 12.)

### 1.5 Range syntax (`width <= 48rem`) — adopt it, it is Baseline

Media Queries Level 4 range syntax lets you write `@media (width <= 48rem)` or `@media (30rem <= width <= 48rem)` instead of `min-`/`max-`
prefixes. Crucially, the **exclusive** operators (`<`, `>`) partition the axis with no overlap and no `.02px` hack: `@media (width < 64rem)`
and `@media (width >= 64rem)` are clean complements. MDN documents both inclusive (`<=`, `>=`) and exclusive (`<`, `>`) forms.
([MDN — Using media queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Using_media_queries);
[W3C — Range context](https://www.w3.org/TR/mediaqueries-4/#range-context))

**Support — Baseline newly-available, gated by Safari 16.4:**

| Browser       | Version           |
| ------------- | ----------------- |
| Chrome / Edge | 104               |
| Firefox       | 63                |
| Safari        | 16.4 (March 2023) |

Global support ≈ 92%. ([caniuse — range syntax](https://caniuse.com/css-media-range-syntax)) Safari 16.4 is the gating release, making this
**Baseline newly-available** (2023), not yet the "widely available" tier.

This is exactly the feature Bootstrap's `0.02px` note said "didn't exist." It is safe for a modern personal blog but remains **optional** —
prefix syntax is universally supported. The rule of thumb: **pick one style site-wide and don't mix.** If you want maximum reach with zero
fractional hacks, exclusive range syntax is the cleanest; if you prefer maximally conservative compatibility, keep prefix syntax and rely on
`min-width` authoring to avoid shared boundaries.

### 1.6 Container queries (`@container`) — when to reach for them

Container queries style a component by **its container's** size rather than the viewport, enabling true component-level responsiveness. MDN:
"the card can be reused in multiple areas of a page without needing to know specifically where it will be placed."
([MDN — Container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries)) Mechanism: set
`container-type: inline-size` (optionally `container-name`) on the parent, then query with `@container (width > 700px)`; container-relative
units are `cqi`/`cqw`/`cqb`/`cqmin`/`cqmax`. ([W3C — CSS Containment 3](https://www.w3.org/TR/css-contain-3/))

**Support — size queries are Baseline widely-available (reached that tier in 2024):**

| Browser       | Version (size queries) |
| ------------- | ---------------------- |
| Chrome / Edge | 106                    |
| Firefox       | 110                    |
| Safari        | 16.0                   |

Global ≈ 92%. ([caniuse — container queries](https://caniuse.com/css-container-queries)) **Style queries** (`@container style(...)`) shipped
later and are _not_ in the same tier — Chrome 111+, Safari 18+, Firefox 128+ — treat as newly-available and guard with `@supports` if
needed.

**Decision rule:**

- **Use `@container`** for any component that appears in multiple width contexts and must adapt to its slot — magazine/home grid cards, a
  table-of-contents box that flips `columns: 2 → 1`, sidenotes. A `@container` query keys off the box's _actual_ width and survives any
  future layout change.
- **Keep `@media`** for page-shell and device-capability concerns: the header's hamburger collapse, page gutters, and capability gating
  (`hover`, `pointer`, `prefers-reduced-motion`). MDN scopes `@media` to "adapting global page layout to screen size" and "device
  capabilities."

Container queries use **literal values in conditions** exactly like `@media` (`@container (width > 30rem)`), so the same "no
`theme()`/`var()` in a condition" constraint applies and is trivially satisfied.

### 1.7 Collapsing a horizontal nav into a hamburger — the reference pattern

A clean, accessible nav-collapse pattern has these properties:

1. **A single breakpoint**, ideally mobile-first. Pick one viewport width where the inline nav stops fitting (e.g. `48rem`). Express the
   hamburger as the base and the inline nav as the `min-width` enhancement for new work; an existing `max-width` direction is acceptable so
   long as it uses the documented rem scale value.
2. **Progressive enhancement.** Hamburger hidden by default, revealed only when a `.has-js` class is present, leaving the nav inline and
   reachable without JS.
3. **State on an attribute, toggled by JS** (`[data-nav-open]`), with `aria-expanded` kept in sync on the toggle, `aria-controls` pointing
   at the nav `id`, Escape-to-close returning focus to the toggle, plus outside-click and link-click close.
4. **44px tap targets** for menu items and the toggle (`min-block-size: 44px`), consistent with `pointer: coarse` guidance. MDN's own
   `pointer` example uses `min-height: 44px` for coarse pointers.
   ([MDN — @media/hover](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/hover))
5. **An accessibly animated reveal.** `display:none → display:flex` is instant; animate `opacity`/`transform` and, on supporting browsers,
   use `transition-behavior: allow-discrete` with `@starting-style` (§4). Gate all motion behind `prefers-reduced-motion`.

### 1.8 A concrete breakpoint SYSTEM to adopt

Given a documented `--bp-sm 30rem / --bp-md 48rem / --bp-lg 64rem` scale, the only sanctioned width literals are:

| Token                  | Value               | Meaning                                                                                                                                    |
| ---------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `30rem`                | 480px (`--bp-sm`)   | narrowest phones — single-column form/stack tweaks                                                                                         |
| `48rem`                | 768px (`--bp-md`)   | **the touch/mobile boundary** — nav hamburger, grid → 1fr, 44px tap targets                                                                |
| `64rem`                | 1024px (`--bp-lg`)  | tablet → desktop multi-column / side-rail layouts                                                                                          |
| `1023.98px` / `1024px` | off-scale by design | the one sanctioned **fractional reading-gate pair** (max-width hides gated content; min-width reveals desktop enrichments). Keep verbatim. |

**Authoring rules that keep the system self-consistent:**

- **Unit:** `rem` only for width breakpoints; `px` only for the single fractional reading-gate pair.
- **Direction:** prefer mobile-first `min-width` for new/refactored components; **never** pair `min-width: X` with `max-width: X` on the
  same value. If you genuinely need a closed range, use exclusive range syntax (`width < 64rem` / `width >= 64rem`) or the `.98px` offset —
  pick one convention site-wide.
- **Conditions hold literals only**; property values inside the block keep using `var()`/`clamp()`/`min()`.
- Reserve `@media` for shell + device capability; reach for `@container` for any component that must adapt to its slot.

**Migrate strays by content, not by device:**

- `500px → 30rem` (480px): a 20px difference within noise; verify the component still looks right at 480px and adjust the affected property
  values, not the breakpoint.
- `600px` (a TOC `columns` flip) → prefer a **container query** on the TOC's parent, since the real constraint is the box width, not the
  viewport. If kept viewport-based, snap to a documented tier — _but if it sits behind a higher gate that hides the element entirely below
  1024px, it is dead code and should simply be removed._
- `901px` → `1024px` if it gates a desktop layout, or drop it if it duplicates the reading gate. It is an arbitrary device-ish number with
  no token backing.

---

## 2. Mouse vs touch: hover gating and the sticky-hover bug

### 2.1 The interaction media features (the foundation)

Media Queries Level 4 defines four features that test the user's _input capabilities_ rather than viewport size, along two axes — hover
capability and pointer accuracy — each in a **primary-input** and an **any-input** form.
([W3C — interaction media features](https://drafts.csswg.org/mediaqueries/#hover))

| Feature       | Tests                           | Values                     | Scope               |
| ------------- | ------------------------------- | -------------------------- | ------------------- |
| `hover`       | Can the primary input hover?    | `hover` / `none`           | Primary input only  |
| `any-hover`   | Can _any_ input hover?          | `hover` / `none`           | Any available input |
| `pointer`     | Pointer accuracy                | `fine` / `coarse` / `none` | Primary input only  |
| `any-pointer` | Pointer accuracy of _any_ input | `fine` / `coarse` / `none` | Any available input |

Exact definitions (MDN, quoting the spec):

- **`hover: hover`** — "The primary input mechanism can conveniently hover over elements." **`hover: none`** — "The primary input mechanism
  cannot hover at all or cannot conveniently hover (e.g., many mobile devices emulate hovering when the user performs an inconvenient long
  tap), or there is no primary pointing input mechanism."
  ([MDN — @media/hover](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/hover))
- **`pointer: fine`** — "an accurate pointing device, such as a mouse." **`pointer: coarse`** — "a pointing device of limited accuracy, such
  as a finger on a touchscreen." **`pointer: none`** — "does not include a pointing device" (keyboard-only, TV remote).
  ([MDN — @media/pointer](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/pointer))
- **`any-hover`** / **`any-pointer`** test _any_ available input mechanism. "More than one value can match if the available devices have
  different characteristics, although `none` only matches when none of them are pointing devices."
  ([MDN — any-pointer](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/any-pointer);
  [MDN — any-hover](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/any-hover))

**The decision that matters most — primary vs any.** Use the **primary** features (`hover`, `pointer`) to decide the _default_ experience;
this is what you want for gating `:hover`. Use the **any** features only when you must know whether a capability exists _at all_ — rarely
the right tool for hover gating, because `any-hover: hover` matches on a touchscreen laptop _even while the user is currently touching_,
leaving the sticky-hover bug active for that user.

**Support — Baseline widely-available since December 2018:**

| Browser                 | Version                                   |
| ----------------------- | ----------------------------------------- |
| Chrome / Chrome Android | 41                                        |
| Edge                    | 12 (Chromium Edge 79+ trivially included) |
| Safari (macOS + iOS)    | 9                                         |
| Firefox                 | 64 (the gating release, Dec 2018)         |
| Samsung Internet        | 5                                         |

Global ≈ 96%. No IE / Opera Mini. ([caniuse — interaction media features](https://caniuse.com/css-media-interaction)) **Conclusion: ship
unconditionally in 2026.**

### 2.2 The sticky `:hover` bug and the standard fix

**The bug.** On a touchscreen, tapping an element with `:hover` styles makes the browser emulate a mouse: it fires the hover state on tap,
but because a finger never "moves away" the way a cursor does, the `:hover` style **latches and stays applied** until the user taps
elsewhere. It is most visible on buttons/links/cards/tabs that remain on the page after the tap.
([CSS-Tricks — sticky hover fix](https://css-tricks.com/solving-sticky-hover-states-with-media-hover-hover/))

**The standard fix** — gate every non-trivial `:hover` rule behind `@media (hover: hover)`. A touch device fails the query, the hover style
is never applied, and the bug disappears:

```css
/* Base (touch-safe) appearance — no hover-dependent styling here */
.nav-toggle {
  background: var(--color-bg);
}

/* Hover enhancement: only on devices whose PRIMARY input can hover */
@media (hover: hover) {
  .nav-toggle:hover {
    background: var(--color-abstract-bg);
  }
}
```

Tighten it to genuine mouse/trackpad pointers (excluding hover-capable styluses and edge cases) by adding pointer accuracy:

```css
@media (hover: hover) and (pointer: fine) {
  .site-nav > a:hover {
    color: var(--color-accent);
  }
}
```

**Use `hover` (primary), not `any-hover`** — as established in §2.1, `any-hover` does not prevent the sticky bug on hybrid devices.

**Caveat — false positives on hybrids.** The feature reflects the _primary_ input as the browser currently understands it; some
hybrid/convertible devices and some Android browsers historically mis-reported. This is a known imperfection, but the pattern remains the
industry-standard, spec-blessed approach.
([Stefan Judis — hover false-positive caveat](https://www.stefanjudis.com/today-i-learned/the-hover-media-query-can-help-to-remove-hover-styles-on-touch/))

### 2.3 `:active` on touch vs mouse, and delivering tap feedback

`:active` "represents an element … being activated by the user… With a mouse, 'activation' typically starts when the user presses down the
primary mouse button." Order link pseudo-classes **LVHA**: `:link` → `:visited` → `:hover` → `:active`.
([MDN — :active](https://developer.mozilla.org/en-US/docs/Web/CSS/:active))

**The right way to give touch users feedback is `:active`, not `:hover`** — `:active` fires during the press on both mouse and touch and
releases cleanly, so it does not latch. `web.dev` recommends distinct `:hover`, `:focus`, and `:active` background changes to make controls
feel "snappy and responsive." ([web.dev — Add touch to your site](https://web.dev/articles/add-touch-to-your-site))

```css
/* Press feedback for everyone (mouse + touch) — does NOT stick */
.nav-toggle:active {
  transform: scale(0.97);
}

/* Hover only where it's safe */
@media (hover: hover) {
  .nav-toggle:hover {
    background: var(--color-abstract-bg);
  }
}
```

**iOS Safari quirk.** On iOS, emulated mouse events fire so fast that `:active` may never visibly render. Mobile Safari only triggers
`:active` reliably when the element (or an ancestor) has a touch event handler. The classic workaround is a no-op handler such as
`<body ontouchstart>`, but binding directly on each interactive element is more robust than relying on bubbling from `<body>`
(out-of-viewport elements can miss it). This is Apple-documented behavior.
([Apple — Safari Web Content Guide](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/HandlingEvents/HandlingEvents.html))

```js
el.addEventListener('touchstart', () => {}, { passive: true });
```

### 2.4 `-webkit-tap-highlight-color` — when to suppress it

A **non-standard** property (WebKit/Blink only — Safari iOS/macOS and Chromium on Android; MDN flags it non-standard and not generally
recommended). It "sets the color of the highlight that appears over a link while it's being tapped." Initial value `black` (rendered
semi-transparent by the engine); inherited.
([MDN — -webkit-tap-highlight-color](https://developer.mozilla.org/en-US/docs/Web/CSS/-webkit-tap-highlight-color))

**Suppress it only when you provide your own visible tap feedback** (a `:active` state). Removing the native highlight without a replacement
strips essential feedback from touch users.

```css
/* Suppress the gray/blue native flash ONLY because we supply :active feedback */
.nav-toggle,
.site-nav > a,
.theme-toggle,
.lang-toggle {
  -webkit-tap-highlight-color: transparent;
}
.nav-toggle:active {
  background: var(--color-abstract-bg);
} /* the replacement */
```

`web.dev` gives the same recommendation: `-webkit-tap-highlight-color: transparent` paired with your own pseudo-class feedback.
([web.dev — Add touch to your site](https://web.dev/articles/add-touch-to-your-site)) Firefox simply ignores the property, so it is a safe
progressive enhancement.

### 2.5 `touch-action` and `user-select` for interactive controls

**`touch-action`** "sets how an element's region can be manipulated by a touchscreen user." Values: `auto`, `none`, `pan-x`, `pan-y`,
`pan-{left,right,up,down}`, `pinch-zoom`, and `manipulation`. **`manipulation`** = an alias for `pan-x pan-y pinch-zoom`: it keeps scrolling
and pinch-zoom but disables non-standard gestures (double-tap-to-zoom), which "removes the need for browsers to delay the generation of
`click` events" — killing the legacy ~300ms tap delay. **Baseline widely-available since September 2019.**
([MDN — touch-action](https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action);
[web.dev — Add touch to your site](https://web.dev/articles/add-touch-to-your-site))

For a header's hamburger and toggle controls, `touch-action: manipulation` is the correct low-risk choice. Do **not** use `none` on the
header — it would also block scrolling that starts on the element.

```css
.nav-toggle,
.theme-toggle,
.lang-toggle {
  touch-action: manipulation; /* snappy taps, no double-tap-zoom delay */
}
```

**`user-select`** "controls whether the user can select text." MDN marks its Baseline status **Limited availability** because of prefix
requirements — include `-webkit-user-select` for Safari alongside the unprefixed property. Apply `user-select: none` **only** to control
chrome (button labels, toggle glyphs) to stop the long-press text-selection flash — **never** to body/article copy, which "can be extremely
infuriating … if they want to select the text." It is a UI affordance, not a copy-protection mechanism.
([MDN — user-select](https://developer.mozilla.org/en-US/docs/Web/CSS/user-select))

```css
.nav-toggle,
.theme-toggle,
.lang-toggle {
  -webkit-user-select: none; /* Safari still needs the prefix */
  user-select: none;
}
```

### 2.6 Accessibility — do NOT hide affordances from keyboard/focus users

The single most important accessibility rule when gating hover:

> **Never put `:focus` / `:focus-visible` inside `@media (hover: hover)`, and never make an affordance appear _only_ on `:hover`.** Keyboard
> users (who report `hover: none`, `pointer: fine` or `pointer: none`) and switch/AT users must still get a visible state. If a control is
> only discoverable or operable on hover, it becomes invisible/unusable to them.

Correct layering, in source order so equal-specificity pseudo-classes resolve predictably:

```css
/* 1. Base state — fully usable by touch + keyboard, no hover required */
.site-nav > a {
  color: var(--color-fg);
}

/* 2. Focus — for ALL users, OUTSIDE the hover gate */
.site-nav > a:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* 3. Hover — enhancement, gated */
@media (hover: hover) {
  .site-nav > a:hover {
    color: var(--color-accent);
  }
}

/* 4. Press feedback — for ALL users (mouse + touch); declared AFTER the gated
      hover so the later, equal-specificity :active wins any shared-property tie
      (see §3.4 — media queries add NO specificity). */
.site-nav > a:active {
  background: var(--color-abstract-bg);
}
```

Any motion added to hover/active feedback should be wrapped for reduced motion (§3.5, §4.4).

### 2.7 Consolidated guard pattern for a set of controls

> **Source-order note (verified):** `@media` does not add specificity, so a gated `:hover` and a bare `:active` have _equal_ specificity.
> The later rule in source order wins on any **shared** property. To make press feedback robust, declare `:active` **after** the
> `@media (hover: hover)` block **or** keep the two value-identical on shared properties (see §3.4). The pattern below places `:active`
> after the hover gate.

```css
/* ── Interactive controls: nav-toggle, site-nav links, theme/lang toggles ── */
.nav-toggle,
.site-nav > a,
.theme-toggle,
.lang-toggle {
  touch-action: manipulation; /* no double-tap-zoom delay */
  -webkit-tap-highlight-color: transparent; /* suppress native flash... */
  -webkit-user-select: none; /* ...because we supply :active below */
  user-select: none;
}

/* Focus — ALL inputs, MUST stay outside any hover gate */
.nav-toggle:focus-visible,
.site-nav > a:focus-visible,
.theme-toggle:focus-visible,
.lang-toggle:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Hover — enhancement only, primary input must hover */
@media (hover: hover) {
  .nav-toggle:hover {
    background: var(--color-abstract-bg);
  }
  .site-nav > a:hover {
    color: var(--color-accent);
  }
  .theme-toggle:hover {
    color: var(--color-accent);
  }
  .lang-toggle:hover {
    color: var(--color-accent);
  }
}

/* Press feedback — ALL inputs, never sticks; AFTER the hover gate so it wins */
.nav-toggle:active,
.site-nav > a:active,
.theme-toggle:active,
.lang-toggle:active {
  background: var(--color-abstract-bg);
}

@media (prefers-reduced-motion: reduce) {
  .nav-toggle,
  .site-nav,
  .theme-toggle,
  .lang-toggle {
    transition: none;
    animation: none;
  }
}
```

**Support summary (ship freely unless noted):**

| Feature                                           | Status                                | First cross-browser |
| ------------------------------------------------- | ------------------------------------- | ------------------- |
| `hover` / `any-hover` / `pointer` / `any-pointer` | Baseline widely-available             | Dec 2018            |
| `touch-action` (incl. `manipulation`)             | Baseline widely-available             | Sep 2019            |
| `prefers-reduced-motion`                          | Baseline widely-available             | Jan 2020            |
| `user-select`                                     | Limited (ship with `-webkit-` prefix) | —                   |
| `-webkit-tap-highlight-color`                     | Non-standard, WebKit/Blink only       | —                   |

---

## 3. Press-and-release micro-interactions

### 3.1 What `:active` represents and how to order it

`:active` represents an element being activated. For a mouse, activation begins on primary-button press-down and ends on release; for
keyboard activation it applies during the press of the activation key (Enter/Space on a button); on touch it applies while the finger is
down. It applies only to the primary mouse button. This is the correct hook for press feedback.
([MDN — :active](https://developer.mozilla.org/en-US/docs/Web/CSS/:active))

The critical ordering rule (MDN): "Styles defined by the `:active` pseudo-class will be overridden by any subsequent link-related
pseudo-class (`:link`, `:hover`, or `:visited`) that has at least equal specificity." Put `:active` **after** any equal-specificity `:hover`
in source order — otherwise the press style is silently masked by the hover style. `:active` is Baseline widely-available since July 2015.

### 3.2 Transform-based feedback vs background-only: the compositing case

This is the most load-bearing technical decision, and the docs are unambiguous.

- **`transform` and `opacity` are the two properties that can be animated cheaply and offloaded to the compositor thread**, skipping layout
  and paint. `web.dev`: "restrict animations to opacity and transform to keep animations on the compositing stage of the rendering path."
  The compositor thread is separate from the main thread, so these stay smooth even when the main thread is busy.
  ([web.dev — Animations guide](https://web.dev/articles/animations-guide);
  [web.dev — Animations and performance](https://web.dev/articles/animations-and-performance)) (Promotion to a compositor layer is not
  strictly _guaranteed_ for a tiny button — web.dev says transform changes "can, in many cases, also be handled by the compositor thread" —
  but `transform` remains the correct, lowest-cost choice.
  ([MDN — Animation performance and frame rate](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Animation_performance_and_frame_rate)))
- **Anything else costs layout and/or paint.** "Avoid any property that triggers layout or paint unless it's absolutely necessary."
  web.dev's measurement showed ~50% frame loss animating `top`/`left` vs ~1% for `transform: translate()`.
  ([web.dev — Animations guide](https://web.dev/articles/animations-guide))
- **`background-color` is paint-bound, not layout-bound.** For a one-shot ~100ms press transition on a single small element, a background
  paint is cheap and visually essential here. The performance rule matters most for continuous/looping or large-surface animation; a brief
  discrete state change on one button is not a 60fps hazard.

**Recommendation:** drive the press with `transform: translateY(1px)` and/or `scale(0.97)` plus a background tint. The transform is
compositor-friendly and cannot reflow surrounding layout — directly satisfying "subtle, no layout break." **Never** animate layout-affecting
properties (`width`, `height`, `padding`, `margin`, `top`/`left`) for press feedback.

**Do not add `will-change`** for these interactions. `web.dev` warns it "should only add this to elements that are always about to change"
and "Because layer creation can cause other performance issues, we don't recommend using it early in your optimization process." A 1px press
translate does not warrant a permanent compositor layer per button.
([web.dev — Animations guide](https://web.dev/articles/animations-guide))

**Use the `transform` shorthand**, not the individual `scale`/`translate`/`rotate` properties. The shorthand is Baseline widely-available
(2015); the individual properties are only Baseline newly-available (Firefox 72, Safari 14.1, Chrome 104, interoperable Aug 2022) and offer
no perf gain, only keyframe ergonomics.
([web.dev — Individual transform properties](https://web.dev/articles/css-individual-transform-properties))

### 3.3 Durations and easing: why fast-press / slower-release feels right

MDN: linear easing "can end up looking somewhat artificial" because real objects have weight and momentum; easing makes motion "more lively
and natural." ([web.dev — Transitions](https://web.dev/learn/css/transitions)) The two relevant curves, with exact `cubic-bezier` mappings:

- `ease-out` = `cubic-bezier(0, 0, 0.58, 1)` — "starts abruptly and then progressively slows down towards the end." This is web.dev's
  explicitly recommended default for user-triggered/entering UI ("an ease-out will be the right call, and certainly a good default… quick to
  start… responsive"). ([web.dev — Choosing the right easing](https://web.dev/articles/choosing-the-right-easing))
- `ease-in` = `cubic-bezier(0.42, 0, 1, 1)` — "starts slowly, then progressively speeds up until the end, at which point it stops abruptly."

([MDN — easing-function](https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function))

**Why press fast, release slightly slower — a defensible design choice, not a literal rule.** web.dev's asymmetric-timing guidance endorses
_fast-in / slow-out_, but it frames intro/outro as an element **showing vs dismissing** (e.g. a sidebar ~100ms in / ~300ms out) and does not
specifically address button press/release feedback. Mapping press → fast and release → slightly-slower is a reasonable extrapolation, **not
a sourced mandate** — a near-symmetric or even faster release is equally defensible.
([web.dev — Asymmetric animation timing](https://web.dev/articles/asymmetric-animation-timing)) What _is_ well-supported:

- **Press (~80–100ms):** the element should appear to react instantly. Responsiveness guidance says interaction should be acknowledged
  within ~100ms (ideally ~50ms), so a 90ms press reads as immediate.
  ([MDN — How long is too long](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/How_long_is_too_long))
- **Release (~140–180ms):** a slightly longer return lets the element settle back rather than snapping. 180ms sits just below web.dev's
  stated 200–500ms ease-out window but is appropriate for a micro-interaction.

CSS implements the asymmetry by setting a **short transition on the `:active` state** (the press) and a **longer transition on the base
rule** (which governs the return when `:active` is removed). _The transition that runs is the one on the state being transitioned TO._

For a restrained design system, a single shared easing token works best — `cubic-bezier(0.2, 0, 0, 1)` is a slightly crisper
"standard/decelerate" curve than the named keyword (a design choice, not a spec keyword); pure `ease-out` is the zero-risk alternative. Keep
it to **one** shared token so motion is consistent across the hamburger and the menu items.

### 3.4 Combining `:active` with `:hover` and `:focus-visible` without conflicts

- **Specificity:** `:hover`, `:active`, and `:focus-visible` are all pseudo-classes of equal specificity (0,1,0); a class-scoped variant
  like `.site-nav > a:active` is (0,2,1). **`@media` adds no specificity** — a gated `:hover` and a bare `:active` therefore tie on
  specificity, and **source order decides**. So `:active` must come **after** the `@media (hover: hover)` block to win on shared properties.
  ([MDN — Specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity);
  [MDN — :active](https://developer.mozilla.org/en-US/docs/Web/CSS/:active)) A practical safety invariant: if a `:hover` declaration is
  placed _before_ `:active`, keep any property they share at an identical value, and let `:active`'s distinguishing properties (the
  `transform`, the press tint) be ones `:hover` never sets — then the press never loses a tie. The robust default is simply to order
  `:active` last.
- **`:focus-visible` is the correct focus hook.** It shows the focus ring only when UA heuristics say focus should be evident (keyboard
  nav), not on mouse click — so it does not fight the press feedback.
  ([MDN — :focus-visible](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible)) It is Baseline widely-available — Chrome/Edge
  86, Firefox 85, Safari 15.4 (interoperable early 2022). Keep the outline on `:focus-visible` and the transform/background on `:active` so
  they compose (one paints an outline, the other moves/tints the box).
- **Gate hover with `@media (hover: hover)`** so touch devices don't get a sticky hover background (§2.2). On touch, `:active` is what the
  user actually experiences.

### 3.5 Respecting `prefers-reduced-motion`

`prefers-reduced-motion: reduce` evaluates true when the user asked the OS to "minimize the amount of non-essential motion"; the bare
`@media (prefers-reduced-motion)` is equivalent to `: reduce`. The guidance is to **remove, reduce, OR replace** non-essential motion — not
necessarily strip all feedback. Baseline widely-available since January 2020.
([MDN — prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion);
[WCAG 2.2 — C39](https://www.w3.org/WAI/WCAG22/Techniques/css/C39))

The correct approach for press feedback: under `reduce`, drop the `transform` motion (the part that can trigger vestibular discomfort) but
**keep the instant `background-color` change** so the affordance still gives feedback — replacing motion with a non-motion cue rather than
removing feedback entirely.

### 3.6 Concrete pattern

Motion tokens (added to a `@theme` / `:root` block; these are property _values_, used outside any media condition, so they are spec-legal):

```css
/* Motion tokens (new) */
--ease-standard: cubic-bezier(0.2, 0, 0, 1); /* decelerate / "out" — settle */
--ease-out: cubic-bezier(0, 0, 0.58, 1); /* MDN ease-out keyword mapping */
--duration-fast: 90ms; /* press: react to the finger immediately */
--duration-base: 180ms; /* release / menu open-close */
--duration-slow: 240ms; /* reserved for larger transitions */
```

The shared press-and-release pattern. The base rule owns the RELEASE transition; `:active` overrides duration for the PRESS, and is declared
**after** the gated hover so it wins the equal-specificity tie. Hover is gated; reduced-motion strips the transform but keeps the tint:

```css
.nav-toggle {
  background: transparent;
  color: var(--color-muted);
  /* Release = slightly slower; runs when :active is removed. */
  transition:
    transform var(--duration-base) var(--ease-standard),
    background-color var(--duration-base) var(--ease-standard),
    color var(--duration-base) var(--ease-standard);
}

/* Keyboard focus ring — composes with press, does not conflict. */
.nav-toggle:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Hover only where hovering is convenient (not sticky on touch). */
@media (hover: hover) {
  .nav-toggle:hover {
    color: var(--color-fg);
    background: var(--color-kbd-bg);
  }
}

/* Press — AFTER :hover (equal specificity, later source wins on shared props).
   Fast press; transform is compositor-friendly, cannot reflow layout. */
.nav-toggle:active {
  background: var(--color-kbd-bg);
  color: var(--color-fg);
  transform: translateY(1px) scale(0.97);
  transition:
    transform var(--duration-fast) var(--ease-standard),
    background-color var(--duration-fast) var(--ease-standard),
    color var(--duration-fast) var(--ease-standard);
}

/* Reduced motion: replace motion with a tint-only cue (keep feedback). */
@media (prefers-reduced-motion: reduce) {
  .nav-toggle:active {
    transform: none;
  }
}
```

Apply the same tokens and the same `:focus-visible` / `:hover`(gated) / `:active`(after the gate) structure to all interactive controls.
**Exclude** the active/disabled segments of a control group (e.g. a currently-selected language pill with `cursor: default`) — they should
not get press feedback.

**Support summary:**

| Feature                                                             | Status                                            | Versions                           |
| ------------------------------------------------------------------- | ------------------------------------------------- | ---------------------------------- |
| `:active`, `transform` shorthand, easing/`cubic-bezier`/transitions | Baseline widely-available                         | since Jul 2015                     |
| `:focus-visible`                                                    | Baseline widely-available                         | Chrome/Edge 86, FF 85, Safari 15.4 |
| `prefers-reduced-motion`                                            | Baseline widely-available                         | since Jan 2020                     |
| individual `scale`/`translate`/`rotate`                             | Baseline newly-available — AVOID; use `transform` | Aug 2022                           |

---

## 4. Animating a menu open and closed when the closed state is `display:none`

### 4.1 The modern technique: transitioning to/from `display:none`

By spec, transitions are **not** triggered on an element's first style update or when `display` changes from `none` to a visible value, and
`display` is a _discrete_ (non-animatable) property. Two features unlock it:

- **`transition-behavior: allow-discrete`** lets discrete properties (`display`, `content-visibility`) participate in a transition. When
  set, the browser flips `display` at the **start** of an entry transition (`none → flex`, visible the whole time) and at the **end** of an
  exit transition (`flex → none`, visible until the fade finishes).
  ([MDN — transition-behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-behavior))
- **`@starting-style`** supplies the "before it existed in layout" values to transition _from_ on the first style update — without it the
  entry animation has no starting point and simply snaps. Place it **after** the rule it seeds, for correct cascade order.
  ([MDN — @starting-style](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style))

Canonical non-top-layer pattern (no `overlay` keyword — that is only for `dialog`/popover in the top layer):

```css
/* shown state */
.menu {
  opacity: 1;
  display: flex;
  transition:
    opacity 0.2s,
    display 0.2s allow-discrete;
}
/* hidden state */
.menu.hidden {
  opacity: 0;
  display: none;
}
/* the "from" values for the entry animation */
@starting-style {
  .menu {
    opacity: 0;
  }
}
```

**Support — `@starting-style` and `transition-behavior: allow-discrete` reached Baseline "newly available" on 2024-08-06, when Firefox
shipped them.** ([web.dev — Baseline entry animations](https://web.dev/blog/baseline-entry-animations))

| Feature                               | Chrome / Edge | Safari | Firefox |
| ------------------------------------- | ------------- | ------ | ------- |
| `@starting-style`                     | 117           | 17.5   | 129     |
| `transition-behavior: allow-discrete` | 117           | 17.5   | 129     |

These are **not yet Baseline widely-available** as of 2026 — treat as newly-available and design the fallback accordingly. The often-cited
"Chrome 121" figure is wrong for these features; they shipped in Chrome 117.
([caniuse — @starting-style](https://caniuse.com/mdn-css_at-rules_starting-style);
[caniuse — transition-behavior / display transitionable](https://caniuse.com/mdn-css_properties_display_is_transitionable))

> **Precise note on the `display`-transitionable sub-feature.** Whether `display` _itself_ is transitionable lands slightly behind the two
> primitives above: caniuse's `display_is_transitionable` shows Chrome/Edge 117 and **Safari 18.0** (vs 17.5 for the primitives). This does
> **not** affect a design whose visible effect rides on `opacity`/`transform` — the `display` axis flipping at 17.5 vs 18.0 is
> imperceptible.
>
> **CRITICAL caveat — Firefox and the `display` axis.** Firefox supports `transition-behavior`/`allow-discrete` and handles
> `content-visibility`, and it _does_ honor the entry direction's `@starting-style`, so **Firefox animates `opacity`/`transform` fully on
> open**. What Firefox does **not** do is animate the `display` axis on the **exit/close** direction — there `display` flips instantly.
> ([mdn/browser-compat-data#26155](https://github.com/mdn/browser-compat-data/issues/26155);
> [Bugzilla 1805727](https://bugzilla.mozilla.org/show_bug.cgi?id=1805727)) This is exactly why routing the _visible_ effect through
> `opacity`/`transform` (which Firefox transitions in both directions) — and never relying on `display` for the visible effect — is the
> right call: the menu fades/slides on open and snaps on the `display` axis only when closing, which is imperceptible behind the fade.

**Fallback needs no code.** Browsers that don't understand `@starting-style` ignore the at-rule; browsers that don't understand
`allow-discrete` ignore the keyword. In both cases the element appears/disappears instantly — the current behavior. `web.dev` frames this as
"a natural fallback requiring no additional code." ([web.dev — Baseline entry animations](https://web.dev/blog/baseline-entry-animations))
If byte-perfect parity in non-supporting engines ever matters, an `@supports (transition-behavior: allow-discrete)` guard would make the
fallback explicit rather than implicit — but it is not required given the ignore-unknown-rules degradation.

### 4.2 The robust always-works alternative: keep it in the DOM (`opacity` + `transform` + `visibility`)

Instead of `display:none`, keep the element rendered and toggle a class:

```css
.menu {
  opacity: 0;
  transform: translateY(-8px);
  visibility: hidden;
  transition:
    opacity 0.2s,
    transform 0.2s,
    visibility 0s linear 0.2s;
}
.menu.open {
  opacity: 1;
  transform: translateY(0);
  visibility: visible;
  transition:
    opacity 0.2s,
    transform 0.2s,
    visibility 0s;
}
```

`visibility` is the trick: it _is_ animatable as a discrete step (delayed to the end of the exit so the fade stays visible, immediate on
entry), and unlike `opacity:0` alone it removes the element from the tab order and AT. This pattern has worked in every browser for a decade
and needs no Baseline-new features.

**Why it is NOT the primary pick when the menu is already `display:none`:**

- The element stays in the **DOM and accessibility tree** unless you also manage `aria-hidden`/`inert` — you now maintain two mechanisms
  instead of one clean `display:none`.
- An absolutely-positioned hidden menu can still **intercept pointer events / cover content** unless you add `pointer-events: none`
  alongside `visibility: hidden` — easy to get subtly wrong.
- You lose the automatic "not rendered" guarantee that `display:none` gives for free. Switching from a correct `display:none` to this is a
  **regression in correctness** for a marginal robustness gain. Use it only if you must support a browser matrix older than the 2024
  Baseline set and still want a real animation everywhere.

### 4.3 Why `height`/`max-height` is janky, and better size-animation options

- **`height: 0 → auto` cannot be interpolated** — `auto` is not a computable length, so the transition snaps.
  ([Chrome — Animate to height:auto](https://developer.chrome.com/docs/css-ui/animate-to-height-auto))
- **The `max-height` hack** (`0 → 9999px`) "works" but is janky: the easing curve is computed against the fake large value, so the visible
  portion eases wrong, and the close has a delay before anything moves — the classic source of laggy accordions.

Better alternatives:

1. **`grid-template-rows: 0fr → 1fr`** on a grid wrapper with an `overflow: hidden` child — animates to the content's _natural_ height with
   correct easing, no magic numbers. Animatable grid tracks: Chrome 107+, Firefox 66+.
   ([Stefan Judis](https://www.stefanjudis.com/snippets/how-to-animate-height-with-css-grid/);
   [CSS-Tricks](https://css-tricks.com/css-grid-can-do-auto-height-transitions/))

   ```css
   .wrap {
     display: grid;
     grid-template-rows: 0fr;
     transition: grid-template-rows 0.25s;
   }
   .wrap.open {
     grid-template-rows: 1fr;
   }
   .wrap > * {
     overflow: hidden;
   }
   ```

2. **`interpolate-size: allow-keywords` + `calc-size()`** — the purpose-built modern fix; set `interpolate-size: allow-keywords` on `:root`
   to enable real `height: 0 → auto` transitions, with non-supporting browsers falling back to instant. **Chrome/Edge 129+ only; NOT in
   Safari or Firefox as of 2026.** Pure progressive enhancement.
   ([MDN — interpolate-size](https://developer.mozilla.org/en-US/docs/Web/CSS/interpolate-size);
   [MDN — calc-size()](https://developer.mozilla.org/en-US/docs/Web/CSS/calc-size))
3. **`clip-path`** (`inset(0 0 100% 0) → inset(0 0 0 0)`) reveals by clipping — GPU-friendly, no reflow — but does not change layout height,
   so it is fine only for an _overlay_ dropdown that floats over content.

**For a `position: absolute` dropdown that floats over the page, no height technique is needed at all** — there is no surrounding content to
push, so a `translateY` slide + fade reads as a height reveal without ever touching `height`.

### 4.4 `prefers-reduced-motion` handling — animation as the enhancement

Use the **opt-in (progressive) pattern**: define the no-motion state as the baseline and only add transitions inside
`@media (prefers-reduced-motion: no-preference)`. Browsers that don't support the query ignore the block and get the motion-free version —
the safe default. ([MDN — prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion);
[MDN — Media queries for accessibility](https://developer.mozilla.org/en-US/docs/Web/CSS/Media_queries/Using_media_queries_for_accessibility))

```css
.site-nav {
  /* instant, no transition by default */
}
@media (prefers-reduced-motion: no-preference) {
  .site-nav {
    transition:
      opacity 0.18s ease,
      transform 0.18s ease,
      display 0.18s allow-discrete;
  }
}
```

`prefers-reduced-motion` is a media _feature_, allowed in the condition with literal feature names only (no `var()`/`theme()`), so it
satisfies the scoped-style constraint cleanly.

### 4.5 Focus management and ARIA on open/close

A `<button>` toggling `aria-expanded` and controlling a region via `aria-controls` is the W3C APG **Disclosure Navigation** pattern. Keep
it. ([W3C APG — Disclosure Navigation](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/);
[MDN — aria-expanded](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-expanded))

What the APG specifies:

- The toggle carries `aria-expanded` (true/false) and `aria-controls`.
- **Escape closes the dropdown and returns focus to the toggle.**
- Moving focus out of the region, or an outside click, closes it.
- This is a **disclosure, not a modal `dialog`** — do **not** trap focus and do **not** add `aria-modal`. A focus trap would be wrong for a
  nav disclosure.
- The APG nav example **does not auto-move focus into the menu** on open; focus stays on the button and the user tabs/arrows in. "Do nothing
  on open" is therefore correct — only the Escape → return-focus behavior is mandatory.

**Why `display:none` is the safest closed state for focus correctness:** because the visible animation is `opacity`/`transform` and the
closed state remains `display:none`, focus order and AT exposure are governed by `display`, which flips synchronously at the _end_ of the
exit transition (and `allow-discrete` keeps the node interactive only _during_ the transition, then fully applies `display:none`) — so there
is **no window where a focused link persists inside a fully-hidden menu.** The §4.2 in-DOM alternative loses this guarantee unless you also
manage `inert`. The [`inert`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert) attribute (now in all
major browsers) disables interaction and hides from AT in one declaration, and is the right tool if you ever switch away from
`display:none`.

### 4.6 Avoiding layout shift; guaranteeing the closed menu is non-interactive

- **Non-interactive closed state:** `display:none` removes the element from rendering, tab order, pointer hit-testing, and the accessibility
  tree — the strongest possible guarantee, and free. The §4.1 approach preserves it. If you ever switch to §4.2, add `visibility: hidden` +
  `pointer-events: none` (ideally `inert`) to match.
- **No layout shift:** an absolutely-positioned menu (`top: 100%; inset-inline: 0`) floats above the page, so opening it reflows nothing. A
  `translateY` slide animates a transform — compositor-friendly, no reflow, no CLS, off the main thread for a smooth reveal. Keep the
  animation on `transform`/`opacity` exclusively; never animate `height`/`margin`/`top`.

### 4.7 Concrete reveal CSS for an absolutely-positioned dropdown

The JS needs no change — the animation reacts purely to the `[data-nav-open]` attribute the toggle already sets:

```css
.site-header.has-js .site-nav {
  /* closed state */
  display: none;
  opacity: 0;
  transform: translateY(-6px);
  position: absolute;
  top: 100%;
  inset-inline: 0;
  flex-direction: column;
  align-items: stretch;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
  z-index: 50;
}
.site-header.has-js[data-nav-open] .site-nav {
  display: flex;
  opacity: 1;
  transform: translateY(0);
}

/* Animation is an enhancement only: gated on motion preference. */
@media (prefers-reduced-motion: no-preference) {
  .site-header.has-js .site-nav {
    transition:
      opacity 180ms ease,
      transform 180ms ease,
      display 180ms allow-discrete;
  }
  /* Seed the entry animation's "from" values. Placed AFTER the rule above. */
  @starting-style {
    .site-header.has-js[data-nav-open] .site-nav {
      opacity: 0;
      transform: translateY(-6px);
    }
  }
}
```

Notes:

- All `@media` conditions use literal feature names / `48rem` only — no `var()`/`theme()` in conditions.
- Reduced-motion users and pre-Baseline browsers: `display` flips instantly, identical to today.
- Firefox (motion allowed): animates `opacity`+`transform` fully on open; on close, the `display` axis flips instantly while the fade/slide
  carries the visible effect — imperceptible.

---

## 5. How this applies to THIS blog

This is an Astro 6 bilingual blog using hand-written CSS inside Astro scoped `<style>` blocks plus `src/styles/global.css`. The audit
verified empirically (grep across the four header components + `global.css`) **zero** occurrences of `@media (hover:`, `(pointer:`,
`prefers-reduced-motion`, `-webkit-tap-highlight-color`, or `touch-action`. Every hover defect below is genuinely ungated; the motion/touch
gaps are real. The build behavior of the proposed fixes was reproduced empirically (Astro 6.4.4 + Tailwind 4.2.2): literal `rem`/`px` and
feature-query conditions compile cleanly in scoped styles, while `theme(--breakpoint-*)` in a scoped `@media` condition hard-fails the build
even when the token is defined in the global `@theme` (the `@theme` context is global-only and invisible to per-component scoped
compilation). This confirms the hard constraint and is why every condition below is a literal or a feature query.

### 5.1 The cross-cutting root cause

The codebase has **no `@media (hover: hover)` capability gating and no `:active` layer**, so every `:hover` style doubles as the only press
affordance and **sticks on touch** (§2.2). There are also **no duration/easing tokens** and **no `prefers-reduced-motion` handling**. The
clean fix is one shared pattern applied to all six touch controls — `.nav-toggle`, `.theme-toggle`, `.search-trigger`, `.site-nav > a`,
`a.segment` (LangToggle), and `.site-footer a`: (1) hover wrapped in `@media (hover: hover) and (pointer: fine)`; (2) a parallel `:active`
layer declared after the gated hover; (3) `touch-action: manipulation` + `-webkit-tap-highlight-color: transparent`; (4) a global
`prefers-reduced-motion` reset in `global.css`.

### 5.2 Sticky-hover defects (apply §2.2, §2.7)

| File + selector                                                                               | Lines               | Severity | Fix                                                                                                                                                                  |
| --------------------------------------------------------------------------------------------- | ------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/Header.astro` — `.nav-toggle:hover`                                           | 203–206             | high     | Wrap in `@media (hover: hover) and (pointer: fine)`; pair with a real `:active` after the gate                                                                       |
| `src/components/Header.astro` — `.site-nav > a:hover`                                         | 131–133             | medium   | Gate under `@media (hover: hover) and (pointer: fine)`; add `:active` background on the 44px rows                                                                    |
| `src/components/Header.astro` — `.search-trigger:hover` (desktop **and** mobile-icon variant) | 170–174 and 227–229 | high     | The mobile variant (227–229) lives _inside_ `@media (max-width: 48rem)` yet keys on `:hover` — worst case. Move that background to `:active`; gate the desktop hover |
| `src/components/ThemeToggle.astro` — `.theme-toggle:hover`                                    | 57–60               | high     | Gate behind `@media (hover: hover) and (pointer: fine)`; add `:active` feedback and a `:focus-visible` outline (currently missing — see §5.5)                        |
| `src/components/LangToggle.astro` — `a.segment:hover`                                         | 100–103             | medium   | Gate; add `a.segment:active` background. Exclude the active/disabled segment (`cursor: default`)                                                                     |
| `src/components/Footer.astro` — `.site-footer a:hover`                                        | 50–54               | low      | Gate for consistency; optional `:active` parity                                                                                                                      |

### 5.3 Missing press-and-release feedback (apply §3)

- **`.nav-toggle` has no `:active`** (`Header.astro` 189–210, high). A tap produces no visual change at contact — only the deferred
  `[data-nav-open]` swap. Add `.nav-toggle:active { background: var(--color-kbd-bg); transform: scale(0.96); }`, transform stripped under
  `prefers-reduced-motion`, declared after the gated hover so it fires on touch and wins the equal-specificity tie.
- **`.site-nav > a` rows have no `:active`** (`Header.astro` 127–133, 260–264, medium). Add
  `.site-nav > a:active { background: var(--color-kbd-bg); color: var(--color-fg); }` so each 44px row darkens on press.

### 5.4 Instant menu reveal + no reduced-motion (apply §4)

- **`.site-header.has-js .site-nav` opens via a hard `display:none ↔ display:flex` swap** (`Header.astro` 243 → 257–258, medium). The menu
  is `position: absolute; top: 100%; inset-inline: 0; z-index: 50` (lines 245–255) and floats over content, so it is the **ideal candidate**
  for the §4.7 pattern: `opacity` + `transform: translateY(-6px) → 0` plus `display … allow-discrete` + `@starting-style`, gated under
  `@media (prefers-reduced-motion: no-preference)`. The existing JS (toggle, Escape-to-close, outside-click, link-click, `aria-expanded`)
  needs **no change** — it is already an APG-compliant disclosure (§4.5).
- **No `prefers-reduced-motion` anywhere** (project-wide, medium). The existing `.search-trigger` transitions (`Header.astro` 166–169) and
  any new menu animation run unconditionally. Add a global `@media (prefers-reduced-motion: reduce)` block in `global.css` that neutralizes
  transitions/animations, **before** adding the reveal animation, so reduced-motion users get an instant toggle.

### 5.5 Focus and touch-target gaps

- **`.theme-toggle` has no `:focus-visible` outline** (`ThemeToggle.astro` 44–60, medium), unlike `.nav-toggle` (Header 207–210),
  `.search-trigger` (Header 175–178), and `a.segment` (LangToggle 104–107). Add
  `.theme-toggle:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }`.
- **No `touch-action` / `-webkit-tap-highlight-color` on any control** (medium/low). Apply the shared rule from §2.7 to all six selectors.
  For LangToggle, the 44px enlargement sets `min-block-size` only on `.lang-pill` (lines 127–129) while segments rely on
  `align-items: stretch` (line 74); verify each `a.segment` actually renders ≥44px tall, and if stretch doesn't propagate, set
  `min-block-size: 44px` on the segments under the `48rem` query.
- **No inward focus management on open** (`Header.astro` 74–98, medium) — acceptable per the APG disclosure pattern (§4.5); focus may stay
  on the toggle. The one thing to ensure: on outside-click close, if `document.activeElement` is inside the nav, restore focus to the toggle
  (mirroring the Escape path), so focus never lands on a now-hidden element.

### 5.6 Recommended breakpoint policy for this blog

Full `@media` inventory found via grep over `src/**/*.astro` + `*.css`: `30rem`, `48rem`, `500px`, `600px`, `901px`, `1023.98px`. Adopt
**exactly four sanctioned literals** (§1.8), documented together in the existing scale comment block at `global.css` lines 179–190:

- **`30rem`** (480px, `--bp-sm`) — narrowest phones. Reference implementation: `newsletter.astro` / `pt-br/newsletter.astro` (on-scale,
  consistent).
- **`48rem`** (768px, `--bp-md`) — **the touch/mobile boundary.** Already mutually coordinated across `index.astro`, `pt-br/index.astro`,
  `Header.astro:216`, `ThemeToggle.astro:73`, `LangToggle.astro:126`. Codify as THE switch for any future "is this a touch-sized screen"
  decision.
- **`1023.98px` (max) / `1024px` (min)** — the reading-gate pair ONLY (`PostLayout.astro`, `PaperLayout.astro`, `NarrowScreenNotice.astro`).
  Keep `1023.98px` verbatim; **do not** migrate to `64rem`. The `.98px` avoids a sub-pixel double-match seam.

**Fix the three orphans:**

- **`Footer.astro:39` — `@media (max-width: 500px)`** → `@media (max-width: 30rem)`. Off-scale by 20px with no rationale; controls only the
  footer's column stack. Re-verify the wrap at ~480px (it already has `flex-wrap`).
- **`global.css:505 — @media (max-width: 600px)`** (the `.paper-toc` `columns: 2 → 1` flip) — **dead code**: papers are `display:none` below
  `1023.98px` (`PaperLayout.astro`), so this never fires for a visible paper. **Remove it** (lines 505–509), or, if a single-column TOC is
  desired on the narrowest visible papers, prefer a **container query** on the TOC's parent (§1.6).
- **`Sidenote.astro:45 — @media (min-width: 901px)`** — **logically incoherent and dead**: Sidenote is paper-only, and in the 901–1023.98px
  band the whole paper is hidden. Raise to the gate complement **`@media (min-width: 1024px)`** so the Tufte margin note appears exactly
  when (and only when) the paper is visible. Use the literal `1024px` (not `64rem`) to stay byte-for-byte paired with the `1023.98px` gate.

**Authoring rules baked into policy:** conditions hold literal `rem`/`px` only (`theme()` in a scoped `@media` condition fails the
production build — empirically reproduced; `var()` in a condition is invalid syntax that never matches); use `max-width` for "simplify on
smaller" and `min-width` only for the `1024px` desktop-enrichment complement; new duration/easing tokens go in `@theme`/`:root` in
`global.css` and are referenced as `var()` in property _values_, never in conditions. The capability features `@media (hover: hover)`,
`(pointer: fine)`, `(prefers-reduced-motion: …)` are _feature_ queries with no length values, so the literal-only constraint does not
constrain them — they are safe in Astro scoped `<style>`.

---

## Consolidated source list

**Breakpoints & responsive strategy:**
[MDN — Mobile first](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Responsive/Mobile_first) ·
[MDN — Using media queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Using_media_queries) ·
[MDN — @media](https://developer.mozilla.org/en-US/docs/Web/CSS/@media) ·
[web.dev — Media queries](https://web.dev/learn/design/media-queries/) ·
[W3C — Range context](https://www.w3.org/TR/mediaqueries-4/#range-context) ·
[caniuse — range syntax](https://caniuse.com/css-media-range-syntax) ·
[Bootstrap — Breakpoints](https://getbootstrap.com/docs/5.0/layout/breakpoints/) ·
[MDN — Container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries) ·
[W3C — CSS Containment 3](https://www.w3.org/TR/css-contain-3/) · [caniuse — container queries](https://caniuse.com/css-container-queries) ·
[caniuse — rem](https://caniuse.com/rem)

**Mouse vs touch:** [MDN — @media/hover](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/hover) ·
[MDN — @media/pointer](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/pointer) ·
[MDN — any-hover](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/any-hover) ·
[MDN — any-pointer](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/any-pointer) ·
[MDN — :active](https://developer.mozilla.org/en-US/docs/Web/CSS/:active) ·
[MDN — -webkit-tap-highlight-color](https://developer.mozilla.org/en-US/docs/Web/CSS/-webkit-tap-highlight-color) ·
[MDN — touch-action](https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action) ·
[MDN — user-select](https://developer.mozilla.org/en-US/docs/Web/CSS/user-select) ·
[MDN — Specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity) ·
[W3C — interaction media features](https://drafts.csswg.org/mediaqueries/#hover) ·
[caniuse — interaction media features](https://caniuse.com/css-media-interaction) ·
[web.dev — Add touch to your site](https://web.dev/articles/add-touch-to-your-site) ·
[CSS-Tricks — sticky hover](https://css-tricks.com/solving-sticky-hover-states-with-media-hover-hover/) ·
[Stefan Judis — hover caveat](https://www.stefanjudis.com/today-i-learned/the-hover-media-query-can-help-to-remove-hover-styles-on-touch/) ·
[Apple — Safari Web Content Guide](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/HandlingEvents/HandlingEvents.html)

**Press feedback:** [MDN — :focus-visible](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible) ·
[MDN — easing-function](https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function) ·
[web.dev — Animations guide](https://web.dev/articles/animations-guide) ·
[web.dev — Animations and performance](https://web.dev/articles/animations-and-performance) ·
[MDN — Animation performance and frame rate](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Animation_performance_and_frame_rate)
· [web.dev — Transitions](https://web.dev/learn/css/transitions) ·
[web.dev — Choosing the right easing](https://web.dev/articles/choosing-the-right-easing) ·
[web.dev — Asymmetric animation timing](https://web.dev/articles/asymmetric-animation-timing) ·
[MDN — How long is too long](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/How_long_is_too_long) ·
[web.dev — Individual transform properties](https://web.dev/articles/css-individual-transform-properties)

**Menu animation & accessibility:** [MDN — transition-behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-behavior) ·
[MDN — @starting-style](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style) ·
[MDN — interpolate-size](https://developer.mozilla.org/en-US/docs/Web/CSS/interpolate-size) ·
[MDN — calc-size()](https://developer.mozilla.org/en-US/docs/Web/CSS/calc-size) ·
[MDN — prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) ·
[WCAG 2.2 — C39](https://www.w3.org/WAI/WCAG22/Techniques/css/C39) ·
[MDN — Media queries for accessibility](https://developer.mozilla.org/en-US/docs/Web/CSS/Media_queries/Using_media_queries_for_accessibility)
· [MDN — aria-expanded](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-expanded) ·
[MDN — inert](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert) ·
[web.dev — Baseline entry animations](https://web.dev/blog/baseline-entry-animations) ·
[caniuse — @starting-style](https://caniuse.com/mdn-css_at-rules_starting-style) ·
[caniuse — display is transitionable](https://caniuse.com/mdn-css_properties_display_is_transitionable) ·
[mdn/browser-compat-data#26155](https://github.com/mdn/browser-compat-data/issues/26155) ·
[Bugzilla 1805727](https://bugzilla.mozilla.org/show_bug.cgi?id=1805727) ·
[Chrome — Animate to height:auto](https://developer.chrome.com/docs/css-ui/animate-to-height-auto) ·
[W3C APG — Disclosure Navigation](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/) ·
[Stefan Judis — Animate height with grid](https://www.stefanjudis.com/snippets/how-to-animate-height-with-css-grid/) ·
[CSS-Tricks — Grid auto-height transitions](https://css-tricks.com/css-grid-can-do-auto-height-transitions/)
