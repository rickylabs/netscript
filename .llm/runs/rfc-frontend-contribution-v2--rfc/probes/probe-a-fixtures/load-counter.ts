export const loadCounts: Map<string, number> = new Map<string, number>();

export function recordModuleLoad(id: string): void {
  loadCounts.set(id, (loadCounts.get(id) ?? 0) + 1);
}

export function getModuleLoadCount(id: string): number {
  return loadCounts.get(id) ?? 0;
}
