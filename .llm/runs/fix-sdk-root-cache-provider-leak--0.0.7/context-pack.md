# Context Pack: SDK root cache-provider isolation

## Run Metadata

| Field          | Value                                     |
| -------------- | ----------------------------------------- |
| Run ID         | `fix-sdk-root-cache-provider-leak--0.0.7` |
| Branch         | `fix/sdk-root-cache-provider-leak`        |
| Current phase  | S3 implementation checkpoint              |
| Archetype      | `2 — Integration`                         |
| Scope overlays | none                                      |

## Current state

S1 research/design remains against `origin/main` `13878a80a50c55b9662099fed64555f2310ae4a3`.
PLAN-EVAL cycle 1 returned `FAIL_PLAN` at `1bf9c567`: the archetype, doctrine, three-move design,
compatibility analysis, and ceiling discipline were accepted, while six measurement findings
required revision. The revised plan keeps that design and locks an executable intact-runtime red, a
committed graph assertion, a finite curated-entry closure, an order-independent Fresh test, the four
affected site pages, and the full agent-docs/publish derivative chain. No test or product file has
been written.

PLAN-EVAL cycle 2 returned `PASS_PLAN` at plan commit `9a0f5876`, authorizing implementation. S2
committed the regression test alone at `ddf66a6f`. Its intact-runtime fresh child imported the root
`defineServices`, then observed `hasCacheProvider() === true`; the structured runner exited 1 with 0
passed and 1 failed. The failure was the product defect, not an unrelated runtime crash.

S3 now makes the SDK root/cache entry modules load-time pure, adds the curated browser-safe
`@netscript/sdk/presets` entry, and registers the default provider only when `defineFreshApp()` is
called. The final focused suite passes 82/82. The committed graph phase, which was unreachable after
the S2 behavioral red, executed for the first time at S3 green and proved both root and presets free
of KV, logger, raw `@netscript/kv`, and every resolved/raw `node:` edge.

## Completed

- Read all requested skills and relevant harness/doctrine authorities.
- Verified branch/base/no-upstream and clean starting state.
- Used `deno doc` before focused source reads.
- Verified the root → cache barrel → provider → query factory → dynamic KV source chain.
- Fetched the current issue acceptance text without editing it.
- Selected Archetype 2 / Keep and named layering/fitness rules.
- Compared all three design moves for dominance.
- Declared the compatibility break and migration owner.
- Locked the product/proof ceiling and generated-derivative cascade.
- Measured current doc-lint and JSR audit negatives.
- Recorded PLAN-EVAL cycle 1 `FAIL_PLAN` and repaired F1-F7 in the plan artifacts only.
- Proved this host can run the Lume corpus gate: `check:agent-docs-prose` exit 0, 638 files built,
  rendered output OK, corpus fresh.
- Added the three omitted published guidance pages and both `.llm/assets/agent-docs/*` outputs to
  the locked ceiling.
- Received PLAN-EVAL cycle 2 `PASS_PLAN`.
- Added the S2 red-before test without changing product code.
- Recorded structured RED: exit 1, 0 passed / 1 failed, observed provider `true`.
- Embedded the final graph assertion in that test: both root and presets must exclude resolved KV,
  logger, every `node:` module, raw `@netscript/kv`, and raw `node:` dependencies.
- Removed the root cache barrel and the cache barrel's import-time registration.
- Added `./presets` with 7 direct preset exports and the locked 68-type closure; no
  `QueryClientPort`, ports wildcard, or ports runtime value is exported.
- Added explicit Fresh composition-root registration and an order-independent fresh-child test.
- Updated the SDK README and all four owned site pages with compatibility/migration guidance.
- Regenerated and verified the MCP export corpus, agent-docs prose/provenance, and MCP publish asset
  in dependency order, recording every stale precheck and final pass.
- Passed the final 82-test suite, nine-file structured check/lint/fmt, docs export drift, targeted
  preset doc lint, JSR audit, package/workspace publish dry-runs, and raw lock hygiene.

## In progress

- S3 commit/push/comment checkpoint.

## Next steps

1. Commit and push S3, then post its structured PR comment.
2. Reconcile S4 run artifacts with the landed S3 SHA; make no product changes.
3. Push and comment S4, then hand off for the mandatory separate IMPL-EVAL/review sequence.

## Key decisions

| Decision                    | Source                                       | Notes                                                         |
| --------------------------- | -------------------------------------------- | ------------------------------------------------------------- |
| All three issue moves       | `research.md` / `plan.md` D1                 | Combined choice is not dominated by any single alternative.   |
| Remove root cache re-export | `plan.md` D2                                 | Purity alone would retain the server KV adapter edge.         |
| Curated `./presets` entry   | JSR/doc-lint + cycle-1 measurement           | Explicit type-only ports enumeration minus `QueryClientPort`. |
| Fresh explicit registration | Doctrine composition root + issue acceptance | Custom servers migrate explicitly.                            |
| Migration note required     | Compatibility analysis                       | README + four site pages + PR; no new changelog convention.   |
| Corpus cascade              | Tool source + host run                       | Site -> agent-docs pair -> publish assets; host is capable.   |

## Files changed in S1

| Path                                                                | Status | Notes                                                                         |
| ------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------- |
| `.llm/runs/fix-sdk-root-cache-provider-leak--0.0.7/supervisor.md`   | new    | Run identity without prohibited session/thread ids.                           |
| `.llm/runs/fix-sdk-root-cache-provider-leak--0.0.7/research.md`     | new    | Current facts, doctrine, alternatives, compatibility, JSR/generated findings. |
| `.llm/runs/fix-sdk-root-cache-provider-leak--0.0.7/plan.md`         | new    | Locked design, ceiling, slices, and gates.                                    |
| `.llm/runs/fix-sdk-root-cache-provider-leak--0.0.7/worklog.md`      | new    | Design checkpoint and baseline evidence.                                      |
| `.llm/runs/fix-sdk-root-cache-provider-leak--0.0.7/context-pack.md` | new    | Resumable PLAN-EVAL handoff.                                                  |
| `.llm/runs/fix-sdk-root-cache-provider-leak--0.0.7/drift.md`        | new    | Append-only drift log; no material drift in S1.                               |

## Gates

| Gate family          | Current status     | Evidence                                                                                     |
| -------------------- | ------------------ | -------------------------------------------------------------------------------------------- |
| Research/currentness | PASS               | Base/source/issue and `deno doc` verification in `research.md`.                              |
| Plan-Gate            | PASS_PLAN          | Cycle 2 independently measured the revised plan sufficient.                                  |
| JSR surface scan     | BASELINE RECORDED  | Audit exit 0 with two warnings; full doc-lint and direct preset entry are measured negative. |
| Agent-docs host      | PASS               | `check:agent-docs-prose` exit 0; 638-file Lume build; corpus `fresh: true`.                  |
| S2 behavioral red    | EXPECTED RED       | Structured exit 1; 0 passed / 1 failed; root provider observed `true`.                       |
| S2 graph assertion   | PASS               | Executed for the first time at S3 green; both graphs contained zero forbidden edges.          |
| Focused tests        | PASS               | 82 passed / 0 failed, including the entire SDK test directory and Fresh bootstrap test.       |
| Type/lint/format     | PASS               | Nine owned TS files selected; zero diagnostics/findings and full coverage.                    |
| Published surface   | PASS / NEGATIVE RECORDED | Preset doc + JSR + publish pass; repo surface baseline remains a measured 559-major negative. |
| Generated cascade   | PASS               | MCP corpus, agent-docs prose/provenance, and publish-assets final checks are fresh.            |
| Lock hygiene        | PASS               | Raw `git diff --exit-code -- deno.lock` returned 0.                                           |

## Open questions

None. S4 is evidence reconciliation only; mandatory IMPL-EVAL remains coordinator/evaluator work.

## Drift and debt

- Drift: cycle 1 exposed an invalid Deno-global test shape and an incomplete generated-doc cascade;
  both are corrected without product rescope. RTK remains unavailable, so focused raw reads were
  used.
- Debt: none created or closed. Existing SDK cardinality/private-ref/slow-type findings remain
  measured baselines.
- Follow-up reference: PLAN-EVAL cycle 1 F9's neighbouring Fresh-root cache edge remains
  coordinator-owned and outside this leaf.

## Commits

- Initial plan: `1bf9c567` (`FAIL_PLAN` cycle 1). See the draft PR commit list + phase comments for
  the revised S1 commit and cycle-2 handoff.
