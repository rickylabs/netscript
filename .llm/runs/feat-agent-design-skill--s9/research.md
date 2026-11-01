# Research

The skill manifest explicitly lists names and files; gen:assets-barrel embeds those files and hashes their exact content. initAgent writes all manifest-carried files under .agents/skills for every host, including nested references; no installer code addition is needed. Installed AGENTS guidance is an embedded template, so it needs a netscript-design routing row. Existing tests already exercise canonical files, host bridges and idempotence; preserve them and extend expected discovery lists.

S8b theme pages expose published raw-source DESIGN.md/SKILL.md links rooted at the canonical docs/design-system directory. Generate the same links from directories with both files. Canonical guidelines currently have8numbered sections including compatibility, quality method and self-audit. A full local reference avoids unbounded entrypoint context and live-network dependence for shared rules.

MCP publish prose selects a bounded static set from the already generated page corpus. Adding a skill to the CLI manifest does not add an MCP prose page. Baseline measurement:283387bytes,294912budget. Native generation/check tasks remain the authority; no manual generated-data edits.
