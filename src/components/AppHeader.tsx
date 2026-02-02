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
    <header className="sticky top-0 z-30 bg-slate-900 shadow-lg backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo e título */}
        <div className="flex items-center gap-4 min-w-0">
          {leading}
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 rounded-xl blur-lg" />
            <div className="relative bg-slate-700 p-2.5 rounded-xl border border-slate-600/50 shadow-lg">
              <ShieldCheck size={22} className="text-blue-400" aria-hidden="true" />
            </div>
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-slate-400 truncate mt-0.5 font-medium">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Ações */}
        <nav className="flex items-center gap-2 shrink-0" role="navigation" aria-label="Navegação principal">
          {user && (
            <button
              type="button"
              onClick={() => navigate(formsPath)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 
                hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200
                focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              title="Voltar para formulários"
            >
              <FolderOpen size={18} aria-hidden="true" />
              <span className="hidden sm:inline">Formulários</span>
            </button>
          )}
          {actions}
          {showUserMenu && <UserMenu />}
        </nav>
      </div>
    </header>
  )
}
