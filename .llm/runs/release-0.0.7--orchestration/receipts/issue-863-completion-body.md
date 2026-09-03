> **Completed — 2026-09-03:** all three gates are satisfied. Gate 1: #1720 / #1754; gate 2: #1880 / #1952; gate 3: #1881 and the exact published receipts below. Historical diagnosis is preserved.

Found by the #816 adversarial pass (Sol·xhigh, 2026-07-18) running the printed quickstart on a clean machine with a cold `DENO_DIR`:

- fresh scaffold (`--db postgres --service`), `aspire restore` + `aspire start` both exit 0;
- Aspire reports the Postgres resource as **`Running` but `Unhealthy`** — health probe throws `NpgsqlException: Exception while reading from stream` (read timeout) while the Postgres container log says it is ready;
- `netscript db init --name init` stays `Waiting` on that resource **beyond five minutes** with no progress, no timeout, and no actionable message; it had to be interrupted.

Isolation: after interrupting, `db generate` (21s) and `db seed` (11s) succeed, and after a second `aspire start` the app's `/health` returns healthy — so the generated app is fine; the failure is the health-probe/readiness interaction plus `db init`'s unbounded wait.

Acceptance:
- [x] gate: `db init` bounds its wait on dependency readiness with a clear, actionable timeout message (naming the unhealthy resource and the probe error);
- [x] gate: the Postgres health-probe false-negative (`Running`/`Unhealthy` with ready container log) is reproduced and fixed or explained with a documented readiness step the scaffold prints;
- [x] gate: the clean-machine quickstart sequence (as printed in the root README) runs end-to-end without manual recovery.

Evidence: `.llm/runs/beta11-cli--orchestrator/slices/g14-816-main-readme/adversarial.md` (branch `docs/816-main-readme`), Gate log rows for the quickstart run.
## Final published acceptance — 2026-09-03

Verified against `jsr:@netscript/cli@0.0.7-canary.10`, content `a2d5b8b75083769b946c03ab772e08f2634e2b35`, immutable tag commit `170e33782acf2dfb4bccc3f4e461ae8f5a149f85`.

- [Canary publication and exact production pair](https://github.com/rickylabs/netscript/actions/runs/33762898477): SUCCESS.
- [Pinned production run](https://github.com/rickylabs/netscript/actions/runs/33763460542): all 12 README commands plus cleanup PASS (13/0), full scaffold runtime 104/0, seven-step quickstart plus cleanup/integrity 9/0; no retries.
- [Supplementary same-version README and cleanup proof](https://github.com/rickylabs/netscript/actions/runs/33765493143): 13/0; post-run `appHosts=0, containers=0, volumes=0, networks=0`. Ordinary image/dependency caches retained (six cached images at baseline). This verification-only workflow adds read-only post-run counts; published framework content is unchanged.
- The downloadable production artifacts contain `readme-quickstart-prod-report.json`, command-by-command JSON transcripts, cleanup receipt, and (supplementary run) `readme-post-cleanup-baseline.json`. Dedicated initial baseline had zero resources, so no foreign or unknown resources were present to mutate. There was no manual recovery between README commands. Earlier sequence/product defects were fixed in the linked merged PRs rather than worked around.
