// apps/server/__tests__/workspaces.join.test.js

const request = require("supertest");

jest.mock("../src/models/Workspace", () => ({
  findOne: jest.fn(),
}));

jest.mock("../src/middleware/auth", () => ({
  requireAuth: (req, _res, next) => {
    req.user = { id: "507f1f77bcf86cd799439011", email: "user@test.com" };
    next();
  },
}));

const Workspace = require("../src/models/Workspace");
const app = require("../src/app");

describe("POST /api/workspaces/join", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("returns 400 when invite code is missing", async () => {
    const res = await request(app).post("/api/workspaces/join").send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Invite code is required" });
  });

  test("returns 404 when workspace is not found", async () => {
    Workspace.findOne.mockResolvedValue(null);

    const res = await request(app).post("/api/workspaces/join").send({
      inviteCode: "BAD123",
    });

    expect(Workspace.findOne).toHaveBeenCalledWith({ inviteCode: "BAD123" });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Workspace not found" });
  });

  test("returns 400 when user already joined", async () => {
    const workspace = {
      participants: [
        {
          equals: jest.fn(() => true),
        },
      ],
    };

    Workspace.findOne.mockResolvedValue(workspace);

    const res = await request(app).post("/api/workspaces/join").send({
      inviteCode: "ABC123",
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      message: "You have already joined this workspace",
    });
  });

  test("joins workspace successfully", async () => {
    const save = jest.fn().mockResolvedValue(undefined);

    const workspace = {
      participants: [],
      save,
    };

    Workspace.findOne.mockResolvedValue(workspace);

    const res = await request(app).post("/api/workspaces/join").send({
      inviteCode: "ABC123",
    });

    expect(workspace.participants).toHaveLength(1);
    expect(save).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: "Joined workspace successfully",
    });
  });
});
