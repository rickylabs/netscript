const scalarJsUrl = new URL('../../assets/scalar.min.js', import.meta.url);

export async function renderScalar(): Promise<string> {
  const scalarJsCache = undefined;
  return scalarJsCache ??
    await Deno.readTextFile(scalarJsUrl);
}
