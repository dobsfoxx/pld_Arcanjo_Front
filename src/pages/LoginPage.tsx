import React, { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, User, Sparkles } from 'lucide-react';
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

        if (loggedUser?.role === 'ADMIN') {
          navigate('/admin/forms');
        } else if (loggedUser?.role === 'TRIAL_ADMIN') {
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
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2">
        {/* Painel lateral - visível apenas em desktop */}
        <div className="hidden lg:flex flex-col justify-center items-center p-12 bg-slate-900 text-white relative overflow-hidden">
          {/* Elementos decorativos */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          
          
          
          <div className="relative max-w-md text-center">
            <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 shadow-2xl mb-8">
              <ShieldCheck className="h-12 w-12 text-blue-400" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Sistema Arcanjo PLD
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed">
              Plataforma completa para criação e gestão de formulários de prevenção à lavagem de dinheiro.
            </p>
            
            <div className="mt-12 grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">100%</div>
                <div className="text-sm text-slate-400">Conformidade</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">Relatórios</div>
                <div className="text-sm text-slate-400">Completos</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">SSL</div>
                <div className="text-sm text-slate-400">Seguro</div>
              </div>
            
            </div>
          </div>
        </div>

        {/* Formulário de login */}
        <div className="flex items-center justify-center p-6 sm:p-8">
          <div className="w-full max-w-md">
            {/* Logo mobile */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center justify-center p-3 rounded-xl bg-slate-900 mb-4">
                <ShieldCheck className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">Sistema Arcanjo PLD</h1>
            </div>

            {/* Card do formulário */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-soft">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  {mode === 'login' ? 'Bem-vindo de volta' : 'Criar sua conta'}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {mode === 'login'
                    ? 'Informe suas credenciais para acessar o sistema.'
                    : 'Preencha os dados para criar sua conta.'}
                </p>
              </div>

              {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {mode === 'register' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Nome completo</label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={loading}
                        placeholder="Seu nome"
                        className="h-12 w-full rounded-xl border-2 border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 transition-all duration-200"
                      />
                    </div>
                  </div>
                )}

                {mode === 'register' && (
                  <div className="rounded-xl border-2 border-blue-200 bg-blue-50/50 p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={startTrial}
                        onChange={(e) => setStartTrial(e.target.checked)}
                        disabled={loading}
                        className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="flex-1">
                        <span className="flex items-center gap-2 font-semibold text-slate-900">
                          <Sparkles className="h-4 w-4 text-blue-600" />
                          Testar versão completa por 3 dias
                        </span>
                        <span className="block text-xs text-slate-600 mt-1">
                          Acesso ao builder completo, limitado a 3 itens de avaliação e 3 questões.
                        </span>
                      </span>
                    </label>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">E-mail</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      placeholder="seu@email.com"
                      className="h-12 w-full rounded-xl border-2 border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Senha</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      minLength={8}
                      placeholder="••••••••"
                      className="h-12 w-full rounded-xl border-2 border-slate-200 bg-white pl-12 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Mínimo de 8 caracteres</p>
                </div>

                <Button type="submit" fullWidth loading={loading} size="lg">
                  {mode === 'login' ? 'Entrar' : 'Criar conta'}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-200 text-center">
                <p className="text-sm text-slate-600">
                  {mode === 'login' ? (
                    <>
                      Não tem conta?{' '}
                      <button type="button" onClick={toggleMode} className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                        Registre-se
                      </button>
                    </>
                  ) : (
                    <>
                      Já tem conta?{' '}
                      <button type="button" onClick={toggleMode} className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                        Fazer login
                      </button>
                    </>
                  )}
                </p>

                {mode === 'login' && (
                  <div className="mt-3">
                    <Link to="/forgot-password" className="text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline">
                      Esqueceu sua senha?
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AppFooter />
    </div>
  );
};

export default LoginPage;
