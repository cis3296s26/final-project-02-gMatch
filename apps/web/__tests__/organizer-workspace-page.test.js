// apps/web/__tests__/organizer-workspace-page.test.js

import { render, screen, waitFor } from "@testing-library/react";
import Page from "@/app/organizer/workspace/[id]/page";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "123" }),
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("next-auth/react", () => ({
  useSession: () => ({
    data: {
      token: "fake-token",
      user: { name: "Remi", email: "remi@test.com" },
    },
  }),
  signOut: jest.fn(),
}));

jest.mock("@/components/Navbar", () => function NavbarMock() {
  return <div data-testid="navbar">Navbar</div>;
});

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

jest.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }) => <div {...props}>{children}</div>,
}));

describe("Organizer Workspace Page", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  test("renders fetched workspace details", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        name: "Test Workspace",
        inviteCode: "ABC123",
        teamSize: 3,
        status: "draft",
        participants: [],
        teams: [],
      }),
    });

    render(<Page />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Test Workspace")).toBeInTheDocument();
    });

    expect(screen.getByText("ABC123")).toBeInTheDocument();
    expect(screen.getByDisplayValue("3")).toBeInTheDocument();
    expect(screen.getByText("Teams not published yet")).toBeInTheDocument();
    expect(
      screen.getByText("No participants yet. Share the invite code to get started.")
    ).toBeInTheDocument();
  });

  test("shows workspace not found when fetch is not ok", async () => {
    fetch.mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    render(<Page />);

    await waitFor(() => {
      expect(screen.getByText("Workspace not found.")).toBeInTheDocument();
    });
  });
});
