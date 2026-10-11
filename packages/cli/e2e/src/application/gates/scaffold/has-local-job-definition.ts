/** Identify the local job id and entrypoint in a generated definition across formatting changes. */
export function hasLocalJobDefinition(source: string, id: string, entrypoint: string): boolean {
  const definition = new RegExp(
    String.raw`\bcreateLocalJobDefinition\(\s*(["'])${RegExp.escape(id)}\1\s*,\s*(["'])${
      RegExp.escape(entrypoint)
    }\2\s*,`,
  );
  return definition.test(source);
}
