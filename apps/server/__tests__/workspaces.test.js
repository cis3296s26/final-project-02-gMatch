// apps/server/__tests__/workspaces.test.js

const request = require("supertest");

jest.mock("../src/models/Workspace", () => ({
  create: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
}));

jest.mock("../src/models/Response", () => ({
  find: jest.fn(),
}));

jest.mock("../src/models/Team", () => ({
  deleteMany: jest.fn(),
  insertMany: jest.fn(),
}));

jest.mock("../src/middleware/auth", () => ({
  requireAuth: (req, _res, next) => {
    req.user = { id: "user-123", email: "user@test.com" };
    next();
  },
}));

const Workspace = require("../src/models/Workspace");
const app = require("../src/app");

describe("Workspace routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("POST /api/workspaces", () => {
    test("returns 400 when name is missing", async () => {
      const res = await request(app).post("/api/workspaces").send({
        teamSize: 3,
      });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Workspace name is required" });
    });

    test("returns 400 when team size is less than 2", async () => {
      const res = await request(app).post("/api/workspaces").send({
        name: "Test Workspace",
        teamSize: 1,
      });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Team size must be at least 2" });
    });

    test("returns 400 when organizer already has a workspace with same name", async () => {
      Workspace.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ _id: "existing-workspace" });

      const res = await request(app).post("/api/workspaces").send({
        name: "Test Workspace",
        teamSize: 3,
      });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        message: "You already have a workspace with this name",
      });
    });

    test("creates a workspace successfully", async () => {
      Workspace.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const createdWorkspace = {
        _id: "w1",
        organizerId: "user-123",
        name: "Test Workspace",
        teamSize: 3,
        inviteCode: "ABC123",
        teams: [],
      };

      Workspace.create.mockResolvedValue(createdWorkspace);

      const res = await request(app).post("/api/workspaces").send({
        name: "Test Workspace",
        teamSize: 3,
      });

      expect(Workspace.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organizerId: "user-123",
          name: "Test Workspace",
          teamSize: 3,
          teams: [],
        })
      );

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        workspace: createdWorkspace,
      });
    });
  });

  describe("GET /api/workspaces/:id", () => {
    test("returns workspace by id", async () => {
      const populate = jest.fn().mockResolvedValue({
        _id: "w1",
        name: "Test Workspace",
      });

      Workspace.findById.mockReturnValue({ populate });

      const res = await request(app).get("/api/workspaces/w1");

      expect(Workspace.findById).toHaveBeenCalledWith("w1");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        _id: "w1",
        name: "Test Workspace",
      });
    });

    test("returns 404 if workspace not found", async () => {
      const populate = jest.fn().mockResolvedValue(null);
      Workspace.findById.mockReturnValue({ populate });

      const res = await request(app).get("/api/workspaces/w1");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Workspace not found" });
    });
  });
});
