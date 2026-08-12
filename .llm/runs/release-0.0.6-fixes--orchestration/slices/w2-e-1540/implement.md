use harness

# Slice W2-E — interrupted publish/preflight tree safety (#1540)

**PLAN FIRST. Do not implement until PLAN-EVAL returns PASS.** This brief has two phases and you
stop between them.

| Field | Value |
| --- | --- |
| Worktree | `/home/codex/repos/ns006-w2-1540` |
| Branch | `fix/1540-publish-interrupt-tree-safety` |
| Base | `origin/main@3c9dc1f39` |
| Route | Codex · OpenAI · GPT-5.6 Sol · **high** (`complex_implementation`) |
| Slice dir | `/home/codex/repos/netscript-006-fixes/.llm/runs/release-0.0.6-fixes--orchestration/slices/w2-e-1540/` |
| PLAN-EVAL | **REQUIRED** — this is not deterministic; see below |
| IMPL-EVAL | Normal automatic on draft → ready. Do not request a waiver. |

**Read `/home/codex/repos/netscript-006-fixes/.llm/runs/release-0.0.6-fixes--orchestration/context-pack.md` first.**

## SKILL

- `netscript-harness` · `netscript-release` (**authority on publish/preflight modes, the canary
  channel, and what may never be hand-run**) · `netscript-deno-toolchain` (**canonical on the
  `catalog:` law — `catalog:` is npm-only**) · `netscript-tools` · `netscript-pr` · `rtk`

## The defect

#1417 fixed the **dry-run** path: `deno task publish:dry-run` now executes inside a throwaway
workspace, so catalog materialization and Deno's publish-shape rewrites cannot touch the source
checkout. That shipped as `84dd44ae7` and is live.

**Real `publish` and `preflight` were not in that scope.** They still materialize npm `catalog:`
entries in the live tree and restore them in a `finally` that runs only on **normal completion**. An
interruption — hard kill, CI timeout, runner eviction — between materialization and restore leaves
the tree with `catalog:` expanded to pinned `npm:` specifiers across ~19 manifests.

That is the original #1417 end state: a package silently opted out of central version control, the
drift invisible because the manifest still looks well-formed, and eighteen near-identical edits
reading as formatting noise in review. #1417 removed the *routine* path to that state; this is the
*interrupted* path to the same state. **Not a regression** — this behaviour predates #1417.

Provenance: found by the separate-session IMPL-EVAL of PR #1538 as an explicit non-blocking,
out-of-scope finding, and routed to an issue rather than ticked. Drift D-4 in this run records the
mixed-origin analysis.

## Why PLAN-EVAL is required here

**#1417's solution is not available to you.** A dry-run can run in a throwaway copy because it never
needs to reach the registry as itself. A **real publish** does. So the mechanism is an open design
question, and the issue deliberately names none. Candidate shapes, none endorsed:

- Signal/exit handling that restores on `SIGINT`/`SIGTERM` as well as normal completion — but a
  `SIGKILL` cannot be trapped at all, so this is partial by construction and you must say so.
- An atomic restore that does not depend on the process surviving — e.g. materialize into a staging
  location and have the publish read from there, so the live tree is never the mutated thing.
- Restructuring so materialization never touches tracked files.

There are real trade-offs (does the publisher need the materialized manifests *in place* to publish
correctly? does staging change what gets published?), and getting this wrong risks the publish
pipeline itself. That is why a plan is evaluated before code.

## Phase 1 — deliverable: a plan, and nothing else

Write `slices/w2-e-1540/plan.md` covering:

1. **Where materialization happens today**, cited by file and line, and exactly which paths it
   writes. Do not restate #1417's dry-run fix — that is done; identify what the *real* modes do.
2. **Which processes can be interrupted where**, and what each interruption leaves behind. Be
   specific about `SIGINT` / `SIGTERM` / `SIGKILL` / runner eviction, and be explicit that `SIGKILL`
   is untrappable.
3. **The mechanism you propose**, with the trade-offs stated — including whether the publisher
   requires materialized manifests in their real locations, and what your approach means for what
   actually gets published. If your mechanism cannot cover `SIGKILL`, **say so plainly** rather than
   implying total coverage.
4. **How you will prove it by execution**, per acceptance box 2. Killing a process mid-materialize
   is genuinely awkward to test deterministically — say how you will make it reliable rather than
   flaky.
5. **What you will not do.** Explicitly: no local publish, no hand-run publish script, no change to
   what the publish gate actually checks.

Then **push the branch and open a draft PR carrying the plan**, and **stop**. Report back. The
orchestrator applies the automatic PLAN-EVAL labels; you do not. Do not begin implementation until
the PLAN-EVAL verdict is PASS and the orchestrator tells you to proceed.

## Phase 2 — implementation, only after PLAN-EVAL PASS

Acceptance (verbatim from #1540):

- [ ] An interrupted `publish` or `preflight` cannot leave expanded `catalog:` specifiers in the
      source tree
- [ ] Proven by executing the interruption (not by reasoning about the `finally`): kill the process
      between materialization and restore, then assert `git status --porcelain` is empty and
      `packages/service/deno.json` still contains `"zod": "catalog:"`
- [ ] A regression check exists and has been demonstrated failing before it passes
- [ ] `deno.lock` remains unmodified in all cases

Box 2 is explicit that reasoning about the `finally` is **not** acceptable evidence. Execute the
interruption.

## Gates

```
rtk proxy deno task check · test · lint · fmt:check
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/release --ext ts
rtk proxy deno task publish:dry-run   # then rtk git status --porcelain must be empty
```

`quality:gate` is required **only if** your change touches `packages/**` or `plugins/**`. Note it
covers neither `.llm/tools/**` (#1403) nor, on the PR path, your own diff when the base is stale
(#1564) — so run your own scan for `deno-lint-ignore` / `as unknown as` / `@ts-ignore` regardless.

## Hard constraints

- **No publication, ever.** No `deno publish`, no `release:publish`, no canary dispatch, no tag push.
  `netscript-release` prohibits ad-hoc publication outright; prove everything with tests and
  dry-runs.
- **Do not weaken what the publish gate checks.** #1417's issue said it directly: the defect is the
  mutation, not the check. The same applies here.
- **Do not commit `deno.lock`**; never `deno cache --reload`.
- `deno fmt` rewraps and can silently undo a scripted edit — verify after formatting.
- Push via explicit refspec; no upstream is set deliberately.
- Re-sync against `main` immediately before draft → ready; do not re-draft after ready.

## Deliverables

**Phase 1:** `plan.md`, a draft PR carrying it, and a report back. Then stop.
**Phase 2 (after PASS):** the fix, `evidence.md` with untruncated gate output and the executed
interruption proof, the acceptance boxes ticked only where truthfully done, `Closes #1540` in the
PR **body**, labels `type:fix`/`area:release`/`area:tooling`/`priority:p2`/one `status:`, milestone
`0.0.6`, and `acceptance-evidence` using **`box-index:`** keys. **Do not merge.**
