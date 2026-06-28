# PLAN-EVAL cycle 2 — `chore/release-one-shot` (PR #164)

## Summary

Verdict: **PASS**.

The cycle-2 revision of `.llm/tmp/run/chore-release-one-shot--tooling/plan.md` correctly addresses
all three required cycle-1 fixes (D3 pattern narrowing, D3 two-pass cross-line resolver + positive
fixture, D3 risk register entry) and folds all three optional clarifications (D4 version handoff,
D5 `agentic:sync-claude`, D2 exact edit sites). No regression on the cycle-1 PASS items
(D1/D2/D4/D5/D6 + scope/lane/slices/gates). The plan is now ready for the IMPL lane.

This is PLAN-EVAL only — no source changes. The `.llm/tmp/run/chore-release-one-shot--tooling/plan-eval.md`
file is overwritten with the cycle-2 verdict + D3 re-assessment + run id (`28305083715-1`). Two
`FAIL_PLAN` cycles are allowed; only one was needed.

## Changes

- **`.llm/tmp/run/chore-release-one-shot--tooling/plan-eval.md`** — overwritten with cycle-2 verdict
  (PASS). Sections: re-baseline of cycle-1 fixes, spot-checks against current `main`, per-decision
  findings (D1–D6), scope/lane/slice verdict, open-decision sweep, plan-gate checklist, IMPL notes,
  notes.
- **PR comment** — written below as the `pr-comment` output deliverable; workflow will post it.

## Validation

Plan-Gate checklist (`.llm/harness/gates/plan-gate.md`) applied to cycle-2 plan:

| Item                                  | Result | Evidence                                                                                |
| ------------------------------------- | ------ | --------------------------------------------------------------------------------------- |
| Research present and current          | PASS   | `.llm/tmp/run/chore-release-one-shot--tooling/research.md` re-baselined vs `main`.      |
| Decisions locked                      | PASS   | D1–D6 all present; D3 REVISED; D2 names edit sites; D4 pins artifact; D5 names tasks.   |
| Open-decision sweep                   | PASS   | Only residual gaps are IMPL-discoverable (entry.md:59-60 doc nit; source-root filter). |
| Commit slices (< 30, gate + files each) | PASS | 5 slices; S2 expanded to enumerate fixtures and pattern narrowing.                     |
| Risk register                         | PASS   | D3 cross-line miss class + D3 false-positive risk + alpha.12 follow-up.                 |
| Gate set selected                     | PASS   | run-deno-check + lint + fmt + unit tests + `release:cut --dry-run` + actionlint.       |
| Deferred scope explicit               | PASS   | D6 non-goals enumerated.                                                                |
| jsr-audit surface scan                | N/A    | SCOPE-tools; preflight tool's output gates JSR publishability of downstream cuts.      |

Spot-checks (against current `main`):

- `packages/service/src/primitives/openapi.ts:29` — `const scalarJsUrl = new URL('../../assets/scalar.min.js', import.meta.url);` ✓
- `packages/service/src/primitives/openapi.ts:155` — `const scalarJs = scalarJsCache ?? await Deno.readTextFile(scalarJsUrl);` ✓
- `.llm/tools/deps/prod-install.ts:28` — `const cmdArgs = ['ci', '--prod', '--frozen'];` (after D2 fix: `['ci', '--prod']`) ✓
- `.llm/tools/README.md:99` — `--frozen` mention present (D2 fix removes it) ✓
- `.llm/tools/entry.md:59-60` — `--frozen` mention also present here (NOT in plan's edit list; flagged as IMPL nit)
- `deno.json:51-52` — `agentic:sync-claude` + `agentic:sync-claude:check` tasks exist ✓
- Publishable members: cli, fresh, fresh-ui, aspire, config, database, plugin, runtime-config, service, watchers, triggers (e2e excluded via `"publish": false`) ✓

D3 re-assessment (the load-bearing decision):

- **Pattern set**: confirmed narrowed to `Deno.readTextFile(` / `Deno.readFile(` only. `fromFileUrl(`,
  `import.meta.resolve(`, bare `new URL(..., import.meta.url)` are explicitly dropped. The ~21
  constructor hits on `main` are no longer in scope.
- **Cross-line resolver**: pinned as Pass 1 (collect `const <name> = new URL(<literal>, import.meta.url)`
  + direct `fromFileUrl(new URL(...))`) → Pass 2 (flag `Deno.readTextFile(<name>)` / `Deno.readFile(<name>)`
  AND inline `Deno.readTextFile(new URL(...))`). Catches `openapi.ts:29 → 155` correctly.
- **Positive fixture**: mirrors `openapi.ts:29 → 155`. Tool MUST flag it.
- **Negative fixture**: bare URL used for HTTP/module-id composition + text-import `with { type: 'text' }`
  read. Tool must NOT flag.
- **Allowlist**: tight inline annotation `// preflight-allow: <reason>`. No broad ignore globs.
- **Risk register**: D3 cross-line miss class (multi-hop indirection) + D3 false-positive drift + alpha.12
  follow-up all enumerated.

## Responses to review comments or issue comments

Cycle-1 verdict (`FAIL_PLAN`) is a clean supersession — all three required fixes are addressed in the
revision, all three optional clarifications folded. The cycle-2 verdict reverses cycle 1's blocker
without modifying the cycle-1 PASS items.

## Remaining risks (IMPL-level, not blocking PASS)

1. **D2 doc nit** — `entry.md:59-60` also mentions `--frozen` and is not in the plan's edit list. The
   IMPL session should `git grep -nF -- '--frozen' .llm/tools/` after the slice to confirm zero
   remaining mentions in the toolbelt docs. Discoverable in a 5-second grep; not a Plan-Gate fail.
2. **D3 source-root filter ambiguity** — "source `.ts`/`.tsx` only" is interpretable as files reachable
   from `exports:`, files outside `tests/`, or all `.ts`/`.tsx`. IMPL session should pick the option
   that excludes test fixtures with inline-form `Deno.readTextFile(new URL(...))` (e.g.,
   `readme-examples_test.ts:3`).
3. **D3 multi-hop indirection** — the two-pass resolver is one assignment hop. Multi-hop reads
   (`const x = new URL(...); const y = x; readTextFile(y)`) would not be caught. Plan's risk register
   acknowledges this and relies on fixture coverage as the guardrail. Acceptable for the production
   defect class.
4. **D4 artifact naming** — suggest a versioned name like `netscript-published-version-<run-id>` to
   avoid collision with other artifacts if the workflow grows.