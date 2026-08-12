# Worklog: coordinated bump test resilience

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1629-cut-version-derived-tests--w7` |
| Branch | `fix/1629-cut-version-derived-tests` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Design

### Public Surface

- No exported or command surface changes.
- Existing plugin install flows and dependency-closure verifier behavior remain the exercised surface.

### Domain Vocabulary

- **active tree version** — the version generated from the CLI package manifest.
- **cut-local resolution** — first-party imports resolved from the checkout before publication.
- **published strictness** — exact coherent JSR identities required; ranges, splits, and missing packages fail.

### Ports

- Existing filesystem/process test adapters only; no new product port.

### Constants

- `NETSCRIPT_RELEASE_VERSION` — sole active-version authority.
- Arbitrary simulated next version — test datum distinct from live `0.0.6`/baseline `0.0.5`.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Bootstrap research/plan/design and open draft PR | artifact review | `.llm/runs/fix-1629-cut-version-derived-tests--w7/**` |
| 2 | Land red discriminators and derive all active-version assertions | targeted CLI tests | closure/config/verifier tests and evidence/worklog |
| 3 | Localize cut-like first-party plugin install probes while retaining strict missing-package behavior | targeted plugin install tests | plugin install test support/tests and evidence/worklog |
| 4 | Run full gates and disposable 0.0.7 rehearsal; finalize draft handoff | requested gates | run artifacts and PR body/comments |

### Deferred Scope

- Published registry behavior changes — unnecessary and unsafe for this cut-CI defect.
- Plugin doctor/E2E issues #1597 and #1625 — explicitly excluded.

### Contributor Path

Add version-bearing expectations beside inputs derived from `NETSCRIPT_RELEASE_VERSION`; use the
cut-local fixture helper only for tests that intentionally exercise pre-publish first-party source.

### Archetype-6 unchanged concepts

- Spine abstracts, layer-2 abstracts, feature catalog, registries, ports, command constants, and
  composition roots are unchanged because this slice adds no production structure or command.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-13 | 1 | research/design | Re-baselined issue against requested base; PLAN-EVAL N/A because the issue fully enumerates contract, exclusions, discriminators, and gates. |
| 2026-08-13 | 2 | red/green | Disposable 0.0.7 bump produced six literal-version assertion failures; all now interpolate `NETSCRIPT_RELEASE_VERSION`. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| PLAN-EVAL N/A | Small bounded correctness fix with owner-enumerated properties and no open architectural decision. | issue #1629 / run-loop §4 |
| Automatic IMPL-EVAL only | Owner controls draft→ready and explicitly prohibited this session from flipping. | user directive |
| Version fixtures interpolate the generated CLI version | Inputs and expectations share the exercised manifest authority. | targeted bumped-copy failures |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| None | minor | no |

## Gate Results

Pending implementation.

## Handoff Notes

- Inspect strictness preservation and the disposable 0.0.7 full-test evidence first.
