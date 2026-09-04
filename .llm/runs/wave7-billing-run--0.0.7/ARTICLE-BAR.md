# The prose bar — derived from all 17 prior wave articles

An audit read every article in the series plus the founder's reference post. This is what beats them.

## The ten rules

1. **Open on a specific moment with an identifier**, not your product name or the framework version.
   Best in corpus: *"At 01:55 UTC, a background job told me that invoice `VEL-2608-005` was wrong."*
   Banned: "I built X on NetScript 0.0.N"; any opening whose first subject is the article.
2. **State a belief in the first 150 words and break it before halfway.** The form that works:
   *"I expected the money arithmetic would be the fight and the framework the easy part. I had it
   backwards."* If the expectation is never revisited, delete it — one article states one and
   abandons it, which is worse than none.
3. **Every claim gets a number, a transcript, or a screenshot — and say which.** Terminal output is
   the strongest and most under-used evidence: paste the `exit 0 … successfully` beside the `ls`
   showing nothing happened and let the reader see the lie. Never "significantly", "seamlessly",
   "100% of".
4. **Headings are findings, not topics.** *"Two bugs a green test suite did not find."* *"Healthy was
   the least interesting status."* A reader should get your argument from the table of contents
   alone. Never number sections; never write "System Architecture" or "Implementation".
5. **Separate "I did not understand this" from "this is broken", explicitly, and fill both piles.**
   The highest-integrity sentence in the corpus is an author reporting their own inattention with a
   count: *"the workspace docs had warned me twice."*
6. **Introduce every code block with the claim it proves; keep it under 25 lines.** Hoist code into
   `export const` at the top and use `<Code path= lang= code={…} />`. Never paste a 45-line schema.
7. **Every image caption makes a falsifiable claim about the frame.** Good: *"Light and dark are two
   different images, not one image with the lightness inverted."* Bad: *"Figure 2: Topology."*
   Target 10–12 images: light/dark pairs, **two drawn diagrams** of mechanisms you cannot
   photograph, **one failure state**, one interaction mid-gesture. No browser/service/database
   box-and-arrow diagram — everyone ships one and none says anything. **Disclose a fixture in the
   body, never quietly in a caption.**
8. **Cite something.** Zero of seventeen articles used `Citation` or `SourceEmbed`; one used
   `Sources`. The house style carries 17 sources. Matching a third of that puts you alone.
9. **Compare concretely and concede specifically.** Name the alternative, describe how it works in
   its own terms, put real values in a table, then say where it wins outright. The standard:
   *"on raw latency and multi-tenant isolation, Windmill is ahead and it is not close"* and
   *"all of them are easier to hire for."*
10. **End with a scoped yes/no and a numbered list of where confidence stops**, each naming a
    mechanism, at least one telling the reader what *not* to conclude. Then one line that lands the
    title. *"The board, meanwhile, is still right at 6am."*

## What NONE of the 17 did — the open ground

- **Nobody wrote about the reading.** Every article says "NetScript was not in my training data" and
  then cuts to the build. **Not one shows what that hour looked like** — which doc answered which
  question, which sent them the wrong way, the first wrong guess and what corrected it. This is the
  single most obviously missing article, and it is the one thing these authors have that a human
  blogger does not.
- **Nobody made the machine-readable docs the argument.** Three articles brush against it — the MCP
  server, 178 doc files, 21 diagnostic tools, a symptom-indexed troubleshooting guide — and all
  three walk away. One says asking the MCP what `defineService` accepts *"replaced a hand-rolled
  security surface with a shipped one, and it is the strongest argument I saw all day for shipping
  machine-readable docs beside the code"* — then moves on.
- **Nobody quantified the learning curve.** No commands run, no failure count, no time-to-recover.
- **Nobody wrote about cost.** No tokens, no dollars, no wall clock, no retries.
- **Nobody read the other articles.** The same missing `import '@netscript/kv/redis'` kills a
  processor in three separate builds across three releases; `db migrate` is a silent no-op in three
  more. A post naming that pattern beats any single build report.
- **Nobody tested the founder's own thesis** — that nothing yet hands you framework, standards and
  deployment without giving one up. Seventeen articles on the framework claiming to close that gap;
  two glance at it in a throwaway sentence.
- **Nobody wrote a bad review.** Seventeen "yes, with caveats". That uniformity is itself a finding.
- **Nobody ran the control**: the same feature built twice, once here and once on
  Next + tRPC + Prisma + Inngest, with file counts, config surface and failure modes side by side.

## Media profile of the best article

12 images · 5 `Figure` · 2 `Gallery` · 10 `Code` · 2 `Pull` · plus a `Sources` block.
Its captions do argumentative work, e.g. *"The third frame is the framework's own component gallery
in the same skin — proof the identity is a token layer, not a pile of overrides."*
