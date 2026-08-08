# Worklog: typed SDK client contribution RFC

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-rfc-sdk-client-contribution--rfc` |
| Branch | `docs/rfc-sdk-client-contribution` |
| Archetype | `2 + 4 + 5 + 6` described; docs-only PR |
| Scope overlays | `SCOPE-docs` |

## Design

This Design checkpoint is intentionally bootstrap-level. It records the artifact and decision
vocabulary before RFC authoring; exact public types and composition laws will replace the pending
items after research and before `status:plan-eval`.

### Public Surface

- `rfcs/0000-sdk-client-contributions.md` — proposed public SDK/plugin contract; no product export
  is added by this PR.
- Pending RFC types/functions: contribution descriptor, definition helper, client-option generic,
  composition/failure types, and plugin declaration carrier.

### Domain Vocabulary

- **Contribution** — a named, versioned client-construction descriptor supplied explicitly or by a
  plugin declaration.
- **Contribution chain** — an immutable ordered tuple whose fold yields one client configuration
  and one inferred per-call context.
- **Reserved owner** — the framework or first contribution that exclusively owns a conflicting
  field/key.
- **Sensitive value** — credential/header/context data whose diagnostics must retain metadata but
  redact value material.

### Ports

- No product port is introduced in this docs PR. The RFC must decide whether the current client-link
  seam is sufficient and what transport ownership remains framework-only.

### Constants

- RFC number remains `0000` until maintainer acceptance.
- Contribution contract version and finite error codes remain pending research; the RFC will name
  them only if their stability value exceeds their compatibility cost.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Activate run identity and evidence skeleton | direct artifact/path review + git status | `.llm/runs/docs-rfc-sdk-client-contribution--rfc/*` |
| 2 | Lock re-baselined research and RFC design | source/API citations + type probes + Plan-Gate checklist | `research.md`, `plan.md`, `worklog.md`, `context-pack.md`, `drift.md`, `rfcs/0000-sdk-client-contributions.md` |
| 3 | Prove docs/JSR/GitHub readiness and hand off | applicable docs/RFC gates + live PR metadata reconciliation | RFC, run artifacts, `final-handoff.md`, draft PR body/comments/labels |

### Deferred Scope

- Framework implementation and migrations — separate post-acceptance issues/PRs.
- RFC number and decision state beyond Draft — maintainer-owned lifecycle.
- Formal/cross-RFC evaluator execution — root orchestrator owns existing external sessions.

### Contributor Path

Read the accepted RFC's terminology and invariants, then follow its staged issue decomposition:
contract/type surface first, composition/runtime second, two first-party consumer proofs third,
generated/scaffold ergonomics and documentation last.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-08 | 1 | bootstrap | Read requested skills, RFC process, harness workflow/gates/evaluator protocols, selected archetypes, doctrine 01–11, relevant debt, and the full carried-in proposal. |
| 2026-08-08 | 1 | identity | Verified exact branch/base, clean tracked tree, daemon launch artifact, native WSL path, explicit-refspec rule, and valid GitHub credential. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Treat RFC authorship as Plan & Design, not framework implementation. | The deliverable is the ratifiable plan; no product code is authorized. | `rfcs/README.md`; task brief; harness run loop |
| Use Archetypes 2/4/5/6 plus `SCOPE-docs`. | Those are the current assigned profiles of the implementation surfaces the RFC describes. | doctrine 06/11; harness archetypes |
| Do not launch or repair a session. | The existing thread is proven and the owner forbids a rival; runtime-controller registration absence does not imply daemon failure. | `codex-thread-ids.md`; codex-wsl-remote skill |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Runtime controller did not match the launch-generated active thread identity. | minor | yes |

## Gate Results

Gate execution begins after RFC authoring; bootstrap evidence is recorded above.

## Handoff Notes

- External reviewers should challenge whether each proposed field has a named extension axis and
  whether both first-party proofs exercise it.

