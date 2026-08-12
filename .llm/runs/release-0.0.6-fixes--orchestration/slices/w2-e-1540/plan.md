# W2-E plan — interrupted publish/preflight tree safety (#1540)

## Phase and baseline

- **Phase:** Plan & Design only. PLAN-EVAL is required and is a hard stop before implementation.
- **Baseline:** `origin/main@3c9dc1f3907c605d2d30d76f5a20ade1e4754736`, re-verified in the slice
  worktree before this plan was written.
- **Surface:** release tooling under `.llm/tools/release/**`; no package or plugin public API
  changes.
- **Harness profile:** repository/release tooling, so no package/plugin doctrine archetype or scope
  overlay applies. The package/plugin `jsr-audit` Plan-Gate item is `N/A`: this plan does not change
  a package export, manifest contract, or publishable source surface.
- **Release boundary:** this change protects the existing publish pipeline. It does not cut or
  publish a release.

## Current behavior and exact write set

The stable and canary workflows each start a Deno wrapper process for preflight and publish:

- Stable preflight and publish are `.github/workflows/publish.yml:96-97` and
  `.github/workflows/publish.yml:110-112`. The job itself can be terminated by its 30-minute timeout
  at `.github/workflows/publish.yml:23-26`.
- Canary preflight and publish are `.github/workflows/release-canary.yml:121-126`. That job has a
  120-minute timeout at `.github/workflows/release-canary.yml:28-31`.
- `.llm/tools/release/run-publish.ts:77-80` maps `--preflight` to
  `publishWorkspace({ mode: "preflight" })` and the default invocation to mode `publish`.
- `.llm/tools/release/publish-workspace.ts:50-63` isolates only `dry-run`; both real modes pass the
  source checkout root to `publishWorkspaceInPlace`.

Inside that source root, `.llm/tools/release/publish-workspace.ts:87-99` reads the root catalog,
discovers publishable members, snapshots each member manifest, expands npm `catalog:` entries, and
writes the whole JSON document back. The publisher then runs from the same root at
`.llm/tools/release/publish-workspace.ts:119-131`. Preflight uses the same materialized root and the
real `deno publish` graph path with an invalid token at
`.llm/tools/release/publish-workspace.ts:121-123,162-172`. Restoration is the `finally` loop at
`.llm/tools/release/publish-workspace.ts:138-141`.

Discovery is not limited to manifests that contain `catalog:`. It walks publishable immediate
children of `packages/` and `plugins/` (`.llm/tools/release/publish-workspace.ts:261-278`) and
accepts members with a string `name` whose `publish` is not `false`
(`.llm/tools/release/publish-workspace.ts:359-376`). Therefore **both real modes attempt writes to
all 35 paths below**, in this sorted order:

```text
packages/ai/deno.json
packages/aspire/deno.json
packages/auth-better-auth/deno.json
packages/auth-kv-oauth/deno.json
packages/auth-workos/deno.json
packages/cli/deno.json
packages/config/deno.json
packages/contracts/deno.json
packages/cron/deno.json
packages/database/deno.json
packages/fresh/deno.json
packages/fresh-ui/deno.json
packages/kv/deno.json
packages/logger/deno.json
packages/mcp/deno.json
packages/plugin/deno.json
packages/plugin-ai-core/deno.json
packages/plugin-auth-core/deno.json
packages/plugin-sagas-core/deno.json
packages/plugin-streams-core/deno.json
packages/plugin-triggers-core/deno.json
packages/plugin-workers-core/deno.json
packages/prisma-adapter-mysql/deno.json
packages/queue/deno.json
packages/runtime-config/deno.json
packages/sdk/deno.json
packages/service/deno.json
packages/telemetry/deno.json
packages/watchers/deno.json
plugins/ai/deno.json
plugins/auth/deno.json
plugins/sagas/deno.json
plugins/streams/deno.json
plugins/triggers/deno.json
plugins/workers/deno.json
```

Eighteen of those manifests currently contain `catalog:` and receive meaningful npm-specifier
expansion:

```text
packages/aspire/deno.json
packages/cli/deno.json
packages/config/deno.json
packages/contracts/deno.json
packages/fresh/deno.json
packages/plugin/deno.json
packages/plugin-ai-core/deno.json
packages/plugin-auth-core/deno.json
packages/plugin-sagas-core/deno.json
packages/plugin-triggers-core/deno.json
packages/plugin-workers-core/deno.json
packages/queue/deno.json
packages/service/deno.json
plugins/auth/deno.json
plugins/sagas/deno.json
plugins/streams/deno.json
plugins/triggers/deno.json
plugins/workers/deno.json
```

`packages/bench/deno.json` also contains `catalog:` but is not publishable and is not written. The
replacement at `.llm/tools/release/publish-workspace.ts:333-356` is specifically `"catalog:"` to
`"npm:<specifier>@<root-catalog-version>"`; this is consistent with the Deno 2.9 constraint that
`catalog:` is npm-only.

The root `deno.json` is read but not written (`.llm/tools/release/publish-workspace.ts:323-330`).
This materializer does not write `deno.lock`. The invariant for the change is stronger than those
implementation facts: the source checkout's tracked files, including `deno.lock`, must remain
byte-identical through normal completion and every interruption point.

## Interruption analysis

There are two relevant Deno processes: the outer `deno run .../run-publish.ts` wrapper, and the
inner `deno publish` child created by `.llm/tools/release/publish-workspace.ts:200-209`. A workflow
timeout or cancellation can also terminate their shell/process group or remove the runner entirely.

| Interruption point today                                                            | Interrupted process                    | Source-tree result today                                                                                                                            |
| ----------------------------------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Before the first member write                                                       | outer wrapper                          | Clean; no snapshot has been materialized yet.                                                                                                       |
| During the sorted materialization loop                                              | outer wrapper / process group          | A prefix of the 35 manifests has been rewritten; any reached `catalog:` consumers remain expanded.                                                  |
| After materialization while `deno publish` builds/checks/uploads                    | outer wrapper / process group / runner | All 35 writes have occurred and all 18 current `catalog:` consumers remain expanded. The child may also be terminated.                              |
| During the restore loop                                                             | outer wrapper / process group / runner | A prefix of snapshots is restored and the remainder stays expanded, producing a mixed tree.                                                         |
| Only the inner `deno publish` child is interrupted while the outer wrapper survives | child only                             | `command.output()` returns a failing result; the wrapper throws and its `finally` normally restores every snapshot. This is not the dangerous case. |
| After restore completes                                                             | either process                         | Clean with respect to this defect.                                                                                                                  |

The current wrapper registers no signal listeners. Under its default signal behavior, `SIGINT` or
`SIGTERM` delivered to the outer wrapper terminates it rather than converting the signal into an
awaited JavaScript exception, so the asynchronous `finally` restore is not a reliable cleanup path.
They are catchable in principle, but adding handlers would introduce ordering and second-signal
races and would still not cover hard termination. **`SIGKILL` is untrappable**; Deno explicitly does
not allow it to be registered with `Deno.addSignalListener`. A runner eviction or host loss is at
least as abrupt: no process-local `finally`, shutdown hook, or signal handler can be assumed to run.

## Locked mechanism: publish from an isolated Git worktree

The source checkout will become read-only input to both real `publishWorkspace` modes. Dry-run keeps
the already-shipped throwaway-copy behavior from #1417; it is not redesigned here.

1. Ask Git to create a temporary detached worktree at the source worktree's exact `HEAD`. Unlike the
   dry-run copy, this stage remains an actual worktree of the same repository, remote, and commit.
2. Discover members and materialize npm catalog entries **only in that detached worktree**.
3. Invoke the unchanged command request from that root: `deno publish --allow-dirty` for real
   publish, and the existing `--no-provenance --token <invalid>` addition for preflight.
4. Remove the detached worktree on normal completion with `git worktree remove --force`, followed by
   a bounded metadata prune if needed. Do not snapshot or restore tracked source manifests; source
   safety must not depend on cleanup executing.
5. Before writing a staged member manifest, fail closed unless `lstat` shows a regular file. The
   current repository has zero symlinks, but this prevents the dormant absolute-symlink case noted
   by #1540 from turning a staging write into a write through to the source tree. Other copied
   symlinks retain their existing behavior so package contents are not silently changed.

This is deliberately not a signal-handling design. If the outer process receives `SIGINT`,
`SIGTERM`, `SIGKILL`, or disappears with its runner, the source checkout was never the mutation
target. A forced termination can leave a temporary staging directory behind on a durable host; it
can also leave an administrative entry under the repository's worktree metadata, but it cannot leave
expanded tracked manifests in the source worktree. Normal completion removes both, and the
interruption test will remove the killed child's known worktree after making its assertions.

### Publisher location and published contents

For package-graph and payload purposes, the publisher requires materialized manifests in their
standard locations **relative to the workspace it publishes**: root `deno.json`, then
`packages/<member>/deno.json` and `plugins/<member>/deno.json`. Deno 2.9.5 describes `deno publish`
as publishing the current working directory's package or workspace; the implementation already
selects the publish root through the child command's `cwd`. The detached worktree preserves the
complete workspace layout and all relative paths, so workspace-member discovery and inter-member
rewrite behavior remain available.

What reaches Deno's publisher is therefore the same intended release identity and payload shape as
today: the exact committed tag/canary `HEAD` in a worktree of the same Git repository, with npm
catalog references materialized and inter-member imports left for Deno's existing workspace-to-JSR
rewrite. The bytes are read from the detached worktree, not from the source worktree. The real
command keeps provenance enabled (no `--no-provenance` is added), inherits the same GitHub
Actions/OIDC environment, and retains the same arguments; preflight alone continues to disable
provenance and stop at the invalid-token authentication boundary. Uncommitted source-worktree edits
will no longer leak into a real mode; that is consistent with the repository rule that publication
is workflow-only from an immutable release/canary commit, while `--allow-dirty` remains necessary
for the intentional staged catalog edits.

No authenticated local test can prove registry-side provenance without violating the no-publication
rule. The plan instead preserves the Git repository, remote, commit, arguments, environment
inheritance, relative paths, and workflow entrypoints, and tests the exact child request and staged
inputs. The remaining absolute-path difference is explicit risk for PLAN-EVAL, not a claim that
local tests can certify registry behavior.

### Trade-offs and rejected alternatives

- **Cost:** preflight and publish each check out one detached worktree, increasing temporary disk
  and I/O and adding Git worktree administration. This uses Git's native staging primitive and is
  preferable to any interval where tracked source manifests are dirty.
- **Hard-kill residue:** a `SIGKILL` can orphan the temporary worktree and its Git administrative
  entry. The tracked source tree stays clean; Git can prune the entry later, and a GitHub-hosted
  runner is discarded. A general durable-host scavenger is safe to defer.
- **Provenance risk:** the detached worktree has a different absolute filesystem root, but retains
  the same Git repository, remote, commit, relative package paths, and GitHub/OIDC environment. The
  implementation must not add `--no-provenance` to real publish or change workflow triggers. The
  only authorized end-to-end registry proof remains the normal canary-first release channel after
  merge; this slice will not dispatch it.
- **Signal handlers rejected:** they could improve `SIGINT`/`SIGTERM` cleanup but cannot catch
  `SIGKILL`, runner eviction, or interruption during the cleanup itself, so they cannot meet the
  acceptance criterion.
- **In-place journals/atomic restore rejected:** they still require a surviving process to perform
  recovery, and an atomic rename per manifest would still expose a multi-file partial state.
- **Gate weakening rejected:** passing raw `catalog:` through to JSR is not an option. The staged
  publisher still receives the materialized npm specifiers and runs the same real graph checks.

## Executed interruption proof

The regression test will kill a subprocess at a deterministic handshake, not on a timing guess:

1. Build a minimal temporary Git repository containing root catalog configuration,
   `packages/service/deno.json` with `"zod": "catalog:"`, an empty `plugins/` directory, source
   entrypoints, and a seeded `deno.lock`; commit the baseline.
2. Spawn a dedicated Deno helper for each real mode (`publish` and `preflight`). It calls
   `publishWorkspace` with the fixture root and an injected command runner.
3. When the command runner is entered, materialization is complete. The helper writes an atomic
   readiness record outside the fixture containing the received `args`, `cwd`, and the staged
   service-manifest text, then waits indefinitely instead of invoking any real publisher.
4. The parent waits for that record with a bounded timeout, proving the kill point was reached, and
   sends **`SIGKILL` to the outer helper process**. No signal handler or `finally` can make this
   test pass.
5. After the helper exits, execute and assert `git status --porcelain` in the fixture, assert
   `packages/service/deno.json` still contains `"zod": "catalog:"`, and compare `deno.lock`
   byte-for-byte with its committed baseline. Also assert that the helper saw materialized
   `npm:zod@...` in a detached-worktree `cwd` outside the fixture and that the mode-specific
   publisher arguments are unchanged.

The new regression check will first be run against the unmodified baseline. Its expected red result
is a modified `packages/service/deno.json` after the hard kill (for both real modes). That
untruncated failure is the negative control. After the staging change, the identical command must
pass for both modes with empty porcelain output, the catalog sentinel intact, and no lockfile
change. Temporary fixture and detached-worktree cleanup belongs to the surviving parent test process
so the negative-control run does not dirty this worktree or leave test worktree metadata behind.

The focused test belongs in `.llm/tools/release/publish-workspace_test.ts`; the subprocess helper
belongs under `.llm/tools/release/tests/fixtures/`. No production-only delay or test hook will be
added to the publisher.

## Design checkpoint

- **Public surface:** no new end-user command, option, package export, or workflow input. The
  existing internal `publishWorkspace({ mode, root?, commandRunner? })` entrypoint and mode-specific
  `PublishCommandRequest` contract remain the release-tool seam.
- **Domain vocabulary:** source worktree (immutable input), detached publish worktree (mutable
  stage), publish mode (`dry-run | preflight | publish`), publisher child request, readiness record,
  and source-tree invariant. No speculative domain type is needed beyond a small internal worktree
  lifecycle result if cleanup needs the stage path.
- **Ports:** `PublishCommandRunner` remains the publisher seam. Git worktree creation/removal will
  use `Deno.Command("git", ...)`; if unit isolation beyond the executed Git fixture is needed, add a
  narrow Git command runner rather than a general process abstraction.
- **Constants:** retain the existing dry-run temp prefix; add one release-tool-owned prefix for
  detached publish worktree parents. Mode-specific publisher arguments remain derived from the
  existing `PublishMode`, not duplicated constants.
- **Contributor path:** a maintainer follows `run-publish.ts` into `publishWorkspace`, then the
  detached-worktree lifecycle, materialization, and `PublishCommandRunner`; the adjacent test and
  subprocess fixture demonstrate both the normal command contract and the hard-kill invariant.
- **Commit slices:** the ordered slices below are the complete implementation sequence.

## Commit slices

1. **S1 — prove hard-kill isolation for both real modes.** Add the subprocess fixture and
   interruption regression, record the red-before run, then change `publish-workspace.ts` so both
   real modes operate in detached worktrees and staged manifests fail closed on symlinks. Proving
   gate: focused `publish-workspace_test.ts`, red before and green after. Files:
   `.llm/tools/release/publish-workspace.ts`, `.llm/tools/release/publish-workspace_test.ts`, and
   one helper under `.llm/tools/release/tests/fixtures/`.
2. **S2 — record merge-readiness evidence without changing product behavior.** Run the full gate
   set, repeat the executed hard-kill proof, verify raw source-tree and lockfile state, scan the
   owned diff for forbidden suppressions/casts, and write `evidence.md`. Files: this slice's
   `evidence.md` and PR metadata only.

## Gate set

The implementation phase will record untruncated output for:

```text
rtk proxy deno task check
rtk proxy deno task test
rtk proxy deno task lint
rtk proxy deno task fmt:check
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/release --ext ts
rtk proxy deno task publish:dry-run
```

After `publish:dry-run`, a raw ground-truth `git status --porcelain` (and the requested RTK view)
must be empty. The owned diff will also be scanned for `deno-lint-ignore`, `as unknown as`, and
`@ts-ignore`. `quality:gate` is `N/A` unless implementation unexpectedly touches `packages/**` or
`plugins/**`; such a scope change requires rescoping before proceeding. `deno.lock` must have no
diff after every focused and full gate.

## Open-decision sweep and risks

All decisions that could force implementation rework are resolved in this plan:

- **Resolved now:** a detached Git worktree rather than signal handling or a provenance-blind copy;
  this makes source safety independent of process survival while retaining repository identity.
- **Resolved now:** the child publisher runs from the detached worktree with unchanged mode-specific
  arguments and inherited environment, so its materialized manifests are the inputs that are
  actually checked/published.
- **Resolved now:** staged member-manifest symlinks fail closed before any write-through.
- **Safe to defer:** scavenging an orphaned temporary worktree after `SIGKILL`; it is not a tracked
  source mutation and GitHub-hosted runners are ephemeral.

Primary risks are staging-path effects on provenance, worktree cost, incomplete fixture
synchronization, and a false-green interruption test. Their mitigations are, respectively: unchanged
real-publish provenance arguments/environment plus the same Git repository/commit and relative
layout; Git's native worktree primitive; a minimal contract fixture that asserts the exact catalog
and lock sentinels; and an atomic readiness handshake followed by untrappable `SIGKILL`, with an
executed red-before control.

No architecture debt is created. If implementation discovers that Deno's real publisher requires the
original absolute checkout root for OIDC provenance, that is a **must-rescope** finding: stop and
return to PLAN-EVAL rather than weakening provenance or falling back to signal-only cleanup.

## Deferred scope and debt

- A durable-host scavenger for orphaned temporary worktrees is deferred; normal cleanup and
  GitHub-hosted runner disposal are sufficient for this source-tree safety slice.
- Authenticated registry/provenance verification remains in the authorized canary-first release
  channel after merge. This slice cannot execute it without violating the publication prohibition.
- The existing dry-run copier and its package-member mode are unchanged except for shared helpers
  that prove necessary; a general staging/copy refactor is out of scope.
- Graceful `SIGINT`/`SIGTERM` messaging is deferred because it does not contribute to the hard-kill
  invariant and would add a second shutdown mechanism.
- Architecture debt: none. Any provenance requirement that invalidates detached worktrees is a
  rescope blocker, not debt to hide or accept in this PR.

## Explicit non-goals and prohibitions

- No local publication, `deno publish`, `release:publish`, canary dispatch, GitHub Release creation,
  tag push, or hand-run publish/preflight script.
- No change to what the publish gate checks: catalog materialization, the real preflight graph path,
  invalid-token auth boundary, whole-workspace publish, and registry completion checks remain.
- No signal-only claim of total coverage; `SIGKILL` is untrappable.
- No `deno.lock` commit, lock deletion, cache deletion, or `deno cache --reload`.
- No package/plugin source change, release workflow trigger change, publication, or merge in this
  slice.
- No implementation before a separate-session PLAN-EVAL records `PASS` and the orchestrator gives an
  explicit proceed instruction.
