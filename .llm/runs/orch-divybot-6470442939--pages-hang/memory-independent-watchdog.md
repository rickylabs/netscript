# Timeout tests need their own cleanup and bound

`snippet-test-watchdog.ts` has a five-second guard independent of runSnippetProcess. Fixtures
record their owned groups before executing their body; the watchdog kills those groups itself
and drains pending operations. Nested workers and compilers both need records.

A post-await elapsed-time assertion alone cannot detect a missing deadline: the assertion is
never reached. Prove the guard by temporarily replacing the production timer delay with 60 seconds
and running the never-exits test through run-deno-test.ts. Expect exit 1 with independent-watchdog
text after five seconds plus compiler/startup overhead. Restore the mutation in finally.

Also disable only production group SIGKILL and run the inherited-pipe descendant test. It must
fail on the surviving marker. Keep the independent guard and fixture cleanup active for this test.
Raw process records and full receipts stay outside Git; public summaries contain no runtime ids.
