/*
 * Prioritization logic for the extraction priority matrix.
 */

export function multiplyAxes(
  businessCriticality: number,
  tribalKnowledgeDensity: number,
  agentTouchpointFrequency: number
): number {
  return businessCriticality * tribalKnowledgeDensity * agentTouchpointFrequency;
}
