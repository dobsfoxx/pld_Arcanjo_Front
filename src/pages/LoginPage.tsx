import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import toast from 'react-hot-toast';
import { Button } from '../components/Button';

const LoginPage: React.FC = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        toast.success('Login realizado com sucesso');
      } else {
        await register(name, email, password);
        toast.success('Cadastro realizado com sucesso');
      }
      navigate('/pld-builder');
    } catch (error) {
      const anyError = error as { response?: { data?: { error?: string } } };
      const message = anyError.response?.data?.error ?? 'Falha ao autenticar';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white shadow-sm border border-slate-200/70 rounded-2xl p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 mb-2">Sistema Arcanjo PLD</h1>
        <p className="text-slate-600 mb-6">
          {mode === 'login'
            ? 'Informe suas credenciais para acessar o formulário.'
            : 'Preencha os dados para criar sua conta.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={mode === 'register'}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <div className="pt-2">
            <Button type="submit" fullWidth disabled={loading}>
              {mode === 'login' ? 'Entrar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
        <div className="mt-4 text-center text-sm text-slate-600 space-y-2">
          <div>
            {mode === 'login' ? (
              <button
                type="button"
                className="text-primary-600 hover:underline"
                onClick={() => setMode('register')}
                disabled={loading}
              >
                Não tem conta? Registre-se
              </button>
            ) : (
              <button
                type="button"
                className="text-primary-600 hover:underline"
                onClick={() => setMode('login')}
                disabled={loading}
              >
                Já tem conta? Fazer login
              </button>
            )}
          </div>
          <div>
            <button
              type="button"
              className="text-slate-600 hover:underline"
              onClick={() => navigate('/forgot-password')}
              disabled={loading}
            >
              Esqueceu sua senha?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
