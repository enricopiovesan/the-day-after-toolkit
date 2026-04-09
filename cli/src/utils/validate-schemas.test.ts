import { describe, expect, it } from "vitest";

import { validateSchemaDocuments } from "./validate-schemas.js";

describe("validateSchemaDocuments", () => {
  it("accepts valid toolkit-like schemas", () => {
    const failures = validateSchemaDocuments([
      {
        filePath: "schemas/example.schema.json",
        schema: {
          $schema: "https://json-schema.org/draft/2020-12/schema",
          type: "object",
          properties: {
            id: {
              type: "string"
            }
          }
        }
      }
    ]);

    expect(failures).toEqual([]);
  });

  it("reports actionable metaschema failures", () => {
    const failures = validateSchemaDocuments([
      {
        filePath: "schemas/broken.schema.json",
        schema: {
          $schema: "https://json-schema.org/draft/2020-12/schema",
          type: 42
        }
      }
    ]);

    expect(failures.length).toBeGreaterThan(0);
    expect(failures[0]).toMatchObject({
      filePath: "schemas/broken.schema.json"
    });
    expect(failures[0]?.message).toContain("type");
  });
});
