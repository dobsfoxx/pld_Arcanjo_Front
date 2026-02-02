import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, User, Mail, Crown, Clock, Sparkles } from 'lucide-react'
import { Button } from '../components/Button'
import AppHeader from '../components/AppHeader'
import AppFooter from '../components/AppFooter'
import { useAuth } from '../contexts/useAuth'
import { authApi } from '../lib/api'
import { getToastErrorMessage } from '../lib/errors'

function formatRemaining(ms: number) {
  if (ms <= 0) return 'expirado'
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}min`
  return `${minutes}min`
}

export default function ProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState<string>(() => (user?.name || '').toString())
  const [saving, setSaving] = useState(false)

  const subscriptionActive = (user?.subscriptionStatus || '').toUpperCase() === 'ACTIVE'

  const accountLabel = useMemo(() => {
    if (!user) return '—'
    if (user.role === 'ADMIN') return 'Administrador'
    if (subscriptionActive) return 'Licença ativa'
    if (user.role === 'TRIAL_ADMIN') return 'Teste (3 dias)'
    return 'Usuário'
  }, [user, subscriptionActive])

  const accountColor = useMemo(() => {
    if (!user) return 'bg-slate-100 text-slate-700 border-slate-200'
    if (user.role === 'ADMIN') return 'bg-purple-100 text-purple-700 border-purple-200'
    if (subscriptionActive) return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    if (user.role === 'TRIAL_ADMIN') return 'bg-amber-100 text-amber-700 border-amber-200'
    return 'bg-slate-100 text-slate-700 border-slate-200'
  }, [user, subscriptionActive])

  const trialRemaining = useMemo(() => {
    if (!user) return null
    if (user.role !== 'TRIAL_ADMIN') return null
    const exp = user.trialExpiresAt
    if (!exp) return null
    const dt = new Date(exp)
    if (Number.isNaN(dt.getTime())) return null
    return formatRemaining(dt.getTime() - Date.now())
  }, [user])

  const showUpgrade = user?.role !== 'ADMIN' && !subscriptionActive

  const save = async () => {
    const nextName = name.trim()
    if (nextName.length < 2) {
      toast.error('O nome deve ter pelo menos 2 caracteres')
      return
    }
    if (nextName.length > 80) {
      toast.error('O nome deve ter no máximo 80 caracteres')
      return
    }

    setSaving(true)
    try {
      await authApi.updateMe({ name: nextName })
      toast.success('Perfil atualizado')
      // força recarregar sessão para refletir nome no menu
      window.location.reload()
    } catch (err: unknown) {
      toast.error(getToastErrorMessage(err, 'Erro ao salvar perfil'))
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return null
  }

  const initials = user.name
    ? user.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : user.email?.slice(0, 2).toUpperCase() || '??'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AppHeader
        title="Perfil"
        subtitle={user.email}
        actions={
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all duration-200"
            title="Voltar"
          >
            <ArrowLeft size={16} />
            <span>Voltar</span>
          </button>
        }
      />

      <main className="flex-1 p-6">
        <div className="mx-auto w-full max-w-2xl">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-medium overflow-hidden">
            {/* Header with Avatar */}
            <div className="bg-slate-900 px-8 py-10 text-center relative">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-white/10 backdrop-blur border-2 border-white/20 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-3xl font-bold text-white">{initials}</span>
                </div>
                <h2 className="text-xl font-bold text-white mb-1">{user.name || 'Usuário'}</h2>
                <p className="text-slate-400 text-sm">{user.email}</p>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold mt-3 border ${accountColor}`}>
                  <Crown size={12} />
                  {accountLabel}
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="p-8">
              <div className="space-y-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                    <User size={16} className="text-slate-400" />
                    Nome do perfil
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all duration-200"
                    placeholder="Seu nome"
                  />
                  <p className="mt-2 text-xs text-slate-500">Este nome aparece no menu e em telas administrativas.</p>
                </div>

                <Button type="button" fullWidth loading={saving} onClick={save}>
                  Salvar alterações
                </Button>
              </div>

              {/* Account Info */}
              <div className="mt-8 pt-6 border-t-2 border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Sparkles size={16} className="text-slate-400" />
                  Informações da conta
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      <Crown size={12} />
                      Tipo da conta
                    </div>
                    <p className="text-sm font-bold text-slate-900">{accountLabel}</p>
                  </div>
                  
                  {trialRemaining ? (
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                      <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">
                        <Clock size={12} />
                        Tempo restante
                      </div>
                      <p className="text-sm font-bold text-amber-700">{trialRemaining}</p>
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        <Mail size={12} />
                        E-mail
                      </div>
                      <p className="text-sm font-bold text-slate-900 truncate">{user.email}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Upgrade CTA */}
              {showUpgrade && (
                <div className="mt-6 bg-blue-50 rounded-xl p-5 border border-blue-200">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <Sparkles size={20} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-900 mb-1">Aproveite todos os recursos</h4>
                      <p className="text-xs text-slate-600 mb-3">Faça upgrade para desbloquear funcionalidades avançadas.</p>
                      <Button type="button" size="sm" onClick={() => navigate('/payment')}>
                        Fazer upgrade
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}
