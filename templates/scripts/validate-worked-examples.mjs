#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(new URL("../../cli/package.json", import.meta.url));
const yaml = require("js-yaml");
const Ajv2020 = require("ajv/dist/2020");

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "..", "..");

const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false });

const WORKED_EXAMPLES = [
  {
    schema: "minimum-viable-contract.schema.json",
    directory: "templates/worked-examples/payment-retry"
  },
  {
    schema: "extended-contract.schema.json",
    directory: "templates/worked-examples/payment-retry-extended"
  }
];

let hadError = false;

function fail(message) {
  console.error(message);
  hadError = true;
}

function stripComment(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const { _comment, ...rest } = value;
    return rest;
  }

  return value;
}

function parseMarkdownFrontmatter(markdown, filePath) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!match) {
    fail(`${filePath}: missing YAML frontmatter block`);
    return null;
  }

  try {
    return {
      frontmatter: yaml.load(match[1]),
      body: match[2]
    };
  } catch (error) {
    fail(`${filePath}: invalid YAML frontmatter: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

async function validateWorkedExample(example) {
  const exampleDir = resolve(repoRoot, example.directory);
  const yamlPath = resolve(exampleDir, "contract.yaml");
  const jsonPath = resolve(exampleDir, "contract.json");
  const markdownPath = resolve(exampleDir, "contract.md");
  const schemaPath = resolve(repoRoot, "schemas", example.schema);

  const [yamlSource, jsonSource, markdownSource, schemaSource] = await Promise.all([
    readFile(yamlPath, "utf8"),
    readFile(jsonPath, "utf8"),
    readFile(markdownPath, "utf8"),
    readFile(schemaPath, "utf8")
  ]);

  const contract = yaml.load(yamlSource);
  const parsedJson = JSON.parse(jsonSource);
  const schema = JSON.parse(schemaSource);
  const validate = ajv.compile(schema);

  if (!validate(contract)) {
    fail(`${yamlPath}: schema validation failed\n${ajv.errorsText(validate.errors, { separator: "\n" })}`);
  }

  if (JSON.stringify(stripComment(parsedJson)) !== JSON.stringify(contract)) {
    fail(`${jsonPath}: JSON artifact is not synchronized with contract.yaml`);
  }

  const parsedMarkdown = parseMarkdownFrontmatter(markdownSource, markdownPath);
  if (!parsedMarkdown) {
    return;
  }

  const { frontmatter, body } = parsedMarkdown;
  if (frontmatter?.source !== "contract.yaml") {
    fail(`${markdownPath}: frontmatter source must be contract.yaml`);
  }
  if (frontmatter?.generated_by !== "cdad") {
    fail(`${markdownPath}: frontmatter generated_by must be cdad`);
  }
  if (frontmatter?.do_not_edit !== true) {
    fail(`${markdownPath}: frontmatter do_not_edit must be true`);
  }
  if (typeof frontmatter?.last_synced !== "string" || frontmatter.last_synced.length === 0) {
    fail(`${markdownPath}: frontmatter last_synced must be present`);
  }

  const requiredHeadings = [
    "## What this capability does",
    "## What it needs",
    "## What it promises",
    "## What it does NOT do",
    "## Business context",
    "## Behavioral rules",
    "## Known constraints and history",
    "## Dependencies",
    "## Open questions"
  ];

  if (typeof contract?.id === "string" && !body.includes(`**ID:** \`${contract.id}\``)) {
    fail(`${markdownPath}: markdown body is missing the contract ID`);
  }
  if (typeof contract?.version === "string" && !body.includes(`**Version:** ${contract.version}`)) {
    fail(`${markdownPath}: markdown body is missing the contract version`);
  }
  if (typeof contract?.owner === "string" && !body.includes(`**Owner:** ${contract.owner}`)) {
    fail(`${markdownPath}: markdown body is missing the contract owner`);
  }
  if (typeof contract?.state === "string" && !body.includes(`**State:** ${contract.state}`)) {
    fail(`${markdownPath}: markdown body is missing the contract state`);
  }

  for (const heading of requiredHeadings) {
    if (!body.includes(heading)) {
      fail(`${markdownPath}: markdown body is missing the ${heading} section`);
    }
  }
}

async function main() {
  for (const example of WORKED_EXAMPLES) {
    await validateWorkedExample(example);
  }

  if (hadError) {
    process.exit(1);
  }

  console.log("Worked example template integrity checks passed.");
}

main().catch((error) => {
  fail(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
