import { neon } from '@neondatabase/serverless';

// Note: DATABASE_URL must be defined in your environment (.env.local)
const sql = neon(process.env.DATABASE_URL);

export async function getIdeas(includeDeleted = 0) {
  const ideas = await sql`
    SELECT * FROM ideas 
    WHERE is_deleted = ${includeDeleted} 
    ORDER BY created_at DESC
  `;
  
  return ideas.map(idea => ({
    ...idea,
    tags: idea.tags ? JSON.parse(idea.tags) : []
  }));
}

export async function getIdeaById(id) {
  const ideas = await sql`SELECT * FROM ideas WHERE id = ${id}`;
  const idea = ideas[0];
  if (idea) {
    idea.tags = idea.tags ? JSON.parse(idea.tags) : [];
  }
  return idea;
}

export async function createIdea({ content, title, category, tags }) {
  const ideas = await sql`
    INSERT INTO ideas (content, title, category, tags, is_deleted)
    VALUES (${content}, ${title}, ${category}, ${JSON.stringify(tags || [])}, 0)
    RETURNING *
  `;
  const idea = ideas[0];
  if (idea) {
    idea.tags = idea.tags ? JSON.parse(idea.tags) : [];
  }
  return idea;
}

export async function updateIdea(id, { title, category, tags }) {
  const ideas = await sql`
    UPDATE ideas 
    SET title = ${title}, category = ${category}, tags = ${JSON.stringify(tags || [])}
    WHERE id = ${id}
    RETURNING *
  `;
  const idea = ideas[0];
  if (idea) {
    idea.tags = idea.tags ? JSON.parse(idea.tags) : [];
  }
  return idea;
}

// Soft delete
export async function deleteIdea(id) {
  await sql`UPDATE ideas SET is_deleted = 1 WHERE id = ${id}`;
}

// Restore from trash
export async function restoreIdea(id) {
  const ideas = await sql`UPDATE ideas SET is_deleted = 0 WHERE id = ${id} RETURNING *`;
  const idea = ideas[0];
  if (idea) {
    idea.tags = idea.tags ? JSON.parse(idea.tags) : [];
  }
  return idea;
}

// Permanent delete
export async function permanentlyDeleteIdea(id) {
  await sql`DELETE FROM ideas WHERE id = ${id}`;
}
