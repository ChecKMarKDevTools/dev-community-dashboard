import { cn } from "./utils";

describe("cn utility", () => {
  it("merges class names correctly", () => {
    expect(cn("class1", "class2")).toBe("class1 class2");
  });

  it("handles conditional class names", () => {
    expect(cn("class1", { class2: true, class3: false })).toBe("class1 class2");
  });

  it("handles tailwind class conflicts correctly", () => {
    expect(cn("px-2 py-1", "p-4")).toBe("p-4");
  });

  it("handles arrays of classes", () => {
    expect(cn(["class1", "class2"])).toBe("class1 class2");
  });

  it("handles mixed types", () => {
    expect(
      cn("class1", ["class2", { class3: true }], undefined, null, false),
    ).toBe("class1 class2 class3");
  });
});
