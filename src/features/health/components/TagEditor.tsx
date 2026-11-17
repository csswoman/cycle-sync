'use client';

import React, { useState } from 'react';
import { normalizeTag } from '@/services/recipesService';

interface TagEditorProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
}

export const TagEditor: React.FC<TagEditorProps> = ({ tags, onChange, suggestions: suggested = [] }) => {
  const [input, setInput] = useState('');

  const add = (raw: string) => {
    const tag = normalizeTag(raw);
    if (!tag || tags.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      setInput('');
      return;
    }
    onChange([...tags, tag]);
    setInput('');
  };

  const suggestions = suggested.filter((s) => !tags.some((t) => t.toLowerCase() === s.toLowerCase()));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onChange(tags.filter((t) => t !== tag))}
            className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-lg hover:bg-primary/20 transition flex items-center gap-1 font-medium"
            aria-label={`Eliminar etiqueta ${tag}`}
          >
            {tag}
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add(input);
            }
          }}
          maxLength={40}
          className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Añade una etiqueta y presiona Enter..."
        />
        <button
          type="button"
          onClick={() => add(input)}
          className="px-3 py-2 bg-secondary hover:bg-accent rounded-lg border border-border transition-colors"
          aria-label="Añadir etiqueta"
        >
          <span className="material-symbols-outlined text-foreground text-[18px]">add</span>
        </button>
      </div>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="text-xs px-2.5 py-1 rounded-lg border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/50 transition"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
