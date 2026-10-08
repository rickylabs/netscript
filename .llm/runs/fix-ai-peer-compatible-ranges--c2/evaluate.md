# Evaluation: PR #2087 — AI peer-compatible published resolution ranges (issue #2036)

Independent IMPL-EVAL. Separate session/vendor family from the gpt-6.1-sol lane-C2 generator,
per `supervisor.md` owner override route (opencode-go/glm-5.3-flash, max). BRIEF-C2 privacy and
no-merge/no-publication rules honored; only this file was written in the run dir.

## Metadata

| Field          | Value                                                        |
| -------------- | ------------------------------------------------------------ |
| Run ID         | `fix-ai-peer-compatible-ranges--c2`                          |
| Target         | PR #2087 source slice (issue #2036) — dependency/guard scope |
| Archetype      | 2 — integration (source dependency tooling)                   |
| Scope overlays | none                                                          |
| Evaluator      | independent glm-5.3-flash session, 2026-10-08                 |

## Identity (recorded first per brief)

| Item             | Value                                              |
| ---------------- | -------------------------------------------------- |
| Git HEAD         | `987048499e80d42b8f8aa65905d8f8558c818672` (briefing commit "docs(harness): brief independent AI peer resolution evaluation") |
| Evaluated source tree | parent `b03385dc31cfee4df098639d5c22cd616db38d00` ("fix(ai): reject peer-incompatible published adapter resolutions") |
| Baseline (main)  | `872df8e21e0a8bf06cd0796c7808068dd67e2c4e` — matches `supervisor.md` |
| Tree identity    | `git diff b03385dc3..HEAD` contains only the added run briefing `.llm/runs/fix-ai-peer-compatible-ranges--c2/impl-eval-brief.md`; working tree clean. HEAD is exactly source slice + briefing. |

## Process Verification

| Check                                  | Result        | Evidence                                                                 |
| -------------------------------------- | ------------- | ------------------------------------------------------------------------ |
| Plan-Gate passed before implementation | PASS          | Justified `PLAN-EVAL: N/A` recorded in `plan.md` and worklog, committed in 13f74a545 **before** source commit b03385dc3 (protocol rule 2 satisfied; plan-eval.md absent is consistent with the recorded N/A) |
| Design section exists in worklog       | PASS          | `## Design` in worklog.md (public surface, ports, slices, no speculative files) |
| Commit slices match design plan        | PASS          | S1 13f74a545 (plan), S2 b03385dc3 (source/tests/gates/run artifacts), S3 987048499 (evaluation brief); matches plan slice list |
| Each slice has a passing gate          | PASS          | S2 gate set recorded with raw exits in worklog (initial lint/bundle/frozen-mode errors corrected and retained); final exits 0 |
| No speculative seams (unused files)    | PASS          |Diff adds only guard, regression, task/catalog/CI wiring, README, pins, lock — no dead files |
| Constants used for finite vocabularies | PASS          | Guard filters declarations via `parseRegistrySpecifier` + finite file list (`packages/ai/deno.json`, `packages/fresh/deno.json`) |
| Brief carries `## SKILL` chapter       | PASS          | impl-eval-brief.md names harness/doctrine/pr/evaluator protocol          |

## Independently executed checks (this session — the verdict source)

| Check | Command | Exit | Result |
| ----- | ------- | ---- | ------ |
| New regression via structured wrapper | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all .llm/tools/deps/check-ai-peers_test.ts` | 0 | 1 passed, 0 failed |
| Live peer guard (cold, lock-free) | `deno task deps:check:ai-peers` | 0 | `{"ok":true,"core":["0.52.3"],"lockFree":true}` — exactly one resolved core |
| Mutation proof — unmutated copy | temp copy in `.llm/tmp/` with local config; `deno test --allow-all` | 0 | 1 passed (copy-faithful baseline) |
| Mutation proof — policy killed (`!satisfies(...)` → `false && ...`, typechecks) | same harness | 1 | 0 passed / 1 failed at the incompatible-pair assertion — regression detects disabled peer policy |
| Workspace integrity after runs | `git status --porcelain` | 0 changes | Source/config/lock unaltered; temp copy removed |

Evaluator hygiene note (recorded honestly): two rejected mutation harnesses were discarded before
the valid pair — (1) a non-typechecking mutation, (2) runs shadowed by the root config's
`exclude: [".llm/tmp/"]` ("No test modules found"). The retractable first `MUTATED_EXIT:1` was not
accepted as proof; the type-safe/local-config pair above is the mutation evidence.

## Source / Pin / Policy Inspection

- **Pins:** all six qualified AI-family declarations are exact (`packages/ai`: ai 0.52.3, anthropic
  0.18.3, mcp 0.3.8, openai 0.22.3; `packages/fresh`: ai 0.52.3, ai-preact 0.14.4) — ranges removed
  for the qualified family, matching research (`@std/semver` added to root imports, new deno.lock
  JSR entry for `jsr:@std/semver@1`).
- **Guard policy** (`.llm/tools/deps/check-ai-peers.ts`): every admitted registry version of each
  declared adapter is checked against admitted core versions via `@std/semver` peer ranges, plus a
  cold `deno info --no-config --no-lock --node-modules-dir=none` consumer resolution that requires
  exactly one resolved core and re-checks resolved adapters' peers. `--published-version <x>` mode
  resolves the public `jsr:@netscript/ai@<x>/anthropic|openai-compatible` entrypoints without
  consumer overrides. Policy is coherent and proportional to the bounded issue.
- **CI/catalog wiring:** `deno.json` adds task `deps:check:ai-peers` and includes it in the
  `ci:quality` compound; catalog maps gate `ai-peer-resolution` → that task; `ci.yml` calls
  `run-gate.ts --gate ai-peer-resolution` gated on `RUN_DENO == 'true'`, writing an atomic receipt
  under `.llm/tmp/gate-receipts/quality/`. Sound.
- **Lock hygiene:** full baseline→branch `deno.lock` diff filtered to AI-family packages +
  `@std/semver`/`@std/path` only (remaining changed lines are AI-package integrity hashes and the
  `@tanstack/openai-base` re-key). Corroborates `drift.md` ("restored original non-AI locked
  entries"); no lock/cache deletion anywhere in the run.

## Contributed evidence set (private item-2036, inspected per brief)

| Evidence | Observation |
| -------- | ----------- |
| `published-negative-guard.stderr` | Exit 1 with the exact issue-#2036 conflicts on published artifacts: `@tanstack/ai-anthropic@0.18.13 requires AI ^0.59.0; got 0.52.3`, `@tanstack/ai-openai@0.22.8 requires AI ^0.55.0; got 0.52.3` |
| `published-graph.json` | Cold published graph: npm resolved adapter 0.18.13 against core 0.52.3 — the real documented hazard (ranges admit incompatible adapter patches) |
| `baseline-peer-guard.stderr` | Exit 1 on original range declarations (0.18.4→^0.52.1, 0.18.5→^0.53.0, … vs admitted cores) |
| `mutation-peer-policy` (structured wrapper receipt) | Exit 1, 0 passed/1 failed, identical incompatible-pair assertion — matches my independent temp-copy mutation |
| `peer-gate-receipt.json` | Atomic durable receipt (schema v1, sha256 of stdout, lifecycle id). Note: its recorded `gitHead` is 13f74a545p — the gate ran on the uncommitted working tree minutes before the source commit. **Reconciled** by this evaluator's independent live-guard run (exit 0) on the committed tree above; recorded as a run-hygiene lesson, not a finding |
| `c2-2036-bundle/{anthropic,openai-compatible}.js` | Real minified provider bundles containing the Anthropic provider implementation (`x-api-key`, `anthropic-version`, `claude` strings); `bundle-corrected` exit 0 |
| `doc-ai-baseline` | Exit 1 — pre-existing baseline diagnostics (see debt adjudication below) |

## Static Gates

| Gate            | Command or check                          | Result        | Evidence                          | Notes |
| --------------- | ----------------------------------------- | ------------- | --------------------------------- | ----- |
| Slice typecheck | `source-check-final`, package `check`     | PASS          | worklog exits 0                   | + independent regression/guard runs |
| Format          | `fmt-final`                               | PASS          | worklog exit 0                    | |
| Lint            | `lint-final` (scoped wrapper+config)      | PASS          | worklog exit 0 after correction   | initial selection error retained transparently |
| Doc lint        | `doc:lint --root packages/ai`             | DEBT_ACCEPTED | exit 1 on unchanged main and branch identically | row `ai-doc-private-ref-baseline-2036`; not re-run per brief |
| Publish dry-run | `publish-ai-restored`                     | PASS          | worklog exit 0                    | |
| Link/path check | public changes contain no operator identities/locations | PASS | worklog "Public implementation changes contain no operator identities or locations"; spot-read of guard/pins/README clean |

## Fitness Gates

| Gate | Function                    | Result    | Evidence                                        | Violations |
| ---- | --------------------------- | --------- | ----------------------------------------------- | ---------- |
| F-5  | Public surface audit        | PASS      | Pins only; no exported contract changed         | none |
| F-6  | JSR publishability gate     | PASS      | `jsr-ai` exit 0 + publish dry-run 0             | none |
| F-7  | Doc-score gate              | DEBT_ACCEPTED | doc-lint baseline identical on main/branch; debt row | existing, explicitly recorded |
| F-19 | Scoped source gate runners  | PASS      | structured run-deno-test/check/lint/fmt wrappers in worklog | none |
| others | quality:gate + arch:check exit 0 (covers doctrine fitness for the slice); file-inventory N/A for tool-only slice | PASS/N/A | worklog `quality` gate | none |

No new `// deno-lint-ignore` or `as unknown as` introduced in the changed source (guard is fully
typed; verified by source-read and typechecking tests).

## Runtime Gates

| Gate | Validation | Result | Evidence |
| ---- | ---------- | ------ | -------- |
| live peer guard | independent run this session | PASS | exit 0, core 0.52.3, lockFree |
| peer-regression | independent structured-wrapper run this session | PASS | exit 0, 1/1 |
| mutation (regression) | independent temp-copy kill + restore this session (+ generator receipt) | PASS | mutated exit 1 / unmutated exit 0 |
| provider suite | `provider-suite` (packages/ai/tests packages/fresh/tests) | PASS | worklog: 165 pass, exit 0 |
| gates suite | `gates-suite` | PASS | worklog exit 0 (run-gate machinery unchanged in behavior) |
| bundle | production provider bundles | PASS | exit 0 + private bundle artifacts inspected |
| published negative | `--published-version 0.0.7` rejects incompatible published resolutions | PASS (intended negative) | exit 1 + stderr conflicts (above) |

## Consumer Gates

| Consumer | Validation | Result | Evidence |
| -------- | ---------- | ------ | -------- |
| cold workspace-mode consumer | lock-free, config-free resolution of declared pins | PASS | independent run: `{"ok":true,"core":["0.52.3"],"lockFree":true}` |
| cold published consumer (0.0.7, current release) | resolved graph clean | PASS as negative reproduction | guard rejects 0.0.7 (conflicts above); 0.0.7 predates the fix |
| published-consumer qualification (future coordinated release) | resolves clean | NOT_RUN — owner release acceptance | app-level EIS-Chat pins removal deferred until then; **shipment remains unproven by design of this scope** |

## Anti-Pattern Check (scope: dependency tooling slice)

| AP    | Status | Evidence | Notes |
| ----- | ------ | -------- | ----- |
| AP-2 (reinvented helper) | N/A | reuses `workspace.ts`, `@std/semver`, `@std/path` | wrap-don't-reinvent honored |
| AP-5 (speculative abstraction) | N/A | no new package/abstraction; plan locked "no new abstraction" | |
| console-log/forbidden-folder/naming | N/A | guard emits single JSON line; files in `.llm/tools/deps/` per house layout | |
| others (13–25) | N/A | plugin/saga/runtime surfaces untouched | |

## Arch-Debt Delta

| Metric                | Count | Evidence |
| --------------------- | ----- | -------- |
| New entries           | 1 | `ai-doc-private-ref-baseline-2036` (well-formed: reason, owner=AI framework maintainers, target, linked plan, status, gate F-7) |
| Resolved entries      | 0 | none claimed |
| Deepened violations   | 0 | pins don't touch public types/docs |
| Unrecorded violations | 0 | inspected diff and run artifacts |

### Debt adjudication (brief-mandated)

`ai-doc-private-ref-baseline-2036` is accepted as valid existing baseline debt: the per-entrypoint
doc-lint diagnostics are identical on unchanged main and on this branch (generator attestation;
small-surface check that the slice's only package-doc change is an additive README section), the
row records it explicitly with a pre-stable-release target, and no run artifact claims a doc-lint
pass. This bounded source slice therefore qualifies **with existing baseline debt**; `FAIL_DEBT`
would require new or deepened unrecorded debt, which is absent.

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| low | Durable gate receipt recorded `gitHead` of the pre-source plan commit (gate ran on the uncommitted working tree) | `peer-gate-receipt.json` | Ad-hoc process note: re-claim receipts after the source commit; reconciled here by independent post-commit runs |
| low | First mutation-harness attempts invalid (type error; root-config `exclude: .llm/tmp/` shadowing) | evaluator log above | None — superseded by valid evidence; lesson for temp-copy mutation runs |

No high/medium findings. No doctrine violation introduced or deepened (AP-2/AP-5 style clear;
native Deno/Web Platform APIs used; existing package boundaries preserved).

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Temp-copy mutation harnesses need a local config when the root workspace excludes the scratch dir | `exclude: [".llm/tmp/"]` silently yields "No test modules found" and a misleading exit 1 | any evaluator using `.llm/tmp/` sandboxes | high |
| Re-claim durable gate receipts after the commits they should pin | receipt `gitHead` = pre-commit tree state | gates using `.llm/tools/gates/run-gate.ts` | medium |

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | `PASS` |
| Rationale | The approved bounded scope (exact AI-family pins, all-admitted-version peer guard, cold lock-free and published-mode resolution checks, mutation-proven regression, CI/catalog wiring, lock hygiene, README) is complete and independently substantiated: this session re-ran the regression (exit 0), the live peer guard (exit 0, cold/gallery lock-free core 0.52.3), and an independent mutation kill/restore pair (exit 1 / exit 0) without altering source, config, or lock; recorded negatives (baseline ranges exit 1; published 0.0.7 exit 1 with the exact #2036 conflicts) and production-bundle evidence were inspected and consistent. Doc-lint failure is pre-existing and identical on main and branch, explicitly recorded as valid existing baseline debt (`ai-doc-private-ref-baseline-2036`) for the debt adjudication above. |

**Shipment statement:** publication, published-consumer qualification, CI receipt on the PR head,
merge, and coordinated consuming-release acceptance remain **unproven owner work** — this verdict
covers the source slice only. `References #2036` in PR #2087 is correctly non-closing; do not
merge or publish on this verdict, and no self-certification by the generator is implied.
