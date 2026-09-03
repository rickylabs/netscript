# Coordinator audit — original incident versus current recovery

**Resolved 2026-09-03 09:52Z:** owner explicitly approved “mitigated; original cause unproven.”
Issue1844 is closed. See [owner-authorized closeout](https://github.com/rickylabs/netscript/issues/1844#issuecomment-5523886825)
and `issue-1844-owner-closeout.md`. The audit below is retained as the evidence behind that ruling;
its earlier pending-decision statements are historical, not a live release blocker.

The original run `33404321608` artifact `e2e-cli-scaffold-runtime-report` is still retrievable. It preserves the 300451 ms timeout and paths to the old CLI/AppHost logs, but those logs are not in the artifact. The actual Garnet/DCP state at that timeout therefore remains unproven; current successful runs cannot reconstruct it.

Independently downloaded full PostgreSQL report receipts:

| Run | Exact head | Full suite | `runtime.wait.garnet` |
| --- | --- | --- | --- |
| [33700447581](https://github.com/rickylabs/netscript/actions/runs/33700447581) | `f5100c44a49e6d48864fa8921bbc53ee44c8ce2f` | 97 passed, 0 failed | passed, 69 ms |
| [33702319275](https://github.com/rickylabs/netscript/actions/runs/33702319275) | `f5100c44a49e6d48864fa8921bbc53ee44c8ce2f` | 97 passed, 0 failed | passed, 79 ms |
| [33709012909](https://github.com/rickylabs/netscript/actions/runs/33709012909) | `a6b5d03e11bb7b04594ec733af72bacde79dba1e` | 97 passed, 0 failed | passed, 65 ms |
| [33714984597](https://github.com/rickylabs/netscript/actions/runs/33714984597) | `43734544fa865d830acd82cab7dfb3c3ce6cf872` | 101 passed, 0 failed | passed, 85 ms |

These are recovery/soak observations under the newer readiness implementation, not measurements of the old 300-second healthy wait: the modern wait step reports `garnet converged at Running`, and separate listener gates enforce aggregate/named health. No claim is made that the old timeout was fixed by increasing its budget.

Current candidate failures are in stale generated-page/island acceptance, not the Garnet wait. They remain strict and are being repaired in #1958. The next canary is not held on reconstructing missing historic logs.

The owner has been asked whether to accept closeout as **mitigated; original cause unproven**, supported by the landed diagnostic/readiness changes and linked complete runs. Until that ruling, the original acceptance boxes and issue remain open. No original root-cause classification is fabricated.

## Second retained reproduction audited — 2026-09-03

Downloaded `e2e-cli-scaffold-runtime-report` from run `33425247583` (artifact `9770814732`,
not expired). It contains only `e2e-report-scaffold-runtime.json`, not the referenced CLI/AppHost
logs. It confirms 46 passed / 1 failed: `runtime.wait.garnet`, 300465 ms, CLI exit17 surfaced
through the readiness wrapper's exit1. Both AppHost start and post-database restart passed.
The log paths refer to the historical hosted runner. This second artifact therefore confirms the
reproduction but still cannot supply the historical cause; the parked disposition remains honest.
No extra runtime retry, issue closure, or release barrier was introduced by this read-only audit.
