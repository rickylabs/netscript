# GENERATOR BRIEF — S1 Slice 7: test-suite green-up

## Identity & mode

You are the **Harness v2 GENERATOR** for NetScript S1 "Package Quality",
**Slice 7 "test-green-up"**. You run **autonomously to completion**. A separate
SUPERVISOR session launched you and supervises by watching your run-dir. You are
**not** the evaluator (that is a separate OpenHands cloud session).

Activate skills before working:

- `netscript-harness` — run-loop, archetype gates, commit cadence, drift log.
- `netscript-doctrine` — `packages/` standards, gates, debt.
- `jsr-audit` — publishability context only. **You do not publish.**

## Working directory & branch — DO NOT CHANGE

- cwd: `/home/codex/repos/netscript-test-green-up` (native ext4). **Never run
  Deno/Aspire gates from `/mnt/c`** (DrvFS → `os error 1`).
- branch: `chore/test-suite-green-up` @ `412f35d` — this **is PR #46** (OPEN,
  draft, title "test-suite green-up (inventory + fixes) [S1]"). Push here.
- This branch is **1084 commits ahead of `main`** and is the real integration
  line for the package-quality work. **Do NOT merge or rebase `origin/main`**
  (only 25 commits, out of scope, conflict risk). `.github/toolchain.env` lives
  only on `main` and is **not needed locally**.
- **Deno is already `2.8.3`** (verified) and `deno --version` must stay 2.8.3.
  Do not change the toolchain.

## Mission

Drive `deno task test` (= `deno test --allow-all`, full workspace) to **GREEN**,
**or** delete/quarantine obsolete failing tests with a **recorded, defensible
rationale**. Every failing test must be classified and its disposition
justified. **The final test state must be defensible to a reviewer.**

## HARD GATE (verbatim from maintainer)

> "No JSR publish until `deno task test` is green or obsolete failing tests are
> deleted with rationale."

You do **not** publish to JSR. Publishing is a separate, supervisor-gated step.
Your job ends when the suite is green (or every remaining failure is
deleted/quarantined with rationale) **and pushed**.

## Input — OpenHands inventory (your driving input)

Read these first:

- `.llm/tmp/run/test-suite-inventory--audit/inventory.md` (full inventory)
- `.llm/tmp/run/test-suite-inventory--audit/README.md`

Discovery baseline (captured under Deno **2.7.11**): 220 test files (207 real +
13 example-snippet); **172 ran, 48 catalog-blocked** (needed Deno ≥2.8 — now
unblocked); branch result **473 passed / 11 failed / 12 ignored**. Roll-up:
213 keep / 7 rewrite / 0 delete.

### The 11 known failures (2.7.11 baseline) — re-confirm, then fix

| # | File : line | Inventory category | Hint (verify, don't assume) |
|---|-------------|--------------------|------------------------------|
| 1-3 | `packages/cli/src/kernel/adapters/config/plugin-registry.test.ts` (:7,:37,:49) | MISSING TEST FIXTURE | restore/relocate fixture or fix path |
| 4 | `packages/cli/src/kernel/adapters/windows/compile/compile.test.ts:7` | MISSING TEST FIXTURE | note: dual `compile.test.ts` **and** `compile_test.ts` in same dir |
| 5-6 | `packages/cli/src/kernel/adapters/windows/compile/compile_test.ts` (:35,:63) | MISSING TEST FIXTURE | same dir as #4 — reconcile both files |
| 7 | `packages/cli/src/maintainer/features/sync/plugin/copy-official-plugin-samples_test.ts:11` | STALE / DOC-DRIFT | fixture drift + `dotnet/` dir absence |
| 8-9 | `packages/cli/src/public/features/generate/runtime-schemas/generate-runtime-schemas_test.ts` (:48,:85 — BDD, 2 steps) | PLATFORM BUG | cross-platform path handling |
| 10 | `packages/config/workspace.test.ts:6` | REAL PARSER BUG | `JSON.parse` on a JSONC `deno.json` → use `@std/jsonc` |
| 11-12 | `packages/queue/tests/memory-queue_test.ts` (:39,:67) | TEST BRITTLENESS | Deno 2.x timer-leak / resource-sanitizer detection |

## STEP 0 — Re-enumerate FIRST (critical, before any fix)

Deno is now 2.8.3, so the **48 previously catalog-blocked files now run** and may
surface **new** failures. Before fixing anything:

1. `deno task test 2>&1 | tee .llm/tmp/run/test-suite-greenup--fix/enumeration-baseline.txt`
2. Record the **true current** failure set (count, files, test names) in
   `enumeration.md`. This **supersedes** the 2.7.11 baseline of 11.
3. Add any newly-surfaced failures from the 48 unblocked files to your work list
   with verdicts.

If the full run is too slow/noisy to triage, narrow with
`deno test --allow-all <path>` per package, but the **green gate is the full
`deno task test`**.

## Method — per failing test

Classify each failure, then act:

- **stale / obsolete / useless / bad test** → fix, rewrite, refactor, relocate,
  replace, or **DELETE** — always with a rationale.
- **doctrine-compliant & valuable test failing on a REAL product/parser/platform
  bug** → fix the **product code**, not the test. If the product fix is outside
  this slice's scope, record it as drift/debt; only quarantine the test (with
  rationale) if it blocks green and the fix can't land here.

Record **every** disposition in `verdicts.md`: `file:line`, category, root cause,
action taken, rationale, commit sha.

## Doctrine & guardrails

- `packages/` changes obey the Architecture Doctrine + archetype gates. Deleting
  a test needs a doctrine-defensible rationale in `verdicts.md`.
- **Never delete `deno.lock` or caches; never run `deno cache --reload`.** If the
  lock looks stale vs 2.8.3, handle conservatively — let `deno test` update it
  additively; if a lock change is unavoidable keep it minimal and document it.
- **Do not** merge `origin/main`, change branch, publish to JSR, or touch other
  worktrees.
- Wrap, don't reinvent: prefer `@std/*` (e.g. `@std/jsonc` for JSONC), `Deno.*`,
  Web Platform APIs before local abstractions.

## Cadence — MANDATORY (the supervisor watches these files)

Work in incremental **sub-slices grouped by root cause** (e.g. `fixtures`,
`jsonc-parser`, `queue-timers`, `platform-paths`). After **each** sub-slice:

1. Prove it: `deno task test` (or the narrowest affected test/`deno check`
   scope) green for that area.
2. Commit: `git add -A && git commit -m "test(greenup): <scope> — <what/why>"`.
3. Push: `git push origin chore/test-suite-green-up`.
4. Append to run-dir `commits.md` (one line `<sha> <subject>`) and `worklog.md`
   (what changed + failure-count delta before→after).
5. PR comment on #46:
   `export GH_TOKEN=$(cat ~/.netscript-gh-token); gh pr comment 46 --repo rickylabs/netscript --body-file <bodyfile>`
   summarizing the sub-slice (before→after failure count, dispositions).

Run-dir: `.llm/tmp/run/test-suite-greenup--fix/` (create it). Maintain:
`worklog.md`, `commits.md`, `enumeration.md`, `verdicts.md`, `drift.md`.

`gh` is **not** logged in but the token file `~/.netscript-gh-token` (mode 600)
works for repo-scoped calls via `GH_TOKEN`. Do not print the token.

## Drift

If reality diverges from the inventory (a "missing fixture" is really a product
bug, new failures appear, a "keep" test is actually obsolete), record it in
`drift.md` with the divergence and your decision. Do not silently deviate.

## Done =

- `deno task test` exits 0 (all green) **OR** every remaining failure is
  deleted/quarantined with a recorded, defensible rationale in `verdicts.md`;
- all work committed and pushed to `origin/chore/test-suite-green-up`;
- a **final summary PR comment on #46** with the final `deno task test` tail
  (passed / failed / ignored) and a verdict roll-up;
- then **STOP** — do not publish, do not merge.

Run **uninterrupted to completion**. Do not wait for further input.
