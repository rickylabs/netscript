/** Stream metadata returned by the versioned administrative port. */
export interface StreamHeadV1 {
  /** Media type stored by the server. */
  readonly contentType?: string;
  /** Opaque next offset after the current end of the stream. */
  readonly offset?: string;
  /** Server-owned entity tag. */
  readonly etag?: string;
  /** Cache policy supplied by the server. */
  readonly cacheControl?: string;
  /** Whether durable EOF prevents further appends. */
  readonly streamClosed: boolean;
}

/** Successful whole-stream deletion outcome. */
export interface StreamDeletionV1 {
  /** False when the stream was already absent; true when deletion succeeded. */
  readonly deleted: boolean;
}

/** Minimal span lifecycle needed by whole-stream administrative helpers. */
export interface StreamAdminSpanV1 {
  /** Record the OpenTelemetry success or error status. */
  setStatus(status: Readonly<{ code: 0 | 1 | 2; message?: string }>): unknown;
  /** Attach an error to this administrative request. */
  recordException(error: Error): void;
  /** End the request span exactly once. */
  end(): void;
}
