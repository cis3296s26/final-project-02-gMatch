// apps/server/__tests__/responses.test.js

const request = require("supertest");

jest.mock("../src/models/Response", () => ({
  findOneAndUpdate: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
}));

jest.mock("../src/models/Workspace", () => ({
  findById: jest.fn(),
}));

jest.mock("../src/models/Notification", () => ({
  create: jest.fn(),
}));

jest.mock("../src/middleware/auth", () => ({
  requireAuth: (req, _res, next) => {
    req.user = { id: "507f1f77bcf86cd799439011", email: "user@test.com" };
    next();
  },
}));

const Response = require("../src/models/Response");
const Workspace = require("../src/models/Workspace");
const Notification = require("../src/models/Notification");
const app = require("../src/app");

describe("Responses routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("POST /api/response", () => {
    test("returns 400 when workspaceId is missing", async () => {
      const res = await request(app).post("/api/response").send({
        answers: [],
      });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "workspaceId is required" });
    });

    test("saves response successfully when there are no conflicts", async () => {
      const savedResponse = {
        _id: "r1",
        workspaceId: "507f1f77bcf86cd799439011",
        participantId: "507f1f77bcf86cd799439011",
        answers: [{ questionId: "availability", value: [] }],
        availabilityGrid: {},
        whitelistEmails: [],
        blacklistEmails: [],
      };

      Response.findOneAndUpdate.mockResolvedValue(savedResponse);
      Response.find.mockResolvedValue([savedResponse]);
      Workspace.findById.mockResolvedValue({
        _id: "507f1f77bcf86cd799439011",
        organizerId: "org1",
        name: "Workspace A",
      });

      const res = await request(app).post("/api/response").send({
        workspaceId: "507f1f77bcf86cd799439011",
        answers: [{ questionId: "availability", value: [] }],
        whitelistEmails: [],
        blacklistEmails: [],
      });

      expect(Response.findOneAndUpdate).toHaveBeenCalled();
      expect(Response.find).toHaveBeenCalled();
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: "Saved successfully!",
        response: savedResponse,
        conflictsDetected: 0,
      });
      expect(Notification.create).not.toHaveBeenCalled();
    });

    test("creates notifications when conflicts are detected", async () => {
      const savedResponse = {
        _id: "r1",
        workspaceId: "507f1f77bcf86cd799439011",
        participantId: { _id: "u1", name: "Alice" },
        answers: [
          {
            questionId: "availability",
            value: [{ day: "Monday", startTime: "09:00", endTime: "10:00" }],
          },
        ],
        availabilityGrid: { Monday: ["09:00-10:00"] },
      };

      const otherResponse = {
        _id: "r2",
        workspaceId: "507f1f77bcf86cd799439011",
        participantId: { _id: "u2", name: "Bob" },
        answers: [
          {
            questionId: "availability",
            value: [{ day: "Tuesday", startTime: "09:00", endTime: "10:00" }],
          },
        ],
        availabilityGrid: { Tuesday: ["09:00-10:00"] },
      };

      Response.findOneAndUpdate.mockResolvedValue(savedResponse);
      Response.find.mockResolvedValue([savedResponse, otherResponse]);
      Workspace.findById.mockResolvedValue({
        _id: "507f1f77bcf86cd799439011",
        organizerId: "org1",
        name: "Workspace A",
      });
      Notification.create.mockResolvedValue({});

      const res = await request(app).post("/api/response").send({
        workspaceId: "507f1f77bcf86cd799439011",
        answers: [
          {
            questionId: "availability",
            value: [{ day: "Monday", startTime: "09:00", endTime: "10:00" }],
          },
        ],
      });

      expect(res.status).toBe(200);
      expect(res.body.conflictsDetected).toBe(1);
      expect(Notification.create).toHaveBeenCalledTimes(3);
    });

    test("returns 500 when save fails", async () => {
      Response.findOneAndUpdate.mockRejectedValue(new Error("db fail"));

      const res = await request(app).post("/api/response").send({
        workspaceId: "507f1f77bcf86cd799439011",
        answers: [],
      });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: "Failed to save response" });
    });
  });

  describe("GET /api/response", () => {
    test("returns 400 when workspaceId query is missing", async () => {
      const res = await request(app).get("/api/response");

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "workspaceId is required" });
    });

    test("returns responses and conflicts summary", async () => {
      const responses = [
        {
          _id: "r1",
          participantId: { _id: "u1", name: "Alice" },
          availabilityGrid: { Monday: ["09:00-10:00"] },
        },
        {
          _id: "r2",
          participantId: { _id: "u2", name: "Bob" },
          availabilityGrid: { Tuesday: ["09:00-10:00"] },
        },
      ];

      const populate = jest.fn().mockResolvedValue(responses);
      Response.find.mockReturnValue({ populate });

      const res = await request(app).get(
        "/api/response?workspaceId=507f1f77bcf86cd799439011"
      );

      expect(Response.find).toHaveBeenCalled();
      expect(populate).toHaveBeenCalledWith("participantId", "name email avatar");
      expect(res.status).toBe(200);
      expect(res.body.responses).toEqual(responses);
      expect(res.body.conflictsDetected).toBe(1);
      expect(res.body.conflicts).toHaveLength(1);
    });

    test("returns 500 when fetch fails", async () => {
      const populate = jest.fn().mockRejectedValue(new Error("db fail"));
      Response.find.mockReturnValue({ populate });

      const res = await request(app).get(
        "/api/response?workspaceId=507f1f77bcf86cd799439011"
      );

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: "Failed to fetch responses" });
    });
  });

  describe("GET /api/response/my", () => {
    test("returns 400 when workspaceId query is missing", async () => {
      const res = await request(app).get("/api/response/my");

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "workspaceId is required" });
    });

    test("returns current user's response", async () => {
      const responseDoc = {
        _id: "r1",
        workspaceId: "507f1f77bcf86cd799439011",
        participantId: "507f1f77bcf86cd799439011",
      };

      Response.findOne.mockResolvedValue(responseDoc);

      const res = await request(app).get(
        "/api/response/my?workspaceId=507f1f77bcf86cd799439011"
      );

      expect(Response.findOne).toHaveBeenCalled();
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ response: responseDoc });
    });

    test("returns null when current user has no response", async () => {
      Response.findOne.mockResolvedValue(null);

      const res = await request(app).get(
        "/api/response/my?workspaceId=507f1f77bcf86cd799439011"
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ response: null });
    });

    test("returns 500 when own-response fetch fails", async () => {
      Response.findOne.mockRejectedValue(new Error("db fail"));

      const res = await request(app).get(
        "/api/response/my?workspaceId=507f1f77bcf86cd799439011"
      );

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: "Failed to fetch response" });
    });
  });
});
