# Stage I — Implementation handoff briefs (process-manager epic #510)

> **AUTHORITY: GitHub is the single source of truth.** Epic #510, children #511–#546. Every brief
> below points at live issues; the design packs under `research/design/` (frozen on branch
> `plan/process-manager`, PR #504) are the rationale of record. If an issue and a design pack
> disagree, the issue wins; record the divergence on the issue.

## How to start any slice (paste-ready preamble)

Every implementation prompt MUST begin with:

```text
use harness

## SKILL
- netscript-harness (run loop, lanes, gates, evaluator protocol)
- netscript-doctrine (archetypes, thinness law, public-surface bar)
- netscript-pr (branch/PR/issue process; Closes #<child> in the PR body — exactly one child per PR)
- netscript-deno-toolchain (deno doc/why/outdated; deps wrappers; publish bar)
- netscript-tools (scoped check/lint/fmt wrappers, gate evidence, lock hygiene)
- netscript-cli (for PM-0/PM-21..28 CLI slices)
- deno-fresh (for PM-29/32/33 console slices)
- aspire (for PM-23 and any e2e that starts Aspire)
- rtk (token-optimized git/gh/grep)
```

Then: read the child issue (scope + acceptance = the gate), its design-source section, and the
relevant archetype/overlay. Branch `feat/pm-<n>-<slug>` off current `main`; PR body carries
`Closes #<child>` + `Part of #510`.

## Lane routing (per repo policy + lane-policy.md)

- **Framework source slices** (`packages/`, `plugins/`) → **WSL Codex daemon-attached** (Tier D),
  launched only via `.llm/tools/agentic/` + the codex-wsl-remote skill; mobile-visibility proof
  required (thread id + managed daemon).
- **Docs slice #541 (PM-30)** → Claude dynamic workflow permitted (documentation-authoring
  exception; Opus medium, never Fable in workflow stages), OpenHands validates.
- **Evaluators:** PLAN-EVAL not needed again (this epic's plan already passed); per-PR
  **IMPL-EVAL = OpenHands qwen-3.7-max, separate session, one loop** (fix + comment, no
  re-dispatch). Adversarial pre-review via WSL Codex before IMPL-EVAL where the slice is
  non-trivial.
- Supervisor reviews every slice substantively before sign-off (A1); no lane self-certifies.

## Wave order (dependency-honest; issues carry exact deps)

| Wave | Issues | Theme | Notes |
| --- | --- | --- | --- |
| W0 | #511 (PM-0) | deploy-target fix-forward | **beta.6**; independent; ship first |
| W1 | #512–#519 (PM-1..8) | contract + engine | #512 first (everything hangs off it); then 514/515/516 parallel; 517→519 |
| W2 | #520–#525 (PM-9..14) | control plane | #520 (18-route contract, normative D2 §1.3) → #521 → 522/523/524 parallel → #525 |
| W3 | #526–#531 + #545 (PM-15..20, 34) | OS adapters + deploy-core | #531 (deploy-core extraction) is the big structural one — promotes F-DEPLOY gates; #545 is stable-milestone |
| W4 | #532–#535 (PM-21..24) | config + resolvers + scaffold | E1 law: no new target key |
| W5 | #536–#544 (PM-25..33) | CLI + console surfaces | #542 (PM-31) = merge-readiness gate, run once per wave not per slice; #543/#544 soft-gated (see issues) |
| Backlog | #546 (PM-35) | clustering | do not start; #345 (re-scoped) depends on it |

## Design-pack map (read only what the slice needs)

| Pack | Feeds |
| --- | --- |
| `d1-supervision-engine-core.md` | #513–#519, #530, #546 |
| `d2-control-plane-contract.md` | #520–#525 |
| `d3-deploy-integration-os-adapters.md` | #511, #526–#531, #545 |
| `d4-cli-admin-console-surfaces.md` | #536–#540, #543, #544 |
| `d5-config-scaffold-docs-rfc.md` | #512, #532–#535, #541 |

## Standing laws every slice inherits

1. Type-soundness: only the 2 accepted casts; contract seam via `BASE_PLUGIN_CONTRACT_ROUTES`
   spread + `satisfies`.
2. Wrap-don't-reinvent: `Deno.Command`, `@std/*`, `@netscript/cron` (behind a port — see
   #517 comment: upstream watch denoland/deno#33965 `Deno.cron.persistent`), existing renderers.
3. No god-daemon: engine = library; control plane = sibling OS unit (C1 — the architecture's
   spine; #521 asserts it in tests).
4. Scaffold emits only typesafe glue (#157 law) — #535.
5. Scoped wrappers (`--ext ts,tsx`) for check/lint/fmt evidence; `deno doc --lint` on the full
   export map for JSR packages (`@netscript/deploy-core`, `@netscript/plugin-process-manager-core`).
6. Cross-epic seams: `CommandInvokePort` — dashboard (#400) defines first, pm consumes
   (bidirectional fallback recorded on #400); the DDX-17 panel (#544) is an adapter and slips if
   CR-DDX-HOSTAGNOSTIC is unresolved.

## First actionable batch (when implementation begins)

1. #511 (PM-0) — independent, beta.6, small: the natural pipe-cleaner slice.
2. #512 (PM-1) — the contract; unlocks the whole DAG. Includes the 1-line workers-core
   `WorkerTaskPermissions` re-export precursor (evaluator-noted, bounded).
3. #513 (PM-2) — telemetry domain mint; parallel with #512.
