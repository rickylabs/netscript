# Run resource leak report

Generated 2026-10-31T04:35:27Z by `deno task maint:leak-check -- --slice-dir .llm/runs/orch-divybot-6538850770--s1b --worktree .`.

**Verdict: no run-owned survivors.** Nothing was torn down.

| Probe | Result |
| --- | --- |
| Aspire | ok |
| Process | ok |
| Docker, volumes, networks | unavailable (no Docker daemon on the worker) |

| Survivor kind | Count | Ownership |
| --- | ---: | --- |
| AppHost | 1 | unproven, foreign checkout |
| Process (Aspire CLI and DCP monitors) | 24 | unproven, foreign or unknown owner |
| Run-owned | 0 | — |

The 25 unproven entries belong to another checkout's live Aspire session on the same host. They were left untouched, as the leak-check policy requires. Their process identities are omitted from this public record.
