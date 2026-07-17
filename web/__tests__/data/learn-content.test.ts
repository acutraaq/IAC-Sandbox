import { describe, it, expect } from "vitest";
import { LEARN_TOPICS } from "@/data/learn-content";

describe("LEARN_TOPICS", () => {
  it("has exactly 5 topics in the expected order", () => {
    expect(LEARN_TOPICS.map((t) => t.slug)).toEqual([
      "canvas-apps",
      "model-driven-apps",
      "vibe",
      "copilot-studio",
      "copilot-agents",
    ]);
  });

  it("gives every topic at least one step, a title, and a learn-more link", () => {
    for (const topic of LEARN_TOPICS) {
      expect(topic.title.length).toBeGreaterThan(0);
      expect(topic.summary.length).toBeGreaterThan(0);
      expect(topic.whenToUse.length).toBeGreaterThan(0);
      expect(topic.steps.length).toBeGreaterThan(0);
      expect(topic.learnMoreUrl).toMatch(/^https:\/\/learn\.microsoft\.com\//);
      expect(topic.learnMoreLabel.length).toBeGreaterThan(0);
    }
  });

  it("assigns each diagram to exactly one topic", () => {
    const diagrams = LEARN_TOPICS.map((t) => t.diagram).filter(Boolean);
    expect(diagrams).toEqual(["app-type-comparison", "vibe-workflow", "copilot-decision"]);
  });

  it("flags the vibe topic as a preview feature via its callouts", () => {
    const vibe = LEARN_TOPICS.find((t) => t.slug === "vibe");
    expect(vibe?.callouts?.some((c) => c.toLowerCase().includes("preview"))).toBe(true);
  });
});
