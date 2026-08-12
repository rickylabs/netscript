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
| C (#1397 + #1399) | _pending_ | _pending_ |
| D (#1428) | _pending_ | _pending_ |

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
