use harness

## SKILL

Load `netscript-harness`, `netscript-tools`, `netscript-deno-toolchain`, `netscript-pr`, and `rtk`.
Read `.llm/harness/gates/implementation-gate.md` and `.llm/harness/workflow/lane-policy.md`.

# Implementation brief — #1905 · fresh-ui private-lock gate triggers

**Role:** implementation author (leaf). **Supervisor:** `topic-internals-0.0.7`.
**Issue:** #1905 (`type:bug`, `area:tooling`, `priority:p2`, milestone `0.0.7`).
**Worktree:** `/home/agent/projects/netscript/worktrees/007-leaf-1905`
**Branch:** `ci/fresh-ui-lock-gate-triggers` — already created, base
`77ad823dcb1874ccfc8964b4679ad92a3a145e0b` (`origin/main`, the #1910 merge). Do not rebase.

You implement. You do **not** merge, relabel to ready, close the issue, or touch any other lane's
branch/worktree.

---

## The defect, as measured (not as the issue body states it)

`packages/fresh-ui/deno.lock` is a **second lockfile** consumed frozen by
`packages/fresh-ui/deno.json` tasks `check`, `test`, `tokens:build` (`--lock=deno.lock --frozen`).
Verified at the base head: that lock's `workspace.members` carries **37 entries** spanning
`packages/*`, `packages/cli/e2e`, and `plugins/*`. So *any* of those 37 member manifests can stale
it.

The issue proposes extending the `fresh-ui-quality` `paths:` filter. That is **necessary but not
sufficient**, and its enumeration is **too narrow**. Both facts are established by reading the base
head and must be reflected in the fix:

1. **Trigger layer** — `.github/workflows/fresh-ui-quality.yml` `paths:` (both the `pull_request`
   and the `push` arm) lists `packages/fresh-ui/**`, three `.llm/tools/**` files, root `deno.json`,
   the classifier pair, and the workflow itself. It does **not** list member manifests or the root
   `deno.lock`. A member-manifest-only PR never starts the workflow.
2. **Decision layer** — `.github/scripts/ci-classify-changes.ts` gates the heavy job on
   `needs_fresh_ui`. In its `isDenoConfigBase(path)` branch (the branch that catches every nested
   `deno.json`/`deno.jsonc`/`deno.lock` **and** the root `deno.lock`), the contribution is
   `freshUi: path.startsWith('packages/fresh-ui/')`. So for `packages/sdk/deno.json`,
   `plugins/ai/deno.json`, and the root `deno.lock`, `freshUi` is **false**.

   **Consequence: fixing only the `paths:` filter yields a gate that starts and then reports
   "Fresh UI quality skipped by policy".** That is a worse outcome than today, because it looks
   like coverage. Both layers must change together.

   (Root `deno.json` under a `toolchain` verdict already sets `freshUi: true` — that is exactly why
   PR #1890 was caught incidentally. Do not regress that path.)
3. **Scope of the `--lock=<file>` class** — enumerated at the base head, record the enumeration as
   evidence:
   - `packages/fresh-ui/deno.lock` — the only second lockfile over the root workspace graph.
   - `docs/site/deno.lock` exists but `docs/site` is **not** a root workspace member
     (root `workspace` = `packages/*`, `packages/cli/e2e`, `plugins/*`, `examples/*`, `apps/*`) and
     every `docs/site` task that could read it passes `--no-lock`. Re-verify this yourself and state
     the verdict; if you find a consumer I missed, widen the fix.
   - Confirm there is no third `--lock=` gate. Search `deno.json`/`deno.jsonc`/`.github/**`, exclude
     `.llm/runs/**` (historical evidence, never regenerated).

## Authorized surface — exactly these files, no others

| File | Change |
| --- | --- |
| `.github/scripts/ci-classify-changes.ts` | `freshUi` contribution in the nested-config branch |
| `.github/scripts/ci-classify-changes.test.ts` | RED-first unit tests for the new contributions |
| `.github/workflows/fresh-ui-quality.yml` | `paths:` on **both** arms |
| `.llm/tools/validation/fresh-ui-quality_test.ts` | structural assertion that the workflow's two `paths:` lists carry the new globs |
| `.llm/runs/fresh-ui-lock-gate-triggers--1905/**` | your run artifacts |

**Not in scope, and a hard stop if you find yourself there:** any dependency version change; any
regeneration of `packages/fresh-ui/deno.lock` or the root `deno.lock`; any `.llm/runs/**` lockfile
outside your own slice dir; any other workflow.

## Required properties of the change

- **Both `paths:` arms stay in sync.** They are currently byte-identical lists; keep them so.
- **Negation ordering is load-bearing** in GitHub `paths:` filters — `!packages/fresh-ui/**/*.md`
  must stay after the positive `packages/fresh-ui/**` it excludes from.
- Cover the member set that actually mirrors into the private lock:
  `packages/*/deno.json`, `packages/cli/e2e/deno.json`, `plugins/*/deno.json`, and the root
  `deno.lock`. Check `examples/*` and `apps/*` against the base head yourself — they are declared
  workspace globs but did **not** appear in the private lock's 37 members. State what you found and
  cover them if they can appear.
- The classifier's **safety property is frozen**: an unrecognised path still forces every output
  true; the classifier never skips because classification failed. Your change must not narrow any
  existing `true`.
- The `.llm/tools/validation/fresh-ui-quality_test.ts` assertion must **parse** the workflow YAML
  and read the `paths` arrays from the parsed document. Do not grep for strings.

## Test-first, and prove the RED honestly

Two standing hazards from this release, both of which produced a false RED here:

- Verify a RED by **checking the RED commit out in a throwaway worktree** and running there — not
  in the live tree, where an uncommitted edit or a test edited between RED and GREEN silently
  rescues it.
- **`cmd | tail` destroys the exit code.** Always `out=$(cmd); rc=$?`, then print `rc`.

Sequence: add the failing classifier tests → capture RED with the real exit code → implement →
capture GREEN.

## Acceptance mapping — read this before you claim a box

Issue #1905 has three boxes. Their honest pre-merge status is **not** uniform, and you must not
tick what you cannot prove:

- Box 3 (*the `--lock=` class is enumerated*) — provable now, by the enumeration above.
- Box 1 (*a member-manifest-only PR triggers `fresh-ui-quality`*) — the classifier half is provable
  now by unit test; the **live trigger** half is **not provable pre-merge**. For `pull_request`,
  GitHub evaluates the `paths:` filter using the workflow file from the base+head merge ref, and
  the filter is restricted to `branches: [main]`. Every pre-merge PR carrying this fix therefore
  also carries `.github/workflows/fresh-ui-quality.yml` in its own diff — already a triggering
  path — so no pre-merge PR can isolate the new trigger. Say this plainly; do not construct a
  demonstration that quietly relies on the old trigger and present it as proving the new one.
- Box 2 (*a deliberately stalened private lock fails that gate*) — demonstrate the **teeth** now:
  on a throwaway branch off your head, stalen `packages/fresh-ui/deno.lock` (edit an existing
  entry; do not regenerate), open a draft PR to `main`, and capture the run id plus the failing
  step and its `::error::` line. Then delete the throwaway branch and close that PR. This proves
  the gate fails on a stale lock. It does **not** prove trigger isolation — keep the two claims
  separate.

Record in your `evidence.md` the exact post-merge verification that would close box 1: a one-shot
PR to `main` whose diff is a single member manifest plus a stalened private lock, expected to run
`fresh-ui-quality` and fail it. The supervisor carries that obligation to the issue.

## Validation to run and report with real exit codes

```
deno test --allow-read --allow-write --allow-env .github/scripts/ci-classify-changes.test.ts
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all .llm/tools/validation/fresh-ui-quality_test.ts
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .github --ext ts
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .github --ext ts
```

Plus a YAML parse of the edited workflow proving both `paths:` arrays, read back from the parsed
document. Do **not** run `deno task e2e:cli` — this change cannot affect it, and the runtime tier
group is contended across three topics.

## Deliverables

1. Commits on `ci/fresh-ui-lock-gate-triggers`. **Commit your work** — do not stop with a dirty
   tree; four authors this release stalled after finishing and before committing.
2. `.llm/runs/fresh-ui-lock-gate-triggers--1905/{worklog.md,evidence.md,drift.md}`.
3. A PR to `main`, **draft**, body carrying `Closes #1905`, labels
   `type:bug`, `area:tooling`, `priority:p2`, `orchestrator:internals`, `status:impl`,
   milestone `0.0.7`.
4. Report back: branch head SHA, PR number, every gate's real exit code, the enumeration verdict,
   and which acceptance boxes you can and cannot honestly tick.
