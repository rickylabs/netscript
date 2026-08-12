# Drift — 0.0.6 fixes lane

Divergence between plan/doctrine and implementation reality. Recorded explicitly; never silently
absorbed.

## D-1 — OpenHands evaluator transport unavailable at run open

**Recorded:** 2026-08-12, stage A.

The lane brief routes escalated evaluation (MiniMax M3 PLAN, DeepSeek V4 Flash 0731 max small
IMPL, Qwen 3.8 Max broad/complex IMPL) **through OpenHands after #1524 passes/lands**. At run open
#1524 (`fix(agentic): fail closed on open evaluators`) is an **open draft PR**, so that transport
is not available.

**Effect:** the brief's own stated alternative applies — escalation, if any, runs as a fresh local
Claude/OpenCode OpenRouter session with the NetScript toolchain, in a session separate from the
generator. This is a documented fallback, not an unplanned deviation.

**Status:** no escalation has been needed yet. If #1524 lands mid-run, the transport becomes
available and that change is recorded here rather than assumed.

## D-2 — PLAN-EVAL waived for the wave plan and all slices

**Recorded:** 2026-08-12, stage B. Authority: owner decision 2026-08-08 in `lane-policy.md`, plus
the explicit instruction in this lane's brief.

`milestone-run.md` marks "PLAN-EVAL of the wave plan" as `[asserted]` and says to apply the
standard harness rule until a trace shows otherwise. This run **departs from that default** on the
owner's instruction. Reasoning is in `supervisor.md` § PLAN-EVAL decision; the short form is that
all six issues arrive pre-specified with named defect sites and intended corrections, and the one
genuine design choice (#1438's allowed-set derivation) is covered by a focused IMPL-EVAL instead.

This is a **recorded departure from a documented default**, which is exactly what this file is for.
It is not a claim that the default is wrong.

## D-3 — IMPL-EVAL owner waiver for PR C / PR D, applied conditionally

**Recorded:** 2026-08-12, stage B. Authority: this lane's brief ("Small deterministic E2E guard
fixes may use the owner waiver with strong negative tests").

Applied **conditionally**, not by default: the waiver holds only where the slice demonstrates a
strong negative test — the guard shown red before the fix and green after, on real execution, not
on a claim. Where that demonstration is weak or absent, the waiver does not apply and a Fable 5 ·
medium IMPL-EVAL runs in a separate session. The per-PR decision and its evidence are appended
below at landing time.

| PR | Negative-test evidence | Waiver applied? |
| --- | --- | --- |
| C (#1397 + #1399) | **Strong.** Three executed red→green controls quoted with real output in `slices/c-1397-1399/evidence.md`: restoring the postgres-only service-health drop fails the new database-matrix test (`17 passed \| 1 failed`, with the diff naming `behavior.service-health` as the missing member); a throwaway deferral on `scaffold.service` fails the all-suite pin; removing an expectation entry fails **type-checking** (TS1360 + TS7053), which is a compile-time guard rather than a runtime one. Restored tree green at 19/19. | **Yes** |
| D (#1428) | **Strong, and includes the decisive control.** `slices/d-1428/evidence.md` records the DB-only break staying **green before the fix** (`3 passed, 415ms`) — the executed proof that the gap #1428 describes was real — then **red after** (`2 passed \| 1 failed`). Plus: memory-island break still red (unchanged coverage), broken non-relative specifier red, legitimate `npm:`/`jsr:` specifiers green (no false positive), restored final run green at 825ms. | **Yes** |

**Both waivers earned by execution, not by assertion.** The condition set at run open was a guard
demonstrated red before the fix and green after, on real output. Both slices met it, and D met the
stronger form — showing the *pre-fix* state green, which is the only control that actually proves a
coverage gap existed rather than merely that a new test can fail.

The orchestrator additionally re-verified each slice's decisive claim independently (pre-merge
check 5), so neither lane self-certified: C's engine-agnostic claim was checked against
`PROBE_SERVICE_HEALTH_SCRIPT`, and D's template-restoration claim was checked against the
changed-file list rather than its own report.

Automated gates are unchanged by this waiver: they are evidence, not sign-off.

## D-6 — #1438 derived binary/hash outputs require writer reproduction

> **Numbering note.** Slices A and B wrote to this shared file concurrently and both filed their
> entry as `D-4`. This one (slice A / #1438) was renumbered to **D-6** to resolve the collision;
> PR #1539's body cites it as "D-4". Slice B's entry keeps `D-4`, as PR #1538 cites. Renumbering
> rather than merging keeps both PR-body references resolvable.

**Recorded:** 2026-08-12, PR A implementation. Severity: significant implementation detail, no
scope expansion.

The issue required `isExactVersionReplacement` to remain in force for every newly admitted path,
while naming gzip as a design question rather than permission to weaken the guard. Measurement of
the real v0.0.5 cut found 56 text files satisfy the exact `0.0.4` → `0.0.5` byte replacement, but
six writer-owned outputs do not: agent-docs gzip/provenance plus generated barrels whose gzip,
base64, byte-count, or SHA-256 fields are necessarily derived from the rewritten content.

The implementation keeps exact replacement as the first predicate on every changed path. An
inexact path is admitted only when it is declared by `prepareRelease`'s generator-owned output set,
the tracked worktree is clean, and the same three writers used by `release:cut` reproduce all
generated outputs in non-mutating check mode (`gen:publish-assets --check`,
`check:mcp-export-corpus`, and the assets-barrel generator's new `--check`). Any source path,
undeclared path, dirty tracked checkout, or failed reproduction still rejects inheritance. This is
the explicit handling requested by #1438; the global byte check was not widened to arbitrary
content.

## D-4 — #1417 mutation source is mixed; preferred isolation remains viable

**Recorded:** 2026-08-12, Slice B implementation.

The live-tree mutation is not solely an upstream Deno defect. NetScript's
`.llm/tools/release/publish-workspace.ts` deliberately materializes npm `catalog:` entries before
calling Deno; its existing `finally` restored those files only after normal completion. Separately,
the package-scoped `deno publish --dry-run` path can expand MCP publish metadata. Thus both repo
preparation and upstream publish processing can write manifests, and an interruption can bypass the
normal-completion restore.

**Decision:** issue option 1 is viable and selected. Workspace and MCP member dry-runs execute in a
throwaway workspace. The source tree is never a command working directory, while the same catalog
materialization and real Deno dry-run gate continue to execute. A hard kill may abandon temporary
data, but cannot abandon expanded source manifests.

## D-5 — Slice A's observed effort drifted from medium to high after resume

**Recorded:** 2026-08-12, during slice A recovery.

Slice A was launched with `--effort medium` (`normal_implementation`) and the launcher recorded
requested == observed == `openai / gpt-5.6-sol / medium`. After the turn was killed by the launcher
SIGTERM (cut-trace F-2) and resumed via `agentic:codex-resume`, `codex-status` reports the thread as
`gpt-5.6-sol / high`.

`codex-resume` takes no `--model`/`--effort` flags, so the resumed turn's effort was not asserted by
the orchestrator. Observed identity therefore no longer matches the requested route.

**Assessment.** Sol · high is the `complex_implementation` lane — in-plan and not a paid escalation,
so `lane-policy.md` invariant 4 (no implicit *paid* escalation) is not breached. But it is an
implicit **higher-effort** escalation that this orchestrator did not request, and invariant 3
requires requested-versus-observed identity to be recorded rather than assumed. It is recorded here.

**Consequence for review pairing.** The effort-paired ladder maps Sol·high to
`review_codex_complex` → **Fable 5 · medium**. Slice A's focused IMPL-EVAL was already routed to
Fable 5 · medium, so the pairing remains correct under the drifted effort by coincidence rather
than by design. Had the drift gone the other way this would have mismatched the ladder.

**Follow-up for the next run:** either `codex-resume` should accept and assert an explicit route
identity, or a resume should be treated as a new launch edge that re-validates it. Filed as an
observation here rather than a code change, since this lane does not own the agentic suite.
