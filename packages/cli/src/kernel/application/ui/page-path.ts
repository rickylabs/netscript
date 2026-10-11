/** Validate and normalize a scaffold page path relative to the Fresh routes root. */
export function cleanUiPagePath(path: string): string {
  const value = path.replace(/^\/+|\/+$/g, '');
  if (!value || value.split('/').some((part) => !/^[\w][\w-]*$/.test(part))) {
    throw new Error(`Invalid page path: ${path}`);
  }
  return value;
}
