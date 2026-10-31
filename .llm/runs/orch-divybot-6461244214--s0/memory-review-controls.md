# Review-control memory

A theme test that seeds localStorage and toggles twice can pass even when the component never persists. Remove the seed after initial rendering and assert storage immediately after each activation. The real mutation control (remove only the owned copied component’s write) must fail before screenshot/axe checks.

Playwright reporter attachment paths include `<case>/attachments/axe-<hash>.json`. For downloaded artifacts, derive their suffix from `config.projects[].outputDir`, then resolve that full suffix beside the downloaded results.json. Keeping only the attachment parent basename drops the case directory. Verify both an isolated relocation fixture and an actual downloaded CI artifact.

Aspire manifest freshness also tracks non-orchestration docs that mention Aspire. Classify maintained browser-tooling docs with an explicit owner, regenerate the manifest, and run parity; do not suppress scanning or delete the mention merely to green the gate.
