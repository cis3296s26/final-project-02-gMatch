const request = require("supertest");

jest.mock("../src/models/Workspace", () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findByIdAndDelete: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

jest.mock("../src/models/Response", () => ({
  find: jest.fn(),
}));

jest.mock("../src/models/Team", () => ({
  deleteMany: jest.fn(),
  insertMany: jest.fn(),
}));

jest.mock("../src/algorithm/index", () => ({
  generateTeams: jest.fn(),
}));

jest.mock("../src/middleware/auth", () => ({
  requireAuth: (req, _res, next) => {
    req.user = { id: "507f1f77bcf86cd799439011" };
    next();
  },
}));

const Workspace = require("../src/models/Workspace");
const Response = require("../src/models/Response");
const Team = require("../src/models/Team");
const { generateTeams } = require("../src/algorithm/index");
const app = require("../src/app");

describe("Workspace tail routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("GET /api/workspaces", () => {
    test("returns organizer workspaces", async () => {
      const workspaces = [{ _id: "w1", name: "A" }];
      const sort = jest.fn().mockResolvedValue(workspaces);
      Workspace.find.mockReturnValue({ sort });

      const res = await request(app).get("/api/workspaces");

      expect(Workspace.find).toHaveBeenCalledWith({
        organizerId: "507f1f77bcf86cd799439011",
      });
      expect(sort).toHaveBeenCalledWith({ createdAt: 1 });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ workspaces });
    });

    test("returns 500 when organizer workspace fetch fails", async () => {
      const sort = jest.fn().mockRejectedValue(new Error("db fail"));
      Workspace.find.mockReturnValue({ sort });

      const res = await request(app).get("/api/workspaces");

      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        message: "Failed to load workspaces",
        error: "db fail",
      });
    });
  });

  describe("POST /api/workspaces", () => {
    test("returns 500 when create workspace fails", async () => {
      Workspace.findOne.mockRejectedValue(new Error("db fail"));

      const res = await request(app).post("/api/workspaces").send({
        name: "Test Workspace",
        teamSize: 3,
      });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        message: "Failed to create workspace",
        error: "db fail",
      });
    });
  });

  describe("POST /api/workspaces/join", () => {
    test("returns 500 when join workspace fails", async () => {
      Workspace.findOne.mockRejectedValue(new Error("db fail"));

      const res = await request(app).post("/api/workspaces/join").send({
        inviteCode: "ABC123",
      });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        message: "Failed to join workspace",
        error: "db fail",
      });
    });
  });

  describe("POST /api/workspaces/:id/leave", () => {
    test("initializes participants when missing", async () => {
      const save = jest.fn().mockResolvedValue(undefined);
      const workspace = {
        participants: undefined,
        save,
      };

      Workspace.findById.mockResolvedValue(workspace);

      const res = await request(app).post("/api/workspaces/w1/leave");

      expect(workspace.participants).toEqual([]);
      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        message: "You are not a participant in this workspace",
      });
    });

    test("returns 500 when leave workspace fails", async () => {
      Workspace.findById.mockRejectedValue(new Error("db fail"));

      const res = await request(app).post("/api/workspaces/w1/leave");

      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        message: "Failed to leave workspace",
        error: "db fail",
      });
    });
  });

  describe("GET /api/workspaces/participant", () => {
    test("returns participant workspaces", async () => {
      const workspaces = [{ _id: "w1", name: "A" }];
      const sort = jest.fn().mockResolvedValue(workspaces);
      Workspace.find.mockReturnValue({ sort });

      const res = await request(app).get("/api/workspaces/participant");

      expect(Workspace.find).toHaveBeenCalledWith({
        participants: { $in: [expect.any(Object)] },
      });
      expect(sort).toHaveBeenCalledWith({ createdAt: 1 });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ workspaces });
    });

    test("returns 500 when participant workspaces fetch fails", async () => {
      const sort = jest.fn().mockRejectedValue(new Error("db fail"));
      Workspace.find.mockReturnValue({ sort });

      const res = await request(app).get("/api/workspaces/participant");

      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        message: "Failed to load workspaces",
        error: "db fail",
      });
    });
  });

  describe("GET /api/workspaces/:id", () => {
    test("returns 500 when single workspace fetch fails", async () => {
      const populate = jest.fn().mockRejectedValue(new Error("db fail"));
      Workspace.findById.mockReturnValue({ populate });

      const res = await request(app).get("/api/workspaces/w1");

      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        message: "Failed to fetch workspace",
        error: "db fail",
      });
    });
  });

  describe("PUT /api/workspaces/:workspaceId/teams", () => {
    test("returns 404 when save teams workspace is missing", async () => {
      Workspace.findByIdAndUpdate.mockResolvedValue(null);

      const res = await request(app)
        .put("/api/workspaces/w1/teams")
        .send({ teams: [["u1", "u2"]] });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Workspace not found" });
    });

    test("saves formatted teams successfully", async () => {
      const updatedWorkspace = {
        _id: "w1",
        teams: [{ members: ["u1", "u2"] }, { members: ["u3"] }],
      };

      Workspace.findByIdAndUpdate.mockResolvedValue(updatedWorkspace);

      const res = await request(app)
        .put("/api/workspaces/w1/teams")
        .send({
          teams: [["u1", "u2"], { members: ["u3"] }],
        });

      expect(Workspace.findByIdAndUpdate).toHaveBeenCalledWith(
        "w1",
        {
          teams: [{ members: ["u1", "u2"] }, { members: ["u3"] }],
        },
        { new: true, runValidators: true }
      );
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: "Teams saved successfully",
        workspace: updatedWorkspace,
      });
    });

    test("returns 500 when save teams fails", async () => {
      Workspace.findByIdAndUpdate.mockRejectedValue(new Error("db fail"));

      const res = await request(app)
        .put("/api/workspaces/w1/teams")
        .send({ teams: [["u1", "u2"]] });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        message: "Failed to save teams",
        error: "db fail",
      });
    });
  });

  describe("POST /api/workspaces/:id/generate", () => {
    test("returns 500 when generate fails after fetching responses", async () => {
      Workspace.findById.mockResolvedValue({
        _id: "w1",
        teamSize: 2,
        organizerId: {
          equals: jest.fn(() => true),
        },
      });

      const populate = jest.fn().mockRejectedValue(new Error("db fail"));
      Response.find.mockReturnValue({ populate });

      const res = await request(app)
        .post("/api/workspaces/w1/generate")
        .send({ weights: { schedule: 0.6, diversity: 0.4 } });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        message: "Failed to generate teams",
        error: "db fail",
      });
    });
  });

  describe("POST /api/workspaces/:id/publish", () => {
    test("returns 500 when publish fails", async () => {
      Workspace.findById.mockRejectedValue(new Error("db fail"));

      const res = await request(app).post("/api/workspaces/w1/publish");

      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        message: "Failed to publish teams",
        error: "db fail",
      });
    });
  });
});
