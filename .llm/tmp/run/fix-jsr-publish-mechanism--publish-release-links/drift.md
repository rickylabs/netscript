# Drift Log: JSR Publish Mechanism and Release Links

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-06-25 — Evaluator launch surface fallback

- **What:** Harness asks for PLAN-EVAL in OpenHands with a specific model, but this Codex session exposes only generic multi-agent delegation and GitHub tooling, not the repo's OpenHands launch surface.
- **Source:** Available tool list after `tool_search` for multi-agent/evaluator tooling.
- **Expected:** OpenHands PLAN-EVAL path available.
- **Actual:** Separate multi-agent evaluator is available and will be used as the evaluator fallback.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `worklog.md` records fallback before implementation.

## 2026-06-25 — Root bare publish checks internal Aspire barrel

- **What:** Bare workspace-root `deno publish --dry-run` fails on `packages/aspire/src/public/mod.ts`, even though that file is not in Aspire's `exports` map and per-member publish dry-run is scoped to member exports.
- **Source:** `deno publish --dry-run` exit 1; `packages/aspire/deno.json`.
- **Expected:** Root publish should publish the workspace members or fail only on exported public APIs.
- **Actual:** Root publish's slow-type pass checks the included internal public barrel and reports TS2305 for symbols that exist in direct source files.
- **Severity:** significant
- **Action:** fix
- **Evidence:** `research.md` Findings 4-8.

## 2026-06-25 — Aspire public barrel has import-map consumers

- **What:** PLAN-EVAL spot-check found four plugin `deno.json` import maps pointing `@netscript/aspire` to `../../packages/aspire/src/public/mod.ts`.
- **Source:** `rtk rg -n 'packages/aspire/src/public/mod\\.ts|@netscript/aspire' plugins packages -g deno.json`.
- **Expected:** Initial research said there were no product consumers of the file.
- **Actual:** No TypeScript importers were found, but plugin import maps consume the file as their local-source Aspire surface.
- **Severity:** minor
- **Action:** fix
- **Evidence:** `research.md` Finding 7 revised; implementation retains and repairs `packages/aspire/src/public/mod.ts`.
