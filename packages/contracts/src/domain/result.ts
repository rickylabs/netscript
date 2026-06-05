/** Successful result variant for expected fallible operations. */
export type OkResult<TValue> = Readonly<{
  ok: true;
  value: TValue;
}>;

/** Failed result variant for expected fallible operations. */
export type ErrorResult<TError> = Readonly<{
  ok: false;
  error: TError;
}>;

/** Discriminated result union for expected fallible operations. */
export type Result<TValue, TError> = OkResult<TValue> | ErrorResult<TError>;
