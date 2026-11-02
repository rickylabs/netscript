# Empty durable chat readiness

A live append stream can be empty forever. Do not gate the first prompt on
receiving a chunk when emitSnapshotOnSubscribe is disabled. Complete an
authenticated finite catch-up, validate its response offset, replay native
messages/tool frames and subscribe live from that exact offset. The mounted
Northwind regression proves the original deadlock (RED) and first-send, unused
thread reopen, exact-offset resume and native tool replay after repair (GREEN).
Test command: the structured test wrapper with
`packages/cli/tests/showcase-ai/browser/showcase_ai_browser.ts`. Browser tooling
and Chromium prerequisites are documented alongside it.
