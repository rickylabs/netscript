# "Medusa-inspired writing" — a reusable style contract for the Opus design agent

This distills `medusa-teardown.md` + `other-tutorial-ecosystems.md` + the already-locked NetScript
voice rules (`docs/site/_plan/08-decisions-locked.md`, `specs/01-ratified-decisions.md`) into a
single checklist the downstream Opus design agent (Stage D) can apply directly per chapter, without
re-deriving it.

## Structural contract (per chapter)

1. State the chapter's single observable goal in one sentence before anything else ("By the end of
   this chapter you will have a running X that does Y").
2. State exact prerequisites/versions up front (Deno version, Aspire CLI, DB engine choice) — Rails
   Guides pattern.
3. Sequence by content type, not uniformly:
   - Procedural/setup steps: command block, then one or two sentences on what just happened and why
     it matters — command precedes explanation.
   - Genuinely new concept/mental model: name the concept, one-paragraph explanation, then the code
     that embodies it — concept precedes code (Medusa Fundamentals pattern). Do not force
     exercise-before-explanation onto content that is a new mental model, not a mechanical step; that
     produces confusion, not more "hands-on" feel.
4. Close every discrete step/section on a literal, observable checkpoint: a terminal output block, an
   HTTP response body, a rendered screenshot/description, a passing command exit — never a
   comprehension-style checkpoint ("you should now understand...").
5. Show directory-structure diffs when new files land, not just the file content in isolation.
6. Version-bound any claim that could drift ("As of NetScript 0.0.1-beta.N...") instead of asserting
   permanence — matches both Medusa's pattern and NetScript's own locked "Alpha, API subject to
   change" framing.

## Voice contract (already locked, restated here for convenience — do not treat as newly decided)

- Warm "we", second person for the reader ("you'll build...").
- Sparing humor; no body emoji.
- No hype adjectives ("blazing", "revolutionary", "seamless").
- **No "honesty/candor" framing** — never write "to be honest," "candidly," "we won't pretend," etc.
  If a real limitation must be surfaced (e.g., a plugin still being an app-level convention, not a
  first-party guarantee), state it as one clean factual callout: what's true today, full stop — no
  meta-commentary about the act of disclosing it.
- No unshipped-capability claims, no runtime-throughput-leadership claims. Positioning is AI-agent
  build-efficiency, never raw performance. Any prose draft that reaches for a speed/scale claim must
  be rewritten in build-efficiency terms (e.g., "one scaffold gives your coding agent a working
  contract, worker, and dashboard to extend" rather than "handles millions of requests").

## Anti-patterns to flag if seen in existing tracks or new drafts

- A chapter that explains a concept for several paragraphs with no code and no checkpoint before the
  next chapter (explain-only chapter) — violates the exercise-first mandate outright.
- A chapter whose only "checkpoint" is a screenshot with no reproducible command — not verifiable by
  a reader following along locally.
- Reference-grade material (full API option tables) embedded inside a tutorial chapter instead of
  linked out to the Reference lane — a Diátaxis violation already flagged by `doc-architecture-patterns.md`.
- Any "Extend" or "in a real app you would..." aside that reads as an apology or a candor-flag rather
  than a plain factual statement of current scope.
