/** Bind maintainer contrast evidence to the exact approved snapshot, never stale export prose. */
export async function verifiedFigmaProvenance(root: URL): Promise<string> {
  const provenance: { pullRequest: number; commit: string; collections: Record<string, string> } =
    JSON.parse(await Deno.readTextFile(new URL('provenance.json', root)));
  if (!Number.isInteger(provenance.pullRequest) || !/^[a-f0-9]{40}$/.test(provenance.commit)) {
    throw new Error('Invalid Figma snapshot provenance');
  }
  const index: { collections: { file: string }[] } = JSON.parse(
    await Deno.readTextFile(new URL('index.json', root)),
  );
  if (
    JSON.stringify(Object.keys(provenance.collections).sort()) !==
      JSON.stringify(index.collections.map((entry) => entry.file).sort())
  ) {
    throw new Error('Figma provenance collection inventory changed');
  }
  for (const [file, expected] of Object.entries(provenance.collections)) {
    const bytes = await Deno.readFile(new URL(file, root));
    const hash = Array.from(
      new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)),
      (byte) => byte.toString(16).padStart(2, '0'),
    ).join('');
    if (hash !== expected) throw new Error(`Figma snapshot provenance changed: ${file}`);
  }
  return `Figma export #${provenance.pullRequest} at ${provenance.commit}`;
}
