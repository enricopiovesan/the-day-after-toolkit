/*
 * Static scan entry point for cdad check.
 * This module will inspect repo structure and file presence only, per spec.
 */

export interface StaticScanSignal {
  readonly label: string;
  readonly found: boolean;
  readonly score: number;
}

export async function scanRepository(): Promise<StaticScanSignal[]> {
  return [];
}
