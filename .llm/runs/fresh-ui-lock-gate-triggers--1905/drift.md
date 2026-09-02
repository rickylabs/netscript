# Drift: Fresh UI private-lock gate triggers

## 2026-09-02 — Requested implementation-gate document is absent

- **Severity:** minor
- **Expected:** the brief requests `.llm/harness/gates/implementation-gate.md`.
- **Observed:** the file does not exist at the required base, and no renamed implementation-gate
  document is present. The current gate taxonomy is split across `static-gates.md`,
  `fitness-gates.md`, `runtime-gates.md`, `consumer-gates.md`, and `release-gates.md`.
- **Action:** followed the brief's explicit four-command gate set and parsed-YAML proof; no scope
  expansion or invented gate.

## 2026-09-02 — RTK unavailable on PATH

- **Severity:** minor
- **Expected:** use the requested RTK skill for read-heavy shell commands.
- **Observed:** `rtk` returned exit 127 (`command not found`).
- **Action:** used focused raw `rg` and git commands. Gate verdicts will use the required unfiltered
  commands with explicitly captured real exit codes.

## 2026-09-02 — General YAML library rejected for the structural workflow test

- **Severity:** minor
- **Considered:** import `jsr:@std/yaml` and parse the entire workflow with the library.
- **Rejected because:** adding the import requires root `deno.json`/`deno.lock` dependency state.
  That root change would itself stale `packages/fresh-ui/deno.lock`, while this PR is explicitly
  forbidden from regenerating either lock. The generated `@std/yaml` root-lock entries were caught
  by the clean-status check, removed before commit, and absent from every pushed commit.
- **Action:** kept a narrow line-based reader inside the authorized structural test file. Its
  limitations and fail-closed behavior are recorded in `evidence.md`.

## 2026-09-02 — Post-merge trigger-isolation recipe corrected after IMPL-EVAL

- **Severity:** minor
- **Previous recipe:** change a member manifest and deliberately stale
  `packages/fresh-ui/deno.lock` in the same one-shot PR.
- **Finding:** the private-lock path already matches the pre-existing `packages/fresh-ui/**`
  workflow glob and already contributes `freshUi: true`, so that two-file diff cannot isolate the
  new member-manifest trigger.
- **Action:** after the Fable 5.1 opposite-family IMPL-EVAL finding, corrected `evidence.md` to
  require a manifest-only dependency-declaration change with no lockfile edit. A workflow start
  then proves the new trigger glob, while the frozen failure independently proves the
  manifest-versus-lock mismatch.

## Scope Drift

None. The two-layer classifier/workflow fix, tests, and evidence remain within the authorized files.
