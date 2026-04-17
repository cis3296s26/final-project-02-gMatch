const request = require("supertest");

jest.mock("../src/models/Form", () => ({
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
}));

jest.mock("../src/models/Workspace", () => ({
  findById: jest.fn(),
}));

jest.mock("../src/middleware/auth", () => ({
  requireAuth: (req, _res, next) => {
    req.user = { id: "507f1f77bcf86cd799439011" };
    next();
  },
}));

const Form = require("../src/models/Form");
const Workspace = require("../src/models/Workspace");
const app = require("../src/app");

describe("Forms extra routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("GET /api/forms/:workspaceId returns 500 on load failure", async () => {
    Workspace.findById.mockRejectedValue(new Error("db fail"));

    const res = await request(app).get(
      "/api/forms/507f1f77bcf86cd799439011"
    );

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      message: "Failed to load form",
      error: "db fail",
    });
  });

  test("PUT /api/forms/:workspaceId returns 500 on save failure", async () => {
    Workspace.findById.mockResolvedValue({
      _id: "507f1f77bcf86cd799439011",
    });
    Form.findOneAndUpdate.mockRejectedValue(new Error("db fail"));

    const res = await request(app)
      .put("/api/forms/507f1f77bcf86cd799439011")
      .send({
        questions: [
          {
            id: "q1",
            type: "multiple-choice",
            label: "Question?",
            tag: "test",
            options: ["A", "B"],
          },
        ],
      });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      message: "Failed to save form",
      error: "db fail",
    });
  });
});
