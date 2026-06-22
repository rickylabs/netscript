# WSL Codex adversarial PLAN panel — verdict + fold-in record

**Panel:** `review/docs-v4-plan-panel`, separate WSL Codex session, ran on the OpenHands-cycle-1-fixed
plan (`949d1d99`). GitHub-API-blind, source/`deno doc`-grounded.
**Verdict:** `PANEL: CHANGES_REQUIRED` — 7 findings, all planning-artifact precision/enforceability
fixes. NONE contradicted a locked user decision. Panel independently AGREED with OpenHands on all 3
open IA questions.

Findings file `codex-panel-findings.md` was written on the panel's WSL branch (committing was
optional per brief; supervisor read it directly). This file is the in-branch audit trail.

## The 7 findings and how each was folded in

| # | Sev | Finding | Fix applied |
|---|-----|---------|-------------|
| 1 | major | D2 / W6 cited saga export as re-exported from `src/public/mod.ts` (FALSE) | `drift.md` D2 + `plan.md` W4: `createSagaRuntime` is reachable ONLY via the `@netscript/plugin-sagas-core/runtime` subpath; `deno.json` maps `.`→`./mod.ts`, `./runtime`→`./src/runtime/mod.ts`; NOT on root `.` or `src/public/mod.ts`. Independently verified against source 2026-06-22. |
| 2 | major | `plan.md:15-16` "10-page Web Layer" conflated export-backed pages with the non-export examples leaf | Relabeled: 10 export-backed pages **plus one non-export "Examples / sandbox" showcase leaf** (not counted as export-grounded). Mirrored in W3 + `ia-tree.md`. |
| 3 | minor | `ia-tree.md:23` query leaf named `./query` but missed root `.` cache helpers | Added root `.` helpers `hasAllCacheEntries` · `minCachedAt` · `projectCachedItemFromList`; W3 page must name both. |
| 4 | major | `plan.md` W5 process gates were policy prose, not mechanically enforceable | Locked decision 5 + W5 now specify marker grammar (`<!-- caveat: <ref> -->`, `<!-- seam: seam-coverage:<row-id> -->`), checked-in scripts `.llm/tools/docs/check-caveat-harvest.ts` + `check-seam-coverage.ts` (scan `docs/site/**/*.md{,x}`, exit non-zero on untracked caveat / unseamed claim), and extend xref throw-on-missing to `featureGrid` + `diagram`; all wired into build + CI. |
| 5 | minor | `plan.md:26-27` Track-D framed as "genuinely missing" → risk of authoring a redundant tutorial | Reframed to repoint-only DEFAULT (`/tutorials/` → `/tutorials/live-dashboard/`; QueryIsland card → `/tutorials/live-dashboard/04-definePage-QueryIsland/`); a new tutorial only if a W1 audit proves the existing track cannot serve the need (own scoped decision). |
| 6 | major | `seam-coverage.md:36-37` "work cleanly with no interactive dependency" too broad for table-backed plugins | Split: `bearer`/`jwt` (stateless) work turnkey via R0; `organization`/`twoFactor`/`admin`/`apiKey` are table-backed → runnable only after R1 schema-gen; until R1 they type-check but fail at runtime → docs MUST carry the R1 caveat. |
| 7 | minor | `plan.md:38-39` W0 Mermaid pipeline had no determinism/rollback gate | W0 now: render each `.mmd` to temp dir + diff committed SVG (fail on drift/missing), document local+CI mmdc install, and ROLLBACK rule — if mmdc can't run reproducibly in CI, keep the missing-asset gate but defer live rendering (commit pre-rendered SVGs); W0 must never hard-block all docs builds. |

## What the panel could NOT break (confirmed correct)
Fresh export map real (`definePage` @ `builders/mod.ts:25-27`, `defineRouteContract` @
`route/mod.ts:99-104`); saga symbol fix correct; better-auth R0 diagnosis real
(`NetscriptBetterAuthOptions` has no `plugins`; `createBetterAuthBackend({ auth })` accepts
structural `BetterAuthInstance`); `netscript db add`, `defineService`, `createServiceClient`,
`createPostgresAdapter`/`createQueue`/`createScheduler`/`getKv` all exist.

## Open-IA-question rulings (panel, independent — concur with OpenHands)
(a) Split Background-Processing vs Durable-Workflows = YES (distinct pillars).
(b) Reference = pillar-local sections + thin global index.
(c) Fresh examples leaf = prose now, StackBlitz/sandbox backlog.

**Resolution:** all 7 folded into `plan.md` / `ia-tree.md` / `seam-coverage.md` / `drift.md` this
commit. Next: OpenHands PLAN-EVAL cycle 2 on the fully-corrected plan (the single remaining cycle).
