/** Exclude retained harness evidence and transient working state, not shipped generated source. */
export function isTransientAspireScanPath(path: string): boolean {
  const value = `/${path.replaceAll('\\', '/').replace(/^\.\//, '')}/`;
  return /\/\.llm\/(?:runs|tmp)(?:\/|$)/.test(value) ||
    /\/\.agents\/generated\//.test(value) ||
    /\/(?:\.git|node_modules|\.data|\.cache|\.vite|coverage)\//.test(value) ||
    /^\/(?:tmp|temp)\//.test(value);
}
