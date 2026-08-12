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

**RESOLVED mid-run, 2026-08-12.** #1524 passed and landed as `7837ef470 feat(agentic): automate
formal evaluator phases`, which adds `.github/workflows/openhands-phase-eval.yml`. Owner policy
issued the same day: **never manually dispatch OpenHands for formal PLAN/IMPL eval.** The
label-driven mechanism is now the only route —

- **PLAN-EVAL** — triggered exactly once by the `openhands` + `status:plan-eval` label pair (either
  label may complete it). Rerun only by moving away from `status:plan-eval` and re-adding it.
- **IMPL-EVAL** — initial run triggers automatically on **draft → ready**, unless the PR carries
  `impl-eval:skip`. Rerun only by moving away from `status:impl-eval` and re-adding it.
- `eval:model:minimax|deepseek|qwen` is a **one-shot** model override.

**Consequence this lane must record honestly.** All four of this lane's branches were cut from
`01aa12b67`, which **predates** that workflow:

```
openhands-phase-eval.yml on origin/main        → YES
openhands-phase-eval.yml on #1539 (5350d01fc)  → NO — branch predates it
openhands-phase-eval.yml on baseline 01aa12b67 → NO
```

So the automatic IMPL-EVAL **never fired on this lane**, which is the real explanation for the
`agent: SKIPPED` result observed on every PR after draft→ready and for `gh-pr verdict` reporting
"no OpenHands comment yet". It was not suppressed; the workflow did not exist on those branches.

**Therefore the three landed PRs (#1534, #1535, #1538) were gated by local evaluation plus the
orchestrator's seven-check pre-merge gate only** — not by the automatic evaluator that current
policy would give them. Recorded rather than left implied, because a reader comparing this lane
against the policy would otherwise assume an automatic verdict existed for each.

**Compliance actions taken:** this lane has never manually dispatched OpenHands, and did not do so
after the policy issued. The cycle-2 local IMPL-EVAL on #1539 was already running when the policy
arrived; per the owner's instruction it is being allowed to finish and is **not** duplicated by
cycling `status:impl-eval`. #1539 already carries `status:impl-eval`, so that trigger is spent.

**One artefact to flag for future readers:** merging #1539 moves `status:impl-eval` →
`status:ready-merge` as part of the close-gate sequence. Under the new policy that is the
"move away" half of the rerun mechanism. If `status:impl-eval` is ever re-added to a merged PR of
this lane, it will re-trigger an evaluation — that would be the mechanism firing, not a manual
dispatch.

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

### IMPL-EVAL correction — agent-docs requires a parent anchor

**Recorded:** 2026-08-12, after PR #1539 IMPL-EVAL `FAIL_FIX` B-1.

The preceding implementation claim was incomplete for `.llm/assets/agent-docs/prose.json.gz`.
`gen:publish-assets --check` re-read that committed blob and, when its provenance already carried
the stable version, rewrote the version to itself. Provenance and the published barrel were then
derived from the same unanchored blob. Therefore a mutually consistent arbitrary prose mutation
could pass every HEAD-only writer check and inherit canary evidence. The evaluator reproduced that
unsafe direction with a marker injection, matching provenance hash/byte counts, and a synchronized
barrel.

The repair selects evaluator option 1: the gzip payload is read as raw bytes at the canary parent
and stable HEAD, decompressed, and the only accepted current payload is the exact result of applying
`bump-version.ts::rewriteNetScriptVersion` to the parent's file contents. The existing HEAD writer
checks still run afterward and remain responsible for provenance and generated consumers. This
keeps the complete chain anchored to content that actually received the canary pair without
expanding the slice into a new raw-docs build pipeline.

### Non-blocking evaluator finding B-2 — export-corpus reproduction may be environment-sensitive

The evaluator's clean Deno 2.9.5 environment reported
`deno task check:mcp-export-corpus` stale because `deno doc` produced different gzip/base64/hash
bytes. This remains fail-closed: it cannot authorize unverified content. If the real release CI
cannot reproduce the committing environment byte-for-byte, however, the D-6 inheritance path will
always reject and #1438 will be operationally inert. Per slice scope this determinism issue is
recorded only; no corpus-generator change or bypass is attempted here.

### IMPL-EVAL cycle 2 correction — provenance and corpus cause

**Recorded:** 2026-08-12, after PR #1539 IMPL-EVAL cycle 2 `FAIL_FIX`.

The cycle-1 correction still left `.llm/assets/agent-docs/provenance.json` structurally unsafe.
Both provenance writers spread the parsed committed object, so an arbitrary field was preserved by
`gen:publish-assets --check` and then embedded into the published agent-docs barrel. A complete
audit of all 21 `PREPARED_RELEASE_GENERATED_OUTPUTS` paths found only two preserved/round-tripped
writer inputs: the already-anchored prose gzip and provenance. The other 19 outputs are re-derived
from separate tracked sources whose mutation is rejected by the changed-path or exact-manifest
checks. The full path-by-path table is in slice A's `evidence.md`.

Provenance now takes both bounded protections. Its writer emits a closed eight-field schema rather
than spreading unknown fields, and inheritance derives the only permitted HEAD provenance from the
canary parent's stable metadata plus integrity measurements of the parent and HEAD prose blobs.
This catches unknown fields and mutations to legitimate preserved fields; the existing prose anchor
and all HEAD reproduction checks remain in force.

Cycle 2 also refined the corpus observation above. The clean-tree stale result is explained by
**source drift**, not demonstrated `deno doc` byte nondeterminism: the corpus was last regenerated at
the 0.0.5 cut, while 16 commits / 91 package-and-plugin source files changed afterward.
`release:cut` regenerates the corpus before inheritance is evaluated. Two consecutive generations
under Deno 2.9.5 Linux were byte-identical, establishing same-environment determinism. What remains
unknown is cross-environment determinism between a cut environment and `publish.yml`; additionally,
`ci.yml` does not independently run `check:mcp-export-corpus`, so D-6 is currently the check that
observes it. This remains a fail-closed, non-blocking observation only; the slice does not modify the
corpus or its CI coverage.

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

## D-7 — Fable 5 fully prohibited for this lane (owner, 2026-08-12)

**Recorded:** 2026-08-12. Authority: owner. Scope: this 0.0.6 lane, all phases — planning, research,
implementation, review, evaluation. Duration: until explicitly lifted (95% quota until Saturday).

**Compliance status at the moment the policy issued: no live Fable dispatch.** The lane's three
local IMPL-EVAL cycles (Fable 5 · medium, slices A and B) had all completed; no Fable agent was
running and none was queued. No dispatch had to be stopped.

### Routes that would select Fable, and the substitution for each

`lane-policy.md` already declares Opus fallbacks for exactly this condition, and the reason it gives
matters: *"the Codex-review lanes instead fall back to Claude · Opus 5 (same effort) so an
OpenAI-authored change is never reviewed by an OpenAI-family model — opposite-family review is never
traded away for a token-limit fallback."* A 95% quota **is** a token-limit condition, so the
documented fallback applies as written rather than as an improvisation.

| Lane | Canonical route | Under D-7 |
| --- | --- | --- |
| `review_codex` (paired to Sol·medium impl) | Fable 5 · low | **Opus 5 · low** (declared fallback) |
| `review_codex_complex` (paired to Sol·high impl) | Fable 5 · medium | **Opus 5 · medium** (declared fallback) |
| `review_codex_light` (paired to Sol·low impl) | Opus 5 · high | unchanged — never selected Fable |
| `deep_analysis` | Fable 5 · medium | **Not delegated.** Handled by this Opus orchestrator, or as `chore_code` → Opus 5 · medium |
| `formal_plan_evaluation` (Codex plans) | Fable 5 · medium | Moot — PLAN-EVAL is `N/A` for this lane (D-2) |
| `formal_impl_evaluation` (Codex work) | Fable 5 · medium | **Superseded by the automatic evaluator.** Owner policy of 2026-08-12 routes IMPL-EVAL through the label-driven `openhands-phase-eval` workflow, whose models are `minimax` / `deepseek` / `qwen` — all OpenRouter open models. The automatic path is Fable-free by construction. |
| `docs_polish` | Fable 5 · medium | N/A — not a docs lane |
| Forward rule: Sol·max implementation | Fable 5 · high review | **Avoided** — no wave-3/4 slice is routed at Sol·max |

**Opposite-family review is preserved in every substitution.** Every replacement is Claude-family
reviewing Codex-authored work, which is the invariant the fallback chain exists to protect. Nothing
in D-7 forces this lane to let an OpenAI-family model review OpenAI-authored code.

### Effect on waves 3–4

None blocking. Implementation stays on Codex Sol (low default, medium where decisions arise, high
only for genuinely complex work); ordinary adversarial review substitutes Opus at the paired effort;
formal evaluation is automatic and Fable-free.

**Standing instruction honoured:** if a configured route would select Fable, the dispatch stops and
is reported rather than silently substituted. The substitutions above are recorded *in advance* so
that no wave-3/4 dispatch has to make that call ad hoc — but any route not in this table that
resolves to Fable halts and comes to the owner.
