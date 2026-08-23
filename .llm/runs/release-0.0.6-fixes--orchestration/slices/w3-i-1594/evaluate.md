# IMPL-EVAL — W3-I / #1594 / PR #1599

| Field | Value |
| --- | --- |
| Head evaluated | `96667e9194a1b422bff4b3429a21152dce84629a` (verified by the evaluator before starting) |
| Merge base | `e85d8d28c` — 10 files, +645/−53 |
| Route | Native Claude Opus 5, medium, read-only. **Not** OpenHands: this PR modifies its own evaluator trigger, so a self-triggered cloud eval could run the old trigger logic against the new code and spend money doing it. |
| Fable | Prohibited for all 0.0.6 work; not used. |
| Verdict | **FAIL_IMPL** |

## Accepted and not to be redesigned

The claim primitive and its concurrency test pass evaluation. The rendezvous suspends both attempts
inside `createRef` before the check-and-set, so two parties are genuinely in flight; the decisive
evidence is the **negative control** — the same harness against a read-then-write algorithm produces
2 trigger comments and 2 paid starts. A test that would also pass against the broken code does not
do that. 79 tests pass.

Stated boundary, correctly declared rather than glossed: the mock's atomicity comes from the JS
event loop making `has`+`set` indivisible, so the test proves the *client-side* algorithm (create
first, treat 422 as a loss, never spend on a loss, fail closed when the existing ref points at a
different SHA). It cannot prove GitHub's `createRef` is server-side atomic. That is an assumption,
not a result.

Invariant 4 is satisfied: production now imports both `phase-eval-claim.mjs` and
`openhands-comment-trigger.mjs` from a **trusted** checkout with `persist-credentials: false`, so a
PR head cannot swap the policy. The earlier divergence — tests against a helper production did not
call — is closed.

## Findings (orchestrator re-verified F1, F5, and box 7 independently)

| # | Severity | Finding |
| --- | --- | --- |
| F1 | **blocker** | `effort` absent from `ALLOWED_ARGUMENTS`, so every comment from the repo's own dispatcher is refused |
| F2 | major | Box 7 unmet — no incident record for the two cancelled runs |
| F3 | major | Manual comment path has no claim at all; documented manual route still double-spends |
| F4 | medium | Releasing the claim on trigger failure loses the old re-run idempotency |
| F5 | medium | `contents: write` elevation, with a test asserting the weakened state |
| F6 | low | Trailing whitespace on the command line rejects; `name: value` form now unreachable |

### F1 — the same failure class, found twice, by two different reviews

I caught the docs instance (`AGENTS.md:224` prose after the arguments) and had it fixed. The
evaluator caught the **programmatic** instance I did not sweep:

- `openhands-comment-trigger.mjs:11-19` — no `effort` in the allow-list
- `.llm/tools/agentic/lib/agentic-lib.ts:532` — emits `effort=` whenever set
- `.llm/tools/agentic/runtime/launch-route-identity.ts:43` — **throws** if effort is unset

so `agentic:dispatch-openhands` cannot produce a comment the predicate accepts. The comment posts,
the agent job skips, and the only trace is a notice in an Actions log.

**Rule this establishes:** a grammar with no round-trip test against its own producer will drift.
Fixing the two known instances is not the fix; the round-trip test is. Two reviews found two
instances, which is the signal to assume a third.

### F5 — a weakened guard with a test written to hold it weak

`openhands-phase-eval.yml:16` raises GITHUB_TOKEN from `contents: read` to `contents: write` and the
`dispatch` job inherits it, while every ref operation actually runs under `PAT_TOKEN` (5 uses).
`phase-eval-workflow_test.ts:143` then asserts `contents: write`, so restoring least privilege fails
the suite. This is exactly the pattern this milestone exists to remove — the guard that documents
its own weakening as correct.

## Process note

CI on #1599 is **entirely skipped** (20/20) because the PR is a draft — `ci.yml:109` gates
classification on `draft == false`. Every result above is local execution in the worktree. This PR is
not CI-verified and must not be described as such until it leaves draft.

Bootstrap consequence: `main` does not yet contain either helper, so until this merges, phase-eval
dispatch on a PR carrying this workflow fails its trusted-primitive import — fail-closed, no spend,
but this PR's own cloud evaluation could not dispatch even if policy allowed it. That is why the
native route was the only available one, not merely the preferred one.

## Disposition

Not merged. Findings forwarded to the same Codex thread; PR stays draft with no closing keyword and
the formal IMPL-EVAL box unticked. Re-evaluation on the new head after the fixes.

---

# IMPL-EVAL cycle 2 — PASS

| Field | Value |
| --- | --- |
| Head | `dd451eb27f199e6f04af77a6de1088b5c1635304` |
| Route | Native Claude Opus 5, medium, read-only. No OpenHands: this PR modifies its own trigger. No Fable (prohibited for 0.0.6). |
| Verdict | **PASS_IMPL** |

All six cycle-1 findings resolved, all seven acceptance boxes satisfied, slice provenance committed.
The evaluator re-queried the GitHub API rather than trusting the incident record: every run ID,
timestamp, and job count checks out, including that the two original runs each reached 1 job (so
calling them paid is defensible) while both of today's duplicates were `total_jobs=0`.

F5 is worth keeping in mind as a pattern: the fix did not merely revert `contents: write` — the test
that had *asserted* the elevated permission was **inverted** to assert its absence, so the guard now
protects least privilege instead of enshrining its loss.

## New findings — dispositions

| # | Disposition |
| --- | --- |
| N1 | Filed as **#1611** (0.0.7, priority:p1) — the formal dispatch helper omits `phase`/`head`, so `agentic:dispatch-openhands` produces unclaimable commands |
| N2 + N3 | Filed together as **#1613** (0.0.7, priority:p2) — silent refusal, and the missing generation retry in the authorize path |
| N4 | **Accepted operational note** (below) |
| N5 | **Accepted operational note** (below) |
| N6 | **Evidence nit** — recorded, head not moved |

### N4 — claim refs accumulate, with no reaper `[accepted]`

A transient `createComment` failure permanently wedges that `(generation, phase, head)`; recovery is
a deliberate human label cycle. This is documented in three places in the implementation and is the
correct trade: the alternative — releasing the claim — is exactly the F4 defect that reintroduces
double-spend on job re-run. Recorded so it is not rediscovered as a surprise, not as debt to repay.

### N5 — trusted-checkout dependency, and the bootstrap consequence `[accepted]`

Both workflows import their trusted primitives from the base/default-branch checkout. Two
consequences worth stating plainly:

1. A PR stacked on a long-lived branch predating this merge will fail phase dispatch. Low severity —
   the same ref dependency already existed for the eval prompt files.
2. **The fix does not govern this PR's own comments.** `issue_comment` workflows and the policy
   checkout both resolve to the default branch, so `dd451eb27`'s policy controls nothing until it
   merges. This is why the native exact-head route was the only *available* evaluation, not merely
   the preferred one — and why `impl-eval:skip` was applied before the draft→ready flip. Verified
   after the flip: zero phase-eval and zero agent runs dispatched.

### N6 — one evidence bullet overclaims `[recorded, head not moved]`

`evidence.md:113` lists "colon-form manual arguments" among the shapes the isolated tests reject. No
test body contains a colon-form argument; the rejection list covers prose, quoting, backticks,
unknown, duplicate, and leading-newline. The **behaviour** is correct — the evaluator verified by
direct probe that the colon form returns `invalid-command-argument` — so this is evidence-accuracy,
not a functional gap. Deliberately **not** fixed: amending it would move a passed, evaluated head for
a non-functional wording error, and an immutable evaluated head is worth more than a tidy sentence.

## Close-gate mechanics — one real defect found in the PR body

The `acceptance-evidence` mirror step **failed** (not merely the gate) on the first CI run. Cause: the
block's box 6 read `Duplicate (generation, phase, head) requests…` while issue #1594 reads
``Duplicate `(generation, phase, head)` requests…`` — the backticks. Text-matched `box:` entries must
match the issue's checkbox first line **verbatim**, and a single character of drift makes the mirror
throw rather than no-op. Fixed by body edit; head unchanged.

This is the third distinct way this milestone has broken the same mirror: a stale pre-label read
(#1574), an entry referencing non-existent boxes (#1574, sibling repro on #1561), and now
character-level text drift. All three present as a red close-gate that looks like a code problem.
