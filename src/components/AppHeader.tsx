import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderOpen, ShieldCheck } from 'lucide-react'
import UserMenu from './UserMenu'
import { useAuth } from '../contexts/useAuth'

type Props = {
  title: string
  subtitle?: string
  leading?: React.ReactNode
  actions?: React.ReactNode
  showUserMenu?: boolean
}

export default function AppHeader({ title, subtitle, leading, actions, showUserMenu = true }: Props) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const formsPath = useMemo(() => {
    if (!user) return '/login'
    const subscriptionActive = (user.subscriptionStatus || '').toUpperCase() === 'ACTIVE'
    const hasBuilderAccess = user.role === 'ADMIN' || user.role === 'TRIAL_ADMIN' || subscriptionActive
    return hasBuilderAccess ? '/admin/forms' : '/my-forms'
  }, [user])

  return (
    <header className="sticky top-0 z-30 bg-slate-900 shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 min-w-0">
          {leading}
          <div className="bg-slate-800 p-2 rounded-lg flex items-center justify-center shrink-0">
            <ShieldCheck size={22} className="text-white" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">{title}</h1>
            {subtitle ? <p className="text-xs text-slate-300 truncate">{subtitle}</p> : null}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <button
              type="button"
              onClick={() => navigate(formsPath)}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Voltar para formulários"
            >
              <FolderOpen size={16} aria-hidden="true" />
              <span className="hidden sm:inline">Formulários</span>
            </button>
          ) : null}
          {actions}
          {showUserMenu ? <UserMenu /> : null}
        </div>
      </div>
    </header>
  )
}
