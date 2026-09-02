# Drift Log: #1249 form control props and Zod 4 constraints

Drift is append-only.

## 2026-09-02 — Explicit deferred follow-ups and exclusive-bound mapping

- **What:** `@netscript/fresh-ui` narrowing-helper cleanup and docs-site prose simplification remain deferred; exclusive Zod numeric bounds will not be emitted as native `min`/`max`.
- **Source:** Owner implement brief; HTML inclusive bound semantics; `plan.md` D2.
- **Expected:** The brief excludes Fresh UI/docs-site changes and requires an explicit, non-off-by-one exclusive-bound decision.
- **Actual:** The plan keeps those files outside the ceiling and maps only checks whose `inclusive` flag is true.
- **Severity:** minor
- **Action:** defer
- **Evidence:** `plan.md` Locked Decisions and Deferred Scope.

## 2026-09-02 — RTK unavailable in the generator environment

- **What:** The repo-preferred `rtk` executable is not present on `PATH`.
- **Source:** `rtk proxy deno task deps:why zod` and `rtk rg ...` returned exit 127.
- **Expected:** The repository skill describes machine-level RTK availability.
- **Actual:** The generator used raw focused reads and the authoritative structured validation wrappers instead.
- **Severity:** minor
- **Action:** accept
- **Evidence:** No verdict relies on filtered RTK output; all gate evidence is wrapper-sourced.

## 2026-09-02 — Preact-derived role type is not doc-lint public

- **What:** The preferred Preact-derived `ControlProps.role` representation was replaced by the exact Preact 10.29.2 `AriaRole` literal set inline on the property.
- **Source:** S3 `deno doc --lint packages/fresh/src/application/form/mod.ts` probe.
- **Expected:** `JSX.HTMLAttributes<HTMLElement>['role']` would remain a documented dependency type while making the control bag intrinsic-assignable.
- **Actual:** Deno reported two `private-type-ref` diagnostics through Preact's `JSXInternal`; importing Preact's root-exported `AriaRole` directly still reported one `private-type-ref`. The inline literal set exits 0 and preserves the exact accepted roles without exporting upstream types.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `plan.md` D1 was reconciled; focused package check and form doc lint both exit 0.

## 2026-09-02 — Full Fresh doc aggregate has pinned-base debt

- **What:** The package-wide doc-lint aggregate exits 1 with 45 diagnostics outside the form entrypoint.
- **Source:** S3 full-export gate and an isolated run at pinned base `8c549c061`.
- **Expected:** The form surface must remain unchanged or improve; full Fresh doc lint was planned as an aggregate signal.
- **Actual:** Both base and branch report the same 45 diagnostics (28 private references, 17 missing JSDoc); `./src/application/form/mod.ts` reports zero on both.
- **Severity:** minor
- **Action:** defer
- **Evidence:** Exact-base detached worktree and branch `deno task doc:lint --root packages/fresh --pretty` summaries match; the changed form entrypoint independently exits 0.
