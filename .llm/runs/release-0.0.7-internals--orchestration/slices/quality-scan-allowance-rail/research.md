# Research — quality-scan-allowance-rail

## Identity and authority

- Baseline and current `HEAD`: `01e0960494c95ce56eb35892c211a095eb13e6ed`.
- Branch: `chore/quality-scan-allowance-rail`, with no upstream by design.
- Binding leaf: Wave 0 internals, archetype `6-cli-tooling`, overlays `frontend`, `service`, and
  `docs`; issues #1378 and #1545 are inseparable.
- Authority stops at one draft PR against `main`. Merge, publication, milestone scope, and central
  cluster state remain with the milestone coordinator.

## Sources read

- Live GitHub bodies and comments for #1378 and #1545, including their current open state and
  milestone `0.0.7`.
- Coordinator artifacts at
  `/home/codex/repos/netscript-547-lffix/.llm/runs/release-0.0.7--orchestration/`: `plan.md`,
  `milestone-leaf-plan.json`, `leaf-contracts.json`, `milestone-dependency-dag.json`, and
  `drift.md`.
- Harness Plan-Gate and evaluator protocol; archetype 6 and the frontend/service/docs overlays; the
  archetype gate matrix.
- Architecture Doctrine sections 01–07, 09, and 10.
- Current scanner, focused tests, allowance-budget diff checker, gate catalog, CI quality job, task
  definitions, generated CLI asset manifest/generator, docs examples, soundness tests, and the
  approved package/plugin surfaces.
- Public export maps with `deno doc` before focused source reads for `packages/cli/mod.ts`,
  `packages/fresh/mod.ts`, and `plugins/workers/streams/mod.ts`.

## Live issue reconciliation

### #1378

The live Acceptance section still asks for exported/publicly reachable `any` detection, fail-closed
linked allowances, docs fenced-TypeScript coverage, preservation of six soundness assertions, typed
trigger docs, RED-first scenarios, and green repository quality/doctrine gates. A later issue
comment says docs fences, the soundness rule, the original max-budget wiring, and trigger typing
were delivered by #1549 in 0.0.6. Those capabilities must be preserved and regression-tested, not
reimplemented.

The same comment records that a previous `deno doc --json` experiment exited zero while emitting 567
unresolved-type warnings over 1,714 published records. Therefore `deno doc` remains the public
surface inspection and JSR evidence tool, but its exit code cannot be the scanner's sole
reachability oracle.

### #1545

The body measures eight allowances and asks that all eight point at #1545. Current main has seven:
the former Fresh `route-support.ts` allowance has already been removed. More importantly, this PR
must close #1545, so using #1545 as the durable owner of every allowance conflicts with the
requirement that an allowance link resolve to an open, milestoned issue immediately after merge. The
topic/coordinator must identify or authorize a separate open debt owner (or amend the acceptance
semantics) before registration can be implemented truthfully.

## Exact current-head measurements

At `01e0960494c95ce56eb35892c211a095eb13e6ed`:

| Measurement                    | Result                                                                        |
| ------------------------------ | ----------------------------------------------------------------------------- |
| Focused scanner/budget tests   | 19 passed, 0 failed                                                           |
| `quality:scan`                 | PASS; 0 findings; 7 allowances; configured maximum 7                          |
| `quality:scan:repo`            | PASS; 0 findings; 7 allowances; configured maximum 8                          |
| CLI full-export `doc:lint`     | PASS; all 3 export targets; 0 errors                                          |
| Workers full-export `doc:lint` | FAIL; 20 pre-existing `private-type-ref` diagnostics across 13 export targets |
| Triggers reference examples    | Already use `TriggerEventSubscriptionMessage[]`; no example `any` remains     |
| Soundness files                | Exactly six `*-soundness_test.ts` files, unchanged                            |
| Fresh allowance                | No longer present                                                             |

The seven registered source sites are:

- one service-manifest cast in
  `packages/cli/src/public/features/root/public-command-dependencies.ts`;
- five public-facade/plugin-port casts in `packages/cli/src/public/public-api.ts`;
- one worker execution-hook cast in `plugins/workers/streams/producer.ts`.

The baseline receipts are under `receipts/baseline/`. The two scan receipts bind the passing results
to the exact baseline SHA; `quality-tests.json` records the 19 focused test results.

## Current behavior and gaps

The scanner already:

- scans TypeScript fences in Markdown/MDX through the shared docs snippet extractor;
- includes docs `*_test.ts` fixtures;
- preserves the six intentional `*-soundness_test.ts` assertions by exempting only their deliberate
  TypeScript error directives;
- counts `quality-allow:` comments and enforces `--max-allow` overflow;
- reports every allowance and reason.

It does not:

- distinguish a publicly reachable type/signature from a local declaration when detecting `any`;
- require an issue number on `quality-allow:`;
- verify that a linked issue exists, is open, and has a milestone;
- fail closed when issue-state validation is unavailable.

The existing allowance-budget diff checker blocks a numeric budget increase unless the diff contains
an issue reference, but it accepts any issue ID and does not verify live issue state.

## Public-surface and generated-asset findings

- The CLI allowance sites occur in functions reachable from published CLI entrypoints.
- `plugins/workers/streams/producer.ts` is published through the workers streams/server export.
- The scanner source is embedded verbatim in
  `packages/cli/src/kernel/assets/agent-tools.generated.ts`; its permission declaration lives in
  `.llm/tools/consumer-tools.json`. Both are outside the approved leaf surfaces.
- `check:assets-barrel` regenerates the embedded asset and verifies a clean second run. A scanner
  edit without the generated peer would knowingly leave shipped CLI assets stale.
- The existing focused RED-first test file, `.llm/tools/quality/scan-code-quality_test.ts`, is also
  outside the approved surfaces.
- Live issue verification will require a deterministic state source. A narrow GitHub API adapter
  would require scanner runtime permission changes (and consequently the consumer manifest and
  generated asset); an in-repo snapshot cannot truthfully prove that an issue remains open.

## Architecture and design evidence

The scanner is an archetype-6 repository tool. The change should extend its existing source scanner
rather than introduce a second quality engine. Package/plugin topology is otherwise unchanged:

- CLI: **Keep** — public facade and dependency spine remain in place; register the six existing
  bridge casts without inventing a new package axis.
- Fresh: **Keep** — the old allowance has already been removed; only prove browser/public-surface
  preservation if the final diff affects it.
- Workers streams: **Refactor later** — preserve the one narrow bridge cast and link it to explicit
  debt; removing it is outside this leaf.

A deterministic local export/re-export graph is preferred for public reachability. It can begin at
workspace `deno.json` export targets, follow local `export ... from` edges, and examine exported
declarations/signatures for `any`. This avoids a new dependency and avoids treating incomplete
`deno doc` resolution as a complete oracle. Tests must pin multiline types, re-exports, exported
versus local declarations, and exported class/interface members.

Issue-state lookup should be isolated behind an injectable resolver: tests use deterministic
fixtures; the command adapter performs narrow live lookup and fails closed on missing, unreachable,
malformed, closed, or unmilestoned records. The exact production adapter and permissions remain a
Plan-Gate authority decision because the necessary manifest/generated peers are currently out of
contract.

## JSR audit baseline

JSR audit applies to every touched publishable member. `deno doc` inspection confirms the CLI and
workers allowance sites are public. CLI full-export documentation lint is currently clean. Workers
full-export documentation lint has 20 existing private-type-reference errors, with no matching
accepted debt entry found. Fixing those unrelated exports would widen this leaf; claiming a green
full-export audit would be false. The topic/coordinator must either accept a no-regression baseline
for this leaf with a separately owned debt item or explicitly widen scope.

No dependency change is planned. Exact pins, publish file lists, isolated-declaration output, and
runtime asset availability remain mandatory implementation-phase evidence. No publish command is
authorized.

## Research verdict

The intended rule is implementable, and the current scanner already carries the #1549 behavior that
this leaf must preserve. Implementation is hard-stopped pending a separate PLAN-EVAL and the three
authority clarifications recorded in `drift.md`: required test/generated surfaces, a durable open
allowance owner/state source, and treatment of pre-existing workers JSR diagnostics.
