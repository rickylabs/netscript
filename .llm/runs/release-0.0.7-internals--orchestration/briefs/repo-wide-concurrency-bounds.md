use harness

## SKILL

Load `netscript-harness`, `netscript-tools`, `netscript-deno-toolchain`, `netscript-pr`, and `rtk`.
Read `.llm/harness/gates/implementation-gate.md` and `.llm/harness/workflow/lane-policy.md`.

# Implementation brief — #1913 · bound the remaining repo-wide concurrency groups

**Role:** implementation author (leaf). **Supervisor:** `topic-internals-0.0.7`.
**Issue:** #1913 (`type:bug`, `area:tooling`, `priority:p3`, milestone `0.0.7`).
**Worktree:** `/home/agent/projects/netscript/worktrees/007-leaf-1913`
**Branch:** `ci/repo-wide-concurrency-bounds` — already created, base
`77ad823dcb1874ccfc8964b4679ad92a3a145e0b` (`origin/main`, the #1910 merge). Do not rebase.

You implement. You do **not** merge, relabel to ready, close the issue, or touch `e2e-cli.yml` —
#1910 owns those groups and they are already fixed (`-v2` keys, `cancel-in-progress: false`,
`queue: max`). Use them as the model, not as a target.

---

## Correct the issue body before you build on it

The issue says `pages-deploy` is "dispatch-triggered rather than push-triggered", and rests its
low-probability claim on that. **That is false at the base head.** `.github/workflows/pages.yml`
declares four triggers: `pull_request` (branches `[main]`), **`push` (branches `[main]`)**,
`release: [published]`, and `workflow_dispatch`. Its group is

```yaml
group: pages-${{ github.event_name == 'pull_request' && github.ref || 'deploy' }}
cancel-in-progress: false
```

so every **non-PR** arm — including every push to `main` — collapses onto the repo-wide literal
`pages-deploy`. Verify this yourself and state it. The exposure is therefore ordinary main traffic,
not only a manual dispatch: under GitHub's default admission of one running plus **one** pending,
a third arrival cancels the second's pending entry. Two main pushes landing close together is a
routine event in this repo.

Re-derive the probability claim from what you measure. Do not repeat the issue's framing if your
own reading contradicts it — record the correction in `drift.md` and in the PR body.

## The mechanism (do not re-derive it wrongly)

`cancel-in-progress: false` protects a **running** job. It does nothing for a **pending** one.
Without `queue: max`, GitHub admits one running plus one pending and each new arrival cancels the
previously pending entry. An evicted job shows **`steps: 0`** — the run-level `cancelled`
conclusion hides the difference between queue eviction and mid-execution cancellation. That
distinction is the whole diagnostic content of #1908/#1910; keep it in the header comments you
write.

## Authorized surface — exactly these files, no others

| File | Change |
| --- | --- |
| `.github/workflows/pages.yml` | concurrency block + explanatory header |
| `.github/workflows/release-canary.yml` | concurrency block + explanatory header |
| `.llm/tools/release/release-canary-workflow_test.ts` | extend to assert the canary group's bound |
| a parsed-YAML sweep assertion (new or existing test — your call, justify it) | the class check below |
| `.llm/runs/repo-wide-concurrency-bounds--1913/**` | your run artifacts |

**Hard stop if you find yourself elsewhere** — no `e2e-cli.yml`, no `ci.yml`, no dependency or lock
change, no `.llm/runs/**` outside your slice dir.

## The two decisions, and what "justified per group" means

Acceptance box 1 requires a **per-group justification**, not a uniform edit. Reason about each.

- **`pages-deploy`.** A Pages deployment is a genuinely global resource: two refs deploying
  concurrently to one site is a worse failure than a deferred deploy. My reading is therefore
  *keep the literal key, add the bound*. Check whether the deploy job additionally carries an
  `environment: github-pages` concurrency of its own (`actions/deploy-pages` supplies one) — if it
  does, say how the two interact rather than assuming the workflow-level group is the only mutex.

- **`release-canary-<version>`.** This one deserves real thought and may not want `queue: max`.
  The group serializes *publishes* of one version. Under `queue: max` a burst of dispatches all
  eventually execute; under the default, later arrivals replace the pending one. For an operation
  that mutates an immutable registry, "run them all" is not obviously the safe default. Work out
  which failure you prefer and say why. **If your analysis concludes `queue: max` is the wrong
  bound here, stop and report that to the supervisor rather than applying it** — the issue's
  acceptance assumes it, and changing that assumption is a supervisor call, not yours.

  Note also that the key is version-keyed but **branch-agnostic**: the same version dispatched from
  two branches shares one group, each arrival carrying its own branch's copy of the workflow. That
  is the same cross-generation hazard `-v2` keying solved for the tier groups. Consider whether the
  key needs a generation marker too, and justify either way.

## Acceptance box 2 is the hard one — do not fake it

> A dispatch from a non-default branch does not displace a pending deploy on the default branch,
> demonstrated with run IDs and per-job conclusions.

Constraints you must respect:

- For `workflow_dispatch`, GitHub runs the workflow **from the dispatched ref**, so a dispatch from
  your branch carries your fixed concurrency block — that half is demonstrable.
- The victim it must not displace is a **pending** `pages-deploy` entry. Manufacturing one means
  occupying the group first. Do not deploy anything real: `pages.yml`'s deploy job is gated —
  read the gating and find the arrangement that admits jobs into the group without publishing.
- Capture **per-job** conclusions and `steps` counts, not the run-level conclusion. `steps: 0` on a
  `cancelled` job is the eviction tell; a job that ran and finished is not the same evidence.
- Enumerate candidate runs by **job admission time**, not run `created_at` — on #1889 the culprit's
  run predated the incident window by half an hour and any `created_at` filter excluded it.

If, after real effort, the live demonstration cannot be constructed without deploying or without
contending with another lane's traffic, **say so and stop** — report exactly what blocked it and
what evidence you did produce. A structural proof honestly labelled as structural is worth more
than a live-looking one that proves something else. Do not tick box 2 on a demonstration that
actually shows something weaker.

## Acceptance box 3 — the sweep

Enumerate **every** `concurrency:` block across all 13 workflows at your head (I count blocks in
`ci.yml`, `e2e-cli.yml`, `e2e-cli-prod.yml`, `e2e-cli-prod-local.yml`, `openhands-agent.yml`,
`openhands-phase-eval.yml`, `pages.yml`, `release-canary.yml`, plus the two tier-level blocks in
`e2e-cli.yml` — verify that count yourself, including job-level blocks, which a top-level grep
misses). For each, record: the key, whether it is ref-templated / entity-keyed / a repo-wide
literal, `cancel-in-progress`, and whether it carries a bound. Land the verdict as a parsed-YAML
test so the class stays closed, not as prose in a PR body.

## Standing hazards from this release

- **`cmd | tail` destroys the exit code.** Always `out=$(cmd); rc=$?`, then print `rc`.
- Verify a RED by checking the RED commit out in a **throwaway worktree**, never in the live tree.
- Pushing `.github/workflows/**` needs a credential with PAT `workflow` scope. This session's
  token has it (`gist, read:org, repo, workflow`) — confirmed at dispatch. If a push is refused for
  scope, stop and report; do not ask another lane to push for you.

## Validation to run and report with real exit codes

```
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all .llm/tools/release/release-canary-workflow_test.ts
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools --ext ts
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .llm/tools --ext ts
```

Plus a YAML parse of both edited workflows, reading the concurrency structure back from the parsed
document rather than grepping. Do **not** run `deno task e2e:cli` — this change cannot affect it and
the runtime tier group is contended across three topics.

## Deliverables

1. Commits on `ci/repo-wide-concurrency-bounds`. **Commit your work** — do not stop with a dirty
   tree; four authors this release stalled after finishing and before committing.
2. `.llm/runs/repo-wide-concurrency-bounds--1913/{worklog.md,evidence.md,drift.md}`.
3. A PR to `main`, **draft**, body carrying `Closes #1913`, labels `type:bug`, `area:tooling`,
   `priority:p3`, `orchestrator:internals`, `status:impl`, milestone `0.0.7`.
4. Report back: branch head SHA, PR number, every gate's real exit code, the full sweep table, your
   per-group justification, and which acceptance boxes you can and cannot honestly tick.
