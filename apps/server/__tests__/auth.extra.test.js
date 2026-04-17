const request = require("supertest");

jest.mock("../src/models/User", () => ({
  findOne: jest.fn(),
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

describe("Auth extra routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("GET /api/auth/me returns 500 on lookup failure", async () => {
    User.findOne.mockRejectedValue(new Error("db fail"));

    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });
  });

  test("PATCH /api/auth/role returns 500 on update failure", async () => {
    User.findOneAndUpdate.mockRejectedValue(new Error("db fail"));

    const res = await request(app).patch("/api/auth/role").send({
      email: "user@test.com",
      role: "organizer",
    });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });
  });

  test("PATCH /api/auth/profile returns 500 on update failure", async () => {
    User.findOneAndUpdate.mockRejectedValue(new Error("db fail"));

    const res = await request(app).patch("/api/auth/profile").send({
      name: "Remi",
    });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });
  });
});
