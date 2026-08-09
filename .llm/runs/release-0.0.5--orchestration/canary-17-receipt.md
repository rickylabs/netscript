# C17 receipt — `0.0.5-canary.17`

## Green pair

- **Publish:** [run 31288360277](https://github.com/rickylabs/netscript/actions/runs/31288360277),
  `canary 0.0.5 from main`, exact source `aa8e151e65939ecd789c82e45b22b6338a8d8ce8`, job
  `publish-and-prove` **success**, no failing steps.
- **Pinned production E2E:**
  [run 31288479430](https://github.com/rickylabs/netscript/actions/runs/31288479430), dispatched by
  the publish at the canary tag, **success**.
- **`release/canary-pair` on `aa8e151e6`: `success`** — "Canary 0.0.5-canary.17 publish + pinned
  production E2E passed", targeting the pinned child run.
- **GitHub prerelease:**
  [NetScript 0.0.5-canary.17](https://github.com/rickylabs/netscript/releases/tag/v0.0.5-canary.17),
  published `2026-08-09T01:32:27Z`, non-draft prerelease. Latest badge untouched.

Tag identity: annotated tag object `550153ac3`, release commit `64778308d`, tree `55a680d12`.

## Cadence tool — explicit per-check records, quoted

`release:canary-label` ran **inside** the workflow with the publish step's own output version
(`--published-version 0.0.5-canary.17 --head aa8e151e6…`), so the label is derived, not transcribed:

```
published-version         PASS: 0.0.5-canary.17 exists on @netscript/cli
merge-history-payload     PASS: populated: inspected 7 commit(s); 7 PR(s), 4 closed issue(s)
                                from fac9e339042c…..aa8e151e659…
label-application         PASS: canary:0.0.5-canary.17 applied to 11 item(s)
release-note-publication  PASS: created prerelease v0.0.5-canary.17; make_latest=false
drift                     PASS: 21 label(s) match 32 published version(s)
```

**The tool's independently computed payload — 7 commits, 7 PRs, 4 closed issues — matches the
payload frozen in `cut-trace.md` before the cut, exactly.** That agreement is the point of computing
membership from merge history twice by different means.

Verified applied: `canary:0.0.5-canary.17` on all seven payload PRs (#1391, #1337, #1347, #1215,
#1394, #1393, #1395) and on all four issues they closed (#1325, #1327, #1202, #1329).

## Readiness evidence captured before dispatch

`publish:readiness` all PASS — publish-set (35 effective members matching workspace declarations,
`packages/bench` and `packages/cli/e2e` correctly excluded), markdown-pins, lockstep-residue,
versionless-specifiers across 2,303 framework source files, new-packages (0 first-publish),
first-publish, provisioning-dry-check, import-attribute-preflight. `release:preflight` PASS on all
four checks.

## Hygiene

No local publish occurred; the cut ran entirely through the checked-in OIDC workflow. The canary tag
is preserved as provenance. Foreign container `redis-jfgcbtaf` (owned by
`/home/codex/repos/w6-review-desk`) remained untouched throughout the wave, as every lane recorded.

## Boundary

This pair proves the **published** graph at `aa8e151e6`. It does **not** discharge #1343 — the
installed-consumer smoke from a clean directory outside the framework checkout — which remains an
orchestrator-executed F-stage row and is now executable against this canary.
