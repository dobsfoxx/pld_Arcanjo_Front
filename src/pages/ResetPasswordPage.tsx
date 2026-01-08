import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../lib/api';
import toast from 'react-hot-toast';
import { Button } from '../components/Button';
import AppFooter from '../components/AppFooter';
import AppHeader from '../components/AppHeader';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('Token de recuperação inválido. Use o link enviado por e-mail.');
      return;
    }

    if (password.length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não conferem.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({ token, password });
      toast.success('Senha redefinida com sucesso. Faça login com a nova senha.');
      navigate('/login');
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      toast.error('Erro ao redefinir senha. O link pode estar expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AppHeader title="Redefinir senha" subtitle="Defina uma nova senha" showUserMenu={false} />

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-white shadow-sm border border-slate-200/70 rounded-lg p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 mb-2">Redefinir senha</h1>
          <p className="text-slate-600 mb-6">
            Crie uma nova senha para acessar o Sistema Arcanjo PLD.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nova senha</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar nova senha</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <div className="pt-2">
              <Button type="submit" fullWidth disabled={loading}>
                Redefinir senha
              </Button>
            </div>
          </form>
        </div>
      </main>

      <AppFooter />
    </div>
  );
};

export default ResetPasswordPage;
