import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
// Ensure GEMINI_API_KEY is set in your environment variables (.env.local)
const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;

if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
}

export async function categorizeIdea(content) {
  if (!genAI) {
      console.warn("GEMINI_API_KEY is missing. Skipping AI categorization.");
      return {
          title: "Untitled Idea",
          category: "Uncategorized",
          tags: []
      };
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
    You are an expert personal knowledge manager. 
    Read the following idea or note, and generate a concise Title, a single broad Category, and up to 5 relevant Tags.
    Return the response ONLY as a JSON object with the following schema, and no other text:
    {
      "title": "A short, descriptive title",
      "category": "A single broad category (e.g., Software Development, Personal, Finance, Writing, Business)",
      "tags": ["tag1", "tag2", "tag3"]
    }

    Idea/Note:
    "${content}"
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    // Clean up the response in case it contains markdown formatting
    const jsonStr = text.replace(/\`\`\`json\n?|\`\`\`/gi, '').trim();
    const parsed = JSON.parse(jsonStr);
    
    return {
        title: parsed.title || "Untitled Idea",
        category: parsed.category || "Uncategorized",
        tags: Array.isArray(parsed.tags) ? parsed.tags : []
    };
  } catch (error) {
    console.error("Error categorizing idea:", error);
    return {
        title: "Untitled Idea",
        category: "Error Categorizing",
        tags: []
    };
  }
}
