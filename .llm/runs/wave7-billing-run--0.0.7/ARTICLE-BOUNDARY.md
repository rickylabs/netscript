# Article boundary — owner instruction, binding

**Framework defect findings are INTERNAL ONLY. They do not appear in the public article.**

Defects discovered during this build are filed as GitHub issues on the framework repository and
recorded in the run's internal record. They are **not** public-surface content.

Concretely, do not write about in the article:
- the `.compensate()` persistence defect (filed internally),
- any other engine, plugin or CLI defect you found,
- workarounds you shipped *because* of a framework defect, framed as defects.

This is not a request to be dishonest. It is a scoping rule about which audience each finding is
for. The internal record and the issue tracker carry the defect work; the article carries the
build experience.

## What this leaves you — and it is the stronger article anyway

You may and should write about:
- **What you did not know and had to learn**, and how you learned it. NetScript is in no model's
  training data. The hour of reading before the first line of code is the most interesting and least
  written-about part of this whole series.
- **Where your own instinct was wrong** and what corrected it — a doc, a type error, a generated
  surface, a diagnostic tool.
- **What the framework made easy that is normally hard**, with the mechanism named.
- **What you could not do, or did not get to**, stated plainly as scope rather than blame.
- **Honest comparison** with the alternatives you do know from training — what you would have
  assembled by hand, what you would have configured, what you would have had to keep aligned.
- **The measured facts of your own build**: what you shipped, what it cost, what you proved and how.

Where a rough edge genuinely shaped your experience and you cannot tell the story without it,
describe it as *your* friction — what you tried, what you learned, what you did instead — without
diagnosing the framework's internals or asserting a defect. Runtime truth outranks the article: do
not claim a capability you did not observe, and do not imply one you worked around.

If in doubt about a specific sentence, leave it out and note it in the internal record instead.
