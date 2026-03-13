const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'dev.db');
const db = new Database(dbPath);

const id = 'user_seed_001';
const hashed = bcrypt.hashSync('password123', 10);
const now = new Date().toISOString();

// Create user
db.prepare(
  `INSERT OR IGNORE INTO User (id, name, email, password, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`
).run(id, 'Rory G', 'rory@atelier.com', hashed, now, now);

// Create team
const teamId = 'team_seed_001';
db.prepare(
  `INSERT OR IGNORE INTO Team (id, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)`
).run(teamId, "Rory's Team", now, now);

// Create team member
const memberId = 'member_seed_001';
db.prepare(
  `INSERT OR IGNORE INTO TeamMember (id, userId, teamId, role, joinedAt) VALUES (?, ?, ?, ?, ?)`
).run(memberId, id, teamId, 'admin', now);

console.log('Seeded successfully!');
console.log('Email: rory@atelier.com');
console.log('Password: password123');

db.close();
