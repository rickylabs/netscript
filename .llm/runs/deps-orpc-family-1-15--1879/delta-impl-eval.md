# Delta IMPL-EVAL: fresh-ui private lock regeneration after convergence (#1879 / PR #1890)

## Metadata

| Field | Value |
| --- | --- |
| Run ID | `deps-orpc-family-1-15--1879` |
| Delta evaluated | commits `1c1d419a9` → `e734453c4`: convergence merge `de7716367` (branch `1c1d419a9` × main `e938ecd31`), post-merge commit `73c554a08` (worklog only, 20 lines), fix commit `e734453c4` (`packages/fresh-ui/deno.lock` + `drift.md`, 2 files) |
| Head evaluated | `e734453c449bc8df0f52cf5908dec06b1251581b` (= worktree HEAD, `git rev-parse` rc=0) |
| Prior verdict | full IMPL-EVAL **PASS** at `1914a38c6` (artifact `1c1d419a9`, `impl-eval.md`) — root dependency surface is settled and was NOT re-litigated here |
| Evaluator | separate opposite-family IMPL-EVAL session — Claude Code host, `z-ai/glm-5.3-flash` effort max, 2026-09-01; author lane was GPT-5.6 Sol; this is also a different session from the prior evaluator |
| Method | read-only over repository state; every evidence exit captured as `out=$(cmd 2>&1); rc=$?` (never a bare pipeline); scratch extraction in gitignored `.llm/tmp/delta-eval-1879/`; tree verified clean (`git status --porcelain` empty) before and after every command that executes Deno |
| Scope boundary | the delta only. Where a check re-derived a settled root fact (Q5), it is labeled re-derivation, not re-judgement |

## Q1 — Is the convergence claim true? YES, byte-exact

The real two-parent merge is `de7716367` (parents `1c1d419a9`, `e938ecd31`, verified via `git cat-file -p`, rc=0). `73c554a08` only appends 20 worklog lines (`git show --stat`, rc=0), so the merge's lock state carries unchanged to the convergence head.

| Evidence (command, exit) | Result |
| --- | --- |
| `git diff 1c1d419a9 de7716367 -- deno.lock` → rc=0 | **Exactly one added line**: `"jsr:@netscript/config@0.0.6",` inside the `plugins/workers` dependency mirror — the first-party JSR workspace member entering from #1874 (whose `plugins/workers/deno.json` +1 line is the matching declaration). No other root-lock change came from main. |
| `git diff 1914a38c6 1c1d419a9 -- deno.lock` → rc=0, empty | Prior-eval lock = artifact-commit lock. |
| `git diff de7716367 73c554a08 -- deno.lock` → rc=0, empty; `git diff 73c554a08 e734453c4 -- deno.lock` → rc=0, empty | The fix commit did **not** touch the root lock; convergence chain is lock-stable. |
| `git diff --name-status 1c1d419a9 de7716367` → rc=0 | What main brought: run artifacts of #1451/#1874, aspire skill mirror, teardown tooling, workers runtime-registry sources/tests, `plugins/workers/deno.json`, `deno.lock` — no member manifest, no fresh-ui file. |
| `git diff --stat e938ecd31 de7716367 -- deno.lock` → rc=0 | The main→merge direction additionally shows the PR's own oRPC raise (259 lines) — expected, that is the settled PR content, not convergence drift. |

**@orpc resolved set across the merge:** the lock delta from the branch parent is one non-`@orpc` line, so the `@orpc` set is byte-identical across the merge by construction. Cross-checked programmatically: extracting all `@orpc` specifier keys + package keys from the locks at `e938ecd31`, `de7716367`, `e734453c4` yields the same 17 names at `1.15.0` on the branch side throughout (main's side at `1.14.x` is the pre-move state this PR exists to move). Claim **TRUE**, including the "one line" wording.

## Q2 — Is the fresh-ui lock regeneration confined? YES — with two precision disclosures

Independent enumeration via a lock-JSON structural diff (`analyze.py`, rc=0; inputs extracted with `git show <rev>:packages/fresh-ui/deno.lock`, rc=0 both) — **every version move in `packages/fresh-ui/deno.lock` between `73c554a08` and `e734453c4`**:

| Package | Before → after | Proven path from the oRPC bump (BFS over the lock's own dependency graph) |
| --- | --- | --- |
| `@orpc/*` — 17 names | `1.14.6`/`1.14.8` → `1.15.0` | the move itself (depth 0) |
| `@opentelemetry/api-logs` | `0.220.0` → `0.221.0` | `@orpc/otel@1.15.0` → `@opentelemetry/instrumentation@0.221.0` → `api-logs` (depth 3; sole rdep = instrumentation) |
| `@opentelemetry/instrumentation` | `0.220.0` → `0.221.0` | `@orpc/otel@1.15.0` → `instrumentation` (depth 1; sole rdep = `@orpc/otel`) |
| `type-fest` | `5.7.0` → `5.8.0` | `@orpc/shared@1.15.0` → `type-fest` (depth 1; sole rdep = `@orpc/shared`) |
| `import-in-the-middle` | `3.3.1` → `3.3.3` | `@orpc/otel` → `instrumentation` → `import-in-the-middle` (depth 2) |
| `cjs-module-lexer` | `2.2.0` → `2.2.1` | `… → import-in-the-middle@3.3.3` (depth 3) |
| `es-module-lexer` | `2.3.1` → `2.3.2` | `… → import-in-the-middle@3.3.3` (depth 3) |

Machine verdict: `ANY CHANGED PACKAGE OUTSIDE oRPC CLOSURE: NO` (script line, rc=0). Totals: npm package map 512 → 511 entries (+23 / −24 — the net −1 is the **dropped second `@orpc/shared` instance**), jsr package map 55 → 55 unchanged, top-level specifiers +7/−7 all `@orpc` with **zero non-`@orpc` specifier touched**. I actively hunted for a mover outside the closure and found none; the supervisor's confinement table is correct on every row and version.

Two things the table does not mention, both verified benign and disclosed here:

1. **Seven first-party workspace-mirror lines** were also absorbed by the regen: `jsr:@netscript/plugin-streams-core@0.0.6` added to six member mirrors (`packages/cli/e2e`, `packages/plugin-auth-core`, `packages/plugin-sagas-core`, `packages/plugin-workers-core`, `packages/sdk`, `plugins/triggers`) and `jsr:@netscript/config@0.0.6` to `plugins/workers`. These are not package version moves (jsr map unchanged) — they are the private lock's mirror of dependency declarations already reviewed in this PR (#1876 seam) and merged from main (#1874), and they match the root lock's mirrors exactly. No third-party drift; the claim just needs this footnote to be complete.
2. **The private lock mirrors the root workspace.** Its `workspace.members` section is 37 members **identical, entry for entry, to the root lock's** (`analyze.py` member-set compare: "identical sets: True", "members with differing mirrors: 0"), including `packages/fresh-ui` itself. See Q4 for why this matters.

## Q3 — Is the fix genuine, or does it merely silence the gate? GENUINE

The gate's staleness signal is `deno check --lock=deno.lock --frozen` inside `packages/fresh-ui` (`.github/workflows/fresh-ui-quality.yml:128-140`); its own regression test (`.llm/tools/validation/fresh-ui-quality_test.ts`) asserts a stale lock fails with "The lockfile is out of date" **without** rewriting the lock. So a passing frozen check plus an unchanged lock hash is a genuine in-sync proof, not a silenced gate.

| Evidence | Result | Exit |
| --- | --- | --- |
| `deno task --cwd packages/fresh-ui check` (the gate's own invocation form; task expands to `deno check --unstable-kv --lock=deno.lock --frozen`) | `FRESHUI_FROZEN_CHECK_REAL_EXIT=0`; 150 files selected, 2 batches, 0 failed | 0 |
| `sha256sum packages/fresh-ui/deno.lock` before vs after the check | `dd0557b5264e17de…` → `dd0557b5264e17de…` — identical; the frozen check did not rewrite the lock | 0 |
| `git status --porcelain` after the check | empty — no tree mutation | 0 |
| Distinct `@orpc/shared` instances in the fixed lock (`grep -o '"@orpc/shared@[^"]*"' \| sort -u`) | exactly one: `"@orpc/shared@1.15.0_@opentelemetry+api@1.9.1"` (16 textual mentions, all resolving to that single key) | 0 |
| Any `1.14.x` oRPC entry in the fixed lock (`grep -c '@orpc/[a-z-]*@1\.14\.'`) | **0** (rc=1, no match) | 1 |
| CI at `e734453c4` (`gh api repos/rickylabs/netscript/commits/e734453c4/check-runs`) | `fresh-ui-quality completed success` (also build/quality/check-test success) | 0 |

Corroborating substance: before the fix the private lock carried **two** `@orpc/shared` copies (`1.14.6` and `1.14.8`) — the exact single-copy hazard issue #1879 exists to remove, present inside the private lock until this commit. The fix eliminated the second copy and moved the whole family; it did not merely appease a check.

## Q4 — Is there a THIRD lock or manifest surface still missed? Sweep result: none stale; one latent gate-coverage gap

Full inventory (`git ls-files` regex over lock/manifest names + `find -name deno.lock`, rc=0):

| Surface | oRPC reach | Verdict |
| --- | --- | --- |
| `deno.lock` (root) | the 17-name family | covered by the settled verdict; re-derived at Q5 |
| `packages/fresh-ui/deno.lock` | yes — private second lock | **fixed by this delta**; frozen check proves in sync |
| `docs/site/deno.lock` | **zero** `@orpc` keys (`grep -c` → 0); `docs/site/deno.json` is a true non-member (matches no root workspace glob), imports only `lume/` from deno.land; cannot resolve `@orpc/*` through the catalog | not a surface for this defect class |
| `.llm/runs/…/wasmbuild-lcg/deno.lock`, `.llm/runs/…/schema-fixture/deno.lock` | schema-fixture records `npm:@orpc/*@^1.14.6` specifiers | **recorded historical run evidence** (committed at `f3eb957ec`, before this slice), not a live dependency surface; no gate runs there; regenerating it would falsify the record. Informational only. |
| 12 `package.json` files referencing `@orpc` (sdk, service, contracts, telemetry, plugin cores, plugins/*) | all use `"catalog:"` — verified line-by-line; **zero pinned `1.14.x` literals** | resolve through the raised catalog; no staleness possible in the manifest itself |
| `deno.jsonc` files | none exist (`git ls-files` grep rc=1) | — |
| `apps/*`, `examples/*` (root workspace globs) | directories do not exist (`ls` rc=2) | no members hidden there |
| Custom-lock surfaces (`grep -rn -- '--lock='` over packages/plugins/docs/.github) | the **only** hits are `packages/fresh-ui/deno.json` lines 42/43/45/46 — its four tasks pinning `--lock=deno.lock` | the private lock fixed here is the only surface of this class |

**Topology correction (evidence-backed, changes the defect-class framing):** `packages/fresh-ui` **is** a root workspace member — the root `deno.json` declares `workspace: ['packages/*', 'packages/cli/e2e', 'plugins/*', 'examples/*', 'apps/*']`, and `packages/fresh-ui` appears in both locks' 37-member mirrors; `packages/fresh-ui/package.json` uses `"catalog:"`, a workspace-member-only protocol. Its "private" lock is not an outside-the-workspace artifact: it is a **second lockfile over the same workspace graph**, pinned via explicit `--lock=deno.lock` relative to the package, which is precisely why the root catalog raise staled it and why its member mirrors must track every root manifest change. The drift record's framing ("not a root workspace member — a standalone package") is inaccurate on membership; the fix and its confinement analysis remain correct.

**Latent gap (follow-up, not a blocker here):** the `fresh-ui-quality` workflow triggers on `packages/fresh-ui/**`, root `deno.json`, and tool paths — not on **member manifests** or the root `deno.lock`. Yet the private lock mirrors all 37 members' dependency declarations (this regen absorbed six #1876 lines). A member-manifest-only PR can stale the private lock without ever running this gate. Same defect class, silent recurrence path.

## Q5 — Do the root gates still hold at `e734453c4`? YES (re-derivation)

| Gate | Evidence | Exit |
| --- | --- | --- |
| `deno why @orpc/shared` | `DENO_WHY_REAL_EXIT=0`; header `@orpc/shared@1.15.0`, 15 dependency paths (16 matched lines incl. header), **all** via `^1.15.0` specifiers; zero `1.14` paths | 0 |
| Root no-mixed audit (JSON parse of `deno.lock`, not a grep count) | 17 distinct `@orpc/*` names; `names not at exactly 1.15.0: NONE`; zero `1.14` package keys | 0 |
| Manifest family completeness | 13 manifest files declaring `@orpc`, **32 keys** (server 11, contract 6, client 3, zod 3 incl. one `^1.15.0` literal, openapi 3, tanstack-query 2, otel 1), every key at `^1.15.0` | 0 |
| `deno ci` (frozen install) | `DENO_CI_REAL_EXIT=0`; root lock hash `e52c167e48e78a3c…` identical before/after; `git status --porcelain` empty | 0 |
| Known accepted medium finding (not re-litigated) | the root lock's one `^1.14.6` specifier key (`npm:@orpc/server@^1.14.6`, from the `desktop-native/src/router.ts:4` inline import) resolves to `1.15.0_@opentelemetry+api@1.9.1` — the single copy; its declaring-file set is byte-identical to the prior eval's medium-finding list, and the delta added none | 0 |

## Findings

| Severity | Finding | Disposition |
| --- | --- | --- |
| low | `drift.md` (§D) and the delta brief describe `packages/fresh-ui` as "not a root workspace member — a standalone package". It **is** a member (root glob `packages/*`; present in both locks' 37-member mirrors; `catalog:` in its `package.json`). The true defect class is a second `--lock=deno.lock` lockfile over the same workspace graph — which is broader than "non-member package with a private lock" and should be recorded as such. | accept — the fix and confinement analysis are correct regardless; correct the framing on the next touch of `drift.md` and in the family-move lesson |
| low | The supervisor's confinement table is accurate for **version moves** but the regen's diff additionally contains 7 first-party workspace-mirror lines (6 × `plugin-streams-core@0.0.6` from #1876, 1 × `config@0.0.6` from #1874) with no third-party drift. | accept — disclosed above; mirrors match the root lock exactly; no action needed beyond the footnote |
| low | `fresh-ui-quality` does not trigger on member-manifest or root-lock changes, yet the private lock mirrors all 37 members' dependency declarations — a member-manifest-only PR can stale the private lock without the gate running. | follow-up — extend the workflow paths filter (or classify rule) to member manifests / `deno.lock`; does not block this PR (its raise touched root `deno.json`, so the gate ran and caught the defect) |
| info | `.llm/runs/docs-rfc-…/schema-fixture/deno.lock` records `1.14.x` oRPC specifiers. | no action — historical run evidence predating the slice; not a live surface; must not be regenerated |
| info | Fresh-ui's private lock itself exhibited the two-copy `@orpc/shared` hazard (`1.14.6` + `1.14.8`) until this fix. | no action — resolved by the delta; strengthens the case that the fix is genuine |

## Verdict rationale

Every load-bearing claim of the delta was re-derived independently rather than taken from the supervisor: the convergence merge's root-lock delta is byte-exactly the one `jsr:@netscript/config@0.0.6` line with the `@orpc` set untouched; the fresh-ui lock's complete version-move set (23 names, machine-diffed, reverse-dependency-checked) sits entirely inside the oRPC closure with explicit graph paths and matches the supervisor's table row for row; the frozen check passes with an unchanged lock hash, a single `@orpc/shared@1.15.0`, zero `1.14.x` residue, and a green CI `fresh-ui-quality` run; the repo-wide sweep found no third stale surface and no other surface of the custom-lock class; and the root gates re-derive cleanly at the new head (`deno why` single copy, 17/17 names at 1.15.0, 32 manifest keys, frozen `deno ci` with unchanged hash). The three low findings are precision and latent-recurrence items, none of which invalidates the delta or blocks the PR.

VERDICT: PASS
