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
- Constants: no new finite-domain constant. `4437` is deleted only from the auth command's inferred
  runtime default; the manifest/copy values remain required compatibility metadata, and the
  generated skill occurrence remains historical prose evidence.
- Commit slices: (1) artifact/bootstrap + draft PR, (2) explicit URL contract + focused tests,
  (3) structured non-expensive gate evidence and review/evaluator handoff.
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
| Focused structured check reporter (authorized implementation, pre-commit) | PASS | 2 files selected; 1 batch; 0 diagnostics; `deno check --unstable-kv`. |
| Focused structured test reporter (authorized implementation, pre-commit) | PASS | 11 passed, 0 failed; explicit URL forwarding and omitted-URL no-adapter-call rejection covered. |
| Focused structured lint reporter (authorized implementation, pre-commit) | PASS | 2 files selected; 1 batch; 0 findings. A standalone workspace config is used because the root intentionally excludes `packages/cli`; it carries the root lint rules without that directory exclusion. |

No durable receipt has been minted yet because the gate runner must attest an immutable Git head.
`scaffold.runtime`, its lease request, Aspire, and Docker are explicitly forbidden for this turn.

## Research evidence

- Live issue API snapshot captured at `2026-08-13T20:23:46.556Z` in `research.md`.
- Live coordinator authorization captured at `2026-08-13T20:35:47.522Z` in `research.md`.
- Baseline: branch = `origin/main` = `01e0960494c95ce56eb35892c211a095eb13e6ed`.
- Reproduction and existing-seam findings are recorded in `research.md`.

## Blocker resolution

The live release-coordinator comments on issue #1243 (`5286074974`) and PR #1643 (`5286075209`) were
fetched at `2026-08-13T20:35:47.522Z`. They authorize only
`packages/cli/src/public/features/plugins/auth/auth-plugin-command_test.ts` beyond the original
contract, classify both manifest/copy `4437` values as required compatibility metadata, and reject a
schema/copy redesign. This resolves the test-surface blocker without reopening a material design
choice, so `PLAN-EVAL: N/A` remains truthful.

Implementation may resume only for the explicit `--stream-url` fail-loud path and focused tests,
followed by structured non-expensive receipts. `scaffold.runtime`, ready transition, merge,
publication, and central issue/milestone mutation remain forbidden.

## Preserved proposed auth-command patch

The following exact proposal was preserved through the pause and is now the coordinator-authorized
implementation shape. Its final committed form must remain semantically identical:

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
