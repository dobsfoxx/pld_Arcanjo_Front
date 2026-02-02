import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { FileUpload } from './FileUpload';
import type { Section } from '../types/types';

export const ActiveSectionEditor: React.FC<{
  activeSection: Section;
  itemOptions: readonly string[];
  onUpdateSection: (patch: Partial<Section>) => void;
  canEdit: boolean;
}> = ({ activeSection, itemOptions, onUpdateSection, canEdit }) => {
  return (
    <section className="bg-white rounded-lg border border-slate-200 shadow-sm" aria-labelledby="section-editor-title">
      
      <div className="p-5 sm:p-6 lg:p-8">
  
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          
          <div>
            <h2 id="section-editor-title" className="text-lg font-bold text-slate-900">Item avaliado</h2>
            <p className="text-sm text-slate-500 mt-1">
              Defina o item, a norma interna e a descrição.
            </p>
          </div>
          
          <span className="px-3 py-1.5 text-sm font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-lg">
            {activeSection.customLabel || activeSection.item}
          </span>
        
        </div>

      
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
      
          <div className="space-y-5">
            <div>
              <label htmlFor="item-select" className="block text-sm font-semibold text-slate-700 mb-2">
                Item Avaliado
              </label>
              <select
                id="item-select"
                value={activeSection.item}
                onChange={(e) => onUpdateSection({ item: e.target.value })}
                disabled={!canEdit}
                className="w-full h-11 px-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 transition-colors"
              >
                {itemOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {(activeSection.item === 'Outro' || activeSection.item === 'Outro (1)' || activeSection.item === 'Outro (2)') && (
              <div>
                <label htmlFor="custom-label" className="block text-sm font-semibold text-slate-700 mb-2">
                  Descrição personalizada
                </label>
                <input
                  id="custom-label"
                  type="text"
                  value={activeSection.customLabel}
                  onChange={(e) => onUpdateSection({ customLabel: e.target.value })}
                  placeholder="Descreva o item personalizado"
                  disabled={!canEdit}
                  maxLength={100}
                  className="w-full h-11 px-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 transition-colors"
                />
                <div className="mt-1 text-xs text-slate-500 text-right" aria-live="polite">
                  {(activeSection.customLabel?.length ?? 0)}/100
                </div>
              </div>
            )}
          </div>


          <div className="space-y-5">
            <fieldset>
              <legend className="block text-sm font-semibold text-slate-700 mb-3">
                Possui Norma Interna?
              </legend>
              <div className="flex gap-3" role="group">
                <button
                  type="button"
                  onClick={() => onUpdateSection({ hasNorma: true })}
                  disabled={!canEdit}
                  aria-pressed={activeSection.hasNorma}
                  className={`
                    flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg border-2 transition-colors
                    ${activeSection.hasNorma
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-600 hover:text-emerald-700'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
                  `}
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSection({
                      hasNorma: false,
                      normaFile: [],
                    })
                  }
                  disabled={!canEdit}
                  aria-pressed={!activeSection.hasNorma}
                  className={`
                    flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg border-2 transition-colors
                    ${!activeSection.hasNorma
                      ? 'bg-red-700 text-white border-red-700'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-red-600 hover:text-red-700'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                  `}
                >
                  Não
                </button>
              </div>
            </fieldset>

            {activeSection.hasNorma && (
              <FileUpload
                label="Upload da norma"
                multiple
                maxFiles={5}
                files={activeSection.normaFile}
                onFilesSelect={(next) => onUpdateSection({ normaFile: next })}
                onRemove={() => onUpdateSection({ normaFile: [] })}
                onRemoveAt={(idx) => {
                  const copy = [...(activeSection.normaFile ?? [])];
                  copy.splice(idx, 1);
                  onUpdateSection({ normaFile: copy });
                }}
                disabled={!canEdit}
              />
            )}
          </div>
        </div>

        
        <div className="mt-6">
          <label htmlFor="section-description" className="block text-sm font-semibold text-slate-700 mb-2">
            Descrição do Item Avaliado
          </label>
          <textarea
            id="section-description"
            value={activeSection.descricao}
            onChange={(e) => onUpdateSection({ descricao: e.target.value })}
            placeholder="Descreva detalhadamente o item avaliado..."
            disabled={!canEdit}
            maxLength={600}
            rows={4}
            className="w-full px-3 py-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 resize-none transition-colors"
          />
          <div className="flex justify-between mt-2">
            <span className="text-xs text-slate-500">A descrição do Item é visível apenas para administradores.</span>
            <span className="text-xs font-medium text-slate-600" aria-live="polite">
              {activeSection.descricao?.length || 0}/600
            </span>
          </div>
        </div>

        
        {!canEdit && (
          <div className="mt-6 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg" role="alert">
            <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Modo somente leitura</p>
              <p className="text-sm text-amber-700 mt-0.5">Somente administradores podem editar este formulário.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
