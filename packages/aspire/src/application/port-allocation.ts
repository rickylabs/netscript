/** Port allocation options for Aspire composition. */
export interface PortAllocationOptions {
  readonly start?: number;
  readonly assigned?: ReadonlyMap<string, number>;
}

/** Create a deterministic port allocator for plugin resources. */
export function createPortAllocator(
  options: PortAllocationOptions = {},
): (key: string, fallback?: number) => number {
  const assigned = new Map(options.assigned ?? []);
  let next = options.start ?? 8090;

  return (key: string, fallback?: number): number => {
    const existing = assigned.get(key);
    if (existing !== undefined) {
      return existing;
    }
    const port = fallback ?? next++;
    assigned.set(key, port);
    return port;
  };
}
