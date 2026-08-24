import Database from 'better-sqlite3';
import path from 'path';

// Store the database in the root of the project
const dbPath = path.join(process.cwd(), 'ideas.db');
const db = new Database(dbPath);

// Initialize the database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS ideas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    title TEXT,
    category TEXT,
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_deleted INTEGER DEFAULT 0
  )
`);

export function getIdeas(includeDeleted = 0) {
  const stmt = db.prepare('SELECT * FROM ideas WHERE is_deleted = ? ORDER BY created_at DESC');
  return stmt.all(includeDeleted).map(idea => ({
    ...idea,
    tags: idea.tags ? JSON.parse(idea.tags) : []
  }));
}

export function getIdeaById(id) {
  const stmt = db.prepare('SELECT * FROM ideas WHERE id = ?');
  const idea = stmt.get(id);
  if (idea) {
    idea.tags = idea.tags ? JSON.parse(idea.tags) : [];
  }
  return idea;
}

export function createIdea({ content, title, category, tags }) {
  const stmt = db.prepare(`
    INSERT INTO ideas (content, title, category, tags, is_deleted)
    VALUES (?, ?, ?, ?, 0)
  `);
  const info = stmt.run(content, title, category, JSON.stringify(tags || []));
  return getIdeaById(info.lastInsertRowid);
}

export function updateIdea(id, { title, category, tags }) {
  const stmt = db.prepare(`
    UPDATE ideas 
    SET title = ?, category = ?, tags = ?
    WHERE id = ?
  `);
  stmt.run(title, category, JSON.stringify(tags || []), id);
  return getIdeaById(id);
}

// Soft delete
export function deleteIdea(id) {
  const stmt = db.prepare('UPDATE ideas SET is_deleted = 1 WHERE id = ?');
  stmt.run(id);
}

// Restore from trash
export function restoreIdea(id) {
  const stmt = db.prepare('UPDATE ideas SET is_deleted = 0 WHERE id = ?');
  stmt.run(id);
  return getIdeaById(id);
}

// Permanent delete
export function permanentlyDeleteIdea(id) {
  const stmt = db.prepare('DELETE FROM ideas WHERE id = ?');
  stmt.run(id);
}
