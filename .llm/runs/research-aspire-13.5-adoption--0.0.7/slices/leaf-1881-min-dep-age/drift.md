# Drift Log — README minimum dependency age

## 2026-09-03 — Repository-wide README baseline

- **Expected:** Documentation checks relevant to the changed README/Quickstart surfaces pass.
- **Actual:** Accuracy and link checks pass. The broader `docs:readme:check` exits 1 solely because
  baseline `packages/bench/README.md` has no `## Install` section; the file is unchanged at
  `3149d18e1` and outside this slice.
- **Severity:** baseline / no slice impact
- **Action:** leave untouched and report honestly; no scope expansion.

## 2026-09-03 — Generated-file lint refusal

- **Expected:** Lint all handwritten changed TypeScript; validate generated carriers with their
  generators.
- **Actual:** An exploratory five-file lint selection exited 2 because the wrapper deliberately
  excluded `agent-docs.generated.ts` and refused partial coverage; it reported zero lint findings.
- **Severity:** minor tooling classification
- **Action:** run the structured lint verdict over the three handwritten changed TypeScript files
  (exit 0); use carrier checks for both generated TypeScript files.

## 2026-09-03 — Converged baseline browser fixtures require executable temp storage

- **Expected:** full `packages/cli/e2e/tests` wrapper passes after rebasing onto `3903feea6`.
- **Actual:** the first run passed 364 tests and failed two browser-probe tests added on current
  main because `Deno.makeTempDir()` selected `/ephemeral/tmp`, mounted `noexec`; both generated
  shell fixtures failed to spawn with `Permission denied` before their assertions. The identical
  wrapper with `TMPDIR` set to the executable repository-local `.llm/tmp` passed 366/366.
- **Severity:** environment / no slice impact
- **Action:** record both exit codes, use the executable temp root for this host's verdict, and do
  not change baseline tests or product code, start Aspire, or run a runtime suite.
