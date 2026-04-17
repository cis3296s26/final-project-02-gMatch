/**
 * POC Tests: apps/web/src/app pages
 *
 * File location: apps/web/__tests__/pages.test.jsx
 * Run from:      apps/web/  →  npx jest
 *
 * Dependencies (install in apps/web/):
 *   npm install --save-dev jest jest-environment-jsdom babel-jest
 *     @babel/preset-env @babel/preset-react
 *     @testing-library/react @testing-library/jest-dom
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

// ── Global mocks ──────────────────────────────────────────────────────────────

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: jest.fn(() => null) }),
}));

const mockSignIn = jest.fn();
jest.mock("next-auth/react", () => ({
  signIn: (...args) => mockSignIn(...args),
  useSession: jest.fn(),
}));

jest.mock("../src/components/Navbar", () => () => <nav data-testid="navbar" />);

import { useSession } from "next-auth/react";

// ─────────────────────────────────────────────────────────────────────────────
// app/login/page.js
// ─────────────────────────────────────────────────────────────────────────────
import LoginPage from "../src/app/login/page";

describe("LoginPage", () => {
  beforeEach(() => mockSignIn.mockClear());

  it("renders GitHub and Google sign-in buttons", () => {
    render(<LoginPage />);
    expect(screen.getByText(/continue with github/i)).toBeInTheDocument();
    expect(screen.getByText(/continue with google/i)).toBeInTheDocument();
  });

  it("calls signIn('github') when the GitHub button is clicked", async () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByText(/continue with github/i));
    await waitFor(() =>
      expect(mockSignIn).toHaveBeenCalledWith(
        "github",
        expect.objectContaining({ callbackUrl: "/select-role" })
      )
    );
  });

  it("calls signIn('google') when the Google button is clicked", async () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByText(/continue with google/i));
    await waitFor(() =>
      expect(mockSignIn).toHaveBeenCalledWith(
        "google",
        expect.objectContaining({ callbackUrl: "/select-role" })
      )
    );
  });

  it("displays the gMatch logo and welcome heading", () => {
    render(<LoginPage />);
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(screen.getByText(/gmatch/i)).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// app/select-role/page.js
// ─────────────────────────────────────────────────────────────────────────────
import SelectRolePage from "../src/app/select-role/page";

global.fetch = jest.fn();

describe("SelectRolePage", () => {
  beforeEach(() => {
    mockPush.mockClear();
    global.fetch.mockClear();
  });

  it("shows a loading state while session is loading", () => {
    useSession.mockReturnValue({ data: null, status: "loading" });
    render(<SelectRolePage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("renders role selection cards when authenticated with no role", () => {
    useSession.mockReturnValue({
      data: { user: { email: "user@example.com", role: null }, token: "tok" },
      status: "authenticated",
      update: jest.fn(),
    });
    render(<SelectRolePage />);
    expect(screen.getByText(/i'm an organizer/i)).toBeInTheDocument();
    expect(screen.getByText(/i'm a participant/i)).toBeInTheDocument();
  });

  it("redirects to organizer dashboard if already an organizer", () => {
    useSession.mockReturnValue({
      data: { user: { email: "org@example.com", role: "organizer" }, token: "tok" },
      status: "authenticated",
      update: jest.fn(),
    });
    render(<SelectRolePage />);
    expect(mockPush).toHaveBeenCalledWith("/organizer/dashboard");
  });

  it("calls PATCH /api/auth/role and redirects on organizer selection", async () => {
    const mockUpdate = jest.fn().mockResolvedValue(undefined);
    useSession.mockReturnValue({
      data: { user: { email: "new@example.com", role: null }, token: "tok" },
      status: "authenticated",
      update: mockUpdate,
    });
    global.fetch.mockResolvedValueOnce({ ok: true });

    render(<SelectRolePage />);
    fireEvent.click(screen.getByText(/continue as organizer/i));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/auth/role"),
        expect.objectContaining({ method: "PATCH" })
      );
      expect(mockPush).toHaveBeenCalledWith("/organizer/dashboard");
    });
  });

  it("redirects even if the API call fails (graceful fallback)", async () => {
    useSession.mockReturnValue({
      data: { user: { email: "fallback@example.com", role: null }, token: "tok" },
      status: "authenticated",
      update: jest.fn(),
    });
    global.fetch.mockRejectedValueOnce(new Error("Network error"));

    render(<SelectRolePage />);
    fireEvent.click(screen.getByText(/continue as participant/i));

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith("/participant/dashboard")
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// app/page.js  (Landing page)
// ─────────────────────────────────────────────────────────────────────────────
import LandingPage from "../src/app/page";

describe("LandingPage", () => {
  it("renders the hero heading", () => {
    render(<LandingPage />);
    expect(screen.getByText(/build better teams/i)).toBeInTheDocument();
  });

  it("renders both CTA buttons linking to the correct dashboards", () => {
    render(<LandingPage />);
    expect(screen.getByText(/dashboard/i).closest("a")).toHaveAttribute(
      "href",
      "/organizer/dashboard"
    );
    expect(screen.getByText(/join a team/i).closest("a")).toHaveAttribute(
      "href",
      "/participant/dashboard"
    );
  });

  it("renders all six feature cards", () => {
    render(<LandingPage />);
    expect(screen.getByText(/smart matching engine/i)).toBeInTheDocument();
    expect(screen.getByText(/dynamic form builder/i)).toBeInTheDocument();
    expect(screen.getByText(/real-time collaboration/i)).toBeInTheDocument();
    expect(screen.getByText(/whitelist & blacklist/i)).toBeInTheDocument();
    expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/template/i)).toBeInTheDocument();
  });

  it("renders the footer with stack info", () => {
    render(<LandingPage />);
    expect(screen.getByText(/next\.js, express & mongodb/i)).toBeInTheDocument();
  });
});
