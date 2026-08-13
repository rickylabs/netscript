# Worklog — legacy-port-pin-sweep

## Design

- Public surface: `netscript plugin auth session list --stream-url <url>` changes from a silent
  legacy default to an explicit required input with Aspire discovery guidance. No exported symbol or
  entrypoint changes.
- Domain vocabulary: no new type is needed. The existing `streamUrl` option and
  `AuthSessionHttpPort` remain the contract.
- Ports: continue consuming `AuthSessionHttpPort`. The established endpoint discovery port is
  `ServiceEndpointDirectoryPort` in `@netscript/mcp`, but it cannot be wired without crossing the
  approved package/composition boundary; no parallel port will be invented.
- Constants: no new finite-domain constant. `4437` is deleted from live defaults/manifest fixtures;
  the generated skill's historical incident value remains prose evidence.
- Commit slices: (1) artifact/bootstrap + draft PR, (2) explicit URL contract + manifest/fixture pin
  removal, (3) publishability/gate evidence and handoff.
- Deferred scope: endpoint-directory injection, undeclared 4437 sites, all central coordination,
  publication, and expensive runtime execution without a lease.
- Contributor path: callers run `aspire describe streams --format Json`, select the advertised HTTP
  URL, append `/auth/sessions`, and pass it to `--stream-url`; a future convenience path must inject
  the existing MCP directory through CLI composition rather than parse Aspire output here.

## PLAN-EVAL

`PLAN-EVAL: N/A` — existing-seam research plus the immutable file boundary leaves only the issue's
explicit-URL/fail-loud fallback, so the implementation is locked and mechanical.

## Gate evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Focused structured test reporter (exploratory, pre-commit) | FAIL | exit 1; 10 passed, 8 failed, 5 unique failure groups. Two auth tests expose the required test rescope; manifest-shape failure proves current schema requires the filed pins; additional copy tests failed because the invalid streams manifest could no longer satisfy dependency discovery. |

No durable receipt was minted because the proposed source is not committed and the gate runner must
attest an immutable Git head. `scaffold.runtime`, Aspire, and Docker remain forbidden until the
coordinator-owned global expensive-gate lease is explicitly granted.

## Research evidence

- Live issue API snapshot captured at `2026-08-13T20:23:46.556Z` in `research.md`.
- Baseline: branch = `origin/main` = `01e0960494c95ce56eb35892c211a095eb13e6ed`.
- Reproduction and existing-seam findings are recorded in `research.md`.

## Blocker

The issue's manifest-removal assumption is stale against current main, and the explicit-URL behavior
requires an undeclared test file. The invalid manifest change was restored; the proposed auth diff
was intentionally left uncommitted for review.

On 2026-08-13 the supervising coordinator instruction clarified that the frozen leaf contract must
not be expanded or reinterpreted and that the topic orchestrator has no authority to approve either
previously proposed rescope. PR #1643 remains paused as a draft at `status:plan`. Only the release
coordinator can now decide whether to issue a replacement leaf contract that names the additional
test/schema/copy surfaces and remedy, or to disposition #1243 outside this leaf. Until that explicit
coordinator decision exists, this implementation session must not resume source work.

No further gates may run, no expensive-gate lease may be requested, and issue/milestone/PR phase
state must remain unchanged.

## Preserved proposed auth-command patch

The following exact uncommitted proposal is preserved for coordinator review. It was not committed
to the product surface and was removed from the working tree after capture:

```diff
diff --git a/packages/cli/src/public/features/plugins/auth/auth-plugin-command.ts b/packages/cli/src/public/features/plugins/auth/auth-plugin-command.ts
index 0938c8c47..2705c464b 100644
--- a/packages/cli/src/public/features/plugins/auth/auth-plugin-command.ts
+++ b/packages/cli/src/public/features/plugins/auth/auth-plugin-command.ts
@@ -83,10 +83,17 @@ export function createAuthPluginCommand(
 
   const session = new Command().name('session').description('Inspect or revoke auth sessions')
     .command('list', new Command()
-      .option('--stream-url <url:string>', 'Auth durable stream URL', {
-        default: 'http://localhost:4437/auth/sessions',
-      })
-      .action(async (options: { streamUrl: string }) => {
+      .option(
+        '--stream-url <url:string>',
+        'Auth durable stream URL (find the streams HTTP endpoint with `aspire describe streams --format Json`, then append `/auth/sessions`)',
+      )
+      .action(async (options: { streamUrl?: string }) => {
+        if (!options.streamUrl) {
+          throw new Error(
+            'The legacy localhost:4437 stream URL is no longer inferred. ' +
+              'Run `aspire describe streams --format Json`, append `/auth/sessions` to the streams HTTP endpoint, and pass it with `--stream-url`.',
+          );
+        }
         const active = (await dependencies.sessions.list(options.streamUrl))
           .filter((item) => item.state === 'active');
         print('Session\tUser\tProvider\tState\tExpires');
```
