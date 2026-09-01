# Drift Log: Flow-B fixture workers anchor

## 2026-09-01 — generator-family marker guard deferred at the product ceiling

- **What:** `generate-register-plugins.ts` emits positional markers while sibling background and
  service generators retain name-based markers.
- **Source:** Issue #1863 and focused generator source inspection.
- **Expected:** Consider a cheap guard against future marker-format changes.
- **Actual:** A generator-side consistency assertion would touch generator tests/source, which the
  owner explicitly placed behind a rescope request; the fixture no longer consumes these comments.
- **Severity:** minor
- **Action:** defer
- **Evidence:** `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-plugins.ts:64`;
  `generate-register-background.ts:56`; `generate-register-services.ts:60`.

## 2026-09-01 — read-only validation tasks executed beyond the planned three-file scope

- **What:** Passing `--help` through `deno task quality:scan` and `deno task arch:check` did not
  short-circuit the task chains; both read-only repository scans executed.
- **Source:** Gate command output and exit code 0.
- **Expected:** Help text only while confirming scoped options.
- **Actual:** Supplemental repo-wide quality/doctrine scans passed; no files, lock state, services,
  containers, or external runtime state changed.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `worklog.md` Fitness Gates; clean lock hash `ac2ee042566bc6b03502c40961c10d624416b061`.
