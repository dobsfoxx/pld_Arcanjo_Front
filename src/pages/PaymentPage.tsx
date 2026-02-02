import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { ShieldCheck, CreditCard, Settings, Clock, Zap, CheckCircle2 } from 'lucide-react'
import { billingApi } from '../lib/api'
import { getToastErrorMessage } from '../lib/errors'
import { Button } from '../components/Button'
import AppFooter from '../components/AppFooter'
import AppHeader from '../components/AppHeader'
import { useAuth } from '../contexts/useAuth'

type Entitlements = {
  hasBuilderAccess?: boolean
  maxBuilderSections?: number | null
  maxBuilderQuestions?: number | null
  trialExpiresAt?: string | null
  subscriptionStatus?: string
}

const PaymentPage: React.FC = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null)

  const trialInfo = useMemo(() => {
    const exp = entitlements?.trialExpiresAt || (user?.trialExpiresAt ?? null)
    if (!exp) return null
    const dt = new Date(exp)
    if (Number.isNaN(dt.getTime())) return null
    return dt
  }, [entitlements?.trialExpiresAt, user?.trialExpiresAt])

  const status = (entitlements?.subscriptionStatus || user?.subscriptionStatus || 'NONE').toString().toUpperCase()
  const isActive = status === 'ACTIVE'

  useEffect(() => {
    const load = async () => {
      try {
        const res = await billingApi.me()
        setEntitlements(res.data.entitlements)
      } catch {
        setEntitlements(null)
      }
    }
    void load()
  }, [])

  const startCheckout = async () => {
    setLoading(true)
    try {
      const res = await billingApi.checkout()
      const url = res.data.url
      if (url) {
        window.location.href = url
        return
      }
      toast.error('Checkout ainda não está configurado')
    } catch (err: unknown) {
      toast.error(getToastErrorMessage(err, 'Checkout ainda não está configurado'))
    } finally {
      setLoading(false)
    }
  }

  const openPortal = async () => {
    setLoading(true)
    try {
      const res = await billingApi.portal()
      const url = res.data.url
      if (url) {
        window.location.href = url
        return
      }
      toast.error('Portal ainda não está configurado')
    } catch (err: unknown) {
      toast.error(getToastErrorMessage(err, 'Portal ainda não está configurado'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AppHeader title="Pagamento" subtitle="Ative ou gerencie sua licença" />

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl">
          {/* Main Card */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-medium overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900 px-8 py-8 text-center relative">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
              <div className="relative">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur border-2 border-white/20 mb-4">
                  <ShieldCheck size={32} className="text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Gerenciar Licença</h1>
                <p className="text-slate-400 text-sm max-w-sm mx-auto">
                  Use esta página para ativar ou gerenciar sua licença. O checkout abre o Stripe de forma segura.
                </p>
              </div>
            </div>

            {/* Status Card */}
            <div className="p-8">
              <div className={`rounded-xl p-5 border-2 ${isActive ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isActive ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                    {isActive ? (
                      <CheckCircle2 size={24} className="text-emerald-600" />
                    ) : (
                      <Clock size={24} className="text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status da assinatura</span>
                    </div>
                    <p className={`text-lg font-bold ${isActive ? 'text-emerald-700' : 'text-slate-700'}`}>
                      {isActive ? 'Ativa' : status === 'NONE' ? 'Sem assinatura' : status}
                    </p>
                    
                    {trialInfo && (
                      <p className="text-sm text-amber-600 mt-2 flex items-center gap-1.5">
                        <Clock size={14} />
                        Trial expira em: {trialInfo.toLocaleString()}
                      </p>
                    )}
                    
                    {entitlements?.maxBuilderSections != null && entitlements?.maxBuilderQuestions != null && (
                      <p className="text-sm text-slate-600 mt-2 flex items-center gap-1.5">
                        <Zap size={14} />
                        Limites: {entitlements.maxBuilderSections} itens / {entitlements.maxBuilderQuestions} questões
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 space-y-3">
                <Button type="button" fullWidth loading={loading} onClick={startCheckout}>
                  <CreditCard size={18} className="mr-2" />
                  Continuar para pagamento
                </Button>
                <Button type="button" fullWidth variant="secondary" disabled={loading} onClick={openPortal}>
                  <Settings size={18} className="mr-2" />
                  Gerenciar assinatura
                </Button>
              </div>

              {/* Info */}
              <div className="mt-6 pt-6 border-t-2 border-slate-100">
                <p className="text-xs text-slate-500 text-center">
                  Pagamentos processados de forma segura via Stripe. Seus dados financeiros não são armazenados em nossos servidores.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}

export default PaymentPage
