import React from 'react';
import { LayoutDashboard, Plus, Trash2 } from 'lucide-react';
import type { Section } from '../types/types';

export const SectionSidebar: React.FC<{
  sections: Section[];
  activeId: string;
  onSelect: (id: string) => void;
  onDelete?: (id: string) => void;
  onAdd: () => void;
  canEdit: boolean;
  canAdd?: boolean;
  variant?: 'desktop' | 'mobile';
}> = ({ sections, activeId, onSelect, onDelete, onAdd, canEdit, canAdd, variant = 'desktop' }) => {
  const isDesktop = variant === 'desktop';
  const allowAdd = (canAdd ?? canEdit) && canEdit;

  return (
    <aside
      className={`
        ${isDesktop ? 'hidden md:flex' : 'flex'}
        flex-col bg-white border-r border-slate-200
        ${isDesktop ? 'w-72 h-[calc(100vh-64px)] sticky top-16' : 'w-full'}
        overflow-hidden shadow-sm overflow-x-hidden
      `}
      role="navigation"
      aria-label="Navegação de itens avaliados"
    >
      
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2">
          <LayoutDashboard size={18} className="text-slate-700" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Itens avaliados
          </span>
        </div>
      </div>

      
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3">
        <nav className="space-y-1.5" role="list">
          {sections.map((sec) => (
            <div key={sec.id} role="listitem" className="w-full flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => onSelect(sec.id)}
                aria-current={activeId === sec.id ? 'page' : undefined}
                aria-label={`${sec.customLabel || sec.item} - ${sec.questions.length} questões`}
                className={`
                  flex-1 min-w-0 flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-left transition-colors
                  ${activeId === sec.id
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100 border border-transparent'
                  }
                  focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2
                `}
              >
                <span
                  className={`
                    text-sm truncate min-w-0
                    ${activeId === sec.id ? 'font-semibold' : 'font-medium'}
                  `}
                >
                  {sec.customLabel || sec.item}
                </span>
                <span
                  className={`
                    shrink-0 h-6 min-w-6 flex items-center justify-center text-xs font-bold rounded-full
                    ${activeId === sec.id
                      ? 'bg-white text-slate-800'
                      : 'bg-slate-200 text-slate-700'
                    }
                  `}
                  aria-hidden="true"
                >
                  {sec.questions.length}
                </span>
              </button>

              {canEdit && onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(sec.id)}
                  aria-label={`Apagar item avaliado ${sec.customLabel || sec.item}`}
                  className="shrink-0 p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <Trash2 size={18} aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Add button */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <button
          type="button"
          onClick={onAdd}
          disabled={!allowAdd}
          aria-label="Adicionar novo item"
          className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-slate-700 border-2 border-slate-300 rounded-lg hover:border-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-300 disabled:hover:text-slate-700 disabled:hover:bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
        >
          <Plus size={18} aria-hidden="true" />
          Adicionar item
        </button>
      </div>
    </aside>
  );
};
