Narrow CI repair on PR #1975 (head `0650f6f7b`), same worktree, before any promotion.

Exact red: `ci` run 33707100717 job 100498621479 (`quality`), failing step **"Aspire version parity (phase 1)"**. Reproduced locally with `deno task check:aspire-version-parity` → `ok:false`, one `fail` finding: `{"path":".llm/runs/research-aspire-13.5-adoption--0.0.7/aspire-surface-manifest.tsv","class":"manifest:freshness","status":"fail","reason":"Aspire surface manifest is stale; rerun aspire-surface-manifest.ts"}`; all other findings are pre-existing `deferred`/`info`. Attribution: branch-caused, not main — main `45e57377f` is CI-green; this branch added six Aspire-mentioning files the manifest must index (`slices/leaf-1881-fix/{context-pack,plan,research,supervisor,worklog}.md` → `archival:this-run`, and `packages/cli/e2e/tests/application/readme-command_test.ts` → `e2e`).

Do exactly this, nothing else:
1. `deno run --allow-read --allow-write --allow-run=git .llm/runs/research-aspire-13.5-adoption--0.0.7/tools/aspire-surface-manifest.ts` (expect +6 manifest rows, no other file changes).
2. `deno task check:aspire-version-parity` → must report `ok:true`, `manifestFresh:true`, `counts.fail:0`. Paste the JSON `counts` line.
3. Commit ONLY `aspire-surface-manifest.tsv` as `chore(aspire): regenerate surface manifest for leaf-1881-fix harness docs`, push the branch, and report the new head SHA. Do not touch product/gate code, README, or workflows; do not amend or rebase `b1aafaaa6`/`0650f6f7b`.
