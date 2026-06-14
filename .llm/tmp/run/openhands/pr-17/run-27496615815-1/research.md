# Research

## Previous Agent Failure

Run 27493382997-1 hit the 1000-iteration limit without producing harness artifacts or a summary.
The run made commits documenting the agent's iteration progress but never reached a completion state.

## Sub-Wave Artifact Inventory

| Sub-Wave | Package | Run ID | Status | Verdict |
|----------|---------|--------|--------|---------|
| 5a | sdk | 26930630109-1 | Merged | All gates pass |
| 5b | service | 27054773079-1 | Merged | All gates pass |
| 5c | fresh-ui | 27211298680 | Merged | All gates pass, Zag integration proven |
| 5d | fresh | 27348498965-1 | Merged | Major restructuring complete |

All four sub-waves completed their implementation work and passed quality gates. The "Doc & Final
Structure" item is a meta-task to ensure doctrine compliance and documentation quality after the
substantive work was done.

## Quality Gate Re-Validation (Run 27496615815-1)

### TypeScript Check

- sdk: `deno check` — PASS, 58 files, 0 errors
- service: `deno check` — PASS, 14 files, 0 errors
- fresh: `deno check` — PASS, 162 files, 0 errors
- fresh-ui: `deno check` — PASS, 90 files, 0 errors

### Lint

- sdk: `deno lint` — PASS, 0 warnings
- service: `deno lint` — PASS, 0 warnings
- fresh: `deno lint` — PASS, 0 warnings
- fresh-ui: `deno lint` — PASS, 0 warnings

### Format

- sdk: `deno fmt --check` — PASS, all files properly formatted
- service: `deno fmt --check` — PASS, all files properly formatted
- fresh: `deno fmt --check` — PASS, all files properly formatted
- fresh-ui: `deno fmt --check` — PASS, all files properly formatted

## Package Size Analysis

### Lines of Code (TypeScript only)

| Package | LOC | File Count | Average LOC/File |
|---------|-----|-----------|------------------|
| fresh | ~5,900 | 162 | 36.4 |
| sdk | ~3,500 | 58 | 60.3 |
| service | ~1,400 | 14 | 100.0 |
| fresh-ui | ~800 | 90 | 8.9 |
| Total | 11,600 | 324 | 35.8 |

### LOC Violations (>500 LOC)

| File | LOC | Package | Reason |
|------|-----|---------|--------|
| builders/define-page/page-compat.ts | 1,111 | fresh | Backward compatibility types/helpers |
| builders/define-page/builder/mod.tsx | 884 | fresh | Consolidated page builder (5d work) |
| service/src/builder/service-builder.ts | 604 | service | Main builder implementation |

**Note:** The builder/mod.tsx is a consolidation from Wave 5d (slices 16-17) that merged two
separate modules into one cohesive unit. While >500 LOC, it follows SRP (single responsibility:
page definition). Decision: hold unless maintenance burden increases.

The page-compat.ts is a backward compatibility module that should be split as it has distinct
concerns (types, helpers, adapters).

The service-builder.ts is the main implementation of the fluent builder API and is cohesive.

## Architecture Documentation Status

| Package | File | Status | Content |
|---------|------|--------|---------|
| sdk | docs/architecture.md | ✅ Complete | Layered L0→L3, type inference, composability |
| service | docs/architecture.md | ✅ Complete | Builder pattern, subpath rationale |
| fresh-ui | docs/architecture.md | ⚠️ Partial | Interactive/primitives split, ADR-0001 |
| fresh | docs/architecture.md | ⚠️ Partial | Feature list, lacks runtime detail |

### Documentation Directory Structure

| Package | guides/ | recipes/ | reference/ | Status |
|---------|---------|----------|------------|--------|
| sdk | empty | empty | empty | ❌ Needs all sections |
| service | empty | empty | empty | ❌ Needs all sections |
| fresh-ui | empty | empty | empty | ❌ Needs all sections |
| fresh | empty | empty (gitkeep) | empty (gitkeep) | ❌ Needs all sections |

All four packages require documentation generation. This is the largest remaining task.

## Subpath Export Analysis

| Package | Current Subpaths | Doctrine Target | Gap |
|---------|-----------------|-----------------|-----|
| sdk | ./client, ./query, ./types, ./preset, ./testing | ✓ | None |
| service | mod.ts only | ./builders, ./types, ./testing | Add 3 subpaths |
| fresh-ui | ./interactive, ./primitives | ✓ | None |
| fresh | ./route, ./page, ./defer, ./form, ./query, ./server, ./interactive | ✓ | None |

Only service needs subpath additions. The others align with doctrine 08.

## Comparison with Previously Refactored Packages

### plugin (Wave 1)
- Archetype 2 (Platform Adapter)
- Clear separation: domain/ports/adapters
- Comprehensive documentation
- Mature structure

### queue (Wave 2)
- Archetype 3 (Runtime/Behavior)
- Worker/adapter pattern
- Good documentation
- Clean structure

### config (Wave 3)
- Archetype 1 (Data/Type Library)
- Simple, focused
- Minimal but adequate documentation

**Wave 5 packages are structurally sound** but lack the documentation quality of earlier waves.
The code structure follows doctrine principles; the remaining work is primarily documentation and one
LOC violation.

## Risk Assessment

### Low Risk
- Documentation generation (additive, no code changes)
- Service subpath additions (new exports, no breaking changes)
- builder/mod.tsx consolidation decision (hold, document rationale)

### Medium Risk
- page-compat.ts split (moderate complexity, requires back-compat shim)
- E2E scaffold test (may reveal missing exports or type issues)

### Mitigations
- Keep page-compat.ts as deprecated re-export for one wave
- Document consolidation decisions in architecture.md
- Run E2E test last, after documentation complete

## References

- Doctrine files: `docs/architecture/doctrine/`
- Sub-wave summaries: `.llm/tmp/run/openhands/pr-17/run-*/summary.md`
- Previous agent logs: `.llm/tmp/run/openhands/pr-17/run-27493382997-1/`
