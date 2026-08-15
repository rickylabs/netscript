# Drift Log: sdk cached-entry stale policy

Drift is append-only.

## 2026-08-15 — Frozen file-surface contract contains two nonexistent paths

- **What:** `docs/sdk` and `docs/site/_site/capabilities/sdk/index.md` do not exist at the named
  baseline; the latter is also under generated Lume output.
- **Source:** coordinator brief and direct path checks.
- **Expected:** four frozen `fileSurfaces` exist as editable targets.
- **Actual:** only `docs/site/services-sdk/sdk.md` and `packages/sdk/src/cache/cache-query.ts`
  exist; the exact offending snippet is in the former.
- **Severity:** significant
- **Action:** fix the plan contract; never create replacements or edit `_site`.
- **Evidence:** `research.md` findings 1-4; `.llm/tools/docs/snippet-policy.ts:45-48`.

## 2026-08-15 — Adjacent tutorial repeats the false behavior outside frozen scope

- **What:** `docs/site/tutorials/live-dashboard/03-sdk-cache-first-query.md:100` also claims stale
  `getCachedEntry()` reads refresh in the background.
- **Source:** site-source search for `getCachedEntry`, stale, and background claims.
- **Expected:** the cited false published example is represented by the frozen site source.
- **Actual:** the exact example is in scope, but adjacent prose outside the frozen contract repeats
  the same misconception.
- **Severity:** significant
- **Action:** defer and request coordinator surface expansion if it is to be edited; do not silently
  widen this leaf.
- **Evidence:** `research.md` finding 11.

## 2026-08-15 — Supplied doc-lint diagnostic count not reproducible

- **What:** the brief pins raw SDK doc-lint at exactly six `private-type-ref` diagnostics.
- **Source:** coordinator brief.
- **Expected:** explicit raw full-export `deno doc --lint` exits 1 with six named diagnostics.
- **Actual:** it exits 1 with three unique named diagnostics: `QueryClientPort` → `QueryClient`,
  `createNetScriptQueryClient` → `QueryClient`, and
  `DurableStreamProducerOptions["instrumentation"]` → `StreamsInstrumentation`. Root `mod.ts` alone
  yields the first two. The structured full-export runner also identifies the same three unique
  source diagnostics while showing their repetition through multiple entrypoints.
- **Severity:** significant
- **Action:** preserve the observed red set, never report a pass, and ask PLAN-EVAL/coordinator to
  identify the command behind the six-diagnostic pin before merge-readiness reporting.
- **Evidence:** commands and outputs summarized in `research.md` JSR scan and `worklog.md`.
