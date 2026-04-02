import { describe, expect, it } from "vitest";

import {
  LEGIBILITY_QUESTIONS,
  createCapabilityAssessment,
  createQuestionnaireSummary,
  scoreCapabilityAnswers,
  scoreLegibilityAnswer
} from "./questionnaire.js";
import {
  LEGIBILITY_QUESTION_PROMPTS,
  LEGIBILITY_QUESTION_LABELS
} from "../constants.js";

describe("questionnaire domain", () => {
  it("keeps the four legibility questions aligned with the spec wording", () => {
    expect(LEGIBILITY_QUESTIONS).toHaveLength(4);
    expect(LEGIBILITY_QUESTIONS.map((question) => question.prompt)).toEqual([
      LEGIBILITY_QUESTION_PROMPTS.businessRules,
      LEGIBILITY_QUESTION_PROMPTS.constraintHistory,
      LEGIBILITY_QUESTION_PROMPTS.dependencyRationale,
      LEGIBILITY_QUESTION_PROMPTS.exceptionLogic
    ]);
    expect(LEGIBILITY_QUESTIONS.map((question) => question.label)).toEqual([
      LEGIBILITY_QUESTION_LABELS.businessRules,
      LEGIBILITY_QUESTION_LABELS.constraintHistory,
      LEGIBILITY_QUESTION_LABELS.dependencyRationale,
      LEGIBILITY_QUESTION_LABELS.exceptionLogic
    ]);
  });

  it("scores answers using the yes/partially/no rubric", () => {
    expect(scoreLegibilityAnswer("yes")).toBe(1);
    expect(scoreLegibilityAnswer("partially")).toBe(0.5);
    expect(scoreLegibilityAnswer("no")).toBe(0);
  });

  it("builds a capability assessment with deterministic gaps", () => {
    const assessment = createCapabilityAssessment("payment/retry", {
      businessRules: "no",
      constraintHistory: "partially",
      dependencyRationale: "yes",
      exceptionLogic: "no"
    });

    expect(scoreCapabilityAnswers(assessment.answers)).toBe(1.5);
    expect(assessment.score).toBe(1.5);
    expect(assessment.gaps).toHaveLength(3);
    expect(assessment.gaps.map((gap) => gap.severity)).toEqual([
      "critical",
      "medium",
      "critical"
    ]);
  });

  it("averages multiple capability assessments into a questionnaire summary", () => {
    const questionnaire = createQuestionnaireSummary([
      createCapabilityAssessment("payment/retry", {
        businessRules: "no",
        constraintHistory: "partially",
        dependencyRationale: "yes",
        exceptionLogic: "no"
      }),
      createCapabilityAssessment("auth/session/login", {
        businessRules: "yes",
        constraintHistory: "yes",
        dependencyRationale: "yes",
        exceptionLogic: "yes"
      })
    ]);

    expect(questionnaire.assessedCount).toBe(2);
    expect(questionnaire.score).toBe(2.8);
    expect(questionnaire.gapInventory).toHaveLength(3);
  });
});
