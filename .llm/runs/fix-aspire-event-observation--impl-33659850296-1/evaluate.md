# IMPL-EVAL — PR #1909 (fix/aspire-event-observation @ c3805e1d2b29e68a496676e79ee8658f64a9d1b7)

Evaluator lane: OpenHands (OpenRouter `z-ai/glm-5.3-flash`), run `33659850296-1`, separate session
from the generator (Codex `gpt-5.6-sol`, thread `01a0606e-e6da-7bf1-8760-753a71eb715d`). Effort not
attested: the OpenHands adapter does not expose effort identity. Trusted base `850cc7757`.
Scope: verify the slice-1 implementation and gates against the immutable head; no source edits made
by this session. Local `e2e:cli` intentionally NOT run — CI owns live schema proof (the Aspire
supervisor holds the runtime lease).

## Inputs verified

- Plan disposition: worklog records a justified `PLAN-EVAL: N/A` — #1906, `implement.md` and
  supervisor addenda lock the API, sequencing, file scope, and verification. IMPL-EVAL is mandatory
  and is this pass. Design section present in worklog before the slice commit (`0862052db`).
- Commit trail (base → head, 5 commits): `0862052db` slice (rewire both D-101 directions onto the
  new stream), `550cfc79b` worklog reconcile, `2c47b8ce8` test-only import fix, `3d87111ad` restore
  of the evaluate.md verdict artifact dropped by the main rebase, `c3805e1d2` worklog reconcile.
  All within the approved slice-1 file scope + `.llm/runs/` artifacts.

## Process Verification

| Check                                  | Result | Evidence                                                                                   |
| -------------------------------------- | ------ | ------------------------------------------------------------------------------------------ |
| Plan-Gate passed before implementation | PASS   | `PLAN-EVAL: N/A` justified in worklog (per protocol rule 2); this IMPL-EVAL is the eval     |
| Design section exists in worklog       | PASS   | worklog "Design" section (vocab, lifecycle, constants policy) precedes slice commit         |
| Commit slices match design plan        | PASS   | 1 code slice `0862052db` + test fix `2c47b8ce8` + artifact-restore/reconcile commits        |
| Each slice has a passing gate          | PASS   | slice commit msg: 15 tests / e2e check 192 files; re-run independently at head (below)      |
| No speculative seams (unused files)    | PASS   | seam `resource-state-stream.ts` consumed by fixture + its own tests; no dead new files      |
| Constants used for finite vocabularies | PASS   | `follow-event` source attribution constants in fixture; ceilings `120_000`ms / `120`s const |

## Static Gates (re-run by evaluator at head)

| Gate             | Command or check                                  | Result | Evidence                                                                |
| ---------------- | ------------------------------------------------- | ------ | ----------------------------------------------------------------------- |
| Slice typecheck  | `deno check` (e2e workspace, 137 files)           | PASS   | 0 diagnostics, exit 0                                                    |
| Format           | `deno fmt --check` (scoped, 194 files)            | PASS   | 0 findings, exit 0                                                       |
| Lint             | `deno lint` (repo, ~3100 files)                   | PASS   | 0 problems, exit 0                                                       |
| F-19 arch:check  | `deno task arch:check`                            | PASS   | exit 0, no violations                                                    |
| Quality scan     | `deno task quality:scan`                          | PASS   | exit 0                                                                   |
| CI static lane   | run 33659793007 `scaffold-static (deno-only)`     | PASS   | green at head `c3805e1d2` (includes lock-file / publish-dry-run duties)  |
| Lock hygiene     | `git diff 850cc7757..c3805e1d2 -- deno.lock`      | PASS   | empty — PR commits touch no lock bytes                                   |

## Fitness Gates (touched surface)

| Gate | Function            | Result | Evidence                                                                          |
| ---- | ------------------- | ------ | --------------------------------------------------------------------------------- |
| F-1  | File-size lint      | PASS   | stream 292 LOC, fixture 515 LOC (<800 fail line); 515 crosses the 500 flag line — see Findings #3 |
| F-10 | Test-shape audit    | PASS   | stream test 212 LOC, fixture test 182 LOC (≤500)                                  |
| F-11 | Forbidden-folder    | PASS   | no `utils/ helpers/ common/ lib/ interfaces/` added; `runtime/` is allowed vocab  |
| F-12 | Naming-convention   | PASS   | no `I*` / `*_T` / `*Impl` / `Abstract*` introduced                                |
| F-16 | Folder cardinality  | PASS   | `runtime/` holds 8 entries (≤12)                                                  |
| F-CLI-* | (no scripts; structural) | PENDING_SCRIPT | per archetype S9 disposition; manual evidence: single-class-per-file naming respected |

## Runtime Gates

| Gate                          | Validation                          | Result | Evidence                                                                                               |
| ----------------------------- | ----------------------------------- | ------ | ------------------------------------------------------------------------------------------------------ |
| Focused unit tests (slice)    | `deno test` (packages/cli, scoped)  | PASS   | 15 passed (10 steps) / 0 failed, 204ms — stream parse/buffer/close + fixture matcher/receipt            |
| CI `scaffold-runtime-sqlite`  | live e2e lane at head, run 33659793007 | PASS   | `runtime.health.listener-unreachable` passed (critical), attempt 1, 30.7s                              |
| CI D-101 receipt              | artifact `e2e-cli-scaffold-runtime-sqlite-report` (9859292421) | PASS   | `listener-unreachable-receipt.json`: `transitionEvidence: {departure: "follow-event", recovery: "follow-event"}`; unhealthy `ECONNREFUSED at localhost:18999`; real-key continuity held `Healthy` during fault; stdout: "garnet Unhealthy transition attributed from follow-event" + "garnet Healthy transition attributed from follow-event" |
| Postgres lane                 | live e2e lane, run 33659793007      | PENDING | pending at eval time; same fixture already proved on the sqlite lane and at `d44fb2a6f` (run 33617534840) |

## Consumer Gates

| Consumer                          | Validation                        | Result | Evidence                                                              |
| --------------------------------- | --------------------------------- | ------ | --------------------------------------------------------------------- |
| Public `@netscript/*` surface     | `git diff 850cc7757..c3805e1d2`   | N/A    | diff confined to `packages/cli/e2e/**` + `.llm/runs/**` — no published surface touched |
| `deno.lock`                       | base→head diff                    | PASS   | empty                                                                  |

## Anti-Pattern Check (scope: new e2e runtime module + fixture)

| AP    | Status | Evidence / Notes                                                                        |
| ----- | ------ | ---------------------------------------------------------------------------------------- |
| AP-1  | CLEAR  | stream 292 LOC, new stream module single-purpose; fixture 515 LOC — flag-level note (Findings #3), not a violation |
| AP-2  | CLEAR  | stream wraps `Deno.Command` behind `StartResourceUpdateFollower` seam, not a rename shim |
| AP-6  | CLEAR  | no base class with concrete methods; single concrete `BufferedResourceUpdateSubscription` |
| AP-9  | CLEAR  | seam is consumed twice (fixture + tests); no premature abstraction                       |
| AP-10 | CLEAR  | no defensive try/catch in handlers; failures close the subscription and throw           |
| AP-11 | CLEAR  | no hidden globals; state in private `#` fields                                            |
| AP-12 | CLEAR  | `setTimeout` only for the failure-ceiling timer, documented as test-failure ceiling       |
| AP-13 | CLEAR  | no `console.*` in the new module; fixture writes only the receipt file                    |
| AP-14 | CLEAR  | no re-export of upstream packages                                                         |
| AP-15 | CLEAR  | no `IFoo` / `FooT` names                                                                  |
| AP-16 | CLEAR  | no forbidden folders; `runtime/` allowed                                                  |
| AP-17 | CLEAR  | no `interfaces/` folder                                                                   |
| AP-18 | CLEAR  | no giant-string test snapshots                                                            |
| AP-19 | CLEAR  | permissions explicit in CI step (`--allow-run=aspire` etc.)                                |
| AP-20 | CLEAR  | no `compilerOptions.lib` override added                                                   |
| AP-21 | CLEAR  | n/a — no command-surface folder touched                                                   |
| AP-22 | CLEAR  | no new barrel                                                                             |
| AP-23 | CLEAR  | n/a — no composition body touched                                                         |
| AP-24 | CLEAR  | no switch-over-tagged-union; predicate-based matching                                     |
| AP-25 | CLEAR  | no side effect in non-edge file; stream spawns processes only when instantiated by fixture |
| others| N/A    | outside touched scope                                                                      |

## Arch-Debt Delta

| Metric                | Count | Evidence                                        |
| --------------------- | ----- | ----------------------------------------------- |
| New entries           | 0     | no new `debt/arch-debt.md` entries in base→head |
| Resolved entries      | 0     | —                                               |
| Deepened violations   | 0     | —                                               |
| Unrecorded violations | 0     | F-1 flag noted in Findings #3, under the fail line |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| high (pre-existing, out of PR scope) | Desktop-native Linux lane fails on both the head run (33659793007) and its sibling run (33659993758) with "v1 failed to stage v2" during the deb update smoke | run 33659993758 job `desktop-native-linux (deb + signed updater)` failure; failure is independent of PR commits (touches no desktop surface) | Track and fix outside this PR; do not block D-101 on it |
| minor (pre-existing, out of PR scope) | Desktop lane backend module import error `Import "@orpc/contract" not a dependency and not in import map from "packages/sdk/src/internal/transport-policy.ts"` observed while landing at head; `@orpc/contract@^1.15.0` IS declared in `packages/sdk/deno.json`; traced to #1889, which is in the trusted base | desktop lane logs at head; `packages/sdk/deno.json` imports block | Resolve in the #1889 follow-up lane, not here |
| low | `listener-unreachable-fixture.ts` grew to 515 LOC (from 490 at the prior eval head) — crosses the F-1 500-LOC flag line, under the 800 fail line | `wc -l` = 515; doctrine F-1: flags >500, fails >800 | Optional: extract the receipt-assembly block in the follow-up adoption slice; not required to merge |
| info | PR DoD box "CI confirms D-101 against the live Aspire 13.5.3 follow stream" is now evidenced: green sqlite lane at this head with the receipt above; postgres lane still pending at eval time | run 33659793007 artifacts; receipt json | Tick the PR-body DoD box on merge prep once the postgres lane concludes |
| info | Post-#1909-merge desktop lane activity (e.g. a post-merge release/desktop pipeline turning red) belongs to the #1889/#859 desktop lane, not D-101 | lane ownership per AGENTS.md resource-hygiene notes | Route to the owning epic |

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Long-lived NDJSON followers need a buffered, closable subscription seam with a documented failure ceiling — a bare poll loop cannot observe transient Unhealthy→Healthy transitions | `watchResourceUpdates` + `waitFor(predicate, ceilingMs)` | future Aspire observation gates (e2e archetypes) | high |
| CI artifact receipts (`transitionEvidence` attribution) make live-schema proof auditable without re-running locally | `listener-unreachable-receipt.json` in run artifacts | all live-runtime e2e gates | high |

## Verdict

Base and head verified: trusted base `850cc7757` read for protocol/profiles; immutable head
`c3805e1d2` evaluated for diff, gates, artifacts, and review state (0 unanswered review threads).
Process, static, runtime (live CI proof on the sqlite lane with two-direction `follow-event`
attribution), consumer, and hygiene gates all pass; desktop-lane failures classified pre-existing
and out of PR scope. Prior committed evaluation at `d44fb2a6f` (restored verbatim by `3d87111ad`)
is consistent with this one.

OPENHANDS_VERDICT: PASS
