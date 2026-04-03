/*
 * Graph parser for contract dependency discovery.
 */

import { readFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";

import { glob } from "glob";
import { JSON_SCHEMA, load as loadYaml } from "js-yaml";

import { pathExists } from "../utils/file.js";

export type GraphContractState = "active" | "draft" | "deprecated" | "retired";

interface ParsedContractDocument extends Record<string, unknown> {
  readonly id?: unknown;
  readonly state?: unknown;
  readonly dependencies?: unknown;
  readonly migration_path?: unknown;
  readonly open_questions?: unknown;
}

export interface GraphContractNode {
  readonly id: string;
  readonly state: GraphContractState;
  readonly domain: string;
  readonly filePath: string;
  readonly dependencies: readonly string[];
  readonly migrationPath: string | null;
  readonly openQuestions: readonly string[];
}

export interface GraphSummary {
  readonly totalCapabilities: number;
  readonly totalEdges: number;
  readonly orphanCount: number;
  readonly states: Readonly<Record<GraphContractState, number>>;
}

export interface GraphCycle {
  readonly path: readonly string[];
}

export interface GraphDomainSummary {
  readonly domain: string;
  readonly capabilities: number;
  readonly active: number;
  readonly draft: number;
  readonly deprecated: number;
}

export interface CapabilityGraph {
  readonly repoRoot: string;
  readonly nodes: readonly GraphContractNode[];
  readonly cycles: readonly GraphCycle[];
  readonly summary: GraphSummary;
  readonly domainSummary: readonly GraphDomainSummary[];
  readonly adjacency: ReadonlyMap<string, readonly string[]>;
  readonly dependents: ReadonlyMap<string, readonly string[]>;
}

export interface ParseCapabilityGraphOptions {
  readonly scope?: string;
  readonly capability?: string;
  readonly domain?: string;
  readonly state?: GraphContractState;
}

export interface ParseCapabilityGraphRuntime {
  readonly cwd: string;
}

const CONTRACT_ID_PATTERN = /^[a-z0-9]+(?:\/[a-z0-9]+)+$/;
const CONTRACT_STATE_VALUES = new Set<GraphContractState>(["active", "draft", "deprecated", "retired"]);
const IGNORED_GLOB_PATTERNS = [
  "**/node_modules/**",
  "**/.git/**",
  "**/dist/**",
  "**/build/**"
] as const;

export async function parseCapabilityGraph(
  options: ParseCapabilityGraphOptions,
  runtime: ParseCapabilityGraphRuntime = { cwd: process.cwd() }
): Promise<CapabilityGraph> {
  const repoRoot = await findRepoRoot(resolve(runtime.cwd));
  const contractsRoot = join(repoRoot, "cdad");

  if (!(await pathExists(contractsRoot))) {
    throw new Error(`Contracts directory not found: ${contractsRoot}`);
  }

  const contractPaths = await discoverContractFiles(contractsRoot);
  const parsedNodes = await Promise.all(contractPaths.map((filePath) => parseContractNode(filePath, repoRoot)));
  const nodes = filterGraphNodes(parsedNodes, options);

  if (nodes.length === 0) {
    throw new Error("No contracts matched the requested graph scope.");
  }

  const adjacency = buildAdjacency(nodes);
  const dependents = buildDependents(nodes);

  return {
    repoRoot,
    nodes,
    cycles: detectCycles(adjacency),
    summary: computeSummary(nodes, adjacency, dependents),
    domainSummary: computeDomainSummary(nodes),
    adjacency,
    dependents
  };
}

async function discoverContractFiles(rootDir: string): Promise<string[]> {
  const matches = await glob("**/contract.{yaml,yml}", {
    cwd: rootDir,
    absolute: true,
    nodir: true,
    ignore: [...IGNORED_GLOB_PATTERNS]
  });

  return [...new Set(matches)].sort();
}

async function parseContractNode(filePath: string, repoRoot: string): Promise<GraphContractNode> {
  const raw = await readFile(filePath, "utf8");
  const parsed = loadYaml(raw, { schema: JSON_SCHEMA }) as unknown;

  if (!isContractDocument(parsed)) {
    throw new Error(`Contract could not be parsed from ${filePath}.`);
  }

  const id = readStringProperty(parsed, "id");
  if (!id || !CONTRACT_ID_PATTERN.test(id)) {
    throw new Error(`Contract id is missing or invalid in ${filePath}.`);
  }

  const state = readStringProperty(parsed, "state");
  if (!state || !CONTRACT_STATE_VALUES.has(state as GraphContractState)) {
    throw new Error(`Contract state is missing or invalid in ${filePath}.`);
  }

  return {
    id,
    state: state as GraphContractState,
    domain: id.split("/")[0] ?? "unknown",
    filePath: relative(repoRoot, filePath) || filePath,
    dependencies: extractDependencyIds(parsed),
    migrationPath: readStringProperty(parsed, "migration_path"),
    openQuestions: readStringArray(parsed, "open_questions") ?? []
  };
}

function filterGraphNodes(
  nodes: readonly GraphContractNode[],
  options: ParseCapabilityGraphOptions
): GraphContractNode[] {
  const normalizedScope = normalizeScope(options.scope);
  const stateFilter = normalizeStateFilter(options.state);
  const baseNodes = nodes.filter((node) => {
    if (normalizedScope && !node.id.startsWith(normalizedScope)) {
      return false;
    }

    if (options.domain && node.domain !== options.domain) {
      return false;
    }

    if (stateFilter && node.state !== stateFilter) {
      return false;
    }

    return true;
  });

  if (!options.capability) {
    return baseNodes;
  }

  const byId = new Map(baseNodes.map((node) => [node.id, node] as const));
  if (!byId.has(options.capability)) {
    throw new Error(`Capability not found in the current graph scope: ${options.capability}`);
  }

  const selected = new Set<string>();
  const stack = [options.capability];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || selected.has(current)) {
      continue;
    }

    selected.add(current);
    const node = byId.get(current);
    for (const dependency of node?.dependencies ?? []) {
      if (byId.has(dependency)) {
        stack.push(dependency);
      }
    }
  }

  return baseNodes.filter((node) => selected.has(node.id));
}

function buildAdjacency(nodes: readonly GraphContractNode[]): ReadonlyMap<string, readonly string[]> {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const adjacency = new Map<string, readonly string[]>();

  for (const node of nodes) {
    adjacency.set(
      node.id,
      node.dependencies.filter((dependency) => nodeIds.has(dependency)).sort()
    );
  }

  return adjacency;
}

function buildDependents(nodes: readonly GraphContractNode[]): ReadonlyMap<string, readonly string[]> {
  const dependents = new Map<string, string[]>();

  for (const node of nodes) {
    dependents.set(node.id, []);
  }

  for (const node of nodes) {
    for (const dependency of node.dependencies) {
      const bucket = dependents.get(dependency);
      if (bucket) {
        bucket.push(node.id);
      }
    }
  }

  return new Map(
    [...dependents.entries()].map(([id, values]) => [id, [...values].sort()] as const)
  );
}

function detectCycles(adjacency: ReadonlyMap<string, readonly string[]>): readonly GraphCycle[] {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];
  const cycles = new Map<string, GraphCycle>();

  const visit = (id: string): void => {
    if (visiting.has(id)) {
      const startIndex = stack.indexOf(id);
      const cyclePath = startIndex >= 0 ? [...stack.slice(startIndex), id] : [...stack, id];
      const signature = cyclePath.join(" -> ");
      cycles.set(signature, { path: cyclePath });
      return;
    }

    if (visited.has(id)) {
      return;
    }

    visiting.add(id);
    stack.push(id);

    for (const dependency of adjacency.get(id) ?? []) {
      visit(dependency);
    }

    stack.pop();
    visiting.delete(id);
    visited.add(id);
  };

  for (const id of adjacency.keys()) {
    visit(id);
  }

  return [...cycles.values()];
}

function computeSummary(
  nodes: readonly GraphContractNode[],
  adjacency: ReadonlyMap<string, readonly string[]>,
  dependents: ReadonlyMap<string, readonly string[]>
): GraphSummary {
  const states = {
    active: 0,
    draft: 0,
    deprecated: 0,
    retired: 0
  };

  let edges = 0;
  let orphanCount = 0;

  for (const node of nodes) {
    states[node.state] += 1;
    const nodeDependencies = adjacency.get(node.id) ?? [];
    edges += nodeDependencies.length;

    if (nodeDependencies.length === 0 && (dependents.get(node.id) ?? []).length === 0) {
      orphanCount += 1;
    }
  }

  return {
    totalCapabilities: nodes.length,
    totalEdges: edges,
    orphanCount,
    states
  };
}

function computeDomainSummary(nodes: readonly GraphContractNode[]): readonly GraphDomainSummary[] {
  const summary = new Map<string, GraphDomainSummary>();

  for (const node of nodes) {
    const existing = summary.get(node.domain) ?? {
      domain: node.domain,
      capabilities: 0,
      active: 0,
      draft: 0,
      deprecated: 0
    };

    const next = {
      ...existing,
      capabilities: existing.capabilities + 1,
      active: existing.active + (node.state === "active" ? 1 : 0),
      draft: existing.draft + (node.state === "draft" ? 1 : 0),
      deprecated: existing.deprecated + (node.state === "deprecated" ? 1 : 0)
    };

    summary.set(node.domain, next);
  }

  return [...summary.values()].sort((left, right) => left.domain.localeCompare(right.domain));
}

async function findRepoRoot(startDir: string): Promise<string> {
  let current = resolve(startDir);

  while (true) {
    if (await isRepoRoot(current)) {
      return current;
    }

    const parent = dirname(current);
    if (parent === current) {
      return resolve(startDir);
    }

    current = parent;
  }
}

async function isRepoRoot(candidate: string): Promise<boolean> {
  const packagePath = join(candidate, "package.json");
  if (!(await pathExists(packagePath))) {
    return false;
  }

  try {
    const source = await readFile(packagePath, "utf8");
    const parsed = JSON.parse(source) as { readonly name?: unknown };
    return parsed.name === "cdad";
  } catch {
    return false;
  }
}

function normalizeScope(scope: string | undefined): string | null {
  if (!scope) {
    return null;
  }

  const trimmed = scope.trim().replace(/^\.?\/*/, "");
  if (trimmed.length === 0) {
    return null;
  }

  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
}

function normalizeStateFilter(state: ParseCapabilityGraphOptions["state"]): GraphContractState | null {
  if (!state) {
    return null;
  }

  if (!CONTRACT_STATE_VALUES.has(state)) {
    throw new Error(`Unsupported state filter: ${state}`);
  }

  return state;
}

function extractDependencyIds(contract: ParsedContractDocument): readonly string[] {
  const dependencies = readArray(contract, "dependencies");
  if (!dependencies) {
    return [];
  }

  return dependencies
    .map((dependency) => {
      if (!isRecord(dependency)) {
        return null;
      }

      const id = readStringProperty(dependency, "id");
      return id ?? null;
    })
    .filter((value): value is string => typeof value === "string" && value.length > 0);
}

function readStringProperty(contract: ParsedContractDocument, key: string): string | null {
  const value = contract[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function readArray(contract: ParsedContractDocument, key: string): readonly unknown[] | null {
  const value = contract[key];
  return Array.isArray(value) ? value : null;
}

function readStringArray(contract: ParsedContractDocument, key: string): readonly string[] | null {
  const value = readArray(contract, key);
  if (!value) {
    return null;
  }

  return value.every((entry) => typeof entry === "string") ? (value as readonly string[]) : null;
}

function isContractDocument(value: unknown): value is ParsedContractDocument {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
