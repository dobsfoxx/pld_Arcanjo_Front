import { useMemo, useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, User as UserIcon, CreditCard, LogOut, HelpCircle, ShieldCheck } from 'lucide-react'
import { useAuth } from '../contexts/useAuth'

type Props = {
  className?: string
}

export default function UserMenu({ className }: Props) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const subscriptionActive = (user?.subscriptionStatus || '').toUpperCase() === 'ACTIVE'
  const showUpgrade = !subscriptionActive && user?.role !== 'ADMIN'
  const showAdminHelp = user?.role === 'ADMIN' || user?.role === 'TRIAL_ADMIN'

  const label = useMemo(() => {
    if (!user) return 'Menu'
    const name = (user.name || '').trim()
    if (name) return name
    return user.email
  }, [user])

  const initials = useMemo(() => {
    if (!user) return '?'
    const name = (user.name || '').trim()
    if (name) {
      const parts = name.split(' ').filter(Boolean)
      if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      return name.slice(0, 2).toUpperCase()
    }
    return (user.email?.[0] || '?').toUpperCase()
  }, [user])

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleLogout = () => {
    setOpen(false)
    logout()
    navigate('/login')
  }

  const menuItemClass = "w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-3 transition-colors duration-150"

  return (
    <div className={className || ''} ref={menuRef}>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-2 text-sm font-medium text-white hover:bg-white/20 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-sm">
            {initials}
          </div>
          <span className="hidden sm:inline max-w-[160px] truncate">{label}</span>
          <ChevronDown 
            size={16} 
            aria-hidden="true" 
            className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} 
          />
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg ring-1 ring-black/5 animate-fade-in"
          >
            {/* Cabeçalho do menu */}
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-900 truncate">{label}</p>
              <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email}</p>
            </div>

            <div className="py-1">
              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  setOpen(false)
                  navigate('/profile')
                }}
                className={menuItemClass}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100">
                  <UserIcon size={16} className="text-slate-600" aria-hidden="true" />
                </div>
                <span>Meu Perfil</span>
              </button>

              {showUpgrade && (
                <button
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    navigate('/payment')
                  }}
                  className={menuItemClass}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100">
                    <CreditCard size={16} className="text-emerald-600" aria-hidden="true" />
                  </div>
                  <span>Fazer Upgrade</span>
                </button>
              )}
            </div>

            <div className="border-t border-slate-100">
              <div className="px-4 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Central de Ajuda
                </p>
              </div>

              {showAdminHelp && (
                <button
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    navigate('/help/admin')
                  }}
                  className={menuItemClass}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100">
                    <ShieldCheck size={16} className="text-blue-600" aria-hidden="true" />
                  </div>
                  <span>Ajuda do Admin</span>
                </button>
              )}

              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  setOpen(false)
                  navigate('/help/user')
                }}
                className={menuItemClass}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100">
                  <HelpCircle size={16} className="text-purple-600" aria-hidden="true" />
                </div>
                <span>Ajuda do Usuário</span>
              </button>
            </div>

            <div className="border-t border-slate-100 py-1">
              <button
                role="menuitem"
                type="button"
                onClick={handleLogout}
                className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors duration-150"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-100">
                  <LogOut size={16} className="text-red-600" aria-hidden="true" />
                </div>
                <span className="font-medium">Sair</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
