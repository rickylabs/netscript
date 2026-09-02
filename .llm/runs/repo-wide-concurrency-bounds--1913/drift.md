# Drift Log — #1913 repo-wide concurrency bounds

## 2026-09-02 — Pages exposure premise corrected

- **What:** The issue claimed `pages-deploy` was dispatch-triggered rather than push-triggered.
- **Source:** `.github/workflows/pages.yml` at base plus the latest 100 Pages workflow runs.
- **Expected:** Manual-dispatch-only, low-probability exposure.
- **Actual:** The workflow has `push: main`; 12 of the latest 100 runs were main pushes, with
  adjacent gaps as short as 27 seconds.
- **Severity:** significant
- **Action:** fix
- **Evidence:** corrected issue #1913 body; `research.md` findings 1–2.

## 2026-09-02 — Requested implementation gate path absent

- **What:** `.llm/harness/gates/implementation-gate.md` does not exist at the assigned base.
- **Source:** direct filesystem inventory of `.llm/harness/gates/`.
- **Expected:** The implementation brief required that exact file.
- **Actual:** The applicable implementation/gate requirements live in
  `.llm/harness/workflow/run-loop.md` sections 5–7 and the static gate documents.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `rg --files .llm/harness` inventory; `run-loop.md` read in full.

## 2026-09-02 — RTK binary unavailable

- **What:** The requested `rtk` skill was loaded, but the binary is not on this host's PATH.
- **Source:** `command -v rtk` and attempted `rtk rg`.
- **Expected:** Skill states machine-level `rtk` is available.
- **Actual:** Shell returned `rtk: command not found`; direct read-only `git`/`rg` are used.
- **Severity:** minor
- **Action:** accept
- **Evidence:** bootstrap command output.

## 2026-09-02 — Pages environment is not a second concurrency mutex

- **What:** The deploy job does declare `environment.name: github-pages`, but the workflow-level
  group remains the only configured concurrency mutex.
- **Source:** `.github/workflows/pages.yml`; GitHub's deployment documentation.
- **Expected:** The brief asked whether Pages supplied additional environment concurrency.
- **Actual:** GitHub explicitly documents that `environment` and `concurrency` are independent.
  The environment gates deployment protection; it does not serialize classify/build/deploy runs.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `research.md` finding 4.

## 2026-09-02 — Active credential shadowed workflow-scoped credential

- **What:** The first workflow push used the active `GH_TOKEN`, which had only `repo`, and GitHub
  rejected `.github/workflows/pages.yml` despite a stored secondary credential with `workflow`.
- **Source:** `gh auth status` and rejected `git push` output.
- **Expected:** The dispatch-confirmed session credential carried `gist, read:org, repo, workflow`.
- **Actual:** Environment-token precedence selected a different repo-only token.
- **Severity:** significant
- **Action:** fix
- **Evidence:** supervisor explicitly resumed this leaf and directed it to commit/push everything;
  push uses the stored workflow-scoped credential without exposing it.

## 2026-09-02 — Stale branch dispatches retain the old Pages queue policy

- **What:** The workflow comment's serial-retention guarantee originally omitted that GitHub uses
  the arriving run's workflow revision.
- **Source:** IMPL-EVAL origin-branch sweep at head `47c3b4241`.
- **Expected:** Merging the bound closes ordinary `push: main` and release traffic exposure.
- **Actual:** Of 158 origin branches, only this branch carries `queue: max` in `pages.yml`; a
  workflow dispatch from one of 157 stale copies can still join `pages-deploy` under the default
  pending policy and displace a pending main run until that branch copy converges.
- **Severity:** minor residual
- **Action:** accept and document in the `pages.yml` diagnostic header; the literal key remains the
  correct mutex for a single global site.
- **Evidence:** evaluator count: Pages with bound 1, without 157.

## 2026-09-02 — Canary duplicate behavior and hosted-evidence precision

- **What:** The canary header overstated that every redundant request fails closed, and two hosted
  evidence statements needed temporal/API qualifications.
- **Source:** IMPL-EVAL findings F2-F4.
- **Expected:** Republish requests meet existing-version guards; latest-100 traffic and zero-step
  deployment evidence remain auditable when later API reads differ.
- **Actual:** Duplicate `target-version` requests mint successive canary numbers serially and each
  consumes a publish-budget slot. The latest-100 push count is window-dependent (12 initially, 11
  at evaluation), and zero deploy steps still produced deployment record `6221263357` in
  `waiting` then `failure` state.
- **Severity:** minor
- **Action:** fix comments/evidence only; retain the evaluated concurrency mappings unchanged.
- **Evidence:** corrected `release-canary.yml` header and `evidence.md` qualifications.
