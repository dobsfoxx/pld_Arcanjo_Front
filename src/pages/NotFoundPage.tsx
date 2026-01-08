import { Link, useLocation } from 'react-router-dom';
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

      <main className="flex-1 p-6">
        <div className="mx-auto w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Erro 404</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            Não encontramos esta página
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            O endereço pode estar incorreto, ter sido removido ou você pode ter chegado aqui por um link antigo.
          </p>

          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Sugestões rápidas</p>
            <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
              <li>Verifique se o link está correto.</li>
              <li>Tente voltar e acessar pelo menu do sistema.</li>
              <li>Se o erro persistir, pode ser uma rota ainda não disponível nesta versão.</li>
            </ul>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              to={to}
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            >
              {label}
            </Link>
            <Link
              to="/my-forms"
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            >
              Meus formulários
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            >
              Ir para home
            </Link>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
