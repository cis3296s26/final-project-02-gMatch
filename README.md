# Group Project Matching Tool

CIS 3296 - gMatch

## Purpose
gMatch is a group project matching tool built for CIS 3296. It helps instructors create balanced student teams using survey responses such as availability and skills. Instead of forming teams manually, instructors can configure grouping preferences and generate teams through different matching strategies.

This repository began as a proof of concept and is being expanded into a full web application with both frontend and backend functionality.

## Environment
- OS: macOS / Windows 11 / Ubuntu 22.04+
- Runtime: Node.js 18+
- Database: MongoDB (local or Atlas)

## Features
- Student survey for collecting availability and skills
- Instructor dashboard for team configuration
- Multiple matching strategies
- Team generation preview
- Configurable team sizes
- Workspace-based flow for organizing users

## Tech Stack
- Frontend: Next.js, React
- Backend: Node.js, Express
- Database: MongoDB, Mongoose
- Auth: NextAuth.js
- Monorepo: Turborepo

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

### Instructions on MongoDB and Auth
- [Authentication Set Up](https://github.com/cis3296s26/final-project-02-gMatch/issues/41)
- [MongoDB Local Installation Instructions](https://github.com/cis3296s26/final-project-02-gMatch/issues/30)

### Setup
```
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env
# Then fill in your MongoDB URI, OAuth credentials, etc.

# 3. Start both apps (frontend + backend)
npm run dev

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
```

