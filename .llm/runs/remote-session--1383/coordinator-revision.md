# Required plan revision before independent evaluation

The current draft is not accepted for implementation. This is coordinator scope review, not independent certification.

1. OQ3 is NOT safely deferred. Executed coordinator-bearer-probe.ts against the native in-memory KV-OAuth registry and actual session handler yields directAuthenticated:true, cookieAuthenticated:true, bearerAuthenticated:false. See coordinator-bearer-probe.json. A remote verifier proven only against a fabricated responding handler would preserve the wrong end state. Include the minimum native session-handler bearer-to-lookup.token support in this same bounded issue1383 slice, with real typed SDK HTTP -> native auth session handler -> native in-memory KV-OAuth acceptance. Preserve cookie/direct callers; explicitly test credential precedence and malformed/ambiguous inputs. Do not touch signout1384 or unrelated provider policy. Update all affected runtime/gate classifications honestly. No live IdP PASS inferred.

2. Correct false missing-reference claim. /home/agent/projects/eis-chat and /home/agent/projects/ledgerline both exist (coordinator ls verified); original owner paths, not /home/agent/repos. Read named references there without writing. Aspireify exists in Cockpit .agents/skills/aspireify/SKILL.md; no AppHost changes needed here.

3. Resolve serviceName and timeoutMs by making them required caller inputs in this narrow adapter. Do not ask the owner to pick arbitrary framework defaults. Validate nonempty name and finite positive supported timeout range at construction; use existing SDK/AbortSignal validation rather than custom transport. A future convenience default is separable; no pretend open decision that permits implementation before resolution.

4. Reconsider Principal L6. session.id can itself be the bearer credential in KV-OAuth (executed fixture). Do NOT add it to principal.claims where audit or request logging could expose it. Original Cockpit maps subject/scopes/roles/claims and scheme bearer without adding sessionId/providerId. Ground an appropriate safe mapping in the service port; transport here is bearer. Do not add credential-bearing claims merely to mirror an in-process mapper. Explain any remaining forwarded claims boundary.

5. Error L9 retains arbitrary raw cause while claiming safe logging for other hosts. Require no credential/raw body in serialized diagnostic fields, not only a fixed top-level message. Use existing redacted SDK error support if it supplies this. Do not invent a rich custom error hierarchy without necessity.

6. Two differently named factories plus a wrapper look unnecessary for a thin re-export. Prefer one core-owned factory exposed through a thin plugin leaf, named createAuthServiceAuthenticator as issue1383 requests, unless source doctrine demands otherwise. Explain any alternative.

7. Current implementation generator is coordinator Astra medium, not the native planner. Independent implementation evaluation must resolve relative to actual generator using fresh matrix, not simply say non-Anthropic. Native planner Fable medium authored this plan; its independent plan evaluator must be a different family and session. No product implementation before plan PASS.

Retain scope remaining on1383, no closing keyword, no release cut/publication authorization. Correct research/plan/worklog/context and enumerate exact files/gates. No new feature issue, no other backlog work.

Probe lifecycle: output emitted successfully, but the native in-memory fixture retained a background handle; coordinator stopped only the exact owned probe process, exit143. This is observed behavioral evidence, not a passing test or cleanup receipt. Formal tests must own and clean their runtime handles; do not copy this probe as a passing test.
