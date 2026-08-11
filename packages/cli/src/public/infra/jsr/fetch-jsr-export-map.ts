/** Read one published JSR package version's declared export keys. */
export async function fetchJsrExportMap(
  packageSpecifier: string,
  version: string,
): Promise<ReadonlySet<string>> {
  const response = await fetch(`https://jsr.io/${packageSpecifier}/${version}_meta.json`);
  if (!response.ok) {
    throw new Error(`JSR metadata request failed with HTTP ${response.status}.`);
  }
  const value: unknown = await response.json();
  if (!value || typeof value !== 'object') {
    throw new Error('JSR version metadata is not an object.');
  }
  const exports = Reflect.get(value, 'exports');
  if (!exports || typeof exports !== 'object') {
    throw new Error('JSR version metadata has no export map.');
  }
  return new Set(Object.keys(exports));
}
