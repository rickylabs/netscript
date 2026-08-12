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
