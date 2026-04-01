/*
 * Shared terminal formatting helpers for consistent CLI output.
 */

export function formatHeader(command: string, description: string): string {
  const header = `cdad ${command} — ${description}`;
  return `${header}\n${"─".repeat(header.length)}`;
}
