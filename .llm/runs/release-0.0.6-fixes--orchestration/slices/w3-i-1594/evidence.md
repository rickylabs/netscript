# W3-I #1594 — race-safe pre-spend evaluator claim evidence

Date: 2026-08-12\
Worktree: `/home/codex/repos/ns006-w3-1594`\
Branch: `fix/1594-evaluator-claim-race`\
Base: `e85d8d28c`\
Implementation head before this evidence-only commit: `d4dec98c7dfc9fb63eb3ba7984a91e762bde353d`

## Production reproduction

Two paid runs were created from `issue_comment` events on `main`, one second apart, and then
cancelled by the owner:

- `31615108125` at `2026-08-12T15:57:30Z`
- `31615110254` at `2026-08-12T15:57:31Z`

The primary root cause was the generic agent workflow's unanchored body-substring trigger. Any
comment by an owner, member, or collaborator that quoted the manual command token anywhere in
prose could start paid work — fallback provenance comments that quote the original request are the concrete case. (Workflow-owned status comments do not contain the token and were never admitted by that predicate; the fixed predicate rejects them by position regardless, which is what the box-3 regression test pins.) The
second root cause was the phase dispatcher's non-atomic sequence: list comments, observe no tuple
marker, then create the paid trigger comment. Concurrent attempts could both complete the read
before either completed the write, so both launched work for the same logical transition.

### Duplicate workflow triggers observed during evaluation — corrected scope

Three duplicate `OpenHands Agent` workflow runs were observed while PRs #1603 and #1605 were being
evaluated. An earlier revision of this file described them as live reproductions of the double-spend
defect. **That description was wrong and is retracted here.**

| Duplicate run | Created | Jobs | Outcome |
| --- | --- | ---: | --- |
| `31624029906` | `2026-08-12T17:43:12Z` | 0 | Cancelled at run level |
| `31625413947` | `2026-08-12T17:59:52Z` | 0 | Cancelled by root while zero jobs were assigned |
| `31630450143` | `2026-08-12T18:59:55Z` | 0 | Cancelled by root while zero jobs were assigned |

What was actually observed, stated exactly: **a second workflow was triggered after an
acknowledgement comment; root cancelled it while zero jobs were assigned; duplicate paid execution
was therefore prevented, but production crossing of authorization was not observed.**

These runs do **not** demonstrate that a duplicate crossed authorization, and they do not demonstrate
duplicate spend. The triggering body in each case is a workflow-authored status summary beginning:

```
<!-- openhands-agent-summary -->
<!-- openhands-run: {"run_id":<id>,"attempt":1,"conclusion":"running"} -->
```

That body contains no `@`-prefixed invocation token, so the pre-fix `contains(...)` predicate would
not have matched it and the `agent` job would have been skipped regardless of cancellation. A
GitHub `issue_comment` event creates a workflow run for any comment; the run existing is not
evidence that its jobs would have been admitted.

Correspondingly, `conclusion=cancelled` with `total_jobs=0` does not by itself prove a prevented
spend — it is equally consistent with a run whose jobs would have skipped. The discriminator is
whether the triggering body satisfies the trigger predicate, which must be tested directly rather
than inferred from run timing.

The genuine production incident is unchanged and remains the basis for this work: runs
`31615108125` and `31615110254`, one second apart, **each reaching a job**. Two paid runs for one
logical phase transition. The deterministic regression proof for every acceptance criterion is the
executed test suite recorded below; it does not depend on any of the three runs retracted above.
## Scope and design

The workflow now creates one deterministic immutable Git ref for each `(generation, phase, head)`
tuple before it creates the comment that dispatches paid work. GitHub's create-ref operation is the
atomic claim: one caller creates the ref; an exact concurrent collision receives GitHub's
`Reference already exists` response, verifies that the existing ref points at the expected head, and
returns before comment creation. Other errors and a ref pointing at another SHA fail closed.

The namespace is `refs/openhands-phase-eval-claims/`; every ref points at the immutable evaluated
head. GitHub documents create-ref as requiring a ref beginning with `refs` and containing at least
two slashes: <https://docs.github.com/en/rest/git/refs#create-a-reference>.

Production and test use the same lifecycle function, `dispatchClaimedPhaseEvaluation`, exported by
`.github/scripts/phase-eval-claim.mjs`. The workflow resolves the live protected-base SHA, checks
that revision out under `.phase-eval-trusted` with persisted credentials disabled, dynamically
imports the module from that checkout, and calls the exported function. The create-ref/get-ref
algorithm is not duplicated inline in the workflow.

Before trigger creation, the lifecycle scans for the exact tuple marker and reuses a matching
comment. If creation rejects, the response may have been lost after GitHub accepted the comment; the
lifecycle scans again and reuses a now-visible marker. If no marker is visible or verification
itself fails, the claim remains held and the job fails closed. A same-tuple failed-job rerun cannot
reclaim or spend. This also bounds the process-crash case: an orphaned claim requires the operator
to cycle the phase status so GitHub records a new generation-event ID, producing a new tuple and
fresh claim. There is no automatic reaper.

The sibling acceptance-mirror defect #1561 is out of scope. It is in a different validation file and
concerns malformed evidence entries, not the evaluator pre-spend claim.

## Manual comment dispatch policy

Production comment authorization is exported by `.github/scripts/openhands-comment-trigger.mjs`. The
generic workflow checks out the default-branch policy with persisted credentials disabled,
dynamically imports it in a lightweight authorization job, and allows the paid agent job to run only
when that job returns `dispatch=true`. A cheap first-token event prefilter prevents ordinary
prose/status comments from even entering the authorization job; the imported policy remains the
authoritative decision. The old body-substring expression and the later first-matching-line scan are
removed.

The accepted manual shape is deliberately narrow:

1. an owner, member, or collaborator authors the comment;
2. the command token is the first token of the first line, with no leading whitespace, quote, fence,
   or prose;
3. the rest of the first line contains only recognized, unique `name=value` arguments; and
4. any prompt begins on following lines.

The isolated behavioral tests feed the production-called predicate representative bodies and prove:

- a fallback-running comment quoting the vocabulary does not dispatch;
- final fallback provenance quoting the original request does not dispatch;
- the workflow's acknowledgement and final-summary shapes do not recursively dispatch;
- a valid authenticated first-line manual command dispatches;
- the real `buildOpenHandsComment` producer, including its required `effort=` field, round-trips
  through the production predicate and dispatches;
- the automatic phase command shape remains accepted;
- trailing horizontal whitespace is tolerated without accepting leading whitespace; and
- prose, blockquotes, inline code, leading blank lines, colon-form manual arguments,
  invalid/unknown/duplicate arguments, and unauthorized authors are rejected.

Formal manual commands carrying `phase` and `head` resolve the latest deliberate status generation
and invoke the same `claimPhaseEvaluation` primitive before the paid agent job. Two
forced-concurrent manual authorizations for the same tuple yield one dispatch and one pre-spend
rejection. An existing claim or an earlier exact generation marker rejects later manual commands.
The phase dispatcher's own first marker-bearing comment is admitted as the already-claimed winner; a
copied later marker is rejected because the original is already present.

The incident is also recorded in `.llm/harness/workflow/agent-handoff.md`, including runs
`31615108125` and `31615110254`, their one-second spacing, the unanchored substring root cause, the
secondary non-atomic claim race, and the two production guards.

## Concurrency construction

`.github/scripts/phase-eval-claim.test.ts` calls the same exported lifecycle function that the
workflow imports, starting two promise-based attempts with the exact same tuple. Both enter the
injected `createRef` operation and stop at a two-party rendezvous. The rendezvous releases only
after both calls have arrived, so neither attempt can finish the claim before the other has started
it. After release, the create-ref implementation performs one atomic check-and-create: one succeeds
and the other receives the same 422 collision contract used by the GitHub API.

This is genuinely racy rather than nominally concurrent: both contenders are outstanding inside the
claim primitive at the same time. It is not two sequential calls and there is no mutex around the
attempts. The only serialization is the atomic check-and-create itself, which is the property under
test.

The negative control applies the same two-party rendezvous immediately after both attempts read an
empty comment collection. Both then write, reproducing the old read-then-write failure with two
trigger comments and two paid starts. Therefore the construction can fail the old design; it does
not merely demonstrate idempotency under sequential execution.

## Executed race proof — complete output

Command:

```text
deno test --allow-read .github/scripts/openhands-comment-trigger.test.ts .github/scripts/phase-eval-claim.test.ts .github/scripts/phase-eval-status.test.ts .llm/tools/agentic/openhands/phase-eval-workflow_test.ts
```

Output:

```text
Check .llm/tools/agentic/openhands/phase-eval-workflow_test.ts
Check .github/scripts/openhands-comment-trigger.test.ts
Check .github/scripts/phase-eval-claim.test.ts
Check .github/scripts/phase-eval-status.test.ts
running 7 tests from ./.llm/tools/agentic/openhands/phase-eval-workflow_test.ts
phase evaluator event matrix dispatches only deliberate transitions ... ok
phase evaluator model labels are exact, optional, and mutually exclusive ... ok
formal verdicts advance or return the harness status deterministically ... ok
workflow source encodes trusted, exactly-once phase dispatch ... ok
generic OpenHands stays fail-closed to current open evaluator models ... ok
generic OpenHands delegates comment authorization to the tested policy module ... ok
formal evaluator prompts are trusted read-only harness contracts ... ok
running 11 tests from ./.github/scripts/openhands-comment-trigger.test.ts
fallback-running comment can quote command vocabulary without dispatch ... ok
final fallback provenance can quote the original command without dispatch ... ok
workflow acknowledgement and summary bodies cannot recursively dispatch ... ok
explicit authenticated first-line command dispatches exactly once ... ok
agentic dispatcher output round-trips through the production predicate ... ok
automatic phase command shape remains accepted ... ok
manual command rejects prose, quoting, invalid grammar, and unauthorized authors ... ok
manual command permits trailing horizontal whitespace but not leading whitespace ... ok
manual phase commands atomically claim once before dispatch ... ok
phase dispatcher marker authorizes only the first claimed trigger comment ... ok
existing generation marker blocks manual dispatch even when its claim ref is absent ... ok
running 9 tests from ./.github/scripts/phase-eval-claim.test.ts
negative control: concurrent read-then-write claims both spend ...
negative control: 2 concurrent attempts -> 2 trigger comments, 2 paid starts
negative control: concurrent read-then-write claims both spend ... ok
atomic claim: concurrent attempts on one tuple create one trigger and one spend ...
atomic claim: 2 concurrent attempts -> 1 trigger comment, loser paid starts=0
atomic claim: concurrent attempts on one tuple create one trigger and one spend ... ok
atomic claim: head, phase, and generation each identify a distinct claim ...
distinct tuples: base + varied head + varied phase + varied generation -> 4 claims
atomic claim: head, phase, and generation each identify a distinct claim ... ok
existing marker is reused before trigger creation ... ok
lost trigger response reuses the visible marker and retains the claim ... ok
unverified trigger failure retains the claim and rerun spends nothing ...
unknown trigger result: claim retained; same-tuple rerun paid starts=0
unverified trigger failure retains the claim and rerun spends nothing ... ok
claim marker is derived from the validated tuple ... ok
claim validation and non-collision failures fail closed ... ok
claim collision pointing at another commit fails closed ... ok
running 7 tests from ./.github/scripts/phase-eval-status.test.ts
race regression: a concurrently removed status label does not fail cleanup ... ok
narrow tolerance: permission failures still fail cleanup ... ok
narrow tolerance: an unrelated 404 still fails cleanup ... ok
terminal decision contains exactly one status label ... ok
atomic generation claim remains before trigger creation ... ok
status bookkeeping failures are attributed and dispatch remains conditionally eligible ... ok
inline cleanup transcription matches helper contract literals ... ok

ok | 34 passed | 0 failed
```

The same-tuple assertion additionally inspects the losing attempt and requires
`commented: false, spent: false`. The complement creates four claims: the base tuple, varied head,
varied phase, and varied generation. All four return `claimed: true` and create four distinct refs.
The failure-path assertions prove three cases: a pre-existing marker avoids creation; a simulated
lost response finds the server-created marker and retains the claim; and an unknown result with no
visible marker fails while retaining the claim, after which the same-tuple rerun loses before its
trigger callback and records zero additional paid starts.

The complete scripts directory suite also passed:

```text
deno test --allow-read .github/scripts/
ok | 87 passed | 0 failed
```

The policy behavior is proved by direct calls with real comment bodies. The YAML assertions are
limited to wiring: the workflow imports that tested export, gates the agent job on its result, and
contains neither the former substring expression nor a duplicated first-matching-line scan.

## Required repository gates — complete compact output

All commands ran from `/home/codex/repos/ns006-w3-1594`.

### Check

```text
$ rtk proxy deno task check
Task check deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages --root plugins --ext ts,tsx --exclude "^(.*(?:^|/)\.generated/|.*(?:^|/)node_modules/)"
exit 0
```

### Test

The required unmodified command completed with exit 0 and discovered/type-checked the new test. The
compact reporter rerun after the lifecycle correction produced the complete output below.

```text
$ rtk proxy deno task test --reporter=dot
Task test deno test --allow-all '--reporter=dot'
ok | 3297 passed (622 steps) | 0 failed | 17 ignored (3m54s)
exit 0
```

### Lint

```text
$ rtk proxy deno task lint
Task lint deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages --root plugins --ext ts,tsx --exclude "^(packages/(cli)|packages/mcp/tests/fixtures/doctor/|.*(?:^|/)\.generated/|.*(?:^|/)node_modules/)"
{"source":{"mode":"command","cwd":"/home/codex/repos/ns006-w3-1594","exitCode":0},"selection":{"filesSelected":2019,"batches":11},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueRules":0,"uniquePaths":0},"groups":[]}
exit 0
```

### Format

```text
$ rtk proxy deno task fmt:check
Task fmt:check deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages --root plugins --ext ts,tsx --exclude "^(packages/(cli)|packages/mcp/tests/fixtures/doctor/|.*(?:^|/)\.generated/|.*(?:^|/)node_modules/)" --ignore-line-endings
{"command":"deno fmt --check","cwd":"/home/codex/repos/ns006-w3-1594","mode":"check","summary":{"filesSelected":2019,"batches":11,"failedBatches":0,"findings":0,"ignoredFindings":0},"findings":[]}
exit 0
```

## Changed-file gates and hygiene

```text
$ deno check .github/scripts/phase-eval-claim.test.ts .github/scripts/phase-eval-status.test.ts .llm/tools/agentic/openhands/phase-eval-workflow_test.ts
Check .github/scripts/phase-eval-claim.test.ts
Check .github/scripts/phase-eval-status.test.ts
Check .llm/tools/agentic/openhands/phase-eval-workflow_test.ts

$ deno lint .github/scripts/phase-eval-claim.mjs .github/scripts/phase-eval-claim.test.ts .github/scripts/phase-eval-status.test.ts .llm/tools/agentic/openhands/phase-eval-workflow_test.ts
Checked 3 files

$ deno fmt --check .github/scripts/phase-eval-claim.mjs .github/scripts/phase-eval-claim.test.ts .github/scripts/phase-eval-status.test.ts .llm/tools/agentic/openhands/phase-eval-workflow_test.ts .github/workflows/openhands-phase-eval.yml
Checked 5 files

combined exit 0
```

- Diff scan for `deno-lint-ignore`, `as unknown as`, and `@ts-ignore`: no matches.
- `git diff --check`: exit 0.
- `git diff --stat -- deno.lock packages/fresh-ui/deno.lock`: empty.
- No `packages/**` or `plugins/**` files changed, so `quality:gate` is not applicable.
- `scaffold.runtime` was not run; it is unrelated and prohibited by the slice brief.
- No publication command was run.
- CI is not cited as evidence: the draft PR's CI jobs were skipped, so all gate claims above are
  local execution evidence.

## Evaluation handoff

PLAN-EVAL is N/A under the owner-specified brief: the seam, identity key, invariant, and proof are
fixed. The prior exact-head IMPL-EVAL returned `FAIL_IMPL`; findings F1–F6 were corrected at
`d4dec98c7dfc9fb63eb3ba7984a91e762bde353d`. A separate exact-head re-evaluation is still required.
The implementation session did not trigger it; the release orchestrator owns that handoff and all
status-label movement.
