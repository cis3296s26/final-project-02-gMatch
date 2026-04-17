// apps/web/__tests__/participant-workspace-page.test.js

import { render, screen, waitFor } from "@testing-library/react";
import Page from "@/app/participant/workspace/[id]/page";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "123" }),
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("next-auth/react", () => ({
  useSession: () => ({
    data: {
      token: "fake-token",
      user: { name: "Remi" },
    },
  }),
}));

describe("Participant Workspace Page", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("shows loading state initially", () => {
    fetch.mockImplementation(() => new Promise(() => {}));

    render(<Page />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test("shows 'not published' message", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: "draft",
      }),
    });

    render(<Page />);

    await waitFor(() => {
      expect(
        screen.getByText(/teams not published yet/i)
      ).toBeInTheDocument();
    });
  });

  test("shows team members when published", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: "published",
        teams: [
          {
            members: [{ name: "Remi" }, { name: "Alice" }],
          },
        ],
      }),
    });

    render(<Page />);

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });
  });

  test("shows fallback when user not in any team", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: "published",
        teams: [
          {
            members: [{ name: "SomeoneElse" }],
          },
        ],
      }),
    });

    render(<Page />);

    await waitFor(() => {
      expect(
        screen.getByText(/not assigned to a team/i)
      ).toBeInTheDocument();
    });
  });
});
