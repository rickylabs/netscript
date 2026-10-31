# Research

Browser harness is a standalone npm project (private package.json, package-lock.json; five exact devDependencies), not a Deno workspace member. Existing deps wrappers only report Deno workspace graphs. Adding it as a workspace member would violate ownership and catalog policy. It uses npm ci --ignore-scripts in its own CI job; no Aspire host/database/service required. The Aspire surface manifest currently gives it a generic cache/preflight description that is factually wrong.

Official npm docs: https://docs.npmjs.com/cli/v11/commands/npm-ls/ and https://docs.npmjs.com/cli/v11/using-npm/config/ document lock-only inventory; https://docs.npmjs.com/cli/v11/commands/npm-outdated/ and https://docs.npmjs.com/cli/v11/commands/npm-audit/ supply native freshness/advisory behavior. Installed npm12.1.0 successfully lists all five direct dependencies with npm ls --package-lock-only --depth=0 --json, no manifest/lock mutation. Existing deps:latest retains registry stable-channel authority.

No Dependabot config exists in this baseline. Existing fresh-ui-quality_test gate list omits fresh-ui-browser-contract; current workflow already invokes it. Need a real negative control proving bypass/removal is rejected, preserving all previous checks.
