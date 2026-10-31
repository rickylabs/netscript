# Worklog — issue 2259

## Design

1. **Public surface:** research evidence only until the masking prerequisite passes; no
   exported API, CLI command, generated source, or gate behavior changes in the spike.
2. **Domain vocabulary:** secret parameter = Aspire ParameterResource with Secret enabled;
   composed binding = connection string built from that parameter; masking = no credential
   bytes in the backchannel-projected value; runtime resolution = unredacted consumer value.
3. **Ports:** installed Aspire.Hosting 13.5.3 public composition/environment APIs and the
   exact assembly's private backchannel redactor. No new production port or abstraction.
4. **Constants:** package version is pinned in the probe project; environment names and the
   internal redactor name are fixed diagnostic inputs. Credential bytes are generated in memory.
5. **Commit slices:** bootstrap/PLAN-EVAL, then capability proof/decision; exact files and
   gates are in plan.md. Each slice updates worklog and context pack.
6. **Deferred scope:** all product edits, whole-snapshot gate reactivation, database/runtime
   acceptance, and any upstream version choice depend on the spike. No upgrade is authorized.
7. **Contributor path:** plan.md is the one entry file for the bounded reproduction.

## Owner evaluator override (verbatim)

“Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with
claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only.”

This changes the feature evaluator model cells to Anthropic Opus at high effort, preserving
session and vendor-family independence from the OpenAI implementer. Route discovery succeeded
with `deno task agentic:matrix --tier feature --json`; feature round limits remain in force.

## Bootstrap

Read the complete assignment, AGENTS, relevant skills/rules, prior committed environment
memories, and issue comments. There is no orchid-triage comment. Prior PR #2275 is closed,
unmerged, and research-only. Pin remains 13.5.3. NetScript MCP guidance/search completed.
RTK is unavailable; use plain git/gh with bounded output and structured wrappers when relevant.

Reconcile: no product implementation exists in the prior PR; the scope remains the owner's
spike-first decision. No acceptance, labels, milestone, lock, or cache has been modified.

## PLAN-EVAL round 1

Independent read-only Opus returned FAIL_PLAN: distinguish all tested compositions leaking
from one leaking; define INVALID/BLOCKED/CAPABLE and what a zero exit means; fail closed on
bad controls. Corrected plan.md accordingly. No implementation was started.
Draft PR #2501 is open with bootstrap commit `756149e`.

## PLAN-EVAL round 2

Same independent evaluator returned PASS. The corrected diagnostic contract is approved.
Read-only tooling and closed stdin were preserved in both rounds. No shipped source changed.

## Capability spike

The first diagnostic compile failed because GetValueAsync requires a cancellation token.
Added CancellationToken.None and reran. No product code or dependency pin changed.
The final probe also rejects a null resolved parameter explicitly. Restore reports the
pinned SDK's transitive MessagePack advisory; no package upgrade or audit claim is made.

| Command / evidence | Result | Meaning |
| --- | --- | --- |
| Installed SDK diagnostic; invocation in spike/README.md | exit 0 | Valid diagnostic, CAPABILITY: BLOCKED |
| Direct secret, null, clean-value, clean-scan, hostile-scan controls | all pass | Redactor and local byte detector operate as expected |
| Four composed runtime bindings | all retain credential | SDK environment resolution is intact; no connectivity claim |
| Four actual backchannel-redactor outputs | all EXPOSED | Neither tested composition masks the password |
| Package and runtime acceptance gates | unrun / unproven | Product work stops under the assignment's negative-spike rule |

No AppHost, executable, database, dashboard, or container was started. Build output and raw
compiler logs remain outside Git. result.txt contains no credential values or private identity.
The diagnostic uses the real installed redactor, not a local replacement. Its local hostile
control is not the requested runtime gate's negative control; that acceptance remains unproven.

Reconcile: all three issue acceptance items remain unchecked. No generated AppHost output,
credential-scan exemption, labels, milestone, lock, or cache is changed. Pending independent
review of the proof, preserve the BLOCKED decision in the draft PR and issue handoff.

## Handoff checks

`git diff --check` passed. `deno task check:review-threads -- --repo rickylabs/netscript
--pr 2501 --pretty` exited 0: zero review threads and zero unanswered. The initial draft-head
CI jobs are all SKIPPED, consistent with draft policy; no passing CI verdict is claimed.
The final pushed head's check state will be reported in the issue comment.

No uncertain live-resource ownership arose: the probe starts no runtime resources, so there
is nothing from this run requiring teardown or a resource-ownership escalation.

## Independent spike review and decision

The same read-only Anthropic evaluator returned **PASS FOR SPIKE EVIDENCE, ISSUE
IMPLEMENTATION BLOCKED**. See evaluate.md. The review checked the actual redactor invocation,
runtime resolution, both supported composition paths, validity controls, all-versus-any logic,
and the explicitly disclosed limits. The final null guard was included in the reviewed source;
the final rerun again exited 0 with identical BLOCKED assertions.

The owner-directed outcome is BLOCKED. Preserve this evidence in the draft PR, obtain the
exact pushed-head verdict, and attach it to the issue decision record. Recommend deferring
D1 to the already separate #2278 work until a supported masking mechanism is proven. Any
upgrade or alternative credential-delivery design requires a new coordinator scope decision.
The whole-snapshot gate, database workflows, service/Studio connectivity, and live dashboard
acceptance remain unproven; they have not been weakened, checked, or represented as passing.

Reconcile: no other PR supplies the missing implementation. #2275 is closed/unmerged, and
#2179 only records the explicit security exemption. This branch adds research evidence only.
