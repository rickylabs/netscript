use harness

## SKILL

Activate: `netscript-harness`, `netscript-doctrine`, `netscript-tools`, `netscript-pr`,
`netscript-deno-toolchain`, `deno-fresh` (Lume/Vento docs surface), `rtk`.

Read `.llm/harness/workflow/run-loop.md` and `.llm/harness/gates/plan-gate.md`. This slice is small
and mechanical: record `PLAN-EVAL: N/A` with a one-line justification in the run artifacts before
touching source, then implement. Keep `worklog.md`, `context-pack.md` and `drift.md` current in
`.llm/runs/release-0.0.5--orchestration/slices/docs-1411/` and commit them with the slice.

You are Tier-D. You do not self-certify: the orchestrator runs the mandatory separate-session
IMPL-EVAL, CI and merge. Report back and stop when your gates are green and the draft PR is open.

## Non-negotiables

- One writer per worktree. You are the only writer in `/home/codex/repos/ns005-docs1411`.
- Explicit refspec pushes only; never push to `main`.
- Do not start Aspire, containers, or any `e2e:cli` runtime suite. No serialized runtime token is
  granted to you; if you believe you need one, stop and request it.
- Do not weaken, relax, skip, or add an allowance to any gate to make it pass. A gate that fails is
  a finding to report, not an obstacle to route around.
- Report anything you cannot evidence, plainly.

Narrow docs-source slice: **#1411**, milestone 0.0.5.

Context: PR #1406 / issue #1407 repaired the docs build and landed on `main@399f60185` (site builds,
`pages.yml` green, live site verified). This is a **different** defect on the same surface, found
afterwards while regenerating the agent-docs corpus for #1102.

## Setup

Your worktree `/home/codex/repos/ns005-docs1411` is already checked out on branch
`fix/docs-versionless-jsr-specifiers` off `origin/main` (`399f60185`). You are the only writer here.

Push with an explicit refspec only:
`git push origin HEAD:refs/heads/fix/docs-versionless-jsr-specifiers`. Never push to `main`.

## The defect

`docs/site` pins NetScript specifiers through a `releaseSpecifier` variable — e.g.
`jsr:@netscript/cli{{ releaseSpecifier }}` in `.vto`, or `"…jsr:@netscript/cli" + releaseSpecifier + "…"`
inside component-expression strings. **Four places omit it**, so the published docs instruct a
version-less install/import:

| File | Line | Defect |
| --- | --- | --- |
| `docs/site/data-persistence/how-to/use-a-second-database.md` | 46 | `deno install … --name netscript jsr:@netscript/cli.` — missing `" + releaseSpecifier + "` |
| `docs/site/identity-access/how-to/add-authentication.md` | 53 | same omission |
| `docs/site/orchestration-runtime/how-to/author-a-plugin.md` | 49 | same omission |
| `docs/site/orchestration-runtime/how-to/author-a-plugin.md` | 187 | import-map example pins `jsr:@zod/zod@4.4.3` but leaves `"@netscript/plugin": "jsr:@netscript/plugin"` and `"@netscript/plugin-workers-core"` unversioned |

The correct pattern already exists in the same page family —
`docs/site/data-persistence/how-to/database-migration.md:64`. This is an authoring omission, not a
policy choice.

## Why it is worth a slice

These pages are now embedded into the agent-docs corpus, which compiles into
`packages/mcp/src/publish-assets.generated.ts` — a file `check:netscript-jsr-specifiers` scans. The
guard fires with `failures=4`, and `packages/cli/src/kernel/constants/version-drift_test.ts:60`
fails on the same content. Beyond the red gate: an agent reading
`"@netscript/plugin": "jsr:@netscript/plugin"` will emit a version-less specifier into a user's
`deno.json` — exactly the class that guard exists to prevent, one step removed.

## Boundaries — read carefully

- **Do not add an allowance for `publish-assets.generated.ts`, and do not narrow
  `check:netscript-jsr-specifiers` to skip embedded documentation payloads.** That would silence a
  true finding and keep shipping bad install instructions. The guard is right; the docs are wrong.
- Do not weaken or restructure the source-format/rendered-output gates you added in #1407.
- Do not touch `packages/**`, `plugins/**`, or any lockfile. Corpus/asset regeneration is **not**
  yours — the #1102 lane rebases and regenerates from corrected main after you land.
- Do not start Aspire, containers, or any `e2e:cli` runtime suite.

## Work

1. Repair the four sites using the established `releaseSpecifier` pattern.
2. **Sweep the whole of `docs/site` for the same class** and report the total count you find, not
   just these four. My scan showed 70 `jsr:@netscript/*` occurrences overall; most are correctly
   pinned. Report exactly how many were unpinned and fix every one.
3. Consider whether this class deserves a gate, given #1407's lesson — a check that rejects a
   version-less `jsr:@netscript/*` in `docs/site` source would stop it recurring. If you add one,
   prove it RED against the pre-fix content. If you judge the existing guard sufficient once the
   corpus embeds the pages, say why.
4. Run the docs gates: `deno task build`, `check:links`, `check:caveats`, `test:source-format`, and
   `deno task check:netscript-jsr-specifiers` from the repo root.
5. Open a **draft** PR against `main` with `Closes #1411`, milestone 0.0.5, taxonomy labels with
   exactly one `status:`. Report back and stop — I own the IMPL-EVAL, CI and merge.

State plainly anything you cannot evidence.
