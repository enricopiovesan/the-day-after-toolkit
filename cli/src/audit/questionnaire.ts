/*
 * Questionnaire helpers for the four legibility questions.
 * The functions in this module stay deterministic so the later CLI command
 * can prompt interactively while the domain scoring remains easy to test.
 */

import {
  LEGIBILITY_GAP_LABELS,
  LEGIBILITY_QUESTION_LABELS,
  LEGIBILITY_QUESTION_PROMPTS
} from "../constants.js";

import type {
  CapabilityAnswerSet,
  CapabilityAssessment,
  CapabilityGap,
  GapSeverity,
  LegibilityAnswer,
  LegibilityQuestionKey,
  QuestionnaireSummary
} from "./types.js";

export type { LegibilityAnswer } from "./types.js";
export { LEGIBILITY_QUESTION_PROMPTS };

export const LEGIBILITY_QUESTIONS = [
  {
    key: "businessRules",
    label: LEGIBILITY_QUESTION_LABELS.businessRules,
    prompt: LEGIBILITY_QUESTION_PROMPTS.businessRules
  },
  {
    key: "constraintHistory",
    label: LEGIBILITY_QUESTION_LABELS.constraintHistory,
    prompt: LEGIBILITY_QUESTION_PROMPTS.constraintHistory
  },
  {
    key: "dependencyRationale",
    label: LEGIBILITY_QUESTION_LABELS.dependencyRationale,
    prompt: LEGIBILITY_QUESTION_PROMPTS.dependencyRationale
  },
  {
    key: "exceptionLogic",
    label: LEGIBILITY_QUESTION_LABELS.exceptionLogic,
    prompt: LEGIBILITY_QUESTION_PROMPTS.exceptionLogic
  }
] as const;

const QUESTION_KEYS = [
  "businessRules",
  "constraintHistory",
  "dependencyRationale",
  "exceptionLogic"
] as const satisfies readonly LegibilityQuestionKey[];

const GAP_LABEL_BY_KEY: Record<LegibilityQuestionKey, { readonly absent: string; readonly partial: string }> = {
  businessRules: {
    absent: LEGIBILITY_GAP_LABELS.businessRules,
    partial: LEGIBILITY_GAP_LABELS.businessRulesPartial
  },
  constraintHistory: {
    absent: LEGIBILITY_GAP_LABELS.constraintHistory,
    partial: LEGIBILITY_GAP_LABELS.constraintHistoryPartial
  },
  dependencyRationale: {
    absent: LEGIBILITY_GAP_LABELS.dependencyRationale,
    partial: LEGIBILITY_GAP_LABELS.dependencyRationalePartial
  },
  exceptionLogic: {
    absent: LEGIBILITY_GAP_LABELS.exceptionLogic,
    partial: LEGIBILITY_GAP_LABELS.exceptionLogicPartial
  }
};

export function scoreLegibilityAnswer(answer: LegibilityAnswer): number {
  if (answer === "yes") {
    return 1;
  }

  if (answer === "partially") {
    return 0.5;
  }

  return 0;
}

export function scoreCapabilityAnswers(answers: CapabilityAnswerSet): number {
  return roundToSingleDecimal(
    scoreLegibilityAnswer(answers.businessRules) +
      scoreLegibilityAnswer(answers.constraintHistory) +
      scoreLegibilityAnswer(answers.dependencyRationale) +
      scoreLegibilityAnswer(answers.exceptionLogic)
  );
}

export function createCapabilityAssessment(
  capability: string,
  answers: CapabilityAnswerSet
): CapabilityAssessment {
  const score = scoreCapabilityAnswers(answers);
  const gaps = createCapabilityGaps(capability, answers);

  return {
    capability,
    answers,
    score,
    gaps
  };
}

export function createQuestionnaireSummary(
  capabilities: readonly CapabilityAssessment[]
): QuestionnaireSummary {
  const assessedCount = capabilities.length;
  const totalScore = capabilities.reduce((sum, capability) => sum + capability.score, 0);
  const score = assessedCount === 0 ? 0 : roundToSingleDecimal(totalScore / assessedCount);
  const gapInventory = capabilities.flatMap((capability) => capability.gaps);

  return {
    capabilities,
    assessedCount,
    maxScore: 4,
    score,
    gapInventory
  };
}

export function createCapabilityGaps(
  capability: string,
  answers: CapabilityAnswerSet
): CapabilityGap[] {
  const gaps: CapabilityGap[] = [];

  for (const key of QUESTION_KEYS) {
    const answer = answers[key];

    if (answer === "yes") {
      continue;
    }

    gaps.push({
      capability,
      gapType: key,
      label: getGapLabel(key, answer),
      severity: getGapSeverity(key, answer),
      answer
    });
  }

  return gaps;
}

export function getGapLabel(key: LegibilityQuestionKey, answer: LegibilityAnswer): string {
  return answer === "partially" ? GAP_LABEL_BY_KEY[key].partial : GAP_LABEL_BY_KEY[key].absent;
}

export function getGapSeverity(key: LegibilityQuestionKey, answer: LegibilityAnswer): GapSeverity {
  if (answer === "partially") {
    return "medium";
  }

  if (key === "businessRules" || key === "exceptionLogic") {
    return "critical";
  }

  return "high";
}

function roundToSingleDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}
