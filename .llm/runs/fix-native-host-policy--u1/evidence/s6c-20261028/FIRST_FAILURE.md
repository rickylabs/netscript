# Preserved first TLS oracle failure and root correction

Original executed owner:180 lines, SHA256
`ae07683851888e37d2a304595a568b5782e676effc6f9481b6a47fb1cb9bc986`.
`source.final.ts`, `source.diff`, `source-proof.json` and `gates/` remain unchanged.
The actual owning suite was6 passed/1 failed/0 ignored (11,495ms). Trusted HTTPS401/201/204/200
and front/upstream byte equality passed. The default-CA request threw TypeError with the generic
message `fetch failed`; checking `/certificate/i` on that top-level message failed. The cause
was not captured, so certificate-specific rejection and the final trusted bracket were unproven.
Native cleanup completed without a secondary AggregateError; all15 captured children settled
and six scratch/profile paths were removed. Static six-file gates and new-owner quality passed.

Root read the complete180-line owner and the existing workers negative, which only checks
TypeError and cannot provide certificate-specific proof. Root then explicitly authorized this
single-new-owner correction: require an Error-valued `error.cause`, apply `/certificate/i` to
its actual message, and retain both top-level and cause name/message. Same-endpoint bracketing,
unchanged auth count, unexpected-response cancellation, permissions and all cleanup remain.
Absent/non-Error/noncertificate cause remains a failure; no further weakening is authorized.
Cap220 and all115 protected bindings remain fixed. Source/result review precedes checkpoint.
