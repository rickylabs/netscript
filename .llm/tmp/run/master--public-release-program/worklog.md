# Worklog: NetScript Public Release Program (master)

## Run Metadata

| Field | Value |
|-------|-------|
| Run ID | `master--public-release-program` |
| Branch | `master` |
| Archetype | N/A (program orchestration) |
| Scope overlays | `SCOPE-docs.md` |

## Design

This is a docs/orchestration run; the "public surface" is the set of program
documents and the handover contract, not code.

### Public Surface

- `RELEASE-PROGRAM.md` — the umbrella authority and handover spec.
- `notes/TOOLCHAIN-2.8.md`, `notes/ASPIRE-13.4-13.5.md` — referenced by S2/S4.
- The supervisor run cards (§ 10) and handover protocol (§ 11) — the API the
  next agent consumes to produce S0–S6 runs.

### Domain Vocabulary

- **Supervisor** — long-lived integration branch + worktree owning one
  implementation group; one harness run.
- **Sub-branch** — per-unit worktree merging up into a supervisor.
- **Run card** — compact seed (§ 10) the next agent expands into a full run.
- **Producer vs consumer** — producer repo holds package sources (`deno publish`);
  consumer scaffold references `jsr:@netscript/*`.

### Ports

- None. No external abstraction is introduced by this run.

### Constants

- **SUPERVISORS** — `S0 repo-genesis`, `S1 package-quality`, `S2 toolchain-2.8`,
  `S3 cicd-release`, `S4 aspire-e2e`, `S5 docs-site`, `S6 launch-alpha-0`,
  `S7 prisma-next` (tracked).
- **VERSION_LINE** — `0.0.1-alpha.0` lockstep.

### Commit Slices

| # | Slice | Gate | Files |
|---|-------|------|-------|
| 1 | Master program doc | Link integrity + terminology | `RELEASE-PROGRAM.md` |
| 2 | Harness wrappers | Template conformance | `plan.md`, `worklog.md`, `context-pack.md`, `drift.md`, `commits.md` |
| 3 | Toolchain notes | Source alignment to primary docs | `notes/TOOLCHAIN-2.8.md`, `notes/ASPIRE-13.4-13.5.md` |
| 4 | Promote supervisor workflow to harness | Wiring resolves from `.llm/harness/` | `.llm/harness/workflow/{supervisor,escalation}.md`, `.llm/harness/templates/{phase-registry,agent-briefing}.md`, `activation.md`, SKILL |

(Commits are optional for this docs run; not executed unless the user requests.)

### Deferred Scope

- Producing each S0–S6 `plan.md` — intentionally deferred to the next agent per
  the handover protocol.
- Any framework code, extraction execution, or workflow YAML — owned by
  supervisors.

### Contributor Path

A new agent reads `RELEASE-PROGRAM.md` § 10 (its supervisor's run card) + § 11
(handover protocol), then follows `workflow/activation.md` to instantiate the
supervisor run from `templates/`.

## Progress Log

| Time | Slice | Step | Notes |
|------|-------|------|-------|
| 2026-06-04 | 1 | Wrote `RELEASE-PROGRAM.md` | Reused locked-decision content + diagram + run cards |
| 2026-06-04 | 2 | Wrote harness wrappers | plan/worklog/context-pack/drift/commits |
| 2026-06-04 | 3 | Wrote toolchain notes | Deno 2.8 + Aspire 13.4/13.5 |
| 2026-06-04 | 4 | Reframed § 9–11 to phase groups; promoted supervisor workflow into harness | per PR #96 review |

## Decisions

| Decision | Reason | Source |
|----------|--------|--------|
| Version `0.0.1-alpha.0` lockstep | User-locked | user direction |
| Repo `rickylabs/netscript` | User-locked | user direction |
| Docs renderer Lume | Fresh has no native static export (discussion #254) | user + fetched source |
| Aspire 13.4 now / 13.5 native Deno | CLI already scaffolds TS apphost; on 13.2.2 today | user + `AppHost.csproj` |
| Extraction reuses `netscript-dev` | source-copy engine already exists | `maintainer-cli.md` |
| Add `.agents/rules/*.mdc` | machine-enforce doctrine | `prisma-next/.agents/rules` |
| Phase-group grain + promote supervisor workflow to harness | broader/logical breakdown inherited natively | PR #96; user |

## Drift

| Drift | Severity | Logged in drift.md |
|-------|----------|--------------------|
| Extraction reframed (CLI eject vs bespoke script) | significant | yes |
| Aspire reframed (bump vs C#→TS migration) | significant | yes |
| Version stays `0.0.1-alpha.0` (not `0.9.0-alpha.1`) | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
|------|------------------|--------|-------|
| Link integrity | Cited local paths exist | PASS | maintainer-cli.md, prior run dir, harness templates, AppHost.csproj all verified this session |
| Terminology | Archetype/overlay names vs harness | PASS | Names match `archetypes/README.md` + `SCOPE-*` |

### Fitness Gates

| Gate | Result | Evidence | Notes |
|------|--------|----------|-------|
| Source alignment | PASS | Claims cite maintainer-cli.md, AppHost.csproj (13.2.2), Deno 2.8 blog, JSR docs, prisma-next contents API | SCOPE-docs |
| Scope separation | PASS | Program declares target-state; defers to doctrine as authority | SCOPE-docs |
| Drift log | PASS | `drift.md` seeded with 3 entries | SCOPE-docs |

### Runtime Gates

| Gate | Result | Evidence | Notes |
|------|--------|----------|-------|
| N/A | N/A | docs run | no runtime behavior |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
|----------|--------|----------|-------|
| Next agent (S0–S6 producer) | N/A | § 11 handover protocol | proven only when a supervisor run is produced |

## Handoff Notes

- Start at `RELEASE-PROGRAM.md` § 10 (run cards) + § 11 (handover protocol).
- S0 is the program gate — produce it first; it unblocks S1/S2/S3.
- Do not rewrite the prior package-quality run; it is S1.
