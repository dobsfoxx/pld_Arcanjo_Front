import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Menu, ShieldCheck, FolderOpen, Check, Send } from 'lucide-react';
import UserMenu from './UserMenu';

export const BuilderHeader: React.FC<{
  canEdit: boolean;
  reportFormat: 'DOCX' | 'PDF';
  onReportFormatChange: (format: 'DOCX' | 'PDF') => void;
  onGenerateReport: () => void;
  onConcludeReport: () => void;
  onSendForm: () => void;
  onOpenAssignments?: () => void;
  onOpenForms?: () => void;
  saving: boolean;
  concluding: boolean;
  sending: boolean;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  customTitle?: string;
  customSubtitle?: string;
}> = ({
  canEdit,
  reportFormat,
  onReportFormatChange,
  onGenerateReport,
  onConcludeReport,
  onSendForm,
  saving,
  concluding,
  sending,
  mobileMenuOpen,
  onToggleMobileMenu,
  customTitle,
  customSubtitle,
}) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-lg">
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8 max-w-[1920px] mx-auto">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-800 p-2 rounded-lg flex items-center justify-center">
            <ShieldCheck size={22} className="text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-white font-bold hidden sm:block">
              {customTitle || 'Arcanjo PLD'}
            </h1>
            <p className="text-xs text-white hidden sm:block">{customSubtitle || 'Construtor de Formulários'}</p>
          </div>
        </div>

        
        <nav className="flex items-center gap-2" role="navigation" aria-label="Ações principais">
          <button
            type="button"
            onClick={() => navigate('/admin/forms')}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-700 focus:ring-offset-2 focus:ring-offset-slate-900"
            aria-label="Ver todos os formulários salvos"
            title="Formulários"
          >
            <FolderOpen size={16} aria-hidden="true" />
            <span className="hidden lg:inline">Formulários</span>
          </button>

          {canEdit && (
            <>

              <button
                type="button"
                onClick={onGenerateReport}
                disabled={saving || concluding}
                className="hidden lg:flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-700 focus:ring-offset-2 focus:ring-offset-slate-900"
                aria-label="Gerar e baixar relatório"
                title="Gerar relatório"
              >
                <Download size={16} aria-hidden="true" />
                <span>{saving ? 'Gerando...' : 'Gerar'}</span>
              </button>

              {/* Report format selector */}
              <select
                value={reportFormat}
                onChange={(e) => onReportFormatChange(e.target.value as 'DOCX' | 'PDF')}
                disabled={saving || concluding}
                aria-label="Formato do relatório"
                className="h-9 px-3 text-xs font-medium bg-slate-900 border border-slate-700 rounded-lg text-slate-200 hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-700 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 cursor-pointer transition-colors"
              >
                <option value="DOCX">DOCX</option>
                <option value="PDF">PDF</option>
              </select>

              {/* Conclude button */}
              <button
                type="button"
                onClick={onConcludeReport}
                disabled={saving || concluding || sending}
                className="hidden lg:flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-700 focus:ring-offset-2 focus:ring-offset-slate-900"
                aria-label="Concluir e salvar formulário"
                title="Concluir"
              >
                <Check size={16} aria-hidden="true" />
                <span>{concluding ? 'Concluindo...' : 'Concluir'}</span>
              </button>

              {/* Send form button */}
              <button
                type="button"
                onClick={onSendForm}
                disabled={saving || concluding || sending}
                className="hidden lg:flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-700 focus:ring-offset-2 focus:ring-offset-slate-900"
                aria-label="Enviar formulário para resposta"
                title="Enviar"
              >
                <Send size={16} aria-hidden="true" />
                <span>{sending ? 'Enviando...' : 'Enviar'}</span>
              </button>
            </>
          )}

          <UserMenu />

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={onToggleMobileMenu}
            aria-expanded={mobileMenuOpen}
            aria-label="Abrir menu de navegação"
            className="md:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-700 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            <Menu size={24} aria-hidden="true" />
          </button>
        </nav>
      </div>
    </header>
  );
};
