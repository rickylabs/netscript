## PLAN-EVAL: issue #2233, deterministic manifest parity

I found no blockers. The plan covers all three owner requirements and every plan-gate box is satisfied.

**Plan-gate checklist**
- **Research:** Rebased on main at `6c3f8a1`. It confirms the old row labels against the #2234 base and confirms #2234 left manifest parity unmet. It also states the sidecar rule: the provenance file holds only the schema and version, so independent page edits still merge cleanly.
- **Decisions locked, with reasons:**
  - `Prose source commit` becomes `sha256:<digest>`, a hash of the sorted, decoded prose files, including the derived `llms-full.txt`.
  - `Prose extraction time` becomes `release:<version>`.
  - Both values are computed at install time, so no stored aggregate can cause merge conflicts.
  - The API generation time keeps using the caller's clock.
- **Open decisions:** None. Nothing deferred would force rework.
- **Slices:** Three, in order, each with its files and gates. All listed files fall within the write surface allowed in `supervisor.md`.
- **Risk register:** Covers aggregate metadata conflicts, a parity test that only checks itself, clock or Git volatility, and version mismatch.
- **Gates:** Scoped check, lint, fmt and test; the mergeable-carrier and carrier-parity tests; the four carrier freshness checks; `quality:gate`; and a separate IMPL-EVAL. Skipping `scaffold.runtime` is justified: there are no scaffold or runtime changes, and the owner forbids running it locally.
- **jsr-audit:** No export or signature changes. Hashing uses the built-in Web Crypto, so there are no new dependencies and no slow-type risk.

**Code spot-checks**
- `deno-agent-docs-generator.ts:162-169`: `inflateProse()` already decodes the shared carrier and derives `llms-full`. A digest over that data is deterministic and needs no Git or clock input.
- `deno-agent-docs-generator.ts:284-299`: `renderManifest` is private, and `now` is already an injectable constructor argument. So restoring the rows and fixing the clock in a fixture doesn't touch the public API.
- `kernel/assets/agent-docs.generated.ts:4` re-exports `EMBEDDED_AGENT_DOCS_PAGES` from `@netscript/mcp/docs`. The CLI therefore has no second copy of the carrier, and "carrier → installed bytes" is a single chain.
- `agent-docs-page-carrier.ts`: `readAgentDocsPages` parses the carrier file's text directly rather than going through the module loader. That gives the parity test an independent way to build its expected manifest. Package tests already import from `.llm/tools/**` (for example `install-plugin_test.ts`), so this import pattern isn't new.
- The rows were left out on purpose for mergeability. Since `provenance.json` stays unchanged and the digest is computed at install time, putting them back doesn't bring back carrier conflicts.

**Non-blocking notes for implementation**
- The parity test must compute the expected digest itself, not call the adapter's private helper. Otherwise the test only checks itself.
- `generated-carriers.md:29-30` currently says these rows are omitted, and must be updated as planned.
- The negative controls (removing a row, or swapping in volatile values) must fail the same strict byte-compare path, not a separate weaker assertion.

VERDICT: PASS