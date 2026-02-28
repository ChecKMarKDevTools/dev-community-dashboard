import { render, screen } from "@testing-library/react";
import { SignalItem } from "./SignalItem";

describe("SignalItem", () => {
  it("renders children text", () => {
    render(
      <ul>
        <SignalItem>Word Count: 500</SignalItem>
      </ul>,
    );
    expect(screen.getByText("Word Count: 500")).toBeInTheDocument();
  });

  it("renders tooltip with role=tooltip when tooltip prop is provided", () => {
    render(
      <ul>
        <SignalItem tooltip="Helpful description">Signal value</SignalItem>
      </ul>,
    );
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toBeInTheDocument();
    expect(tooltip.textContent).toBe("Helpful description");
  });

  it("renders HelpCircle icon when tooltip is provided", () => {
    const { container } = render(
      <ul>
        <SignalItem tooltip="Some tip">Content</SignalItem>
      </ul>,
    );
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("renders spacer instead of icon when no tooltip", () => {
    const { container } = render(
      <ul>
        <SignalItem>Content</SignalItem>
      </ul>,
    );
    const svg = container.querySelector("svg");
    expect(svg).not.toBeInTheDocument();
    // Spacer span should exist
    const spacer = container.querySelector("span.w-4.shrink-0");
    expect(spacer).toBeInTheDocument();
  });

  it("renders as a list item", () => {
    render(
      <ul>
        <SignalItem>Item</SignalItem>
      </ul>,
    );
    const li = screen.getByText("Item").closest("li");
    expect(li).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(
      <ul>
        <SignalItem className="extra-class">Content</SignalItem>
      </ul>,
    );
    const li = screen.getByText("Content").closest("li");
    expect(li).toHaveClass("extra-class");
  });
});
