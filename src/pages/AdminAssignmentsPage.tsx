import { useNavigate } from 'react-router-dom';
import { ArrowRight, Info } from 'lucide-react';
import AppFooter from '../components/AppFooter';
import AppHeader from '../components/AppHeader';

export default function AdminAssignmentsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AppHeader title="Área Administrativa" subtitle="Acesso e rotas legadas" />

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-10 flex-1">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Área Administrativa
          </h2>
          <p className="text-slate-600">
            O fluxo legado de atribuição e revisão foi arquivado nesta versão. Utilize o novo PLD Builder para criar e acompanhar itens.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3 flex-1">
            <div className="bg-slate-900 text-white p-2 rounded-lg flex items-center justify-center">
              <Info size={20} />
            </div>
            <p className="text-sm text-slate-600 max-w-md">
              As rotas de administrador permanecem ativas, mas ainda não estão ligadas ao novo builder.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/pld-builder')}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Ir para o Builder
            <ArrowRight size={18} />
          </button>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
