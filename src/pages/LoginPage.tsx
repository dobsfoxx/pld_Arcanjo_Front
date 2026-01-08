import React, { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../components/Button';
import AppFooter from '../components/AppFooter';
import { useAuth } from '../contexts/useAuth';
import { getToastErrorMessage } from '../lib/errors';

type Mode = 'login' | 'register';

const LoginPage: React.FC = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [startTrial, setStartTrial] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);

      try {
        let loggedUser;
        if (mode === 'login') {
          loggedUser = await login(email, password);
          toast.success('Login realizado com sucesso!');
        } else {
          loggedUser = await register(name, email, password, { startTrial });
          toast.success('Cadastro realizado com sucesso!');
        }

        if (loggedUser?.role === 'ADMIN' || loggedUser?.role === 'TRIAL_ADMIN') {
          navigate('/pld-builder');
        } else {
          navigate('/my-forms');
        }
      } catch (err) {
        const message = getToastErrorMessage(err, 'Falha ao autenticar');
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [mode, email, password, name, startTrial, login, register, navigate]
  );

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
    setError(null);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
    

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 bg-slate-50">
        <div className="hidden lg:flex flex-col justify-center p-10 bg-slate-900 text-white">
        <div className="max-w-md">
          <div className="inline-flex items-center justify-center rounded-lg bg-slate-800 p-2">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Sistema Arcanjo PLD</h1>
          <p className="mt-2 text-sm text-slate-200">
            Criação e gestão de formulários para prevenção à lavagem de dinheiro.
          </p>
        </div>
        </div>

        <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-center">
            <div className="mx-auto inline-flex items-center justify-center rounded-lg bg-slate-900 p-2">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">
              {mode === 'login' ? 'Entrar' : 'Criar conta'}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {mode === 'login'
                ? 'Informe suas credenciais para acessar o sistema.'
                : 'Preencha os dados para criar sua conta.'}
            </p>
          </div>

          {error && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome completo</label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={loading}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:bg-slate-50"
                  />
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <label className="flex items-start gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={startTrial}
                    onChange={(e) => setStartTrial(e.target.checked)}
                    disabled={loading}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300"
                  />
                  <span>
                    <span className="font-semibold text-slate-900">Testar versão completa por 3 dias</span>
                    <span className="block text-xs text-slate-600">
                      Acesso ao builder completo, limitado a 3 itens de avaliação e 3 questões.
                    </span>
                  </span>
                </label>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:bg-slate-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={8}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:bg-slate-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-500 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">Mínimo de 8 caracteres.</p>
            </div>

            <Button type="submit" fullWidth loading={loading}>
              {mode === 'login' ? 'Entrar' : 'Cadastrar'}
            </Button>
          </form>

          <div className="mt-5 border-t border-slate-200 pt-5 text-center text-sm text-slate-600">
            {mode === 'login' ? (
              <>
                Não tem conta?{' '}
                <button type="button" onClick={toggleMode} className="font-semibold text-slate-900 hover:underline">
                  Registre-se
                </button>
              </>
            ) : (
              <>
                Já tem conta?{' '}
                <button type="button" onClick={toggleMode} className="font-semibold text-slate-900 hover:underline">
                  Fazer login
                </button>
              </>
            )}

            {mode === 'login' && (
              <div className="mt-2">
                <Link to="/forgot-password" className="text-sm font-medium text-slate-700 hover:text-slate-900 hover:underline">
                  Esqueceu sua senha?
                </Link>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

      <AppFooter />
    </div>
  );
};

export default LoginPage;
