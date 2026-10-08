/** Named command boundaries; relay boundaries belong to the later relay kit. */
export type CommandFaultBoundary =
  | 'before_transaction'
  | 'after_claim'
  | 'after_handler'
  | 'after_audit'
  | 'after_outbox'
  | 'after_receipt_complete'
  | 'after_commit_before_return';

/** Private construction seam, absent from production options and public manifests. */
export type CommandBoundaryObserver = (boundary: CommandFaultBoundary) => void;
