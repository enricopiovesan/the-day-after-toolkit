/*
 * Validates toolkit JSON Schemas against the JSON Schema metaschema.
 * Spec reference: CI/model on UMA-code-examples and JSON Schemas.
 */

import { readdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { type ErrorObject, type Options } from "ajv";
import Ajv2020Import from "ajv/dist/2020.js";

export interface NamedSchemaDocument {
  readonly filePath: string;
  readonly schema: unknown;
}

export interface SchemaValidationFailure {
  readonly filePath: string;
  readonly message: string;
}

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(MODULE_DIR, "..", "..", "..");
const SCHEMAS_DIR = resolve(REPO_ROOT, "schemas");

/* eslint-disable no-unused-vars */
interface AjvInstance {
  validateSchema(schema: unknown): boolean;
  readonly errors?: readonly ErrorObject[] | null;
}

type AjvConstructor = new (...args: [Options?]) => AjvInstance;
/* eslint-enable no-unused-vars */

const Ajv2020 = Ajv2020Import as unknown as AjvConstructor;

export async function discoverSchemaFilePaths(rootDir: string = SCHEMAS_DIR): Promise<readonly string[]> {
  const fileNames = await readdir(rootDir);

  return fileNames
    .filter((fileName) => fileName.endsWith(".schema.json"))
    .sort()
    .map((fileName) => resolve(rootDir, fileName));
}

export async function readNamedSchemaDocuments(filePaths: readonly string[]): Promise<NamedSchemaDocument[]> {
  return Promise.all(
    filePaths.map(async (filePath) => ({
      filePath,
      schema: JSON.parse(await readFile(filePath, "utf8")) as unknown
    }))
  );
}

export function validateSchemaDocuments(documents: readonly NamedSchemaDocument[]): readonly SchemaValidationFailure[] {
  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    validateSchema: true,
    messages: true
  });

  return documents.flatMap((document) => {
    const valid = ajv.validateSchema(document.schema);

    if (valid) {
      return [];
    }

    return (ajv.errors ?? []).map((error: ErrorObject) => ({
      filePath: document.filePath,
      message: `${error.instancePath || "/"} ${error.message ?? "Schema is invalid."}`.trim()
    }));
  });
}

export async function validateToolkitSchemas(): Promise<readonly SchemaValidationFailure[]> {
  const documents = await readNamedSchemaDocuments(await discoverSchemaFilePaths());
  return validateSchemaDocuments(documents);
}

async function main(): Promise<void> {
  const schemaFilePaths = await discoverSchemaFilePaths();
  const failures = await validateToolkitSchemas();

  if (failures.length > 0) {
    console.error("Schema metaschema validation failed:");
    for (const failure of failures) {
      console.error(`- ${failure.filePath}: ${failure.message}`);
    }
    process.exit(1);
  }

  console.log(`Validated ${schemaFilePaths.length} schema files against the JSON Schema metaschema.`);
}

main().catch((error: unknown) => {
  console.error("Failed to validate toolkit schemas:");
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(String(error));
  }
  process.exit(1);
});
