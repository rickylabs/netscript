# Current-main research

Baseline `851d1ce92d91352aa0d7b9c29ba6e3e4ee39bae2`. Preflight read #1367 comments and all matching
PRs; #2215 is merged partial work, #2272 closed audit. No duplicate remaining PR exists.
NetScript MCP find_guidance then search_docs recommended manifest-owned Aspire contribution wiring.
Read existing run memories, doctrine public-surface/plugin-thinness rules, archetype 5 + service
overlay, harness gates, PR/tooling/CLI/Deno skills. No repository profiles were read.

- Streams contribution registers the service and env but has no directory option.
- CLI-generated AppHosts use generate-register-plugins.ts rather than composeAppHost. Both must
  consume the same core-owned declaration primitive; changing the contribution alone is insufficient.
- PluginEntry Environment is already typed and preserved. Data-directory provisioning needs an
  explicit declaration, not inference from every environment value or a plugin-name conditional.
- Service main reads STREAMS_DATA_DIR and fails startup for a missing/unwritable directory. Health
  reports memory/durable:false or file/durable:true only after a write/read probe. Preserve it.
- storage-restart_test.ts exercises real producer upsert/delete/read across subprocess restart;
  it does not restart a generated Aspire resource. Reuse its wire assertions in the new proof.
- Existing bounded-file-store and producer epoch work are baseline, not redesign scope. Verify
  producer delivery in file mode against this baseline before attributing any defect to the change.

Publishability: add only explicit optional directory declarations to existing Aspire resource/config
interfaces and a documented optional streams contribution constructor. No upstream re-export,
new package, dependency, version bump or slow-type exemption is needed. Existing streams substrate
architecture debt remains accepted; this work does not claim to replace the test-server substrate.
