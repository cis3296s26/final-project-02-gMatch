# Group Project Matching Tool

CIS 3296- gMatch

## Purpose
The goal of gMatch is to simplify the process of forming student project teams by using structured survey data and configurable matching strategies. In many courses, team formation is either done manually by the instructor or left to students to organize themselves, which can lead to scheduling conflicts, unbalanced skill distribution, and students being left without a group.

gMatch provides a lightweight web-based system where students submit their availability and technical skills through a short survey. The system then uses strategy-driven algorithms to generate balanced teams that maximize schedule compatibility and distribute skills across groups.

From the instructor’s perspective, the system provides tools to generate, review, and adjust teams before publishing the final assignments. By separating the team formation logic into interchangeable strategies, the system also allows instructors to choose the grouping approach that best fits the needs of their course.

Overall, the vision of gMatch is to create a simple, transparent, and extensible tool that improves collaboration in project-based courses while demonstrating sound software design principles.

## Tech Stack
Node.js
Express
MongoDB
Mongoose

The code is intentionally minimal and suitable for a PoC.

## Project Board
https://github.com/orgs/cis3296s26/projects/32/views/1

## Environment
- OS: macOS / Windows 11 / Ubuntu 22.04+
- Runtime: Node.js 18+
- Database: MongoDB (local or Atlas)

## How to Run
```bash
npm install
npm start
```

Server runs at:
http://localhost:3000

## Test Endpoint
```bash
curl http://localhost:3000/
curl http://localhost:3000/health
```
