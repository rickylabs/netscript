# Context Pack: scaffold chrome on every page + linked `ui:add page` (#2406 items 1, 4)

## Run Metadata

| Field          | Value                                        |
| -------------- | -------------------------------------------- |
| Run ID         | `orch-divybot-751--2406-scaffold-chrome`     |
| Branch         | `orch/divybot-751`                           |
| Current phase  | `close` (IMPL-EVAL PASS)                     |
| Archetype      | `6 - CLI tooling`                            |
| Scope overlays | `frontend` (scaffold output), `docs` (skill) |

## Current State

Slices 0–5 landed on `orch/divybot-751` (PR #2407). `PLAN-EVAL: N/A`; IMPL-EVAL `PASS` (Muse Spark 1.3, round 1).
Sibling session #752 owns the docs/MCP/app-guidance half of #2406.

## Completed

- Slice 0: run dir, research, plan, design checkpoint (6b370ab); draft PR #2407.
- Slice 1: `_layout.tsx` opt-out chrome + `navigation.ts` template (cc5517e).
- Slice 2: `ui:add page` nav registration, house-layout page, `Next:` hints; `ui:remove page` unlinks; page lifecycle moved to `kernel/application/ui/page/` (10766ea).
- Slice 3: `styles.css` app-owned tail survives `ui:add` (88b6d0e).
- Slice 4: `netscript-build` skill refresh + `skills.generated.ts` (601e4bd).
- Slice 5: consumer proof on a real scaffold (`consumer-proof.md`); `ui:remove page` tolerates the generator-injected binding; #2409 filed.

## In Progress

- Nothing in progress. PR #2407 ready for merge.

## Next Steps

1. After #2407 / #2408 merge: whichever lands second adds the cross-references (`navigation.ts` +
   `--nav`/`--no-nav` in `agent-conventions.ts` `## Design and theming`; the
   `web-layer/how-to/design-with-fresh-ui` slug in `skills/netscript-build/SKILL.md`; the
   `navigation.ts` / `--nav` / `--no-nav` specifics in `customize-fresh-ui.md`
   `## App chrome and navigation`, which #2408 words neutrally).
   Note from #752: on the standalone MCP corpus, bare-slug `get_doc web-layer/how-to/...` returned
   `doc_not_found` on `main` (release carrier keys pages as `pages/...`); #2408 (54166ef) adds a
   `pages/<slug>` fallback, so the skill's and `ui:add page`'s bare-slug pointers resolve once it merges.
2. #2409 (Fresh duplicate route binding) — once fixed, `withoutGeneratedRouteBinding` in
   `ui/page/remove-ui-page.ts` may become dead code.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Opt-out chrome (`chromelessRoutePrefixes = [/design]`) | plan §1 | keeps one `page` Partial |
| Nav as data in `navigation.ts` | plan §2 | CLI appends like `router.ts` |
| Top-level pages auto-linked; `--nav [label]` / `--no-nav` | plan §3 | nested pages opt in |
| Preserve `styles.css` custom tail | plan §7 | makes #752's theme recipe durable |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/orch-divybot-751--2406-scaffold-chrome/*` | new | run artifacts |
| `packages/cli/src/kernel/assets/app/navigation.ts.template` | new | app-owned nav data + chrome opt-out |
| `packages/cli/src/kernel/assets/app/routes/_layout.tsx.template` | changed | opt-out chrome |
| `packages/cli/src/kernel/application/ui/page/*` | new/moved | page lifecycle + `app-navigation.ts` contract |
| `packages/cli/src/public/features/ui/{add,remove}/*` | changed | `--nav`/`--no-nav`, `Next:` lines, nav reconcile output |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static      | PASS           | worklog S1–S5; evaluate.md |
| Fitness     | PASS           | quality:scan 0; arch:check FAIL=0, cli WARN=64 |
| Runtime     | partial        | consumer-proof.md (build+serve HTML); screenshots + scaffold.runtime unproven on host |
| Consumer    | PASS           | full CLI suite 2109/2109; consumer-proof.md |

## Open Questions

- none

## Drift and Debt

- Drift: lane override (owner dispatch), #752 split, stale baseline, issue premise — `drift.md`.
- Debt: none.

## Commits

| Slice | Commit | Gate |
| --- | --- | --- |
