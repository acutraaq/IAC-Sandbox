import { describe, it, expect } from "vitest";
import { LEARN_TOPICS } from "./learn-content";

describe("LEARN_TOPICS content invariants", () => {
  it("has 5 topics", () => {
    expect(LEARN_TOPICS).toHaveLength(5);
  });

  it("gives every step a non-empty title and detail", () => {
    for (const topic of LEARN_TOPICS) {
      for (const step of topic.steps) {
        expect(step.title.length).toBeGreaterThan(0);
        expect(step.detail.length).toBeGreaterThan(0);
      }
    }
  });

  it("never has an empty subSteps array when the field is present", () => {
    for (const topic of LEARN_TOPICS) {
      for (const step of topic.steps) {
        if (step.subSteps) {
          expect(step.subSteps.length).toBeGreaterThan(0);
          for (const subStep of step.subSteps) {
            expect(subStep.length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it("never has a blank expectedResult or pitfall string when the field is present", () => {
    for (const topic of LEARN_TOPICS) {
      for (const step of topic.steps) {
        if (step.expectedResult !== undefined) {
          expect(step.expectedResult.trim().length).toBeGreaterThan(0);
        }
        if (step.pitfall !== undefined) {
          expect(step.pitfall.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("gives at least one step per topic an expectedResult or a pitfall", () => {
    for (const topic of LEARN_TOPICS) {
      const enriched = topic.steps.some(
        (step) => step.expectedResult !== undefined || step.pitfall !== undefined
      );
      expect(enriched).toBe(true);
    }
  });
});
