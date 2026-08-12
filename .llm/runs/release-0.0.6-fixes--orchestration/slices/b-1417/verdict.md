# IMPL-EVAL Verdict — Slice B / PR #1538 / issue #1417

**VERDICT: PASS WITH FINDINGS** (all findings non-blocking)

- Evaluator: Claude · Fable 5 · medium — separate session from the generator (Codex · GPT-5.6 Sol).
- Evaluator worktree: `/home/codex/repos/ns006-f-b-impleval`, detached at `1a05934e9` (= PR #1538
  `headRefOid` `1a05934e96179acb2d416aed318d9388b8910afa`, verified via `gh pr view 1538`).
- Generator worktree `/home/codex/repos/ns006-f-b-dryrun` was never touched.
- Diff base: merge-base parent `01aa12b67` (`git merge-base 1a05934e9 origin/main` →
  `01aa12b67e36b643e1ca4f94421ecba07e030db5`, which is the commit's parent). Scope confirmed:
  exactly 4 files changed — `.llm/tools/release/publish-workspace.ts`,
  `.llm/tools/release/publish-workspace_test.ts`, `.llm/tools/release/run-publish-dry-run.ts`,
  `packages/mcp/deno.json` (+258/−18). No other lanes' work appears in the range.
- No publication was performed or attempted at any point. Dry-run only.

## Acceptance boxes (#1417)

### Box 1 — root `publish:dry-run` leaves `git status --porcelain` empty: SATISFIED

Executed myself in the evaluator worktree, clean tree asserted before (`git status --porcelain |
wc -l` → `0`):

```
$ rtk proxy deno task publish:dry-run
Success Dry run complete
EXIT=0
$ git status --porcelain | wc -l
0
```

The dry-run demonstrably ran from a throwaway: every simulated file path in the output is
`file:///tmp/netscript-publish-dry-run-810a52046a36eff4/...`. The throwaway was removed afterwards
(`ls /tmp | grep netscript-publish-dry-run` → empty).

### Box 2 — proven on a clean checkout, catalog sentinel intact: SATISFIED

sha256 sentinels recorded before and re-checked after the run:

```
$ grep -n '"zod"' packages/service/deno.json
27:    "zod": "catalog:"
$ sha256sum -c before-hashes.txt
deno.lock: OK
packages/service/deno.json: OK
packages/mcp/deno.json: OK
```

### Box 3 — package-scoped MCP dry-run leaves `publish` arrays unmodified: SATISFIED

```
$ cd packages/mcp && rtk proxy deno task publish:dry-run
   file:///tmp/netscript-publish-dry-run-72e0b60c434f7db/packages/mcp/... (throwaway cwd)
Success Dry run complete
EXIT=0
$ git status --porcelain | wc -l
0
$ sha256sum -c before-hashes.txt   # all three OK, including packages/mcp/deno.json
```

Also re-run with a deliberately dirty tree (marker appended to `packages/telemetry/mod.ts`):
exit 0, dirty file preserved byte-for-byte, no surprise from dropping `--allow-dirty` from the
task — the wrapper still passes `--allow-dirty` to `deno publish` inside the throwaway, so
behaviour for a legitimately dirty tree is unchanged from the old
`deno publish --dry-run --allow-dirty`.

### Box 4 — regression check exists and actually detects the regression: SATISFIED

I reproduced red/green myself, not from the generator's transcript:

1. Baseline: `deno test --allow-read --allow-write .llm/tools/release/publish-workspace_test.ts`
   → `ok | 2 passed | 0 failed`.
2. Bypass: replaced `withThrowawayWorkspace`'s body with `return await operation(sourceRoot);`
   (simulating a future change that runs dry-runs in the source tree) →
   `FAILED | 0 passed | 2 failed` — both isolation tests
   (`publish dry-run isolates catalog and Deno manifest rewrites…`, `package dry-run isolates MCP
   publish array rewrites`) went red with `AssertionError: Values are not equal`.
3. Restored via `git checkout --` → `ok | 2 passed | 0 failed`, tree clean.

### Box 5 — `deno.lock` unmodified in all cases: SATISFIED

`deno.lock` sha256 (`d4d00f600bd9…`) verified identical after: the root dry-run, the MCP package
dry-run, the dirty-tree MCP dry-run, and the deliberately failing root dry-run. The regression test
additionally covers a simulated lock write (confined to the fixture).

## The gate is still a gate (issue's "do not fix by removing the check")

Constructed a publish-invalid state myself: prepended
`import "./this-module-does-not-exist.ts";` to `packages/service/mod.ts`, then ran the root task:

```
$ rtk proxy deno task publish:dry-run
TS2307 [ERROR]: Cannot find module 'file:///tmp/netscript-publish-dry-run-f01dc8eae944564/packages/service/this-module-does-not-exist.ts'.
error: Type checking failed.
error: Uncaught (in promise) Error: Publish dry-run failed (deno publish exit 1).
EXIT=1
```

A real `deno publish --dry-run` executes against the throwaway copy of the *current* tree state and
still fails on real publish problems, propagating a non-zero exit. The throwaway was also cleaned
up on this failure path (`finally` held: no `netscript-publish-dry-run-*` left in `/tmp`). File
restored afterwards; tree clean.

Coverage did not shrink: the run simulated publish of **35 members**, equal to the 35 publishable
members discovered in the source tree (`packages/*` + `plugins/*` with a `name` and
`publish !== false`). No member is silently skipped by the throwaway construction.

## Gates executed (all by me, evaluator worktree)

| Gate | Result |
| --- | --- |
| `rtk proxy deno task publish:dry-run` + porcelain | exit 0, porcelain empty |
| `rtk proxy deno task check` | exit 0 (2876 files, 0 findings) |
| `rtk proxy deno task test` | exit 0 — `ok | 3184 passed (617 steps) | 0 failed | 17 ignored (3m19s)` |
| `rtk proxy deno task lint` | exit 0 (2010 files, 0 findings) |
| `rtk proxy deno task fmt:check` | exit 0 (2010 files, 0 findings) |
| `rtk proxy deno task quality:gate` | exit 0 (`quality:scan` + `arch:check`; WARN/INFO only, pre-existing) |
| `deno test .llm/tools/release/publish-workspace_test.ts` | 2 passed (and 2 failed under bypass) |
| `deno task agentic:review-threads -- --repo rickylabs/netscript --pr 1538` | `PASS … threads=0 unanswered=0` |

## Findings

### Non-blocking

1. **Symlink copy-back hazard (dormant).** `copyWorkspace` replicates symlinks verbatim
   (`Deno.symlink(await Deno.readLink(src), dst)`). If a workspace member's `deno.json` were ever a
   symlink with an absolute target (or a relative target escaping the repo), the throwaway's "copy"
   would point back into the source tree, and the catalog materialization's `Deno.writeTextFile`
   (which follows symlinks) would mutate the live tree despite the isolation. Verified dormant
   today: `find packages plugins deno.json deno.lock -type l` → zero symlinks anywhere in the repo.
   Suggested hardening for a follow-up: dereference file symlinks during copy, or refuse absolute
   targets.
2. **`.git` exclusion is directory-only.** The exclusion check is
   `entry.isDirectory && shouldExcludeFromThrowaway(...)`, so in a git *worktree* (where `.git` is a
   pointer file) the `.git` file is copied into the throwaway. Harmless today because
   `--allow-dirty` is always passed, so no git-dirtiness check ever runs; observation only.
3. **Whole-repo copy per invocation.** Each dry-run (root *and* single-member MCP) copies the
   entire repo (~104 MB excluding `.git`/`node_modules`) into `/tmp` and deletes it after. Two
   copies per `deno task ci` class run. Acceptable cost for correctness; worth remembering if the
   repo grows or the gate moves to a hot loop.
4. **Interruption gap persists for non-dry-run modes.** Real `publish` and `preflight` still
   materialize `catalog:` entries in the live tree with the normal-completion-only `finally`
   restore — exactly the mechanism drift D-4 flags for interruptions. #1417 scopes only the
   dry-run, so this is not blocking here, but the same hard-kill scenario during a real publish
   still leaves expanded manifests. Candidate follow-up issue.
5. **SIGKILL leaves orphaned temp dirs.** A hard kill mid-copy abandons a
   `/tmp/netscript-publish-dry-run-*` directory (up to ~104 MB). Matches the slice's own claim
   ("at worst abandon temp data") and is the right trade-off; noted for hygiene expectations.

### Blocking

None.

## Process checks

- PR #1538 body carries `Closes #1417`, the five DoD boxes checked, and an `acceptance-evidence`
  block whose entries map to the five issue boxes. Labels: `type:fix`, `area:release`,
  `area:tooling`, `priority:p1`, exactly one `status:` (`status:impl-eval`); milestone `0.0.6`.
- Drift D-4 (mixed mutation origin) is recorded in the orchestration run's `drift.md` and matches
  what the code actually does.
- Generator ≠ evaluator: this verdict comes from a separate Fable 5 session; every quoted output
  above is from commands I executed in `/home/codex/repos/ns006-f-b-impleval`.

## What I could NOT verify (claims stay claims)

- **The pre-fix failure mode** (19 dirtied manifests on exit 0) — taken from issue #1417 / the
  slice narrative; I did not check out the parent commit and reproduce the historical mutation.
- **Real `publish` / `preflight` modes** — never executed (hard constraint: no publication, ever).
  Their code paths were reviewed only; the change there is limited to routing through the injected
  `commandRunner`.
- **CI-runner behaviour** — all evidence is from local WSL2 Linux; I did not observe the task on a
  GitHub Actions runner (e.g. `/tmp` capacity/permissions there).
- The generator's `evidence.md` transcript was not relied upon for any verdict above.
