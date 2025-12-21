import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../lib/api';
import toast from 'react-hot-toast';
import { Button } from '../components/Button';

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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white shadow-sm border border-slate-200/70 rounded-2xl p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 mb-2">Recuperar senha</h1>
        <p className="text-slate-600 mb-6">
          Informe o e-mail cadastrado para receber um link de redefinição de senha.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="pt-2">
            <Button type="submit" fullWidth disabled={loading}>
              Enviar instruções
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
