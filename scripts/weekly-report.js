#!/usr/bin/env node
/**
 * weekly-report.js — Emails a weekly connection count from SharkWatch access logs.
 *
 * Reads ~/.pm2/logs/sharkwatch-out.log, counts unique IPs per day for the past 7 days,
 * and sends a summary email via Gmail SMTP.
 *
 * Usage:  node weekly-report.js
 * Cron:   launchd — Sundays at noon (com.sharkwatch.weekly.plist)
 */

'use strict';

const fs        = require('fs');
const path      = require('path');
const readline  = require('readline');
const nodemailer = require('nodemailer');

// Load env
require('dotenv').config({ path: path.join(__dirname, '.env') });

const LOG_FILE = path.join(process.env.HOME, '.pm2/logs/sharkwatch-out.log');

// Returns YYYY-MM-DD strings for the last 7 days (today is day 0)
function lastSevenDays() {
  const days = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

// Parse " HTTP  07/03/2026 16:12:06 192.168.1.41 GET /" lines
// Returns { 'YYYY-MM-DD': Set<ip>, ... }
async function parseLog() {
  const window = new Set(lastSevenDays());
  const ipsByDay = {};
  window.forEach(d => { ipsByDay[d] = new Set(); });

  if (!fs.existsSync(LOG_FILE)) {
    console.error('Log file not found:', LOG_FILE);
    return ipsByDay;
  }

  const rl = readline.createInterface({
    input: fs.createReadStream(LOG_FILE),
    crlfDelay: Infinity,
  });

  // Format: " HTTP  DD/MM/YYYY HH:MM:SS IP_ADDR ..."
  const RE = /HTTP\s+(\d{2})\/(\d{2})\/(\d{4})\s+[\d:]+\s+([\d.]+)/;

  for await (const line of rl) {
    const m = line.match(RE);
    if (!m) continue;
    const iso = `${m[3]}-${m[2]}-${m[1]}`; // YYYY-MM-DD
    if (ipsByDay[iso]) {
      ipsByDay[iso].add(m[4]);
    }
  }

  return ipsByDay;
}

function formatDate(iso) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
}

function bar(n, max) {
  const width = max > 0 ? Math.round((n / max) * 20) : 0;
  return '█'.repeat(width) || (n > 0 ? '▏' : '·');
}

async function sendReport() {
  const ipsByDay = await parseLog();
  const days     = lastSevenDays();
  const counts   = days.map(d => ipsByDay[d].size);
  const total    = counts.reduce((a, b) => a + b, 0);
  const maxCount = Math.max(...counts, 1);

  const rows = days.map((d, i) => {
    const label = formatDate(d).padEnd(14);
    const n     = String(counts[i]).padStart(3);
    return `  ${label}  ${n}  ${bar(counts[i], maxCount)}`;
  });

  const weekEnd = formatDate(days[6]);

  const body = [
    `SharkWatch — Weekly Traffic Report`,
    `Week ending ${weekEnd}`,
    ``,
    `  Day             Unique IPs`,
    `  ─────────────────────────────`,
    ...rows,
    `  ─────────────────────────────`,
    `  Total              ${String(total).padStart(3)} unique device days`,
    ``,
    `(Unique IP addresses per day from ~/.pm2/logs/sharkwatch-out.log)`,
  ].join('\n');

  const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_SERVER   || 'smtp.gmail.com',
    port:   parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from:    `SharkWatch <${process.env.SMTP_USER}>`,
    to:      process.env.NOTIFY_EMAIL,
    subject: `🦈 SharkWatch — ${total} connection-days this week`,
    text:    body,
  });

  console.log(`[${new Date().toISOString()}] Weekly report sent. Total: ${total}`);
}

sendReport().catch(err => {
  console.error(`[${new Date().toISOString()}] Error:`, err.message);
  process.exit(1);
});
