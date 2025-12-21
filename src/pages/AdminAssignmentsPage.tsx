import { useNavigate } from 'react-router-dom';



export default function AdminAssignmentsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      <header >
      <main className="max-w-4xl mx-auto px-4 py-10 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Área administrativa</h1>
          <p className="text-slate-600 mt-1">
            O fluxo legado de atribuição e revisão foi arquivado nesta versão. Utilize o novo PLD Builder para criar e acompanhar itens.
          </p>
        </div>

        <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-6 flex items-center justify-between">
          <div className="text-slate-700 text-sm max-w-2xl">
            As rotas de administrador permanecem ativas, mas ainda não estão ligadas ao novo builder.
          </div>
          <button onClick={() => navigate('/pld-builder')}>Ir para o Builder</button>
        </div>
      </main>
      </header>
    </div>
  );
}
