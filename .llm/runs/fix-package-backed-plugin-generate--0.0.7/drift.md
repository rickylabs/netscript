# Drift Log: package-backed plugin registry generation

## 2026-09-03 — Required scoped lint/fmt commands cannot cover CLI baseline

- **What:** The exact brief commands for the scoped lint and format wrappers fail closed before any product source change.
- **Source:** `run-deno-lint.ts` exits 2 after selecting 969 files but inheriting the root `lint.exclude: ["packages/cli/"]`; `run-deno-fmt.ts` exits 2 after selecting 969, processing 223 e2e files, and dropping the root-excluded CLI files.
- **Expected:** Both exact commands provide complete scoped CLI verdicts before each push.
- **Actual:** Baseline `79adb103b` has the same root exclusions, and direct `deno lint --config packages/cli/deno.json <cli-file>` reports `No target files found.`
- **Severity:** significant
- **Action:** accept for this ceiling and preserve the raw failure evidence; use focused changed-file lint/fmt in addition to repeating the exact commands. Do not edit root `deno.json` or validation tooling in #1966.
- **Evidence:** `deno.json:189-219`; bootstrap head `2d137cfa9`; `worklog.md` Static Gates.

## 2026-09-03 — Causal scope corrected to the E2E fixture

- **What:** Exact replay disproved a product root-resolution or package-dispatch defect.
- **Source:** Supervisor correction after the two-cwd reproduction.
- **Expected:** The initial brief allowed a product repair after causal discrimination.
- **Actual:** Both cwd values reach the nested package-backed generator, which fails only because
  the dedicated fixture's `deno.json` omits the release-day minimum-dependency-age override.
- **Severity:** significant
- **Action:** Restrict the repair to `package-backed-plugin-doctor-fixture.ts`; do not change product
  `runGenerator`, other `packages/cli/src` generation code, or doctor behavior.
- **Evidence:** RED output in `worklog.md`; GREEN uses the same published CLI and fixture root with
  `minimumDependencyAge: 0`.
