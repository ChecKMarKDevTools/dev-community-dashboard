import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/Badge";

describe("Badge", () => {
  it("renders default badge", () => {
    render(<Badge>Test Badge</Badge>);
    const badge = screen.getByText("Test Badge");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-brand-500");
  });

  it("renders destructive badge", () => {
    render(<Badge variant="destructive">Error</Badge>);
    const badge = screen.getByText("Error");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-danger-500");
  });

  it("renders success badge", () => {
    render(<Badge variant="success">OK</Badge>);
    const badge = screen.getByText("OK");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-success-500");
  });

  it("renders warning badge", () => {
    render(<Badge variant="warning">Warn</Badge>);
    const badge = screen.getByText("Warn");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-warning-500");
  });

  it("renders secondary badge", () => {
    render(<Badge variant="secondary">Sec</Badge>);
    const badge = screen.getByText("Sec");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-brand-100");
  });

  it("renders outline badge", () => {
    render(<Badge variant="outline">Out</Badge>);
    const badge = screen.getByText("Out");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("text-foreground");
  });

  it("applies custom class names", () => {
    render(<Badge className="custom-class">Test</Badge>);
    const badge = screen.getByText("Test");
    expect(badge).toHaveClass("custom-class");
  });
});
