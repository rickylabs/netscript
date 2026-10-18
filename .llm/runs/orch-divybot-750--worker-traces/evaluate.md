# Evaluation: worker trace isolation (#2393 / inbox harness#750)

**Verdict: `FAIL_FIX` — functional source change accepted; ready-merge blocked by an unproven
runtime gate.** The sole blocker is runner infrastructure, not the change. No source defect was
found, and no source, lock, or credential was modified by this evaluation.

## Metadata

| Field          | Value                                                                               |
| -------------- | ----------------------------------------------------------------------------------- |
| Run ID         | `orch-divybot-750--worker-traces`                                                    |
| Target         | `#2393` worker/trigger delivery trace isolation; PR `#2399`; inbox `rickylabs/harness#750` |
| Source head    | `cd244c24a420f2fa5677967de4b755b192f1e1b9` (= PR `headRefOid`), base `a833dfa8a3095bb6434cf7ae8bf24f954cf2f1bd` |
| Archetype      | 2 (telemetry integration), 3 (worker runtime), 5 (triggers plugin)                   |
| Scope overlays | service (runtime) — no frontend, no docs overlay                                     |
| Evaluator      | Claude **Opus 5** (`claude-opus-5`), **Anthropic** family, effort **xhigh**, session `0faa9365-3561-462c-96f1-45c3216cd292`, 2026-10-18 |
| Generator      | Codex (**OpenAI** family), `sol`/`xhigh`, separate session — vendor-family independence satisfied |
| Evaluator route | Feature-tier declared fallback. Primary `muse_spark_1_3`/xhigh was not allowance-provable (`paid openrouter route requires --usage-snapshot`); no spend attempted. Fallback `opus_5`/xhigh selected and observed. |

### Source identity verification

The eight-file manifest in `receipts/source-manifest.json` was re-verified by recomputing SHA-256
over each path: **all eight digests match**, the manifest contains no extra or missing entry, and
`git diff cd244c24a` over those paths is empty. No source changed since my S1 sign-off.

| File | Digest matches manifest |
| --- | --- |
| `packages/telemetry/README.md` | yes (`ec264ee3…`) |
| `packages/telemetry/src/context/message.ts` | yes (`c0ac968b…`) |
| `packages/telemetry/src/context/w3c.ts` | yes (`30b0bdd6…`) |
| `packages/telemetry/tests/context/message-parenting_test.ts` | yes (`9c6e6f72…`) |
| `packages/telemetry/tests/instrumentation/queue-parenting_test.ts` | yes (`58947b7c…`) |
| `plugins/triggers/src/runtime/trigger-runtime-parenting_test.ts` | yes (`361db3fe…`) |
| `plugins/triggers/src/runtime/trigger-runtime-processor.ts` | yes (`f4433047…`) |
| `plugins/workers/worker/job-dispatcher_test.ts` | yes (`8e529b14…`) |

**Receipt provenance (stated precisely, not glossed).** The last source edits are stamped 11:07;
`check`/`lint`/`fmt`/`suites`/`quality` receipts are stamped 11:07, the manifest 11:08, and the
final smoke started 11:11 — so every receipt covers the final content. Receipts produced before the
sign-off commit record `gitHead: 5d527f05e` because the content was still uncommitted at that
moment; the manifest pins the content, and that content is byte-identical to `cd244c24a`. The
failing runtime step's own receipt records `gitHead`/`actualGitHead` = `cd244c24a`.

## Process Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Plan-Gate passed before implementation | `PASS` | `plan.md` records `PLAN-EVAL: N/A` with justification **before** implementation (bounded correction to three existing ingress fallback paths; no new public API, data model, lifecycle, delivery contract, persistence or dependency decision). I independently agreed at S1 and still do. |
| Design section exists in worklog | `PASS` | `worklog.md` → `## Design`, 7 numbered items (surface, vocabulary, ports, constants, commit slices, deferred, contributor path). |
| Commit slices match design plan | `PASS` | Design item 5 names bootstrap → S1 → S2. Commits: `5d527f05e` (bootstrap/plan) then `cd244c24a` (S1 ingress isolation + regressions + docs + run evidence). S2 is evaluation only and adds no source. |
| Each slice has a passing gate | `PASS` | Bootstrap: docs only. S1: see Static/Fitness tables below, all green. |
| No speculative seams (unused files) | `PASS` | No new source file, no new export, no new dependency. Two new files are tests, both executed in my independent run. |
| Constants used for finite vocabularies | `PASS` | Upstream `ROOT_CONTEXT`, existing `SpanNames`/`SpanKind`/status conventions reused. The one magic literal I flagged at S1 (`'b7ad6b7169203331'`) is now the shared `MESSAGE_PARENT_ID` constant (`job-dispatcher_test.ts:48`). |
| Agent briefs carry a `## SKILL` chapter | `PASS` | `slice-review-prompt.md`, `slice-signoff-prompt.md`, `final-eval-prompt.md` each contain exactly one `## SKILL` chapter. (`pr-body.md`/`impl-comment.md` are PR artifacts — exempt per protocol rule 13.) |
| Evaluator independence maintained across rounds | `PASS` | Same Anthropic session `0faa9365-…` for preflight, S1 review, S1 sign-off and this IMPL-EVAL; generator is OpenAI. Supervisor-triggered, not self-dispatched. |

## Static Gates

| Gate | Command or check | Result | Evidence | Notes |
| --- | --- | --- | --- | --- |
| Narrow typecheck | `run-deno-check.ts --unstable-kv` | `PASS` | `receipts/check.json` — 143 files, 0 occurrences | |
| Slice typecheck | covered by the same selection | `PASS` | `receipts/check.json` | |
| Format | `run-deno-fmt.ts --ext ts,tsx` | `PASS` | `receipts/fmt.json` — 122 files, 0 findings | Repo `fmt.include` is `packages/**` + `plugins/**` `.ts`/`.tsx`; Markdown is outside the formatter's configured scope (this corrects my own S1 finding F1, see Findings). |
| Lint | `run-deno-lint.ts --ext ts,tsx` | `PASS` | `receipts/lint.json` — 122 files, 0 findings; my own independent re-run: telemetry 112 files / 0, triggers 78 files / 0 | |
| Doc lint (command) | full-export-map doc lint wrapper | **`FAIL`** | wrapper **exit 1** for both packages: telemetry 7 errors, triggers 27 errors | **Pre-existing and unchanged.** The command does not pass today and did not pass at `a833dfa8`; this change neither caused nor repaired it. |
| Doc lint (regression comparison) | current findings vs baseline `a833dfa8` | `PASS` | `receipts/doc-lint-baseline.json`: telemetry current 7 / baseline 7 (6 private-type-ref + 1 missing-JSDoc); triggers current 27 / baseline 27 (27 private-type-ref) | Findings are **identical** to baseline — no doc debt introduced or deepened. |
| Publish dry-run | `publish:dry-run --member packages/telemetry` / `--member plugins/triggers` | `PASS` | `publish-telemetry.log`, `publish-triggers.log` — both `Success Dry run complete` | |
| Link/path check | eight manifest paths + run-artifact links in PR body | `PASS` | digests re-verified; PR body links resolve to `cd244c24a` blobs | |
| Lock hygiene | `deps:check` chain inside `arch:check` | `PASS` | `deno.lock` unmodified in `cd244c24a`; reference-locks, JSR centralization, file-link audit, npm catalog, private-lock workspace, zod and db alignment all green (`quality.log`) | Both npm specifiers used by new tests were already resolved in the lock. |

## Fitness Gates

Evidence base: `deno task quality:gate` = `quality:scan` + `arch:check` (`deps:check` +
`check-doctrine.ts --all-roots`), receipt `quality-receipt.json`, `outcome: PASS`, `exitCode: 0`.
Doctrine readiness reports **`FAIL=0` for every package**, including telemetry, triggers, workers,
plugin-triggers-core and plugin-workers-core. **No changed file appears in any WARN or INFO line.**

| Gate | Function | Result | Evidence | Violations |
| --- | --- | --- | --- | --- |
| F-1 | File-size lint | `PASS` | telemetry `FAIL=0 WARN=5`, triggers `FAIL=0 WARN=13`, workers `FAIL=0 WARN=11`; no changed file named | none (see low finding L-2 on test growth) |
| F-2 | Helper-reinvention scan | `PASS` | uses upstream `ROOT_CONTEXT`; the triggers path **removes** a bespoke extraction branch in favour of the shared `resolveParentContextFromHeaders` | none |
| F-3 | Layering check | `PASS` | plugin imports the facade `@netscript/telemetry/context`, no deep `src/` import | none |
| F-4 | Inheritance audit | `N/A` | no class added or modified | — |
| F-5 | Public surface audit | `PASS` | no symbol added or removed; only documented behaviour changed, recorded in `release-note.md` and the PR body | none |
| F-6 | JSR publishability gate | `PASS` | both publish dry runs succeed | none |
| F-7 | Doc-score gate | **`FAIL`** | doc-lint wrapper exits 1 (telemetry 7, triggers 27) — **pre-existing and identical to baseline**; see the two Doc lint rows above | none introduced or deepened by this change |
| F-8 | Workspace `lib` override check | `N/A` | no member config touched | — |
| F-9 | Permission declaration check | `N/A` | no new runtime permission; tests run under the suite's existing `--allow-all` | — |
| F-10 | Test-shape audit | `PASS` | new tests drive real production entry points under a real `AsyncLocalStorageContextManager` and SDK exporter, asserting parent span ids — not mocks of the unit under test | none |
| F-11 | Forbidden-folder lint | `N/A` | no new folder; `tests/context` and `tests/instrumentation` already existed | — |
| F-12 | Naming-convention lint | `PASS` | `*_test.ts` convention; relative test imports match `370b70d29` | none |
| F-13 | Saga and runtime invariants | `PASS` | saga parent handling re-verified; `packages/plugin-sagas-core/tests` green in my independent run | none |
| F-14 | Console-log lint | `PASS` | no `console.*` added to source (diff grep) | none |
| F-15 | Re-export-of-upstream lint | `PASS` | `ROOT_CONTEXT` imported, never re-exported | none |
| F-16 | Folder-cardinality lint | `PASS` | existing telemetry/triggers/workers WARNs unchanged; no file added to a flagged directory | none |
| F-17 | Abstract-derived co-location lint | `N/A` | no abstract types involved | — |
| F-18 | Sub-barrel lint | `N/A` | no barrel added | — |
| F-19 | Scoped source gate runners | `PASS` | every verdict used `.llm/tools/run-deno-*.ts` wrappers or `run-gate.ts` receipts; no raw-CLI verdict claimed | none |

## Runtime Gates

| Gate | Validation | Result | Evidence |
| --- | --- | --- | --- |
| `scaffold.runtime` (full `e2e:cli` merge-readiness smoke) | `deno task e2e:cli run scaffold.runtime --cleanup` | **`FAIL`** | `e2e-final.json` / `e2e-final.log`: `ok: false`, `passed=50 failed=1 skipped=0`, duration 580216 ms; toolchain Deno 2.9.7, .NET SDK 10.0.400, Aspire 13.5.3, Docker server 28.5.2 |
| └ `runtime.aspire-start` | Start generated Aspire AppHost and converge 11 resources | **`FAIL`** | critical step, `failureClass: assertion`, `exitCode 1`, 309934 ms, receipt `gitHead = cd244c24a`. `aspire describe --follow did not converge: timed out after 300s` |
| └ worker/saga/trigger `/health` readiness tier (`state: ready`, `registryReady`, `dependencyReady`) | per-child readiness assertions | **`NOT_RUN`** | the AppHost never converged, so `workers`, `workers-api`, `sagas`, `sagas-api`, `triggers`, `triggers-api`, `auth` stayed `state=Waiting` and never started |
| └ `streams` `/health/ready` | HTTP 200 `ready: true` | **`NOT_RUN`** | same cause |
| └ `cleanup.aspire-stop` | Stop generated AppHost | `PASS` | passed in 1962 ms after the failure |
| Run-owned resource hygiene | read-only leak reporter | `PASS` | `leak-check-final.log`: zero proven run-owned survivors; foreign/unknown-owner resources left untouched |
| 49 preceding runtime/scaffold/behaviour steps | scaffold, plugin add, registries, DB codegen, generated workspace check/lint/fmt, in-process behaviour gates, `runtime.aspire-restore`, fixtures | `PASS` | `e2e-final.log` step list |

### Precise cause of the runtime failure

Unconverged resources, from the step's own stderr and `e2e-final-health.json`:

- `postgres`: `state=Running`, `healthStatus=Unhealthy` — `postgres_listener` "listener unreachable:
  ECONNREFUSED", `postgres_check` "Failed to connect to 127.0.0.1:28698", `postgres_auth`
  "ECONNREFUSED at localhost:28698".
- `garnet`: `state=Running`, `garnet_resp` "RESP listener unhealthy: ETIMEDOUT at localhost:42467".
- `workers`, `workers-api`, `sagas`, `sagas-api`, `triggers`, `triggers-api`, `auth`: `state=Waiting`
  — blocked on those dependencies, never started.

**Evidence explicitly excluded.** `docker-reachability.jsonl` (port 16233, both
`ConnectionRefused`) is **not** cited here and forms no part of this verdict. It was captured
*after* cleanup of the earlier Deno 2.9.5 debug run, against a port that was already closed by
then, so it says nothing about live reachability during the final pinned run. The cause below rests
only on the final run's own live health snapshot (`e2e-final-health.json`) and its own step receipt
in `e2e-final.json`, which are sufficient on their own. Removing it does not weaken the runtime
block.

**The containers start; their published ports are not reachable by the probes.** The decisive
discriminator is internal to the final run's health snapshot: the suite's *in-process* fixture
listeners `test_only_postgres_listener` (localhost:18998) and `test_only_garnet_resp`
(localhost:18999) are **Healthy**, while every *container* listener is not — the allocated database
port 28698 is refused and the cache RESP probe times out at 42467. In-process loopback works;
container port publication is not visible to the probes. `preflight.aspire`,
`runtime.aspire-restore` and all 49 earlier steps passed, and the failure is probe-level
(`image pull duration unavailable`), not an application error.

**This failure is not attributable to the change, and equally it proves nothing about the change.**
The change touches only OTel context parenting in `packages/telemetry/src/context/` and
`plugins/triggers/src/runtime/`; it contains no container, port, health-probe or Aspire resource
code. No worker, trigger or saga process ever started, so the modified code paths were never
executed by this gate. Runtime acceptance is therefore **UNPROVEN — neither confirmed nor refuted**.
I did not re-run, interrupt, or waive the gate, and I claim no PASS for it.

## Consumer Gates

| Consumer | Validation | Result | Evidence |
| --- | --- | --- | --- |
| Composed affected suites (telemetry, plugin-workers-core, plugin-triggers-core, plugins/workers, plugins/triggers) | `deno test --allow-all` | `PASS` | `receipts/suites.json` — 400 passed, 13 existing ignored, 0 failed, exit 0 |
| Saga / stream / Fresh MCP consumers (author) | targeted suites | `PASS` | `receipts/consumer-tests.json` — 46 passed, 0 failed |
| Targeted parenting suite (**evaluator-run**, pre-repair) | `run-deno-test.ts` | `PASS` | `receipts/reviewer-tests.json` — 34 passed, 0 failed, 0 ignored, exit 0 |
| Blast-radius suite (**evaluator-run**: workers-core streams, telemetry w3c, saga-core) | `run-deno-test.ts` | `PASS` | `receipts/reviewer-tests-streams.json` — 144 passed, 0 failed, 4 existing ignored, exit 0 |
| Targeted parenting suite (**evaluator-run**, post-repair, on this exact head) | `run-deno-test.ts` | `PASS` | `receipts/reviewer-tests-repair.json` — 34 passed, 0 failed, 0 ignored, exit 0 |
| `createStreamMutationHook` (workers-core streams producer) | executions without a stored traceparent now publish under a root | `PASS` | covered by the blast-radius run; consequence recorded in `drift.md` |
| `otel-saga-telemetry` malformed parent carrier | roots instead of adopting ambient; valid parents unaffected | `PASS` | covered by the blast-radius run; recorded in `drift.md` |
| Subprocess continuation (#2136) | active span still wins over message headers | `PASS` | `resolveSubprocessTraceHeaders` untouched; existing dispatcher assertion still passes |
| Trigger inbound continuation (#405) | ingress/detect/process share the inbound trace | `PASS` | pre-existing regression test unchanged and green |

No broad suite was re-run for this evaluation: source is byte-identical to the head I already tested
after the repair, and no new source concern arose.

## Anti-Pattern Check

| AP | Status | Evidence | Notes |
| --- | --- | --- | --- |
| AP-1 | `CLEAR` | doctrine readiness `FAIL=0`; no changed file in any `A8/AP-1/F-1` WARN | source files 248 / 34 / 398 lines; see L-2 |
| AP-2 | `CLEAR` | upstream `ROOT_CONTEXT` used directly; a bespoke branch was removed | |
| AP-3 | `N/A` | no port or interface changed | |
| AP-4 | `N/A` | no cross-package inheritance | |
| AP-5 | `N/A` | no abstract chain | |
| AP-6 | `N/A` | no base class | |
| AP-7 | `N/A` | no factory signature changed | |
| AP-8 | `N/A` | no DI container | |
| AP-9 | `CLEAR` | no flag or generic helper added; the triggers path converged onto the existing resolver instead of adding one | |
| AP-10 | `N/A` | no handler try/catch added; the trigger `#runSpan` boundary is pre-existing and unchanged | |
| AP-11 | `CLEAR` | no module-load state added; tests set and restore global OTel state inside `try/finally` | |
| AP-12 | `N/A` | no time or scheduling code touched | |
| AP-13 | `CLEAR` | no `console.*` added to source (diff grep) | |
| AP-14 | `CLEAR` | `ROOT_CONTEXT` imported, not re-exported | |
| AP-15 | `N/A` | no new type names | |
| AP-16 | `N/A` | no new folder | |
| AP-17 | `N/A` | no `interfaces/` folder | |
| AP-18 | `CLEAR` | new tests assert semantic parent/trace relationships, not snapshots | |
| AP-19 | `N/A` | no permission change | |
| AP-20 | `N/A` | no member `compilerOptions.lib` touched | |
| AP-21 | `N/A` | no command surface touched | |
| AP-22 | `N/A` | no barrel added | |
| AP-23 | `N/A` | no composition root touched | |
| AP-24 | `N/A` | no switch over a tagged union added | |
| AP-25 | `CLEAR` | no `Deno.*` / `console.*` / `fetch` / `Date.now` / `setTimeout` added to source | |

## Arch-Debt Delta

| Metric | Count | Evidence |
| --- | --- | --- |
| New entries | 0 | `.llm/harness/debt/arch-debt.md` unchanged vs `a833dfa8`; no doctrine FAIL introduced |
| Resolved entries | 0 | none claimed |
| Deepened violations | 0 | doc-lint identical (7 / 27); no changed file in any doctrine WARN; existing F-16/F-5/F-6 WARNs untouched |
| Unrecorded violations | 0 | `FAIL=0` across all packages; the two out-of-plan consumer consequences are recorded in `drift.md` |

Debt handling is valid, so `FAIL_DEBT` does not apply.

## Findings

| Severity | Finding | Evidence | Required action |
| --- | --- | --- | --- |
| high | Mandatory runtime gate `scaffold.runtime` is red and its readiness tier never executed. Runtime acceptance of the change is unproven. Cause is runner infrastructure: the allocated container ports for the database and cache are unreachable by the health probes, so dependent services stayed `Waiting`. | `e2e-final.json` (`ok:false`, 50/1/0) and its `runtime.aspire-start` receipt (`gitHead cd244c24a`); `e2e-final-health.json` live snapshot — DB 28698 refused, cache RESP 42467 timed out, in-process fixtures 18998/18999 Healthy. (`docker-reachability.jsonl` is excluded — post-cleanup capture of a closed port from the earlier 2.9.5 debug run.) | Fix the runner's container port reachability, then re-run the full smoke on this exact head. **Not a source fix.** |
| low | L-1 **Addressed.** PR body previously read "50 gates passed before service convergence timed out"; corrected to 50 passes **total** including cleanup, 49 before the failure. | `e2e-final.log` step order | None — closed. |
| low | L-2 `plugins/workers/worker/job-dispatcher_test.ts` grew 928 → 985 lines, which is over the 500-line general cap for source `.ts` files; `trigger-runtime-parenting_test.ts` grew 221 → 302 and is **under** the cap. The source gate excludes test files from the size check, so the doctrine checker flags neither, and **no doctrine violation is asserted here** — consistent with "deepened violations = 0" above. | `wc -l`; absence from `quality.log` WARNs | None required. Optional: split the dispatcher test by concern in a future slice. |
| low | L-3 **Addressed at handoff.** Issue `#2393` carried `status:impl` while PR `#2399` carries `status:impl-eval`; the issue is being aligned to `status:impl-eval`. | `gh issue view 2393`, `gh pr view 2399` | None — closed at handoff. |

**No new code defect was found.** The findings above are, in order, environmental (high), editorial
(closed), a size observation that asserts no violation, and bookkeeping (closed at handoff).

### Close gate (protocol rule 12)

`NOT SATISFIED` — correctly so. The PR's Definition-of-Done has two unchecked items ("Full
`scaffold.runtime` acceptance passes", "Final separate-family implementation evaluation recorded").
`#2393` has no acceptance checkboxes and no `gate:` label, so that clause is vacuous, but the
incomplete DoD alone blocks `status:ready-merge` and any merge carrying `Closes #2393`. The PR
correctly holds `status:impl-eval` (exactly one `status:` label), milestone `0.0.9`, `type:fix`,
`area:telemetry`, `area:plugins`, `priority:p1`, with `Closes #2393` present in the body for the
eventual merge. `check:review-threads` → `PASS`, 0 threads, 0 unanswered.

### Release-gate class (protocol rule 14)

`N/A` — this is a fix run on milestone `0.0.9`, not a release cut or release-gating run. The
`scaffold.runtime` gate is nonetheless evaluated above as the mandatory merge-readiness runtime gate
required by `AGENTS.md`.

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| --- | --- | --- | --- |
| Inbound extraction must be seeded from `ROOT_CONTEXT`, never `context.active()` | A message boundary and a local span boundary have different parenting rules; seeding a propagator with ambient context lets a no-op propagator mask valid headers and lets invalid carriers inherit a long-lived span | 2 (integration), 3 (runtime), 5 (plugin) | high |
| Prove isolation with a real context manager and SDK exporter, asserting parent **span ids**, not just distinct trace ids | Distinct trace ids alone cannot distinguish correct rooting from a broken parent chain; include a concurrent batch and a failed-then-successful delivery | 2, 3, 5 | high |
| Preserve the whole `tracestate` list — commas are vendor-entry separators, not duplicate-header joins | Split-on-comma normalization is correct for `traceparent` only | 2 | medium |
| Separate "gate failed" from "gate proved the change wrong" | When a runtime gate dies before reaching the changed code path, record UNPROVEN and name the infrastructure cause; do not convert source correctness into a readiness PASS, and do not blame the change | all | high |
| Check a formatter's configured `include` set before reporting format drift | Naming a file explicitly on the `deno fmt` command line bypasses `deno.json` scope and manufactures findings the repo does not gate on | all | medium |

## Verdict

| Field | Value |
| --- | --- |
| Verdict | **`FAIL_FIX`** |
| Rationale | The approved plan is valid and fully implemented, and the source is accepted: typecheck, lint, format, publish dry-run, lock-hygiene, every fitness gate and every consumer gate pass with evidence; the doc-lint **command** exits 1 but is pre-existing and byte-for-byte unchanged against baseline, so it introduces no new debt and blocks nothing here; two independent evaluator test runs on this exact head are green; and no code defect was found. `PASS` additionally requires that "required runtime and consumer gates have evidence" — the mandatory `scaffold.runtime` gate is red (`passed=50 failed=1`) and its worker/trigger readiness tier never ran, so runtime acceptance is unproven. "A required gate fails" is the defining `FAIL_FIX` case. It is **not** `FAIL_RESCOPE`: the plan and archetypes are right and no new scope is needed — only the runner's container port reachability must be repaired and the smoke re-run. It is **not** `FAIL_DEBT`: debt bookkeeping is clean. |

### What this verdict does and does not authorise

- **Accepted:** the functional source change at `cd244c24a`. It is suitable for human review now.
- **Supported:** keeping PR `#2399` open and out of draft for review with `status:impl-eval`
  retained and the full-runtime DoD item unchecked, per the owner's standing requirement that
  finished work must not sit in draft. Ready-for-review is not a merge-readiness certification.
- **Not authorised:** `status:ready-merge`, any merge-ready label, closing `#2393`, any "full
  acceptance" or "all gates green" claim, and any waiver or weakening of the runtime gate or its
  tests.

### Remaining work

1. Repair the runner's container port reachability (postgres/garnet published ports invisible to
   loopback probes under the remote DinD daemon), then re-run
   `deno task e2e:cli run scaffold.runtime --cleanup` on this exact head and attach the raw exit code.
2. Re-steer this same evaluator session for the follow-up verdict once that gate terminates.
   **Loop budget — the dispatcher-supplied leaf's stricter stop rule governs: two consecutive
   terminal evaluator failures end this leaf's evaluation loop.** The feature-row matrix allowance
   (maximum five, notify after three) is only an outer ceiling and does **not** license overriding
   that user-supplied boundary. This is the **first** terminal IMPL-EVAL failure; the preceding S1
   review and S1 sign-off both passed, so no consecutive-failure streak exists. Documentary
   corrections to this record — including the present one — do not consume a cycle. One further
   terminal failure would close the leaf's loop and require owner escalation rather than another
   re-steer.
3. Then, and only then: tick both DoD items, move `#2399` to `status:ready-merge`, align `#2393`'s
   `status:` label, and let the `Closes #2393` keyword close the issue on merge.
4. Optional: L-1 PR wording, L-2 test-file size, L-3 issue label.

---

## Documentary correction log

2026-10-18, same evaluator session `0faa9365-3561-462c-96f1-45c3216cd292` (Opus 5 / Anthropic /
xhigh). This pass edited **only this file**. No source, gate, scope or evidence changed; no gate was
re-run; no commit, push or GitHub mutation was made. The `FAIL_FIX` verdict, the acceptance of the
functional source change, the unproven-runtime block and the whole source review stand unaltered.

1. **`docker-reachability.jsonl` withdrawn as evidence.** It was captured after cleanup of the
   earlier Deno 2.9.5 debug run, against port 16233 which was already closed, so it is not evidence
   of live reachability during the final pinned run. It is now explicitly excluded in the cause
   section and in the high finding. The cause rests on the final run's own live health snapshot and
   step receipt, which are sufficient; the runtime block is unchanged in force.
2. **Doc lint split into command and comparison.** The wrapper exits **1** (telemetry 7, triggers
   27), so the command row and fitness row F-7 are now `FAIL`, marked pre-existing and unchanged;
   the regression comparison against `a833dfa8` remains `PASS`. Blanket "every static gate passes"
   wording was removed from the rationale. The no-new-debt and source-accepted judgements are
   unaffected, and this correction asserts no new blocker and no source defect.
3. **L-2 corrected.** Only `job-dispatcher_test.ts` (928 → 985) exceeds the 500-line cap;
   `trigger-runtime-parenting_test.ts` is 302 and under it. Restated as an optional size
   observation consistent with the source gate's test-file exclusions, asserting no doctrine
   violation, so it no longer conflicts with "deepened violations = 0".
4. **Loop budget corrected.** The dispatcher-supplied leaf's stricter stop rule governs — two
   consecutive terminal evaluator failures end this leaf's loop; the feature-row five/three
   allowance is only an outer ceiling. This is the first terminal IMPL-EVAL failure (S1 review and
   S1 sign-off both passed), and documentary edits do not consume a cycle.
5. **L-1 and L-3 recorded as addressed**: the PR now states 50 passes total including cleanup (49
   before the failure), and `#2393` is being aligned to `status:impl-eval` at handoff.

Unchanged by this pass: the full-runtime DoD item stays unchecked and `status:ready-merge` remains
prohibited until the `scaffold.runtime` gate passes on this exact head.
