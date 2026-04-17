// apps/server/__tests__/forms.test.js

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
    req.user = { id: "507f1f77bcf86cd799439011", email: "user@test.com" };
    next();
  },
}));

const Form = require("../src/models/Form");
const Workspace = require("../src/models/Workspace");
const app = require("../src/app");

describe("Forms routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("GET /api/forms/:workspaceId", () => {
    test("returns 400 for invalid workspace id", async () => {
      const res = await request(app).get("/api/forms/not-a-valid-id");

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Invalid workspace id" });
    });

    test("returns 404 when workspace does not exist", async () => {
      Workspace.findById.mockResolvedValue(null);

      const res = await request(app).get(
        "/api/forms/507f1f77bcf86cd799439011"
      );

      expect(Workspace.findById).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011"
      );
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Workspace not found" });
    });

    test("returns default empty form when no form exists", async () => {
      Workspace.findById.mockResolvedValue({
        _id: "507f1f77bcf86cd799439011",
      });
      Form.findOne.mockResolvedValue(null);

      const res = await request(app).get(
        "/api/forms/507f1f77bcf86cd799439011"
      );

      expect(Form.findOne).toHaveBeenCalledWith({
        workspaceId: "507f1f77bcf86cd799439011",
      });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        form: {
          workspaceId: "507f1f77bcf86cd799439011",
          questions: [],
        },
      });
    });

    test("returns saved form for workspace", async () => {
      const form = {
        _id: "f1",
        workspaceId: "507f1f77bcf86cd799439011",
        questions: [{ id: "q1", label: "Skill?", type: "skill-tag", tag: "skills", options: [] }],
      };

      Workspace.findById.mockResolvedValue({
        _id: "507f1f77bcf86cd799439011",
      });
      Form.findOne.mockResolvedValue(form);

      const res = await request(app).get(
        "/api/forms/507f1f77bcf86cd799439011"
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ form });
    });
  });

  describe("PUT /api/forms/:workspaceId", () => {
    test("returns 400 for invalid workspace id", async () => {
      const res = await request(app).put("/api/forms/not-a-valid-id").send({
        questions: [],
      });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Invalid workspace id" });
    });

    test("returns 400 when questions is not an array", async () => {
      const res = await request(app)
        .put("/api/forms/507f1f77bcf86cd799439011")
        .send({
          questions: {},
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Questions must be an array" });
    });

    test("returns 404 when workspace does not exist", async () => {
      Workspace.findById.mockResolvedValue(null);

      const res = await request(app)
        .put("/api/forms/507f1f77bcf86cd799439011")
        .send({
          questions: [],
        });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Workspace not found" });
    });

    test("saves cleaned questions successfully", async () => {
      Workspace.findById.mockResolvedValue({
        _id: "507f1f77bcf86cd799439011",
      });

      const savedForm = {
        _id: "f1",
        workspaceId: "507f1f77bcf86cd799439011",
        questions: [
          {
            id: "q1",
            type: "skill-tag",
            label: "What are your skills?",
            tag: "skills",
            options: [],
          },
          {
            id: "q2",
            type: "multiple-choice",
            label: "Preferred meeting day",
            tag: "meeting",
            options: ["Monday", "Tuesday"],
          },
        ],
      };

      Form.findOneAndUpdate.mockResolvedValue(savedForm);

      const res = await request(app)
        .put("/api/forms/507f1f77bcf86cd799439011")
        .send({
          questions: [
            {
              id: "q1",
              type: "skill-tag",
              label: "  What are your skills?  ",
              tag: " skills ",
              options: [],
            },
            {
              id: "q2",
              type: "multiple-choice",
              label: "Preferred meeting day",
              tag: " meeting ",
              options: [" Monday ", "Tuesday", ""],
            },
            {
              id: "q3",
              type: "unknown-type",
              label: "Fallback type question",
              tag: "misc",
              options: ["A", "B"],
            },
            {
              id: "q4",
              type: "multiple-choice",
              label: "   ",
              tag: "ignored",
              options: ["X"],
            },
          ],
        });

      expect(Form.findOneAndUpdate).toHaveBeenCalledWith(
        { workspaceId: "507f1f77bcf86cd799439011" },
        {
          workspaceId: "507f1f77bcf86cd799439011",
          questions: [
            {
              id: "q1",
              type: "skill-tag",
              label: "What are your skills?",
              tag: "skills",
              options: [],
            },
            {
              id: "q2",
              type: "multiple-choice",
              label: "Preferred meeting day",
              tag: "meeting",
              options: ["Monday", "Tuesday"],
            },
            {
              id: "q3",
              type: "multiple-choice",
              label: "Fallback type question",
              tag: "misc",
              options: ["A", "B"],
            },
          ],
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: "Form saved successfully",
        form: savedForm,
      });
    });
  });
});
