use harness

# Slice B — publish dry-run must not mutate the tree (#1417)

You are the implementation agent for PR B of the NetScript 0.0.6 **fixes lane**.

| Field | Value |
| --- | --- |
| Worktree | `/home/codex/repos/ns006-f-b-dryrun` |
| Branch | `fix/1417-publish-dry-run-no-mutation` |
| Base | `origin/main@01aa12b67` |
| Route | Codex · OpenAI · GPT-5.6 Sol · **medium** (`normal_implementation`) |
| Run dir | `.llm/runs/release-0.0.6-fixes--orchestration/` |
| Slice dir | `.llm/runs/release-0.0.6-fixes--orchestration/slices/b-1417/` |
| PLAN-EVAL | **N/A** — the fix is specified in the issue (see run `drift.md` D-2) |
| IMPL-EVAL | **Required and focused.** A separate Fable 5 · medium session will evaluate this slice. Write your evidence so it can be checked, not believed. |

**Read `/home/codex/repos/netscript-006-fixes/.llm/runs/release-0.0.6-fixes--orchestration/context-pack.md` first.** It carries the
lane's hard constraints and the failure class this issue belongs to.

## SKILL

- `netscript-harness` — evidence discipline, evaluator separation, run artifacts.
- `netscript-release` — publish-readiness surface and what the dry-run is actually gating.
- `netscript-deno-toolchain` — **canonical on the `catalog:` law (`catalog:` is npm-only) and on
  `deno publish --dry-run` behaviour.** Read this before deciding your approach.
- `netscript-tools` — scoped validation wrappers, changed-file and lock audits, git ground truth.
- `netscript-pr` — branch/PR lifecycle, labels, milestone, closing keywords.
- `rtk` — prefix read-heavy `git`/`gh`/`grep`; `rtk proxy` for `deno task`.

## The defect

Root `deno task publish:dry-run` (→ `.llm/tools/release/run-publish-dry-run.ts`, wired at
`deno.json:124`) **exits 0 while mutating the working tree**. It resolves `catalog:` imports to
exact npm specifiers across 18 package/plugin `deno.json` manifests. The package-scoped dry-run
additionally expands the MCP `publish` arrays. Observed:

```
packages/service/deno.json
-    "zod": "catalog:"
+    "zod": "npm:zod@^4.4.3"
```

Nineteen manifests dirtied across `packages/{aspire,cli,config,contracts,fresh,mcp,plugin,queue,
service}`, `packages/plugin-{ai,auth,sagas,triggers,workers}-core`, and
`plugins/{auth,sagas,streams,triggers,workers}`. `deno.lock` was **not** modified.

**Why it is a correctness defect, not churn.** `catalog:` exists so one catalog entry governs the
dependency version for every workspace member. Expanding it to a pinned `npm:zod@^4.4.3` silently
opts that package **out** of central version control — a later catalog bump no longer reaches it,
and the drift is invisible because the manifest still looks well-formed. Worse, eighteen
near-identical manifest edits read as formatting noise in review, so the one semantically
meaningful change among them would be indistinguishable from the other seventeen. It was caught
only because a slice happened to have a clean tree immediately before the gate.

Note also: this is a **read-only-sounding** command. "Dry run" implies no mutation.

## Approach

The issue ranks three options. Take the highest one that actually works, and say in the PR body
which you took and why:

1. **Preferred — run the dry-run against a throwaway copy / temp workspace** so the working tree is
   never touched.
2. Otherwise — snapshot the affected manifests before the run and restore them afterwards **inside
   the task itself**, so no caller has to know about the side effect.
3. Failing both — have the task **fail loudly** if it leaves a dirty tree, rather than exiting 0
   with 19 modified files.

**Do not "fix" this by removing the dry-run from the validation sequence.** It is a real gate; the
defect is the mutation, not the check. Whatever you choose, `publish:dry-run` must still gate what
it gates today — a dry-run that no longer detects publish problems is a regression dressed as a fix.

If you take option 2, be careful that a snapshot/restore is crash-safe enough not to leave the tree
in the expanded state when the run fails partway. If that cannot be guaranteed cheaply, option 1 is
better even at some cost in run time.

## Acceptance criteria (verbatim from #1417 — all five must be truthfully satisfiable)

- [ ] `deno task publish:dry-run` from the repo root leaves `git status --porcelain` empty on a
      clean tree.
- [ ] Proven: run it on a clean checkout, assert an empty status afterwards, and assert
      `packages/service/deno.json` still contains `"zod": "catalog:"`.
- [ ] The package-scoped dry-run likewise leaves MCP `publish` arrays unmodified.
- [ ] A regression check exists so a future change cannot silently reintroduce tree mutation.
- [ ] `deno.lock` remains unmodified in all cases.

Box 2 is an **execution** requirement, not a code requirement — actually run it on a clean tree and
paste the real output. Box 4 asks for a check that would **fail** if mutation returned; demonstrate
that it fails by temporarily reintroducing the mutation, then restore. A regression check you never
saw go red is not proven.

## Gates — these are the deliverable

Paste real, untruncated output into `evidence.md`.

```
rtk proxy deno task publish:dry-run     # then: rtk git status --porcelain  (must be empty)
rtk proxy deno task check
rtk proxy deno task test
rtk proxy deno task lint
rtk proxy deno task fmt:check
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/release --ext ts
```

Explicitly verify after the dry-run:

- `rtk git status --porcelain` → empty
- `rtk grep '"zod": "catalog:"' packages/service/deno.json` → still present
- `rtk git diff --stat -- deno.lock` → empty

`quality:gate` is **not** required if you stay inside `.llm/tools/**` and `deno.json` task wiring.
**If your fix touches any file under `packages/**` or `plugins/**`, it is required** — that is the
framework-wave gate law, and the scoped wrappers do not substitute for it.

`scaffold.runtime` is **not** part of this slice. Do not start it.

## Known hazards

- **The tree you are testing on must be clean before you measure.** The whole defect is invisible
  on a dirty tree. Assert cleanliness first, then run, then assert again.
- **`deno fmt` rewraps prose and can silently undo a scripted string edit.** Verify every edit
  after formatting.
- **Do not run any real publication.** Dry-run only. No `deno publish`, no tag push.
- **`deno.lock`:** do not commit it; never `deno cache --reload`.
- If you find the mutation originates upstream in `deno publish --dry-run` itself rather than in
  this repo's script, that is a real finding — say so explicitly rather than working around it
  silently, and record it in `drift.md`. It changes which of the three options is viable.

## Deliverables

1. The fix on branch `fix/1417-publish-dry-run-no-mutation`.
2. `/home/codex/repos/netscript-006-fixes/.llm/runs/release-0.0.6-fixes--orchestration/slices/b-1417/evidence.md` — every gate command with **real, untruncated** output, the
   clean-tree proof, and the regression check demonstrated **red** before green.
3. A **draft PR against `main`** via `netscript-pr` conventions, containing:
   - `Closes #1417` in the **body**.
   - Labels: `type:fix`, `area:release`, `area:tooling`, `priority:p1`, exactly one `status:`.
   - Milestone **`0.0.6`**.
   - The five acceptance boxes reproduced and ticked **only** where truthfully done.
4. Report the PR number back. **Do not merge.** Merge authority is the orchestrator's.

If you hit a red gate you cannot turn green, **escalate rather than going idle** — write the
blocker into `/home/codex/repos/netscript-006-fixes/.llm/runs/release-0.0.6-fixes--orchestration/slices/b-1417/evidence.md` and say so.
