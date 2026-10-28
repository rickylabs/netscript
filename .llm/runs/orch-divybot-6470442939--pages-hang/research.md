# Incident evidence and timeout sizing

The build log for [run 40650873089](https://github.com/rickylabs/netscript/actions/runs/40650873089)
shows snippet startup downloading `@std/text` metadata at 07:46:51Z and sources at 07:48:08Z,
then no further output until cancellation at 12:57:33Z. There is no compiler/census output.
This identifies an unbounded dependency-loading wait before checker execution; the log does not
identify which individual HTTP request or cache operation remained pending. The extractor parses
text and never runs snippet bodies. The compiler additionally had an unbounded combined
`Deno.Command(...).output()` with inherited stdin.

The fix therefore bounds both bootstrap (240 seconds, registry-independent launcher imports) and
each compiler invocation (30 seconds plus 250 ms termination grace). Compiler entrypoints now run
separately, preserving page-local module dependencies and mapping diagnostics to original fences.
The source walker’s git children also receive a deadline and EOF. Native Node subprocess APIs
provide POSIX detached groups without adding a setsid dependency; Windows uses taskkill /T.
Nested worker termination forwards to the compiler’s separate group. Environment permission is
needed by Deno’s Node spawn API to inherit the compiler environment, including its cache settings.

NetScript MCP `find_guidance` and `search_docs` were called through the local CLI stdio server.
Relevant guidance: absent child input uses null stdin; timeout cleanup itself must be bounded.
No established documentation-compiler timeout abstraction was returned. Existing gate process
runner only kills the direct child and cannot satisfy the process-group requirement.

## Successful Pages sample

Timings come from the GitHub jobs API, counting only completed successful build jobs with executed
snippet steps, not queued time or policy-skipped builds.

| Run | Build seconds | Snippets seconds | Exports drift seconds |
| --- | ---: | ---: | ---: |
| 40682405332 | 58 | 8 | 16 |
| 40685559127 | 57 | 8 | 15 |
| 40687615531 | 58 | 12 | 17 |
| 40697853621 | 51 | 8 | 16 |
| 40698210442 | 49 | 9 | 16 |

Build timeout: 10 minutes, versus maximum 58 seconds in this sample. Snippet-step timeout:
5 minutes, versus maximum 12 seconds in the sample, allowing the new per-entrypoint checking cost
and cold-network margin. The 240-second internal bound leaves almost a minute for cleanup before
the step deadline. Locally the main corpus with independent compiler invocations passed in
42.950 seconds; the remaining site build, source/render checks, links and caveats took 9.734 seconds.

## Exports drift investigation

The incident’s 745.50-second step spent 205.67 seconds before printing reference-page coverage
(dependency downloads visible), then 539.82 seconds between coverage reporting and PASS.
`check-exports-drift.ts` performs sequential `deno doc --no-lock --json` subprocesses for complete
symbol mappings and buffers each child’s output. The logs cannot allocate that silent interval
between network, graph construction, or individual entrypoints. This is abnormal against the
15–17-second successful CI sample and a 4.148-second warm local reproduction (exit 0).
No credible one-line performance fix was established; preserve drift semantics and report the
performance finding separately on #2454 for follow-up.
