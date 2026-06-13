import type { ErrorPrimitives } from './primitives.ts';
import type { ErrorData } from './types.ts';

export type { ErrorPrimitives } from './primitives.ts';

/** Renderable content accepted and returned by Fresh error display helpers. */
export type ErrorDisplayContent =
  | string
  | number
  | boolean
  | null
  | undefined
  | object
  | readonly ErrorDisplayContent[];

/** Props accepted by the default Fresh error display component. */
export interface ErrorDisplayProps {
  /** Normalized error payload to render. */
  error: ErrorData;
  /** Optional title shown above the error message. */
  title?: string;
  /** Whether retry affordances should be shown for retryable errors. */
  showRetry?: boolean;
  /** Optional render prop or replacement node for custom error presentation. */
  children?: ErrorDisplayContent | ((props: ErrorPrimitives) => ErrorDisplayContent);
}

function createErrorPrimitives(error: ErrorData, title?: string): ErrorPrimitives {
  const { type, status, code, message, retry, timestamp } = error;
  const errorIcon = type === 'server' ? '!' : type === 'client' ? '?' : 'x';
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

/** Render normalized Fresh error data with an overridable presentation slot. */
export function ErrorDisplay({
  error,
  title = 'Error',
  showRetry = true,
  children,
}: ErrorDisplayProps): ErrorDisplayContent {
  const primitives = createErrorPrimitives(error, title);

  if (typeof children === 'function') {
    return <>{children(primitives)}</>;
  }

  if (children) {
    return <>{children}</>;
  }

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

/** Render normalized Fresh error data in a compact inline layout. */
export function InlineError({ error }: { error: ErrorData }): ErrorDisplayContent {
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
