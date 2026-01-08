import React from 'react';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import type { FormProgress } from '../types/pld';

interface ProgressDashboardProps {
  progress: FormProgress | null;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ progress }) => {
  if (!progress) return null;

  const getProgressColor = (value: number) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 50) return 'bg-yellow-500';
    if (value >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className=" bg-slate-800 border border-slate-700 text-white shadow rounded-2xl p-4 sm:p-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
  
        
        <div className="flex-1">
          
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-white">Progresso do Formulário</h2>
            <span className="text-xl sm:text-2xl font-bold text-primary-700">{progress.progress}%</span>
          
          </div>
          
          <div className="w-full bg-white border border-gray-200 rounded-full h-3 mb-2 overflow-hidden">
            <div
              className={`${getProgressColor(progress.progress)} h-3 rounded-full transition-all duration-500 ease-out`}
              style={{ width: `${progress.progress}%` }}
            />
          </div>
          
          <p className="text-sm text-white">
            {progress.progress < 100 
              ? 'Continue preenchendo o formulário' 
              : 'Formulário completo! Pronto para gerar relatório.'}
          </p>
        </div>

        {/* Estatísticas */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:w-auto">
          <div className="bg-white rounded-lg p-3 sm:p-4 text-center border border-gray-100 shadow-sm">
            <div className="flex items-center justify-center gap-2 mb-1.5 sm:mb-2">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              <span className="text-xl sm:text-2xl font-bold text-gray-900">{progress.totalAnswered}</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-600">Respondidas</p>
          </div>

          <div className="bg-white rounded-lg p-3 sm:p-4 text-center border border-gray-100 shadow-sm">
            <div className="flex items-center justify-center gap-2 mb-1.5 sm:mb-2">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
              <span className="text-xl sm:text-2xl font-bold text-gray-900">
                {progress.totalApplicable - progress.totalAnswered}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-600">Pendentes</p>
          </div>

          <div className="bg-white rounded-lg p-3 sm:p-4 text-center border border-gray-100 shadow-sm">
            <div className="flex items-center justify-center gap-2 mb-1.5 sm:mb-2">
              <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <span className="text-xl sm:text-2xl font-bold text-gray-900">
                {progress.totalQuestions - progress.totalApplicable}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-600">Não Aplicáveis</p>
          </div>
        </div>
      </div>
    </div>
  );
};