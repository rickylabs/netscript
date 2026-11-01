# 2026-10-31 — Fresh UI API reference coverage

The docs-site `build` check also runs for drafts and enforces complete export
coverage for Fresh UI. Every added tokens.ts function/type must appear in the
symbol table in docs/site/reference/fresh-ui/index.md in the same pushed slice.
CI run 41177900192 caught the S1 omission; S2 adds all seven new symbols and
moves that reference update forward from the final docs slice. Do not wait for
final carrier generation to add symbol-table coverage.

DTCG 2025.10 modifiers require at least two contexts. Primitives has a single
Value mode and therefore uses a resolver set, not a one-context modifier.
