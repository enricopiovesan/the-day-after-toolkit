/*
 * Shared schema references for contract validation.
 */

export const CONTRACT_SCHEMA_FILES = {
  minimumViable: "schemas/minimum-viable-contract.schema.json",
  extended: "schemas/extended-contract.schema.json",
  report: "schemas/cdad-report.schema.json",
  config: "schemas/cdad-config.schema.json"
} as const;
