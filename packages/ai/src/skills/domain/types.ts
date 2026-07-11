/** Trigger modes reported by a skill match. */
export const SKILL_MATCH_MODES = ['tag', 'semantic'] as const;

/** A trigger mode that contributed to a skill match. */
export type SkillMatchMode = (typeof SKILL_MATCH_MODES)[number];

/** Validated skill metadata that is cheap to enumerate without loading the body. */
export interface SkillSummary {
  /** Stable identifier. */
  readonly id: string;
  /** Human-readable name. */
  readonly name: string;
  /** Trigger tags in declaration order. */
  readonly tags: readonly string[];
  /** Short description used for discovery and semantic matching. */
  readonly description: string;
}

/** A fully disclosed skill document. */
export interface SkillDocument extends SkillSummary {
  /** Non-empty Markdown instructions following the frontmatter. */
  readonly body: string;
}

/** A ranked skill discovery result. */
export interface SkillMatch {
  /** Matched skill metadata; the full body remains undisclosed. */
  readonly skill: SkillSummary;
  /** Normalized relevance score from zero through one. */
  readonly score: number;
  /** Trigger modes that contributed to the result. */
  readonly modes: readonly SkillMatchMode[];
}

/** Source boundary that keeps metadata enumeration separate from full-content reads. */
export interface SkillContentSource {
  /** List validated summaries without reading full skill bodies. */
  list(): Promise<readonly SkillSummary[]>;
  /** Read raw `SKILL.md` content for an id, or `undefined` when absent. */
  load(id: string): Promise<string | undefined>;
}

/** Options for query matching. */
export interface SkillQueryOptions {
  /** Context tags matched with exact/substring rules. */
  readonly tags?: readonly string[];
  /** Enable semantic ranking. Defaults to `false`. */
  readonly semantic?: boolean;
  /** Minimum score included in the result. Defaults to zero-exclusive. */
  readonly minScore?: number;
  /** Maximum number of results. */
  readonly limit?: number;
}

/** Loader composition options. */
export interface SkillLoaderOptions {
  /** Optional provider used only when semantic matching is enabled. */
  readonly embeddings?: SkillEmbeddingProvider;
  /** Embedding model forwarded to the provider. */
  readonly embeddingModel?: string;
}

/** Minimal structural view of an embedding provider used for skill matching. */
export interface SkillEmbeddingProvider {
  /** Embed ordered inputs into ordered dense vectors. */
  embed(
    input: string | readonly string[],
    options?: { readonly model?: string; readonly signal?: AbortSignal },
  ): Promise<{ readonly embeddings: readonly (readonly number[])[] }>;
}

/** Agent Skill discovery and two-phase loading contract. */
export interface SkillLoaderPort {
  /** List cheap summaries without loading bodies. */
  list(): Promise<readonly SkillSummary[]>;
  /** Load and validate one full skill document. */
  load(id: string): Promise<SkillDocument | undefined>;
  /** Match summaries against context tags. */
  matchByTag(tags: readonly string[]): Promise<readonly SkillMatch[]>;
  /** Match a query using tags and optionally injected semantic embeddings. */
  matchByQuery(query: string, options?: SkillQueryOptions): Promise<readonly SkillMatch[]>;
}

/** Caller-supplied content used by the in-memory source adapter. */
export interface SkillSourceEntry {
  /** Stable id expected in the document frontmatter. */
  readonly id: string;
  /** Complete `SKILL.md` source. */
  readonly markdown: string;
}
