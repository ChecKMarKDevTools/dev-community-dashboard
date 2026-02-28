import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { Dashboard } from "@/components/Dashboard";
import { vi, Mock } from "vitest";

// Set up mock fetch
const mockPosts = [
  {
    id: 1,
    title: "Needs review post",
    canonical_url: "https://dev.to/test/post-1",
    score: 85,
    attention_level: "NEEDS_REVIEW",
    explanations: ["Heat Score: 7.50", "Risk Score: 2"],
    published_at: "2023-10-27T10:00:00Z",
    author: "testauthor",
    reactions: 10,
    comments: 50,
  },
  {
    id: 2,
    title: "Normal post",
    canonical_url: "https://dev.to/test/post-2",
    score: 15,
    attention_level: "NORMAL",
    explanations: [],
    published_at: "2023-10-26T10:00:00Z",
    author: "gooduser",
    reactions: 20,
    comments: 5,
  },
];

const mockPostDetails = {
  ...mockPosts[0],
  url: "https://dev.to/testauthor/post-1",
  score_breakdown: { heat: 7.5, risk: 2, support: 0 },
  recent_posts: [
    {
      id: 3,
      title: "Previous post",
      canonical_url: "https://dev.to/test/post-3",
      url: "https://dev.to/testauthor/post-3",
      score: 10,
      attention_level: "NORMAL",
      published_at: "2023-10-20T10:00:00Z",
    },
  ],
};

globalThis.fetch = vi.fn() as Mock;

describe("Dashboard Component", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders loading state initially", () => {
    globalThis.fetch = vi.fn().mockImplementation(() => new Promise(() => {}));
    const { container } = render(<Dashboard />);
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("fetches and renders a list of posts with category labels", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => mockPosts });
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.queryByText("Community Queue")).toBeInTheDocument();
    });

    expect(screen.getByText("Needs review post")).toBeInTheDocument();
    expect(screen.getByText("Normal post")).toBeInTheDocument();
    // New category labels instead of old "HIGH"
    expect(screen.getByText("Needs Review")).toBeInTheDocument();
    expect(screen.getByText("Normal")).toBeInTheDocument();
  });

  it("handles post selection and fetching details", async () => {
    globalThis.fetch = vi.fn().mockImplementation((url) => {
      if (url === "/api/posts")
        return Promise.resolve({ ok: true, json: async () => mockPosts });
      if (url === "/api/posts/1")
        return Promise.resolve({ ok: true, json: async () => mockPostDetails });
      return Promise.reject(new Error("Not found"));
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Needs review post")).toBeInTheDocument();
    });

    const postCard = screen
      .getByText("Needs review post")
      .closest("div.border")!;
    fireEvent.click(postCard);

    await waitFor(() => {
      expect(screen.getByText("Score Breakdown")).toBeInTheDocument();
    });

    // @testauthor now appears in both the list card and the detail panel
    expect(screen.getAllByText("@testauthor").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Heat Score: 7.50")).toBeInTheDocument();
  });

  it("displays BOOST_VISIBILITY category correctly", async () => {
    const boostPosts = [
      {
        id: 4,
        title: "Boost me",
        canonical_url: "https://dev.to/test/post-4",
        score: 30,
        attention_level: "BOOST_VISIBILITY",
        explanations: ["Attention Delta: 5.20"],
        published_at: "2023-10-27T10:00:00Z",
        author: "writer",
        reactions: 2,
        comments: 3,
      },
    ];
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => boostPosts });
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Boost")).toBeInTheDocument();
    });
  });

  it("displays NEEDS_RESPONSE category correctly", async () => {
    const responsePosts = [
      {
        id: 5,
        title: "Help needed",
        canonical_url: "https://dev.to/test/post-5",
        score: 20,
        attention_level: "NEEDS_RESPONSE",
        explanations: ["Support Score: 5"],
        published_at: "2023-10-27T10:00:00Z",
        author: "newbie",
        reactions: 0,
        comments: 0,
      },
    ];
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => responsePosts });
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Needs Response")).toBeInTheDocument();
    });
  });

  it("displays POSSIBLY_LOW_QUALITY category correctly", async () => {
    const lowQPosts = [
      {
        id: 6,
        title: "Buy crypto now",
        canonical_url: "https://dev.to/test/post-6",
        score: 5,
        attention_level: "POSSIBLY_LOW_QUALITY",
        explanations: ["Risk Score: 8"],
        published_at: "2023-10-27T10:00:00Z",
        author: "spammer",
        reactions: 0,
        comments: 0,
      },
    ];
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => lowQPosts });
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Low Quality")).toBeInTheDocument();
    });
  });

  it("handles empty post list", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => [] });

    render(<Dashboard />);

    await waitFor(() => {
      expect(
        screen.getByText("No posts found. Waiting for data sync."),
      ).toBeInTheDocument();
    });
  });

  it("handles api error for posts list", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Failed to fetch"));

    render(<Dashboard />);

    await waitFor(() => {
      expect(
        screen.getByText("No posts found. Waiting for data sync."),
      ).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });
});
