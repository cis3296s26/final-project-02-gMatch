# gMatch — Project Architecture

This document explains the file architecture and how we should approach building the webapp.

---

## Monorepo Layout

```
final-project-02-gMatch/
├── apps/
│   ├── web/                    # Next.js frontend
│   └── server/                 # Express.js backend
├── packages/
│   └── types/                  # Shared JSDoc type definitions
├── package.json                # Root — defines npm workspaces
├── turbo.json                  # Turborepo pipeline config
├── .env.example                # Template for environment variables
└── .gitignore
```

Running `npm run dev` from the root starts both `apps/web` and `apps/server` concurrently via Turborepo.

---

## Frontend — `apps/web/`

Next.js 16 with App Router, JavaScript, Tailwind CSS v4, and shadcn/ui.

```
apps/web/
├── src/
│   ├── app/                        # Next.js App Router pages
│   │   ├── layout.js               # Root layout (fonts, metadata, global CSS)
│   │   ├── page.js                 # Landing page (/)
│   │   ├── globals.css             # Tailwind config + color theme
│   │   ├── organizer/
│   │   │   └── dashboard/
│   │   │       └── page.js         # Organizer dashboard not implemented yet
│   │   └── participant/
│   │       └── dashboard/
│   │           └── page.js         # Participant dashboard not implemented yet
│   ├── components/
│   │   ├── Navbar.jsx              # Shared navbar (landing + dashboard variants)
│   │   └── ui/                     # shadcn/ui components (auto-generated)
│   │       ├── button.jsx
│   │       ├── card.jsx
│   │       └── badge.jsx
│   └── lib/
│       └── utils.js                # cn() helper for Tailwind class merging
├── public/                         # Static assets (SVGs, favicon)
├── components.json                 # shadcn/ui config
├── next.config.mjs
└── package.json                    # @gmatch/web
```

### Where to add new code

| What to build                     | Where it goes                        |
|-----------------------------------|--------------------------------------|
| New page (e.g. `/workspace/[id]`) | `src/app/workspace/[id]/page.js`     |
| Reusable UI component             | `src/components/YourComponent.jsx`  |
| shadcn/ui component               | Run `npx shadcn@latest add <name>` — auto-placed in `src/components/ui/` |
| API call helper / hooks           | `src/lib/`                         |
| Static image or asset             | `public/`                          |

### Conventions
- Pages are **server components** by default. Add `"use client"` at the top only if the component needs state, effects, or event handlers.
- Use the `@/` import alias (maps to `src/`). Example: `import { Button } from "@/components/ui/button"`
- Use `cn()` from `@/lib/utils` to merge Tailwind classes conditionally.

---

## Backend — `apps/server/`

Express.js with Mongoose, CORS, and dotenv.

```
apps/server/
├── src/
│   ├── index.js                    # Server entry point (middleware, routes, startup)
│   ├── config/
│   │   └── db.js                   # connectDB() — Mongoose connection helper
│   ├── models/                     # Mongoose schemas
│   │   ├── User.js
│   │   ├── Workspace.js
│   │   ├── Form.js
│   │   ├── Response.js
│   │   ├── Team.js
│   │   └── Notification.js
│   ├── routes/                     # Express route handlers (to be created)
│   │   └── (e.g. workspace.js, auth.js, form.js)
│   ├── controllers/                # Business logic (to be created)
│   │   └── (e.g. workspaceController.js)
│   ├── middleware/                  # Auth middleware, validation (to be created)
│   │   └── (e.g. auth.js)
│   └── services/                   # Matching algorithms, strategies (to be created)
│       └── (e.g. strategies/)
├── .env                            # Local env vars (gitignored)
└── package.json                    # @gmatch/server
```

### Where to add new code

| What to build                          | Where it goes                |
|----------------------------------------|------------------------------|
| New API endpoint                       | Create a router file in `src/routes/`, define handlers in `src/controllers/`, wire into `src/index.js` |

| New data model                         | `src/models/YourModel.js` |
| Auth middleware                        | `src/middleware/auth.js` |
| Matching algorithm / strategy          | `src/services/strategies/` |
| Database config                        | `src/config/` |

### Conventions
- Routes go in `src/routes/`, business logic in `src/controllers/`. Keep routes thin — they should just call controller functions.
- All routes should be prefixed with `/api/` (e.g. `/api/workspaces`, `/api/auth/login`).
- Use `require()` / `module.exports` (CommonJS). The server is plain Node.js, not ESM.

---

## Shared Types — `packages/types/`

```
packages/types/
├── index.js        # JSDoc-annotated @typedef definitions for all models
└── package.json    # @gmatch/types
```

This package provides IDE autocompletion across both `apps/web` and `apps/server`. Import with:

```js
/** @type {import("@gmatch/types").User} */
```

When adding a new model, add a matching `@typedef` here so the whole team gets autocomplete.

---

## Environment Variables

See `.env.example` in the root. Each developer should create their own `.env` files:
- `apps/server/.env` — must contain `MONGODB_URI` at minimum

| Variable                      | Used by | Purpose                         |
|-------------------------------|---------|---------------------------------|
| `MONGODB_URI`                 | server  | MongoDB Atlas connection string |
| `NEXTAUTH_URL`                | web     | NextAuth base URL               |
| `NEXTAUTH_SECRET`             | web     | NextAuth encryption secret      |
| `GITHUB_CLIENT_ID`            | web     | GitHub OAuth                    |
| `GOOGLE_CLIENT_ID` / `SECRET` | web     | Google OAuth                    |
| `NEXT_PUBLIC_API_URL`         | web     | Backend URL for API calls       |
