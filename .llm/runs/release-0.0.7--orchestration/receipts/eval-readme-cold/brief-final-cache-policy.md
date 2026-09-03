use harness

Resume independent session 0039d1ad-72eb-4047-964c-8b326ff65902. Preserve both prior evaluations.
Bounded final integration review only: 4092014cf -> 6e9bb276cdb7039ff62b01fb540c0f7afbc4e42c.
Owner permits downloaded dependency caches as well as Docker images. NuGet packages are SDK
dependencies, not generated AppHost/application state. Correct the previous conflation, do not
reopen the owner's cache policy. The latest delta restores the original pinned NuGet SDK cache,
spells read-only container inventory as docker container ls --all --quiet, and adjusts the
regression to require SDK cache but reject generated application cache. No source runtime changes.
Actual prior CI failed exactly two existing tests (NuGet cache policy and forbidden-command lexical
guard). Structured focused RED 8 pass/3 fail; latest GREEN 11 pass/0 fail across workflow tests,
NuGet cache policy and forbidden commands. Selected check/fmt/lint pass, git diff --check pass.
Inspect only this tiny delta; run those focused tests if useful. No broad sweeps, runtime, GitHub
writes, PLAN-EVAL or publication. Independent runtime verification remains coordinator-owned.
Write NEW .llm/runs/readme-cold-release-proof--0.0.7/evaluate-final-cache-policy.md with exact
head/session/model, bounded findings and PASS_IMPL/FAIL_FIX. No commit/push. Finish promptly.
