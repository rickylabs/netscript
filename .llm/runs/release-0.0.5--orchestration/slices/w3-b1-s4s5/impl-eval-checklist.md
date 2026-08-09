# IMPL-EVAL checklist for the #1102 completion PR (S4A/S4B/S5)

Carried from the PLAN-EVAL PASS at `71c0a29c2`. These are the things the plan's own gates do **not**
prove, so the final evaluation must check them directly.

1. **The `cache-freshness` alias diff must show a real family, not one 5-gram.**
   Every planned gate still passes if the writer adds only `hitting my service every render` — the
   quoted paraphrase minus "avoid my". The evaluator's recommendation: prefer short general aliases
   (`every render`, `every request`, `hitting my service`) over the single long phrase. Spot-check at
   least **one unquoted render/request paraphrase** (e.g. `avoid refetching on every render`) against
   the built corpus and report where it ranks. If only the quoted sentence routes, row 3 is not
   honestly satisfiable and `Closes #1102` must not be used.

2. **The inverted-comparator mutation must have been executed, and its failure must name the
   score-only row specifically.**
   Not "the suite failed" — the message must identify that row. This is the only thing closing the
   residual exact-score-tie escape, where inversion would be a no-op if the top three were exactly
   tied. An assertion about concept counts is not a substitute.

3. **The score-only row's expected order must be observed, not assumed.**
   The PLAN-EVAL did not empirically reproduce that `pick direct application ownership versus a
   reusable integration` currently ranks its three `use-a-second-database` sections in the stated
   order. If implementation found otherwise, there must be a recorded drift entry — **not** an edited
   expectation. An expectation quietly rewritten to match runtime output is a blocking finding.

4. **Row 6 activation must be the real path**, not the tool appearing in a listing:
   `agent init --with-docs` → `.netscript/docs` → `agent mcp` → `find_guidance("build a real
   service-backed UI")` → rank-1 `llms#task-router`, plus the activation sentence present in
   initialize instructions, generated `AGENTS.md`, and generated skills.

5. **Locked inputs unchanged**: original five evaluation rows and all 15 citations byte-for-byte; no
   ranking constant retuned; embedded assets byte-unchanged at 253,535 bytes / 12 documents below the
   262,144 cap.

6. **Serialized runtime evidence admissible**: exactly one
   `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`, preceded by a committed
   expensive-gate ledger grant row, bracketed by leak checks. A run without a preceding grant row is
   inadmissible regardless of its result.

7. **Closure semantics**: `Closes #1102` only if all seven acceptance rows are honestly satisfied at
   the final head. Otherwise reference without a closing keyword and state what remains — the shape
   #1404 used.
