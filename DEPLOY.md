# PAD & PMC Internship System — Deployment Guide

## What this is
A complete web-based internship management system with:
- Intern daily log (mobile form)
- Mentor evaluation (QR code entry)
- Exit feedback form (Day 10)
- HR admin dashboard with live stats and QR generator
- SQLite database (no external DB needed)
- Node.js/Express backend

---

## Option A — Deploy on Render (FREE, easiest)

1. Create a free account at https://render.com
2. Click "New Web Service"
3. Connect your GitHub repo (upload this folder to GitHub first)
4. Set build command: `npm install`
5. Set start command: `npm start`
6. Add environment variables:
   - `HR_API_KEY` = choose a strong password (e.g. `pmcpad2026admin`)
   - `PORT` = 3000
7. Click Deploy — Render gives you a free URL like `https://padpmc-internship.onrender.com`
8. Point your domain `intern.pmcpad.ae` to this URL via your DNS settings

---

## Option B — Deploy on DigitalOcean (~$6/month)

1. Create a Droplet (Ubuntu 22.04, Basic, $6/month)
2. SSH into the server
3. Run:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pm2
   ```
4. Upload your files (use FileZilla or scp)
5. Run:
   ```bash
   cd padpmc-internship-app
   npm install
   HR_API_KEY=your-secret-key pm2 start server/server.js --name padpmc
   pm2 save
   pm2 startup
   ```
6. Set up Nginx as reverse proxy (optional but recommended for HTTPS)

---

## Option C — Deploy on Railway (FREE tier available)

1. Go to https://railway.app
2. "New Project" → "Deploy from GitHub"
3. Add environment variables: `HR_API_KEY`, `PORT`
4. Done — Railway auto-detects Node.js

---

## Environment Variables

| Variable    | Description                          | Example                    |
|-------------|--------------------------------------|----------------------------|
| PORT        | Port to run on (default 3000)        | 3000                       |
| HR_API_KEY  | Secret key for HR dashboard API      | pmcpad2026admin            |
| DB_PATH     | Path to SQLite file (optional)       | /data/internship.db        |

---

## API Endpoints (for HR use)

All HR endpoints require the header: `x-api-key: YOUR_HR_API_KEY`

| Method | Endpoint            | Description                          |
|--------|---------------------|--------------------------------------|
| POST   | /api/logs           | Submit intern daily log              |
| POST   | /api/evaluations    | Submit mentor evaluation             |
| POST   | /api/exit-feedback  | Submit exit feedback                 |
| GET    | /api/hr/stats       | Dashboard counts (protected)         |
| GET    | /api/hr/logs        | All daily logs (protected)           |
| GET    | /api/hr/evaluations | All mentor evaluations (protected)   |
| GET    | /api/hr/exits       | All exit feedback (protected)        |
| GET    | /api/hr/summary     | Logs with eval status (protected)    |

---

## QR Code Flow

1. HR opens dashboard → selects intern name, department, day
2. QR code auto-generates linking to:
   `https://intern.pmcpad.ae/eval?intern=sara-ahmed&dept=cardiology&day=day-3`
3. HR prints or WhatsApps the QR to the department mentor
4. Mentor scans QR on their own phone → form opens pre-filled
5. Mentor submits → linked to intern in dashboard

---

## Data Export

All data is stored in `internship.db` (SQLite).
To export to Excel, install DB Browser for SQLite (free) and export any table as CSV.

Or use the API endpoints to pull JSON data into your own spreadsheet.

---

## Support
Contact: internship@pmcpad.ae
Prepared for: PAD & PMC Internship Programme 2026
