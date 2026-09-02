# Worklog — #1908 runtime concurrency-key isolation

## Status

- Phase: implementation
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
