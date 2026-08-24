import { getIdeas, createIdea, deleteIdea, updateIdea, restoreIdea, permanentlyDeleteIdea } from '@/lib/db';
import { categorizeIdea } from '@/lib/ai';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const trash = searchParams.get('trash') === 'true' ? 1 : 0;
    
    const ideas = getIdeas(trash);
    return Response.json(ideas);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return Response.json({ error: 'Content is required' }, { status: 400 });
    }

    // Call Gemini API to categorize the idea
    const aiData = await categorizeIdea(content);

    // Save to database
    const newIdea = createIdea({
      content,
      title: aiData.title,
      category: aiData.category,
      tags: aiData.tags
    });

    return Response.json(newIdea, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, category, tags, action } = body;

    if (!id) {
      return Response.json({ error: 'ID is required' }, { status: 400 });
    }

    if (action === 'restore') {
      const restoredIdea = restoreIdea(id);
      return Response.json(restoredIdea);
    }

    const updatedIdea = updateIdea(id, { category, tags });
    return Response.json(updatedIdea);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const permanent = searchParams.get('permanent') === 'true';

    if (!id) {
      return Response.json({ error: 'ID is required' }, { status: 400 });
    }

    if (permanent) {
      permanentlyDeleteIdea(id);
    } else {
      deleteIdea(id);
    }
    
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
