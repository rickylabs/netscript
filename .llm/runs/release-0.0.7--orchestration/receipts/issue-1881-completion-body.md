> Part of #863 (gate 3 of 3). Split out by the Aspire 13.5 topic supervisor so that #863's remainder is
> not stranded when S8 (#1720 / PR #1754) closes **gate 1 only**. Sibling lane: #1880 (gate 2).

## Scope — #863's gate 3, verbatim

> the clean-machine quickstart sequence (as printed in the root README) runs end-to-end without manual
> recovery.

## Why this needs its own lane

#863 carries three `gate:` boxes and **S8 owns gate 1 only** (the bounded, actionable `db init`
timeout). PR #1754 therefore carries `Part of #863` rather than a closing keyword. Gates 2 and 3 had
**no owner** — a search of open issues referencing #863 returned only #1720 and the epic #1712 — so
without explicit lanes #863 would either sit open behind two unassigned boxes or be closed on gate 1's
evidence alone.

## What gate 3 actually asks

This is a **first-run application canary**, using the documented prerequisites:

- **fresh application state** — a new project with no prior `.netscript/` state, generated
  AppHost state, application database data, or run-owned resources left by a previous execution.
  Normal downloaded dependency and Docker image caches are allowed and must not be cleared merely
  to satisfy this gate. Foreign resources remain untouched.
- **documented prerequisites** — the root README must identify the requirements of its chosen
  configuration. Its PostgreSQL/container-cache walkthrough needs a Docker-compatible runtime;
  Docker is not a universal prerequisite for NetScript or Aspire, which can use non-container
  resources. This test does not impose Docker on configurations that do not need it.
- **as printed in the root README** — the commands executed must be the ones a new user actually reads,
  copied verbatim. If the README's sequence needs a step that isn't printed, that is the finding, and
  the fix is the README, not the transcript.
- **without manual recovery** — no retries, no "run it again and it works", no undocumented cleanup
  between steps. Any manual intervention is a failure of this gate even if the end state is correct.

## Acceptance

- [x] The exact command sequence printed in the root README is executed with fresh application state and documented
      prerequisites (ordinary caches allowed), and the transcript is attached.
- [x] The run completes **without manual recovery** — any retry, out-of-band cleanup, or undocumented
      step is recorded as a failure and drives a README or product fix rather than being worked around
      in the transcript.
- [x] Divergence between the README's printed sequence and what actually has to be run is reported as a
      defect against the README.
- [x] Cleanup afterwards proves the four-part zero baseline and **leaves any foreign or unknown-owner
      resource unchanged** — see #1855, where an exact-AppHost cleanup removed a foreign network while
      the suite's own gate reported PASS.

## Boundaries

- Does **not** cover #863's gate 1 (S8 / #1720 / PR #1754) or gate 2 (#1880, health-probe false
  negative).
- Requires the **globally serialized runtime lease** and a clean baseline; do not take one unprompted.
- Depends on gate 2 (#1880) only insofar as an uncorrected `Running`/`Unhealthy` false negative may
  itself force manual recovery during the quickstart — if that happens, it is evidence for #1880, not a
  reason to relax this gate.

## Notes

Milestone matches the parent (#863, `0.0.7`); the coordinator should retarget if this slips past the
canary. This is a natural **canary-admission** gate rather than a per-PR CI gate.

## Final published acceptance — 2026-09-03

Verified against `jsr:@netscript/cli@0.0.7-canary.10`, content `a2d5b8b75083769b946c03ab772e08f2634e2b35`, immutable tag commit `170e33782acf2dfb4bccc3f4e461ae8f5a149f85`.

- [Canary publication and exact production pair](https://github.com/rickylabs/netscript/actions/runs/33762898477): SUCCESS.
- [Pinned production run](https://github.com/rickylabs/netscript/actions/runs/33763460542): all 12 README commands plus cleanup PASS (13/0), full scaffold runtime 104/0, seven-step quickstart plus cleanup/integrity 9/0; no retries.
- [Supplementary same-version README and cleanup proof](https://github.com/rickylabs/netscript/actions/runs/33765493143): 13/0; post-run `appHosts=0, containers=0, volumes=0, networks=0`. Ordinary image/dependency caches retained (six cached images at baseline). This verification-only workflow adds read-only post-run counts; published framework content is unchanged.
- The downloadable production artifacts contain `readme-quickstart-prod-report.json`, command-by-command JSON transcripts, cleanup receipt, and (supplementary run) `readme-post-cleanup-baseline.json`. Dedicated initial baseline had zero resources, so no foreign or unknown resources were present to mutate. There was no manual recovery between README commands. Earlier sequence/product defects were fixed in the linked merged PRs rather than worked around.
