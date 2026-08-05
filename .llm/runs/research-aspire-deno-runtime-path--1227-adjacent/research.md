# Research — can the Deno-runtime path remove our NuGet dependency?

Date: 2026-08-05\
Baseline: NetScript `00f96af76e5825422e8bc716a9c27d4c13e16f7f`; Aspire CLI/SDK `13.4.6`\
Scope: evidence only; no scaffold-output change

## Verdict

**Upgrade the Aspire CLI for #1227; do not make Deno adoption part of that fix.** The root cause is
the Aspire CLI lifecycle defect fixed by
[microsoft/aspire#18958](https://github.com/microsoft/aspire/pull/18958), not the size or Deno shape
of NetScript's resource graph. That PR stopped leaking orphaned Aspire-managed NuGet search helper
processes and merged on 2026-08-03 for milestone 13.5. NetScript
[#1308](https://github.com/rickylabs/netscript/pull/1308) corroborated that diagnosis and proved
compatibility by running the unchanged 13.4.6 SDK graph through the fixed daily CLI: exit 0 in 13.06
seconds, with no new helper leaked. Its required five consecutive published-canary runs remain the
reliability completion gate; one green restore alone cannot prove an intermittent failure absent.
This supersedes the original premise that a Deno runtime path might cure #1227.

As an architectural question, Deno hosting still does not reduce the NuGet-shaped integration probe
used by `aspire restore`. On Aspire 13.4.6, even a TypeScript AppHost with no configured integration
packages restores a 75-library NuGet graph. Adding the stable CommunityToolkit Deno integration
makes that 76. Adding it to today's representative NetScript PostgreSQL + Redis + Browsers graph
makes 83 become 84. The first-party implementation in
[microsoft/aspire#18628](https://github.com/microsoft/aspire/pull/18628) is housed in the existing
`Aspire.Hosting.JavaScript` **NuGet package**. The current 13.4.6 assembly is an 84-library proxy
for that package identity, not a prediction of the unreleased 13.5 transitive count; either way, it
adds a direct integration package rather than producing a zero-NuGet shape.

The stale source comment is wrong in a second, independent way: external `[AspireExport]` works in
13.4.6. `CommunityToolkit.Aspire.Hosting.Deno@13.4.0` generated `addDenoApp(...)` in
`.aspire/modules/aspire.mts`, and a real resource reached Aspire's `up (running)` state. The Toolkit
is viable now, but adopting it would slightly **increase** the restore surface implicated by #1227.

The recommendation is therefore:

- For **#1227 / restore reliability**: take the CLI containing #18958. Do not wait for either Deno
  PR, add retries around the leak, or present a Deno migration as its mitigation.
- For a **better first-party Deno resource model**: reconsider after both
  [#18627](https://github.com/microsoft/aspire/pull/18627) and
  [#18628](https://github.com/microsoft/aspire/pull/18628) merge, a stable 13.5 package/CLI pair is
  published, and a fresh TypeScript fixture proves `addDenoApp` plus the Deno AppHost resolver. That
  is a feature-quality decision, not a NuGet-elimination decision.
- For **release coordination**: prefer one 13.5 upgrade if all three changes ship together, but do
  not hold the #1227 CLI fix if either Deno PR misses the release cut.

## 1. External `[AspireExport]` works in 13.4.6

This was tested rather than inferred. A cold TypeScript AppHost fixture declared only:

```json
{
  "appHost": { "path": "apphost.mts", "language": "typescript" },
  "sdk": { "version": "13.4.6" },
  "packages": { "CommunityToolkit.Aspire.Hosting.Deno": "13.4.0" }
}
```

`aspire restore` exited 0. The generated `.aspire/modules/aspire.mts` contained all of `addDenoApp`,
`addDenoTask`, and `withDenoPackageInstallation`; its RPC handle was
`CommunityToolkit.Aspire.Hosting.Deno/addDenoApp`. The fixture then called:

```ts
await builder.addDenoApp('deno-app', 'main.ts', {
  workingDirectory: '.',
  permissionFlags: ['--allow-net', '--allow-env'],
});
```

With Deno 2.9.3, `aspire run --isolated` started successfully and `aspire wait deno-app --status up`
reported the resource up in 0.1 seconds. The AppHost was stopped cleanly with Ctrl+C.

That falsifies the local comment's categorical claim that external NuGet exports are skipped. The
two historical links do not support that claim either:

- [#15119](https://github.com/microsoft/aspire/issues/15119) concerns the error produced when an
  integration **does not support** `AspireExport`; it remains an open backlog diagnostic issue.
- [#16220](https://github.com/microsoft/aspire/issues/16220) is a broader future design for
  cross-language integration hosts. It is not a prerequisite for today's in-process external NuGet
  export, as the executed fixture demonstrates.

The current comment should eventually be corrected, but this research slice deliberately does not
change scaffold output.

## 2. CommunityToolkit Deno is viable now, but it is not first-party

The current stable package is
[`CommunityToolkit.Aspire.Hosting.Deno@13.4.0`](https://www.nuget.org/packages/CommunityToolkit.Aspire.Hosting.Deno/13.4.0),
published 2026-06-02; NuGet also lists a newer `13.4.1-beta.686` prerelease. Stable 13.4.0 targets
.NET 8/9/10 and depends on `Aspire.Hosting >= 13.4.0`. It worked against the pinned 13.4.6 SDK in
the executed generation and runtime test above.

Its support boundary remains the Aspire Community Toolkit rather than the first-party Aspire release
surface. Microsoft's integration overview explicitly distinguishes packages from official Aspire
releases from community contributions through the Community Toolkit
([integration overview](https://learn.microsoft.com/dotnet/aspire/fundamentals/integrations-overview)).
Microsoft engineers and the .NET Foundation participate in the Toolkit, but that does not turn the
package into `Aspire.Hosting.*` or remove its additional package reference.

By contrast, #18628 implements `DenoAppResource`, `AddDenoApp`, the `WithDeno*` surface, container
publishing, native OpenTelemetry, and debugger support **inside the first-party
`Aspire.Hosting.JavaScript` assembly**. Its own TypeScript playground config explicitly lists:

```json
"packages": {
  "Aspire.Hosting.JavaScript": "",
  "Aspire.Hosting.Docker": ""
}
```

That resolves the ownership/support distinction in favor of first-party Aspire, but it also proves
that “first-party” does not mean “built into the CLI with no NuGet.” The currently published
[`Aspire.Hosting.JavaScript@13.4.6`](https://www.nuget.org/packages/Aspire.Hosting.JavaScript/13.4.6)
is a NuGet package depending on `Aspire.Hosting`; #18628 adds Deno APIs to that same assembly.

## 3. The load-bearing restore measurement

Each fixture used Aspire 13.4.6 and a distinct empty `NUGET_PACKAGES` plus `NUGET_HTTP_CACHE_PATH`.
Counts below are unique entries in the generated NuGet `project.assets.json`; “direct” is the
generated probe project's dependency set. The displayed cold-cache sizes are approximate filesystem
allocation and are included only to show scale, not as a stable package-size contract.

| AppHost configuration                                           | Direct dependencies | Resolved libraries | Cold cache |
| --------------------------------------------------------------- | ------------------: | -----------------: | ---------: |
| no `sdk` and no `packages` keys                                 |                   2 |                 75 |   ~419 MiB |
| SDK 13.4.6, no integration packages                             |                   2 |                 75 |   ~419 MiB |
| core + CommunityToolkit Deno 13.4.0                             |                   3 |                 76 |   ~419 MiB |
| core + `Aspire.Hosting.JavaScript` 13.4.6                       |                   3 |                 76 |   ~419 MiB |
| current representative NetScript: Browsers + PostgreSQL + Redis |                   5 |                 83 |   ~464 MiB |
| current representative + CommunityToolkit Deno                  |                   6 |                 84 |   ~465 MiB |
| current representative + JavaScript 13.4.6 proxy for #18628     |                   6 |                 84 |   ~465 MiB |

The unavoidable two direct dependencies in both “empty” variants were:

```text
Aspire.Hosting@13.4.6
Aspire.Hosting.CodeGeneration.TypeScript@13.4.6
```

The representative NetScript configuration adds `Aspire.Hosting.Browsers`,
`Aspire.Hosting.PostgreSQL`, and `Aspire.Hosting.Redis`; their transitive graph accounts for the
increase from 75 to 83. Both Deno integration choices add exactly one resolved library because their
`Aspire.Hosting` dependency is already present.

Consequently:

- CommunityToolkit Deno increases today's measured surface from 83 to 84.
- The current `Aspire.Hosting.JavaScript@13.4.6` proxy increases it from 83 to 84. #18628 therefore
  adds one direct integration package, but the exact 13.5 transitive total must be remeasured after
  release.
- Neither changes the mandatory 75-library TypeScript SDK/code-generation floor.
- Replacing `addExecutable('deno', ...)` with either `addDenoApp(...)` therefore increases rather
  than reduces the measured NuGet graph. That is not the cause of #1227, but it is marginally more
  exposure to feed, cache, and CLI restore defects than the current primitive.

### Why #18627 does not change this graph

[#18627](https://github.com/microsoft/aspire/pull/18627) adds Deno detection and commands to the
**TypeScript AppHost toolchain resolver**: recognize `deno.lock`, `deno.json`, and `deno.jsonc`,
then use `deno install`, `deno check`, `deno run -A`, watch mode, and Deno tasks to initialize,
validate, and execute the AppHost. It is explicitly independent of `AddDenoApp`.

That changes the JavaScript/TypeScript guest runtime which executes `apphost.mts`. It does not
replace the managed integration probe that restores `Aspire.Hosting`,
`Aspire.Hosting.CodeGeneration.TypeScript`, or configured `Aspire.Hosting.*` packages before SDK
generation. In other words, it can remove the AppHost's Node/npm toolchain dependency; it does not
remove its NuGet dependency.

## 4. There is no supported zero-NuGet TypeScript AppHost configuration

Omitting both `sdk` and `packages` from `aspire.config.json` still restored the same 75 libraries.
Omitting only PostgreSQL/Redis/container integrations shrinks the graph, but does not eliminate the
managed host and TypeScript code generator. The current NetScript generator also always emits
`Aspire.Hosting.Browsers`, so today's generated “Deno-only” project does not reach even the manual
75-library minimum without changing scaffold behavior.

The only literal zero-NuGet alternatives are to stop using the supported Aspire TypeScript AppHost
pipeline—for example, run Deno directly without Aspire, or attempt to check in generated SDK output
and bypass restore as an unsupported cache. Those alternatives lose or put outside the supported
lifecycle:

- the generated, version-matched polyglot SDK and integration APIs;
- Aspire's resource model, DCP lifecycle/orchestration, dashboard, logs, traces, and health state;
- resource references, service discovery, endpoint/environment injection, and `WaitFor` ordering;
- supported local/container publish projections and future SDK compatibility.

A C# AppHost is not an escape hatch: it consumes the same hosting integrations through ordinary
NuGet PackageReferences. For a Deno-only graph, the useful optimization boundary is therefore
**fewer optional integrations**, not zero NuGet.

## 5. What Aspire 13.5 can deliver as one upgrade

Three independent changes line up on the 13.5 milestone:

| Change                                                   | Layer                                   | Current state         | Effect for NetScript                                                                              |
| -------------------------------------------------------- | --------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------- |
| [#18958](https://github.com/microsoft/aspire/pull/18958) | Aspire CLI NuGet helper lifecycle       | merged 2026-08-03     | fixes the diagnosed #1227 failure mechanism                                                       |
| [#18627](https://github.com/microsoft/aspire/pull/18627) | TypeScript AppHost toolchain resolver   | open; review required | lets a Deno workspace initialize, validate, and run its AppHost through Deno rather than Node/npm |
| [#18628](https://github.com/microsoft/aspire/pull/18628) | first-party `Aspire.Hosting.JavaScript` | open; review required | supplies `AddDenoApp` / `DenoAppResource` and their polyglot projection                           |

If both open PRs merge before the stable cut, a matching stable 13.5 CLI, SDK, and
`Aspire.Hosting.JavaScript` package is the cleanest single upgrade moment: it removes the helper
leak, makes Deno a supported AppHost toolchain, and makes the Deno workload resource first-party in
one compatibility-tested version family. This is coordination value, **not** NuGet elimination; the
first-party resource still adds `Aspire.Hosting.JavaScript` to restore.

Only the CLI fix is presently assured by merged code. If either Deno PR misses the cut, NetScript
should upgrade to stable 13.5 for #18958 immediately, keep the generated
`builder.addExecutable('deno', ...)` path, and adopt the Deno features in a later release. There is
no reason to couple a p0 reliability fix to two unapproved feature PRs.

The detailed state of the two Deno PRs follows.

### #18627 — Deno as the TypeScript AppHost runtime

The PR supplies the Deno toolchain resolver described above. At the 2026-08-05 snapshot it is open,
requires review, has no approval, and has three unresolved but outdated review threads: watch-mode
wording, explicit `deno.jsonc` coverage, and a tracking fix. It is the implementation for
[#16218](https://github.com/microsoft/aspire/issues/16218), not the historical #16220.

### #18628 — first-party Deno workload hosting

The PR supplies the first-party `AddDenoApp` / `DenoAppResource` API in `Aspire.Hosting.JavaScript`,
including polyglot projection, permissions/tasks/serve/inspect configuration, generated container
support, Deno native OTLP, and VS Code debugger integration. The implementation is marked
experimental as `ASPIREDENO001`.

The original serve→task indefinite-start blocker was fixed and its requesting review was dismissed.
The current blocker is broader release quality plus required approval: as of the snapshot, the PR is
open, has no approval, is not mergeable under branch policy, has 186 timeline/review items, and has
six unresolved current threads. Five are substantive maintainer requests:

1. exercise `addDenoApp` and `withDeno*` through TypeScript, Java, Python, and Go AppHosts rather
   than only asserting scanner output
   ([thread](https://github.com/microsoft/aspire/pull/18628#discussion_r3693903850));
2. preserve Deno's required OTLP HTTP/protobuf protocol in Kubernetes publishing
   ([thread](https://github.com/microsoft/aspire/pull/18628#discussion_r3693903853));
3. align the package-script Docker stage with generic package-manager initialization/caching
   ([thread](https://github.com/microsoft/aspire/pull/18628#discussion_r3693903856));
4. do not enable native OTLP when a dashboard-disabled publish target injects no endpoint
   ([thread](https://github.com/microsoft/aspire/pull/18628#discussion_r3693903858)); and
5. reorganize the README so Deno is documented consistently with Node/Bun
   ([thread](https://github.com/microsoft/aspire/pull/18628#discussion_r3693903847)).

The sixth unresolved thread is NetScript's own Deno-version recommendation. A subsequent exact-head
review also reports deploy telemetry gaps, invalid raw task arguments under Deno 2.9, missing
`#pragma warning disable ASPIREDENO001` in the new debugger E2E AppHost, cache permission mismatch,
and endpoint callback ownership. Its real run/publish probes passed, but the exact-head workflow was
still `startup_failure`
([review summary](https://github.com/microsoft/aspire/pull/18628#pullrequestreview-4830968663)).

### Can NetScript help unblock it?

Yes, but the useful contribution is targeted upstream validation/fixes, not another broad review.
The shortest high-confidence contribution is:

1. reproduce the current-head debugger E2E compiler failure;
2. add `#pragma warning disable ASPIREDENO001` to its generated C# AppHost (or the maintainer-chosen
   equivalent), run that exact workflow to green, and attach the artifact;
3. add one real TypeScript polyglot call-site fixture covering `addDenoApp` and representative
   `withDeno*` projection, then extend the established fixture shape to Java/Python/Go if requested.

The next most valuable contribution is a focused Kubernetes publish test/fix proving
`OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf` and the HTTP endpoint for a Deno resource. That is more
load-bearing than stylistic review because silent deployed telemetry loss is a current maintainer
blocker. A small cleanup to #18627's `deno.jsonc`/watch tests could accelerate that PR, but #18628
is the gating capability for first-party `addDenoApp`.

This slice does not push changes upstream; doing so is a separate contribution with separate
authority and validation.

### Timeline read

Aspire's [13.5 milestone](https://github.com/microsoft/aspire/milestone/45) was 787 closed / 71 open
(91.72% closed), updated 2026-08-05, and had **no due date** at the snapshot. Recent stable package
history shows 13.3.0 on 2026-05-07 and 13.4.0 on 2026-06-01
([Aspire.Hosting version history](https://www.nuget.org/packages/Aspire.Hosting/13.4.6)). That
cadence and 91% completion say “near a release boundary,” but the absence of a due date and the two
unapproved PRs make a calendar promise unjustified. #18628 still has correctness work affecting
polyglot projection, containers, and telemetry, not merely merge queue latency.

**Planning read:** 13.5 is plausibly weeks rather than quarters away if maintainers resolve these
reviews promptly, but it is not safe to schedule NetScript's p0 on that inference. Watch state, not
a guessed date.

## Exact upstream signal to watch

Do not use milestone percentage alone. The actionable signal is all of:

1. #18958 appears in the stable 13.5 CLI/release provenance, not only a daily build;
2. #18627 is merged;
3. #18628 is merged with the real polyglot call-site and OTLP publish concerns resolved;
4. stable (not preview) matching Aspire CLI, SDK, and `Aspire.Hosting.JavaScript` 13.5 versions are
   published; and
5. a cold TypeScript+Deno fixture on those exact versions leaks no helper across repeated restores,
   selects the Deno resolver, generates and runs `addDenoApp`, and records the NuGet graph.

When all five fire, use one coordinated 13.5 upgrade. If only the first fires before the stable cut,
upgrade for #1227 anyway and keep Deno hosting unchanged. The exact signal for NuGet elimination
would instead be a released TypeScript AppHost path whose empty fixture no longer restores
`Aspire.Hosting` and `Aspire.Hosting.CodeGeneration.TypeScript`; neither Deno PR claims or
implements that.

## Recommendation on a 0.0.6 epic

**Do not create a 0.0.6 epic for “Deno removes NuGet.”** The premise is disproved. #1227 belongs to
the CLI upgrade carrying #18958, already being implemented by #1308. Track #18627 and #18628 with a
small conditional dependency-watch item unless product scope expands to adopting and validating
first-party Deno resource semantics, telemetry, debugging, and publishing. That broader feature
could justify an epic, but not as restore remediation.

Architectural restore reduction remains possible only by omitting optional integrations where
product semantics permit it: the representative graph falls from 83 to the 75-library core floor (or
76 with the generator's always-present Browsers package). Adopting either Deno hosting package moves
in the opposite direction by one library. The durable reliability action is therefore the fixed CLI;
package trimming is a secondary exposure reduction, not a cure.

## Reproduction record

Environment: Linux/WSL2; Aspire CLI `13.4.6+87fe259e...`; Deno `2.9.3`; .NET SDK `10.0.110`. Scratch
fixtures and caches were kept under ignored `.llm/tmp/aspire-deno-nuget-research/` and are not part
of the PR. Each restore used fresh fixture-specific `NUGET_PACKAGES` and `NUGET_HTTP_CACHE_PATH`;
resolved counts came from `.libraries` in the generated `project.assets.json`.

Representative commands:

```bash
NUGET_PACKAGES="$fresh_packages" NUGET_HTTP_CACHE_PATH="$fresh_http" aspire restore
jq '.libraries | length' .aspire/integrations/package-restore/*/obj/project.assets.json
jq '.project.frameworks | to_entries[0].value.dependencies | keys' \
  .aspire/integrations/package-restore/*/obj/project.assets.json
aspire run --isolated --non-interactive --apphost apphost.mts
aspire wait deno-app --status up --timeout 30 --apphost apphost.mts
```

The pre-existing worktree `deno.lock` modification was neither inspected as research evidence nor
included in this changeset.
