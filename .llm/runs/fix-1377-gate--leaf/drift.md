# Drift Log: #1377 gate half

Append-only.

## 2026-08-12 — strict direct-subcommand census finds four additional prose gaps

- **What:** Executing the existing public command catalog and checking root/immediate-child paths
  against the public CLI reference surfaces found four paths with no exact occurrence:
  `netscript deploy start`, `netscript deploy stop`, `netscript deploy status`, and
  `netscript deploy uninstall`.
- **Source:** `createPublicCommandRegistry()` materialized through `PublicCliCommandCatalog`; focused
  search over `docs/site/reference/cli/commands.md`, `docs/site/cli-reference.md`, and `docs/site`.
- **Expected:** PR-C had landed all content required for the strict subcommand gate to be green.
- **Actual:** 87 of 91 root/direct-child paths have an exact occurrence; these four do not.
- **Severity:** significant.
- **Action:** defer to PR-C/orchestrator as a sequencing dependency. PR-D will neither author the
  prose nor weaken the predicate. PLAN-EVAL must assess the boundary before implementation.
- **Evidence:** `research.md` finding 9; `plan.md` D-7.

## 2026-08-12 — PLAN-EVAL corrects corpus scope, unblock ownership, and path-consumer premise

- **What:** The first plan left the command corpus implicit, treated four missing deploy rows as an
  ownerless external dependency, and inherited a false claim that the accuracy checker hardcodes
  the short sagas reference path.
- **Source:** fallback PLAN-EVAL `FAIL_PLAN` on `5ba4bc339`; independently confirmed corpus counts
  25/25/4 and checker search.
- **Expected:** A decision-complete plan whose S2 can reach green and whose alias decision rests on
  true consumers.
- **Actual:** `commands.md` and `cli-reference.md` each miss 25/91 while their union misses 4/91;
  no open content owner existed; `check-accuracy-and-discoverability.ts` has no sagas path.
- **Severity:** significant.
- **Action:** fix. Lock the two-page union, ratify it in the reference index, let S2 add the four
  bounded rows, require structural longest-path matching and exact 91 equality, and restate the
  alias rationale without the retracted premise. This entry supersedes the earlier action that
  deferred the four rows externally; the original finding remains as historical provenance.
- **Evidence:** revised `research.md` findings 9/11 and `plan.md` D-1/D-4/D-6–D-9 on the
  superseding plan head.
