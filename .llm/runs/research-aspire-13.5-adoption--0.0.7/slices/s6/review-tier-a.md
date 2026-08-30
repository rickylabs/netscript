# S6 Tier-A slice review — #1718 / PR #1743 (phase A, stacked on S5)

- Reviewer: Fable 5 medium supervisor; generator: GPT-5.6 Sol high, thread
  `01a0506f-524b-7df0-a446-91a382a9bdf3`. Review worktree
  `/home/codex/repos/netscript-aspire-13-5-s6-eval`.
- Exact head: `78d0ded28`; base = S5 head `0bd8ba832` (PR base `fix/aspire-13-5-s5-literal-ports`;
  retarget to `main` after S5 merges). S5 commits untouched (merge-base == `0bd8ba832`).

## Commit stack

`54fdf19fe` helpers `createListenerReadinessCheck` / `createRespPingCheck` in
`_aspire-compat.ts.template` (+ template test harness stubbing `.aspire/modules/aspire.mts`) →
`feb1e7aad` generator emission per kind (`addHealthCheck('<r>_listener'|'_resp')` +
`withHealthCheck`, host/port via `getEndpoint('tcp').property(EndpointProperty.Host|Port)` at check
time) → `c33766718` barrel regen → `92de34d9b` `runtime-gates.ts` split into `runtime/` modules,
`healthReports` wait contract, phase-B `listener-unreachable-fixture.ts` (unexecuted) → `78d0ded28`
S6b / #1366 / #863 drafts. 29 files, +2023/−866 over S5.

## Substantive review

- Helpers: `node:net` only; `HealthStatus.Healthy/Unhealthy/Degraded` (PascalCase confirmed in
  `sources/aspire-whats-new-13.5.md` and `aspiredev-fundamentals_custom-resource-commands.md`);
  `setTimeout(2000)`, single socket, `Degraded` only on `-NOAUTH`; no password/user names in the
  probe path (grep 0). A7/A11: generator has no IO (`node:net`/`createConnection` grep 0);
  `EndpointProperty` injected via the generator's value-import slots into the slot template.
- Drift accepted: Deno KV has no `withHttpHealthCheck` at the stacked base (issue assumption was
  carried in) — S6 leaves Deno KV unchanged, stated in PR body + drift.
- E2E: wait gates assert `healthReports['<r>_listener'|'_resp']` Healthy per backing service
  (describe-derived); fixture code present, not run (no lease). `behavior-gates.ts` 304 lines —
  `arch:check` exit 0 (`packages/cli/e2e` is `publish:false`; no FAIL).
- Boundaries: no `packages/aspire` change (jsr-audit N/A), no S8 commands, no pins, no
  `packages/fresh`, no docs/skills, no runtime.
- PR: draft, base S5 branch, `Closes #1718` / `Closes #1280` / `Part of #1712`, stacking + phase B
  stated, labels/milestone correct, 4 per-slice comments (5 commits — the docs-only handoff commit
  has no comment; minor).

## Gates executed at `78d0ded28`

| Gate                                                     | Result                           |
| -------------------------------------------------------- | -------------------------------- |
| configured `deno task lint`                              | exit 0                           |
| `quality:scan` / `arch:check`                            | ok / exit 0                      |
| `check:assets-barrel`                                    | PASS                             |
| `run-deno-test` templates/aspire + cli/e2e/tests         | 462 passed / 0 failed            |
| `run-deno-check` templates/aspire, cli/e2e               | 0 diagnostics                    |
| raw `deno lint --no-config` / fmt on 26 changed TS files | clean                            |
| new lint-ignore / `as unknown as` / `any`                | 0 (1 pre-existing barrel string) |
| `scaffold.plugins --cleanup`                             | 17/17                            |

No blocking finding. **Tier-A verdict: sign-off to IMPL-EVAL (phase A) at `78d0ded28`.**

## IMPL-EVAL cycle 1 (session `9e348b1d`, head `78d0ded28`) — `FAIL_FIX`

- H-1 emission uses `property(EndpointProperty.Host|Port)` → expression handles, not values
  (`.host()`/`.port()` is the 13.5.3 value API); H-2 `HealthCheckResult.data` must be
  `Record<string, string>`; M-1 test stub looser than 13.5.3 and no consumer type-check; M-2
  arch-debt bookkeeping; L-1 wholesale reformat; L-2 missing slice-5 comment.
- **Tier-A miss:** I verified emission shape and official prose, not compilation against the real
  restored module. Checklist updated (D-19): compile a generated AppHost against S2's restored
  `.aspire/modules` for every generator slice; S5's head to be re-checked the same way.
- Fix brief sent on the thread (slice 6). Cycle 2 follows.

## Tier-A cycle 2 — head `564d465c` (slice 6 + D-29 rebase onto S5 `aa822069`) — 2026-08-30, NAS

- Reviewer: Fable 5 medium supervisor (session `session_01Jusn3woxeK5xhCdj6ccooR`); review worktree
  `/home/agent/projects/netscript/worktrees/007-aspire-s6` (clean at head). Base = S5 `aa822069`
  (merge-base verified by the rebase in D-29; S5 commits untouched).
- **Slice 6 (`564d465c`, "type generated health checks against 13.5.3") answers cycle 1:**
  - H-1: generator now emits
    `const endpoint = await X.getEndpoint('tcp'); const host = await
    endpoint.host(); const port = await endpoint.port();`
    inside each `addHealthCheck` callback for Postgres/MySQL/MSSQL listener checks and Redis/Garnet
    RESP checks (value API, per invocation). The `EndpointProperty` value-import slot no longer keys
    on `usesDatabaseListenerReadiness`; it is still imported for the cache paths that use
    `EndpointProperty.Url` / `HostAndPort` (generator l.415/456/499), so the retained import is
    live, not dead. Test assertions updated to the new form and additionally assert
    `EndpointProperty` is absent for the DB-only case.
  - H-2: `_aspire-compat.ts.template` `listenerData` returns `Record<string, string>`;
    `port`/`elapsedMs` stringified, contract keys unchanged.
  - M-1: helper test stub tightened to 13.5.3's `HealthCheckResult`
    (`data?: Record<string,
    string>`); real consumer `tsc --noEmit` against S2's restored 13.5.3
    modules recorded in `receipts/06-consumer-typecheck-13.5.3.txt` on the S6 branch (exit 0, TS
    5.9.3, module SHA-256s listed). Taken pre-rebase, but S5's repair range `0bd8ba83..aa822069`
    touches **no** file under `packages/cli/src/kernel/templates/aspire` or `packages/cli/e2e`, so
    the rendered output is identical at `564d465c` → receipt carries over (D-19 satisfied for this
    head).
  - M-2: arch-debt entry present in the commit; L-1 no wholesale reformat in slice 6 (6-line
    template diff); L-2: the slice-6 commit has **no per-slice PR comment** on #1743 (last comment
    is slice 5) — minor, covered by this sign-off comment.
- **Gates executed at `564d465c`** (fork agent, read-only, no runtime): scoped `deno check`
  `packages/cli/e2e` + `templates/aspire` → 0 diagnostics (213 files); raw `deno lint` on the 23
  changed e2e files + `--no-config` on the 4 template files → clean; raw fmt on the 4 template files
  → clean; `quality:scan` ok (0 findings); `arch:check` exit 0 (2 pre-existing WARN);
  `check:assets-barrel`, `check:publish-assets`, `check:aspire-host-ports` (S5 F-4 full-text) → exit
  0; `run-deno-test` templates/aspire + cli/e2e/tests → **462 passed / 0 failed**. Lint escapes
  added over `aa822069..564d465c`: `deno-lint-ignore` 0, `: any` 0, `as unknown as` 1 — inside the
  regenerated `_aspire-compat.mts` string literal in `embedded.generated.ts` (same pre-existing
  barrel string as cycle 1). Wrapper lint/fmt refuse `templates/aspire` (root
  `exclude: packages/cli/`) and the e2e lint batch trips on the pre-existing `zod` catalog miss in
  `packages/cli/e2e/fixtures/desktop-native/deno.json`; both covered by the raw runs above.
- Boundaries re-checked: no `packages/aspire`, no pins, no S8 command surface, no docs/skills, no
  runtime.
- No blocking finding. **Tier-A verdict: sign-off to IMPL-EVAL cycle 2 (phase A) at `564d465c`.**
  Phase B (listener-unreachable fixture + `healthReports` receipts) still needs a serialized runtime
  lease; the PR stays draft.
