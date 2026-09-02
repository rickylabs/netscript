# Worklog — #1908 runtime concurrency-key isolation

## Status

- Phase: gate complete; IMPL-EVAL pending
- Branch: `ci/e2e-concurrency-key-isolation`
- Baseline: `origin/main` at `d5c5810db`
- Implementation lane: Codex · GPT-5.6 Sol · high, session
  `01a0607f-b1df-7b33-8f3f-cdb1b872b49b`
- PLAN-EVAL: **N/A** — this is a small mechanical workflow fix whose exact literals, header
  disclosures, non-scope, transition trade-off, and gates were locked in `plan.md` before
  implementation. No architecture or sequencing decision remains open.
- Doctrine / archetype: **N/A** — workflow infrastructure and run artifacts only; no
  `packages/**` or `plugins/**` surface.

## Design

### Public surface

The only public surface is the Queue policy contract in `.github/workflows/e2e-cli.yml` and the two
runtime-tier concurrency group values consumed by GitHub Actions. No exports, entry points, CLI
commands, product types, or package/plugin APIs change.

### Domain vocabulary

- **v1 key generation** — the unversioned runtime-tier concurrency groups on pre-#1846 branches.
- **v2 key generation** — the versioned groups on fixed branches.
- **stale / unfixed branch** — a live branch whose workflow still uses v1 and
  `cancel-in-progress: true`.
- **fixed branch** — a branch that carries #1846's bounded queue policy and the v2 group keys.
- **tier mutex** — GitHub Actions concurrency admission for either the docker or sqlite runtime job.
- **honest verdict** — a completed tier receipt; a cancelled tier is not a conclusion.

### Ports

GitHub Actions is the sole external system. This slice uses its existing workflow concurrency and
`pull_request` label-event semantics directly; it introduces no abstraction.

### Constants

| Tier | v1 | v2 |
| --- | --- | --- |
| docker | `e2e-scaffold-runtime-global` | `e2e-scaffold-runtime-global-v2` |
| sqlite | `e2e-scaffold-runtime-sqlite-global` | `e2e-scaffold-runtime-sqlite-global-v2` |

### Commit slices

| Slice | Change | Proving gate | Files |
| --- | --- | --- | --- |
| S1 | Isolate fixed runtime tiers on v2 group keys | exact diff and literal-count check | `.github/workflows/e2e-cli.yml` |
| S2 | Extend the existing Queue policy with transition and operator guidance | header review plus all-concurrency-block before/after comparison | `.github/workflows/e2e-cli.yml` |
| S3 | Capture real-exit evidence and bounded proof claims | explicit YAML parse, scoped status, and recorded exits | this run directory |

### Deferred scope

No queue bound, cancellation flag, job name, `if:` condition, top-level per-ref group, classifier,
other workflow, topic branch, or package/plugin path changes. Removing the v1/v2 transition guidance
after every live branch carries v2 is intentionally deferred.

### Contributor path

Future maintainers start at the workflow's Queue policy header, then inspect the three
`concurrency:` blocks. The header explains why the tier keys are versioned and how to move stale
branches safely; the job blocks remain the executable source of truth.

## Baseline evidence

Before implementation, every concurrency block was listed with a direct `awk` command captured as
`out=$(cmd 2>&1); rc=$?`; exit **0**:

```text
90:concurrency:
91:  group: e2e-cli-${{ github.workflow }}-${{ github.ref }}
92:  cancel-in-progress: true

261:    concurrency:
262:      group: e2e-scaffold-runtime-global
263:      cancel-in-progress: false
264:      queue: max

348:    concurrency:
349:      group: e2e-scaffold-runtime-sqlite-global
350:      cancel-in-progress: false
351:      queue: max
```

## Slice evidence (real captured exits; never a pipeline)

**E1 — exactly the two group literals changed.** `group_literal_lines_changed=4` (2 removed, 2 added):

```
-      group: e2e-scaffold-runtime-global
+      group: e2e-scaffold-runtime-global-v2
-      group: e2e-scaffold-runtime-sqlite-global
+      group: e2e-scaffold-runtime-sqlite-global-v2
```

**E2 — no other directive moved.** Excluding added header comment lines and the two group literals,
`non_comment_non_group_changed_lines=**0**`.

**E3 — queue policy untouched on both tiers.** Each versioned group is still followed verbatim by
`cancel-in-progress: false` and `queue: max`.

**E4 — parsed YAML, `YAML_PARSE_REAL_EXIT=0`** (structure read back from the parsed document, not
grepped from text):

```
scaffold-runtime        {"group":"e2e-scaffold-runtime-global-v2","cancel-in-progress":false,"queue":"max"}
scaffold-runtime-sqlite {"group":"e2e-scaffold-runtime-sqlite-global-v2","cancel-in-progress":false,"queue":"max"}
top-level concurrency   {"group":"e2e-cli-${{ github.workflow }}-${{ github.ref }}","cancel-in-progress":true}
job_count 6
```

The top-level per-ref group is confirmed **unchanged** — per-ref supersession on push stays intended
and disclosed (#1846 F-3), and is explicitly out of this slice's scope.

**E5 — scope containment.** `git status --porcelain` shows changes only in
`.github/workflows/e2e-cli.yml` and this run directory. No `packages/**`, no `plugins/**`, no other
workflow, no classifier change.

## Reconcile

Implementation and evidence completed by the topic supervisor after the Codex leaf produced the
workflow change and run artifacts but stopped before committing — the same author-stall pattern seen
three times earlier in this release. The leaf's authored content (the two-literal change and the
header prose incorporating all four post-dispatch operator facts) is preserved byte-for-byte; the
supervisor added only the captured-exit evidence above, this note, and the commit/PR.

## Co-author acceptance review

The pre-existing workflow regression test used substring assertions for the two v1 key spellings.
Because both v2 literals retain those strings as prefixes, the test could pass if the version suffix
was removed. The acceptance slice tightened both assertions to newline-terminated v2 literals and
added explicit absence assertions for both newline-terminated v1 literals.

Focused command:

```text
deno test --allow-read --allow-write --allow-env .github/scripts/ci-classify-changes.test.ts
60 passed | 0 failed
REAL_EXIT=0
```

The hosted mixed-generation scheduler exercise and independent IMPL-EVAL remain pending. No local
`scaffold.runtime` run is added: it would test runtime behavior, not GitHub concurrency admission,
and would duplicate the real hosted job required by issue acceptance.

## Hosted mixed-generation acceptance

Acceptance ran against implementation/test head `5fe82956da1713eb9a9c4679f0e552d078997077`.

| Generation | Run / attempt | Job | Started / eligible | Terminal conclusion |
| --- | --- | --- | --- | --- |
| fixed v2 | [`33598546960`](https://github.com/rickylabs/netscript/actions/runs/33598546960) | docker `100147054107` | `06:22:57Z` | **failure**, `06:32:43Z` — non-cancelled after 9m46s |
| fixed v2 | [`33598546960`](https://github.com/rickylabs/netscript/actions/runs/33598546960) | sqlite `100147054142` | `06:22:56Z` | operator-cancelled `06:40:02Z`, after more than 16 minutes of continued execution |
| stale v1 | [`33596134134`, attempt 2](https://github.com/rickylabs/netscript/actions/runs/33596134134/attempts/2) | docker `100147234478` | pending `06:23:43Z` | operator-cancelled `06:24:26Z` after admission proof |
| stale v1 | [`33596134134`, attempt 2](https://github.com/rickylabs/netscript/actions/runs/33596134134/attempts/2) | sqlite `100147234673` | pending `06:23:43Z` | operator-cancelled `06:24:26Z` after admission proof |

The ordering is decisive: both fixed jobs were already running before both stale jobs became
eligible. The stale-v1 arrival would have shared and applied the old concurrency behavior without
key isolation. Instead the fixed docker job continued to its own runtime failure and fixed sqlite
continued for more than 16 minutes. Neither was evicted by the stale arrival. The stale run was
cancelled as soon as admission was captured to avoid executing a duplicate scaffold runtime; sqlite
on the fixed run was stopped after docker had reached the required real terminal conclusion and
sqlite had independently demonstrated sustained post-arrival execution.

### Runtime failure classification

The docker terminal conclusion is an honest runtime failure, not a concurrency failure and not a
green gate. Its one failing suite step was `runtime.wait.garnet`: Garnet did not become healthy
within 300 seconds; the suite reported `passed=46 failed=1 skipped=0`. That pre-existing readiness
defect is owned by PR [#1858](https://github.com/rickylabs/netscript/pull/1858), whose branch run
[`33597731881`](https://github.com/rickylabs/netscript/actions/runs/33597731881) completed both
runtime tiers successfully. #1908 changes only concurrency admission, so the Garnet fix is not
folded into this branch. The hosted receipt is a **PASS for isolation** and a **FAIL for the
unrelated pre-#1858 runtime baseline**; those verdicts are kept separate.

The opt-in `e2e-cli-gate` label was removed after this one decisive exercise so evidence-only and
evaluator commits do not repeat the expensive runtime gate.
