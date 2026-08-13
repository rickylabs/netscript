# Research — legacy-port-pin-sweep

## Live issue snapshot

- API fetch time: `2026-08-13T20:23:46.556Z`.
- Issue: [#1243](https://github.com/rickylabs/netscript/issues/1243), open.
- GitHub state at fetch: title `auth: session list --stream-url default pins localhost:4437 which
  no longer exists post-#1211`; labels `type:fix`, `area:auth`, `status:triage`, `priority:p3`;
  `updated_at=2026-08-11T20:40:01Z`; milestone id `27`.
- The sole issue comment says the live issue was moved to `0.0.6`. The approved release-cluster
  contract assigns this leaf/PR to `0.0.7`; only the coordinator may reconcile central milestone
  state. This leaf will set the PR milestone requested by the cluster and will not mutate the issue.
- The issue has no close-gated acceptance checkboxes. Its stated acceptance is: resolve the actual
  assigned streams endpoint through the existing discovery seam, or at minimum fail with a message
  identifying the legacy default and explaining how to find/provide the real URL; sweep the two
  dead manifest values and the official-copy test fixture.

## Immutable baseline and symptom reproduction

- Branch and `origin/main` both resolve to
  `01e0960494c95ce56eb35892c211a095eb13e6ed`; the branch has no upstream.
- The current four declared surfaces contain six textual `4437` occurrences:
  - `auth-plugin-command.ts:87`: live CLI default
    `http://localhost:4437/auth/sessions` — reproduced defect.
  - `plugins/streams/scaffold.plugin.json:54-55`: dead `servicePort` and `backgroundPort` pins.
  - `copy-official-plugin-test-support.ts:108-109`: fixture copies the same dead pins.
  - `skills.generated.ts:13`: embedded Aspire diagnostic prose recounting the historical 4437
    foreign-process reproduction. It is neither a runtime default nor a binding/config value and
    must remain truthful incident evidence.
- Wider-repository 4437 occurrences exist in streams runtime defaults, tests, README, consumer
  stubs, and E2E probes, but they are outside #1243's declared four-file boundary. This leaf does
  not claim those standalone/runtime defaults are assigned AppHost endpoints and does not edit them.

## Existing endpoint-discovery seam

- PR #1206 is commit `f710421e9` and introduced the established discovery implementation in
  `packages/mcp/src/infrastructure/service-endpoints/aspire-cli-endpoint-source.ts`, exposed through
  `ServiceEndpointDirectoryPort` and `AspireCliEndpointSource`.
- The seam shells out through its own injected command runner, identifies the exact AppHost, parses
  `aspire describe --format Json`, and returns resource endpoints. This is the correct existing seam;
  a second parser or direct `Deno.Command` inside the auth command would violate A6/A7 and AP-25.
- `createAuthPluginCommand` currently receives filesystem, project-root, session-HTTP, regeneration,
  and output dependencies. Its public/local composition roots are outside the approved file list.
  Importing `@netscript/mcp` and plumbing the directory through those roots would cross both the
  file boundary and package dependency surface.
- `appsettings.json` cannot provide the actual runtime URL after #1211: it describes resources but
  intentionally does not persist the AppHost-assigned host endpoint. Therefore a local config-only
  lookup would be false discovery.

## Doctrine and harness classification

- The approved leaf contract selects Archetype 5 (plugin) plus the service overlay. The touched
  CLI command is treated as the host consumer surface required by Archetype 5; the current doctrine
  verdict separately records `packages/cli` as Archetype 6 / Keep and `plugins/streams` as
  Archetype 5 / Keep.
- Relevant axioms: A1, A2, A6, A7, A9, A14. Relevant anti-patterns: AP-9, AP-11, AP-19, AP-25.
- No new abstraction, port, side-effect adapter, export, permission, package dependency, or debt is
  needed for the bounded fallback.

## JSR surface scan

- `@netscript/cli` and `@netscript/plugin-streams` remain publishable members. This slice changes a
  CLI option contract and manifest data only; it adds no public TypeScript export, import, slow type,
  import attribute, `import.meta` path read, self-referential package import, or dependency pin.
- Required evidence remains the structured check/test/lint/fmt reporters, CLI and streams doc/JSR
  audit as applicable, canonical publish dry-run, `quality:gate`, and `arch:check`.
- Publication is forbidden locally. `scaffold.runtime` is required but lease-gated.

## Remedy conclusion

The actual-discovery option is architecturally known but unavailable inside the immutable leaf
surface. The issue explicitly permits the remaining truthful contract: remove the legacy default,
require `--stream-url`, and make the option help/error state that no endpoint is inferred and that
the caller should obtain the streams URL from `aspire describe streams --format Json`. Removing the
manifest/fixture fields is mechanical because allocation already comes from `portRangeKey`.
