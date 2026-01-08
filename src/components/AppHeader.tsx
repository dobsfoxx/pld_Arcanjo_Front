import React from 'react'
import { ShieldCheck } from 'lucide-react'
import UserMenu from './UserMenu'

type Props = {
  title: string
  subtitle?: string
  leading?: React.ReactNode
  actions?: React.ReactNode
  showUserMenu?: boolean
}

export default function AppHeader({ title, subtitle, leading, actions, showUserMenu = true }: Props) {
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
          {actions}
          {showUserMenu ? <UserMenu /> : null}
        </div>
      </div>
    </header>
  )
}
