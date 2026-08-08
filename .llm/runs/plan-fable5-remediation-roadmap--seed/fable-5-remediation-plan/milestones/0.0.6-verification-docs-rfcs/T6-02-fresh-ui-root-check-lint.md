# chore(ci): `packages/fresh-ui` is excluded from root check and lint, runs in no workflow, and its own check task rewrites its lock — DRAFT (no GitHub mutation; owner ratification pending)

**Draft-ID:** T6-02 · **Proposed milestone:** 0.0.6 · **Labels:** `type:chore` `area:tooling`
`area:fresh-ui` `priority:p1` `status:triage` · **Depends on:** none (T6-01 must not extend
`quality:scan` into `packages/fresh-ui` until this issue settles the lock policy)

## Summary

`packages/fresh-ui` is a published `@netscript/fresh-ui` package with 6 subpaths and a 66-item
registry, and it is the surface the scaffold's `/design` routes and every `ui:add` slice consume.
It is excluded from the root `check` task, excluded from the root `lint` task, and named by no step
in any workflow — so no CI job type-checks or lints it. It is not broken: its own `check` task
passes today. It is ungated, which means the next change to it is the one that breaks silently.
The reason it was excluded is real and must be solved, not bypassed: it carries its own
`deno.lock`, and running its check **mutates that lock**.

## Area

fresh-ui / tooling

## Reproduction steps

1. `rtk grep -n "fresh-ui" deno.json` → the name appears in the `check` exclude regex and the
   `lint` exclude regex.
2. `rtk grep -rn "fresh-ui" .github/` → hits are `CODEOWNERS:26` and the two issue-template `area`
   dropdowns only. No workflow step names it.
3. `md5sum packages/fresh-ui/deno.lock` → record.
4. `deno task --cwd packages/fresh-ui check` → exits **0**.
5. `md5sum packages/fresh-ui/deno.lock` → **changed**; `git status --porcelain` reports
   ` M packages/fresh-ui/deno.lock`.
6. `git checkout -- packages/fresh-ui/deno.lock` to restore.

Executed 2026-08-08 at `fac9e339042c`: step 4 exit `0`; lock md5 `93b0bf5e…` → `5a83f729…`.

## Evidence

Corpus: `research/repo-audit/web-layer.md` §11.3 and gap register item 12; verified at source.

- `deno.json:34` — root `check` runs `.llm/tools/run-deno-check.ts --root packages --root plugins`
  with `--exclude "^(packages/(fresh-ui)|…)"`.
- `deno.json:143` — root `lint` excludes `^(packages/(fresh-ui|cli)|…)`.
- `.github/workflows/ci.yml` runs the root `check`; nothing runs
  `deno task --cwd packages/fresh-ui check`.
- `deno.json` workspace globs are `packages/*`, `packages/cli/e2e`, `plugins/*`, `examples/*`,
  `apps/*` — so `packages/fresh-ui` **is** a workspace member, yet it ships
  `packages/fresh-ui/deno.lock` and its tasks pass `--lock=deno.lock`
  (`packages/fresh-ui/deno.json` tasks `check`, `test`, `tokens:build`).
- The structural cause of the private lock: `packages/fresh-ui/deno.json` imports resolve the SDK
  from the **registry**, not the workspace — `"@netscript/sdk/auto-update": "jsr:@netscript/sdk@0.0.4/auto-update"`,
  `"@netscript/sdk/desktop": "jsr:@netscript/sdk@0.0.4/desktop"`.
- One fresh-ui artifact is already gated: `deno.json:108` `check:assets-barrel` git-diff-gates
  `packages/fresh-ui/registry.generated.ts`. The generated barrel is protected; the 80 source files
  that produce it are not.
- Consumer stake: `research/repo-audit/web-layer.md` §7.1 — the scaffolded `/design/components`
  gallery lists 50 of the registry's 66 items with no sync gate. An ungated registry package and an
  ungated gallery snapshot are the same blind spot at two ends of one seam.

## Current surface

`packages/fresh-ui` type-checks and lints only when a human runs its package-local tasks. Its lock
is a second lock in a workspace whose other 29 packages share the root lock, and any invocation of
its `check` rewrites it, so a naive "just delete the exclusion" fix would make every CI run dirty
the working tree and fail lock-hygiene review.

## Target contract

`packages/fresh-ui` is type-checked and linted by CI on every PR that touches it, with a lock policy
that is decided explicitly and asserted, choosing one of:

- **(a) Join the root lock.** Drop `packages/fresh-ui/deno.lock`, let the workspace root lock cover
  it, and repoint `@netscript/sdk/*` at the workspace member. Requires confirming the published-pin
  is not load-bearing for the registry's consumer story.
- **(b) Keep the private lock, gate it frozen.** Keep the pins, and run the package check with a
  frozen-lock flag so a lock rewrite is a CI failure rather than a silent mutation, with the
  regeneration step named in the failure message.

Either way, the package-local check runs in CI, the lint exclusion is removed or narrowed to a
named rule set with a reason, and the working tree is clean after the job.

## Acceptance

- [ ] `packages/fresh-ui` is type-checked by a CI job on PRs that touch it.
- [ ] `packages/fresh-ui` is linted by a CI job on PRs that touch it.
- [ ] The lock policy is recorded in the PR body as (a) join-root-lock or (b) frozen-private-lock.
- [ ] Running the new CI step leaves `git status --porcelain` empty.
- [ ] A lock rewrite during the check fails the job instead of being committed.
- [ ] A deliberately broken type in `packages/fresh-ui/registry.ts` fails the new job (red-first).
- [ ] A deliberately introduced lint violation in `packages/fresh-ui` fails the new job.
- [ ] `deno.json:34` and `deno.json:143` no longer exclude `packages/fresh-ui`, or the remaining
      exclusion names the specific rule and a linked issue.
- [ ] Tests cover the frozen-lock failure path if option (b) is chosen.
- [ ] `gate:` root `deno task check`, `deno task lint`, and `deno task fmt:check` stay green.

## Boundaries

- Do **not** fix the `/design/components` 50-vs-66 registry drift here — that is a separate
  scaffold-generation defect owned by the T2 pack's `/design` registry sync draft, referenced from
  #1335's inventory.
- Do **not** reopen #1328 (closed 2026-08-07): that issue owns the *generated consumer project's*
  quality gates; this issue owns the *framework repo's* CI coverage of one package.
- Do **not** duplicate #1335 — the umbrella owns generated-surface conformance, not framework CI
  wiring.
- Do **not** widen `quality:scan` roots here; T6-01 owns the quality gate and is blocked on this
  issue's lock decision.
- Do **not** remove `packages/cli` from the `lint` exclusion in the same change; it is a separate,
  larger backlog with its own noise profile.

## Docs/consumer proof

`@netscript/fresh-ui` is published to JSR and consumed by every scaffolded app. After this lands,
the package's README archetype/permissions claims and its `deno doc` surface are backed by a CI
type-check, so a consumer reading the registry reference is reading a gated surface. The
consumer-visible receipt is a CI run link on a PR that touches only `packages/fresh-ui`.

## Provenance

Seed run `plan-fable5-remediation-roadmap--seed`, PR #1347, 2026-08-08. Source:
`research/repo-audit/web-layer.md` §11.3 ("New issues worth filing … the `packages/fresh-ui` CI
check/lint exclusion" — no board owner found by the §7 dedup sweep). Lock mutation and green-check
status re-verified by execution at `fac9e339042c`; the lock was restored with `git checkout --`.
