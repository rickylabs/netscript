/**
 * Multimodal message content vocabulary.
 *
 * These types describe the shape of a single message's payload independent of
 * any provider. They intentionally mirror the content-part model used by
 * `@tanstack/ai` (which the E2 provider adapters wrap) so a provider can map
 * one-to-one without a lossy translation layer — but this core takes **no**
 * dependency on that package.
 *
 * @module
 */

/**
 * Input/output modality carried by a {@linkcode ContentPart}.
 */
export type ContentModality = 'text' | 'image' | 'audio' | 'video' | 'document';

/**
 * Inline (base64) binary content source. A `mimeType` is required so providers
 * receive an unambiguous content type.
 */
export interface DataContentSource {
  /** Discriminant marking an inline data source. */
  readonly type: 'data';
  /** Base64-encoded content value. */
  readonly value: string;
  /** MIME type of the content (e.g. `image/png`, `audio/wav`). */
  readonly mimeType: string;
}

/**
 * URL-referenced content source. `mimeType` is an optional hint for providers
 * that cannot infer it from the URL.
 */
export interface UrlContentSource {
  /** Discriminant marking a URL-referenced source. */
  readonly type: 'url';
  /** HTTP(S) URL or data URI pointing to the content. */
  readonly value: string;
  /** Optional MIME type hint. */
  readonly mimeType?: string;
}

/**
 * Discriminated union of the ways binary/remote content can be supplied.
 */
export type ContentSource = DataContentSource | UrlContentSource;

/** Plain-text content part. */
export interface TextContentPart {
  /** Discriminant marking a text part. */
  readonly type: 'text';
  /** The text payload. */
  readonly text: string;
}

/** Image content part. */
export interface ImageContentPart {
  /** Discriminant marking an image part. */
  readonly type: 'image';
  /** Where the image bytes come from. */
  readonly source: ContentSource;
}

/** Audio content part. */
export interface AudioContentPart {
  /** Discriminant marking an audio part. */
  readonly type: 'audio';
  /** Where the audio bytes come from. */
  readonly source: ContentSource;
}

/** Video content part. */
export interface VideoContentPart {
  /** Discriminant marking a video part. */
  readonly type: 'video';
  /** Where the video bytes come from. */
  readonly source: ContentSource;
}

/** Document (e.g. PDF) content part. */
export interface DocumentContentPart {
  /** Discriminant marking a document part. */
  readonly type: 'document';
  /** Where the document bytes come from. */
  readonly source: ContentSource;
}

/**
 * Any single multimodal content part.
 */
export type ContentPart =
  | TextContentPart
  | ImageContentPart
  | AudioContentPart
  | VideoContentPart
  | DocumentContentPart;

/**
 * A message body: either a bare string (the common text case) or an ordered
 * list of multimodal parts.
 */
export type MessageContent = string | readonly ContentPart[];
