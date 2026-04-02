/*
 * Shared terminal formatting helpers for consistent CLI output.
 */

import { TOOL_NAME } from "../constants.js";

export function formatHeader(command: string, description: string): string {
  const header = `${TOOL_NAME} ${command} — ${description}`;
  return `${header}\n${"─".repeat(header.length)}`;
}

export function formatNextStep(nextStep: string): string {
  return `Next step: ${nextStep}`;
}
