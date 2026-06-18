// SQL JSON Extension - handles JSON serialization for databases that store JSON as text
// (MSSQL stores as NVARCHAR(MAX), MySQL can use TEXT/VARCHAR instead of native JSON)
export {
  type JsonField,
  type JsonFieldConfig,
  jsonUtils,
  // Database-specific aliases
  mysqlJsonExtension,
  type PrismaExtensionConfig,
  type PrismaQueryContext,
  type PrismaQueryHandler,
  // Utilities
  registerJsonFields,
  // Configuration and types
  type SqlDatabaseType,
  // Main extension factory (generic)
  sqlJsonExtension,
  type SqlJsonExtensionOptions,
} from './sql-json.extension.ts';

// Re-export default for convenience
export { default as sqlJsonExtension_default } from './sql-json.extension.ts';
