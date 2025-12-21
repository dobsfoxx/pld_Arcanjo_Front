import React from 'react';
import { LayoutDashboard, Plus } from 'lucide-react';
import type { Section } from '../types/types';

export const SectionSidebar: React.FC<{
  sections: Section[];
  activeId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  canEdit: boolean;
  variant?: 'desktop' | 'mobile';
}> = ({ sections, activeId, onSelect, onAdd, canEdit, variant = 'desktop' }) => {
  const wrapperClass =
    variant === 'desktop'
      ? 'hidden md:block w-72 bg-white border-r border-slate-200 overflow-y-auto h-[calc(100vh-64px)] sticky top-16'
      : 'block w-72 bg-white overflow-y-auto';

  return (
    <aside className={wrapperClass}>
      <div className="p-4">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
          <LayoutDashboard className="w-4 h-4" />
          <span>Itens avaliados</span>
        </div>
        <div className="space-y-2">
          {sections.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => onSelect(sec.id)}
              className={`w-full text-left px-3 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-between hover:scale-110 ${
                activeId === sec.id
                  ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100'
                  : 'text-slate-700   '
              }`}
            >
              <span className="truncate">{sec.customLabel || sec.item}</span>
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-500">
                {sec.questions.length}
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={!canEdit}
          className="mt-6 w-full flex items-center justify-center px-4 py-3 border border-slate-300 rounded-xl text-sm font-medium text-slate-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title={canEdit ? 'Adicionar item' : 'Apenas ADMIN pode editar'}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar item
        </button>
      </div>
    </aside>
  );
};
