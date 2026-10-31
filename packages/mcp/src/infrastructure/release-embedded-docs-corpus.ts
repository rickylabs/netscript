import { normalizeDocsSlug } from '../domain/docs/docs-corpus-port.ts';
import type {
  DocsCorpusCitation,
  DocsCorpusPort,
  DocsDocument,
  DocsSearchMatch,
  DocsSummary,
} from '../domain/docs/docs-corpus-port.ts';
import type { GuidanceResult } from '../domain/docs/guidance-contract.ts';
import {
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

let defaultSource: Promise<ReleaseEmbeddedDocsSource> | undefined;

/** Decode the shared release pages only when a docs tool needs them, once per module. */
export function loadReleaseDocsSource(): Promise<ReleaseEmbeddedDocsSource> {
  return defaultSource ??= (async () => {
    const { EMBEDDED_AGENT_DOCS_PAGES, decodeAgentDocsPages } = await import('../../docs.ts');
    const files = await decodeAgentDocsPages(EMBEDDED_AGENT_DOCS_PAGES);
    return {
      documents: Object.entries(files).map(([path, source]) => ({
        path,
        source,
        slug: normalizeDocsSlug(path),
      })),
      provenance: MCP_EMBEDDED_DOCS_PROVENANCE,
    };
  })();
}

/** Filesystem-independent generated docs adapter that rejects stale release provenance. */
export class ReleaseEmbeddedDocsCorpus implements DocsCorpusPort {
  /** Exact release and canonical digest shared by all documentation tools. */
  readonly citation: DocsCorpusCitation;
  readonly #source?: ReleaseEmbeddedDocsSource;
  readonly #expectedVersion: string;
  readonly #additional: readonly EmbeddedDocsSource[];
  #delegate?: Promise<EmbeddedDocsCorpus>;

  /** Validate synchronous provenance and prepare the bounded embedded corpus. */
  constructor(options: ReleaseEmbeddedDocsCorpusOptions = {}) {
    this.#source = options.source;
    this.#expectedVersion = options.expectedFrameworkVersion ?? MCP_PACKAGE_VERSION;
    this.#additional = options.additionalDocuments ?? [];
    const provenance = this.#source?.provenance ?? MCP_EMBEDDED_DOCS_PROVENANCE;
    if (provenance.frameworkVersion !== this.#expectedVersion) {
      throw new Error(
        `embedded docs version ${provenance.frameworkVersion} does not match ${this.#expectedVersion}`,
      );
    }
    if (this.#source) validateProvenance(this.#source, this.#expectedVersion);
    this.citation = { frameworkVersion: this.#expectedVersion, sha256: provenance.sha256 };
  }

  /** List release-matched fallback summaries after verifying generated integrity. */
  async list(): Promise<readonly DocsSummary[]> {
    const delegate = await this.#corpus();
    return await delegate.list();
  }

  /** Search release-matched fallback prose after verifying generated integrity. */
  async search(query: string): Promise<readonly DocsSearchMatch[]> {
    const delegate = await this.#corpus();
    return await delegate.search(query);
  }

  /** Retrieve one release-matched fallback document after verifying generated integrity. */
  async get(slug: string): Promise<DocsDocument | undefined> {
    const delegate = await this.#corpus();
    return await delegate.get(slug);
  }

  /** Resolve release-matched section guidance after verifying generated integrity. */
  async findGuidance(intent: string): Promise<GuidanceResult> {
    const delegate = await this.#corpus();
    return await delegate.findGuidance(intent);
  }

  #corpus(): Promise<EmbeddedDocsCorpus> {
    return this.#delegate ??= (async () => {
      const source = this.#source ?? await loadReleaseDocsSource();
      validateProvenance(source, this.#expectedVersion);
      await verifyHash(source);
      return new EmbeddedDocsCorpus({
        documents: [
          { slug: 'mcp', source: MCP_PACKAGE_README },
          ...source.documents,
          ...this.#additional,
        ],
      });
    })();
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
