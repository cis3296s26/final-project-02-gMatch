// apps/web/__tests__/middleware.test.js

import middleware from "../middleware";
import { NextResponse } from "next/server";

jest.mock("@/lib/auth", () => ({
  auth: (handler) => handler,
}));

jest.mock("next/server", () => ({
  NextResponse: {
    next: jest.fn(() => ({ type: "next" })),
    redirect: jest.fn((url) => ({ type: "redirect", url: url.toString() })),
  },
}));

function makeRequest(pathname, auth = null) {
  return {
    nextUrl: {
      pathname,
      clone() {
        return {
          pathname,
          searchParams: new URLSearchParams(),
        };
      },
    },
    url: `http://localhost:3000${pathname}`,
    auth,
  };
}

describe("middleware", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("allows public route through", () => {
    const req = makeRequest("/", null);

    const res = middleware(req);

    expect(NextResponse.next).toHaveBeenCalled();
    expect(res.type).toBe("next");
  });

  test("redirects unauthenticated user trying to access participant route", () => {
    const req = makeRequest("/participant/workspace/123", null);

    const res = middleware(req);

    expect(NextResponse.redirect).toHaveBeenCalled();
    expect(res.type).toBe("redirect");
    expect(res.url).toContain("/login");
  });

  test("redirects organizer away from login", () => {
    const req = makeRequest("/login", {
      user: { role: "organizer" },
    });

    const res = middleware(req);

    expect(NextResponse.redirect).toHaveBeenCalled();
    expect(res.url).toContain("/organizer/dashboard");
  });

  test("redirects participant away from login", () => {
    const req = makeRequest("/login", {
      user: { role: "participant" },
    });

    const res = middleware(req);

    expect(NextResponse.redirect).toHaveBeenCalled();
    expect(res.url).toContain("/participant/dashboard");
  });

  test("redirects authenticated user with no role to select-role", () => {
    const req = makeRequest("/login", {
      user: {},
    });

    const res = middleware(req);

    expect(NextResponse.redirect).toHaveBeenCalled();
    expect(res.url).toContain("/select-role");
  });
});
