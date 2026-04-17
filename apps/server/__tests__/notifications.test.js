// apps/server/__tests__/notifications.test.js

const request = require("supertest");

jest.mock("../src/models/Notification", () => ({
  find: jest.fn(),
  findOneAndUpdate: jest.fn(),
  updateMany: jest.fn(),
}));

jest.mock("../src/middleware/auth", () => ({
  requireAuth: (req, _res, next) => {
    req.user = { id: "507f1f77bcf86cd799439011" };
    next();
  },
}));

const Notification = require("../src/models/Notification");
const app = require("../src/app");

describe("Notifications routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("GET /api/notifications", () => {
    test("returns notifications for current user", async () => {
      const notifications = [{ _id: "n1", message: "Test notification" }];
      const sort = jest.fn().mockResolvedValue(notifications);

      Notification.find.mockReturnValue({ sort });

      const res = await request(app).get("/api/notifications");

      expect(Notification.find).toHaveBeenCalled();
      expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ notifications });
    });

    test("returns 500 when fetch fails", async () => {
      const sort = jest.fn().mockRejectedValue(new Error("db fail"));
      Notification.find.mockReturnValue({ sort });

      const res = await request(app).get("/api/notifications");

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: "Failed to fetch notifications" });
    });
  });

  describe("PATCH /api/notifications/:id/read", () => {
    test("marks one notification as read", async () => {
      const notification = {
        _id: "n1",
        userId: "507f1f77bcf86cd799439011",
        read: true,
      };

      Notification.findOneAndUpdate.mockResolvedValue(notification);

      const res = await request(app).patch("/api/notifications/n1/read");

      expect(Notification.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ _id: "n1" }),
        { read: true },
        { new: true }
      );
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ notification });
    });

    test("returns 404 when notification not found", async () => {
      Notification.findOneAndUpdate.mockResolvedValue(null);

      const res = await request(app).patch("/api/notifications/n1/read");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "Notification not found" });
    });

    test("returns 500 when update fails", async () => {
      Notification.findOneAndUpdate.mockRejectedValue(new Error("db fail"));

      const res = await request(app).patch("/api/notifications/n1/read");

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: "Failed to update notification" });
    });
  });

  describe("PATCH /api/notifications/read-all", () => {
    test("marks all notifications as read", async () => {
      Notification.updateMany.mockResolvedValue({ modifiedCount: 2 });

      const res = await request(app).patch("/api/notifications/read-all");

      expect(Notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ read: false }),
        { read: true }
      );
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: "All notifications marked as read",
      });
    });

    test("returns 500 when bulk update fails", async () => {
      Notification.updateMany.mockRejectedValue(new Error("db fail"));

      const res = await request(app).patch("/api/notifications/read-all");

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: "Failed to update notifications" });
    });
  });
});
