/** Volatile Codex CLI failure-message patterns. */
export const CODEX_FAILURE_PATTERNS: Readonly<{
  quotaExhausted: RegExp;
  modelCapacity: RegExp;
  resetTime: RegExp;
}> = {
  quotaExhausted: /\b(?:hit|reached) your (?:usage|rate) limit\b/i,
  modelCapacity: /\b(?:model\s+)?[\w.-]+ is at capacity\b/i,
  resetTime: /\btry again at\s+(\d{1,2}):(\d{2})(?:\s*([ap]m))?\b/i,
} as const;
