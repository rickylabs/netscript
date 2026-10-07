# Off-worker full runtime evidence — PASS

Canonical suite executed in one pass on source/test head `48aa35fd8f854df6f6140844d96bbfefb70ad45f`, [run37681694541](https://github.com/rickylabs/netscript/actions/runs/37681694541), [job112999350273](https://github.com/rickylabs/netscript/actions/runs/37681694541/job/112999350273).

Command: `deno task e2e:cli run scaffold.runtime --cleanup --format pretty --report .llm/tmp/e2e-report-scaffold-runtime.json`. Exit **0**, command-step conclusion success (unguarded `bash -e`), suite `ok=true`, **104 passed / 0 failed / 0 skipped**, including cleanup.aspire-stop. Step started20:30:49Z, completed20:40:10Z on2026-10-07. Full job succeeded20:40:14Z.

Downloaded original suite report at `/ephemeral/tmp/streams-e2e-636/e2e-report-scaffold-runtime.json` and raw log at `/ephemeral/tmp/streams-full-runtime-ci.log`; retained structured non-payload evidence with original hashes in scaffold-runtime-ci.json. Read the originals directly for independent verification; no credentials or generated payload outputs are copied into tracked evidence. Existing native workflow supplies .NET10, Aspire13.5.3, Docker/Postgres. Static scaffold passed before runtime.

This resolves F6 through real off-worker evidence; the earlier local preflight failure remains recorded honestly. No gate waiver, local reattempt or suite splitting. Prior c12a520 run was superseded; current production source/test content stayed unchanged throughout this gate.
