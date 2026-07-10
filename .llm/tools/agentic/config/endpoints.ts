/**
 * Central, typed, single-source network endpoints for the agentic suite.
 *
 * MONTHLY MAINTENANCE: change a host / base URL / installer URL HERE. The only
 * endpoint literal the suite cannot read from this module is the
 * `--allow-net=` allowlist in the `agentic:wsl-foundation` task in the root
 * `deno.json` (Deno parses task strings statically); keep that allowlist in
 * sync with `NODE_DIST_HOST`, `NPM_REGISTRY_HOST`, and `ANTIGRAVITY_HOST`.
 */

/** Node.js distribution host (foundation downloads `${host}/dist/v<version>`). */
export const NODE_DIST_HOST = 'https://nodejs.org';

/** npm registry host used to resolve stable dist-tags during bootstrap. */
export const NPM_REGISTRY_HOST = 'registry.npmjs.org';

/** Antigravity host and its checksum-verifying installer URL. */
export const ANTIGRAVITY_HOST = 'antigravity.google';
export const ANTIGRAVITY_INSTALLER_URL = 'https://antigravity.google/cli/install.sh';

/** OpenRouter base URLs: Anthropic-skin (Claude) and Responses (Codex). */
export const OPENROUTER_ANTHROPIC_BASE_URL = 'https://openrouter.ai/api';
export const OPENROUTER_RESPONSES_BASE_URL = 'https://openrouter.ai/api/v1';

/** GitHub REST API base URL for all `github/` + OpenHands tools. */
export const GITHUB_API_BASE_URL = 'https://api.github.com';
