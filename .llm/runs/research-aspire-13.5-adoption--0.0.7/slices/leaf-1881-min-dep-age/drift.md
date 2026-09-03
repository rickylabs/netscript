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
