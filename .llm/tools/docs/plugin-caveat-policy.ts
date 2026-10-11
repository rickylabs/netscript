/** Reject documentation that restores the resolved plugin defects from #1369. */
export function checkResolvedPluginCaveats(text: string, location: string): void {
  for (const paragraph of text.split(/\n\s*\n/)) {
    if (
      /\bWORKER_CONCURRENCY\b/.test(paragraph) &&
      /workaround|work around|mismatch|but\s+the\s+runtime|runtime\s+(?:reads|honou?rs)|(?:set|export|override)\s+(?:[\w`<>/]+\s+){0,3}WORKERS_CONCURRENCY/i
        .test(paragraph)
    ) {
      throw new Error(`${location}: retired WORKER_CONCURRENCY workaround caveat (#1369)`);
    }
  }
  if (
    text.includes('arch-debt:streams-manifest-helpers-unsupported') ||
    (/streams/i.test(location) && /fail\s+loud,?\s+by\s+design/i.test(text))
  ) {
    throw new Error(`${location}: retired unsupported streams root caveat (#1369)`);
  }
}
