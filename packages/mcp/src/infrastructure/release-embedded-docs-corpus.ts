import {
  type DocsCorpusPort,
  type DocsDocument,
  type DocsSearchMatch,
  type DocsSummary,
  normalizeDocsSlug,
} from '../domain/docs/docs-corpus-port.ts';
import type { GuidanceResult } from '../domain/docs/guidance-contract.ts';
import {
  MCP_EMBEDDED_DOCS,
  MCP_EMBEDDED_DOCS_PROVENANCE,
  MCP_PACKAGE_README,
  MCP_PACKAGE_VERSION,
} from '../publish-assets.generated.ts';
import { EmbeddedDocsCorpus, type EmbeddedDocsSource } from './embedded-docs-corpus.ts';

/** Generated Markdown source embedded in the release fallback. */
export interface ReleaseEmbeddedDocsSourceDocument {
  readonly path: string;
  readonly slug: string;
  readonly source: string;
}

/** Version, source, size, cardinality, and hash recorded by publish-asset generation. */
export interface ReleaseEmbeddedDocsProvenance {
  readonly schemaVersion: 1;
  readonly frameworkVersion: string;
  readonly sourceCommit: string;
  readonly paths: readonly string[];
  readonly sourceBytes: number;
  readonly documentCount: number;
  readonly sha256: string;
}

/** Generated fallback input accepted by the release-matched adapter. */
export interface ReleaseEmbeddedDocsSource {
  readonly documents: readonly ReleaseEmbeddedDocsSourceDocument[];
  readonly provenance: ReleaseEmbeddedDocsProvenance;
}

/** Construction overrides for fail-closed provenance fixtures. */
export interface ReleaseEmbeddedDocsCorpusOptions {
  readonly source?: ReleaseEmbeddedDocsSource;
  readonly expectedFrameworkVersion?: string;
  /** Extra outer-CLI help documents appended without replacing the generated release prose. */
  readonly additionalDocuments?: readonly EmbeddedDocsSource[];
}

/** Folder the release carrier stores rendered docs-site pages under (`pages/<site slug>`). */
const RELEASE_PAGE_PREFIX = 'pages/';

const DEFAULT_SOURCE: ReleaseEmbeddedDocsSource = {
  documents: MCP_EMBEDDED_DOCS,
  provenance: MCP_EMBEDDED_DOCS_PROVENANCE,
};

/** Filesystem-independent generated docs adapter that rejects stale release provenance. */
export class ReleaseEmbeddedDocsCorpus implements DocsCorpusPort {
  readonly #source: ReleaseEmbeddedDocsSource;
  readonly #delegate: EmbeddedDocsCorpus;
  #integrity?: Promise<void>;

  /** Validate synchronous provenance and prepare the bounded embedded corpus. */
  constructor(options: ReleaseEmbeddedDocsCorpusOptions = {}) {
    this.#source = options.source ?? DEFAULT_SOURCE;
    const expectedVersion = options.expectedFrameworkVersion ?? MCP_PACKAGE_VERSION;
    validateProvenance(this.#source, expectedVersion);
    this.#delegate = new EmbeddedDocsCorpus({
      documents: [
        { slug: 'mcp', source: MCP_PACKAGE_README },
        ...this.#source.documents.map(({ slug, source }) => ({ slug, source })),
        ...(options.additionalDocuments ?? []),
      ],
    });
  }

  /** List release-matched fallback summaries after verifying generated integrity. */
  async list(): Promise<readonly DocsSummary[]> {
    await this.#verifyIntegrity();
    return await this.#delegate.list();
  }

  /** Search release-matched fallback prose after verifying generated integrity. */
  async search(query: string): Promise<readonly DocsSearchMatch[]> {
    await this.#verifyIntegrity();
    return await this.#delegate.search(query);
  }

  /**
   * Retrieve one release-matched fallback document after verifying generated integrity.
   *
   * Guidance and the filesystem corpus name site pages by their docs-site slug
   * (`web-layer/route`); the release carrier stores them under `pages/`. An unprefixed
   * site slug therefore resolves to its page and reports the slug it was redirected from.
   */
  async get(slug: string): Promise<DocsDocument | undefined> {
    await this.#verifyIntegrity();
    const document = await this.#delegate.get(slug);
    const normalized = normalizeDocsSlug(slug);
    if (document !== undefined || normalized.startsWith(RELEASE_PAGE_PREFIX)) return document;
    const page = await this.#delegate.get(`${RELEASE_PAGE_PREFIX}${normalized}`);
    return page === undefined ? undefined : { ...page, redirectedFrom: normalized };
  }

  /** Resolve release-matched section guidance after verifying generated integrity. */
  async findGuidance(intent: string): Promise<GuidanceResult> {
    await this.#verifyIntegrity();
    return await this.#delegate.findGuidance(intent);
  }

  #verifyIntegrity(): Promise<void> {
    this.#integrity ??= verifyHash(this.#source);
    return this.#integrity;
  }
}

function validateProvenance(source: ReleaseEmbeddedDocsSource, expectedVersion: string): void {
  const provenance = source.provenance;
  if (provenance.schemaVersion !== 1) {
    throw new Error(`unsupported embedded docs schema: ${provenance.schemaVersion}`);
  }
  if (provenance.frameworkVersion !== expectedVersion) {
    throw new Error(
      `embedded docs version ${provenance.frameworkVersion} does not match ${expectedVersion}`,
    );
  }
  const paths = source.documents.map((document) => document.path);
  if (
    provenance.documentCount !== source.documents.length ||
    paths.some((path, index) => path !== provenance.paths[index]) ||
    provenance.paths.length !== paths.length
  ) {
    throw new Error('embedded docs cardinality or paths do not match provenance');
  }
  const sourceBytes = source.documents.reduce(
    (total, document) => total + new TextEncoder().encode(document.source).byteLength,
    0,
  );
  if (sourceBytes !== provenance.sourceBytes) {
    throw new Error('embedded docs source byte count does not match provenance');
  }
}

async function verifyHash(source: ReleaseEmbeddedDocsSource): Promise<void> {
  const bytes = canonicalBytes(source.documents);
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const actual = hex(await crypto.subtle.digest('SHA-256', copy.buffer));
  if (actual !== source.provenance.sha256) {
    throw new Error('embedded docs hash does not match provenance');
  }
}

function canonicalBytes(documents: readonly ReleaseEmbeddedDocsSourceDocument[]): Uint8Array {
  return new TextEncoder().encode(
    documents.map(({ path, source }) => `${path}\0${source}`).join('\0'),
  );
}

function hex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
