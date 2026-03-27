# Group Project Matching Tool

CIS 3296- gMatch

## Purpose
The goal of gMatch is to simplify the process of forming student project teams by using structured survey data and configurable matching strategies. In many courses, team formation is either done manually by the instructor or left to students to organize themselves, which can lead to scheduling conflicts, unbalanced skill distribution, and students being left without a group.

gMatch provides a lightweight web-based system where students submit their availability and technical skills through a short survey. The system then uses strategy-driven algorithms to generate balanced teams that maximize schedule compatibility and distribute skills across groups.

From the instructor’s perspective, the system provides tools to generate, review, and adjust teams before publishing the final assignments. By separating the team formation logic into interchangeable strategies, the system also allows instructors to choose the grouping approach that best fits the needs of their course.

Overall, the vision of gMatch is to create a simple, transparent, and extensible tool that improves collaboration in project-based courses while demonstrating sound software design principles.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Monorepo** | Turborepo |
| **Frontend** | Next.js (App Router), React, Tailwind CSS, shadcn/ui |
| **Backend** | Node.js, Express.js (JavaScript) |
| **Real-Time** | Socket.io |
| **Database** | MongoDB Atlas + Mongoose |
| **Auth** | NextAuth.js (Google + GitHub OAuth) |

## Project Board
https://github.com/orgs/cis3296s26/projects/32/views/1

## Project Structure

```
gmatch/
├── apps/
│   ├── web/          # Next.js frontend (port 3000)
│   └── server/       # Express backend  (port 5001)
├── packages/
│   └── types/        # Shared JSDoc-annotated type definitions
├── turbo.json
└── package.json
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env
# Then fill in your MongoDB URI, OAuth credentials, etc.

# 3. Start both apps (frontend + backend)
npm run dev
```

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:5001
- **Health Check:** http://localhost:5001/api/health

## Environment Variables

See `.env.example` for all required variables:
- `MONGODB_URI` — MongoDB Atlas connection string
- `NEXTAUTH_SECRET` — Secret for NextAuth.js sessions
- `NEXTAUTH_URL` — Frontend URL (default: http://localhost:3000)
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` — GitHub OAuth app credentials
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth app credentials
- `NEXT_PUBLIC_API_URL` — Express backend URL (default: http://localhost:5001)

### Page Links (Temporary Access for Demo)

If deployed locally, change port as needed
```
# 1. Instructor View
http://localhost:3000/instructor

# 2. Survey Page
http://localhost:3000/participant/survey
```