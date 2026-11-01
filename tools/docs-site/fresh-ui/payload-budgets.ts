/** Published component CSS and initial builder assets have independent byte ceilings. */
export const PAYLOAD_BUDGETS = {
  componentCss: { raw: 220_000, gzip: 27_000 },
  builderJavaScript: { raw: 120_000, gzip: 38_000 },
  builderPresets: { raw: 16_000, gzip: 4_000 },
} as const;

/** Measure wire-equivalent gzip per asset, so separate responses cannot share a dictionary. */
export async function payloadBytes(
  assets: readonly Uint8Array<ArrayBuffer>[],
): Promise<{ raw: number; gzip: number }> {
  const sizes = await Promise.all(assets.map(async (bytes) => ({
    raw: bytes.byteLength,
    gzip: (await new Response(
      new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip')),
    ).arrayBuffer()).byteLength,
  })));
  return sizes.reduce((sum, size) => ({ raw: sum.raw + size.raw, gzip: sum.gzip + size.gzip }), {
    raw: 0,
    gzip: 0,
  });
}

/** Fail on either raw or gzip growth; callers must supply the complete initial request set. */
export function assertPayloadBudget(
  label: string,
  bytes: { raw: number; gzip: number },
  budget: { raw: number; gzip: number },
): void {
  for (const kind of ['raw', 'gzip'] as const) {
    if (bytes[kind] > budget[kind]) {
      throw new Error(`${label} ${kind} payload ${bytes[kind]} exceeds ${budget[kind]} bytes`);
    }
  }
}
