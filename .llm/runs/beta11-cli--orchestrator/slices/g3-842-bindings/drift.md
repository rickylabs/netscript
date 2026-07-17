# Drift Log: G3 #842 type-safe desktop bindings

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-07-18 — Integration branch advanced during research

- **What:** G2's reviewed auto-update slice was not on the local integration baseline when the run
  started, but landed on the remote integration branch before the Design checkpoint was written.
- **Source:** `git show` of `origin/feat/desktop-frontend-841-autoupdate`; later
  `origin/feat/desktop-frontend` @ `e6e1be087722746b83b1835e29f265adc40db991`.
- **Expected:** The user brief said the G2 sibling was already on this branch's integration base.
- **Actual:** Local HEAD began at `b22480580bacf678912bd8c1056ef152a7374dae`; the clean feature
  branch was fast-forwarded to `e6e1be08` before artifacts or product files were created.
- **Severity:** minor
- **Action:** fix
- **Evidence:** fast-forward `b2248058..e6e1be08`; `packages/sdk/src/auto-update/mod.ts` is now
  present and the worktree remained clean.

## 2026-07-18 — Local Deno patch version exceeds skill prose

- **What:** The runtime is Deno 2.9.3 while the toolchain skill's narrative names Deno 2.9.0.
- **Source:** `deno --version`.
- **Expected:** Deno 2.9.0.
- **Actual:** Deno 2.9.3.
- **Severity:** minor
- **Action:** accept
- **Evidence:** The required Desktop bindings debuted in 2.9 and the current official docs remain
  the surface authority.

## 2026-07-18 — Fresh doc-lint debt is present despite resolved historical entry

- **What:** The current Fresh full-export doc graph has 40 baseline findings even though the
  historical Fresh full-export residue entry in the debt registry is marked resolved.
- **Source:** `deno task doc:lint --root packages/fresh --pretty` at `e6e1be08`.
- **Expected:** The resolved debt entry implied a clean or reconciled current export graph.
- **Actual:** 23 private-type references and 17 missing-JSDoc findings remain in untouched route,
  query, and streams graphs.
- **Severity:** significant
- **Action:** defer
- **Evidence:** `research.md` records the exact baseline. This issue will require the new
  `./desktop` entrypoint to be independently clean and will reject any increase, but will not absorb
  unrelated Fresh restructuring into #842.

## 2026-07-18 — JSR helper misclassifies the dry-run progress banner

- **What:** The local JSR helper counts `Checking for slow types in the public API...` as a warning
  even when raw package dry-run succeeds with no slow-type diagnostic.
- **Source:** `.llm/tools/fitness/audit-jsr-package.ts` output versus raw
  `deno publish --dry-run --allow-dirty` in SDK and Fresh.
- **Expected:** Only actual slow-type diagnostics are warnings.
- **Actual:** One false-positive banner warning is reported for each package.
- **Severity:** minor
- **Action:** accept
- **Evidence:** Both raw dry-runs exit 0. The plan retains raw output as the authoritative
  slow-type/publish-list gate and records helper findings separately.
