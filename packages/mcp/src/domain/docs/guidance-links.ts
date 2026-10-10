import type { GuidanceLinkRelation } from './guidance-contract.ts';
import type { GuidanceLinkEdge, IndexedGuidanceSection } from './guidance-parser.ts';

/** One internal link resolved to its target section once, at index time. */
export interface ResolvedGuidanceLink {
  readonly relation: GuidanceLinkRelation;
  readonly target: IndexedGuidanceSection;
}

/** Resolve every section's internal links once; the graph is fixed per corpus load. */
export function resolveGuidanceLinks(
  sections: readonly IndexedGuidanceSection[],
): ReadonlyMap<string, readonly ResolvedGuidanceLink[]> {
  const byId = new Map(sections.map((entry) => [entry.id, entry]));
  const firstBySlug = new Map<string, IndexedGuidanceSection>();
  for (const entry of sections) {
    if (!firstBySlug.has(entry.slug)) firstBySlug.set(entry.slug, entry);
  }
  return new Map(sections.map((entry) => {
    const links = new Map<string, ResolvedGuidanceLink>();
    for (const edge of entry.links) {
      const target = resolveEdge(edge, firstBySlug, byId);
      if (target && !links.has(target.id)) {
        links.set(target.id, { relation: edge.relation, target });
      }
    }
    return [entry.id, [...links.values()]];
  }));
}

function resolveEdge(
  edge: GuidanceLinkEdge,
  firstBySlug: ReadonlyMap<string, IndexedGuidanceSection>,
  byId: ReadonlyMap<string, IndexedGuidanceSection>,
): IndexedGuidanceSection | undefined {
  if (edge.targetSection) return byId.get(`${edge.targetSlug}#${edge.targetSection}`);
  return firstBySlug.get(edge.targetSlug);
}
