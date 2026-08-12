# Worklog: PR-B #1403 quality-gate coverage

## Identity

- Worktree: `/home/codex/repos/ns006-qualitygate`
- Branch: `fix/1403-quality-gate-coverage`
- Base: `3c9dc1f3907c605d2d30d76f5a20ade1e4754736`
- Draft PR: #1570
- Route: Codex · GPT-5.6 Sol · low
- PLAN-EVAL: PASS, quality-rail revision 4, cycle 5

## Design

The parent orchestration worklog is authoritative. This leaf executes its locked B1–B3 slices:

1. B1 — export `discoverDoctrineRoots()` with the final 36-unit top-level `packages/*` +
   `plugins/*` selector and compare it with an independently enumerated expected set.
2. B2 — repoint `arch:check` to that function in one transition; state why nested
   `packages/cli/e2e` is outside doctrine-root scope.
3. B3 — make changed-file selection include `.llm/tools/**`, report an empty set as not scanned,
   and use three-dot merge-base semantics; triage findings without source fixes.

No package/plugin public surface changes; archetype and jsr-audit are N/A. Doctrine A14 and F-19
govern the gate-truth changes.

## RED-first evidence

Command:

```text
deno test --allow-read --allow-env --allow-write --allow-run \
  .llm/tools/fitness/check-doctrine_test.ts \
  .llm/tools/quality/changed-source-files_test.ts
```

Exit **1**. Type checking reports both missing contracts:

```text
TS2307: Cannot find module '.llm/tools/quality/changed-source-files.ts'.
TS2305: check-doctrine.ts has no exported member 'discoverDoctrineRoots'.
```

This single committed fixture set proves the doctrine selector and PR changed-file behavior red
before either implementation exists. The `.llm/tools`-only and stale-base cases are explicit test
fixtures, not inferred from the final implementation.

## Reconcile notes

- Bootstrap: live issue #1403 has 8 acceptance boxes; draft PR #1570 carries `Closes #1403`, a
  non-closing reference to #1564, the required labels, exactly one `status:impl`, and milestone
  0.0.6.

## Gates

- `deno task arch:check` after the 36-root transition — exit **1**, 54 known pre-existing A14
  findings. See `drift.md` D-1; no findings fixed or suppressed.
- `deno task quality:scan --pretty --root packages/plugin-streams-core` — exit **0**, 0 findings,
  0 allowances.
- Focused doctrine result for `plugin-streams-core` — 0 FAIL, 1 WARN, 1 INFO. The single actionable
  warning is recorded in `triage.md`; no package source was edited.
- Scoped check wrapper (`--root .llm/tools --ext ts`) — exit **0**, 287 files, 0 diagnostics.
- Scoped lint wrapper (`--root .llm/tools --ext ts`) — exit **0**, 287 files, 0 diagnostics.
- Scoped format wrapper (`--root .llm/tools --ext ts`) — exit **1** solely for pre-existing,
  out-of-scope `.llm/tools/harness/extract-verdict.ts`; every owned TS file passes. See D-2.
- `code-quality.yml` — `@std/yaml` parse exit **0**; draft workflow policy tests 3/3 pass.
- Workflow-equivalent changed-file scan at `ca52c3a8f` — exit **1** on 2 pre-existing comment false
  positives, both recorded in `triage.md`; see D-3.
- `deno task quality:gate` — exit **1**: default quality scan is green, then the discovered-root
  doctrine half fails on the 54 known A14 findings from D-1.
- `deno task quality:scan:repo` — exit **0**, 0 findings, 8 allowances.
- `deno task gen:assets-barrel` second run — exit **0** and `git status --porcelain` empty;
  generated assets are fresh and idempotent.
