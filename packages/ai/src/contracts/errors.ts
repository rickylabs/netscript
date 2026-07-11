/**
 * Typed error hierarchy for the AI core.
 *
 * All errors derive from {@linkcode AiError} so callers can catch the whole
 * family with one `instanceof`. These are the only runtime *values* in the
 * contracts surface — everything else is a type.
 *
 * @module
 */

/**
 * Base class for every error raised by `@netscript/ai` and its adapters.
 */
export class AiError extends Error {
  /** Construct an AI error with a message and optional cause. */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'AiError';
  }
}

/**
 * Raised when a capability port is invoked but no concrete adapter has been
 * wired for it (the default throwing ports raise this).
 */
export class AiNotConfiguredError extends AiError {
  /** The capability seam that was not configured. */
  readonly capability: string;

  /** Construct the error for a named unconfigured `capability`. */
  constructor(capability: string, detail?: string) {
    super(
      `AI capability "${capability}" is not configured on this runtime.${
        detail ? ` ${detail}` : ''
      }`,
    );
    this.name = 'AiNotConfiguredError';
    this.capability = capability;
  }
}

/** Raised when a provider rejects an obsolete or invalid model-options shape. */
export class InvalidModelOptionsError extends AiError {
  /** Provider whose model-options contract rejected the bag. */
  readonly provider: string;
  /** HTTP-equivalent status for API edges exposing this typed error. */
  readonly statusCode: 400 = 400;

  /** Construct a bad-request error for a provider-specific options problem. */
  constructor(provider: string, detail: string) {
    super(`Invalid ${provider} model options: ${detail}`);
    this.name = 'InvalidModelOptionsError';
    this.provider = provider;
  }
}

/**
 * Raised when a model provider id cannot be resolved from the registry. The
 * remedy is almost always to import the provider package, which self-registers
 * via `registerModelProvider`.
 */
export class ModelProviderNotFoundError extends AiError {
  /** The unresolved provider id. */
  readonly providerId: string;
  /** Ids of providers that were registered at throw time. */
  readonly availableProviders: readonly string[];

  /** Construct the error for an unresolved `providerId`. */
  constructor(providerId: string, availableProviders: readonly string[]) {
    super(
      `No model provider registered for id "${providerId}". ` +
        `Registered providers: [${availableProviders.join(', ')}]. ` +
        `Import the provider package (which self-registers via registerModelProvider) before resolving.`,
    );
    this.name = 'ModelProviderNotFoundError';
    this.providerId = providerId;
    this.availableProviders = availableProviders;
  }
}

/**
 * Raised when a tool is requested from a registry that does not hold it.
 */
export class ToolNotFoundError extends AiError {
  /** The unresolved tool name. */
  readonly toolName: string;

  /** Construct the error for an unresolved `toolName`. */
  constructor(toolName: string) {
    super(`Tool "${toolName}" is not registered.`);
    this.name = 'ToolNotFoundError';
    this.toolName = toolName;
  }
}

/**
 * A single validation problem reported while checking tool input against its
 * Standard Schema. Mirrors a Standard Schema issue reduced to a plain path.
 */
export interface ToolInputIssue {
  /** Human-readable validation message. */
  readonly message: string;
  /** Property path to the offending value, when the schema reports one. */
  readonly path?: readonly PropertyKey[];
}

/**
 * Raised when a tool's raw input fails Standard Schema validation, before the
 * tool handler runs. Carries every reported {@linkcode ToolInputIssue}.
 */
export class ToolInputValidationError extends AiError {
  /** Name of the tool whose input failed validation. */
  readonly toolName: string;
  /** The validation issues reported by the tool's Standard Schema. */
  readonly issues: readonly ToolInputIssue[];

  /** Construct the error for `toolName` from its reported `issues`. */
  constructor(toolName: string, issues: readonly ToolInputIssue[]) {
    super(
      `Input for tool "${toolName}" failed validation: ${
        issues.map((issue) => issue.message).join('; ')
      }`,
    );
    this.name = 'ToolInputValidationError';
    this.toolName = toolName;
    this.issues = issues;
  }
}

/**
 * Raised when a model reference string cannot be parsed into a provider +
 * model pair.
 */
export class InvalidModelRefError extends AiError {
  /** The malformed model reference string. */
  readonly ref: string;

  /** Construct the error for a malformed model reference `ref`. */
  constructor(ref: string) {
    super(
      `Invalid model reference "${ref}". Expected "<provider>:<model>" or { provider, model }.`,
    );
    this.name = 'InvalidModelRefError';
    this.ref = ref;
  }
}
