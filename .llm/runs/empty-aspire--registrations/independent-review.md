# NetScript PR1998 — Empty Aspire Registrations: Independent Generator Review

- **Implementation verdict: PASS**
- **Source reviewed:** `ee272ba183409e80ef16584a91051edbd78527cd`
  (`/home/agent/repos/netscript-empty-registration-review`, clean tree)
- **Baseline:** `8ba53bc50`. Product commits: `1aac9e612` (fix + tests);
  `ee272ba18` is docs-only (receipt disposition correction).
- **Scope:** product read-only; dependency install/test scratch permitted; no
  source commits, sibling writes, runtime start/stop, push, merge, release.
  Wrote only this file.

## Slice contents (exact, 11 files)

- Shared template (new):
  `packages/cli/src/kernel/assets/generated/aspire/helpers/empty-registration.ts.template`
- Manifest entry: `kernel/assets/manifest.ts` (+1 key)
- Two generator branches: `generate-register-plugins.ts` /
  `generate-register-background.ts` (+10 lines each: empty-input early return)
- Regenerated `embedded.generated.ts` (asset barrel, via native task)
- Tests: new `empty-registration_test.ts` + updated empty-case assertions in
  `generators-background-app_test.ts` / `generators-service-plugin_test.ts`
- Run receipts: `worklog.md`, `tests.json`, `quality-config.json`

## Findings

1. **Template correctness — PASS.**
   [observed - `empty-registration.ts.template`] Five substitution slots
   (`header/sdk/compat/functionName/pluginParameter`) rendered through the
   existing `renderTemplateAssetSync` path with the same constants the
   populated path uses (`SDK_IMPORT_FROM_HELPERS`, `ASPIRE_COMPAT_IMPORT`,
   `fileHeader`) — no new interpolation machinery, no user-data slots, so
   no escaping surface beyond the already-trusted module specifiers.
   Type-only value imports + `Promise<Map<…>>` return + fresh
   `Promise.resolve(new Map())` per call preserve the populated contract's
   arity/shape semantics (5-arg plugins incl. `_appHostDir`; 6-arg
   background with extra `_plugins` param). Severity: none.

2. **Branch gating — PASS, populated paths untouched.**
   The `entries.length === 0` early return precedes all populated logic in
   both generators; non-empty input never reaches the new template
   [observed - both generator diffs]. Existing populated tests remain in the
   suite and pass (42 TAP files, 238 steps, 0 failures on re-run).
   Severity: none.

3. **Executable regression tests — PASS (strong).**
   [observed - `empty-registration_test.ts`] Emitted modules are written to
   temp files, linted with real `deno lint` (exit 0), dynamically imported,
   and executed against `Proxy` arguments that throw on any property access
   — proving arity (5/6), Promise shape, fresh-map-per-call, and zero
   argument inspection. This tests the *output*, not the generator's
   intentions. Re-ran: included in the 42/42 directory pass. Severity: none.

4. **Quality evidence — PASS with config honesty.**
   Default wrappers refuse the CLI tree (`all-excluded`: root config
   excludes `packages/cli` from lint/fmt) — reviewer reproduced this
   refusal and did **not** count it as a pass. With the committed explicit
   recommended-rules config (`quality-config.json`): changed 5 files lint
   clean and fmt clean (reviewer re-ran both). Check wrapper: 34 files, 0
   failed batches. `deno task quality:gate`: exit 0. `gen:assets-barrel`
   re-run: tree stays clean (barrel freshness proven). Severity: none.

5. **Asset-barrel churn — verified cosmetic.**
   The 397-line `embedded.generated.ts` diff looks alarming but reviewer
   proved: template-key set differs by exactly +1 (the new template; 69→70
   keys), and the bulk is `template_NNN` index renumbering from insertion
   order. No asset content added/removed/altered. Severity: none (info).

6. **Receipt honesty — PASS (strength).**
   The worklog and PR body explicitly correct the earlier "all-checks-PASS"
   misread (full JSON `ok:false` from pre-existing missing Prisma
   `operation` delegate), disclose the stale-blocker separation, and claim
   no release/adoption PASS. The `ee272ba18` commit exists solely to fix
   that disposition. Severity: none.

## Verification executed

- Helpers test dir re-run: **42 passed (238 steps), 0 failed** (committed
  receipt from a fuller env: 280 passed — count differs by nested-step
  accounting, zero failures in both).
- `deno task quality:gate`: exit 0. `gen:assets-barrel`: no drift.
- Changed-file lint + fmt with explicit config: clean.
- Matrix receipts confirm generator Astra/medium vs. evaluator Muse Spark
  1.3/max separation (OpenAI vs Meta).

## Remaining integration gates (not implementation defects)

1. Full `scaffold.runtime` smoke unverified (remote-loopback health-check
   limit, honestly recorded) — minimum needed: fresh scaffold → generate →
   type-check generated helpers → start/stop lifecycle on a loopback-clean
   host.
2. Consumer full-check red (missing Prisma `operation` delegate) predates
   this repair; needs its owned fix, not this slice.
3. Release handoff / adoption PASS: none claimed, none granted here.
4. Five untouched files with pre-existing fmt drift were correctly left
   alone.

## Required corrections

None. Safe to merge on implementation correctness once CI concurs; runtime
and release gates above stay open as stated.
