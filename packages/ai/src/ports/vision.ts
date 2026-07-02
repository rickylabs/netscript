/**
 * Vision provider port.
 *
 * Default is a throwing "unconfigured" port — image understanding requires an
 * explicit adapter (slice E7).
 *
 * @module
 */

import type { ContentSource } from '../contracts/content.ts';
import type { Usage } from '../contracts/usage.ts';
import { AiNotConfiguredError } from '../contracts/errors.ts';

/** A request to analyze an image with an optional guiding prompt. */
export interface VisionRequest {
  /** Vision model id. */
  readonly model: string;
  /** The image to analyze. */
  readonly image: ContentSource;
  /** Optional guiding prompt/question. */
  readonly prompt?: string;
}

/** The textual result of a vision analysis. */
export interface VisionResponse {
  /** The model's textual answer. */
  readonly text: string;
  /** Token usage for the request, when reported. */
  readonly usage?: Usage;
}

/**
 * The vision capability seam.
 */
export interface VisionProviderPort {
  /** Analyze an image, optionally guided by a prompt. */
  analyze(request: VisionRequest): Promise<VisionResponse>;
}

/**
 * Create the default throwing vision provider. Every call rejects with
 * {@linkcode AiNotConfiguredError}.
 */
export function createUnconfiguredVisionProvider(): VisionProviderPort {
  return {
    analyze(): Promise<VisionResponse> {
      return Promise.reject(
        new AiNotConfiguredError('vision', 'Inject a VisionProviderPort via createAiRuntime.'),
      );
    },
  };
}
