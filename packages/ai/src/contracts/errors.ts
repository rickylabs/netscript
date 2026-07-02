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
