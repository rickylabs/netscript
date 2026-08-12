use harness

# Slice A — release tooling truth (#1438 + #1430)

You are the implementation agent for PR A of the NetScript 0.0.6 **fixes lane**. Both defects live
in one file: `.llm/tools/release/github-release.ts`.

| Field | Value |
| --- | --- |
| Worktree | `/home/codex/repos/ns006-f-a-release-tooling` |
| Branch | `fix/1438-release-cut-canary-pair-inheritance` |
| Base | `origin/main@01aa12b67` |
| Route | Codex · OpenAI · GPT-5.6 Sol · **medium** (`normal_implementation`) |
| Run dir | `.llm/runs/release-0.0.6-fixes--orchestration/` |
| Slice dir | `.llm/runs/release-0.0.6-fixes--orchestration/slices/a-1438-1430/` |
| PLAN-EVAL | **N/A** — both fixes are specified in their issues (see run `drift.md` D-2) |
| IMPL-EVAL | **Required and focused.** A separate Fable 5 · medium session will evaluate this slice, with emphasis on #1438. Write your evidence so it can be checked, not believed. |

**Read `/home/codex/repos/netscript-006-fixes/.llm/runs/release-0.0.6-fixes--orchestration/context-pack.md` first.** It carries the
lane's hard constraints (no local publish, lock hygiene, wrapper-sourced evidence) and the failure
class both these issues belong to. Do not restate it; follow it.

## SKILL

- `netscript-harness` — evidence discipline, evaluator separation, run artifacts.
- `netscript-release` — release-tree identity, canary-pair invariants, publication rules. **The
  authority on what a release cut legitimately produces.**
- `netscript-deno-toolchain` — Deno 2.9 release/bump/publish behaviour; `deno doc` inspection.
- `netscript-tools` — scoped validation wrappers, changed-file and lock audits, git ground truth.
- `netscript-pr` — branch/PR lifecycle, labels, milestone, closing keywords.
- `rtk` — prefix read-heavy `git`/`gh`/`grep`; `rtk proxy` for `deno task`.

## Defect 1 — #1438 (p1, the one that matters)

`isVersionOnlyReleaseDiff` (line ~132) returns true only when **every** changed path is in the
`deno.json` manifest set discovered by `discoverVersionManifests`:

```ts
return changedFiles.every((path) => allowed.has(normalizeGitPath(path)));
```

But `release:cut` legitimately writes far more. The **measured** v0.0.5 cut (#1437) contained 62
files: 38 `deno.json` manifests **plus** `deno.lock`, `.llm/assets/agent-docs/prose.json.gz`,
`.llm/assets/agent-docs/provenance.json`, several `*.generated.ts` barrels, and six
`plugins/*/scaffold.plugin.json` version pins.

So a **correct, tool-generated release cut can never qualify for inheritance**. It fails closed —
the right direction — but it makes the documented `release:cut` → merge → `release:publish`
inheritance path dead code that every release hits. 0.0.5 paid for this with an entire extra canary
cycle (canary.21) and an extra publish attempt.

### Required construction

The issue names the safest construction and you should follow it: **derive the allowed set from the
same code that writes the bump**, so the generator and the verifier cannot disagree by
construction. This is the reasoning already applied in #1433's `assert-release-version.ts`, which
reuses `bump-version.ts`. Find the writer, reuse it — do not hand-maintain a second literal list of
paths that will drift the moment the bump output changes.

`isExactVersionReplacement` (line ~151) already performs the byte-level per-file check that each
changed file differs only by the version replacement. **That check is what keeps a widened path set
honest, and it must remain in force on every path you newly admit.** If any legitimately-produced
file cannot satisfy a byte-level version-replacement check (a gzipped asset, for example, or a
lockfile whose content changes beyond a version string), that is a real design question — do not
paper over it by weakening the byte check globally. Handle it explicitly, name the reasoning in the
code, and record it in `drift.md`. Widening the byte check to admit arbitrary content would
convert a fail-closed guard into a false green, which is strictly worse than the current defect.

### Acceptance for #1438

The issue carries no checkboxes, so **you must state acceptance explicitly in the PR body** (the
orchestrator's pre-merge check 7 verifies the PR body against what shipped). At minimum:

- A test proves `isVersionOnlyReleaseDiff` returns **true** for a realistic full coordinated-bump
  changed-file set (manifests + lockfile + agent-docs assets + generated barrels + plugin pins).
- A test proves it still returns **false** for genuine source drift mixed into that set — e.g. a
  `packages/**/*.ts` edit alongside the bump. **This negative test is the deliverable**, not a
  nicety: without it you have widened a release guard with nothing proving it still refuses.
- The allowed set is derived from the bump writer, and a test would fail if the writer's output
  gained a path the verifier does not know about.

## Defect 2 — #1430 (p2)

At line ~522:

```ts
const previous = plan.prevTag
  ? { tag: plan.prevTag, since: '' }
  : await fetchPreviousRelease(plan.repo, token, tag);
...
const closed = previous?.since ? await fetchClosedIssues(plan.repo, token, previous.since) : [];
```

`--prev-tag` sets `since: ''`, which is falsy, so `fetchClosedIssues` **never runs** and the
closed-issues list is always empty. The run then logs `closed issues since previous release: 0`,
which reads like a true zero rather than a skipped query. Measured at v0.0.5 cut time, the real
answer was **89**.

### Required behaviour

- When `--prev-tag` is given, resolve **that tag's** release date (falling back to the tag's commit
  date when no release exists for it) and use it as `since`, so the closed-issues window matches
  the changelog window.
- Add the guard the issue asks for: **a known previous tag with an empty `since` is a programming
  error, not a legitimate zero.** Fail or log loudly. A silent empty list that looks like real data
  is the exact failure class this lane exists to remove.
- A test proves the `--prev-tag` path actually queries closed issues, and a test proves the
  empty-`since`-with-known-tag case is loud rather than silent.

## Gates — these are the deliverable, not an afterthought

Turn these green and paste the real output into `evidence.md`. A gate you did not run is a missing
verdict, not a pass.

```
rtk proxy deno task check
rtk proxy deno task test         # or the scoped test file(s) plus a full-suite confirmation
rtk proxy deno task lint
rtk proxy deno task fmt:check
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/release --ext ts
```

Also required for this slice specifically:

- **The release test suite that covers `github-release.ts`** — find it and run it. This file is
  release-identity code; a change here that is not covered by its own suite is not proven.
- **`git status --porcelain` is empty** after your gate runs, and `deno.lock` is unmodified.

`quality:gate` is **not** required — this slice touches `.llm/tools/**`, not `packages/**` or
`plugins/**`. If that changes, run it.

`scaffold.runtime` is **not** part of this slice. Do not start it; it is serialised across the lane
and another slice may hold it.

## Known hazards

- **`deno fmt` rewraps prose and can silently undo a scripted string edit.** Verify every edit
  after formatting (grep for the intended content); do not assume a patch survived.
- **Do not run any real publication.** Prove with the canonical release tests and dry-runs only.
  No `deno publish`, no release:publish, no tag push.
- **`deno.lock`:** do not commit it unless genuinely required; never `deno cache --reload`.

## Deliverables

1. Both fixes on branch `fix/1438-release-cut-canary-pair-inheritance`, committed with clear
   messages (separate commits per issue is preferred — it keeps the focused IMPL-EVAL on #1438
   readable).
2. `/home/codex/repos/netscript-006-fixes/.llm/runs/release-0.0.6-fixes--orchestration/slices/a-1438-1430/evidence.md` — every gate command and its **real, untruncated** output, plus
   the negative-test demonstration for each issue (red before, green after).
3. A **draft PR against `main`** via `netscript-pr` conventions, containing:
   - `Closes #1438` and `Closes #1430` in the **body** (bare `#N` does not auto-close).
   - Labels: `type:fix`, `area:tooling`, `area:release`, `priority:p1`, exactly one `status:`.
   - Milestone **`0.0.6`**.
   - An explicit acceptance checklist, ticked only where truthfully done. If something cannot be
     truthfully ticked, leave it unticked and say why — the orchestrator will not merge over a
     false tick, and moving a criterion with a written reason is always the correct move.
4. Report the PR number back. **Do not merge.** Merge authority is the orchestrator's.

If you hit a red gate you cannot turn green, **escalate rather than going idle** — write the
blocker into `/home/codex/repos/netscript-006-fixes/.llm/runs/release-0.0.6-fixes--orchestration/slices/a-1438-1430/evidence.md` and say so. Going quiet at a red gate is the single
most common way this lane loses hours.
