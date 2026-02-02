import { Link, useLocation } from 'react-router-dom';
import { AlertTriangle, Home, FileText, ArrowLeft } from 'lucide-react';
import AppFooter from '../components/AppFooter';
import AppHeader from '../components/AppHeader';
import { useAuth } from '../contexts/useAuth';

export default function NotFoundPage() {
  const { user } = useAuth();
  const location = useLocation();

  const to = user ? '/' : '/login';
  const label = user ? 'Voltar ao início' : 'Ir para login';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AppHeader
        title="Página não encontrada"
        subtitle={location.pathname}
        showUserMenu={!!user}
      />

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="mx-auto w-full max-w-lg text-center">
          {/* Error Illustration */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-amber-100 border-2 border-amber-200 shadow-medium mb-6">
              <AlertTriangle size={48} className="text-amber-600" />
            </div>
            <div className="inline-block px-4 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-sm font-semibold mb-4">
              Erro 404
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-3">
              Página não encontrada
            </h1>
            <p className="text-base text-slate-600 max-w-sm mx-auto leading-relaxed">
              O endereço pode estar incorreto, ter sido removido ou você pode ter chegado aqui por um link antigo.
            </p>
          </div>

          {/* Suggestions Card */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-soft p-6 mb-8 text-left">
            <p className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs">?</span>
              Sugestões rápidas
            </p>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                <span>Verifique se o link está correto.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                <span>Tente voltar e acessar pelo menu do sistema.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                <span>Se o erro persistir, pode ser uma rota ainda não disponível nesta versão.</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to={to}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 shadow-medium hover:shadow-strong transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            >
              <ArrowLeft size={16} />
              {label}
            </Link>
            <Link
              to="/my-forms"
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-soft transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            >
              <FileText size={16} />
              Meus formulários
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-soft transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            >
              <Home size={16} />
              Ir para home
            </Link>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
