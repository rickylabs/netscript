# Drift — release 0.0.7 fixes topic

No implementation or scope drift is accepted.

## 2026-08-15 reset reconciliation — no drift found

The Claude replacement topic orchestrator verified both leaf worktrees, both draft PR heads
(`gh pr view 1643/1654 --json headRefOid,state,isDraft,mergeable`), and local `git log`/`git
status` against coordinator `briefs/reset-gates/dispatch.json` and this session's exact brief.
Legacy leaf head `e6ba15ec6414c0a42b1f9870791131162ea71c36` (dispatch order 2) and scaffold leaf
head `14d8b38b4db7ba0635cbbcac2f8cd8903bee0ec9` (dispatch order 5) match exactly; both worktrees
are clean; both PRs are open/mergeable at those heads. No fact differs from the central dispatch
set, so nothing is reported to the coordinator as drift.

Re-verified at `2026-08-14T22:56:20Z` by the Opus 5 / high controller, extended with: both leaf
Codex threads idle at `task_complete`; no process owns either leaf worktree; PR label state is a
single `status:` each (#1643 `status:impl`, #1654 `status:plan-eval`); `mergeStateStatus` is `CLEAN`
on both; `origin/main` still `01e096049`; topic branch already pushed at `0aa64fe44`; zero Docker
containers; Codex daemon `0.147.0` running and managed with an intact control socket.

## Corrected — this lane's own record named the rejected Sonnet 5 route

Not upstream drift: a stale local record. The 2026-08-15 reset section of `supervisor.md`, the
reset row in `worklog.md`, and both `leaf-registry.md` state cells recorded this lane's replacement
controller as `native Claude · Sonnet 5 · low` and its two evaluator gates as Sonnet 5 low/medium.
That is the owner-rejected model-floor canary, which exited `TOPIC_CONTROLLER_PARKED_MODEL_FLOOR`
without dispatching anything. The authoritative values are the coordinator's:
`milestone-cluster-state.json` lane `fixes` (`requestedModel: claude-opus-5`,
`requestedEffort: high`, `remoteControlRequired: true`) and `dispatch.json` orders 2 and 5
(`Claude Opus 5` low and medium). All four topic-local artifacts were corrected to those values in
this turn. No leaf, PR, or coordinator artifact was touched.

## Observed — dispatch effort is below the rendered lane-policy pairing, and is authorized

`lane-policy.md` renders `review_codex_light` (paired to a `light_implementation` Sol · low slice)
as **Opus 5 · high**, and `formal_impl_evaluation` as Fable 5 · medium for Codex-authored work.
`dispatch.json` order 2 instead assigns **Opus 5 · low** for #1643, and order 5 assigns
**Opus 5 · medium** for #1654 in place of the Fable PLAN-EVAL route. Both are covered by the
`ownerOverride` recorded in `dispatch.json` at `2026-08-14T22:41:15Z`
(`evaluationDefault: native Claude Opus 5 / low through high; low only for genuinely easy bounded
review`; `fablePolicy: reserve Fable 5 for recorded genuinely architectural PLAN questions or
exceptional complex implementation review`), which explicitly supersedes the prior matrices. This
lane follows `dispatch.json` exactly and records the deviation so it is not later misread as an
unauthorized substitution. The opposite-family and fresh-session invariants are unaffected: both
gates evaluate Codex-authored work from a fresh Claude session that is not the generator.

## Observed metadata inconsistency (non-blocking for this lane)

The frozen dependency DAG node for #1360 still says `lane: fixes`, while the approved plan, topic
issue allocation, leaf contract, and grouped `app-service-client-wiring` leaf assign #1360 to
`features`. The fixes authority list excludes #1360, so this topic leaves it untouched and does not
mutate central state. The coordinator should reconcile the generated DAG metadata when it next owns
a central state transition.

Re-verified `2026-08-14T22:56:20Z`: `milestone-dependency-dag.json` node `issue:1360` still carries
`"lane": "fixes"`, `milestone-leaf-plan.json` still groups #1360 with #1355 under `"lane":
"features"` (wave 1), and `milestone-cluster-state.json` lane `fixes` still lists 26 issues that
exclude #1360. Still non-blocking for this lane; still the coordinator's to reconcile.

## Significant — #1243 contract is stale on current main

The approved `legacy-port-pin-sweep` surface says the manifest and official-copy fixture pins are
dead/mechanically removable. The first focused structured test proved the shared manifest schema
still requires `backgroundPort`, atomically validates the service triple, and official-copy
compatibility consumes the values. The viable fail-loud CLI change also requires
`auth-plugin-command_test.ts`, which is outside the contract. No product change was committed;
draft PR #1643 is clean/paused at `f3cf40909`. Coordinator replacement-contract or disposition
authority is required before the same thread resumes.

## Significant — scaffold generator seams omitted from frozen contract

The grouped scaffold leaf reproduced the three approved behavior gaps, except that current main
already projects OpenAPI 404 responses for the #1263 operations. That stale sub-symptom is handled
by the approved regression-test fallback; runtime not-found behavior remains red. The bounded
implementation needs `generate-prisma-config.ts` to select provider-specific helper fragments and
needs `scaffolder.ts` plus a new `generate-database-seed.ts` seam to emit model-aware or explicit
empty-schema seed output. Those generator surfaces are absent from the frozen contract. No product
change was committed; draft PR #1654 is clean/paused at `42572af32`. A coordinator amendment and a
separate PLAN-EVAL are required before implementation resumes.

## Significant — #1358 leaf contract amended for Tier-A finding T-3

Coordinator disposition recorded by `topic-fixes-0.0.7` at leaf head
`5fe60023530d89b888a028d5269909636ac03b8a`; leaf-local record committed at `c5e06661b`.

Tier-A `CHANGES_REQUESTED` on PR #1657 found that the landed drift gate never runs on CLI-side
edits: `registry-doc-drift.test.ts` executes only through `.github/workflows/fresh-ui-quality.yml`,
whose `paths:` filters exclude `packages/cli/src/kernel/assets/app/routes/(design)/**`; `ci.yml`
never references `fresh-ui`; `ci-classify-changes.ts` sets `freshUi` only for `packages/fresh-ui/`
paths; and `packages/fresh-ui` is outside the root workspace, so the root `deno task test` cannot
compensate. A later template-only edit would re-introduce the 50-of-66 drift with no CI signal.

Issue #1358's acceptance carries that requirement as a **close-gated** `gate:` box, and PR #1657
carries `Closes #1358`. The coordinator explicitly declined to weaken the box, re-scope it, drop the
closing keyword, or defer a knowingly false CI surface, and instead amended the frozen contract with
exactly three files: `.github/workflows/fresh-ui-quality.yml`, `.github/scripts/ci-classify-changes.ts`,
and `.github/scripts/ci-classify-changes.test.ts`.

The original four product surfaces, the locks, the issue closing semantics, the draft/`status:impl`
lifecycle, and all prior evidence are preserved. The repair is bounded to CI-ownership wiring plus
focused positive/negative classifier tests proving a CLI design-only diff requests the Fresh UI gate
**without** broadening unrelated CLI diffs. Gates are proportional — cheap classifier/workflow
structure tests plus the existing drift/check/quality/arch set; `fresh-browser`, Aspire, Docker and
any expensive lease remain out of scope, and the consumed lease's `PASS` receipt at product head
`4a3c40321` stays valid because the repair changes no product file.

## Significant — #1358 leaf contract amended a second time for IMPL-EVAL finding E-1

Coordinator disposition recorded by `topic-fixes-0.0.7` at leaf head `ca8773f66`; leaf-local record
committed at `c3ccceeb1`.

IMPL-EVAL cycle 1 returned `FAIL_FIX` on E-1: the leaf repaired the source template but never
regenerated `packages/cli/src/kernel/assets/embedded.generated.ts`, the only content source
`TemplateRegistry` reads (`hydrate()` is a no-op, no disk fallback). Independently confirmed — the
file is absent from the whole product diff, still carries `total: 50`, has **zero** `citation-chip`
occurrences, and `check:assets-barrel` exits 1 — so `netscript init` still scaffolds a gallery
rendering "All 50 items" with the AI collection hidden. Secondary E-2: `assets-barrel` was absent
from `provingGates` and never run by any lane, which is why the staleness survived every green gate.

The contract is amended with **exactly one generated product path**,
`packages/cli/src/kernel/assets/embedded.generated.ts`, plus append-only run artifacts recording the
amendment and its proof. `check:assets-barrel` is bound into the validation plan with raw exit and
structured receipt required. The regenerated delta is retained only if it is exactly
`gen:assets-barrel` output with no other generated target moving; expected shape is one file, one
line.

No Aspire, Docker, browser, scaffold-runtime, or E2E rerun: the leased `fresh-browser` product
surface is byte-identical and this repair only synchronizes its embedded representation, so the
receipt at product head `4a3c40321` stays valid.

**Supervisor boundary self-report.** Verifying E-1 required `deno task check:assets-barrel`, whose
`gen:assets-barrel` half mutates the tree; that left the barrel modified in the leaf working tree.
It was reverted with `git checkout --` before dispatch and the tree re-verified clean at
`ca8773f66` with the barrel back to `total: 50`, so the repair delta is authored by the Codex leaf
and not by this supervisor. Recorded because a supervisor-authored product change would breach the
supervise-only law even when the content is deterministic.

## Non-formal efficiency correction — T-3 CI expansion reverted after cycle-2 G-1

Recorded by `topic-fixes-0.0.7` on coordinator disposition; leaf-local record at `ab78faac5`.
**Formal IMPL-EVAL cycle 2 `PASS` at `3d7819203f59e68eb5b45f6871a03c41ca43cd2f` stands unchanged and
final. This is not a formal cycle and there is no cycle 3.**

Cycle-2 finding **G-1**, independently re-verified by this orchestrator: root `deno.json` declares
`workspace: ["packages/*", …]`, which **does** match `packages/fresh-ui`; the earlier "not in the
root workspace" claim came from filtering workspace entries for the literal string `fresh`, which a
glob does not contain. Running the root `deno test` with a filter reaches
`registry-doc-drift.test.ts` and passes (1 passed, exit 0), and the classifier sets
`needsDeno = true` for both the manifest and the CLI design-asset template under `ci.yml`'s required
`check-test` job. **#1358's close-gated requirement was therefore already satisfied before the T-3
amendment existed**, and `fresh-ui-quality.yml` has no test step, so the wiring added zero
drift-gate coverage and only duplicated check/lint work.

Disposition: return exactly `.github/workflows/fresh-ui-quality.yml`,
`.github/scripts/ci-classify-changes.ts`, and `.github/scripts/ci-classify-changes.test.ts` to
current `origin/main` bytes (`e090f894ff3682405a36e4f896ffd2cc16f9a1f8`); retain all core #1358
product, gate, and barrel work; append truthful journal corrections for T-3/G-1 and G-2. **G-2**:
the inherited `fresh-browser` receipt is the form-navigation regression and never rendered the
gallery; static consumer evidence (decoded barrel + drift gate) is accepted. No browser, Aspire,
Docker, scaffold, or E2E run.

### Orchestrator accountability — a repeated pattern, not an isolated slip

This is the **second** analytical error by this topic orchestrator on this leaf, with the same root
cause both times: **concluding from a narrow probe instead of executing the check.**

1. **E-1** — verified template↔manifest semantics exhaustively but never asked whether the template
   is what ships; the shipped barrel still read `total: 50`. Caught by formal IMPL-EVAL cycle 1.
2. **G-1** — filtered workspace globs for a substring and concluded `packages/fresh-ui` was outside
   the root workspace; it is not. That false negative drove a blocking Tier-A finding, a coordinator
   contract amendment, an implementation slice, and now a revert. Caught by formal IMPL-EVAL cycle 2.

Both were caught by formal evaluation, which is the gate working as designed. The cost, however,
landed on the lane: a supervisor whose probes are weaker than its conclusions manufactures work for
the agents it supervises. Corrective rule adopted for this lane: **execute the check; never infer a
negative from a pattern match** — and when a finding would expand a contract, re-derive its premise
by execution before escalating it.


## Significant — #1448 leaf contract amended by delegated orchestrator authority

Coordinator delegated the ruling to `topic-fixes-0.0.7`. Leaf-local ruling committed at
`e2faaab15`; S0 blocker head `1d4533462a088ad902ac7dd71be88764463fcd5d`.

The leaf's S0 stop was correct — it proved the blocker red-first, committed artifact-only, and
refused to widen its own contract. Verified against the live issue and the code rather than the
report: criteria 1 (RED test), 3 (degraded state **and error**), 8 (**public** I/O-free snapshot)
and 9 (docs) have no authorized surface, and criterion 4 is only partly reachable because
resource-read and close plumb through the shared base transport rather than the TanStack connector
alone.

**Amendment — exactly five files:** `packages/ai/tests/mcp_test.ts`,
`packages/ai/src/ports/mcp-transport.ts`, `packages/ai/src/mcp/adapters/base-transport.ts`,
`packages/ai/mcp.ts`, `packages/ai/README.md`. Explicitly denied: anything outside `packages/ai/**`,
a **new** `deno.json` `exports` entry (reuse `./mcp`), consumer-side EIS-Chat work, and other
packages' surfaces.

**Public contract ruled:** the per-server status snapshot is **synchronous and I/O-free** (the
load-bearing property of criterion 8 — an `async` signature invites the very defect the issue is
about), keyed by `serverId`, carrying state plus the **last error**, reusing `McpConnectionState`
rather than a parallel vocabulary, exposing ready clients alongside, and **additive only** on a
published JSR surface under `isolatedDeclarations`. Cancellable close takes a `signal`-bearing
options bag mirroring `McpConnectOptions`, and **`pool.stop()` must settle per server** — today
`pool.ts:149` is `Promise.all(... t.stop())`, the same all-or-nothing defect as startup, which
leaves criterion 4 unmet while it stands.

**Archetype reconciliation:** the coordinator's Archetype-2 override stands for gate selection, but
because the amendment now touches the public `mcp.ts` entrypoint and the port, the Archetype-4/JSR
obligations on `packages/ai` are **not** waived — `deno doc --lint`, `isolatedDeclarations`, and the
publish dry-run apply to the exported surface. Accepting the archetype override is not accepting a
lighter public-surface bar.

No expensive-gate lease granted.


## Significant — #1448 amendment 2, and a cross-package break the leaf's stop did not catch

Ruled at leaf head `b25ddb2d5`; ruling committed `6db182503`.

Slices 1–2 landed inside contract (RED `70f8dc799`, pool isolation `9c07f5951`); product delta stayed
within the authorized surface, `deno.json` exports and all locks untouched. The leaf then stopped
again before slice 3, correctly: both published transports are **composition** wrappers over
`BaseMcpTransport` (`stdio-transport.ts:46`, `streamable-http-transport.ts:47`) that forward
`listTools`/`callTool` options but declare `stop()` with no options, and both are re-exported from
`./mcp` — so port/base edits alone cannot make the published surface cancellable.

**The stop's enumeration was incomplete, and that is the finding worth recording.**
`grep -rn 'implements McpTransportPort'` returns **six** implementors, not four. One is
`packages/fresh/src/runtime/ai/mcp-app-call-handler_test.ts:15` `FakeMcpTransport` — a **different
package**, denied by Ruling 1, declaring `stop()` and **no `readResource`**. Authorizing only the two
adapter files the leaf asked for would have left a cross-package type break that surfaced at CI.

**Ruling 4:** surface extended to exactly ten files with the two concrete transports, delegation
only. **Ruling 5:** widening `stop(options?)` on the port is assignable and breaks no implementor
(verified against both wrappers and the Fresh double), but `readResource` must be **optional on the
port** and **required + cancellable on the base and both published transports**, so `packages/fresh`
keeps checking green. **Ruling 6:** the leaf's fear that optional-on-port would evade acceptance is
answered behaviorally — the RED test must prove an in-flight `readResource` and `stop` actually
settle on abort through a **published transport path**, not that a method exists or a type compiles.
The author was additionally told to run a cross-package `packages/fresh` check before finishing.

Serial queue preserved; `sdk-cache-surface-and-telemetry` remains queued.


## Observed — #1661 label state differs from the coordinator's reconciliation message

Not leaf drift; a live-state correction recorded before it can propagate.

The coordinator's reconciliation states the PR label is `status:ready-merge`. **It is not.** Verified
twice via `gh pr view 1661 --json labels`: the PR carries **exactly one** `status:` label and it is
**`status:impl-eval`**. Full set: `type:fix`, `status:impl-eval`, `area:ai-core`, `gate:jsr`,
`priority:p1`. Issue #1448 is `status:impl`, as stated.

Everything else in that message reconciles exactly: PR non-draft at `4766b258f`, **0 unchecked boxes
on the PR**, **9/9 checked on #1448 with 0 unchecked**, review threads `0/0`, and `close-gate`,
`quality` and `code-quality` all **pass** at the exact head. `check-test` is **pending**, which is
why `mergeStateStatus` is **`BLOCKED`** rather than `CLEAN`.

**Why the label matters, concretely.** Per `netscript-pr`, merge requires `status:ready-merge`, and
CI's acceptance-evidence **mirror** runs only for that label. The `close-gate` job that passed here
ran while the PR was at `status:impl-eval` — its unchecked-box condition is genuinely satisfied
(0/0), but the lifecycle has not reached the state the merge bar names. Two consequences for the
coordinator, who owns labels in this lane:

1. Setting `status:ready-merge` is required before merge, and must replace `status:impl-eval` —
   exactly one `status:` label at all times.
2. `ci.yml` does **not** listen to `labeled`, so after applying the label the **`close-gate` job
   should be re-run** rather than pushing an empty commit. A push would move the head and invalidate
   the cycle-2 IMPL-EVAL verdict, which is bound to `df05344166` / `4766b258f`.

Recorded so no one merges believing the ready-merge lifecycle already completed.


## Significant — O-3 was a real cross-package regression, not bookkeeping

`check-test` on PR #1661 is a **current failure** (`agentic:pr-checks` → `current-fail`,
`currentFailures=1`; not superseded). Structured receipt from artifact
`ci-check-test-gate-receipts-31878428521-1`: **4151 passed / 1 failed / 14 ignored**, one unique
failure —

```
root-level scaffold runtime imports resolve in both package-source modes
  packages/cli/src/kernel/adapters/plugin/workspace-mutator_test.ts:261
  AssertionError: expected @netscript/ai to compute the @tanstack/ai-mcp runtime specifier
```

Cause: slice 5 replaced the connector's computed constants
(`['@tanstack', '/ai-mcp'].join('')`, present at base `284dda90a`) with literal
`await import('@tanstack/ai-mcp')`. `workspace-mutator_test.ts:306-320` scans the connector's
**source text** for the `[…].join('')` pattern and requires **both** `@tanstack/ai-mcp` and
`@tanstack/ai-mcp/stdio` — the computed form deliberately keeps optional MCP out of the static JSR
import graph so generated projects own runtime resolution.

**Two supervisory failures, recorded plainly:**

1. **Disposition.** IMPL-EVAL cycle 1 raised this as **O-3**, non-blocking, "coordinator awareness;
   a one-line drift entry would make the record complete". This orchestrator accepted that framing
   and required only a drift line. The evaluator's own evidence said the change was "not named in
   either ruling" — that should have prompted *why is it asserted elsewhere?*, not a note. Cycle 2
   inherited the disposition and did not revisit it.
2. **Gate selection.** Tier-A ran the focused MCP suite plus `packages/ai` and `packages/fresh`
   checks — scoped to the packages the delta *touched*. The assertion lives in **`packages/cli`**,
   which the delta does not touch but which asserts on `packages/ai`'s **source text**. A repo-wide
   `deno task test` would have caught it locally; package-scoped gates structurally could not.

**Rule added:** when a change alters a package's *source text* in a way another package may assert
on — specifier construction, export shape, generated-artifact content — package-scoped gates are
insufficient. Run the repo-wide suite, or identify the asserting package and gate it explicitly.

Bounded RED→GREEN repair dispatched to the original author on the same thread, restoring both
computed constants in `tanstack-connector.ts` (already in the ten-file contract), explicitly barring
any weakening of the CLI test, and widening the gate set to include the `packages/cli` check. Because
this is a **post-IMPL-EVAL product mutation**, a fresh Tier-A and a proportionate fresh formal
evaluation of the delta are required before readiness is revisited. Merge remains the coordinator's
decision; the next fixes leaf stays queued.

## 2026-08-15 — codex-resume exit 0 masked an undelivered steering message

- **What:** the #1669 scope-widening amendment was dispatched to author thread
  `01a00646-82a9-7ec2-88e7-16dea98a58fa` and the wrapper **exited 0**, but the message was never
  delivered. The tail of the run output carried
  `thread-store conflict: thread 01a00646-… already has an active writer (code -32600)`.
- **Detection:** the author's next pushed commit `ebf8977c1` was "pin SDK doc-lint baselines" and
  touched only `drift.md`/`plan.md`; `plan.md:189`, `research.md:27`, and PR #1669 body line 50 all
  still read "reported, not silently widened into scope". Grepping the rollout for the brief's own
  heading returned **0**.
- **Why it happened:** the author was still mid-turn. The idle precondition (`ls` of the rollout
  mtime) was run **in the same shell command as the dispatch**, so it raced the very state it was
  meant to gate.
- **Rules adopted:**
  1. `agentic:codex-resume` exit status is **not** delivery proof. Delivery is proven by grepping the
     target rollout for a distinctive phrase from the brief, or by an explicit non-conflict result.
  2. An idle precondition must be evaluated in a **separate command** from the dispatch it gates.
  3. Steering an active thread must retry on `already has an active writer` rather than being
     issued once and assumed landed.
- **Consequence:** none beyond delay — no wrong work was performed, because the undelivered message
  could not cause a scope change. Re-dispatched under a retry loop with rollout-grep delivery proof.

## 2026-08-15 — supervisor brief mis-stated #1350/#1466 metadata ownership

- **What:** the #1350 slice brief asserted "#1350 owns procedure metadata preservation", sourced from a
  checked box in #1348's body.
- **Actual:** #1348's own amendment header states "Stage 0 is accepted; **#1466 owns procedure
  metadata**", #1350's owner comment `5227724542` says that issue "remains focused on the
  `safe()`/literal-preserving error repair" and does not own metadata initialization, and #1466 is
  open as "[sdk-client S2] feat(sdk): define NetScriptProcedureMeta without erasing contract errors".
- **Cause:** a single checked line in a long umbrella body was quoted without reconciling it against
  that same body's normative header, the target issue's own owner comment, or the live sibling child.
  Two statements in one issue described different things — #1466 owns metadata *definition*, #1350
  owns *error preservation* — and the brief compressed them into one wrong claim.
- **Detection:** the leaf author refused to plan against it, recorded the contradiction in
  `research.md:14-21`, and requested a ruling instead of proceeding. Third consecutive time an author
  in this lane has stopped on a real scope/ownership problem rather than widening.
- **Severity:** significant — had it not been caught, this leaf would have defined and exported
  `NetScriptProcedureMeta`, duplicating #1466 and pre-empting the accepted Stage order.
- **Rule:** when a brief asserts ownership, cite the **normative** line, not any matching line, and
  check the target issue's own comments and live sibling issues before asserting it. An umbrella's
  checkbox is a status marker, not an ownership grant.
