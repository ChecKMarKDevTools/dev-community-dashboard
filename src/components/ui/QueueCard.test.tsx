import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { QueueCard } from "./QueueCard";

describe("QueueCard", () => {
  it("renders children inside CardContent", () => {
    render(
      <QueueCard selected={false} onClick={() => {}}>
        <h3>Post Title</h3>
      </QueueCard>,
    );
    expect(screen.getByText("Post Title")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    render(
      <QueueCard selected={false} onClick={handleClick}>
        <p>Click me</p>
      </QueueCard>,
    );
    fireEvent.click(screen.getByText("Click me").closest("div.border")!);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("applies selected styles when selected is true", () => {
    const { container } = render(
      <QueueCard selected={true} onClick={() => {}}>
        <p>Selected</p>
      </QueueCard>,
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("ring-2");
    expect(card.className).toContain("bg-brand-50");
  });

  it("applies unselected styles when selected is false", () => {
    const { container } = render(
      <QueueCard selected={false} onClick={() => {}}>
        <p>Not selected</p>
      </QueueCard>,
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("bg-white");
    expect(card.className).not.toContain("ring-2");
  });

  it("applies custom className", () => {
    const { container } = render(
      <QueueCard selected={false} onClick={() => {}} className="extra">
        <p>Content</p>
      </QueueCard>,
    );
    expect(container.firstChild).toHaveClass("extra");
  });

  it("has cursor-pointer class for interaction hint", () => {
    const { container } = render(
      <QueueCard selected={false} onClick={() => {}}>
        <p>Pointer</p>
      </QueueCard>,
    );
    expect(container.firstChild).toHaveClass("cursor-pointer");
  });

  it("wraps children in p-4 content area", () => {
    render(
      <QueueCard selected={false} onClick={() => {}}>
        <span data-testid="inner">Inner</span>
      </QueueCard>,
    );
    const inner = screen.getByTestId("inner");
    const content = inner.closest(".p-4");
    expect(content).toBeInTheDocument();
  });
});
