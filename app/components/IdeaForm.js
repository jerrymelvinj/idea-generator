'use client';
import { useState } from 'react';

export default function IdeaForm({ onIdeaAdded }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        const newIdea = await res.json();
        onIdeaAdded(newIdea);
        setContent('');
      } else {
        console.error('Failed to save idea');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="idea-form" onSubmit={handleSubmit}>
      <textarea
        className="idea-input"
        placeholder="Type your thoughts here... The AI Typist will organize them."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={loading}
        rows={4}
      />
      <div className="form-footer">
        <span className="ai-hint">* AI Auto-Categorization Active *</span>
        <button type="submit" className="retro-btn" disabled={loading || !content.trim()}>
          {loading ? 'TYPING...' : 'SAVE IDEA'}
        </button>
      </div>
    </form>
  );
}
