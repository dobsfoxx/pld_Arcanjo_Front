import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { ShieldCheck } from 'lucide-react'
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
        <div className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="inline-flex items-center justify-center rounded-lg bg-slate-900 p-2">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Pagamento</h1>
            <p className="mt-1 text-sm text-slate-600">
              Use esta página para ativar/gerenciar sua licença. O checkout abre o Stripe de forma segura quando configurado.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p>
            <span className="font-semibold text-slate-900">Status:</span>{' '}
            {(entitlements?.subscriptionStatus || user?.subscriptionStatus || 'NONE').toString()}
          </p>
          {trialInfo && (
            <p className="mt-1">
              <span className="font-semibold text-slate-900">Trial expira em:</span> {trialInfo.toLocaleString()}
            </p>
          )}
          {entitlements?.maxBuilderSections != null && entitlements?.maxBuilderQuestions != null && (
            <p className="mt-1">
              <span className="font-semibold text-slate-900">Limites do trial:</span> {entitlements.maxBuilderSections}{' '}
              itens de avaliação / {entitlements.maxBuilderQuestions} questões
            </p>
          )}
        </div>

        <div className="mt-6">
          <Button type="button" fullWidth loading={loading} onClick={startCheckout}>
            Continuar para pagamento
          </Button>
          <div className="mt-3">
            <Button type="button" fullWidth variant="secondary" disabled={loading} onClick={openPortal}>
              Gerenciar assinatura
            </Button>
          </div>
        </div>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}

export default PaymentPage
