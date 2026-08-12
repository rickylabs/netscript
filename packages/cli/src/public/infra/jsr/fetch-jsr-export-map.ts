import { JsrExportMapHttpError } from '../../features/plugins/doctor/jsr-export-map-loader-port.ts';

/** Read one published JSR package version's declared export keys. */
export async function fetchJsrExportMap(
  packageSpecifier: string,
  version: string,
  fetcher: typeof fetch = fetch,
): Promise<ReadonlySet<string>> {
  const response = await fetcher(`https://jsr.io/${packageSpecifier}/${version}_meta.json`);
  if (!response.ok) {
    throw new JsrExportMapHttpError(response.status);
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
