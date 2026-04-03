/*
 * Renderer for Mermaid and JSON graph outputs.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import type { CapabilityGraph, GraphContractNode } from "./parser.js";

export interface RenderCapabilityGraphOptions {
  readonly outputDir?: string;
  readonly includeMermaid?: boolean;
  readonly includeJson?: boolean;
}

export interface RenderCapabilityGraphResult {
  readonly markdownPath: string;
  readonly mermaidPath: string | null;
  readonly jsonPath: string | null;
  readonly markdown: string;
  readonly mermaid: string | null;
  readonly json: string | null;
}

const GRAPH_GENERATED_BY = "cdad graph";
const GRAPH_SCHEMA_VERSION = "1.0.0";

export async function renderCapabilityGraph(
  graph: CapabilityGraph,
  options: RenderCapabilityGraphOptions,
  now: Date
): Promise<RenderCapabilityGraphResult> {
  const outputDir = resolve(options.outputDir ?? ".");
  await mkdir(outputDir, { recursive: true });

  const mermaid = buildMermaid(graph);
  const markdown = buildGraphMarkdown(graph, now, mermaid);
  const json = JSON.stringify(buildGraphJson(graph, now), null, 2);

  const markdownPath = join(outputDir, "cdad-graph.md");
  const mermaidPath = options.includeMermaid === false ? null : join(outputDir, "cdad-graph.mmd");
  const jsonPath = options.includeJson === false ? null : join(outputDir, "cdad-graph.json");

  await writeFile(markdownPath, `${markdown}\n`, "utf8");

  if (mermaidPath) {
    await writeFile(mermaidPath, `${mermaid}\n`, "utf8");
  }

  if (jsonPath) {
    await writeFile(jsonPath, `${json}\n`, "utf8");
  }

  return {
    markdownPath,
    mermaidPath,
    jsonPath,
    markdown,
    mermaid: mermaidPath ? mermaid : null,
    json: jsonPath ? json : null
  };
}

function buildGraphJson(graph: CapabilityGraph, now: Date): Record<string, unknown> {
  const capabilityNodes = graph.nodes.map((node) => ({
    id: node.id,
    state: node.state,
    domain: node.domain,
    dependencies: [...(graph.adjacency.get(node.id) ?? [])],
    dependents: [...(graph.dependents.get(node.id) ?? [])],
    orphan: (graph.adjacency.get(node.id) ?? []).length === 0 && (graph.dependents.get(node.id) ?? []).length === 0
  }));

  return {
    generatedBy: GRAPH_GENERATED_BY,
    generatedAt: now.toISOString(),
    totalCapabilities: graph.summary.totalCapabilities,
    totalEdges: graph.summary.totalEdges,
    orphanCount: graph.summary.orphanCount,
    states: graph.summary.states,
    capabilities: capabilityNodes,
    cycles: graph.cycles.map((cycle) => [...cycle.path])
  };
}

function buildMermaid(graph: CapabilityGraph): string {
  const lines = ["graph TD"];

  for (const node of graph.nodes) {
    const nodeId = toMermaidNodeId(node.id);
    lines.push(`  ${nodeId}["${node.id}"]`);
  }

  for (const node of graph.nodes) {
    for (const dependency of graph.adjacency.get(node.id) ?? []) {
      lines.push(`  ${toMermaidNodeId(node.id)} --> ${toMermaidNodeId(dependency)}`);
    }
  }

  return lines.join("\n");
}

function buildGraphMarkdown(graph: CapabilityGraph, now: Date, mermaid: string): string {
  const deprecatedNodes = graph.nodes.filter((node) => node.state === "deprecated");
  const draftNodes = graph.nodes.filter((node) => node.state === "draft");
  const cycleSection = graph.cycles.length === 0
    ? "No circular dependencies detected."
    : graph.cycles.map((cycle) => `- ${cycle.path.join(" -> ")}`).join("\n");

  return [
    "---",
    `generated_by: ${GRAPH_GENERATED_BY}`,
    `generated_at: ${now.toISOString()}`,
    `total_capabilities: ${graph.summary.totalCapabilities}`,
    `active: ${graph.summary.states.active}`,
    `draft: ${graph.summary.states.draft}`,
    `deprecated: ${graph.summary.states.deprecated}`,
    `schema_version: ${GRAPH_SCHEMA_VERSION}`,
    "---",
    "",
    "# Capability Graph",
    "",
    "## Coverage Summary",
    "",
    `${graph.summary.totalCapabilities} capabilities contracted across ${graph.domainSummary.length} domains.`,
    "",
    "| Domain | Capabilities | Active | Draft | Deprecated |",
    "|---|---|---|---|---|",
    ...graph.domainSummary.map(
      (domain) =>
        `| ${domain.domain} | ${domain.capabilities} | ${domain.active} | ${domain.draft} | ${domain.deprecated} |`
    ),
    "",
    "## Dependency Map",
    "",
    "```mermaid",
    mermaid,
    "```",
    "",
    "## Circular Dependencies",
    "",
    cycleSection,
    "",
    "## Deprecated Capabilities",
    "",
    renderDeprecatedSection(deprecatedNodes),
    "",
    "## Draft Capabilities",
    "",
    renderDraftSection(draftNodes)
  ].join("\n");
}

function renderDeprecatedSection(nodes: readonly GraphContractNode[]): string {
  if (nodes.length === 0) {
    return "No deprecated capabilities in the current graph scope.";
  }

  return nodes
    .map((node) => `- ${node.id}: ${node.migrationPath ?? "No migration path declared."}`)
    .join("\n");
}

function renderDraftSection(nodes: readonly GraphContractNode[]): string {
  if (nodes.length === 0) {
    return "No draft capabilities in the current graph scope.";
  }

  return nodes
    .map((node) => {
      const questions = node.openQuestions.length === 0 ? "No open questions declared." : node.openQuestions.join(" | ");
      return `- ${node.id}: ${questions}`;
    })
    .join("\n");
}

function toMermaidNodeId(capabilityId: string): string {
  return capabilityId.replace(/[^a-zA-Z0-9]/g, "_");
}

export function renderGraphTerminalSummary(result: {
  readonly graph: CapabilityGraph;
  readonly markdownPath: string;
  readonly mermaidPath: string | null;
  readonly jsonPath: string | null;
}): string {
  const { graph } = result;
  const stateLines = [
    `  active:      ${graph.summary.states.active}`,
    `  draft:       ${graph.summary.states.draft}`,
    `  deprecated:  ${graph.summary.states.deprecated}`,
    `  retired:     ${graph.summary.states.retired}`
  ];
  const savedPaths = [
    result.mermaidPath ? `  ${result.mermaidPath}    [Mermaid source]` : null,
    result.jsonPath ? `  ${result.jsonPath}   [JSON adjacency list]` : null,
    `  ${result.markdownPath}     [Markdown report]`
  ].filter((line): line is string => typeof line === "string");
  const cycleLine = graph.cycles.length > 0
    ? `Circular dependencies detected: ${graph.cycles.length}`
    : "Circular dependencies detected: 0";

  return [
    "cdad graph",
    "──────────",
    "",
    `Found ${graph.summary.totalCapabilities} contracts.`,
    "",
    "Capabilities by state:",
    ...stateLines,
    "",
    `Dependency edges: ${graph.summary.totalEdges}`,
    `Orphan capabilities (no dependents, no dependencies): ${graph.summary.orphanCount}`,
    cycleLine,
    "",
    "Graph saved to:",
    ...savedPaths,
    "",
    `Coverage: ${graph.summary.totalCapabilities} capabilities contracted.`,
    "Run `cdad check` to see your updated agent-readiness score."
  ].join("\n");
}
