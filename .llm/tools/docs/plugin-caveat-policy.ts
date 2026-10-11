function plainProse(text: string): string {
  return text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/?[a-z][^>]*>/gi, '')
    .replace(/!?\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[`*]|(?<!\w)_{1,3}|_{1,3}(?!\w)/g, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/\s+/g, ' ');
}

function outsideStreamsMigration(text: string, location: string): string {
  if (
    !location.endsWith('docs/site/durable-workflows/streams.md') &&
    !location.endsWith('pages/durable-workflows/streams/index.md')
  ) return text;

  let inMigration = false;
  return text.split('\n').filter((line) => {
    if (/^#{1,2}\s/.test(line)) {
      inMigration = line.trim() === '## Breaking migration in 0.0.8';
    }
    return !inMigration;
  }).join('\n');
}

/** Reject documentation that restores the resolved plugin defects from #1369. */
export function checkResolvedPluginCaveats(text: string, location: string): void {
  for (const paragraph of text.split(/\n\s*\n/)) {
    const prose = plainProse(paragraph);
    if (
      /\bWORKER_CONCURRENCY\b/.test(prose) &&
      (/workaround|work around|mismatch|ignored|not the same variable|does not (?:feed|consume)|but the runtime|runtime (?:entrypoints? )?(?:reads?|honou?rs)|(?:set|export|override) (?:\w+ ){0,3}WORKERS_CONCURRENCY/i
        .test(prose) || !/deprecated (?:alias|name).*0\.0\.8/i.test(prose))
    ) {
      throw new Error(`${location}: retired WORKER_CONCURRENCY workaround caveat (#1369)`);
    }
  }
  if (
    text.includes('arch-debt:streams-manifest-helpers-unsupported') ||
    /\b(?:StreamUnsupportedOperationError|defineStreamProducer|defineStreamConsumer)\b/.test(
      plainProse(outsideStreamsMigration(text, location)),
    )
  ) {
    throw new Error(`${location}: retired unsupported streams root caveat (#1369)`);
  }
}
