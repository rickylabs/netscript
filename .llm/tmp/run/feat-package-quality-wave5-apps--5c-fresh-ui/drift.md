# Drift log — Sub-wave 5c: NetScript UI end product

## D-1 — Scope rescoped by user: plan the end product, not a quality pass (2026-06-11)

5c was queued as "package quality — fresh-ui" in the Wave 5 sequence. User rescoped:
fresh-ui is a quick-and-dirty conceptual proof; plan the intended end product per
RFC 06 + NETSCRIPT-UI-WHITEPAPER, including the composition system, an official
design system extracted from apps/playground, and a total revamp of CLI frontend
output. Multiple implementation runs/branches/package splits explicitly sanctioned.
Consequence: this run produces research + design + umbrella plan (3-run split)
instead of a single-run slice plan; MEASURE-FIRST numeric baseline deferred to each
implementation run's lock.

## D-2 — Whitepaper `@netscript/ui-primitives` package NOT created (2026-06-11)

Whitepaper mandates a separate JSR package (./primitives + ./machines). Proposed
plan D-12 keeps one package (`@netscript/fresh-ui`) with an internal layout
mirroring the split. Rationale: single consumer framework (Fresh/Preact), no second
consumer to serve, publish/gate overhead with no benefit. Also reconciles the prior
wave hard rule ("do NOT create ui-primitives") with the user's new latitude
("package splitting depending on your findings" — findings say not yet).

## D-3 — Whitepaper "L1 = Zag.js for everything" amended to platform-first (2026-06-11)

Written when Zag was the only credible engine. Since then: Popover API is Baseline,
anchor positioning is 2-of-3 engines (Firefox behind flag), `<details name>` and
native `<dialog>` are Baseline, and `@zag-js/preact` (official) exists. Plan D-2
proposes platform engines for dialog/drawer/sheet/accordion/popover/tooltip and Zag
only for machine-class components — all behind the whitepaper's own Zag-shaped
prop-getter contract, so the amendment is invisible to consumers.

## D-4 — Whitepaper literal L0 wrappers amended to L0-as-contract (2026-06-11)

~40 element-wrapper components replaced by conventions (data-part/data-state/ARIA +
token consumption, lint/review enforced) plus a small set of behavior primitives.
Prior art: Base UI 1.0 ships contract-based composition (data attributes + prop
merging), not element wrappers. Recorded in plan D-1.

## D-5 — Legacy generated app (`apps/frontend` in test-app) far behind current templates (2026-06-11)

The lived-in generated output is Fresh-default starter quality (298-byte styles.css,
fresh-gradient, indigo hand-rolled Button, 17 ad-hoc islands of 8–21KB, .taurify-*
litter) while current CLI templates already ship definePage/defer/sdk wiring with a
token subset. The complaint "ugly, barely functional, barely leveraging NetScript"
is evidence against the legacy output AND against the template-fork model that lets
scaffolds rot. Run 3 fixes the model (registry installs, D-10); legacy app is not
migrated in-place (debt entry, plan §8).

## D-6 — RFC 06 deferred token statement resolved (2026-06-11)

"CSS seed now, Style Dictionary later without changing consumer semantics" is now a
concrete two-phase design (plan D-3): DTCG 2025.10 source → SD v5 → three checked-in
generated artifacts with a drift gate; phase 1 hex parity, phase 2 OKLCH; the
`--ns-*` / `*-ns-*` / ns- class contract is the declared invariant. RFC 06 line 578
and the manifest literal `tokenSourceStrategy` should be updated when run 1 lands.

## D-7 — Anchor positioning fallback: OddBird polyfill rejected (2026-06-11)

Plan D-2 left the anchor-positioning fallback choice open (polyfill vs degrade).
PLAN-EVAL evaluated OddBird polyfill (v0.6.0, tens of KB, dynamic-content caveat
incompatible with Fresh partials) and decided: CSS `position: fixed` + `inset`
fallback for non-supporting browsers (Firefox). Polyfill not used. Recorded as
accepted debt: tooltip/popover positioning degrades to centered fixed placement
on Firefox until anchor positioning reaches Baseline.

## D-8 — Registry schema v2 amended (2026-06-11)

Original v2 schema dropped `cssVars` and `author` fields present in shadcn
registry-item.json. PLAN-EVAL diff showed these are worth adopting:
`cssVars?: { theme?, light?, dark? }` enables theme-aware items to contribute
scoped variables; `author?: string` reserves the field for future community
namespaces. Added to schema v2 (design-appendix §B.1).
