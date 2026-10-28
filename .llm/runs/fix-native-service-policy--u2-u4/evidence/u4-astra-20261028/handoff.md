# U4 implementation handoff — source acceptance pending

U4 is implemented in the accepted eleven owners plus the single consumer-test
owner root added after observing the exact planned compatibility impact. No U4
commit, push, ready/merge, independent IMPL or release claim. PR 2422 remains
the draft U2 checkpoint at `a4060f030af6ae98139cc7d0c8331161ed697a6a`.

## Final behavior and footprint

- Public AnonymousRequestMatch/AnonymousRule are reachable from root and ./auth.
  Six uppercase methods are accepted; GET does not admit HEAD. Legacy prefix
  strings/defaults remain.
- Shared normalization validates exact entries at construction, snapshots arrays
  and object values, and matches method plus both raw and Hono-routed byte-exact
  paths. Contract precedence and native authn/authz error shapes remain. No
  assertion-policy or resolver owner changed.
- Health configuration stays opt-in/one-time. The same three native factories
  install after auth and body limit, before deferred routes. Mark installed only
  after registration. Absent, late before-first-request, repeated build/serve
  and original configuration behavior are exercised.
- Authn and authz middleware both construct before app.use; installed is marked
  only after both registrations. Repeated invalid build/serve rejects with zero
  callbacks/listeners. A valid retry exposes accidental partial registrations;
  both authn-failure and later authz-failure cases pass.
- Root factual addendum records actual native health snapshots: withHealth ->
  withHealthCheck -> build includes the configured check; health checks snapshot
  at installation. Readiness keeps its existing live-array behavior. No dynamic
  post-install health capability was added.
- README +40 and CHANGELOG +9, additions only, preserve pinned 0.0.8 and U2 CORS
  text. They state custom-list health 200 to 401 compatibility impact and
  '/health'/six-exact-entry migration.
- Root authorized exactly two changed lines in the extra plugin test: title and
  health 200 to401. Spec200/private-health401/body consumption and unrelated
  Windows URL behavior remain intact.

Twelve source/test/doc owners: **+867/-45** including the 332-line new focused
test. No U4 debt growth; root's existing +14 delta is byte-identical. Complete
tracked source diff is `tracked-source.diff`, new test is
`new-health-test.diff`; final hashes/counts are `source-hashes.json`. Builder
**633 physical lines**, below661. Auth tests: middleware477, builder-auth433,
define-service-auth299, health-auth-order332; every file <=480 without golf. The
doctrine checker counts a trailing split segment and reports builder634; the
accepted physical line-count convention is633. Its existing F-1 warning remains;
no doctrine waiver or PASS for that individual debt is claimed.

Original baseline bodies/assertions in the three existing service test owners
are byte-preserved after imports (`baseline-test-preservation.json`). New
registrations use fixed explicit sanitizeOps/sanitizeResources/sanitizeExit
true. No skips, casts or weakened negative controls. The new matrix counts
authentication, authorization and handlers, exercises real listeners where
planned, reads response bodies and retains cleanup/sanitizer proof.

## Actual RED then GREEN

Before any U4 production edit, the legacy custom-list fixture produced an actual
behavior RED in both CORS modes: **8 passed / 10 failed / 0 ignored**. Eight
failed steps are the measured health bypass; the other two failures are their
parent groups. `red-health-counted.json` includes the actual
status/authn/authz/health/raw tuple: health200/authn0 where401/authn1 is
required. Baseline owner/test hashes are retained in `red-owner-hashes.json`.
The initial health result type mistake is preserved separately in
`red-health-baseline.json` and is not called behavior RED.
`red-health-corrected.json` is the earlier status-assertion RED; counted RED
strengthens its record.

Minimal production correction passed the focused fixture **18/0** in
`green-health-initial.json`. The expanded auth suite initially had three test
type errors (`owning-auth-initial.json`), then one fixture route-inventory
assertion failure (`owning-auth-checked.json`,219/1). After replacing the
incorrect path-filter assumption with the required total registration count,
final owning auth is **220 passed / 0 failed / 0 ignored**
(`owning-auth-green.json`). All intermediate evidence remains; none is relabeled
or discarded.

## Gates

Portable Deno2.9.7 directory was first on child PATH:
`C:/Users/ericc/source/repos/eis-chat-netscript-008-s01/.netscript/agent/toolchains/deno-2.9.7`.
Existing public cache:
`C:/Users/ericc/source/repos/netscript-native-host-policy-008/.llm/tmp/native-host-policy-preflight/cache`.
Product tests use --cached-only --frozen --check --allow-all --sanitize-ops
--sanitize-resources through run-deno-test. Selected check uses repeated
--deno-arg for cached-only/frozen and the wrapper's --unstable-kv. No graph,
lock, configuration, version or dependency-age policy changed.

| Gate                                         | Exit / actual result                                  | Evidence                                                |
| -------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------- |
| Owning auth                                  | 0; 220/0/0                                            | owning-auth-green.json                                  |
| Existing U2 owning set                       | 0; 221/0/0                                            | u2-regression.json                                      |
| Whole service                                | 1; 615/8/0, same four baseline groups and eight names | service-tests.json                                      |
| Service selected types                       | 0;126 files,2 batches,0 errors                        | service-check.log                                       |
| Service lint/fmt                             | 0;126 selected/processed,0 dropped/refused/findings   | service-lint.log, service-fmt.log                       |
| Extra consumer selected type/lint/fmt        | 0;1 file selected/processed,0 findings                | consumer-check.log, consumer-lint.log, consumer-fmt.log |
| Public documentation                         | 0;8 export roots,0 missing/private-type errors        | doc-lint-receipt.json, doc-lint-report.json             |
| Quality scan                                 | PASS/0                                                | quality-scan-receipt.json                               |
| arch:check                                   | FAIL/1 at DB identity prerequisite                    | arch-check-receipt.json                                 |
| Direct doctrine                              | exit0; service FAIL0/WARN5/INFO1                      | doctrine-direct.log                                     |
| Full workspace publication dry-run           | PASS/0,91.631s                                        | publish-dry-run-receipt.json                            |
| Publication scratch cleanup                  | identified temporary workspace absent                 | final-state.json                                        |
| JSR surface audit                            | exit0,0 findings; --no-dry-run                        | jsr-audit.log                                           |
| Consumers before authorized oracle migration | 1;24/2/0                                              | consumers.json                                          |
| Consumers after migration                    | 1;25/1/0, existing Windows URL failure only           | consumers-aligned.json                                  |
| git diff --check                             | 0                                                     | diff-check.log                                          |

The publication dry-run completed while the later consumer-only assertion/title
migration was being finalized. Product source was frozen throughout; subsequent
complete consumer tests and single-owner type/lint/fmt cover that exact two-line
test change. No expensive e2e:cli, apps, AppHost, providers, browser/CEF or
installer acceptance was launched. Publication was dry-run only.

## Baseline failures and scope disposition

Whole-service names/counts match U2's already-authorized unchanged-U1
comparison: three child stdout leaks, two request-body leaks, two stop-timer
leaks and mapped IPv4 connection refusal. No fresh U1 work or baseline repair
was performed. The existing JavaScript-caller Windows URL failure remains.
arch:check still stops at the DB identity prerequisite, so direct doctrine PASS
is supplemental only. These eight service, one consumer and DB identity failures
remain unwaived.

The first U4 consumer report adds the expected health401 versus old200 fixture
failure. Root inspected its custom list excluding health, authorized only its
title/status migration, and required the25/1 rerun. The evaluated plan/verdicts
are immutable; exact correction and rescope are in
`.llm/runs/fix-native-service-policy--u2-u4/root-u4-factual-addendum.md`.

All four plan/verdict hashes, preexisting debt, deno.json/lock and the two U2
implementation/test hashes match; package.json remains absent.
`preserved-owner-hashes.json` and `final-state.json` retain those values. U2
docs gained only the authorized U4 additions. Generated initialization tooling
is untracked and unmodified; user primary eis-chat and baseline U1 checkout were
untouched.

Root must read the complete twelve-owner source/test/docs diff and factual
addendum before source acceptance and any checkpoint authorization. Independent
IMPL review and remaining merge/runtime gates are outstanding. No blanket
security, adoption, release or all-gates-green claim is made.
