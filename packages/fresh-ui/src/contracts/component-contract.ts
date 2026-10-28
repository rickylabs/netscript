/** A serializable prop value; callbacks and render slots are described, never executed. */
export type ContractValue = string | number | boolean | null;

/** Public prop metadata shared by styles and tooling. */
export interface ContractProp {
  /** Value category, independent of a rendering framework's internal types. */
  readonly kind: 'text' | 'boolean' | 'number' | 'enum' | 'slot' | 'callback' | 'collection';
  /** Whether callers must supply this prop. */
  readonly required?: boolean;
  /** Enumerated values where the prop has a closed vocabulary. */
  readonly values?: readonly string[];
  /** Omitted-prop behavior. */
  readonly default?: ContractValue;
  /** Compatibility or behavior notes. */
  readonly description?: string;
}

/** A stable anatomy name; styles may change its element and surrounding markup. */
export interface ContractPart {
  /** Value of data-part. */
  readonly name: string;
  /** When this part is present; absent means unconditional. */
  readonly when?: string;
  /** Native internals and CSS decoration do not require extra layout elements. */
  readonly representation?: 'element' | 'native' | 'pseudo' | 'context';
  /** Planned anatomy is not falsely asserted against an existing style. */
  readonly planned?: boolean;
}

/** One independent data-attribute dimension. */
export interface ContractAttribute {
  /** Allowed serialized values, including booleans as true/false strings. */
  readonly values: readonly string[];
  /** Omitted prop's emitted value, when applicable. */
  readonly default?: string;
  /** Parts carrying this attribute; omitted or empty means component root. */
  readonly parts?: readonly string[];
  /** Older headless runtime values retained on documented parts, separate from canonical design values. */
  readonly compatibilityValues?: readonly string[];
  /** Design values not yet implemented by Utility. */
  readonly plannedValues?: readonly string[];
  /** Behavior and native/CSS-state representation notes. */
  readonly description?: string;
}

/** A replaceable content seam, never a backend data source. */
export interface ContractSlot {
  /** Public slot/prop name. */
  readonly name: string;
  /** Anatomy receiving the content. */
  readonly part: string;
}

/** Keyboard operation from an APG pattern or native HTML behavior. */
export interface ContractKey {
  /** Key or chord, with orientation-dependent keys stated explicitly. */
  readonly key: string;
  /** Observable operation. */
  readonly action: string;
}

/** Version-one component interface shared by every style. */
export interface ComponentContract {
  /** Stable kebab-case component identifier. */
  readonly name: string;
  /** Identity in the owner-approved Figma component spec. */
  readonly specId: string;
  /** Inventory category. */
  readonly category: string;
  /** Inventory priority. */
  readonly priority: 'P0' | 'P1' | 'P2';
  /** Whether a rendering implementation ships today. */
  readonly shipped: boolean;
  /** Public prop names and behavior. Native pass-through is described in notes. */
  readonly props: Readonly<Record<string, ContractProp>>;
  /** Stable anatomy. */
  readonly parts: readonly ContractPart[];
  /** Variant, size, state and independent axes use their actual data attribute names. */
  readonly attributes: Readonly<Record<`data-${string}`, ContractAttribute>>;
  /** Part-visibility props from the design spec. */
  readonly booleans: readonly string[];
  /** Replaceable content seams. */
  readonly slots: readonly ContractSlot[];
  /** APG pattern URL, or native HTML/noninteractive semantics. */
  readonly apg: string;
  /** Ordered keyboard operations; empty for noninteractive presentation. */
  readonly keyboard: readonly ContractKey[];
  /** Semantic Figma role names; no token values are embedded. */
  readonly tokenRoles: readonly string[];
  /** Compatibility and intentional native/planned differences. */
  readonly notes: readonly string[];
}

/** The JSON boundary, with an independent schema version. */
export interface ComponentContractCatalog {
  /** Schema version; changes require an explicit compatibility decision. */
  readonly schemaVersion: 1;
  /** Contracts available to styles, tests, documentation and Figma tooling. */
  readonly components: readonly ComponentContract[];
}
