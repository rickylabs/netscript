# plan.md — One-shot deterministic release automation

Run-id: `chore-release-one-shot--tooling`. Branch: `chore/release-one-shot` off **origin/main**.
Archetype: repo/harness tooling (no `packages/`/`plugins/` source). Lane: WSL Codex daemon-attached.
Scope: SCOPE-tools (CI workflows + `.llm/tools/` + a new skill). Folds #122, #123, #133, #146.

## Goal

A release becomes: **read the release skill → run ONE gated command → merge → CI publishes + verifies
race-free**. No supervisor-improvised scripts, no manual root/lock edits, no publish/e2e trial-and-error.

## Design (LOCKED decisions)

### D1. `deno task release:cut -- <version>` — the one local command
New `.llm/tools/release/cut.ts`. Steps, in order, fail-fast:
1. Validate `<version>` (semver incl. prerelease, e.g. `0.0.1-alpha.12`); refuse if equal/older than
   current root version.
2. **Workspace-coordinated bump (#122):** set version in root `deno.json`, every
   `packages/*/deno.json`, every `plugins/*/deno.json`, and rewrite `deno.lock` `@netscript/*` ranges
   to the new version. Reuse the existing per-member `deno bump-version` where it already works;
   ADD the root-`deno.json` write + the `deno.lock` `@netscript/*` in-place range rewrite (the two
   gaps). No `deno cache --reload`; no lock deletion.
3. **Residue check:** `git grep -nE '<old-version>'` across `*.json` + `deno.lock` must be empty;
   abort otherwise.
4. **Gates (reuse + new):** run, in order — `release:preflight` (text-import scan, D3),
   `publish:dry-run` (existing per-member), `deno ci --prod` (D2 fix). Any non-zero → abort, no branch.
5. Create branch `release/cut-<version>`, stage ONLY the bumped version files by explicit path,
   commit `chore(release): cut <version>`, push `HEAD:refs/heads/release/cut-<version>`, open PR via
   `gh pr create --body-file`. Print the PR URL + the post-merge instructions.
6. `--dry-run` flag: do everything except branch/commit/push/PR (for tests + the eval).

### D2. Fix `deps:prod-install` (#146)
`.llm/tools/deps/prod-install.ts`: remove `--frozen` from the args (`['ci','--prod']`). Deno 2.9
`deno ci` is already frozen and rejects the flag. Add/repair the wrapper's unit test to assert the
arg list has no `--frozen`.

### D3. Text-import preflight gate (#133)
New `.llm/tools/release/preflight-text-imports.ts` + `deno task release:preflight`. Static scan of
publishable members (name set, `publish !== false`) flagging the forbidden bundled-asset read
patterns: `Deno.readTextFile(`/`Deno.readFile(` and `fromFileUrl(`/`import.meta.resolve(`/
`new URL(..., import.meta.url)` used to READ shipped asset files (allowlist legitimate runtime FS
use in CLI scaffold I/O via an explicit ignore list / annotation). Exit non-zero with file:line on
violation. This replaces the false-safety publish preflight; it encodes the locked rule
"JSR-safe asset embedding = text imports". Wire into BOTH `cut.ts` (step 4) AND `publish.yml`
(a step before "Publish dry-run").

### D4. e2e-cli-prod ordering (#123)
`.github/workflows/e2e-cli-prod.yml`: REPLACE the concurrent `on: release: published` with
```yaml
on:
  workflow_run:
    workflows: ["publish"]
    types: [completed]
  workflow_dispatch:
    inputs: { published-version: ... }   # keep manual path
```
Add a job-level guard `if: ${{ github.event_name == 'workflow_dispatch' || github.event.workflow_run.conclusion == 'success' }}`
and resolve the version from the publish run's release tag (`github.event.workflow_run.head_branch`
/ associated release) for the workflow_run path. Net effect: e2e-cli-prod runs only AFTER publish
succeeds — no JSR race. Validate YAML with `actionlint` if available.

### D5. Release skill
New `.agents/skills/netscript-release/SKILL.md` (and mirror to `.claude/skills/` per the
generated-mirror rule). Documents end-to-end: pre-reqs, the single `release:cut` command, what each
gate proves, the merge → tag/GitHub-Release → publish.yml(OIDC) → race-free e2e-cli-prod verify flow,
the #122/#123/#133/#146 rationale, and rollback. Cross-link `netscript-deno-toolchain` (toolchain
map) and `netscript-pr`. AGENTS.md "release work" pointer updated to name this skill.

### D6. Non-goals
- Do NOT move publishing into a local `deno publish` (keep the GitHub-Release-triggered OIDC model).
- Do NOT auto-create the tag/Release from `release:cut` (merge gates the Release; a follow-up may add
  an optional `release:tag` helper, out of scope here).
- No new type casts; only 2 accepted repo-wide casts unchanged.

## Slices (commit-by-slice)
- S1: D2 prod-install `--frozen` removal + test. (smallest, unblocks the gate)
- S2: D3 preflight-text-imports tool + task + test + publish.yml wiring.
- S3: D1 release:cut orchestrator (bump coordinator: root+members+lock) + task + unit test + `--dry-run`.
- S4: D4 e2e-cli-prod workflow_run gating.
- S5: D5 release skill + AGENTS.md pointer + .claude mirror.

## Gates (per slice + final)
- `.llm/tools/run-deno-check.ts --root .llm/tools --ext ts` (+ `--unstable-kv` if workspace types).
- New unit tests: bump coordinator (root+members+lock all updated; residue empty), preflight
  (positive+negative fixtures), prod-install arg-list.
- `deno task release:cut -- 0.0.1-alpha.99 --dry-run` proves bump+residue+gates path without push.
- `deno run ... run-deno-lint.ts` + `run-deno-fmt.ts` on changed files (ts only).
- `actionlint .github/workflows/e2e-cli-prod.yml publish.yml` (if available) for D4.
- #123 live proof deferred to the next real cut (alpha.12).

## Evaluator
- PLAN-EVAL: OpenHands minimax-M3 (separate session), reads research.md + plan.md + this Design.
  Hard gate — no Codex slice before PASS.
- IMPL-EVAL: OpenHands qwen3.7-max (separate session) after all slices.

## Debt / follow-ups
- The first cut AFTER this lands (alpha.12) is the live verification of D1 (no manual edits) + D4
  (no race). Record the outcome.
