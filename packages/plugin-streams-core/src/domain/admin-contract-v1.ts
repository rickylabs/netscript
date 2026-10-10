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
