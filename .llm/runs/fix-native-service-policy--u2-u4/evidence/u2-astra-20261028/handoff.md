# U2 implementation handoff

U2 response authority is implemented in the four authorized owners. Root source acceptance and
independent IMPL evaluation are pending. No commit, push, publish, release, U4 implementation or
EIS adoption was performed.

## Source and footprint

- Worktree: `C:/Users/ericc/source/repos/netscript-native-service-policy-008`
- Branch: `fix/native-service-policy`; HEAD: `1582e1c9e1adcaa0a8a92900ec3b5b4b0db3e92d`.
- `service-cors.ts`: +55/-5, final 107 physical lines. Hono remains the sole resolver, the existing
  credentialed callback guard remains, and native OPTIONS returns unchanged. A before-next
  checkpoint records six values including absence plus Vary. One finalized-safe `c.header()` call
  makes final headers mutable; direct set/delete operations restore the six decisions. Vary unions
  checkpoint and final tokens with case-insensitive deduplication, first spelling/order, and `*`.
- New `cors-response-authority_test.ts`: 480 readable physical lines (cap 480). Eight top-level
  tests, including 190 named steps; additional loop cases run inside the top-level controls.
- README and CHANGELOG: seven added lines each. Existing 0.0.8 heading, examples and Breaking
  entries remain; the owning topology test passes. No conditional reference-page edit was needed.
- Four-owner footprint: +549/-5, including the new test. The preexisting debt delta is excluded.
- Complete source/doc diff: `owned-tracked.diff`; complete new test diff: `new-regression.diff`.
  Final SHA256/line counts: `source-hashes.json`; final status: `final-status.txt`.
- Existing builder/auth/types/tests/config/locks remain unchanged. Plans, verdicts and preexisting
  debt delta were not edited. Their hashes are in `preserved-owner-hashes.json`.

## RED then GREEN

The regression was written before any production edit. Setup failures are retained separately and
are not called RED: `red-initial.json` records a missing cached assertion module in the originally
supplied cache; `red-u1-cache.json` records seven fixture type errors, corrected before execution.

`red-baseline.json` is the first actual run: 90 passed / 108 failed / 0 ignored. It included two
incorrect native preflight expectations and request-body reuse in the standalone control. After
correcting those fixture errors while production was still unchanged, `red-baseline-corrected.json`
records the actual behavior RED: **132 passed / 66 failed / 0 ignored**. Failures include hostile,
lookalike, literal-null and absent-origin RPC reflection, raw upstream six-header leakage, no-
credentials leakage, middleware override, duplicate Vary, wildcard and resolver/snapshot controls.
The baseline production working-file SHA256 was
`a34a7f6339dc3bc0af0a6b9573200c3d70424298e3818cbd361fc16034928198`;
that RED test SHA256 was `5acbcc5d717400f32c5a5b2fd54d589fd8ae8d99b72e67debd1bfc7e5ec500b8`.

`green-initial.json` is an intermediate source type error, not a passing gate. After the minimal
source correction, `green-regression.json` records **198 passed / 0 failed / 0 ignored**. The source
has remained frozen since root's read. Final test-only strengthening separates the exact
checkpoint-Accept-Encoding/handler-Cookie negative from the duplicate/spelling control and asserts
all six standalone headers. `owning-final.json` passes the resulting final file plus the three
existing CORS/handler owners: **221 passed / 0 failed / 0 ignored**.

Root's final test-mechanics review requested an explicit private registration helper with fixed
`sanitizeOps: true`, `sanitizeResources: true` and `sanitizeExit: true`, plus readable error-assertion
braces. All seven registration sites now use that helper (the credential-profile loop registers
two tests). No assertion was removed; production/docs stayed frozen. The resulting 480-line test
passes again in `owning-sanitizers.json` (221/0/0), and selected types/lint/fmt pass again in the
`service-*-sanitizers.log` structured reports. Prior reports and pre-review hash/diff snapshots remain.

Bodies are read completely. The fixture captures downstream bytes before authority restoration and
checks byte equality afterwards, also checking raw stream identity, status/statusText, cookies in
order, content type, ETag and stream offset. Both credential profiles cover five origins across
RPC/REST/raw/HEAD/redirect/cookies/health/404/procedure-500/raw-onError-500/401/403/503/413 and
short-circuiting caller middleware. Controls cover OPTIONS on four surfaces, wildcard supplied and
absent Origin Vary, checkpoint overwrite, wildcard collapse, resolver once, async credentialed
wildcard denial, environment/caller snapshots, no-withCors, and standalone RPC/OpenAPI.

## Native-oracle corrections to prospective prose

The pinned Hono 4.13.13 cached source is extracted in `cors-index.ts` and `src-context.ts`, located
through `deno info --json` (`graph.json`). Hono appends `Access-Control-Request-Headers` to Vary
whenever its allow-header string is present, including an explicit allowHeaders list. Its default
methods include QUERY. The fixture uses these actual native oracles. Native OPTIONS was not
changed. The plan's contrary parenthetical/default example was not made into production policy.

## Gates

All Deno invocations used portable 2.9.7 first on child PATH:
`C:/Users/ericc/source/repos/eis-chat-netscript-008-s01/.netscript/agent/toolchains/deno-2.9.7`.
After the initial cache miss, the coordinator-supplied public cache was used:
`C:/Users/ericc/source/repos/netscript-native-host-policy-008/.llm/tmp/native-host-policy-preflight/cache`.
Tests use `--cached-only --frozen --check --allow-all --sanitize-ops --sanitize-resources` through
`.llm/tools/run-deno-test.ts`. Test reports carry exact child argv/cwd/exit/counts; .log companions
retain wrapper output. No lock, dependency pin, age bypass or reload was introduced.

| Gate | Exit / result | Evidence |
| --- | --- | --- |
| Owning tests, final | 0; 221 pass / 0 fail / 0 ignored | owning-sanitizers.json |
| Full service suite | 1; 521 pass / 8 fail / 0 ignored | service-tests.json |
| Selected types | 0; 125 files, 2 batches, zero errors; --unstable-kv | service-check-sanitizers.log |
| Scoped lint | 0; 125 processed, zero dropped/refused/findings | service-lint-sanitizers.log |
| Scoped format | 0; 125 processed, zero dropped/refused/findings | service-fmt-sanitizers.log |
| Public doc lint | 0; all eight export roots, zero errors | doc-lint-receipt.json, doc-lint-report.json |
| Quality scan | 0; repository scan, zero findings, existing seven allowances | quality-scan-receipt.json |
| arch:check | 1; deps:check:db failed before doctrine ran | arch-check-receipt.json |
| Direct doctrine checker | 0; service FAIL=0/WARN=5/INFO=1, warnings in unchanged owners | doctrine-direct.log |
| Full workspace publish:dry-run | 0; PASS, 83.116 seconds | publish-dry-run-receipt.json |
| JSR surface audit | 0; zero findings; --no-dry-run (publish proof is separate above) | jsr-audit.json |
| Exact consumer set | 1; 25 pass / 1 fail / 0 ignored | consumer-tests.json |
| git diff --check | 0 | final review command |

Scoped source commands use `--root packages/service --ext ts,tsx` with the repository check/lint/fmt
wrappers. Check also forwards `--cached-only --frozen`; the wrapper includes --unstable-kv.
Durable `run-gate.ts` receipts cover doc-lint (with --root packages/service), quality-scan,
arch-check and publish-dry-run. Direct doctrine command was
`deno run --cached-only --frozen --allow-read --allow-run .llm/tools/fitness/check-doctrine.ts --all-roots`.
JSR command was the repository `audit-jsr-package.ts --root packages/service --no-dry-run` with
read/run/env permissions. Tests selected exactly the owners listed in the accepted plan.

## Reproduced broad-gate failures, not waived

The coordinator authorized read/run-only comparison in initialized U1 worktree
`C:/Users/ericc/source/repos/netscript-native-host-policy-008`, HEAD
`b8168c2c9e4352c7354dcd2e47a181f76d986698`. Its service diff against 1582e1c9 is empty
(`baseline-service-diff.log`); all five selected existing test-owner SHA256s match U2
(`baseline-owner-hashes.json`). Same Deno/cache/flags/sanitizers/profile; outputs were written only
into this U2 packet. Its final tracked diff remains empty.

- All eight service failures reproduce: three legacy-abort child-stdout leaks, two body-limit
  requestBody leaks, two define-service stop-timer leaks, and the dual-stack mapped-IPv4 connection
  refusal. `baseline-service-failures.json`: 0 pass / 8 fail / 0 ignored, four failure groups.
- The consumer failure reproduces: JavaScript-caller test constructs `C:Users/...` instead of a
  valid Windows URL path. `baseline-consumer-failure.json`: 0 pass / 1 fail / 0 ignored.
- arch:check fails at the existing DB identity probe: expected one complete @tanstack/db identity
  for sdk-fresh and fresh-only, observed none. This dependency gate was not repaired or waived;
  the direct doctrine PASS does not convert arch:check to PASS. The task's ordinary reference-lock
  prerequisite fetched existing expo-streams dependencies into cache; no tracked lock/config changed.

## Remaining acceptance

Root must read the final new test/docs diff and accept the slice before independent IMPL review.
The reproduced service/consumer failures and arch:check dependency failure remain unwaived gates;
there is no all-gates-green, release, runtime/browser or security-readiness claim. Expensive
e2e:cli, apps, AppHost, providers, browser/CEF and installer acceptance were not launched.
Existing selected tests used their ordinary listeners/fixtures. Publish was dry-run only; its
identified temporary workspace was absent afterwards (`final-state.json`).
