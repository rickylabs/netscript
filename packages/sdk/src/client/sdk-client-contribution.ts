/**
 * Definition helper for typed SDK client contributions.
 *
 * @module
 */

import type {
  SdkClientContextDeclaration,
  SdkClientContribution,
  SdkClientContributionId,
  SdkClientResponseCache,
} from '../ports/sdk-client-contribution.ts';
import { validateSdkClientContributions } from '../internal/client-contributions/prepared-call.ts';

/** Curried descriptor function returned by {@link defineSdkClientContribution}. */
export interface SdkClientContributionDefinition<TContext extends object> {
  /**
   * Preserve the descriptor's literal id, header keys, and response-cache mode.
   *
   * @param descriptor - Closed version-1 contribution descriptor.
   * @returns The same typed contribution descriptor.
   */
  <
    const TId extends SdkClientContributionId,
    const THeaderKeys extends readonly string[],
    const TResponseCache extends SdkClientResponseCache<TContext>,
  >(
    descriptor:
      & Omit<
        SdkClientContribution<
          TId,
          TContext,
          SdkClientContextDeclaration<TContext>,
          THeaderKeys
        >,
        'headerKeys' | 'responseCache'
      >
      & {
        readonly headerKeys: THeaderKeys;
        readonly responseCache: TResponseCache;
      },
  ):
    & Omit<
      SdkClientContribution<
        TId,
        TContext,
        SdkClientContextDeclaration<TContext>,
        THeaderKeys
      >,
      'responseCache'
    >
    & { readonly responseCache: TResponseCache };
}

/**
 * Define a typed SDK client contribution without widening its literal descriptor fields.
 *
 * @example
 * ```ts
 * const locale = defineSdkClientContribution<{ locale?: string }>()({
 *   protocol: { family: 'netscript.sdk-client', major: 1 },
 *   id: 'app:locale',
 *   context: { locale: 'optional' },
 *   headerKeys: ['accept-language'],
 *   responseCache: { mode: 'invariant' },
 *   prepare: ({ context }) => {
 *     const headers: Record<string, string> = {};
 *     if (context.locale) headers['accept-language'] = context.locale;
 *     return { headers };
 *   },
 * });
 * ```
 *
 * @returns A descriptor function bound to the contribution context type.
 */
export function defineSdkClientContribution<
  TContext extends object = Record<never, never>,
>(): SdkClientContributionDefinition<TContext> {
  function defineContribution<
    const TId extends SdkClientContributionId,
    const THeaderKeys extends readonly string[],
    const TResponseCache extends SdkClientResponseCache<TContext>,
  >(
    descriptor:
      & Omit<
        SdkClientContribution<
          TId,
          TContext,
          SdkClientContextDeclaration<TContext>,
          THeaderKeys
        >,
        'headerKeys' | 'responseCache'
      >
      & {
        readonly headerKeys: THeaderKeys;
        readonly responseCache: TResponseCache;
      },
  ):
    & Omit<
      SdkClientContribution<
        TId,
        TContext,
        SdkClientContextDeclaration<TContext>,
        THeaderKeys
      >,
      'responseCache'
    >
    & { readonly responseCache: TResponseCache } {
    validateSdkClientContributions([descriptor]);
    return descriptor;
  }

  return defineContribution;
}
