/*
 * Reader for optional cdad.config.json.
 */

export interface CdadConfig {
  readonly contracts_directory: string;
  readonly report_output: string;
  readonly roadmap_output: string;
  readonly graph_output_directory: string;
}

export function defaultConfig(): CdadConfig {
  return {
    contracts_directory: "cdad",
    report_output: "cdad-report.md",
    roadmap_output: "cdad-roadmap.md",
    graph_output_directory: "."
  };
}
