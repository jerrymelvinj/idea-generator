import { neon } from '@neondatabase/serverless';

// Retrieve the database URL from the environment or command line
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ ERROR: DATABASE_URL is not set.");
  console.error("Please set it in your .env.local file or pass it directly:");
  console.error("DATABASE_URL=\"postgres://...\" node scripts/init-db.js");
  process.exit(1);
}

const sql = neon(connectionString);

async function init() {
  console.log("Connecting to Neon Postgres...");
  
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS ideas (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        title TEXT,
        category TEXT,
        tags TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_deleted INTEGER DEFAULT 0
      )
    `;
    console.log("✅ Successfully created 'ideas' table!");
  } catch (err) {
    console.error("❌ Failed to create table:", err);
  }
}

init();
