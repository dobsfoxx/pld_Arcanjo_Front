import React from 'react';
import { FileUpload } from './FileUpload';
import type { Section } from '../types/types';

export const ActiveSectionEditor: React.FC<{
  activeSection: Section;
  itemOptions: readonly string[];
  onUpdateSection: (patch: Partial<Section>) => void;
  canEdit: boolean;
}> = ({ activeSection, itemOptions, onUpdateSection, canEdit }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Item avaliado</h2>
          <p className="text-sm text-slate-500">Defina o item, a norma interna e a descrição.</p>
        </div>
        <span className="bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1 rounded-full text-xs font-bold">
          {activeSection.customLabel || activeSection.item}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider">Item Avaliado</label>
          <select
            value={activeSection.item}
            onChange={(e) => onUpdateSection({ item: e.target.value })}
            className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-700"
            disabled={!canEdit}
          >
            {itemOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          {(activeSection.item === 'Outro (1)' || activeSection.item === 'Outro (2)') && (
            <input
              value={activeSection.customLabel}
              onChange={(e) => onUpdateSection({ customLabel: e.target.value })}
              className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-700"
              placeholder="Descreva o item personalizado"
              disabled={!canEdit}
            />
          )}
        </div>

        <div className="space-y-3">
          <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider">Possui Norma Interna?</label>
          <div className="bg-slate-50 rounded-xl p-2 inline-flex items-center border border-slate-200">
            <button
              type="button"
              onClick={() => onUpdateSection({ hasNorma: true })}
              disabled={!canEdit}
              className={`px-4 py-2 rounded-lg text-sm font-bold ${activeSection.hasNorma ? 'bg-white text-emerald-500 shadow-sm border border-emerald-100' : 'text-slate-500'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Sim
            </button>
            <button
              type="button"
              onClick={() =>
                onUpdateSection({
                  hasNorma: false,
                  normaFile: null,
                })
              }
              disabled={!canEdit}
              className={`px-4 py-2 rounded-lg text-sm font-bold ${!activeSection.hasNorma ? 'bg-white text-red-700 shadow-sm border border-red-200' : 'text-slate-500'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Não
            </button>
          </div>

          {activeSection.hasNorma && (
            <div className="space-y-3">
              <FileUpload
                label="Upload da norma"
                file={activeSection.normaFile}
                onFileSelect={(f) => onUpdateSection({ normaFile: f })}
                onRemove={() => onUpdateSection({ normaFile: null })}
                disabled={!canEdit}
              />
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider">Descrição (600)</label>
        <textarea
          maxLength={600}
          value={activeSection.descricao}
          onChange={(e) => onUpdateSection({ descricao: e.target.value })}
          className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-700"
          rows={4}
          placeholder="Descrição da norma interna"
          disabled={!canEdit}
        />
      </div>

      {!canEdit && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
          Somente ADMIN pode editar/salvar.
        </div>
      )}
    </div>
  );
};
