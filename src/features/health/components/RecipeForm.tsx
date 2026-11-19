'use client';

import React, { useState } from 'react';
import type { NewRecipe, RecipeLanguage } from '@/types/recipes';
import { TagEditor } from './TagEditor';

interface RecipeFormProps {
  onSubmit: (input: NewRecipe) => Promise<void>;
  onClose: () => void;
  language: RecipeLanguage;
  suggestions: string[];
}

const inputClass =
  'w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary';

export const RecipeForm: React.FC<RecipeFormProps> = ({ onSubmit, onClose, language, suggestions }) => {
  const isEn = language === 'en';
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [minutes, setMinutes] = useState('');
  const [servings, setServings] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [steps, setSteps] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toPositiveInt = (v: string) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(isEn ? 'Title is required.' : 'El título es obligatorio.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        title,
        description,
        language,
        readyInMinutes: toPositiveInt(minutes),
        servings: toPositiveInt(servings),
        ingredients: ingredients.split('\n').map((l) => l.trim()).filter(Boolean),
        steps: steps.split('\n').map((l) => l.trim()).filter(Boolean),
        tags,
      });
      onClose();
    } catch (err) {
      console.error('Error saving recipe:', err);
      setError(isEn ? 'Could not save recipe. Please try again.' : 'No se pudo guardar la receta. Intenta de nuevo.');
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={isEn ? 'New recipe' : 'Nueva receta'}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-foreground">{isEn ? 'New recipe' : 'Nueva receta'}</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-full text-muted-foreground hover:text-foreground" aria-label={isEn ? 'Close' : 'Cerrar'}>
            <span className="material-symbols-outlined block">close</span>
          </button>
        </div>

        <label className="flex flex-col gap-1 text-sm font-bold text-foreground">
          {isEn ? 'Title' : 'Título'}
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} maxLength={150} required />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm font-bold text-foreground">
            {isEn ? 'Minutes' : 'Minutos'}
            <input value={minutes} onChange={(e) => setMinutes(e.target.value)} className={inputClass} inputMode="numeric" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-bold text-foreground">
            {isEn ? 'Servings' : 'Porciones'}
            <input value={servings} onChange={(e) => setServings(e.target.value)} className={inputClass} inputMode="numeric" />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm font-bold text-foreground">
          {isEn ? 'Description (optional)' : 'Descripción (opcional)'}
          <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} maxLength={500} />
        </label>

        <label className="flex flex-col gap-1 text-sm font-bold text-foreground">
          {isEn ? 'Ingredients (one per line)' : 'Ingredientes (uno por línea)'}
          <textarea value={ingredients} onChange={(e) => setIngredients(e.target.value)} className={inputClass} rows={5} />
        </label>

        <label className="flex flex-col gap-1 text-sm font-bold text-foreground">
          {isEn ? 'Instructions (one per line)' : 'Instrucciones (una por línea)'}
          <textarea value={steps} onChange={(e) => setSteps(e.target.value)} className={inputClass} rows={5} />
        </label>

        <div>
          <span className="block text-sm font-bold text-foreground mb-2">{isEn ? 'Tags' : 'Etiquetas'}</span>
          <TagEditor tags={tags} onChange={setTags} suggestions={suggestions} />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl transition-all disabled:opacity-50"
        >
          {saving ? (isEn ? 'Saving...' : 'Guardando...') : (isEn ? 'Save recipe' : 'Guardar receta')}
        </button>
      </form>
    </div>
  );
};
