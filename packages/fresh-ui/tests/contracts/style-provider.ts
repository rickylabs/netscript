import type { ComponentChildren } from 'preact';

/** A style renders real sources using the same semantic scenarios. */
export interface ContractRenderFixture {
  readonly component: string;
  readonly scenario: string;
  readonly render?: () => ComponentChildren;
  /** Copy-only template implementations render in their consumer workspace. */
  readonly renderHtml?: () => Promise<string>;
  /** Conditional parts this scenario deliberately supplies. */
  readonly parts?: readonly string[];
  /** Attributes required in this scenario, independently of rendered output. */
  readonly attributes?: readonly string[];
  /** Context-only components have no DOM wrapper. */
  readonly contextOnly?: boolean;
  readonly expectedHtml?: string;
  /** Legacy runtime scope when the public contract name differs. */
  readonly scope?: string;
}

/** Add another style by supplying fixtures; the contract checker stays unchanged. */
export interface ContractStyleProvider {
  readonly style: string;
  readonly fixtures: readonly ContractRenderFixture[];
}
