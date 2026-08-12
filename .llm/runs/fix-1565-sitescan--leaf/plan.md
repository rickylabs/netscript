# Plan — #1565 snippet walker

## Locked decisions

1. Always exclude a directory named `_site`, independent of Git availability, to preserve correctness in archives and metadata-free checkouts.
2. Also use `git check-ignore --quiet` for other directories when Git is available; a missing Git executable or ordinary no-match leaves source traversal operational.
3. Keep census, floors, exemptions, marker grammar, packages, and plugins untouched.
4. Preserve the existing Pages workflow order assertion and record the dispatch/baseline mismatch as drift.

## Risk register

- Over-broad exclusion could hide source: exact before/after census plus a real-source unclosed-fence negative control guard this.
- Git may be absent: `_site` has a Git-independent fallback and `NotFound` does not abort traversal.
- Generated paths may leak after regression: diagnostics explicitly identify `_site` as generated Lume output.

## Deferred scope

- No release, scaffold, package/plugin, README/reference, agent-docs, or `.llm/tools/release/**` changes.

