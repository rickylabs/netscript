# Drift Log: config-aware installed workers registry generation

Drift is append-only.

## 2026-09-01 — documented RTK proxy unavailable

- **What:** The `rtk` binary referenced by repository tooling instructions is not on PATH in this shell.
- **Source:** `rtk rg --files` / `rtk git log` returned `command not found` during bootstrap.
- **Expected:** `.agents/skills/rtk/SKILL.md` says the machine-level binary is already on PATH.
- **Actual:** Focused raw read-only commands are required in this worktree session.
- **Severity:** minor
- **Action:** accept
- **Evidence:** bootstrap commentary and worklog; authoritative gates still use structured Deno wrappers.

## 2026-09-01 — declared config dependency updates member lock snapshot

- **What:** Adding the locked-plan `@netscript/config@0.0.6` import to
  `plugins/workers/deno.json` makes Deno add one dependency row under the lockfile's
  `workspace.members.plugins/workers.dependencies` snapshot.
- **Source:** A workspace-aware `deno eval` after the import edit produced a one-line `deno.lock`
  diff; `git diff -- deno.lock` identified only `jsr:@netscript/config@0.0.6`.
- **Expected:** The brief says the existing workspace dependency means `deno.lock` will remain
  byte-unchanged.
- **Actual:** The package is already present in repository source/registry data, but Deno also
  records each member's direct dependency set, so the new direct edge changes that snapshot.
- **Severity:** significant
- **Action:** accept the required dependency declaration; restore and do not commit the generated
  lock row, per the owner's explicit lock rule. Report frozen-install equivalence as contradicted
  rather than claiming it passed.
- **Evidence:** base/working lock blob before the edit `ac2ee042566bc6b03502c40961c10d624416b061`;
  generated blob `098c46a96e01cdfbd6d473c821c997c29eb38a44`; exact one-line diff recorded in the session.

## 2026-09-01 — existing official sample policy defaults to the wrong discovery source

- **What:** `official-sample-configuration.ts` authors `create-user-settings` at
  `../../plugins/workers/jobs/create-user-settings.ts` without `source: 'plugin'`. Slice C therefore
  normalizes it to `source: 'local'`, while locked D6 requires plugin discovery to reject that
  mismatch.
- **Source:** Focused inspection of the existing sample writer after implementing D6's source check.
- **Expected:** Authored sample policy and discovery identity agree, so a later regeneration of a
  scaffolded project remains valid.
- **Actual:** The first scaffold generation writes samples after registry generation, but a later
  config-aware generation can report the intentional D6 source mismatch.
- **Severity:** significant
- **Action:** defer. Correcting the sample writer is outside Slice G's locked touch set: the sixth
  product file is the required policy/reference document and the optional seventh slot is reserved
  for an integration fixture only. Do not weaken D6 or silently expand the slice; surface this to the
  supervisor for hosted-smoke triage/follow-up.
- **Evidence:** existing sample entry at
  `plugins/workers/src/cli/official-sample-configuration.ts:304`; D6 at clustered-plan lines 118–142.

## 2026-09-01 — root lint/format policy excludes the CLI package

- **What:** Structured focused lint/format wrappers refuse the changed CLI integration test because
  root `deno.json` excludes all of `packages/cli/` from both tools.
- **Source:** `focused-lint.json`, `focused-fmt.json`, `cli-lint.json`, and `cli-fmt.json` receipts.
- **Expected:** The requested focused CLI lint/format commands cover the changed test.
- **Actual:** The repository policy drops the file. A direct `deno lint --no-config` covers it and
  passes; `deno fmt --no-config --check` reports the entire pre-existing single-quote file because
  Deno's config-free default is double quotes.
- **Severity:** minor
- **Action:** accept the repository policy and retain the established file style; do not create
  unrelated whole-file churn. Plugin formatting remains fully covered by the structured wrapper.
