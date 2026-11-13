# CI renderer bridge and new exact pins

After readied PR2575, core test-3 alone failed:1532passed/1failed/17ignored; check-test aggregate failed only because of it. The design-system bridge used --no-lock, importing the full site config and newly pinned Pagefind1.6.0. A genuinely empty DENO_DIR reproduced default24-hour minimum-age rejection despite a reviewed site lock on disk. Warm/frozen docs build success did not cover this separate lockless caller.

Use --frozen on this affected bridge and its README command, preserving default age policy and the site's reviewed graph. Another empty-cache test then passes; all13renderer fixture cases pass and lock bytes stay identical. Other lockless Markdown/scenario fixtures import only narrow Lume dependencies and never pull Pagefind, so they are unaffected. No global age bypass or broad fixture rewrite is needed. Retain the failure and verify the exact replacement CI head before READY.
