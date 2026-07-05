# 01 — Ratified Decisions & Locked Context

Everything here is **owner-ratified and fixed** unless listed under §Delegated. Do not re-litigate.

## Milestone train (revised, owner-ratified 2026-07-04)

| Milestone | Lands | Notes |
|-----------|-------|-------|
| **beta.5** | existing dogfood bar (R3) + telemetry-revamp work *begins* | unchanged baseline |
| **beta.6** | **Dev-dashboard PLUGIN** + telemetry landed enough to power it | telemetry convention + query/export gate here |
| **beta.7** | **Docs release cut** — C complete tutorial rewrites + D per-feature positioning | its own cut, not a beta.1 gate |
| **beta.8 / stable** | E desktop + single-process + offline-first, **shipped fully** | low priority; but no half-ship |
| **stable** | telemetry AI-adapter + rich views; dashboard depth; bench fast-follow (R1); deploy e2e (R4) | leadership bar |

## The five owner decisions (2026-07-04)

- **D1 — Spine-1 = TWO epics.** `telemetry-revamp` (enabler) + `dev-dashboard` (headline).
  Dashboard work **starts in parallel now** on Aspire-sourced data; converges on telemetry's
  query/export surface as it lands.
- **D2 — Dashboard = a PLUGIN, ships beta.6.** Installable official NetScript plugin
  (`plugin add dashboard`) that dogfoods the plugin system. **Not** a core package.
- **D3 — Docs = a dedicated release cut at beta.7.** C+D bundle into their own docs release.
  Tutorials (C) are **COMPLETE ground-up rewrites** — the current ones "don't tell a story, don't
  cover a real project use case." Rewrite around a concrete real project (eis-chat).
- **D4 — Desktop/single-process (E) = beta.8 or stable, low priority, ships FULLY.** Do **not**
  split single-process-early / desktop-later. Bundle single-process + desktop + offline-first as ONE
  complete tier. "When it ships it ships FULLY."

## Prior ratifications folded into PR #392 (still binding)

- **R1 — Bench leadership = post-stable fast-follow, NOT a hard cut gate.** The stable cut must not
  block on bench-leadership numbers (#302, moved to Backlog/Triage); self-bench continues per
  release; the leadership claim publishes after the cut.
- **R4 — Stable "verified production deployment path" gate = bare-metal (`systemd` + `deno
  compile`), NOT Deno Deploy.** Deploy e2e (#394) is **bare-metal-first**; Deno Deploy is a
  supported but non-gating tier.
- Full set (R1–R4) recorded in the reforecast run: `.llm/runs/chore-roadmap-beta3-stable-reforecast
  --reforecast/roadmap-0.0.1.md` §5 (PR #392, held for owner review — do not merge/eval from here).

## Locked positioning & voice (do not violate anywhere in C/D)

- NetScript competes on **AI-agent build-efficiency** (fewer turns to a production-grade backend),
  **not** runtime throughput. No unshipped-capability claims; no throughput-leadership claims.
- Docs voice: **ban "honesty/candor" framing** — one clean factual callout instead.
- **Plugin-thinness / core-centralization law:** convention-bearing primitives live in core; plugins
  stay thin. The dashboard plugin must still meet the **flagship quality bar** (thin ≠ lower bar).
- **Wrap, do not reinvent:** extend Aspire (`WithCommand` + interaction-service) and `deno desktop`;
  do not rebuild them.

## Delegated to Fable (resolve in the deep-dive; surface trade-offs + record rationale)

- **D-NSONE (dashboard UI source).** eis-chat ships a complete design system ("NS One") that looks
  more finished than today's `@netscript/fresh-ui`. Resolve: **promote NS One into
  `@netscript/fresh-ui` as canonical, then build the dashboard on it** — vs — **build on existing
  fresh-ui, keep NS One as a borrowed reference.** Owner lean (non-binding): promotion aligns with
  the core-centralization law + flagship bar; cost = a fresh-ui promotion slice before beta.6. If
  promoted, it is a WSL Codex framework slice, not a docs workflow. See `specs/topic-A`.
- **Telemetry grouped-trace flow.** Owner retracted the literal
  "button→python→trigger→saga→services" chain as "a stupid example." Goal = **true grouped E2E
  traces across the real stack, cross-language where the pipeline actually crosses languages.**
  **Derive the concrete showcase flow from eis-chat's real pipeline.** Fable picks the milestone for
  the hardest cross-language hop (beta.6 flagship vs stable tail). See `specs/topic-B`.
