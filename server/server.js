// PAD & PMC Internship System — Backend Server
// Stack: Node.js + Express + SQLite (no external database needed)
// Deploy on: DigitalOcean, Render, Railway, or any Node.js host

const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Database setup ─────────────────────────────────────────────────
const db = new Database(process.env.DB_PATH || './internship.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS daily_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    intern_name TEXT NOT NULL,
    department TEXT NOT NULL,
    day_number TEXT NOT NULL,
    log_date TEXT,
    observation TEXT,
    key_learning TEXT,
    challenges TEXT,
    day_rating TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS mentor_evaluations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    intern_name TEXT NOT NULL,
    mentor_name TEXT NOT NULL,
    mentor_designation TEXT,
    department TEXT NOT NULL,
    eval_date TEXT,
    rating_communication TEXT,
    rating_initiative TEXT,
    rating_professionalism TEXT,
    rating_learning TEXT,
    comments TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS exit_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    intern_name TEXT NOT NULL,
    programme_dates TEXT,
    scale_objectives INTEGER,
    scale_mentors INTEGER,
    scale_schedule INTEGER,
    scale_skills INTEGER,
    scale_mission INTEGER,
    q_overall_feeling TEXT,
    q_journey TEXT,
    q_welcomed TEXT,
    q_welcomed_reason TEXT,
    q_favourite_dept TEXT,
    q_recommendation TEXT,
    q_suggestions TEXT,
    overall_rating TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ── Middleware ─────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
// Simple API key auth for HR dashboard endpoints
const HR_API_KEY = process.env.HR_API_KEY || 'change-this-key-before-deploying';
function requireAuth(req, res, next) {
  const key = req.headers['x-api-key'] || req.query.key;
  if (key !== HR_API_KEY) return res.status(401).json({ error: 'Unauthorised' });
  next();
}

// ── API: Submit daily log ──────────────────────────────────────────
app.post('/api/logs', (req, res) => {
  const { intern_name, department, day_number, log_date,
          observation, key_learning, challenges, day_rating } = req.body;
  if (!intern_name || !department || !day_number) {
    return res.status(400).json({ error: 'intern_name, department, and day_number are required.' });
  }
  const stmt = db.prepare(`
    INSERT INTO daily_logs
    (intern_name, department, day_number, log_date, observation, key_learning, challenges, day_rating)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(intern_name, department, day_number, log_date,
                          observation, key_learning, challenges, day_rating);
  res.json({ success: true, id: result.lastInsertRowid });
});

// ── API: Submit mentor evaluation ──────────────────────────────────
app.post('/api/evaluations', (req, res) => {
  const { intern_name, mentor_name, mentor_designation, department, eval_date,
          rating_communication, rating_initiative, rating_professionalism,
          rating_learning, comments } = req.body;
  if (!intern_name || !mentor_name || !department) {
    return res.status(400).json({ error: 'intern_name, mentor_name, and department are required.' });
  }
  const stmt = db.prepare(`
    INSERT INTO mentor_evaluations
    (intern_name, mentor_name, mentor_designation, department, eval_date,
     rating_communication, rating_initiative, rating_professionalism, rating_learning, comments)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(intern_name, mentor_name, mentor_designation, department, eval_date,
                          rating_communication, rating_initiative, rating_professionalism,
                          rating_learning, comments);
  res.json({ success: true, id: result.lastInsertRowid });
});

// ── API: Submit exit feedback ──────────────────────────────────────
app.post('/api/exit-feedback', (req, res) => {
  const { intern_name, programme_dates, scale_objectives, scale_mentors,
          scale_schedule, scale_skills, scale_mission, q_overall_feeling,
          q_journey, q_welcomed, q_welcomed_reason, q_favourite_dept,
          q_recommendation, q_suggestions, overall_rating } = req.body;
  if (!intern_name) {
    return res.status(400).json({ error: 'intern_name is required.' });
  }
  const stmt = db.prepare(`
    INSERT INTO exit_feedback
    (intern_name, programme_dates, scale_objectives, scale_mentors, scale_schedule,
     scale_skills, scale_mission, q_overall_feeling, q_journey, q_welcomed,
     q_welcomed_reason, q_favourite_dept, q_recommendation, q_suggestions, overall_rating)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(intern_name, programme_dates, scale_objectives, scale_mentors,
                          scale_schedule, scale_skills, scale_mission, q_overall_feeling,
                          q_journey, q_welcomed, q_welcomed_reason, q_favourite_dept,
                          q_recommendation, q_suggestions, overall_rating);
  res.json({ success: true, id: result.lastInsertRowid });
});

// ── API: HR — get dashboard stats (protected) ──────────────────────
app.get('/api/hr/stats', requireAuth, (req, res) => {
  const logs    = db.prepare('SELECT COUNT(*) as count FROM daily_logs').get().count;
  const evals   = db.prepare('SELECT COUNT(*) as count FROM mentor_evaluations').get().count;
  const exits   = db.prepare('SELECT COUNT(*) as count FROM exit_feedback').get().count;
  const pending = Math.max(0, logs - evals);
  res.json({ logs, evals, exits, pending });
});

// ── API: HR — get all logs (protected) ────────────────────────────
app.get('/api/hr/logs', requireAuth, (req, res) => {
  const logs = db.prepare('SELECT * FROM daily_logs ORDER BY submitted_at DESC').all();
  res.json(logs);
});

// ── API: HR — get all evaluations (protected) ─────────────────────
app.get('/api/hr/evaluations', requireAuth, (req, res) => {
  const evals = db.prepare('SELECT * FROM mentor_evaluations ORDER BY submitted_at DESC').all();
  res.json(evals);
});

// ── API: HR — get all exit feedback (protected) ───────────────────
app.get('/api/hr/exits', requireAuth, (req, res) => {
  const exits = db.prepare('SELECT * FROM exit_feedback ORDER BY submitted_at DESC').all();
  res.json(exits);
});

// ── API: HR — get intern summary (logs + evals linked) ────────────
app.get('/api/hr/summary', requireAuth, (req, res) => {
  const logs = db.prepare(`
    SELECT l.*, 
      (SELECT COUNT(*) FROM mentor_evaluations e 
       WHERE e.intern_name = l.intern_name AND e.department = l.department) as has_eval
    FROM daily_logs l ORDER BY l.submitted_at DESC
  `).all();
  res.json(logs);
});

// ── Catch-all: serve index.html for SPA routing ───────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`PAD & PMC Internship System running on port ${PORT}`);
});
