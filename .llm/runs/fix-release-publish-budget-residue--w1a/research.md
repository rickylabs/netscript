# Research

## Baseline and issue currency

- Branch `fix/release-publish-budget-residue` and `origin/main` both resolved to the declared
  `d6db645a89d830e6c36e838e8e1dac98fc84fde5` baseline on 2026-08-07. The branch has no upstream.
- The only initial worktree content was the untracked run skeleton; `deno.lock` had neither staged
  nor unstaged changes.
- Issues #1312 and #1148 were re-read live on 2026-08-07. Both remain open in milestone `0.0.5`.
  Their Acceptance sections are the exact contract copied into `plan.md`.

## Current implementation findings

1. `.github/workflows/release-canary.yml` currently calls `release:canary` (which creates the
   version/branch/tag) before any JSR quota read. A scope-budget failure can therefore consume an
   immutable canary number and begin an upload before it is detected.
2. The same workflow writes the identical `release/canary-pair` failure description for a publish
   failure and a later exact-version production-E2E failure. It does not inspect JSR after a failed
   real publish, so a partial live set is invisible in the status and summary.
3. JSR's official quota documentation says the 1000-attempt default is a **rolling seven-day
   window**, not a calendar week. JSR's current server implementation counts publishing tasks with
   `created_at > now() - interval '1 week'`.
4. An authenticated scope-admin `GET /scopes/:scope` returns camel-case quota fields
   `publishAttemptsPerWeekUsage` and `publishAttemptsPerWeekLimit`; the existing canary workflow
   already holds `JSR_API_TOKEN`. The publishable member count is already authoritative in
   `discoverWorkspaceMembers()`.
5. `findVersionResidue()` already walks the repository with exclusions for `.llm/tmp`,
   `.llm/runs`, `.data`, `.llm/tools/release/baselines`, test fixtures, worktrees, Git metadata,
   and node modules, but reads only `.json` and `deno.lock`. Generated `.ts` assets are missed.
6. Existing same-semver canary republish mode proves that a partial canary number is not globally
   unusable: already-published member versions are immutable, while never-published members may be
   filled at the same semver only from the identical tag tree. No member may be overwritten.

## JSR publication-safety rubric

This is release tooling, not a package/plugin public-surface wave. No package exports, metadata,
slow types, module docs, or publish include lists change. The applicable JSR risks are instead:

- quota state must be read with the existing OIDC-adjacent release secret and must fail closed;
- no local or test path may publish;
- public registry verification must distinguish `none`, `partial`, and `complete` exact-version
  presence after a failed publish;
- canary versions/member versions remain immutable, with same-semver filling limited to missing
  members on an identical tree.

## Open questions closed

- Reset semantics: rolling seven days, verified from official docs and upstream server query.
- Cadence response: stop per-slice canaries; run one coordinated canary per release candidate and
  dispatch the next immutable number only after a fix changes the candidate. The budget guard is a
  hard backstop, not a target to consume.
- Partial-canary policy: preserve the tag and published members. Resume the same number only for
  missing members from the identical tag tree after budget returns; otherwise move forward to the
  next canary. Never overwrite/yank by default.
