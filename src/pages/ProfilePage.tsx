import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft } from 'lucide-react'
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AppHeader
        title="Perfil"
        subtitle={user.email}
        actions={
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Voltar"
          >
            <ArrowLeft size={16} />
            <span>Voltar</span>
          </button>
        }
      />

      <main className="flex-1 p-6">
        <div className="mx-auto w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <h2 className="text-sm font-bold text-slate-900">Dados do perfil</h2>
              <p className="mt-1 text-sm text-slate-600">
                Atualize seu nome e acompanhe o status da sua conta.
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Nome do perfil</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500"
                placeholder="Seu nome"
              />
              <p className="mt-2 text-xs text-slate-500">Este nome aparece no menu e em telas administrativas.</p>
            </div>

            <div className="sm:col-span-2">
              <Button type="button" fullWidth loading={saving} onClick={save}>
                Salvar alterações
              </Button>
            </div>

            <div className="sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <p>
                  <span className="font-semibold text-slate-900">Tipo da conta:</span> {accountLabel}
                </p>
                {trialRemaining ? (
                  <p>
                    <span className="font-semibold text-slate-900">Tempo restante do teste:</span> {trialRemaining}
                  </p>
                ) : (
                  <p>
                    <span className="font-semibold text-slate-900">E-mail:</span> {user.email}
                  </p>
                )}
              </div>
            </div>

            {showUpgrade && (
              <div className="sm:col-span-2">
                <Button type="button" fullWidth onClick={() => navigate('/payment')}>
                  Fazer upgrade
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}
