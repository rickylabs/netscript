# Pass V11 — Auth Sessions (session-security roster)

## Design-question answer (first)

> *What tailored components, layout, and visualization best showcase AUTH SESSIONS — active
> authenticated sessions (who / what device / from where / issued→expires TTL / scopes / status)
> that an operator inspects and can revoke — and how do they compose?*

**Answer: a session-security console, not a table.** An operator's job here is *scan who is
authenticated → judge risk (how long is this token still valid, does it hold elevated scope, is it
MFA-backed, where from) → drill into one session → revoke it.* So the whole screen is a **security
roster**: identity-forward **session cards** (avatar + device glyph + provider + geo + a live
**TTL/expiry countdown bar** + scope chips + status), fronted by a **security header composite**
whose signature element is an **expiry-horizon strip** (soonest-to-expire ordering), and drilling
into a card opens a **session detail** panel with a **TTL lifespan visualization** (elapsed-hatch vs
remaining-fill with a *now*-marker), an identity/device/geo KV block, granted scopes, and a
**session-lifecycle timeline** — with **Revoke** (per-session) and a gated **Revoke all**. On mobile
the detail is the shared **bottom sheet**.

The screen-owning idiom is **time-to-live**: nothing else in the app expresses a lifespan. Every
session carries a remaining-vs-elapsed bar and a countdown; the header orders live sessions by how
soon they die. That makes Auth visually **distinct** from every finished screen — not the live
monitoring gauges of the consoles, not the Config precedence waterfall, not the Migrations version
arc, not the DLQ error-signature clusters, not the Catalog registry rail. It reads like a
**security/session console** (identity avatars, TTL meters, scope chips, revoke) that appears nowhere
else.

## What I mined, from which reference

| Reference | What I took | How it's adapted here |
|---|---|---|
| **07-chat-signin** (identity / principal treatment) | The circular identity glyph + the provider sign-in affordance (Apple/Google) | Session cards lead with an **initials avatar** + a **device-glyph badge**; the provider becomes a tinted **`ns-authprov` chip** (oidc·workos / password / api-key). **Rejected the ref's raw green** — used NS copper (human) / teal (service) / amber, per the hard rule. |
| **19-pm-dashboard** (Mondays) | The rounded **stat-pill strip**, the **status pills** (In Progress/Pending/Completed), the avatar treatment, and the **day-strip** rhythm | Status → **`ns-badge` tones** (active=success / idle=warning / expiring=destructive / revoked=muted); the pill-strip idea became the **header composite**; the day-strip's ordered horizontal rhythm became the **expiry-horizon strip** (one row per live session, ordered by remaining). |
| **11-devconsole-a** (Kafka console: stat strip + table + right detail drawer) | The **stat strip → dense list → right-side detail DRAWER** composition and the search+filter toolbar | Two-pane **roster + detail** on desktop; the drawer becomes the **bottom sheet** on mobile; the toolbar = search + status filter chips + sort segmented. |
| **04-finance-cards** (wildcard — elapsed/segmented meters) | Segmented horizontal meters with a value marker | The **detail TTL lifespan track**: hatched elapsed + toned remaining + a **now-marker** positioned at the elapsed boundary (width-bucketed). |
| **03-analytics-cards** (wildcard — channel bar + ratio meters) | Segmented distribution channel-bar + ratio meters | Header **status-distribution channel bar** (click-to-filter) + **elevated-scope** and **MFA-coverage** ratio meters — replacing plain number cards. |

## Component prescription (built)

| # | Component | Element in reference | Adaptation |
|---|---|---|---|
| 1 | `ns-authcard` session card | 07 identity glyph + 19 status-pill row | Avatar + device-glyph badge + name + elevated flag + uid/email + provider chip + geo + MFA + status badge + TTL bar + scope-chip footer + revoke; left status rail |
| 2 | `ns-ttlbar` live TTL bar | 04 segmented meter | Per-card remaining-fill, tone by urgency; **hatched** when expiring (≤12%); width-bucket geometry |
| 3 | `ns-authttl` lifespan viz | 04 elapsed/marker meter | Detail: hatched **elapsed** vs toned **remaining** + a **now-marker** at the elapsed boundary + issued/TTL/expiry labels |
| 4 | `ns-authhead` header composite | 19 stat-strip + 03 channel-bar/meters | glyph+count hero + status channel bar + legend + elevated-scope meter + MFA-coverage meter + expiry-horizon strip |
| 5 | `ns-authhz` expiry-horizon strip | 19 day-strip rhythm | Live sessions ordered soonest→latest; per-row track + countdown; click selects; the **signature** header viz |
| 6 | `ns-authchan` status channel bar | 03 segmented channel bar | active/expiring/idle/revoked segments, click-to-filter, tone-colored |
| 7 | `ns-authratio` ratio meter | 03 ratio meter | Elevated-scope % and MFA-coverage % gradient fills (amber→destructive / teal) |
| 8 | `ns-authbar` roster toolbar | 11 search + filters | search + status filter chips (`ns-authbar__chip`) + sort segmented (soonest expiry / by status) |
| 9 | `ns-authdetail` detail panel | 11 right drawer | identity header + TTL viz + KV block + scopes + lifecycle timeline + revoke; sticky |
| 10 | `ns-authtl` lifecycle timeline | 11 detail history (+ DLQ step-timeline idiom) | tone-dotted compact steps: issued → refresh/idle → revoked |
| 11 | `ns-scopechip` scope chips | (new — RBAC idiom) | elevated (admin/deploy/write) tinted copper vs muted read |
| 12 | `sheetIsS15` bottom sheet | 11 drawer → 06 mobile sheet | Reuses shared `#ns-sheet-dialog`: full identity + TTL + KV + scopes + timeline + revoke on mobile |
| 13 | `ns-auth__now` + `Revoke all` | 11 "Connected" env pill + toolbar action | live server-clock chip (pulsing dot) + gated destructive **Revoke all N** |

## Layout & composition

Desktop 1440: `header (title + lede + now-clock + Revoke all)` → **`ns-authhead`** composite (hero
count + status channel bar + elevated meter + MFA meter + expiry-horizon strip) → **`ns-authbar`**
toolbar (search + filter chips + sort segmented) → **`ns-authgrid`** two-pane: **roster**
(`ns-authcard` list, sorted soonest-expiry or by-status) + **detail** (`ns-authdetail`: identity
header → TTL lifespan viz → KV → scopes → lifecycle timeline → revoke) → **`ns-authstream`**
two-column auth.* event feed.

Responsive: ≤1180 the header composite goes 2-col; ≤900 the grid collapses to the roster only and
the detail pane hides — tapping a card opens the shared **bottom sheet** (`sheetIsS15`) with the full
identity/TTL/KV/scopes/timeline/revoke; ≤640 the header stacks single-column, cards reflow (avatar +
identity top, then a full-width status+TTL+countdown row, then scopes + revoke), the toolbar wraps,
the stream goes single-column. No horizontal body scroll at any width.

## Distinctness from finished screens

- **Not a monitoring console** (Workers/Sagas/Triggers/Streams): no live runtime gauges, no
  status-stream monitoring. This is an identity/session **security** view.
- **Not** the Config precedence waterfall, the Migrations version-arc timeline, the DLQ
  error-signature clusters, or the Catalog registry rail. The idioms unique to Auth — an
  **identity avatar + device glyph**, a **per-row live TTL countdown bar**, a **soonest-to-expire
  horizon strip**, a **lifespan elapsed/now/remaining track**, **scope chips**, and a **revoke**
  flow — appear on no other screen.
- Header micro-viz (status channel bar + elevated/MFA ratio meters + expiry-horizon) replaces the
  old plain table caption; per density doctrine, zero plain number-card rows.

## Density notes (per ROLLOUT-DOCTRINE density defaults)

- **No plain number-card stat row** — the header is a composite: glyph+count hero + channel bar +
  two ratio meters + a per-session horizon strip.
- **Compact cards** (~110px incl. footer): each earns height with avatar + device + provider + geo +
  MFA + status + TTL bar + countdown + scope chips + revoke — no padded 3-line boxes.
- **Dense KV + timeline**: mono, alternating-tint KV rows; a compact tone-dotted lifecycle timeline,
  not airy bullets.
- **No ghost rows**: the empty/no-match state is a single centered affordance with a Clear-filters
  action, not a big dashed box; revoked sessions dim + carry a slim revoked-note, not an empty gap.

## Data model (visual metadata only — fully derived, no route/logic/copy-meaning change)

`s15Raw` enriches the session projection with **derived visual fields**: `dev`/`agent` (device +
user-agent), `ip`/`loc`/`geo`, `issued`/`expires`/`ttlFrac`/`lifespan` (→ TTL bars + lifespan viz),
`scopes` + `elevated` (→ scope chips + elevated meter), `mfa`, `corr`. The original three sessions
(usr_31 / usr_18 / usr_07) are preserved in meaning (same ids, provider, state, started time, last
event text) and enriched; two more sessions (usr_44 idle, svc_52 service/expiring) are added so the
roster is **dense** and exercises every status (active / idle / expiring / revoked / service) — the
prototype data was already illustrative. Derived aggregates: `s15Head` (active/live counts, status
distribution, elevated %, MFA %, expiry horizon), `s15Detail` (selected session KV + lifecycle
timeline). Geometry uses `--w0..--w20` width-bucket classes (5% steps) — **no SVG `{{ }}` holes**.
New state: `s15Sel`/`s15Filter`/`s15Sort`/`s15Q`. `sheetIsS15` reuses the shared `#ns-sheet-dialog`
(right drawer desktop / bottom sheet mobile via `matchMedia(640px)`). Revoke + Revoke-all reuse the
shared `askConfirm` → `#ns-confirm-dialog` flow with the correct `netscript auth sessions revoke`
CLI. The `authFeed` (auth.* event stream) is preserved verbatim.

> **`sc-if` has no `negate`** (the engine's `walkIf` only checks `value` truthiness). Empty-state and
> revoked-note branches are gated on inverted bindings (`s15NoResults`, `s15Detail.cannotRevoke`)
> instead — verified rendering both branches correctly.

## Verification

0 `{{ }}` holes / 0 real console errors (only the benign favicon 404) / 0 horizontal overflow across:
desktop 1440 (light+dark), mobile 390 (light+dark), plus interaction states — session selected
(Analytics Sync expiring @3%, Maya active/elevated @50% — **now-marker verified at the correct
elapsed boundary** across life stages), **revoke confirm** (light+dark, correct `sess_52 → revoked` +
CLI), **mobile revoke-all confirm**, the **mobile bottom sheet** (light+dark), the **Revoked filter**,
and the **empty/no-match** state. **Full 16-route regression clean** (every nav item: 0 holes, 0
overflow, 0 errors — no other screen changed). Edits limited to the S15 Auth markup, the S15
state/derivation/bindings, the `sheetIsS15` sheet body + `sheetTitle` case, and appended `ns-ext.css`
— no edits to `support.js`, `proto.css`, `_ds/*`, or any other screen's markup.

## Self-assessment

- **Bespoke:** 9/10 — the session-security idiom (identity avatars + live TTL countdown bars +
  soonest-to-expire horizon + lifespan track + scope chips + revoke) is unlike any finished screen;
  only the auth.* event stream reuses the generic `ns-activity-feed` (intentionally — it is the
  secondary strip and its copy is preserved verbatim).
- **Density:** 8.5/10 — composite header micro-viz, compact multi-metadata cards, dense KV + timeline,
  no ghost rows, click-to-filter distribution. The detail panel keeps a little intentional breathing
  room around the lifespan viz and the revoke CTA.

## Honest gaps / declined

- The **auth event stream** stays a standard (two-column) `ns-activity-feed`. It is a real,
  copy-locked data strip; giving it a bespoke treatment risked changing its meaning, so I kept it and
  spent the bespoke budget on the roster + TTL viz.
- Session **avatars are initials**, not photos (the projection has no avatar URLs; inventing image
  assets would exceed "visual metadata only"). The device glyph + kind-tone carry identity instead.
- **TTL is a static snapshot** at the app clock (14:02:11) — the bars express elapsed/remaining but
  do not tick live (the prototype has no animation loop for it; a `requestAnimationFrame` countdown
  is a candidate future enhancement).
- Device / geo / IP / scope values are **illustrative visual metadata** consistent with each
  session's provider and kind; they are not read from a real auth backend (static prototype).
- "Open in Aspire" on the detail is a placeholder affordance (no canonical Aspire session resource to
  deep-link to today).
