# Worklog — README minimum dependency age

## Design

### Public surface

The public surface is the exact printed global install command in the root README, package README,
and docs Quickstart. No TypeScript export or runtime behavior changes.

### Domain vocabulary and constants

- `README_QUICKSTART_EXPECTED_COMMANDS[0]` is the root README execution contract.
- `QUICKSTART_DOCUMENTED_COMMANDS[0]` is the docs Quickstart display contract.
- `EXPECTED_INSTALL_ARGV` proves the subprocess receives the parsed public command verbatim.

### Ports, permissions, and generated outputs

No new port, permission, adapter, extension axis, generated project output, or composition change.
The existing README parser and recording spawn seam prove source-to-argv provenance. Docs carrier
generators may refresh derived assets after the source prose changes.

### Archetype 6 checkpoint

The package's five spine abstracts, layer-2 abstracts, feature catalog, registries, command names,
exit codes, composition root, and permission contract are unchanged. F-CLI structural checks are
therefore manual N/A for the delta; the semantic command/drift tests and doctrine gate remain the
applicable evidence.

### Commit slices and contributor path

The ordered slices are in `plan.md`. Future install-command edits begin with the two centralized
expected-command constants, use RED drift tests against unchanged docs, then update all printed
surfaces and regenerate carriers.

### Deferred scope

No workflow, release publication, runtime suite, install shim, harness injection, or policy redesign.

## Plan gate

`PLAN-EVAL: N/A` — this is a small mechanical contract synchronization with exact owner-decided
text, scope, assertions, gates, and prohibited alternatives.

## Progress

| Date | Slice | State | Evidence |
| --- | --- | --- | --- |
| 2026-09-03 | 0 | complete | Clean exact baseline verified; required skills, doctrine, archetype, docs overlay, and gate references read. |

## Gate results

Pending.
