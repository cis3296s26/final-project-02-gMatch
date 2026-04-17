// apps/web/src/__tests__/auth.test.js

var capturedConfig;

jest.mock("next-auth", () => {
  return jest.fn((config) => {
    capturedConfig = config;
    return {
      handlers: { GET: jest.fn(), POST: jest.fn() },
      auth: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
    };
  });
});

jest.mock("next-auth/providers/github", () => {
  return jest.fn((options) => ({
    id: "github",
    name: "GitHub",
    options,
  }));
});

jest.mock("next-auth/providers/google", () => {
  return jest.fn((options) => ({
    id: "google",
    name: "Google",
    options,
  }));
});

jest.mock("next-auth/jwt", () => ({
  encode: jest.fn(),
}));

import { encode } from "next-auth/jwt";
import "@/lib/auth";

describe("apps/web/src/lib/auth.js", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.spyOn(console, "warn").mockImplementation(() => {});
    process.env.NEXTAUTH_SECRET = "test-secret";
    process.env.AUTH_SALT = "test-salt";
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  test("registers NextAuth config", () => {
    expect(capturedConfig).toBeDefined();
    expect(capturedConfig.pages.signIn).toBe("/login");
    expect(capturedConfig.trustHost).toBe(true);
    expect(Array.isArray(capturedConfig.providers)).toBe(true);
    expect(capturedConfig.providers).toHaveLength(2);
  });

  describe("callbacks.signIn", () => {
    test("posts user info to backend and returns true", async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const result = await capturedConfig.callbacks.signIn({
        user: {
          name: "Remi",
          email: "remi@test.com",
          image: "avatar.png",
        },
        account: {
          provider: "google",
          providerAccountId: "google-123",
        },
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/auth/login"),
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Remi",
            email: "remi@test.com",
            avatar: "avatar.png",
            oauthProvider: "google",
            oauthId: "google-123",
          }),
          signal: expect.any(AbortSignal),
        })
      );

      expect(result).toBe(true);
    });

    test("still returns true when backend returns not ok", async () => {
      fetch.mockResolvedValue({
        ok: false,
        json: async () => ({}),
      });

      const result = await capturedConfig.callbacks.signIn({
        user: {
          name: "Remi",
          email: "remi@test.com",
          image: "avatar.png",
        },
        account: {
          provider: "google",
          providerAccountId: "google-123",
        },
      });

      expect(console.warn).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test("still returns true when fetch throws", async () => {
      fetch.mockRejectedValue(new Error("network down"));

      const result = await capturedConfig.callbacks.signIn({
        user: {
          name: "Remi",
          email: "remi@test.com",
          image: "avatar.png",
        },
        account: {
          provider: "google",
          providerAccountId: "google-123",
        },
      });

      expect(console.warn).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe("callbacks.session", () => {
    test("adds db user fields and token to session", async () => {
      encode.mockResolvedValue("encoded-token");
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          _id: "user-123",
          role: "organizer",
          name: "Updated Remi",
        }),
      });

      const session = {
        user: {
          email: "remi@test.com",
          name: "Old Name",
        },
      };
      const token = { sub: "abc" };

      const result = await capturedConfig.callbacks.session({ session, token });

      expect(encode).toHaveBeenCalledWith({
        token,
        secret: "test-secret",
        salt: "test-salt",
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/auth/me"),
        expect.objectContaining({
          headers: { Authorization: "Bearer encoded-token" },
          credentials: "include",
          signal: expect.any(AbortSignal),
        })
      );

      expect(result.user.id).toBe("user-123");
      expect(result.user.role).toBe("organizer");
      expect(result.user.name).toBe("Updated Remi");
      expect(result.token).toBe("encoded-token");
    });

    test("returns unchanged session when /api/auth/me is not ok", async () => {
      encode.mockResolvedValue("encoded-token");
      fetch.mockResolvedValue({
        ok: false,
        json: async () => ({}),
      });

      const session = {
        user: {
          email: "remi@test.com",
          name: "Remi",
        },
      };
      const token = { sub: "abc" };

      const result = await capturedConfig.callbacks.session({ session, token });

      expect(result.user.id).toBeUndefined();
      expect(result.user.role).toBeUndefined();
      expect(result.token).toBeUndefined();
      expect(result.user.name).toBe("Remi");
    });

    test("skips backend fetch when session user email is missing", async () => {
      encode.mockResolvedValue("encoded-token");

      const session = { user: {} };
      const token = { sub: "abc" };

      const result = await capturedConfig.callbacks.session({ session, token });

      expect(fetch).not.toHaveBeenCalled();
      expect(result).toEqual({ user: {} });
    });

    test("returns session when backend fetch throws", async () => {
      encode.mockResolvedValue("encoded-token");
      fetch.mockRejectedValue(new Error("timeout"));

      const session = {
        user: {
          email: "remi@test.com",
          name: "Remi",
        },
      };
      const token = { sub: "abc" };

      const result = await capturedConfig.callbacks.session({ session, token });

      expect(result.user.name).toBe("Remi");
      expect(result.user.id).toBeUndefined();
      expect(result.user.role).toBeUndefined();
    });
  });
});
