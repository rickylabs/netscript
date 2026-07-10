/**
 * Central, typed, single-source tool versions for the agentic suite.
 *
 * MONTHLY MAINTENANCE: bump a tool version HERE and nowhere else. Every doctor,
 * probe, installer, and test reads from these constants — there is no other
 * hardcoded version literal anywhere under `.llm/tools/agentic/**` (enforced by
 * `config/no-hardcoded-volatile_test.ts`).
 *
 * Three distinct kinds of version live here, deliberately separated:
 *  - TARGET  — the version the foundation bootstraps/pins to (moves on upgrade).
 *  - COMPAT  — the exact tool version a quota/limit message regex was verified
 *              against; frozen-by-design, changed only when a rule is re-verified.
 *  - TEST    — value-only expected versions used by controller unit tests.
 */

/** TARGET: Node.js version the WSL foundation installs and the doctor expects. */
export const NODE_TARGET_VERSION = '26.5.0';

/**
 * TARGET: the Antigravity component's install marker. Antigravity has no numeric
 * version in the bootstrap plan; it is installed via its official installer, so
 * the "desired version" is this fixed marker string.
 */
export const ANTIGRAVITY_INSTALL_MARKER = 'official-installer';

/**
 * TARGET: doctor "expected" version per runtime component. A component absent
 * from this map is treated as "present is enough" (no version pin), preserving
 * the historical behavior where only Node carried an expected version.
 */
export const COMPONENT_EXPECTED_VERSIONS: Readonly<Record<string, string>> = {
  node: NODE_TARGET_VERSION,
};

/**
 * COMPAT: the tool version each pinned quota/limit-text rule was verified
 * against (`routing-signal-classifier.ts`). These are historical verification
 * markers, not upgrade targets — change one only when its regex is re-verified.
 */
export const COMPAT_PINNED_TOOL_VERSIONS = {
  claude: '1.0.33',
  codex: '0.91.0',
  antigravity: '1.5.1',
} as const;

/**
 * TEST: value-only expected component versions for runtime-controller tests.
 * `node` and `antigravity` intentionally repeat the `NODE_TARGET_VERSION` and
 * `ANTIGRAVITY_INSTALL_MARKER` literals (isolated declarations cannot inline a
 * cross-const reference inside `as const`); all live in this file, so there is
 * still a single source of truth.
 */
export const TEST_COMPONENT_VERSIONS = {
  node: '26.5.0',
  claude: '2.1.206',
  antigravity: 'official-installer',
} as const;
