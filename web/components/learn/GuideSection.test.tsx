import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GuideSection } from "./GuideSection";
import type { LearnTopic } from "@/data/learn-content";

const BASE_TOPIC: LearnTopic = {
  slug: "test-topic",
  title: "Test Topic",
  summary: "A summary of the test topic.",
  whenToUse: "Use this when testing.",
  steps: [{ title: "Do a thing", detail: "The detail of doing a thing." }],
  learnMoreUrl: "https://learn.microsoft.com/test",
  learnMoreLabel: "Read more about testing",
};

describe("GuideSection", () => {
  it("renders the topic title, summary, and when-to-use text", () => {
    render(<GuideSection topic={BASE_TOPIC} />);
    expect(screen.getByRole("heading", { name: "Test Topic" })).toBeInTheDocument();
    expect(screen.getByText("A summary of the test topic.")).toBeInTheDocument();
    expect(screen.getByText("Use this when testing.")).toBeInTheDocument();
  });

  it("renders the step walkthrough", () => {
    render(<GuideSection topic={BASE_TOPIC} />);
    expect(screen.getByText("Do a thing")).toBeInTheDocument();
  });

  it("renders the learn-more link with the correct href", () => {
    render(<GuideSection topic={BASE_TOPIC} />);
    expect(screen.getByRole("link", { name: /Read more about testing/ })).toHaveAttribute(
      "href",
      "https://learn.microsoft.com/test"
    );
  });

  it("does not render a diagram when the topic has none", () => {
    render(<GuideSection topic={BASE_TOPIC} />);
    expect(screen.queryByRole("figure")).not.toBeInTheDocument();
  });

  it("renders the matching diagram when the topic specifies one", () => {
    render(<GuideSection topic={{ ...BASE_TOPIC, diagram: "vibe-workflow" }} />);
    expect(screen.getByText("Prompt")).toBeInTheDocument();
  });

  it("renders callouts when present", () => {
    render(<GuideSection topic={{ ...BASE_TOPIC, callouts: ["Heads up: this is a callout."] }} />);
    expect(screen.getByText("Heads up: this is a callout.")).toBeInTheDocument();
  });
});
