import "@testing-library/jest-dom";
import { vi } from "vitest";
import React from "react";

// Mock framer-motion so motion.div renders as a plain div in tests
vi.mock("framer-motion", () => {
  // Keys to strip from props before passing to React.createElement
  const MOTION_PROPS = new Set([
    "initial",
    "animate",
    "exit",
    "transition",
    "variants",
    "whileHover",
    "whileTap",
  ]);

  return {
    motion: new Proxy(
      {},
      {
        get: (_target, prop: string) => (props: Record<string, unknown>) => {
          const domProps: Record<string, unknown> = {};
          for (const [key, value] of Object.entries(props)) {
            if (!MOTION_PROPS.has(key)) {
              domProps[key] = value;
            }
          }
          return React.createElement(
            prop,
            domProps,
            props.children as React.ReactNode,
          );
        },
      },
    ),
    AnimatePresence: ({
      children,
    }: {
      children?: React.ReactNode;
    }): React.ReactNode => children,
  };
});
