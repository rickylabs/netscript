import type { ComponentChildren } from 'preact';
import type { ComponentContract } from '../../contracts.ts';

/** A style renders real sources using the same semantic scenarios. */
export interface ContractRenderFixture {
  readonly component: string;
  readonly scenario: string;
  /** Public inputs this render scenario exercises. */
  readonly props: readonly string[];
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
  /** The style's declared API, compared with the independent shared catalog. */
  readonly contracts: readonly ComponentContract[];
  /** Scenarios whose behavior must be exercised by browser keypress assertions. */
  readonly keyboard: readonly ContractKeyboardFixture[];
}

/** A named semantic keyboard scenario shared by style and browser fixtures. */
export interface ContractKeyboardFixture {
  readonly component: string;
  readonly scenario: string;
  readonly keys: readonly string[];
  readonly expectation: string;
}
