# AS7 Drift

| Severity | Drift | Resolution |
| --- | --- | --- |
| medium | Harness run-loop normally requires PLAN-EVAL before implementation, but the user supplied an appended locked plan and explicitly requested implementation as the WSL Codex agent. | Treated as user waiver; IMPL-EVAL remains separate. |
| medium | Existing `deno task arch:check` root scan was red before AS7 on non-auth historical debt. | Preserved old root scan as `arch:check:repo`; auth-owned `arch:check` is green. Debt recorded. |
| medium | CI workflow does not wire JSR OIDC provenance; it explicitly defers OIDC publish. | Did not claim provenance. Debt recorded for release automation. |
| low | Auth doctrine gate still emits documentation warnings, not failures. | Debt recorded for docs polish before beta. |
