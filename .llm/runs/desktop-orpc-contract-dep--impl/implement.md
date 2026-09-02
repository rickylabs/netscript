use harness

## SKILL

Read `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/netscript-deno-toolchain/SKILL.md`
(dependency work — use the `deps:` wrappers, never hand-rolled registry curls), and
`.agents/skills/netscript-pr/SKILL.md`.

You are the lane (Codex · OpenAI · GPT-5.6 Sol · medium) for **#1926**. Read it in full:
`gh issue view 1926 --repo rickylabs/netscript`.

Worktree `/home/agent/projects/netscript/worktrees/007-leaf-1926`, branch
`fix/desktop-fixture-orpc-contract-dep`, based on current `origin/main`.

This blocks Aspire S10 and every full-CI branch. It is a **release/canary gate**.

## Diagnosis — already established, do not re-derive

Exact runtime error from `desktop-native-linux`, install mode `isolated-root-dpkg`:

```
[desktop] Deno runtime error: Import "@orpc/contract" not a dependency and not in import map
from "file:///.../packages/sdk/src/internal/transport-policy.ts"
```

Reachability chain:

1. `packages/cli/e2e/fixtures/desktop-native/deno.json` maps SDK entry points by **relative path** —
   `"@netscript/sdk/desktop": "../../../../sdk/src/desktop/mod.ts"`. A relative path **bypasses
   `packages/sdk/deno.json`**, so the fixture's own import map is the resolution root.
2. That entry reaches `packages/sdk/src/desktop/application/desktop-rpc-client.ts`, which imports
   `packages/sdk/src/internal/transport-policy.ts`.
3. `transport-policy.ts:11` imports `@orpc/contract`.
4. The fixture declares `@orpc/client` and `@orpc/server` — **not `@orpc/contract`**.

`transport-policy.ts` was added by **#1889 (`f9e485f8b`)**, *"refactor(sdk): centralize transport
policy"*, which is why every head containing #1889 fails this job and every head without it passes.

`packages/sdk/deno.json:34` already pins `"@orpc/contract": "npm:@orpc/contract@^1.15.0"`. The
dependency exists; the fixture's map does not carry it.

## Task 1 — the bounded repair

Add `@orpc/contract` to the fixture's import map at the **same pin as the SDK** (`^1.15.0`; confirm
with `deno task deps:latest` / the SDK's `deno.json` rather than assuming). Keep the change minimal
and inside milestone scope: this is a fixture dependency declaration, **not** a refactor of the SDK
or of the desktop packaging.

Do **not** "fix" this by deleting or deferring #1889's transport-policy centralization.

## Task 2 — make the class detectable

Adding one string fixes today and leaves the defect class intact: any future npm import added
anywhere in the SDK's desktop-reachable graph breaks this fixture again, and only a
release-cut-only job would notice.

Add a check that fails fast when the fixture's import map cannot satisfy the SDK graph it maps in by
relative path — e.g. a `deno check`/`deno info` over the fixture's entry points that would have
caught this exact import, wired into a lane that runs on ordinary PRs rather than only under
`ci:full`. Prove it non-vacuous: remove the new dependency entry, show the check fails, restore it.

If you conclude the right guard belongs somewhere other than where you first try, say so in the
worklog with the reason rather than forcing it.

## Task 3 — verify, do not assume

The suite must actually pass. Run the desktop-native fixture path locally as far as this environment
allows, and state plainly what could not be run here. Exact-green is required: the packet must show
`desktop-native-linux` **green on a main-facing branch carrying #1889**, so mark the PR ready and let
the labelled run execute it — a draft skips every runtime job.

## Gates

- `run-deno-check.ts --root packages/cli/e2e/fixtures/desktop-native --ext ts`
- `deno test` over the fixture's own contract test
- `run-deno-lint.ts` / `run-deno-fmt.ts` over touched roots
- `deno.lock` hygiene: report any change and justify it; do not delete or regenerate the lock wholesale.

## PR rules

Draft PR on first commit, then mark ready so `desktop-native-linux` actually runs. Body carries
`Closes #1926` only if every acceptance box is genuinely satisfied — including the recorded green
`desktop-native` run and the recommendation on running it outside release-cut. Otherwise `Refs #1926`
with remaining scope stated.

Never place a closing keyword in prose that explains a *removed* one; the parser ignores negation and
that has already caused a false auto-close in this milestone.

Labels `type:bug`, `area:sdk`, `priority:p0`, `status:impl`, `orchestrator:fixes`, `ci:full`;
milestone `0.0.7`. Progress in `.llm/runs/desktop-orpc-contract-dep--impl/worklog.md`.
