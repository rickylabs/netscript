# IMPL-EVAL: declare the undeclared plugin-streams-core dependency (#1543 / PR #1876)

## Metadata

| Field | Value |
| --- | --- |
| Run ID | `chore-declare-streams-core-dependency--1543` |
| Target | `packages/plugin-workers-core/deno.json`, `plugins/triggers/deno.json`, `deno.lock` |
| Head evaluated | `10aa2a944` |
| Base | `main` @ `38f2ce735` |
| Archetype | `3 - Runtime/Behavior`; `5 - Plugin Package` |
| Scope overlays | none |
| Evaluator | separate opposite-family IMPL-EVAL session — Claude Code host, `z-ai/glm-5.3-flash` (approved evaluator-lane model), 2026-09-01; generator lane was OpenAI GPT-5.6 Sol per `supervisor.md`, so no self-certification |
| Method | read-only over source; all exits captured as `out=$(cmd 2>&1); rc=$?`; single detached base probe at `38f2ce735` removed afterwards |

## Central question — re-derived, CONFIRMED

The issue demanded the publish-impact question be settled before anything else. Re-derived
independently at both refs:

| Run | Evidence | Exit |
| --- | --- | --- |
| Base `38f2ce735` (detached probe worktree) | `deno task publish:dry-run` → "Success Dry run complete" | `BASE_PUBLISH_DRY_RUN_REAL_EXIT=0` |
| Head `10aa2a944` (this worktree) | `deno task publish:dry-run` → "Success Dry run complete" | `PUBLISH_DRY_RUN_REAL_EXIT=0` |

Base output contains no undeclared-import warning (its 25 warnings are all pre-existing unrelated
`unanalyzable-dynamic-import`). Box 1's answer is therefore **silently accepted**, exactly as the
leaf recorded. This is a **consistency** issue, not release-integrity. Box 3 is conditional and
**N/A**, and the leaf honoured the prohibition: the diff adds no check, gate, or fitness script.

The head result is actually *stronger* evidence than the base probe: at head, three publishable
members (`packages/sdk`, `packages/plugin-sagas-core`, `packages/plugin-auth-core`) still import
streams-core with **no declaration**, and the workspace dry-run still exits 0 — the silent-acceptance
mechanism is proven against members that remain undeclared post-fix.

## Verification 1 — completeness of the import set: FAIL

Derived the workspace-wide import set myself (`grep` over `packages/`, `plugins/`, `examples/`,
`apps/`, distinguishing module imports from string literals and generated prose):

| Workspace member | Import sites | Declares? | Publishable? |
| --- | --- | --- | --- |
| `packages/plugin-streams-core` | self-references | yes (itself) | yes |
| `packages/plugin-workers-core` | `src/streams/{producer,schema}.ts` | **yes (this slice)** | yes |
| `plugins/triggers` | `streams/{producer,factory,schema}.ts` + `src/public/mod.ts:23` | **yes (this slice)** | yes |
| `packages/fresh` | `src/runtime/{streams,ai}/*` (6 files) | yes | yes |
| `plugins/auth`, `plugins/sagas`, `plugins/streams`, `plugins/workers` | streams adapters/probes | yes | yes |
| `packages/sdk` | `src/streams.ts:36-37` (value + `export type *`; exported as `./streams`) | **NO** | yes |
| `packages/plugin-sagas-core` | `src/streams/schema.ts:1-12` (value + types) | **NO** | yes |
| `packages/plugin-auth-core` | `src/streams/mod.ts:7-15` (value + types) | **NO** | yes |
| `packages/cli/e2e` | 5 files under `src/application/gates/scaffold/` | **NO** | no (`publish:false`) |
| `packages/cli` | not an import — `workspace-mutator.ts:199` is a codegen string | n/a | — |
| `packages/mcp` | not an import — generated doc prose only | n/a | — |

`deno.lock` corroborates: `workspace.members.*.dependencies` lists
`jsr:@netscript/plugin-streams-core@0.0.6` under exactly `packages/fresh`,
`packages/plugin-workers-core`, `plugins/{auth,sagas,streams,triggers,workers}` — and none of the
four undeclared members. All four undeclared import sites predate the slice by many commits
(`packages/sdk/src/streams.ts` since `e5bae2858`; sagas-core schema since `4d438ce1a`; auth-core
streams since `d6db645a8`; cli-e2e probes since `2a1248d33`), so this is not new drift the leaf
could not have seen.

**The two declaring manifests do not cover every importing member.** The slice's own design
contract (`worklog.md` § Design: "every member directly importing `@netscript/plugin-streams-core`
declares it") is false at head. Per the eval contract, a third undeclared member defeats the slice;
there are three publishable ones plus a non-publishable fourth.

## Verification 2 — consistency with the established pattern: PASS

All three lines are literally identical:

- `plugins/workers/deno.json:26`
- `packages/plugin-workers-core/deno.json:33`
- `plugins/triggers/deno.json:23`

each `"@netscript/plugin-streams-core": "jsr:@netscript/plugin-streams-core@0.0.6",`. The pinned
version matches the declared version of `packages/plugin-streams-core` (`0.0.6`).

## Verification 3 — lock delta: PASS (justified and minimal)

`git show 10aa2a944 -- deno.lock` adds exactly two lines, both
`"jsr:@netscript/plugin-streams-core@0.0.6",`, in member dependency lists — hunk `@@ -4387` under
`workspace/members/packages/plugin-workers-core`, hunk `@@ -4586` under
`workspace/members/plugins/triggers`. A full JSON walk of `deno.lock` shows no other member's
dependency list changed, no `jsr`/`npm` specifiers stanza entry changed, no version movement. The
lock now mirrors the seven declaring members. The leaf's lockfile evidence is accurate.

## Verification 4 — scope: PASS

`git show 10aa2a944 --stat`: two manifests (+1 line each), `deno.lock` (+2), and the run directory
only. No `.ts` source change, no `plugins/workers` change, no new check or gate. Worktree verified
clean after all gate runs (`git status --porcelain` empty) — the evaluator left no residue.

## Verification 5 — gates re-derived at head

| Gate | Command | Result | Evidence |
| --- | --- | --- | --- |
| Publish dry-run | `deno task publish:dry-run` | PASS | `PUBLISH_DRY_RUN_REAL_EXIT=0` |
| Root check | `deno task check` | PASS | `ROOT_CHECK_REAL_EXIT=0`; 2,996 files, 25 batches, 0 failed (matches leaf) |
| Scoped check | `run-deno-check.ts --root packages/plugin-workers-core --root plugins/triggers --ext ts,tsx` | PASS | `SCOPED_CHECK_REAL_EXIT=0`; 189 files |
| Scoped lint | `run-deno-lint.ts` (same roots) | PASS | `SCOPED_LINT_REAL_EXIT=0`; 189 files, 0 findings |
| Scoped format | `run-deno-fmt.ts` (same roots) | PASS | `SCOPED_FMT_REAL_EXIT=0`; 189 files, 0 findings |
| Architecture | `deno task arch:check` | PASS | `ARCH_CHECK_REAL_EXIT=0`; pre-existing warnings only, zero failures |
| Quality | `deno task quality:scan` | PASS | `QUALITY_SCAN_REAL_EXIT=0`; 0 findings, 7 pre-existing reviewed allowances (matches leaf) |
| Corpus: agent docs | `deno task check:agent-docs-prose` | PASS | `REAL_EXIT=0` |
| Corpus: assets barrel | `deno task check:assets-barrel` | PASS | `REAL_EXIT=0` |
| Corpus: publish assets | `deno task check:publish-assets` | PASS | `REAL_EXIT=0` |
| Corpus: MCP exports | `deno task check:mcp-export-corpus` | FAIL (pre-existing) | `REAL_EXIT=1`; "MCP export-surface corpus is stale" |

The MCP corpus failure corroborates the leaf's drift entry as **pre-existing, not caused by this
slice**: the corpus was last regenerated in `6c195acaf` (2026-08-31), `packages/mcp/src` was last
touched at base `38f2ce735` (the #1864 merge itself), and the slice touches nothing under
`packages/mcp`. The leaf was right not to fix it (forbidden sibling scope) and right to record it.

## Process verification

| Check | Result | Evidence |
| --- | --- | --- |
| Plan-Gate / PLAN-EVAL before implementation | PASS | justified `PLAN-EVAL: N/A` recorded in `worklog.md` before implementation; mechanical manifest change |
| Design checkpoint in worklog | PASS | § Design present with surface/ports/constant |
| Commit slices match design | PASS | single slice, commit `10aa2a944` message names what it proves |
| Evaluator separation | PASS | generator lane OpenAI GPT-5.6 Sol (`supervisor.md`); this is a separate opposite-family session |
| Issue letter (boxes 1–3) | PASS | box 1 evidence recorded (silently accepted); box 2 both named manifests declare; box 3 N/A, no new gate |
| Issue spirit (complete workspace declarations) | FAIL | three publishable members remain undeclared — see finding 1 |

## Findings

| Severity | Finding | Evidence | Disposition |
| --- | --- | --- | --- |
| high (blocking) | Incomplete fix set: three additional **publishable** members import `@netscript/plugin-streams-core` undeclared at head — `packages/sdk` (`src/streams.ts:36-37`), `packages/plugin-sagas-core` (`src/streams/schema.ts:1-12`), `packages/plugin-auth-core` (`src/streams/mod.ts:7-15`) — plus non-publishable `packages/cli/e2e` (5 gate files). The defect class the issue names persists in the workspace, and sibling cores are now inconsistent with each other (`plugin-workers-core` declares; `plugin-sagas-core`/`plugin-auth-core` do not). | import-set table above; `deno.lock` member lists; all sites predate the slice | fix — add the same one-line declaration to the three publishable members (and `packages/cli/e2e` for consistency), refresh the lock, re-run scoped gates; or, if the owner scopes this slice to the issue's two named members, file the remainder as a follow-up and rewrite the worklog design contract to "the two named members" instead of "every member" |
| medium | Unrecorded drift: the worklog's design contract claims workspace-wide coverage that is false at head, `research.md` derived only the issue's per-member file list (its verify commands are `rg` scoped to the two members) and never the workspace-wide import set, and `drift.md` records no divergence between design contract and implemented state | `worklog.md` § Design; `research.md` findings 1–2; `drift.md` | fix in the follow-up commit — correct the design contract wording and record the completeness gap in `drift.md` |
| low | "Sixth import site" framing conflates reference kinds: `plugins/triggers/src/public/mod.ts:23` is a `definePlugin('@netscript/plugin-streams-core', …)` string literal, not a module import. Harmless here (the member declares), but the same conflation is what hid finding 1 — string-reference sites (`packages/cli` codegen, `plugins/streams` config) are not dependency edges. | `plugins/triggers/src/public/mod.ts:23`; `packages/cli/src/kernel/adapters/plugin/workspace-mutator.ts:199` | note only — keep module imports and string references separate in any completeness derivation |
| low (pre-existing, accepted) | `check:mcp-export-corpus` stale at base and head | `REAL_EXIT=1` both; corpus last regenerated `6c195acaf` | accept — leaf recorded it in `drift.md` correctly; outside this slice's scope |

## Open question — is declaring the right fix?

**Yes, declaring is right — and my findings strengthen rather than weaken that answer.**

- The honest "needs no declaration" half is true: workspace member-name resolution makes the import
  work locally, and `deno publish` rewrites the edge without complaint (proven at base and at head).
  The issue's acceptance box 2 explicitly allowed documenting that instead. So the leaf's fix is not
  forced by correctness.
- But documentation is the weaker instrument here, and consistency is the actual defect. Eight
  members that import streams-core declare it; the connectors mirror it in
  `withDependencies(...)`. A manifest that omits a directly imported dependency is invisible to
  `deno outdated`/`deno why`-class tooling and silently escapes the next bump wave (0.0.7 will
  rewrite specifiers member by member — undeclared members are exactly the ones that get missed).
- The decisive point: `plugin-sagas-core` and `plugin-auth-core` not declaring while
  `plugin-workers-core` does is the *same* inconsistency the issue complains about, one directory
  over. A consistency rule applied to 2 of 5 offenders produces the false appearance of completeness
  — which is precisely what the worklog then claimed. Half-fixing a consistency defect is worse than
  consistently not fixing it, because the partial fix launders the rest as "done".

So: right fix, wrong radius. The complete fix is still only ~4 manifest lines plus a lock refresh.

## Verdict

| Field | Value |
| --- | --- |
| Verdict | FAIL_IMPL |
| Rationale | The two-line manifest change is itself correct — exact specifier match, minimal justified lock delta, clean scope, all gates green, central publish question re-derived and confirmed — but the slice's own design contract ("every member directly importing `@netscript/plugin-streams-core` declares it") is false at head: three publishable members and one non-publishable member still import streams-core undeclared. Per the eval contract that defeats the slice's completeness claim; the gap is small, cheap to close, and must be fixed or explicitly re-scoped before merge. |

VERDICT: FAIL_IMPL
