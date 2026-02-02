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
        ${isDesktop ? 'w-80 h-[calc(100vh-72px)] sticky top-[72px]' : 'w-full'}
        overflow-hidden shadow-sm
      `}
      role="navigation"
      aria-label="Navegação de itens avaliados"
    >
      {/* Cabeçalho da sidebar */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 text-white">
            <LayoutDashboard size={18} aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Itens Avaliados</h2>
            <p className="text-xs text-slate-500">{sections.length} {sections.length === 1 ? 'item' : 'itens'}</p>
          </div>
        </div>
      </div>

      {/* Lista de seções */}
      <div className="flex-1 overflow-y-auto p-3">
        <nav className="space-y-1.5" role="list">
          {sections.map((sec, index) => (
            <div key={sec.id} role="listitem" className="group flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => onSelect(sec.id)}
                aria-current={activeId === sec.id ? 'page' : undefined}
                aria-label={`${sec.customLabel || sec.item} - ${sec.questions.length} questões`}
                className={`
                  flex-1 min-w-0 flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200
                  ${activeId === sec.id
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200'
                  }
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                `}
              >
                {/* Número do item */}
                <span
                  className={`
                    flex items-center justify-center w-7 h-7 text-xs font-bold rounded-lg shrink-0
                    ${activeId === sec.id
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 text-slate-600'
                    }
                  `}
                >
                  {index + 1}
                </span>
                
                {/* Nome do item */}
                <span
                  className={`
                    flex-1 text-sm truncate min-w-0
                    ${activeId === sec.id ? 'font-semibold' : 'font-medium'}
                  `}
                >
                  {sec.customLabel || sec.item}
                </span>
                
                {/* Badge de questões */}
                <span
                  className={`
                    shrink-0 px-2 py-0.5 text-xs font-bold rounded-full
                    ${activeId === sec.id
                      ? 'bg-white text-slate-900'
                      : 'bg-slate-200 text-slate-600'
                    }
                  `}
                  aria-hidden="true"
                >
                  {sec.questions.length}
                </span>
              </button>

              {/* Botão de deletar */}
              {canEdit && onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(sec.id)}
                  aria-label={`Apagar item avaliado ${sec.customLabel || sec.item}`}
                  className="shrink-0 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
          
          {sections.length === 0 && (
            <div className="text-center py-8 px-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <LayoutDashboard size={20} className="text-slate-400" />
              </div>
              <p className="text-sm text-slate-500 font-medium">Nenhum item criado</p>
              <p className="text-xs text-slate-400 mt-1">Clique abaixo para adicionar</p>
            </div>
          )}
        </nav>
      </div>

      {/* Botão de adicionar */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <button
          type="button"
          onClick={onAdd}
          disabled={!allowAdd}
          aria-label="Adicionar novo item"
          className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-slate-700 bg-white border-2 border- border-slate-300 rounded-xl hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-300 disabled:hover:text-slate-700 disabled:hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
        >
          <Plus size={18} aria-hidden="true" />
          Adicionar Item
        </button>
      </div>
    </aside>
  );
};
