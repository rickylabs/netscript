# Public run artifacts and READY

Coordinator requirement: keep all committed run notes, logs, receipts and JSON portable. Use repository-relative paths. Describe external checkouts and temporary evidence by role without publishing their machine paths. Write new public logs with repository-relative paths from the start. Preserve command outcomes, timings, digests and retained cross-agent context while normalizing path fields.

Before READY, inspect every added line in `git diff origin/main...HEAD` across the complete PR. Require zero absolute home, ephemeral or temporary-root paths, and state that result in the READY report with its head SHA. Repository-relative `.llm/tmp/` is a valid path and must not be mistaken for an absolute temporary root. Repeat this gate after later commits; an earlier audit is not final-head evidence.

The coordinator-triggered audit at source c644a44596623fd93be1dc0cd77897f76d88a399 inspected every added line in the phase-two run and the complete PR diff. There were zero forbidden absolute path hits. No rewriting of existing artifacts was necessary. Positive scanner controls detect each forbidden root; negative controls retain repository-relative scratch paths. This hygiene check does not complete remaining implementation slices or make the draft PR READY.

Coordinator tightened the public-run rule: repo-relative paths only; no session identifiers or thumbprints. Before every push inspect the entire added-line diff plus run text. Any retained leak-check output is verdict and counts only, never matched lines. Keep transport/session ownership and raw machine receipts outside public artifacts. Commit hashes used as source evidence remain normal review references.
