import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LearnTabs } from "./LearnTabs";
import { LEARN_TOPICS } from "@/data/learn-content";

describe("LearnTabs", () => {
  it("renders a tab for every topic", () => {
    render(<LearnTabs />);
    for (const topic of LEARN_TOPICS) {
      expect(screen.getByRole("button", { name: topic.title })).toBeInTheDocument();
    }
  });

  it("shows the first topic's content by default", () => {
    render(<LearnTabs />);
    expect(
      screen.getByRole("heading", { name: LEARN_TOPICS[0].title })
    ).toBeInTheDocument();
  });

  it("switches content when a different tab is selected", async () => {
    const user = userEvent.setup();
    render(<LearnTabs />);
    const secondTopic = LEARN_TOPICS[1];
    await user.click(screen.getByRole("button", { name: secondTopic.title }));
    expect(screen.getByRole("heading", { name: secondTopic.title })).toBeInTheDocument();
  });
});
