use harness

# fix/1015 review follow-up — Windows parent-relative specifiers are not project-relative

Worktree `/home/codex/repos/fix-1015`, branch `fix/1015-sagas-registry-path` (already has 8 commits, PR #1031, CI green). Worktree has **no upstream by design** — push explicitly with `git push origin HEAD:refs/heads/fix/1015-sagas-registry-path`. Do not add an upstream, do not run a bare `git push`.

> The Plan-Gate open-model evaluator is waived by the owner (2026-08-01); the supervisor performs PLAN-EVAL and IMPL-EVAL. Do not attempt `claude-print`, `provider-canary`, OpenRouter, Qwen or OpenHands, do not stop at the Plan-Gate, and do not fabricate a `plan-eval.md`. Write your plan, then proceed directly to implementation.

## SKILL

Activate: `netscript-harness`, `netscript-doctrine` (plugin boundaries), `netscript-deno-toolchain` (module specifier / URL resolution semantics), `netscript-tools` (validation evidence), `netscript-pr` (PR process + review-thread replies).

## The review comment (Augment bot, id=3696652319, SEVERITY MEDIUM)

`plugins/sagas/src/runtime/project-registry-module.ts:44` — `isProjectRelativeSpecifier()` does not treat Windows parent-relative specifiers like `..\foo` as project-relative, so `resolveProjectRegistryModule()` returns the raw string and `import()` will likely fail on Windows. Inconsistent with the function's own backslash-tolerance goal.

## Supervisor's verification — the claim is CONFIRMED, do not re-litigate it

Current body:

```ts
function isProjectRelativeSpecifier(specifier: string): boolean {
  return specifier === '.' || specifier.startsWith('./') || specifier.startsWith('../') ||
    specifier.startsWith('.\\');
}
```

`'..\foo'` starts with `.` then `.` — so `startsWith('.\\')` is **false** (its second char is `.`, not a backslash) and `startsWith('../')` is false too. Observed output with `projectRoot = 'C:\Users\eric\proj'`:

| specifier | current result | correct result |
| --- | --- | --- |
| `.\foo\reg.ts` | `file:///C:/Users/eric/proj/foo/reg.ts` | same (already right) |
| `..\foo\reg.ts` | `..\foo\reg.ts` (raw — **bug**) | `file:///C:/Users/eric/foo/reg.ts` |
| `..\..\a\b.ts` | `..\..\a\b.ts` (raw — **bug**) | `file:///C:/Users/a/b.ts` |
| `..` | `..` (raw — **bug**; `.` alone *is* handled) | anchored to project root's parent |
| `..\` | `..\` (raw — **bug**) | anchored |

So there are two related holes: leading `..\`, and the bare `..` segment (the `.` counterpart is already special-cased, so this is the same inconsistency).

## What to do

1. Normalize separators **once**, then test the normalized string — do not keep bolting on `startsWith` variants:

   ```ts
   function isProjectRelativeSpecifier(specifier: string): boolean {
     const normalized = specifier.replaceAll('\\', '/');
     return normalized === '.' || normalized === '..' ||
       normalized.startsWith('./') || normalized.startsWith('../');
   }
   ```

   Keep it a module-private function; do **not** add it to the export map (this file is internal, per the PR body).

2. Confirm nothing downstream regresses: `projectFileUrl` already does `relativePath.replaceAll('\\', '/')`, so the anchoring path handles the normalized value correctly. Do **not** change `projectFileUrl`.

3. Do **not** widen the predicate to bare relative specifiers (`sub/x.ts`, `sub\x.ts`). Those are deliberately treated as module specifiers today and that behaviour must be preserved — bare specifiers stay untouched, and `jsr:`/`file:`/`https:` absolutes stay untouched.

4. Add tests in `plugins/sagas/tests/runtime/project-registry-module_test.ts` covering Windows-style parent-relative specifiers. At minimum:
   - `..\generated\sagas.registry.ts` with a Windows drive `projectRoot` → resolves to a `file:///C:/...` URL above the project root, **not** returned raw.
   - a multi-level `..\..\` case.
   - mixed separators, e.g. `..\generated/sagas.registry.ts`.
   - bare `..` and `..\`.
   - a regression assertion that a bare specifier (`sub/x.ts`) and `jsr:@example/registry` are still returned verbatim.
   Assert on `resolveProjectRegistryModule` (the seam the bug is reported against), injecting `projectRoot` / `readEnv` — these must pass on Linux and Windows alike, so do not touch the real filesystem or `Deno.build.os`.

## Out of scope

Nothing else on this branch changes. Do not touch `services/src/init.ts`, `saga-runner.ts`, `sagas-contribution.ts`, the Aspire entrypoint strings, or the PR's Remaining-scope framing. Do not attempt the two unmet acceptance criteria on #1015.

## Validation (run exactly these, paste real output)

- `deno run -A .llm/tools/run-deno-check.ts --root plugins/sagas --ext ts` — **do not pass `--unstable-kv`**; the wrapper emits it by default and rejects the flag (exit 1).
- `deno lint plugins/sagas`
- `deno fmt --check plugins/sagas`
- `deno test -A plugins/sagas/tests/`

Do not run `deno task e2e:cli run scaffold.runtime` — generated glue text is unchanged.

## Commit + push

One commit, e.g. `fix(sagas): treat Windows parent-relative registry specifiers as project-relative`. Then:

```
git push origin HEAD:refs/heads/fix/1015-sagas-registry-path
```

and confirm `git rev-parse HEAD` equals `git ls-remote origin fix/1015-sagas-registry-path`. Report both SHAs.

## Report

The verified before/after behaviour for `..\foo`, the test names added, real output for each validation command, and the pushed SHA. If you conclude any part of the analysis above is wrong, say so explicitly rather than silently deviating.
