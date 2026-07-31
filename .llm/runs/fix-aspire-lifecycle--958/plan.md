# Plan — fix-aspire-lifecycle (#958, #970)

Milestone `0.0.1-beta.12`. PR #986. Branch `fix/aspire-lifecycle`.

This slice plans because it changes what an existing configuration key **means** for a workspace
that is already generated, and because it touches the `aspire start` contract.

## 1. The shared cause

Two symptoms, one rule that was never written down:

> A NetScript workspace's generated AppHost assumes it is the only running instance of itself,
> and that every start is a warm start.

- **Instance identity does not exist.** `--isolated` re-allocates endpoints per start, but every
  generated resource identity — container name, container lifetime, data bind mount path — is
  derived from the workspace, not the instance. `ContainerLifetime.Persistent` is emitted
  unconditionally from `NetScript.Databases.<name>.Persistent`
  (`generate-register-infrastructure.ts:108`). A persistent container therefore spans two isolated
  instances, and the surviving container's port mapping belongs to whichever one started first.
  The second instance's Postgres never goes healthy. This is #970's first half.
- **Cold work is billed to the start budget.** First-run TypeScript AppHost validation runs
  *inside* the start window (~67s measured), so the 120s default is spent on work that is not
  starting anything, and the failure message does not name the phase that consumed it. This is
  #958.

The prisma-studio half of #970 is a **candidate third symptom of the same "generated graph is not
verified against the workspace" gap** — the tool block is seeded with `TaskName: 'db:studio'`
(`generate-appsettings.ts:203`) and turned into an executable by
`generate-register-tools.ts:38` with no check that the scaffolded workspace defines that task.
UNVERIFIED. Codex must confirm before asserting it, and if the real cause is different, say so.

## 2. Contract changes

Three, in dependency order.

**(a) Persistent lifetime becomes isolation-aware.** `Persistent: true` must stop meaning
"one container forever, globally". It means "reuse the container belonging to *this instance*".
Preferred resolution, in order:
1. Namespace the persistent container (and its data bind mount) by the isolation id so two
   isolated instances never contend. This preserves the user's stated intent in both modes.
2. If namespacing is not reachable in the generated SDK surface, isolated generation **overrides**
   persistent lifetime to session lifetime, and the generator emits a comment saying so, and the
   CLI says it once at start.
3. Rejecting the combination with a direct message is the floor, not the goal — it converts a
   silent hang into a clear error but leaves the user with no isolated+persistent path. Take it
   only if 1 and 2 are both genuinely blocked, and justify that in the PR body.

**(b) The start budget stops paying for first-run validation.** Either the validation is cached
during `aspire restore` so the first `start` is not also the first validation, or the start
timeout is scoped so validation time is not counted against it. Additionally, and independently of
which of those lands: the start output must name the current phase and elapsed time, so "still
validating" is distinguishable from "hung", and the timeout must be configurable. A bare bump of
120s to some larger number is NOT an acceptable fix on its own — it re-fails on a slower machine
and teaches nothing. If a default change is part of the fix, it rides along with the phase
reporting, not instead of it.

**(c) A generated tool resource that cannot run is a generation-time error, not a runtime
exit 1.** Validate at generation that the referenced task exists in the target workspace, and
surface the failed command's first stderr line in the resource state rather than only `Finished`.

## 3. Compatibility story for existing workspaces

The blast radius is workspaces already generated against beta.11 whose `appsettings` carries
`Persistent: true`.

- **Non-isolated starts must not change behaviour at all.** A user who never passes `--isolated`
  keeps exactly the container and data they have. This is the hard constraint: regenerating must
  not orphan a bind-mounted volume or silently point at a new container.
- **Isolated starts change behaviour by design** — that is the fix. The change must be visible:
  the user is told, once, at start, what happened to their persistent resource and why.
- **`appsettings` stays readable by the old generator where possible.** Prefer deriving isolation
  scoping at generation/start time over introducing a new required key. If a new key is
  unavoidable, it is optional with a default that reproduces today's non-isolated behaviour.
- No migration step may be required for a user who does not use isolation.

## 4. Required regression guard

At minimum, generator-level tests under `packages/cli/src/kernel/templates/aspire/` that assert:

1. `Persistent: true` + isolated generation does **not** produce a workspace-global persistent
   container — it produces whatever (a) resolves to, asserted concretely on the emitted AppHost
   source.
2. `Persistent: true` + non-isolated generation produces **byte-identical** output to today
   (the compatibility constraint above, pinned).
3. A tool block whose `TaskName` is absent from the workspace fails generation with a message
   naming the task — rather than emitting an executable that will exit 1.
4. Whatever lands for the start budget has a guard on the observable contract, not the number:
   the phase is reported, and the timeout is configurable. If the fix is "validation is cached at
   restore", guard that the second start does not redo it.

**Fails-before evidence is mandatory.** Break each fix, watch its guard fail, restore it, watch it
pass. Report that in the PR body. A guard that passes against the unfixed code is not a guard.

## 5. Out of scope

Process Manager work (moved to beta.13). Any change to non-isolated default behaviour beyond what
(b) and (c) require. Merging or undrafting this PR — the supervisor does that.

---

# PLAN-EVAL resolution (supervisor, 2026-07-31)

Codex re-derived the plan against `main@bd61d7ab3` and Aspire `13.4.6` and logged three drifts in
`drift.md`, correctly refusing to implement against disproven premises. **Two of my premises were
wrong and one was out of NetScript's ownership.** This section supersedes the conflicting parts of
sections 2–4 above. Everything not contradicted here still stands.

## Accepted corrections

1. **Timeout configurability already exists upstream.** `ASPIRE_CLI_START_TIMEOUT` (Aspire 13.4.6,
   `AppHostStartupTimeout.cs` / `CliConfigNames.cs`) already overrides the 120s detached-start
   budget. Section 2(b)'s "make the timeout configurable" is **withdrawn** — it is already done,
   by someone else.
2. **Phase/elapsed reporting is upstream-owned.** The detached launcher and its status output live
   in the Aspire CLI (`StartCommand.cs`, `AppHostLauncher.cs`), not in `@netscript/cli`. Section
   2(b)'s "the start output must name the current phase" is **withdrawn from this slice** — NetScript
   cannot implement it. It is upstream work, and #958 must be corrected to say so.
3. **The prisma-studio absent-task hypothesis is false.** `db:studio` IS generated into every
   database workspace (`generate-db-deno-json.ts`). Section 2(c)'s "validate at generation that the
   referenced task exists" is **withdrawn** — it would guard a defect that does not exist. Guard 3
   in section 4 is withdrawn with it.

## Decisions on the three open questions

**Q1 — persistent lifetime under randomized ports.** Proceed with the override. Codex's own
finding 7 is the confirmation, not the objection: persistent containers are keyed by *resource name
plus AppHost-path hash*. Two isolated starts of the same workspace share that key exactly, so they
resolve to one container whose published port belongs to whichever started first — which is the
reported symptom. Upstream supporting persistent+randomized ports in general does not make
*two concurrent isolated instances of one AppHost path* work.

- **Implement plan option (a)2:** when the AppHost sees `DcpPublisher__RandomizePorts=true`, a
  configured-persistent container resolves to session lifetime instead. Emit the conditional into
  the generated AppHost so the decision is visible in the source, with a comment naming the reason.
- **Do NOT namespace by isolation id.** The container key is derived from the resource name, and
  resource names are contract-bearing (connection-string keys, `withReference` targets). Renaming
  them per instance is too large a blast radius for a stabilisation release.
- **Non-isolated starts must be byte-identical to today.** This is unchanged and remains the hard
  compatibility constraint.

**Q2 — prisma-studio.** The absent-task theory is dead, so **reproduce before fixing**. Run the
generated `deno task db:studio` resource and capture the actual failure. Then:
- If a concrete cause is found, fix that cause and guard it.
- If it does not reproduce in the harness, **do not invent a cause.** Scope this half to the
  observability defect that is independently true and independently worth fixing: the resource
  reports only `Finished` with no reason. Surface the failed command's first stderr line in the
  resource state. Then say plainly, on #970 and in the PR body, that the exit-1 half was not
  reproduced and what was shipped instead.
- Do not convert Prisma Studio from an auto-started executable to an on-demand process command.
  That is a behaviour change, it is not what either issue asked for, and it is not a stabilisation
  change. Out of scope.

**Q3 — #958's deliverable.** Scope it to what NetScript actually owns:
- Ship a sane default for the already-supported `ASPIRE_CLI_START_TIMEOUT` in the generated
  workspace (env/config), so the first cold start of a NetScript-generated AppHost does not fail on
  a budget that was measured at ~67s of validation on an unloaded machine and is shared with
  everything else the start does.
- Make the generated workspace's own `aspire start` guidance say what that variable is and why it
  is set, so a user on a slower machine knows the knob exists.
- **Correct #958 on the issue**: state that timeout configurability already exists upstream, that
  phase/elapsed reporting is an upstream Aspire change NetScript cannot make, and that what shipped
  is the NetScript-side default plus guidance. The issue as filed asks NetScript for two things it
  does not own; that correction belongs on the issue, not buried in a PR body.

## Revised regression guards (supersedes section 4)

1. `Persistent: true` + isolated (`DcpPublisher__RandomizePorts=true`) does not yield a persistent
   container — asserted concretely on the emitted AppHost source.
2. `Persistent: true` + non-isolated emits output identical to today. Pin it.
3. *(withdrawn — the absent-task defect does not exist)*
4. The generated workspace carries the start-timeout default, asserted where it is emitted.
5. A tool resource that fails surfaces its first stderr line rather than only `Finished`.

Fails-before evidence remains mandatory for every guard that ships.

## Scope reduction is expected here

This slice is now smaller than filed, on purpose. Two of the four asks turned out to be upstream's
or nonexistent. Shipping the two that are real, and correcting both issues to say why the others
are not NetScript's, is the correct outcome — not a failure to deliver.
