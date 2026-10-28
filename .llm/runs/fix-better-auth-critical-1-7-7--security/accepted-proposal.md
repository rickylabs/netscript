# better-auth critical advisory — bounded upgrade footprint only

Recommend a separate security dependency leaf for GHSA-965c-763c-88jm, with five fixed owners.
No dependency/source/lock edit, install, audit rerun or new worktree has been performed here.
Root must select and initialize the exact isolated worktree before implementation. Do not append
this leaf to PR2422,2424 or2425, silently integrate another PR, or spend model credit.

The [maintainer advisory](https://github.com/better-auth/better-auth/security/advisories/GHSA-965c-763c-88jm)
names versions >=1.4.0-beta.18 and <1.7.7 as affected and1.7.7 as patched. Its account takeover
requires particular Magic Link/OAuth/storage configuration; this is not proof that every NetScript
deployment is exploitable. The required native audit still blocks the current1.6.20 lock.
[Release1.7.7](https://github.com/better-auth/better-auth/releases/tag/v1.7.7) exists from Sep30,2026.
Root's actual Deno2.9.7 info resolution proved the selected1.7.7 package and release components
resolve without graph errors; that result supersedes the stale advisory database's availability
wording. Bind root's exact native receipt and original failing CI audit in the new leaf.

## Exact fixed owners

| Owner | Current footprint | Intended change |
| --- | --- | --- |
| deno.json |287 physical lines; SHA b1ff8e07a20969535ae8bedafa869c8fc5a792afe0857d1be1fd71c785b90870|one catalog floor ^1.6.20→^1.7.7; no other config or package version change|
| plugins/auth/tests/services/better-auth-global-logout-http_test.ts |78 lines; SHA72a695a3061e3ce51231a9759aa547ea364dd68defd9cc3e5f046c609711b763|two native npm import floors, root and adapters/memory, to^1.7.7 only|
| plugins/auth/tests/services/unsupported-revocation-http_test.ts |184 lines; SHAe0210d9b1703482af56b05452681d46ab16d148c96a40aed41584a5443df3194|same two import floors only|
| deno.lock |4875 lines; SHA f53f7a5d017e002582b43b886003f64d19c0edbc137ebe74674c2e59df4a5d32|native lock-only refresh of selected better-auth release closure|
| packages/fresh-ui/deno.lock |4370 lines; SHA18693dfeb7be838b924e8b2803d55994b34bcde981ab617e0c72eb30129fcf40|native private-lock refresh in canonical UI context; same selected closure/workspace identity|

The three declaration/test owners should retain exact line counts and every test body/assertion;
there is no new runtime code, API, auth policy, bypass or mitigation feature. The caret spelling
preserves existing range policy and excludes all vulnerable releases. Proposed lock target is
the root-proven1.7.7, not an inferred latest release. If normal native resolution selects a newer
version, return its exact target/closure to root rather than silently broadening the selected update
or hand-editing a lock. Root may explicitly choose an exact catalog pin instead during scope review.

packages/auth-better-auth/package.json already says better-auth:catalog: and remains read-only;
its deno.json and production adapters also remain read-only. Both affected locks currently contain
the better-auth/core/adapter/telemetry1.6.20 release family. @better-auth/utils has its own0.4.2
version and must not be mechanically rewritten to1.7.7. Review actual native peer-qualified IDs,
integrities, dependency edges and changed transitive requirements. Do not refresh unrelated ranges,
delete locks/cache, use reload, introduce npm overrides or perform a runtime/toolchain migration.

## Maintained lock and age boundaries

Read-only proof/mandatory frozen checks include resources/examples/expo-streams/deno.lock
(640 lines, SHA3ae6c0fe813d94b743e3d3b853157d7c76f68e4f18b97c958a7d23c800d1b81e) and
packages/cli/e2e/fixtures/desktop-native/deno.lock (560 lines,
SHA adc126281992b69e3dbbe0a325b2e5bcb2775358ecfb6a82465fc5fcdb943e8a).
They record workspace metadata but contain no1.6.20 or better-auth npm graph today. Check them
in their existing canonical source contexts after the declaration change. They are not authorized
write owners initially: if a native frozen check proves a necessary change, return the exact delta
for root scope expansion before editing. Historical evidence locks stay byte-identical.

docs/site/deno.lock has no better-auth graph or auth workspace owner (505 lines,
SHA e03005b38fbb0ffdef75671067ad0c7b356ea8f04fef911c9926b16f5f21f057) and stays protected.
The existing root/reference/private-lock tooling is the authority; do not copy lock sections by hand.
Use native root lock-only install, the canonical Fresh UI lock:update flow, deps:check:reference-locks
and check-private-lock-workspace. Desktop refresh, if separately approved, must use the existing
deps:refresh:desktop-lock prepared scratch context, never a Windows app build/install.

No age bypass is proposed. Sep30→Oct28 is28 days. Preserve the existing runtime/registry age policy
and record actual native selection under it; the selected release already resolved for root.
Do not add minimum-dependency-age=0 globally, to the product graph or as an unexplained retry.
Newly selected transitive releases must meet that same policy. A policy refusal is retained and
returned to root, not bypassed through cache deletion, alternate accounts or a hidden pin.

## RED, tests and acceptance

1. Preserve the actual required CI audit-critical failure against1.6.20. In the selected new tree,
   reproduce the unchanged lock audit once with a native exit/JSON receipt before upgrades. This
   advisory/audit RED is the meaningful security control; do not invent a local exploit or alter
   tests to simulate an upstream fix.
2. After the three declaration changes and native lock-only refresh, require selected-key-free
   native graph evidence: exactly the chosen patched better-auth release family for production
   and direct test imports, no1.6.20 duplicate retained through the old test floors, no module
   errors, complete peer resolution. Preserve any native resolution failures and unrelated lock
   package/integrity deltas; root reviews the resulting closed footprint before checkpoint.
3. Run all packages/auth-better-auth/tests and the complete bounded plugins/auth/tests/services
   native fixture set through run-deno-test.ts, cached/frozen/check with ops/resources sanitizers
   and trace-leaks. Preserve cookie-cache global logout, unsupported revocation REST/namespaced/
   flat RPC, authorization/ownership/error/token/session assertions and existing test settings.
   No live providers, browser/CEF, app startup, database migration or authentication feature edits.
4. Run scoped types/lint/fmt for auth-better-auth and affected plugin service/test graph, actual
   nonempty counts. Run private-lock/reference/dependency checks, quality:scan and one composite
   arch outcome; old Windows DB-path failure remains independently owned if the chosen base has
   not adopted PR2425. Do not smuggle that fix into this five-owner leaf or call it waived.
5. Run native audit:critical and the deps:audit structured wrapper on the final selected graph.
   Require GHSA-965c-763c-88jm gone and no introduced critical advisory, with real native exit and
   current advisory output. No ignore/advisory suppression or conditional CI skip.
6. Validate auth-better-auth public docs/export and full workspace publication dry-run because
   catalog projection changes shipped dependency requirements. Check MCP corpus freshness; if
   upstream type serialization genuinely changes generated output, stop with the exact generated
   delta for root scope review. Do not append a generated owner silently. Verify all owned scratch
   removed on success/failure, no root package.json residue, and frozen PR2422/2424/2425 bytes.

Root selects the branch base explicitly. An independent main-based leaf keeps this five-owner
diff; a prerequisite stack must target the prerequisite branch and preserve that same diff.
No merge/rebase/cherry-pick/integration is inferred from source acceptance of another PR.

This is a straightforward dependency floor/lock repair, PLAN-EVAL N/A only if root selects that
fixed scope. Any required adapter/API change is a rescope before editing. Separate-family/session
independent IMPL remains mandatory under the actual selected matrix/expense authorization.
The upstream release notes say no schema migration, but shared verification stores/OAuth Proxy
participants require coordinated rollout and pending sign-ins may need restart; record that
operational note in review provenance without adding an unrequested product feature or deployment.
