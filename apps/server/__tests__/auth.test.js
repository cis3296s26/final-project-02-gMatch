// apps/server/__tests__/auth.test.js

const request = require("supertest");

jest.mock("../src/models/User", () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  findOneAndUpdate: jest.fn(),
}));

jest.mock("../src/middleware/auth", () => ({
  requireAuth: (req, _res, next) => {
    req.user = { id: "user-123", email: "user@test.com" };
    next();
  },
}));

const User = require("../src/models/User");
const app = require("../src/app");

describe("Auth routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("POST /api/auth/login", () => {
    test("returns 400 when email is missing", async () => {
      const res = await request(app).post("/api/auth/login").send({
        name: "Remi",
      });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "Email is required" });
    });

    test("creates a new user when one does not exist", async () => {
      const createdUser = {
        _id: "u1",
        name: "Remi",
        email: "remi@test.com",
        avatar: "avatar.png",
        oauthProvider: "google",
        oauthId: "google-123",
      };

      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(createdUser);

      const res = await request(app).post("/api/auth/login").send({
        name: "Remi",
        email: "remi@test.com",
        avatar: "avatar.png",
        oauthProvider: "google",
        oauthId: "google-123",
      });

      expect(User.findOne).toHaveBeenCalledWith({ email: "remi@test.com" });
      expect(User.create).toHaveBeenCalledWith({
        name: "Remi",
        email: "remi@test.com",
        avatar: "avatar.png",
        oauthProvider: "google",
        oauthId: "google-123",
      });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(createdUser);
    });

    test("updates an existing user", async () => {
      const save = jest.fn().mockResolvedValue(undefined);

      const existingUser = {
        _id: "u1",
        name: "Old Name",
        email: "remi@test.com",
        avatar: "",
        oauthProvider: "",
        oauthId: "",
        save,
      };

      User.findOne.mockResolvedValue(existingUser);

      const res = await request(app).post("/api/auth/login").send({
        name: "New Name",
        email: "remi@test.com",
        avatar: "new.png",
        oauthProvider: "google",
        oauthId: "google-999",
      });

      expect(existingUser.name).toBe("New Name");
      expect(existingUser.avatar).toBe("new.png");
      expect(existingUser.oauthProvider).toBe("google");
      expect(existingUser.oauthId).toBe("google-999");
      expect(save).toHaveBeenCalled();

      expect(res.status).toBe(200);
      expect(res.body.email).toBe("remi@test.com");
    });

    test("returns 500 on unexpected error", async () => {
      User.findOne.mockRejectedValue(new Error("db failure"));

      const res = await request(app).post("/api/auth/login").send({
        email: "remi@test.com",
      });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: "Internal server error" });
    });
  });

  describe("GET /api/auth/me", () => {
    test("returns authenticated user", async () => {
      User.findOne.mockResolvedValue({
        _id: "user-123",
        email: "user@test.com",
        role: "organizer",
      });

      const res = await request(app).get("/api/auth/me");

      expect(User.findOne).toHaveBeenCalledWith({ _id: "user-123" });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        _id: "user-123",
        email: "user@test.com",
        role: "organizer",
      });
    });

    test("returns 404 when user is not found", async () => {
      User.findOne.mockResolvedValue(null);

      const res = await request(app).get("/api/auth/me");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "User not found" });
    });
  });

  describe("PATCH /api/auth/role", () => {
    test("returns 400 when email or role is missing", async () => {
      const res = await request(app).patch("/api/auth/role").send({
        email: "user@test.com",
      });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "Email and role are required" });
    });

    test("returns 400 for invalid role", async () => {
      const res = await request(app).patch("/api/auth/role").send({
        email: "user@test.com",
        role: "admin",
      });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "Role must be organizer or participant" });
    });

    test("updates role when valid", async () => {
      User.findOneAndUpdate.mockResolvedValue({
        _id: "u1",
        email: "user@test.com",
        role: "organizer",
      });

      const res = await request(app).patch("/api/auth/role").send({
        email: "user@test.com",
        role: "organizer",
      });

      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { email: "user@test.com" },
        { role: "organizer" },
        { new: true }
      );

      expect(res.status).toBe(200);
      expect(res.body.role).toBe("organizer");
    });

    test("returns 404 when user does not exist", async () => {
      User.findOneAndUpdate.mockResolvedValue(null);

      const res = await request(app).patch("/api/auth/role").send({
        email: "missing@test.com",
        role: "participant",
      });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "User not found" });
    });
  });

  describe("PATCH /api/auth/profile", () => {
    test("updates profile fields for authenticated user", async () => {
      User.findOneAndUpdate.mockResolvedValue({
        _id: "user-123",
        name: "Remi",
        bio: "Short bio",
        portfolioUrls: ["https://site.test"],
      });

      const res = await request(app).patch("/api/auth/profile").send({
        name: "  Remi  ",
        bio: "  Short bio  ",
        portfolioUrls: ["  https://site.test  ", "   "],
      });

      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: "user-123" },
        {
          name: "Remi",
          bio: "Short bio",
          portfolioUrls: ["https://site.test"],
        },
        { new: true, runValidators: true }
      );

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Remi");
    });

    test("returns 404 when authenticated user is missing", async () => {
      User.findOneAndUpdate.mockResolvedValue(null);

      const res = await request(app).patch("/api/auth/profile").send({
        name: "Remi",
      });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "User not found" });
    });
  });
});

