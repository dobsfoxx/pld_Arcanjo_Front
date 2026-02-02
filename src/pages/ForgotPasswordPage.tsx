import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send } from 'lucide-react';
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
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white shadow-medium border-2 border-slate-200 rounded-2xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 border-2 border-blue-200 mb-4">
                <Mail size={28} className="text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Recuperar senha</h1>
              <p className="text-slate-600">
                Informe o e-mail cadastrado para receber um link de redefinição de senha.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">E-mail</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail size={18} className="text-slate-400" />
                  </div>
                  <input
                    type="email"
                    className="w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all duration-200"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button type="submit" fullWidth loading={loading}>
                <Send size={18} className="mr-2" />
                Enviar instruções
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-6 pt-6 border-t-2 border-slate-100 text-center">
              <Link 
                to="/login" 
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft size={16} />
                Voltar para login
              </Link>
            </div>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
};

export default ForgotPasswordPage;
