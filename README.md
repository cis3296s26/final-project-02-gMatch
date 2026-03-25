# Group Project Matching Tool

CIS 3296- gMatch

## Purpose
This repository is a **proof of concept** demonstrating that the required tools
(Node.js, Express, MongoDB, Mongoose) compile and run together.

The code is intentionally minimal and suitable for a PoC.

## Environment
- OS: macOS / Windows 11 / Ubuntu 22.04+
- Runtime: Node.js 18+
- Database: MongoDB (local or Atlas)

## How to Run
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

