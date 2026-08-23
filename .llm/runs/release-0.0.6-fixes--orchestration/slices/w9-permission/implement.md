use harness

# Slice W9 — verify-canary-pair lacks deno run permission (#1634)

| Field | Value |
| --- | --- |
| Worktree | `/home/codex/repos/ns006-w9` |
| Branch | `fix/1634-verify-canary-pair-deno-permission` |
| Base | `origin/main@c63dcc669` |
| Route | Codex · OpenAI · GPT-5.6 Sol · **low** |
| Priority | **P0 — stable 0.0.6 publish is blocked; the release tag already exists** |
| PLAN-EVAL | N/A — seam identified, small deterministic fix |
| IMPL-EVAL | Automatic evaluator on draft → ready per small-fix policy. **Do not flip; I flip it.** |

## SKILL

- `netscript-harness` · `netscript-release` (**authority on the publish chain and the canary pair**)
- `netscript-tools` · `netscript-pr` · `rtk`

## The defect

`publish.yml` run `31663814883` at `c63dcc669` failed at **Require green canary pair**, before any
JSR upload:

```
error: Stable publication blocked: agent-docs prose contains non-version changes, so the parent
canary evidence cannot authorize this content.
Requires run access to "deno", run again with the --allow-run flag
```

The prose sentence is a red herring. #1628 added semantic corpus freshness to
`assertPreparedReleaseGeneratedOutputsFresh`, which **spawns `deno` subprocesses**. The task grants
only `git`:

```jsonc
// deno.json
"release:verify-canary-pair":
  "deno run --allow-net=api.github.com --allow-env=GH_TOKEN --allow-run=git --allow-read ..."
```

`.github/workflows/publish.yml:75` calls that task. The `deno` spawn is denied, the denial is caught,
and it is re-reported as a content verdict.

**Nothing was published.** No partial publish, no stranded versions. The `v0.0.6` tag and release at
`c63dcc669` exist and **must be preserved** — do not delete, move, or retag anything.

## Required

1. **Grant `git` and `deno` run access explicitly** in the trusted `publish.yml` invocation.
2. **Align the `deno.json` task definition** so local and future callers get the same grant. The two
   must not drift; if you can express the grant once and have both consume it, do that.
3. **Do not broaden to bare `--allow-run`.** Enumerate the executables. A blanket grant in the trusted
   publish path is a larger regression than the bug.

## Discriminating tests — required, each RED against current code

1. **Permission/contract test**: the verify path, when it cannot spawn its subprocesses, fails with a
   *distinguishable* infrastructure/permission error — **not** a content verdict. This is the second
   defect: a failure to *execute* a check must never be reported as the check *failing*. It sent the
   first RCA down entirely the wrong path.
2. **The real guard still works**: genuine content drift still produces the content-blocked error.
   Prove the distinction above did not weaken it.
3. Assert the granted executable set is exactly what the verify path needs — so a future permission
   narrowing or widening fails the test rather than silently changing publish behaviour.

State in `evidence.md` which assertion fails on the pre-fix code for each.

## Gates

```
rtk proxy deno task check · test · lint · fmt:check
deno task release:verify-canary-pair -- --repo rickylabs/netscript    # must reach a real verdict, not a permission error
```

That last command is the one that failed in production — run it and show it reaching an actual
verdict. One dispatch per turn, then hand back.

## Hazards

- Never wrap an attached session in a shell `timeout`.
- `deno fmt` rewraps; re-read after formatting.
- Explicit-path `git add`; assert `git diff --stat -- deno.lock packages/fresh-ui/deno.lock` empty.
- **No publication, no tag creation, no retag, no `release:publish`, no `release:cut`.** The `v0.0.6`
  tag is immutable and already exists; I own the recovery dispatch.
- Write evidence to `.llm/runs/fix-1634-verify-canary-pair-deno-permission--w9/evidence.md`. Do
  **not** create a repository-root `slices/` directory.

## Deliverables

1. The fix on `fix/1634-verify-canary-pair-deno-permission`.
2. `.llm/runs/fix-1634-verify-canary-pair-deno-permission--w9/evidence.md` — untruncated gate output
   and the pre-fix RED for each test.
3. A **draft PR against `main`**: `Closes #1634` in the **body**; labels `type:fix`, `area:release`,
   `area:tooling`, `priority:p0`, exactly one `status:`; milestone `0.0.6`. #1634 has acceptance
   checkboxes — match each evidence entry's text **verbatim** or use `box-index`.
4. Report the PR number and stop. Do not merge, do not flip to ready, do not touch labels.
