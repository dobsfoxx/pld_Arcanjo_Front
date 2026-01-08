import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../lib/api';
import toast from 'react-hot-toast';
import { Button } from '../components/Button';
import AppFooter from '../components/AppFooter';
import AppHeader from '../components/AppHeader';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      toast.success('Se existir uma conta com este e-mail, enviaremos as instruções.');
      navigate('/login');
    } catch (error) {
      console.error('Erro ao solicitar recuperação de senha:', error);
      toast.error('Erro ao solicitar recuperação de senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AppHeader title="Recuperar senha" subtitle="Envio de link por e-mail" showUserMenu={false} />

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-white shadow-sm border border-slate-200/70 rounded-lg p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 mb-2">Recuperar senha</h1>
          <p className="text-slate-600 mb-6">
            Informe o e-mail cadastrado para receber um link de redefinição de senha.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="pt-2">
              <Button type="submit" fullWidth disabled={loading}>
                Enviar instruções
              </Button>
            </div>
          </form>
        </div>
      </main>

      <AppFooter />
    </div>
  );
};

export default ForgotPasswordPage;
