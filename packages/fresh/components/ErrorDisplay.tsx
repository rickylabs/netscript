/**
 * Error Display Component
 *
 * Extensible error display using render props pattern
 * Server-rendered only - no island needed
 *
 * Provides error primitives to custom components for consistent error handling
 * Uses error classification from utils (following HTTP standards)
 */

import type { ErrorData, ErrorType } from '../error/handler.ts';
import type { ErrorPrimitives } from '../error/primitives.ts';
import type { ComponentChildren } from 'preact';
export type { ErrorPrimitives } from '../error/primitives.ts';

// ============================================================================
// ERROR PRIMITIVES - Strongly typed props for custom error components
// ============================================================================

// ============================================================================
// COMPONENT TYPES
// ============================================================================

export interface ErrorDisplayProps {
  error: ErrorData;
  title?: string;
  showRetry?: boolean;
  /**
   * Render function or component - receives error primitives
   * @example
   * ```tsx
   * <ErrorDisplay error={error}>
   *   {(props) => <StatsError {...props} />}
   * </ErrorDisplay>
   * ```
   */
  children?: ComponentChildren | ((props: ErrorPrimitives) => ComponentChildren);
}

// ============================================================================
// ERROR PRIMITIVES FACTORY
// ============================================================================

/**
 * Create strongly-typed error primitives from ErrorData
 * Uses error type classification from utils (HTTP standards)
 */
function createErrorPrimitives(error: ErrorData, title?: string): ErrorPrimitives {
  // Error type is already classified in utils following HTTP standards
  const { type, status, code, message, retry, timestamp } = error;

  // Choose icon based on error type (from utils classification)
  const errorIcon = type === 'server' ? '🔥' : type === 'client' ? '⚠️' : '❌';

  // Choose colors based on error type
  const bgColor = type === 'server'
    ? 'bg-red-50'
    : type === 'client'
    ? 'bg-yellow-50'
    : 'bg-gray-50';

  const borderColor = type === 'server'
    ? 'border-red-200'
    : type === 'client'
    ? 'border-yellow-200'
    : 'border-gray-200';

  const textColor = type === 'server'
    ? 'text-red-800'
    : type === 'client'
    ? 'text-yellow-800'
    : 'text-gray-800';

  return {
    error,
    errorTitle: title || 'Error',
    errorMessage: message,
    errorCode: code,
    errorType: type,
    errorStatus: status,
    errorTimestamp: timestamp,
    errorIcon,
    isRetryable: retry,
    bgColor,
    borderColor,
    textColor,
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Display error - uses render props if provided, otherwise shows default card
 */
export function ErrorDisplay({
  error,
  title = 'Error',
  showRetry = true,
  children,
}: ErrorDisplayProps): ComponentChildren {
  const primitives = createErrorPrimitives(error, title);

  // If children is a function (render props), call it with primitives
  if (typeof children === 'function') {
    return <>{children(primitives)}</>;
  }

  // If children is a component, render it directly
  if (children) {
    return <>{children}</>;
  }

  // Default error display
  return (
    <div
      class={`${primitives.bgColor} border ${primitives.borderColor} rounded-lg p-6 shadow-sm`}
    >
      <div class='flex items-start'>
        <div class='flex-shrink-0'>
          <span class='text-3xl' role='img' aria-label='Error icon'>
            {primitives.errorIcon}
          </span>
        </div>
        <div class='ml-4 flex-1'>
          <h3 class={`text-lg font-medium ${primitives.textColor}`}>
            {primitives.errorTitle}
          </h3>
          <div class='mt-2'>
            <p class={`text-sm ${primitives.textColor}`}>
              {primitives.errorMessage}
            </p>
            {primitives.errorCode && (
              <p class='text-xs text-gray-500 mt-1'>
                Error code: {primitives.errorCode}
              </p>
            )}
          </div>
          {showRetry && primitives.isRetryable && (
            <div class='mt-4'>
              <a
                type='button'
                href={globalThis.location?.href || '#'}
                class='inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              >
                Retry
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

/**
 * Inline error display for smaller contexts
 */
export function InlineError({ error }: { error: ErrorData }): ComponentChildren {
  const primitives = createErrorPrimitives(error);

  return (
    <div class='rounded-md bg-red-50 p-4'>
      <div class='flex'>
        <div class='flex-shrink-0'>
          <span class='text-red-400'>{primitives.errorIcon}</span>
        </div>
        <div class='ml-3'>
          <p class='text-sm font-medium text-red-800'>
            {primitives.errorMessage}
          </p>
        </div>
      </div>
    </div>
  );
}
