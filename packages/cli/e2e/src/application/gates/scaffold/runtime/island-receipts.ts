/** One module request retained by the generated-island served-surface receipt. */
export interface IslandScriptReceipt {
  readonly url: string;
  readonly status: number | null;
  readonly contentType: string | null;
  readonly bundleHit: boolean;
  readonly error?: string;
}

/** Durable evidence that the generated route emitted and served its Fresh island entry. */
export interface IslandServedSurfaceReceipt {
  readonly markers: readonly string[];
  readonly scripts: readonly IslandScriptReceipt[];
  readonly bundleHit: boolean;
}

/** Durable evidence that browser hydration made the generated island interactive. */
export interface IslandHydrationReceipt {
  readonly islandHydrated: boolean;
  readonly freshIslandElement: string | null;
}
