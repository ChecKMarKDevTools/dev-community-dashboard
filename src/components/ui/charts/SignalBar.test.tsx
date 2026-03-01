import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SignalBar } from "./SignalBar";

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

describe("SignalBar", () => {
  describe("empty state", () => {
    it("renders 'No interaction data' when all values are zero", () => {
      render(<SignalBar strong={0} moderate={0} faint={0} />);
      expect(screen.getByText("No interaction data")).toBeInTheDocument();
    });

    it("does not render an SVG when total is zero", () => {
      const { container } = render(
        <SignalBar strong={0} moderate={0} faint={0} />,
      );
      expect(container.querySelector("svg")).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Normal rendering
  // ---------------------------------------------------------------------------

  describe("normal rendering", () => {
    it("renders an SVG with rect elements for each non-zero segment", () => {
      const { container } = render(
        <SignalBar strong={40} moderate={30} faint={30} />,
      );
      expect(container.querySelector("svg")).toBeInTheDocument();
      const rects = container.querySelectorAll("rect");
      // strong: 2 rects (segment + left-corner), moderate: 1, faint: 2 (segment + right-corner)
      expect(rects.length).toBe(5);
    });

    it("renders only strong segment rects when moderate and faint are zero", () => {
      const { container } = render(
        <SignalBar strong={100} moderate={0} faint={0} />,
      );
      const rects = container.querySelectorAll("rect");
      // strong segment + left-corner = 2
      expect(rects.length).toBe(2);
    });

    it("renders only moderate segment rect when strong and faint are zero", () => {
      const { container } = render(
        <SignalBar strong={0} moderate={100} faint={0} />,
      );
      const rects = container.querySelectorAll("rect");
      // moderate has no corner rects = 1
      expect(rects.length).toBe(1);
    });

    it("renders only faint segment rects when strong and moderate are zero", () => {
      const { container } = render(
        <SignalBar strong={0} moderate={0} faint={100} />,
      );
      const rects = container.querySelectorAll("rect");
      // faint segment + right-corner = 2
      expect(rects.length).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // Label visibility thresholds
  // ---------------------------------------------------------------------------

  describe("label visibility thresholds", () => {
    it("shows strong label when strong > 5%", () => {
      render(<SignalBar strong={10} moderate={45} faint={45} />);
      expect(screen.getByText("10% substantive")).toBeInTheDocument();
    });

    it("hides strong label when strong <= 5%", () => {
      const { container } = render(
        <SignalBar strong={5} moderate={50} faint={45} />,
      );
      const textEls = container.querySelectorAll("svg text");
      const labels = Array.from(textEls).map((el) => el.textContent);
      expect(labels.some((l) => l?.includes("substantive"))).toBe(false);
    });

    it("shows moderate label when moderate > 10%", () => {
      render(<SignalBar strong={40} moderate={20} faint={40} />);
      expect(screen.getByText("20% mixed")).toBeInTheDocument();
    });

    it("hides moderate label when moderate <= 10%", () => {
      const { container } = render(
        <SignalBar strong={50} moderate={10} faint={40} />,
      );
      const textEls = container.querySelectorAll("svg text");
      const labels = Array.from(textEls).map((el) => el.textContent);
      expect(labels.some((l) => l?.includes("mixed"))).toBe(false);
    });

    it("shows faint label when faint > 5%", () => {
      render(<SignalBar strong={45} moderate={45} faint={10} />);
      expect(screen.getByText("10% surface-level")).toBeInTheDocument();
    });

    it("hides faint label when faint <= 5%", () => {
      const { container } = render(
        <SignalBar strong={50} moderate={45} faint={5} />,
      );
      const textEls = container.querySelectorAll("svg text");
      const labels = Array.from(textEls).map((el) => el.textContent);
      expect(labels.some((l) => l?.includes("surface-level"))).toBe(false);
    });

    it("hides all labels when all segments are below their thresholds", () => {
      const { container } = render(
        <SignalBar strong={3} moderate={8} faint={4} />,
      );
      const textEls = container.querySelectorAll("svg text");
      expect(textEls.length).toBe(0);
    });

    it("shows all labels when all segments exceed their thresholds", () => {
      render(<SignalBar strong={30} moderate={40} faint={30} />);
      expect(screen.getByText("30% substantive")).toBeInTheDocument();
      expect(screen.getByText("40% mixed")).toBeInTheDocument();
      expect(screen.getByText("30% surface-level")).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Contextual label text
  // ---------------------------------------------------------------------------

  describe("labels use contextual text", () => {
    it('uses "substantive" instead of "strong"', () => {
      render(<SignalBar strong={60} moderate={20} faint={20} />);
      expect(screen.getByText("60% substantive")).toBeInTheDocument();
      const { container } = render(
        <SignalBar strong={60} moderate={20} faint={20} />,
      );
      const textEls = container.querySelectorAll("svg text");
      const labels = Array.from(textEls).map((el) => el.textContent);
      expect(labels.some((l) => l === "60% strong")).toBe(false);
    });

    it('uses "mixed" instead of "moderate"', () => {
      render(<SignalBar strong={30} moderate={40} faint={30} />);
      expect(screen.getByText("40% mixed")).toBeInTheDocument();
    });

    it('uses "surface-level" instead of "faint"', () => {
      render(<SignalBar strong={30} moderate={40} faint={30} />);
      expect(screen.getByText("30% surface-level")).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Accessibility title
  // ---------------------------------------------------------------------------

  describe("accessibility title", () => {
    it("has an accessible title with readable percentages", () => {
      const { container } = render(
        <SignalBar strong={50} moderate={30} faint={20} />,
      );
      const title = container.querySelector("svg title");
      expect(title).toBeInTheDocument();
      expect(title?.textContent).toBe(
        "Comment depth: 50% substantive, 30% mixed, 20% surface-level",
      );
    });

    it("rounds percentages in the title", () => {
      const { container } = render(
        <SignalBar strong={33.3} moderate={33.3} faint={33.4} />,
      );
      const title = container.querySelector("svg title");
      expect(title?.textContent).toBe(
        "Comment depth: 33% substantive, 33% mixed, 33% surface-level",
      );
    });

    it("SVG has aria-labelledby pointing to the title", () => {
      const { container } = render(
        <SignalBar strong={50} moderate={30} faint={20} />,
      );
      const svg = container.querySelector("svg");
      const title = container.querySelector("svg title");
      expect(svg).toHaveAttribute("aria-labelledby");
      expect(title).toHaveAttribute("id", svg?.getAttribute("aria-labelledby"));
    });
  });

  // ---------------------------------------------------------------------------
  // Single segment dominance
  // ---------------------------------------------------------------------------

  describe("single segment dominance", () => {
    it("handles 100% strong", () => {
      render(<SignalBar strong={100} moderate={0} faint={0} />);
      expect(screen.getByText("100% substantive")).toBeInTheDocument();
      const { container } = render(
        <SignalBar strong={100} moderate={0} faint={0} />,
      );
      const title = container.querySelector("svg title");
      expect(title?.textContent).toBe(
        "Comment depth: 100% substantive, 0% mixed, 0% surface-level",
      );
    });

    it("handles 100% moderate", () => {
      render(<SignalBar strong={0} moderate={100} faint={0} />);
      expect(screen.getByText("100% mixed")).toBeInTheDocument();
    });

    it("handles 100% faint", () => {
      render(<SignalBar strong={0} moderate={0} faint={100} />);
      expect(screen.getByText("100% surface-level")).toBeInTheDocument();
    });

    it("renders correct rects for 100% strong (full-width rounded)", () => {
      const { container } = render(
        <SignalBar strong={100} moderate={0} faint={0} />,
      );
      // When strong occupies entire bar, left corner rect is rendered
      const rects = container.querySelectorAll("rect");
      expect(rects.length).toBe(2);
      // The main rect should have rx=6 when it's the full bar width
      const mainRect = rects[0];
      expect(mainRect?.getAttribute("rx")).toBe("6");
    });
  });

  // ---------------------------------------------------------------------------
  // Custom className
  // ---------------------------------------------------------------------------

  describe("custom className", () => {
    it("forwards className to the SVG element", () => {
      const { container } = render(
        <SignalBar
          strong={50}
          moderate={30}
          faint={20}
          className="custom-class"
        />,
      );
      const svg = container.querySelector("svg");
      expect(svg?.classList.contains("custom-class")).toBe(true);
    });

    it("forwards className to the empty state div", () => {
      const { container } = render(
        <SignalBar
          strong={0}
          moderate={0}
          faint={0}
          className="empty-custom"
        />,
      );
      const div = container.querySelector("div");
      expect(div?.classList.contains("empty-custom")).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------

  describe("edge cases", () => {
    it("handles very small non-zero values without crashing", () => {
      const { container } = render(
        <SignalBar strong={0.1} moderate={0.1} faint={0.1} />,
      );
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("handles large values without crashing", () => {
      const { container } = render(
        <SignalBar strong={500} moderate={300} faint={200} />,
      );
      expect(container.querySelector("svg")).toBeInTheDocument();
      const title = container.querySelector("svg title");
      expect(title?.textContent).toBe(
        "Comment depth: 500% substantive, 300% mixed, 200% surface-level",
      );
    });

    it("renders two segments when one is zero", () => {
      const { container } = render(
        <SignalBar strong={60} moderate={0} faint={40} />,
      );
      const rects = container.querySelectorAll("rect");
      // strong: 2 rects (segment + left-corner), faint: 2 rects (segment + right-corner) = 4
      expect(rects.length).toBe(4);
    });
  });
});
