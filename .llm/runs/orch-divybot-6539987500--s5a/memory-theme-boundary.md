# 2026-10-31 — Portable theme boundary

Do not send a snapshot-values-only PR to packages/fresh-ui/tokens/figma:
provenance hashes, DTCG source freshness, embeddings and registry copies also
need regeneration. Export PRs instead update a previously seeded standalone
registry theme item in the user's theme repository. Validate the whole changed
item, not just selected snapshot files. Code owns names: all 2,186 current
variables with WEB syntax match role-manifest after the four migrations;
there are zero unknown WEB names across all nine collections.

Install imported sources persistently and set tokens.config.json sourceRoot;
otherwise tokens build silently restores bundled values. Reject custom roots,
retain semantic overrides, and permit switching previously lock-owned roots.
