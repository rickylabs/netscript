# Draft comment for #413

Post this only after the lease-backed phase-B capture lands on PR #1741:

> Aspire CLI 13.5.3 dashboard telemetry compatibility has been re-captured in PR #1741. The
> lease-backed health-check worker run produced the versioned resources and spans envelopes at
> `packages/mcp/tests/fixtures/telemetry/aspire-13.5.3-resources.json` and
> `packages/mcp/tests/fixtures/telemetry/aspire-13.5.3-spans.json`, with the corresponding fixture
> contract at `packages/mcp/tests/fixtures/telemetry/aspire-13.5.3-fixture.ts`. The retained 13.4.6
> fixture remains covered beside it, and the compat-fixture parity gate has been promoted from
> `pending-lease` to `required`. Capture provenance and the exact dashboard API requests are
> recorded in the telemetry fixture README. Phase-B commit: `<phase-b-sha>`.

Do not post this draft during phase A: the named 13.5.3 telemetry files do not exist until the
supervisor grants the runtime lease and resumes the capture.
