use harness

## SKILL

- netscript-harness — commit + push, run-dir artifacts.
- netscript-doctrine — `packages/cli` is framework code; no `any`/casts/lint-ignores introduced.
- netscript-tools — scoped check/lint/fmt wrappers; `git ls-remote` immediately before any
  `--force-with-lease`, never a guessed SHA.

## D-127 — converge #1747 onto main `8a925764`, with the coordinator's merge ruling

`origin/main` has moved to **`8a925764276b25ef7cef484db273604f44557cef`**. PR **#1764** rewrote
`packages/cli/e2e/src/application/gates/scaffold/prepare-flow-b-fixture.ts` — the same region D-119
had just repaired — so `git rebase origin/main` produces exactly **one real conflict**, in that file.
A read-only `merge-tree` by the coordinator confirms it is the only one.

**Also note main's generator has evolved.** It now emits the sanitized *name* as the binding
identifier and a comment marker:

```
  // --- workers ---
    const workers = builder.addExecutable('workers', 'deno', workers_workdir, [
    backgroundProcessors.set('workers', workers);
```

The old `bg_N` binding scheme is gone from `main`.

## Coordinator ruling — how to resolve that one conflict

Produce a **union**, preserving both sides' real contributions:

1. **Keep #1747's dynamic, quote-agnostic discovery** of the workers binding and the set-anchor.
   - It must capture the **binding identifier generically** — it has to match **both**
     `const workers = builder.addExecutable('workers',` (main today) **and** a `bg_0`-style id, so the
     capture group must be a general JS identifier (e.g. `([A-Za-z_$][\w$]*)`), **not** `bg_\d+`.
   - It must accept **either quote style** (`(["'])…\1` backreference), since the on-disk file is
     post-`deno fmt --single-quote`.
   - `workersSetAnchor` must be the **actual matched substring** captured from the file (as D-119
     did), because it is used as a literal `.replace()` target. Never rebuild it from a hardcoded
     string.
2. **Keep main #1764's `missingBackgroundReferences` union** covering **both** `users` **and**
   `sagas-api`, including its "only add what is missing" semantics and its guard that asserts **both**
   `services__users__http__0` and `services__sagas-api__http__0` are present afterwards.
3. **Wire them together:** replace the **captured** `workersSetAnchor` with
   `` `${missingBackgroundReferences.join('\n\n')}\n\n${workersSetAnchor}` `` — i.e. main's union
   content, anchored on #1747's dynamically captured anchor.
4. Build **both** `usersReference` and `sagasReference` using the **discovered binding**
   (`${workersBinding}.withEnvironment(...)`). **Never hardcode `workers` as the binding**, and never
   reintroduce the `bg_N` scheme.
5. Block location: main's `'  // --- workers ---'` comment-marker slice is quote-agnostic already —
   keep it. Keep every existing `throw new Error(...)` guard and message from both sides; the result
   must still fail loudly when the block or either marker is genuinely absent.

**Everything else in the rebase takes main's side where it conflicts trivially.** If any *other*
non-generated source file conflicts, **abort and report** — this ruling authorizes only
`prepare-flow-b-fixture.ts`.

## Preserve #1747's actual product change

#1747's value is the **name-validation** half (`packages/aspire/config.ts`,
`packages/aspire/src/domain/aspire-resource-name.ts`, `packages/aspire/tests/config_test.ts`) plus
`JSON.stringify(name)` escaping in
`packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-background.ts`. Keep
both. Re-apply the escaping onto **main's current generator lines** (main uses `'${name}'`
interpolation today) so the emitted literal is safely escaped; do **not** revert main's
binding-identifier scheme while doing so, and keep the generator's own tests passing.

## Verification (all required before pushing)

- `git merge-base HEAD origin/main == origin/main`.
- Focused: `deno check --unstable-kv`, `deno lint`, `deno fmt --check` on every file this branch
  changes (`git diff --name-only origin/main..HEAD`, source `.ts`/`.tsx`).
- Focused tests for the touched areas — the `packages/aspire` config/name tests and the
  `generate-register-background` / `generators-background-app` generator tests.
- **Repo-wide** `deno task check` (the gate CI runs:
  `.llm/tools/run-deno-check.ts --root packages --root plugins --ext ts,tsx --exclude "^(.*(?:^|/)\.generated/|.*(?:^|/)node_modules/)"`)
  — expect `failedBatches: 0, totalOccurrences: 0`.
- **Static fixture reproduction, no Aspire/Docker:** scaffold a throwaway project
  (`netscript init <name> --db postgres --no-git --non-interactive`, then
  `netscript plugin install workers --name workers`), run the repaired fixture's discovery/replace
  path against the generated `aspire/.helpers/register-background.mts`, and paste the evidence:
  the discovered binding, the captured set-anchor, and confirmation the configured block contains
  **both** `services__users__http__0` and `services__sagas-api__http__0`. Delete the scaffold after.
- **No runtime**: no Aspire, Docker, AppHost, or `e2e:cli` runtime suites. The coordinator runs the
  full Postgres `scaffold.runtime` + `runtime.flow-b-fixture` proof under a separate lease afterwards.
- **No PLAN-EVAL, no evaluator rerun.** The existing Fable PASS carries unless semantics change or a
  gate fails — if you believe your resolution changes semantics, say so explicitly instead of
  proceeding quietly.

## Push

`git ls-remote origin refs/heads/fix/aspire-reference-name-validation` immediately before pushing,
then `--force-with-lease=<that exact SHA>`.

## Report back

Old head, new head, the exact resolution applied to `prepare-flow-b-fixture.ts` (show the final
discovery + union + replace lines), confirmation no other file needed a non-trivial resolution, every
verification command's exit code/summary, the static reproduction evidence, and confirmation the
worktree is clean and the push landed.
