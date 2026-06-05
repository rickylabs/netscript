// SQL JSON Extension - handles JSON serialization for databases that store JSON as text
// (MSSQL stores as NVARCHAR(MAX), MySQL can use TEXT/VARCHAR instead of native JSON)
export {
  // Main extension factory (generic)
  sqlJsonExtension,
  // Database-specific aliases
  mssqlJsonExtension,
  mysqlJsonExtension,
  // Configuration and types
  type SqlDatabaseType,
  type SqlJsonExtensionOptions,
  type JsonFieldConfig,
  // Utilities
  registerJsonFields,
  jsonUtils,
  type JsonField,
} from './sql-json.extension.ts';

// Re-export default for convenience
export { default as sqlJsonExtension_default } from './sql-json.extension.ts';