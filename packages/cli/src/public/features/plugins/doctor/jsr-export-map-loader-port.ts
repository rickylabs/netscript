/** HTTP failure returned while loading one exact JSR version's export map. */
export class JsrExportMapHttpError extends Error {
  constructor(readonly status: number) {
    super(`JSR metadata request failed with HTTP ${status}.`);
    this.name = 'JsrExportMapHttpError';
  }
}

/** Load the declared exports for one exact JSR package version. */
export type JsrExportMapLoader = (
  packageSpecifier: string,
  version: string,
) => Promise<ReadonlySet<string>>;
