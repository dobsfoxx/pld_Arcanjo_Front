import { useNavigate } from 'react-router-dom';



export default function UserSubmissionsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200/70 shadow-sm">
      <main className="max-w-4xl mx-auto px-4 py-10 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Envios</h1>
          <p className="text-slate-600 mt-1">
            A visualização de envios do fluxo antigo está arquivada. Em breve você verá aqui o acompanhamento integrado ao novo builder.
          </p>
        </div>

        <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-6 flex items-center justify-between">
          <div className="text-slate-700 text-sm max-w-2xl">
            Por enquanto, continue preenchendo e salvando diretamente no PLD Builder.
          </div>
          <button  onClick={() => navigate('/pld-builder')}>Abrir PLD Builder</button>
        </div>
      </main>
      </header>
    </div>
  );
}
