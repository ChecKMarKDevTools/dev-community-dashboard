import { POST } from "./route";
import { syncArticles } from "@/lib/sync";
import { vi, type Mock } from "vitest";

vi.mock("@/lib/sync", () => ({
  syncArticles: vi.fn(),
}));

const VALID_SECRET = "test-cron-secret";

function makeRequest(authHeader: string | undefined): Request {
  const init: RequestInit = { method: "POST" };
  const headers: Record<string, string> = {};
  if (authHeader) headers["authorization"] = authHeader;
  init.headers = headers;
  return new Request("http://localhost:3000/api/admin/seed", init);
}

describe("POST /api/admin/seed", () => {
  let savedCronSecret: string | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    savedCronSecret = process.env.CRON_SECRET;
    process.env.CRON_SECRET = VALID_SECRET;
    (syncArticles as Mock).mockResolvedValue({
      synced: 0,
      failed: 0,
      errors: [],
    });
  });

  afterEach(() => {
    if (savedCronSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = savedCronSecret;
    }
  });

  describe("authentication", () => {
    it("returns 401 when Authorization header is missing", async () => {
      const res = await POST(makeRequest(undefined));
      expect(res.status).toBe(401);
      expect((await res.json()).error).toBe("Unauthorized");
    });

    it("returns 401 when Bearer token is wrong", async () => {
      const res = await POST(makeRequest("Bearer wrong-token"));
      expect(res.status).toBe(401);
    });

    it("returns 401 when header uses incorrect scheme (Basic)", async () => {
      const res = await POST(makeRequest(`Basic ${VALID_SECRET}`));
      expect(res.status).toBe(401);
    });

    it("returns 401 when CRON_SECRET env var is undefined", async () => {
      delete process.env.CRON_SECRET;
      const res = await POST(makeRequest(`Bearer ${VALID_SECRET}`));
      expect(res.status).toBe(401);
    });

    it("passes authentication with correct Bearer token", async () => {
      const res = await POST(makeRequest(`Bearer ${VALID_SECRET}`));
      expect(res.status).toBe(200);
    });
  });

  describe("delegation to syncArticles", () => {
    it("calls syncArticles with no arguments (processes all valid articles)", async () => {
      process.env.CRON_SECRET = VALID_SECRET;
      await POST(makeRequest(`Bearer ${VALID_SECRET}`));
      expect(syncArticles).toHaveBeenCalledWith();
    });

    it("returns { success, synced, failed, errors } from syncArticles result", async () => {
      (syncArticles as Mock).mockResolvedValue({
        synced: 3,
        failed: 0,
        errors: [],
      });

      process.env.CRON_SECRET = VALID_SECRET;
      const res = await POST(makeRequest(`Bearer ${VALID_SECRET}`));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({ success: true, synced: 3, failed: 0, errors: [] });
    });
  });

  describe("error flows", () => {
    it("returns 500 when syncArticles throws", async () => {
      (syncArticles as Mock).mockRejectedValue(new Error("Sync failed"));

      process.env.CRON_SECRET = VALID_SECRET;
      const res = await POST(makeRequest(`Bearer ${VALID_SECRET}`));
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.error).toBe("Sync failed");
    });

    it("returns 500 with 'Unknown error' for non-Error throws", async () => {
      (syncArticles as Mock).mockRejectedValue("string error");

      process.env.CRON_SECRET = VALID_SECRET;
      const res = await POST(makeRequest(`Bearer ${VALID_SECRET}`));
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.error).toBe("Unknown error");
    });
  });
});
