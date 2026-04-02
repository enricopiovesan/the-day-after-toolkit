/*
 * Scoring engine for cdad check and cdad roadmap.
 * This module keeps the weighted composite and phase bands deterministic so
 * the CLI and report renderer can share the same interpretation of a score.
 */

import type {
  CheckBand,
  QuestionnaireSummary,
  StaticScanSummary
} from "./types.js";

export const QUESTIONNAIRE_WEIGHT = 0.7;
export const STATIC_SCAN_WEIGHT = 0.3;
export const QUESTIONNAIRE_MAX_SCORE = 4;
export const STATIC_SCAN_MAX_SCORE = 10;
export const OVERALL_MAX_SCORE = 10;

export function computeOverallScore(
  questionnaireScore: number,
  staticScanScore: number
): number {
  const normalizedQuestionnaire = (questionnaireScore / QUESTIONNAIRE_MAX_SCORE) * OVERALL_MAX_SCORE;
  const weightedQuestionnaire = normalizedQuestionnaire * QUESTIONNAIRE_WEIGHT;
  const weightedStaticScan = staticScanScore * STATIC_SCAN_WEIGHT;
  return roundToSingleDecimal(weightedQuestionnaire + weightedStaticScan);
}

export function determineCheckBand(score: number): CheckBand {
  if (score >= 8) {
    return "green";
  }

  if (score >= 6) {
    return "yellow";
  }

  if (score >= 3) {
    return "amber";
  }

  return "red";
}

export function computeCheckScore(
  questionnaire: QuestionnaireSummary,
  staticScan: StaticScanSummary
): { readonly overallScore: number; readonly band: CheckBand } {
  const overallScore = computeOverallScore(questionnaire.score, staticScan.score);

  return {
    overallScore,
    band: determineCheckBand(overallScore)
  };
}

function roundToSingleDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}
