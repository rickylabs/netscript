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

