# Context Pack — #1443 plugin-ai next-canary orchestrator

Resume point for this run. Read `supervisor.md` first for identity and lanes.

## What this run is

Fix the whole `plugin-ai` defect class in #1443 (P0, milestone `0.0.6`, blocking
`rickylabs/eis-chat#157`): one focused PR against `main`, IMPL-EVAL `PASS`, merge, close #1443, hand
the merge SHA to the **existing** release lane for the next canary. Do not cut a competing canary.

## State

| Phase | Status |
| --- | --- |
| Bootstrap | done — run dir + `supervisor.md` |
| Research | done — `research.md`, evidence preserved under `evidence/` |
| Plan & Design | done — `plan.md` (7 LOCKED decisions), Design section in `worklog.md` |
| Plan-Gate | **SELECTED, pending** — Codex Sol high; hard stop before any source edit |
| Implement | not started (9 slices, Codex GPT-5.6 Sol, daemon-attached) |
| Gate | not started |
| Evaluate | not started (IMPL-EVAL: Fable 5 medium) |
| Release | hand off merge SHA to the active release lane |
| Close | arch-debt entry + follow-up issue for the unmounted chat island |

## The four defects, mechanized

1. `jsr:@netscript/plugin-ai@0.0.5/services` written to `appsettings.json` for a package with no
   `/services` export — the host synthesizes it as a blind fallback in `resolveServiceEntrypoint`.
2. `netscript.config.ts` gets `./plugins/ai/mod.ts`, which is never created — the AI starter
   resources have no `mod.ts` emitter, so `resolvePluginConfigDirectory` takes its fallback branch.
   `generate runtime-schemas` then fails.
3. `deno check ai/**` → 27 errors: `preact`/`preact/hooks` absent from the root import map,
   `ai/components/ui/markdown.tsx` never emitted, and the generated root `deno.json` has no
   `jsx`/`jsxImportSource`.
4. `plugin doctor` reports healthy through all of it; the canonical E2E never selects `ai/**` and
   never runs `generate runtime-schemas`.

Root cause behind (1): `packages/plugin`'s manifest protocol has no way to express "no service" —
four fields are required by a `.strict()` schema.

## Key paths

- `packages/plugin/src/protocol/manifest.ts` — manifest schema (slice 1)
- `packages/cli/src/kernel/adapters/plugin/appsettings-entry-builders.ts` — `resolveServiceEntrypoint` (slice 2)
- `packages/cli/src/kernel/adapters/plugin/workspace-mutator.ts` — appsettings/config/import-map/workspace mutation
- `packages/cli/src/public/features/plugins/install/install-plugin.ts` — install orchestration
- `plugins/ai/scaffold.plugin.json` — the manifest that lies (slice 3)
- `plugins/ai/src/adapter/plugin.ts` — `aiStarterResources` (slices 4–5)
- `plugins/ai/src/adapter/resources/chat-route/chat-route.stub.ts` — the island importing `../components/ui/markdown.tsx`
- `packages/cli/src/kernel/application/ui/registry.ts` — `installUiRegistryItems` (slice 6)
- `packages/cli/e2e/suites/scaffold/capability-suites.ts` + `src/application/gates/scaffold/**` (slice 8)
- `packages/fresh-ui/registry.manifest.ts:1409` — `markdown` in the `ai` collection

## Reproduction

`evidence/published-0.0.5-repro.sh` — rebuild a clean 0.0.5 consumer and re-observe all four
defects. Re-run it against the local-source CLI after slices 2–6 as the cheap regression check
before the expensive E2E.

## Invariants for this run

- No hardcoded plugin names host-side, no `any`, no casts, no lint suppressions, no skipped or
  deleted tests, no docs-only papering.
- Repository `deno.lock` unchanged unless genuinely required and explained in the PR.
- Tier-A slice review before every sign-off commit; no implementation lane self-certifies.
- Final proof: `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`, visibly
  installing plugin-AI and type-checking the generated AI namespace, then leak-check.
