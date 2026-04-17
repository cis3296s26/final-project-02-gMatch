// apps/server/__tests__/workspaces.publish.test.js

const request = require("supertest");

jest.mock("../src/models/Workspace", () => ({
  findById: jest.fn(),
}));

jest.mock("../src/middleware/auth", () => ({
  requireAuth: (req, _res, next) => {
    req.user = { id: "507f1f77bcf86cd799439011", email: "user@test.com" };
    next();
  },
}));

const Workspace = require("../src/models/Workspace");
const app = require("../src/app");

describe("POST /api/workspaces/:id/publish", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("returns 404 if workspace does not exist", async () => {
    Workspace.findById.mockResolvedValue(null);

    const res = await request(app).post("/api/workspaces/w1/publish");

    expect(Workspace.findById).toHaveBeenCalledWith("w1");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Workspace not found" });
  });

  test("returns 400 if there are no teams to publish", async () => {
    Workspace.findById.mockResolvedValue({
      _id: "w1",
      teams: [],
    });

    const res = await request(app).post("/api/workspaces/w1/publish");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "No teams to publish" });
  });

  test("publishes teams successfully", async () => {
    const save = jest.fn().mockResolvedValue(undefined);

    const workspace = {
      _id: "w1",
      teams: [{ members: [{ name: "Alice" }] }],
      status: "draft",
      save,
    };

    Workspace.findById.mockResolvedValue(workspace);

    const res = await request(app).post("/api/workspaces/w1/publish");

    expect(workspace.status).toBe("published");
    expect(save).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: "Teams published successfully",
      workspace: {
        _id: "w1",
        teams: [{ members: [{ name: "Alice" }] }],
        status: "published",
      },
    });
  });
});
