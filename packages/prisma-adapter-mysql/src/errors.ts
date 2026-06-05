/**
 * Error handling utilities for MySQL driver errors.
 *
 * Maps deno_mysql errors to Prisma driver adapter error format.
 */

import type {
  Error as DriverAdapterErrorObject,
  MappedError,
} from "@prisma/driver-adapter-utils";

/**
 * MySQL error structure from deno_mysql driver.
 */
export interface MySqlError {
  errno?: number;
  sqlMessage?: string | null;
  sqlState?: string | null;
  code?: string;
  message?: string;
  cause?: MySqlError;
}

/**
 * Converts a MySQL driver error to Prisma's error format.
 */
export function convertDriverError(error: unknown): DriverAdapterErrorObject {
  if (isDriverError(error)) {
    return {
      originalCode: (error.errno ?? 0).toString(),
      originalMessage: error.sqlMessage ?? error.message ?? "N/A",
      ...mapDriverError(error),
    };
  }

  // Re-throw non-driver errors
  throw error;
}

/**
 * Maps MySQL error codes to Prisma error kinds.
 */
export function mapDriverError(error: MySqlError): MappedError {
  const errno = error.errno ?? 0;

  switch (errno) {
    // Unique constraint violation
    case 1062: {
      const index = error.sqlMessage?.split(" ").pop()?.split("'").at(1)?.split(
        ".",
      ).pop();
      return {
        kind: "UniqueConstraintViolation",
        constraint: index !== undefined ? { index } : undefined,
      };
    }

    // Foreign key constraint violations
    case 1451:
    case 1452: {
      const field = error.sqlMessage?.split(" ").at(17)?.split("`").at(1);
      return {
        kind: "ForeignKeyConstraintViolation",
        constraint: field !== undefined ? { fields: [field] } : undefined,
      };
    }

    // Null constraint violation (from index)
    case 1263: {
      const index = error.sqlMessage?.split(" ").pop()?.split("'").at(1);
      return {
        kind: "NullConstraintViolation",
        constraint: index !== undefined ? { index } : undefined,
      };
    }

    // Value out of range
    case 1264:
      return {
        kind: "ValueOutOfRange",
        cause: error.sqlMessage ?? "N/A",
      };

    // Null constraint violation (from field)
    case 1364:
    case 1048: {
      const field = error.sqlMessage?.split(" ").at(1)?.split("'").at(1);
      return {
        kind: "NullConstraintViolation",
        constraint: field !== undefined ? { fields: [field] } : undefined,
      };
    }

    // Database does not exist
    case 1049: {
      const db = error.sqlMessage?.split(" ").pop()?.split("'").at(1);
      return {
        kind: "DatabaseDoesNotExist",
        db,
      };
    }

    // Database already exists
    case 1007: {
      const db = error.sqlMessage?.split(" ").at(3)?.split("'").at(1);
      return {
        kind: "DatabaseAlreadyExists",
        db,
      };
    }

    // Database access denied
    case 1044: {
      const db = error.sqlMessage?.split(" ").pop()?.split("'").at(1);
      return {
        kind: "DatabaseAccessDenied",
        db,
      };
    }

    // Authentication failed
    case 1045: {
      const user = error.sqlMessage?.split(" ").at(4)?.split("@").at(0)?.split(
        "'",
      ).at(1);
      return {
        kind: "AuthenticationFailed",
        user,
      };
    }

    // Table does not exist
    case 1146: {
      const table = error.sqlMessage?.split(" ").at(1)?.split("'").at(1)?.split(
        ".",
      ).pop();
      return {
        kind: "TableDoesNotExist",
        table,
      };
    }

    // Column not found
    case 1054: {
      const column = error.sqlMessage?.split(" ").at(2)?.split("'").at(1);
      return {
        kind: "ColumnNotFound",
        column,
      };
    }

    // Length mismatch (data too long)
    case 1406: {
      const column = error.sqlMessage
        ?.split(" ")
        .flatMap((part) => part.split("'"))
        .at(6);
      return {
        kind: "LengthMismatch",
        column,
      };
    }

    // Missing full-text search index
    case 1191:
      return {
        kind: "MissingFullTextSearchIndex",
      };

    // Transaction write conflict (deadlock)
    case 1213:
      return {
        kind: "TransactionWriteConflict",
      };

    // Too many connections
    case 1040:
    case 1203:
      return {
        kind: "TooManyConnections",
        cause: error.sqlMessage ?? "N/A",
      };

    // Default: return MySQL-specific error
    default:
      return {
        kind: "mysql",
        code: errno,
        message: error.sqlMessage ?? error.message ?? "N/A",
        state: error.sqlState ?? "N/A",
        cause: error.cause?.message ?? undefined,
      };
  }
}

/**
 * Type guard to check if an error is a MySQL driver error.
 */
function isDriverError(error: unknown): error is MySqlError {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const err = error as Record<string, unknown>;

  // deno_mysql errors have various structures, check for common properties
  return (
    typeof err.errno === "number" ||
    typeof err.sqlMessage === "string" ||
    typeof err.code === "string" ||
    (typeof err.message === "string" && err.message.includes("MySQL"))
  );
}
