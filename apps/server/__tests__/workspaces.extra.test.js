// apps/server/__tests__/workspaces.extra.test.js

const request = require("supertest");

jest.mock("../src/models/Workspace", () => ({
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

describe("Workspace extra routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("DELETE /api/workspaces/:id", () => {
    test("returns 404 if workspace not found", async () => {
      Workspace.findByIdAndDelete.mockResolvedValue(null);

      const res = await request(app).delete("/api/workspaces/w1");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Workspace not found" });
    });

    test("deletes workspace successfully", async () => {
      Workspace.findByIdAndDelete.mockResolvedValue({ _id: "w1" });

      const res = await request(app).delete("/api/workspaces/w1");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "Workspace deleted" });
    });
  });

  describe("PATCH /api/workspaces/:id", () => {
    test("returns 404 when workspace not found", async () => {
      Workspace.findByIdAndUpdate.mockResolvedValue(null);

      const res = await request(app)
        .patch("/api/workspaces/w1")
        .send({ name: "New Name", teamSize: 3 });

      expect(Workspace.findByIdAndUpdate).toHaveBeenCalledWith(
        "w1",
        { name: "New Name", teamSize: 3 },
        { new: true }
      );
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Workspace not found" });
    });

    test("updates workspace successfully", async () => {
      const updatedWorkspace = {
        _id: "w1",
        name: "New Name",
        teamSize: 3,
      };

      Workspace.findByIdAndUpdate.mockResolvedValue(updatedWorkspace);

      const res = await request(app)
        .patch("/api/workspaces/w1")
        .send({ name: "New Name", teamSize: 3 });

      expect(Workspace.findByIdAndUpdate).toHaveBeenCalledWith(
        "w1",
        { name: "New Name", teamSize: 3 },
        { new: true }
      );
      expect(res.status).toBe(200);
      expect(res.body).toEqual(updatedWorkspace);
    });
  });

  describe("POST /api/workspaces/:id/leave", () => {
    test("returns 404 when workspace not found", async () => {
      Workspace.findById.mockResolvedValue(null);

      const res = await request(app).post("/api/workspaces/w1/leave");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Workspace not found" });
    });

    test("returns 400 when user is not a participant", async () => {
      const workspace = {
        participants: [],
        save: jest.fn(),
      };

      Workspace.findById.mockResolvedValue(workspace);

      const res = await request(app).post("/api/workspaces/w1/leave");

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        message: "You are not a participant in this workspace",
      });
    });

    test("removes participant and saves workspace", async () => {
      const save = jest.fn().mockResolvedValue(undefined);

      const workspace = {
        participants: [
          {
            equals: jest.fn(() => true),
          },
          {
            equals: jest.fn(() => false),
          },
        ],
        save,
      };

      Workspace.findById.mockResolvedValue(workspace);

      const res = await request(app).post("/api/workspaces/w1/leave");

      expect(workspace.participants).toHaveLength(1);
      expect(save).toHaveBeenCalled();
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: "Left workspace successfully",
      });
    });
  });

  describe("POST /api/workspaces/:id/generate", () => {
    test("returns 404 when workspace not found", async () => {
      Workspace.findById.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/workspaces/w1/generate")
        .send({ weights: { schedule: 0.6, diversity: 0.4 } });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Workspace not found" });
    });

    test("returns 403 when current user is not the organizer", async () => {
      Workspace.findById.mockResolvedValue({
        _id: "w1",
        teamSize: 2,
        organizerId: {
          equals: jest.fn(() => false),
        },
      });

      const res = await request(app)
        .post("/api/workspaces/w1/generate")
        .send({ weights: { schedule: 0.6, diversity: 0.4 } });

      expect(res.status).toBe(403);
      expect(res.body).toEqual({
        message: "Only the organizer can generate teams.",
      });
    });

    test("returns 400 when there are not enough participant responses", async () => {
      Workspace.findById.mockResolvedValue({
        _id: "w1",
        teamSize: 2,
        organizerId: {
          equals: jest.fn(() => true),
        },
      });

      const populate = jest.fn().mockResolvedValue([
        {
          participantId: {
            _id: "u1",
            name: "Alice",
            email: "alice@test.com",
          },
          availabilityGrid: {},
          answers: [],
        },
      ]);

      Response.find.mockReturnValue({ populate });

      const res = await request(app)
        .post("/api/workspaces/w1/generate")
        .send({ weights: { schedule: 0.6, diversity: 0.4 } });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        message: "Not enough participant responses to generate teams.",
      });
    });

    test("generates teams successfully", async () => {
      const save = jest.fn().mockResolvedValue(undefined);

      const workspace = {
        _id: "w1",
        teamSize: 2,
        organizerId: {
          equals: jest.fn(() => true),
        },
        teams: [],
        save,
      };

      Workspace.findById.mockResolvedValue(workspace);

      const responses = [
        {
          participantId: {
            _id: { equals: (id) => id === "u1" },
            name: "Alice",
            email: "alice@test.com",
          },
          availabilityGrid: { Monday: ["09:00-10:00"] },
          answers: [{ questionId: "skills", value: ["React"] }],
        },
        {
          participantId: {
            _id: { equals: (id) => id === "u2" },
            name: "Bob",
            email: "bob@test.com",
          },
          availabilityGrid: { Tuesday: ["10:00-11:00"] },
          answers: [{ questionId: "skills", value: ["Node"] }],
        },
      ];

      const populate = jest.fn().mockResolvedValue(responses);
      Response.find.mockReturnValue({ populate });

      generateTeams.mockReturnValue([
        {
          members: ["u1", "u2"],
        },
      ]);

      Team.deleteMany.mockResolvedValue({ deletedCount: 0 });
      Team.insertMany.mockResolvedValue([]);

      const res = await request(app)
        .post("/api/workspaces/w1/generate")
        .send({ weights: { schedule: 0.6, diversity: 0.4 } });

      expect(generateTeams).toHaveBeenCalledWith(
        responses,
        2,
        { schedule: 0.6, diversity: 0.4 }
      );
      expect(Team.deleteMany).toHaveBeenCalledWith({ workspaceId: "w1" });
      expect(Team.insertMany).toHaveBeenCalledWith([
        {
          workspaceId: "w1",
          memberIds: ["u1", "u2"],
          chatHistory: [],
        },
      ]);
      expect(save).toHaveBeenCalled();

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: "Teams successfully generated",
        teams: [
          {
            members: [
              {
                name: "Alice",
                availability: ["Monday"],
                skills: ["React"],
              },
              {
                name: "Bob",
                availability: ["Tuesday"],
                skills: ["Node"],
              },
            ],
          },
        ],
      });
    });

    test("generate passes undefined weights when not provided", async () => {
      const save = jest.fn().mockResolvedValue(undefined);

      const workspace = {
        _id: "w1",
        teamSize: 2,
        organizerId: {
          equals: jest.fn(() => true),
        },
        teams: [],
        save,
      };

      Workspace.findById.mockResolvedValue(workspace);

      const responses = [
        {
          participantId: {
            _id: { equals: (id) => id === "u1" },
            name: "Alice",
            email: "alice@test.com",
          },
          availabilityGrid: { Monday: ["09:00-10:00"] },
          answers: [{ questionId: "skills", value: ["React"] }],
        },
        {
          participantId: {
            _id: { equals: (id) => id === "u2" },
            name: "Bob",
            email: "bob@test.com",
          },
          availabilityGrid: { Tuesday: ["10:00-11:00"] },
          answers: [{ questionId: "skills", value: ["Node"] }],
        },
      ];

      const populate = jest.fn().mockResolvedValue(responses);
      Response.find.mockReturnValue({ populate });

      generateTeams.mockReturnValue([
        {
          members: ["u1", "u2"],
        },
      ]);

      Team.deleteMany.mockResolvedValue({ deletedCount: 0 });
      Team.insertMany.mockResolvedValue([]);

      const res = await request(app)
        .post("/api/workspaces/w1/generate")
        .send({});

      expect(generateTeams).toHaveBeenCalledWith(
        responses,
        2,
        undefined
      );
      expect(res.status).toBe(200);
    });
  });
});

