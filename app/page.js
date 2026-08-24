'use client';
import { useState, useEffect, useMemo } from 'react';
import IdeaForm from './components/IdeaForm';
import IdeaCard from './components/IdeaCard';
import { Keyboard, FileText, Trash2, ArrowLeft } from 'lucide-react';

export default function Home() {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterTag, setFilterTag] = useState(null);
  
  // Recycle Bin State
  const [isTrashView, setIsTrashView] = useState(false);
  const [undoToast, setUndoToast] = useState(null); // { id: 123, timeout: null }

  useEffect(() => {
    fetchIdeas(isTrashView);
  }, [isTrashView]);

  const fetchIdeas = async (trash = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ideas?trash=${trash}`);
      const data = await res.json();
      setIdeas(data);
    } catch (error) {
      console.error('Failed to fetch ideas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIdeaAdded = (newIdea) => {
    if (!isTrashView) {
      setIdeas([newIdea, ...ideas]);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/ideas?id=${id}`, { method: 'DELETE' });
      // Remove from UI
      const deletedIdea = ideas.find(i => i.id === id);
      setIdeas(ideas.filter(idea => idea.id !== id));
      
      // Show Undo Toast
      if (undoToast && undoToast.timeout) clearTimeout(undoToast.timeout);
      
      const timeout = setTimeout(() => {
        setUndoToast(null);
      }, 5000); // Hide toast after 5s
      
      setUndoToast({ id, timeout, idea: deletedIdea });
    } catch (error) {
      console.error('Failed to delete idea:', error);
    }
  };

  const handleRestore = async (id) => {
    try {
      await fetch('/api/ideas', { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'restore' }) 
      });
      if (isTrashView) {
        setIdeas(ideas.filter(idea => idea.id !== id));
      } else {
        // If restoring from the undo toast while in normal view
        fetchIdeas(false);
        setUndoToast(null);
      }
    } catch (error) {
      console.error('Failed to restore idea:', error);
    }
  };
  
  const handlePermanentDelete = async (id) => {
    try {
      await fetch(`/api/ideas?id=${id}&permanent=true`, { method: 'DELETE' });
      setIdeas(ideas.filter(idea => idea.id !== id));
    } catch (error) {
      console.error('Failed to permanently delete idea:', error);
    }
  };

  const handleUpdate = (updatedIdea) => {
    setIdeas(ideas.map(idea => idea.id === updatedIdea.id ? updatedIdea : idea));
  };

  // Derive categories and tags
  const categories = useMemo(() => ['All', ...new Set(ideas.map(i => i.category).filter(Boolean))], [ideas]);
  
  const allTags = useMemo(() => {
    const tagsMap = new Map();
    ideas.forEach(idea => {
      (idea.tags || []).forEach(tag => {
        tagsMap.set(tag, (tagsMap.get(tag) || 0) + 1);
      });
    });
    return Array.from(tagsMap.entries()).sort((a, b) => b[1] - a[1]);
  }, [ideas]);

  const filteredIdeas = ideas.filter(idea => {
    const categoryMatch = filterCategory === 'All' || idea.category === filterCategory;
    const tagMatch = !filterTag || (idea.tags && idea.tags.includes(filterTag));
    return categoryMatch && tagMatch;
  });

  return (
    <main className="dashboard-container">
      <header className="top-nav">
        <div className="logo-area">
          <Keyboard className="brand-icon" size={32} />
          <div>
            <h1>Idea Manager</h1>
            <p className="subtitle">The Analog Second Brain</p>
          </div>
        </div>
        <div className="nav-actions">
           {isTrashView ? (
             <button className="retro-btn" onClick={() => setIsTrashView(false)}>
               <ArrowLeft size={16} /> Back to Desk
             </button>
           ) : (
             <button className="retro-btn" onClick={() => setIsTrashView(true)}>
               <Trash2 size={16} /> Recycle Bin
             </button>
           )}
        </div>
      </header>

      {!isTrashView && (
        <section className="input-section">
          <IdeaForm onIdeaAdded={handleIdeaAdded} />
        </section>
      )}

      <section className="dashboard-section">
        <div className="dashboard-header">
          <h2>
            {isTrashView ? 'Recycle Bin (Trash)' : 'Your Papers'}
          </h2>
          {!isTrashView && (
            <div className="filters">
              {categories.map(cat => (
                <button 
                  key={cat} 
                  className={`filter-chip ${filterCategory === cat ? 'active' : ''}`}
                  onClick={() => setFilterCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {!isTrashView && allTags.length > 0 && (
          <div className="tags-tracker">
            <h3 className="section-label">INDEX CARDS (TAGS)</h3>
            <div className="filters tags-list">
              {filterTag && (
                 <button 
                  className="filter-chip active-tag-clear"
                  onClick={() => setFilterTag(null)}
                 >
                   CLEAR: {filterTag}
                 </button>
              )}
              {allTags.map(([tag, count]) => (
                <button 
                  key={tag} 
                  className={`filter-chip tag-chip ${filterTag === tag ? 'active' : ''}`}
                  onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                >
                  {tag} <span className="tag-count">[{count}]</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading-state">Rummaging through files...</div>
        ) : filteredIdeas.length === 0 ? (
          <div className="empty-state">
            <h3>{isTrashView ? 'The bin is empty.' : 'No papers found on the desk.'}</h3>
          </div>
        ) : (
          <div className="ideas-grid">
            {filteredIdeas.map(idea => (
              <IdeaCard 
                key={idea.id} 
                idea={idea} 
                onDelete={handleDelete}
                onUpdate={handleUpdate} 
                isTrashView={isTrashView}
                onRestore={handleRestore}
                onPermanentDelete={handlePermanentDelete}
              />
            ))}
          </div>
        )}
      </section>

      {/* Undo Toast */}
      {undoToast && !isTrashView && (
        <div className="undo-toast">
          <span>Paper thrown in the bin.</span>
          <button className="retro-btn" onClick={() => handleRestore(undoToast.id)}>
            UNDO
          </button>
        </div>
      )}
    </main>
  );
}
