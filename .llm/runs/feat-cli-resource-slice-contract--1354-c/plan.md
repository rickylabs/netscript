# Plan: Slice C resource contract and safe reconciler

This run does not create a new plan. The evaluated authority is:

```text
git show origin/feat/cli-resource-slice-plan:.llm/runs/feat-cli-resource-slice--1354/plan.md
```

Implement exactly `### Slice C — define the resource contract and safe reconciler`, including its
ten-file ceiling and gates. D3 is narrowed to `--dry-run`, owned-only `--force`, exact first-line
JSON ownership markers with `bodySha256`, and zero writes for every pre-apply failure. There is no
keep/replace/abort/recover option, journal, lock, rollback, IO adapter, command registration, or init
change in this slice.

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-cli-resource-slice-contract--1354-c` |
| Branch | `feat/cli-resource-slice-contract` |
| Phase | `plan` (inherited/locked) |
| Target | `packages/cli` internal application layer |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | Fresh contract semantics only; no frontend runtime or browser work |

## Locked scope

- Five pure application modules and their five colocated test modules, exactly as enumerated in
  master-plan Slice C.
- No product file outside those ten paths.
- Harness artifacts and generated carriers are ceiling-exempt. No carrier is expected because no
  public surface moves.
- `PLAN-EVAL: N/A` for this leaf run: the master plan already passed its separate evaluated plan
  gate, and the owner explicitly directs implementation without re-planning.

## Required evidence

- Focused resource-slice tests and the full package-owned CLI suite, with exact counts.
- D3 proof matrix: second run; option selection before conflict; default conflict; owned-only
  force; mismatched-hash marker; unowned content; distinct validation/client/procedure/Fresh
  staging/shared-transform pre-apply failures, all with no apply plan.
- Negative generated-content scan for `any`, raw `fetch(`, handwritten query-key arrays, and manual
  response `JSON.parse`.
- Structured package check/lint/fmt wrappers; `arch:check`; `quality:gate`;
  `docs:readme-fences`; `docs:jsdoc-examples` without baseline growth.
- Raw git verification that only the ten product files plus this run directory changed and that
  `deno.lock` did not move.
