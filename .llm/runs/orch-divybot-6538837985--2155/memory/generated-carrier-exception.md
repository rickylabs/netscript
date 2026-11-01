# Generated-only docs carrier integration

Coordinator explicitly authorizes canonical generated package outputs for issue 2155 in PR comment 6539166396. The initial docs-only prohibition remains for authored package/plugin source. Required outputs here are CLI prose carrier from gen:agent-docs-prose and MCP publish assets from gen:publish-assets. assets-barrel checks can exit 1 precommit solely because they end with git diff against the pending generated prose file; rerun on the committed tree. No embedded-doc budget increase was required.
