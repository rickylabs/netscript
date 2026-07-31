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
