const WORKERS_SAMPLE_SOURCE = 'plugins/workers/src/cli/official-sample-configuration.ts';
const CANONICAL_SAGAS_DOC = 'docs/site/durable-workflows/sagas.md';
const DOC_SAMPLE_LABEL = 'label: "The job that publishes (workers)"';

/** Extract the generated create-user-settings job from the official workers source. */
export function extractOfficialJobTemplate(source: string): string {
  const match = source.match(
    /function generateCreateUserSettingsJob\(\): string \{\n  return `\$\{OFFICIAL_SAMPLE_CONFIG_MARKER\}\n([\s\S]*?)\n`;\n\}/,
  );
  if (!match) throw new Error('official create-user-settings template was not found');

  return match[1]
    .replaceAll('\\`', '`')
    .replaceAll('\\${', '${');
}

function sampleBounds(source: string): { readonly start: number; readonly end: number } {
  const labelIndex = source.indexOf(DOC_SAMPLE_LABEL);
  if (labelIndex < 0) throw new Error('canonical worker sample tab was not found');
  const codeIndex = source.indexOf('code: ', labelIndex);
  if (codeIndex < 0) throw new Error('canonical worker sample code was not found');
  const start = codeIndex + 'code: '.length;
  const end = source.indexOf('\n', start);
  if (end < 0) throw new Error('canonical worker sample code was not line terminated');
  return { start, end };
}

/** Extract the canonical saga guide's encoded workers sample. */
export function extractCanonicalDocsSample(source: string): string {
  const { start, end } = sampleBounds(source);
  const decoded: unknown = JSON.parse(source.slice(start, end).trim());
  if (typeof decoded !== 'string') throw new Error('canonical worker sample code was not a string');
  return decoded;
}

/** Synchronize the canonical saga guide sample from the official workers generator source. */
export async function syncOfficialSagaPublisherSample(): Promise<boolean> {
  const official = extractOfficialJobTemplate(await Deno.readTextFile(WORKERS_SAMPLE_SOURCE));
  const canonicalSource = await Deno.readTextFile(CANONICAL_SAGAS_DOC);
  const { start, end } = sampleBounds(canonicalSource);
  const encoded = JSON.stringify(official);
  if (canonicalSource.slice(start, end).trim() === encoded) return false;
  await Deno.writeTextFile(
    CANONICAL_SAGAS_DOC,
    `${canonicalSource.slice(0, start)}${encoded}${canonicalSource.slice(end)}`,
  );
  return true;
}

if (import.meta.main) {
  const changed = await syncOfficialSagaPublisherSample();
  console.log(changed ? `updated ${CANONICAL_SAGAS_DOC}` : `${CANONICAL_SAGAS_DOC} is current`);
}
