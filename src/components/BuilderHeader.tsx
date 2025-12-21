import React from 'react';
import { Download, LogOutIcon, Menu, ShieldCheck } from 'lucide-react';
import { Button } from './Button';

export const BuilderHeader: React.FC<{
  canEdit: boolean;
  reportFormat: 'DOCX' | 'PDF';
  onReportFormatChange: (format: 'DOCX' | 'PDF') => void;
  onGenerateReport: () => void;
  onConcludeReport: () => void;
  onLogout: () => void;
  saving: boolean;
  concluding: boolean;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}> = ({
  canEdit,
  reportFormat,
  onReportFormatChange,
  onGenerateReport,
  onConcludeReport,
  onLogout,
  saving,
  concluding,
  mobileMenuOpen,
  onToggleMobileMenu,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-900 p-1.5 rounded-lg">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Arcanjo PLD</h1>
        </div>
        
        <div className="flex items-center gap-3">
          {canEdit && (
            <div className="flex items-center gap-2 justify-end  ">
              <select
                value={reportFormat}
                onChange={(e) => onReportFormatChange(e.target.value as 'DOCX' | 'PDF')}
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white sm:px-4 sm:py-2.5"
                title="Formato do relatório"
                disabled={saving || concluding}
              >
                <option value="DOCX">DOCX</option>
                <option value="PDF">PDF</option>
              </select>

              <Button
                type="button"
                onClick={onGenerateReport}
                disabled={saving || concluding}
                variant="secondary"
                leftIcon={<Download className="h-4 w-4" />}
                title="Gera e abre o relatório"
              >
                {saving ? 'Gerando...' : 'Gerar relatório'}
              </Button>

              <Button
                type="button"
                onClick={onConcludeReport}
                disabled={saving || concluding}
                variant="success"
                title="Limpa o builder para iniciar um novo relatório"
              >
                {concluding ? 'Concluindo...' : 'Concluir relatório'}
              </Button>
            </div>
          )}

          <Button
            type="button"
            onClick={onLogout}
            variant="outline"
            title="Sair"
            className="px-3 sm:px-4"
            leftIcon={<LogOutIcon className="h-4 w-4" />}
          >
            <span className="hidden sm:inline">Sair</span>
          </Button>

          <button
            type="button"
            onClick={onToggleMobileMenu}
            aria-expanded={mobileMenuOpen}
            className="md:hidden p-2 text-slate-600"
            title="Menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  );
};
