use harness

# Slice W3-J — bump-before-publish scaffold behaviour (#1597)

| Field | Value |
| --- | --- |
| Worktree | `/home/codex/repos/ns006-w3-1597` |
| Branch | `fix/1597-bump-before-publish-scaffold` |
| Base | `origin/main@e85d8d28c` |
| Route | Codex · OpenAI · GPT-5.6 Sol · **medium** |
| Slice dir | `/home/codex/repos/netscript-006-fixes/.llm/runs/release-0.0.6-fixes--orchestration/slices/w3-j-1597/` |
| Priority | **p0 — release-critical, must land ahead of the next canary cut** |
| PLAN-EVAL | N/A — the defect and the required property are specified below |
| IMPL-EVAL | Normal **automatic** evaluator on draft → ready |

**Read `/home/codex/repos/netscript-006-fixes/.llm/runs/release-0.0.6-fixes--orchestration/context-pack.md` first.**

## SKILL

- `netscript-harness` · `netscript-release` (**authority on the cut sequence and what runs when**)
- `netscript-cli` (the E2E suites and what each gate proves) · `netscript-tools` · `netscript-pr` · `rtk`

## The defect

`#1454` (merged as `e85d8d28c`) added the composite gate
`behavior.package-backed-plugin-doctor`, registered **`critical: true`** in both `scaffold.plugins`
and `scaffold.runtime`. It resolves published plugin versions **unconditionally**:

```
packages/cli/e2e/src/application/gates/scaffold/behavior-plugins-health-gate.ts:5,96
  import { NETSCRIPT_RELEASE_VERSION } from '.../src/kernel/constants/jsr-specifiers.ts';
  … NETSCRIPT_RELEASE_VERSION,          ← used unconditionally

pins:  jsr:@netscript/plugin-workers@<version>
       jsr:@netscript/plugin-streams@<version>
```

Contrast the precedent, which resolves the same constant **conditionally**:

```
packages/cli/e2e/src/application/gates/scaffold/plugin-install-gates.ts:16
  publishedVersion ?? NETSCRIPT_RELEASE_VERSION      ← derives first, falls back
```

**The failure window.** `release:cut` commits the coordinated bump plus regenerated publish assets,
pushes `release/cut-<version>`, and opens a PR. That PR's CI classifies and runs the scaffold tiers —
and the classifier only excludes a root `deno.json` edit touching *solely* the `tasks` key
(`ci-classify-changes.ts:28`), which a coordinated bump is not. So the tiers run with the constant
reading the **new** version while nothing is published at that version yet, and both suites abort on
a **JSR 404** on a critical gate, for a reason unrelated to the payload.

This is the **first unconditional published-JSR dependency in the local-source `scaffold.runtime`
path** — the local-source path now requires the registry to be ahead of the tree.

### Already established — do not re-derive, but do verify if cheap

- **Canary path: not affected.** `release-canary.yml` orders publish → dispatch pinned prod E2E →
  await, so the version exists before the gate runs.
- **Stable post-publish E2E: not affected.** `e2e-cli-prod.yml` runs on `workflow_run` of `publish`
  gated on `conclusion == 'success'`.
- **Ephemeral canary branch push: not affected.** `e2e-cli.yml` has **no `push` trigger** — only
  `pull_request` and `workflow_dispatch` — and `release:canary` opens no PR, so no event exists to
  fire on. Verified by the orchestrator; the caveat is that this holds *because* no PR is opened.

**The exposure is confined to the release PR's own CI.**

## Required property (from #1597's acceptance)

Whatever you choose — **no scaffold execution in the bump→publish interval**, or **the gate degrading
instead of aborting** — it must be **mechanically enforced, not a convention**. A documented ordering
that nobody can violate is the only kind that survives. This milestone has repeatedly produced the
opposite: guards whose predicate could never fire, a scan that ran no command and reported success,
a `--frozen` flag that could never pass.

Consider, and justify your choice in the PR body:

- Derive the version conditionally, as `plugin-install-gates.ts` already does, so the local-source
  path stops depending on the registry.
- Have the gate detect an unpublished pinned version and **degrade to a stated exclusion** rather
  than abort — note this lane's own #1397 precedent: a gate that silently drops is worse than one
  that names its exclusion.
- Make the classifier exclude the coordinated-bump shape so the tiers do not run in that window.

Do **not** simply mark the gate non-critical — that trades a false red for a silent loss of coverage,
which is the failure class this whole lane has been removing.

## The proof

**Mechanically demonstrate the bump→publish window**, red before your fix and green after:

1. Construct the state: the version constant reading a version that is **not** published.
2. Show the current behaviour — the suite aborting on the 404 at a critical gate. Untruncated.
3. Apply your fix; show the same state now behaving correctly (either the tiers do not run, or the
   gate degrades with a **named, reported** exclusion).
4. Show a **published** version still exercises the gate fully — the fix must not disable it in the
   normal case. This is the guard against "fixed by making it never run".

Step 4 is the one most likely to be skipped and the one that matters most.

## Gates

```
rtk proxy deno task check · test · lint · fmt:check
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx
rtk proxy deno task quality:gate        # required — you are touching packages/**
```

**`scaffold.runtime` is serialized and contended across five lanes. Ask the orchestrator before
taking it** — do not start it yourself. If your proof needs it, say so and wait.

## Hazards

- **Never wrap an attached session in a shell `timeout`** — it kills the turn ~25s later.
- `deno fmt` rewraps and can silently undo a scripted edit — verify after formatting.
- Explicit-path `git add`; assert `git diff --stat -- deno.lock packages/fresh-ui/deno.lock` empty
  before each commit. Both lock repairs are on main (#1572, #1581) — do not touch either.
- **No publication of any kind, and do not run `release:cut`.** Another lane owns the release train
  and a cut is imminent.
- Shallow clones: ancestry claims via `gh api /compare/A...B`, never `merge-base --is-ancestor`.
- Re-sync against `main` immediately before draft → ready; do not re-draft after ready.

## Deliverables

1. The fix on `fix/1597-bump-before-publish-scaffold`.
2. `slices/w3-j-1597/evidence.md` — untruncated gate output plus all four proof steps, especially
   step 4.
3. A **draft PR against `main`**: `Closes #1597` in the **body**; labels `type:fix`, `area:tooling`,
   `gate:e2e`, **`priority:p0`** (the live issue is p0 — do not downgrade it), exactly one `status:`; milestone `0.0.6`; explicit acceptance
   checklist. **Check whether #1597 has acceptance checkboxes before adding a structured evidence
   block** — if it has none, do not add one; a block referencing non-existent boxes makes the mirror
   throw.
4. Leave the formal IMPL-EVAL box **unticked** — you cannot self-certify it; the orchestrator clears
   it by body edit after the verdict. Report the PR number. **Do not merge.**
