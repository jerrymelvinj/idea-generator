import { useState } from 'react';
import { Tag, Trash2, FolderOpen, Edit2, Save, X, RotateCcw } from 'lucide-react';

export default function IdeaCard({ idea, onDelete, onUpdate, isTrashView, onRestore, onPermanentDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(idea.title || '');
  const [category, setCategory] = useState(idea.category || '');
  const [tagsInput, setTagsInput] = useState((idea.tags || []).join(', '));
  const [isSaving, setIsSaving] = useState(false);
  const [isCrumpling, setIsCrumpling] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    
    try {
      const res = await fetch('/api/ideas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: idea.id, title, category, tags })
      });
      
      if (res.ok) {
        const updatedIdea = await res.json();
        onUpdate(updatedIdea);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to update idea:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = () => {
    if (isTrashView) {
      onPermanentDelete(idea.id);
    } else {
      setIsCrumpling(true);
      // Wait for animation to finish before calling onDelete
      setTimeout(() => {
        onDelete(idea.id);
      }, 750);
    }
  };

  if (isEditing) {
    return (
      <div className="idea-card fade-in edit-mode">
        <div className="edit-form-group">
          <label>Title</label>
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            className="edit-input"
            style={{ fontWeight: 'bold' }}
          />
        </div>
        <div className="edit-form-group">
          <label>Category</label>
          <input 
            type="text" 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            className="edit-input"
          />
        </div>
        <div className="edit-form-group">
          <label>Tags (comma separated)</label>
          <input 
            type="text" 
            value={tagsInput} 
            onChange={(e) => setTagsInput(e.target.value)}
            className="edit-input"
          />
        </div>
        
        <p className="idea-content" style={{opacity: 0.7, marginTop: '1rem'}}>{idea.content}</p>
        
        <div className="edit-actions">
          <button className="retro-btn" onClick={() => setIsEditing(false)}>
            <X size={16} /> Cancel
          </button>
          <button className="retro-btn" onClick={handleSave} disabled={isSaving}>
            <Save size={16} /> {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`idea-card fade-in ${isCrumpling ? 'crumple-throw' : ''}`}>
      <div className="card-header">
        <div className="category-badge">
          [{idea.category}]
        </div>
        <div className="card-actions">
          {!isTrashView && (
            <button className="icon-btn edit-icon" onClick={() => setIsEditing(true)} title="Edit category and tags">
              <Edit2 size={16} />
            </button>
          )}
          {isTrashView && (
             <button className="icon-btn restore-icon" onClick={() => onRestore(idea.id)} title="Restore">
               <RotateCcw size={16} />
             </button>
          )}
          <button className="icon-btn delete-icon" onClick={handleDeleteClick} title={isTrashView ? "Delete Permanently" : "Move to Trash"}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <h3 className="idea-title">{idea.title}</h3>
      <p className="idea-content">{idea.content}</p>
      
      {idea.tags && idea.tags.length > 0 && (
        <div className="tags-container">
          {idea.tags.map((tag, i) => (
            <span key={i} className="idea-tag">{tag}</span>
          ))}
        </div>
      )}
      <div className="card-footer">
        <span className="date-stamp">{new Date(idea.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
